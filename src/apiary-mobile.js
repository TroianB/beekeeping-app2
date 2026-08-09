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
