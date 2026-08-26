let bkTreatmentUiRaf = 0;
let bkTreatmentModal = null;
let bkTreatmentActiveBlock = null;
let bkTreatmentActiveFormModal = null;
let bkTreatmentAddBusy = false;

function bkTreatmentBlocks(root = document) {
  return Array.from(root.querySelectorAll('#root .fixed.inset-0.z-50 .space-y-2, .space-y-2')).filter((box) => {
    return box.querySelector('.bk-remove-treatment-button') && box.querySelector('.bk-new-treatment-button') && box.querySelector('select');
  });
}

function bkTreatmentFormModalFromBlock(block) {
  return block?.closest?.('#root .fixed.inset-0.z-50') || null;
}

function bkTreatmentBlocksInActiveModal() {
  const modal = bkTreatmentActiveFormModal;
  if (!modal?.isConnected) return [];
  return Array.from(modal.querySelectorAll('.space-y-2')).filter((box) => {
    return box.querySelector('.bk-remove-treatment-button') && box.querySelector('.bk-new-treatment-button') && box.querySelector('select');
  });
}

function bkTreatmentCurrentBlock(block) {
  if (block?.isConnected) return block;

  const scoped = bkTreatmentBlocksInActiveModal();
  if (scoped.length) return scoped[0];

  if (!bkTreatmentActiveFormModal) {
    const blocks = bkTreatmentBlocks(document);
    return blocks[0] || null;
  }
  return null;
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
  bkTreatmentActiveFormModal = null;
  bkTreatmentAddBusy = false;
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

function bkTreatmentSetAddBusy(modal, busy) {
  bkTreatmentAddBusy = busy;
  const save = modal?.querySelector('.bk-treatment-modal-add-save');
  const add = modal?.querySelector('.bk-treatment-modal-add');
  if (save) {
    save.disabled = busy;
    save.textContent = busy ? 'Saving…' : 'Save';
  }
  if (add) add.disabled = busy;
}

function bkTreatmentWaitForNativeAddForm(modal, treatmentName) {
  const root = bkTreatmentActiveFormModal || document.getElementById('root');
  if (!root || !modal?.isConnected) {
    bkTreatmentSetAddBusy(modal, false);
    return;
  }

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    observer.disconnect();
    clearTimeout(timeout);
  };

  const tryFill = () => {
    const currentBlock = bkTreatmentCurrentBlock(bkTreatmentActiveBlock);
    if (!currentBlock) return false;
    bkTreatmentActiveBlock = currentBlock;

    const nativeInput = Array.from(currentBlock.querySelectorAll('input')).find((item) => /new treatment name/i.test(String(item.placeholder || '')));
    if (!nativeInput) return false;

    const nativeAdd = Array.from(currentBlock.querySelectorAll('button')).find((button) => button.textContent.trim() === 'Add');
    if (!nativeAdd) return false;

    finish();

    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    descriptor?.set?.call(nativeInput, treatmentName);
    nativeInput.dispatchEvent(new Event('input', { bubbles: true }));
    nativeInput.dispatchEvent(new Event('change', { bubbles: true }));

    requestAnimationFrame(() => {
      const liveBlock = bkTreatmentCurrentBlock(currentBlock);
      const liveAdd = Array.from(liveBlock?.querySelectorAll('button') || []).find((button) => button.textContent.trim() === 'Add');
      liveAdd?.click();
      bkTreatmentWaitForNewOption(modal, treatmentName);
    });
    return true;
  };

  const observer = new MutationObserver(() => tryFill());
  observer.observe(root, { childList: true, subtree: true });
  const timeout = window.setTimeout(() => {
    finish();
    bkTreatmentSetAddBusy(modal, false);
  }, 2000);

  tryFill();
}

function bkTreatmentWaitForNewOption(modal, treatmentName) {
  const root = bkTreatmentActiveFormModal || document.getElementById('root');
  if (!root || !modal?.isConnected) {
    bkTreatmentSetAddBusy(modal, false);
    return;
  }

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    observer.disconnect();
    clearTimeout(timeout);
  };

  const tryRefresh = () => {
    const currentBlock = bkTreatmentCurrentBlock(bkTreatmentActiveBlock);
    if (!currentBlock) return false;
    bkTreatmentActiveBlock = currentBlock;
    const select = bkTreatmentSelectFromBlock(currentBlock);
    const exists = Array.from(select?.options || []).some((option) => String(option.value || '').trim().toLowerCase() === treatmentName.toLowerCase());
    if (!exists) return false;

    finish();
    bkTreatmentHideAddRow(modal);
    bkTreatmentRenderModalList(modal, currentBlock);
    bkTreatmentSetAddBusy(modal, false);
    return true;
  };

  const observer = new MutationObserver(() => tryRefresh());
  observer.observe(root, { childList: true, subtree: true });
  const timeout = window.setTimeout(() => {
    finish();
    bkTreatmentSetAddBusy(modal, false);
    bkTreatmentRenderModalList(modal, bkTreatmentActiveBlock);
  }, 2000);

  tryRefresh();
}

