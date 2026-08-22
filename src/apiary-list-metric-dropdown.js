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

function showOnlyMetricCells(cells, selectedIndex) {
  cells.forEach((cell, index) => {
    cell.style.removeProperty('display');
    cell.style.removeProperty('grid-column');

    if (index >= 2 && index <= 4 && index !== selectedIndex) {
      cell.style.setProperty('display', 'none', 'important');
      return;
    }

    if (index === selectedIndex) {
      cell.style.setProperty('grid-column', '3', 'important');
    }
  });
}

function applyMetricGrid(element) {
  element.style.setProperty('grid-template-columns', '2.25rem minmax(0, 1fr) minmax(6.5rem, 0.42fr)', 'important');
  element.style.setProperty('width', '100%', 'important');
  element.style.setProperty('min-width', '0', 'important');
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
    showOnlyMetricCells(Array.from(header.children), selectedIndex);

    getApiaryMetricRows(card).forEach((row) => {
      applyMetricGrid(row);
      showOnlyMetricCells(Array.from(row.children), selectedIndex);
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
      border-radius: 0.85rem;
      border: 1px solid rgba(234, 179, 8, 0.45);
      background: rgba(0, 0, 0, 0.6);
      color: #fde047;
      padding: 0.55rem 0.45rem;
      font-size: 0.98rem;
      line-height: 1.1;
      font-weight: 950;
      text-align: center;
    }

    body.bk-apiary-metric-dropdown #root input[placeholder="Search apiaries..."] + div {
      overflow-x: hidden !important;
    }

    body.bk-apiary-metric-dropdown #root input[placeholder="Search apiaries..."] + div > div.grid,
    body.bk-apiary-metric-dropdown #root input[placeholder="Search apiaries..."] + div > div > div.grid {
      grid-template-columns: 2.25rem minmax(0, 1fr) minmax(6.5rem, 0.42fr) !important;
      min-width: 0 !important;
      width: 100% !important;
      gap: 0.35rem !important;
    }

    body.bk-apiary-metric-dropdown #root input[placeholder="Search apiaries..."] + div > div > div.grid > span[draggable="true"] {
      min-width: 0 !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
    }

    body.bk-apiary-metric-dropdown #root input[placeholder="Search apiaries..."] + div > div > div.grid > span:not([draggable="true"]) {
      justify-self: end !important;
      text-align: right !important;
      min-width: 0 !important;
      white-space: nowrap !important;
    }

    @media (max-width: 760px) {
      body.bk-apiary-metric-dropdown #bkApiaryMetricDropdown {
        padding: 0.5rem 0.3rem;
        font-size: 0.82rem;
      }

      body.bk-apiary-metric-dropdown #root input[placeholder="Search apiaries..."] + div > div.grid,
      body.bk-apiary-metric-dropdown #root input[placeholder="Search apiaries..."] + div > div > div.grid {
        grid-template-columns: 1.9rem minmax(0, 1fr) 4.8rem !important;
        gap: 0.22rem !important;
      }
    }

    @media (max-width: 390px) {
      body.bk-apiary-metric-dropdown #bkApiaryMetricDropdown {
        font-size: 0.74rem;
        padding: 0.45rem 0.2rem;
      }

      body.bk-apiary-metric-dropdown #root input[placeholder="Search apiaries..."] + div > div.grid,
      body.bk-apiary-metric-dropdown #root input[placeholder="Search apiaries..."] + div > div > div.grid {
        grid-template-columns: 1.75rem minmax(0, 1fr) 4.25rem !important;
      }
    }
  `;
  document.head.appendChild(style);
}

installApiaryMetricDropdownStyles();
new MutationObserver(applyApiaryMetricDropdown).observe(document.documentElement, { childList: true, subtree: true });
applyApiaryMetricDropdown();
