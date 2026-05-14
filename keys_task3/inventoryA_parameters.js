"use strict";

// Identity + random
const _A_i = 126n;
const _A_r = 621n;

// (NEW — cryptographic values)
const _A_g = null;  // secret key
const _A_t = null;  
const _A_s = null;  // partial signature

NODES.push({
  name: "A", 
  i: _A_i,
  r: _A_r,

   // stored values
  g: _A_g,
  t: _A_t,
  s: _A_s,
});
console.log("FULL NODES MEMORY:", NODES);