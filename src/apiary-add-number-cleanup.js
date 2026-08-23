function bkAddApiaryNumberModalTitle(modal) {
  const panel = modal?.children?.[0];
  const title = panel?.children?.[0];
  return String(title?.textContent || '').trim().toLowerCase();
}

function bkIsAddApiaryNumberModal(element) {
  const modal = element?.closest?.('#root .fixed.inset-0.z-50');
  return bkAddApiaryNumberModalTitle(modal) === 'add apiary';
}

function bkSetAddApiaryInputValue(input, value) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  if (setter) setter.call(input, value);
  else input.value = value;
}

function bkCleanAddApiaryNumberInput(input, { clearPlainZero = false } = {}) {
  if (!input || input.type !== 'number' || !bkIsAddApiaryNumberModal(input)) return;

  const value = String(input.value ?? '');
  if (clearPlainZero && value === '0') {
    bkSetAddApiaryInputValue(input, '');
    return;
  }

  const cleaned = value.replace(/^0+(?=\d)/, '');
  if (cleaned !== value) bkSetAddApiaryInputValue(input, cleaned);
}

document.addEventListener('focusin', (event) => {
  bkCleanAddApiaryNumberInput(event.target, { clearPlainZero: true });
}, true);

document.addEventListener('click', (event) => {
  bkCleanAddApiaryNumberInput(event.target, { clearPlainZero: true });
}, true);

document.addEventListener('input', (event) => {
  bkCleanAddApiaryNumberInput(event.target, { clearPlainZero: false });
}, true);
