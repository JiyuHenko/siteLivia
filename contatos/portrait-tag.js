const tag = document.querySelector('.bio-tag-pendulum');
const anchor = tag.parentElement;
const handle = anchor.querySelector('.bio-tag-handle');
const motion = window.matchMedia('(prefers-reduced-motion: no-preference)');
const narrowScreen = window.matchMedia('(max-width: 740px)');
let angle = 0;
let velocity = 0;
let frame = 0;
let lastTime = 0;
let lastScroll = window.scrollY;
let drag = null;

function clamp(value, limit) {
  return Math.max(-limit, Math.min(limit, value));
}

function resetSwing() {
  window.cancelAnimationFrame(frame);
  frame = 0;
  lastTime = 0;
  lastScroll = window.scrollY;
  angle = 0;
  velocity = 0;
  tag.style.removeProperty('--bio-tag-swing');
}

function paintSwing() {
  tag.style.setProperty('--bio-tag-swing', `${angle.toFixed(2)}deg`);
}

function swing(time) {
  const elapsed = lastTime ? Math.min((time - lastTime) / 1000, .032) : 1 / 60;
  lastTime = time;
  // A restoring force pulls the tag back toward rest while damping slows each pass.
  velocity += (-70 * angle - 7 * velocity) * elapsed;
  angle += velocity * elapsed;
  const maxAngle = narrowScreen.matches ? 28 : 36;
  if (Math.abs(angle) > maxAngle) {
    angle = clamp(angle, maxAngle);
    velocity *= -.18;
  }

  if (Math.abs(angle) < .08 && Math.abs(velocity) < .5) {
    resetSwing();
    return;
  }

  paintSwing();
  frame = window.requestAnimationFrame(swing);
}

function startSwing() {
  if (!frame) frame = window.requestAnimationFrame(swing);
}

function nudgeTag(impulse, maxVelocity = narrowScreen.matches ? 94 : 124) {
  velocity = clamp(velocity + impulse, Math.max(maxVelocity, Math.abs(velocity)));
  startSwing();
}

function pushTagFromScroll() {
  const scroll = window.scrollY;
  const distance = scroll - lastScroll;
  lastScroll = scroll;
  if (!motion.matches || drag || !distance) return;

  const { top, bottom } = tag.getBoundingClientRect();
  if (bottom <= 0 || top >= window.innerHeight) return;

  nudgeTag(distance * 2.8);
}

function pointerDirection(event) {
  const { left, width } = anchor.getBoundingClientRect();
  return event.clientX < left + width / 2 ? -1 : 1;
}

function tapTag(side) {
  const direction = Math.abs(velocity) > 1 ? Math.sign(velocity) : -Math.sign(angle) || side;
  nudgeTag(direction * (frame ? 145 : 220), narrowScreen.matches ? 345 : 420);
}

function pointerAngle(event) {
  return Math.atan2(drag.pivotX - event.clientX, event.clientY - drag.pivotY) * 180 / Math.PI;
}

function moveTag(event) {
  if (event.pointerId !== drag?.id) return;

  if (!drag.pulling) {
    if (Math.abs(event.clientX - drag.startX) < 4) return;
    drag.pulling = true;
    drag.startAngle = angle;
    drag.time = event.timeStamp;
    window.cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    velocity = 0;
    anchor.classList.add('is-dragging');
  }

  const rotation = (pointerAngle(event) - drag.pointerAngle + 540) % 360 - 180;
  const nextAngle = clamp(drag.startAngle + rotation, narrowScreen.matches ? 22 : 29);
  const elapsed = event.timeStamp - drag.time;
  if (elapsed > 0) {
    const speed = (nextAngle - angle) * 1000 / elapsed;
    velocity = clamp(velocity * .25 + speed * .75, narrowScreen.matches ? 360 : 460);
  }
  drag.time = event.timeStamp;
  angle = nextAngle;
  paintSwing();
}

function releaseTag(event) {
  if (event.pointerId !== drag?.id) return;

  const { pulling, time } = drag;
  drag = null;
  anchor.classList.remove('is-dragging');
  if (pulling) {
    const pause = event.timeStamp - time;
    velocity *= event.type === 'pointerup' ? Math.max(0, 1 - pause / 100) : 0;
    startSwing();
  } else if (event.type === 'pointerup') {
    tapTag(pointerDirection(event));
  }
}

handle.addEventListener('pointerenter', (event) => {
  if (motion.matches && !drag && !event.buttons && event.pointerType === 'mouse') {
    nudgeTag(pointerDirection(event) * 92);
  }
});
anchor.addEventListener('pointerdown', (event) => {
  if (!motion.matches || drag || !event.isPrimary || event.button !== 0) return;

  const { left, top, width } = anchor.getBoundingClientRect();
  drag = { id: event.pointerId, startX: event.clientX, pivotX: left + width / 2, pivotY: top, pulling: false };
  drag.pointerAngle = pointerAngle(event);
  anchor.setPointerCapture(event.pointerId);
});
anchor.addEventListener('pointermove', moveTag);
anchor.addEventListener('pointerup', releaseTag);
anchor.addEventListener('pointercancel', releaseTag);
anchor.addEventListener('lostpointercapture', releaseTag);
handle.addEventListener('click', (event) => {
  if (motion.matches && event.detail === 0) tapTag(1);
});
window.addEventListener('scroll', pushTagFromScroll, { passive: true });
window.addEventListener('pageshow', resetSwing);
motion.addEventListener('change', () => {
  const pointerId = drag?.id;
  drag = null;
  anchor.classList.remove('is-dragging');
  if (pointerId !== undefined && anchor.hasPointerCapture(pointerId)) anchor.releasePointerCapture(pointerId);
  resetSwing();
});
