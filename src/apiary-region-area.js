const BK_REGION_STORAGE_KEY = 'bk.regionAreas';
const BK_DEFAULT_REGION = 'Unassigned Area';
const BK_REGION_SEARCH_SELECTOR = '#root input[placeholder="Search apiaries..."]';
let bkRegionRaf = 0;

function bkNorm(value) {
  return String(value || '').trim().toLowerCase();
}

function bkCleanRegion(value) {
  return String(value || '').trim() || BK_DEFAULT_REGION;
}

function bkReadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function bkWriteJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function bkReadRegionStore() {
  const raw = bkReadJson(BK_REGION_STORAGE_KEY, null);
  const areas = Array.isArray(raw?.areas) ? raw.areas.map(bkCleanRegion) : [BK_DEFAULT_REGION];
  const byName = raw?.byName && typeof raw.byName === 'object' ? raw.byName : {};
  return { areas: Array.from(new Set([BK_DEFAULT_REGION, ...areas].map(bkCleanRegion))), byName };
}

function bkWriteRegionStore(store) {
  const areas = Array.from(new Set([BK_DEFAULT_REGION, ...(store.areas || [])].map(bkCleanRegion)));
  bkWriteJson(BK_REGION_STORAGE_KEY, { areas, byName: store.byName || {} });
}

function bkReadHives() {
  const hives = bkReadJson('bk.hives', []);
  return Array.isArray(hives) ? hives : [];
}

function bkWriteHives(hives) {
  bkWriteJson('bk.hives', hives);
}

function bkAllRegions() {
  const store = bkReadRegionStore();
  const fromHives = bkReadHives().map((hive) => hive?.regionArea).filter(Boolean).map(bkCleanRegion);
  const fromNames = Object.values(store.byName || {}).filter(Boolean).map(bkCleanRegion);
  return Array.from(new Set([BK_DEFAULT_REGION, ...store.areas, ...fromHives, ...fromNames]));
}

function bkRegionForApiaryName(name) {
  const cleanName = bkNorm(name);
  const store = bkReadRegionStore();
  const mappedKey = Object.keys(store.byName || {}).find((key) => bkNorm(key) === cleanName);
  if (mappedKey) return bkCleanRegion(store.byName[mappedKey]);

  const hive = bkReadHives().find((item) => bkNorm(item?.name) === cleanName);
  return bkCleanRegion(hive?.regionArea);
}

function bkSaveRegionForApiaryName(name, region) {
  const cleanName = String(name || '').trim();
  const cleanRegion = bkCleanRegion(region);
  if (!cleanName) return;

  const store = bkReadRegionStore();
  store.areas = Array.from(new Set([...(store.areas || []), cleanRegion]));
  store.byName = { ...(store.byName || {}), [cleanName]: cleanRegion };
  bkWriteRegionStore(store);

  const hives = bkReadHives();
  let changed = false;
  const next = hives.map((hive) => {
    if (bkNorm(hive?.name) !== bkNorm(cleanName)) return hive;
    changed = true;
    return { ...hive, regionArea: cleanRegion };
  });
  if (changed) bkWriteHives(next);
}

function bkGetModalTitle(modal) {
  const panel = modal?.children?.[0];
  const title = panel?.children?.[0];
  return String(title?.textContent || '').trim();
}

function bkIsApiaryFormModal(modal) {
  const title = bkGetModalTitle(modal).toLowerCase();
  return title === 'add apiary' || title.startsWith('edit ');
}

function bkGetNameInput(modal) {
  const panel = modal?.children?.[0];
  const labels = Array.from(panel?.querySelectorAll?.('label') || []);
  const nameLabel = labels.find((label) => label.textContent.trim().toLowerCase().startsWith('name'));
  return nameLabel?.querySelector('input') || modal?.querySelector('input');
}

function bkApiaryNameFromModal(modal) {
  const titleName = bkGetModalTitle(modal).replace(/^edit\s+/i, '').trim();
  const inputName = bkGetNameInput(modal)?.value?.trim();
  return inputName || titleName || '';
}

function bkPanelGrid(modal) {
  const panel = modal?.children?.[0];
  return Array.from(panel?.children || []).find((child) => {
    return child instanceof HTMLElement && String(child.className).includes('grid');
  }) || null;
}

function bkFillRegionSelect(select, selected) {
  if (!select) return;
  const current = bkCleanRegion(selected || select.value);
  const regions = bkAllRegions();
  select.innerHTML = '';
  regions.forEach((region) => {
    const option = document.createElement('option');
    option.value = region;
    option.textContent = region;
    select.appendChild(option);
  });
  select.value = regions.includes(current) ? current : BK_DEFAULT_REGION;
}

function bkRefreshRegionSelects(selected) {
  document.querySelectorAll('.bk-region-area-select').forEach((select) => bkFillRegionSelect(select, selected));
}

