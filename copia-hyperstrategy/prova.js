// Confronto: strategia originale contro la copia modificata, sugli stessi periodi. Uso: node prova.js
"use strict";
const {prova}=require("./bot.js");
const PERIODI=[["2018-22","2018-04-01","2023-01-01"],["2023-26","2023-01-01","2026-11-22T17:00:00Z"]];
const MODIFICHE={};   // qui le modifiche alla copia, es. MODIFICHE.opt={...}, MODIFICHE.gate=..., MODIFICHE.mul=...
const f=z=>`${z.cagr.toFixed(1)}%/anno · discesa ${z.mdd.toFixed(1)}% · rapporto ${z.mar.toFixed(2)} · ${z.H.length} op`;
for(const[n,a,b]of PERIODI){const A=Date.parse(a),B=Date.parse(b);
  console.log(n,"originale:",f(prova(A,B)));console.log(n,"copia    :",f(prova(A,B,MODIFICHE)));}
