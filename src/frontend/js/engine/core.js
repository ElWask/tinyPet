// Shared setup and state: canvas, math helpers, springs, the pet registry and
// the pet's state. Loaded first; the other scripts read and write these globals.

const canvas = document.getElementById('petCanvas');
const ctx = canvas.getContext('2d');

// Render at native Retina resolution while keeping a 200x200 logical space.
const SIZE = 200;
const dpr = window.devicePixelRatio || 1;
canvas.width = SIZE * dpr;
canvas.height = SIZE * dpr;
ctx.scale(dpr, dpr);

// Body parameters, shared by every pet
const baseRadius = 45;
const homeX = SIZE / 2;         // where the body rests horizontally
const groundY = 168;            // the body sits on this line; squash keeps its bottom planted
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
// Lean of whatever sticks out of the pet (sprout, tuft, ears) in radians:
// loose, so it keeps swaying after a bounce. Pets set its target.
const sway = spring(70, 3.5);

function logState(message) {
  if (window.tiny) tiny.api.call('logState', { message }).catch(() => {});
}

// ---------- Pets ----------

// Each file in pets/ calls registerPet() with its look and its quirks;
// main.js picks which one is active. A pet is:
//   id, name        identity
//   accent          colour for the card's edge and badges
//   springs         extra springs the engine steps every frame
//   spread()        optional { x, y }: extra widening/flattening of the body
//   draw(f)         draws body and face; must set f.mouth = { x, y } for snacks
//   drawOver(f)     optional, drawn after the snack (shines, things in front)
//   drawSnack(x,y)  optional, defaults to the apple
//   special         { duration, start(), end(), poke() } for 3 quick pokes
//   sleep(), wake() optional pose changes
//   sounds          optional ZzFX overrides/extras, see engine/sound.js
// f carries { dt, wx, openness, turnA, turnB } from the engine; `body` holds
// the current { cx, cy, rx, ry }.
const PETS = {};
let pet = null;

function registerPet(def) {
  PETS[def.id] = def;
}

// ---------- Pet state ----------

let mood = 'idle';        // 'idle' | 'happy' | 'special' | 'sleep'
let moodTimer = 0;
let recentClicks = [];

let snack = null;              // falling food: { x, y, vy }
const hop = { y: 0, vy: 0 };   // jump offset (negative = up)
const particles = [];          // hearts, z's and crumbs
let nextZ = 0;
let glance = 0;                // seconds left looking over at a docked friend

// Current body shape, updated every frame; used for hit-testing clicks
let body = { cx: homeX, cy: faceY, rx: baseRadius, ry: baseRadius };
