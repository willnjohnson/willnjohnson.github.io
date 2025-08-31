document.addEventListener("DOMContentLoaded", () => {
  const slot = document.getElementById("random-quote");
  if (!slot) return;

  const quotesData = slot.getAttribute("data-quotes");
  if (!quotesData) return;

  let quotes;
  try {
    quotes = JSON.parse(quotesData);
  } catch (e) {
    console.error("Invalid quotes JSON", e);
    return;
  }

  const randomIndex = Math.floor(Math.random() * quotes.length);
  slot.textContent = quotes[randomIndex];
});
