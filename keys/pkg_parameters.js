"use strict";

// ─────────────────────────────────────────────
// PKG (Private Key Generator)
// ─────────────────────────────────────────────

const PKG = {
  p: 1004162036461488639338597000466705179253226703n,
  q: 950133741151267522116252385927940618264103623n,
  e: 973028207197278907211n
};

// Derived values
PKG.n = PKG.p * PKG.q;
PKG.phi = (PKG.p - 1n) * (PKG.q - 1n);

// modular inverse
function modInverse(e, phi) {
  let [a, b] = [e, phi];
  let [x0, x1] = [1n, 0n];

  while (b !== 0n) {
    const q = a / b;
    [a, b] = [b, a % b];
    [x0, x1] = [x1, x0 - q * x1];
  }
  return ((x0 % phi) + phi) % phi;
}

PKG.d = modInverse(PKG.e, PKG.phi);
