import React, { useEffect, useMemo, useState } from "react";
import BeekeepingApp from "./App.jsx";

const todayISO = () => new Date().toISOString().slice(0, 10);
const fmtDMY = (iso) => {
  if (!iso) return "";
  const [y, m, d] = String(iso).split("T")[0].split("-");
  return y && m && d ? `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}` : String(iso);
};

const storage = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
};

const recordTypes = [
  { id: "queenless", label: "Queenless Check" },
  { id: "queen", label: "Queen Record" },
  { id: "disease", label: "Disease Monitoring" },
];

const emptyForm = {
  type: "queenless",
  date: todayISO(),
  apiaryId: "",
  hive: "",
  queenless: "No",
  queenStatus: "Good",
  mated: "Yes",
  replacementDate: "",
  diseaseType: "None",
  afbCheck: "No",
  varroaLevel: "",
  chalkbrood: "No",
  nosema: "No",
  otherDisease: "",
  comments: "",
};

function Card({ children, className = "" }) {
  return <div className={`rounded-2xl border border-yellow-500/20 bg-black/40 ${className}`}>{children}</div>;
}

function Button({ children, onClick, variant = "solid", className = "", type = "button", disabled = false }) {
  const styles = variant === "solid"
    ? "bg-yellow-500 text-black hover:bg-yellow-400"
    : "border border-yellow-500/40 bg-black/40 text-yellow-300 hover:bg-black/60";
  return <button type={type} disabled={disabled} onClick={onClick} className={`rounded-xl px-3 py-2 text-sm font-semibold ${styles} ${disabled ? "cursor-not-allowed opacity-50" : ""} ${className}`}>{children}</button>;
}

function Input(props) {
  return <input {...props} className={`w-full rounded-xl border border-yellow-500/30 bg-black/40 px-3 py-2 text-yellow-100 outline-none focus:border-yellow-400 ${props.className || ""}`} />;
}

function Select(props) {
  return <select {...props} className={`w-full rounded-xl border border-yellow-500/30 bg-black/40 px-3 py-2 text-yellow-100 outline-none focus:border-yellow-400 ${props.className || ""}`} />;
}

function Textarea(props) {
  return <textarea {...props} className={`w-full rounded-xl border border-yellow-500/30 bg-black/40 px-3 py-2 text-yellow-100 outline-none focus:border-yellow-400 ${props.className || ""}`} />;
}

function Field({ label, children }) {
  return <label className="block text-sm font-semibold text-yellow-200"><span className="mb-1 block">{label}</span>{children}</label>;
}

function loadApiaries() {
  const list = storage.get("bk.hives", []);
  return Array.isArray(list) ? list : [];
}

function recordLabel(type) {
  return recordTypes.find((item) => item.id === type)?.label || "Monitoring Record";
}

function recordSummary(record) {
  if (record.type === "queenless") return `Queenless: ${record.queenless || "No"}`;
  if (record.type === "queen") return `Queen status: ${record.queenStatus || "Unknown"} • Mated: ${record.mated || "No"}${record.replacementDate ? ` • Replacement: ${fmtDMY(record.replacementDate)}` : ""}`;
  if (record.type === "disease") return `Disease: ${record.diseaseType || "None"} • AFB: ${record.afbCheck || "No"}${record.varroaLevel ? ` • Varroa: ${record.varroaLevel}` : ""}`;
  return "Monitoring record";
}

