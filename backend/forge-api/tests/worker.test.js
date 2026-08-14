import assert from "node:assert/strict";
import test from "node:test";
import worker, { normalizeQuestion } from "../src/index.js";

const ORIGIN = "https://www.theblacksmithmarket.com";
const originalFetch = globalThis.fetch;

function body(overrides = {}) {
  return {
    question: "How should a small importer compare landed cost across suppliers?",
    topic: "procurement",
    country_relevance: "United Kingdom",
    email: "reader@example.com",
    notify_answer: true,
    newsletter_consent: false,
    source_page: "/blog/example.html",
    referrer: "https://www.google.com/search?q=private",
    utm_source: "google",
    utm_medium: "organic",
    utm_campaign: "launch",
    turnstile_token: "synthetic-turnstile-token",
    ...overrides
  };
}

function request(payload, headers = {}) {
  return new Request("https://api.theblacksmithmarket.com/ask", {
    method: "POST",
    headers: { Origin: ORIGIN, "Content-Type": "application/json", ...headers },
    body: typeof payload === "string" ? payload : JSON.stringify(payload)
  });
}

function environment({ success = true } = {}) {
  const values = [];
  return {
    TURNSTILE_SECRET: "local-test-secret",
    DB: {
      prepare() {
        return {
          bind(...bound) {
            values.push(bound);
            return { run: async () => ({ success }) };
          }
        };
      }
    },
    values
  };
}

function mockTurnstile(response = { success: true, hostname: "www.theblacksmithmarket.com", action: "ask_forge" }) {
  globalThis.fetch = async () => new Response(JSON.stringify(response), { status: 200, headers: { "Content-Type": "application/json" } });
}

test.after(() => { globalThis.fetch = originalFetch; });

test("GET /health returns the minimal service response", async () => {
  const response = await worker.fetch(new Request("https://api.theblacksmithmarket.com/health"), {});
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, service: "tbm-forge-api" });
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("normalization strips a referrer query and rejects off-site source pages", () => {
  const accepted = normalizeQuestion(body());
  assert.equal(accepted.ok, true);
  assert.equal(accepted.value.referrer, "https://www.google.com/search");
  assert.deepEqual(normalizeQuestion(body({ source_page: "https://example.com/" })), { ok: false, fields: { source_page: "invalid" } });
});

test("POST /ask persists normalized data only after valid Turnstile verification", async () => {
  mockTurnstile();
  const env = environment();
  const response = await worker.fetch(request(body()), env);
  assert.equal(response.status, 201);
  const result = await response.json();
  assert.equal(result.ok, true);
  assert.match(result.id, /^[0-9a-f-]{36}$/);
  assert.equal(response.headers.get("access-control-allow-origin"), ORIGIN);
  assert.equal(env.values.length, 1);
  assert.equal(env.values[0][8], "https://www.google.com/search");
  assert.equal(env.values[0][5], 1);
});

test("CORS preflight permits only the canonical production origin", async () => {
  const allowed = await worker.fetch(new Request("https://api.theblacksmithmarket.com/ask", { method: "OPTIONS", headers: { Origin: ORIGIN } }), {});
  assert.equal(allowed.status, 204);
  assert.equal(allowed.headers.get("access-control-allow-origin"), ORIGIN);
  const rejected = await worker.fetch(new Request("https://api.theblacksmithmarket.com/ask", { method: "OPTIONS", headers: { Origin: "https://example.com" } }), {});
  assert.equal(rejected.status, 403);
  assert.equal(rejected.headers.get("access-control-allow-origin"), null);
});

test("POST /ask rejects a missing or foreign origin before any write", async () => {
  const env = environment();
  const noOrigin = new Request("https://api.theblacksmithmarket.com/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body()) });
  const response = await worker.fetch(noOrigin, env);
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { ok: false, error: "origin_not_allowed" });
  assert.equal(env.values.length, 0);
});

test("POST /ask rejects content, JSON, size and invalid fields safely", async () => {
  const env = environment();
  const text = await worker.fetch(new Request("https://api.theblacksmithmarket.com/ask", { method: "POST", headers: { Origin: ORIGIN, "Content-Type": "text/plain" }, body: "not json" }), env);
  assert.equal(text.status, 415);
  const malformed = await worker.fetch(request("{"), env);
  assert.equal(malformed.status, 400);
  assert.deepEqual(await malformed.json(), { ok: false, error: "invalid_request", fields: { request: "invalid_json" } });
  const short = await worker.fetch(request(body({ question: "too short" })), env);
  assert.equal(short.status, 400);
  assert.deepEqual((await short.json()).fields, { question: "too_short" });
  const tooLarge = await worker.fetch(request(body({ question: "a".repeat(17000) })), env);
  assert.equal(tooLarge.status, 413);
  const consent = await worker.fetch(request(body({ email: "", notify_answer: true })), env);
  assert.equal(consent.status, 400);
  assert.equal((await consent.json()).fields.email, "required_for_consent");
});

test("failed, mismatched and unavailable Turnstile never writes data", async () => {
  for (const result of [
    { success: false },
    { success: true, hostname: "example.com", action: "ask_forge" },
    { success: true, hostname: "www.theblacksmithmarket.com", action: "other" }
  ]) {
    mockTurnstile(result);
    const env = environment();
    const response = await worker.fetch(request(body()), env);
    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), { ok: false, error: "turnstile_failed" });
    assert.equal(env.values.length, 0);
  }
  globalThis.fetch = async () => { throw new Error("network unavailable"); };
  const unavailable = await worker.fetch(request(body()), environment());
  assert.equal(unavailable.status, 403);
});

test("D1 failure produces a generic 503 without claiming success", async () => {
  mockTurnstile();
  const response = await worker.fetch(request(body()), environment({ success: false }));
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { ok: false, error: "temporarily_unavailable" });
});

test("unknown routes and unsupported Ask methods remain non-disclosing", async () => {
  const unknown = await worker.fetch(new Request("https://api.theblacksmithmarket.com/private"), {});
  assert.equal(unknown.status, 404);
  assert.deepEqual(await unknown.json(), { ok: false, error: "not_found" });
  const method = await worker.fetch(new Request("https://api.theblacksmithmarket.com/ask"), {});
  assert.equal(method.status, 405);
  assert.equal(method.headers.get("allow"), "POST, OPTIONS");
});
