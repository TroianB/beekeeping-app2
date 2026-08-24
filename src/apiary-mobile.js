function getApiaryDetailPanel() {
  const search = document.querySelector('#root input[placeholder="Search apiaries..."]');
  if (!search) return null;

  let listColumn = search.parentElement;
  while (listColumn && !(typeof listColumn.className === "string" && listColumn.className.includes("space-y-2"))) {
    listColumn = listColumn.parentElement;
  }

  const apiariesGrid = listColumn?.parentElement;
  const detailPanel = apiariesGrid?.children?.[1];
  return detailPanel || null;
}

function scrollApiaryDetailsIntoView() {
  if (!window.matchMedia("(max-width: 768px)").matches) return;

  // In list-only mode the detail screen is fixed and slides over the list.
  // Calling scrollIntoView on that fixed panel also moves the page underneath it,
  // which can cause a visible jump when opening an Apiary.
  if (document.body.classList.contains('bk-apiaries-list-only')) return;

  window.setTimeout(() => {
    const detailPanel = getApiaryDetailPanel();
    if (!detailPanel) return;

    detailPanel.style.scrollMarginTop = "3.75rem";
    detailPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 120);
}

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  if (target.closest("input, button, select, textarea, a")) return;

  const apiaryName = target.closest('#root input[placeholder="Search apiaries..."] + div > div > div.grid span[draggable="true"]');
  if (!apiaryName) return;

  scrollApiaryDetailsIntoView();
});
