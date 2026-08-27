const BK_INFO_EXTRA_SEARCH = '#root input[placeholder="Search apiaries..."]';
let bkInfoExtraRaf = 0;

function bkInfoExtraHives() {
  try {
    const value = JSON.parse(localStorage.getItem('bk.hives') || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function bkInfoExtraSaveHives(hives) {
  try {
    localStorage.setItem('bk.hives', JSON.stringify(hives));
  } catch {}
}

function bkInfoExtraCurrentCard() {
  const search = document.querySelector(BK_INFO_EXTRA_SEARCH);
  const layout = search?.closest('[class*="lg:grid-cols-[520px,1fr]"]');
  const pane = layout?.children?.[1];
  const card = pane?.firstElementChild;
  return card instanceof HTMLElement ? card : null;
}

function bkInfoExtraCurrentHive(card) {
  if (!card) return null;
  const header = card.firstElementChild;
  const name = header?.firstElementChild?.firstElementChild?.textContent?.trim() || '';
  if (!name || name.toLowerCase() === 'select an apiary') return null;
  return bkInfoExtraHives().find((hive) => String(hive?.name || '').trim() === name) || null;
}

function bkInfoExtraDetailRows(card) {
  return Array.from(card?.querySelectorAll('.flex.items-center.justify-between.rounded-xl') || []);
}

function bkInfoExtraMakeRow(label) {
  const row = document.createElement('div');
  row.className = 'flex items-center justify-between rounded-xl border border-yellow-500/20 bg-black/30 px-3 py-2 bk-info-extra-row';
  const labelSpan = document.createElement('span');
  labelSpan.className = 'opacity-80';
  labelSpan.textContent = label;
  row.appendChild(labelSpan);
  return row;
}

function bkInfoExtraApply() {
  const card = bkInfoExtraCurrentCard();
  const hive = bkInfoExtraCurrentHive(card);
  if (!card || !hive) return;

  const rows = bkInfoExtraDetailRows(card);
  const singleRow = rows.find((row) => row.firstElementChild?.textContent?.trim() === 'Single Hives');
  if (!singleRow) return;

  let nucsRow = card.querySelector('#bkApiaryInfoNucs');
  if (!nucsRow) {
    nucsRow = bkInfoExtraMakeRow('Nucs');
    nucsRow.id = 'bkApiaryInfoNucs';
    const value = document.createElement('span');
    value.className = 'font-bold text-yellow-100';
    value.dataset.role = 'nucs-value';
    nucsRow.appendChild(value);
    singleRow.insertAdjacentElement('afterend', nucsRow);
  }
  const nucsValue = nucsRow.querySelector('[data-role="nucs-value"]');
  const nextNucs = String(Math.max(0, parseInt(String(hive.nucs ?? 0), 10) || 0));
  if (nucsValue && nucsValue.textContent !== nextNucs) nucsValue.textContent = nextNucs;

  let foodRow = card.querySelector('#bkApiaryInfoFoodStores');
  if (!foodRow) {
    foodRow = bkInfoExtraMakeRow('Food Stores');
    foodRow.id = 'bkApiaryInfoFoodStores';
    const select = document.createElement('select');
    select.id = 'bkApiaryFoodStoresSelect';
    select.className = 'bk-apiary-food-stores-select';
    ['Low', 'Medium', 'High'].forEach((optionValue) => {
      const option = document.createElement('option');
      option.value = optionValue;
      option.textContent = optionValue;
      select.appendChild(option);
    });
    select.addEventListener('change', () => {
      const currentCard = bkInfoExtraCurrentCard();
      const currentHive = bkInfoExtraCurrentHive(currentCard);
      if (!currentHive) return;
      const hives = bkInfoExtraHives();
      const index = hives.findIndex((item) => item.id === currentHive.id);
      if (index < 0) return;
      hives[index] = { ...hives[index], foodStores: select.value };
      bkInfoExtraSaveHives(hives);
    });
    foodRow.appendChild(select);
    nucsRow.insertAdjacentElement('afterend', foodRow);
  }

  const select = foodRow.querySelector('#bkApiaryFoodStoresSelect');
  const nextFood = ['Low', 'Medium', 'High'].includes(hive.foodStores) ? hive.foodStores : 'Medium';
  if (select && select.value !== nextFood) select.value = nextFood;
}

function bkInfoExtraSchedule() {
  if (bkInfoExtraRaf) return;
  bkInfoExtraRaf = requestAnimationFrame(() => {
    bkInfoExtraRaf = 0;
    bkInfoExtraApply();
  });
}

new MutationObserver(bkInfoExtraSchedule).observe(document.getElementById('root'), {
  childList: true,
  subtree: true,
});

document.addEventListener('click', () => setTimeout(bkInfoExtraSchedule, 0), true);
bkInfoExtraSchedule();
