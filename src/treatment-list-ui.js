let bkTreatmentModal = null;
let bkTreatmentFormModal = null;
let bkTreatmentBusy = false;
let bkTreatmentRaf = 0;

function bkTreatmentBlockIn(formModal) {
  if (!formModal?.isConnected) return null;
  return Array.from(formModal.querySelectorAll('.space-y-2')).find((box) => {
    return box.querySelector('.bk-remove-treatment-button')
      && box.querySelector('.bk-new-treatment-button')
      && box.querySelector('select');
  }) || null;
}

function bkTreatmentSelect() {
  const block = bkTreatmentBlockIn(bkTreatmentFormModal);
  if (!block) return null;
  const selects = Array.from(block.querySelectorAll('select'));
  return selects.find((select) => Array.from(select.options || []).some((option) => String(option.value || '').trim()))
    || selects[0]
    || null;
}

function bkTreatmentPrepare() {
  bkTreatmentRaf = 0;
  document.querySelectorAll('#root .bk-apiary-edit-modal, #root .fixed.inset-0.z-50').forEach((formModal) => {
    const block = bkTreatmentBlockIn(formModal);
    if (!block) return;
    block.querySelector('select')?.classList.add('bk-treatment-native-select');
    block.querySelector('.bk-new-treatment-button')?.classList.add('bk-treatment-original-control');
    block.querySelector('.bk-remove-treatment-button')?.classList.add('bk-treatment-original-control');
  });
}

function bkTreatmentSchedulePrepare() {
  if (bkTreatmentRaf) return;
  bkTreatmentRaf = requestAnimationFrame(bkTreatmentPrepare);
}

function bkTreatmentDispatchSelect(value) {
  const select = bkTreatmentSelect();
  if (!select) return;
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set;
  if (setter) setter.call(select, value);
  else select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
}

function bkTreatmentClose() {
  bkTreatmentModal?.remove();
  bkTreatmentModal = null;
  bkTreatmentFormModal = null;
  bkTreatmentBusy = false;
}

function bkTreatmentSetBusy(busy) {
  bkTreatmentBusy = busy;
  if (!bkTreatmentModal) return;
  const save = bkTreatmentModal.querySelector('.bk-treatment-modal-add-save');
  const add = bkTreatmentModal.querySelector('.bk-treatment-modal-add');
  const remove = bkTreatmentModal.querySelector('.bk-treatment-modal-remove');
  if (save) {
    save.disabled = busy;
    save.textContent = busy ? 'Saving…' : 'Save';
  }
  if (add) add.disabled = busy;
  if (remove && busy) remove.disabled = true;
}

function bkTreatmentUpdateRemoveState() {
  if (!bkTreatmentModal) return;
  const remove = bkTreatmentModal.querySelector('.bk-treatment-modal-remove');
  const realRemove = bkTreatmentBlockIn(bkTreatmentFormModal)?.querySelector('.bk-remove-treatment-button');
  if (remove) remove.disabled = bkTreatmentBusy || Boolean(realRemove?.disabled);
}

function bkTreatmentRenderList() {
  if (!bkTreatmentModal) return;
  const select = bkTreatmentSelect();
  const list = bkTreatmentModal.querySelector('.bk-treatment-modal-list');
  if (!select || !list) return;

  const options = Array.from(select.options || []).filter((option) => String(option.value || '').trim());
  list.replaceChildren();

  if (!options.length) {
    const empty = document.createElement('div');
    empty.className = 'bk-treatment-modal-empty';
    empty.textContent = 'No treatments yet.';
    list.appendChild(empty);
  } else {
    options.forEach((option) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'bk-treatment-modal-option';
      if (option.value === select.value) button.classList.add('bk-treatment-modal-option-selected');
      button.textContent = option.textContent;
      button.addEventListener('click', () => {
        bkTreatmentDispatchSelect(option.value);
        bkTreatmentClose();
      });
      list.appendChild(button);
    });
  }
  bkTreatmentUpdateRemoveState();
}

function bkTreatmentShowAddRow() {
  const row = bkTreatmentModal?.querySelector('.bk-treatment-modal-add-row');
  const input = bkTreatmentModal?.querySelector('.bk-treatment-modal-add-input');
  if (row) row.hidden = false;
  setTimeout(() => input?.focus(), 0);
}

function bkTreatmentHideAddRow() {
  const row = bkTreatmentModal?.querySelector('.bk-treatment-modal-add-row');
  const input = bkTreatmentModal?.querySelector('.bk-treatment-modal-add-input');
  if (row) row.hidden = true;
  if (input) input.value = '';
}

function bkWaitFor(condition, onSuccess, onFail, timeoutMs = 2000) {
  const root = bkTreatmentFormModal;
  if (!root?.isConnected) {
    onFail?.();
    return;
  }

  let done = false;
  let observer;
  let timer;
  const finish = (success) => {
    if (done) return;
    done = true;
    observer?.disconnect();
    clearTimeout(timer);
    success ? onSuccess?.() : onFail?.();
  };
  const check = () => {
    if (!root.isConnected) return finish(false);
    if (condition()) finish(true);
  };

  observer = new MutationObserver(check);
  observer.observe(root, { childList: true, subtree: true });
  timer = setTimeout(() => finish(false), timeoutMs);
  check();
}

