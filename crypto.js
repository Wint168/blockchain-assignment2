"use strict";
// ─────────────────────────────────────────────────────────────
// MATH UTILITIES
// ─────────────────────────────────────────────────────────────

function gcd(a, b) {
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
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

// SHA-256 via browser Web Crypto API (hashing only)
async function sha256(data) {
  const encoded = new TextEncoder().encode(data);
  const buffer  = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}


// ─────────────────────────────────────────────────────────────
// Initialise cryptographic parameters
// Parameters are defined in keys/nodeX_parameters.js
// NODES array is populated by those files at load time
// ─────────────────────────────────────────────────────────────

const NODES = [];

function getNode(name) {
  const node = NODES.find(n => n.name === name);
  if (!node) throw new Error(`Node "${name}" not found`);
  return node;
}


// ─────────────────────────────────────────────────────────────
// Derive additional key components
// ─────────────────────────────────────────────────────────────

/*
  generateKeyPair(p, q, e) derives:
    n    = p × q              (RSA modulus)
    φ(n) = (p-1)(q-1)        (Euler's totient)
    d    = e⁻¹ mod φ(n)      (private exponent)
    where d × e ≡ 1 mod φ(n)

  Returns:
    pk = (e, n)  — public key,  shared for verification
    sk = (d)     — private key, used only for signing
*/
function generateKeyPair(p, q, e) {
  const n   = p * q;
  const phi = (p - 1n) * (q - 1n);

  if (gcd(e, phi) !== 1n)
    throw new Error("e is not coprime with φ(n)");

  const d  = modInverse(e, phi);
  const pk = { e, n };
  const sk = { d };

  return { pk, sk, n, phi };
}


// ─────────────────────────────────────────────────────────────
// CANONICAL RECORD SERIALISATION
// ─────────────────────────────────────────────────────────────

// Produces identical bytes for both signing and verifying.
// Signature field always excluded.
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


// ─────────────────────────────────────────────────────────────
// Sign an inventory record
// ─────────────────────────────────────────────────────────────

/*
  Steps:
    1. Serialise record to canonical JSON (no signature field)
    2. SHA-256 digest → BigInt m
    3. s = m^d mod n  (RSA private key operation)
    4. Return record with digest and signature attached
*/
async function signRecord(record) {
  const node      = getNode(record.nodeId);
  const payload   = canonicalise(record);
  const digest    = await sha256(payload);
  const m         = BigInt("0x" + digest);
  const signature = modPow(m, node.sk.d, node.pk.n);

  return {
    ...record,
    digest,
    signature: signature.toString(),
  };
}


// ─────────────────────────────────────────────────────────────
// Verify a signed record
// ─────────────────────────────────────────────────────────────

/*
  Steps:
    1. Serialise record (same canonical form)
    2. SHA-256 digest → BigInt m
    3. m' = s^e mod n  (RSA public key operation)
    4. Valid if m === m'

  Returns: { valid, digest, recovered, m, mRecovered }
*/
async function verifyRecord(record) {
  const node       = getNode(record.nodeId);
  const s          = BigInt(record.signature);
  const payload    = canonicalise(record);
  const digest     = await sha256(payload);
  const m          = BigInt("0x" + digest);
  const mRecovered = modPow(s, node.pk.e, node.pk.n);

  return {
    valid:      m === mRecovered,
    digest,
    recovered:  mRecovered.toString(16).padStart(64, "0"),
    m:          m.toString(),
    mRecovered: mRecovered.toString(),
  };
}

/*
  All nodes except the sender independently verify the record.
  Results are collected before proceeding to consensus.
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
      m:             result.m,
      mRecovered:    result.mRecovered,
    });
  }

  return results;
}