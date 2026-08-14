const SERVICE_NAME = "tbm-forge-api";
const PRODUCTION_ORIGIN = "https://www.theblacksmithmarket.com";
const TURNSTILE_HOSTNAME = "www.theblacksmithmarket.com";
const TURNSTILE_ACTION = "ask_forge";
const MAX_REQUEST_BYTES = 16 * 1024;
const TOPICS = new Set(["ecommerce", "ai-automation", "procurement", "operations", "search-digital", "other"]);
const UTM_FIELDS = ["utm_source", "utm_medium", "utm_campaign"];

function json(body, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(body), { ...init, headers });
}

function corsHeaders(origin) {
  if (origin !== PRODUCTION_ORIGIN) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin"
  };
}

function invalid(fields) {
  return { ok: false, error: "invalid_request", fields };
}

function trimString(value, maximum) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length <= maximum ? trimmed : null;
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function sameSitePath(value) {
  if (!value.startsWith("/") || value.startsWith("//")) return false;
  try {
    const url = new URL(value, PRODUCTION_ORIGIN);
    return url.origin === PRODUCTION_ORIGIN && !url.search && !url.hash;
  } catch {
    return false;
  }
}

function safeReferrer(value) {
  if (value === "") return "";
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return null;
  }
}

export function normalizeQuestion(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false, fields: { request: "invalid" } };

  const fields = {};
  const question = trimString(body.question, 3000);
  if (!question) fields.question = "required";
  else if (question.length < 20) fields.question = "too_short";

  const topic = body.topic == null || body.topic === "" ? null : trimString(body.topic, 64);
  if (body.topic != null && body.topic !== "" && (!topic || !TOPICS.has(topic))) fields.topic = "invalid";

  const countryRelevance = body.country_relevance == null || body.country_relevance === "" ? null : trimString(body.country_relevance, 100);
  if (body.country_relevance != null && body.country_relevance !== "" && !countryRelevance) fields.country_relevance = "too_long";

  const email = body.email == null || body.email === "" ? null : trimString(body.email, 254);
  if (body.email != null && body.email !== "" && (!email || !validEmail(email))) fields.email = "invalid";

  const notifyAnswer = body.notify_answer === true;
  const newsletterConsent = body.newsletter_consent === true;
  if ((notifyAnswer || newsletterConsent) && !email) fields.email = "required_for_consent";
  if (body.notify_answer != null && typeof body.notify_answer !== "boolean") fields.notify_answer = "invalid";
  if (body.newsletter_consent != null && typeof body.newsletter_consent !== "boolean") fields.newsletter_consent = "invalid";

  const sourcePage = trimString(body.source_page, 500);
  if (!sourcePage || !sameSitePath(sourcePage)) fields.source_page = "invalid";

  const referrerInput = body.referrer == null ? "" : trimString(body.referrer, 500);
  const referrer = referrerInput === null ? null : safeReferrer(referrerInput);
  if (referrer === null) fields.referrer = "invalid";

  const utm = {};
  for (const field of UTM_FIELDS) {
    if (body[field] == null || body[field] === "") {
      utm[field] = null;
      continue;
    }
    utm[field] = trimString(body[field], 100);
    if (!utm[field]) fields[field] = "invalid";
  }

  const turnstileToken = trimString(body.turnstile_token, 2048);
  if (!turnstileToken) fields.turnstile_token = "required";
  if (Object.keys(fields).length) return { ok: false, fields };

  return {
    ok: true,
    value: {
      question,
      topic,
      country_relevance: countryRelevance,
      email,
      notify_answer: notifyAnswer,
      newsletter_consent: newsletterConsent,
      source_page: sourcePage,
      referrer,
      ...utm,
      turnstile_token: turnstileToken
    }
  };
}

export async function verifyTurnstile(token, secret, remoteip) {
  if (!secret) return { success: false, "error-codes": ["siteverify-unavailable"] };
  try {
    const form = new FormData();
    form.append("secret", secret);
    form.append("response", token);
    if (remoteip) form.append("remoteip", remoteip);
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
    if (!response.ok) return { success: false, "error-codes": ["siteverify-unavailable"] };
    return await response.json();
  } catch {
    return { success: false, "error-codes": ["siteverify-unavailable"] };
  }
}

async function readAndValidate(request) {
  const contentType = request.headers.get("Content-Type") || "";
  if (!contentType.toLowerCase().startsWith("application/json")) return { ok: false, status: 415, body: { ok: false, error: "invalid_content_type" } };

  const contentLength = Number(request.headers.get("Content-Length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) return { ok: false, status: 413, body: { ok: false, error: "request_too_large" } };

  let text;
  try {
    text = await request.text();
  } catch {
    return { ok: false, status: 400, body: invalid({ request: "invalid_json" }) };
  }
  if (new TextEncoder().encode(text).byteLength > MAX_REQUEST_BYTES) return { ok: false, status: 413, body: { ok: false, error: "request_too_large" } };

  let body;
  try {
    body = JSON.parse(text);
  } catch {
    return { ok: false, status: 400, body: invalid({ request: "invalid_json" }) };
  }
  const normalized = normalizeQuestion(body);
  if (!normalized.ok) return { ok: false, status: 400, body: invalid(normalized.fields) };
  return normalized;
}

async function insertQuestion(db, id, question) {
  const result = await db.prepare(`
    INSERT INTO forge_questions (
      id, question, topic, country_relevance, email,
      notify_answer, newsletter_consent, source_page, referrer,
      utm_source, utm_medium, utm_campaign, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')
  `).bind(
    id,
    question.question,
    question.topic,
    question.country_relevance,
    question.email,
    question.notify_answer ? 1 : 0,
    question.newsletter_consent ? 1 : 0,
    question.source_page,
    question.referrer,
    question.utm_source,
    question.utm_medium,
    question.utm_campaign
  ).run();
  if (!result?.success) throw new Error("d1_insert_failed");
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/health") return json({ ok: true, service: SERVICE_NAME });

    if (url.pathname === "/ask" && request.method === "OPTIONS") {
      const origin = request.headers.get("Origin");
      if (origin !== PRODUCTION_ORIGIN) return json({ ok: false, error: "origin_not_allowed" }, { status: 403 });
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (url.pathname === "/ask") {
      if (request.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, { status: 405, headers: { Allow: "POST, OPTIONS" } });
      const origin = request.headers.get("Origin");
      if (origin !== PRODUCTION_ORIGIN) return json({ ok: false, error: "origin_not_allowed" }, { status: 403 });

      const parsed = await readAndValidate(request);
      if (!parsed.ok) return json(parsed.body, { status: parsed.status, headers: corsHeaders(origin) });

      const turnstile = await verifyTurnstile(parsed.value.turnstile_token, env.TURNSTILE_SECRET, request.headers.get("CF-Connecting-IP"));
      if (!turnstile.success || turnstile.hostname !== TURNSTILE_HOSTNAME || turnstile.action !== TURNSTILE_ACTION) {
        return json({ ok: false, error: "turnstile_failed" }, { status: 403, headers: corsHeaders(origin) });
      }

      try {
        const id = crypto.randomUUID();
        await insertQuestion(env.DB, id, parsed.value);
        return json({ ok: true, id }, { status: 201, headers: corsHeaders(origin) });
      } catch {
        return json({ ok: false, error: "temporarily_unavailable" }, { status: 503, headers: corsHeaders(origin) });
      }
    }

    return json({ ok: false, error: "not_found" }, { status: 404 });
  }
};
