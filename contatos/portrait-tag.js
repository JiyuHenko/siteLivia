const tag = document.querySelector('.bio-tag-pendulum');
const motion = window.matchMedia('(prefers-reduced-motion: no-preference)');
const narrowScreen = window.matchMedia('(max-width: 740px)');
let angle = 0;
let velocity = 0;
let frame = 0;
let lastTime = 0;
let lastScroll = window.scrollY;

function resetSwing() {
  window.cancelAnimationFrame(frame);
  frame = 0;
  lastTime = 0;
  lastScroll = window.scrollY;
  angle = 0;
  velocity = 0;
  tag.style.removeProperty('--bio-tag-swing');
}

function swing(time) {
  const elapsed = lastTime ? Math.min((time - lastTime) / 1000, .032) : 1 / 60;
  lastTime = time;
  // A restoring force pulls the tag back toward rest while damping slows each pass.
  velocity += (-70 * angle - 7 * velocity) * elapsed;
  angle += velocity * elapsed;
  const maxAngle = narrowScreen.matches ? 8 : 12;
  if (Math.abs(angle) > maxAngle) {
    angle = Math.sign(angle) * maxAngle;
    velocity = 0;
  }

  if (Math.abs(angle) < .08 && Math.abs(velocity) < .5) {
    resetSwing();
    return;
  }

  tag.style.setProperty('--bio-tag-swing', `${angle.toFixed(2)}deg`);
  frame = window.requestAnimationFrame(swing);
}

function pushTag() {
  const scroll = window.scrollY;
  const distance = scroll - lastScroll;
  lastScroll = scroll;
  if (!motion.matches || !distance) return;

  const { top, bottom } = tag.getBoundingClientRect();
  if (bottom <= 0 || top >= window.innerHeight) return;

  const maxVelocity = narrowScreen.matches ? 82 : 110;
  velocity = Math.max(-maxVelocity, Math.min(maxVelocity, velocity + distance * 2.5));
  if (!frame) frame = window.requestAnimationFrame(swing);
}

window.addEventListener('scroll', pushTag, { passive: true });
window.addEventListener('pageshow', resetSwing);
motion.addEventListener('change', resetSwing);
