// Remembers where the pet sits on screen between launches (tinyjs only).
// There's no "window moved" event, so the position is checked every couple of
// seconds and saved to tiny.store (a JSON file in Application Support) when it
// changed. getState's x/y use the same units setPosition takes.

if (window.tiny) {
  // Each pet window remembers its own spot (the main one keeps the original key)
  const POS_KEY = tiny.win.id === 'main' ? 'windowPosition' : 'windowPosition-' + tiny.win.id;
  let savedPos = null;

  async function savePosition() {
    try {
      const { x, y } = await tiny.win.getState();
      if (savedPos && savedPos.x === x && savedPos.y === y) return;
      savedPos = { x, y };
      await tiny.store.set(POS_KEY, savedPos);
    } catch (_) { /* bridge hiccup: try again next tick */ }
  }

  (async () => {
    try {
      // A friend just brought out by the paw badge goes beside the cat, once;
      // otherwise every window returns to its own remembered spot
      const SPAWN_KEY = 'spawnAt-' + tiny.win.id;
      const spawn = tiny.win.id === 'main' ? null : await tiny.store.get(SPAWN_KEY);
      if (spawn) await tiny.store.delete(SPAWN_KEY);
      const pos = spawn || await tiny.store.get(POS_KEY);
      if (pos && Number.isFinite(pos.x) && Number.isFinite(pos.y)) {
        tiny.win.setPosition(pos.x, pos.y);
        // A monitor may have been unplugged since: pull the pet back on screen
        tiny.win.ensureOnScreen();
        savedPos = pos;
      }
    } catch (_) { /* first launch or no store: stay where tinyjs put us */ }

    // Start saving only after restoring, so the default spot can't overwrite it
    setInterval(savePosition, 2000);
  })();
}
