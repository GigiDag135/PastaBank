// HyperSpeedUp · prova 3b: HyperStrategy + segnali Lighter più forti (sopra il 95° percentile dei 90 giorni prima) su BTC ETH SOL, fee Hyperliquid 0,09%.
// Quota f del capitale per operazione (stop 4%: f 0,2 = rischio 0,8% come HyperStrategy). Mar 2022 - 18 nov 2026 (fine dati Lighter).
"use strict";
const {prova,DAY}=require("./bot.js"),J=require("./dati/lighter-operazioni.json"),FEE=0.09;
const A=Date.parse("2022-03-01"),B=Date.parse("2026-11-18");
const OP=J.op.map(([e,d,m,n,f])=>({t:J.t0+e*J.barra,fine:J.t0+(e+d)*J.barra,m,n,f})).filter(o=>o.m<=2).sort((a,b)=>a.t-b.t);
const FORTI=OP.filter(o=>{const w=OP.filter(x=>x.t<o.t&&x.t>=o.t-90*DAY).map(x=>x.f).sort((a,b)=>a-b);return w.length>100&&o.f>w[Math.floor(.95*w.length)];}).filter(o=>o.t>=A&&o.t<B);
const z=prova(A,B),occ=z.tutte.map(x=>[x.opened,x.closed||B]),libero=t=>!occ.some(([a,b])=>t>=a&&t<b);
const gH=new Map();let prev=1000;for(const[t,v]of z.curve){gH.set(Math.floor(t/DAY),v/prev-1);prev=v;}
function giro(f,ops,a=A,b=B){const gl=new Map();for(const o of ops){const d=Math.floor(o.fine/DAY);gl.set(d,(gl.get(d)||0)+f*(o.n-FEE)/100);}
  let v=1,pk=1,dd=0;for(let d=Math.floor(a/DAY);d<Math.floor(b/DAY);d++){v*=(1+(gH.get(d)||0))*(1+(gl.get(d)||0));pk=Math.max(pk,v);dd=Math.max(dd,1-v/pk);}
  const anni=(b-a)/365.25/DAY,c=(Math.pow(v,1/anni)-1)*100;return{c,dd:dd*100,v};}
const anni=(B-A)/365.25/DAY,N0=Date.parse("2026-11-05");
console.log("| Prova (mar 2022 - 18 nov 2026) | Op/anno | %/anno | Discesa | Rapporto | 5-18 nov 2026 |\n|---|---|---|---|---|---|");
const riga=(n,f,ops)=>{const g=giro(f,ops),nv=giro(f,ops,N0,B),k=ops.filter(o=>o.t>=N0).length;
  console.log(`| ${n} | ${((z.H.length+ops.length)/anni).toFixed(0)} | ${g.c.toFixed(0)}% | ${g.dd.toFixed(0)}% | ${(g.c/g.dd).toFixed(2)} | ${k} op Lighter · ${(100*(nv.v-1)).toFixed(1)}% |`);};
riga("Originale",0,[]);
for(const f of [0.2,0.35,0.5]){riga(`+ Lighter forti sempre, quota ${f}`,f,FORTI);riga(`+ Lighter forti solo quando è ferma, quota ${f}`,f,FORTI.filter(o=>libero(o.t)));}
console.log("Operazioni Lighter forti dal 5 nov:",FORTI.filter(o=>o.t>=N0).map(o=>new Date(o.t).toISOString().slice(5,16)+" "+["BTC","SOL","ETH"][o.m]+" "+(o.n-FEE).toFixed(2)+"%").join("; "));
