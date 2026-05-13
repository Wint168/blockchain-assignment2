"use strict";

// ─────────────────────────────────────────────
// PROCUREMENT OFFICER (PO)
// ─────────────────────────────────────────────

const PO = {
  p: 1080954735722463992988394149602856332100628417n,
  q: 1158106283320086444890911863299879973542293243n,
  e: 106506253943651610547613n
};

// Derived values
PO.n = PO.p * PO.q;
PO.phi = (PO.p - 1n) * (PO.q - 1n);

// modular inverse
function modInverse_PO(e, phi) {
  let [a, b] = [e, phi];
  let [x0, x1] = [1n, 0n];

  while (b !== 0n) {
    const q = a / b;
    [a, b] = [b, a % b];
    [x0, x1] = [x1, x0 - q * x1];
  }
  return ((x0 % phi) + phi) % phi;
}

PO.d = modInverse_PO(PO.e, PO.phi);