function bkTreatmentRefreshAfterRemove(modal, block, removedName, attempt = 0) {
  if (!modal?.isConnected) return;
  const currentBlock = bkTreatmentCurrentBlock(block);
  if (currentBlock) bkTreatmentActiveBlock = currentBlock;
  const select = bkTreatmentSelectFromBlock(currentBlock);
  const stillExists = Array.from(select?.options || []).some((option) => {
    return String(option.value || '').trim().toLowerCase() === String(removedName || '').trim().toLowerCase();
  });

  if (!stillExists) {
    bkTreatmentRenderModalList(modal, currentBlock);
    const remove = modal.querySelector('.bk-treatment-modal-remove');
    const realRemove = currentBlock?.querySelector('.bk-remove-treatment-button');
    if (remove) remove.disabled = Boolean(realRemove?.disabled);
    return;
  }

  if (attempt >= 40) {
    bkTreatmentRenderModalList(modal, currentBlock);
    return;
  }
  window.setTimeout(() => bkTreatmentRefreshAfterRemove(modal, currentBlock, removedName, attempt + 1), 25);
}

function bkTreatmentCommitAdd(modal) {
  if (bkTreatmentAddBusy) return;
  const input = modal?.querySelector('.bk-treatment-modal-add-input');
  const name = String(input?.value || '').trim();
  const currentBlock = bkTreatmentCurrentBlock(bkTreatmentActiveBlock);
  if (!name || !currentBlock) return;

  const select = bkTreatmentSelectFromBlock(currentBlock);
  const alreadyExists = Array.from(select?.options || []).some((option) => String(option.value || '').trim().toLowerCase() === name.toLowerCase());
  if (alreadyExists) {
    bkTreatmentHideAddRow(modal);
    bkTreatmentRenderModalList(modal, currentBlock);
    return;
  }

  bkTreatmentActiveBlock = currentBlock;
  bkTreatmentSetAddBusy(modal, true);
  currentBlock.querySelector('.bk-new-treatment-button')?.click();
  bkTreatmentWaitForNativeAddForm(modal, name);
}

function bkTreatmentOpenModal(block) {
  const currentBlock = bkTreatmentCurrentBlock(block);
  if (!currentBlock) return;
  bkTreatmentCloseModal();
  bkTreatmentActiveBlock = currentBlock;
  bkTreatmentActiveFormModal = bkTreatmentFormModalFromBlock(currentBlock);

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
  modal.querySelector('.bk-treatment-modal-add-save')?.addEventListener('click', () => bkTreatmentCommitAdd(modal));
  modal.querySelector('.bk-treatment-modal-add-cancel')?.addEventListener('click', () => {
    if (!bkTreatmentAddBusy) bkTreatmentHideAddRow(modal);
  });
  modal.querySelector('.bk-treatment-modal-add-input')?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') bkTreatmentCommitAdd(modal);
    if (event.key === 'Escape' && !bkTreatmentAddBusy) bkTreatmentHideAddRow(modal);
  });

  const remove = modal.querySelector('.bk-treatment-modal-remove');
  const realRemove = currentBlock.querySelector('.bk-remove-treatment-button');
  if (remove) {
    remove.disabled = Boolean(realRemove?.disabled);
    remove.addEventListener('click', () => {
      if (remove.disabled) return;
      const liveBlock = bkTreatmentCurrentBlock(bkTreatmentActiveBlock);
      const liveSelect = bkTreatmentSelectFromBlock(liveBlock);
      const removedName = String(liveSelect?.value || '').trim();
      if (!removedName) return;
      liveBlock?.querySelector('.bk-remove-treatment-button')?.click();
      bkTreatmentRefreshAfterRemove(modal, liveBlock, removedName);
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
  bkTreatmentBlocks(document).forEach(bkTreatmentPrepareBlock);
}

function bkTreatmentSchedule() {
  if (bkTreatmentUiRaf) return;
  bkTreatmentUiRaf = window.requestAnimationFrame(bkTreatmentApply);
}

function bkTreatmentFindBlockFromInButton(button) {
  const row = button?.parentElement;
  const treatmentRoot = row?.parentElement;
  if (!treatmentRoot) return null;
  return Array.from(treatmentRoot.querySelectorAll('.space-y-2')).find((block) => {
    return block.querySelector('.bk-remove-treatment-button') && block.querySelector('.bk-new-treatment-button') && block.querySelector('select');
  }) || null;
}

new MutationObserver(bkTreatmentSchedule).observe(document.documentElement, { childList: true, subtree: true });

document.addEventListener('click', (event) => {
  const button = event.target.closest?.('button');
  if (!button || button.textContent.trim() !== 'In') return;
  window.setTimeout(() => {
    bkTreatmentSchedule();
    const block = bkTreatmentFindBlockFromInButton(button);
    if (block) bkTreatmentOpenModal(block);
  }, 0);
}, true);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && bkTreatmentModal && !bkTreatmentAddBusy) bkTreatmentCloseModal();
}, true);

bkTreatmentSchedule();
