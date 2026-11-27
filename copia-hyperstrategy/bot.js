// 077 · bot intero (assetto 7, BTC/ETH/SOL, modalità ribasso) con ganci per le prove. Come 064/correzione.js, SOL entra quando ha 200 giorni di storia.
"use strict";
const Core=require("./core.js"),E=require("./engine.js"),{carica,taglia,DAY}=require("./dati.js");
const COINS=["BTC","ETH","SOL"],RIB={ema:50,look:30,er:0.25,longMul:0.5};
const FULL=Object.fromEntries(COINS.map(c=>[c,carica(c)])),Dd=Object.fromEntries(COINS.map(c=>[c,E.resample(FULL[c],96).C]));
const emB=E.ema(Dd.BTC.c,RIB.ema),ribOn=new Set();
for(let j=51;j<Dd.BTC.t.length;j++){let p=0;for(let k=j-RIB.look+1;k<=j;k++)p+=Math.abs(Dd.BTC.c[k]-Dd.BTC.c[k-1]);const er=p>0?Math.abs(Dd.BTC.c[j]-Dd.BTC.c[j-RIB.look])/p:0;if(Dd.BTC.c[j]<emB[j]&&er>RIB.er)ribOn.add(Math.floor(Dd.BTC.t[j]/DAY));}
const giu=t=>ribOn.has(Math.floor(t/DAY)-1);
const BASE=Core.STRATEGIES.filter(s=>Core.PRESET.strats.includes(s.id)),kelS=BASE.find(s=>s.id==="kelS");
function prova(from,to,o){o=o||{};
  const coins=COINS.filter(c=>FULL[c].t[0]+200*DAY<from),d={};for(const c of coins)d[c]=taglia(FULL[c],from-400*DAY,to);
  const weak=(c,t)=>Core.rsRanks(Object.fromEntries(coins.map(x=>[x,Dd[x]])),t,Core.RS.lbs)[c]===coins.length-1;
  const strats=(o.strats||BASE).concat([Object.assign({},kelS,{id:"kelSR",smart:false,noRs:true})]).concat(o.extra||[]);
  const gate=(c,s,t,dir,B)=>(s.id==="kelSR"&&!(giu(t)&&weak(c,t)))||(o.gate?o.gate(c,s,t,dir,B,{giu,weak}):false);
  const ex=o.extras?Object.fromEntries(coins.map(c=>[c,o.extras(c,d[c])])):undefined;
  const r=Core.backtestMulti(d,strats,Object.assign({maxPos:4,maxLev:40,rs:{lbs:Core.RS.lbs,top:1},start:1000,fromT:from,pyr:Core.PYR,hyb:true,mtm:true,risk:0.008,riskCap:0.04,gate,coinMul:(c,t,s,dir)=>(dir>0&&giu(t)?RIB.longMul:1)*(o.mul?o.mul(c,t,s,dir):1)},o.opt||{}),ex);
  let pk=1000,mdd=0;for(const[,v]of r.curveM){if(v>pk)pk=v;mdd=Math.max(mdd,1-v/pk);}
  const anni=(to-from)/(365.25*DAY),cagr=(Math.pow(Math.max(r.book.balance,1)/1000,1/anni)-1)*100,H=r.book.history.filter(x=>x.by!=="piramide");
  return{fin:r.book.balance,cagr,mdd:mdd*100,mar:cagr/(mdd*100),H,tutte:r.book.history,curve:r.curveM};}
module.exports={prova,FULL,Dd,giu,ribOn,COINS,DAY,Core,E,BASE,taglia};
if(require.main===module){
  const f=z=>`${z.cagr.toFixed(0)}% / ${z.mdd.toFixed(1)}% / ${z.mar.toFixed(2)} (${z.H.length} op)`;
  const FINE=Date.parse("2026-11-24T19:00:00Z");
  for(const[n,a,b]of[["A 2018-22","2018-04-01","2023-01-01"],["B 2023-26 fino al 22 nov","2023-01-01","2026-11-22T17:00:00Z"]])console.log(n,f(prova(Date.parse(a),Date.parse(b))));
  const z=prova(Date.parse("2026-09-01"),FINE);console.log("dal 1 nov:");for(const x of z.tutte.filter(x=>x.opened>=Date.parse("2026-11-01")))console.log(new Date(x.opened).toISOString().slice(0,16),x.coin,x.strat,x.side,x.r.toFixed(2),x.why,x.by||"");
  // pause fra aperture, 2019-2026
  const w=prova(Date.parse("2021-03-01"),FINE),op=w.H.map(x=>x.opened).sort((a,b)=>a-b),g=[];for(let i=1;i<op.length;i++)g.push([(op[i]-op[i-1])/DAY,op[i-1]]);g.push([(FINE-op[op.length-1])/DAY,op[op.length-1]]);
  g.sort((a,b)=>b[0]-a[0]);console.log("pause senza aperture piu lunghe (mar 2021-oggi):",g.slice(0,15).map(x=>x[0].toFixed(0)+" g da "+new Date(x[1]).toISOString().slice(0,10)).join("; "));
}
