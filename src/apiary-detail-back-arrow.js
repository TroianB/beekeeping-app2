function bkFixApiaryDetailBackArrow() {
  const bar = document.getElementById('bkApiaryDetailBack');
  if (!bar) return;

  /* The new Apiary Information header owns its own Back + More Records buttons. */
  if (
    bar.querySelector('#bkApiaryInformationBackButton')
    || bar.querySelector('#bkMoreRecordsButton')
  ) {
    return;
  }

  const button = bar.querySelector('button');
  if (!button) return;

  if (button.dataset.backArrowFixed === '1') return;
  button.dataset.backArrowFixed = '1';
  button.innerHTML = `
    <span class="bk-apiary-detail-back-title">Apiary List</span>
    <span class="bk-apiary-detail-back-arrow" aria-hidden="true">→</span>
  `;
}

function bkScheduleApiaryDetailBackArrow() {
  [0, 40, 120, 260].forEach((delay) => {
    window.setTimeout(bkFixApiaryDetailBackArrow, delay);
  });
}

document.addEventListener('click', bkScheduleApiaryDetailBackArrow, true);

new MutationObserver(bkScheduleApiaryDetailBackArrow).observe(document.documentElement, {
  childList: true,
  subtree: true,
});

bkScheduleApiaryDetailBackArrow();