function bkTreatmentAdd() {
  if (bkTreatmentBusy || !bkTreatmentModal || !bkTreatmentFormModal?.isConnected) return;
  const input = bkTreatmentModal.querySelector('.bk-treatment-modal-add-input');
  const name = String(input?.value || '').trim();
  if (!name) return;

  const select = bkTreatmentSelect();
  const exists = Array.from(select?.options || []).some((option) => String(option.value || '').trim().toLowerCase() === name.toLowerCase());
  if (exists) {
    bkTreatmentHideAddRow();
    bkTreatmentRenderList();
    return;
  }

  const block = bkTreatmentBlockIn(bkTreatmentFormModal);
  const addToggle = block?.querySelector('.bk-new-treatment-button');
  if (!addToggle) return;

  bkTreatmentSetBusy(true);
  addToggle.click();

  bkWaitFor(
    () => Boolean(bkTreatmentBlockIn(bkTreatmentFormModal)?.querySelector('input[placeholder="New treatment name"]')),
    () => {
      const liveBlock = bkTreatmentBlockIn(bkTreatmentFormModal);
      const nativeInput = liveBlock?.querySelector('input[placeholder="New treatment name"]');
      const nativeAdd = Array.from(liveBlock?.querySelectorAll('button') || []).find((button) => button.textContent.trim() === 'Add');
      if (!nativeInput || !nativeAdd) {
        bkTreatmentSetBusy(false);
        return;
      }

      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      if (setter) setter.call(nativeInput, name);
      else nativeInput.value = name;
      nativeInput.dispatchEvent(new Event('input', { bubbles: true }));
      nativeInput.dispatchEvent(new Event('change', { bubbles: true }));

      requestAnimationFrame(() => {
        const currentBlock = bkTreatmentBlockIn(bkTreatmentFormModal);
        const currentAdd = Array.from(currentBlock?.querySelectorAll('button') || []).find((button) => button.textContent.trim() === 'Add');
        currentAdd?.click();

        bkWaitFor(
          () => Array.from(bkTreatmentSelect()?.options || []).some((option) => String(option.value || '').trim().toLowerCase() === name.toLowerCase()),
          () => {
            bkTreatmentHideAddRow();
            bkTreatmentSetBusy(false);
            bkTreatmentRenderList();
          },
          () => bkTreatmentSetBusy(false)
        );
      });
    },
    () => bkTreatmentSetBusy(false)
  );
}

function bkTreatmentRemove() {
  if (bkTreatmentBusy || !bkTreatmentModal || !bkTreatmentFormModal?.isConnected) return;
  const select = bkTreatmentSelect();
  const removedName = String(select?.value || '').trim();
  if (!removedName) return;

  const realRemove = bkTreatmentBlockIn(bkTreatmentFormModal)?.querySelector('.bk-remove-treatment-button');
  if (!realRemove || realRemove.disabled) return;

  bkTreatmentBusy = true;
  realRemove.click();

  bkWaitFor(
    () => !Array.from(bkTreatmentSelect()?.options || []).some((option) => String(option.value || '').trim().toLowerCase() === removedName.toLowerCase()),
    () => {
      bkTreatmentBusy = false;
      bkTreatmentRenderList();
    },
    () => {
      bkTreatmentBusy = false;
      bkTreatmentRenderList();
    }
  );
}

function bkTreatmentOpen(formModal) {
  if (!formModal?.isConnected) return;
  const block = bkTreatmentBlockIn(formModal);
  if (!block) return;

  bkTreatmentClose();
  bkTreatmentFormModal = formModal;

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
    if (event.target === modal && !bkTreatmentBusy) bkTreatmentClose();
  });
  modal.querySelector('.bk-treatment-modal-add')?.addEventListener('click', bkTreatmentShowAddRow);
  modal.querySelector('.bk-treatment-modal-remove')?.addEventListener('click', bkTreatmentRemove);
  modal.querySelector('.bk-treatment-modal-add-save')?.addEventListener('click', bkTreatmentAdd);
  modal.querySelector('.bk-treatment-modal-add-cancel')?.addEventListener('click', () => {
    if (!bkTreatmentBusy) bkTreatmentHideAddRow();
  });
  modal.querySelector('.bk-treatment-modal-add-input')?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') bkTreatmentAdd();
    if (event.key === 'Escape' && !bkTreatmentBusy) bkTreatmentHideAddRow();
  });

  document.body.appendChild(modal);
  bkTreatmentModal = modal;
  bkTreatmentRenderList();
}

new MutationObserver(bkTreatmentSchedulePrepare).observe(document.documentElement, { childList: true, subtree: true });

document.addEventListener('click', (event) => {
  const button = event.target.closest?.('button');
  if (!button || button.textContent.trim() !== 'In') return;

  const formModal = button.closest('#root .bk-apiary-edit-modal') || button.closest('#root .fixed.inset-0.z-50');
  if (!formModal) return;

  setTimeout(() => {
    bkTreatmentSchedulePrepare();
    bkTreatmentOpen(formModal);
  }, 0);
}, true);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && bkTreatmentModal && !bkTreatmentBusy) bkTreatmentClose();
}, true);

bkTreatmentSchedulePrepare();
