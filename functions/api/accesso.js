// Controllo della password: 5 errori (da chiunque) bloccano l'accesso per 1 ora.
import { firma, nuovaSessione, stato, TENTATIVI, BLOCCO_MS } from "../../lib/sessione.js";
const risposta = (o, status, extra) => new Response(JSON.stringify(o), { status, headers: Object.assign({ "Content-Type": "application/json", "Cache-Control": "no-store" }, extra || {}) });
export async function onRequestPost({ request, env }) {
  let pw = ""; try { pw = String((await request.json()).password || ""); } catch (e) {}
  const now = Date.now(), s = await stato(env);
  if (s.bloccato_fino > now) return risposta({ ok: false, messaggio: `Accesso bloccato dopo ${TENTATIVI} password sbagliate. Riprova tra ${Math.ceil((s.bloccato_fino - now) / 60000)} minuti.` }, 429);
  // confronto a tempo costante: si confrontano le firme, non le password
  const giusta = (await firma("confronto", pw)) === (await firma("confronto", env.JERIKO_PASSWORD));
  if (giusta) {
    await env.DB.prepare("UPDATE accessi SET errori = 0 WHERE id = 1").run();
    return risposta({ ok: true }, 200, { "Set-Cookie": await nuovaSessione(env) });
  }
  const errori = s.errori + 1;
  if (errori >= TENTATIVI) {
    await env.DB.prepare("UPDATE accessi SET errori = 0, bloccato_fino = ? WHERE id = 1").bind(now + BLOCCO_MS).run();
    return risposta({ ok: false, messaggio: `Troppi errori: accesso bloccato per 1 ora.` }, 429);
  }
  await env.DB.prepare("UPDATE accessi SET errori = ? WHERE id = 1").bind(errori).run();
  return risposta({ ok: false, messaggio: `Password sbagliata. Tentativi rimasti: ${TENTATIVI - errori}.` }, 401);
}
