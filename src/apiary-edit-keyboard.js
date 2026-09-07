const EDIT_MODAL_SELECTOR = '#root .bk-apiary-edit-modal';
const KEYBOARD_SPACER_CLASS = 'bk-apiary-keyboard-spacer';

function isSmallScreen() {
  return window.matchMedia('(max-width: 520px)').matches;
}

function getEditPanel() {
  return document.querySelector(`${EDIT_MODAL_SELECTOR} > div`);
}

function getKeyboardSpacer(panel) {
  if (!panel) return null;
  let spacer = panel.querySelector(`:scope > .${KEYBOARD_SPACER_CLASS}`);
  if (!spacer) {
    spacer = document.createElement('div');
    spacer.className = KEYBOARD_SPACER_CLASS;
    spacer.setAttribute('aria-hidden', 'true');
    panel.appendChild(spacer);
  }
  return spacer;
}

function keyboardCoveredHeight() {
  const viewport = window.visualViewport;
  if (!viewport) return 0;

  const layoutHeight = Math.max(window.innerHeight || 0, document.documentElement.clientHeight || 0);
  const visibleBottom = viewport.height + viewport.offsetTop;
  return Math.max(0, Math.round(layoutHeight - visibleBottom));
}

function updateKeyboardSpacer() {
  const panel = getEditPanel();
  if (!panel) return;

  if (!isSmallScreen() || !document.body.classList.contains('bk-apiary-edit-open')) {
    panel.querySelector(`:scope > .${KEYBOARD_SPACER_CLASS}`)?.remove();
    return;
  }

  const spacer = getKeyboardSpacer(panel);
  const covered = keyboardCoveredHeight();
  const fieldFocused = Boolean(panel.querySelector('input:focus, textarea:focus, select:focus'));

  /* When a software keyboard overlays the page, create real scrollable space
     below the action buttons. A small fallback keeps the buttons reachable on
     browsers that do not report the keyboard height through VisualViewport. */
  const spacerHeight = fieldFocused ? Math.max(covered + 24, 220) : 0;
  spacer.style.height = `${spacerHeight}px`;
}

function keepFocusedFieldVisible(event) {
  const target = event?.target;
  if (!target?.closest?.(EDIT_MODAL_SELECTOR)) return;

  window.setTimeout(() => {
    updateKeyboardSpacer();
    target.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
  }, 180);
}

window.visualViewport?.addEventListener('resize', updateKeyboardSpacer);
window.visualViewport?.addEventListener('scroll', updateKeyboardSpacer);
window.addEventListener('resize', updateKeyboardSpacer);
document.addEventListener('focusin', keepFocusedFieldVisible, true);
document.addEventListener('focusout', () => window.setTimeout(updateKeyboardSpacer, 180), true);

new MutationObserver(updateKeyboardSpacer).observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['class'],
});

updateKeyboardSpacer();
