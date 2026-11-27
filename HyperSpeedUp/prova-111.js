// 111 · bot di HyperSpeedUp (stessa logica di bot.js) su Bitfinex 2014 - mar 2018, regole in REGOLE.md
"use strict";
const HS=process.argv[2]||__dirname,Core=require(HS+"/core.js"),E=require(HS+"/engine.js"),fs=require("fs"),DAY=864e5;
const carica=c=>{const R=fs.readFileSync(`${process.env.DATI111||"dati111"}/${c}.csv`,"utf8").trim().split("\n").map(l=>l.split(",").map(Number)),F={};["t","o","h","l","c","v"].forEach((k,j)=>F[k]=Float64Array.from(R,x=>x[j]));return F;};
const taglia=(C,a,b)=>{let i=0;while(i<C.t.length&&C.t[i]<a)i++;let j=i;while(j<C.t.length&&C.t[j]<=b)j++;const o={};for(const k of["t","o","h","l","c","v"])o[k]=C[k].slice(i,j);return o;};
const TUTTE=["BTC","LTC","ETH","XRP"],RIB={ema:50,look:30,er:0.25,longMul:0.5};
const FULL=Object.fromEntries(TUTTE.map(c=>[c,carica(c)])),Dd=Object.fromEntries(TUTTE.map(c=>[c,E.resample(FULL[c],96).C]));
const emB=E.ema(Dd.BTC.c,RIB.ema),ribOn=new Set();
for(let j=51;j<Dd.BTC.t.length;j++){let p=0;for(let k=j-RIB.look+1;k<=j;k++)p+=Math.abs(Dd.BTC.c[k]-Dd.BTC.c[k-1]);const er=p>0?Math.abs(Dd.BTC.c[j]-Dd.BTC.c[j-RIB.look])/p:0;if(Dd.BTC.c[j]<emB[j]&&er>RIB.er)ribOn.add(Math.floor(Dd.BTC.t[j]/DAY));}
const giu=t=>ribOn.has(Math.floor(t/DAY)-1);
const BASE=Core.STRATEGIES.filter(s=>Core.PRESET.strats.includes(s.id)),kelS=BASE.find(s=>s.id==="kelS");
function prova(from,to,o){o=o||{};
  // le monete entrano quando hanno 200 giorni di storia: si prova a blocchi perché il motore vuole le monete fisse
  const coins=TUTTE.filter(c=>FULL[c].t[0]+200*DAY<from),d={};for(const c of coins)d[c]=taglia(FULL[c],from-400*DAY,to);
  const weak=(c,t)=>Core.rsRanks(Object.fromEntries(coins.map(x=>[x,Dd[x]])),t,Core.RS.lbs)[c]===coins.length-1;
  const strats=BASE.concat([Object.assign({},kelS,{id:"kelSR",smart:false,noRs:true})]);
  const gate=(c,s,t)=>s.id==="kelSR"&&!(giu(t)&&weak(c,t));
  const r=Core.backtestMulti(d,strats,Object.assign({maxPos:4,maxLev:40,rs:{lbs:Core.RS.lbs,top:1},start:1000,fromT:from,pyr:Core.PYR,hyb:true,mtm:true,risk:0.008,riskCap:0.04,gate,coinMul:(c,t,s,dir)=>dir>0&&giu(t)?RIB.longMul:1},o));
  let pk=1000,mdd=0;for(const[,v]of r.curveM){if(v>pk)pk=v;mdd=Math.max(mdd,1-v/pk);}
  const anni=(to-from)/(365.25*DAY),cagr=(Math.pow(Math.max(r.book.balance,1)/1000,1/anni)-1)*100,H=r.book.history.filter(x=>x.by!=="piramide");
  return{cagr,mdd:mdd*100,mar:cagr/(mdd*100),n:H.length/anni,coins:coins.join("+")};}
const P=[["Tutto 2014 - mar 2018","2014-01-01","2018-04-01"],["Metà 1: 2014-15","2014-01-01","2016-01-01"],["Metà 2: 2016 - mar 2018","2016-01-01","2018-04-01"],["Controllo 2017 - mar 2018 (con ETH)","2017-01-01","2018-04-01"]];
const C2={rs:{lbs:Core.RS.lbs,top:2}};
const V=[["Base (classifica 1, rischio 0,8%)",{}],["Classifica 2, rischio 0,8% (confronto)",C2],["Classifica 2, rischio 0,6%",Object.assign({risk:0.006,riskCap:0.03},C2)],["Classifica 2, rischio 0,5%",Object.assign({risk:0.005,riskCap:0.025},C2)]];
const R=V.map(([n,o])=>[n,P.map(([,a,b])=>prova(Date.parse(a),Date.parse(b),o))]),b=R[0][1];
console.log("Monete per periodo:",P.map((p,i)=>p[0]+" "+b[i].coins).join(" · "));
console.log("| Variante | "+P.map(p=>p[0]+" (op/anno · %/anno · discesa · rapporto)").join(" | ")+" | Regole 1·2·3 | Passa? |\n|---|---|---|---|---|---|---|");
for(const[n,z]of R){const r1=z[0].n>b[0].n,r2=z.slice(0,3).every((x,i)=>x.mar>=b[i].mar),r3=z[0].mdd<=b[0].mdd+3,base=n.startsWith("Base");
  console.log(`| ${n} | `+z.map(x=>`${x.n.toFixed(0)} · ${x.cagr.toFixed(0)}% · ${x.mdd.toFixed(0)}% · ${x.mar.toFixed(2)}`).join(" | ")+` | ${base?"—":[r1,r2,r3].map(x=>x?"SÌ":"no").join("·")} | ${base?"—":r1&&r2&&r3?"SÌ":"no"} |`);}