function MonitoringPage({ onBack }) {
  const [apiaries, setApiaries] = useState(() => loadApiaries());
  const [records, setRecords] = useState(() => storage.get("bk.monitoringRecords", []));
  const [form, setForm] = useState(() => emptyForm);
  const [error, setError] = useState("");

  useEffect(() => storage.set("bk.monitoringRecords", records), [records]);

  useEffect(() => {
    const list = loadApiaries();
    setApiaries(list);
    if (!form.apiaryId && list.length) setForm((prev) => ({ ...prev, apiaryId: list[0].id }));
  }, []);

  const selectedApiary = apiaries.find((apiary) => apiary.id === form.apiaryId);
  const recentRecords = useMemo(() => [...records].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 12), [records]);
  const stats = useMemo(() => ({
    total: records.length,
    queenless: records.filter((record) => record.type === "queenless" && record.queenless === "Yes").length,
    disease: records.filter((record) => record.type === "disease" && record.diseaseType && record.diseaseType !== "None").length,
  }), [records]);

  function saveRecord(event) {
    event.preventDefault();
    if (!form.date) return setError("Date is required.");
    if (!form.apiaryId) return setError("Apiary is required.");
    const apiary = apiaries.find((item) => item.id === form.apiaryId);
    const record = {
      id: `M-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      apiaryName: apiary?.name || "Unknown apiary",
      ...form,
    };
    setRecords((prev) => [record, ...prev]);
    setForm((prev) => ({ ...emptyForm, type: prev.type, date: todayISO(), apiaryId: prev.apiaryId }));
    setError("");
  }

  function deleteRecord(id) {
    setRecords((prev) => prev.filter((record) => record.id !== id));
  }

  function exportRecords() {
    const headers = ["date", "recordType", "apiary", "hive", "queenless", "queenStatus", "mated", "replacementDate", "diseaseType", "afbCheck", "varroaLevel", "chalkbrood", "nosema", "otherDisease", "comments"];
    const esc = (value) => /[",\n\r]/.test(String(value ?? "")) ? `"${String(value ?? "").replace(/"/g, '""')}"` : String(value ?? "");
    const rows = records.map((record) => ({
      date: record.date,
      recordType: recordLabel(record.type),
      apiary: record.apiaryName,
      hive: record.hive,
      queenless: record.queenless,
      queenStatus: record.queenStatus,
      mated: record.mated,
      replacementDate: record.replacementDate,
      diseaseType: record.diseaseType,
      afbCheck: record.afbCheck,
      varroaLevel: record.varroaLevel,
      chalkbrood: record.chalkbrood,
      nosema: record.nosema,
      otherDisease: record.otherDisease,
      comments: record.comments,
    }));
    const csv = [headers.join(","), ...rows.map((row) => headers.map((key) => esc(row[key])).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "monitoring-records.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return <main className="min-h-screen bg-neutral-950 px-3 py-4 text-yellow-100 sm:px-5">
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-yellow-500/20 bg-black/50 p-3">
        <div>
          <div className="text-2xl font-black text-yellow-300">Monitoring</div>
          <div className="text-sm text-yellow-100/75">Queenless checks, queen records, and disease monitoring.</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportRecords} disabled={!records.length}>Export Monitoring CSV</Button>
          <Button onClick={onBack}>Back to App</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card className="p-4"><div className="text-xs font-bold uppercase tracking-wide text-yellow-300">Total Records</div><div className="mt-2 text-3xl font-black">{stats.total}</div></Card>
        <Card className="p-4"><div className="text-xs font-bold uppercase tracking-wide text-yellow-300">Queenless Yes</div><div className="mt-2 text-3xl font-black text-orange-300">{stats.queenless}</div></Card>
        <Card className="p-4"><div className="text-xs font-bold uppercase tracking-wide text-yellow-300">Disease Alerts</div><div className="mt-2 text-3xl font-black text-red-300">{stats.disease}</div></Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="p-4">
          <form onSubmit={saveRecord} className="space-y-4">
            <div>
              <div className="mb-2 text-lg font-black text-yellow-200">New monitoring record</div>
              <div className="flex flex-wrap gap-2">
                {recordTypes.map((type) => <Button key={type.id} variant={form.type === type.id ? "solid" : "outline"} onClick={() => setForm((prev) => ({ ...prev, type: type.id }))}>{type.label}</Button>)}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Field label="Date"><Input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></Field>
              <Field label="Apiary"><Select value={form.apiaryId} onChange={(event) => setForm({ ...form, apiaryId: event.target.value })}><option value="">Select Apiary</option>{apiaries.map((apiary) => <option key={apiary.id} value={apiary.id}>{apiary.name}</option>)}</Select></Field>
              <Field label="Hive optional"><Input placeholder="Example: Hive 12" value={form.hive} onChange={(event) => setForm({ ...form, hive: event.target.value })} /></Field>
            </div>

            {selectedApiary && <div className="rounded-xl border border-yellow-500/20 bg-black/30 p-3 text-sm text-yellow-100/80">Recording for <span className="font-bold text-yellow-200">{selectedApiary.name}</span>. Leave Hive optional blank if this applies to the whole Apiary.</div>}

            {form.type === "queenless" && <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Queenless yes/no"><Select value={form.queenless} onChange={(event) => setForm({ ...form, queenless: event.target.value })}><option>No</option><option>Yes</option></Select></Field>
            </div>}

            {form.type === "queen" && <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Field label="Queen status"><Select value={form.queenStatus} onChange={(event) => setForm({ ...form, queenStatus: event.target.value })}><option>Good</option><option>Poor</option><option>Queenless</option><option>Virgin queen</option><option>Mated queen</option><option>Needs replacing</option><option>Replaced</option><option>Unknown</option></Select></Field>
              <Field label="Mated yes/no"><Select value={form.mated} onChange={(event) => setForm({ ...form, mated: event.target.value })}><option>Yes</option><option>No</option><option>Unknown</option></Select></Field>
              <Field label="Replacement date"><Input type="date" value={form.replacementDate} onChange={(event) => setForm({ ...form, replacementDate: event.target.value })} /></Field>
            </div>}

            {form.type === "disease" && <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Field label="Disease type"><Select value={form.diseaseType} onChange={(event) => setForm({ ...form, diseaseType: event.target.value })}><option>None</option><option>AFB</option><option>Varroa</option><option>Chalkbrood</option><option>Nosema</option><option>Other</option><option>Multiple</option></Select></Field>
              <Field label="AFB check"><Select value={form.afbCheck} onChange={(event) => setForm({ ...form, afbCheck: event.target.value })}><option>No</option><option>Yes</option><option>Suspected</option><option>Clear</option></Select></Field>
              <Field label="Varroa level"><Input placeholder="Example: low, medium, 3 mites" value={form.varroaLevel} onChange={(event) => setForm({ ...form, varroaLevel: event.target.value })} /></Field>
              <Field label="Chalkbrood"><Select value={form.chalkbrood} onChange={(event) => setForm({ ...form, chalkbrood: event.target.value })}><option>No</option><option>Yes</option><option>Suspected</option></Select></Field>
              <Field label="Nosema"><Select value={form.nosema} onChange={(event) => setForm({ ...form, nosema: event.target.value })}><option>No</option><option>Yes</option><option>Suspected</option></Select></Field>
              <Field label="Other disease"><Input placeholder="Describe other disease" value={form.otherDisease} onChange={(event) => setForm({ ...form, otherDisease: event.target.value })} /></Field>
            </div>}

            <Field label="Comments"><Textarea rows={5} placeholder="Write field notes here..." value={form.comments} onChange={(event) => setForm({ ...form, comments: event.target.value })} /></Field>
            {error && <div className="rounded-xl border border-red-400/30 bg-red-950/40 p-3 text-sm text-red-200">{error}</div>}
            {!apiaries.length && <div className="rounded-xl border border-yellow-500/30 bg-yellow-950/30 p-3 text-sm text-yellow-100">Add an Apiary first, then come back to Monitoring.</div>}
            <Button type="submit" disabled={!apiaries.length}>Save Monitoring Record</Button>
          </form>
        </Card>

        <Card className="p-4">
          <div className="mb-3 text-lg font-black text-yellow-200">Recent records</div>
          <div className="space-y-3">
            {!recentRecords.length && <div className="rounded-xl border border-yellow-500/20 bg-black/30 p-3 text-sm text-yellow-100/75">No monitoring records yet.</div>}
            {recentRecords.map((record) => <div key={record.id} className="rounded-xl border border-yellow-500/20 bg-black/30 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-black text-yellow-200">{recordLabel(record.type)}</div>
                  <div className="text-sm text-yellow-100/75">{fmtDMY(record.date)} • {record.apiaryName}{record.hive ? ` • ${record.hive}` : ""}</div>
                </div>
                <Button variant="outline" className="text-red-300" onClick={() => deleteRecord(record.id)}>Delete</Button>
              </div>
              <div className="mt-2 text-sm font-semibold text-yellow-100">{recordSummary(record)}</div>
              {record.comments && <div className="mt-2 whitespace-pre-wrap rounded-lg bg-black/30 p-2 text-sm text-yellow-100/80">{record.comments}</div>}
            </div>)}
          </div>
        </Card>
      </div>
    </div>
  </main>;
}

export default function MonitoringShell() {
  const [showMonitoring, setShowMonitoring] = useState(() => window.location.hash === "#monitoring");

  useEffect(() => {
    const onHashChange = () => setShowMonitoring(window.location.hash === "#monitoring");
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  function openMonitoring() {
    window.location.hash = "monitoring";
    setShowMonitoring(true);
  }

  function closeMonitoring() {
    history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    setShowMonitoring(false);
  }

  if (showMonitoring) return <MonitoringPage onBack={closeMonitoring} />;

  return <>
    <BeekeepingApp />
    <button onClick={openMonitoring} className="fixed bottom-4 right-4 z-50 rounded-2xl border border-yellow-500/40 bg-yellow-500 px-4 py-3 text-sm font-black text-black shadow-2xl hover:bg-yellow-400">Monitoring</button>
  </>;
}
