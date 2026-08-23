const APIARY_CANCEL_ROW_SELECTOR = '#root input[placeholder="Search apiaries..."] + div > div > div.grid';

function getCancelEditModalTitle(modal) {
  const panel = modal?.children?.[0];
  const title = panel?.children?.[0];
  return String(title?.textContent || '').trim();
}

function getCancelEditApiaryName(modal) {
  return getCancelEditModalTitle(modal).replace(/^edit\s+/i, '').trim();
}

function getCancelRowName(row) {
  return row?.querySelector(':scope > span[draggable="true"]')?.textContent?.trim()
    || row?.querySelector(':scope > span')?.textContent?.trim()
    || '';
}

function normaliseCancelName(value) {
  return String(value || '').trim().toLowerCase();
}

function findApiaryRowByName(name) {
  const target = normaliseCancelName(name);
  if (!target) return null;

  return Array.from(document.querySelectorAll(APIARY_CANCEL_ROW_SELECTOR)).find((row) => {
    return row.querySelector('input[type="checkbox"]')
      && normaliseCancelName(getCancelRowName(row)) === target;
  }) || null;
}

function reopenApiaryInformationAfterCancel(apiaryName) {
  [40, 120, 260, 520, 820, 1200].forEach((delay) => {
    window.setTimeout(() => {
      const row = findApiaryRowByName(apiaryName);
      if (!row) return;

      row.click();
      window.dispatchEvent(new Event('bk-open-apiary-detail'));
      document.body.classList.remove('bk-apiary-detail-closing', 'bk-apiary-detail-closed-right');
      document.body.classList.add('bk-apiary-detail-open');
    }, delay);
  });
}

document.addEventListener('click', (event) => {
  const button = event.target.closest?.('button');
  if (!button) return;

  const modal = button.closest('#root .bk-apiary-edit-modal');
  if (!modal) return;

  const buttonText = button.textContent.trim().toLowerCase();
  if (buttonText !== 'cancel') return;

  const apiaryName = getCancelEditApiaryName(modal);
  reopenApiaryInformationAfterCancel(apiaryName);
}, true);
