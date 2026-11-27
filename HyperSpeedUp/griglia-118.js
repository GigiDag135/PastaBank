"use strict";
const HS=process.argv[2],{prova,FULL,E}=require(HS+"/bot.js"),DAY=864e5;
const MAK=0.00015,TAK=0.00045+0.0001;
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
const P=[["A apr 2018-22","2018-04-01","2023-01-01"],["B 2023-nov 2026","2023-01-01","2026-11-22T17:00:00Z"]];
console.log("| Variante | Periodo | Griglia: %/anno · discesa · giri chiusi · stop | Bot da solo: %/anno · disc. · rapp. | 80% bot + 20% griglia: %/anno · disc. · rapp. |\n|---|---|---|---|---|");
const ok={};
for(const[n,a,b]of P){const A0=Date.parse(a),B0=Date.parse(b),{z,occ}=ferma(A0,B0),anni=(B0-A0)/31557600000;
  const lib=(()=>{let k=0,tot=0;for(let t=A0;t<B0;t+=3600e3){tot++;if(!occ(t))k++;}return k/tot;})();
  console.log(`| (bot senza posizioni il ${(100*lib).toFixed(0)}% del tempo) | ${n} | | | |`);
  for(const[coin,k,tk]of[["BTC",0.2,false],["BTC",0.4,false],["BTC",0.2,true],["BTC",0.4,true],["ETH",0.2,false],["ETH",0.4,false]]){
    const g=griglia(coin,A0,B0,occ,k,tk),u=unisci(z.curve,g.curve,0.2),uc=100*(Math.pow(u.fin/1000,1/anni)-1),nome=`${coin} s=${k} ATR${tk?" (tutto taker)":""}`;
    if(coin==="BTC"&&!tk){ok[nome]=ok[nome]??true;if(!(g.cagr>0&&g.mdd<=20&&uc/u.mdd>=z.mar))ok[nome]=false;}
    console.log(`| ${nome} | ${n} | ${g.cagr.toFixed(1)}% · ${g.mdd.toFixed(0)}% · ${g.giri} · ${g.stop} | ${z.cagr.toFixed(0)}% · ${z.mdd.toFixed(0)}% · ${z.mar.toFixed(2)} | ${uc.toFixed(0)}% · ${u.mdd.toFixed(0)}% · ${(uc/u.mdd).toFixed(2)} |`);}}
console.log("\nEsito: "+Object.entries(ok).map(([k,v])=>`${k} ${v?"PASSA":"NON PASSA"}`).join(" · "));
