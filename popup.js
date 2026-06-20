const ext = (typeof browser !== 'undefined') ? browser : chrome;

const TYPES = ['correct', 'wrong'];

async function init() {
  const data = await ext.storage.local.get([
    'correctSound', 'correctSoundName', 'correctEnabled', 'correctVolume',
    'wrongSound', 'wrongSoundName', 'wrongEnabled', 'wrongVolume'
  ]);

  TYPES.forEach(type => renderType(type, data));
  wireEvents();
}

function renderType(type, data) {
  const enabled = data[`${type}Enabled`] !== false; // default: enabled
  const volume = data[`${type}Volume`] ?? 1;        // default: 100%
  const savedName = data[`${type}SoundName`];
  const hasSaved = Boolean(data[`${type}Sound`]);

  document.getElementById(`${type}Enabled`).checked = enabled;
  setCardEnabled(type, enabled);

  const pct = Math.round(volume * 100);
  document.getElementById(`${type}Volume`).value = pct;
  document.getElementById(`${type}VolumeValue`).textContent = `${pct}%`;

  const fileNameEl = document.getElementById(`${type}FileName`);
  fileNameEl.textContent = hasSaved ? (savedName || 'Saved sound') : 'No file selected';
  fileNameEl.classList.remove('pending');

  document.querySelector(`.clear-btn[data-type="${type}"]`).hidden = !hasSaved;
}

function setCardEnabled(type, enabled) {
  document.querySelector(`.card[data-card="${type}"]`).dataset.enabled = enabled ? 'true' : 'false';
}

function wireEvents() {
  TYPES.forEach(type => {
    // Toggle: persists immediately, no Save click needed
    document.getElementById(`${type}Enabled`).addEventListener('change', (e) => {
      const checked = e.target.checked;
      ext.storage.local.set({ [`${type}Enabled`]: checked });
      setCardEnabled(type, checked);
    });

    // Volume: live label while dragging, persisted on release
    const slider = document.getElementById(`${type}Volume`);
    slider.addEventListener('input', () => {
      document.getElementById(`${type}VolumeValue`).textContent = `${slider.value}%`;
    });
    slider.addEventListener('change', () => {
      ext.storage.local.set({ [`${type}Volume`]: Number(slider.value) / 100 });
    });

    // File picked but not yet saved — show pending filename
    document.getElementById(`${type}File`).addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const fileNameEl = document.getElementById(`${type}FileName`);
      fileNameEl.textContent = file.name;
      fileNameEl.classList.add('pending');
    });
  });

  document.querySelectorAll('.save-btn[data-type]').forEach(btn => {
    btn.addEventListener('click', () => save(btn.dataset.type));
  });

  document.querySelectorAll('.clear-btn[data-type]').forEach(btn => {
    btn.addEventListener('click', () => clearSound(btn.dataset.type));
  });
}

function save(type) {
  const input = document.getElementById(`${type}File`);
  const file = input.files[0];

  if (!file) {
    showStatus('Select a file first.', 'err');
    return;
  }
  if (!file.type.startsWith('audio/')) {
    showStatus('File must be an audio file.', 'err');
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const base64 = reader.result.split(',')[1];
    ext.storage.local.set(
      { [`${type}Sound`]: base64, [`${type}SoundName`]: file.name },
      () => {
        if (ext.runtime.lastError) {
          showStatus('Save failed: ' + ext.runtime.lastError.message, 'err');
          return;
        }
        const fileNameEl = document.getElementById(`${type}FileName`);
        fileNameEl.textContent = file.name;
        fileNameEl.classList.remove('pending');
        document.querySelector(`.clear-btn[data-type="${type}"]`).hidden = false;

        const label = type === 'correct' ? 'Correct' : 'Wrong';
        showStatus(`${label} sound saved.`, 'ok');
      }
    );
  };
  reader.onerror = () => showStatus('Failed to read file.', 'err');
  reader.readAsDataURL(file);
}

function clearSound(type) {
  ext.storage.local.remove([`${type}Sound`, `${type}SoundName`], () => {
    document.getElementById(`${type}File`).value = '';
    const fileNameEl = document.getElementById(`${type}FileName`);
    fileNameEl.textContent = 'No file selected';
    fileNameEl.classList.remove('pending');
    document.querySelector(`.clear-btn[data-type="${type}"]`).hidden = true;

    const label = type === 'correct' ? 'Correct' : 'Wrong';
    showStatus(`${label} sound cleared.`, 'ok');
  });
}

function showStatus(msg, type) {
  const el = document.getElementById('status');
  el.textContent = msg;
  el.className = `status visible ${type}`;
  clearTimeout(el._t);
  el._t = setTimeout(() => {
    el.className = 'status';
    el.textContent = '';
  }, 2200);
}

init();