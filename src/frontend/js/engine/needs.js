// Tamagotchi needs: the three stats, how they drain, and saving them.

// 0..100, higher is better. Drain rates are points per second while awake.
const stats = { food: 80, fun: 80, energy: 80 };
const DRAIN = { food: 1 / 50, fun: 1 / 40, energy: 1 / 70 };
const SLEEP_REST = 1 / 1.5;   // energy gained per second asleep

// Every pet keeps its own needs
const statsKey = () => 'tinypet-stats-' + pet.id;

function loadStats() {
  stats.food = stats.fun = stats.energy = 80;
  try {
    const saved = JSON.parse(localStorage.getItem(statsKey()));
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
    localStorage.setItem(statsKey(), JSON.stringify({ ...stats, asleep: mood === 'sleep', at: Date.now() }));
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