function bkEnsureRegionControl(modal) {
  if (!bkIsApiaryFormModal(modal)) return;
  const grid = bkPanelGrid(modal);
  const nameInput = bkGetNameInput(modal);
  if (!grid || !nameInput) return;

  let control = modal.querySelector('.bk-region-area-control');
  if (!control) {
    control = document.createElement('div');
    control.className = 'bk-region-area-control';
    control.innerHTML = `
      <div class="bk-region-area-main">
        <button type="button" class="bk-region-area-button">Region/Area</button>
        <select class="bk-region-area-select" aria-label="Region or Area"></select>
        <button type="button" class="bk-region-area-new-button">+ Area</button>
      </div>
      <div class="bk-region-area-new-panel" hidden>
        <input class="bk-region-area-new-input" placeholder="New Region/Area name" />
        <button type="button" class="bk-region-area-use-button">Use</button>
      </div>
    `;

    const nameLabel = nameInput.closest('label');
    if (nameLabel?.nextSibling) grid.insertBefore(control, nameLabel.nextSibling);
    else grid.appendChild(control);

    control.querySelector('.bk-region-area-button')?.addEventListener('click', () => {
      control.querySelector('.bk-region-area-select')?.focus();
    });
    control.querySelector('.bk-region-area-new-button')?.addEventListener('click', () => {
      const panel = control.querySelector('.bk-region-area-new-panel');
      panel.hidden = !panel.hidden;
      if (!panel.hidden) control.querySelector('.bk-region-area-new-input')?.focus();
    });
    control.querySelector('.bk-region-area-use-button')?.addEventListener('click', () => {
      const input = control.querySelector('.bk-region-area-new-input');
      const select = control.querySelector('.bk-region-area-select');
      const region = bkCleanRegion(input?.value);
      const store = bkReadRegionStore();
      store.areas = Array.from(new Set([...(store.areas || []), region]));
      bkWriteRegionStore(store);
      bkRefreshRegionSelects(region);
      if (select) select.value = region;
      if (input) input.value = '';
      const panel = control.querySelector('.bk-region-area-new-panel');
      if (panel) panel.hidden = true;
    });
  }

  const select = control.querySelector('.bk-region-area-select');
  bkFillRegionSelect(select, bkRegionForApiaryName(bkApiaryNameFromModal(modal)));
}

function bkWireApiaryRegionForms() {
  document.querySelectorAll('#root .fixed.inset-0.z-50').forEach((modal) => bkEnsureRegionControl(modal));
}

function bkGetApiaryListScroller() {
  const search = document.querySelector(BK_REGION_SEARCH_SELECTOR);
  const card = search?.nextElementSibling;
  const directScroller = card?.children?.[1];
  if (directScroller instanceof HTMLElement) return directScroller;
  return null;
}

function bkGetApiaryRowName(row) {
  return row?.querySelector(':scope > span[draggable="true"]')?.textContent?.trim()
    || row?.querySelector(':scope > span')?.textContent?.trim()
    || '';
}

function bkApplyRegionBordersOnly() {
  const list = bkGetApiaryListScroller();
  if (!list) return;

  list.querySelectorAll(':scope > .bk-region-area-header').forEach((header) => header.remove());

  const rows = Array.from(list.children).filter((row) => {
    return row instanceof HTMLElement && row.querySelector('input[type="checkbox"]');
  });

  let previousRegion = null;
  rows.forEach((row) => {
    const region = bkRegionForApiaryName(bkGetApiaryRowName(row));
    const firstInArea = previousRegion !== region;
    previousRegion = region;

    row.classList.add('bk-region-area-row');
    row.classList.toggle('bk-region-area-first-row', firstInArea);
    row.dataset.regionArea = region;
  });
}

function bkScheduleRegionSave(names, region) {
  [0, 60, 160, 360, 760, 1300].forEach((delay) => {
    window.setTimeout(() => {
      names.filter(Boolean).forEach((name) => bkSaveRegionForApiaryName(name, region));
      bkApplyRegionBordersOnly();
    }, delay);
  });
}

function bkScheduleRegionWork() {
  if (bkRegionRaf) return;
  bkRegionRaf = window.requestAnimationFrame(() => {
    bkRegionRaf = 0;
    bkWireApiaryRegionForms();
    bkApplyRegionBordersOnly();
  });
}

document.addEventListener('click', (event) => {
  const button = event.target.closest?.('button');
  if (!button) return;
  const modal = button.closest('#root .fixed.inset-0.z-50');
  if (!modal || !bkIsApiaryFormModal(modal)) return;
  if (button.textContent.trim().toLowerCase() !== 'save') return;

  const select = modal.querySelector('.bk-region-area-select');
  const region = bkCleanRegion(select?.value);
  const inputName = bkGetNameInput(modal)?.value?.trim();
  const titleName = bkGetModalTitle(modal).replace(/^edit\s+/i, '').trim();
  bkScheduleRegionSave([inputName, titleName], region);
}, true);

document.addEventListener('input', (event) => {
  if (event.target.closest?.('.bk-region-area-control')) return;
  if (event.target.closest?.('#root .fixed.inset-0.z-50')) bkScheduleRegionWork();
}, true);

new MutationObserver(bkScheduleRegionWork).observe(document.documentElement, {
  childList: true,
  subtree: true,
});

bkScheduleRegionWork();
