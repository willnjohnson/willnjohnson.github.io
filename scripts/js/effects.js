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

// Touch Event Support for Mobile Hover Effects
document.addEventListener("DOMContentLoaded", () => {
  // Elements that should receive touch hover effect
  const touchHoverSelectors = [
    'a',
    'button',
    '.card-marquee-item',
    '.grid-item',
    '.post-card',
    '.project-card',
    'summary.btn',
    '.btn',
    '.png-icon',
    '.icon-link'
  ];

  // Function to add touch-hover class to element and its parents
  const addTouchHover = (target) => {
    const element = target.closest(touchHoverSelectors.join(', '));
    if (element) {
      element.classList.add('touch-hover');
    }
  };

  // Function to remove touch-hover class from all elements
  const removeAllTouchHover = () => {
    document.querySelectorAll('.touch-hover').forEach(el => {
      el.classList.remove('touch-hover');
    });
  };

  // Handle touch start
  document.addEventListener('touchstart', (e) => {
    // Remove any existing touch-hover first
    removeAllTouchHover();
    // Add touch-hover to the touched element
    addTouchHover(e.target);
  }, { passive: true });

  // Handle touch end - keep hover until next touch
  document.addEventListener('touchend', (e) => {
    // Small delay to allow click to fire first, then remove hover
    setTimeout(() => {
      removeAllTouchHover();
    }, 100);
  }, { passive: true });

  // Handle click on document to remove touch-hover (clicking off elements)
  document.addEventListener('click', (e) => {
    // Only remove if clicking outside of interactive elements
    const isInteractive = e.target.closest(touchHoverSelectors.join(', '));
    if (!isInteractive) {
      removeAllTouchHover();
    }
  });

  // Handle touch move - prevent hover from sticking if swiping
  document.addEventListener('touchmove', () => {
    removeAllTouchHover();
  }, { passive: true });
});

// Scroll Effect
document.addEventListener("DOMContentLoaded", () => {
  const head = document.querySelector(".head");
  const content = head.querySelectorAll(":scope > *:not(nav)");
  const mainContainer = document.querySelector("#main");
  const backToTopBtn = document.querySelector(".back-to-top");
  const wrapperHead = document.querySelector(".wrapper-head");

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

  // Function to check if device is in landscape mode on mobile
  const isLandscapeMobile = () => {
    return window.innerWidth <= 939 && window.innerHeight < window.innerWidth;
  };

  const handleScroll = () => {
  const y = window.scrollY;
  const siteAvatarSmall = document.querySelector(".site-avatar-small");
  const siteAvatar = document.querySelector(".site-avatar"); // main avatar

  // Check if in landscape mobile mode - apply minimized state by default
  const landscapeMode = isLandscapeMobile();

  if (window.innerWidth <= 939) {
    // If in landscape mode, always apply fully scrolled state
    const progress = landscapeMode ? 1 : Math.min(1, y / maxScrollDistanceForAnimation);
    const opacity = 1 - progress;
    const heightProgress = Math.min(1, Math.pow(progress, 0.5));
    const currentMaxHeight = (1 - heightProgress) * initialContentMaxHeight;

    // Animate wrapperHead top property (0 to -1em)
    if (wrapperHead) {
      const topValue = -1 * progress; // 0 to -1
      wrapperHead.style.top = `${topValue}em`;
    }

    // Animate header content, excluding the main avatar
    content.forEach(el => {
      if (el !== siteAvatar) {
        el.style.opacity = opacity;
        el.style.maxHeight = `${Math.max(0, currentMaxHeight)}px`;
      }
    });

    // Animate main avatar perfectly square
    if (siteAvatar) {
      // Clamp the size so it never grows bigger than original
      const originalSize = siteAvatar.dataset.originalSize
        ? parseFloat(siteAvatar.dataset.originalSize)
        : siteAvatar.offsetHeight;

      if (!siteAvatar.dataset.originalSize) {
        siteAvatar.dataset.originalSize = originalSize; // store for future
      }

      const size = Math.min(originalSize, Math.max(0, currentMaxHeight));
      siteAvatar.style.height = `${size}px`;
      siteAvatar.style.width = `${size}px`;
      const opacity = size / originalSize;
      siteAvatar.style.opacity = opacity;
      siteAvatar.style.opacity = size / originalSize;
    }

    // Show site-avatar-small only when scroll effect is fully applied or in landscape mode
    if (siteAvatarSmall) {
      if (progress >= 1 || landscapeMode) {
        siteAvatarSmall.style.opacity = '1';
        siteAvatarSmall.style.visibility = 'visible';
      } else {
        siteAvatarSmall.style.opacity = '0';
        siteAvatarSmall.style.visibility = 'hidden';
      }
    }

    if (mainContainer && mainContainer.style.marginTop) {
      mainContainer.style.marginTop = '';
    }
  } else {
    // Reset styles when not mobile
    content.forEach(el => {
      el.style.opacity = '';
      el.style.maxHeight = '';
    });

    if (siteAvatar) {
      siteAvatar.style.width = '';
      siteAvatar.style.height = '';
      siteAvatar.dataset.originalSize = ''; // optional reset
    }

    if (siteAvatarSmall) {
      siteAvatarSmall.style.opacity = '0';
      siteAvatarSmall.style.visibility = 'hidden';
    }

    if (mainContainer && mainContainer.style.marginTop) {
      mainContainer.style.marginTop = '';
    }

    // Reset wrapperHead top property on desktop
    if (wrapperHead) {
      wrapperHead.style.top = '';
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

    const siteAvatarSmall = document.querySelector(".site-avatar-small");
    if (window.innerWidth > 939) {
      content.forEach(el => {
        el.style.opacity = '';
        el.style.maxHeight = '';
      });
      if (mainContainer) {
        mainContainer.style.marginTop = '';
      }
      // Hide site-avatar-small on desktop
      if (siteAvatarSmall) {
        siteAvatarSmall.style.opacity = '0';
        siteAvatarSmall.style.visibility = 'hidden';
      }
      // Reset wrapperHead on desktop
      if (wrapperHead) {
        wrapperHead.style.top = '';
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

// Timeline collapse
function collapseTimeline(id) {
  const timeline = document.getElementById(id);
  const rect = timeline.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  window.scrollTo({ 
    top: scrollTop + rect.top - 200, 
    behavior: 'smooth' 
  });
}