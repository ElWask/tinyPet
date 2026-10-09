// The status card: bars that mirror the stats, the three action buttons and the sound toggle.

const ui = {
  food: document.querySelector('#stat-food'),
  fun: document.querySelector('#stat-fun'),
  energy: document.querySelector('#stat-energy'),
  feed: document.querySelector('#feed'),
  play: document.querySelector('#play'),
  sleep: document.querySelector('#sleep'),
};
const shown = {};

// Only touch the DOM when a rounded value or state actually changes
function renderPanel() {
  for (const k of Object.keys(stats)) {
    const v = Math.round(stats[k]);
    if (shown[k] === v) continue;
    shown[k] = v;
    ui[k].querySelector('.fill').style.width = v + '%';
    ui[k].classList.toggle('low', v < 25);
  }
  const asleep = mood === 'sleep';
  if (shown.asleep !== asleep) {
    shown.asleep = asleep;
    ui.feed.disabled = asleep;
    ui.play.disabled = asleep;
    ui.sleep.querySelector('use').setAttribute('href', asleep ? '#i-sun' : '#i-moon');
    ui.sleep.querySelector('span').textContent = asleep ? 'Wake' : 'Sleep';
  }
}

ui.feed.addEventListener('click', feed);
ui.play.addEventListener('click', play);
ui.sleep.addEventListener('click', () => {
  if (mood === 'sleep') wakeUp();
  else if (mood !== 'melt') goToSleep();
});

const muteButton = document.querySelector('#mute');
function renderMute() {
  muteButton.classList.toggle('off', muted);
  muteButton.querySelector('use').setAttribute('href', muted ? '#i-muted' : '#i-sound');
}
muteButton.addEventListener('click', () => {
  setMuted(!muted);
  renderMute();
  sfx('boop'); // a little confirmation when turning sound back on
});
renderMute();

// Dragging the card (but not its buttons) moves the window too
document.querySelector('#panel').addEventListener('mousedown', (e) => {
  if (e.button === 0 && !e.target.closest('button') && window.tiny) tiny.win.startDrag();
});
