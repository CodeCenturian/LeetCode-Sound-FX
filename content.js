// Runs in ISOLATED world. No script injection needed — injected.js is declared
// in manifest with world:"MAIN" and injected by the browser before this runs.

// Cross-browser API shim (Chrome/Brave/Edge use chrome.*, Firefox/Safari also
// accept it; Firefox additionally exposes browser.* with Promises)
const ext = (typeof browser !== 'undefined') ? browser : chrome;

let audioCtx = null;
const buffers = { correct: null, wrong: null };
const settings = {
  correct: { enabled: true, volume: 1 },
  wrong: { enabled: true, volume: 1 }
};

// Lazy init — avoids autoplay-policy errors on page load
function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

// Pre-warm the AudioContext on the first click anywhere on the page.
// Browsers gate AudioContext on user gesture; the submit button click counts,
// but doing this proactively makes resume() instantaneous when a result arrives.
document.addEventListener(
  'click',
  () => {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();
  },
  { once: true, capture: true }
);

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const buf = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
  return buf.buffer;
}

async function loadSounds() {
  const data = await ext.storage.local.get([
    'correctSound', 'correctEnabled', 'correctVolume',
    'wrongSound', 'wrongEnabled', 'wrongVolume'
  ]);
  const ctx = getCtx();

  // Default to enabled=true and volume=1 if the user never touched these
  settings.correct.enabled = data.correctEnabled !== false;
  settings.correct.volume = data.correctVolume ?? 1;
  settings.wrong.enabled = data.wrongEnabled !== false;
  settings.wrong.volume = data.wrongVolume ?? 1;

  if (data.correctSound) {
    try {
      buffers.correct = await ctx.decodeAudioData(
        base64ToArrayBuffer(data.correctSound)
      );
    } catch (e) {
      console.warn('[LeetCode Sound FX] Could not decode correct sound:', e);
    }
  } else {
    buffers.correct = null;
  }

  if (data.wrongSound) {
    try {
      buffers.wrong = await ctx.decodeAudioData(
        base64ToArrayBuffer(data.wrongSound)
      );
    } catch (e) {
      console.warn('[LeetCode Sound FX] Could not decode wrong sound:', e);
    }
  } else {
    buffers.wrong = null;
  }
}

async function playSound(type) {
  const buffer = buffers[type];
  const conf = settings[type];
  if (!buffer || !conf || !conf.enabled) return;

  const ctx = getCtx();
  if (ctx.state === 'suspended') await ctx.resume();

  const src = ctx.createBufferSource();
  src.buffer = buffer;

  const gain = ctx.createGain();
  gain.gain.value = conf.volume;

  src.connect(gain);
  gain.connect(ctx.destination);
  src.start(0);
}

// Listen for results dispatched by injected.js (MAIN world → ISOLATED world
// window events are visible to content scripts in all Chromium browsers)
window.addEventListener('lc-result', (e) => {
  const { status } = e.detail;
  if (status === 'Accepted') playSound('correct');
  else playSound('wrong');
});

// Reload buffers/settings whenever the popup changes anything
const WATCHED_KEYS = [
  'correctSound', 'correctEnabled', 'correctVolume',
  'wrongSound', 'wrongEnabled', 'wrongVolume'
];
ext.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && WATCHED_KEYS.some(k => k in changes)) {
    loadSounds();
  }
});

loadSounds();