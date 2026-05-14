"use strict";

// Identity + random
const _D_i = 129n;
const _D_r = 921n;

// (NEW — cryptographic values)
const _D_g = null;  // secret key
const _D_t = null;  
const _D_s = null;  // partial signature

NODES.push({
  name: "D", 
  i: _D_i,
  r: _D_r,

  g: _D_g,
  t: _D_t,
  s: _D_s,
});
