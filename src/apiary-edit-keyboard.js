const EDIT_MODAL_SELECTOR = '#root .bk-apiary-edit-modal';

function isSmallScreen() {
  return window.matchMedia('(max-width: 520px)').matches;
}

function getEditModalParts() {
  const modal = document.querySelector(EDIT_MODAL_SELECTOR);
  const panel = modal?.firstElementChild || null;
  return { modal, panel };
}

function clearKeyboardViewportSizing() {
  const { modal, panel } = getEditModalParts();
  [modal, panel].forEach((element) => {
    if (!element) return;
    element.style.removeProperty('height');
    element.style.removeProperty('max-height');
  });
  if (modal) elementSafeRemove(modal, 'top');
  if (panel) panel.style.removeProperty('padding-bottom');
}

function elementSafeRemove(element, property) {
  element?.style?.removeProperty(property);
}

function applyKeyboardViewportSizing() {
  if (!isSmallScreen() || !document.body.classList.contains('bk-apiary-edit-open')) {
    clearKeyboardViewportSizing();
    return;
  }

  const { modal, panel } = getEditModalParts();
  if (!modal || !panel) return;

  const viewport = window.visualViewport;
  const height = Math.max(260, Math.round(viewport?.height || window.innerHeight));
  const offsetTop = Math.max(0, Math.round(viewport?.offsetTop || 0));

  modal.style.setProperty('top', `${offsetTop}px`, 'important');
  modal.style.setProperty('height', `${height}px`, 'important');
  modal.style.setProperty('max-height', `${height}px`, 'important');

  panel.style.setProperty('height', `${height}px`, 'important');
  panel.style.setProperty('max-height', `${height}px`, 'important');
  panel.style.setProperty('padding-bottom', 'max(1rem, env(safe-area-inset-bottom))', 'important');
}

function keepFocusedFieldVisible(event) {
  const target = event?.target;
  if (!target?.closest?.(EDIT_MODAL_SELECTOR)) return;

  window.setTimeout(() => {
    applyKeyboardViewportSizing();
    target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
  }, 120);
}

window.visualViewport?.addEventListener('resize', applyKeyboardViewportSizing);
window.visualViewport?.addEventListener('scroll', applyKeyboardViewportSizing);
window.addEventListener('resize', applyKeyboardViewportSizing);
document.addEventListener('focusin', keepFocusedFieldVisible, true);
document.addEventListener('focusout', () => window.setTimeout(applyKeyboardViewportSizing, 120), true);

new MutationObserver(applyKeyboardViewportSizing).observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['class'],
});

applyKeyboardViewportSizing();
