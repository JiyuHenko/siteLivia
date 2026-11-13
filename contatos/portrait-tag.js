const portrait = document.querySelector('.bio-portrait');
const motion = window.matchMedia('(prefers-reduced-motion: no-preference)');
let pendingFrame = 0;

function positionTag() {
  pendingFrame = 0;
  const { top, height } = portrait.getBoundingClientRect();
  // Follow the portrait as it leaves the viewport, with a smaller return swing.
  const progress = Math.min(1, Math.max(0, -top / height));
  const swing = 11 * Math.sin(progress * Math.PI * 2) * (1 - progress);
  portrait.style.setProperty('--bio-tag-swing', `${swing.toFixed(2)}deg`);
}

function scheduleTag() {
  if (motion.matches && !pendingFrame) {
    pendingFrame = window.requestAnimationFrame(positionTag);
  }
}

window.addEventListener('scroll', scheduleTag, { passive: true });
window.addEventListener('resize', scheduleTag);
window.addEventListener('pageshow', scheduleTag);
motion.addEventListener('change', scheduleTag);
scheduleTag();
