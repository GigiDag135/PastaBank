"use strict";
const HS=process.argv[2],{prova,FULL,E}=require(HS+"/bot.js"),DAY=864e5;
let MAK=0,TAK=0;
function ferma(from,to){const z=prova(from,to,{}),iv=z.tutte.map(x=>[x.opened,x.closed||to]);return{z,occ:t=>iv.some(([a,b])=>t>=a&&t<b)};}
function griglia(coin,from,to,occ,k,tutteTaker){const C=FULL[coin],D=E.resample(C,96).C,A=E.atr(D,14),fee=tutteTaker?TAK:MAK;
  const atrDi=t=>{let j=-1;for(let a=0,b=D.t.length-1;a<=b;){const m=(a+b)>>1;if(D.t[m]+DAY<=t){j=m;a=m+1;}else b=m-1;}return j>=14?A[j]:NaN;};
  let cash=1000,on=false,P0=0,s=0,q=0,lv=[],stopDay=-1,curve=[],last=-1,pk=1000,mdd=0,giri=0,stop=0;
  const eq=px=>cash+lv.reduce((a,l)=>a+(l.open?l.d*l.q*(px-l.e):0),0);
  const chiudi=(px,f)=>{for(const l of lv)if(l.open){cash+=l.d*l.q*(px-l.e)-l.q*px*f;l.open=false;}on=false;lv=[];};
  for(let i=0;i<C.t.length;i++){const t=C.t[i];if(t<from)continue;if(t>to)break;const o=C.o[i],h=C.h[i],l=C.l[i],c=C.c[i],giorno=Math.floor(t/DAY);
    const libero=!occ(t);
    if(on&&!libero)chiudi(o,TAK);
    if(!on&&libero&&giorno!==stopDay){const a=atrDi(t);if(a>0){P0=o;s=k*a;q=cash/10/P0;on=true;lv=[];for(let n=1;n<=10;n++){lv.push({p:P0-n*s,d:1,open:false,q});lv.push({p:P0+n*s,d:-1,open:false,q});}}}
    if(on){const lo=P0-11*s,hi=P0+11*s;
      if(l<=lo||h>=hi){chiudi(l<=lo?Math.min(lo,o):Math.max(hi,o),TAK);stopDay=giorno;stop++;}
      else{for(const L of lv){if(L.open&&L.da<i){const tg=L.p+L.d*s;if(L.d>0?h>=tg:l<=tg){cash+=L.d*L.q*(tg-L.e)-L.q*tg*fee;L.open=false;giri++;}}}
        for(const L of lv){if(!L.open&&(L.d>0?l<=L.p:h>=L.p)&&L.ultimo!==i){L.open=true;L.e=L.p;L.da=i;L.ultimo=i;cash-=L.q*L.p*fee;}}}}
    if(giorno!==last){const v=eq(c);curve.push([t,v]);pk=Math.max(pk,v);mdd=Math.max(mdd,1-v/pk);last=giorno;}}
  if(on)chiudi(C.c[Math.min(C.t.length-1,C.t.findIndex(x=>x>to)-1)],TAK);
  const anni=(to-from)/31557600000,cagr=100*(Math.pow(Math.max(cash,1)/1000,1/anni)-1);return{cagr,mdd:100*mdd,giri,stop,curve};}
function unisci(bot,gr,quota){const m=new Map(gr.map(([t,v])=>[Math.floor(t/DAY),v]));let pk=0,mdd=0,lg=1000,ult=0;const b0=bot[0][1];
  for(const[t,v]of bot){const g=m.get(Math.floor(t/DAY));if(g!=null)lg=g;const x=(1-quota)*v/b0*1000+quota*lg;ult=x;pk=Math.max(pk,x);mdd=Math.max(mdd,1-x/pk);}
  return{fin:ult,mdd:100*mdd};}
const P=[["A apr 2018-22","2018-04-01","2023-01-01"],["B 2023-nov 2026","2023-01-01","2026-11-22T17:00:00Z"]],libero=()=>false;
console.log("| Moneta · scalino · costi | A apr 2018-22: %/anno · discesa · rapporto · giri · stop | B 2023-nov 2026 | Passa? |\n|---|---|---|---|");
const esito={};
for(const coin of["BTC","ETH","SOL"])for(const k of[0.2,0.4])for(const[cn,mk,tk]of[["Lighter 0",0,0],["prudente",0.0001,0.0005]]){MAK=mk;TAK=tk;
  const r=P.map(([n,a,b])=>{const A0=Math.max(Date.parse(a),FULL[coin].t[0]+201*DAY);return griglia(coin,A0,Date.parse(b),libero,k,false);});
  const pr=cn==="prudente",ok=r.every(g=>g.cagr>0&&g.mdd<=25&&g.cagr/g.mdd>=1);
  if(pr){esito[k]=esito[k]||{btc:null,pos:0};if(coin==="BTC")esito[k].btc=ok;if(r[1].cagr>0)esito[k].pos++;}
  console.log(`| ${coin} · ${k} ATR · ${cn} | `+r.map(g=>`${g.cagr>=0?"+":""}${g.cagr.toFixed(1)}% · ${g.mdd.toFixed(0)}% · ${(g.cagr/g.mdd).toFixed(2)} · ${g.giri} · ${g.stop}`).join(" | ")+` | ${pr&&coin==="BTC"?(ok?"BTC sì":"BTC no"):""} |`);}
console.log("\nEsito: "+Object.entries(esito).map(([k,e])=>`scalino ${k} ATR: ${e.btc&&e.pos>=2?"PASSA":"NON PASSA"} (BTC ${e.btc?"sì":"no"}, monete in guadagno in B ${e.pos}/3)`).join(" · "));
// anno per anno, BTC 0,2 ATR, costo prudente
MAK=0.0001;TAK=0.0005;console.log("\nBTC 0,2 ATR, costo prudente, anno per anno: "+[2018,2019,2020,2021,2022,2023,2024,2025,2026].map(y=>{const a=y===2018?Date.parse("2018-04-01"):Date.UTC(y,0,1),b=y===2026?Date.parse("2026-11-22T17:00:00Z"):Date.UTC(y+1,0,1),g=griglia("BTC",a,b,libero,0.2,false);return `${y} ${g.cagr>=0?"+":""}${g.cagr.toFixed(0)}% (disc. ${g.mdd.toFixed(0)}%)`;}).join(" · "));
