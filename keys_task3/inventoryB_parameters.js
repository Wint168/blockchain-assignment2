"use strict";

// Identity + random
const _B_i = 127n;
const _B_r = 721n;

// (NEW — cryptographic values)
const _B_g = null;  // secret key
const _B_t = null;  
const _B_s = null;  // partial signature

NODES.push({
  name: "B", 
  i: _B_i,
  r: _B_r,

  g: _B_g,
  t: _B_t,
  s: _B_s,
});
