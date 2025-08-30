document.addEventListener("DOMContentLoaded", () => {
  const masthead = document.querySelector(".masthead");
  let lastY = window.scrollY;

  window.addEventListener("scroll", () => {
    if (window.innerWidth > 939) return;

    window.requestAnimationFrame(() => {
      const currentY = window.scrollY;

      if (currentY > lastY && currentY > 10) {
        masthead.classList.add("hide-on-scroll");
      }

      if (currentY <= 5) {
        masthead.classList.remove("hide-on-scroll");
      }

      lastY = currentY;
    });
  }, { passive: true });
});
