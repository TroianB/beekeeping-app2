const MORE_RECORDS_PAGE_ID = 'bkMoreRecordsPage';
const FEEDING_PAGE_ID = 'bkFeedingPage';
const DISEASE_PAGE_ID = 'bkDiseaseMonitoringPage';
const FEEDING_STORAGE_KEY = 'bk.feeding.records';
const DISEASE_STORAGE_KEY = 'bk.disease.monitoring.records';

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

function readApiaries() {
  try {
    const parsed = JSON.parse(localStorage.getItem('bk.hives') || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readRecords(storageKey) {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getLatestRecord(storageKey, apiaryName) {
  const target = String(apiaryName || '').trim().toLowerCase();
  const matching = readRecords(storageKey).filter(
    (record) => String(record?.apiaryName || '').trim().toLowerCase() === target
  );
  if (!matching.length) return null;
  return matching.reduce((latest, record) => {
    const latestTime = Date.parse(latest?.createdAt || '') || 0;
    const recordTime = Date.parse(record?.createdAt || '') || 0;
    return recordTime >= latestTime ? record : latest;
  }, matching[0]);
}

function getCurrentLastVisit(apiaryName) {
  const target = String(apiaryName || '').trim().toLowerCase();
  const apiary = readApiaries().find((item) => String(item?.name || '').trim().toLowerCase() === target);
  return apiary?.lastInspection || todayForInput();
}

function formatDMY(iso) {
  const [y, m, d] = String(iso || '').split('T')[0].split('-');
  return y && m && d ? `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}` : String(iso || '');
}

function apiarySummaryMarkup() {
  return `
    <div class="bk-record-apiary-card">
      <div class="bk-record-apiary-icon" aria-hidden="true">▰</div>
      <div class="bk-record-apiary-copy">
        <div class="bk-record-apiary-name"></div>
        <div class="bk-record-last-visit">Last Visit: <strong></strong></div>
      </div>
    </div>
  `;
}

function fillApiarySummary(scope, apiaryName) {
  const name = scope.querySelector('.bk-record-apiary-name');
  const visit = scope.querySelector('.bk-record-last-visit strong');
  if (name) name.textContent = apiaryName;
  if (visit) visit.textContent = formatDMY(getCurrentLastVisit(apiaryName));
}

function todayForInput() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function saveRecord(storageKey, record) {
  try {
    const records = readRecords(storageKey);
    records.push(record);
    localStorage.setItem(storageKey, JSON.stringify(records));
    return true;
  } catch {
    return false;
  }
}

function updateApiaryLastVisit(apiaryName, date) {
  try {
    const apiaries = readApiaries();
    const target = String(apiaryName || '').trim().toLowerCase();
    let changed = false;
    const updated = apiaries.map((apiary) => {
      if (String(apiary?.name || '').trim().toLowerCase() !== target) return apiary;
      changed = true;
      return { ...apiary, lastInspection: date };
    });
    if (!changed) return false;
    localStorage.setItem('bk.hives', JSON.stringify(updated));
    syncVisibleLastVisit(apiaryName, date);
    document.querySelectorAll('.bk-record-last-visit strong').forEach((node) => {
      node.textContent = formatDMY(date);
    });
    return true;
  } catch {
    return false;
  }
}

function syncVisibleLastVisit(apiaryName, date) {
  const formatted = formatDMY(date);
  const panel = getApiaryDetailPanel();
  const detailDate = panel?.querySelector(
    ':scope > div:not(#bkApiaryDetailBack) > div.flex.items-start.justify-between.gap-4 > div:first-child > div:nth-child(2) span:last-child'
  );
  if (detailDate) detailDate.textContent = formatted;

  document.querySelectorAll('.bk-last-update-value').forEach((value) => {
    const row = value.closest('div.grid');
    const name = row?.querySelector(':scope > span[draggable="true"], :scope > span:not(.bk-last-update-value)')?.textContent?.trim();
    if (String(name || '').toLowerCase() === String(apiaryName || '').trim().toLowerCase()) value.textContent = formatted;
  });
}

function flashSaved(button) {
  if (!button) return;
  const previous = button.textContent;
  button.textContent = 'Saved';
  button.disabled = true;
  window.setTimeout(() => {
    if (!button.isConnected) return;
    button.textContent = previous;
    button.disabled = false;
  }, 1200);
}

function closeFeedingPage() {
  document.getElementById(FEEDING_PAGE_ID)?.remove();
  document.body.classList.remove('bk-feeding-open');
}

function closeDiseasePage() {
  document.getElementById(DISEASE_PAGE_ID)?.remove();
  document.body.classList.remove('bk-disease-monitoring-open');
}

function restoreFeedingRecord(page, apiaryName) {
  const record = getLatestRecord(FEEDING_STORAGE_KEY, apiaryName);
  if (!record) return;
  const date = page.querySelector('#bkFeedingDate');
  const sugar = page.querySelector('#bkFeedingSugarSyrup');
  const pollen = page.querySelector('#bkFeedingPollenSupplement');
  if (date && record.date) date.value = record.date;
  if (sugar) sugar.value = record.sugarSyrup == null ? '' : String(record.sugarSyrup);
  if (pollen) pollen.checked = Boolean(record.pollenSupplement);
}

function openFeedingPage() {
  const panel = getApiaryDetailPanel();
  if (!panel) return;
  closeFeedingPage();
  closeDiseasePage();

  const apiaryName = getCurrentApiaryName();
  const page = document.createElement('section');
  page.id = FEEDING_PAGE_ID;
  page.className = 'bk-record-page';
  page.innerHTML = `
    <div class="bk-record-shell">
      <div class="bk-record-page-header">
        <button type="button" class="bk-record-back" id="bkFeedingBack">‹ Back</button>
        <div class="bk-record-page-title">Feeding</div>
        <div class="bk-record-header-spacer"></div>
      </div>
      ${apiarySummaryMarkup()}
      <div class="bk-record-form">
        <label class="bk-record-field bk-record-field-full">
          <span>Date</span>
          <input type="date" id="bkFeedingDate" value="${todayForInput()}">
        </label>
        <div class="bk-record-field bk-record-field-full">
          <span>Sugar Syrup</span>
          <label class="bk-record-subfield">
            <span>Average L/hive</span>
            <div class="bk-record-unit-input"><input type="number" id="bkFeedingSugarSyrup" min="0" step="0.1" inputmode="decimal"><span>L</span></div>
          </label>
        </div>
        <label class="bk-record-check-row">
          <span>Pollen supplement</span>
          <input type="checkbox" id="bkFeedingPollenSupplement">
        </label>
      </div>
      <div class="bk-record-actions">
        <button type="button" class="bk-record-cancel" id="bkFeedingCancel">Cancel</button>
        <button type="button" class="bk-record-save" id="bkFeedingSave">Save</button>
      </div>
    </div>
  `;

  fillApiarySummary(page, apiaryName);
  restoreFeedingRecord(page, apiaryName);
  page.querySelector('#bkFeedingBack')?.addEventListener('click', closeFeedingPage);
  page.querySelector('#bkFeedingCancel')?.addEventListener('click', closeFeedingPage);
  page.querySelector('#bkFeedingSave')?.addEventListener('click', () => {
    const date = page.querySelector('#bkFeedingDate')?.value || '';
    const sugarSyrup = page.querySelector('#bkFeedingSugarSyrup')?.value || '';
    const pollenSupplement = Boolean(page.querySelector('#bkFeedingPollenSupplement')?.checked);
    if (!date) return window.alert('Please select a date.');

    const saved = saveRecord(FEEDING_STORAGE_KEY, {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      apiaryName,
      date,
      sugarSyrup: sugarSyrup === '' ? null : Number(sugarSyrup),
      pollenSupplement,
      createdAt: new Date().toISOString(),
    });
    if (!saved) return window.alert('The Feeding record could not be saved.');
    updateApiaryLastVisit(apiaryName, date);
    flashSaved(page.querySelector('#bkFeedingSave'));
  });

  panel.appendChild(page);
  document.body.classList.add('bk-feeding-open');
  page.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}

function diseaseToggleMarkup(id, label) {
  return `
    <div class="bk-disease-row">
      <div class="bk-disease-question">
        <span>${label}</span>
        <div class="bk-choice-toggle" data-toggle-for="${id}">
          <button type="button" class="is-selected" data-value="yes">Yes</button>
          <button type="button" data-value="no">No</button>
        </div>
      </div>
      <label class="bk-level-field"><span>Level (1-5)</span><select id="${id}Level"><option>1</option><option>2</option><option>3</option><option>4</option><option selected>5</option></select></label>
    </div>
  `;
}

function bindChoiceToggles(page) {
  page.querySelectorAll('.bk-choice-toggle').forEach((toggle) => {
    toggle.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return;
      toggle.querySelectorAll('button').forEach((item) => item.classList.toggle('is-selected', item === button));
    });
  });
}

function selectedToggleValue(page, id) {
  return page.querySelector(`[data-toggle-for="${id}"] .is-selected`)?.dataset?.value || 'no';
}

function setToggleValue(page, id, yes) {
  const toggle = page.querySelector(`[data-toggle-for="${id}"]`);
  if (!toggle) return;
  toggle.querySelectorAll('button').forEach((button) => {
    button.classList.toggle('is-selected', button.dataset.value === (yes ? 'yes' : 'no'));
  });
}

function restoreDiseaseRecord(page, apiaryName) {
  const record = getLatestRecord(DISEASE_STORAGE_KEY, apiaryName);
  if (!record) return;

  const date = page.querySelector('#bkDiseaseDate');
  if (date && record.date) date.value = record.date;

  const varroa = record.varroaLevel || 'Low';
  page.querySelectorAll('#bkVarroaLevel button').forEach((button) => {
    button.classList.toggle('is-selected', button.dataset.value === varroa);
  });

  setToggleValue(page, 'afb', Boolean(record.afb));
  setToggleValue(page, 'chalkbrood', Boolean(record.chalkbrood));
  setToggleValue(page, 'nosema', Boolean(record.nosema));

  const afbLevel = page.querySelector('#afbLevel');
  const chalkLevel = page.querySelector('#chalkbroodLevel');
  const nosemaLevel = page.querySelector('#nosemaLevel');
  const other = page.querySelector('#bkDiseaseOther');
  const otherLevel = page.querySelector('#bkOtherLevel');
  const notes = page.querySelector('#bkDiseaseNotes');

  if (afbLevel && record.afbLevel != null) afbLevel.value = String(record.afbLevel);
  if (chalkLevel && record.chalkbroodLevel != null) chalkLevel.value = String(record.chalkbroodLevel);
  if (nosemaLevel && record.nosemaLevel != null) nosemaLevel.value = String(record.nosemaLevel);
  if (other) other.value = record.other || '';
  if (otherLevel && record.otherLevel != null) otherLevel.value = String(record.otherLevel);
  if (notes) notes.value = record.notes || '';
}

function openDiseaseMonitoringPage() {
  const panel = getApiaryDetailPanel();
  if (!panel) return;
  closeDiseasePage();
  closeFeedingPage();

  const apiaryName = getCurrentApiaryName();
  const page = document.createElement('section');
  page.id = DISEASE_PAGE_ID;
  page.className = 'bk-record-page';
  page.innerHTML = `
    <div class="bk-record-shell">
      <div class="bk-record-page-header">
        <button type="button" class="bk-record-back" id="bkDiseaseBack">‹ Back</button>
        <div class="bk-record-page-title">Disease Monitoring</div>
        <div class="bk-record-header-spacer"></div>
      </div>
      ${apiarySummaryMarkup()}
      <div class="bk-record-form bk-disease-form">
        <label class="bk-record-field bk-record-field-full"><span>Date</span><input type="date" id="bkDiseaseDate" value="${todayForInput()}"></label>
        <div class="bk-record-field bk-record-field-full">
          <span>Varroa Level</span>
          <div class="bk-segmented" id="bkVarroaLevel">
            <button type="button" class="is-selected" data-value="Low">Low</button>
            <button type="button" data-value="Moderate">Moderate</button>
            <button type="button" data-value="High">High</button>
          </div>
        </div>
        ${diseaseToggleMarkup('afb', 'AFB (American Foulbrood)')}
        ${diseaseToggleMarkup('chalkbrood', 'Chalkbrood')}
        ${diseaseToggleMarkup('nosema', 'Nosema')}
        <div class="bk-disease-row">
          <label class="bk-record-field"><span>Other</span><input type="text" id="bkDiseaseOther" placeholder="None"></label>
          <label class="bk-level-field"><span>Level (1-5)</span><select id="bkOtherLevel"><option>1</option><option>2</option><option>3</option><option>4</option><option selected>5</option></select></label>
        </div>
        <label class="bk-record-field bk-record-field-full"><span>Notes</span><textarea id="bkDiseaseNotes" rows="4" placeholder="Enter any notes..."></textarea></label>
      </div>
      <div class="bk-record-actions">
        <button type="button" class="bk-record-cancel" id="bkDiseaseCancel">Cancel</button>
        <button type="button" class="bk-record-save" id="bkDiseaseSave">Save</button>
      </div>
    </div>
  `;

  fillApiarySummary(page, apiaryName);
  bindChoiceToggles(page);
  restoreDiseaseRecord(page, apiaryName);
  page.querySelector('#bkVarroaLevel')?.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    page.querySelectorAll('#bkVarroaLevel button').forEach((item) => item.classList.toggle('is-selected', item === button));
  });
  page.querySelector('#bkDiseaseBack')?.addEventListener('click', closeDiseasePage);
  page.querySelector('#bkDiseaseCancel')?.addEventListener('click', closeDiseasePage);
  page.querySelector('#bkDiseaseSave')?.addEventListener('click', () => {
    const date = page.querySelector('#bkDiseaseDate')?.value || '';
    if (!date) return window.alert('Please select a date.');

    const saved = saveRecord(DISEASE_STORAGE_KEY, {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      apiaryName,
      date,
      varroaLevel: page.querySelector('#bkVarroaLevel .is-selected')?.dataset?.value || 'Low',
      afb: selectedToggleValue(page, 'afb') === 'yes',
      afbLevel: Number(page.querySelector('#afbLevel')?.value || 1),
      chalkbrood: selectedToggleValue(page, 'chalkbrood') === 'yes',
      chalkbroodLevel: Number(page.querySelector('#chalkbroodLevel')?.value || 1),
      nosema: selectedToggleValue(page, 'nosema') === 'yes',
      nosemaLevel: Number(page.querySelector('#nosemaLevel')?.value || 1),
      other: page.querySelector('#bkDiseaseOther')?.value?.trim() || '',
      otherLevel: Number(page.querySelector('#bkOtherLevel')?.value || 1),
      notes: page.querySelector('#bkDiseaseNotes')?.value?.trim() || '',
      createdAt: new Date().toISOString(),
    });
    if (!saved) return window.alert('The Disease Monitoring record could not be saved.');
    updateApiaryLastVisit(apiaryName, date);
    flashSaved(page.querySelector('#bkDiseaseSave'));
  });

  panel.appendChild(page);
  document.body.classList.add('bk-disease-monitoring-open');
  page.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}

