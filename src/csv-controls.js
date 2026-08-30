const CSV_CONTROL_ID = "bkImportCsvButton";
const CSV_INPUT_ID = "bkImportCsvInput";

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (quoted) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(cell);
      cell = "";
    } else if (ch === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (ch !== '\r') {
      cell += ch;
    }
  }

  row.push(cell);
  if (row.some((v) => String(v).trim() !== "")) rows.push(row);
  return rows;
}

function toObjects(text) {
  const rows = parseCSV(text);
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => String(h || "").trim());
  return rows.slice(1).map((row) => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] ?? "";
    });
    return obj;
  });
}

function asNumber(value) {
  const n = parseInt(String(value ?? "0"), 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function importRows(rows) {
  if (!rows.length) throw new Error("No rows found in the CSV file.");

  const first = rows[0];
  const headers = Object.keys(first).map((h) => h.toLowerCase());

  if (headers.includes("name") && (headers.includes("singlehives") || headers.includes("doublehives") || headers.includes("numhives"))) {
    const hives = rows.map((row, index) => {
      const singleHives = asNumber(row.singleHives);
      const doubleHives = asNumber(row.doubleHives);
      return {
        id: String(row.id || `A-${String(index + 1).padStart(3, "0")}`),
        name: String(row.name || `Apiary ${index + 1}`).trim(),
        strength: String(row.strength || "").trim(),
        singleHives,
        doubleHives,
        numHives: singleHives + doubleHives,
        notes: String(row.notes || ""),
        lastInspection: String(row.lastInspection || new Date().toISOString().slice(0, 10)),
        inTreatment: String(row.inTreatment || "false").toLowerCase() === "true",
        treatmentName: String(row.treatmentName || ""),
        treatmentDate: String(row.treatmentDate || ""),
      };
    });

    localStorage.setItem("bk.hives", JSON.stringify(hives));
    return "Apiaries CSV imported.";
  }

  if (headers.includes("title") && headers.includes("due")) {
    const tasks = rows.map((row, index) => ({
      id: String(row.id || `T-${Date.now()}-${index}`),
      title: String(row.title || `Task ${index + 1}`).trim(),
      hiveId: String(row.hiveId || ""),
      due: String(row.due || new Date().toISOString().slice(0, 10)),
      status: String(row.status || "To Do"),
      priority: String(row.priority || "Medium"),
    }));

    localStorage.setItem("bk.tasks", JSON.stringify(tasks));
    return "Tasks CSV imported.";
  }

  throw new Error("This CSV does not look like an apiaries.csv or tasks.csv export.");
}

function addCsvImportControls() {
  // Only inspect the real React root. Swipe snapshots can contain cloned IDs;
  // they must never prevent the live Import CSV control from being restored.
  const root = document.querySelector('body > #root');
  const buttonRow = root?.querySelector(':scope > .mx-auto > div.mb-4.flex > div:last-child');
  if (!buttonRow) return false;
  if (buttonRow.querySelector(`#${CSV_CONTROL_ID}`)) return true;

  buttonRow.style.flexWrap = "wrap";
  buttonRow.style.marginRight = "0";

  const input = document.createElement("input");
  input.id = CSV_INPUT_ID;
  input.type = "file";
  input.accept = ".csv,text/csv";
  input.style.display = "none";

  const button = document.createElement("button");
  button.id = CSV_CONTROL_ID;
  button.type = "button";
  button.textContent = "Import CSV";
  button.className = "rounded-xl px-3 py-2 text-sm border border-yellow-500/40 bg-black/40 text-yellow-300 hover:bg-black/60";
  button.style.position = "relative";
  button.style.zIndex = "2";

  button.addEventListener("click", () => input.click());
  input.addEventListener("change", async () => {
    const file = input.files && input.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const message = importRows(toObjects(text));
      alert(`${message} The app will refresh now.`);
      window.location.reload();
    } catch (error) {
      alert(error?.message || "CSV import failed.");
    } finally {
      input.value = "";
    }
  });

  buttonRow.appendChild(button);
  buttonRow.appendChild(input);
  return true;
}

// The screen-transition controller calls this immediately after React switches
// views, so the destination is complete before it is revealed.
window.bkEnsureCsvImportControls = addCsvImportControls;

const observer = new MutationObserver((mutations) => {
  const onlySwipeSnapshotChanges = mutations.length > 0 && mutations.every((mutation) => {
    const target = mutation.target;
    return target instanceof Element && target.closest('#bkPageSwipeOverlay');
  });
  if (!onlySwipeSnapshotChanges) addCsvImportControls();
});
observer.observe(document.body, { childList: true, subtree: true });
addCsvImportControls();
