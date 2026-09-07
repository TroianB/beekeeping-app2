const EDIT_MODAL_SELECTOR = '#root .bk-apiary-edit-modal';
const RECORD_PAGE_SELECTOR = '#bkFeedingPage, #bkDiseaseMonitoringPage';
const EDIT_SPACER_CLASS = 'bk-apiary-keyboard-spacer';
const RECORD_SPACER_CLASS = 'bk-record-keyboard-spacer';
let baselineViewportHeight = 0;

function isSmallScreen() {
  return window.matchMedia('(max-width: 520px)').matches;
}

function getVisibleViewportHeight() {
  return Math.round(window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight || 0);
}

function getViewportOffsetTop() {
  return Math.max(0, Math.round(window.visualViewport?.offsetTop || 0));
}

function rememberBaselineViewport() {
  const height = Math.max(getVisibleViewportHeight(), window.innerHeight || 0);
  if (height > baselineViewportHeight) baselineViewportHeight = height;
}

function keyboardCoveredHeight() {
  const visibleHeight = getVisibleViewportHeight();
  if (!baselineViewportHeight) rememberBaselineViewport();
  return Math.max(0, baselineViewportHeight - visibleHeight - getViewportOffsetTop());
}

function getOrCreateSpacer(parent, className) {
  if (!parent) return null;
  let spacer = parent.querySelector(`:scope > .${className}`);
  if (!spacer) {
    spacer = document.createElement('div');
    spacer.className = className;
    spacer.setAttribute('aria-hidden', 'true');
    spacer.style.width = '100%';
    spacer.style.flex = '0 0 auto';
    spacer.style.pointerEvents = 'none';
    parent.appendChild(spacer);
  }
  return spacer;
}

function setSpacerHeight(spacer, height) {
  if (!spacer) return;
  spacer.style.height = `${height}px`;
  spacer.style.minHeight = `${height}px`;
}

function keyboardFallbackHeight() {
  const screenHeight = window.screen?.height || 0;
  return Math.round(Math.max(baselineViewportHeight, screenHeight, 640) * 0.48);
}

function getEditPanel() {
  return document.querySelector(`${EDIT_MODAL_SELECTOR} > div`);
}

function updateEditKeyboardSpacer() {
  const panel = getEditPanel();
  if (!panel) return;

  if (!isSmallScreen() || !document.body.classList.contains('bk-apiary-edit-open')) {
    panel.querySelector(`:scope > .${EDIT_SPACER_CLASS}`)?.remove();
    panel.style.removeProperty('scroll-padding-bottom');
    return;
  }

  const fieldFocused = Boolean(panel.querySelector('input:focus, textarea:focus, select:focus'));
  if (!fieldFocused) rememberBaselineViewport();

  const spacer = getOrCreateSpacer(panel, EDIT_SPACER_CLASS);
  const height = fieldFocused
    ? Math.max(keyboardCoveredHeight() + 48, keyboardFallbackHeight(), 300)
    : 0;

  setSpacerHeight(spacer, height);
  panel.style.setProperty('scroll-padding-bottom', `${height}px`, 'important');
}

function getRecordPageForElement(element) {
  return element?.closest?.(RECORD_PAGE_SELECTOR) || null;
}

function clearRecordPageKeyboardState(page) {
  if (!page) return;
  const shell = page.querySelector('.bk-record-shell');
  shell?.querySelector(`:scope > .${RECORD_SPACER_CLASS}`)?.remove();
  page.style.removeProperty('scroll-padding-bottom');
  page.style.removeProperty('height');
  page.style.removeProperty('max-height');
  page.style.removeProperty('top');
  page.style.removeProperty('bottom');
}

function updateRecordKeyboardSpacer() {
  document.querySelectorAll(RECORD_PAGE_SELECTOR).forEach((page) => {
    const shell = page.querySelector('.bk-record-shell');
    if (!shell) return;

    if (!isSmallScreen()) {
      clearRecordPageKeyboardState(page);
      return;
    }

    const active = document.activeElement;
    const fieldFocused = Boolean(
      active &&
      page.contains(active) &&
      active.matches('input, textarea, select')
    );

    if (!fieldFocused) {
      rememberBaselineViewport();
      setSpacerHeight(getOrCreateSpacer(shell, RECORD_SPACER_CLASS), 0);
      page.style.removeProperty('scroll-padding-bottom');
      page.style.removeProperty('height');
      page.style.removeProperty('max-height');
      page.style.removeProperty('top');
      page.style.removeProperty('bottom');
      return;
    }

    const visibleHeight = Math.max(260, getVisibleViewportHeight());
    const offsetTop = getViewportOffsetTop();

    /* The page itself is already reduced to the visible area above the keyboard,
       so only a small tail is needed below the action buttons. The previous
       keyboard-sized spacer made Feeding and Disease Monitoring scroll much too far. */
    const spacerHeight = 96;

    page.style.setProperty('top', `${offsetTop}px`, 'important');
    page.style.setProperty('bottom', 'auto', 'important');
    page.style.setProperty('height', `${visibleHeight}px`, 'important');
    page.style.setProperty('max-height', `${visibleHeight}px`, 'important');
    page.style.setProperty('scroll-padding-bottom', '24px', 'important');

    const spacer = getOrCreateSpacer(shell, RECORD_SPACER_CLASS);
    setSpacerHeight(spacer, spacerHeight);
  });
}

function updateKeyboardLayout() {
  updateEditKeyboardSpacer();
  updateRecordKeyboardSpacer();
}

function keepFocusedFieldVisible(event) {
  const target = event?.target;
  const inEdit = target?.closest?.(EDIT_MODAL_SELECTOR);
  const recordPage = getRecordPageForElement(target);
  if (!inEdit && !recordPage) return;

  if (!baselineViewportHeight) rememberBaselineViewport();

  window.setTimeout(() => {
    updateKeyboardLayout();
    target.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
  }, 300);
}

function handleViewportChange() {
  window.requestAnimationFrame(updateKeyboardLayout);
}

window.visualViewport?.addEventListener('resize', handleViewportChange);
window.visualViewport?.addEventListener('scroll', handleViewportChange);
window.addEventListener('resize', handleViewportChange);
document.addEventListener('focusin', keepFocusedFieldVisible, true);
document.addEventListener('focusout', () => {
  window.setTimeout(() => {
    const active = document.activeElement;
    const stillEditing = Boolean(active?.closest?.(`${EDIT_MODAL_SELECTOR}, ${RECORD_PAGE_SELECTOR}`));
    if (!stillEditing) rememberBaselineViewport();
    updateKeyboardLayout();
  }, 300);
}, true);

new MutationObserver(updateKeyboardLayout).observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['class'],
});

rememberBaselineViewport();
updateKeyboardLayout();
