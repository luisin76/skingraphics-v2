// assets/js/include.js
// Simple HTML partial loader for elements like: <div data-include="/partials/header.html"></div>

(() => {
  // Prevent double-running if the script is included twice
  if (window.__SG_INCLUDES_LOADED__) return;
  window.__SG_INCLUDES_LOADED__ = true;

  async function loadIncludes() {
    const nodes = Array.from(document.querySelectorAll("[data-include]"));
    if (!nodes.length) return;

    await Promise.all(
      nodes.map(async (el) => {
        const url = el.getAttribute("data-include");
        if (!url) return;

        try {
          const res = await fetch(url, { cache: "no-cache" });
          if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
          const html = await res.text();

          // Inject HTML in a way we can optionally re-run scripts
          const tpl = document.createElement("template");
          tpl.innerHTML = html.trim();

          // Replace the mount node with the partial content
          const fragment = tpl.content;

          // Optional: re-run any <script> tags inside the partial
          // (scripts inserted via innerHTML/outerHTML do not execute by default)
          const scripts = Array.from(fragment.querySelectorAll("script"));
          scripts.forEach((oldScript) => {
            const s = document.createElement("script");

            // Copy attributes (src, type, defer, etc.)
            for (const { name, value } of Array.from(oldScript.attributes)) {
              s.setAttribute(name, value);
            }

            // Copy inline script content
            if (!oldScript.src) {
              s.textContent = oldScript.textContent || "";
            }

            oldScript.replaceWith(s);
          });

          el.replaceWith(fragment);
        } catch (err) {
          console.warn("[include] Failed:", url, err);
          el.outerHTML = `<!-- include failed: ${url} -->`;
        }
      })
    );

    // Fire an event so main.js can safely init behaviors after injection
    document.dispatchEvent(new CustomEvent("includes:loaded"));
  }

  // Load ASAP (after DOM is ready)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadIncludes);
  } else {
    loadIncludes();
  }
})();