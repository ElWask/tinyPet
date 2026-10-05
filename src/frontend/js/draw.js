// Canvas drawing: the face, the body's accessories and the particles.
// Pure rendering; reads state but never changes it.

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
function drawHappyEye(p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(p.sx, p.sy);
  ctx.beginPath();
  ctx.moveTo(-7.5, 2.5);
  ctx.quadraticCurveTo(0, -7.5, 7.5, 2.5);
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#1B2333';
  ctx.stroke();
  ctx.restore();
}

// Droopy, blissed-out melted eye
function drawMeltedEye(p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(p.sx, p.sy);
  ctx.beginPath();
  ctx.moveTo(-7, -1);
  ctx.quadraticCurveTo(0, 5, 7, -1);
  ctx.lineWidth = 2.8;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#1B2333';
  ctx.stroke();
  ctx.restore();
}

function drawMouth(p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(p.sx, p.sy);
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#3A6FB8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (snack) {
    // Mouth opens wider as the apple gets close
    const k = clamp(1 - (p.y - snack.y) / 90, 0.2, 1);
    ctx.ellipse(0, 0, 3 + 3.5 * k, 2.5 + 4.5 * k, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#2C4F86';
    ctx.fill();
  } else if (mood === 'sleep') {
    // Tiny breathing "o"
    ctx.ellipse(0, 1, 2.6, 2 + Math.sin(time) * 0.7, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#2C4F86';
    ctx.fill();
  } else if (mood === 'idle' && isSad()) {
    // Little frown
    ctx.arc(0, 6, 6, Math.PI + 0.45, Math.PI * 2 - 0.45);
    ctx.stroke();
  } else if (mood === 'happy') {
    // Open grin
    ctx.arc(0, -1, 7, 0, Math.PI);
    ctx.closePath();
    ctx.fillStyle = '#2C4F86';
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
  } else if (mood === 'melt') {
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

// Two-leaf sprout on a short stem, rotated around its base
function drawSprout(bx, by, angle) {
  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(1.5, -7, 0, -13);
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#4FA35F';
  ctx.stroke();
  for (const side of [-1, 1]) {
    const leaf = ctx.createLinearGradient(0, -13, side * 10, -17);
    leaf.addColorStop(0, '#5DBB6C');
    leaf.addColorStop(1, '#9BE38F');
    ctx.beginPath();
    ctx.ellipse(side * 5.2, -15.5, 5.8, 2.9, side * -0.45, 0, Math.PI * 2);
    ctx.fillStyle = leaf;
    ctx.fill();
  }
  ctx.restore();
}

function drawApple(px, py) {
  ctx.save();
  ctx.translate(px, py);
  ctx.beginPath();
  ctx.arc(-2.4, 0, 5, 0, Math.PI * 2);
  ctx.arc(2.4, 0, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#FF6B6B';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-3.2, -1.8, 1.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, -4);
  ctx.quadraticCurveTo(0.5, -7, 1.5, -8);
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#7A4B2A';
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(4, -7, 3, 1.5, -0.5, 0, Math.PI * 2);
  ctx.fillStyle = '#6BCB77';
  ctx.fill();
  ctx.restore();
}

function drawHeart(px, py, size) {
  ctx.save();
  ctx.translate(px, py);
  ctx.scale(size / 10, size / 10);
  ctx.beginPath();
  ctx.moveTo(0, 4);
  ctx.bezierCurveTo(-8, -1, -5, -8, 0, -4);
  ctx.bezierCurveTo(5, -8, 8, -1, 0, 4);
  ctx.fillStyle = '#FF6FA3';
  ctx.fill();
  ctx.restore();
}

function drawParticles() {
  for (const p of particles) {
    const t = p.life / p.max;   // 1 → 0
    ctx.globalAlpha = Math.min(1, t * 2);
    if (p.kind === 'heart') {
      drawHeart(p.x, p.y, 9 + (1 - t) * 4);
    } else if (p.kind === 'z') {
      ctx.font = `700 ${10 + (1 - t) * 6}px -apple-system, system-ui, sans-serif`;
      ctx.fillStyle = '#9B87F5';
      ctx.fillText('z', p.x, p.y);
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = '#E8A15A';
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}
