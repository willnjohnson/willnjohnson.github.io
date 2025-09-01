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

// Scroll Effect
document.addEventListener("DOMContentLoaded", () => {
  const masthead = document.querySelector(".masthead");
  const content = masthead.querySelectorAll(":scope > *:not(nav)");
  const mainContainer = document.querySelector("div#main.container");
  const maxDistance = 300; // Increased for slower transition
  const backToTopBtn = document.querySelector(".back-to-top");
 
  let ticking = false;
 
  window.addEventListener("scroll", () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(() => {
        const y = window.scrollY;
        if (window.innerWidth <= 939) {
          const progress = Math.min(1, y / maxDistance);
         
          // Different easing for opacity and height
          const opacityProgress = progress; // Keep opacity linear
          const heightProgress = Math.pow(progress, 0.1); // Slower height transition
         
          const opacity = 1 - opacityProgress;
          const maxHeight = (1 - heightProgress) * 500;
          const marginTop = heightProgress * 60;
         
          content.forEach(el => {
            el.style.opacity = opacity;
            el.style.maxHeight = `${maxHeight}px`;
          });
          
          // Apply margin-top to main container
          if (mainContainer) {
            mainContainer.style.marginTop = `${marginTop}px`;
          }
        } else {
          // Reset styles when not mobile
          content.forEach(el => {
            el.style.opacity = '';
            el.style.maxHeight = '';
          });
          
          // Reset main container margin
          if (mainContainer) {
            mainContainer.style.marginTop = '';
          }
        }
       
        if (y > 100) {
          backToTopBtn.classList.add("visible");
        } else {
          backToTopBtn.classList.remove("visible");
        }
       
        ticking = false;
      });
    }
  }, { passive: true });
 
  // Handle resize to reset styles
  window.addEventListener("resize", () => {
    if (window.innerWidth > 939) {
      content.forEach(el => {
        el.style.opacity = '';
        el.style.maxHeight = '';
      });
      
      if (mainContainer) {
        mainContainer.style.marginTop = '';
      }
    }
  });
 
  backToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    backToTopBtn.blur();
  });
});