// Docking: two pet windows side by side snap together and their cards join
// into one. The backend (src/main.js) decides what's docked; this page reports
// its drags and draws its half of the shared card.
//   grab the card while docked  -> both windows move together
//   grab a pet while docked     -> that pet pulls out and the card splits

let docked = null;   // null | 'left' | 'right': this window's half of a shared card

function applyDock(d) {
  const me = tiny.win.id;
  const side = !d ? null : d.left === me ? 'left' : d.right === me ? 'right' : null;
  if (side === docked) return;
  const was = docked;
  docked = side;
  document.body.classList.toggle('docked-left', side === 'left');
  document.body.classList.toggle('docked-right', side === 'right');
  // Replay the merge animation (squish + seam glow) each time it docks
  const panel = document.querySelector('#panel');
  panel.classList.remove('merging');
  if (side) { void panel.offsetWidth; panel.classList.add('merging'); }
  if (side) {
    squash.velocity += 2.5;                      // little bump as the cards click together
    if (d.by === me) sfx('snap');
  } else if (was) {
    wobbleX.velocity += was === 'left' ? -160 : 160;  // wobble apart
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// After a native drag, keep an eye on the window: each time it comes to rest,
// ask the backend to snap it (or re-align it, or split it off). Pausing
// mid-drag also counts as resting, so this keeps going until the window has
// been still for a good while.
let watching = null;

async function settleAfterDrag() {
  const token = (watching = {});
  let last = null;
  let still = 0;
  let reported = false;
  for (let i = 0; i < 400 && watching === token; i++) {
    await sleep(80);
    let pos;
    try { pos = await tiny.win.getState(); } catch (_) { continue; }
    const same = last && last.x === pos.x && last.y === pos.y;
    last = { x: pos.x, y: pos.y };
    if (!same) { still = 0; reported = false; continue; }
    still++;
    if (still === 4 && !reported) {           // ~0.3s at rest
      reported = true;
      await tiny.api.call('settled').catch(() => {});
    }
    if (still >= 25) break;                   // 2s at rest: the drag is over
  }
}

// Shared-card drag: follow the global cursor and move both windows ourselves
let group = null;

async function groupDrag() {
  const g = (group = {});
  try {
    const [m, s] = await Promise.all([tiny.app.mousePosition(), tiny.win.getState()]);
    while (group === g) {
      const now = await tiny.app.mousePosition();
      const x = Math.round(s.x + now.x - m.x);
      const y = Math.round(s.y + now.y - m.y);
      if (x !== g.x || y !== g.y) {
        g.x = x;
        g.y = y;
        tiny.win.setPosition(x, y);
        tiny.api.call('moveGroup', { x, y, width: s.width }).catch(() => {});
      }
      await new Promise(requestAnimationFrame);
    }
  } catch (_) { group = null; }
}
window.addEventListener('mouseup', () => { group = null; });

// Called by input.js (dragging the pet) and panel.js (dragging the card)
function dragWindow(what) {
  if (!window.tiny) return;
  if (what === 'card' && docked) return groupDrag();
  if (docked) {
    tiny.api.call('undock').catch(() => {});
    sfx('unsnap');
  }
  tiny.win.startDrag();
  settleAfterDrag();
}

if (window.tiny) {
  tiny.api.on('dock', applyDock);
  tiny.api.call('getDock').then(applyDock).catch(() => {});
  // Windows restored side by side at launch dock again on their own
  setTimeout(() => tiny.api.call('settled').catch(() => {}), 1200);
}
