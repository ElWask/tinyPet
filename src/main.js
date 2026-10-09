// Backend: keeps the window on top, logs pet events, and docks pet windows
// together. Only the backend can read and move every window, so docking
// lives here; pages report their drags and get a 'dock' event back.

const MARGIN = 12;     // transparent space either side of each card (220 - 196) / 2
const SNAP_X = 36;     // how close the cards' facing edges must be to snap
const SNAP_Y = 45;     // and how level the two windows must be

// The docked pair as window ids, or null: { left: 'main', right: 'chick' }
let dock = null;

function setDock(app, next, by) {
  dock = next;
  app.push('dock', dock ? { ...dock, by } : null);
}

const partnerOf = (id) => (!dock ? null : dock.left === id ? dock.right : dock.right === id ? dock.left : null);

// Docked windows overlap by their margins so the two cards touch
const step = (state) => state.width - MARGIN * 2;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ease = (t) => 1 - (1 - t) ** 3;

// Slide a window to (x, y) over a few frames instead of jumping
async function glide(app, id, from, x, y, ms = 150) {
  const frames = 9;
  for (let i = 1; i <= frames; i++) {
    await sleep(ms / frames);
    const t = ease(i / frames);
    app.window(id).setPosition(Math.round(from.x + (x - from.x) * t), Math.round(from.y + (y - from.y) * t));
  }
}

// Where `me` belongs next to `o`: side 1 = on its right, -1 = on its left
const spot = (o, side) => ({ x: o.x + side * step(o), y: o.y });
const near = (s, p) => Math.abs(s.x - p.x) <= SNAP_X && Math.abs(s.y - p.y) <= SNAP_Y;

export const api = {
  logState: async ({ message }) => {
    console.log("Pet State:", message);
  },

  getDock: async () => dock,

  // A window stopped moving after a drag: snap it to a neighbour if close.
  // Called again whenever it moves after that, so a window nudged while
  // docked is put back in line, and one pulled away splits off.
  settled: async (_, app, meta) => {
    const me = meta?.window || 'main';
    const s = await app.window(me).getState();
    if (!s) return;

    const partner = partnerOf(me);
    if (partner) {
      const o = await app.window(partner).getState();
      if (!o) return;
      const p = spot(o, dock.right === me ? 1 : -1);
      if (!near(s, p)) setDock(app, null);
      else if (s.x !== p.x || s.y !== p.y) await glide(app, me, s, p.x, p.y, 90);
      return;
    }

    for (const other of await app.windows()) {
      if (other === me || partnerOf(other)) continue;
      const o = await app.window(other).getState();
      if (!o) continue;
      for (const side of [1, -1]) {
        const p = spot(o, side);
        if (!near(s, p)) continue;
        await glide(app, me, s, p.x, p.y);
        setDock(app, side === 1 ? { left: other, right: me } : { left: me, right: other }, me);
        return;
      }
    }
  },

  // The shared card is being dragged: bring the partner along
  moveGroup: async ({ x, y, width }, app, meta) => {
    const me = meta?.window || 'main';
    const other = partnerOf(me);
    if (!other) return;
    const offset = (width - MARGIN * 2) * (dock.left === me ? 1 : -1);
    app.window(other).setPosition(x + offset, y);
  },

  // A pet was pulled out of the pair
  undock: async (_, app, meta) => {
    if (partnerOf(meta?.window || 'main')) setDock(app, null);
  },
};

export function onWindowClosed(id, app) {
  if (partnerOf(id)) setDock(app, null);
}

// Runs once the window is up.
export function init(app) {
  app.setAlwaysOnTop(true);
  app.setResizable(false);
  console.log("Procedural pet canvas runtime active.");
}
