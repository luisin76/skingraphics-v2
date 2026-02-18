// assets/js/include.js
// Simple HTML partial loader for elements like: <div data-include="/partials/header.html"></div>

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

        // Replace the mount node with the partial HTML
        el.outerHTML = html;
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
