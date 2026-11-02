// Motore di backtest condiviso (Node + browser).
// Candele: oggetto {t,o,h,l,c,v} di Float64Array.
(function (root) {
"use strict";

/* ===================== indicatori ===================== */
function ema(a, n) {
  const o = new Float64Array(a.length), k = 2 / (n + 1);
  o[0] = a[0];
  for (let i = 1; i < a.length; i++) o[i] = a[i] * k + o[i - 1] * (1 - k);
  return o;
}
function sma(a, n) {
  const o = new Float64Array(a.length).fill(NaN); let s = 0;
  for (let i = 0; i < a.length; i++) { s += a[i]; if (i >= n) s -= a[i - n]; if (i >= n - 1) o[i] = s / n; }
  return o;
}
function stdev(a, n) {
  const o = new Float64Array(a.length).fill(NaN); let s = 0, q = 0;
  for (let i = 0; i < a.length; i++) {
    s += a[i]; q += a[i] * a[i];
    if (i >= n) { s -= a[i - n]; q -= a[i - n] * a[i - n]; }
    if (i >= n - 1) { const m = s / n; o[i] = Math.sqrt(Math.max(0, q / n - m * m)); }
  }
  return o;
}
function atr(C, n) {
  const N = C.c.length, o = new Float64Array(N).fill(NaN); let a = 0;
  for (let i = 1; i < N; i++) {
    const tr = Math.max(C.h[i] - C.l[i], Math.abs(C.h[i] - C.c[i - 1]), Math.abs(C.l[i] - C.c[i - 1]));
    if (i <= n) { a += tr; if (i === n) { a /= n; o[i] = a; } }
    else { a = (a * (n - 1) + tr) / n; o[i] = a; }
  }
  return o;
}
function rsi(c, n) {
  const N = c.length, o = new Float64Array(N).fill(NaN); let g = 0, l = 0;
  for (let i = 1; i < N; i++) {
    const d = c[i] - c[i - 1], up = Math.max(d, 0), dn = Math.max(-d, 0);
    if (i <= n) { g += up; l += dn; if (i === n) { g /= n; l /= n; o[i] = l === 0 ? 100 : 100 - 100 / (1 + g / l); } }
    else { g = (g * (n - 1) + up) / n; l = (l * (n - 1) + dn) / n; o[i] = l === 0 ? 100 : 100 - 100 / (1 + g / l); }
  }
  return o;
}
function adx(C, n) {
  const N = C.c.length, o = new Float64Array(N).fill(NaN);
  let tr = 0, pd = 0, md = 0, ax = 0, cnt = 0;
  for (let i = 1; i < N; i++) {
    const up = C.h[i] - C.h[i - 1], dn = C.l[i - 1] - C.l[i];
    const p = up > dn && up > 0 ? up : 0, m = dn > up && dn > 0 ? dn : 0;
    const t = Math.max(C.h[i] - C.l[i], Math.abs(C.h[i] - C.c[i - 1]), Math.abs(C.l[i] - C.c[i - 1]));
    if (i <= n) { tr += t; pd += p; md += m; continue; }
    tr = tr - tr / n + t; pd = pd - pd / n + p; md = md - md / n + m;
    const pdi = 100 * pd / tr, mdi = 100 * md / tr, dx = 100 * Math.abs(pdi - mdi) / Math.max(1e-9, pdi + mdi);
    cnt++;
    if (cnt <= n) { ax += dx; if (cnt === n) { ax /= n; o[i] = ax; } }
    else { ax = (ax * (n - 1) + dx) / n; o[i] = ax; }
  }
  return o;
}
function di(C, n) {
  const N = C.c.length, P = new Float64Array(N).fill(NaN), M = new Float64Array(N).fill(NaN);
  let tr = 0, pd = 0, md = 0;
  for (let i = 1; i < N; i++) {
    const up = C.h[i] - C.h[i - 1], dn = C.l[i - 1] - C.l[i];
    const p = up > dn && up > 0 ? up : 0, m = dn > up && dn > 0 ? dn : 0;
    const t = Math.max(C.h[i] - C.l[i], Math.abs(C.h[i] - C.c[i - 1]), Math.abs(C.l[i] - C.c[i - 1]));
    if (i <= n) { tr += t; pd += p; md += m; continue; }
    tr = tr - tr / n + t; pd = pd - pd / n + p; md = md - md / n + m;
    P[i] = 100 * pd / tr; M[i] = 100 * md / tr;
  }
  return { p: P, m: M };
}
function hhv(a, n) { // massimo delle n candele PRECEDENTI (esclusa la corrente)
  const N = a.length, o = new Float64Array(N).fill(NaN);
  for (let i = n; i < N; i++) { let m = -Infinity; for (let j = i - n; j < i; j++) if (a[j] > m) m = a[j]; o[i] = m; }
  return o;
}
function llv(a, n) {
  const N = a.length, o = new Float64Array(N).fill(NaN);
  for (let i = n; i < N; i++) { let m = Infinity; for (let j = i - n; j < i; j++) if (a[j] < m) m = a[j]; o[i] = m; }
  return o;
}
function supertrend(C, n, mult) {
  const N = C.c.length, A = atr(C, n), dir = new Int8Array(N);
  let ub = 0, lb = 0, d = 1;
  for (let i = 0; i < N; i++) {
    if (isNaN(A[i])) { dir[i] = 0; continue; }
    const m = (C.h[i] + C.l[i]) / 2, u = m + mult * A[i], l = m - mult * A[i];
    ub = (u < ub || C.c[i - 1] > ub) ? u : ub;
    lb = (l > lb || C.c[i - 1] < lb) ? l : lb;
    if (d === 1 && C.c[i] < lb) d = -1; else if (d === -1 && C.c[i] > ub) d = 1;
    dir[i] = d;
  }
  return dir;
}

/* cache indicatori */
function makeCache(C) {
  const m = new Map();
  const get = (k, f) => { if (!m.has(k)) m.set(k, f()); return m.get(k); };
  return {
    C,
    ema: n => get("ema" + n, () => ema(C.c, n)),
    sma: n => get("sma" + n, () => sma(C.c, n)),
    std: n => get("std" + n, () => stdev(C.c, n)),
    atr: n => get("atr" + n, () => atr(C, n)),
    rsi: n => get("rsi" + n, () => rsi(C.c, n)),
    adx: n => get("adx" + n, () => adx(C, n)),
    hh: n => get("hh" + n, () => hhv(C.h, n)),
    ll: n => get("ll" + n, () => llv(C.l, n)),
    st: (n, k) => get("st" + n + "_" + k, () => supertrend(C, n, k)),
    volSma: n => get("vs" + n, () => sma(C.v, n)),
    di: n => get("di" + n, () => di(C, n)),
    hour: () => get("hour", () => { const o = new Int8Array(C.t.length); for (let i = 0; i < o.length; i++) o[i] = new Date(C.t[i]).getUTCHours(); return o; }),
  };
}

/* ===================== strategie (segnali a chiusura candela) ===================== */
// filtro di tendenza: 0 nessuno, oppure periodo EMA lunga: long solo sopra, short solo sotto
function trendOk(K, i, side, tf) { if (!tf) return true; const e = K.ema(tf)[i]; return side > 0 ? K.C.c[i] > e : K.C.c[i] < e; }

const STRATS = {
  // 1. Incrocio di medie con filtro ADX
  emaCross: {
    name: "Trend · incrocio medie",
    family: "trend",
    grid: { f: [9, 20], s: [50, 100, 200], adx: [0, 20, 25], tf: [0, 800] },
    signal(K, p) {
      const C = K.C, N = C.c.length, a = K.ema(p.f), b = K.ema(p.s), x = p.adx ? K.adx(14) : null, s = new Int8Array(N);
      for (let i = 1; i < N; i++) {
        if (x && !(x[i] >= p.adx)) continue;
        if (a[i] > b[i] && a[i - 1] <= b[i - 1] && trendOk(K, i, 1, p.tf)) s[i] = 1;
        else if (a[i] < b[i] && a[i - 1] >= b[i - 1] && trendOk(K, i, -1, p.tf)) s[i] = -1;
      }
      return s;
    },
  },
  // 2. Rottura canale di Donchian
  donchian: {
    name: "Breakout · canale Donchian",
    family: "breakout",
    grid: { n: [20, 48, 96, 192], adx: [0, 20], tf: [0, 400, 800] },
    signal(K, p) {
      const C = K.C, N = C.c.length, H = K.hh(p.n), L = K.ll(p.n), x = p.adx ? K.adx(14) : null, s = new Int8Array(N);
      for (let i = 1; i < N; i++) {
        if (x && !(x[i] >= p.adx)) continue;
        if (C.c[i] > H[i] && C.c[i - 1] <= H[i - 1] && trendOk(K, i, 1, p.tf)) s[i] = 1;
        else if (C.c[i] < L[i] && C.c[i - 1] >= L[i - 1] && trendOk(K, i, -1, p.tf)) s[i] = -1;
      }
      return s;
    },
  },
  // 3. Squeeze: bande strette poi esplosione
  squeeze: {
    name: "Breakout · squeeze di volatilità",
    family: "breakout",
    grid: { n: [20, 30, 40], k: [1.5, 2, 2.5], q: [0.1, 0.15, 0.25], look: [200, 500], tf: [0, 800] },
    signal(K, p) {
      const C = K.C, N = C.c.length, m = K.sma(p.n), sd = K.std(p.n), s = new Int8Array(N);
      const w = new Float64Array(N); for (let i = 0; i < N; i++) w[i] = sd[i] / m[i];
      for (let i = p.look + p.n; i < N; i++) {
        // la larghezza poco prima era tra le più basse del periodo
        const ref = w[i - 1]; let below = 0, tot = 0;
        for (let j = i - p.look; j < i; j += 4) { tot++; if (w[j] < ref) below++; }
        if (below / tot > p.q) continue;
        const up = m[i] + p.k * sd[i], dn = m[i] - p.k * sd[i];
        if (C.c[i] > up && trendOk(K, i, 1, p.tf)) s[i] = 1;
        else if (C.c[i] < dn && trendOk(K, i, -1, p.tf)) s[i] = -1;
      }
      return s;
    },
  },
  // 4. Supertrend: cambio di direzione
  supertrend: {
    name: "Trend · Supertrend",
    family: "trend",
    grid: { n: [10, 14, 20], k: [2, 3, 4], tf: [0, 800], adx: [0, 20] },
    signal(K, p) {
      const C = K.C, N = C.c.length, d = K.st(p.n, p.k), x = p.adx ? K.adx(14) : null, s = new Int8Array(N);
      for (let i = 1; i < N; i++) {
        if (x && !(x[i] >= p.adx)) continue;
        if (d[i] === 1 && d[i - 1] === -1 && trendOk(K, i, 1, p.tf)) s[i] = 1;
        else if (d[i] === -1 && d[i - 1] === 1 && trendOk(K, i, -1, p.tf)) s[i] = -1;
      }
      return s;
    },
  },
  // 5. Rimbalzo Bollinger + RSI
  bbRsi: {
    name: "Rimbalzo · Bollinger + RSI",
    family: "reversion",
    grid: { n: [20, 40], k: [2, 2.5, 3], r: [14], lo: [25, 30], adxMax: [0, 25], tf: [0, 800] },
    signal(K, p) {
      const C = K.C, N = C.c.length, m = K.sma(p.n), sd = K.std(p.n), R = K.rsi(p.r), x = p.adxMax ? K.adx(14) : null, s = new Int8Array(N);
      for (let i = 1; i < N; i++) {
        if (x && !(x[i] <= p.adxMax)) continue;
        if (C.c[i] < m[i] - p.k * sd[i] && R[i] < p.lo && trendOk(K, i, 1, p.tf)) s[i] = 1;
        else if (C.c[i] > m[i] + p.k * sd[i] && R[i] > 100 - p.lo && trendOk(K, i, -1, p.tf)) s[i] = -1;
      }
      return s;
    },
  },
  // 6. RSI(2) di Connors: ritracciamento dentro il trend
  rsi2: {
    name: "Rimbalzo · RSI(2) nel trend",
    family: "reversion",
    grid: { r: [2, 3, 4], lo: [5, 10, 15, 20], tf: [0, 200, 400, 800] },
    signal(K, p) {
      const C = K.C, N = C.c.length, R = K.rsi(p.r), s = new Int8Array(N);
      for (let i = 1; i < N; i++) {
        if (R[i] < p.lo && R[i - 1] >= p.lo && trendOk(K, i, 1, p.tf)) s[i] = 1;
        else if (R[i] > 100 - p.lo && R[i - 1] <= 100 - p.lo && trendOk(K, i, -1, p.tf)) s[i] = -1;
      }
      return s;
    },
  },
  // 7. Pullback su EMA nel trend
  pullback: {
    name: "Trend · ritorno sulla media",
    family: "trend",
    grid: { f: [20, 50], tf: [200, 400, 800], adx: [0, 20, 25] },
    signal(K, p) {
      const C = K.C, N = C.c.length, e = K.ema(p.f), T = K.ema(p.tf), x = p.adx ? K.adx(14) : null, s = new Int8Array(N);
      for (let i = 1; i < N; i++) {
        if (x && !(x[i] >= p.adx)) continue;
        // in trend rialzista: il minimo tocca la media e la candela chiude sopra
        if (e[i] > T[i] && C.l[i] <= e[i] && C.c[i] > e[i] && C.c[i - 1] > e[i - 1]) s[i] = 1;
        else if (e[i] < T[i] && C.h[i] >= e[i] && C.c[i] < e[i] && C.c[i - 1] < e[i - 1]) s[i] = -1;
      }
      return s;
    },
  },
  // 8. Rottura del range notturno (00-07 UTC) durante la sessione europea/USA
  session: {
    name: "Breakout · range della notte",
    family: "breakout",
    grid: { from: [7, 8, 13], to: [12, 16, 20], tf: [0, 800] },
    signal(K, p) {
      const C = K.C, N = C.c.length, hr = K.hour(), s = new Int8Array(N);
      let hi = -Infinity, lo = Infinity, day = -1, used = false;
      for (let i = 1; i < N; i++) {
        const d = Math.floor(C.t[i] / 86400000);
        if (d !== day) { day = d; hi = -Infinity; lo = Infinity; used = false; }
        const h = hr[i];
        if (h < 7) { hi = Math.max(hi, C.h[i]); lo = Math.min(lo, C.l[i]); continue; }
        if (used || h < p.from || h >= p.to || !isFinite(hi)) continue;
        if (C.c[i] > hi && trendOk(K, i, 1, p.tf)) { s[i] = 1; used = true; }
        else if (C.c[i] < lo && trendOk(K, i, -1, p.tf)) { s[i] = -1; used = true; }
      }
      return s;
    },
  },
  // 9. MACD sopra/sotto zero con filtro trend
  macd: {
    name: "Trend · MACD",
    family: "trend",
    grid: { f: [12], s: [26, 52], g: [9], tf: [0, 400, 800], zero: [0, 1] },
    signal(K, p) {
      const C = K.C, N = C.c.length, a = K.ema(p.f), b = K.ema(p.s);
      const m = new Float64Array(N); for (let i = 0; i < N; i++) m[i] = a[i] - b[i];
      const sg = ema(m, p.g), s = new Int8Array(N);
      for (let i = 1; i < N; i++) {
        const up = m[i] > sg[i] && m[i - 1] <= sg[i - 1], dn = m[i] < sg[i] && m[i - 1] >= sg[i - 1];
        if (up && (!p.zero || m[i] < 0) && trendOk(K, i, 1, p.tf)) s[i] = 1;
        else if (dn && (!p.zero || m[i] > 0) && trendOk(K, i, -1, p.tf)) s[i] = -1;
      }
      return s;
    },
  },
  // 10. Rottura del canale di Keltner (media ± k·ATR)
  keltner: {
    name: "Breakout · canale di Keltner",
    family: "breakout",
    grid: { n: [20, 50], k: [1.5, 2, 2.5, 3], tf: [0, 800] },
    signal(K, p) {
      const C = K.C, N = C.c.length, e = K.ema(p.n), A = K.atr(p.n), s = new Int8Array(N);
      for (let i = 1; i < N; i++) {
        const up = e[i] + p.k * A[i], dn = e[i] - p.k * A[i], up1 = e[i - 1] + p.k * A[i - 1], dn1 = e[i - 1] - p.k * A[i - 1];
        if (C.c[i] > up && C.c[i - 1] <= up1 && trendOk(K, i, 1, p.tf)) s[i] = 1;
        else if (C.c[i] < dn && C.c[i - 1] >= dn1 && trendOk(K, i, -1, p.tf)) s[i] = -1;
      }
      return s;
    },
  },
  // 11. Momentum: movimento di n candele più grande di th volte l'ATR
  momentum: {
    name: "Trend · spinta di momentum",
    family: "trend",
    grid: { n: [6, 12, 24, 48], th: [2, 3, 4, 6], tf: [0, 800] },
    signal(K, p) {
      const C = K.C, N = C.c.length, A = K.atr(14), s = new Int8Array(N);
      for (let i = p.n + 1; i < N; i++) {
        const m = (C.c[i] - C.c[i - p.n]) / A[i], m1 = (C.c[i - 1] - C.c[i - 1 - p.n]) / A[i - 1];
        if (m > p.th && m1 <= p.th && trendOk(K, i, 1, p.tf)) s[i] = 1;
        else if (m < -p.th && m1 >= -p.th && trendOk(K, i, -1, p.tf)) s[i] = -1;
      }
      return s;
    },
  },
  // 12. Z-score: prezzo molto lontano dalla media, rientro dentro il trend
  zscore: {
    name: "Rimbalzo · distanza dalla media (z-score)",
    family: "reversion",
    grid: { n: [20, 50, 100], z: [2, 2.5, 3], tf: [0, 200, 400, 800] },
    signal(K, p) {
      const C = K.C, N = C.c.length, m = K.sma(p.n), sd = K.std(p.n), s = new Int8Array(N);
      for (let i = 1; i < N; i++) {
        const z = (C.c[i] - m[i]) / sd[i], z1 = (C.c[i - 1] - m[i - 1]) / sd[i - 1];
        // entra quando torna dentro la soglia (il colpo è finito)
        if (z1 < -p.z && z >= -p.z && trendOk(K, i, 1, p.tf)) s[i] = 1;
        else if (z1 > p.z && z <= p.z && trendOk(K, i, -1, p.tf)) s[i] = -1;
      }
      return s;
    },
  },
  // 13. Picco di volume: candela enorme con volume altissimo (segui o contrasta)
  volspike: {
    name: "Volume · candela con volume anomalo",
    family: "volume",
    grid: { m: [2, 3, 4], k: [1.5, 2.5], mode: [1, -1], tf: [0, 800] },
    signal(K, p) {
      const C = K.C, N = C.c.length, A = K.atr(14), s = new Int8Array(N);
      const vs = K.volSma(50);
      for (let i = 1; i < N; i++) {
        if (!(C.v[i] > p.m * vs[i]) || C.h[i] - C.l[i] < p.k * A[i - 1]) continue;
        const d = (C.c[i] > C.o[i] ? 1 : -1) * p.mode;
        if (trendOk(K, i, d, p.tf)) s[i] = d;
      }
      return s;
    },
  },
  // 14. Incrocio delle direzionali +DI/-DI con ADX forte
  diCross: {
    name: "Trend · direzionali DI con ADX",
    family: "trend",
    grid: { n: [14, 28], adx: [0, 20, 25, 30], tf: [0, 800] },
    signal(K, p) {
      const C = K.C, N = C.c.length, D = K.di(p.n), x = K.adx(p.n), s = new Int8Array(N);
      for (let i = 1; i < N; i++) {
        if (p.adx && !(x[i] >= p.adx)) continue;
        if (D.p[i] > D.m[i] && D.p[i - 1] <= D.m[i - 1] && trendOk(K, i, 1, p.tf)) s[i] = 1;
        else if (D.p[i] < D.m[i] && D.p[i - 1] >= D.m[i - 1] && trendOk(K, i, -1, p.tf)) s[i] = -1;
      }
      return s;
    },
  },
};

/* ===================== uscite ===================== */
// type: fixed (SL+TP), trail (SL che segue), opposite (SL + segnale opposto), time (SL + tempo max)
const EXITS = [];
// campi: sl (stop iniziale in ATR), rr (take profit in multipli dello stop), tr (trailing in ATR),
// opp (chiude al segnale opposto), bars (tempo massimo in candele 15m), be (stop a pareggio dopo +be R)
for (const sl of [1, 1.5, 2, 3]) for (const rr of [1, 2, 3, 5]) EXITS.push({ type: "fixed", sl, rr });
for (const sl of [1.5, 2, 3]) for (const tr of [2, 3, 4, 6]) EXITS.push({ type: "trail", sl, tr });
for (const sl of [1, 1.5, 2, 2.5, 3, 4]) EXITS.push({ type: "opposite", sl, opp: 1 });
for (const sl of [1.5, 2, 3]) for (const be of [1, 2]) EXITS.push({ type: "oppBE", sl, opp: 1, be });
for (const sl of [1.5, 2, 3]) for (const tr of [4, 6]) EXITS.push({ type: "oppTrail", sl, opp: 1, tr });
for (const sl of [1.5, 2, 3]) for (const bars of [96, 192, 384]) EXITS.push({ type: "oppTime", sl, opp: 1, bars });
for (const sl of [1.5, 2, 3]) for (const bars of [16, 64]) EXITS.push({ type: "time", sl, bars, rr: 3 });

function exitName(e) {
  const p = [`stop ${e.sl}×ATR`];
  if (e.rr) p.push(`obiettivo ${+(e.sl * e.rr).toFixed(1)}×ATR`);
  if (e.tr) p.push(`trailing ${e.tr}×ATR`);
  if (e.be) p.push(`stop a pareggio dopo +${e.be}R`);
  if (e.bars) p.push(`max ${e.bars / 4} h`);
  if (e.opp) p.push(`chiude al segnale opposto`);
  return p.join(" · ");
}

/* ===================== backtest ===================== */
const DEF = { fee: 0.00045, slip: 0.0001, fundingPer8h: 0.0001, mmr: 0.0125, maxLev: 40, risk: 0.05, equity: 1000, atrN: 14 };

function backtest(K, sig, ex, from, to, opt) {
  const o = Object.assign({}, DEF, opt || {}), C = K.C, A = o.A || K.atr(o.atrN);
  const feeIn = o.feeIn != null ? o.feeIn : o.fee, XS = o.exitSig || sig;
  let eq = o.equity, peak = eq, mdd = 0, trades = 0, wins = 0, gw = 0, gl = 0;
  let pos = 0, entry = 0, qty = 0, sl = 0, tp = 0, liq = 0, margin = 0, best = 0, trD = 0, eBar = 0, eFee = 0, riskAmt = 0, sumR = 0, slD0 = 0, beDone = false;
  const Rs = o.keepR ? [] : null;
  const list = o.keepTrades ? [] : null, monthly = o.monthly ? new Map() : null;
  const close = (px, i, why) => {
    const gross = qty * (px - entry) * pos;
    const hours = (i - eBar + 1) * 0.25;
    const fees = eFee + qty * px * o.fee + qty * entry * o.fundingPer8h * hours / 8;
    let pnl = gross - fees;
    if (why === "liq") pnl = -margin - eFee;
    eq += pnl; trades++;
    if (pnl > 0) { wins++; gw += pnl; } else gl -= pnl;
    const r = pnl / riskAmt; sumR += r; if (Rs) Rs.push([C.t[i], r]);
    if (list) list.push({ t: C.t[i], side: pos, entry, exit: px, pnl, r, why, bars: i - eBar + 1 });
    if (monthly) { const d = new Date(C.t[i]); const k = d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0"); monthly.set(k, (monthly.get(k) || 0) + pnl); }
    if (eq > peak) peak = eq; const dd = (peak - eq) / peak; if (dd > mdd) mdd = dd;
    pos = 0;
  };
  for (let i = Math.max(from, 1); i < to; i++) {
    if (pos) {
      const L = pos > 0, H = C.h[i], Lo = C.l[i], Op = C.o[i];
      // lo stop è sempre ben prima della liquidazione: si viene liquidati solo se il prezzo apre già oltre
      if (L ? Op <= liq : Op >= liq) { close(liq, i, "liq"); continue; }
      // stop (prima, per prudenza, se nella stessa candela si toccano entrambi)
      if (L ? Lo <= sl : H >= sl) { const px = L ? Math.min(sl, Op) : Math.max(sl, Op); close(px * (1 - pos * o.slip), i, "sl"); }
      else if (tp && (L ? H >= tp : Lo <= tp)) { const px = L ? Math.max(tp, Op) : Math.min(tp, Op); close(px, i, "tp"); }
      else if (ex.bars && i - eBar + 1 >= ex.bars) close(C.c[i] * (1 - pos * o.slip), i, "time");
      else if (ex.opp && XS[i] === -pos) close(C.c[i] * (1 - pos * o.slip), i, "opp");
      else {
        if (ex.tr) {
          if (L) { if (H > best) best = H; const n = best - trD; if (n > sl) sl = n; }
          else { if (Lo < best) best = Lo; const n = best + trD; if (n < sl) sl = n; }
        }
        if (ex.be && !beDone && (L ? H >= entry + ex.be * slD0 : Lo <= entry - ex.be * slD0)) {
          beDone = true; const b = entry * (1 + pos * (feeIn + o.fee)); if (L ? b > sl : b < sl) sl = b;
        }
      }
      if (!o.fixedRisk && eq <= o.equity * 0.02) break;
    }
    if (!pos && sig[i] !== 0 && i + 1 < to && !isNaN(A[i])) {
      const d = sig[i], px = C.o[i + 1] * (1 + d * (o.feeIn < o.fee ? 0 : o.slip)), slD = ex.sl * A[i];
      const slPct = slD / px;
      const lev = Math.max(1, Math.min(o.maxLev, Math.floor(1 / (slPct * 1.5 + o.mmr))));
      const base = o.fixedRisk ? o.equity : eq; riskAmt = base * o.risk;
      let notional = riskAmt / (slPct + feeIn + o.fee + o.slip);
      if (notional / lev > base * 0.95) notional = base * 0.95 * lev;
      pos = d; entry = px; qty = notional / px; margin = notional / lev;
      sl = px - d * slD; tp = ex.rr ? px + d * slD * ex.rr : 0; slD0 = slD; beDone = false;
      liq = px * (1 - d * (1 / lev - o.mmr)); best = px; trD = (ex.tr || 0) * A[i];
      eBar = i + 1; eFee = notional * feeIn;
    }
  }
  if (pos) close(C.c[to - 1], to - 1, "end");
  const days = (C.t[to - 1] - C.t[from]) / 86400000;
  return {
    ret: eq / o.equity - 1, eq, trades, wins, win: trades ? wins / trades : 0,
    pf: gl ? gw / gl : (gw ? 99 : 0), mdd, perDay: trades / days,
    avgWin: wins ? gw / wins : 0, avgLoss: trades - wins ? gl / (trades - wins) : 0,
    list, monthly, Rs, expR: trades ? sumR / trades : 0,
  };
}


/* ===================== multi-timeframe ===================== */
// raggruppa le candele 15m in candele da f*15 minuti allineate all'orario UTC
function resample(C, f) {
  const ms = f * 900000, N = C.t.length, idx = [];
  let cur = -1;
  const T = [], O = [], H = [], L = [], Cl = [], V = [], last = [];
  for (let i = 0; i < N; i++) {
    const b = Math.floor(C.t[i] / ms);
    if (b !== cur) { cur = b; T.push(b * ms); O.push(C.o[i]); H.push(C.h[i]); L.push(C.l[i]); Cl.push(C.c[i]); V.push(C.v[i]); last.push(i); }
    else { const j = T.length - 1; H[j] = Math.max(H[j], C.h[i]); L[j] = Math.min(L[j], C.l[i]); Cl[j] = C.c[i]; V[j] += C.v[i]; last[j] = i; }
  }
  const F = a => Float64Array.from(a);
  return { C: { t: F(T), o: F(O), h: F(H), l: F(L), c: F(Cl), v: F(V) }, last: Int32Array.from(last) };
}
// un "contesto" per timeframe: cache indicatori + mappa verso le candele 15m
function makeTF(C15, f) {
  if (f === 1) { const K = makeCache(C15); return { f, K, expandSig: s => s, A: n => K.atr(n) }; }
  const R = resample(C15, f), K = makeCache(R.C), N = C15.t.length;
  // una candela HTF è "chiusa" sulla sua ultima candela 15m solo se il gruppo è completo
  const done = new Int32Array(R.last.length);
  for (let j = 0; j < R.last.length; j++) done[j] = (C15.t[R.last[j]] + 900000) >= (R.C.t[j] + f * 900000) ? R.last[j] : -1;
  const expandSig = s => { const o = new Int8Array(N); for (let j = 0; j < s.length; j++) if (s[j] && done[j] >= 0) o[done[j]] = s[j]; return o; };
  const atrCache = new Map();
  const A = n => {
    if (atrCache.has(n)) return atrCache.get(n);
    const a = K.atr(n), o = new Float64Array(N).fill(NaN);
    // dalla candela 15m che chiude la candela HTF j in poi vale l'ATR di j
    for (let j = 0; j < done.length; j++) {
      if (done[j] < 0) continue;
      const end = j + 1 < done.length ? (done[j + 1] >= 0 ? done[j + 1] : N) : N;
      for (let i = done[j]; i < end; i++) o[i] = a[j];
    }
    atrCache.set(n, o); return o;
  };
  return { f, K, expandSig, A };
}

function* combos(grid) {
  const keys = Object.keys(grid);
  const rec = function* (i, cur) {
    if (i === keys.length) { yield Object.assign({}, cur); return; }
    for (const v of grid[keys[i]]) { cur[keys[i]] = v; yield* rec(i + 1, cur); }
  };
  yield* rec(0, {});
}

function loadCSV(text) {
  const lines = text.trim().split(/\r?\n/).slice(1), N = lines.length;
  const C = { t: new Float64Array(N), o: new Float64Array(N), h: new Float64Array(N), l: new Float64Array(N), c: new Float64Array(N), v: new Float64Array(N) };
  for (let i = 0; i < N; i++) { const p = lines[i].split(","); C.t[i] = +p[0]; C.o[i] = +p[1]; C.h[i] = +p[2]; C.l[i] = +p[3]; C.c[i] = +p[4]; C.v[i] = +p[5]; }
  return C;
}

const API = { resample, makeTF, ema, sma, stdev, atr, rsi, adx, supertrend, makeCache, STRATS, EXITS, exitName, backtest, combos, loadCSV, DEF };
if (typeof module !== "undefined") module.exports = API; else root.Engine = API;
})(this);

