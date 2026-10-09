// Frame loop: steps the shared physics, works out the body's shape, then
// hands drawing over to the active pet.

// Blinking
let nextBlink = 2 + Math.random() * 3;
let blinkT = -1; // -1 = not blinking, otherwise 0..1 progress

let lastFrame = performance.now();

function frame(now) {
  // Frame-rate independent timestep, clamped so a backgrounded window doesn't explode the springs
  const dt = Math.min((now - lastFrame) / 1000, 1 / 30);
  lastFrame = now;
  time += dt * (mood === 'sleep' ? 1.4 : 3); // slow, deep breaths while asleep

  // Asleep: head nods down. Snack incoming: eyes lock onto it.
  if (mood === 'sleep') {
    lookX.target = 0;
    lookY.target = 0.25;
  } else if (snack) {
    lookX.target = clamp(Math.atan2(snack.x - homeX, 140), -0.9, 0.9);
    lookY.target = clamp(Math.atan2(snack.y - faceY, 140), -0.8, 0.8);
  }

  for (const s of [lookX, lookY, wobbleX, wobbleY, squash, sway, ...(pet.springs || [])]) stepSpring(s, dt);
  updateMood(dt);
  updateStats(dt);
  updateParticles(dt);
  renderPanel();

  // Jump: simple gravity, squish on landing
  if (hop.vy !== 0 || hop.y < 0) {
    hop.vy += 1100 * dt;
    hop.y += hop.vy * dt;
    if (hop.y >= 0) {
      hop.y = 0;
      hop.vy = 0;
      squash.velocity += 3.5;
      sfx('land');
      sway.velocity += (Math.random() < 0.5 ? -1 : 1) * 5; // accessories flop on landing
    }
  }

  if (mood === 'sleep' && (nextZ -= dt) <= 0) {
    nextZ = 1.3;
    spawn('z', body.cx + body.rx * 0.55, body.cy - body.ry * 0.75, 10, -16, 2);
  }

  nextBlink -= dt;
  if (nextBlink <= 0 && blinkT < 0 && mood === 'idle') blinkT = 0;
  let openness = 1;
  if (blinkT >= 0) {
    blinkT += dt / 0.18;
    openness = Math.abs(1 - blinkT * 2);
    if (blinkT >= 1) {
      blinkT = -1;
      nextBlink = 2 + Math.random() * 4;
    }
  }

  ctx.clearRect(0, 0, SIZE, SIZE);

  // Shape: breathing + wobble + squash, bottom planted on the ground. The pet
  // can spread itself wider/flatter on top of that (the slime's melt).
  const breath = Math.sin(time);
  const wx = clamp(wobbleX.value * 0.05, -8, 8);
  const wy = clamp(wobbleY.value * 0.05, -8, 8);
  const sq = clamp(squash.value, -0.35, 0.45);
  const spread = pet.spread?.() || { x: 0, y: 0 };

  let rx = baseRadius + breath * 1.5 + Math.abs(wx) - Math.abs(wy) * 0.5;
  let ry = baseRadius - breath * 2 + Math.abs(wy) - Math.abs(wx) * 0.5;
  // Roughly volume-preserving: what's lost in height goes into width
  rx *= 1 + sq * 0.6 + spread.x;
  ry *= 1 - sq - spread.y;

  body = { cx: homeX + wx * 0.5, cy: groundY - ry + hop.y, rx, ry };

  // Ground shadow, shrinking while airborne
  const lift = 1 + hop.y / 120;
  ctx.beginPath();
  ctx.ellipse(body.cx, groundY + 3, rx * 0.85 * lift, 5 * lift, 0, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(0, 0, 0, ${0.12 * lift})`;
  ctx.fill();

  // The pet draws its body and face. The face rolls around the body sphere:
  // the head turns part of the way, the eyeballs do the rest.
  const f = { dt, wx, openness, turnA: lookX.value * 0.45, turnB: lookY.value * 0.3, mouth: null };
  pet.draw(f);

  // Falling snack, drawn in front of the face so it drops into the mouth
  if (snack) {
    snack.vy += 700 * dt;
    snack.y += snack.vy * dt;
    snack.x += (body.cx - snack.x) * Math.min(1, dt * 10);
    if (snack.y >= f.mouth.y - 3) eatSnack();
    else (pet.drawSnack || drawApple)(snack.x, snack.y);
  }

  pet.drawOver?.(f);
  drawParticles();

  requestAnimationFrame(frame);
}
