// HyperSpeedUp · prova piccola: segnali del modello di LighterStrategy (walk-forward 053-054, solo dati passati) su BTC ETH SOL
// usati SOLO quando HyperStrategy non ha posizioni aperte. Periodo mar 2022 - nov 2026. Quota per operazione f del capitale.
"use strict";
const {prova,DAY}=require("./bot.js"),J=require("./dati/lighter-operazioni.json");
const A=Date.parse("2022-03-01"),B=Date.parse("2026-11-18");
const z=prova(A,B),occ=[];for(const x of z.tutte)occ.push([x.opened,x.closed||B]);
const libero=t=>!occ.some(([a,b])=>t>=a&&t<b);
const OP=J.op.map(([e,d,m,n])=>({t:J.t0+e*J.barra,fine:J.t0+(e+d)*J.barra,m,n})).filter(o=>o.m<=2&&o.t>=A&&o.t<B);
const usate=OP.filter(o=>libero(o.t));
const gHyper=new Map();let prev=1000;for(const[t,v]of z.curve){gHyper.set(Math.floor(t/DAY),v/prev-1);prev=v;}
function giro(f,ops){const gl=new Map();for(const o of ops){const d=Math.floor(o.fine/DAY);gl.set(d,(gl.get(d)||0)+f*o.n/100);}
  let v=1,pk=1,dd=0;for(let d=Math.floor(A/DAY);d<Math.floor(B/DAY);d++){v*=(1+(gHyper.get(d)||0))*(1+(gl.get(d)||0));pk=Math.max(pk,v);dd=Math.max(dd,1-v/pk);}
  const anni=(B-A)/365.25/DAY,c=(Math.pow(v,1/anni)-1)*100;return `${c.toFixed(0)}%/anno · discesa ${(dd*100).toFixed(0)}% · rapporto ${(c/dd/100).toFixed(2)}`;}
const anni=(B-A)/365.25/DAY;
console.log(`Lighter su BTC ETH SOL: ${OP.length} operazioni, di cui ${usate.length} quando HyperStrategy è ferma; netto medio ${(usate.reduce((s,o)=>s+o.n,0)/usate.length).toFixed(2)}% (tutte: ${(OP.reduce((s,o)=>s+o.n,0)/OP.length).toFixed(2)}%)`);
console.log("| Prova (mar 2022 - nov 2026) | Operazioni/anno | Risultato | \n|---|---|---|");
console.log(`| Originale | ${(z.H.length/anni).toFixed(0)} | ${giro(0,[])} |`);
for(const f of [0.35,0.7,1])console.log(`| + Lighter nei giorni fermi, quota ${f} | ${((z.H.length+usate.length)/anni).toFixed(0)} | ${giro(f,usate)} |`);
for(const y of [2022,2023,2024,2025,2026]){const u=usate.filter(o=>new Date(o.t).getUTCFullYear()===y);console.log(y,u.length,"op, netto medio",(u.reduce((s,o)=>s+o.n,0)/u.length).toFixed(2)+"%");}
