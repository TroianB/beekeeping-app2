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

function keepEditedApiaryHighlighted() {
  const rows = document.querySelectorAll('#root input[placeholder="Search apiaries..."] + div > div > div.grid');
  rows.forEach((row) => {
    const isReactSelected = row.classList.contains('bg-black/50');
    row.classList.toggle('bk-apiary-edit-saved-highlight', isReactSelected);
  });
}

function keepEditedApiaryHighlightedAfterRender() {
  [40, 160, 340, 620].forEach((delay) => {
    window.setTimeout(keepEditedApiaryHighlighted, delay);
  });
}

function closeApiaryDetailAfterSave() {
  keepEditedApiaryHighlightedAfterRender();

  window.setTimeout(() => {
    const apiaryListButton = document.querySelector('#bkApiaryDetailBack button');
    if (apiaryListButton) {
      apiaryListButton.click();
      keepEditedApiaryHighlightedAfterRender();
      return;
    }

    if (!document.body.classList.contains('bk-apiary-detail-open')) return;

    document.body.classList.add('bk-apiary-detail-closing');
    document.body.classList.remove('bk-apiary-detail-open', 'bk-apiary-detail-closed-right');
    window.setTimeout(() => {
      document.body.classList.remove('bk-apiary-detail-closing');
      document.body.classList.add('bk-apiary-detail-closed-right');
      keepEditedApiaryHighlightedAfterRender();
    }, 300);
  }, 260);
}

document.addEventListener('click', (event) => {
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