function closeMoreRecordsPage() {
  closeFeedingPage();
  closeDiseasePage();
  document.getElementById(MORE_RECORDS_PAGE_ID)?.remove();
  document.body.classList.remove('bk-more-records-open');
}

function recordIconSvg(type) {
  const common = 'viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"';
  if (type === 'feeding') {
    return `<svg ${common}><path d="M17 8h14l2 5H15l2-5Z"/><rect x="14" y="13" width="20" height="27" rx="4"/><path d="M18 21h12M18 28h12"/><circle cx="24" cy="34" r="2.5"/></svg>`;
  }
  if (type === 'disease-monitoring') {
    return `<svg ${common}><circle cx="20" cy="20" r="11"/><path d="m28.5 28.5 10 10"/></svg>`;
  }
  if (type === 'queen-records') {
    return `<svg ${common}><path d="m9 18 7 7 8-13 8 13 7-7-3 19H12L9 18Z"/><circle cx="9" cy="16" r="2"/><circle cx="24" cy="10" r="2"/><circle cx="39" cy="16" r="2"/><path d="M14 32h20"/></svg>`;
  }
  return `<svg ${common}><path d="m12 36 20-20"/><path d="m25 12 9 9"/><path d="m28 9 10 10"/><path d="m22 15 10 10"/><path d="M35 28c4 4 4 7 0 10-4-3-4-6 0-10Z"/></svg>`;
}

