// Runs in ISOLATED world.
// injected.js (MAIN world) intercepts fetch/XHR and fires 'lc-result' events.

const ext = (typeof browser !== 'undefined') ? browser : chrome;

let audioCtx = null;

// 4 sound slots: run correct, run wrong, submit correct, submit wrong
const buffers = { runCorrect: null, runWrong: null, correct: null, wrong: null };
const settings = {
  runCorrect: { enabled: true, volume: 1 },
  runWrong:   { enabled: true, volume: 1 },
  correct:    { enabled: true, volume: 1 },
  wrong:      { enabled: true, volume: 1 },
};

const ALL_KEYS = [
  'runCorrectSound', 'runCorrectSoundName', 'runCorrectEnabled', 'runCorrectVolume',
  'runWrongSound',   'runWrongSoundName',   'runWrongEnabled',   'runWrongVolume',
  'correctSound',    'correctSoundName',    'correctEnabled',    'correctVolume',
  'wrongSound',      'wrongSoundName',      'wrongEnabled',      'wrongVolume',
];

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

document.addEventListener('click', () => {
  const ctx = getCtx();
  if (ctx.state === 'suspended') ctx.resume();
}, { once: true, capture: true });

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const buf = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
  return buf.buffer;
}

async function loadSounds() {
  const data = await ext.storage.local.get(ALL_KEYS);
  const ctx = getCtx();

  for (const type of Object.keys(buffers)) {
    settings[type].enabled = data[`${type}Enabled`] !== false;
    settings[type].volume  = data[`${type}Volume`]  ?? 1;

    const b64 = data[`${type}Sound`];
    if (b64) {
      try {
        buffers[type] = await ctx.decodeAudioData(base64ToArrayBuffer(b64));
      } catch (e) {
        console.warn(`[LeetCode Sound FX] Could not decode ${type} sound:`, e);
        buffers[type] = null;
      }
    } else {
      buffers[type] = null;
    }
  }
}

async function playSound(type) {
  const buffer = buffers[type];
  const conf   = settings[type];
  if (!buffer || !conf?.enabled) return;

  const ctx = getCtx();
  if (ctx.state === 'suspended') await ctx.resume();

  const src  = ctx.createBufferSource();
  src.buffer = buffer;

  const gain = ctx.createGain();
  gain.gain.value = conf.volume;

  src.connect(gain);
  gain.connect(ctx.destination);
  src.start(0);
}

// lc-result event: { status, type: 'run' | 'submit' }
window.addEventListener('lc-result', (e) => {
  const { status, type } = e.detail;
  const isAccepted = status === 'Accepted';

  if (type === 'run') {
    playSound(isAccepted ? 'runCorrect' : 'runWrong');
  } else {
    // 'submit' or unknown — treat as submit
    playSound(isAccepted ? 'correct' : 'wrong');
  }
});

ext.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && ALL_KEYS.some(k => k in changes)) {
    loadSounds();
  }
});

loadSounds();