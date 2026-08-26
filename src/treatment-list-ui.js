let bkTreatmentUiRaf = 0;

function bkTreatmentSelects() {
  return Array.from(document.querySelectorAll('#root select')).filter((select) => {
    return Array.from(select.options || []).some((option) => /select/i.test(String(option.textContent || '')))
      && select.closest('.fixed.inset-0.z-50');
  });
}

function bkTreatmentDispatchSelect(select, value) {
  if (!select) return;
  const descriptor = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
  descriptor?.set?.call(select, value);
  select.dispatchEvent(new Event('change', { bubbles: true }));
}

function bkTreatmentRenderList(wrapper, select) {
  let list = wrapper.querySelector('.bk-treatment-list');
  if (!list) {
    list = document.createElement('div');
    list.className = 'bk-treatment-list';
    wrapper.appendChild(list);
  }

  const options = Array.from(select.options || []).filter((option) => String(option.value || '').trim());
  const signature = options.map((option) => `${option.value}\u0001${option.textContent}`).join('\u0002');
  if (list.dataset.signature !== signature) {
    list.dataset.signature = signature;
    list.replaceChildren();
    options.forEach((option) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'bk-treatment-option';
      button.dataset.treatmentValue = option.value;
      button.textContent = option.textContent;
      button.addEventListener('click', () => bkTreatmentDispatchSelect(select, option.value));
      list.appendChild(button);
    });
  }

  list.querySelectorAll('.bk-treatment-option').forEach((button) => {
    button.classList.toggle('bk-treatment-option-selected', button.dataset.treatmentValue === select.value);
  });
}

function bkTreatmentPrepareSelect(select) {
  const treatmentBox = select.closest('.space-y-2');
  if (!treatmentBox) return;

  let wrapper = treatmentBox.querySelector(':scope > .bk-treatment-picker');
  if (!wrapper) {
    wrapper = document.createElement('div');
    wrapper.className = 'bk-treatment-picker';
    treatmentBox.insertBefore(wrapper, treatmentBox.firstChild);
  }

  let toolbar = wrapper.querySelector('.bk-treatment-toolbar');
  if (!toolbar) {
    toolbar = document.createElement('div');
    toolbar.className = 'bk-treatment-toolbar';
    wrapper.appendChild(toolbar);
  }

  const remove = treatmentBox.querySelector('.bk-remove-treatment-button');
  const add = treatmentBox.querySelector('.bk-new-treatment-button');

  if (add && add.parentElement !== toolbar) {
    add.textContent = 'Add Treatment';
    toolbar.appendChild(add);
  }
  if (remove && remove.parentElement !== toolbar) {
    remove.textContent = 'Remove Treatment';
    toolbar.appendChild(remove);
  }

  select.classList.add('bk-treatment-native-select');
  if (select.parentElement && select.parentElement !== wrapper) {
    select.parentElement.classList.add('bk-treatment-old-select-row');
  }

  bkTreatmentRenderList(wrapper, select);
}

function bkTreatmentApply() {
  bkTreatmentUiRaf = 0;
  bkTreatmentSelects().forEach(bkTreatmentPrepareSelect);
}

function bkTreatmentSchedule() {
  if (bkTreatmentUiRaf) return;
  bkTreatmentUiRaf = window.requestAnimationFrame(bkTreatmentApply);
}

new MutationObserver(bkTreatmentSchedule).observe(document.documentElement, { childList: true, subtree: true });
document.addEventListener('change', (event) => {
  if (event.target.matches?.('.bk-treatment-native-select')) bkTreatmentSchedule();
}, true);

document.addEventListener('click', (event) => {
  const button = event.target.closest?.('button');
  if (!button || button.textContent.trim() !== 'In') return;
  window.setTimeout(bkTreatmentSchedule, 0);
}, true);

bkTreatmentSchedule();
