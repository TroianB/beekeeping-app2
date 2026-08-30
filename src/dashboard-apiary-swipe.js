let pageSwipeStartX = 0;
let pageSwipeStartY = 0;
let pageSwipeStartedOnForm = false;
let pageSwipeAnimating = false;

function findMainTabButton(label) {
  const wanted = String(label || '').trim().toLowerCase();
  return Array.from(document.querySelectorAll('#root button')).find((button) => {
    return button.textContent.trim().toLowerCase() === wanted;
  }) || null;
}

function isApiariesPage() {
  return Boolean(document.querySelector('#root input[placeholder="Search apiaries..."]'));
}

function isDashboardPage() {
  return Boolean(findMainTabButton('Dashboard')) && !isApiariesPage();
}

function isBlockedForPageSwipe(target) {
  if (pageSwipeAnimating) return true;
  if (document.body.classList.contains('bk-apiary-detail-open')) return true;
  if (document.body.classList.contains('bk-apiary-detail-closing')) return true;
  if (document.body.classList.contains('bk-apiary-delete-mode')) return true;
  if (target?.closest?.('#root .fixed.inset-0.z-50')) return true;
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

function slideToPage(openNextPage, direction) {
  if (pageSwipeAnimating) return;

  const root = document.querySelector('#root');
  if (!root) {
    openNextPage();
    return;
  }

  pageSwipeAnimating = true;

  // Keep a visual copy of the current screen above the app. The real app can
  // switch pages underneath it, then this copy slides away to reveal the next
  // screen instead of making the current screen disappear instantly.
  const overlay = document.createElement('div');
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
  snapshot.style.width = `${window.innerWidth}px`;
  snapshot.style.minHeight = `${Math.max(document.documentElement.scrollHeight, window.innerHeight)}px`;
  snapshot.style.transform = `translate3d(0, -${window.scrollY}px, 0)`;
  snapshot.style.pointerEvents = 'none';
  overlay.appendChild(snapshot);
  document.body.appendChild(overlay);

  openNextPage();

  const finish = () => {
    overlay.remove();
    pageSwipeAnimating = false;
  };

  // Let React paint the destination screen underneath before moving the old
  // screen sideways. This creates the visible "reveal" during the transition.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlay.style.transition = 'transform 320ms cubic-bezier(0.22, 0.61, 0.36, 1)';
      overlay.style.transform = direction === 'left'
        ? 'translate3d(-100vw,0,0)'
        : 'translate3d(100vw,0,0)';

      overlay.addEventListener('transitionend', finish, { once: true });
      window.setTimeout(finish, 420);
    });
  });
}

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
