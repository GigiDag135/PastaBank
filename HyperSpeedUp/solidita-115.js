// 115 · prove 1-3 di solidità. Uso: node prove123.js <cartella HyperSpeedUp>
"use strict";
const HS=process.argv[2],E=require(HS+"/engine.js");let RIT=0;
const mk=E.makeTF;E.makeTF=(C,f)=>{const X=mk(C,f),ex=X.expandSig;return Object.assign({},X,{expandSig:s=>{const o=ex(s);if(!RIT)return o;const r=new Int8Array(o.length);for(let i=RIT;i<o.length;i++)r[i]=o[i-RIT];return r;}});};
const {prova,Core,DAY}=require(HS+"/bot.js");
const A0=Date.parse("2018-04-01"),A1=Date.parse("2023-01-01"),B1=Date.parse("2026-11-22T17:00:00Z");
const S=Core.STRATEGIES,BASE=S.filter(s=>Core.PRESET.strats.includes(s.id));
const conS=f=>BASE.map(s=>f(JSON.parse(JSON.stringify(s)))||s);  // copia delle strategie con un parametro cambiato
const due=(o,rit)=>{RIT=rit||0;const a=prova(A0,A1,o),b=prova(A1,B1,o);RIT=0;return[a,b];};
// ---------- prova 1
console.log("## Prova 1 · Rimescolamento");
RIT=0;const tot=prova(A0,B1,{});const cv=tot.curve;const r=[];for(let i=1;i<cv.length;i++)r.push(cv[i][1]/cv[i-1][1]-1);
let seed=1;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
function sim(giorni){const out={dd:[],sott:[],ret:[]};for(let k=0;k<10000;k++){let v=1,pk=1,dd=0,sott=0,cur=0;let n=0;
  while(n<giorni){const s=Math.floor(rnd()*(r.length-30));for(let j=0;j<30&&n<giorni;j++,n++){v*=1+r[s+j];if(v>pk){pk=v;cur=0;}else{cur++;sott=Math.max(sott,cur);}dd=Math.max(dd,1-v/pk);}}
  out.dd.push(dd*100);out.sott.push(sott);out.ret.push((v-1)*100);}for(const k in out)out[k].sort((a,b)=>a-b);return out;}
const q=(a,p)=>a[Math.min(a.length-1,Math.floor(p*a.length))];
let pk=0,dd=0,sott=0,cur=0;for(const[,v]of cv){if(v>pk){pk=v;cur=0;}else{cur++;sott=Math.max(sott,cur);}dd=Math.max(dd,1-v/pk);}
console.log(`Storia vera apr 2018 - nov 2026: ${tot.cagr.toFixed(0)}%/anno, discesa max ${tot.mdd.toFixed(1)}%, giorni più lunghi senza nuovo massimo ${sott}`);
console.log("| Orizzonte | Discesa max: mediana · 1 su 20 · 1 su 100 | Giorni senza nuovo massimo: mediana · 1 su 20 · 1 su 100 | Rendimento: 1 su 100 · 1 su 20 · mediana | Storie in perdita |\n|---|---|---|---|---|");
for(const[n,g]of[["1 anno",365],["3 anni",1095]]){const s=sim(g);
  console.log(`| ${n} | ${q(s.dd,.5).toFixed(0)}% · ${q(s.dd,.95).toFixed(0)}% · ${q(s.dd,.99).toFixed(0)}% | ${q(s.sott,.5)} · ${q(s.sott,.95)} · ${q(s.sott,.99)} | ${q(s.ret,.01).toFixed(0)}% · ${q(s.ret,.05).toFixed(0)}% · ${q(s.ret,.5).toFixed(0)}% | ${(s.ret.filter(x=>x<0).length/100).toFixed(1)}% |`);}
const op=tot.H.map(x=>x.opened).sort((a,b)=>a-b),g=[];for(let i=1;i<op.length;i++)g.push((op[i]-op[i-1])/DAY);g.sort((a,b)=>a-b);
console.log(`Pause senza aperture (storia vera, ${op.length} aperture): mediana ${q(g,.5).toFixed(1)} g · 1 su 20 ${q(g,.95).toFixed(0)} g · 1 su 100 ${q(g,.99).toFixed(0)} g · più lunga ${g[g.length-1].toFixed(0)} g · pause ≥ 20 g: ${g.filter(x=>x>=20).length}`);
// ---------- prove 2 e 3
const f=z=>`${z.cagr.toFixed(0)}% · ${z.mdd.toFixed(0)}% · ${z.mar.toFixed(2)}`;
const base=due({});
function riga(n,[a,b],lim){const ra=a.mar/base[0].mar,rb=b.mar/base[1].mar,ok=ra>=lim&&rb>=lim&&a.cagr>0&&b.cagr>0;
  console.log(`| ${n} | ${f(a)} (${(ra*100).toFixed(0)}%) | ${f(b)} (${(rb*100).toFixed(0)}%) | ${ok?"sì":"**NO**"} |`);return ok;}
