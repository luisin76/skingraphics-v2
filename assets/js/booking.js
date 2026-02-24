// /assets/js/booking.js
// Skin Graphics — Booking Webhook Integration (Make)
// "Fire-and-forget" to avoid false network error alerts caused by CORS/opaque responses.

(function () {
  const WEBHOOK_URL =
    "https://hook.us2.make.com/u74kldipvdn48lxwnro6p6cy419iar5b";

  function initBookingWebhook() {
    const form = document.getElementById("booking-form");
    if (!form) return;

    if (form.dataset.webhookBound === "true") return;
    form.dataset.webhookBound = "true";

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      // Honeypot
      const botField = form.querySelector('input[name="bot-field"]');
      if (botField && botField.value) return;

      // Build payload
      let formData;
      try {
        formData = new FormData(form);
      } catch (err) {
        console.error("FormData build failed:", err);
        alert(
          "Sorry — something went wrong submitting your request. Please try again or call the studio."
        );
        return;
      }

      // Add tracking fields if not already present as inputs
      if (!formData.get("submitted_at")) {
        formData.append("submitted_at", new Date().toISOString());
      }
      if (!formData.get("page_url")) {
        formData.append("page_url", window.location.href);
      }
      if (!formData.get("form_source")) {
        formData.append("form_source", "booking");
      }

      // Disable submit to prevent doubles
      const submitBtn = form.querySelector(
        'button[type="submit"], input[type="submit"]'
      );
      const prevText =
        submitBtn && "textContent" in submitBtn ? submitBtn.textContent : null;

      if (submitBtn) {
        submitBtn.disabled = true;
        if ("textContent" in submitBtn) submitBtn.textContent = "Submitting…";
      }

      // Send (don’t await; avoid false “network error” after the POST succeeds)
      try {
        fetch(WEBHOOK_URL, {
          method: "POST",
          body: formData,
          mode: "no-cors",
          keepalive: true, // helps on quick navigations
        });
      } catch (err) {
        // This would only happen if fetch is unavailable or something failed before sending.
        console.error("Fetch failed before sending:", err);
        alert(
          "Sorry — something went wrong submitting your request. Please try again or call the studio."
        );
        if (submitBtn) {
          submitBtn.disabled = false;
          if (prevText !== null) submitBtn.textContent = prevText;
        }
        return;
      }

      // Redirect right away (submission is already on its way)
      window.location.href = "/thank-you/";
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initBookingWebhook);
  } else {
    initBookingWebhook();
  }
})();