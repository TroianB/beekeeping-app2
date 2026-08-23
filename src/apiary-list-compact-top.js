const APIARY_COMPACT_SEARCH_SELECTOR = '#root input[placeholder="Search apiaries..."]';
let compactApiaryScroller = null;
let compactRaf = 0;

function getCompactSearchInput() {
  return document.querySelector(APIARY_COMPACT_SEARCH_SELECTOR);
}

function getCompactRoot() {
  return document.querySelector('#root > div');
}

function getCompactMainHeaderLine() {
  const root = getCompactRoot();
  if (!root) return null;

  return Array.from(root.children).find((child) => {
    if (!(child instanceof HTMLElement)) return false;
    const buttons = Array.from(child.querySelectorAll('button')).map((button) => button.textContent.trim().toLowerCase());
    return buttons.includes('dashboard') && buttons.includes('apiaries');
  }) || null;
}

function getCompactButtonLine() {
  const search = getCompactSearchInput();
  const parent = search?.parentElement;
  if (!parent) return null;

  return Array.from(parent.children).find((child) => {
    if (!(child instanceof HTMLElement)) return false;
    return Array.from(child.querySelectorAll('button')).some((button) => {
      return button.textContent.trim().toLowerCase().includes('add apiary');
    });
  }) || null;
}

function markCompactApiaryLines() {
  const search = getCompactSearchInput();
  const mainHeader = getCompactMainHeaderLine();
  const buttonLine = getCompactButtonLine();

  document.querySelectorAll('.bk-apiary-compact-main-line').forEach((element) => {
    if (element !== mainHeader) element.classList.remove('bk-apiary-compact-main-line');
  });
  document.querySelectorAll('.bk-apiary-compact-search-line').forEach((element) => {
    if (element !== search) element.classList.remove('bk-apiary-compact-search-line');
  });
  document.querySelectorAll('.bk-apiary-compact-button-line').forEach((element) => {
    if (element !== buttonLine) element.classList.remove('bk-apiary-compact-button-line');
  });

  mainHeader?.classList.add('bk-apiary-compact-main-line');
  search?.classList.add('bk-apiary-compact-search-line');
  buttonLine?.classList.add('bk-apiary-compact-button-line');
}

function getCompactApiaryScroller() {
  const search = getCompactSearchInput();
  const card = search?.nextElementSibling;
  const directScroller = card?.children?.[1];
  if (directScroller instanceof HTMLElement) return directScroller;

  return Array.from(card?.querySelectorAll?.('div') || []).find((element) => {
    const style = window.getComputedStyle(element);
    return element.scrollHeight > element.clientHeight && /auto|scroll/.test(style.overflowY);
  }) || null;
}

function readPageScrollTop() {
  return window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
}

function applyCompactApiaryTop() {
  compactRaf = 0;
  markCompactApiaryLines();

  const search = getCompactSearchInput();
  const scroller = getCompactApiaryScroller();
  const apiariesActive = document.body.classList.contains('bk-apiaries-list-only') && Boolean(search);
  const blocked = document.body.classList.contains('bk-apiary-detail-open')
    || document.body.classList.contains('bk-apiary-edit-open');

  const listScrolled = Boolean(scroller && scroller.scrollTop > 10);
  const pageScrolled = readPageScrollTop() > 10;
  const shouldCompact = Boolean(apiariesActive && !blocked && (listScrolled || pageScrolled));

  document.body.classList.toggle('bk-apiary-list-compact-top', shouldCompact);
}

function updateCompactApiaryTop() {
  if (compactRaf) return;
  compactRaf = window.requestAnimationFrame(applyCompactApiaryTop);
}

function watchCompactApiaryScroller() {
  markCompactApiaryLines();
  const scroller = getCompactApiaryScroller();
  if (compactApiaryScroller !== scroller) {
    compactApiaryScroller?.removeEventListener?.('scroll', updateCompactApiaryTop);
    compactApiaryScroller = scroller;
    compactApiaryScroller?.addEventListener?.('scroll', updateCompactApiaryTop, { passive: true });
  }

  updateCompactApiaryTop();
}

window.addEventListener('scroll', updateCompactApiaryTop, { passive: true });
document.addEventListener('scroll', updateCompactApiaryTop, true);
window.addEventListener('resize', updateCompactApiaryTop, { passive: true });
window.addEventListener('bk-open-apiary-detail', () => {
  document.body.classList.remove('bk-apiary-list-compact-top');
});

document.addEventListener('click', (event) => {
  if (event.target.closest?.('#root .fixed.inset-0.z-50')) {
    document.body.classList.remove('bk-apiary-list-compact-top');
  }
}, true);

new MutationObserver(watchCompactApiaryScroller).observe(document.documentElement, {
  childList: true,
  subtree: true,
});

watchCompactApiaryScroller();
