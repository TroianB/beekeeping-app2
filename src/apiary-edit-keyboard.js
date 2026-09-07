const EDIT_MODAL_SELECTOR = '#root .bk-apiary-edit-modal';
const KEYBOARD_SPACER_CLASS = 'bk-apiary-keyboard-spacer';
let baselineViewportHeight = 0;

function isSmallScreen() {
  return window.matchMedia('(max-width: 520px)').matches;
}

function getEditPanel() {
  return document.querySelector(`${EDIT_MODAL_SELECTOR} > div`);
}

function getVisibleViewportHeight() {
  return Math.round(window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight || 0);
}

function rememberBaselineViewport() {
  const height = getVisibleViewportHeight();
  if (height > baselineViewportHeight) baselineViewportHeight = height;
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
  const visibleHeight = getVisibleViewportHeight();
  const viewport = window.visualViewport;
  const offsetTop = Math.max(0, Math.round(viewport?.offsetTop || 0));

  if (!baselineViewportHeight) baselineViewportHeight = Math.max(visibleHeight, window.innerHeight || 0);

  return Math.max(0, baselineViewportHeight - visibleHeight - offsetTop);
}

function updateKeyboardSpacer() {
  const panel = getEditPanel();
  if (!panel) return;

  if (!isSmallScreen() || !document.body.classList.contains('bk-apiary-edit-open')) {
    panel.querySelector(`:scope > .${KEYBOARD_SPACER_CLASS}`)?.remove();
    panel.style.removeProperty('scroll-padding-bottom');
    baselineViewportHeight = 0;
    return;
  }

  const fieldFocused = Boolean(panel.querySelector('input:focus, textarea:focus, select:focus'));
  if (!fieldFocused) rememberBaselineViewport();

  const spacer = getKeyboardSpacer(panel);
  const covered = keyboardCoveredHeight();

  /* Mobile browsers handle software keyboards differently: some shrink the
     visual viewport and others overlay it. Keep the largest viewport seen
     before focus as the baseline, then always add enough real scroll space
     below the action buttons while a field is active. */
  const fallback = Math.round(Math.max(baselineViewportHeight, window.screen?.height || 0) * 0.48);
  const spacerHeight = fieldFocused ? Math.max(covered + 48, fallback, 300) : 0;

  spacer.style.height = `${spacerHeight}px`;
  spacer.style.minHeight = `${spacerHeight}px`;
  panel.style.setProperty('scroll-padding-bottom', `${spacerHeight}px`, 'important');
}

function keepFocusedFieldVisible(event) {
  const target = event?.target;
  if (!target?.closest?.(EDIT_MODAL_SELECTOR)) return;

  if (!baselineViewportHeight) {
    baselineViewportHeight = Math.max(getVisibleViewportHeight(), window.innerHeight || 0);
  }

  window.setTimeout(() => {
    updateKeyboardSpacer();
    target.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
  }, 250);
}

function handleViewportChange() {
  window.requestAnimationFrame(updateKeyboardSpacer);
}

window.visualViewport?.addEventListener('resize', handleViewportChange);
window.visualViewport?.addEventListener('scroll', handleViewportChange);
window.addEventListener('resize', handleViewportChange);
document.addEventListener('focusin', keepFocusedFieldVisible, true);
document.addEventListener('focusout', () => {
  window.setTimeout(() => {
    const panel = getEditPanel();
    const fieldFocused = Boolean(panel?.querySelector('input:focus, textarea:focus, select:focus'));
    if (!fieldFocused) rememberBaselineViewport();
    updateKeyboardSpacer();
  }, 250);
}, true);

new MutationObserver(updateKeyboardSpacer).observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['class'],
});

rememberBaselineViewport();
updateKeyboardSpacer();
