// What the pet does: feed, play, sleep, pokes and the mood timer. Shared by
// every pet; the pet's own quirks come in through hooks on `pet`.

// Head shake: kick the gaze spring sideways and let it oscillate
function refuse() {
  lookX.velocity += 14;
  wobbleX.velocity += 120;
  sfx('nope');
  logState('nope');
}

function feed() {
  if (mood === 'sleep' || mood === 'special' || snack) return;
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
  if (mood === 'sleep' || mood === 'special' || hop.vy !== 0) return;
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
  nextZ = 0.4;
  pet.sleep?.();
  sfx('sleep');
  logState('sleeping');
}

function wakeUp() {
  mood = 'idle';
  pet.wake?.();
  squash.velocity -= 3;  // stretchy good-morning boing
  sfx('wake');
  logState('awake');
}

// ---------- Click reactions ----------

function onPoke() {
  if (mood === 'sleep') return wakeUp();
  bump('fun', 3);
  if (mood === 'special') return pet.special.poke?.();

  const now = performance.now();
  recentClicks = recentClicks.filter((t) => now - t < 900);
  recentClicks.push(now);

  if (recentClicks.length >= 3) {
    // Three quick pokes: the pet's signature move
    recentClicks = [];
    mood = 'special';
    moodTimer = pet.special.duration;
    pet.special.start();
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
  if (mood === 'special') pet.special.end();
  mood = 'idle';
}
