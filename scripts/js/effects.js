// Star Trail Effect
const stars = [];
let lastStar = 0;

const createStar = (x, y) => {
  if (Date.now() - lastStar < 50) return;
  lastStar = Date.now();
  
  if (stars.length >= 20) stars.shift()?.remove();
  
  const star = Object.assign(document.createElement('div'), {
    className: 'star',
    style: `left:${x + (Math.random() - 0.5) * 15}px; top:${y + (Math.random() - 0.5) * 15}px; z-index:9999`
  });
  
  document.body.appendChild(star);
  stars.push(star);
  
  setTimeout(() => star.remove(), 800);
};

let [mouseX, mouseY, moving] = [0, 0, false];

document.addEventListener('mousemove', e => {
  [mouseX, mouseY, moving] = [e.clientX, e.clientY, true];
  createStar(mouseX, mouseY);
  clearTimeout(window.moveTimeout);
  window.moveTimeout = setTimeout(() => moving = false, 100);
});

setInterval(() => !moving && Math.random() < 0.3 && 
  createStar(mouseX + (Math.random() - 0.5) * 100, mouseY + (Math.random() - 0.5) * 100), 2000);

// Navigation Underline Effect
document.addEventListener("DOMContentLoaded", () => {
  const currentPath = window.location.pathname.replace(/\/+$/, "").toLowerCase();
  const navLinks = document.querySelectorAll("nav a");

  navLinks.forEach(link => {
    const linkPath = new URL(link.href).pathname.replace(/\/+$/, "").toLowerCase();

    const isLocal = link.href.includes(window.location.origin);
    if (isLocal && linkPath === currentPath) {
      link.classList.add("active");
    }
  });
});

// Header Scroll Effect
document.addEventListener("DOMContentLoaded", () => {
  const masthead = document.querySelector(".masthead");
  const content = masthead.querySelectorAll(":scope > *:not(nav)");
  const maxDistance = 200;

  const backToTopBtn = document.querySelector(".back-to-top");

  window.addEventListener("scroll", () => {
    const y = window.scrollY;

    if (window.innerWidth <= 939) {
      window.requestAnimationFrame(() => {
        const progress = Math.min(1, y / maxDistance);
        const opacity = 1 - progress;
        const maxHeight = (1 - progress) * 500;

        content.forEach(el => {
          el.style.opacity = opacity;
          el.style.maxHeight = `${maxHeight}px`;
        });
      });
    }

    if (y > 100) {
      backToTopBtn.classList.add("visible");
    } else {
      backToTopBtn.classList.remove("visible");
    }
  }, { passive: true });

  backToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});