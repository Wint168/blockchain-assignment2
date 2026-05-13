"use strict";

// ─────────────────────────────────────────────────────────────
// NODE B Cryptographic Parameters
// Source: List of Keys document
// ─────────────────────────────────────────────────────────────

const _B_p = 787435686772982288169641922308628444877260947n;
const _B_q = 1325305233886096053310340418467385397239375379n;
const _B_e = 692450682143089563609787n;

const _B_i = 127n;
const _B_r = 721n;

// Derive n, φ(n), d and generate key pair pk = (e,n), sk = (d)
const { pk: _B_pk, sk: _B_sk, n: _B_n, phi: _B_phi } = generateKeyPair(_B_p, _B_q, _B_e);

NODES.push({
  name:    "B",
  i: _B_i,
  r: _B_r,
  p:       _B_p,
  q:       _B_q,
  e:       _B_e,
  n:       _B_n,
  phi:     _B_phi,
  pk:      _B_pk,
  sk:      _B_sk,
  records: [],
});