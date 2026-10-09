// Mochi cat: a soft, squishy rice-cake cat with pointy ears and a swishy
// tail. Three quick pokes melt it into a gooey mochi puddle.

(() => {
  // Melt: 0 = solid, 1 = puddle. Soft and slow, like warm mochi.
  const melt = spring(28, 8);
  // Ears: 0 = perky, 1 = flat. Droop when sleepy or glum, perk up when happy.
  const droop = spring(60, 9);
  // Single-ear flick now and then
  const twitch = spring(220, 9);
  let nextTwitch = 3;
  let twitchSide = 1;

  const m = () => clamp(melt.value, 0, 1.1);

  // Midnight-blue mochi with pink ears, nose and cheeks
  const C = {
    light: '#6273AD',
    mid: '#3A4475',
    dark: '#232A4A',
    line: '#171B33',
    innerEar: '#FF9EB8',
    stripe: '#2A3156',
    nose: '#FF8FAB',
    whisker: 'rgba(214, 222, 255, 0.6)',
    ink: '#E4E9FF',    // happy/closed eyes, light so they show on the dark fur
  };
  const MOUTH = { line: '#D5DCF7', fill: '#151931' };

  function mochiFill(cx, cy, rx, ry) {
    const g = ctx.createRadialGradient(cx - rx * 0.35, cy - ry * 0.45, 2, cx, cy, Math.max(rx, ry) * 1.1);
    g.addColorStop(0, C.light);
    g.addColorStop(0.5, C.mid);
    g.addColorStop(1, C.dark);
    return g;
  }

  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

  // Ear growing out of the head outline. Its two base corners sit on the
  // body's edge at angles phi ± half, so the ear's outline continues the
  // head's instead of being cut by it. `lean` tilts the tip (radians).
  function drawEar(fill, rot, phi, lean) {
    const { cx, cy, rx, ry } = body;
    const half = 0.3;
    const len = 21;
    // Point on the (rotated) body ellipse at parametric angle t
    const edge = (t, inset = 0) => {
      const ex = Math.cos(t) * (rx - inset);
      const ey = Math.sin(t) * (ry - inset);
      return [cx + ex * Math.cos(rot) - ey * Math.sin(rot), cy + ex * Math.sin(rot) + ey * Math.cos(rot)];
    };
    const A = edge(phi - half);
    const B = edge(phi + half);
    const mid = lerp(A, B, 0.5);
    // Outward normal at phi, then leaned
    let nx = Math.cos(phi) / rx, ny = Math.sin(phi) / ry;
    const n = Math.hypot(nx, ny);
    nx /= n; ny /= n;
    const a = rot + lean;
    const dx = nx * Math.cos(a) - ny * Math.sin(a);
    const dy = nx * Math.sin(a) + ny * Math.cos(a);
    const tip = [mid[0] + dx * len, mid[1] + dy * len];
    // Sides bulge slightly outward
    const side = (P) => {
      const c = lerp(P, tip, 0.5);
      return [c[0] + (P[0] - mid[0]) * 0.18, c[1] + (P[1] - mid[1]) * 0.18];
    };
    const tl = lerp(tip, A, 0.14);
    const tr = lerp(tip, B, 0.14);

    const outline = () => {
      ctx.moveTo(...A);
      ctx.quadraticCurveTo(...side(A), ...tl);
      ctx.quadraticCurveTo(...tip, ...tr);
      ctx.quadraticCurveTo(...side(B), ...B);
    };

    // Fill reaches a little inside the head so it covers the head's outline
    // between the corners: the ear and head become one shape
    ctx.beginPath();
    outline();
    ctx.ellipse(cx, cy, Math.max(rx - 3, 1), Math.max(ry - 3, 1), rot, phi + half, phi - half, true);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();

    ctx.beginPath();
    outline();
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = C.line;
    ctx.stroke();

    // Pink inside
    const iA = lerp(lerp(A, mid, 0.42), tip, 0.1);
    const iB = lerp(lerp(B, mid, 0.42), tip, 0.1);
    const iT = lerp(mid, tip, 0.74);
    ctx.beginPath();
    ctx.moveTo(...iA);
    ctx.quadraticCurveTo(...lerp(iA, iT, 0.5), ...iT);
    ctx.quadraticCurveTo(...lerp(iB, iT, 0.5), ...iB);
    ctx.quadraticCurveTo(...mid, ...iA);
    ctx.fillStyle = C.innerEar;
    ctx.fill();
  }

  // Tail from behind the right side: up and swishing when awake, lying flat
  // on the ground when asleep or melted
  function drawTail(down) {
    const { cx, cy, rx, ry } = body;
    const bx = cx + rx * 0.72;
    const by = cy + ry * 0.55;
    const speed = mood === 'happy' ? 9 : 2.2;
    const swish = Math.sin(time * speed / 3) * (0.3 - down * 0.2) + sway.value * 0.5;
    // Upright tip, rotated around the base by the swish
    const ux = 16, uy = -40;
    const upX = bx + ux * Math.cos(swish) - uy * Math.sin(swish);
    const upY = by + ux * Math.sin(swish) + uy * Math.cos(swish);
    // Lying tip, curling along the ground
    const lyX = bx + 30;
    const lyY = groundY - 5;
    const tx = upX + (lyX - upX) * down;
    const ty = upY + (lyY - upY) * down;

    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(bx + 26, by - 4 + down * 6, tx, ty);
    ctx.lineWidth = 12;
    ctx.strokeStyle = C.line;
    ctx.stroke();
    ctx.lineWidth = 7;
    ctx.strokeStyle = C.mid;
    ctx.stroke();
    // Darker tip
    ctx.beginPath();
    ctx.arc(tx, ty, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = C.stripe;
    ctx.fill();
  }

  // Three little tabby stripes on the forehead
  function drawStripes(turnA, turnB) {
    ctx.lineCap = 'round';
    ctx.lineWidth = 3;
    ctx.strokeStyle = C.stripe;
    for (const a of [-0.17, 0, 0.17]) {
      const p = projectOnBody(a, -0.62, turnA, turnB);
      if (p.sx < 0.2) continue;
      const len = a === 0 ? 8 : 6;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - len * 0.5 * p.sy);
      ctx.lineTo(p.x, p.y + len * 0.5 * p.sy);
      ctx.stroke();
    }
  }

  function drawNose(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(p.sx, p.sy);
    ctx.beginPath();
    ctx.moveTo(-3.4, -1.6);
    ctx.quadraticCurveTo(0, -3, 3.4, -1.6);
    ctx.quadraticCurveTo(0.5, 2.8, 0, 2.6);
    ctx.quadraticCurveTo(-0.5, 2.8, -3.4, -1.6);
    ctx.fillStyle = C.nose;
    ctx.fill();
    ctx.restore();
  }

  function drawWhiskers(p, side) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(p.sx, p.sy);
    ctx.lineCap = 'round';
    ctx.lineWidth = 1.3;
    ctx.strokeStyle = C.whisker;
    for (const tilt of [-4, 0, 4]) {
      ctx.beginPath();
      ctx.moveTo(side * 3, tilt * 0.3);
      ctx.quadraticCurveTo(side * 12, tilt * 0.6, side * 20, tilt * 1.4 + 1);
      ctx.stroke();
    }
    ctx.restore();
  }

  function update(dt) {
    droop.target = mood === 'sleep' ? 0.55 : mood === 'happy' ? -0.12 : isSad() ? 0.45 : 0;
    nextTwitch -= dt;
    if (nextTwitch <= 0) {
      nextTwitch = 3 + Math.random() * 5;
      if (mood === 'idle') {
        twitchSide = Math.random() < 0.5 ? -1 : 1;
        twitch.velocity += 14;
      }
    }
  }

  function draw(f) {
    update(f.dt);
    const { cx, cy, rx, ry } = body;
    const melted = m();

    // Mochi puddle spreading at the edges
    if (melted > 0.25) {
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(cx + side * rx * 0.95, groundY - 3, 9 * melted, 4 * melted, 0, 0, Math.PI * 2);
        ctx.fillStyle = C.mid;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = C.line;
        ctx.stroke();
      }
    }

    f.turnB += melted * 0.35; // melted face slides down
    const { turnA, turnB } = f;

    // Behind the body: the tail (the body covers its base)
    drawTail(clamp(melted + (mood === 'sleep' ? 1 : 0), 0, 1));
    sway.target = clamp(-f.wx * 0.08 - lookX.value * 0.35, -0.8, 0.8);

    // Body
    const rot = f.wx * 0.01;
    const fill = mochiFill(cx, cy, rx, ry);
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = C.line;
    ctx.stroke();

    // Ears on top of the head, sliding round as it turns. Flat = droopy.
    const flat = clamp(droop.value + melted, -0.2, 1.2);
    for (const side of [-1, 1]) {
      const flick = side === twitchSide ? twitch.value * 0.4 : 0;
      const phi = -Math.PI / 2 + side * 0.62 + turnA * 0.8;
      drawEar(fill, rot, phi, side * (-0.12 + flat * 0.9 + flick) + sway.value * 0.4);
    }

    drawStripes(turnA, turnB);

    // Face
    const blush = blushAlpha();
    drawBlush(projectOnBody(-0.66, 0.2, turnA, turnB), blush);
    drawBlush(projectOnBody(0.66, 0.2, turnA, turnB), blush);
    drawWhiskers(projectOnBody(-0.6, 0.14, turnA, turnB), -1);
    drawWhiskers(projectOnBody(0.6, 0.14, turnA, turnB), 1);
    drawEyes(projectOnBody(-0.4, -0.06, turnA, turnB), projectOnBody(0.4, -0.06, turnA, turnB), f.openness, C.ink);
    drawNose(projectOnBody(0, 0.15, turnA, turnB));
    f.mouth = projectOnBody(0, 0.27, turnA, turnB);
    drawMouth(f.mouth, MOUTH);
  }

  // Soft sheen on the mochi
  function drawOver() {
    ctx.beginPath();
    ctx.ellipse(body.cx - body.rx * 0.4, body.cy - body.ry * 0.5, 10, 6 * (body.ry / baseRadius), -0.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.fill();
  }

  // Little blue fish
  function drawFish(px, py) {
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(Math.PI / 2 - 0.25); // nose-dive into the mouth
    ctx.beginPath();
    ctx.moveTo(-5, 0);
    ctx.lineTo(-10, -4.5);
    ctx.lineTo(-10, 4.5);
    ctx.closePath();
    ctx.fillStyle = '#5AA9E6';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(1, 0, 7, 4.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#7CC4F2';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(4, -1, 1.1, 0, Math.PI * 2);
    ctx.fillStyle = '#1B2333';
    ctx.fill();
    ctx.restore();
  }

  registerPet({
    id: 'cat',
    name: 'Mochi',
    accent: '#7D8FD6',
    springs: [melt, droop, twitch],
    spread: () => ({ x: m() * 0.5, y: m() * 0.58 }),
    draw,
    drawOver,
    drawSnack: drawFish,
    special: {
      duration: 2.4,
      start() {
        melt.target = 1;
        sfx('melt');
        logState('melting');
      },
      end() {
        // Pull back together with a stretchy boing
        melt.target = 0;
        squash.velocity -= 5;
        sfx('reform');
        logState('reformed');
      },
      poke() {
        // Poking the puddle makes it ripple
        wobbleX.velocity += (Math.random() - 0.5) * 300;
        sfx('land');
      },
    },
    sleep() { melt.target = 0.15; },  // settle into a cozy loaf
    wake() { melt.target = 0; },
    sounds: {
      boop:   [.45, .05, 620, .03, .07, .14, 0, 1.4, 3, 0, -170, .07],   // little "mew"
      chirp:  [.35, .05, 880, .02, .05, .12, 0, 1.4, 4, 0, -220, .06],   // happy high mew
      sleep:  [.3, 0, 55, .15, .6, .3, 2, 1, 0, 0, 0, 0, .045, 0, 0, 0, 0, 1, 0, .8], // purr
      melt:   [.6, .05, 620, .02, .15, .35, 0, 1, -1.6],  // long sliding bloop down
      reform: [.5, .05, 200, .02, .1, .12, 1, 1, 5],      // boing back up
    },
  });
})();
