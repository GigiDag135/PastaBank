// GoldSilver: strategie, configurazione condivisa tra bot (server) e banco prova (browser),
// codice per "applica al bot" e regole di gestione delle posizioni a ogni candela chiusa.
// Le regole sono le stesse di Engine.backtest: stop e obiettivo li tiene l'exchange,
// a ogni chiusura da 15 minuti il bot controlla tempo massimo, segnale opposto, trailing e pareggio.
(function (root) {
"use strict";
const E = root.Engine || (typeof require !== "undefined" ? require("./engine.js") : null);

/* Mercati: segnali sui dati Dukascopy, ordini su Hyperliquid */
const MARKETS = {
  SILVER: { name: "Argento", duka: "XAG/USD", coin: "xyz:SILVER", dex: "xyz", feeDefault: 0.00009, maxLev: 25 },
  GOLD: { name: "Oro", duka: "XAU/USD", coin: "PAXG", dex: "", feeDefault: 0.00045, maxLev: 10 },
};
const TF_NAMES = { 1: "15 min", 2: "30 min", 4: "1 ora", 8: "2 ore", 16: "4 ore", 32: "8 ore" };

/* Configurazione migliore trovata dalla ricerca (research 022 e 023, 2 nov 2026) */
const BEST = {
  v: 1, risk: 0.01,
  strats: [
    { id: "ag4h", name: "Argento · Squeeze 4 ore", on: true, mkt: "SILVER", key: "squeeze", f: 16, p: { n: 30, k: 2, q: 0.15, look: 200, tf: 0 }, dir: "L", ex: { sl: 2, opp: 1, bars: 192 } },
    { id: "ag1h", name: "Argento · Squeeze 1 ora", on: true, mkt: "SILVER", key: "squeeze", f: 4, p: { n: 30, k: 2, q: 0.15, look: 200, tf: 800 }, dir: "L", ex: { sl: 2, opp: 1, bars: 192 } },
    { id: "au4h", name: "Oro · Donchian 4 ore", on: true, mkt: "GOLD", key: "donchian", f: 16, p: { n: 96, adx: 0, tf: 0 }, dir: "L", ex: { sl: 2, tr: 6 } },
  ],
};
const COSTS = { slip: 0.0002, fundingPer8h: 0.0001, mmr: 0.0125 };

/* ---------- validazione ---------- */
const num = (v, lo, hi) => typeof v === "number" && isFinite(v) && v >= lo && v <= hi;
function validate(cfg) {
  const err = [];
  if (!cfg || typeof cfg !== "object") return ["configurazione vuota"];
  if (!num(cfg.risk, 0.001, 0.03)) err.push("rischio fuori dai limiti (0,1% - 3%)");
  if (!Array.isArray(cfg.strats) || !cfg.strats.length || cfg.strats.length > 8) err.push("servono da 1 a 8 strategie");
  const ids = new Set();
  for (const s of cfg.strats || []) {
    const nm = s && s.name ? s.name : "?";
    if (!s || typeof s.id !== "string" || !/^[a-z0-9]{2,12}$/.test(s.id) || ids.has(s.id)) { err.push(`${nm}: codice strategia non valido o doppio`); continue; }
    ids.add(s.id);
    if (typeof s.name !== "string" || s.name.length > 60) err.push(`${s.id}: nome non valido`);
    if (!MARKETS[s.mkt]) err.push(`${s.id}: mercato sconosciuto`);
    if (!E.STRATS[s.key]) { err.push(`${s.id}: famiglia sconosciuta`); continue; }
    if (![1, 2, 4, 8, 16, 32].includes(s.f)) err.push(`${s.id}: timeframe non valido`);
    if (!["L", "S", "B"].includes(s.dir)) err.push(`${s.id}: direzione non valida`);
    const keys = Object.keys(E.STRATS[s.key].grid);
    if (!s.p || typeof s.p !== "object") err.push(`${s.id}: parametri mancanti`);
    else for (const k of keys) if (!num(s.p[k], -10, 5000)) err.push(`${s.id}: parametro ${k} non valido`);
    const x = s.ex || {};
    if (!num(x.sl, 0.3, 8)) err.push(`${s.id}: stop fuori dai limiti (0,3 - 8 ATR)`);
    for (const [k, lo, hi] of [["rr", 0, 20], ["tr", 0, 20], ["bars", 0, 5000], ["be", 0, 10], ["opp", 0, 1]]) if (x[k] != null && !num(x[k], lo, hi)) err.push(`${s.id}: uscita ${k} non valida`);
    if (typeof s.on !== "boolean") err.push(`${s.id}: acceso/spento mancante`);
  }
  return err;
}
function clean(cfg) {
  return { v: cfg.v || 1, risk: cfg.risk, strats: cfg.strats.map(s => ({ id: s.id, name: s.name, on: !!s.on, mkt: s.mkt, key: s.key, f: s.f, dir: s.dir,
    p: Object.fromEntries(Object.keys(E.STRATS[s.key].grid).map(k => [k, s.p[k]])),
    ex: Object.fromEntries(Object.entries(s.ex).filter(([k, v]) => ["sl", "rr", "tr", "bars", "be", "opp"].includes(k) && v)) })) };
}

/* ---------- codice per "applica al bot" ---------- */
function fnv(s) { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, "0"); }
const b64e = s => (typeof Buffer !== "undefined" ? Buffer.from(s, "utf8").toString("base64") : btoa(unescape(encodeURIComponent(s)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64d = s => { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; return typeof Buffer !== "undefined" ? Buffer.from(s, "base64").toString("utf8") : decodeURIComponent(escape(atob(s))); };
function encode(cfg) { const j = JSON.stringify(clean(cfg)); return "GS1." + b64e(j) + "." + fnv(j); }
function decode(code) {
  const m = /^GS1\.([A-Za-z0-9_-]+)\.([0-9a-f]{8})$/.exec(String(code || "").trim());
  if (!m) throw new Error("codice non riconosciuto (deve iniziare con GS1.)");
  const j = b64d(m[1]); if (fnv(j) !== m[2]) throw new Error("codice incompleto o modificato (controllo non valido)");
  const cfg = JSON.parse(j), e = validate(cfg); if (e.length) throw new Error(e.join("; "));
  return clean(cfg);
}

/* ---------- segnali ---------- */
// C = candele 15 min (solo candele chiuse). Restituisce per ogni strategia { sig, raw, A }
function signals(C, strats) {
  const out = {}, tfs = {};
  for (const s of strats) {
    const T = tfs[s.f] || (tfs[s.f] = E.makeTF(C, s.f));
    const raw = T.expandSig(E.STRATS[s.key].signal(T.K, s.p)), A = T.A(14), N = raw.length, sig = new Int8Array(N);
    for (let i = 0; i < N; i++) { const d = raw[i]; if (d && (s.dir === "B" || (s.dir === "L" && d > 0) || (s.dir === "S" && d < 0))) sig[i] = d; }
    out[s.id] = { sig, raw, A };
  }
  return out;
}

/* ---------- dimensione della posizione (come Engine.backtest) ---------- */
// slPct = distanza dello stop in % del prezzo; equity e risk del conto; fee della singola operazione
function sizing(equity, risk, slPct, fee, maxLev) {
  const lev = Math.max(1, Math.min(maxLev, Math.floor(1 / (slPct * 1.5 + COSTS.mmr))));
  const riskAmt = equity * risk;
  let notional = riskAmt / (slPct + 2 * fee + COSTS.slip);
  if (notional / lev > equity * 0.95) notional = equity * 0.95 * lev;
  return { lev, riskAmt, notional };
}

/* ---------- gestione a ogni candela chiusa ---------- */
// P: posizione { side, entry, sl, slPct0, trPct (trailing in % del prezzo d'ingresso), ex, bars, best, beDone }
// bar: { h, l, c } già in prezzi dell'exchange; rawSig: segnale grezzo della strategia su questa candela
// Restituisce { close: motivo } oppure { sl: nuovo stop } oppure {}
function onBarClose(P, bar, rawSig, fees) {
  const ex = P.ex || {}, L = P.side > 0;
  P.bars = (P.bars || 0) + 1;
  if (ex.bars && P.bars >= ex.bars) return { close: "Tempo massimo" };
  if (ex.opp && rawSig === -P.side) return { close: "Segnale opposto" };
  let sl = P.sl;
  if (ex.tr) {
    const trD = P.trPct * P.entry;   // distanza fissa fissata all'ingresso, come in Engine.backtest
    if (L) { if (bar.h > P.best) P.best = bar.h; const n = P.best - trD; if (n > sl) sl = n; }
    else { if (bar.l < P.best) P.best = bar.l; const n = P.best + trD; if (n < sl) sl = n; }
  }
  if (ex.be && !P.beDone && (L ? bar.h >= P.entry * (1 + ex.be * P.slPct0) : bar.l <= P.entry * (1 - ex.be * P.slPct0))) {
    P.beDone = true; const b = P.entry * (1 + P.side * 2 * (fees || 0)); if (L ? b > sl : b < sl) sl = b;
  }
  return sl !== P.sl ? { sl } : {};
}

const API = { MARKETS, TF_NAMES, BEST, COSTS, validate, clean, encode, decode, fnv, signals, sizing, onBarClose };
if (typeof module !== "undefined") module.exports = API; else root.GS = API;
})(typeof window !== "undefined" ? window : this);
