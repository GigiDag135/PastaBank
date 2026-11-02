// Protegge tutto Jeriko OS (pagina e API): senza la password giusta non si vede niente.
import { sessioneValida, paginaAccesso } from "../lib/sessione.js";
const HTML = { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" };
export async function onRequest({ request, env, next }) {
  const path = new URL(request.url).pathname;
  if (!env.JERIKO_PASSWORD) return new Response(paginaAccesso("Password non impostata: aggiungi il segreto JERIKO_PASSWORD nel progetto Cloudflare."), { status: 503, headers: HTML });
  if (path === "/api/accesso" || path === "/api/esci") return next();
  if (path === "/api/goldsilver" && request.method === "POST") return next();   // il bot GoldSilver: controlla il segreto la funzione stessa
  if (await sessioneValida(request, env)) { const r = await next(); const h = new Headers(r.headers); h.set("Cache-Control", "no-store"); return new Response(r.body, { status: r.status, headers: h }); }
  if (path.startsWith("/api/")) return Response.json({ errore: "accesso richiesto" }, { status: 401 });
  return new Response(paginaAccesso(""), { status: 401, headers: HTML });
}
