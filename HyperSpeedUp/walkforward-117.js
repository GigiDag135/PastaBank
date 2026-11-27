// 117 · walk-forward anno per anno. Uso: node wf117.js <cartella HyperSpeedUp>
"use strict";
const HS=process.argv[2],{prova,Core}=require(HS+"/bot.js");
const BASE=Core.STRATEGIES.filter(s=>Core.PRESET.strats.includes(s.id)),SL=[1.6,2,2.4],VM=[0.4,0.5,0.6],KK=[1.6,2,2.4],RS=[0.8,1,1.2];
const G=[];for(let a=0;a<3;a++)for(let b=0;b<3;b++)for(let c=0;c<3;c++)for(let d=0;d<3;d++){
  const strats=BASE.map(s=>{const x=JSON.parse(JSON.stringify(s));x.ex.sl=SL[a];x.volMax=VM[b];if(["kel1h","kelS"].includes(x.id))x.p.k=KK[c];return x;});
  G.push({i:[a,b,c,d],n:`stop ${SL[a]} · vol ${VM[b]*100}° · Keltner ${KK[c]} · classifica ×${RS[d]}`,o:{strats,opt:{rs:{lbs:Core.RS.lbs.map(v=>Math.round(v*RS[d])),top:1}}},oggi:a===1&&b===1&&c===1&&d===1});}
const med=a=>{const b=[...a].sort((x,y)=>x-y),m=b.length>>1;return b.length%2?b[m]:(b[m-1]+b[m])/2;};
const anni=[2021,2022,2023,2024,2025,2026],FINE=Date.parse("2026-11-22T17:00:00Z");
const R={M:[],C:[],O:[]};
for(const y of anni){const a0=y===2021?Date.parse("2018-04-01"):Date.UTC(y-3,0,1),a1=Date.UTC(y,0,1),b1=y===2026?FINE:Date.UTC(y+1,0,1);
  const tr=G.map(g=>prova(a0,a1,g.o));
  const vic=k=>G.map((g,j)=>j).filter(j=>G[j].i.every((v,q)=>Math.abs(v-G[k].i[q])<=1)&&G[j].i.reduce((s,v,q)=>s+Math.abs(v-G[k].i[q]),0)<=1);
  const iM=tr.reduce((b,z,j)=>z.mar>tr[b].mar?j:b,0),pl=G.map((g,k)=>med(vic(k).map(j=>tr[j].mar))),iC=pl.reduce((b,v,j)=>v>pl[b]?j:b,0),iO=G.findIndex(g=>g.oggi);
  for(const[k,i]of[["M",iM],["C",iC],["O",iO]]){const te=prova(a1,b1,G[i].o);R[k].push({y,n:G[i].n,is:tr[i],oos:te,r:100*(te.fin/1000-1),wfe:te.cagr/tr[i].cagr});}
  console.error("fatto",y);}
const nome={M:"M · migliore del passato",C:"C · centro dell'altopiano",O:"O · bot di oggi (fisso)"};
console.log("| Anno di prova | "+Object.values(nome).join(" | ")+" |\n|---|---|---|---|");
for(let k=0;k<anni.length;k++)console.log(`| ${anni[k]}${anni[k]===2026?" (fino al 22 nov)":""} | `+["M","C","O"].map(m=>{const z=R[m][k];return `${z.r>=0?"+":""}${z.r.toFixed(0)}% · disc. ${z.oos.mdd.toFixed(0)}% · eff. ${(100*z.wfe).toFixed(0)}%`;}).join(" | ")+" |");
console.log("| **Totale 2021-26** | "+["M","C","O"].map(m=>{const tot=R[m].reduce((v,z)=>v*(1+z.r/100),1),yrs=(FINE-Date.UTC(2021,0,1))/31557600000,cagr=100*(Math.pow(tot,1/yrs)-1),dd=Math.max(...R[m].map(z=>z.oos.mdd)),w=R[m].map(z=>z.wfe);
  return `**${cagr.toFixed(0)}%/anno** · disc. anno peggiore ${dd.toFixed(0)}% · eff. media **${(100*w.reduce((s,x)=>s+x,0)/w.length).toFixed(0)}%** (mediana ${(100*med(w)).toFixed(0)}%)`;}).join(" | ")+" |");
console.log("\nParametri scelti ogni anno:");for(const m of["M","C"])console.log(`  ${m}: `+R[m].map(z=>`${z.y} ${z.n}`).join(" · "));
