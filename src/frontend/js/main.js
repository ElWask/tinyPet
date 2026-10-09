// Startup: picks the pet, restores its needs and starts the frame loop. Loaded last.

pet = PETS.slime;

loadStats();
setInterval(saveStats, 5000);
window.addEventListener('beforeunload', saveStats);
requestAnimationFrame(frame);
