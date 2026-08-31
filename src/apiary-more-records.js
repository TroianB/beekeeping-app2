const MORE_RECORDS_PAGE_ID = 'bkMoreRecordsPage';
const FEEDING_PAGE_ID = 'bkFeedingPage';
const FEEDING_STORAGE_KEY = 'bk.feeding.records';

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

function closeFeedingPage() {
  document.getElementById(FEEDING_PAGE_ID)?.remove();
  document.body.classList.remove('bk-feeding-open');
}

function readFeedingRecords() {
  try {
    const parsed = JSON.parse(localStorage.getItem(FEEDING_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveFeedingRecord(record) {
  try {
    const records = readFeedingRecords();
    records.push(record);
    localStorage.setItem(FEEDING_STORAGE_KEY, JSON.stringify(records));
    return true;
  } catch {
    return false;
  }
}

function todayForInput() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function openFeedingPage() {
  const panel = getApiaryDetailPanel();
  if (!panel) return;

  closeFeedingPage();
  const apiaryName = getCurrentApiaryName();
  const page = document.createElement('section');
  page.id = FEEDING_PAGE_ID;
  page.setAttribute('aria-label', 'Feeding record');
  page.innerHTML = `
    <div class="bk-feeding-card">
      <div class="bk-feeding-top-row">
        <div>
          <div class="bk-feeding-title">Feeding</div>
          <div class="bk-feeding-apiary-name"></div>
        </div>
        <label class="bk-feeding-date-label">
          <span>Date</span>
          <input type="date" id="bkFeedingDate" value="${todayForInput()}">
        </label>
      </div>

      <div class="bk-feeding-form">
        <div class="bk-feeding-line">
          <label for="bkFeedingSugarSyrup">Sugar Syrup</label>
          <div class="bk-feeding-quantity">
            <span>Average L/hive</span>
            <input type="number" id="bkFeedingSugarSyrup" min="0" step="0.1" inputmode="decimal">
            <span>L</span>
          </div>
        </div>

        <div class="bk-feeding-line">
          <label for="bkFeedingPollenSupplement">Pollen supplement</label>
          <input type="checkbox" id="bkFeedingPollenSupplement" class="bk-feeding-checkbox">
        </div>
      </div>

      <div class="bk-feeding-actions">
        <button type="button" id="bkFeedingCancel">Cancel</button>
        <button type="button" id="bkFeedingSave">Save</button>
      </div>
    </div>
  `;

  page.querySelector('.bk-feeding-apiary-name').textContent = apiaryName;
  page.querySelector('#bkFeedingCancel')?.addEventListener('click', closeFeedingPage);
  page.querySelector('#bkFeedingSave')?.addEventListener('click', () => {
    const date = page.querySelector('#bkFeedingDate')?.value || '';
    const sugarSyrup = page.querySelector('#bkFeedingSugarSyrup')?.value || '';
    const pollenSupplement = Boolean(page.querySelector('#bkFeedingPollenSupplement')?.checked);

    if (!date) {
      window.alert('Please select a date.');
      return;
    }

    const saved = saveFeedingRecord({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      apiaryName,
      date,
      sugarSyrup: sugarSyrup === '' ? null : Number(sugarSyrup),
      pollenSupplement,
      createdAt: new Date().toISOString(),
    });

    if (!saved) {
      window.alert('The Feeding record could not be saved.');
      return;
    }

    closeFeedingPage();
  });

  panel.appendChild(page);
  document.body.classList.add('bk-feeding-open');
  page.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}

function closeMoreRecordsPage() {
  closeFeedingPage();
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
  page.querySelector('[data-record-type="feeding"]')?.addEventListener('click', openFeedingPage);
  panel.appendChild(page);
  document.body.classList.add('bk-more-records-open');
  page.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}

function enhanceApiaryInformationBar() {
  const bar = document.getElementById('bkApiaryDetailBack');
  if (!bar) return;

  const originalBackButton = bar.querySelector('button');
  if (!originalBackButton) return;

  if (originalBackButton.id !== 'bkApiaryInformationBackButton') originalBackButton.id = 'bkApiaryInformationBackButton';
  if (originalBackButton.textContent?.trim() !== 'Back') originalBackButton.textContent = 'Back';

  const directHint = Array.from(bar.children).find((child) => child.tagName === 'SPAN');
  if (directHint) directHint.remove();

  let moreRecordsButton = bar.querySelector('#bkMoreRecordsButton');
  if (!moreRecordsButton) {
    moreRecordsButton = document.createElement('button');
    moreRecordsButton.type = 'button';
    moreRecordsButton.id = 'bkMoreRecordsButton';
    moreRecordsButton.textContent = 'More Records';
    moreRecordsButton.addEventListener('click', openMoreRecordsPage);
    bar.appendChild(moreRecordsButton);
  }
}

function cleanUpWhenInformationCloses() {
  if (!document.body.classList.contains('bk-apiary-detail-open') && (document.getElementById(MORE_RECORDS_PAGE_ID) || document.getElementById(FEEDING_PAGE_ID))) {
    closeMoreRecordsPage();
  }
}

let observerScheduled = false;
function scheduleEnhancement() {
  if (observerScheduled) return;
  observerScheduled = true;
  window.requestAnimationFrame(() => {
    observerScheduled = false;
    enhanceApiaryInformationBar();
    cleanUpWhenInformationCloses();
  });
}

new MutationObserver(scheduleEnhancement).observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['class'],
});

document.addEventListener('click', (event) => {
  if (event.target?.closest?.('#bkApiaryInformationBackButton')) closeMoreRecordsPage();
}, true);

scheduleEnhancement();
