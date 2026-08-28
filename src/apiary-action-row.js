const BK_ACTION_SEARCH = '#root input[placeholder="Search apiaries..."]';
const BK_ACTION_MOBILE = window.matchMedia('(max-width: 760px)');
let bkActionRaf = 0;

function bkActionGetOriginalRow() {
  const search = document.querySelector(BK_ACTION_SEARCH);
  const container = search?.parentElement;
  if (!container) return null;
  return Array.from(container.children).find((child) => {
    if (!(child instanceof HTMLElement)) return false;
    return Array.from(child.querySelectorAll('button')).some((button) =>
      button.textContent.trim().toLowerCase().includes('add apiary')
    );
  }) || null;
}

function bkActionGetOriginalAdd() {
  const row = bkActionGetOriginalRow();
  return Array.from(row?.querySelectorAll('button') || []).find((button) =>
    button.textContent.trim().toLowerCase().includes('add apiary')
  ) || null;
}

function bkActionGetDelete() {
  return document.getElementById('bkDeleteApiaryButton');
}

function bkActionGetCancel() {
  return document.getElementById('bkCancelDeleteApiaryButton');
}

function bkActionInDeleteMode() {
  return document.body.classList.contains('bk-apiary-delete-mode');
}

function bkActionSync() {
  if (!BK_ACTION_MOBILE.matches) {
    document.getElementById('bkApiaryActionRow')?.remove();
    return;
  }

  const search = document.querySelector(BK_ACTION_SEARCH);
  if (!search) {
    document.getElementById('bkApiaryActionRow')?.remove();
    return;
  }

  const originalRow = bkActionGetOriginalRow();
  if (!originalRow) return;

  let row = document.getElementById('bkApiaryActionRow');
  if (!row) {
    row = document.createElement('div');
    row.id = 'bkApiaryActionRow';
    row.innerHTML = `
      <button type="button" id="bkAddApiaryProxy">Add Apiary</button>
      <button type="button" id="bkDeleteApiaryProxy">Delete Apiary</button>
    `;

    row.querySelector('#bkAddApiaryProxy')?.addEventListener('click', () => {
      if (bkActionInDeleteMode()) {
        const source = bkActionGetDelete();
        if (!source || source.disabled) return;
        source.click();
        bkActionScheduleSync();
        return;
      }
      bkActionGetOriginalAdd()?.click();
    });

    row.querySelector('#bkDeleteApiaryProxy')?.addEventListener('click', () => {
      if (bkActionInDeleteMode()) {
        bkActionGetCancel()?.click();
        bkActionScheduleSync();
        return;
      }
      const source = bkActionGetDelete();
      if (!source || source.disabled) return;
      source.click();
      bkActionScheduleSync();
    });
  }

  const parent = originalRow.parentElement;
  if (!parent) return;

  if (row.parentElement !== parent || row.previousElementSibling !== originalRow) {
    originalRow.insertAdjacentElement('afterend', row);
  }

  const regionRow = document.getElementById('bkRegionManagementControls');
  if (regionRow && (regionRow.parentElement !== parent || regionRow.previousElementSibling !== row)) {
    row.insertAdjacentElement('afterend', regionRow);
  }

  const deleteMode = bkActionInDeleteMode();
  const sourceDelete = bkActionGetDelete();
  const addProxy = row.querySelector('#bkAddApiaryProxy');
  const proxyDelete = row.querySelector('#bkDeleteApiaryProxy');

  if (deleteMode) {
    if (addProxy) {
      const selectedDeleteText = sourceDelete?.textContent || 'Delete';
      if (addProxy.textContent !== selectedDeleteText) addProxy.textContent = selectedDeleteText;
      const shouldDisable = Boolean(sourceDelete?.disabled);
      if (addProxy.disabled !== shouldDisable) addProxy.disabled = shouldDisable;
      addProxy.classList.add('bk-ready');
      addProxy.classList.remove('bk-cancel-mode');
    }

    if (proxyDelete) {
      if (proxyDelete.disabled) proxyDelete.disabled = false;
      if (proxyDelete.textContent !== 'Cancel') proxyDelete.textContent = 'Cancel';
      proxyDelete.classList.add('bk-cancel-mode');
      proxyDelete.classList.remove('bk-ready');
    }
    return;
  }

  if (addProxy) {
    if (addProxy.disabled) addProxy.disabled = false;
    if (addProxy.textContent !== 'Add Apiary') addProxy.textContent = 'Add Apiary';
    addProxy.classList.remove('bk-ready', 'bk-cancel-mode');
  }

  if (proxyDelete && sourceDelete) {
    const nextDisabled = Boolean(sourceDelete.disabled);
    const nextText = sourceDelete.textContent || 'Delete Apiary';
    const nextReady = sourceDelete.classList.contains('bk-ready');

    if (proxyDelete.disabled !== nextDisabled) proxyDelete.disabled = nextDisabled;
    if (proxyDelete.textContent !== nextText) proxyDelete.textContent = nextText;
    proxyDelete.classList.remove('bk-cancel-mode');
    if (proxyDelete.classList.contains('bk-ready') !== nextReady) {
      proxyDelete.classList.toggle('bk-ready', nextReady);
    }
  }
}

function bkActionScheduleSync() {
  if (bkActionRaf) return;
  bkActionRaf = window.requestAnimationFrame(() => {
    bkActionRaf = 0;
    bkActionSync();
  });
}

const bkActionRoot = document.getElementById('root');
if (bkActionRoot) {
  new MutationObserver(bkActionScheduleSync).observe(bkActionRoot, {
    childList: true,
    subtree: true
  });
}

document.addEventListener('change', bkActionScheduleSync, true);
document.addEventListener('click', () => window.setTimeout(bkActionScheduleSync, 0), true);
window.addEventListener('resize', bkActionScheduleSync, { passive: true });

if (typeof BK_ACTION_MOBILE.addEventListener === 'function') {
  BK_ACTION_MOBILE.addEventListener('change', bkActionScheduleSync);
} else if (typeof BK_ACTION_MOBILE.addListener === 'function') {
  BK_ACTION_MOBILE.addListener(bkActionScheduleSync);
}

bkActionSync();
