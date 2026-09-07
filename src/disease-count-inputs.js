const DISEASE_PAGE_ID = 'bkDiseaseMonitoringPage';
const DISEASE_STORAGE_KEY = 'bk.disease.monitoring.records';

const COUNT_FIELDS = {
  afbLevel: 'afbLevel',
  chalkbroodLevel: 'chalkbroodLevel',
  nosemaLevel: 'nosemaLevel',
  bkOtherLevel: 'otherLevel',
};

function readDiseaseRecords() {
  try {
    const parsed = JSON.parse(localStorage.getItem(DISEASE_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getPageApiaryName(page) {
  return page?.querySelector('.bk-record-apiary-name')?.textContent?.trim() || '';
}

function getLatestDiseaseRecord(apiaryName) {
  const target = String(apiaryName || '').trim().toLowerCase();
  const matching = readDiseaseRecords().filter(
    (record) => String(record?.apiaryName || '').trim().toLowerCase() === target
  );

  if (!matching.length) return null;

  return matching.reduce((latest, record) => {
    const latestTime = Date.parse(latest?.createdAt || '') || 0;
    const recordTime = Date.parse(record?.createdAt || '') || 0;
    return recordTime >= latestTime ? record : latest;
  }, matching[0]);
}

function normalizeCount(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return 0;
  return Math.floor(number);
}

function replaceLevelSelect(select, savedValue) {
  if (!select || select.tagName !== 'SELECT') return;

  const input = document.createElement('input');
  input.type = 'number';
  input.id = select.id;
  input.className = 'bk-infected-hives-input';
  input.min = '0';
  input.step = '1';
  input.inputMode = 'numeric';
  input.value = String(normalizeCount(savedValue));
  input.setAttribute('aria-label', 'Infected hives');

  input.addEventListener('input', () => {
    if (input.value === '') return;
    if (Number(input.value) < 0) input.value = '0';
    if (!Number.isInteger(Number(input.value))) input.value = String(Math.floor(Number(input.value) || 0));
  });

  const label = select.closest('label');
  const caption = label?.querySelector(':scope > span');
  if (caption) caption.textContent = 'Infected hives';

  select.replaceWith(input);
}

function applyDiseaseCountInputs() {
  const page = document.getElementById(DISEASE_PAGE_ID);
  if (!page) return;

  const latest = getLatestDiseaseRecord(getPageApiaryName(page));

  Object.entries(COUNT_FIELDS).forEach(([elementId, recordField]) => {
    const select = page.querySelector(`#${elementId}`);
    const savedValue = latest?.[recordField] ?? 0;
    replaceLevelSelect(select, savedValue);
  });
}

let scheduled = false;
function scheduleApply() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    applyDiseaseCountInputs();
  });
}

new MutationObserver(scheduleApply).observe(document.documentElement, {
  childList: true,
  subtree: true,
});

/* If a count box is cleared, save it as zero rather than allowing the
   legacy form's fallback value of one to be used. */
document.addEventListener('click', (event) => {
  if (!event.target?.closest?.('#bkDiseaseSave')) return;

  Object.keys(COUNT_FIELDS).forEach((id) => {
    const input = document.getElementById(id);
    if (input?.tagName === 'INPUT' && input.value.trim() === '') input.value = '0';
  });
}, true);

scheduleApply();
