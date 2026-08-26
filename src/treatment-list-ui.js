let bkTreatmentUiRaf = 0;

function bkTreatmentBlocks() {
  return Array.from(document.querySelectorAll('#root .fixed.inset-0.z-50 .space-y-2')).filter((box) => {
    return box.querySelector('.bk-remove-treatment-button') && box.querySelector('.bk-new-treatment-button') && box.querySelector('select');
  });
}

function bkTreatmentSelectFromBlock(block) {
  if (!block) return null;
  const selects = Array.from(block.querySelectorAll('select'));
  return selects.find((select) => Array.from(select.options || []).some((option) => String(option.value || '').trim())) || selects[0] || null;
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

function bkTreatmentEnsureToolbar(wrapper, treatmentBox) {
  let toolbar = wrapper.querySelector('.bk-treatment-toolbar');
  if (!toolbar) {
    toolbar = document.createElement('div');
    toolbar.className = 'bk-treatment-toolbar';
    wrapper.prepend(toolbar);
  }

  let add = toolbar.querySelector('.bk-treatment-add-proxy');
  if (!add) {
    add = document.createElement('button');
    add.type = 'button';
    add.className = 'bk-treatment-add-proxy';
    add.textContent = 'Add Treatment';
    add.addEventListener('click', () => treatmentBox.querySelector('.bk-new-treatment-button')?.click());
    toolbar.appendChild(add);
  }

  let remove = toolbar.querySelector('.bk-treatment-remove-proxy');
  if (!remove) {
    remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'bk-treatment-remove-proxy';
    remove.textContent = 'Remove Treatment';
    remove.addEventListener('click', () => treatmentBox.querySelector('.bk-remove-treatment-button')?.click());
    toolbar.appendChild(remove);
  }

  const realRemove = treatmentBox.querySelector('.bk-remove-treatment-button');
  remove.disabled = Boolean(realRemove?.disabled);
}

function bkTreatmentPrepareBlock(treatmentBox) {
  const select = bkTreatmentSelectFromBlock(treatmentBox);
  if (!select) return;

  let wrapper = treatmentBox.querySelector(':scope > .bk-treatment-picker');
  if (!wrapper) {
    wrapper = document.createElement('div');
    wrapper.className = 'bk-treatment-picker';
    treatmentBox.insertBefore(wrapper, treatmentBox.firstChild);
  }

  bkTreatmentEnsureToolbar(wrapper, treatmentBox);

  select.classList.add('bk-treatment-native-select');
  if (select.parentElement) select.parentElement.classList.add('bk-treatment-old-select-row');
  treatmentBox.querySelector('.bk-new-treatment-button')?.classList.add('bk-treatment-original-control');
  treatmentBox.querySelector('.bk-remove-treatment-button')?.classList.add('bk-treatment-original-control');

  bkTreatmentRenderList(wrapper, select);
}

function bkTreatmentApply() {
  bkTreatmentUiRaf = 0;
  bkTreatmentBlocks().forEach(bkTreatmentPrepareBlock);
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
