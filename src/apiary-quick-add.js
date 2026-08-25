const BK_QUICK_ADD_SEARCH = '#root input[placeholder="Search apiaries..."]';
const BK_QUICK_ADD_RETURN_KEY = 'bk.returnToApiariesAfterQuickAdd';
const BK_QUICK_ADD_PERSIST_KEY = 'bk2.returnToApiariesAfterQuickAddPersistent';

function bkQuickRestoreReturnFlag() {
  try {
    if (localStorage.getItem(BK_QUICK_ADD_PERSIST_KEY) === '1') {
      sessionStorage.setItem(BK_QUICK_ADD_RETURN_KEY, '1');
    }
  } catch {}
}

bkQuickRestoreReturnFlag();

function bkQuickReadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function bkQuickWriteJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function bkQuickNorm(value) {
  return String(value || '').trim().toLowerCase();
}

function bkQuickCleanRegion(value) {
  const region = String(value || '').trim();
  return /^unassigned\s+area$/i.test(region) ? '' : region;
}

function bkQuickRegions() {
  const store = bkQuickReadJson('bk.regionAreas', null);
  const hives = bkQuickReadJson('bk.hives', []);
  const values = [
    ...(Array.isArray(store?.areas) ? store.areas : []),
    ...Object.values(store?.byName || {}),
    ...(Array.isArray(hives) ? hives.map((hive) => hive?.regionArea) : []),
  ].map(bkQuickCleanRegion).filter(Boolean);
  const seen = new Set();
  return values.filter((region) => {
    const key = bkQuickNorm(region);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function bkQuickNextId(hives) {
  const used = new Set((hives || []).map((hive) => String(hive?.id || '')));
  let n = 1;
  while (used.has(`A-${String(n).padStart(3, '0')}`)) n += 1;
  return `A-${String(n).padStart(3, '0')}`;
}

function bkQuickToday() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function bkQuickClose() {
  document.getElementById('bkQuickAddApiary')?.remove();
}

function bkQuickShouldReturnToApiaries() {
  try {
    return sessionStorage.getItem(BK_QUICK_ADD_RETURN_KEY) === '1' || localStorage.getItem(BK_QUICK_ADD_PERSIST_KEY) === '1';
  } catch {
    return false;
  }
}

function bkQuickMarkReturnToApiaries() {
  try { sessionStorage.setItem(BK_QUICK_ADD_RETURN_KEY, '1'); } catch {}
  try { localStorage.setItem(BK_QUICK_ADD_PERSIST_KEY, '1'); } catch {}
}

function bkQuickClearReturnToApiaries() {
  try { sessionStorage.removeItem(BK_QUICK_ADD_RETURN_KEY); } catch {}
  try { localStorage.removeItem(BK_QUICK_ADD_PERSIST_KEY); } catch {}
}

function bkQuickReturnToApiaries() {
  if (!bkQuickShouldReturnToApiaries()) return false;

  if (document.querySelector(BK_QUICK_ADD_SEARCH)) {
    bkQuickClearReturnToApiaries();
    return true;
  }

  const button = Array.from(document.querySelectorAll('button')).find((item) => {
    return item.textContent.trim().toLowerCase() === 'apiaries';
  });
  if (!button) return false;

  button.click();
  return false;
}

function bkQuickSave() {
  const dialog = document.getElementById('bkQuickAddApiary');
  if (!dialog) return;
  const nameInput = dialog.querySelector('#bkQuickApiaryName');
  const regionSelect = dialog.querySelector('#bkQuickApiaryRegion');
  const error = dialog.querySelector('.bk-quick-apiary-error');
  const name = String(nameInput?.value || '').trim();
  const region = bkQuickCleanRegion(regionSelect?.value || '');
  const hives = bkQuickReadJson('bk.hives', []);
  const list = Array.isArray(hives) ? hives : [];

  if (!name) {
    if (error) error.textContent = 'Apiary name is required.';
    nameInput?.focus();
    return;
  }
  if (list.some((hive) => bkQuickNorm(hive?.name) === bkQuickNorm(name))) {
    if (error) error.textContent = 'This Apiary name already exists.';
    nameInput?.focus();
    return;
  }
  if (!region) {
    if (error) error.textContent = 'Please select a Region.';
    regionSelect?.focus();
    return;
  }

  const newApiary = {
    id: bkQuickNextId(list),
    name,
    regionArea: region,
    strength: '',
    singleHives: 0,
    doubleHives: 0,
    numHives: 0,
    notes: '',
    lastInspection: bkQuickToday(),
    inTreatment: false,
    treatmentName: '',
    treatmentDate: '',
  };

  bkQuickWriteJson('bk.hives', [...list, newApiary]);

  const store = bkQuickReadJson('bk.regionAreas', null) || {};
  const areas = Array.isArray(store.areas) ? [...store.areas] : [];
  const regionOrder = Array.isArray(store.regionOrder) ? [...store.regionOrder] : [];
  const byName = store.byName && typeof store.byName === 'object' ? { ...store.byName } : {};
  if (!areas.some((item) => bkQuickNorm(item) === bkQuickNorm(region))) areas.push(region);
  const regionKey = `region:${bkQuickNorm(region)}`;
  if (!regionOrder.includes(regionKey)) regionOrder.push(regionKey);
  byName[name] = region;
  bkQuickWriteJson('bk.regionAreas', { areas, regionOrder, byName });

  bkQuickMarkReturnToApiaries();
  bkQuickClose();
  window.dispatchEvent(new CustomEvent('bk:quick-apiary-added', { detail: newApiary }));
}

function bkQuickOpen() {
  bkQuickClose();
  const regions = bkQuickRegions();
  const overlay = document.createElement('div');
  overlay.id = 'bkQuickAddApiary';
  overlay.innerHTML = `
    <div class="bk-quick-apiary-dialog" role="dialog" aria-modal="true" aria-labelledby="bkQuickApiaryTitle">
      <div id="bkQuickApiaryTitle" class="bk-quick-apiary-title">Add Apiary</div>
      <label class="bk-quick-apiary-field">
        <span>Apiary Name</span>
        <input id="bkQuickApiaryName" type="text" autocomplete="off" />
      </label>
      <label class="bk-quick-apiary-field">
        <span>Region</span>
        <select id="bkQuickApiaryRegion">
          <option value="">Select Region</option>
        </select>
      </label>
      <div class="bk-quick-apiary-error" aria-live="polite"></div>
      <div class="bk-quick-apiary-actions">
        <button type="button" class="bk-quick-apiary-cancel">Cancel</button>
        <button type="button" class="bk-quick-apiary-save">Add Apiary</button>
      </div>
    </div>
  `;

  const select = overlay.querySelector('#bkQuickApiaryRegion');
  regions.forEach((region) => {
    const option = document.createElement('option');
    option.value = region;
    option.textContent = region;
    select.appendChild(option);
  });

  overlay.querySelector('.bk-quick-apiary-cancel')?.addEventListener('click', bkQuickClose);
  overlay.querySelector('.bk-quick-apiary-save')?.addEventListener('click', bkQuickSave);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) bkQuickClose();
  });
  overlay.querySelector('#bkQuickApiaryName')?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') bkQuickSave();
  });
  document.body.appendChild(overlay);
  window.setTimeout(() => overlay.querySelector('#bkQuickApiaryName')?.focus(), 0);
}

document.addEventListener('click', (event) => {
  const button = event.target.closest?.('button');
  if (!button || !document.querySelector(BK_QUICK_ADD_SEARCH)) return;
  if (button.closest('#bkQuickAddApiary')) return;
  const text = button.textContent.trim().toLowerCase();
  if (!text.includes('add apiary')) return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation?.();
  bkQuickOpen();
}, true);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') bkQuickClose();
});

new MutationObserver(() => {
  bkQuickReturnToApiaries();
}).observe(document.documentElement, { childList: true, subtree: true });

[0, 50, 150, 350, 700, 1200, 2000, 3000].forEach((delay) => window.setTimeout(bkQuickReturnToApiaries, delay));
