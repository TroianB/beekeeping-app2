const BK_REGION_FILTER_STORAGE_KEY = 'bk.regionAreaFilter';
const BK_REGION_FILTER_SEARCH_SELECTOR = '#root input[placeholder="Search apiaries..."]';
const BK_REGION_FILTER_ALL = '__all_regions__';
const BK_REGION_FILTER_NO_REGION_KEY = 'region:__none__';
const BK_REGION_FILTER_NO_REGION_LABEL = 'No Region';
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

function bkRegionFilterUnique(values) {
  const seen = new Set();
  return (values || []).map(bkRegionFilterClean).filter(Boolean).filter((region) => {
    const key = bkRegionFilterNorm(region);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function bkRegionFilterReadHives() {
  const hives = bkRegionFilterReadJson('bk.hives', []);
  return Array.isArray(hives) ? hives : [];
}

function bkRegionFilterReadStore() {
  const raw = bkRegionFilterReadJson('bk.regionAreas', null);
  const areas = Array.isArray(raw?.areas) ? raw.areas : [];
  const byName = raw?.byName && typeof raw.byName === 'object' ? raw.byName : {};
  return { areas, byName };
}

function bkRegionFilterAllRegions() {
  const store = bkRegionFilterReadStore();
  const fromStore = Array.isArray(store.areas) ? store.areas : [];
  const fromNames = Object.values(store.byName || {});
  const fromHives = bkRegionFilterReadHives().map((hive) => hive?.regionArea);
  return bkRegionFilterUnique([...fromStore, ...fromNames, ...fromHives]);
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

function bkRegionFilterRows(scroller) {
  return Array.from(scroller?.children || []).filter((row) => {
    return row instanceof HTMLElement && row.querySelector('input[type="checkbox"]');
  });
}

function bkRegionFilterHasNoRegionRows(scroller) {
  return bkRegionFilterRows(scroller).some((row) => {
    return (row.dataset.regionKey || '') === BK_REGION_FILTER_NO_REGION_KEY;
  });
}

function bkRegionFilterEntries(scroller) {
  const entries = [{ value: BK_REGION_FILTER_ALL, label: 'All Region' }];
  bkRegionFilterAllRegions().forEach((region) => {
    entries.push({ value: bkRegionFilterKey(region), label: region });
  });
  if (bkRegionFilterHasNoRegionRows(scroller)) {
    entries.push({ value: BK_REGION_FILTER_NO_REGION_KEY, label: BK_REGION_FILTER_NO_REGION_LABEL });
  }
  return entries;
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
    select.addEventListener('click', (event) => event.stopPropagation());
    select.addEventListener('pointerdown', (event) => event.stopPropagation());
    select.addEventListener('mousedown', (event) => event.stopPropagation());
    select.addEventListener('change', () => {
      bkRegionFilterSetStoredValue(select.value || BK_REGION_FILTER_ALL);
      bkRegionFilterApply();
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
  if (Boolean(element.hidden) !== Boolean(hidden)) element.hidden = Boolean(hidden);
}

function bkRegionFilterApply() {
  if (bkRegionFilterApplying) return;
  const scroller = bkRegionFilterGetScroller();
  if (!scroller) return;

  bkRegionFilterApplying = true;
  try {
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

function bkRegionFilterSchedule() {
  if (bkRegionFilterApplying || bkRegionFilterRaf) return;
  bkRegionFilterRaf = window.requestAnimationFrame(() => {
    bkRegionFilterRaf = 0;
    bkRegionFilterApply();
  });
}

new MutationObserver(bkRegionFilterSchedule).observe(document.documentElement, {
  childList: true,
  subtree: true,
});

bkRegionFilterSchedule();
