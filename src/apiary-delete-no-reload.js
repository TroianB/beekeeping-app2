const BK_DELETE_SEARCH = '#root input[placeholder="Search apiaries..."]';

function bkDeleteNorm(value) {
  return String(value || '').trim().toLowerCase();
}

function bkDeleteReadApiaries() {
  try {
    const raw = localStorage.getItem('bk.hives');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function bkDeleteWriteApiaries(apiaries) {
  try { localStorage.setItem('bk.hives', JSON.stringify(apiaries)); } catch {}
}

function bkDeleteSelectedNames() {
  const search = document.querySelector(BK_DELETE_SEARCH);
  const list = search?.nextElementSibling;
  if (!list) return [];

  return Array.from(list.querySelectorAll('div.grid'))
    .filter((row) => row.querySelector('input[type="checkbox"]')?.checked)
    .map((row) => row.querySelector(':scope > span')?.textContent?.trim() || '')
    .filter(Boolean);
}

document.addEventListener('click', (event) => {
  const button = event.target.closest?.('#bkDeleteApiaryButton');
  if (!button || !document.querySelector(BK_DELETE_SEARCH)) return;

  // First click only enters delete mode. Intercept only the actual delete click.
  const selectedNames = bkDeleteSelectedNames();
  if (!selectedNames.length) return;

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation?.();

  const message = selectedNames.length === 1
    ? `Delete Apiary "${selectedNames[0]}"?`
    : `Delete ${selectedNames.length} Apiaries?`;
  if (!window.confirm(message)) return;

  const selected = new Set(selectedNames.map(bkDeleteNorm));
  const remaining = bkDeleteReadApiaries().filter(
    (apiary) => !selected.has(bkDeleteNorm(apiary?.name))
  );
  bkDeleteWriteApiaries(remaining);

  try { sessionStorage.setItem('bk.returnToApiariesAfterQuickAdd', '1'); } catch {}
  window.dispatchEvent(new CustomEvent('bk:apiaries-deleted', {
    detail: { names: selectedNames, remaining }
  }));
}, true);
