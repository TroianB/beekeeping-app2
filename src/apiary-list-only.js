const SEARCH_SELECTOR = '#root input[placeholder="Search apiaries..."]';
let deleteMode = false;
let applying = false;

function normalise(value) {
  return String(value || '').trim().toLowerCase();
}

function readApiaries() {
  try {
    const raw = localStorage.getItem('bk.hives');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeApiaries(apiaries) {
  try {
    localStorage.setItem('bk.hives', JSON.stringify(apiaries));
  } catch {}
}

function getSearchInput() {
  return document.querySelector(SEARCH_SELECTOR);
}

function getListRows() {
  const search = getSearchInput();
  const list = search?.nextElementSibling;
  if (!list) return [];
  return Array.from(list.querySelectorAll('div.grid')).filter((row) => row.querySelector('input[type="checkbox"]'));
}

function getRowName(row) {
  const firstSpan = row.querySelector(':scope > span');
  return firstSpan ? firstSpan.textContent.trim() : '';
}

function getSelectedRows() {
  return getListRows().filter((row) => row.querySelector('input[type="checkbox"]')?.checked);
}

function updateRowHighlights() {
  getListRows().forEach((row) => {
    const selected = Boolean(row.querySelector('input[type="checkbox"]')?.checked);
    row.classList.toggle('bk-apiary-row-selected', deleteMode && selected);
  });
}

function hideNativeDeleteButtons() {
  if (!getSearchInput()) return;
  document.querySelectorAll('button').forEach((button) => {
    if (button.id === 'bkDeleteApiaryButton' || button.id === 'bkCancelDeleteApiaryButton') return;
    const text = button.textContent.trim().toLowerCase();
    if (text === 'delete' || text.startsWith('delete ')) {
      button.style.display = 'none';
    }
  });
}

function setDeleteMode(next) {
  deleteMode = Boolean(next);
  document.body.classList.toggle('bk-apiary-delete-mode', deleteMode);
  if (!deleteMode) {
    getListRows().forEach((row) => {
      const checkbox = row.querySelector('input[type="checkbox"]');
      if (checkbox) checkbox.checked = false;
      row.classList.remove('bk-apiary-row-selected');
    });
  }
  updateControls();
}

function deleteSelectedApiaries() {
  const selectedNames = getSelectedRows().map(getRowName).filter(Boolean);
  if (!selectedNames.length) return;

  const message = selectedNames.length === 1
    ? `Delete Apiary "${selectedNames[0]}"?`
    : `Delete ${selectedNames.length} Apiaries?`;

  if (!window.confirm(message)) return;

  const selectedSet = new Set(selectedNames.map(normalise));
  const remaining = readApiaries().filter((apiary) => !selectedSet.has(normalise(apiary.name)));
  writeApiaries(remaining);
  window.location.reload();
}

function updateControls() {
  const button = document.getElementById('bkDeleteApiaryButton');
  const message = document.getElementById('bkApiaryDeleteMessage');
  if (!button || !message) return;

  const selectedCount = getSelectedRows().length;
  button.classList.toggle('bk-ready', deleteMode && selectedCount > 0);

  if (!deleteMode) {
    button.disabled = false;
    button.textContent = 'Delete Apiary';
    message.textContent = 'Apiary list only';
    return;
  }

  button.textContent = selectedCount > 0 ? `Delete Apiary (${selectedCount})` : 'Delete Apiary';
  button.disabled = selectedCount === 0;
  message.textContent = selectedCount > 0
    ? `${selectedCount} selected for deletion`
    : 'Select apiaries to be deleted';
}

function ensureControls() {
  const search = getSearchInput();
  if (!search) return;

  let controls = document.getElementById('bkApiaryListControls');
  if (!controls) {
    controls = document.createElement('div');
    controls.id = 'bkApiaryListControls';
    controls.innerHTML = `
      <div class="bk-apiary-list-controls-inner">
        <div id="bkApiaryDeleteMessage">Apiary list only</div>
        <div class="flex flex-wrap gap-2">
          <button type="button" id="bkDeleteApiaryButton">Delete Apiary</button>
          <button type="button" id="bkCancelDeleteApiaryButton">Cancel</button>
        </div>
      </div>
    `;
    search.parentElement?.insertBefore(controls, search);

    controls.querySelector('#bkDeleteApiaryButton')?.addEventListener('click', () => {
      if (!deleteMode) {
        setDeleteMode(true);
        return;
      }
      deleteSelectedApiaries();
    });

    controls.querySelector('#bkCancelDeleteApiaryButton')?.addEventListener('click', () => {
      setDeleteMode(false);
    });
  }

  updateControls();
}

function applyApiaryListOnlyMode() {
  if (applying) return;
  applying = true;

  window.requestAnimationFrame(() => {
    const active = Boolean(getSearchInput());
    document.body.classList.toggle('bk-apiaries-list-only', active);
    if (!active) {
      document.body.classList.remove('bk-apiary-delete-mode');
      deleteMode = false;
      applying = false;
      return;
    }

    ensureControls();
    hideNativeDeleteButtons();
    updateRowHighlights();
    updateControls();
    applying = false;
  });
}

function toggleRowSelection(row) {
  const checkbox = row.querySelector('input[type="checkbox"]');
  if (!checkbox) return;
  checkbox.checked = !checkbox.checked;
  updateRowHighlights();
  updateControls();
}

document.addEventListener('click', (event) => {
  if (!deleteMode || !getSearchInput()) return;
  const row = event.target.closest(`${SEARCH_SELECTOR} + div > div > div.grid`);
  if (!row || !row.querySelector('input[type="checkbox"]')) return;
  event.preventDefault();
  event.stopPropagation();
  toggleRowSelection(row);
}, true);

document.addEventListener('change', () => {
  if (!deleteMode) return;
  updateRowHighlights();
  updateControls();
}, true);

new MutationObserver(applyApiaryListOnlyMode).observe(document.documentElement, {
  childList: true,
  subtree: true,
});

applyApiaryListOnlyMode();
