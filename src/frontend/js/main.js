// Frame loop: steps the physics, then draws the pet. Loaded last.

// Blinking
let nextBlink = 2 + Math.random() * 3;
let blinkT = -1; // -1 = not blinking, otherwise 0..1 progress

let lastFrame = performance.now();

function drawPet(now) {
  // Frame-rate independent timestep, clamped so a backgrounded window doesn't explode the springs
  const dt = Math.min((now - lastFrame) / 1000, 1 / 30);
  lastFrame = now;
  time += dt * (mood === 'sleep' ? 1.4 : 3); // slow, deep breaths while asleep

  // Asleep: head nods down. Snack incoming: eyes lock onto it.
  if (mood === 'sleep') {
    lookX.target = 0;
    lookY.target = 0.25;
  } else if (snack) {
    lookX.target = clamp(Math.atan2(snack.x - x, 140), -0.9, 0.9);
    lookY.target = clamp(Math.atan2(snack.y - faceY, 140), -0.8, 0.8);
  }

  for (const s of [lookX, lookY, wobbleX, wobbleY, squash, melt, sway]) stepSpring(s, dt);
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
      sway.velocity += (Math.random() < 0.5 ? -1 : 1) * 5; // sprout flops on landing
    }
  }

  if (mood === 'sleep' && (nextZ -= dt) <= 0) {
    nextZ = 1.3;
    spawn('z', body.cx + body.rx * 0.55, body.cy - body.ry * 0.75, 10, -16, 2);
  }

  ctx.clearRect(0, 0, SIZE, SIZE);

  // 1. Shape: breathing + wobble + squash + melt, bottom planted on the ground
  const breath = Math.sin(time);
  const wx = clamp(wobbleX.value * 0.05, -8, 8);
  const wy = clamp(wobbleY.value * 0.05, -8, 8);
  const sq = clamp(squash.value, -0.35, 0.45);
  const m = clamp(melt.value, 0, 1.1);

  let rx = baseRadius + breath * 1.5 + Math.abs(wx) - Math.abs(wy) * 0.5;
  let ry = baseRadius - breath * 2 + Math.abs(wy) - Math.abs(wx) * 0.5;
  // Roughly volume-preserving: what's lost in height goes into width
  rx *= 1 + sq * 0.6 + m * 0.5;
  ry *= 1 - sq - m * 0.58;

  body = { cx: x + wx * 0.5, cy: groundY - ry + hop.y, rx, ry };

  // Ground shadow, shrinking while airborne
  const lift = 1 + hop.y / 120;
  ctx.beginPath();
  ctx.ellipse(body.cx, groundY + 3, rx * 0.85 * lift, 5 * lift, 0, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(0, 0, 0, ${0.12 * lift})`;
  ctx.fill();

  // Melt drips spreading from the puddle's edges
  if (m > 0.25) {
    ctx.fillStyle = '#5AB3E6';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(body.cx + side * rx * 0.95, groundY - 3, 9 * m, 4 * m, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 3. Face rolls around the body sphere: the head turns part of the way,
  //    the eyeballs do the rest
  const turnA = lookX.value * 0.45;
  const turnB = lookY.value * 0.3 + m * 0.35; // melted face slides down

  // Sprout on top, behind the body edge so it grows out of the head.
  // It leans against the wobble and head turn, and droops when melted.
  sway.target = clamp(-wx * 0.08 - lookX.value * 0.35, -0.8, 0.8) + m * 0.9;
  drawSprout(body.cx + Math.sin(turnA) * rx * 0.3, body.cy - ry + 3, sway.value);

  // 2. Body: soft jelly gradient, lit from the top-left
  const jelly = ctx.createRadialGradient(
    body.cx - rx * 0.35, body.cy - ry * 0.45, 2,
    body.cx, body.cy, Math.max(rx, ry) * 1.1
  );
  jelly.addColorStop(0, '#9AD6F7');
  jelly.addColorStop(0.45, '#5AB3E6');
  jelly.addColorStop(1, '#3E8FD0');
  ctx.beginPath();
  ctx.ellipse(body.cx, body.cy, rx, ry, wx * 0.01, 0, Math.PI * 2);
  ctx.fillStyle = jelly;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#3F82C9';
  ctx.stroke();

  // Rim light along the bottom-right edge, like light passing through jelly
  ctx.beginPath();
  ctx.ellipse(body.cx, body.cy, Math.max(rx - 5, 1), Math.max(ry - 5, 1), wx * 0.01, 0.25, 1.35);
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.stroke();

  const leftEye = projectOnBody(-0.4, -0.04, turnA, turnB);
  const rightEye = projectOnBody(0.4, -0.04, turnA, turnB);
  const mouth = projectOnBody(0, 0.25, turnA, turnB);

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

  // Rosy cheeks, always on, glowing brighter when happy
  const blush = mood === 'happy' ? 0.7 : isSad() ? 0.18 : 0.38;
  drawBlush(projectOnBody(-0.68, 0.2, turnA, turnB), blush);
  drawBlush(projectOnBody(0.68, 0.2, turnA, turnB), blush);

  if (mood === 'happy') {
    drawHappyEye(leftEye);
    drawHappyEye(rightEye);
  } else if (mood === 'melt' || mood === 'sleep') {
    drawMeltedEye(leftEye);
    drawMeltedEye(rightEye);
  } else {
    // Glum pets look half-lidded
    if (isSad()) openness = Math.min(openness, 0.65);
    drawEye(leftEye, lookX.value, lookY.value, openness);
    drawEye(rightEye, lookX.value, lookY.value, openness);
  }

  // 4. Mouth
  drawMouth(mouth);

  // Falling apple, drawn in front of the face so it drops into the mouth
  if (snack) {
    snack.vy += 700 * dt;
    snack.y += snack.vy * dt;
    snack.x += (body.cx - snack.x) * Math.min(1, dt * 10);
    if (snack.y >= mouth.y - 3) eatSnack();
    else drawApple(snack.x, snack.y);
  }

  // 5. Glossy highlight, fixed to the light and drawn over the face like a
  //    shine on the jelly's surface
  ctx.beginPath();
  ctx.ellipse(body.cx - rx * 0.4, body.cy - ry * 0.5, 10, 6 * (ry / baseRadius), -0.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fill();

  drawParticles();

  requestAnimationFrame(drawPet);
}

// ---------- Start ----------

loadStats();
setInterval(saveStats, 5000);
window.addEventListener('beforeunload', saveStats);
requestAnimationFrame(drawPet);
