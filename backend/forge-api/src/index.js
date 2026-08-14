const SERVICE_NAME = "tbm-forge-api";
const PRODUCTION_ORIGIN = "https://www.theblacksmithmarket.com";

function json(body, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(body), { ...init, headers });
}

function corsHeaders(origin) {
  if (origin !== PRODUCTION_ORIGIN) return {};
  return { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "86400", Vary: "Origin" };
}

export async function verifyTurnstile(token, secret, remoteip) {
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (remoteip) form.append("remoteip", remoteip);
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
  if (!response.ok) return { success: false, "error-codes": ["siteverify-unavailable"] };
  return response.json();
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/health") return json({ ok: true, service: SERVICE_NAME });
    if (request.method === "OPTIONS") {
      const origin = request.headers.get("Origin");
      if (origin !== PRODUCTION_ORIGIN) return json({ ok: false }, { status: 403 });
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    return json({ ok: false, error: "not_found" }, { status: 404 });
  }
};
