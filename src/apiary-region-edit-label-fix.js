function bkKeepEditRegionFieldClean(control) {
  if (!control?.classList?.contains('bk-region-area-edit-screen')) return;
  const value = String(control.querySelector('.bk-region-area-value')?.value || '').trim();
  const button = control.querySelector('.bk-region-area-button');
  if (button) button.textContent = value ? `${value} ▾` : 'Select Region ▾';
}

document.addEventListener('click', (event) => {
  const option = event.target.closest?.('.bk-region-area-option');
  const control = option?.closest?.('.bk-region-area-control');
  if (!option || !control || control.classList.contains('bk-region-area-editing-regions')) return;
  window.setTimeout(() => bkKeepEditRegionFieldClean(control), 0);
}, true);

new MutationObserver(() => {
  document.querySelectorAll('.bk-region-area-edit-screen').forEach(bkKeepEditRegionFieldClean);
}).observe(document.documentElement, { childList: true, subtree: true });
