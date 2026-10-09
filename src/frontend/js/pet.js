// Behaviour: needs (stats), actions, moods and particles. No drawing here.

// ---------- Tamagotchi stats ----------


// 0..100, higher is better. Drain rates are points per second while awake.
const stats = { food: 80, fun: 80, energy: 80 };
const DRAIN = { food: 1 / 50, fun: 1 / 40, energy: 1 / 70 };
const SLEEP_REST = 1 / 1.5;   // energy gained per second asleep
const STORE_KEY = 'tinypet-stats';

function spawn(kind, px, py, vx, vy, life) {
  particles.push({ kind, x: px, y: py, vx, vy, life, max: life });
}

function loadStats() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY));
    if (!saved) return;
    // Catch up on the time the app was closed (capped at a day), but never
    // let a stat sink below 10 while you were away
    const away = clamp((Date.now() - saved.at) / 1000, 0, 86400);
    for (const k of Object.keys(stats)) {
      if (typeof saved[k] === 'number') stats[k] = Math.max(Math.min(saved[k], 10), saved[k] - away * DRAIN[k]);
    }
    if (saved.asleep) {
      stats.energy = Math.min(100, stats.energy + away * SLEEP_REST);
      if (stats.energy < 100) goToSleep();
    }
  } catch (_) { /* no storage: start fresh */ }
}

function saveStats() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ ...stats, asleep: mood === 'sleep', at: Date.now() }));
  } catch (_) {}
}

function bump(key, amount) {
  stats[key] = clamp(stats[key] + amount, 0, 100);
}

function updateStats(dt) {
  const asleep = mood === 'sleep';
  bump('food', -DRAIN.food * dt * (asleep ? 0.5 : 1));
  bump('fun', -DRAIN.fun * dt * (asleep ? 0.3 : 1));
  bump('energy', asleep ? SLEEP_REST * dt : -DRAIN.energy * dt);
  if (asleep && stats.energy >= 100) wakeUp();
}

// Any need running low makes the pet glum
function isSad() {
  return Math.min(stats.food, stats.fun, stats.energy) < 20;
}

// ---------- Actions ----------

// Head shake: kick the gaze spring sideways and let it oscillate
function refuse() {
  lookX.velocity += 14;
  wobbleX.velocity += 120;
  sfx('nope');
  logState('nope');
}

function feed() {
  if (mood === 'sleep' || mood === 'melt' || snack) return;
  if (stats.food > 95) return refuse();
  snack = { x: body.cx, y: -12, vy: 0 };
}

function eatSnack() {
  snack = null;
  bump('food', 25);
  mood = 'happy';
  moodTimer = 0.9;
  squash.velocity += 3;
  sfx('chomp');
  sfx('chirp', 160);
  for (let i = 0; i < 6; i++) {
    spawn('crumb', body.cx + (Math.random() - 0.5) * 10, body.cy, (Math.random() - 0.5) * 90, -60 - Math.random() * 80, 0.6);
  }
  logState('fed');
}

function play() {
  if (mood === 'sleep' || mood === 'melt' || hop.vy !== 0) return;
  if (stats.energy < 15) {
    // Too tired: a sleepy droop and a yawn instead of a jump
    squash.velocity += 2.5;
    spawn('z', body.cx + body.rx * 0.6, body.cy - body.ry * 0.7, 12, -18, 1.4);
    sfx('yawn');
    return logState('too tired');
  }
  hop.vy = -290;
  squash.velocity -= 4;   // stretch on take-off
  sway.velocity += (Math.random() < 0.5 ? -1 : 1) * 4;
  sfx('jump');
  bump('fun', 20);
  bump('energy', -10);
  bump('food', -4);
  mood = 'happy';
  moodTimer = 1.1;
  for (const side of [-1, 1]) {
    spawn('heart', body.cx + side * body.rx * 0.7, body.cy - body.ry * 0.6, side * 22, -45, 1.2);
  }
  logState('played');
}

function goToSleep() {
  mood = 'sleep';
  snack = null;
  melt.target = 0.15;    // settle into a cozy loaf
  nextZ = 0.4;
  sfx('sleep');
  logState('sleeping');
}

function wakeUp() {
  mood = 'idle';
  melt.target = 0;
  squash.velocity -= 3;  // stretchy good-morning boing
  sfx('wake');
  logState('awake');
}

// ---------- Click reactions ----------

function onPoke() {
  if (mood === 'sleep') return wakeUp();
  bump('fun', 3);
  if (mood === 'melt') {
    // Poking a puddle just makes it ripple
    wobbleX.velocity += (Math.random() - 0.5) * 300;
    sfx('land');
    return;
  }

  const now = performance.now();
  recentClicks = recentClicks.filter((t) => now - t < 900);
  recentClicks.push(now);

  if (recentClicks.length >= 3) {
    recentClicks = [];
    mood = 'melt';
    moodTimer = 2.4;
    melt.target = 1;
    sfx('melt');
    logState('melting');
  } else {
    mood = 'happy';
    moodTimer = 0.9;
    squash.velocity += 4.5; // squish down, the spring bounces it back up
    sfx('boop');
    logState('booped');
  }
}

function updateMood(dt) {
  if (mood === 'idle' || mood === 'sleep') return;
  moodTimer -= dt;
  if (moodTimer > 0) return;

  if (mood === 'melt') {
    // Reform with a stretchy boing
    melt.target = 0;
    squash.velocity -= 5;
    sfx('reform');
    logState('reformed');
  }
  mood = 'idle';
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) { particles.splice(i, 1); continue; }
    if (p.kind === 'crumb') p.vy += 600 * dt;
    if (p.kind === 'z') p.x += Math.sin(p.life * 4) * 0.3;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
}
