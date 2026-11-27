// HyperSpeedUp · prova 3 (pre-test): operazioni del modello di LighterStrategy (walk-forward 053-054) su BTC ETH SOL, tenendo solo le più forti,
// con le commissioni di Hyperliquid (0,09% andata e ritorno in più; su Lighter ~0). Soglia di forza = percentile dei 90 giorni prima (solo passato).
// Regola fissata prima: passa se il netto medio dopo le fee HL è > 0 in OGNI anno 2023-2026 e t >= 2.
"use strict";
const J=require("./dati/lighter-operazioni.json"),FEE=0.09,DAY=864e5;
const OP=J.op.map(([e,d,m,n,f])=>({t:J.t0+e*J.barra,m,n,f})).filter(o=>o.m<=2).sort((a,b)=>a.t-b.t);
const righe=[];
for(const q of [0,0.5,0.8,0.9,0.95]){const sel=[];
  for(const o of OP){if(q===0){sel.push(o);continue;}const w=OP.filter(x=>x.t<o.t&&x.t>=o.t-90*DAY).map(x=>x.f).sort((a,b)=>a-b);
    if(w.length>100&&o.f>w[Math.floor(q*w.length)])sel.push(o);}
  const r=[q===0?"Tutte":`Più forti del ${Math.round(q*100)}° percentile`,sel.length];let ok=true;
  for(const y of [2022,2023,2024,2025,2026]){const u=sel.filter(o=>new Date(o.t).getUTCFullYear()===y).map(o=>o.n-FEE);const m=u.reduce((a,b)=>a+b,0)/u.length;if(y>=2023&&!(m>0))ok=false;r.push(`${m>=0?"+":""}${m.toFixed(2)}% (${u.length})`);}
  const x=sel.filter(o=>o.t>=Date.parse("2023-01-01")).map(o=>o.n-FEE),m=x.reduce((a,b)=>a+b,0)/x.length,sd=Math.sqrt(x.reduce((a,b)=>a+(b-m)**2,0)/x.length),t=m/(sd/Math.sqrt(x.length));
  if(t<2)ok=false;r.push(t.toFixed(1));r.push(ok?"SÌ":"no");righe.push("| "+r.join(" | ")+" |");}
console.log("| Segnali Lighter su BTC ETH SOL, fee Hyperliquid | Operazioni | 2022 | 2023 | 2024 | 2025 | 2026 | t 2023-26 | Passa? |\n|---|---|---|---|---|---|---|---|---|\n"+righe.join("\n"));
