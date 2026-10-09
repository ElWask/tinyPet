// Startup and pet switching: picks the saved pet, restores its needs and
// starts the frame loop. Loaded last.

const PET_KEY = 'tinypet-pet';
const petOrder = Object.keys(PETS);

// Card edge and badges take the pet's colour
function applyAccent() {
  document.documentElement.style.setProperty('--accent', pet.accent);
  document.querySelector('#switch').title = `Switch pet (now: ${pet.name})`;
}

// Swap to the next pet in place. The one leaving is saved as it is (asleep
// or not), the one arriving picks up where it left off.
function switchPet() {
  if (mood === 'special' || snack || hop.vy !== 0) return; // let it finish first
  saveStats();
  if (mood === 'sleep') pet.wake?.();
  pet = PETS[petOrder[(petOrder.indexOf(pet.id) + 1) % petOrder.length]];
  try { localStorage.setItem(PET_KEY, pet.id); } catch (_) {}

  mood = 'idle';
  moodTimer = 0;
  particles.length = 0;
  loadStats();
  applyAccent();
  squash.velocity -= 6; // pops in with a stretch
  if (mood !== 'sleep') sfx('boop');
  logState('switched to ' + pet.id);
}

// ---------- Start ----------

let savedPet = null;
try {
  savedPet = localStorage.getItem(PET_KEY);
  // Before there were several pets, the stats lived under one key: hand them
  // to the cat, who took over from the original slime
  const legacy = localStorage.getItem('tinypet-stats');
  if (legacy) {
    if (!localStorage.getItem('tinypet-stats-cat')) localStorage.setItem('tinypet-stats-cat', legacy);
    localStorage.removeItem('tinypet-stats');
  }
} catch (_) {}
pet = PETS[savedPet] || PETS[petOrder[0]];

document.querySelector('#switch').addEventListener('click', switchPet);
applyAccent();
loadStats();
setInterval(saveStats, 5000);
window.addEventListener('beforeunload', saveStats);
requestAnimationFrame(frame);
