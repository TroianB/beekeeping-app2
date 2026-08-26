const BK_REGION_EDIT_STORAGE_KEY = 'bk.regionAreas';
const BK_REGION_EDIT_ACTIVE_CLASS = 'bk-region-area-editing-regions';

function bkRegionEditNorm(value) {
  return String(value || '').trim().toLowerCase();
}

function bkRegionEditClean(value) {
  const clean = String(value || '').trim();
  return /^unassigned\s+area$/i.test(clean) ? '' : clean;
}

function bkRegionEditKey(region) {
  const clean = bkRegionEditClean(region);
  return clean ? `region:${bkRegionEditNorm(clean)}` : 'region:__none__';
}

function bkRegionEditReadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function bkRegionEditWriteJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function bkRegionEditUniqueRegions(values) {
  const seen = new Set();
  return (values || []).map(bkRegionEditClean).filter(Boolean).filter((region) => {
    const key = bkRegionEditNorm(region);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function bkRegionEditUniqueKeys(values) {
  const seen = new Set();
  return (values || []).map((value) => String(value || '').trim()).filter(Boolean).filter((key) => {
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function bkRegionEditReadStore() {
  const raw = bkRegionEditReadJson(BK_REGION_EDIT_STORAGE_KEY, null);
  const areas = bkRegionEditUniqueRegions(Array.isArray(raw?.areas) ? raw.areas : []);
  const byName = raw?.byName && typeof raw.byName === 'object' ? raw.byName : {};
  const regionOrder = bkRegionEditUniqueKeys(Array.isArray(raw?.regionOrder) ? raw.regionOrder : areas.map(bkRegionEditKey));
  return { areas, byName, regionOrder };
}

function bkRegionEditWriteStore(store) {
  const areas = bkRegionEditUniqueRegions(store.areas || []);
  const regionOrder = bkRegionEditUniqueKeys([...(store.regionOrder || []), ...areas.map(bkRegionEditKey)]);
  bkRegionEditWriteJson(BK_REGION_EDIT_STORAGE_KEY, {
    areas,
    byName: store.byName || {},
    regionOrder,
  });
}

function bkRegionEditReadHives() {
  const hives = bkRegionEditReadJson('bk.hives', []);
  return Array.isArray(hives) ? hives : [];
}

function bkRegionEditWriteHives(hives) {
  bkRegionEditWriteJson('bk.hives', hives);
}

function bkRegionEditTriggerRefresh() {
  const marker = document.createElement('span');
  marker.hidden = true;
  marker.dataset.regionEditRefresh = String(Date.now());
  document.documentElement.appendChild(marker);
  window.setTimeout(() => marker.remove(), 0);
}

function bkRegionEditIsEditApiary(control) {
  const modal = control?.closest?.('#root .fixed.inset-0.z-50');
  const title = String(modal?.children?.[0]?.children?.[0]?.textContent || '').trim().toLowerCase();
  return title.startsWith('edit ');
}

function bkRegionEditSetControlRegion(control, region) {
  const cleanRegion = bkRegionEditClean(region);
  const value = control?.querySelector('.bk-region-area-value');
  const button = control?.querySelector('.bk-region-area-button');
  if (value) value.value = cleanRegion;
  if (button) {
    button.textContent = bkRegionEditIsEditApiary(control)
      ? (cleanRegion ? `${cleanRegion} ▾` : 'Select Region ▾')
      : (cleanRegion ? `Region/Area: ${cleanRegion} ▾` : 'Region/Area ▾');
  }
}

function bkRegionEditRenameRegion(oldRegion, newRegion) {
  const oldClean = bkRegionEditClean(oldRegion);
  const newClean = bkRegionEditClean(newRegion);
  if (!oldClean || !newClean || bkRegionEditNorm(oldClean) === bkRegionEditNorm(newClean)) return false;

  const oldKey = bkRegionEditKey(oldClean);
  const newKey = bkRegionEditKey(newClean);
  const store = bkRegionEditReadStore();

  store.areas = bkRegionEditUniqueRegions((store.areas || []).map((area) => {
    return bkRegionEditNorm(area) === bkRegionEditNorm(oldClean) ? newClean : area;
  }).concat(newClean));

  store.regionOrder = bkRegionEditUniqueKeys((store.regionOrder || []).map((key) => {
    return key === oldKey ? newKey : key;
  }).concat(newKey));

  store.byName = { ...(store.byName || {}) };
  Object.keys(store.byName).forEach((name) => {
    if (bkRegionEditNorm(store.byName[name]) === bkRegionEditNorm(oldClean)) {
      store.byName[name] = newClean;
    }
  });
  bkRegionEditWriteStore(store);

  const hives = bkRegionEditReadHives();
  let changed = false;
  const next = hives.map((hive) => {
    if (bkRegionEditNorm(hive?.regionArea) !== bkRegionEditNorm(oldClean)) return hive;
    changed = true;
    return { ...hive, regionArea: newClean };
  });
  if (changed) bkRegionEditWriteHives(next);
  return true;
}

function bkRegionEditPanel(control) {
  let panel = control.querySelector('.bk-region-area-edit-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.className = 'bk-region-area-edit-panel';
    panel.hidden = true;
    panel.innerHTML = `
      <input class="bk-region-area-edit-input" placeholder="Edit Region Name" />
      <button type="button" class="bk-region-area-edit-save">Save</button>
      <button type="button" class="bk-region-area-edit-cancel">Cancel</button>
    `;
    const list = control.querySelector('.bk-region-area-list');
    list?.parentElement?.insertBefore(panel, list);
  }
  return panel;
}

function bkRegionEditHidePanel(control) {
  const panel = control?.querySelector('.bk-region-area-edit-panel');
  if (panel) panel.hidden = true;
  control?.querySelector('.bk-region-area-edit-toggle')?.classList.remove('bk-region-area-edit-toggle-active');
}

function bkRegionEditShowPanel(control, region) {
  const cleanRegion = bkRegionEditClean(region);
  if (!control || !cleanRegion) return;
  const panel = bkRegionEditPanel(control);
  const input = panel.querySelector('.bk-region-area-edit-input');
  panel.dataset.oldRegion = cleanRegion;
  if (input) input.value = cleanRegion;
  panel.hidden = false;
  control.classList.remove(BK_REGION_EDIT_ACTIVE_CLASS);
  window.setTimeout(() => input?.focus(), 0);
}

function bkRegionEditSave(control) {
  const panel = control?.querySelector('.bk-region-area-edit-panel');
  const oldRegion = panel?.dataset.oldRegion || '';
  const input = panel?.querySelector('.bk-region-area-edit-input');
  const newRegion = bkRegionEditClean(input?.value);
  if (!oldRegion || !newRegion) return;

  const renamed = bkRegionEditRenameRegion(oldRegion, newRegion);
  if (renamed) {
    const currentRegion = control.querySelector('.bk-region-area-value')?.value || '';
    if (bkRegionEditNorm(currentRegion) === bkRegionEditNorm(oldRegion)) {
      bkRegionEditSetControlRegion(control, newRegion);
    }
    bkRegionEditHidePanel(control);
    control.querySelector('.bk-region-area-menu')?.setAttribute('hidden', '');
    bkRegionEditTriggerRefresh();
  }
}

function bkRegionEditPrepareControl(control) {
  if (!control || control.dataset.regionEditPrepared === '1') return;
  control.dataset.regionEditPrepared = '1';

  if (!bkRegionEditIsEditApiary(control)) return;
  control.classList.add('bk-region-area-edit-screen');

  let heading = control.querySelector('.bk-region-area-heading');
  if (!heading) {
    heading = document.createElement('div');
    heading.className = 'bk-region-area-heading';
    heading.innerHTML = `
      <span class="bk-region-area-heading-label">Region</span>
      <button type="button" class="bk-region-area-edit-toggle">Edit</button>
    `;
    control.insertBefore(heading, control.firstChild);
  }

  const button = control.querySelector('.bk-region-area-button');
  const current = bkRegionEditClean(control.querySelector('.bk-region-area-value')?.value);
  if (button) button.textContent = current ? `${current} ▾` : 'Select Region ▾';

  const toolbar = control.querySelector('.bk-region-area-toolbar');
  if (toolbar) toolbar.hidden = true;
  control.querySelector('.bk-region-area-add-panel')?.setAttribute('hidden', '');
  control.querySelector('.bk-region-area-delete-panel')?.setAttribute('hidden', '');
}

function bkRegionEditPrepareAll() {
  document.querySelectorAll('.bk-region-area-control').forEach(bkRegionEditPrepareControl);
}

document.addEventListener('click', (event) => {
  const editToggle = event.target.closest?.('.bk-region-area-edit-toggle');
  if (!editToggle) return;
  const control = editToggle.closest('.bk-region-area-control');
  if (!control) return;
  event.preventDefault();
  event.stopImmediatePropagation();

  control.querySelector('.bk-region-area-add-panel')?.setAttribute('hidden', '');
  control.querySelector('.bk-region-area-delete-panel')?.setAttribute('hidden', '');
  bkRegionEditHidePanel(control);

  const becomingActive = !control.classList.contains(BK_REGION_EDIT_ACTIVE_CLASS);
  control.classList.toggle(BK_REGION_EDIT_ACTIVE_CLASS, becomingActive);
  editToggle.classList.toggle('bk-region-area-edit-toggle-active', becomingActive);

  const menu = control.querySelector('.bk-region-area-menu');
  if (becomingActive) {
    if (menu?.hidden) control.querySelector('.bk-region-area-button')?.click();
    menu?.removeAttribute('hidden');
  } else {
    menu?.setAttribute('hidden', '');
  }
}, true);

document.addEventListener('click', (event) => {
  const option = event.target.closest?.('.bk-region-area-option');
  const control = option?.closest?.('.bk-region-area-control');
  if (!option || !control || !control.classList.contains(BK_REGION_EDIT_ACTIVE_CLASS)) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  bkRegionEditShowPanel(control, option.dataset.regionArea || option.textContent || '');
}, true);

document.addEventListener('click', (event) => {
  const save = event.target.closest?.('.bk-region-area-edit-save');
  const cancel = event.target.closest?.('.bk-region-area-edit-cancel');
  if (!save && !cancel) return;
  const control = event.target.closest('.bk-region-area-control');
  if (!control) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  if (save) bkRegionEditSave(control);
  else bkRegionEditHidePanel(control);
}, true);

document.addEventListener('keydown', (event) => {
  if (!event.target.matches?.('.bk-region-area-edit-input')) return;
  const control = event.target.closest('.bk-region-area-control');
  if (event.key === 'Enter') {
    event.preventDefault();
    bkRegionEditSave(control);
  }
  if (event.key === 'Escape') bkRegionEditHidePanel(control);
}, true);

new MutationObserver(bkRegionEditPrepareAll).observe(document.documentElement, {
  childList: true,
  subtree: true,
});

bkRegionEditPrepareAll();
