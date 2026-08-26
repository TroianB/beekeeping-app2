let bkTreatmentUiRaf = 0;
let bkTreatmentModal = null;
let bkTreatmentActiveBlock = null;

function bkTreatmentBlocks() {
  return Array.from(document.querySelectorAll('#root .fixed.inset-0.z-50 .space-y-2')).filter((box) => {
    return box.querySelector('.bk-remove-treatment-button') && box.querySelector('.bk-new-treatment-button') && box.querySelector('select');
  });
}

function bkTreatmentCurrentBlock(block) {
  if (block?.isConnected) return block;
  const blocks = bkTreatmentBlocks();
  return blocks[0] || null;
}

function bkTreatmentSelectFromBlock(block) {
  const currentBlock = bkTreatmentCurrentBlock(block);
  if (!currentBlock) return null;
  const selects = Array.from(currentBlock.querySelectorAll('select'));
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
  const currentBlock = bkTreatmentCurrentBlock(block);
  if (currentBlock) bkTreatmentActiveBlock = currentBlock;
  const select = bkTreatmentSelectFromBlock(currentBlock);
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
      const liveSelect = bkTreatmentSelectFromBlock(bkTreatmentActiveBlock);
      bkTreatmentDispatchSelect(liveSelect, option.value);
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

function bkTreatmentRefreshAfterAdd(modal, block, treatmentName, attempt = 0) {
  if (!modal?.isConnected) return;
  const currentBlock = bkTreatmentCurrentBlock(block);
  if (currentBlock) bkTreatmentActiveBlock = currentBlock;
  const select = bkTreatmentSelectFromBlock(currentBlock);
  const exists = Array.from(select?.options || []).some((option) => {
    return String(option.value || '').trim().toLowerCase() === String(treatmentName || '').trim().toLowerCase();
  });

  if (exists) {
    bkTreatmentHideAddRow(modal);
    bkTreatmentRenderModalList(modal, currentBlock);
    const remove = modal.querySelector('.bk-treatment-modal-remove');
    const realRemove = currentBlock?.querySelector('.bk-remove-treatment-button');
    if (remove) remove.disabled = Boolean(realRemove?.disabled);
    return;
  }

  if (attempt >= 40) return;
  window.setTimeout(() => bkTreatmentRefreshAfterAdd(modal, currentBlock, treatmentName, attempt + 1), 25);
}

function bkTreatmentCommitAdd(modal, block) {
  const input = modal?.querySelector('.bk-treatment-modal-add-input');
  const name = String(input?.value || '').trim();
  let currentBlock = bkTreatmentCurrentBlock(block);
  if (!name || !currentBlock) return;
  bkTreatmentActiveBlock = currentBlock;

  const realAddToggle = currentBlock.querySelector('.bk-new-treatment-button');
  realAddToggle?.click();

  window.setTimeout(() => {
    currentBlock = bkTreatmentCurrentBlock(currentBlock);
    if (!currentBlock) return;
    bkTreatmentActiveBlock = currentBlock;

    const nativeInput = Array.from(currentBlock.querySelectorAll('input')).find((item) => {
      return /new treatment name/i.test(String(item.placeholder || ''));
    });
    const nativeAdd = Array.from(currentBlock.querySelectorAll('button')).find((button) => {
      return button.textContent.trim() === 'Add';
    });

    if (!nativeInput || !nativeAdd) {
      window.setTimeout(() => bkTreatmentCommitAddIntoNative(modal, currentBlock, name, 1), 25);
      return;
    }
    bkTreatmentFillAndSaveNative(modal, currentBlock, nativeInput, nativeAdd, name);
  }, 0);
}

function bkTreatmentCommitAddIntoNative(modal, block, name, attempt = 0) {
  if (!modal?.isConnected || attempt > 20) return;
  const currentBlock = bkTreatmentCurrentBlock(block);
  if (!currentBlock) return;
  bkTreatmentActiveBlock = currentBlock;

  const nativeInput = Array.from(currentBlock.querySelectorAll('input')).find((item) => {
    return /new treatment name/i.test(String(item.placeholder || ''));
  });
  const nativeAdd = Array.from(currentBlock.querySelectorAll('button')).find((button) => button.textContent.trim() === 'Add');

  if (!nativeInput || !nativeAdd) {
    window.setTimeout(() => bkTreatmentCommitAddIntoNative(modal, currentBlock, name, attempt + 1), 25);
    return;
  }
  bkTreatmentFillAndSaveNative(modal, currentBlock, nativeInput, nativeAdd, name);
}

function bkTreatmentFillAndSaveNative(modal, block, nativeInput, nativeAdd, name) {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  descriptor?.set?.call(nativeInput, name);
  nativeInput.dispatchEvent(new Event('input', { bubbles: true }));
  nativeInput.dispatchEvent(new Event('change', { bubbles: true }));

  window.setTimeout(() => {
    const liveBlock = bkTreatmentCurrentBlock(block);
    const liveAdd = Array.from(liveBlock?.querySelectorAll('button') || []).find((button) => button.textContent.trim() === 'Add');
    liveAdd?.click();
    bkTreatmentRefreshAfterAdd(modal, liveBlock, name);
  }, 0);
}

function bkTreatmentOpenModal(block) {
  const currentBlock = bkTreatmentCurrentBlock(block);
  if (!currentBlock) return;
  bkTreatmentCloseModal();
  bkTreatmentActiveBlock = currentBlock;

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

  modal.querySelector('.bk-treatment-modal-add')?.addEventListener('click', () => bkTreatmentShowAddRow(modal));
  modal.querySelector('.bk-treatment-modal-add-save')?.addEventListener('click', () => bkTreatmentCommitAdd(modal, bkTreatmentActiveBlock));
  modal.querySelector('.bk-treatment-modal-add-cancel')?.addEventListener('click', () => bkTreatmentHideAddRow(modal));
  modal.querySelector('.bk-treatment-modal-add-input')?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') bkTreatmentCommitAdd(modal, bkTreatmentActiveBlock);
    if (event.key === 'Escape') bkTreatmentHideAddRow(modal);
  });

  const remove = modal.querySelector('.bk-treatment-modal-remove');
  const realRemove = currentBlock.querySelector('.bk-remove-treatment-button');
  if (remove) {
    remove.disabled = Boolean(realRemove?.disabled);
    remove.addEventListener('click', () => {
      if (remove.disabled) return;
      const liveBlock = bkTreatmentCurrentBlock(bkTreatmentActiveBlock);
      liveBlock?.querySelector('.bk-remove-treatment-button')?.click();
      window.setTimeout(() => {
        const refreshedBlock = bkTreatmentCurrentBlock(liveBlock);
        if (refreshedBlock) bkTreatmentActiveBlock = refreshedBlock;
        bkTreatmentRenderModalList(modal, refreshedBlock);
        const currentRemove = refreshedBlock?.querySelector('.bk-remove-treatment-button');
        remove.disabled = Boolean(currentRemove?.disabled);
      }, 0);
    });
  }

  document.body.appendChild(modal);
  bkTreatmentModal = modal;
  bkTreatmentRenderModalList(modal, currentBlock);
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
