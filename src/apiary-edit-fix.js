function isApiaryEditModal(element) {
  return Boolean(element?.closest?.('#root .fixed.inset-0.z-50'));
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
  document.querySelectorAll('#root .fixed.inset-0.z-50 input[type="number"]').forEach((input) => {
    cleanLeadingZero(input, { clearPlainZero: true });
  });
}

function raiseEditModal() {
  document.querySelectorAll('#root .fixed.inset-0.z-50').forEach((modal) => {
    modal.style.zIndex = '120';
  });
}

function closeApiaryDetailAfterSave() {
  if (!document.body.classList.contains('bk-apiary-detail-open')) return;
  window.setTimeout(() => {
    document.body.classList.add('bk-apiary-detail-closing');
    document.body.classList.remove('bk-apiary-detail-open');
    window.setTimeout(() => document.body.classList.remove('bk-apiary-detail-closing'), 300);
  }, 220);
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
}).observe(document.documentElement, {
  childList: true,
  subtree: true,
});

raiseEditModal();
cleanEditModalNumbers();
