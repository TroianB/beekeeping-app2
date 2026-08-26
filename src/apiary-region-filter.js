const BK_REGION_FILTER_STORAGE_KEY = 'bk.regionAreaFilter';
const BK_REGION_FILTER_SEARCH_SELECTOR = '#root input[placeholder="Search apiaries..."]';
const BK_REGION_FILTER_ALL = '__all_regions__';
const BK_REGION_FILTER_NO_REGION_KEY = 'region:__none__';
const BK_REGION_FILTER_NO_REGION_LABEL = 'No Region';
const BK_REGION_FILTER_HIDDEN_CLASS = 'bk-region-area-filter-hidden';
let bkRegionFilterRaf = 0;
let bkRegionFilterApplying = false;

function bkRegionFilterNorm(value) {
  return String(value || '').trim().toLowerCase();
}

function bkRegionFilterIsOldDefault(value) {
  return /^unassigned\s+area$/i.test(String(value || '').trim());
}

function bkRegionFilterClean(value) {
  const clean = String(value || '').trim();
  return bkRegionFilterIsOldDefault(clean) ? '' : clean;
}

function bkRegionFilterKey(region) {
  const clean = bkRegionFilterClean(region);
  return clean ? `region:${bkRegionFilterNorm(clean)}` : BK_REGION_FILTER_NO_REGION_KEY;
}

function bkRegionFilterReadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function bkRegionFilterWriteJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function bkRegionFilterUnique(values) {
  const seen = new Set();
  return (values || []).map(bkRegionFilterClean).filter(Boolean).filter((region) => {
    const key = bkRegionFilterNorm(region);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function bkRegionFilterSortRegions(regions) {
  return [...(regions || [])].sort((a, b) => String(a).localeCompare(String(b), undefined, {
    sensitivity: 'base',
    numeric: true,
  }));
}

function bkRegionFilterReadHives() {
  const hives = bkRegionFilterReadJson('bk.hives', []);
  return Array.isArray(hives) ? hives : [];
}

function bkRegionFilterReadStore() {
  const raw = bkRegionFilterReadJson('bk.regionAreas', null);
  const areas = Array.isArray(raw?.areas) ? raw.areas : [];
  const byName = raw?.byName && typeof raw.byName === 'object' ? raw.byName : {};
  const regionOrder = Array.isArray(raw?.regionOrder) ? raw.regionOrder : [];
  return { areas, byName, regionOrder };
}

function bkRegionFilterWriteStore(store) {
  bkRegionFilterWriteJson('bk.regionAreas', {
    areas: bkRegionFilterUnique(store.areas || []),
    byName: store.byName || {},
    regionOrder: Array.from(new Set((store.regionOrder || []).filter(Boolean))),
  });
}

function bkRegionFilterAllRegions() {
  const store = bkRegionFilterReadStore();
  const fromStore = Array.isArray(store.areas) ? store.areas : [];
  const fromNames = Object.values(store.byName || {});
  const fromHives = bkRegionFilterReadHives().map((hive) => hive?.regionArea);
  return bkRegionFilterSortRegions(bkRegionFilterUnique([...fromStore, ...fromNames, ...fromHives]));
}

function bkRegionFilterGetStoredValue() {
  const stored = localStorage.getItem(BK_REGION_FILTER_STORAGE_KEY) || BK_REGION_FILTER_ALL;
  return stored || BK_REGION_FILTER_ALL;
}

function bkRegionFilterSetStoredValue(value) {
  localStorage.setItem(BK_REGION_FILTER_STORAGE_KEY, value || BK_REGION_FILTER_ALL);
}

function bkRegionFilterGetListCard() {
  const search = document.querySelector(BK_REGION_FILTER_SEARCH_SELECTOR);
  return search?.nextElementSibling || null;
}

function bkRegionFilterGetHeaderCell() {
  const card = bkRegionFilterGetListCard();
  const header = card?.children?.[0];
  const cell = header?.children?.[1];
  return cell instanceof HTMLElement ? cell : null;
}

function bkRegionFilterGetScroller() {
  const card = bkRegionFilterGetListCard();
  const scroller = card?.children?.[1];
  return scroller instanceof HTMLElement ? scroller : null;
}

function bkRegionFilterGetTopButtonRow() {
  const search = document.querySelector(BK_REGION_FILTER_SEARCH_SELECTOR);
  const container = search?.parentElement;
  if (!container) return null;
  return Array.from(container.children).find((child) => {
    if (!(child instanceof HTMLElement)) return false;
    return Array.from(child.querySelectorAll('button')).some((button) => button.textContent.trim().toLowerCase().includes('add apiary'));
  }) || null;
}

function bkRegionFilterRows(scroller) {
  return Array.from(scroller?.children || []).filter((row) => {
    return row instanceof HTMLElement && row.querySelector('input[type="checkbox"]');
  });
}

function bkRegionFilterHasNoRegionRows(scroller) {
  return bkRegionFilterRows(scroller).some((row) => (row.dataset.regionKey || '') === BK_REGION_FILTER_NO_REGION_KEY);
}

function bkRegionFilterEntries(scroller) {
  const entries = [{ value: BK_REGION_FILTER_ALL, label: 'All Regions' }];
  bkRegionFilterAllRegions().forEach((region) => {
    entries.push({ value: bkRegionFilterKey(region), label: region });
  });
  if (bkRegionFilterHasNoRegionRows(scroller)) {
    entries.push({ value: BK_REGION_FILTER_NO_REGION_KEY, label: BK_REGION_FILTER_NO_REGION_LABEL });
  }
  return entries;
}

function bkRegionFilterAddRegion() {
  const name = bkRegionFilterClean(window.prompt('New Region name:') || '');
  if (!name) return;

  const existing = bkRegionFilterAllRegions();
  if (existing.some((region) => bkRegionFilterNorm(region) === bkRegionFilterNorm(name))) {
    window.alert('This Region already exists.');
    return;
  }

  const currentFilter = bkRegionFilterGetStoredValue();
  const store = bkRegionFilterReadStore();
  store.areas = bkRegionFilterUnique([...(store.areas || []), name]);
  store.regionOrder = Array.from(new Set([...(store.regionOrder || []), bkRegionFilterKey(name)]));
  bkRegionFilterWriteStore(store);
  bkRegionFilterSetStoredValue(currentFilter);
  bkRegionFilterApplyRepeated();
}

function bkRegionFilterDeleteRegion(regionKey) {
  if (!regionKey || regionKey === BK_REGION_FILTER_ALL || regionKey === BK_REGION_FILTER_NO_REGION_KEY) return;
  const regions = bkRegionFilterAllRegions();
  const region = regions.find((item) => bkRegionFilterKey(item) === regionKey);
  if (!region) return;
  if (!window.confirm(`Delete Region/Area "${region}"?`)) return;

  const store = bkRegionFilterReadStore();
  store.areas = (store.areas || []).filter((item) => bkRegionFilterNorm(item) !== bkRegionFilterNorm(region));
  store.regionOrder = (store.regionOrder || []).filter((key) => key !== regionKey);
  store.byName = { ...(store.byName || {}) };
  Object.keys(store.byName).forEach((name) => {
    if (bkRegionFilterNorm(store.byName[name]) === bkRegionFilterNorm(region)) delete store.byName[name];
  });
  bkRegionFilterWriteStore(store);

  const hives = bkRegionFilterReadHives().map((hive) => {
    if (bkRegionFilterNorm(hive?.regionArea) !== bkRegionFilterNorm(region)) return hive;
    const copy = { ...hive };
    delete copy.regionArea;
    return copy;
  });
  bkRegionFilterWriteJson('bk.hives', hives);

  if (bkRegionFilterGetStoredValue() === regionKey) {
    bkRegionFilterSetStoredValue(BK_REGION_FILTER_ALL);
  }
  bkRegionFilterCloseDeleteWindow();
  bkRegionFilterApplyRepeated();
}

function bkRegionFilterCloseDeleteWindow() {
  document.getElementById('bkRegionDeleteWindow')?.remove();
}

function bkRegionFilterOpenDeleteWindow() {
  bkRegionFilterCloseDeleteWindow();
  const regions = bkRegionFilterAllRegions();

  const overlay = document.createElement('div');
  overlay.id = 'bkRegionDeleteWindow';
  overlay.innerHTML = `
    <div class="bk-region-delete-dialog" role="dialog" aria-modal="true" aria-labelledby="bkRegionDeleteTitle">
      <div id="bkRegionDeleteTitle" class="bk-region-delete-title">Delete Region</div>
      <div class="bk-region-delete-help">Select a Region to delete.</div>
      <div class="bk-region-delete-list"></div>
      <div class="bk-region-delete-actions">
        <button type="button" class="bk-region-delete-cancel">Cancel</button>
      </div>
    </div>
  `;

  const list = overlay.querySelector('.bk-region-delete-list');
  if (!regions.length) {
    const empty = document.createElement('div');
    empty.className = 'bk-region-delete-empty';
    empty.textContent = 'No Regions to delete.';
    list.appendChild(empty);
  } else {
    regions.forEach((region) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'bk-region-delete-option';
      button.textContent = region;
      button.addEventListener('click', () => bkRegionFilterDeleteRegion(bkRegionFilterKey(region)));
      list.appendChild(button);
    });
  }

  overlay.querySelector('.bk-region-delete-cancel')?.addEventListener('click', bkRegionFilterCloseDeleteWindow);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) bkRegionFilterCloseDeleteWindow();
  });
  document.body.appendChild(overlay);
}

