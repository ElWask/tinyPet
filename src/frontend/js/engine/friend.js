// Friends: while two pets are docked they notice each other. Each page tells
// its partner what just happened (via the backend) and reacts to what the
// partner tells it. Reactions never tell back, so nothing ping-pongs.

// Which way the friend sits: 1 = to the right, -1 = to the left
const friendSide = () => (docked === 'left' ? 1 : -1);

// Look over at the friend for a while (input.js holds off the cursor meanwhile)
function glanceAtFriend(seconds) {
  if (!docked || mood === 'sleep') return;
  glance = Math.max(glance, seconds);
}

function updateGlance(dt) {
  if (glance > 0) {
    glance -= dt;
    lookX.target = 0.85 * friendSide();
    lookY.target = 0.05;
  }
  // Now and then, glance over on its own
  if (docked && mood === 'idle' && (nextGlance -= dt) <= 0) {
    nextGlance = 7 + Math.random() * 9;
    glanceAtFriend(1 + Math.random());
  }
}
let nextGlance = 4;

function tell(kind) {
  if (docked) tiny.api.call('tell', { kind }).catch(() => {});
}

// A heart floating over toward the friend
function heartToFriend() {
  const s = friendSide();
  spawn('heart', body.cx + s * body.rx * 0.6, body.cy - body.ry * 0.6, s * 40, -40, 1.3);
}

function onFriend(kind) {
  if (mood === 'sleep') {
    // Only a big commotion makes a sleeper stir
    if (kind === 'special') squash.velocity += 1.5;
    return;
  }
  const s = friendSide();
  switch (kind) {
    case 'hello':                         // just docked: both look and bounce
      glanceAtFriend(1.4);
      if (hop.vy === 0) hop.vy = -170;
      setTimeout(heartToFriend, 250);
      sfx('chirp', 120);
      break;
    case 'poke':                          // friend got booped: look, little sympathetic squish
      glanceAtFriend(1.2);
      squash.velocity += 1.5;
      break;
    case 'happy':                         // friend ate or played: get happy too
      glanceAtFriend(1.5);
      if (mood === 'idle') {
        mood = 'happy';
        moodTimer = 0.8;
      }
      squash.velocity += 2;
      bump('fun', 2);
      setTimeout(heartToFriend, 200);
      break;
    case 'special':                       // friend melted/puffed: startled, lean away, then stare
      glanceAtFriend(2);
      wobbleX.velocity -= s * 140;
      squash.velocity -= 2.5;
      sfx('boop');
      break;
    case 'sleep':                         // friend dozed off: a sympathetic yawn
      glanceAtFriend(1.5);
      if (mood === 'idle') {
        spawn('z', body.cx + s * body.rx * 0.6, body.cy - body.ry * 0.7, s * 12, -18, 1.4);
        sfx('yawn', 400);
      }
      break;
    case 'wake':                          // friend woke up: good morning!
      glanceAtFriend(1.2);
      if (hop.vy === 0) hop.vy = -150;
      break;
  }
}

if (window.tiny) {
  tiny.api.on('friend', (e) => { if (e?.to === tiny.win.id) onFriend(e.kind); });
}
