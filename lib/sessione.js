// Sessione di Jeriko OS: la password sta solo nel segreto JERIKO_PASSWORD di Cloudflare.
export const TENTATIVI = 5, BLOCCO_MS = 60 * 60 * 1000, DURATA_MS = 12 * 60 * 60 * 1000;
const enc = new TextEncoder();
export async function firma(chiave, testo) {
  const k = await crypto.subtle.importKey("raw", enc.encode(chiave), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const s = await crypto.subtle.sign("HMAC", k, enc.encode(testo));
  return [...new Uint8Array(s)].map(b => b.toString(16).padStart(2, "0")).join("");
}
export async function sessioneValida(request, env) {
  const m = (request.headers.get("Cookie") || "").match(/(?:^|;\s*)jeriko_s=(\d+)\.([0-9a-f]{64})/);
  if (!m || +m[1] < Date.now()) return false;
  return (await firma(env.JERIKO_PASSWORD + "|sessione", m[1])) === m[2];
}
export async function nuovaSessione(env) {
  const scade = String(Date.now() + DURATA_MS);
  // cookie di sessione: sparisce quando chiudi il browser (la password si richiede a ogni apertura)
  return `jeriko_s=${scade}.${await firma(env.JERIKO_PASSWORD + "|sessione", scade)}; Path=/; HttpOnly; Secure; SameSite=Strict`;
}
export async function stato(env) {
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS accessi (id INTEGER PRIMARY KEY, errori INTEGER NOT NULL DEFAULT 0, bloccato_fino INTEGER NOT NULL DEFAULT 0)").run();
  await env.DB.prepare("INSERT OR IGNORE INTO accessi (id, errori, bloccato_fino) VALUES (1, 0, 0)").run();
  return env.DB.prepare("SELECT errori, bloccato_fino FROM accessi WHERE id = 1").first();
}
export function paginaAccesso(messaggio) {
  return `<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover"><meta name="theme-color" content="#0b0a16"><title>JERIKO OS</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Silkscreen&family=IBM+Plex+Sans:wght@400;600&display=swap">
<style>html,body{margin:0;height:100%;background:radial-gradient(ellipse at 50% 30%,#2a1f4a,#0b0a16 70%);color:#f4efe6;font-family:"IBM Plex Sans",-apple-system,sans-serif;color-scheme:dark}
main{min-height:100%;display:grid;place-items:center;padding:24px max(16px,env(safe-area-inset-right,0px)) 24px max(16px,env(safe-area-inset-left,0px));box-sizing:border-box}
form{width:min(380px,100%);background:#15122a;border:2px solid #3a2f63;padding:22px;border-radius:6px;text-align:center;box-sizing:border-box}
h1{font-family:Silkscreen,monospace;font-weight:400;font-size:24px;letter-spacing:.12em;color:#ffd98a;margin:0 0 6px;text-shadow:0 0 12px #d8b25a66}
p{color:#b3aac9;font-size:13px;line-height:1.5;margin:8px 0 14px}
input{width:100%;box-sizing:border-box;font:inherit;font-size:15px;background:#0b0a16;color:#f4efe6;border:1px solid #463b7a;border-radius:4px;padding:10px 12px;margin-bottom:10px;text-align:center}
button{width:100%;font-family:Silkscreen,monospace;font-size:13px;letter-spacing:.08em;background:#d8b25a;color:#1a1440;border:0;border-radius:4px;padding:11px;cursor:pointer}
button:focus-visible,input:focus-visible{outline:2px solid #ffd98a;outline-offset:2px}
.err{color:#f87171;font-size:12.5px;min-height:1.3em;margin-top:8px}</style></head>
<body><main><form id="f" autocomplete="off"><h1>JERIKO OS</h1><p>Scrivi la password per entrare. Non resta salvata: la chiede a ogni apertura del browser.</p>
<input id="pw" type="password" aria-label="Password" placeholder="password" autofocus><button type="submit">ENTRA</button><div class="err" id="err">${messaggio || ""}</div></form></main>
<script>document.getElementById("f").addEventListener("submit",async e=>{e.preventDefault();const pw=document.getElementById("pw"),err=document.getElementById("err");err.textContent="";
try{const r=await fetch("/api/accesso",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:pw.value})});const j=await r.json();if(j.ok){location.reload();return}err.textContent=j.messaggio||"Accesso negato."}catch(x){err.textContent="Il server non risponde. Riprova tra poco."}pw.value="";pw.focus()});</script></body></html>`;
}
