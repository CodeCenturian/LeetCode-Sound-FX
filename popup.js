const ext = (typeof browser !== 'undefined') ? browser : chrome;

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
    const key = type === 'correct' ? 'correctSound' : 'wrongSound';
    ext.storage.local.set({ [key]: base64 }, () => {
      if (ext.runtime.lastError) {
        showStatus('Save failed: ' + ext.runtime.lastError.message, 'err');
        return;
      }
      const label = type === 'correct' ? 'Correct' : 'Wrong';
      showStatus(`${label} sound saved.`, 'ok');
    });
  };
  reader.onerror = () => showStatus('Failed to read file.', 'err');
  reader.readAsDataURL(file);
}

function showStatus(msg, type) {
  const el = document.getElementById('status');
  el.textContent = msg;
  el.className = `status visible ${type}`;
  clearTimeout(el._t);
  el._t = setTimeout(() => {
    el.className = 'status';
    el.textContent = '';
  }, 2500);
}

// MV3 forbids inline onclick="..." in HTML — wire up buttons here instead
document.querySelectorAll('button[data-type]').forEach(btn => {
  btn.addEventListener('click', () => save(btn.dataset.type));
});