function bkRegionFilterEnsureManagementButtons() {
  const topRow = bkRegionFilterGetTopButtonRow();
  const search = document.querySelector(BK_REGION_FILTER_SEARCH_SELECTOR);
  if (!topRow || !search) return;

  let row = document.getElementById('bkRegionManagementControls');
  if (!row) {
    row = document.createElement('div');
    row.id = 'bkRegionManagementControls';
    row.innerHTML = `
      <button type="button" id="bkAddRegionButton">Add Region</button>
      <button type="button" id="bkDeleteRegionButton">Delete Region</button>
    `;
    row.querySelector('#bkAddRegionButton')?.addEventListener('click', (event) => {
      event.stopPropagation();
      bkRegionFilterAddRegion();
    });
    row.querySelector('#bkDeleteRegionButton')?.addEventListener('click', (event) => {
      event.stopPropagation();
      bkRegionFilterOpenDeleteWindow();
    });

    /* Initial placement only. apiary-action-row.js owns all later ordering. */
    topRow.insertAdjacentElement('afterend', row);
  }
}

function bkRegionFilterEnsureDropdown(scroller) {
  const cell = bkRegionFilterGetHeaderCell();
  if (!cell) return null;

  cell.classList.add('bk-region-list-filter-cell');
  let select = cell.querySelector('#bkRegionAreaFilter');
  if (!select) {
    cell.textContent = '';
    select = document.createElement('select');
    select.id = 'bkRegionAreaFilter';
    select.className = 'bk-region-list-filter-select';
    select.setAttribute('aria-label', 'Filter Apiaries by Region or Area');
    ['click', 'pointerdown', 'mousedown'].forEach((name) => select.addEventListener(name, (event) => event.stopPropagation()));
    select.addEventListener('change', () => {
      bkRegionFilterSetStoredValue(select.value || BK_REGION_FILTER_ALL);
      bkRegionFilterApplyRepeated();
    });
    cell.appendChild(select);
  }

  const entries = bkRegionFilterEntries(scroller);
  const signature = entries.map((entry) => `${entry.value}:${entry.label}`).join('\u0001');
  if (select.dataset.regionFilterSignature !== signature) {
    select.dataset.regionFilterSignature = signature;
    const fragment = document.createDocumentFragment();
    entries.forEach((entry) => {
      const option = document.createElement('option');
      option.value = entry.value;
      option.textContent = entry.label;
      fragment.appendChild(option);
    });
    select.replaceChildren(fragment);
  }

  const validValues = entries.map((entry) => entry.value);
  const storedValue = bkRegionFilterGetStoredValue();
  const nextValue = validValues.includes(storedValue) ? storedValue : BK_REGION_FILTER_ALL;
  if (select.value !== nextValue) select.value = nextValue;
  if (storedValue !== nextValue) bkRegionFilterSetStoredValue(nextValue);
  return select;
}

function bkRegionFilterSetHidden(element, hidden) {
  if (!element) return;
  if (element.hidden) element.hidden = false;
  element.classList.toggle(BK_REGION_FILTER_HIDDEN_CLASS, Boolean(hidden));
}

function bkRegionFilterApply() {
  if (bkRegionFilterApplying) return;
  const scroller = bkRegionFilterGetScroller();
  if (!scroller) return;

  bkRegionFilterApplying = true;
  try {
    bkRegionFilterEnsureManagementButtons();
    const select = bkRegionFilterEnsureDropdown(scroller);
    const filterValue = select?.value || BK_REGION_FILTER_ALL;
    const showAll = filterValue === BK_REGION_FILTER_ALL;

    scroller.querySelectorAll(':scope > .bk-region-area-header').forEach((header) => {
      const key = header.dataset.regionKey || '';
      bkRegionFilterSetHidden(header, !showAll && key !== filterValue);
    });

    bkRegionFilterRows(scroller).forEach((row) => {
      const key = row.dataset.regionKey || '';
      bkRegionFilterSetHidden(row, !showAll && key !== filterValue);
    });
  } finally {
    window.requestAnimationFrame(() => {
      bkRegionFilterApplying = false;
    });
  }
}

function bkRegionFilterApplyRepeated() {
  [0, 40, 120, 260, 520].forEach((delay) => window.setTimeout(bkRegionFilterApply, delay));
}

function bkRegionFilterSchedule() {
  if (bkRegionFilterApplying || bkRegionFilterRaf) return;
  bkRegionFilterRaf = window.requestAnimationFrame(() => {
    bkRegionFilterRaf = 0;
    bkRegionFilterApply();
  });
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') bkRegionFilterCloseDeleteWindow();
});

new MutationObserver(bkRegionFilterSchedule).observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['data-region-key', 'data-region-area', 'data-region-number', 'class'],
});

bkRegionFilterSchedule();
