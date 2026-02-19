/* assets/js/main.js
   Skin Graphics v2 — minimal enhancements:
   1) Mobile nav toggle (accessible)
   2) Close nav on link click (mobile)
   3) Close on Escape / outside click
   4) Header "scrolled" state for a tighter feel
   Works with partial injection (include.js) via "includes:loaded"
*/

function initHeaderNav() {
  const header = document.querySelector("[data-sticky]") || document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("siteNav");

  if (!toggle || !nav) return;

  // Prevent double-binding if init runs twice (DOMContentLoaded + includes:loaded)
  if (toggle.dataset.bound === "true") return;
  toggle.dataset.bound = "true";

  // Ensure aria-controls points to the nav id
  const navId = nav.getAttribute("id") || "siteNav";
  nav.setAttribute("id", navId);
  toggle.setAttribute("aria-controls", navId);

  const isToggleVisible = () => window.getComputedStyle(toggle).display !== "none";
  const isOpen = () => toggle.getAttribute("aria-expanded") === "true";

  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("nav-open", open);
    nav.classList.toggle("is-open", open);
  };
    // Close if clicking the backdrop area (anywhere not nav/toggle)
  document.addEventListener("click", (e) => {
    if (!isOpen()) return;
    const clickedInside = nav.contains(e.target) || toggle.contains(e.target);
    if (!clickedInside) setOpen(false);
  });


  // Toggle click
  toggle.addEventListener("click", (e) => {
    e.preventDefault();
    setOpen(!isOpen());
  });

  // Close on link click (only when toggle is visible = mobile)
  nav.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    if (isToggleVisible() && isOpen()) setOpen(false);
  });

  // ESC closes
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen()) setOpen(false);
  });

  // Outside click closes
  document.addEventListener("click", (e) => {
    if (!isOpen()) return;
    const clickedInside = nav.contains(e.target) || toggle.contains(e.target);
    if (!clickedInside) setOpen(false);
  });

  // Resizing to desktop should reset open state
  window.addEventListener("resize", () => {
    if (!isToggleVisible() && isOpen()) setOpen(false);
  });

  // Optional: header scrolled state (style .is-scrolled in CSS if you want)
  if (header && !header.dataset.scrollBound) {
    header.dataset.scrollBound = "true";
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
}

// Run on normal load
document.addEventListener("DOMContentLoaded", initHeaderNav);

// Run after partials are injected
document.addEventListener("includes:loaded", initHeaderNav);


// ===============================
// Artist work lightbox (optional)
// ===============================
(function () {
  const lb = document.getElementById("lightbox");
  if (!lb) return;

  const lbImg = lb.querySelector(".lightbox-img");
  const lbClose = lb.querySelector(".lightbox-close");

  function openLightbox(src, alt = "") {
    lbImg.src = src;
    lbImg.alt = alt;
    lb.classList.add("is-open");
    lb.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lb.classList.remove("is-open");
    lb.setAttribute("aria-hidden", "true");
    lbImg.src = "";
    lbImg.alt = "";
    document.body.style.overflow = "";
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".work-btn");
    if (!btn) return;

    const full = btn.getAttribute("data-full");
    const img = btn.querySelector("img");
    if (!full) return;

    openLightbox(full, img?.alt || "");
  });

  lbClose?.addEventListener("click", closeLightbox);

  lb.addEventListener("click", (e) => {
    // clicking outside image closes
    if (e.target === lb) closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lb.classList.contains("is-open")) {
      closeLightbox();
    }
  });
})();

// =======================================
// Booking: auto-select artist from ?artist=
// =======================================
(function () {
  const params = new URLSearchParams(window.location.search);
  const artistParam = (params.get("artist") || "").trim().toLowerCase();
  if (!artistParam) return;

  // Try select dropdown first
  const artistSelect = document.querySelector('select[name="artist"], #artist');
  if (artistSelect) {
    const options = Array.from(artistSelect.options || []);
    const match = options.find((o) => (o.value || "").toLowerCase() === artistParam);

    if (match) {
      artistSelect.value = match.value;
      artistSelect.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }
  }

  // Fallback: hidden input (if you use one)
  const artistHidden = document.querySelector('input[type="hidden"][name="artist"]');
  if (artistHidden) artistHidden.value = artistParam;
})();

// =======================================
// Header "Book Appointment" -> "Book with NAME"
// + keeps href = /booking/?artist=slug
// Works with injected header partials
// =======================================
(function () {
  function slugify(s) {
    return String(s || "")
      .trim()
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function toTitle(s) {
    return String(s || "")
      .replace(/-/g, " ")
      .trim()
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  function apply() {
    const btn = document.getElementById("header-book-btn");
    if (!btn) return false;

    // Only personalize on artist pages
    if (!document.body.classList.contains("artist-page")) return true;

    // Prefer explicit body attribute
    let slug = slugify(document.body.getAttribute("data-artist"));

    // Fallback: /artists/james-rivera/
    if (!slug) {
      const parts = window.location.pathname.split("/").filter(Boolean);
      if (parts[0] === "artists" && parts[1]) slug = slugify(parts[1]);
    }

    if (!slug) return true;

    // Update link
    btn.href = `/booking/?artist=${encodeURIComponent(slug)}`;

    // Update label (desktop-friendly)
    const name = toTitle(slug);
    btn.textContent = `BOOK WITH ${name}`;

    // Optional: add a class for styling tweaks
    btn.classList.add("book-with");

    return true;
  }

  // Try immediately
  if (apply()) return;

  // Retry if header is injected after JS runs
  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    if (apply() || tries > 20) clearInterval(timer);
  }, 100);
})();


// =======================================
// Smooth scroll to booking form if ?artist=
// =======================================
(function () {
  const params = new URLSearchParams(window.location.search);
  if (!params.get("artist")) return;

  const formSection = document.getElementById("booking-form");
  if (!formSection) return;

  // Small delay so layout settles
  setTimeout(() => {
    formSection.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, 200);
})();

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("header-book-btn");
  if (btn) btn.innerHTML = 'Book with <span class="cta-name">NATE</span>';
});
