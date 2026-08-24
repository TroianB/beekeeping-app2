const SEARCH_SELECTOR = '#root input[placeholder="Search apiaries..."]';
const RETURN_TO_APIARIES_KEY = 'bk.returnToApiariesAfterDelete';
let deleteMode = false;
let applying = false;
let detailOpen = false;
let touchStartX = 0;
let touchStartY = 0;
let cleaningNumberInput = false;

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

function rememberApiariesScreen() {
  try {
    sessionStorage.setItem(RETURN_TO_APIARIES_KEY, '1');
  } catch {}
}

function returnToApiariesAfterDelete() {
  let shouldReturn = false;
  try {
    shouldReturn = sessionStorage.getItem(RETURN_TO_APIARIES_KEY) === '1';
  } catch {}
  if (!shouldReturn) return;

  const apiariesButton = Array.from(document.querySelectorAll('button')).find((button) => {
    return button.textContent.trim().toLowerCase() === 'apiaries';
  });
  if (!apiariesButton) return;

  try {
    sessionStorage.removeItem(RETURN_TO_APIARIES_KEY);
  } catch {}
  apiariesButton.click();
  window.setTimeout(applyApiaryListOnlyMode, 80);
}

function getSearchInput() {
  return document.querySelector(SEARCH_SELECTOR);
}

function getApiaryLayout() {
  const search = getSearchInput();
  return search?.closest('[class*="lg:grid-cols-[520px,1fr]"]') || null;
}

function getDetailPanel() {
  const layout = getApiaryLayout();
  return layout?.children?.[1] || null;
}

function getListRows() {
  const search = getSearchInput();
  const list = search?.nextElementSibling;
  if (!list) return [];
  return Array.from(list.querySelectorAll('div.grid')).filter((row) => row.querySelector('input[type="checkbox"]'));
}

function getTopButtonRow() {
  const search = getSearchInput();
  const container = search?.parentElement;
  if (!container) return null;
  return Array.from(container.children).find((child) => {
    if (!(child instanceof HTMLElement)) return false;
    return Array.from(child.querySelectorAll('button')).some((button) => button.textContent.trim().toLowerCase().includes('add apiary'));
  }) || null;
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
    if (
      button.id === 'bkDeleteApiaryButton'
      || button.id === 'bkCancelDeleteApiaryButton'
      || button.id === 'bkDeleteRegionButton'
    ) return;
    const text = button.textContent.trim().toLowerCase();
    if (text === 'delete' || text.startsWith('delete ')) {
      button.style.display = 'none';
    }
  });
}

function openDetailScreen() {
  if (!getSearchInput()) return;
  const panel = getDetailPanel();
  document.body.classList.remove('bk-apiary-detail-closing', 'bk-apiary-detail-closed-right');
  if (panel) void panel.offsetWidth;
  detailOpen = true;
  document.body.classList.add('bk-apiary-detail-open');
  ensureDetailBackButton();
  window.setTimeout(() => {
    getDetailPanel()?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    cleanNumberInputs();
  }, 40);
}

function reopenDetailScreenAfterModal() {
  [0, 40, 120, 260, 520].forEach((delay) => {
    window.setTimeout(() => {
      if (!getSearchInput()) return;
      openDetailScreen();
      applyApiaryListOnlyMode();
    }, delay);
  });
}

function closeDetailScreen() {
  if (!detailOpen) return;
  detailOpen = false;
  touchStartX = 0;
  touchStartY = 0;
  document.body.classList.add('bk-apiary-detail-closing');
  document.body.classList.remove('bk-apiary-detail-open', 'bk-apiary-detail-closed-right');
  window.setTimeout(() => {
    document.body.classList.remove('bk-apiary-detail-closing');
    document.body.classList.add('bk-apiary-detail-closed-right');
  }, 300);
}

function ensureDetailBackButton() {
  const panel = getDetailPanel();
  if (!panel) return;

  let bar = document.getElementById('bkApiaryDetailBack');
  if (bar && panel.contains(bar)) return;
  if (bar) bar.remove();

  bar = document.createElement('div');
  bar.id = 'bkApiaryDetailBack';
  bar.innerHTML = `
    <button type="button">Apiary List</button>
    <span>Swipe right to return to the Apiary page</span>
  `;
  bar.querySelector('button')?.addEventListener('click', closeDetailScreen);
  panel.insertBefore(bar, panel.firstChild);
}

function cleanNumberValue(value) {
  return String(value ?? '').replace(/^0+(?=\d)/, '');
}

function cleanNumberInputs() {
  const panel = getDetailPanel();
  if (!panel) return;
  panel.querySelectorAll('input[type="number"]').forEach((input) => {
    const cleaned = cleanNumberValue(input.value);
    if (cleaned !== input.value) input.value = cleaned;
  });
}

