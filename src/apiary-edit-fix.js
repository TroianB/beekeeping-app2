const APIARY_ROW_SELECTOR = '#root input[placeholder="Search apiaries..."] + div > div > div.grid';
let currentApiaryNameForHighlight = '';
let savedApiaryListScrollTop = 0;
let savedWindowScrollX = 0;
let savedWindowScrollY = 0;

function getModalTitle(modal) {
  const panel = modal?.children?.[0];
  const title = panel?.children?.[0];
  return String(title?.textContent || '').trim();
}

function isEditApiaryModal(modal) {
  return getModalTitle(modal).toLowerCase().startsWith('edit ');
}

function markEditModals() {
  let foundEdit = false;
  document.querySelectorAll('#root .fixed.inset-0.z-50').forEach((modal) => {
    const isEdit = isEditApiaryModal(modal);
    modal.classList.toggle('bk-apiary-edit-modal', isEdit);
    if (isEdit) foundEdit = true;
  });
  document.body.classList.toggle('bk-apiary-edit-open', foundEdit);
}

function isApiaryEditModal(element) {
  return Boolean(element?.closest?.('#root .bk-apiary-edit-modal'));
}

function normaliseApiaryName(value) {
  return String(value || '').trim().toLowerCase();
}

function getApiaryRows() {
  return Array.from(document.querySelectorAll(APIARY_ROW_SELECTOR)).filter((row) => {
    return row.querySelector('input[type="checkbox"]');
  });
}

function getApiaryRowName(row) {
  return row?.querySelector(':scope > span[draggable="true"]')?.textContent?.trim()
    || row?.querySelector(':scope > span')?.textContent?.trim()
    || '';
}

function getApiaryListScroller() {
  const search = document.querySelector('#root input[placeholder="Search apiaries..."]');
  const listCard = search?.nextElementSibling;
  if (!listCard) return null;

  return Array.from(listCard.querySelectorAll('div')).find((element) => {
    const style = window.getComputedStyle(element);
    return element.scrollHeight > element.clientHeight && /auto|scroll/.test(style.overflowY);
  }) || null;
}

function rememberApiaryListPosition() {
  const scroller = getApiaryListScroller();
  if (scroller) savedApiaryListScrollTop = scroller.scrollTop;
  savedWindowScrollX = window.scrollX || document.documentElement.scrollLeft || 0;
  savedWindowScrollY = window.scrollY || document.documentElement.scrollTop || 0;
}

function restoreApiaryListPosition() {
  const scroller = getApiaryListScroller();
  if (scroller) scroller.scrollTop = savedApiaryListScrollTop;
  window.scrollTo({ left: savedWindowScrollX, top: savedWindowScrollY, behavior: 'auto' });
}

function restoreApiaryListPositionAfterRender() {
  [20, 80, 180, 360, 720].forEach((delay) => {
    window.setTimeout(() => {
      restoreApiaryListPosition();
      keepEditedApiaryHighlighted();
    }, delay);
  });
}

function getEditModalName(modal) {
  const titleName = getModalTitle(modal).replace(/^edit\s+/i, '').trim();
  const nameInput = modal?.querySelector('label input:not([type]), label input[type="text"], label input');
  return String(nameInput?.value || titleName || '').trim();
}

function rememberHighlightedApiary(name) {
  currentApiaryNameForHighlight = String(name || '').trim();
  keepEditedApiaryHighlighted();
}

function keepEditedApiaryHighlighted() {
  const targetName = normaliseApiaryName(currentApiaryNameForHighlight);

  getApiaryRows().forEach((row) => {
    const rowName = normaliseApiaryName(getApiaryRowName(row));
    const isReactSelected = row.classList.contains('bg-black/50');
    const shouldHighlight = targetName ? rowName === targetName : isReactSelected;
    row.classList.toggle('bk-apiary-edit-saved-highlight', shouldHighlight);
  });
}

function keepEditedApiaryHighlightedAfterRender() {
  [20, 80, 180, 360, 720].forEach((delay) => {
    window.setTimeout(keepEditedApiaryHighlighted, delay);
  });
}

function setRawInputValue(input, value) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  if (setter) setter.call(input, value);
  else input.value = value;
}

function cleanLeadingZero(input, { clearPlainZero = false } = {}) {
  if (!input || input.type !== 'number' || !isApiaryEditModal(input)) return;

  const value = String(input.value ?? '');
  if (clearPlainZero && value === '0') {
    setRawInputValue(input, '');
    return;
  }

  const cleaned = value.replace(/^0+(?=\d)/, '');
  if (cleaned !== value) {
    setRawInputValue(input, cleaned);
  }
}

function cleanEditModalNumbers() {
  document.querySelectorAll('#root .bk-apiary-edit-modal input[type="number"]').forEach((input) => {
    cleanLeadingZero(input, { clearPlainZero: true });
  });
}

function raiseEditModal() {
  markEditModals();
  document.querySelectorAll('#root .bk-apiary-edit-modal').forEach((modal) => {
    modal.style.zIndex = '130';
  });
}

function closeApiaryDetailAfterSave() {
  keepEditedApiaryHighlightedAfterRender();

  window.setTimeout(() => {
    const apiaryListButton = document.querySelector('#bkApiaryDetailBack button');
    if (apiaryListButton) {
      apiaryListButton.click();
      keepEditedApiaryHighlightedAfterRender();
      restoreApiaryListPositionAfterRender();
      return;
    }

    if (!document.body.classList.contains('bk-apiary-detail-open')) return;

    document.body.classList.add('bk-apiary-detail-closing');
    document.body.classList.remove('bk-apiary-detail-open', 'bk-apiary-detail-closed-right');
    window.setTimeout(() => {
      document.body.classList.remove('bk-apiary-detail-closing');
      document.body.classList.add('bk-apiary-detail-closed-right');
      keepEditedApiaryHighlightedAfterRender();
      restoreApiaryListPositionAfterRender();
    }, 300);
  }, 260);
}

document.addEventListener('click', (event) => {
  const row = event.target.closest?.(APIARY_ROW_SELECTOR);
  if (row && row.querySelector('input[type="checkbox"]') && !event.target.closest('input[type="checkbox"]')) {
    rememberApiaryListPosition();
    rememberHighlightedApiary(getApiaryRowName(row));
    keepEditedApiaryHighlightedAfterRender();
  }

  const button = event.target.closest?.('button');
  if (!button) return;

  const text = button.textContent.trim().toLowerCase();
  if (text.includes('edit')) {
    window.setTimeout(() => {
      raiseEditModal();
      cleanEditModalNumbers();
    }, 60);
    window.setTimeout(cleanEditModalNumbers, 180);
    return;
  }

  if (isApiaryEditModal(button) && text === 'save') {
    rememberHighlightedApiary(getEditModalName(button.closest('#root .bk-apiary-edit-modal')));
    closeApiaryDetailAfterSave();
  }
}, true);

document.addEventListener('focusin', (event) => {
  cleanLeadingZero(event.target, { clearPlainZero: true });
}, true);

document.addEventListener('input', (event) => {
  cleanLeadingZero(event.target, { clearPlainZero: false });
}, true);

new MutationObserver(() => {
  raiseEditModal();
  cleanEditModalNumbers();
  keepEditedApiaryHighlighted();
}).observe(document.documentElement, {
  childList: true,
  subtree: true,
});

raiseEditModal();
cleanEditModalNumbers();
keepEditedApiaryHighlighted();
