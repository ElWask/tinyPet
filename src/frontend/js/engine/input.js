// Mouse input: gaze follows the cursor, click to poke, drag to move the window.

// ---------- Cursor tracking ----------

let lastMouse = null;

// Point the gaze at a cursor position given in window (client) coordinates
function lookAt(clientX, clientY) {
  if (snack || mood === 'sleep') return; // busy looking at food, or asleep
  const rect = canvas.getBoundingClientRect();
  const mouseX = clientX - rect.left - homeX;
  const mouseY = clientY - rect.top - faceY;

  // Treat the cursor as sitting on a plane 140px in front of the face, so the
  // angle saturates naturally for far-away cursors
  lookX.target = clamp(Math.atan2(mouseX, 140), -0.9, 0.9);
  lookY.target = clamp(Math.atan2(mouseY, 140), -0.8, 0.8);

  // Fast cursor movement jiggles the body
  if (lastMouse) {
    const dx = clientX - lastMouse.x;
    const dy = clientY - lastMouse.y;
    // Ignore huge jumps (e.g. the cursor teleporting between displays)
    if (Math.abs(dx) < 200 && Math.abs(dy) < 200) {
      wobbleX.velocity += dx * 0.6;
      wobbleY.velocity += dy * 0.6;
    }
  }
  lastMouse = { x: clientX, y: clientY };
}

// ---------- Poke vs drag ----------

function hitsBody(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const dx = (clientX - rect.left - body.cx) / body.rx;
  const dy = (clientY - rect.top - body.cy) / body.ry;
  return dx * dx + dy * dy <= 1.15;
}

// A press becomes a drag once the cursor moves a few px; otherwise it's a click
let press = null;

canvas.addEventListener('mousedown', (e) => {
  if (e.button === 0) press = { x: e.clientX, y: e.clientY };
});
window.addEventListener('mousemove', (e) => {
  if (!press) return;
  if (Math.hypot(e.clientX - press.x, e.clientY - press.y) > 4) {
    press = null;
    if (window.tiny) tiny.win.startDrag();
  }
});
window.addEventListener('mouseup', (e) => {
  if (press && hitsBody(e.clientX, e.clientY)) onPoke();
  press = null;
});

if (window.tiny) {
  // Inside tinyjs: follow the cursor anywhere on screen, not just in the window
  tiny.win.setAllSpaces(true); // stay visible across Spaces and over fullscreen apps

  async function pollCursor() {
    try {
      const { window: w } = await tiny.app.mousePosition();
      lookAt(w.x, w.y);
    } catch (_) { /* bridge not ready yet */ }
    setTimeout(pollCursor, 50);
  }
  pollCursor();
} else {
  // Plain browser fallback (for previewing the file directly)
  window.addEventListener('mousemove', (e) => lookAt(e.clientX, e.clientY));
  document.documentElement.addEventListener('mouseleave', () => {
    lookX.target = 0;
    lookY.target = 0;
    lastMouse = null;
  });
}
