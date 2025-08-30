document.addEventListener("DOMContentLoaded", () => {
  const masthead = document.querySelector(".masthead");
  let lastY = window.scrollY;

  window.addEventListener("scroll", () => {
    if (window.innerWidth > 939) return;

    window.requestAnimationFrame(() => {
      masthead.classList.toggle("hide-on-scroll", window.scrollY > lastY && window.scrollY > 10);
      lastY = window.scrollY;
    });
  }, { passive: true });
});