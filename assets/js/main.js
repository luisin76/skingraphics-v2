/* assets/js/main.js
   Skin Graphics v2 — stable enhancements (clean)
   - Mobile nav toggle
   - Lightbox
   - Artist CTA personalization (header + sticky)
   - Booking page: auto-select artist + scroll to form
*/

(function () {
  // -------------------------------
  // Ready helper
  // -------------------------------
  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  // -------------------------------
  // Helpers
  // -------------------------------
  function slugify(s) {
    return String(s || "")
      .trim()
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function isBookingPage() {
    return window.location.pathname === "/booking/" || window.location.pathname === "/booking";
  }

  // -------------------------------
  // Mobile nav toggle
  // -------------------------------
  function initHeaderNav() {
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.getElementById("siteNav");
    if (!toggle || !nav) return;

    // Prevent double-binding if includes inject header later
    if (toggle.dataset.bound === "true") return;
    toggle.dataset.bound = "true";

    const isToggleVisible = () => window.getComputedStyle(toggle).display !== "none";
    const isOpen = () => toggle.getAttribute("aria-expanded") === "true";

    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("nav-open", open);
      nav.classList.toggle("is-open", open);
      document.body.style.overflow = open ? "hidden" : "";
    };

    toggle.addEventListener("click", (e) => {
      e.preventDefault();
      setOpen(!isOpen());
    });

    // Close on link click (let navigation start first)
    nav.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;

      if (isToggleVisible() && isOpen()) {
        setTimeout(() => setOpen(false), 50);
      }
    });

    // Escape closes
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen()) setOpen(false);
    });

    // Click outside closes
    document.addEventListener("click", (e) => {
      if (!isOpen()) return;
      const clickedInside = nav.contains(e.target) || toggle.contains(e.target);
      if (!clickedInside) setOpen(false);
    });

    // Resize: if leaving mobile layout, ensure closed
    window.addEventListener("resize", () => {
      if (!isToggleVisible() && isOpen()) setOpen(false);
    });
  }

  // -------------------------------
  // Lightbox (artist pages)
  // -------------------------------
  function initLightbox() {
    const lb = document.getElementById("lightbox");
    if (!lb) return;

    if (lb.dataset.bound === "true") return;
    lb.dataset.bound = "true";

    const lbImg = lb.querySelector(".lightbox-img");
    const lbClose = lb.querySelector(".lightbox-close");

    function openLightbox(src, alt = "") {
      if (!lbImg) return;
      lbImg.src = src;
      lbImg.alt = alt;
      lb.classList.add("is-open");
      lb.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }

    function closeLightbox() {
      lb.classList.remove("is-open");
      lb.setAttribute("aria-hidden", "true");
      if (lbImg) {
        lbImg.src = "";
        lbImg.alt = "";
      }
      document.body.style.overflow = "";
    }

    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".work-btn");
      if (!btn) return;

      const full = btn.getAttribute("data-full");
      const img = btn.querySelector("img");
      if (!full) return;

      openLightbox(full, img ? img.alt : "");
    });

    if (lbClose) lbClose.addEventListener("click", closeLightbox);

    lb.addEventListener("click", (e) => {
      if (e.target === lb) closeLightbox();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && lb.classList.contains("is-open")) closeLightbox();
    });
  }

  // -------------------------------
  // Artist CTA personalization
  // Requires:
  // <body class="artist-page" data-artist="james-rivera" data-cta-name="James Rivera">
  // Header button in partial:  id="header-book-btn"
  // Sticky button on artist page: id="sticky-book-btn"
  // ***** Artists index is generic; only personalize when slug exists. *****
  // -------------------------------
  function getArtistSlug() {
    const explicit = slugify(document.body.getAttribute("data-artist"));
    if (explicit) return explicit;

    const parts = window.location.pathname.split("/").filter(Boolean);
    if (parts[0] === "artists" && parts[1]) return slugify(parts[1]);
    return "";
  }

  function getFirstNameUpper() {
    const full = (document.body.dataset.ctaName || "").trim();
    const first = full.split(/\s+/)[0];
    return (first || "Nate").toUpperCase();
  }

  function applyArtistCTA() {
    const parts = window.location.pathname.split("/").filter(Boolean);
    // const isArtist = document.body.classList.contains("artist-page") || parts[0] === "artists";
    const isArtist =
    document.body.classList.contains("artist-page") ||
    (parts[0] === "artists" && parts[1]);
    if (!isArtist) return;

    const slug = getArtistSlug();
    const first = getFirstNameUpper();

    // NOTE: We pass slug in query. On booking page we match slug against option text/value.
    const href = slug
      ? `/booking/?artist=${encodeURIComponent(slug)}#booking-form`
      : `/booking/#booking-form`;

    document.querySelectorAll(".cta-name").forEach((el) => {
      el.textContent = first;
    });

    const headerBtn = document.getElementById("header-book-btn");
    if (headerBtn) {
      headerBtn.textContent = `BOOK WITH ${first}`;
      headerBtn.href = href;
    }

    const stickyBtn = document.getElementById("sticky-book-btn");
    if (stickyBtn) {
      stickyBtn.href = href;
      stickyBtn.innerHTML = `BOOK WITH <span class="cta-name">${first}</span>`;
    }
  }

  // -------------------------------
  // Booking page: auto-select artist from ?artist=
  // Targets: <select id="booking-artist" name="artist">
  // -------------------------------
  function bookingSelectArtist() {
    if (!isBookingPage()) return;

    const params = new URLSearchParams(window.location.search);
    const artistRaw = (params.get("artist") || "").trim();
    if (!artistRaw) return;

    const artistSlug = slugify(artistRaw);

    function tryApply() {
      const sel =
        document.getElementById("booking-artist") ||
        document.querySelector('select[name="artist"]');
      if (!sel) return false;

      const opts = Array.from(sel.options || []);
      const match = opts.find((o) => {
        const v = slugify(o.value);
        const t = slugify(o.textContent);
        return v === artistSlug || t === artistSlug;
      });

      if (match) {
        sel.value = match.value;
        sel.classList.add("artist-autoselected");
        sel.dispatchEvent(new Event("change", { bubbles: true }));
      }

      return true; // stop retrying once select exists
    }

    if (tryApply()) return;

    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (tryApply() || tries > 50) clearInterval(timer);
    }, 100);

    const mo = new MutationObserver(() => {
      if (tryApply()) mo.disconnect();
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }

  // -------------------------------
  // Booking page: smooth scroll to form when ?artist=
  // Targets: #booking-form OR form[name="booking"] OR .booking-form OR #booking-artist
  // -------------------------------
  function bookingScrollToForm() {
    if (!isBookingPage()) return;

    const params = new URLSearchParams(window.location.search);
    if (!params.get("artist")) return;

    function findTarget() {
      return (
        document.getElementById("booking-form") ||
        document.querySelector('form[name="booking"]') ||
        document.querySelector(".booking-form") ||
        document.getElementById("booking-artist")
      );
    }

    function go() {
      const el = findTarget();
      if (!el) return false;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      return true;
    }

    if (go()) return;

    let tries = 0;
    const t = setInterval(() => {
      tries += 1;
      if (go() || tries > 60) clearInterval(t);
    }, 100);
  }

  // -------------------------------
  // Run on initial load + after includes injected
  // -------------------------------
  function initAll() {
    initHeaderNav();
    initLightbox();
    applyArtistCTA();
    bookingSelectArtist();
    bookingScrollToForm();
  }

  onReady(initAll);
  document.addEventListener("includes:loaded", initAll);
})();

// **** Booking form submission ****

  (function () {
    var el = document.getElementById("page_url");
    if (el) el.value = window.location.href;
  })();

// **** S to send custom Thank You form ****

  (function () {
    const form = document.getElementById("booking-form");
    if (!form) return;

    // set tracking fields
    const pageUrl = document.getElementById("page_url");
    if (pageUrl) pageUrl.value = window.location.href;

    const submittedAt = document.getElementById("submitted_at");
    if (submittedAt) submittedAt.value = new Date().toISOString();

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // basic bot check
      const botField = form.querySelector('input[name="bot-field"]');
      if (botField && botField.value) return;

      const action = form.getAttribute("action");
      const data = new FormData(form);

      try {
        const res = await fetch(action, {
          method: "POST",
          body: data,
        });

        if (!res.ok) throw new Error("Webhook failed");

        // success redirect
        window.location.href = "/thank-you/";
      } catch (err) {
        alert("Sorry — something went wrong submitting the form. Please try again or call the studio.");
        console.error(err);
      }
    });
  })();