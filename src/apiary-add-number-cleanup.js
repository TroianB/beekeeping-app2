function bkAddApiaryModal(input) {
  const modal = input?.closest?.('#root .fixed.inset-0.z-50');
  if (!modal) return null;
  const panel = modal.children?.[0];
  const title = panel?.children?.[0];
  return String(title?.textContent || '').trim().toLowerCase() === 'add apiary' ? modal : null;
}

function bkSetNativeInputValue(input, value) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  if (setter) setter.call(input, value);
  else input.value = value;
}

function bkNotifyReact(input, value) {
  bkSetNativeInputValue(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function bkHandleAddApiaryNumberFocus(input) {
  if (!input || input.tagName !== 'INPUT' || input.type !== 'number') return;
  if (!bkAddApiaryModal(input)) return;
  if (String(input.value) === '0') {
    requestAnimationFrame(() => {
      if (document.activeElement === input && String(input.value) === '0') {
        bkNotifyReact(input, '');
      }
    });
  }
}

function bkHandleAddApiaryNumberTyping(input) {
  if (!input || input.tagName !== 'INPUT' || input.type !== 'number') return;
  if (!bkAddApiaryModal(input)) return;

  const value = String(input.value ?? '');
  const cleaned = value.replace(/^0+(?=\d)/, '');
  if (cleaned !== value) bkNotifyReact(input, cleaned);
}

document.addEventListener('focusin', (event) => {
  bkHandleAddApiaryNumberFocus(event.target);
}, true);

document.addEventListener('click', (event) => {
  bkHandleAddApiaryNumberFocus(event.target);
}, true);

document.addEventListener('input', (event) => {
  bkHandleAddApiaryNumberTyping(event.target);
}, true);
