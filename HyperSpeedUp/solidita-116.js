// 116 · test 1-3. Uso: node prove123.js <cartella HyperSpeedUp>
"use strict";
const HS=process.argv[2],E=require(HS+"/engine.js");let CASO=null;
let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
const mk=E.makeTF;E.makeTF=(C,f)=>{const X=mk(C,f),ex=X.expandSig;return Object.assign({},X,{expandSig:s=>{const o=ex(s);if(!CASO)return o;
  const n=o.length,k=2880+Math.floor(rnd()*(n-5760)),r=new Int8Array(n);for(let i=0;i<n;i++)r[(i+k)%n]=o[i];return r;}});};
const {prova,Core,DAY}=require(HS+"/bot.js");
const q=(a,p)=>{const b=[...a].sort((x,y)=>x-y);return b[Math.min(b.length-1,Math.floor(p*b.length))];};
// ---------- test 1
console.log("## Test 1 · Partire in un mese qualsiasi (12 mesi)");
const R1=[];for(let y=2018,m=4;y<2025||(y===2025&&m<=11);m===12?(y++,m=1):m++){const a=Date.UTC(y,m-1,1),b=Date.UTC(y+1,m-1,1);const z=prova(a,Math.min(b,Date.parse("2026-11-22T17:00:00Z")),{});R1.push({d:`${y}-${String(m).padStart(2,"0")}`,r:100*(z.fin/1000-1),dd:z.mdd,n:z.H.length});}
const rr=R1.map(x=>x.r),pos=rr.filter(x=>x>0).length,peg=R1.reduce((a,b)=>b.r<a.r?b:a);
console.log(`${R1.length} partenze · in guadagno dopo 12 mesi: ${pos} (${(100*pos/R1.length).toFixed(0)}%) · peggiore ${peg.r.toFixed(0)}% (partenza ${peg.d}) · 1 su 10 peggio di ${q(rr,.1).toFixed(0)}% · mediana +${q(rr,.5).toFixed(0)}% · migliore +${Math.max(...rr).toFixed(0)}%`);
console.log(`Discesa nei 12 mesi: mediana ${q(R1.map(x=>x.dd),.5).toFixed(0)}% · 1 su 10 oltre ${q(R1.map(x=>x.dd),.9).toFixed(0)}% · massima ${Math.max(...R1.map(x=>x.dd)).toFixed(0)}%`);
const perAnno={};for(const x of R1){const y=x.d.slice(0,4);(perAnno[y]=perAnno[y]||[]).push(x.r);}
console.log("| Partenza nell'anno | Partenze | In guadagno | Peggiore | Mediana | Migliore |\n|---|---|---|---|---|---|");
for(const[y,v]of Object.entries(perAnno))console.log(`| ${y} | ${v.length} | ${v.filter(x=>x>0).length} | ${Math.min(...v).toFixed(0)}% | ${q(v,.5).toFixed(0)}% | ${Math.max(...v).toFixed(0)}% |`);
console.log("Partenze in perdita: "+(R1.filter(x=>x.r<=0).map(x=>`${x.d} ${x.r.toFixed(0)}%`).join(", ")||"nessuna"));
console.log(`Esito test 1: ${pos/R1.length>=0.8&&peg.r>=-30?"SOLIDO":"NON SOLIDO"}`);
// ---------- test 2
const A0=Date.parse("2018-04-01"),A1=Date.parse("2023-01-01"),B1=Date.parse("2026-11-22T17:00:00Z");
console.log("\n## Test 2 · Entrate a caso (100 prove)");
const vA=prova(A0,A1,{}),vB=prova(A1,B1,{});CASO=1;const cA=[],cB=[];
for(let k=0;k<100;k++){cA.push(prova(A0,A1,{}));cB.push(prova(A1,B1,{}));}CASO=null;
const riga2=(n,v,c)=>{const b=c.filter(x=>v.mar>x.mar).length;console.log(`| ${n} | ${v.cagr.toFixed(0)}% · disc. ${v.mdd.toFixed(0)}% · rapp. ${v.mar.toFixed(2)} | ${q(c.map(x=>x.cagr),.5).toFixed(0)}% · disc. ${q(c.map(x=>x.mdd),.5).toFixed(0)}% · rapp. ${q(c.map(x=>x.mar),.5).toFixed(2)} | ${q(c.map(x=>x.mar),.95).toFixed(2)} · ${Math.max(...c.map(x=>x.mar)).toFixed(2)} | ${c.filter(x=>x.cagr>0).length}/100 | ${b}/100 |`);return b;};
console.log("| Periodo | Bot vero | A caso: mediana | A caso: rapporto 1 su 20 migliore · massimo | A caso in guadagno | Bot vero batte |\n|---|---|---|---|---|---|");
const b2a=riga2("A apr 2018-22",vA,cA),b2b=riga2("B 2023-nov 2026",vB,cB);
console.log(`Esito test 2: ${b2a>=95&&b2b>=95?"le entrate HANNO valore":"le entrate NON battono abbastanza il caso"}`);
// ---------- test 3
console.log("\n## Test 3 · Parametri scelti solo sul passato (81 combinazioni)");
const P0=Date.parse("2018-04-01"),P1=Date.parse("2022-01-01");
const BASE=Core.STRATEGIES.filter(s=>Core.PRESET.strats.includes(s.id));
const G=[];for(const sl of[1.6,2,2.4])for(const vm of[0.4,0.5,0.6])for(const kk of[1.6,2,2.4])for(const rs of[0.8,1,1.2]){
  const strats=BASE.map(s=>{const x=JSON.parse(JSON.stringify(s));x.ex.sl=sl;x.volMax=vm;if(["kel1h","kelS"].includes(x.id))x.p.k=kk;return x;});
  const o={strats,opt:{rs:{lbs:Core.RS.lbs.map(v=>Math.round(v*rs)),top:1}}};G.push({n:`stop ${sl} · vol ${vm*100}° · Keltner ${kk} · classifica ×${rs}`,base:sl===2&&vm===0.5&&kk===2&&rs===1,a:prova(P0,P1,o),b:prova(P1,B1,o)});}
