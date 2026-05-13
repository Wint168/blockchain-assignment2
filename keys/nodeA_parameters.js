"use strict";

// ─────────────────────────────────────────────────────────────
// NODE A Cryptographic Parameters
// Source: List of Keys document
// ─────────────────────────────────────────────────────────────

const _A_p = 1210613765735147311106936311866593978079938707n;
const _A_q = 1247842850282035753615951347964437248190231863n;
const _A_e = 815459040813953176289801n;

// Identity + random
const _A_i = 126n;
const _A_r = 621n;
// Derive n, φ(n), d and generate key pair pk = (e,n), sk = (d)
const { pk: _A_pk, sk: _A_sk, n: _A_n, phi: _A_phi } = generateKeyPair(_A_p, _A_q, _A_e);

NODES.push({
  name:    "A",
  i: _A_i,
  r: _A_r,
  p:       _A_p,
  q:       _A_q,
  e:       _A_e,
  n:       _A_n,
  phi:     _A_phi,
  pk:      _A_pk,
  sk:      _A_sk,
  records: [],
});