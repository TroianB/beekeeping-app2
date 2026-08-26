let bkTreatmentUiRaf = 0;
let bkTreatmentModal = null;
let bkTreatmentActiveBlock = null;

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

function bkTreatmentCloseModal() {
  bkTreatmentModal?.remove();
  bkTreatmentModal = null;
  bkTreatmentActiveBlock = null;
}

function bkTreatmentRenderModalList(modal, block) {
  const select = bkTreatmentSelectFromBlock(block);
  const list = modal?.querySelector('.bk-treatment-modal-list');
  if (!select || !list) return;

  const options = Array.from(select.options || []).filter((option) => String(option.value || '').trim());
  list.replaceChildren();

  if (options.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'bk-treatment-modal-empty';
    empty.textContent = 'No treatments yet.';
    list.appendChild(empty);
    return;
  }

  options.forEach((option) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'bk-treatment-modal-option';
    if (option.value === select.value) button.classList.add('bk-treatment-modal-option-selected');
    button.textContent = option.textContent;
    button.addEventListener('click', () => {
      bkTreatmentDispatchSelect(select, option.value);
      bkTreatmentCloseModal();
    });
    list.appendChild(button);
  });
}

function bkTreatmentHideAddRow(modal) {
  const row = modal?.querySelector('.bk-treatment-modal-add-row');
  const input = modal?.querySelector('.bk-treatment-modal-add-input');
  if (row) row.hidden = true;
  if (input) input.value = '';
}

function bkTreatmentShowAddRow(modal) {
  const row = modal?.querySelector('.bk-treatment-modal-add-row');
  const input = modal?.querySelector('.bk-treatment-modal-add-input');
  if (row) row.hidden = false;
  window.setTimeout(() => input?.focus(), 0);
}

function bkTreatmentCommitAdd(modal, block) {
  const input = modal?.querySelector('.bk-treatment-modal-add-input');
  const name = String(input?.value || '').trim();
  if (!name || !block) return;

  const realAddToggle = block.querySelector('.bk-new-treatment-button');
  realAddToggle?.click();

  window.setTimeout(() => {
    const nativeInput = Array.from(block.querySelectorAll('input')).find((item) => {
      return /new treatment name/i.test(String(item.placeholder || ''));
    });
    const nativeAdd = Array.from(block.querySelectorAll('button')).find((button) => {
      return button.textContent.trim() === 'Add' && !button.classList.contains('bk-treatment-modal-add');
    });

    if (!nativeInput || !nativeAdd) return;
    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    descriptor?.set?.call(nativeInput, name);
    nativeInput.dispatchEvent(new Event('input', { bubbles: true }));
    nativeInput.dispatchEvent(new Event('change', { bubbles: true }));

    window.setTimeout(() => {
      nativeAdd.click();
      window.setTimeout(() => {
        bkTreatmentHideAddRow(modal);
        bkTreatmentRenderModalList(modal, block);
      }, 0);
    }, 0);
  }, 0);
}

function bkTreatmentOpenModal(block) {
  if (!block) return;
  bkTreatmentCloseModal();
  bkTreatmentActiveBlock = block;

  const modal = document.createElement('div');
  modal.className = 'bk-treatment-modal';
  modal.innerHTML = `
    <div class="bk-treatment-modal-card" role="dialog" aria-modal="true" aria-label="Treatments">
      <div class="bk-treatment-modal-toolbar">
        <button type="button" class="bk-treatment-modal-add">Add</button>
        <button type="button" class="bk-treatment-modal-remove">Remove</button>
      </div>
      <div class="bk-treatment-modal-add-row" hidden>
        <input type="text" class="bk-treatment-modal-add-input" placeholder="New treatment name" />
        <button type="button" class="bk-treatment-modal-add-save">Save</button>
        <button type="button" class="bk-treatment-modal-add-cancel">Cancel</button>
      </div>
      <div class="bk-treatment-modal-list"></div>
    </div>
  `;

  modal.addEventListener('click', (event) => {
    if (event.target === modal) bkTreatmentCloseModal();
  });

  modal.querySelector('.bk-treatment-modal-add')?.addEventListener('click', () => {
    bkTreatmentShowAddRow(modal);
  });
  modal.querySelector('.bk-treatment-modal-add-save')?.addEventListener('click', () => {
    bkTreatmentCommitAdd(modal, block);
  });
  modal.querySelector('.bk-treatment-modal-add-cancel')?.addEventListener('click', () => {
    bkTreatmentHideAddRow(modal);
  });
  modal.querySelector('.bk-treatment-modal-add-input')?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') bkTreatmentCommitAdd(modal, block);
    if (event.key === 'Escape') bkTreatmentHideAddRow(modal);
  });

  const remove = modal.querySelector('.bk-treatment-modal-remove');
  const realRemove = block.querySelector('.bk-remove-treatment-button');
  if (remove) {
    remove.disabled = Boolean(realRemove?.disabled);
    remove.addEventListener('click', () => {
      if (remove.disabled) return;
      realRemove?.click();
      window.setTimeout(() => {
        bkTreatmentRenderModalList(modal, block);
        const currentRemove = block.querySelector('.bk-remove-treatment-button');
        remove.disabled = Boolean(currentRemove?.disabled);
      }, 0);
    });
  }

  document.body.appendChild(modal);
  bkTreatmentModal = modal;
  bkTreatmentRenderModalList(modal, block);
}

function bkTreatmentPrepareBlock(block) {
  const select = bkTreatmentSelectFromBlock(block);
  if (!select) return;
  select.classList.add('bk-treatment-native-select');
  block.querySelector('.bk-new-treatment-button')?.classList.add('bk-treatment-original-control');
  block.querySelector('.bk-remove-treatment-button')?.classList.add('bk-treatment-original-control');
}

function bkTreatmentApply() {
  bkTreatmentUiRaf = 0;
  bkTreatmentBlocks().forEach(bkTreatmentPrepareBlock);
}

function bkTreatmentSchedule() {
  if (bkTreatmentUiRaf) return;
  bkTreatmentUiRaf = window.requestAnimationFrame(bkTreatmentApply);
}

function bkTreatmentFindBlockFromInButton(button) {
  const row = button?.parentElement;
  const treatmentRoot = row?.parentElement;
  if (!treatmentRoot) return null;
  return bkTreatmentBlocks().find((block) => treatmentRoot.contains(block)) || null;
}

new MutationObserver(bkTreatmentSchedule).observe(document.documentElement, { childList: true, subtree: true });

document.addEventListener('click', (event) => {
  const button = event.target.closest?.('button');
  if (!button || button.textContent.trim() !== 'In') return;
  window.setTimeout(() => {
    bkTreatmentSchedule();
    const block = bkTreatmentFindBlockFromInButton(button) || bkTreatmentBlocks()[0];
    if (block) bkTreatmentOpenModal(block);
  }, 0);
}, true);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && bkTreatmentModal) bkTreatmentCloseModal();
}, true);

bkTreatmentSchedule();
