// Ricerca 110 · verifica della prova 3 su dati mai visti (mar 2018 - dic 2021). Regole fissate prima: research/110-codice/REGOLE.md.
// Uso: node verifica-110.js [file operazioni] [inizio] [fine]
"use strict";
const {prova,DAY}=require("./bot.js"),FEE=0.09;
const FILE=process.argv[2]||"./dati/lighter-2018-21.json",A=Date.parse(process.argv[3]||"2018-03-01"),B=Date.parse(process.argv[4]||"2022-01-01");
const J=require(FILE),iB=J.monete.indexOf("BTC"),iE=J.monete.indexOf("ETH"),iS=J.monete.indexOf("SOL");
const OP=J.op.map(([e,d,m,n,f])=>({t:J.t0+e*J.barra,fine:J.t0+(e+d)*J.barra,m,n:n-FEE,f})).filter(o=>[iB,iE,iS].includes(o.m)).sort((a,b)=>a.t-b.t);
const forte=q=>OP.filter(o=>{const w=OP.filter(x=>x.t<o.t&&x.t>=o.t-90*DAY).map(x=>x.f).sort((a,b)=>a-b);return w.length>100&&o.f>w[Math.floor(q*w.length)];}).filter(o=>o.t>=A&&o.t<B);
const st=x=>{const m=x.reduce((a,b)=>a+b,0)/x.length,sd=Math.sqrt(x.reduce((a,b)=>a+(b-m)**2,0)/x.length);return{m,t:m/(sd/Math.sqrt(x.length))};};
const y=o=>new Date(o.t).getUTCFullYear(),mezzo=A+(B-A)/2;
console.log(`Periodo ${new Date(A).toISOString().slice(0,10)} - ${new Date(B).toISOString().slice(0,10)}, fee Hyperliquid ${FEE}% tolte\n`);
console.log("| Segnali | Operazioni | "+[...new Set(OP.filter(o=>o.t>=A&&o.t<B).map(y))].join(" | ")+" | 1ª metà · 2ª metà | t | Senza il 5% migliore |");
for(const q of [0,0.9,0.95]){const S=q?forte(q):OP.filter(o=>o.t>=A&&o.t<B),anni=[...new Set(S.map(y))].sort();const x=S.map(o=>o.n),s=st(x),srt=[...x].sort((a,b)=>a-b);
  const p1=st(S.filter(o=>o.t<mezzo).map(o=>o.n)).m,p2=st(S.filter(o=>o.t>=mezzo).map(o=>o.n)).m,senza=st(srt.slice(0,Math.floor(.95*srt.length))).m;
  console.log(`| ${q?"Più forti del "+q*100+"° percentile":"Tutte"} | ${S.length} | ${anni.map(a=>{const u=S.filter(o=>y(o)===a);return `${st(u.map(o=>o.n)).m.toFixed(2)}% (${u.length})`;}).join(" | ")} | ${p1.toFixed(2)}% · ${p2.toFixed(2)}% | ${s.t.toFixed(1)} | ${senza.toFixed(2)}% |`);
  if(q===0.95)var F=S,C={p1,p2,t:s.t,senza};}
const z=prova(A,B),occ=z.tutte.map(x=>[x.opened,x.closed||B]),gH=new Map();let prev=1000;for(const[t,v]of z.curve){gH.set(Math.floor(t/DAY),v/prev-1);prev=v;}
function giro(f){const gl=new Map();for(const o of F){const d=Math.floor(o.fine/DAY);gl.set(d,(gl.get(d)||0)+f*o.n/100);}
  let v=1,pk=1,dd=0;for(let d=Math.floor(A/DAY);d<Math.floor(B/DAY);d++){v*=(1+(gH.get(d)||0))*(1+(gl.get(d)||0));pk=Math.max(pk,v);dd=Math.max(dd,1-v/pk);}
  const c=(Math.pow(v,365.25*DAY/(B-A))-1)*100;return{c,dd:dd*100,r:c/dd/100};}
const anni=(B-A)/365.25/DAY,g0=giro(0),g1=giro(0.35);
console.log(`\n| Bot | Op/anno | %/anno | Discesa | Rapporto |\n|---|---|---|---|---|\n| HyperStrategy da sola | ${(z.H.length/anni).toFixed(0)} | ${g0.c.toFixed(0)}% | ${g0.dd.toFixed(0)}% | ${g0.r.toFixed(2)} |\n| + segnali Lighter forti, quota 0,35 | ${((z.H.length+F.length)/anni).toFixed(0)} | ${g1.c.toFixed(0)}% | ${g1.dd.toFixed(0)}% | ${g1.r.toFixed(2)} |`);
const reg=[["1. netto > 0 nelle due metà",C.p1>0&&C.p2>0],["2. t ≥ 2",C.t>=2],["3. senza il 5% migliore > 0",C.senza>0],["4. rapporto non peggiore e discesa ≤ 30%",g1.r>=g0.r&&g1.dd<=30]];
console.log("\nRegole: "+reg.map(([n,ok])=>`${n}: ${ok?"SÌ":"NO"}`).join(" · ")+`\nESITO: ${reg.every(r=>r[1])?"PASSA":"NON PASSA"}`);
