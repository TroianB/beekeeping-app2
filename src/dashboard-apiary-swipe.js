let pageSwipeStartX = 0;
let pageSwipeStartY = 0;
let pageSwipeStartedOnForm = false;
let pageSwipeAnimating = false;

const BK_SCREEN_TRANSITION_MS = 320;
const BK_SCREEN_EASING = 'cubic-bezier(0.22, 0.61, 0.36, 1)';

function installSharedScreenTransitionStyles() {
  if (document.getElementById('bkSharedScreenTransitionStyles')) return;
  const style = document.createElement('style');
  style.id = 'bkSharedScreenTransitionStyles';
  style.textContent = `
body.bk-apiaries-list-only [class*="lg:grid-cols-[520px,1fr]"] > :nth-child(2) {
  transition: transform ${BK_SCREEN_TRANSITION_MS}ms ${BK_SCREEN_EASING} !important;
}
body.bk-apiary-detail-closing [class*="lg:grid-cols-[520px,1fr]"] > :nth-child(2) {
  transition: transform ${BK_SCREEN_TRANSITION_MS}ms ${BK_SCREEN_EASING} !important;
}
`;
  document.head.appendChild(style);
}

function findMainTabButton(label) {
  const wanted = String(label || '').trim().toLowerCase();
  return Array.from(document.querySelectorAll('body > #root button')).find((button) => {
    return button.textContent.trim().toLowerCase() === wanted;
  }) || null;
}

function isApiariesPage() {
  return Boolean(document.querySelector('body > #root input[placeholder="Search apiaries..."]'));
}

function isDashboardPage() {
  return Boolean(findMainTabButton('Dashboard')) && !isApiariesPage();
}

function isBlockedForPageSwipe(target) {
  if (pageSwipeAnimating) return true;
  if (document.body.classList.contains('bk-apiary-detail-open')) return true;
  if (document.body.classList.contains('bk-apiary-detail-closing')) return true;
  if (document.body.classList.contains('bk-apiary-delete-mode')) return true;
  if (target?.closest?.('body > #root .fixed.inset-0.z-50')) return true;
  if (target?.closest?.('#bkApiaryDetailBack')) return true;
  if (target?.closest?.('input, textarea, select, button')) return true;
  return false;
}

function openDashboard() {
  findMainTabButton('Dashboard')?.click();
}

function openApiaries() {
  findMainTabButton('Apiaries')?.click();
}

function destinationUiReady() {
  const root = document.querySelector('body > #root');
  if (!root) return false;

  // Header controls are shared by Dashboard and Apiaries. Import CSV is added
  // by a compatibility module, so force it in synchronously before revealing.
  window.bkEnsureCsvImportControls?.();
  const header = root.querySelector(':scope > .mx-auto > div.mb-4.flex');
  if (!header) return false;
  if (!header.querySelector('#bkImportCsvButton')) return false;

  if (isApiariesPage()) {
    // Let the Apiary-specific injectors finish before the page becomes visible.
    if (!document.body.classList.contains('bk-apiaries-list-only')) return false;
    if (!root.querySelector('input[placeholder="Search apiaries..."]')) return false;
  }

  return true;
}

function waitForDestinationUi(callback) {
  const startedAt = performance.now();
  const check = () => {
    if (destinationUiReady() || performance.now() - startedAt > 180) {
      requestAnimationFrame(() => requestAnimationFrame(callback));
      return;
    }
    requestAnimationFrame(check);
  };
  check();
}

function slideToPage(openNextPage, direction) {
  if (pageSwipeAnimating) return;

  const root = document.querySelector('body > #root');
  if (!root) {
    openNextPage();
    return;
  }

  pageSwipeAnimating = true;

  const overlay = document.createElement('div');
  overlay.id = 'bkPageSwipeOverlay';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.zIndex = '2147483000';
  overlay.style.overflow = 'hidden';
  overlay.style.pointerEvents = 'none';
  overlay.style.background = getComputedStyle(document.body).backgroundColor || '#000';
  overlay.style.transform = 'translate3d(0,0,0)';
  overlay.style.willChange = 'transform';

  const snapshot = root.cloneNode(true);
  snapshot.dataset.bkSwipeSnapshot = '1';
  snapshot.style.width = `${window.innerWidth}px`;
  snapshot.style.minHeight = `${Math.max(document.documentElement.scrollHeight, window.innerHeight)}px`;
  snapshot.style.transform = `translate3d(0, -${window.scrollY}px, 0)`;
  snapshot.style.pointerEvents = 'none';
  overlay.appendChild(snapshot);
  document.body.appendChild(overlay);

  openNextPage();

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    overlay.remove();
    pageSwipeAnimating = false;
  };

  // Keep the old screen fully visible until the destination and all of its
  // controls are ready. Then slide it away in one continuous motion.
  waitForDestinationUi(() => {
    if (!overlay.isConnected) {
      finish();
      return;
    }

    overlay.style.transition = `transform ${BK_SCREEN_TRANSITION_MS}ms ${BK_SCREEN_EASING}`;
    overlay.style.transform = direction === 'left'
      ? 'translate3d(-100vw,0,0)'
      : 'translate3d(100vw,0,0)';

    overlay.addEventListener('transitionend', finish, { once: true });
    window.setTimeout(finish, BK_SCREEN_TRANSITION_MS + 140);
  });
}

// Expose the same transition controller for other full-screen navigation code.
window.bkSlideScreenTo = slideToPage;

installSharedScreenTransitionStyles();

document.addEventListener('touchstart', (event) => {
  const touch = event.touches[0];
  pageSwipeStartX = touch.clientX;
  pageSwipeStartY = touch.clientY;
  pageSwipeStartedOnForm = isBlockedForPageSwipe(event.target);
}, { passive: true });

document.addEventListener('touchend', (event) => {
  if (!pageSwipeStartX || pageSwipeStartedOnForm) {
    pageSwipeStartX = 0;
    pageSwipeStartY = 0;
    pageSwipeStartedOnForm = false;
    return;
  }

  const touch = event.changedTouches[0];
  const dx = touch.clientX - pageSwipeStartX;
  const dy = touch.clientY - pageSwipeStartY;

  pageSwipeStartX = 0;
  pageSwipeStartY = 0;
  pageSwipeStartedOnForm = false;

  if (Math.abs(dx) < 55) return;
  if (Math.abs(dx) <= Math.abs(dy) * 1.15) return;

  if (isDashboardPage() && dx < 0) {
    slideToPage(openApiaries, 'left');
    return;
  }

  if (isApiariesPage() && dx > 0) {
    slideToPage(openDashboard, 'right');
  }
}, { passive: true });
