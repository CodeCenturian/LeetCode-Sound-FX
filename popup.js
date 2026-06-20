const ext = (typeof browser !== 'undefined') ? browser : chrome;

const TYPES = ['runCorrect', 'runWrong', 'correct', 'wrong'];

async function init() {
  const keys = TYPES.flatMap(t => [
    `${t}Sound`, `${t}SoundName`, `${t}Enabled`, `${t}Volume`
  ]);
  const data = await ext.storage.local.get(keys);
  TYPES.forEach(type => renderType(type, data));
  wireEvents();
}

function renderType(type, data) {
  const enabled   = data[`${type}Enabled`] !== false;
  const volume    = data[`${type}Volume`]  ?? 1;
  const savedName = data[`${type}SoundName`];
  const hasSaved  = Boolean(data[`${type}Sound`]);

  document.getElementById(`${type}Enabled`).checked = enabled;
  setCardEnabled(type, enabled);

  const pct = Math.round(volume * 100);
  document.getElementById(`${type}Volume`).value = pct;
  document.getElementById(`${type}VolumeValue`).textContent = `${pct}%`;
  setVolumeFill(document.getElementById(`${type}Volume`));

  const fileNameEl = document.getElementById(`${type}FileName`);
  fileNameEl.classList.remove('pending', 'saved');

  if (hasSaved) {
    fileNameEl.textContent = savedName || 'Saved';
    fileNameEl.classList.add('saved');
    setCardState(type, 'saved');
  } else {
    fileNameEl.textContent = type.startsWith('run') ? 'No file' : 'No file selected';
    setCardState(type, 'none');
  }

  document.querySelector(`.clear-btn[data-type="${type}"]`).hidden = !hasSaved;
}

function setCardEnabled(type, enabled) {
  document.querySelector(`.card[data-card="${type}"]`).dataset.enabled = enabled ? 'true' : 'false';
}

function setCardState(type, state) {
  const card  = document.querySelector(`.card[data-card="${type}"]`);
  const badge = document.getElementById(`${type}Badge`);
  card.classList.remove('state-saved', 'state-pending');
  if (state === 'saved') {
    card.classList.add('state-saved');
    badge.textContent = 'Saved';
  } else if (state === 'pending') {
    card.classList.add('state-pending');
    badge.textContent = 'Unsaved';
  } else {
    badge.textContent = '';
  }
}

function wireEvents() {
  TYPES.forEach(type => {
    document.getElementById(`${type}Enabled`).addEventListener('change', (e) => {
      ext.storage.local.set({ [`${type}Enabled`]: e.target.checked });
      setCardEnabled(type, e.target.checked);
    });

    const slider = document.getElementById(`${type}Volume`);
    slider.addEventListener('input', () => {
      document.getElementById(`${type}VolumeValue`).textContent = `${slider.value}%`;
      setVolumeFill(slider);
    });
    slider.addEventListener('change', () => {
      ext.storage.local.set({ [`${type}Volume`]: Number(slider.value) / 100 });
    });

    document.getElementById(`${type}File`).addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const fileNameEl = document.getElementById(`${type}FileName`);
      fileNameEl.textContent = file.name;
      fileNameEl.classList.remove('saved');
      fileNameEl.classList.add('pending');
      setCardState(type, 'pending');
    });
  });

  document.querySelectorAll('.save-btn[data-type]').forEach(btn => {
    btn.addEventListener('click', () => save(btn.dataset.type));
  });
  document.querySelectorAll('.clear-btn[data-type]').forEach(btn => {
    btn.addEventListener('click', () => clearSound(btn.dataset.type));
  });
}

function setVolumeFill(slider) {
  const v = Number(slider.value);
  const fill  = 'rgba(143,211,255,0.95)';
  const track = 'rgba(255,255,255,0.10)';
  slider.style.background =
    `linear-gradient(90deg,${fill} 0%,${fill} ${v}%,${track} ${v}%,${track} 100%)`;
}

function save(type) {
  const input = document.getElementById(`${type}File`);
  const file  = input.files[0];
  if (!file) { showStatus('Select a file first.', 'err'); return; }
  if (!file.type.startsWith('audio/')) { showStatus('File must be audio.', 'err'); return; }

  const reader = new FileReader();
  reader.onload = () => {
    const base64 = reader.result.split(',')[1];
    ext.storage.local.set({ [`${type}Sound`]: base64, [`${type}SoundName`]: file.name }, () => {
      if (ext.runtime.lastError) {
        showStatus('Save failed: ' + ext.runtime.lastError.message, 'err');
        return;
      }
      const fileNameEl = document.getElementById(`${type}FileName`);
      fileNameEl.textContent = file.name;
      fileNameEl.classList.remove('pending');
      fileNameEl.classList.add('saved');
      document.querySelector(`.clear-btn[data-type="${type}"]`).hidden = false;
      setCardState(type, 'saved');

      const btn = document.querySelector(`.save-btn[data-type="${type}"]`);
      btn.textContent = 'Saved ✓';
      btn.classList.add('just-saved');
      setTimeout(() => { btn.textContent = 'Save'; btn.classList.remove('just-saved'); }, 1600);

      const labels = { runCorrect: 'Run Correct', runWrong: 'Run Wrong', correct: 'Submit Accepted', wrong: 'Submit Wrong' };
      showStatus(`${labels[type]} sound saved.`, 'ok');
    });
  };
  reader.onerror = () => showStatus('Failed to read file.', 'err');
  reader.readAsDataURL(file);
}

function clearSound(type) {
  ext.storage.local.remove([`${type}Sound`, `${type}SoundName`], () => {
    document.getElementById(`${type}File`).value = '';
    const fileNameEl = document.getElementById(`${type}FileName`);
    fileNameEl.textContent = type.startsWith('run') ? 'No file' : 'No file selected';
    fileNameEl.classList.remove('pending', 'saved');
    document.querySelector(`.clear-btn[data-type="${type}"]`).hidden = true;
    setCardState(type, 'none');
    const labels = { runCorrect: 'Run Correct', runWrong: 'Run Wrong', correct: 'Submit Accepted', wrong: 'Submit Wrong' };
    showStatus(`${labels[type]} sound cleared.`, 'ok');
  });
}

function showStatus(msg, type) {
  const el = document.getElementById('status');
  el.textContent = msg;
  el.className = `status visible ${type}`;
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.className = 'status'; el.textContent = ''; }, 2200);
}

init();