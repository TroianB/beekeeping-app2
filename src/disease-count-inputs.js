const DISEASE_PAGE_ID = 'bkDiseaseMonitoringPage';
const COUNT_FIELD_IDS = ['afbLevel', 'chalkbroodLevel', 'nosemaLevel', 'bkOtherLevel'];

function replaceLevelSelect(select) {
  if (!select || select.tagName !== 'SELECT') return;

  const input = document.createElement('input');
  input.type = 'number';
  input.id = select.id;
  input.min = '0';
  input.step = '1';
  input.inputMode = 'numeric';
  input.value = select.value || '0';
  input.setAttribute('aria-label', 'Infected hives');

  const label = select.closest('label');
  const caption = label?.querySelector(':scope > span');
  if (caption) caption.textContent = 'Infected hives';

  select.replaceWith(input);
}

function applyDiseaseCountInputs() {
  const page = document.getElementById(DISEASE_PAGE_ID);
  if (!page) return;

  COUNT_FIELD_IDS.forEach((id) => {
    replaceLevelSelect(page.querySelector(`#${id}`));
  });
}

let scheduled = false;
function scheduleApply() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    applyDiseaseCountInputs();
  });
}

new MutationObserver(scheduleApply).observe(document.documentElement, {
  childList: true,
  subtree: true,
});

scheduleApply();
