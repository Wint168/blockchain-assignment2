"use strict";

// ─────────────────────────────────────────────────────────────
// NODE C Cryptographic Parameters
// Source: List of Keys document
// ─────────────────────────────────────────────────────────────

const _C_p = 1014247300991039444864201518275018240361205111n;
const _C_q = 904030450302158058469475048755214591704639633n;
const _C_e = 1158749422015035388438057n;

const _C_i = 128n;
const _C_r = 821n;

// Derive n, φ(n), d and generate key pair pk = (e,n), sk = (d)
const { pk: _C_pk, sk: _C_sk, n: _C_n, phi: _C_phi } = generateKeyPair(_C_p, _C_q, _C_e);

NODES.push({
  name:    "C",
  i: _C_i,
  r: _C_r,
  p:       _C_p,
  q:       _C_q,
  e:       _C_e,
  n:       _C_n,
  phi:     _C_phi,
  pk:      _C_pk,
  sk:      _C_sk,
  records: [],
});