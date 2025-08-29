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