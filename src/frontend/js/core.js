// Shared setup and state: canvas, math helpers, springs and the pet's state.
// Loaded first; the other scripts read and write these globals.

const canvas = document.getElementById('petCanvas');
const ctx = canvas.getContext('2d');

// Render at native Retina resolution while keeping a 200x200 logical space.
const SIZE = 200;
const dpr = window.devicePixelRatio || 1;
canvas.width = SIZE * dpr;
canvas.height = SIZE * dpr;
ctx.scale(dpr, dpr);

// Blob parameters
const baseRadius = 45;
const x = SIZE / 2;
const groundY = 168;            // the blob sits on this line; squash keeps its bottom planted
const faceY = groundY - baseRadius;
let time = 0;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Damped spring: pulls `value` toward `target` with stiffness k and damping c.
function spring(stiffness, damping) {
  return { value: 0, velocity: 0, target: 0, stiffness, damping };
}
function stepSpring(s, dt) {
  const force = (s.target - s.value) * s.stiffness - s.velocity * s.damping;
  s.velocity += force * dt;
  s.value += s.velocity * dt;
}

// Gaze in radians (yaw = left/right, pitch = up/down), slightly underdamped
const lookX = spring(120, 12);
const lookY = spring(120, 12);
// Body wobble, kicked when the cursor moves quickly
const wobbleX = spring(180, 6);
const wobbleY = spring(180, 6);
// Squash: >0 flattens, <0 stretches. Low damping = bouncy jelly.
const squash = spring(260, 7);
// Melt: 0 = solid, 1 = puddle. Soft and slow, like goo.
const melt = spring(28, 8);
// Head sprout lean in radians: loose, so it keeps swaying after a bounce
const sway = spring(70, 3.5);

function logState(message) {
  if (window.tiny) tiny.api.call('logState', { message }).catch(() => {});
}

// ---------- Pet state ----------

let mood = 'idle';        // 'idle' | 'happy' | 'melt' | 'sleep'
let moodTimer = 0;
let recentClicks = [];

let snack = null;              // falling apple: { x, y, vy }
const hop = { y: 0, vy: 0 };   // jump offset (negative = up)
const particles = [];          // hearts, z's and crumbs
let nextZ = 0;

// Current body shape, updated every frame; used for hit-testing clicks
let body = { cx: x, cy: faceY, rx: baseRadius, ry: baseRadius };
