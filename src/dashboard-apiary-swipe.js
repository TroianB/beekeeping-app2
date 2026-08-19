let pageSwipeStartX = 0;
let pageSwipeStartY = 0;
let pageSwipeStartedOnForm = false;

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
    openApiaries();
    return;
  }

  if (isApiariesPage() && dx > 0) {
    openDashboard();
  }
}, { passive: true });
