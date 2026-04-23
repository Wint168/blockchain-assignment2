"use strict";


// MATH UTILITIES 
// ─────────────────────────────────────────────────────────────

function gcd(a, b) {
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
}

function lcm(a, b) {
  return (a / gcd(a, b)) * b;
}

function extGcd(a, b) {
  if (b === 0n) return { g: a, x: 1n, y: 0n };
  const { g, x, y } = extGcd(b, a % b);
  return { g, x: y, y: x - (a / b) * y };
}

function modInverse(a, m) {
  const norm = ((a % m) + m) % m;
  const { g, x } = extGcd(norm, m);
  if (g !== 1n) throw new Error("No modular inverse exists");
  return ((x % m) + m) % m;
}

function modPow(base, exp, mod) {
  let result = 1n;
  base = base % mod;
  while (exp > 0n) {
    if (exp % 2n === 1n) result = (result * base) % mod;
    exp >>= 1n;
    base = (base * base) % mod;
  }
  return result;
}

async function sha256(data) {
  const encoded = new TextEncoder().encode(data);
  const buffer  = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// Initialising cryptographic parameters
// ─────────────────────────────────────────────────────────────

const NODES = [
  {
    name: "A",
    p: 1210613765735147311106936311866593978079938707n,
    q: 1247842850282035753615951347964437248190231863n,
    e: 815459040813953176289801n,
  },
  {
    name: "B",
    p: 787435686772982288169641922308628444877260947n,
    q: 1325305233886096053310340418467385397239375379n,
    e: 692450682143089563609787n,
  },
  {
    name: "C",
    p: 1014247300991039444864201518275018240361205111n,
    q: 904030450302158058469475048755214591704639633n,
    e: 1158749422015035388438057n,
  },
  {
    name: "D",
    p: 1287737200891425621338551020762858710281638317n,
    q: 1330909125725073469794953234151525201084537607n,
    e: 33981230465225879849295979n,
  },
];


// Derive any additional key components required
// ─────────────────────────────────────────────────────────────

NODES.forEach(node => {
  node.n       = node.p * node.q;
  node.lambda  = lcm(node.p - 1n, node.q - 1n);
  node.d       = modInverse(node.e, node.lambda);
  node.records = []; // local record store per node
});

// Helper — get a node object by name
function getNode(name) {
  const node = NODES.find(n => n.name === name);
  if (!node) throw new Error(`Node "${name}" not found`);
  return node;
}

// Canonical serialisation — produces an identical string for both
// signing and verifying. Signature field is always excluded.
function canonicalise(record) {
  return JSON.stringify({
    action:    record.action,
    itemId:    record.itemId,
    itemName:  record.itemName,
    nodeId:    record.nodeId,
    quantity:  record.quantity,
    timestamp: record.timestamp,
    unitPrice: record.unitPrice,
  });
}


// SIGNING
// ─────────────────────────────────────────────────────────────

async function signRecord(record) {
  const node      = getNode(record.nodeId);
  const payload   = canonicalise(record);
  const digest    = await sha256(payload);
  const m         = BigInt("0x" + digest);
  const signature = modPow(m, node.d, node.n);

  return {
    ...record,
    digest,
    signature: signature.toString(),
  };
}

// VERIFICATION
// ─────────────────────────────────────────────────────────────

async function verifyRecord(record) {
  const node      = getNode(record.nodeId);
  const s         = BigInt(record.signature);
  const payload   = canonicalise(record);
  const digest    = await sha256(payload);
  const m         = BigInt("0x" + digest);
  const recovered = modPow(s, node.e, node.n);

  return {
    valid:     m === recovered,
    digest,
    recovered: recovered.toString(16).padStart(64, "0"),
  };
}

/*
  Each node other than the sender independently verifies the signed
  record. All results are collected before proceeding to consensus.
  The sender node is excluded.
*/
async function verifyAcrossNodes(record) {
  const results    = [];
  const otherNodes = NODES.filter(n => n.name !== record.nodeId);

  for (const node of otherNodes) {
    const result = await verifyRecord(record);
    results.push({
      verifyingNode: node.name,
      valid:         result.valid,
      digest:        result.digest,
      recovered:     result.recovered,
    });
  }

  return results;
}
