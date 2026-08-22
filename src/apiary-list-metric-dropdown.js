const APIARY_METRIC_STORAGE_KEY = 'bk.apiaryMetric';
const APIARY_METRICS = {
  total: { label: 'Total Hives', index: 2 },
  doubles: { label: 'Doubles', index: 3 },
  singles: { label: 'Singles', index: 4 },
};

let metricApplying = false;

function getMetricValue() {
  try {
    const saved = localStorage.getItem(APIARY_METRIC_STORAGE_KEY);
    return APIARY_METRICS[saved] ? saved : 'total';
  } catch {
    return 'total';
  }
}

function setMetricValue(value) {
  try {
    localStorage.setItem(APIARY_METRIC_STORAGE_KEY, value);
  } catch {}
}

function getApiaryMetricCard() {
  const search = document.querySelector('#root input[placeholder="Search apiaries..."]');
  return search?.nextElementSibling || null;
}

function getApiaryMetricHeader(card) {
  return card?.children?.[0] || null;
}

function getApiaryMetricRows(card) {
  const list = card?.children?.[1];
  if (!list) return [];
  return Array.from(list.children).filter((row) => {
    return row instanceof HTMLElement && row.querySelector('input[type="checkbox"]');
  });
}

function ensureMetricDropdown(header) {
  const cells = Array.from(header.children);
  if (cells.length < 5) return null;

  let select = header.querySelector('#bkApiaryMetricDropdown');
  if (!select) {
    select = document.createElement('select');
    select.id = 'bkApiaryMetricDropdown';
    select.setAttribute('aria-label', 'Choose Apiary data');
    select.innerHTML = `
      <option value="total">Total Hives</option>
      <option value="doubles">Doubles</option>
      <option value="singles">Singles</option>
    `;
    select.addEventListener('click', (event) => event.stopPropagation());
    select.addEventListener('pointerdown', (event) => event.stopPropagation());
    select.addEventListener('mousedown', (event) => event.stopPropagation());
    select.addEventListener('change', () => {
      setMetricValue(select.value);
      applyApiaryMetricDropdown();
    });
    cells[2].textContent = '';
    cells[2].appendChild(select);
  }

  select.value = getMetricValue();
  return select;
}

function clearMetricCellStyles(cell) {
  cell.style.removeProperty('display');
  cell.style.removeProperty('grid-column');
  cell.style.removeProperty('justify-self');
  cell.style.removeProperty('text-align');
  cell.style.removeProperty('width');
}

function showHeaderDropdownCell(cells) {
  cells.forEach((cell, index) => {
    clearMetricCellStyles(cell);

    if (index === 2) {
      cell.style.setProperty('grid-column', '3', 'important');
      cell.style.setProperty('justify-self', 'stretch', 'important');
      cell.style.setProperty('text-align', 'center', 'important');
      cell.style.setProperty('width', '100%', 'important');
      return;
    }

    if (index === 3 || index === 4) {
      cell.style.setProperty('display', 'none', 'important');
    }
  });
}

function showOnlySelectedRowMetric(cells, selectedIndex) {
  cells.forEach((cell, index) => {
    clearMetricCellStyles(cell);

    if (index >= 2 && index <= 4 && index !== selectedIndex) {
      cell.style.setProperty('display', 'none', 'important');
      return;
    }

    if (index === selectedIndex) {
      cell.style.setProperty('grid-column', '3', 'important');
      cell.style.setProperty('justify-self', 'stretch', 'important');
      cell.style.setProperty('text-align', 'center', 'important');
      cell.style.setProperty('width', '100%', 'important');
    }
  });
}

function applyMetricGrid(element) {
  element.style.setProperty('grid-template-columns', '2.45rem minmax(0, 1fr) minmax(8rem, 0.48fr)', 'important');
  element.style.setProperty('width', '100%', 'important');
  element.style.setProperty('min-width', '0', 'important');
  element.style.setProperty('align-items', 'center', 'important');
}

function applyApiaryMetricDropdown() {
  if (metricApplying) return;
  metricApplying = true;

  window.requestAnimationFrame(() => {
    const card = getApiaryMetricCard();
    const header = getApiaryMetricHeader(card);
    if (!card || !header) {
      document.body.classList.remove('bk-apiary-metric-dropdown');
      metricApplying = false;
      return;
    }

    const metricKey = getMetricValue();
    const selectedIndex = APIARY_METRICS[metricKey]?.index ?? 2;
    document.body.classList.add('bk-apiary-metric-dropdown');

    ensureMetricDropdown(header);
    applyMetricGrid(header);
    showHeaderDropdownCell(Array.from(header.children));

    getApiaryMetricRows(card).forEach((row) => {
      applyMetricGrid(row);
      showOnlySelectedRowMetric(Array.from(row.children), selectedIndex);
    });

    metricApplying = false;
  });
}

