// Little things that fly around the pet: hearts, z's and crumbs, plus the
// default snack.

function spawn(kind, px, py, vx, vy, life) {
  particles.push({ kind, x: px, y: py, vx, vy, life, max: life });
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
