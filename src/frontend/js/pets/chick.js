// Chick: a round, fluffy yellow chick with a feather tuft, tiny wings and a
// beak. Three quick pokes puff it up into a ball until it pops back with a
// burst of fluff.

(() => {
  // Puff: 0 = normal, 1 = puffed-up ball
  const puff = spring(90, 7);
  // How hard the wings flap, eased so they don't snap on and off
  const flapAmount = spring(80, 12);
  let flapT = 0;

  const p = () => clamp(puff.value, -0.2, 1.2);

  const C = {
    light: '#FFF8C4',
    mid: '#FFE066',
    dark: '#F8C443',
    line: '#E9AC45',
    wing: '#F9CF4D',
    beak: '#FF9F43',
    beakDark: '#E8772E',
    fluff: '#FFD84D',
  };

  // Three curly feathers on the head, leaning with `sway`
  function drawTuft(bx, by, angle) {
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(angle);
    ctx.lineCap = 'round';
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 3;
    for (const [a, len] of [[-0.45, 9], [0, 13], [0.45, 9]]) {
      ctx.save();
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-1, -len * 0.7, 3, -len);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  // Small rounded wing hugging the side, pivoting at the shoulder to flap
  function drawWing(side, angle) {
    const { cx, cy, rx, ry } = body;
    ctx.save();
    ctx.translate(cx + side * rx * 0.86, cy + ry * 0.12);
    ctx.rotate(-side * angle);
    ctx.beginPath();
    ctx.ellipse(side * 2.5, 6, 6.5, 10.5, side * -0.35, 0, Math.PI * 2);
    ctx.fillStyle = C.wing;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = C.line;
    ctx.stroke();
    ctx.restore();
  }

  function drawFeet() {
    ctx.lineCap = 'round';
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = C.beak;
    const y = groundY + 1 + hop.y;
    for (const side of [-1, 1]) {
      const fx = body.cx + side * 13;
      ctx.beginPath();
      for (const toe of [-4, 0, 4]) {
        ctx.moveTo(fx, y - 3);
        ctx.lineTo(fx + toe, y + 1);
      }
      ctx.stroke();
    }
  }

  // Two-part beak; the lower half drops open to eat, cheep or snore
  function drawBeak(pt) {
    let open = 0;
    if (snack) open = clamp(1 - (pt.y - snack.y) / 90, 0.2, 1);
    else if (mood === 'happy') open = 0.6;
    else if (mood === 'sleep') open = 0.12 + Math.sin(time) * 0.08;
    else if (mood === 'idle' && isSad()) open = 0;

    ctx.save();
    ctx.translate(pt.x, pt.y);
    ctx.scale(pt.sx * 0.75, pt.sy * 0.75); // small beak = cuter
    ctx.lineJoin = 'round';
    // Lower beak
    ctx.beginPath();
    ctx.moveTo(-5, 0);
    ctx.quadraticCurveTo(0, 5 + open * 7, 5, 0);
    ctx.closePath();
    ctx.fillStyle = C.beakDark;
    ctx.fill();
    // Upper beak, a little lifted when open
    ctx.beginPath();
    ctx.moveTo(-6.5, 0 - open * 1.5);
    ctx.quadraticCurveTo(0, -6 - open * 1.5, 6.5, 0 - open * 1.5);
    ctx.quadraticCurveTo(0, 4.5 - open * 1.5, -6.5, 0 - open * 1.5);
    ctx.fillStyle = C.beak;
    ctx.fill();
    ctx.restore();
  }

  function draw(f) {
    const { cx, cy, rx, ry } = body;
    const { turnA, turnB } = f;
    const puffed = p();

    // Flap while airborne or happy, tuck in while asleep
    flapAmount.target = hop.y < 0 ? 1 : mood === 'happy' ? 0.55 : 0;
    flapT += f.dt * 28;
    const wingAngle = mood === 'sleep' ? -0.1 : 0.12 + flapAmount.value * (0.5 + 0.5 * Math.sin(flapT)) + puffed * 0.5;

    sway.target = clamp(-f.wx * 0.08 - lookX.value * 0.35, -0.8, 0.8);
    drawTuft(cx + Math.sin(turnA) * rx * 0.3, cy - ry + 4, sway.value);

    // Fluffy body
    const g = ctx.createRadialGradient(cx - rx * 0.35, cy - ry * 0.45, 2, cx, cy, Math.max(rx, ry) * 1.1);
    g.addColorStop(0, C.light);
    g.addColorStop(0.5, C.mid);
    g.addColorStop(1, C.dark);
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, f.wx * 0.01, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = C.line;
    ctx.stroke();

    drawFeet();
    drawWing(-1, wingAngle);
    drawWing(1, wingAngle);

    // Face: big wide-set eyes, a small beak tucked between them, big cheeks
    const blush = blushAlpha();
    for (const side of [-1, 1]) {
      const c = projectOnBody(side * 0.66, 0.24, turnA, turnB);
      drawBlush({ ...c, sx: c.sx * 1.25, sy: c.sy * 1.25 }, Math.min(1, blush * 1.6)); // pinker on yellow
    }
    // Exactly the cat's eyes: same spot, size and colours (light happy/closed lines too)
    drawEyes(projectOnBody(-0.4, -0.06, turnA, turnB), projectOnBody(0.4, -0.06, turnA, turnB), f.openness, '#E4E9FF');
    f.mouth = projectOnBody(0, 0.21, turnA, turnB);
    drawBeak(f.mouth);
  }

  function drawOver() {
    ctx.beginPath();
    ctx.ellipse(body.cx - body.rx * 0.4, body.cy - body.ry * 0.5, 9, 5 * (body.ry / baseRadius), -0.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fill();
  }

  // Striped sunflower seed
  function drawSeed(px, py) {
    ctx.save();
    ctx.translate(px, py);
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.quadraticCurveTo(5, 0, 0, -6);
    ctx.quadraticCurveTo(-5, 0, 0, 6);
    ctx.fillStyle = '#7A6E62';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-1.6, -3);
    ctx.lineTo(-1.6, 3);
    ctx.moveTo(1.6, -3);
    ctx.lineTo(1.6, 3);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.stroke();
    ctx.restore();
  }

  registerPet({
    id: 'chick',
    name: 'Chick',
    accent: '#F5B83D',
    springs: [puff, flapAmount],
    // Puffing makes it bigger all round: wider and taller
    spread: () => ({ x: p() * 0.28, y: -p() * 0.24 }),
    draw,
    drawOver,
    drawSnack: drawSeed,
    special: {
      duration: 1.6,
      start() {
        puff.target = 1;
        sfx('puff');
        logState('puffed up');
      },
      end() {
        // Pop! Back to normal size with a burst of fluff
        puff.target = 0;
        puff.velocity -= 6;
        squash.velocity += 3;
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2;
          spawn('crumb', body.cx + Math.cos(a) * body.rx, body.cy + Math.sin(a) * body.ry,
            Math.cos(a) * 90, Math.sin(a) * 90 - 60, 0.7, C.fluff);
        }
        sfx('pop');
        logState('popped');
      },
      poke() {
        // Poking a puffball just boings it
        squash.velocity += 3;
        sfx('boop');
      },
    },
    sounds: {
      boop:  [.4, .05, 1250, .01, .03, .06, 0, 1, 8],                 // cheep!
      chirp: [.4, .05, 1350, .01, .03, .05, 0, 1, 6, 0, 0, 0, .08],   // cheep-cheep
      puff:  [.5, .05, 160, .05, .2, .12, 0, 1, 3],                   // "fwoomp" inflating
      pop:   [.6, .1, 500, 0, .02, .08, 4, 1, -5],                    // fluffy pop
    },
  });
})();
