let bkInfoExtraRaf = 0;

function bkInfoExtraCount(value) {
  const number = parseInt(String(value ?? 0), 10);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function bkInfoExtraHives() {
  try {
    const value = JSON.parse(localStorage.getItem('bk.hives') || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function bkInfoExtraRows(root = document) {
  return Array.from(root.querySelectorAll('.flex.items-center.justify-between.rounded-xl'));
}

function bkInfoExtraInformationCard() {
  const rows = bkInfoExtraRows(document);
  const singles = rows.find((row) => row.firstElementChild?.textContent?.trim() === 'Single Hives');
  if (!singles) return null;
  return singles.closest('.rounded-2xl.border') || singles.parentElement?.parentElement || null;
}

function bkInfoExtraCurrentHive(card) {
  if (!card) return null;
  const hives = bkInfoExtraHives();
  const texts = Array.from(card.querySelectorAll('div,span')).map((node) => node.textContent?.trim()).filter(Boolean);
  return hives.find((hive) => texts.includes(String(hive?.name || '').trim())) || null;
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

function bkInfoExtraApplyInformation() {
  const card = bkInfoExtraInformationCard();
  const hive = bkInfoExtraCurrentHive(card);
  if (!card || !hive) return;

  const rows = bkInfoExtraRows(card);
  const numberRow = rows.find((row) => row.firstElementChild?.textContent?.trim() === 'Number of Hives');
  const singleRow = rows.find((row) => row.firstElementChild?.textContent?.trim() === 'Single Hives');
  if (!singleRow) return;

  const total = bkInfoExtraCount(hive.singleHives) + bkInfoExtraCount(hive.doubleHives) + bkInfoExtraCount(hive.nucs);
  const totalValue = numberRow?.lastElementChild;
  if (totalValue && totalValue.textContent !== String(total)) totalValue.textContent = String(total);

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
  const nextNucs = String(bkInfoExtraCount(hive.nucs));
  if (nucsValue && nucsValue.textContent !== nextNucs) nucsValue.textContent = nextNucs;

  let foodRow = card.querySelector('#bkApiaryInfoFoodStores');
  if (!foodRow) {
    foodRow = bkInfoExtraMakeRow('Food Stores');
    foodRow.id = 'bkApiaryInfoFoodStores';
    const value = document.createElement('span');
    value.className = 'font-bold text-yellow-100';
    value.dataset.role = 'food-stores-value';
    foodRow.appendChild(value);
    nucsRow.insertAdjacentElement('afterend', foodRow);
  }

  const foodValue = foodRow.querySelector('[data-role="food-stores-value"]');
  const nextFood = ['Low', 'Medium', 'High'].includes(hive.foodStores) ? hive.foodStores : 'Medium';
  if (foodValue && foodValue.textContent !== nextFood) foodValue.textContent = nextFood;
}

function bkInfoExtraFindDashboardStat(title) {
  return Array.from(document.querySelectorAll('.text-xs.font-semibold.uppercase.tracking-wider.text-yellow-300'))
    .find((node) => node.textContent?.trim() === title)?.closest('.rounded-2xl.border') || null;
}

function bkInfoExtraApplyDashboard() {
  const singlesCard = bkInfoExtraFindDashboardStat('Singles');
  if (!singlesCard) {
    document.getElementById('bkDashboardNucsStat')?.remove();
    return;
  }

  const hives = bkInfoExtraHives();
  const nucs = hives.reduce((sum, hive) => sum + bkInfoExtraCount(hive.nucs), 0);
  const total = hives.reduce((sum, hive) => sum + bkInfoExtraCount(hive.singleHives) + bkInfoExtraCount(hive.doubleHives) + bkInfoExtraCount(hive.nucs), 0);

  const totalCard = bkInfoExtraFindDashboardStat('Total Hives');
  const totalValue = totalCard?.querySelector('.text-2xl.font-bold');
  if (totalValue && totalValue.textContent !== String(total)) totalValue.textContent = String(total);

  let nucsCard = document.getElementById('bkDashboardNucsStat');
  if (!nucsCard) {
    nucsCard = document.createElement('div');
    nucsCard.id = 'bkDashboardNucsStat';
    nucsCard.className = 'rounded-2xl border border-yellow-500/20 bg-black/40';
    nucsCard.innerHTML = '<div class="px-4 pt-4 pb-2"><div class="text-xs font-semibold uppercase tracking-wider text-yellow-300">Nucs</div></div><div class="px-4 pb-4"><div class="text-2xl font-bold text-yellow-100" data-role="nucs-dashboard-value">0</div></div>';
    singlesCard.insertAdjacentElement('afterend', nucsCard);
  }
  const value = nucsCard.querySelector('[data-role="nucs-dashboard-value"]');
  if (value && value.textContent !== String(nucs)) value.textContent = String(nucs);
}

function bkInfoExtraApply() {
  bkInfoExtraApplyInformation();
  bkInfoExtraApplyDashboard();
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
document.addEventListener('change', () => setTimeout(bkInfoExtraSchedule, 0), true);
bkInfoExtraSchedule();
