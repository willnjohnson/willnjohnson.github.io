// Save theme as cookie
function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();

  const hostname = location.hostname;
  const parts = hostname.split('.');

  let domain = hostname;

  // If it's something like sub.domain.com → reduce to domain.com
  if (parts.length > 2) {
    domain = '.' + parts.slice(-2).join('.');
  } else {
    domain = '.' + hostname;
  }

  document.cookie =
    name + "=" + value +
    "; expires=" + expires +
    "; path=/" +
    "; domain=" + domain +
    "; SameSite=Lax; Secure";
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

function applyTheme(theme) {
  const html = document.documentElement;
  const icon = document.getElementById("theme-icon");
  
  html.classList.remove("light-theme", "dark-theme");
  
  if (theme === "dark") {
    html.classList.add("dark-theme");
    if (icon) {
      icon.classList.remove("fa-cloud-moon", "fa-solid");
      icon.classList.add("fa-cloud-sun", "fa-solid");
    }
    setCookie("theme", "dark", 365);
  } else {
    html.classList.add("light-theme");
    if (icon) {
      icon.classList.remove("fa-cloud-sun", "fa-solid");
      icon.classList.add("fa-cloud-moon", "fa-solid");
    }
    setCookie("theme", "light", 365);
  }
  
  // Dispatch custom event for theme change
  window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: theme } }));
}

function getSystemTheme() {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function getCurrentTheme() {
  const savedTheme = getCookie("theme");
  return savedTheme || getSystemTheme();
}

// Theme toggle
document.addEventListener('DOMContentLoaded', function() {
  const toggleBtn = document.getElementById("theme-toggle");
  const icon = document.getElementById("theme-icon");
  
  if (!toggleBtn) {
    console.error("Toggle button not found!");
    return;
  }
  
  // Initialize theme on page load
  const currentTheme = getCurrentTheme();
  applyTheme(currentTheme);

  // Toggle button event listener
  toggleBtn.addEventListener("click", function(e) {
    e.preventDefault();
    const currentTheme = getCurrentTheme();
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
  });

  // Listen for system theme changes
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!getCookie('theme')) {
        const systemTheme = e.matches ? 'dark' : 'light';
        applyTheme(systemTheme);
      }
    });
  }
});

// Dropdown toggle
document.addEventListener('DOMContentLoaded', () => {
  const burger = document.getElementById('burger-btn');
  const dropdown = document.getElementById('dropdown-menu');

  if (!burger || !dropdown) return;

  // Position dropdown below burger
  function positionDropdown() {
    const rect = burger.getBoundingClientRect();
    dropdown.style.top = `${rect.bottom + 8}px`;
  }

  // Toggle dropdown visibility
  function toggleDropdown(e) {
    e.stopPropagation();
    dropdown.classList.toggle('active');
    positionDropdown();
  }

  // Close dropdown if click/tap outside
  function closeDropdown(e) {
    // If event target is inside dropdown or burger, ignore
    if (dropdown.contains(e.target) || burger.contains(e.target)) return;
    dropdown.classList.remove('active');
  }

  // Event listeners
  burger.addEventListener('click', toggleDropdown);
  dropdown.addEventListener('click', e => e.stopPropagation());

  // Listen for click and touchstart on document for mobile
  document.addEventListener('click', closeDropdown);
  document.addEventListener('touchstart', closeDropdown, { passive: true });

  // Reposition dropdown on scroll/resize
  window.addEventListener('scroll', () => {
    if (dropdown.classList.contains('active')) positionDropdown();
  }, { passive: true });

  window.addEventListener('resize', () => {
    if (dropdown.classList.contains('active')) positionDropdown();
  });
});