function cleanFocusedNumberInput(input) {
  if (!input || input.type !== 'number') return;
  const panel = getDetailPanel();
  if (!panel?.contains(input)) return;
  if (input.value === '0') {
    input.value = '';
    return;
  }
  const cleaned = cleanNumberValue(input.value);
  if (cleaned !== input.value) input.value = cleaned;
}

function cleanNumberInputAndNotify(input) {
  if (cleaningNumberInput || !input || input.type !== 'number') return;
  const panel = getDetailPanel();
  if (!panel?.contains(input)) return;
  const cleaned = cleanNumberValue(input.value);
  if (cleaned === input.value) return;
  cleaningNumberInput = true;
  input.value = cleaned;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  cleaningNumberInput = false;
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
  rememberApiariesScreen();
  window.location.reload();
}

function updateControls() {
  const button = document.getElementById('bkDeleteApiaryButton');
  if (!button) return;

  const selectedCount = getSelectedRows().length;
  button.classList.toggle('bk-ready', deleteMode && selectedCount > 0);

  if (!deleteMode) {
    button.disabled = false;
    button.textContent = 'Delete Apiary';
    return;
  }

  button.textContent = selectedCount > 0 ? `Delete (${selectedCount})` : 'Delete Apiary';
  button.disabled = selectedCount === 0;
}

function ensureControls() {
  const search = getSearchInput();
  if (!search) return;

  const buttonRow = getTopButtonRow();
  let controls = document.getElementById('bkApiaryListControls');
  if (!controls) {
    controls = document.createElement('div');
    controls.id = 'bkApiaryListControls';
    controls.innerHTML = `
      <div class="bk-apiary-list-controls-inner">
        <button type="button" id="bkDeleteApiaryButton">Delete Apiary</button>
        <button type="button" id="bkCancelDeleteApiaryButton">Cancel</button>
      </div>
    `;

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

  if (buttonRow && controls.parentElement !== buttonRow) {
    buttonRow.appendChild(controls);
  } else if (!buttonRow && controls.parentElement !== search.parentElement) {
    search.parentElement?.insertBefore(controls, search);
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
      document.body.classList.remove('bk-apiary-delete-mode', 'bk-apiary-detail-open', 'bk-apiary-detail-closing', 'bk-apiary-detail-closed-right');
      deleteMode = false;
      detailOpen = false;
      applying = false;
      return;
    }

    ensureControls();
    ensureDetailBackButton();
    if (detailOpen) document.body.classList.add('bk-apiary-detail-open');
    hideNativeDeleteButtons();
    updateRowHighlights();
    updateControls();
    cleanNumberInputs();
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
  if (!getSearchInput()) return;

  if (deleteMode) {
    const row = event.target.closest(`${SEARCH_SELECTOR} + div > div > div.grid`);
    if (!row || !row.querySelector('input[type="checkbox"]')) return;
    event.preventDefault();
    event.stopPropagation();
    toggleRowSelection(row);
    return;
  }

  const panel = getDetailPanel();
  if (detailOpen && panel?.contains(event.target)) {
    const button = event.target.closest('button');
    const text = button?.textContent?.trim().toLowerCase() || '';
    if (button && text.includes('edit')) {
      window.setTimeout(openDetailScreen, 90);
      window.setTimeout(cleanNumberInputs, 140);
      return;
    }
    if (button && /save|update/.test(text)) {
      window.setTimeout(closeDetailScreen, 180);
      return;
    }
  }

  const row = event.target.closest(`${SEARCH_SELECTOR} + div > div > div.grid`);
  if (row && row.querySelector('input[type="checkbox"]')) {
    window.setTimeout(openDetailScreen, 40);
  }
}, true);

document.addEventListener('change', () => {
  if (!deleteMode) return;
  updateRowHighlights();
  updateControls();
}, true);

document.addEventListener('focusin', (event) => {
  cleanFocusedNumberInput(event.target);
}, true);

document.addEventListener('input', (event) => {
  cleanNumberInputAndNotify(event.target);
}, true);

document.addEventListener('touchstart', (event) => {
  if (!detailOpen) return;
  const panel = getDetailPanel();
  if (!panel?.contains(event.target)) return;
  const touch = event.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
}, { passive: true });

document.addEventListener('touchend', (event) => {
  if (!detailOpen || touchStartX === 0) return;
  const touch = event.changedTouches[0];
  const dx = touch.clientX - touchStartX;
  const dy = touch.clientY - touchStartY;
  touchStartX = 0;
  touchStartY = 0;
  if (dx > 35 && Math.abs(dx) > Math.abs(dy)) {
    closeDetailScreen();
  }
}, { passive: true });

window.addEventListener('bk-open-apiary-detail', reopenDetailScreenAfterModal);

new MutationObserver(() => {
  returnToApiariesAfterDelete();
  applyApiaryListOnlyMode();
}).observe(document.documentElement, {
  childList: true,
  subtree: true,
});

returnToApiariesAfterDelete();
applyApiaryListOnlyMode();

// redeploy trigger: 2026-08-19T22:39+12:00
