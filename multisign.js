"use strict";

/*
========================================================
MULTI-SIGNATURE MODULE — TASK 2
========================================================

Flow:
[1] Query record by itemId
[2] Load identities (A, B, C)
[3] PKG key generation
[4] Secret key generation for each signer
[5] Random r values
[6] Compute t values
[7] Compute H(t,m)
[8] Compute partial signatures
[9] Aggregate signature
[10] Verification
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

// ─────────────────────────────────────────────
// HASH FUNCTION (simple SHA-256 wrapper expected from crypto.js)
// ─────────────────────────────────────────────

async function hashMessage(t, m) {
  const input = t.toString() + m;

  const buffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input)
  );

  // HEX
  const hashHex = Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  // DECIMAL (REAL BigInt)
  const hashDecimal = BigInt("0x" + hashHex);

  return { input, hashHex, hashDecimal };
}

// ─────────────────────────────────────────────
// IDENTITIES (GIVEN)
// ─────────────────────────────────────────────

const IDENTITY = {
  A: { i: 126n, r: 621n },
  B: { i: 127n, r: 721n },
  C: { i: 128n, r: 821n },
  D: { i: 129n, r: 921n }
};

// ─────────────────────────────────────────────
// PKG PARAMETERS (FROM YOUR TASK)
// ─────────────────────────────────────────────

const PKG = {
  p: 1004162036461488639338597000466705179253226703n,
  q: 950133741151267522116252385927940618264103623n,
  e: 973028207197278907211n
};

// derived
const n = PKG.p * PKG.q;
const phi = (PKG.p - 1n) * (PKG.q - 1n);

function modInverse(e, phi) {
  let [a, b] = [e, phi];
  let [x0, x1] = [1n, 0n];

  while (b !== 0n) {
    const q = a / b;
    [a, b] = [b, a % b];
    [x0, x1] = [x1, x0 - q * x1];
  }

  if (a !== 1n) {
    throw new Error("e and φ(n) are not coprime");
  }

  return mod(x0, phi);
}

const d = modInverse(PKG.e, phi);

// ─────────────────────────────────────────────
// QUERY RECORD
// ─────────────────────────────────────────────

async function queryRecord(itemId) {
  const all = await loadAllRecords();

  for (const node of ["A", "B", "C", "D"]) {
    const record = all[node]?.find(r => r.itemId === itemId);
    if (record) return record;
  }

  throw new Error("Item not found");
}

// ─────────────────────────────────────────────
// MAIN MULTI-SIGNATURE FLOW
// ─────────────────────────────────────────────

async function runMultiSignature(itemId) {

  msClear();
  msTitle("[1] QUERY PHASE");

  const record = await queryRecord(itemId);
  const m = record.itemId + record.quantity + record.unitPrice + record.nodeId;

  msLog("Record found:");
  msLog(JSON.stringify(record, null, 2));

  // ─────────────────────────────
  // [2] IDENTITY SET
  // ─────────────────────────────
  msTitle("[2] IDENTITY SET");

  msLog(`Identity of A: i1 = ${IDENTITY.A.i}`);
  msLog(`Identity of B: i2 = ${IDENTITY.B.i}`);
  msLog(`Identity of C: i3 = ${IDENTITY.C.i}`);
  msLog(`Identity of D: i4 = ${IDENTITY.D.i}`);

  // ─────────────────────────────
  // [3] PKG KEY GENERATION
  // ─────────────────────────────
  msTitle("[3] PKG KEY GENERATION");

  msLog(`p = ${PKG.p}`);
  msLog(`q = ${PKG.q}`);
  msLog(`n = p × q = ${n}`);
  msLog(`φ(n) = (p - 1)(q - 1) = ${phi}`);
  msLog(`e = ${PKG.e}`);
  msLog(`d = e⁻¹ mod φ(n) = ${d}`);

  // ─────────────────────────────
  // [4] SECRET KEY GENERATION
  // ─────────────────────────────
  msTitle("[4] SECRET KEY GENERATION");

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
  msLog(`g3 = i4^d mod n = ${g4}`);
  // ─────────────────────────────
  // [5] COMPUTE t VALUES
  // ─────────────────────────────
  msTitle("[5] t COMPUTATION");

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

msTitle("[6] HASH COMPUTATION");

msLog("Hash input:");
msLog(`H(t, m) = ${t.toString() + m}`);

const result = await hashMessage(t, m);

// show HEX (debug)
msLog(`Hash (hex) = ${result.hashHex}`);

// FINAL VALUE (IMPORTANT)
const H = result.hashDecimal;

msLog(`H(t, m) = ${H.toString()}`);
  // [7] PARTIAL SIGNATURES
  // ─────────────────────────────
  msTitle("[7] SIGNATURES OF EACH SIGNERS");

  const s1 = mod(g1 * modPow(IDENTITY.A.r, H, n), n);
  const s2 = mod(g2 * modPow(IDENTITY.B.r, H, n), n);
  const s3 = mod(g3 * modPow(IDENTITY.C.r, H, n), n);
  const s4 = mod(g4 * modPow(IDENTITY.D.r, H, n), n);

msLog(`s1 = g1 * r1^H mod n = ${s1}`);
msLog(`s2 = g2 * r2^H mod n = ${s2}`);
msLog(`s3 = g3 * r3^H mod n = ${s3}`);
msLog(`s4 = g4 * r4^H mod n = ${s4}`);
  // [8] AGGREGATION
  // ─────────────────────────────
  
msTitle("[8] COMPUTING MULTI-SIGNATURE COMPONENT");

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

  // ─────────────────────────────
  // [9] VERIFICATION
  // ─────────────────────────────
  msTitle("[9] SIGNATURE VERIFICATION");

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

  return signature;
}

// ─────────────────────────────────────────────
// EVENT HOOK (UI BUTTON)
// ─────────────────────────────────────────────

window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("searchBtn").addEventListener("click", async () => {
    const id = document.getElementById("searchItemID").value;
    msClear();
    await runMultiSignature(id);
  });
});
