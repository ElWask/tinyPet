// Startup and pet windows. Every pet lives in its own window: the main window
// is the cat, and its paw badge opens or closes the others, each in a window
// named after the pet's id. Loaded last.

const MAIN_PET = 'cat';
const OPEN_KEY = 'openPets';   // tiny.store: friend windows to reopen at launch
const petOrder = Object.keys(PETS);

// Which pet this window shows: the window id inside tinyjs, ?pet= in a browser
const wanted = window.tiny ? tiny.win.id : new URLSearchParams(location.search).get('pet');
pet = PETS[wanted] || PETS[MAIN_PET];
const isMain = window.tiny ? tiny.win.id === 'main' : pet.id === MAIN_PET;
const friends = petOrder.filter((id) => id !== MAIN_PET);

// Card edge and badges take the pet's colour
document.documentElement.style.setProperty('--accent', pet.accent);
if (window.tiny) tiny.win.setTitle(pet.name);

// Before there were several pets, the stats lived under one key: hand them
// to the cat, who took over from the original slime
try {
  const legacy = localStorage.getItem('tinypet-stats');
  if (legacy) {
    if (!localStorage.getItem('tinypet-stats-cat')) localStorage.setItem('tinypet-stats-cat', legacy);
    localStorage.removeItem('tinypet-stats');
  }
} catch (_) {}

// ---------- Friend windows (tinyjs) ----------

async function rememberOpen(id, open) {
  try {
    const list = new Set((await tiny.store.get(OPEN_KEY)) || []);
    if (open) list.add(id); else list.delete(id);
    await tiny.store.set(OPEN_KEY, [...list]);
  } catch (_) {}
}

// Right next to the cat, on whichever side has room
function besideCat(cat) {
  const gap = 8;
  const right = cat.x + cat.width + gap;
  const fitsRight = !cat.screen || right + cat.width <= cat.screen.width;
  return { x: fitsRight ? right : cat.x - cat.width - gap, y: cat.y };
}

// Same frameless, transparent, see-through window as the main one. `cat` is
// the main window's state when opened from the paw: the friend then appears
// beside it. Without it (reopening at launch) the friend goes back to its
// own remembered spot.
async function openFriend(id, cat) {
  let pos = null;
  try {
    if (cat) {
      pos = besideCat(cat);
      // The friend's window places itself from this on startup (see window.js)
      await tiny.store.set('spawnAt-' + id, pos);
    } else {
      pos = await tiny.store.get('windowPosition-' + id);
    }
  } catch (_) {}
  await tiny.win.open(id, {
    page: 'index.html',
    title: PETS[id].name,
    size: '220x320',
    chrome: { frame: false, windowControls: false, transparent: true, acceptsFirstMouse: true },
    ...(pos ? { x: pos.x, y: pos.y } : {}),
  });
  rememberOpen(id, true);
}

// Paw on the cat's card: bring the next friend out, or put it away if it's out
async function toggleFriend() {
  const open = await tiny.win.windows();
  const id = friends[0];
  if (open.includes(id)) {
    await tiny.win.close(id);
    rememberOpen(id, false);
    sfx('nope');
  } else {
    await openFriend(id, await tiny.win.getState());
    sfx('boop');
  }
}

const badge = document.querySelector('#switch');
if (isMain) {
  badge.title = `Bring out ${PETS[friends[0]].name}`;
  badge.addEventListener('click', () => {
    if (window.tiny) toggleFriend().catch(() => {});
    else window.open('index.html?pet=' + friends[0], friends[0], 'width=220,height=320');
  });
} else {
  // Friends get a close badge instead: put this pet away
  badge.title = `Put ${pet.name} away`;
  badge.querySelector('use').setAttribute('href', '#i-close');
  badge.addEventListener('click', async () => {
    saveStats();
    if (window.tiny) {
      await rememberOpen(pet.id, false);
      tiny.win.close();
    } else {
      window.close();
    }
  });
}

if (window.tiny) {
  // The main window's always-on-top comes from the backend; friends set their own
  tiny.win.setAlwaysOnTop(true);
  tiny.win.setResizable(false);
  // The cat brings back whoever was out when the app last quit
  if (isMain) {
    tiny.store.get(OPEN_KEY).then((list) => {
      for (const id of list || []) if (PETS[id] && id !== MAIN_PET) openFriend(id);
    }).catch(() => {});
  }
}

// ---------- Start ----------

loadStats();
setInterval(saveStats, 5000);
window.addEventListener('beforeunload', saveStats);
requestAnimationFrame(frame);