function recordMenuItem(type, label) {
  return `<button type="button" class="bk-more-records-item" data-record-type="${type}"><span class="bk-record-menu-icon" aria-hidden="true">${recordIconSvg(type)}</span><span>${label}</span><span class="bk-record-menu-arrow">›</span></button>`;
}

function openMoreRecordsPage() {
  const panel = getApiaryDetailPanel();
  if (!panel) return;
  closeMoreRecordsPage();

  const apiaryName = getCurrentApiaryName();
  const page = document.createElement('section');
  page.id = MORE_RECORDS_PAGE_ID;
  page.className = 'bk-record-page';
  page.setAttribute('aria-label', 'More Records');
  page.innerHTML = `
    <div class="bk-record-shell">
      <div class="bk-record-page-header">
        <button type="button" class="bk-record-back" id="bkMoreRecordsBackButton">‹ Back</button>
        <div class="bk-record-page-title">More Records</div>
        <div class="bk-record-header-spacer"></div>
      </div>
      ${apiarySummaryMarkup()}
      <div class="bk-more-records-help">Select a record type to view or add records.</div>
      <div class="bk-more-records-list" aria-label="Apiary record categories">
        ${recordMenuItem('feeding', 'Feeding')}
        ${recordMenuItem('disease-monitoring', 'Disease Monitoring')}
        ${recordMenuItem('queen-records', 'Queen Records')}
        ${recordMenuItem('honey-records', 'Honey Records')}
      </div>
    </div>
  `;

  fillApiarySummary(page, apiaryName);
  page.querySelector('#bkMoreRecordsBackButton')?.addEventListener('click', closeMoreRecordsPage);
  page.querySelector('[data-record-type="feeding"]')?.addEventListener('click', openFeedingPage);
  page.querySelector('[data-record-type="disease-monitoring"]')?.addEventListener('click', openDiseaseMonitoringPage);
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
  if (!document.body.classList.contains('bk-apiary-detail-open') && (
    document.getElementById(MORE_RECORDS_PAGE_ID) || document.getElementById(FEEDING_PAGE_ID) || document.getElementById(DISEASE_PAGE_ID)
  )) closeMoreRecordsPage();
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