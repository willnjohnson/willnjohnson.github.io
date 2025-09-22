function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = name + "=" + value + "; expires=" + expires + "; path=/";
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

function applyTheme(theme) {
  const html = document.documentElement;
  html.classList.remove("light-theme", "dark-theme");
  
  if (theme === "dark") {
    html.classList.add("dark-theme");
    setCookie("theme", "dark", 365);
  } else {
    html.classList.add("light-theme"); 
    setCookie("theme", "light", 365);
  }
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