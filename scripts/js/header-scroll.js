document.addEventListener("DOMContentLoaded", () => {
  const masthead = document.querySelector(".masthead");
  const content = masthead.querySelectorAll(":scope > *:not(nav)");
  const maxDistance = 200;

  window.addEventListener("scroll", () => {
    if (window.innerWidth > 939) return;

    window.requestAnimationFrame(() => {
      const y = window.scrollY;
      // clamp between 0 and 1
      const progress = Math.min(1, y / maxDistance);
      const opacity = 1 - progress;
      const maxHeight = (1 - progress) * 500;

      content.forEach(el => {
        el.style.opacity = opacity;
        el.style.maxHeight = `${maxHeight}px`;
      });
    });
  }, { passive: true });
});
