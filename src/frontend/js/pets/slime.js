// Slime: a blue jelly blob with a sprout on its head. Three quick pokes melt
// it into a puddle.
//
// A pet is an object passed to registerPet():
//   id, name        identity
//   springs         extra springs the engine steps every frame
//   spread()        optional { x, y }: extra widening/flattening of the body
//   draw(f)         draws body and face; must set f.mouth = { x, y } for snacks
//   drawOver(f)     optional, drawn after the snack (shines, things in front)
//   drawSnack(x,y)  optional, defaults to the apple
//   special         { duration, start(), end(), poke() } for 3 quick pokes
//   sleep(), wake() optional pose changes
//   sounds          optional ZzFX overrides/extras, see engine/sound.js
// f carries { dt, wx, openness, turnA, turnB } from the engine; `body` holds
// the current { cx, cy, rx, ry }.

(() => {
  // Melt: 0 = solid, 1 = puddle. Soft and slow, like goo.
  const melt = spring(28, 8);
  const m = () => clamp(melt.value, 0, 1.1);

  const MOUTH = { line: '#3A6FB8', fill: '#2C4F86' };

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

  function draw(f) {
    const { cx, cy, rx, ry } = body;
    const melted = m();

    // Melt drips spreading from the puddle's edges
    if (melted > 0.25) {
      ctx.fillStyle = '#5AB3E6';
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(cx + side * rx * 0.95, groundY - 3, 9 * melted, 4 * melted, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    f.turnB += melted * 0.35; // melted face slides down
    const { turnA, turnB } = f;

    // Sprout on top, behind the body edge so it grows out of the head.
    // It leans against the wobble and head turn, and droops when melted.
    sway.target = clamp(-f.wx * 0.08 - lookX.value * 0.35, -0.8, 0.8) + melted * 0.9;
    drawSprout(cx + Math.sin(turnA) * rx * 0.3, cy - ry + 3, sway.value);

    // Body: soft jelly gradient, lit from the top-left
    const jelly = ctx.createRadialGradient(cx - rx * 0.35, cy - ry * 0.45, 2, cx, cy, Math.max(rx, ry) * 1.1);
    jelly.addColorStop(0, '#9AD6F7');
    jelly.addColorStop(0.45, '#5AB3E6');
    jelly.addColorStop(1, '#3E8FD0');
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, f.wx * 0.01, 0, Math.PI * 2);
    ctx.fillStyle = jelly;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#3F82C9';
    ctx.stroke();

    // Rim light along the bottom-right edge, like light passing through jelly
    ctx.beginPath();
    ctx.ellipse(cx, cy, Math.max(rx - 5, 1), Math.max(ry - 5, 1), f.wx * 0.01, 0.25, 1.35);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.stroke();

    // Face
    const blush = blushAlpha();
    drawBlush(projectOnBody(-0.68, 0.2, turnA, turnB), blush);
    drawBlush(projectOnBody(0.68, 0.2, turnA, turnB), blush);
    drawEyes(projectOnBody(-0.4, -0.04, turnA, turnB), projectOnBody(0.4, -0.04, turnA, turnB), f.openness);
    f.mouth = projectOnBody(0, 0.25, turnA, turnB);
    drawMouth(f.mouth, MOUTH);
  }

  // Glossy highlight, fixed to the light and drawn over the face like a
  // shine on the jelly's surface
  function drawOver() {
    ctx.beginPath();
    ctx.ellipse(body.cx - body.rx * 0.4, body.cy - body.ry * 0.5, 10, 6 * (body.ry / baseRadius), -0.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fill();
  }

  registerPet({
    id: 'slime',
    name: 'Slime',
    springs: [melt],
    spread: () => ({ x: m() * 0.5, y: m() * 0.58 }),
    draw,
    drawOver,
    special: {
      duration: 2.4,
      start() {
        melt.target = 1;
        sfx('melt');
        logState('melting');
      },
      end() {
        // Reform with a stretchy boing
        melt.target = 0;
        squash.velocity -= 5;
        sfx('reform');
        logState('reformed');
      },
      poke() {
        // Poking a puddle just makes it ripple
        wobbleX.velocity += (Math.random() - 0.5) * 300;
        sfx('land');
      },
    },
    sleep() { melt.target = 0.15; },  // settle into a cozy loaf
    wake() { melt.target = 0; },
    sounds: {
      melt:   [.6, .05, 620, .02, .15, .35, 0, 1, -1.6],  // long sliding bloop down
      reform: [.5, .05, 200, .02, .1, .12, 1, 1, 5],      // boing back up
    },
  });
})();
