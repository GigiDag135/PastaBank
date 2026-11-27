// HyperSpeedUp · prove del 27 nov (scelte di Gigi): 1 classifica 2 con meno rischio, 2 squeeze 2 ore solo quando HyperStrategy è ferma.
// Regola fissata prima: passa se in ENTRAMBI i periodi il rapporto rendimento/discesa non peggiora (>= 95%) e la discesa resta <= 30%,
// con più operazioni. In più: cosa avrebbe fatto dal 5 al 22 nov 2026 (ultimi dati).
"use strict";
const {prova,Core,DAY}=require("./bot.js");
const P=[["2018-22","2018-04-01","2023-01-01"],["2023-26","2023-01-01","2026-11-22T17:00:00Z"]];
const S=id=>Core.STRATEGIES.find(s=>s.id===id),C2={rs:{lbs:Core.RS.lbs,top:2}};
const sq=S("sq2h"),soloFermo=(c,s,t,dir,B)=>s.id==="sq2h"&&B.positions.some(p=>(p.strat&&p.strat.id||p.strat)!=="sq2h");
const PROVE=[["Originale",{}],
 ["1 · Classifica 2, rischio 0,8% (come oggi)",{opt:C2}],
 ["1 · Classifica 2, rischio 0,6%",{opt:Object.assign({risk:0.006,riskCap:0.03},C2)}],
 ["1 · Classifica 2, rischio 0,5%",{opt:Object.assign({risk:0.005,riskCap:0.025},C2)}],
 ["2 · + squeeze 2 ore solo quando è ferma",{extra:[sq],gate:soloFermo}],
 ["2 · + squeeze 2 ore solo quando è ferma, metà rischio",{extra:[sq],gate:soloFermo,mul:(c,t,s)=>s.id==="sq2h"?0.5:1}],
 ["2 · + squeeze 2 ore solo long, solo quando è ferma",{extra:[Object.assign({},sq,{dir:"long"})],gate:soloFermo}]];
const base={},righe=[],N0=Date.parse("2026-11-05"),N1=Date.parse("2026-11-22T17:00:00Z");
for(const[n,o]of PROVE){const r=[n];let ok=true;
  for(const[p,a,b]of P){const A=Date.parse(a),B=Date.parse(b),z=prova(A,B,o),anni=(B-A)/365.25/DAY;if(!base[p])base[p]=z;const bb=base[p];
    if(n!=="Originale"&&!(z.H.length>bb.H.length&&z.mar>=0.95*bb.mar&&z.mdd<=30))ok=false;
    r.push(`${(z.H.length/anni).toFixed(0)} op · ${z.cagr.toFixed(0)}% · disc. ${z.mdd.toFixed(0)}% · rapp. ${z.mar.toFixed(2)}`);}
  const w=prova(Date.parse("2026-06-01"),N1,o),nov=w.tutte.filter(x=>x.opened>=N0),v0=w.curve.filter(([t])=>t<N0).pop()[1];
  r.push(`${nov.length} op · ${(100*(w.fin/v0-1)).toFixed(1)}%`);
  r.push(n==="Originale"?"—":ok?"SÌ":"no");righe.push("| "+r.join(" | ")+" |");}
console.log("| Prova | 2018-22 (op/anno · %/anno · discesa · rapporto) | 2023-26 | 5-22 nov 2026 | Passa? |\n|---|---|---|---|---|\n"+righe.join("\n"));