console.log("\n## Prova 2 · Parametri spostati (rendimento/anno · discesa · rapporto; tra parentesi il rapporto in % della base) — tiene se ≥ 70%\n| Variante | A apr 2018-22 | B 2023-nov 2026 | Tiene? |\n|---|---|---|---|");
console.log(`| Base | ${f(base[0])} | ${f(base[1])} | — |`);
const set=(k,v)=>s=>{s.ex[k]=v;return s;},par=(ids,k,v)=>s=>{if(ids.includes(s.id))s.p[k]=v;return s;};
const V2=[["Stop 1,6 ATR",{strats:conS(set("sl",1.6))}],["Stop 2,4 ATR",{strats:conS(set("sl",2.4))}],
 ["Filtro volatilità 40°",{strats:conS(s=>{s.volMax=0.4;return s;})}],["Filtro volatilità 60°",{strats:conS(s=>{s.volMax=0.6;return s;})}],
 ["Keltner periodo 16",{strats:conS(par(["kel1h","kelS"],"n",16))}],["Keltner periodo 24",{strats:conS(par(["kel1h","kelS"],"n",24))}],
 ["Keltner larghezza 1,6",{strats:conS(par(["kel1h","kelS"],"k",1.6))}],["Keltner larghezza 2,4",{strats:conS(par(["kel1h","kelS"],"k",2.4))}],
 ["Momentum periodo 10",{strats:conS(par(["mom1h"],"n",10))}],["Momentum periodo 14",{strats:conS(par(["mom1h"],"n",14))}],
 ["Momentum soglia 2,4",{strats:conS(par(["mom1h"],"th",2.4))}],["Momentum soglia 3,6",{strats:conS(par(["mom1h"],"th",3.6))}],
 ["Squeeze periodo 24",{strats:conS(par(["sq4h"],"n",24))}],["Squeeze periodo 36",{strats:conS(par(["sq4h"],"n",36))}],
 ["Classifica giorni ×0,8 (2,6,11)",{opt:{rs:{lbs:[2,6,11],top:1}}}],["Classifica giorni ×1,2 (4,8,17)",{opt:{rs:{lbs:[4,8,17],top:1}}}],
 ["PiramidBoost scatto 0,8 R",{opt:{pyr:Object.assign({},Core.PYR,{trig:0.8})}}],["PiramidBoost scatto 1,2 R",{opt:{pyr:Object.assign({},Core.PYR,{trig:1.2})}}]];
let fr=[];for(const[n,o]of V2)if(!riga(n,due(o),0.7))fr.push(n);
console.log(`Esito prova 2: ${fr.length?"FRAGILE su: "+fr.join(", "):"SOLIDO (tutte tengono)"}`);
console.log("\n## Prova 3 · Costi peggiori e ritardi (tiene se in guadagno e rapporto ≥ 50% della base)\n| Variante | A apr 2018-22 | B 2023-nov 2026 | Tiene? |\n|---|---|---|---|");
const D=Core.DEFAULTS,V3=[["Commissioni ×2",{opt:{fee:D.fee*2,feeIn:D.feeIn*2}},0],["Commissioni ×3",{opt:{fee:D.fee*3,feeIn:D.feeIn*3}},0],["Slittamento ×5",{opt:{slip:D.slip*5}},0],
 ["Funding ×3",{opt:{funding:D.funding*3}},0],["Ritardo 1 candela (15 min)",{},1],["Ritardo 2 candele (30 min)",{},2],
 ["Tutto insieme (comm. ×2, slitt. ×3, funding ×2, ritardo 1)",{opt:{fee:D.fee*2,feeIn:D.feeIn*2,slip:D.slip*3,funding:D.funding*2}},1]];
let k3=true;for(const[n,o,rit]of V3){const ok=riga(n,due(o,rit),0.5);if(n.startsWith("Tutto"))k3=ok;}
console.log(`Esito prova 3: ${k3?"SOLIDO":"NON SOLIDO"} (conta il «tutto insieme»)`);
