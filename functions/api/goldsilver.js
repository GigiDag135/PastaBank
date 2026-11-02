// Resoconto della scrivania GoldSilver.
// POST: lo manda il bot GoldSilver dal server Oracle, con il segreto GOLDSILVER_SECRET (niente chiavi dentro).
// GET: lo legge il PC 1 di Jeriko OS (dietro la password del sito).
async function tabella(env) { await env.DB.prepare("CREATE TABLE IF NOT EXISTS goldsilver (id INTEGER PRIMARY KEY, dati TEXT NOT NULL, ricevuto INTEGER NOT NULL)").run(); }
async function uguale(a, b) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode("gs"), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const h = async s => new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(s)));
  const x = await h(a), y = await h(b); let d = 0; for (let i = 0; i < x.length; i++) d |= x[i] ^ y[i]; return d === 0;
}
export async function onRequestPost({ request, env }) {
  if (!env.GOLDSILVER_SECRET) return Response.json({ errore: "segreto GOLDSILVER_SECRET non impostato" }, { status: 503 });
  if (!(await uguale(request.headers.get("X-GS-Secret") || "", env.GOLDSILVER_SECRET))) return Response.json({ errore: "segreto non valido" }, { status: 403 });
  const txt = await request.text();
  if (txt.length > 60000) return Response.json({ errore: "troppo grande" }, { status: 413 });
  try { JSON.parse(txt); } catch (e) { return Response.json({ errore: "non valido" }, { status: 400 }); }
  await tabella(env);
  await env.DB.prepare("INSERT INTO goldsilver (id, dati, ricevuto) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET dati = excluded.dati, ricevuto = excluded.ricevuto").bind(txt, Date.now()).run();
  return Response.json({ ok: true });
}
export async function onRequestGet({ env }) {
  await tabella(env);
  const r = await env.DB.prepare("SELECT dati, ricevuto FROM goldsilver WHERE id = 1").first();
  if (!r) return Response.json({ ok: false, motivo: "nessun resoconto ancora" }, { headers: { "Cache-Control": "no-store" } });
  return Response.json({ ok: true, ricevuto: r.ricevuto, dati: JSON.parse(r.dati) }, { headers: { "Cache-Control": "no-store" } });
}
