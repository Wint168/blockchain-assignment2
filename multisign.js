"use strict";

/*
========================================================
MULTI-SIGNATURE MODULE — TASK 3 (FLOW)
========================================================
1 Search  
2 Forward query  
3 Search record  
4 Multi-signature  
5 Send result + public params  
6 Consensus  
7 Encrypt  
8 Send encrypted  
9 Decrypt  
10 Validate
========================================================
*/

// ─────────────────────────────────────────────
// UI LOGGER
// ─────────────────────────────────────────────

function msClear() {
  document.getElementById("multiSignLog").innerHTML = "";
}

function msTitle(text) {
  const box = document.getElementById("multiSignLog");
  const el = document.createElement("div");
  el.className = "log-title";
  el.textContent = text;
  box.appendChild(el);
}

function msLog(text) {
  const box = document.getElementById("multiSignLog");
  const el = document.createElement("div");
  el.className = "log-row";
  el.textContent = text;
  box.appendChild(el);
}

function msFormula(text) {
  const box = document.getElementById("multiSignLog");
  const el = document.createElement("div");
  el.className = "log-formula";
  el.textContent = text;
  box.appendChild(el);
}

// ─────────────────────────────────────────────
// BIG INT HELPERS
// ─────────────────────────────────────────────

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

function mod(n, m) {
  return ((n % m) + m) % m;
}
// PKG
const n = PKG.n;
const d = PKG.d;
const phi  = PKG.phi;

// PO
const n_PO = PO.n;
const d_PO = PO.d;

// Node identities
const IDENTITY = {
  A: NODES.find(n => n.name === "A"),
  B: NODES.find(n => n.name === "B"),
  C: NODES.find(n => n.name === "C"),
  D: NODES.find(n => n.name === "D")
};
// ─────────────────────────────────────────────
// HASH
// ─────────────────────────────────────────────

async function hashMessage(t, m) {
  const input = t.toString() + m;

  const buffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input)
  );

  const hashHex = [...new Uint8Array(buffer)]
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  return {
    hashHex,
    hashDecimal: BigInt("0x" + hashHex)
  };
}



function modInverse(e, phi) {
  let [a, b] = [e, phi];
  let [x0, x1] = [1n, 0n];

  while (b !== 0n) {
    const q = a / b;
    [a, b] = [b, a % b];
    [x0, x1] = [x1, x0 - q * x1];
  }
  return mod(x0, phi);
}


// ─────────────────────────────────────────────
// NODE SEARCH (DISTRIBUTED)
// ─────────────────────────────────────────────

async function searchNode(node, itemId) {
  const all = await loadAllRecords();
  return all[node]?.find(r => r.itemId === itemId) || null;
}

async function distributedSearch(itemId) {
  const result = {};

  for (const node of ["A", "B", "C", "D"]) {
    result[node] = await searchNode(node, itemId);
  }

  return result;
}

// ─────────────────────────────────────────────
// CONSENSUS (PBFT SIMULATION)
// ─────────────────────────────────────────────

function runConsensus(record, signature) {
  const votes = {};
  let accept = 0;

  for (const node of ["A","B","C","D"]) {
    // simulate node verifying signature + record integrity
    const valid =
      record &&
      signature &&
      signature.t &&
      signature.s;

    votes[node] = valid ? "ACCEPT" : "REJECT";
    if (valid) accept++;
  }

  return {
    votes,
    acceptCount: accept,
    threshold: 3,
    approved: accept >= 3
  };
}

// ─────────────────────────────────────────────
// USER QUERY FLOW
// ─────────────────────────────────────────────

async function submitQuery(itemId) {
  msClear();
  msTitle("[1] USER QUERY SUBMISSION");
  msLog(`Query itemId = ${itemId}`);

  return await runMultiSignature(itemId);
}

// ─────────────────────────────────────────────
// MAIN SYSTEM
// ─────────────────────────────────────────────

