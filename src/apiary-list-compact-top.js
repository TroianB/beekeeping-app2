const APIARY_COMPACT_SEARCH_SELECTOR = '#root input[placeholder="Search apiaries..."]';
let compactApiaryScroller = null;

function getCompactSearchInput() {
  return document.querySelector(APIARY_COMPACT_SEARCH_SELECTOR);
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

function updateCompactApiaryTop() {
  const search = getCompactSearchInput();
  const scroller = getCompactApiaryScroller();
  const blocked = document.body.classList.contains('bk-apiary-detail-open')
    || document.body.classList.contains('bk-apiary-edit-open');

  const shouldCompact = Boolean(search && scroller && scroller.scrollTop > 12 && !blocked);
  document.body.classList.toggle('bk-apiary-list-compact-top', shouldCompact);
}

function watchCompactApiaryScroller() {
  const scroller = getCompactApiaryScroller();
  if (compactApiaryScroller !== scroller) {
    compactApiaryScroller?.removeEventListener?.('scroll', updateCompactApiaryTop);
    compactApiaryScroller = scroller;
    compactApiaryScroller?.addEventListener?.('scroll', updateCompactApiaryTop, { passive: true });
  }

  updateCompactApiaryTop();
}

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
