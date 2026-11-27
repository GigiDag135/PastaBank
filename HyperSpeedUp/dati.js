// Carica le candele 15 min: Binance vecchie (vecchi/) + storia 053 fino al 19 nov + Hyperliquid fino al 22 nov 2026
"use strict";
const fs = require("fs"), path = require("path");
function parse(txt) {
  const m = new Map();
  for (const l of txt.trim().split("\n")) { if (!/^\d/.test(l)) continue; const x = l.split(","); const t = +x[0]; m.set(t, [t, +x[1], +x[2], +x[3], +x[4], +(x[5] || 0)]); }
  return m;
}
function carica(c) {
  const m = new Map();
  for (const f of [path.join(__dirname, "dati", "vecchi", c + ".csv"), path.join(__dirname, "dati", c + ".csv")]) if (fs.existsSync(f)) for (const [t, r] of parse(fs.readFileSync(f, "utf8"))) m.set(t, r);
  const R = [...m.values()].sort((a, b) => a[0] - b[0]), N = R.length;
  const C = { t: new Float64Array(N), o: new Float64Array(N), h: new Float64Array(N), l: new Float64Array(N), c: new Float64Array(N), v: new Float64Array(N) };
  R.forEach((r, i) => { C.t[i] = r[0]; C.o[i] = r[1]; C.h[i] = r[2]; C.l[i] = r[3]; C.c[i] = r[4]; C.v[i] = r[5]; });
  return C;
}
function taglia(C, a, b) { let i = 0; while (i < C.t.length && C.t[i] < a) i++; let j = i; while (j < C.t.length && C.t[j] <= b) j++; const o = {}; for (const k of ["t", "o", "h", "l", "c", "v"]) o[k] = C[k].slice(i, j); return o; }
module.exports = { carica, taglia, DAY: 864e5 };
