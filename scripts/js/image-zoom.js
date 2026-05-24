document.addEventListener("DOMContentLoaded", () => {
  const selector = "article .entry img, .post-image img, .article-content img, figure img, .entry-content img";
  const images = Array.from(document.querySelectorAll(selector)).filter(img => {
    return !img.closest("a") &&
           !img.classList.contains("author-image") &&
           !img.classList.contains("site-avatar") &&
           !img.classList.contains("png-icon") &&
           !img.closest(".nozoom") &&
           !img.closest("nav") &&
           !img.closest(".head");
  });

  images.forEach(img => {
    img.classList.add("zoomable");
    img.style.cursor = "zoom-in";
    img.addEventListener("click", e => {
      e.preventDefault();
      openImageZoom(img);
    });
  });
});

function openImageZoom(original) {
  // Prevent duplicate instances
  if (document.querySelector(".image-zoom-overlay")) return;

  const src = original.getAttribute("data-zoom-src") || original.src;
  const rect = original.getBoundingClientRect();

  // Create overlay container
  const overlay = document.createElement("div");
  overlay.className = "image-zoom-overlay";

  // Create backdrop
  const backdrop = document.createElement("div");
  backdrop.className = "image-zoom-backdrop";

  // Create clone image to avoid breaking original layout flow
  const zoomed = document.createElement("img");
  zoomed.src = src;
  zoomed.alt = original.alt || "";
  zoomed.className = "image-zoom-zoomed";

  // Position exactly over the original image using view coordinates
  zoomed.style.position = "fixed";
  zoomed.style.top = `${rect.top}px`;
  zoomed.style.left = `${rect.left}px`;
  zoomed.style.width = `${rect.width}px`;
  zoomed.style.height = `${rect.height}px`;
  zoomed.style.cursor = "zoom-out";

  overlay.appendChild(backdrop);
  overlay.appendChild(zoomed);
  document.body.appendChild(overlay);

  // Hide original image temporarily while zoomed clone matches its position
  original.style.visibility = "hidden";

  // Track original scroll position to detect scrolling later
  const startScrollY = window.scrollY;

  // Calculate scaling and translation metrics to go exactly to viewport center
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const padding = 40; // Safely pad margins

  const maxW = vw - padding * 2;
  const maxH = vh - padding * 2;

  // Read natural sizes or fallback to current sizes
  const nw = original.naturalWidth || rect.width;
  const nh = original.naturalHeight || rect.height;

  // Find the ideal scale factor to center without over-stretching
  const scale = Math.min(maxW / rect.width, maxH / rect.height, nw / rect.width);

  // Center coordinates relative to the bounding box center point
  const imageCenterX = rect.left + rect.width / 2;
  const imageCenterY = rect.top + rect.height / 2;
  const viewportCenterX = vw / 2;
  const viewportCenterY = vh / 2;

  const translateX = viewportCenterX - imageCenterX;
  const translateY = viewportCenterY - imageCenterY;

  // Trigger animation via next paint frame
  requestAnimationFrame(() => {
    backdrop.style.opacity = "1";
    zoomed.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`;
  });

  const close = () => {
    // Reverse the animation smoothly back to initial bounding box
    backdrop.style.opacity = "0";
    zoomed.style.transform = "none";

    // Clean up events immediately
    backdrop.removeEventListener("click", close);
    zoomed.removeEventListener("click", close);
    document.removeEventListener("keydown", onKey);
    window.removeEventListener("scroll", onScroll);

    setTimeout(() => {
      original.style.visibility = "visible";
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 300); // Matches the CSS transition duration
  };

  // Close instantly on minor scrolling events (Medium.com specialty behavior)
  const onScroll = () => {
    if (Math.abs(window.scrollY - startScrollY) > 20) {
      close();
    }
  };

  const onKey = (e) => {
    if (e.key === "Escape") close();
  };

  backdrop.addEventListener("click", close);
  zoomed.addEventListener("click", close);
  document.addEventListener("keydown", onKey);
  window.addEventListener("scroll", onScroll, { passive: true });
}