const best=G.reduce((x,y)=>y.a.mar>x.a.mar?y:x),bb=G.find(g=>g.base),posto=(k,g)=>1+G.filter(x=>x[k].mar>g[k].mar).length;
const f3=z=>`${z.cagr.toFixed(0)}% · disc. ${z.mdd.toFixed(0)}% · rapp. ${z.mar.toFixed(2)}`;
console.log("| | 2018-21 (scelta) | 2022-nov 2026 (prova) | Posto su 81: 2018-21 · 2022-26 |\n|---|---|---|---|");
console.log(`| Scelta sul passato: ${best.n} | ${f3(best.a)} | ${f3(best.b)} | ${posto("a",best)} · ${posto("b",best)} |`);
console.log(`| Bot di oggi | ${f3(bb.a)} | ${f3(bb.b)} | ${posto("a",bb)} · ${posto("b",bb)} |`);
console.log(`| Mediana delle 81 | ${q(G.map(g=>g.a.cagr),.5).toFixed(0)}% · rapp. ${q(G.map(g=>g.a.mar),.5).toFixed(2)} | ${q(G.map(g=>g.b.cagr),.5).toFixed(0)}% · disc. ${q(G.map(g=>g.b.mdd),.5).toFixed(0)}% · rapp. ${q(G.map(g=>g.b.mar),.5).toFixed(2)} | |`);
console.log(`| Peggiore delle 81 su 2022-26 | | ${f3(G.reduce((x,y)=>y.b.mar<x.b.mar?y:x).b)} | |`);
console.log(`In guadagno su 2022-26: ${G.filter(g=>g.b.cagr>0).length}/81 · prime 5 su 2018-21 → loro rapporto 2022-26: ${[...G].sort((x,y)=>y.a.mar-x.a.mar).slice(0,5).map(g=>g.b.mar.toFixed(2)).join(", ")}`);
console.log(`Esito test 3: ${best.b.mar>=0.7*bb.b.mar&&best.b.cagr>0?"SOLIDO":"NON SOLIDO"} (scelta ${(100*best.b.mar/bb.b.mar).toFixed(0)}% del bot di oggi su 2022-26)`);
