let bkEditExtraRaf = 0;

function bkEditExtraHives() {
  try {
    const value = JSON.parse(localStorage.getItem('bk.hives') || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function bkEditExtraSave(hiveId, patch) {
  const hives = bkEditExtraHives();
  const index = hives.findIndex((hive) => hive.id === hiveId);
  if (index < 0) return;
  const current = hives[index] || {};
  const nucs = patch.nucs == null
    ? Math.max(0, parseInt(String(current.nucs ?? 0), 10) || 0)
    : Math.max(0, parseInt(String(patch.nucs ?? 0), 10) || 0);
  hives[index] = {
    ...current,
    ...patch,
    nucs,
    numHives:
      Math.max(0, parseInt(String(current.singleHives ?? 0), 10) || 0) +
      Math.max(0, parseInt(String(current.doubleHives ?? 0), 10) || 0) +
      nucs,
  };
  try { localStorage.setItem('bk.hives', JSON.stringify(hives)); } catch {}
}

function bkEditExtraModal() {
  return Array.from(document.querySelectorAll('.fixed.inset-0.z-50')).find((modal) => {
    const title = modal.querySelector('.mb-3.font-semibold.text-yellow-200')?.textContent?.trim() || '';
    return title.startsWith('Edit ');
  }) || null;
}

function bkEditExtraApply() {
  const modal = bkEditExtraModal();
  if (!modal) return;
  const title = modal.querySelector('.mb-3.font-semibold.text-yellow-200')?.textContent?.trim() || '';
  const apiaryName = title.replace(/^Edit\s+/, '').trim();
  const hive = bkEditExtraHives().find((item) => String(item?.name || '').trim() === apiaryName);
  if (!hive) return;

  const grid = modal.querySelector('.grid.grid-cols-1.gap-2');
  if (!grid) return;
  const labels = Array.from(grid.children).filter((item) => item.tagName === 'LABEL');
  const singlesLabel = labels.find((label) => label.textContent.trim().startsWith('Single Hives'));
  if (!singlesLabel) return;

  let nucsLabel = modal.querySelector('#bkEditNucsField');
  if (!nucsLabel) {
    nucsLabel = document.createElement('label');
    nucsLabel.id = 'bkEditNucsField';
    nucsLabel.className = 'text-sm';
    nucsLabel.appendChild(document.createTextNode('Nucs'));
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.className = 'w-full rounded-xl border border-yellow-500/30 bg-black/40 px-3 py-2 text-yellow-100';
    input.value = String(Math.max(0, parseInt(String(hive.nucs ?? 0), 10) || 0));
    nucsLabel.appendChild(input);
    singlesLabel.insertAdjacentElement('afterend', nucsLabel);
  }

  let foodLabel = modal.querySelector('#bkEditFoodStoresField');
  if (!foodLabel) {
    foodLabel = document.createElement('label');
    foodLabel.id = 'bkEditFoodStoresField';
    foodLabel.className = 'text-sm';
    foodLabel.appendChild(document.createTextNode('Food Stores'));
    const select = document.createElement('select');
    select.className = 'w-full rounded-xl border border-yellow-500/30 bg-black/40 px-3 py-2 text-yellow-100';
    ['Low', 'Medium', 'High'].forEach((value) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
    select.value = ['Low', 'Medium', 'High'].includes(hive.foodStores) ? hive.foodStores : 'Medium';
    foodLabel.appendChild(select);
    nucsLabel.insertAdjacentElement('afterend', foodLabel);
  }

  if (modal.dataset.bkExtraSaveBound !== '1') {
    modal.dataset.bkExtraSaveBound = '1';
    const buttons = Array.from(modal.querySelectorAll('button'));
    const saveButton = buttons.find((button) => button.textContent.trim() === 'Save');
    if (saveButton) {
      saveButton.addEventListener('click', () => {
        const hiveId = hive.id;
        const nucsInput = modal.querySelector('#bkEditNucsField input');
        const foodSelect = modal.querySelector('#bkEditFoodStoresField select');
        const nucs = Math.max(0, parseInt(String(nucsInput?.value ?? 0), 10) || 0);
        const foodStores = ['Low', 'Medium', 'High'].includes(foodSelect?.value) ? foodSelect.value : 'Medium';

        /* React saves its form first. Re-apply these two fields after that save,
           then remount so React reads the committed values back from storage. */
        window.setTimeout(() => {
          bkEditExtraSave(hiveId, { nucs, foodStores });
          window.dispatchEvent(new CustomEvent('bk:apiary-extra-saved'));
        }, 0);
      });
    }
  }
}

function bkEditExtraSchedule() {
  if (bkEditExtraRaf) return;
  bkEditExtraRaf = requestAnimationFrame(() => {
    bkEditExtraRaf = 0;
    bkEditExtraApply();
  });
}

new MutationObserver(bkEditExtraSchedule).observe(document.getElementById('root'), { childList: true, subtree: true });
document.addEventListener('click', () => setTimeout(bkEditExtraSchedule, 0), true);
bkEditExtraSchedule();
