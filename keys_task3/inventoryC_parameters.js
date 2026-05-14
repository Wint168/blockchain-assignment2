"use strict";

// Identity + random
const _C_i = 128n;
const _C_r = 821n;

// (NEW — cryptographic values)
const _C_g = null;  // secret key
const _C_t = null;  
const _C_s = null;  // partial signature

NODES.push({
  name: "C", 
  i: _C_i,
  r: _C_r,

  g: _C_g,
  t: _C_t,
  s: _C_s,
});
