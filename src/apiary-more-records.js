const MORE_RECORDS_PAGE_ID = 'bkMoreRecordsPage';

function getApiaryDetailPanel() {
  const search = document.querySelector('#root input[placeholder="Search apiaries..."]');
  const layout = search?.closest('[class*="lg:grid-cols-[520px,1fr]"]');
  return layout?.children?.[1] || null;
}

function getCurrentApiaryName() {
  const panel = getApiaryDetailPanel();
  if (!panel) return 'Apiary';

  const name = panel.querySelector(
    ':scope > div:not(#bkApiaryDetailBack) > div.flex.items-start.justify-between.gap-4 > div:first-child > div:first-child'
  )?.textContent?.trim();

  return name || 'Apiary';
}

function closeMoreRecordsPage() {
  document.getElementById(MORE_RECORDS_PAGE_ID)?.remove();
  document.body.classList.remove('bk-more-records-open');
}

function openMoreRecordsPage() {
  const panel = getApiaryDetailPanel();
  if (!panel) return;

  closeMoreRecordsPage();

  const page = document.createElement('section');
  page.id = MORE_RECORDS_PAGE_ID;
  page.setAttribute('aria-label', 'More Records');
  page.innerHTML = `
    <div class="bk-more-records-header">
      <button type="button" id="bkMoreRecordsBackButton">Back</button>
      <div class="bk-more-records-heading">
        <div class="bk-more-records-title">More Records</div>
        <div class="bk-more-records-apiary-name"></div>
      </div>
    </div>
    <div class="bk-more-records-list" aria-label="Apiary record categories">
      <button type="button" class="bk-more-records-item" data-record-type="feeding">Feeding</button>
      <button type="button" class="bk-more-records-item" data-record-type="diseases-control">Diseases Control</button>
      <button type="button" class="bk-more-records-item" data-record-type="queen-records">Queen Records</button>
      <button type="button" class="bk-more-records-item" data-record-type="honey-records">Honey Records</button>
    </div>
  `;

  const nameElement = page.querySelector('.bk-more-records-apiary-name');
  if (nameElement) nameElement.textContent = getCurrentApiaryName();

  page.querySelector('#bkMoreRecordsBackButton')?.addEventListener('click', closeMoreRecordsPage);
  panel.appendChild(page);
  document.body.classList.add('bk-more-records-open');
  page.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}

function enhanceApiaryInformationBar() {
  const bar = document.getElementById('bkApiaryDetailBack');
  if (!bar) return;

  const originalBackButton = bar.querySelector('button');
  if (!originalBackButton) return;

  originalBackButton.id = 'bkApiaryInformationBackButton';
  originalBackButton.textContent = 'Back';

  bar.querySelector('span')?.remove();

  let moreRecordsButton = document.getElementById('bkMoreRecordsButton');
  if (!moreRecordsButton || !bar.contains(moreRecordsButton)) {
    moreRecordsButton = document.createElement('button');
    moreRecordsButton.type = 'button';
    moreRecordsButton.id = 'bkMoreRecordsButton';
    moreRecordsButton.textContent = 'More Records';
    moreRecordsButton.addEventListener('click', openMoreRecordsPage);
    bar.appendChild(moreRecordsButton);
  }
}

function cleanUpWhenInformationCloses() {
  if (!document.body.classList.contains('bk-apiary-detail-open')) {
    closeMoreRecordsPage();
  }
}

new MutationObserver(() => {
  enhanceApiaryInformationBar();
  cleanUpWhenInformationCloses();
}).observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['class'],
});

document.addEventListener('click', (event) => {
  if (event.target?.closest?.('#bkApiaryInformationBackButton')) {
    closeMoreRecordsPage();
  }
}, true);

enhanceApiaryInformationBar();
