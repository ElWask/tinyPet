// Face parts any pet can use: features placed on the body sphere, eyes,
// mouths and blush. Pure rendering; reads state but never changes it.

// ---------- Face on a sphere ----------

// Project a point given as angles on the body's sphere (a = around, b = up/down)
// after the head has turned by (turnA, turnB). Returns screen position and
// foreshortening factors, so features squeeze as they roll toward the edge.
function projectOnBody(a, b, turnA, turnB) {
  const A = a + turnA;
  const B = b + turnB;
  return {
    x: body.cx + Math.sin(A) * Math.cos(B) * body.rx,
    y: body.cy + Math.sin(B) * body.ry,
    sx: Math.cos(A),
    sy: Math.cos(B),
  };
}

// Each eye is a small sphere: the pupil rolls across it and flattens near the
// rim, while the glint stays fixed to the light (top-left)
function drawEye(p, gazeA, gazeB, openness) {
  const r = 9.5;
  ctx.save();
  ctx.translate(p.x, p.y);
  // Slightly taller than wide: reads as big and cute
  ctx.scale(p.sx, p.sy * 1.12 * Math.max(openness, 0.08));

  // Eyeball with a little shading so it reads as round
  const shade = ctx.createRadialGradient(-2, -3, 1, 0, 0, r);
  shade.addColorStop(0, '#FFFFFF');
  shade.addColorStop(1, '#D3E2F2');
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = shade;
  ctx.fill();
  ctx.clip();

  // Big iris projected on the eyeball sphere: navy with a lighter blue
  // bottom, like a cartoon eye catching bounce light
  const ix = Math.sin(gazeA) * r * 0.42;
  const iy = Math.sin(gazeB) * r * 0.42;
  const ir = 7;
  const iris = ctx.createLinearGradient(0, iy - ir, 0, iy + ir);
  iris.addColorStop(0, '#141B2E');
  iris.addColorStop(0.6, '#1F2C4D');
  iris.addColorStop(1, '#3E6FB0');
  ctx.beginPath();
  ctx.ellipse(ix, iy, ir * Math.cos(gazeA), ir * Math.cos(gazeB), 0, 0, Math.PI * 2);
  ctx.fillStyle = iris;
  ctx.fill();

  // Two glints fixed to the light: a big one and a tiny one
  ctx.fillStyle = 'rgba(255, 255, 255, 0.97)';
  ctx.beginPath();
  ctx.ellipse(-2.6, -3.2, 2.9, 2.5, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(2.6, 2.4, 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ^ shaped happy eye
function drawHappyEye(p, ink = '#1B2333') {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(p.sx, p.sy);
  ctx.beginPath();
  ctx.moveTo(-7.5, 2.5);
  ctx.quadraticCurveTo(0, -7.5, 7.5, 2.5);
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.strokeStyle = ink;
  ctx.stroke();
  ctx.restore();
}

// Droopy closed eye: asleep or blissed out
function drawClosedEye(p, ink = '#1B2333') {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(p.sx, p.sy);
  ctx.beginPath();
  ctx.moveTo(-7, -1);
  ctx.quadraticCurveTo(0, 5, 7, -1);
  ctx.lineWidth = 2.8;
  ctx.lineCap = 'round';
  ctx.strokeStyle = ink;
  ctx.stroke();
  ctx.restore();
}

// Mouth for the current mood, in the pet's colours: { line, fill }
function drawMouth(p, colors) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(p.sx, p.sy);
  ctx.lineCap = 'round';
  ctx.strokeStyle = colors.line;
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (snack) {
    // Mouth opens wider as the apple gets close
    const k = clamp(1 - (p.y - snack.y) / 90, 0.2, 1);
    ctx.ellipse(0, 0, 3 + 3.5 * k, 2.5 + 4.5 * k, 0, 0, Math.PI * 2);
    ctx.fillStyle = colors.fill;
    ctx.fill();
  } else if (mood === 'sleep') {
    // Tiny breathing "o"
    ctx.ellipse(0, 1, 2.6, 2 + Math.sin(time) * 0.7, 0, 0, Math.PI * 2);
    ctx.fillStyle = colors.fill;
    ctx.fill();
  } else if (mood === 'idle' && isSad()) {
    // Little frown
    ctx.arc(0, 6, 6, Math.PI + 0.45, Math.PI * 2 - 0.45);
    ctx.stroke();
  } else if (mood === 'happy') {
    // Open grin
    ctx.arc(0, -1, 7, 0, Math.PI);
    ctx.closePath();
    ctx.fillStyle = colors.fill;
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.beginPath();
    ctx.ellipse(0, 5, 4.5, 3.2, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#FF8FAB'; // tongue
    ctx.fill();
    ctx.restore();
    ctx.beginPath();
    ctx.arc(0, -1, 7, 0, Math.PI);
    ctx.closePath();
    ctx.stroke();
  } else if (mood === 'special') {
    // Wobbly goo smile
    ctx.moveTo(-8, 0);
    for (let i = -8; i <= 8; i++) ctx.lineTo(i, Math.sin(i * 0.9 + time * 3) * 1.5);
    ctx.stroke();
  } else {
    // Little cat mouth: ω
    ctx.lineWidth = 2.4;
    ctx.arc(-2.6, -0.5, 2.6, 0.1, Math.PI - 0.1);
    ctx.moveTo(5.2, -0.5);
    ctx.arc(2.6, -0.5, 2.6, 0.1, Math.PI - 0.1);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBlush(p, alpha) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(p.sx, p.sy);
  ctx.beginPath();
  ctx.ellipse(0, 0, 7.5, 4, 0, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255, 140, 170, ${alpha})`;
  ctx.fill();
  ctx.restore();
}

// Rosy cheeks, always on, glowing brighter when happy
function blushAlpha() {
  return mood === 'happy' ? 0.7 : isSad() ? 0.18 : 0.38;
}

// Both eyes in the style the mood calls for. `ink` colours the line-drawn
// happy/closed eyes (light on dark pets); `size` scales them (1 = default).
function drawEyes(left, right, openness, ink, size = 1) {
  if (size !== 1) {
    left = { ...left, sx: left.sx * size, sy: left.sy * size };
    right = { ...right, sx: right.sx * size, sy: right.sy * size };
  }
  if (mood === 'happy') {
    drawHappyEye(left, ink);
    drawHappyEye(right, ink);
  } else if (mood === 'special' || mood === 'sleep') {
    drawClosedEye(left, ink);
    drawClosedEye(right, ink);
  } else {
    // Glum pets look half-lidded
    if (isSad()) openness = Math.min(openness, 0.65);
    drawEye(left, lookX.value, lookY.value, openness);
    drawEye(right, lookX.value, lookY.value, openness);
  }
}
