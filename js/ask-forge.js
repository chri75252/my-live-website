(() => {
  const endpoint = "https://api.theblacksmithmarket.com/ask";
  const form = document.getElementById("ask-forge-form");
  if (!form) return;

  const submit = form.querySelector('button[type="submit"]');
  const status = document.getElementById("ask-forge-status");
  const utmKeys = ["utm_source", "utm_medium", "utm_campaign"];
  const messages = {
    required: "Please enter your question.",
    too_short: "Please enter at least 20 characters.",
    invalid: "Please check this field.",
    invalid_json: "Please try again.",
    required_for_consent: "An email address is needed for this choice."
  };

  function setStatus(message, failed = false) {
    status.textContent = message;
    status.classList.toggle("is-error", failed);
    status.focus();
  }

  function clearErrors() {
    form.querySelectorAll("[data-field-error]").forEach((node) => { node.textContent = ""; });
    form.querySelectorAll("[aria-invalid]").forEach((node) => node.removeAttribute("aria-invalid"));
  }

  function showErrors(fields = {}) {
    let first;
    for (const [field, code] of Object.entries(fields)) {
      const node = form.querySelector(`[data-field-error="${field}"]`);
      const input = form.elements.namedItem(field);
      if (node) node.textContent = messages[code] || "Please check this field.";
      if (input && "setAttribute" in input) {
        input.setAttribute("aria-invalid", "true");
        first ||= input;
      }
    }
    first?.focus();
  }

  function resetTurnstile() {
    if (window.turnstile && form.querySelector(".cf-turnstile")) window.turnstile.reset();
  }

  function value(name) {
    return String(form.elements.namedItem(name)?.value || "").trim();
  }

  function utm() {
    const params = new URLSearchParams(location.search);
    return Object.fromEntries(utmKeys.map((key) => [key, (params.get(key) || "").slice(0, 100) || null]));
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearErrors();
    const question = value("question");
    if (question.length < 20) {
      showErrors({ question: question ? "too_short" : "required" });
      setStatus("Please correct the highlighted field.", true);
      return;
    }

    const token = form.querySelector('[name="cf-turnstile-response"]')?.value || "";
    if (!token) {
      showErrors({ turnstile_token: "required" });
      setStatus("Please complete the verification before submitting.", true);
      return;
    }

    const payload = {
      question,
      topic: value("topic") || null,
      country_relevance: value("country_relevance") || null,
      email: value("email") || null,
      notify_answer: Boolean(form.elements.namedItem("notify_answer")?.checked),
      newsletter_consent: Boolean(form.elements.namedItem("newsletter_consent")?.checked),
      source_page: location.pathname,
      referrer: document.referrer || null,
      ...utm(),
      turnstile_token: token
    };

    submit.disabled = true;
    setStatus("Sending your question…");
    try {
      const response = await fetch(endpoint, { method: "POST", mode: "cors", credentials: "omit", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json().catch(() => null);
      if (response.status !== 201 || !result?.ok) {
        if (result?.fields) showErrors(result.fields);
        throw new Error(result?.error || "temporarily_unavailable");
      }
      form.reset();
      resetTurnstile();
      setStatus("Your question has been received. Thank you.");
    } catch (error) {
      resetTurnstile();
      if (error.message === "turnstile_failed") setStatus("Verification expired or failed. Please complete it again and resubmit.", true);
      else if (error.message === "invalid_request") setStatus("Please correct the highlighted fields.", true);
      else setStatus("We could not submit your question right now. Please try again shortly.", true);
    } finally {
      submit.disabled = false;
    }
  });
})();
