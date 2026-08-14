import assert from "node:assert/strict";
import test from "node:test";
import worker from "../src/index.js";

test("GET /health returns the minimal service response", async () => {
  const response = await worker.fetch(new Request("https://api.theblacksmithmarket.com/health"));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, service: "tbm-forge-api" });
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("unknown routes do not expose internals", async () => {
  const response = await worker.fetch(new Request("https://api.theblacksmithmarket.com/private"));
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { ok: false, error: "not_found" });
});

test("CORS preflight permits only the canonical production origin", async () => {
  const allowed = await worker.fetch(new Request("https://api.theblacksmithmarket.com/questions", { method: "OPTIONS", headers: { Origin: "https://www.theblacksmithmarket.com" } }));
  assert.equal(allowed.status, 204);
  assert.equal(allowed.headers.get("access-control-allow-origin"), "https://www.theblacksmithmarket.com");
  const rejected = await worker.fetch(new Request("https://api.theblacksmithmarket.com/questions", { method: "OPTIONS", headers: { Origin: "https://example.com" } }));
  assert.equal(rejected.status, 403);
  assert.equal(rejected.headers.get("access-control-allow-origin"), null);
});
