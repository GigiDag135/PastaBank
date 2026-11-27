// HyperSpeedUp · prove piccole per avere più operazioni (27 nov 2026). Regola fissata prima:
// una modifica passa se in ENTRAMBI i periodi fa più operazioni (+20%) e il rapporto rendimento/discesa non peggiora (>= 95% dell'originale).
"use strict";
const {prova,Core,DAY}=require("./bot.js");
const P=[["2018-22","2018-04-01","2023-01-01"],["2023-26","2023-01-01","2026-11-22T17:00:00Z"]];
const S=id=>Core.STRATEGIES.find(s=>s.id===id);
const PROVE=[["Originale (HyperStrategy di oggi)",{}],
 ["Classifica 2 (due monete più forti)",{opt:{rs:{lbs:Core.RS.lbs,top:2}}}],
 ["Classifica 3",{opt:{rs:{lbs:Core.RS.lbs,top:3}}}],
 ["+ XRP",{coins:["BTC","ETH","SOL","XRP"]}],
 ["+ sq2h (squeeze 2 ore, anche short)",{extra:[S("sq2h")]}],
 ["+ ema4h (incrocio medie 4 ore)",{extra:[S("ema4h")]}],
 ["+ kel4h (Keltner 4 ore, senza filtro vol.)",{extra:[S("kel4h")]}],
 ["+ mom8h (momentum 8 ore)",{extra:[S("mom8h")]}],
 ["+ tutte e 4 le strategie in più",{extra:["sq2h","ema4h","kel4h","mom8h"].map(S)}]];
function fermo(H,a,b){const g=new Set();for(const x of H)for(let d=Math.floor(Math.max(x.opened,a)/DAY);d<=Math.floor(Math.min(x.closed||b,b)/DAY);d++)g.add(d);return 100*(1-g.size/((b-a)/DAY));}
const base={};const righe=[];
for(const[n,o]of PROVE){const r=[n];let ok=true;
  for(const[p,a,b]of P){const A=Date.parse(a),B=Date.parse(b),z=prova(A,B,o),anni=(B-A)/365.25/DAY;
    if(!base[p])base[p]=z;const bb=base[p];
    if(n!==PROVE[0][0]&&!(z.H.length>=1.2*bb.H.length&&z.mar>=0.95*bb.mar))ok=false;
    r.push(`${(z.H.length/anni).toFixed(0)} op/anno · ${fermo(z.H,A,B).toFixed(0)}% giorni fermi · ${z.cagr.toFixed(0)}%/anno · discesa ${z.mdd.toFixed(0)}% · rapporto ${z.mar.toFixed(2)}`);}
  r.push(n===PROVE[0][0]?"—":ok?"SÌ":"no");righe.push("| "+r.join(" | ")+" |");console.error(n);}
console.log("| Prova | 2018-22 | 2023-26 | Passa? |\n|---|---|---|---|\n"+righe.join("\n"));
