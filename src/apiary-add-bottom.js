function readApiaryList() {
  try {
    const raw = localStorage.getItem('bk.hives');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeApiaryList(apiaries) {
  try {
    localStorage.setItem('bk.hives', JSON.stringify(apiaries));
  } catch {}
}

function getModalTitle(modal) {
  const panel = modal?.children?.[0];
  const title = panel?.children?.[0];
  return String(title?.textContent || '').trim();
}

function isAddApiaryModal(element) {
  const modal = element?.closest?.('#root .fixed.inset-0.z-50');
  return getModalTitle(modal).toLowerCase() === 'add apiary';
}

function apiaryKey(apiary) {
  return String(apiary?.id || apiary?.name || '').trim().toLowerCase();
}

function moveNewestApiaryToBottom(before) {
  const beforeKeys = new Set(before.map(apiaryKey).filter(Boolean));
  const after = readApiaryList();

  if (after.length !== before.length + 1) return false;

  const newIndex = after.findIndex((apiary) => !beforeKeys.has(apiaryKey(apiary)));
  if (newIndex < 0 || newIndex === after.length - 1) return false;

  const reordered = [...after];
  const [newApiary] = reordered.splice(newIndex, 1);
  reordered.push(newApiary);
  writeApiaryList(reordered);
  return true;
}

function moveNewestApiaryToBottomWithRetry(before, attempt = 0) {
  if (moveNewestApiaryToBottom(before)) {
    window.setTimeout(() => window.location.reload(), 80);
    return;
  }

  if (attempt < 8) {
    window.setTimeout(() => moveNewestApiaryToBottomWithRetry(before, attempt + 1), 120);
  }
}

document.addEventListener('click', (event) => {
  const button = event.target.closest?.('button');
  if (!button || button.textContent.trim().toLowerCase() !== 'save') return;
  if (!isAddApiaryModal(button)) return;

  const before = readApiaryList();
  window.setTimeout(() => moveNewestApiaryToBottomWithRetry(before), 80);
}, true);