function installApiaryMetricDropdownStyles() {
  if (document.getElementById('bkApiaryMetricDropdownStyles')) return;
  const style = document.createElement('style');
  style.id = 'bkApiaryMetricDropdownStyles';
  style.textContent = `
    body.bk-apiary-metric-dropdown #bkApiaryMetricDropdown {
      width: 100%;
      min-width: 0;
      border-radius: 0.95rem;
      border: 1px solid rgba(234, 179, 8, 0.55);
      background: rgba(0, 0, 0, 0.72);
      color: #fde047;
      padding: 0.8rem 0.55rem;
      font-size: 1.35rem;
      line-height: 1.1;
      font-weight: 950;
      text-align: center;
      pointer-events: auto;
      cursor: pointer;
    }

    body.bk-apiary-metric-dropdown #root input[placeholder="Search apiaries..."] + div {
      overflow-x: hidden !important;
    }

    body.bk-apiary-metric-dropdown #root input[placeholder="Search apiaries..."] + div > div.grid,
    body.bk-apiary-metric-dropdown #root input[placeholder="Search apiaries..."] + div > div > div.grid {
      grid-template-columns: 2.45rem minmax(0, 1fr) minmax(8rem, 0.48fr) !important;
      min-width: 0 !important;
      width: 100% !important;
      gap: 0.55rem !important;
      align-items: center !important;
    }

    body.bk-apiary-metric-dropdown #root input[placeholder="Search apiaries..."] + div > div.grid {
      padding-top: 0.85rem !important;
      padding-bottom: 0.85rem !important;
    }

    body.bk-apiary-metric-dropdown #root input[placeholder="Search apiaries..."] + div > div > div.grid {
      min-height: 4.6rem !important;
      padding-top: 0.85rem !important;
      padding-bottom: 0.85rem !important;
    }

    body.bk-apiary-metric-dropdown #root input[placeholder="Search apiaries..."] + div > div.grid > span:nth-child(2) {
      font-size: 1.65rem !important;
      line-height: 1.05 !important;
      font-weight: 950 !important;
    }

    body.bk-apiary-metric-dropdown #root input[placeholder="Search apiaries..."] + div > div > div.grid > span[draggable="true"] {
      min-width: 0 !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
      font-size: 2.25rem !important;
      line-height: 1.05 !important;
      font-weight: 950 !important;
    }

    body.bk-apiary-metric-dropdown #root input[placeholder="Search apiaries..."] + div > div > div.grid > span:not([draggable="true"]) {
      justify-self: stretch !important;
      text-align: center !important;
      min-width: 0 !important;
      width: 100% !important;
      white-space: nowrap !important;
      font-size: 2.25rem !important;
      line-height: 1.05 !important;
      font-weight: 950 !important;
    }

    body.bk-apiary-metric-dropdown:not(.bk-apiary-delete-mode) #root input[placeholder="Search apiaries..."] + div > div > div.grid::before {
      font-size: 1.55rem !important;
      line-height: 1.05 !important;
    }

    @media (max-width: 760px) {
      body.bk-apiary-metric-dropdown #bkApiaryMetricDropdown {
        padding: 0.68rem 0.35rem;
        font-size: 1.05rem;
      }

      body.bk-apiary-metric-dropdown #root input[placeholder="Search apiaries..."] + div > div.grid,
      body.bk-apiary-metric-dropdown #root input[placeholder="Search apiaries..."] + div > div > div.grid {
        grid-template-columns: 2rem minmax(0, 1fr) 5.65rem !important;
        gap: 0.32rem !important;
      }

      body.bk-apiary-metric-dropdown #root input[placeholder="Search apiaries..."] + div > div.grid > span:nth-child(2) {
        font-size: 1.18rem !important;
      }

      body.bk-apiary-metric-dropdown #root input[placeholder="Search apiaries..."] + div > div > div.grid > span[draggable="true"],
      body.bk-apiary-metric-dropdown #root input[placeholder="Search apiaries..."] + div > div > div.grid > span:not([draggable="true"]) {
        font-size: 1.75rem !important;
      }
    }

    @media (max-width: 390px) {
      body.bk-apiary-metric-dropdown #bkApiaryMetricDropdown {
        font-size: 0.92rem;
        padding: 0.58rem 0.25rem;
      }

      body.bk-apiary-metric-dropdown #root input[placeholder="Search apiaries..."] + div > div.grid,
      body.bk-apiary-metric-dropdown #root input[placeholder="Search apiaries..."] + div > div > div.grid {
        grid-template-columns: 1.8rem minmax(0, 1fr) 5rem !important;
        gap: 0.24rem !important;
      }

      body.bk-apiary-metric-dropdown #root input[placeholder="Search apiaries..."] + div > div > div.grid > span[draggable="true"],
      body.bk-apiary-metric-dropdown #root input[placeholder="Search apiaries..."] + div > div > div.grid > span:not([draggable="true"]) {
        font-size: 1.52rem !important;
      }
    }
  `;
  document.head.appendChild(style);
}

installApiaryMetricDropdownStyles();
new MutationObserver(applyApiaryMetricDropdown).observe(document.documentElement, { childList: true, subtree: true });
applyApiaryMetricDropdown();
