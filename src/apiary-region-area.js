const BK_REGION_STORAGE_KEY = 'bk.regionAreas';
const BK_REGION_SEARCH_SELECTOR = '#root input[placeholder="Search apiaries..."]';
const BK_NO_REGION_LABEL = 'No Region';
let bkRegionRaf = 0;
let bkRegionUpdatingList = false;
let bkDraggedRegionKey = '';

function bkNorm(value) {
  return String(value || '').trim().toLowerCase();
}

function bkIsOldDefaultRegion(value) {
  return /^unassigned\s+area$/i.test(String(value || '').trim());
}

function bkCleanRegion(value) {
  const region = String(value || '').trim();
  return bkIsOldDefaultRegion(region) ? '' : region;
}

function bkRegionDisplayName(region) {
  return bkCleanRegion(region) || BK_NO_REGION_LABEL;
}

function bkRegionKey(region) {
  return bkCleanRegion(region) ? `region:${bkNorm(region)}` : 'region:__none__';
}

function bkSortRegions(regions) {
  return [...(regions || [])].sort((a, b) => String(a).localeCompare(String(b), undefined, {
    sensitivity: 'base',
    numeric: true,
  }));
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

function bkUniqueRegions(values) {
  const seen = new Set();
  return (values || []).map(bkCleanRegion).filter(Boolean).filter((region) => {
    const key = bkNorm(region);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function bkUniqueKeys(values) {
  const seen = new Set();
  return (values || []).map((value) => String(value || '').trim()).filter(Boolean).filter((key) => {
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function bkReadRegionStore() {
  const raw = bkReadJson(BK_REGION_STORAGE_KEY, null);
  const areas = bkUniqueRegions(Array.isArray(raw?.areas) ? raw.areas : []);
  const byName = raw?.byName && typeof raw.byName === 'object' ? raw.byName : {};
  const regionOrder = bkUniqueKeys(Array.isArray(raw?.regionOrder) ? raw.regionOrder : areas.map(bkRegionKey));
  return { areas, byName, regionOrder };
}

function bkWriteRegionStore(store) {
  const areas = bkUniqueRegions(store.areas || []);
  const regionOrder = bkUniqueKeys([...(store.regionOrder || []), ...areas.map(bkRegionKey)]);
  bkWriteJson(BK_REGION_STORAGE_KEY, {
    areas,
    byName: store.byName || {},
    regionOrder,
  });
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
  const fromHives = bkReadHives().map((hive) => hive?.regionArea).map(bkCleanRegion).filter(Boolean);
  const fromNames = Object.values(store.byName || {}).map(bkCleanRegion).filter(Boolean);
  return bkUniqueRegions([...store.areas, ...fromHives, ...fromNames]);
}

function bkMenuRegions() {
  return bkSortRegions(bkAllRegions());
}

function bkRegionForApiaryName(name) {
  const cleanName = bkNorm(name);
  if (!cleanName) return '';

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
  store.byName = { ...(store.byName || {}) };
  if (cleanRegion) {
    store.areas = bkUniqueRegions([...(store.areas || []), cleanRegion]);
    store.regionOrder = bkUniqueKeys([...(store.regionOrder || []), bkRegionKey(cleanRegion)]);
    store.byName[cleanName] = cleanRegion;
  } else {
    Object.keys(store.byName).forEach((key) => {
      if (bkNorm(key) === bkNorm(cleanName)) delete store.byName[key];
    });
  }
  bkWriteRegionStore(store);

  const hives = bkReadHives();
  let changed = false;
  const next = hives.map((hive) => {
    if (bkNorm(hive?.name) !== bkNorm(cleanName)) return hive;
    changed = true;
    if (cleanRegion) return { ...hive, regionArea: cleanRegion };
    const copy = { ...hive };
    delete copy.regionArea;
    return copy;
  });
  if (changed) bkWriteHives(next);
}

function bkDeleteRegion(region) {
  const cleanRegion = bkCleanRegion(region);
  if (!cleanRegion) return;

  const store = bkReadRegionStore();
  const deletedKey = bkRegionKey(cleanRegion);
  store.areas = bkUniqueRegions(store.areas || []).filter((area) => bkNorm(area) !== bkNorm(cleanRegion));
  store.regionOrder = bkUniqueKeys(store.regionOrder || []).filter((key) => key !== deletedKey);
  store.byName = { ...(store.byName || {}) };
  Object.keys(store.byName).forEach((name) => {
    if (bkNorm(store.byName[name]) === bkNorm(cleanRegion)) delete store.byName[name];
  });
  bkWriteRegionStore(store);

  const hives = bkReadHives();
  let changed = false;
  const next = hives.map((hive) => {
    if (bkNorm(hive?.regionArea) !== bkNorm(cleanRegion)) return hive;
    changed = true;
    const copy = { ...hive };
    delete copy.regionArea;
    return copy;
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

function bkIsEditApiaryModal(modal) {
  return bkGetModalTitle(modal).toLowerCase().startsWith('edit ');
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

function bkSetControlRegion(control, region) {
  const cleanRegion = bkCleanRegion(region);
  const value = control.querySelector('.bk-region-area-value');
  const button = control.querySelector('.bk-region-area-button');
  const modal = control.closest?.('#root .fixed.inset-0.z-50');
  const isEditApiary = bkIsEditApiaryModal(modal);
  if (value) value.value = cleanRegion;
  if (button) {
    button.textContent = isEditApiary
      ? (cleanRegion ? `${cleanRegion} ▾` : 'Select Region ▾')
      : (cleanRegion ? `Region/Area: ${cleanRegion} ▾` : 'Region/Area ▾');
  }
  bkRenderRegionMenu(control);
}

function bkGetControlRegion(control) {
  return bkCleanRegion(control?.querySelector('.bk-region-area-value')?.value);
}

function bkHideRegionPanels(control) {
  control?.querySelector('.bk-region-area-add-panel')?.setAttribute('hidden', '');
  control?.querySelector('.bk-region-area-delete-panel')?.setAttribute('hidden', '');
}

function bkShowAddRegionPanel(control) {
  bkHideRegionPanels(control);
  const panel = control.querySelector('.bk-region-area-add-panel');
  const input = control.querySelector('.bk-region-area-new-input');
  panel?.removeAttribute('hidden');
  if (input) {
    input.value = '';
    window.setTimeout(() => input.focus(), 0);
  }
}

function bkShowDeleteRegionPanel(control) {
  bkHideRegionPanels(control);
  bkRenderRegionMenu(control);
  const panel = control.querySelector('.bk-region-area-delete-panel');
  panel?.removeAttribute('hidden');
  window.setTimeout(() => control.querySelector('.bk-region-area-delete-select')?.focus(), 0);
}

function bkRenderDeleteSelector(control, regions) {
  const select = control.querySelector('.bk-region-area-delete-select');
  if (!select) return;

  const selected = bkCleanRegion(select.value) || bkGetControlRegion(control) || regions[0] || '';
  const signature = regions.join('\u0001');
  if (select.dataset.regionSignature !== signature) {
    select.dataset.regionSignature = signature;
    const fragment = document.createDocumentFragment();
    regions.forEach((region) => {
      const option = document.createElement('option');
      option.value = region;
      option.textContent = region;
      fragment.appendChild(option);
    });
    select.replaceChildren(fragment);
  }
  select.value = regions.includes(selected) ? selected : (regions[0] || '');
}

function bkRenderRegionMenu(control) {
  if (!control) return;
  const list = control.querySelector('.bk-region-area-list');
  if (!list) return;

  const regions = bkMenuRegions();
  const selected = bkGetControlRegion(control);
  const signature = regions.join('\u0001');

  if (list.dataset.regionSignature !== signature) {
    list.dataset.regionSignature = signature;
    list.replaceChildren();

    if (regions.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'bk-region-area-empty';
      empty.textContent = 'No regions yet. Use Add Region above.';
      list.appendChild(empty);
    } else {
      regions.forEach((region) => {
        const option = document.createElement('button');
        option.type = 'button';
        option.className = 'bk-region-area-option';
        option.dataset.regionArea = region;
        option.textContent = region;
        list.appendChild(option);
      });
    }
  }

  list.querySelectorAll('.bk-region-area-option').forEach((option) => {
    option.classList.toggle('bk-region-area-option-selected', bkNorm(option.dataset.regionArea) === bkNorm(selected));
  });

  bkRenderDeleteSelector(control, regions);
  const deleteToggle = control.querySelector('.bk-region-area-delete-toggle');
  const confirmDelete = control.querySelector('.bk-region-area-confirm-delete');
  if (deleteToggle) deleteToggle.disabled = regions.length === 0;
  if (confirmDelete) confirmDelete.disabled = regions.length === 0;
}

function bkCloseOtherRegionMenus(currentControl) {
  document.querySelectorAll('.bk-region-area-control').forEach((control) => {
    if (control === currentControl) return;
    control.querySelector('.bk-region-area-menu')?.setAttribute('hidden', '');
    bkHideRegionPanels(control);
  });
}

function bkToggleRegionMenu(control) {
  const menu = control.querySelector('.bk-region-area-menu');
  if (!menu) return;
  bkCloseOtherRegionMenus(control);
  bkRenderRegionMenu(control);
  menu.hidden = !menu.hidden;
  if (menu.hidden) bkHideRegionPanels(control);
}

function bkAddRegionFromControl(control) {
  const input = control.querySelector('.bk-region-area-new-input');
  const region = bkCleanRegion(input?.value);
  if (!region) return;

  const store = bkReadRegionStore();
  store.areas = bkUniqueRegions([...(store.areas || []), region]);
  store.regionOrder = bkUniqueKeys([...(store.regionOrder || []), bkRegionKey(region)]);
  bkWriteRegionStore(store);

  if (input) input.value = '';
  bkSetControlRegion(control, region);
  bkHideRegionPanels(control);
  control.querySelector('.bk-region-area-menu')?.setAttribute('hidden', '');
  bkRefreshRegionControls();
  bkApplyRegionGrouping();
}

function bkDeleteRegionFromControl(control) {
  const select = control.querySelector('.bk-region-area-delete-select');
  const region = bkCleanRegion(select?.value);
  if (!region) return;
  if (!window.confirm(`Delete Region/Area "${region}"?`)) return;

  const currentRegion = bkGetControlRegion(control);
  bkDeleteRegion(region);
  if (bkNorm(currentRegion) === bkNorm(region)) bkSetControlRegion(control, '');
  bkHideRegionPanels(control);
  bkRefreshRegionControls();
  bkApplyRegionGrouping();
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
      <button type="button" class="bk-region-area-button">Region/Area ▾</button>
      <input type="hidden" class="bk-region-area-value" value="" />
      <div class="bk-region-area-menu" hidden>
        <div class="bk-region-area-toolbar">
          <button type="button" class="bk-region-area-add-toggle">Add Region</button>
          <button type="button" class="bk-region-area-delete-toggle">Delete Region</button>
        </div>
        <div class="bk-region-area-add-panel" hidden>
          <input class="bk-region-area-new-input" placeholder="New Region Name" />
          <button type="button" class="bk-region-area-add-save">Add</button>
          <button type="button" class="bk-region-area-panel-cancel">Cancel</button>
        </div>
        <div class="bk-region-area-delete-panel" hidden>
          <select class="bk-region-area-delete-select" aria-label="Select Region to delete"></select>
          <button type="button" class="bk-region-area-confirm-delete">Delete</button>
          <button type="button" class="bk-region-area-panel-cancel">Cancel</button>
        </div>
        <div class="bk-region-area-list"></div>
      </div>
    `;

    const nameLabel = nameInput.closest('label');
    if (nameLabel?.nextSibling) grid.insertBefore(control, nameLabel.nextSibling);
    else grid.appendChild(control);

    control.querySelector('.bk-region-area-button')?.addEventListener('click', () => bkToggleRegionMenu(control));
    control.querySelector('.bk-region-area-add-toggle')?.addEventListener('click', () => bkShowAddRegionPanel(control));
    control.querySelector('.bk-region-area-delete-toggle')?.addEventListener('click', () => bkShowDeleteRegionPanel(control));
    control.querySelector('.bk-region-area-add-save')?.addEventListener('click', () => bkAddRegionFromControl(control));
    control.querySelector('.bk-region-area-confirm-delete')?.addEventListener('click', () => bkDeleteRegionFromControl(control));
    control.querySelectorAll('.bk-region-area-panel-cancel').forEach((button) => {
      button.addEventListener('click', () => bkHideRegionPanels(control));
    });
    control.querySelector('.bk-region-area-new-input')?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') bkAddRegionFromControl(control);
    });

    control.querySelector('.bk-region-area-list')?.addEventListener('click', (event) => {
      const option = event.target.closest?.('.bk-region-area-option');
      if (!option) return;
      bkSetControlRegion(control, option.dataset.regionArea || '');
      control.querySelector('.bk-region-area-menu')?.setAttribute('hidden', '');
      bkHideRegionPanels(control);
    });
  }

  if (!control.dataset.initialisedRegion) {
    control.dataset.initialisedRegion = '1';
    bkSetControlRegion(control, bkRegionForApiaryName(bkApiaryNameFromModal(modal)));
  } else {
    bkRenderRegionMenu(control);
  }
}

function bkRefreshRegionControls() {
  document.querySelectorAll('.bk-region-area-control').forEach((control) => bkRenderRegionMenu(control));
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

function bkRegionFromKey(key, regions) {
  if (key === bkRegionKey('')) return '';
  return regions.find((region) => bkRegionKey(region) === key) || '';
}

function bkOrderedRegionEntries(grouped) {
  const regions = bkAllRegions();
  const store = bkReadRegionStore();
  const orderKeys = bkUniqueKeys([...(store.regionOrder || []), ...regions.map(bkRegionKey)]);

  if (grouped.has(bkRegionKey('')) && !orderKeys.includes(bkRegionKey(''))) {
    orderKeys.push(bkRegionKey(''));
  }

  Array.from(grouped.values()).forEach((group) => {
    const key = bkRegionKey(group.region);
    if (!orderKeys.includes(key)) orderKeys.push(key);
  });

  return orderKeys.map((key) => ({ key, region: bkRegionFromKey(key, regions) })).filter((entry) => grouped.has(entry.key));
}

function bkMakeRegionHeader(region, count, groupOrder) {
  const header = document.createElement('div');
  header.className = 'bk-region-area-header';
  header.draggable = true;
  header.dataset.regionArea = bkRegionDisplayName(region);
  header.dataset.regionKey = bkRegionKey(region);
  header.dataset.regionCount = String(count);
  header.style.order = String(groupOrder);
  header.title = 'Drag this Region/Area to move the whole group';
  header.innerHTML = `<strong></strong><em></em>`;
  header.querySelector('strong').textContent = bkRegionDisplayName(region);
  header.querySelector('em').textContent = `${count} Apiar${count === 1 ? 'y' : 'ies'}`;
  return header;
}

function bkCurrentHeaderSignature(list) {
  return Array.from(list.querySelectorAll(':scope > .bk-region-area-header')).map((header) => {
    return `${header.style.order}:${header.dataset.regionKey}:${header.dataset.regionCount}`;
  }).join('|');
}

function bkMoveRegionKeyBefore(fromKey, toKey) {
  if (!fromKey || !toKey || fromKey === toKey) return;

  const regions = bkAllRegions();
  const currentKeys = Array.from(document.querySelectorAll('.bk-region-area-header')).map((header) => header.dataset.regionKey).filter(Boolean);
  const store = bkReadRegionStore();
  const order = bkUniqueKeys([...(store.regionOrder || []), ...regions.map(bkRegionKey), ...currentKeys]);

  const fromIndex = order.indexOf(fromKey);
  const toIndex = order.indexOf(toKey);
  if (fromIndex < 0 || toIndex < 0) return;

  const [moved] = order.splice(fromIndex, 1);
  const nextToIndex = order.indexOf(toKey);
  order.splice(nextToIndex, 0, moved);

  const byKey = new Map(regions.map((region) => [bkRegionKey(region), region]));
  store.regionOrder = order;
  store.areas = order.map((key) => byKey.get(key)).filter(Boolean);
  bkWriteRegionStore(store);
  bkApplyRegionGrouping();
}

function bkApplyRegionGrouping() {
  if (bkRegionUpdatingList) return;
  const list = bkGetApiaryListScroller();
  if (!list) return;

  const rows = Array.from(list.children).filter((row) => {
    return row instanceof HTMLElement && row.querySelector('input[type="checkbox"]');
  });

  const grouped = new Map();
  rows.forEach((row) => {
    const name = bkGetApiaryRowName(row);
    const region = bkRegionForApiaryName(name);
    const key = bkRegionKey(region);
    if (!grouped.has(key)) grouped.set(key, { region, rows: [] });
    grouped.get(key).rows.push(row);
  });

  const activeGroups = bkOrderedRegionEntries(grouped);
  const desiredHeaderSignature = activeGroups.map((entry, groupIndex) => {
    return `${(groupIndex + 1) * 10000}:${entry.key}:${grouped.get(entry.key).rows.length}`;
  }).join('|');
  const currentHeaderSignature = bkCurrentHeaderSignature(list);

  bkRegionUpdatingList = true;
  try {
    list.classList.add('bk-region-area-list-grouped');

    activeGroups.forEach((entry, groupIndex) => {
      const group = grouped.get(entry.key);
      const groupBaseOrder = (groupIndex + 1) * 10000;
      group.rows.forEach((row, rowIndex) => {
        const number = rowIndex + 1;
        row.classList.add('bk-region-area-row');
        row.classList.toggle('bk-region-area-first-row', number === 1);
        row.dataset.regionArea = bkRegionDisplayName(group.region);
        row.dataset.regionKey = entry.key;
        row.dataset.regionNumber = String(number);
        row.style.order = String(groupBaseOrder + number);
      });
    });

    if (currentHeaderSignature !== desiredHeaderSignature) {
      list.querySelectorAll(':scope > .bk-region-area-header').forEach((header) => header.remove());
      activeGroups.forEach((entry, groupIndex) => {
        const group = grouped.get(entry.key);
        list.appendChild(bkMakeRegionHeader(group.region, group.rows.length, (groupIndex + 1) * 10000));
      });
    }
  } finally {
    window.requestAnimationFrame(() => {
      bkRegionUpdatingList = false;
    });
  }
}

function bkScheduleRegionSave(names, region) {
  [0, 60, 160, 360, 760, 1300].forEach((delay) => {
    window.setTimeout(() => {
      names.filter(Boolean).forEach((name) => bkSaveRegionForApiaryName(name, region));
      bkApplyRegionGrouping();
    }, delay);
  });
}

function bkScheduleRegionWork() {
  if (bkRegionUpdatingList || bkRegionRaf) return;
  bkRegionRaf = window.requestAnimationFrame(() => {
    bkRegionRaf = 0;
    bkWireApiaryRegionForms();
    bkApplyRegionGrouping();
  });
}

document.addEventListener('dragstart', (event) => {
  const header = event.target.closest?.('.bk-region-area-header');
  if (!header) return;

  bkDraggedRegionKey = header.dataset.regionKey || '';
  header.classList.add('bk-region-area-header-dragging');
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', bkDraggedRegionKey);
}, true);

document.addEventListener('dragover', (event) => {
  const header = event.target.closest?.('.bk-region-area-header');
  if (!header || !bkDraggedRegionKey || header.dataset.regionKey === bkDraggedRegionKey) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  header.classList.add('bk-region-area-header-drag-over');
}, true);

document.addEventListener('dragleave', (event) => {
  event.target.closest?.('.bk-region-area-header')?.classList.remove('bk-region-area-header-drag-over');
}, true);

document.addEventListener('drop', (event) => {
  const header = event.target.closest?.('.bk-region-area-header');
  if (!header || !bkDraggedRegionKey || header.dataset.regionKey === bkDraggedRegionKey) return;
  event.preventDefault();
  document.querySelectorAll('.bk-region-area-header-drag-over').forEach((item) => item.classList.remove('bk-region-area-header-drag-over'));
  bkMoveRegionKeyBefore(bkDraggedRegionKey, header.dataset.regionKey || '');
}, true);

document.addEventListener('dragend', () => {
  bkDraggedRegionKey = '';
  document.querySelectorAll('.bk-region-area-header-dragging, .bk-region-area-header-drag-over').forEach((item) => {
    item.classList.remove('bk-region-area-header-dragging', 'bk-region-area-header-drag-over');
  });
}, true);

document.addEventListener('click', (event) => {
  const menuClick = event.target.closest?.('.bk-region-area-control');
  if (menuClick) return;
  document.querySelectorAll('.bk-region-area-menu').forEach((menu) => menu.setAttribute('hidden', ''));
  document.querySelectorAll('.bk-region-area-control').forEach((control) => bkHideRegionPanels(control));
}, true);

document.addEventListener('click', (event) => {
  const button = event.target.closest?.('button');
  if (!button || button.textContent.trim().toLowerCase() !== 'save') return;
  const modal = button.closest('#root .fixed.inset-0.z-50');
  if (!modal || !bkIsApiaryFormModal(modal)) return;

  const oldName = bkGetModalTitle(modal).replace(/^edit\s+/i, '').trim();
  const newName = bkApiaryNameFromModal(modal);
  const control = modal.querySelector('.bk-region-area-control');
  const region = bkGetControlRegion(control);
  bkScheduleRegionSave([oldName, newName], region);
}, true);

document.addEventListener('click', (event) => {
  const option = event.target.closest?.('.bk-region-area-option');
  if (!option) return;
  const control = option.closest('.bk-region-area-control');
  if (!control) return;
  const modal = control.closest('#root .fixed.inset-0.z-50');
  const name = bkApiaryNameFromModal(modal);
  const region = bkCleanRegion(option.dataset.regionArea);
  window.setTimeout(() => bkSaveRegionForApiaryName(name, region), 0);
}, true);

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  document.querySelectorAll('.bk-region-area-menu').forEach((menu) => menu.setAttribute('hidden', ''));
  document.querySelectorAll('.bk-region-area-control').forEach((control) => bkHideRegionPanels(control));
}, true);

new MutationObserver(bkScheduleRegionWork).observe(document.documentElement, {
  childList: true,
  subtree: true,
});

bkScheduleRegionWork();