async function runMultiSignature(itemId) {

  // ────────────────
  // [0.5] FORWARD QUERY
  // ────────────────
  msTitle("[2] FORWARD QUERY");
  const query = {
    itemId,
    timestamp: new Date().toISOString(),
    
  };
  msLog(JSON.stringify(query, null, 2));

  // ────────────────
  // [1] SEARCH
  // ────────────────
  msTitle("[3] DISTRIBUTED SEARCH");

  const searchResults = await distributedSearch(itemId);
  msLog(JSON.stringify(searchResults, null, 2));
  
  const existRecord =
    searchResults.A || searchResults.B || searchResults.C || searchResults.D;

  if (!existRecord) {
    msLog("✗ Item not found");
    return;
  }
  
  
  // pick agreed record
  const record =
    searchResults.A ||
    searchResults.B ||
    searchResults.C ||
    searchResults.D;

  const m =
    record.itemId +
    record.quantity +
    record.unitPrice +
    record.nodeId;
  msTitle("[4] HARN MULTI-SIGNATURE");

  // ─────────────────────────────
  // [2] IDENTITY SET
  // ─────────────────────────────
  msTitle("IDENTITY SET");

  msLog(`Identity of A: i1 = ${IDENTITY.A.i}`);
  msLog(`Identity of B: i2 = ${IDENTITY.B.i}`);
  msLog(`Identity of C: i3 = ${IDENTITY.C.i}`);
  msLog(`Identity of D: i4 = ${IDENTITY.D.i}`);

  // ─────────────────────────────
  // [3] PKG KEY GENERATION
  // ─────────────────────────────
  msTitle("PKG KEY GENERATION");

  msLog(`p = ${PKG.p}`);
  msLog(`q = ${PKG.q}`);
  msLog(`n = p × q = ${n}`);
  msLog(`φ(n) = (p - 1)(q - 1) = ${phi}`);
  msLog(`e = ${PKG.e}`);
  msLog(`d = e⁻¹ mod φ(n) = ${d}`);

  // ─────────────────────────────
  // [4] SECRET KEY GENERATION
  // ─────────────────────────────
  msTitle("SECRET KEY GENERATION");

  const g1 = modPow(IDENTITY.A.i, d, n);
  const g2 = modPow(IDENTITY.B.i, d, n);
  const g3 = modPow(IDENTITY.C.i, d, n);
  const g4 = modPow(IDENTITY.D.i, d, n);
  msLog(`Secret Key of A`);
  msLog(`g1 = i1^d mod n = ${g1}`);
  msLog(`Secret Key of B`);
  msLog(`g2 = i2^d mod n = ${g2}`);
  msLog(`Secret Key of C`);
  msLog(`g3 = i3^d mod n = ${g3}`);
  msLog(`Secret Key of D`);
  msLog(`g4 = i4^d mod n = ${g4}`);
  // ─────────────────────────────
  // [5] COMPUTE t VALUES
  // ─────────────────────────────
  msTitle("t COMPUTATION");

// show chosen random values
msLog(`Signer A selects r1 = ${IDENTITY.A.r}`);
msLog(`Signer B selects r2 = ${IDENTITY.B.r}`);
msLog(`Signer C selects r3 = ${IDENTITY.C.r}`);
msLog(`Signer D selects r4 = ${IDENTITY.D.r}`);

msLog("");

const t1 = modPow(IDENTITY.A.r, PKG.e, n);

msLog("Signer A:");
msLog(`t1 = r1^e mod n = ${t1}`);



msLog("");

const t2 = modPow(IDENTITY.B.r, PKG.e, n);

msLog("Signer B:");
msLog(`t2 = r2^e mod n = ${t2}`);

msLog("");

const t3 = modPow(IDENTITY.C.r, PKG.e, n);

msLog("Signer C:");
msLog(`t3 = r3^e mod n = ${t3}`);

msLog("");

const t4 = modPow(IDENTITY.D.r, PKG.e, n);

msLog("Signer D:");
msLog(`t4 = r4^e mod n = ${t4}`);

msLog("");

// aggregation
msLog("Compute aggregated t:");
msFormula(`t = (t1 × t2 × t3 × t4) mod n`);
const t = mod(t1 * t2 * t3 * t4, n);

msLog(`t = ${t}`);

msTitle("HASH COMPUTATION");

msLog("Hash input:");
msLog(`H(t, m) = ${t.toString() + m}`);

const result = await hashMessage(t, m);

// show HEX (debug)
msLog(`Hash (hex) = ${result.hashHex}`);

// FINAL VALUE 
const H = result.hashDecimal;

msLog(`H(t, m) = ${H.toString()}`);
  // [7] PARTIAL SIGNATURES
  // ─────────────────────────────
  msTitle("SIGNATURES OF EACH SIGNERS");

  const s1 = mod(g1 * modPow(IDENTITY.A.r, H, n), n);
  const s2 = mod(g2 * modPow(IDENTITY.B.r, H, n), n);
  const s3 = mod(g3 * modPow(IDENTITY.C.r, H, n), n);
  const s4 = mod(g4 * modPow(IDENTITY.D.r, H, n), n);

msLog(`s1 = g1 * r1^H(t, m) mod n = ${s1}`);
msLog(`s2 = g2 * r2^H(t, m) mod n = ${s2}`);
msLog(`s3 = g3 * r3^H(t, m) mod n = ${s3}`);
msLog(`s4 = g4 * r4^H(t, m) mod n = ${s4}`);
  // [8] AGGREGATION
  // ─────────────────────────────
  
msTitle("COMPUTING MULTI-SIGNATURE COMPONENT");

msFormula("s = (s1 × s2 × s3 × s4) mod n");

// step-by-step modular multiplication (FIX)
let s = s1;
s = mod(s * s2, n);
s = mod(s * s3, n);
s = mod(s * s4, n);


msLog("");
msLog(`s = ${s}`);

const signature = { t, s };

msLog("");
msLog("Final Signature:");
msLog(`(t, s) = (${t}, ${s})`);
  // ────────────────
  // [9] VERIFICATION
  // ────────────────
  msTitle("VERIFICATION");

  const left = modPow(s, PKG.e, n);

// Step-by-step multiplication under mod
const v1 = mod(IDENTITY.A.i * IDENTITY.B.i, n);
const v2 = mod(v1 * IDENTITY.C.i, n);
const v3 = mod(v2 * IDENTITY.D.i, n);

// exponent part
const v4 = modPow(t, H, n);

// final
const right = mod(v3 * v4, n);

  msLog(`Verification 1 = s^e mod n = ${left}`);
  msLog(`Verification 2 = (i1 * i2 * i3 * i4) * t^(H(t,m)) mod n  = ${right}`);

  if (left === right) {
    msLog("Verification 1 = Verification 2");
    msLog("✓ SIGNATURE VALID");
  } else {
    msLog("Verification 1 ≠ Verification 2");
    msLog("✗ SIGNATURE INVALID");
  }

   msTitle("[5] SEND RESULT + PUBLIC PARAMETERS");
  msLog(JSON.stringify({
  record,
  signature: {
    t: t.toString(),
    s: s.toString()
  },
  PKG: {
    p: PKG.p.toString(),
    q: PKG.q.toString(),
    e: PKG.e.toString()
  }
}, null, 2));
  
msTitle("[6] INITIATE CONSENSUS");

  const consensus = runConsensus(record, signature);

  for (const n of ["A","B","C","D"]) {
    msLog(`Node ${n} → ${consensus.votes[n]}`);
  }

  msLog(`Accepted: ${consensus.acceptCount}/4`);

  if (!consensus.approved) {
    msLog("✗ CONSENSUS FAILED");
    return;
  }

  msLog("✓ CONSENSUS APPROVED");

  // ────────────────
  // [7] ENCRYPTION
  // ────────────────
msTitle("[7] ENCRYPT THE SEARCH RESULT");

const message = JSON.stringify({
  record,
  signature: {
    t: t.toString(),
    s: s.toString()
  }
});

// 1. HASH
const { hashHex, hashDecimal } = await hashMessage(t, message);
msLog(`Message = ${message}`);
msLog(`Applying SHA-256 hash to message: ${hashHex}`);


msLog(`Converting hex hashed value into decimal: ${hashDecimal}`);

// 2. ENCRYPT
const cipher = modPow(hashDecimal, PO.e, n_PO);

msTitle("[8] SEND ENCRYPTED DATA");
msLog(`Encrypted value = ${cipher}`);

 msTitle("[9] DECRYPT");
const decryptedHash = modPow(cipher, d_PO, n_PO);

msLog(`Decrypted value= ${decryptedHash}`);

msTitle("[10] VALIDATE RESULT");
if (decryptedHash === hashDecimal) {
  msLog("decryptedHash = hashDecimal");
  msLog("✓ HASH VERIFIED — message intact");
} else {
  msLog("✗ HASH MISMATCH — tampered");
}
  
}

// ─────────────────────────────────────────────
// BUTTON
// ─────────────────────────────────────────────

window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("searchBtn").addEventListener("click", async () => {
    const id = document.getElementById("searchItemID").value;
    await submitQuery(id);
  });
});
