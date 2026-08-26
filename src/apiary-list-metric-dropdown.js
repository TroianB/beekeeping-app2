const APIARY_METRIC_STORAGE_KEY = 'bk.apiaryMetric';
const APIARY_METRICS = {
  total: { label: 'Total Hives', index: 2 },
  doubles: { label: 'Doubles', index: 3 },
  singles: { label: 'Singles', index: 4 },
  lastUpdate: { label: 'Last Update', index: 2, date: true },
};

let metricApplying = false;
let metricRaf = 0;

function getMetricValue() {
  try {
    const saved = localStorage.getItem(APIARY_METRIC_STORAGE_KEY);
    return APIARY_METRICS[saved] ? saved : 'total';
  } catch {
    return 'total';
  }
}

function setMetricValue(value) {
  try { localStorage.setItem(APIARY_METRIC_STORAGE_KEY, value); } catch {}
}

function getApiaryMetricCard() {
  const search = document.querySelector('#root input[placeholder="Search apiaries..."]');
  return search?.nextElementSibling || null;
}
function getApiaryMetricHeader(card) { return card?.children?.[0] || null; }
function getApiaryMetricRows(card) {
  const list = card?.children?.[1];
  if (!list) return [];
  return Array.from(list.children).filter((row) => row instanceof HTMLElement && row.querySelector('input[type="checkbox"]'));
}
function readApiariesForMetric() {
  try {
    const parsed = JSON.parse(localStorage.getItem('bk.hives') || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}
function normMetric(value) { return String(value || '').trim().toLowerCase(); }
function formatLastUpdate(value) {
  if (!value) return '—';
  const parts = String(value).split('T')[0].split('-');
  return parts.length === 3 ? `${parts[2].padStart(2,'0')}/${parts[1].padStart(2,'0')}/${parts[0]}` : String(value);
}
function rowApiaryName(row) {
  const draggable = row.querySelector('span[draggable="true"]');
  if (draggable) return draggable.textContent.trim();
  const spans = Array.from(row.children).filter((child) => child.tagName === 'SPAN');
  return spans[0]?.textContent?.trim() || '';
}
function setLastUpdateValue(row, apiaries) {
  const cells = Array.from(row.children);
  const target = cells[2];
  if (!target) return;

  if (target.dataset.bkOriginalMetricValue === undefined) {
    target.dataset.bkOriginalMetricValue = target.textContent;
  }

  const name = normMetric(rowApiaryName(row));
  const apiary = apiaries.find((item) => normMetric(item?.name) === name);
  const nextText = formatLastUpdate(apiary?.lastInspection);

  if (target.textContent !== nextText) target.textContent = nextText;
  if (!target.classList.contains('bk-last-update-value')) target.classList.add('bk-last-update-value');
}
function restoreTotalValue(row) {
  const target = row.children?.[2];
  if (!target) return;
  const original = target.dataset.bkOriginalMetricValue;
  if (original !== undefined && target.textContent !== original) target.textContent = original;
  if (target.classList.contains('bk-last-update-value')) target.classList.remove('bk-last-update-value');
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
      <option value="lastUpdate">Last Update</option>
    `;
    ['click','pointerdown','mousedown'].forEach((type) => select.addEventListener(type, (event) => event.stopPropagation()));
    select.addEventListener('change', () => { setMetricValue(select.value); scheduleApiaryMetricDropdown(); });
    cells[2].textContent = '';
    cells[2].appendChild(select);
  }
  if (select.value !== getMetricValue()) select.value = getMetricValue();
  return select;
}
function clearMetricCellStyles(cell) {
  ['display','grid-column','justify-self','text-align','width'].forEach((p) => cell.style.removeProperty(p));
}
function showHeaderDropdownCell(cells) {
  cells.forEach((cell,index) => {
    clearMetricCellStyles(cell);
    if (index === 2) {
      cell.style.setProperty('grid-column','3','important');
      cell.style.setProperty('justify-self','stretch','important');
      cell.style.setProperty('text-align','center','important');
      cell.style.setProperty('width','100%','important');
    } else if (index === 3 || index === 4) cell.style.setProperty('display','none','important');
  });
}
function showOnlySelectedRowMetric(cells, selectedIndex) {
  cells.forEach((cell,index) => {
    clearMetricCellStyles(cell);
    if (index >= 2 && index <= 4 && index !== selectedIndex) { cell.style.setProperty('display','none','important'); return; }
    if (index === selectedIndex) {
      cell.style.setProperty('grid-column','3','important');
      cell.style.setProperty('justify-self','stretch','important');
      cell.style.setProperty('text-align','center','important');
      cell.style.setProperty('width','100%','important');
    }
  });
}
function applyMetricGrid(element) {
  element.style.setProperty('grid-template-columns','2.45rem minmax(0, 1fr) minmax(8rem, 0.48fr)','important');
  element.style.setProperty('width','100%','important');
  element.style.setProperty('min-width','0','important');
  element.style.setProperty('align-items','center','important');
}
function applyApiaryMetricDropdown() {
  if (metricApplying) return;
  metricApplying = true;
  const card = getApiaryMetricCard();
  const header = getApiaryMetricHeader(card);
  if (!card || !header) {
    document.body.classList.remove('bk-apiary-metric-dropdown');
    metricApplying = false;
    return;
  }

  const metricKey = getMetricValue();
  const selectedIndex = APIARY_METRICS[metricKey]?.index ?? 2;
  const apiaries = metricKey === 'lastUpdate' ? readApiariesForMetric() : [];
  document.body.classList.add('bk-apiary-metric-dropdown');

  ensureMetricDropdown(header);
  applyMetricGrid(header);
  showHeaderDropdownCell(Array.from(header.children));

  getApiaryMetricRows(card).forEach((row) => {
    if (metricKey === 'lastUpdate') setLastUpdateValue(row, apiaries);
    else restoreTotalValue(row);
    applyMetricGrid(row);
    showOnlySelectedRowMetric(Array.from(row.children), selectedIndex);
  });

  metricApplying = false;
}
function scheduleApiaryMetricDropdown() {
  if (metricRaf) return;
  metricRaf = window.requestAnimationFrame(() => {
    metricRaf = 0;
    applyApiaryMetricDropdown();
  });
}
function installApiaryMetricDropdownStyles() {
  if (document.getElementById('bkApiaryMetricDropdownStyles')) return;
  const style=document.createElement('style'); style.id='bkApiaryMetricDropdownStyles';
  style.textContent=`
body.bk-apiary-metric-dropdown #bkApiaryMetricDropdown{width:100%;min-width:0;border-radius:.95rem;border:1px solid rgba(234,179,8,.55);background:rgba(0,0,0,.72);color:#fde047;padding:.8rem .55rem;font-size:1.35rem;line-height:1.1;font-weight:950;text-align:center;pointer-events:auto;cursor:pointer}
body.bk-apiary-metric-dropdown #root input[placeholder="Search apiaries..."]+div{overflow-x:hidden!important}
body.bk-apiary-metric-dropdown #root input[placeholder="Search apiaries..."]+div>div.grid,body.bk-apiary-metric-dropdown #root input[placeholder="Search apiaries..."]+div>div>div.grid{grid-template-columns:2.45rem minmax(0,1fr) minmax(8rem,.48fr)!important;min-width:0!important;width:100%!important;gap:.55rem!important;align-items:center!important}
body.bk-apiary-metric-dropdown #root input[placeholder="Search apiaries..."]+div>div.grid{padding-top:.85rem!important;padding-bottom:.85rem!important}
body.bk-apiary-metric-dropdown #root input[placeholder="Search apiaries..."]+div>div>div.grid{min-height:4.6rem!important;padding-top:.85rem!important;padding-bottom:.85rem!important}
body.bk-apiary-metric-dropdown #root input[placeholder="Search apiaries..."]+div>div.grid>span:nth-child(2){font-size:1.65rem!important;line-height:1.05!important;font-weight:950!important}
body.bk-apiary-metric-dropdown #root input[placeholder="Search apiaries..."]+div>div>div.grid>span[draggable="true"]{min-width:0!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;font-size:2.25rem!important;line-height:1.05!important;font-weight:950!important}
body.bk-apiary-metric-dropdown #root input[placeholder="Search apiaries..."]+div>div>div.grid>span:not([draggable="true"]){justify-self:stretch!important;text-align:center!important;min-width:0!important;width:100%!important;white-space:nowrap!important;font-size:2.25rem!important;line-height:1.05!important;font-weight:950!important}
body.bk-apiary-metric-dropdown .bk-last-update-value{font-size:1.35rem!important}
body.bk-apiary-metric-dropdown:not(.bk-apiary-delete-mode) #root input[placeholder="Search apiaries..."]+div>div>div.grid::before{font-size:1.55rem!important;line-height:1.05!important}
@media(max-width:760px){body.bk-apiary-metric-dropdown #bkApiaryMetricDropdown{padding:.68rem .35rem;font-size:1.05rem}body.bk-apiary-metric-dropdown #root input[placeholder="Search apiaries..."]+div>div.grid,body.bk-apiary-metric-dropdown #root input[placeholder="Search apiaries..."]+div>div>div.grid{grid-template-columns:2rem minmax(0,1fr) 5.65rem!important;gap:.32rem!important}body.bk-apiary-metric-dropdown #root input[placeholder="Search apiaries..."]+div>div.grid>span:nth-child(2){font-size:1.18rem!important}body.bk-apiary-metric-dropdown #root input[placeholder="Search apiaries..."]+div>div>div.grid>span[draggable="true"],body.bk-apiary-metric-dropdown #root input[placeholder="Search apiaries..."]+div>div>div.grid>span:not([draggable="true"]){font-size:1.75rem!important}body.bk-apiary-metric-dropdown .bk-last-update-value{font-size:.9rem!important}}
@media(max-width:390px){body.bk-apiary-metric-dropdown #bkApiaryMetricDropdown{font-size:.92rem;padding:.58rem .25rem}body.bk-apiary-metric-dropdown #root input[placeholder="Search apiaries..."]+div>div.grid,body.bk-apiary-metric-dropdown #root input[placeholder="Search apiaries..."]+div>div>div.grid{grid-template-columns:1.8rem minmax(0,1fr) 5rem!important;gap:.24rem!important}body.bk-apiary-metric-dropdown #root input[placeholder="Search apiaries..."]+div>div>div.grid>span[draggable="true"],body.bk-apiary-metric-dropdown #root input[placeholder="Search apiaries..."]+div>div>div.grid>span:not([draggable="true"]){font-size:1.52rem!important}body.bk-apiary-metric-dropdown .bk-last-update-value{font-size:.78rem!important}}
`;
  document.head.appendChild(style);
}
installApiaryMetricDropdownStyles();
new MutationObserver(scheduleApiaryMetricDropdown).observe(document.documentElement,{childList:true,subtree:true});
scheduleApiaryMetricDropdown();
