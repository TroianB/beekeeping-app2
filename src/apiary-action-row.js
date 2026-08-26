const BK_ACTION_SEARCH = '#root input[placeholder="Search apiaries..."]';
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

function bkActionSync() {
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
      bkActionGetOriginalAdd()?.click();
    });

    row.querySelector('#bkDeleteApiaryProxy')?.addEventListener('click', () => {
      const source = bkActionGetDelete();
      if (!source || source.disabled) return;
      source.click();
      bkActionScheduleSync();
    });
  }

  if (row.parentElement !== originalRow.parentElement || row.previousElementSibling !== originalRow) {
    originalRow.insertAdjacentElement('afterend', row);
  }

  const sourceDelete = bkActionGetDelete();
  const proxyDelete = row.querySelector('#bkDeleteApiaryProxy');
  if (proxyDelete && sourceDelete) {
    const nextDisabled = Boolean(sourceDelete.disabled);
    const nextText = sourceDelete.textContent || 'Delete Apiary';
    const nextReady = sourceDelete.classList.contains('bk-ready');

    if (proxyDelete.disabled !== nextDisabled) proxyDelete.disabled = nextDisabled;
    if (proxyDelete.textContent !== nextText) proxyDelete.textContent = nextText;
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

/* Only watch structural React changes. Do not observe class/disabled changes that this helper also writes. */
new MutationObserver(bkActionScheduleSync).observe(document.documentElement, {
  childList: true,
  subtree: true
});

document.addEventListener('change', bkActionScheduleSync, true);
document.addEventListener('click', () => window.setTimeout(bkActionScheduleSync, 0), true);

bkActionSync();
