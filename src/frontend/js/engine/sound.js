// Sound effects, synthesized on the fly with ZzFX: no audio files, just numbers.
// These are the defaults; a pet can override any of them or add its own
// through its `sounds` list.
// Each entry is a ZzFX parameter list; tweak them in the designer at
// https://killedbyapixel.github.io/ZzFX/ (paste the array in, adjust, copy back).
//
// Parameter order: volume, randomness, frequency, attack, sustain, release,
// shape (0 sin, 1 tri, 2 saw, 3 tan, 4 noise), shapeCurve, slide, deltaSlide,
// pitchJump, pitchJumpTime, repeatTime, ...

zzfxV = 0.22; // quiet by default: it's a desk pet, not an arcade machine

const SFX = {
  boop:   [.6, .05, 500, .01, .02, .08, 0, 1, 6],                  // poke: short rising boop
  chomp:  [.5, .1, 220, 0, .03, .05, 4, 2, -3, 0, 0, 0, .05],       // crunch-crunch
  chirp:  [.5, .05, 700, .01, .05, .12, 0, 1, 0, 0, 300, .06],      // happy two-step chirp
  jump:   [.6, .05, 260, .02, .08, .15, 1, 1, 4],                   // springy "bwoop" up
  land:   [.4, .05, 180, 0, .02, .08, 0, 1, -3],                    // soft squish
  nope:   [.5, .05, 440, .01, .08, .08, 1, 1, 0, 0, -110, .09],     // two-note "nuh-uh"
  yawn:   [.35, .05, 330, .08, .12, .25, 1, 1, -.8],                // sleepy sigh
  sleep:  [.3, 0, 300, .1, .1, .3, 0, 1, -.5],                      // soft "hmm" as it dozes off
  wake:   [.4, .05, 400, .02, .05, .15, 0, 1, 3],                   // bright chirp up
};

const MUTE_KEY = 'tinypet-muted';
let muted = false;
try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch (_) {}

// Browsers only let audio start after the user interacts with the page.
// Until then, stay silent instead of queueing sounds that would all play at
// once on the first click (e.g. the "sleep" sound when restoring a nap).
let audioUnlocked = false;
window.addEventListener('mousedown', () => {
  audioUnlocked = true;
  if (zzfxX.state !== 'running') zzfxX.resume();
}, { capture: true });

function sfx(name, delay = 0) {
  if (muted || !audioUnlocked) return;
  if (delay) setTimeout(() => sfx(name), delay);
  else zzfx(...(pet?.sounds?.[name] || SFX[name]));
}

function setMuted(value) {
  muted = value;
  try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch (_) {}
}
