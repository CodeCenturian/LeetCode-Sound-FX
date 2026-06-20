// Runs in ISOLATED world. No script injection needed — injected.js is declared
// in manifest with world:"MAIN" and injected by the browser before this runs.

// Cross-browser API shim (Chrome/Brave/Edge use chrome.*, Firefox/Safari also
// accept it; Firefox additionally exposes browser.* with Promises)
const ext = (typeof browser !== 'undefined') ? browser : chrome;

let audioCtx = null;
const buffers = { correct: null, wrong: null };

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
  const data = await ext.storage.local.get(['correctSound', 'wrongSound']);
  const ctx = getCtx();

  if (data.correctSound) {
    try {
      buffers.correct = await ctx.decodeAudioData(
        base64ToArrayBuffer(data.correctSound)
      );
    } catch (e) {
      console.warn('[LeetCode Sound FX] Could not decode correct sound:', e);
    }
  }

  if (data.wrongSound) {
    try {
      buffers.wrong = await ctx.decodeAudioData(
        base64ToArrayBuffer(data.wrongSound)
      );
    } catch (e) {
      console.warn('[LeetCode Sound FX] Could not decode wrong sound:', e);
    }
  }
}

async function playSound(buffer) {
  if (!buffer) return;
  const ctx = getCtx();
  if (ctx.state === 'suspended') await ctx.resume();
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.connect(ctx.destination);
  src.start(0);
}

// Listen for results dispatched by injected.js (MAIN world → ISOLATED world
// window events are visible to content scripts in all Chromium browsers)
window.addEventListener('lc-result', (e) => {
  const { status } = e.detail;
  if (status === 'Accepted') playSound(buffers.correct);
  else playSound(buffers.wrong);
});

// Reload buffers when user updates sounds in the popup
ext.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && ('correctSound' in changes || 'wrongSound' in changes)) {
    loadSounds();
  }
});

loadSounds();