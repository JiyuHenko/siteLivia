const tag = document.querySelector('.bio-tag-pendulum');
const anchor = tag.parentElement;
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
  const maxAngle = narrowScreen.matches ? 12 : 15;
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

function nudgeTag(impulse, maxVelocity = narrowScreen.matches ? 94 : 124) {
  velocity = Math.max(-maxVelocity, Math.min(maxVelocity, velocity + impulse));
  if (!frame) frame = window.requestAnimationFrame(swing);
}

function pushTagFromScroll() {
  const scroll = window.scrollY;
  const distance = scroll - lastScroll;
  lastScroll = scroll;
  if (!motion.matches || !distance) return;

  const { top, bottom } = tag.getBoundingClientRect();
  if (bottom <= 0 || top >= window.innerHeight) return;

  nudgeTag(distance * 2.8);
}

function pointerDirection(event) {
  const { left, width } = anchor.getBoundingClientRect();
  return event.clientX < left + width / 2 ? -1 : 1;
}

anchor.addEventListener('pointerenter', (event) => {
  if (motion.matches && event.pointerType === 'mouse') nudgeTag(pointerDirection(event) * 92);
});
anchor.addEventListener('pointerup', (event) => {
  if (!motion.matches || !event.isPrimary || event.button !== 0) return;

  // Add momentum in the current direction, or toward rest at a turning point.
  const direction = Math.abs(velocity) > 1 ? Math.sign(velocity) : -Math.sign(angle) || pointerDirection(event);
  const impulse = frame ? 57 : 108;
  nudgeTag(direction * impulse, narrowScreen.matches ? 192 : 220);
});
window.addEventListener('scroll', pushTagFromScroll, { passive: true });
window.addEventListener('pageshow', resetSwing);
motion.addEventListener('change', resetSwing);
