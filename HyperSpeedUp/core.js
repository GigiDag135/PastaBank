// Nucleo di trading condiviso tra laboratorio (prova sul passato) e TEST FREE dal vivo.
// Stesse regole usate nella ricerca: rischio % del saldo, leva calcolata dallo stop,
// liquidazione sempre oltre lo stop, commissioni, slittamento, funding, ordine minimo.
(function (root) {
"use strict";
const E = root.Engine || (typeof require !== "undefined" ? require("./engine.js") : null);

/* Strategie scelte dalla ricerca (parametri al centro, uscite fissate) */
const STRATEGIES = [
  { id: "kel1h", f: 4, key: "keltner", p: { n: 20, k: 2, tf: 0 }, ex: { sl: 2, opp: 1 }, dir: "long", vol: "low", def: true,
    title: "Keltner · 1 ora",
    what: "Entra quando il prezzo esce verso l'alto dal canale media ± 2× ATR, segno che parte un movimento.",
    exit: "Stop a 2× ATR; chiude al segnale opposto (uscita dal canale verso il basso).",
    research: "Ricerca su 4 anni: in attivo in ogni anno 2023-2026, 100% delle varianti in attivo. Solo long con volatilità bassa, 100 € e rischio 1%: 274 € da aprile 2023, vinte 26%, al massimo 15 perdite di fila, discesa massima -14%. Su ETH, SOL e XRP è la famiglia più solida trovata: in attivo in ogni anno su tutte e 4 le monete." },
  { id: "mom1h", f: 4, key: "momentum", p: { n: 12, th: 3, tf: 0 }, ex: { sl: 2, opp: 1 }, dir: "long", vol: "low", def: true,
    title: "Momentum · 1 ora",
    what: "Entra quando in 12 ore il prezzo si è mosso più di 3 volte la sua volatilità normale: una spinta vera, non rumore.",
    exit: "Stop a 2× ATR; chiude al segnale opposto (spinta altrettanto forte nell'altra direzione).",
    research: "Ricerca su 4 anni: in attivo in ogni anno 2023-2026. Solo long con volatilità bassa, 100 € e rischio 1%: 241 € da aprile 2023, vinte 26%, al massimo 11 perdite di fila. Insieme a Keltner 1h, una posizione alla volta: 284 €. In attivo ogni anno anche su ETH, SOL e XRP." },
  { id: "sq4h", f: 16, key: "squeeze", p: { n: 30, k: 2, q: 0.15, look: 200, tf: 0 }, ex: { sl: 2, opp: 1 }, dir: "long", vol: "all", def: true,
    title: "Squeeze di volatilità · 4 ore",
    what: "Aspetta che BTC resti calmo (bande di Bollinger strette) e compra quando il prezzo esce con forza verso l'alto.",
    exit: "Stop a 2× ATR; chiude al segnale opposto (uscita dalle bande verso il basso).",
    research: "Ricerca su 4 anni: in attivo in ogni anno 2023-2026 (100% delle varianti). Aggiunta a Keltner 1h + Momentum 1h: 100 € → 300 € invece di 284 €, discesa massima -13% invece di -16%. Le tre strategie insieme su BTC, ETH, SOL e XRP (una posizione per moneta, rischio 0,5%): 100 € → circa 640 € da aprile 2023, anni +85% / +112% / +28% / +28%, discesa massima -23%. Entrando solo sulle 2 monete più forti (3, 7 e 14 giorni): 636 € con discesa -15% allo stesso rischio, 1.286 € (-19%) con rischio 0,75%; con gli short intelligenti 1.546 € (-18%)." },
  { id: "kelS", f: 4, key: "keltner", p: { n: 20, k: 2, tf: 0 }, ex: { sl: 2, opp: 1 }, dir: "short", vol: "low", def: true, smart: true,
    title: "Short intelligenti · Keltner 1 ora",
    what: "Short solo quando servono: il prezzo esce verso il basso dal canale media ± 2× ATR, ma solo sulla moneta più debole della classifica (3, 7 e 14 giorni) e solo se BTC è sotto la sua media di 100 giorni (mercato in discesa).",
    exit: "Stop a 2× ATR; chiude al segnale opposto (uscita dal canale verso l'alto).",
    research: "Short sulle monete forti o su tutte: in perdita nel 2024-2025. Solo sulla più debole e con BTC in discesa: +1 / +3 / -4 / +28 R negli anni 2023-2026, quasi nessuna operazione negli anni di salita. Insieme ai long sulle 2 più forti, rischio 0,75%, 100 €: 1.546 € dal 2023 invece di 1.286 €, discesa massima -18% invece di -20%, ultimi 360 giorni +54% invece di +31%. In 10 varianti della classifica migliora sempre gli ultimi 360 giorni." },
  { id: "sq2h", f: 8, key: "squeeze", p: { n: 30, k: 2, q: 0.15, look: 200, tf: 0 }, ex: { sl: 2, opp: 1, be: 1 }, dir: "both", vol: "all", def: false,
    title: "Squeeze di volatilità · 2 ore",
    what: "Aspetta che BTC resti calmo (bande di Bollinger strette) e entra quando il prezzo esce con forza da una parte.",
    exit: "Stop a 2× ATR; quando guadagna quanto rischia lo stop va a pareggio; chiude al segnale opposto.",
    research: "Ottima nel 2026, ma su 4 anni ha perso nel 2023 e nel 2025: vinte 11%, fino a 38 perdite di fila. Non consigliata come principale." },
  { id: "ema4h", f: 16, key: "emaCross", p: { f: 9, s: 100, adx: 20, tf: 0 }, ex: { sl: 2, opp: 1 }, dir: "both", vol: "all", def: false,
    title: "Incrocio di medie · 4 ore",
    what: "Entra quando la media veloce (9) taglia la media lenta (100) e il trend ha forza (ADX ≥ 20).",
    exit: "Stop a 2× ATR; chiude al segnale opposto.",
    research: "Provata solo sull'ultimo anno: meno affidabile." },
  { id: "kel4h", f: 16, key: "keltner", p: { n: 20, k: 2, tf: 0 }, ex: { sl: 2, opp: 1 }, dir: "both", vol: "all", def: false,
    title: "Keltner · 4 ore",
    what: "Entra quando il prezzo esce dal canale media ± 2× ATR.",
    exit: "Stop a 2× ATR; chiude al segnale opposto.",
    research: "Provata solo sull'ultimo anno: meno affidabile." },
  { id: "mom8h", f: 32, key: "momentum", p: { n: 12, th: 3, tf: 0 }, ex: { sl: 2, opp: 1 }, dir: "both", vol: "all", def: false,
    title: "Spinta di momentum · 8 ore",
    what: "Entra quando in 12 candele da 8 ore il prezzo si è mosso più di 3 volte la volatilità.",
    exit: "Stop a 2× ATR; chiude al segnale opposto.",
    research: "Provata solo sull'ultimo anno: meno affidabile." },
];
// configurazione migliore trovata (si applica al primo avvio e con "Ripristina la configurazione migliore")
const BEST = { version: 6, cfg: { risk: 0.75, maxPos: 4, maxLev: 40 } };
// Strategia congelata "PastaBank v1" (30 ottobre 2026): il riferimento da cui non ci si sposta senza nuovi test
const PRESET = { name: "PastaBank", ver: "v1", coins: ["BTC", "ETH", "SOL", "XRP"], strats: ["kel1h", "mom1h", "sq4h", "kelS"], rsTop: true, risk: 0.75, cap: 1.5, adapt: { hi: 1.5, lo: 0.75, k: 2, max: 3 }, maxPos: 4, maxLev: 40,
  desc: "BTC, ETH, SOL e XRP · Keltner 1h + Momentum 1h + Squeeze 4h long sulle 2 monete più forti · short intelligenti sulla più debole con BTC in discesa · rischio adattivo 1,5% con il saldo ai massimi, 0,75% sotto · tetto totale 2× il rischio (max 3%) · una posizione per moneta" };
const presetLabel = () => PRESET.name + " " + PRESET.ver;
// "Solo le monete più forti": classifica sui rendimenti di 3, 7 e 14 giorni, entra solo sulle prime 2
const RS = { lbs: [3, 7, 14], top: 2 };

/* PiramidBoost: aggiunte alle operazioni in guadagno (ricerca 031, 11 nov 2026).
   Livelli: entrata + n·trig·distanza dello stop iniziale (n = 1, 2, 3...). A candela 15m CHIUSA oltre un livello nuovo
   si aggiunge size × la posizione iniziale, al massimo max aggiunte. Se il prezzo salta più livelli si aggiunge una volta sola.
   Stop comune delle aggiunte = il livello sotto quello raggiunto (con il primo livello: il prezzo di entrata, cioè pareggio).
   Sul conto la posizione resta una sola (margine isolato): lo stop delle aggiunte scatta sempre prima della liquidazione
   della posizione intera (verificato su 507 aggiunte 2022-2026, distanza minima 0,8% del prezzo).
   Le aggiunte non contano nel tetto di rischio (rischiano profitto già fatto) e si chiudono insieme all'operazione. */
const PYR = { trig: 1, size: 0.5, max: 3, coins: ["BTC", "ETH"] };   // solo BTC ed ETH: su SOL e XRP le aggiunte perdono (ricerca 032)
// livelli raggiunti dalla chiusura (0 = nessuno)
const pyrLevels = (P, close, py) => Math.max(0, Math.floor((close - P.entry) * P.side / (py.trig * P.slD) + 1e-9));
// stop comune delle aggiunte con n livelli raggiunti
const pyrStop = (P, n, py) => P.entry + P.side * (n - 1) * py.trig * P.slD;
// livello nuovo per un'aggiunta, oppure 0
function pyrDue(P, close, py) { if (py.coins && !py.coins.includes(P.coin)) return 0; if ((P.pyrAdds || 0) >= py.max || !(P.slD > 0)) return 0; const n = pyrLevels(P, close, py); return n > (P.pyrLvl || 0) ? n : 0; }

/* Entrata con ordine limite: commissione maker, attraversamento minimo del prezzo, nessuno scarto dal prezzo del segnale */
const LIMIT = { maker: 0.00015, q: 0.0001, off: 0, waitMin: 30 };
/* Ibrido (solo con il tetto fisso, rischio adattivo spento): tetto di rischio totale = 2,5× il rischio dell'operazione
   al posto del tetto fisso in %; una nuova operazione entra solo se nel tetto resta almeno metà del suo rischio
   (niente posizioni minuscole che occupano la moneta). Con il rischio adattivo il tetto è già proporzionale: l'ibrido non cambia nulla. */
const HYB = { k: 2.5, min: 0.5 };
function capRule(riskPct, capPct, hyb) { return hyb ? { cap: HYB.k * riskPct, min: HYB.min * riskPct } : { cap: capPct, min: 0.1 * riskPct }; }
const DEFAULTS = { risk: 0.01, maxPos: 1, maxLev: 40, fee: 0.00045, feeIn: 0.00045, slip: 0.0001, funding: 0.0001, mmr: 0.0125, minNotional: 10, riskCap: 0 };
// Tetto di rischio totale: quanto si perderebbe se tutte le posizioni del bot toccassero lo stop (più la commissione di chiusura)
// Rischio adattivo (piano B): rischio alto quando il saldo realizzato è al suo massimo, base sotto il massimo; tetto = k × rischio (con un massimo)
function adaptRisk(B, a) { const pk = Math.max(B.peak || 0, B.start || 0), high = B.balance >= pk * 0.999, risk = high ? a.hi : a.lo; return { risk, cap: Math.min(a.k * risk, a.max), high }; }
function openRisk(positions, fee) { let r = 0; for (const p of positions) { if (p.by === "manuale" || p.strat === "manuale") continue; const q = p.qty != null ? p.qty : p.size; r += Math.max(0, q * (p.entry - p.sl) * p.side) + q * p.sl * (fee || 0); } return r; }

/* Volatilità: ATR giornaliero / prezzo, percentile sugli ultimi 180 giorni (solo dati passati).
   D = candele giornaliere {t,o,h,l,c}; restituisce un valore per ogni candela 15m di C (NaN se la storia non basta). */
function volPct(C, D) {
  if (!D) D = E.resample(C, 96).C;
  const A = E.atr(D, 14), nD = D.t.length, vp = new Float64Array(nD).fill(NaN);
  for (let j = 194; j < nD; j++) { const v = A[j] / D.c[j]; let b = 0; for (let k = j - 180; k < j; k++) if (A[k] / D.c[k] < v) b++; vp[j] = b / 180; }
  const N = C.t.length, out = new Float64Array(N).fill(NaN); let j = -1;
  for (let i = 0; i < N; i++) { const endOfBar = C.t[i] + 900000; while (j + 1 < nD && D.t[j + 1] + 86400000 <= endOfBar) j++; if (j >= 0) out[i] = vp[j]; }
  return out;
}

/* Calcola, per ogni strategia, i segnali (filtrati per direzione/volatilità), i segnali grezzi (per l'uscita) e l'ATR */
/* Trend di fondo: +1 se il prezzo è sopra la media a n giorni (ultima candela giornaliera chiusa), -1 sotto */
function dailyTrend(C, D, n) {
  if (!D) D = E.resample(C, 96).C;
  const m = E.ema(D.c, n || 200), nD = D.t.length, N = C.t.length, out = new Int8Array(N); let j = -1;
  for (let i = 0; i < N; i++) { const endOfBar = C.t[i] + 900000; while (j + 1 < nD && D.t[j + 1] + 86400000 <= endOfBar) j++; out[i] = j >= n ? (D.c[j] > m[j] ? 1 : -1) : 0; }
  return out;
}
/* Volatility targeting: moltiplicatore del rischio = volatilità tipica / volatilità attuale (0,5-1,5) */
function riskMult(C, D) {
  if (!D) D = E.resample(C, 96).C;
  const A = E.atr(D, 14), nD = D.t.length, mul = new Float64Array(nD).fill(1);
  for (let j = 194; j < nD; j++) { const w = []; for (let k = j - 180; k < j; k++) w.push(A[k] / D.c[k]); w.sort((a, b) => a - b); mul[j] = Math.max(0.5, Math.min(1.5, w[90] / (A[j] / D.c[j]))); }
  const N = C.t.length, out = new Float64Array(N).fill(1); let j = -1;
  for (let i = 0; i < N; i++) { const endOfBar = C.t[i] + 900000; while (j + 1 < nD && D.t[j + 1] + 86400000 <= endOfBar) j++; if (j >= 0) out[i] = mul[j]; }
  return out;
}

function buildSignals(C, strats, extra) {
  const out = {}; const ctx = {}; let VP = extra && extra.volPct, TR = extra && extra.trend;
  for (const s of strats) {
    const X = ctx[s.f] || (ctx[s.f] = E.makeTF(C, s.f));
    const p = Object.assign({}, s.p); if (s.f > 1 && p.tf) p.tf = Math.max(50, Math.round(p.tf / s.f));
    const raw = X.expandSig(E.STRATS[s.key].signal(X.K, p));
    let sig = raw;
    if (s.dir === "long" || s.dir === "short" || s.dir === "regime" || s.vol === "low" || s.vol === "lowLong") {
      if ((s.vol === "low" || s.vol === "lowLong") && !VP) VP = volPct(C, extra && extra.daily);
      if (s.dir === "regime" && !TR) TR = dailyTrend(C, extra && extra.daily, 200);
      sig = new Int8Array(raw.length);
      for (let i = 0; i < raw.length; i++) {
        const d = raw[i]; if (!d) continue;
        if (s.dir === "long" && d < 0) continue;
        if (s.dir === "short" && d > 0) continue;
        if (s.dir === "regime" && d !== TR[i]) continue;                       // a favore del trend di fondo
        if (s.vol === "low" && !(VP[i] < (s.volMax || 0.5))) continue;
        if (s.vol === "lowLong" && d > 0 && !(VP[i] < (s.volMax || 0.5))) continue; // filtro solo sui long
        sig[i] = d;
      }
    }
    out[s.id] = { sig, raw, A: X.A(14) };
  }
  return out;
}

/* Un "libro" di posizioni simulate su un conto. Stato serializzabile (per il salvataggio). */
function newBook(start) { return { start, balance: start, positions: [], history: [], nextId: 1 }; }

function closePos(B, pos, px, t, why, o) {
  const hours = Math.max(0, (t - pos.opened) / 3600000);
  const gross = pos.qty * (px - pos.entry) * pos.side;
  const feeOut = o.feesOn ? pos.qty * px * o.fee : 0;
  const fund = o.fundingOn ? pos.qty * pos.entry * o.funding * hours / 8 : 0;
  let pnl = gross - pos.feeIn - feeOut - fund;
  if (why === "Liquidata") pnl = -pos.margin - pos.feeIn;
  B.balance += pnl;
  B.peak = Math.max(B.peak || B.start || 0, B.balance);
  B.positions = B.positions.filter(p => p.id !== pos.id);
  const tr = { id: pos.id, coin: pos.coin || "BTC", strat: pos.strat, side: pos.side, lev: pos.lev, entry: pos.entry, exit: px, opened: pos.opened, closed: t, why, pnl, r: pnl / pos.riskAmt, notional: pos.qty * pos.entry };
  if (pos.by === "piramide") tr.by = "piramide";   // solo per Pepper: riconoscere le aggiunte di PiramidBoost
  B.history.push(tr);
  return tr;
}

/* Uscita parziale: chiude una frazione della posizione e lascia correre il resto */
function closePart(B, pos, px, t, frac, o) {
  const q = pos.qty * frac, hours = Math.max(0, (t - pos.opened) / 3600000);
  const fIn = pos.feeIn * frac, fOut = o.feesOn ? q * px * o.fee : 0, fund = o.fundingOn ? q * pos.entry * o.funding * hours / 8 : 0;
  const pnl = q * (px - pos.entry) * pos.side - fIn - fOut - fund, rk = pos.riskAmt * frac;
  B.balance += pnl;
  B.peak = Math.max(B.peak || B.start || 0, B.balance);
  B.history.push({ id: pos.id, coin: pos.coin || "BTC", strat: pos.strat, side: pos.side, lev: pos.lev, entry: pos.entry, exit: px, opened: pos.opened, closed: t, why: "Uscita parziale", pnl, r: pnl / rk, notional: q * pos.entry, partial: true });
  pos.qty -= q; pos.margin *= 1 - frac; pos.feeIn -= fIn; pos.riskAmt -= rk; pos.partDone = true;
}

/* Gestione di una posizione su una candela 15m chiusa (stessa logica della ricerca) */
function manageOnBar(B, pos, bar, sigVal, o) {
  const L = pos.side > 0;
  if (L ? bar.o <= pos.liq : bar.o >= pos.liq) return closePos(B, pos, pos.liq, bar.t, "Liquidata", o);
  if (L ? bar.l <= pos.sl : bar.h >= pos.sl) { const px = L ? Math.min(pos.sl, bar.o) : Math.max(pos.sl, bar.o); return closePos(B, pos, px * (1 - pos.side * o.slip), bar.t + 900000, pos.beDone ? "Stop a pareggio" : "Stop loss", o); }
  if (pos.tp && (L ? bar.h >= pos.tp : bar.l <= pos.tp)) return closePos(B, pos, L ? Math.max(pos.tp, bar.o) : Math.min(pos.tp, bar.o), bar.t + 900000, "Take profit", o);
  if (pos.ex.part && !pos.partDone && (L ? bar.h >= pos.entry + pos.ex.part.r * pos.slD : bar.l <= pos.entry - pos.ex.part.r * pos.slD)) {
    closePart(B, pos, pos.entry + pos.side * pos.ex.part.r * pos.slD, bar.t + 900000, pos.ex.part.frac, o);
    if (pos.ex.part.be) { const b = pos.entry * (1 + pos.side * (o.feeIn + o.fee)); if (L ? b > pos.sl : b < pos.sl) { pos.sl = b; pos.beDone = true; } }
  }
  if (pos.ex.opp && sigVal === -pos.side) return closePos(B, pos, bar.c * (1 - pos.side * o.slip), bar.t + 900000, "Segnale opposto", o);
  if (pos.ex.tr) {
    if (L) { pos.best = Math.max(pos.best, bar.h); pos.sl = Math.max(pos.sl, pos.best - pos.trD); }
    else { pos.best = Math.min(pos.best, bar.l); pos.sl = Math.min(pos.sl, pos.best + pos.trD); }
  }
  if (pos.ex.be && !pos.beDone && (L ? bar.h >= pos.entry + pos.ex.be * pos.slD : bar.l <= pos.entry - pos.ex.be * pos.slD)) {
    pos.beDone = true; const b = pos.entry * (1 + pos.side * (o.feeIn + o.fee)); if (L ? b > pos.sl : b < pos.sl) pos.sl = b;
  }
  return null;
}

/* Controllo istantaneo col prezzo dal vivo (tra una candela e l'altra) */
function manageOnTick(B, pos, px, t, o) {
  const L = pos.side > 0;
  if (pos.ex.part && !pos.partDone && (L ? px >= pos.entry + pos.ex.part.r * pos.slD : px <= pos.entry - pos.ex.part.r * pos.slD)) {
    closePart(B, pos, px, t, pos.ex.part.frac, o);
    if (pos.ex.part.be) { const b = pos.entry * (1 + pos.side * (o.feeIn + o.fee)); if (L ? b > pos.sl : b < pos.sl) { pos.sl = b; pos.beDone = true; } }
  }
  if (L ? px <= pos.liq : px >= pos.liq) return closePos(B, pos, pos.liq, t, "Liquidata", o);
  if (L ? px <= pos.sl : px >= pos.sl) return closePos(B, pos, px * (1 - pos.side * o.slip), t, pos.beDone ? "Stop a pareggio" : "Stop loss", o);
  if (pos.tp && (L ? px >= pos.tp : px <= pos.tp)) return closePos(B, pos, px, t, "Take profit", o);
  if (pos.ex.be && !pos.beDone && (L ? px >= pos.entry + pos.ex.be * pos.slD : px <= pos.entry - pos.ex.be * pos.slD)) {
    pos.beDone = true; const b = pos.entry * (1 + pos.side * (o.feeIn + o.fee)); if (L ? b > pos.sl : b < pos.sl) pos.sl = b;
  }
  return null;
}

/* Apertura con rischio % del saldo. Restituisce la posizione o un motivo di rifiuto (stringa). */
function openAuto(B, strat, side, px, atr, t, o) {
  const coin = o.coin || "BTC", open = B.positions.filter(p => p.by === "bot");
  if (B.positions.some(p => (p.coin || "BTC") === coin)) return "c'è già una posizione su " + coin;
  if (open.length >= o.maxPos) return "già aperte " + o.maxPos + " posizioni (limite)";
  const entry = px * (1 + side * o.slip), slD = strat.ex.sl * atr, slPct = slD / entry;
  const lev = Math.max(1, Math.min(o.maxLev, Math.floor(1 / (slPct * 1.5 + o.mmr))));
  if (o.adapt) { const x = adaptRisk(B, o.adapt); o = Object.assign({}, o, { risk: x.risk, riskCap: x.cap }); }
  let riskAmt = B.balance * o.risk * (o.mul != null ? o.mul : 1);   // o.mul: modalità ribasso (long a metà)
  const CR = capRule(o.risk, o.riskCap, o.hyb && !o.adapt);
  if (CR.cap > 0) { const left = B.balance * CR.cap - openRisk(open, o.feesOn ? o.fee : 0); if (left < B.balance * CR.min) return "tetto di rischio totale raggiunto (" + +(CR.cap * 100).toFixed(2) + "% del conto)"; riskAmt = Math.min(riskAmt, left); }
  const fIn = o.feesOn ? o.feeIn : 0, fOut = o.feesOn ? o.fee : 0;
  let notional = riskAmt / (slPct + fIn + fOut + o.slip);
  const free = B.balance - B.positions.reduce((a, p) => a + p.margin, 0);
  if (notional / lev > free * 0.95) notional = Math.max(0, free * 0.95 * lev);
  if (notional < o.minNotional) return "ordine sotto il minimo di " + o.minNotional + " $";
  const pos = { id: B.nextId++, by: "bot", coin, strat: strat.id, side, lev, entry, qty: notional / entry, margin: notional / lev, riskAmt,
    sl: entry - side * slD, tp: strat.ex.rr ? entry + side * slD * strat.ex.rr : 0, liq: entry * (1 - side * (1 / lev - o.mmr)),
    slD, best: entry, trD: (strat.ex.tr || 0) * atr, beDone: false, ex: strat.ex, opened: t, feeIn: notional * fIn };
  B.positions.push(pos);
  return pos;
}

/* Apertura manuale: margine e leva scelti dall'utente, SL/TP in % del prezzo */
function openManual(B, side, px, lev, margin, slPct, tpPct, t, o) {
  lev = Math.max(1, Math.min(o.maxLev, Math.round(lev)));
  const notional = margin * lev, fIn = o.feesOn ? notional * o.feeIn : 0;
  if (notional < o.minNotional) return "ordine sotto il minimo di " + o.minNotional + " $ (margine × leva)";
  const free = B.balance - B.positions.reduce((a, p) => a + p.margin, 0);
  if (margin + fIn > free) return "margine disponibile insufficiente";
  const entry = px * (1 + side * o.slip), liq = entry * (1 - side * Math.max(0.0005, 1 / lev - o.mmr));
  const sl = slPct > 0 ? entry * (1 - side * slPct / 100) : 0, tp = tpPct > 0 ? entry * (1 + side * tpPct / 100) : 0;
  const riskAmt = sl ? Math.abs(entry - sl) * notional / entry : margin;
  const pos = { id: B.nextId++, by: "manuale", coin: o.coin || "BTC", strat: "manuale", side, lev, entry, qty: notional / entry, margin, riskAmt,
    sl: sl || (side > 0 ? -Infinity : Infinity), tp, liq, slD: Math.abs(entry - sl), best: entry, trD: 0, beDone: false, ex: {}, opened: t, feeIn: fIn };
  if (!sl) pos.sl = side > 0 ? 0 : 1e12;
  B.positions.push(pos);
  return pos;
}

function unrealized(pos, px) { return pos.qty * (px - pos.entry) * pos.side - pos.feeIn; }
// px: numero (una moneta) oppure oggetto { BTC: prezzo, ETH: prezzo, ... }
function equity(B, px) {
  return B.balance + B.positions.reduce((a, p) => { const q = typeof px === "object" ? px[p.coin || "BTC"] : px; return a + (q ? unrealized(p, q) : 0); }, 0);
}

/* Prova sul passato con le stesse funzioni del vivo */
function backtest(C, strats, opt, onProgress) {
  const o = Object.assign({}, DEFAULTS, { feesOn: true, fundingOn: true }, opt || {});
  const S = buildSignals(C, strats, opt && opt.extra), N = C.t.length;
  let WARM = Math.min(900, Math.floor(N / 4));
  if (o.fromT) { const k = C.t.findIndex(t => t >= o.fromT); if (k > 0) WARM = k; }
  const B = newBook(o.start || 100); let peak = B.balance, mdd = 0; const curve = [];
  const RM = o.volTarget ? (o.extra && o.extra.riskMult) || riskMult(C, o.extra && o.extra.daily) : null;
  const sById = Object.fromEntries(strats.map(s => [s.id, s]));
  for (let i = WARM; i < N; i++) {
    const bar = { t: C.t[i], o: C.o[i], h: C.h[i], l: C.l[i], c: C.c[i] };
    for (const pos of [...B.positions]) manageOnBar(B, pos, bar, S[pos.strat] ? S[pos.strat].raw[i] : 0, o);
    if (B.balance > peak) peak = B.balance; const dd = (peak - B.balance) / peak; if (dd > mdd) mdd = dd;
    if (i + 1 < N) for (const s of strats) {
      const x = S[s.id]; if (!x.sig[i] || isNaN(x.A[i])) continue;
      // si entra all'apertura della candela successiva (come nella ricerca)
      openAuto(B, sById[s.id], x.sig[i], C.o[i + 1], x.A[i], C.t[i + 1], RM ? Object.assign({}, o, { risk: o.risk * RM[i] }) : o);
    }
    if (i % 96 === 0) curve.push([C.t[i], B.balance]);
  }
  for (const pos of [...B.positions]) closePos(B, pos, C.c[N - 1], C.t[N - 1] + 900000, "Fine dati", o);
  curve.push([C.t[N - 1], B.balance]);
  return { book: B, mdd, curve, from: C.t[WARM], to: C.t[N - 1] };
}


/* Classifica di forza: per ogni finestra (giorni) ordina le monete per rendimento, somma le posizioni;
   usa solo candele giornaliere già chiuse al tempo t. daily = { BTC: D, ... }. Restituisce { BTC: 0, ETH: 1, ... } (0 = la più forte) */
function lastDay(D, t) { let lo = 0, hi = D.t.length - 1, r = -1; while (lo <= hi) { const m = (lo + hi) >> 1; if (D.t[m] + 86400000 <= t) { r = m; lo = m + 1; } else hi = m - 1; } return r; }
/* Mercato in discesa: ultima chiusura giornaliera di BTC sotto la sua media esponenziale di n giorni */
function btcDown(D, t, n) {
  if (!D) return false; n = n || 100;
  const k = "_ema" + n; if (!D[k] || D[k].length !== D.c.length) D[k] = E.ema(D.c, n);
  const j = lastDay(D, t); return j >= n && D.c[j] < D[k][j];
}
/* Short intelligente: la moneta è l'ultima della classifica e BTC è in discesa. Restituisce "" se può entrare, altrimenti il motivo */
function smartShortReason(ranks, coin, btcD, t) {
  const n = Object.keys(ranks).length;
  if (ranks[coin] == null) return "classifica non disponibile";
  if (ranks[coin] !== n - 1) return `${coin} non è la più debole (è ${ranks[coin] + 1}ª di ${n})`;
  if (!btcD) return "mancano le candele giornaliere di BTC";
  if (!btcDown(btcD, t, 100)) return "BTC è sopra la media di 100 giorni (mercato non in discesa)";
  return "";
}
function rsRanks(daily, t, lbs) {
  const coins = Object.keys(daily).filter(c => daily[c]), sc = Object.fromEntries(coins.map(c => [c, 0])), J = Object.fromEntries(coins.map(c => [c, lastDay(daily[c], t)]));
  for (const n of lbs || RS.lbs) {
    const v = coins.map(c => { const D = daily[c], j = J[c]; return [c, j >= n ? D.c[j] / D.c[j - n] - 1 : NaN]; });
    v.sort((a, b) => (isNaN(b[1]) ? -Infinity : b[1]) - (isNaN(a[1]) ? -Infinity : a[1]));
    v.forEach(([c], i) => sc[c] += i);
  }
  const ord = coins.slice().sort((a, b) => sc[a] - sc[b]), out = {};
  ord.forEach((c, i) => out[c] = i);
  return out;
}

/* PiramidBoost nella prova sul passato: chiude le aggiunte rimaste senza madre (allo stesso prezzo dell'uscita della madre),
   poi, a candela chiusa, aggiunge all'apertura della candela dopo. */
function pyrBar(B, c, C, i, o, py) {
  for (const ad of B.positions.filter(p => p.by === "piramide" && p.coin === c)) {
    if (B.positions.some(p => p.id === ad.parent)) continue;
    const h = B.history.slice().reverse().find(x => x.id === ad.parent && !x.partial);
    closePos(B, ad, h ? h.exit : C.c[i], h ? h.closed : C.t[i] + 900000, "Con l'operazione", o);
  }
  if (i + 1 >= C.t.length) return;
  for (const P of B.positions.filter(p => p.by === "bot" && p.coin === c && !p.ex.part)) {
    const n = pyrDue(P, C.c[i], py); if (!n) continue;
    P.pyrLvl = n;
    const px = C.o[i + 1] * (1 + P.side * o.slip), stop = pyrStop(P, n, py);
    if (P.side > 0 ? px <= stop : px >= stop) continue;     // il prezzo è già tornato sotto lo stop delle aggiunte
    let qty = (P.qty0 || P.qty) * py.size;
    const free = B.balance - B.positions.reduce((a, p) => a + p.margin, 0);
    if (qty * px / P.lev > free * 0.95) qty = Math.max(0, free * 0.95 * P.lev / px);
    if (qty * px < o.minNotional) continue;
    const fIn = o.feesOn ? o.feeIn : 0;
    if (!P.qty0) P.qty0 = P.qty;
    P.pyrAdds = (P.pyrAdds || 0) + 1;
    const ad = { id: B.nextId++, by: "piramide", parent: P.id, n: P.pyrAdds, coin: c, strat: P.strat, side: P.side, lev: P.lev, entry: px, qty, margin: qty * px / P.lev,
      riskAmt: Math.max(qty * Math.abs(px - stop), 1e-9), sl: stop, tp: 0, liq: P.side > 0 ? 0 : 1e12,   // la liquidazione è quella della posizione intera (sempre oltre lo stop delle aggiunte)
      slD: Math.abs(px - stop), best: px, trD: 0, beDone: false, ex: {}, opened: C.t[i + 1], feeIn: qty * px * fIn };
    B.positions.push(ad);
    for (const x of B.positions) if (x.by === "piramide" && x.parent === P.id) x.sl = stop;   // stop comune
  }
}

/* Prova sul passato su più monete: conto unico, una posizione per moneta.
   data = { BTC: C, ETH: C, ... } (candele 15m), extras = { BTC: { volPct, daily }, ... } facoltativo */
function backtestMulti(data, strats, opt, extras) {
  const o = Object.assign({}, DEFAULTS, { feesOn: true, fundingOn: true }, opt || {});
  const coins = Object.keys(data), S = {}, idx = {};
  for (const c of coins) { S[c] = buildSignals(data[c], strats, extras && extras[c]); idx[c] = 0; }
  const fromT = o.fromT || Math.max(...coins.map(c => data[c].t[Math.min(900, Math.floor(data[c].t.length / 4))]));
  const toT = Math.max(...coins.map(c => data[c].t[data[c].t.length - 1]));
  for (const c of coins) { const k = data[c].t.findIndex(t => t >= fromT); idx[c] = k < 0 ? data[c].t.length : k; }
  const RM = o.volTarget ? Object.fromEntries(coins.map(c => [c, riskMult(data[c])])) : null;
  const B = newBook(o.start || 100); let peak = B.balance, mdd = 0; const curve = [];
  const sById = Object.fromEntries(strats.map(s => [s.id, s]));
  const needR = o.rs || strats.some(s => s.smart);
  const rsD = needR ? Object.fromEntries(coins.map(c => [c, (extras && extras[c] && extras[c].daily) || E.resample(data[c], 96).C])) : null;
  const btcD = (rsD && rsD.BTC) || o.btcDaily || (extras && extras.BTC && extras.BTC.daily) || null;
  const PY = o.pyr || null; const LP = {}; const curveM = []; let pkM = o.start || 100, mddM = 0, expM = 0;
  let lastD = -1; const pend = []; const LE = o.limitEntry; const stats = { sig: 0, filled: 0, fallback: 0, missed: 0, sameBarStop: 0 };
  for (;;) {
    let t = Infinity; for (const c of coins) if (idx[c] < data[c].t.length) t = Math.min(t, data[c].t[idx[c]]);
    if (t === Infinity) break;
    const here = coins.filter(c => idx[c] < data[c].t.length && data[c].t[idx[c]] === t);
    for (const c of here) {
      const C = data[c], i = idx[c], bar = { t: C.t[i], o: C.o[i], h: C.h[i], l: C.l[i], c: C.c[i] };
      for (const pos of B.positions.filter(p => (p.coin || "BTC") === c)) manageOnBar(B, pos, bar, S[c][pos.strat] ? S[c][pos.strat].raw[i] : 0, o);
      if (PY) pyrBar(B, c, C, i, o, PY);
    }
    // Entrata con ordine limite: l'ordine conta solo se il prezzo lo attraversa (coda davanti); scaduta l'attesa, piano B a mercato
    if (LE) for (const c of here) {
      const C = data[c], i = idx[c];
      for (const p of pend.filter(p => p.coin === c)) {
        if (i <= p.i0) continue;
        const L = p.side > 0, hit = L ? C.l[i] < p.lim * (1 - LE.q) : C.h[i] > p.lim * (1 + LE.q);
        if (hit) {
          pend.splice(pend.indexOf(p), 1);
          const pos = openAuto(B, p.s, p.side, p.lim, p.atr, C.t[i], Object.assign({}, o, { coin: c, slip: 0, feeIn: LE.maker }, p.extra));
          if (pos && typeof pos === "object") { stats.filled++; pos.limit = true;
            if (L ? C.l[i] <= pos.sl : C.h[i] >= pos.sl) { stats.sameBarStop++; closePos(B, pos, pos.sl * (1 - pos.side * o.slip), C.t[i] + 900000, "Stop loss", o); } }
        } else if (i - p.i0 >= LE.wait) {
          pend.splice(pend.indexOf(p), 1);
          if (LE.fallback && i + 1 < C.t.length) { const pos = openAuto(B, p.s, p.side, C.o[i + 1], p.atr, C.t[i + 1], Object.assign({}, o, { coin: c }, p.extra)); if (pos && typeof pos === "object") stats.fallback++; }
          else stats.missed++;
        }
      }
    }
    if (B.balance > peak) peak = B.balance; const dd = (peak - B.balance) / peak; if (dd > mdd) mdd = dd;
    // solo per le prove: discesa del conto marcato a mercato ed esposizione massima
    if (o.mtm) { for (const c of here) LP[c] = data[c].c[idx[c]]; const eq = equity(B, LP); if (eq > pkM) pkM = eq; const d2 = (pkM - eq) / pkM; if (d2 > mddM) mddM = d2; const ex = B.positions.reduce((a, p) => a + p.qty * (LP[p.coin] || p.entry), 0) / eq; if (ex > expM) expM = ex; }
    for (const c of here) {
      const C = data[c], i = idx[c]; if (i + 1 >= C.t.length) continue;
      let rk = null;
      for (const s of strats) { const x = S[c][s.id]; if (!x.sig[i] || isNaN(x.A[i])) continue;
        if (o.gate && o.gate(c, s, C.t[i] + 900000, x.sig[i], B)) continue;   // filtro di entrata (modalità ribasso)
        if (s.noRs) {} else if (s.smart) { if (!rk) rk = rsRanks(rsD, C.t[i] + 900000, RS.lbs); if (smartShortReason(rk, c, btcD, C.t[i] + 900000)) continue; }
        else if (o.rs) { if (!rk) rk = rsRanks(rsD, C.t[i] + 900000, o.rs.lbs); if (rk[c] >= o.rs.top) continue; }
        if (LE) { if (B.positions.some(p => (p.coin || "BTC") === c) || pend.some(p => p.coin === c)) continue;
          if (B.positions.filter(p => p.by === "bot").length >= o.maxPos) continue;
          stats.sig++; pend.push({ coin: c, s: sById[s.id], side: x.sig[i], lim: C.c[i] * (1 - x.sig[i] * (LE.off || 0)), atr: x.A[i], i0: i, extra: Object.assign(RM ? { risk: o.risk * RM[c][i] } : {}, o.coinMul ? { mul: o.coinMul(c, C.t[i] + 900000, s, x.sig[i], B) } : {}) }); continue; }
        let MM = 1; if (o.coinMul) { MM = o.coinMul(c, C.t[i] + 900000, s, x.sig[i], B); if (!(MM > 0)) continue; }
        openAuto(B, sById[s.id], x.sig[i], C.o[i + 1], x.A[i], C.t[i + 1], Object.assign({}, o, { coin: c, mul: MM }, RM ? { risk: o.risk * RM[c][i] } : {})); }
    }
    for (const c of here) idx[c]++;
    const day = Math.floor(t / 86400000); if (day !== lastD) { curve.push([t, B.balance]); if (o.mtm) curveM.push([t, equity(B, LP)]); lastD = day; }
  }
  for (const pos of [...B.positions]) { const C = data[pos.coin || "BTC"]; closePos(B, pos, C.c[C.c.length - 1], C.t[C.t.length - 1] + 900000, "Fine dati", o); }
  curve.push([toT, B.balance]);
  if (o.mtm) curveM.push([toT, B.balance]);
  return { book: B, mdd, mddMtm: o.mtm ? mddM : null, expMax: o.mtm ? expM : null, curve, curveM: o.mtm ? curveM : null, from: fromT, to: toT, stats: LE ? stats : null };
}

const API = { HYB, capRule, PYR, pyrLevels, pyrStop, pyrDue, LIMIT, PRESET, presetLabel, adaptRisk, openRisk, RS, rsRanks, btcDown, smartShortReason, backtestMulti, closePart, STRATEGIES, BEST, DEFAULTS, buildSignals, volPct, dailyTrend, riskMult, newBook, closePos, manageOnBar, manageOnTick, openAuto, openManual, unrealized, equity, backtest };
if (typeof module !== "undefined") module.exports = API; else root.Core = API;
})(typeof window !== "undefined" ? window : this);

