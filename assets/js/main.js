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
