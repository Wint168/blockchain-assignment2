"use strict";

// ─────────────────────────────────────────────────────────────
// NODE D Cryptographic Parameters
// Source: List of Keys document
// ─────────────────────────────────────────────────────────────

const _D_p = 1287737200891425621338551020762858710281638317n;
const _D_q = 1330909125725073469794953234151525201084537607n;
const _D_e = 33981230465225879849295979n;

const _D_i = 129n;
const _D_r = 921n;

// Derive n, φ(n), d and generate key pair pk = (e,n), sk = (d)
const { pk: _D_pk, sk: _D_sk, n: _D_n, phi: _D_phi } = generateKeyPair(_D_p, _D_q, _D_e);

NODES.push({
  name:    "D",
  i: _D_i,
  r: _D_r,
  p:       _D_p,
  q:       _D_q,
  e:       _D_e,
  n:       _D_n,
  phi:     _D_phi,
  pk:      _D_pk,
  sk:      _D_sk,
  records: [],
});