export async function onRequestGet() {
  return new Response(null, { status: 302, headers: { Location: "/", "Set-Cookie": "jeriko_s=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0", "Cache-Control": "no-store" } });
}
