// Star Trail Effect
/*
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
*/

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
  const head = document.querySelector(".head");
  const content = head.querySelectorAll(":scope > *:not(nav)");
  const mainContainer = document.querySelector("#main");
  const backToTopBtn = document.querySelector(".back-to-top");

  // Store the initial calculated height of the content to hide
  // This will be the maximum value for maxHeight when the header is fully open.
  let initialContentMaxHeight = 0;

  // Function to calculate initial content height dynamically
  const calculateInitialContentHeight = () => {
    // Temporarily reset styles to get true max height if they were modified
    content.forEach(el => {
      el.style.opacity = '';
      el.style.maxHeight = '';
      el.style.paddingTop = ''; // Reset any potential padding changes
      el.style.paddingBottom = '';
      el.style.marginTop = ''; // Reset any potential margin changes
      el.style.marginBottom = '';
    });

    initialContentMaxHeight = 0;
    // Iterate over each non-nav element to sum their heights
    // Include their margins/paddings if they contribute to the visual height
    content.forEach(el => {
      if (el.offsetHeight > 0) { // Only count visible elements
        const style = window.getComputedStyle(el);
        const marginY = parseFloat(style.marginTop) + parseFloat(style.marginBottom);
        initialContentMaxHeight += el.offsetHeight + marginY;
      }
    });

    initialContentMaxHeight = Math.max(initialContentMaxHeight, 150); // Minimum of 150px
  };

  // Run calculation initially
  calculateInitialContentHeight();

  const maxScrollDistanceForAnimation = 300;

  let ticking = false;

  const handleScroll = () => {
    const y = window.scrollY;

    if (window.innerWidth <= 939) {
      const progress = Math.min(1, y / maxScrollDistanceForAnimation);

      const opacity = 1 - progress;

      const heightProgress = Math.min(1, Math.pow(progress, 0.5));

      const currentMaxHeight = (1 - heightProgress) * initialContentMaxHeight;

      content.forEach(el => {
        el.style.opacity = opacity;
        // Ensure maxHeight doesn't go below 0
        el.style.maxHeight = `${Math.max(0, currentMaxHeight)}px`;
      });

      if (mainContainer && mainContainer.style.marginTop) {
         mainContainer.style.marginTop = '';
      }
    } else {
      // Reset styles when not mobile
      content.forEach(el => {
        el.style.opacity = '';
        el.style.maxHeight = '';
      });
      // Ensure main container margin is not affected by JS when not on mobile
      if (mainContainer && mainContainer.style.marginTop) {
        mainContainer.style.marginTop = '';
      }
    }

    // Back to top button logic
    if (y > 100) {
      backToTopBtn.classList.add("visible");
    } else {
      backToTopBtn.classList.remove("visible");
    }

    ticking = false;
  };

  window.addEventListener("scroll", () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(handleScroll);
    }
  }, { passive: true });

  // Handle resize to reset styles and recalculate height if layout changes
  window.addEventListener("resize", () => {
    // Recalculate the initial content height as element dimensions might change
    // when the window resizes, especially on and off mobile breakpoints.
    calculateInitialContentHeight();

    if (window.innerWidth > 939) {
      content.forEach(el => {
        el.style.opacity = '';
        el.style.maxHeight = '';
      });
      if (mainContainer) {
        mainContainer.style.marginTop = '';
      }
    }
    // Also re-run scroll handler to ensure correct state after resize
    handleScroll();
  });

  backToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    backToTopBtn.blur();
  });

  // Initial call to set state correctly if page is loaded scrolled
  // and to ensure initialContentMaxHeight is correctly reflected if not scrolled
  handleScroll();
});