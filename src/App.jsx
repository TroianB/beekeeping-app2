import React, { useEffect, useMemo, useState } from "react";

const todayISO = () => new Date().toISOString().slice(0, 10);
const toInt = (v) => { const n = parseInt(String(v ?? 0), 10); return Number.isFinite(n) && n >= 0 ? n : 0; };
const fmtDMY = (iso) => { if (!iso) return ""; const [y,m,d] = String(iso).split("T")[0].split("-"); return y && m && d ? `${d.padStart(2,"0")}/${m.padStart(2,"0")}/${y}` : String(iso); };
const totalOf = (a) => toInt(a.singleHives) + toInt(a.doubleHives);
const treatmentView = (a) => `${a?.treatmentName ? `${a.treatmentName} - ` : ""}${a?.inTreatment ? "In" : "Out"}${a?.treatmentDate ? ` (${fmtDMY(a.treatmentDate)})` : ""}`;
const norm = (s) => String(s || "").trim().toLowerCase();

const storage = {
  get(key, fallback) { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} },
};

const seedHives = [
  { id:"A-001", name:"Sunflower-1", strength:"Strong", singleHives:3, doubleHives:2, numHives:5, notes:"", lastInspection:"2025-08-19", inTreatment:false, treatmentName:"", treatmentDate:"" },
  { id:"A-002", name:"Clover-2", strength:"Weak", singleHives:2, doubleHives:0, numHives:2, notes:"", lastInspection:"2025-08-28", inTreatment:false, treatmentName:"", treatmentDate:"" },
  { id:"A-003", name:"Acacia-3", strength:"Moderate", singleHives:1, doubleHives:3, numHives:4, notes:"", lastInspection:"2025-08-23", inTreatment:false, treatmentName:"", treatmentDate:"" },
];
const seedTasks = [
  { id:"T-001", title:"Oxalic vapor treatment", hiveId:"A-003", due:todayISO(), status:"To Do", priority:"High" },
  { id:"T-002", title:"Add equipment", hiveId:"A-001", due:todayISO(), status:"To Do", priority:"Medium" },
];
const seedTreatments = ["Oxalic", "Apivar", "Formic", "Thymol"];

function cleanHives(list) {
  const used = new Set();
  let nextNum = 1;
  const newId = () => { let id; do { id = `A-${String(nextNum++).padStart(3,"0")}`; } while (used.has(id)); used.add(id); return id; };
  return (Array.isArray(list) ? list : []).map((h) => {
    let id = String(h?.id || "");
    if (!id || used.has(id)) id = newId(); else used.add(id);
    const singleHives = toInt(h.singleHives);
    const doubleHives = toInt(h.doubleHives);
    return { ...h, id, singleHives, doubleHives, numHives: singleHives + doubleHives };
  });
}
function nextHiveId(hives) {
  const used = new Set(hives.map((h) => h.id));
  let n = 1;
  while (used.has(`A-${String(n).padStart(3,"0")}`)) n += 1;
  return `A-${String(n).padStart(3,"0")}`;
}
function validateApiary(form, hives, editingId) {
  const errors = {};
  const name = String(form.name || "").trim();
  const singleHives = toInt(form.singleHives);
  const doubleHives = toInt(form.doubleHives);
  if (!name) errors.name = "Name is required.";
  if (hives.some((h) => norm(h.name) === norm(name) && h.id !== editingId)) errors.name = "This name already exists.";
  return { valid: Object.keys(errors).length === 0, errors, values: { ...form, name, singleHives, doubleHives, numHives: singleHives + doubleHives } };
}
function download(name, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
}
function csv(rows) {
  if (!rows.length) return "";
  const esc = (v) => /[",\n\r]/.test(String(v ?? "")) ? `"${String(v ?? "").replace(/"/g, '""')}"` : String(v ?? "");
  const headers = Object.keys(rows[0]);
  return [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
}

function Card({ children, className="" }) { return <div className={`rounded-2xl border border-yellow-500/20 bg-black/40 ${className}`}>{children}</div>; }
function HeaderBox({ children, className="" }) { return <div className={`px-4 pt-4 pb-2 ${className}`}>{children}</div>; }
function Content({ children, className="" }) { return <div className={`px-4 pb-4 ${className}`}>{children}</div>; }
function Button({ children, onClick, variant="solid", disabled=false, className="", type="button" }) {
  const styles = variant === "solid" ? "bg-yellow-500 text-black hover:bg-yellow-400" : "border border-yellow-500/40 bg-black/40 text-yellow-300 hover:bg-black/60";
  return <button type={type} disabled={disabled} onClick={onClick} className={`rounded-xl px-3 py-2 text-sm ${styles} ${disabled ? "cursor-not-allowed opacity-50" : ""} ${className}`}>{children}</button>;
}
function Input(props) { return <input {...props} className={`w-full rounded-xl border border-yellow-500/30 bg-black/40 px-3 py-2 text-yellow-100 ${props.className || ""}`} />; }
function Textarea(props) { return <textarea {...props} className={`w-full rounded-xl border border-yellow-500/30 bg-black/40 px-3 py-2 text-yellow-100 ${props.className || ""}`} />; }
function Stat({ title, value, accent="text-yellow-100" }) { return <Card><HeaderBox className="pb-2"><div className="text-xs font-semibold uppercase tracking-wider text-yellow-300">{title}</div></HeaderBox><Content><div className={`text-2xl font-bold ${accent}`}>{value}</div></Content></Card>; }
function DetailRow({ label, value, valueClass="" }) { return <div className="flex items-center justify-between rounded-xl border border-yellow-500/20 bg-black/30 px-3 py-2"><span className="opacity-80">{label}</span><span className={`font-bold ${valueClass}`}>{value}</span></div>; }

export default function BeekeepingApp() {
  const [tab, setTab] = useState("dashboard");
  const [hives, setHives] = useState(() => cleanHives(storage.get("bk.hives", seedHives)));
  const [tasks, setTasks] = useState(() => storage.get("bk.tasks", seedTasks));
  const [inventory, setInventory] = useState(() => storage.get("bk.inventory", { boxes: 120 }));
  const [treatments, setTreatments] = useState(() => storage.get("bk.treatments", seedTreatments));
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => storage.set("bk.hives", hives), [hives]);
  useEffect(() => storage.set("bk.tasks", tasks), [tasks]);
  useEffect(() => storage.set("bk.inventory", inventory), [inventory]);
  useEffect(() => storage.set("bk.treatments", treatments), [treatments]);
  useEffect(() => {
    console.assert(totalOf({ singleHives:2, doubleHives:3 }) === 5, "total test failed");
    console.assert(cleanHives([{id:"A-001"},{id:"A-001"}])[0].id !== cleanHives([{id:"A-001"},{id:"A-001"}])[1].id, "unique id test failed");
  }, []);

  const stats = useMemo(() => ({
    total: hives.reduce((s,h) => s + toInt(h.numHives), 0),
    doubles: hives.reduce((s,h) => s + toInt(h.doubleHives), 0),
    singles: hives.reduce((s,h) => s + toInt(h.singleHives), 0),
    todo: tasks.filter((t) => t.status === "To Do").length,
  }), [hives, tasks]);

  function addHive(data) {
    const result = validateApiary(data, hives, null);
    if (!result.valid) return false;
    const values = result.values;
    setHives((prev) => [{ id: nextHiveId(prev), ...values, lastInspection: todayISO(), treatmentDate: values.inTreatment ? (values.treatmentDate || todayISO()) : "" }, ...prev]);
    return true;
  }
  function updateHive(id, data) {
    setHives((prev) => prev.map((h) => h.id === id ? { ...h, ...data, numHives: totalOf(data), lastInspection: todayISO() } : h));
  }
  function addTask(task) { setTasks((prev) => [{ id:`T-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, status:"To Do", ...task }, ...prev]); }
  function updateTask(id, patch) { setTasks((prev) => prev.map((t) => t.id === id ? { ...t, ...patch } : t)); }
  function deleteTask(id) { setTasks((prev) => prev.filter((t) => t.id !== id)); }

  function AppHeader() {
    return <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex gap-2"><button onClick={() => setTab("dashboard")} className={`rounded-xl px-3 py-2 ${tab === "dashboard" ? "bg-yellow-500 text-black" : "border border-yellow-500/30 bg-black/40 text-yellow-200"}`}>Dashboard</button><button onClick={() => setTab("apiaries")} className={`rounded-xl px-3 py-2 ${tab === "apiaries" ? "bg-yellow-500 text-black" : "border border-yellow-500/30 bg-black/40 text-yellow-200"}`}>Apiaries</button></div>
      <div className="flex gap-2"><Button variant="outline" onClick={() => download("beekeeping-backup.json", JSON.stringify({ hives, tasks, inventory, treatments }, null, 2), "application/json")}>Export JSON</Button><Button variant="outline" onClick={() => { download("apiaries.csv", csv(hives), "text/csv"); download("tasks.csv", csv(tasks), "text/csv"); }}>Export CSV</Button></div>
    </div>;
  }

  function Dashboard() {
    return <div className="grid grid-cols-1 gap-4 lg:grid-cols-3"><div className="space-y-4 lg:col-span-2"><div className="grid grid-cols-2 gap-4 md:grid-cols-4"><Stat title="Total Hives" value={stats.total} accent="text-green-400" /><Stat title="Doubles" value={stats.doubles} accent="text-blue-300" /><Stat title="Singles" value={stats.singles} accent="text-white" /><Stat title="To Do" value={stats.todo} /></div><Card><HeaderBox><div className="font-semibold text-yellow-200">To Do</div></HeaderBox><Content><TaskBoard /></Content></Card></div><Card><HeaderBox><div className="font-semibold text-yellow-200">Inventory</div></HeaderBox><Content><label className="block text-sm">Boxes<Input type="number" min="0" value={inventory.boxes} onChange={(e) => setInventory({ boxes: toInt(e.target.value) })} /></label></Content></Card></div>;
  }

  function TaskBoard() {
    const [draft, setDraft] = useState({ title:"", due:todayISO(), priority:"Medium" });
    const todos = tasks.filter((t) => t.status === "To Do").sort((a,b) => String(a.due).localeCompare(String(b.due)));
    return <div className="space-y-3"><div className="space-y-2">{todos.length === 0 && <div className="text-sm opacity-80">All clear! No To Do items.</div>}{todos.map((task) => <TaskItem key={task.id} task={task} />)}</div><div className="rounded-2xl border border-yellow-500/20 bg-black/30 p-3"><div className="mb-2 font-semibold text-yellow-300">+ Add Task</div><div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr,160px,130px,auto]"><Input placeholder="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title:e.target.value })} /><Input type="date" value={draft.due} onChange={(e) => setDraft({ ...draft, due:e.target.value })} /><select value={draft.priority} onChange={(e) => setDraft({ ...draft, priority:e.target.value })} className="rounded-xl border border-yellow-500/30 bg-black/40 px-3 py-2 text-yellow-100"><option>Low</option><option>Medium</option><option>High</option></select><Button onClick={() => { if (!draft.title.trim()) return; addTask(draft); setDraft({ title:"", due:todayISO(), priority:"Medium" }); }}>Create</Button></div></div></div>;
  }
  function TaskItem({ task }) {
    const [edit, setEdit] = useState(false);
    const [title, setTitle] = useState(task.title);
    const save = () => { if (title.trim()) updateTask(task.id, { title:title.trim() }); setEdit(false); };
    return <div className="rounded-xl border border-yellow-500/20 bg-black/40 p-3">{edit ? <Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} onBlur={save} onKeyDown={(e) => { if (e.key === "Enter") save(); }} /> : <div onDoubleClick={() => setEdit(true)} className="font-medium text-yellow-100">{task.title}</div>}<div className="mt-1 text-base font-semibold text-yellow-100">Due {fmtDMY(task.due)} • Priority: {task.priority}</div><div className="mt-2 flex gap-2"><Button variant="outline" onClick={() => updateTask(task.id, { status:"Done" })}>Mark Done</Button><Button variant="outline" className="text-red-300" onClick={() => deleteTask(task.id)}>Delete</Button></div></div>;
  }

  function TreatmentControls({ form, setForm }) {
    const [adding, setAdding] = useState(false);
    const [name, setName] = useState("");
    const setIn = (value) => { if (Boolean(form.inTreatment) === Boolean(value)) return; setForm((p) => ({ ...p, inTreatment:Boolean(value), treatmentDate:todayISO() })); };
    const addName = () => { const clean = name.trim(); if (!clean) return; if (!treatments.includes(clean)) setTreatments((p) => [...p, clean]); setForm((p) => ({ ...p, treatmentName:clean })); setName(""); setAdding(false); };
    return <div className="space-y-2"><div className="flex items-center gap-2"><Button variant={form.inTreatment ? "solid" : "outline"} onClick={() => setIn(true)}>In</Button><Button variant={!form.inTreatment ? "solid" : "outline"} onClick={() => setIn(false)}>Out</Button><span className="text-xs opacity-80">{form.treatmentDate ? fmtDMY(form.treatmentDate) : "—"}</span></div>{form.inTreatment && <div className="space-y-2"><select value={form.treatmentName || ""} onChange={(e) => setForm((p) => ({ ...p, treatmentName:e.target.value }))} className="w-full rounded-xl border border-yellow-500/30 bg-black/40 px-3 py-2 text-yellow-100"><option value="">— Select —</option>{treatments.map((t) => <option key={t} value={t}>{t}</option>)}</select>{adding ? <div className="flex gap-2"><Input placeholder="New treatment name" value={name} onChange={(e) => setName(e.target.value)} /><Button variant="outline" onClick={addName}>Add</Button><Button variant="outline" onClick={() => { setAdding(false); setName(""); }}>Cancel</Button></div> : <Button variant="outline" onClick={() => setAdding(true)}>+ Add Treatment</Button>}</div>}</div>;
  }

  function Apiaries() {
    const [selected, setSelected] = useState(new Set());
    const [openId, setOpenId] = useState(hives[0]?.id || null);
    const [query, setQuery] = useState("");
    const [qaOpen, setQaOpen] = useState(false);
    const [qaDraft, setQaDraft] = useState({ title:"", due:todayISO(), priority:"Medium" });
    const [dragging, setDragging] = useState(null);
    const [over, setOver] = useState(null);
    const shown = hives.filter((h) => norm(h.name).includes(norm(query)));
    const current = hives.find((h) => h.id === openId) || null;
    const toggle = (id, checked) => setSelected((prev) => { const next = new Set(prev); checked ? next.add(id) : next.delete(id); return next; });
    const deleteSelected = () => { setHives((prev) => prev.filter((h) => !selected.has(h.id))); if (current && selected.has(current.id)) setOpenId(null); setSelected(new Set()); };
    const move = (fromId, toId) => { if (!fromId || !toId || fromId === toId) return; setHives((prev) => { const arr = [...prev]; const from = arr.findIndex((h) => h.id === fromId); const to = arr.findIndex((h) => h.id === toId); if (from < 0 || to < 0) return prev; const [item] = arr.splice(from, 1); arr.splice(to, 0, item); return arr; }); };
    return <div className="grid grid-cols-1 gap-4 lg:grid-cols-[520px,1fr]"><div className="space-y-2"><div className="flex gap-2"><Button onClick={() => setShowNew(true)}>+ Add Apiary</Button><Button variant="outline" disabled={selected.size === 0} onClick={deleteSelected}>Delete</Button></div><Input placeholder="Search apiaries..." value={query} onChange={(e) => setQuery(e.target.value)} /><div className="overflow-hidden rounded-2xl border border-yellow-500/20 bg-black/40"><div className="grid grid-cols-[24px_minmax(120px,1fr)_80px_70px_70px] gap-2 border-b border-yellow-500/20 px-2 py-2 text-xs font-semibold text-yellow-300"><span></span><span>Apiary</span><span className="text-right text-green-400">Total Hives</span><span className="text-right text-blue-300">Doubles</span><span className="text-right text-white">Singles</span></div><div className="max-h-[60vh] divide-y divide-yellow-500/10 overflow-auto">{shown.map((hive) => <div key={hive.id} onClick={() => { setOpenId(hive.id); setQaOpen(false); }} onDragOver={(e) => { if (dragging && dragging !== hive.id) { e.preventDefault(); setOver(hive.id); } }} onDragLeave={() => over === hive.id && setOver(null)} onDrop={(e) => { e.preventDefault(); move(dragging || e.dataTransfer.getData("text/plain"), hive.id); setDragging(null); setOver(null); }} className={`grid grid-cols-[24px_minmax(120px,1fr)_80px_70px_70px] items-center gap-2 px-2 py-2 hover:bg-black/50 ${openId === hive.id ? "bg-black/50" : ""} ${over === hive.id ? "bg-yellow-500/10 ring-1 ring-yellow-400" : ""}`}><input type="checkbox" className="h-4 w-4 accent-yellow-500" checked={selected.has(hive.id)} onClick={(e) => e.stopPropagation()} onChange={(e) => toggle(hive.id, e.target.checked)} /><span draggable onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.setData("text/plain", hive.id); setDragging(hive.id); }} onDragEnd={() => { setDragging(null); setOver(null); }} className="cursor-grab truncate active:cursor-grabbing" title="Drag to rearrange">{hive.name}</span><span className="text-right text-xs font-bold text-green-400">{toInt(hive.numHives)}</span><span className="text-right text-xs font-bold text-blue-300">{toInt(hive.doubleHives)}</span><span className="text-right text-xs font-bold text-white">{toInt(hive.singleHives)}</span></div>)}{shown.length === 0 && <div className="px-3 py-2 text-sm opacity-70">No apiaries found</div>}</div></div></div><div>{!current && <Card><HeaderBox><div className="font-semibold text-yellow-200">Select an apiary</div></HeaderBox><Content className="text-sm opacity-80">Choose an apiary from the list.</Content></Card>}{current && <Card><HeaderBox className="flex items-start justify-between gap-4"><div><div className="font-semibold text-yellow-200">{current.name}</div><div className="mt-1 flex items-baseline gap-2"><span className="text-xs text-yellow-300/80">Last Update:</span><span className="text-lg font-bold text-yellow-100">{fmtDMY(current.lastInspection || todayISO())}</span></div></div><div className="flex gap-2"><Button variant="outline" onClick={() => setQaOpen(!qaOpen)}>{qaOpen ? "Close" : "Add Task"}</Button><Button variant="outline" onClick={() => setEditing(current)}>Edit</Button></div></HeaderBox><Content className="space-y-2 text-yellow-100/90">{qaOpen && <div className="mb-3 rounded-xl border border-yellow-500/30 bg-black/30 p-3"><div className="mb-2 font-semibold text-yellow-300">Quick Add Task</div><div className="space-y-2"><Input placeholder="Title" value={qaDraft.title} onChange={(e) => setQaDraft({ ...qaDraft, title:e.target.value })} /><Input type="date" value={qaDraft.due} onChange={(e) => setQaDraft({ ...qaDraft, due:e.target.value })} /><select value={qaDraft.priority} onChange={(e) => setQaDraft({ ...qaDraft, priority:e.target.value })} className="w-full rounded-xl border border-yellow-500/30 bg-black/40 px-3 py-2 text-yellow-100"><option>Low</option><option>Medium</option><option>High</option></select><Button onClick={() => { if (!qaDraft.title.trim()) return; addTask({ title:qaDraft.title, hiveId:current.id, due:qaDraft.due, priority:qaDraft.priority }); setQaDraft({ title:"", due:todayISO(), priority:"Medium" }); setQaOpen(false); }}>Create</Button></div></div>}<DetailRow label="Number of Hives" value={current.numHives} valueClass="text-green-400" /><DetailRow label="Double Hives" value={current.doubleHives} valueClass="text-blue-300" /><DetailRow label="Single Hives" value={current.singleHives} valueClass="text-white" /><DetailRow label="Strength" value={current.strength} /><DetailRow label="Treatment" value={treatmentView(current)} />{current.notes && <div className="pt-2"><div className="text-xs uppercase tracking-wide text-yellow-300/80">Comments</div><div className="mt-1 whitespace-pre-wrap text-lg leading-relaxed">{current.notes}</div></div>}</Content></Card>}</div></div>;
  }

  function ApiaryForm({ initial={}, title, onCancel, onSave, isNew=false }) {
    const [form, setForm] = useState(() => ({ name:"", strength:"Moderate", singleHives:0, doubleHives:0, notes:"", inTreatment:false, treatmentName:"", treatmentDate:"", ...initial }));
    const result = validateApiary(form, hives, initial.id);
    const total = totalOf(form);
    const error = (key) => result.errors[key] ? <div className="mt-1 text-xs text-red-300">{result.errors[key]}</div> : null;
    const save = () => { if (!result.valid) return; onSave({ ...result.values, treatmentDate: form.inTreatment ? (form.treatmentDate || todayISO()) : form.treatmentDate }); };
    return <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"><div className="max-h-[85vh] w-full max-w-xl overflow-auto rounded-2xl border border-yellow-500/30 bg-black p-4 text-yellow-100"><div className="mb-3 font-semibold text-yellow-200">{title}</div><div className="grid grid-cols-1 gap-2"><label className="text-sm">Name<Input value={form.name} onChange={(e) => setForm({ ...form, name:e.target.value })} />{error("name")}</label>{isNew && <DetailRow label="Number of Hives (auto)" value={total} valueClass="text-green-400" />}<label className="text-sm">Double Hives<Input type="number" min="0" value={form.doubleHives} onChange={(e) => setForm({ ...form, doubleHives:toInt(e.target.value) })} /></label><label className="text-sm">Single Hives<Input type="number" min="0" value={form.singleHives} onChange={(e) => setForm({ ...form, singleHives:toInt(e.target.value) })} /></label><label className="text-sm">Strength<select value={form.strength} onChange={(e) => setForm({ ...form, strength:e.target.value })} className="w-full rounded-xl border border-yellow-500/30 bg-black/40 px-3 py-2 text-yellow-100"><option>Weak</option><option>Moderate</option><option>Strong</option></select></label><div className="text-sm"><div className="mb-1">Treatment</div><TreatmentControls form={form} setForm={setForm} /></div><label className="text-sm">Comments<Textarea rows="3" value={form.notes} onChange={(e) => setForm({ ...form, notes:e.target.value })} /></label></div><div className="sticky bottom-0 mt-3 flex justify-end gap-2 bg-black pt-3"><Button variant="outline" onClick={onCancel}>Cancel</Button><Button disabled={!result.valid} onClick={save}>Save</Button></div></div></div>;
  }

  return <div className="mx-auto max-w-6xl p-4 text-yellow-200"><AppHeader />{tab === "dashboard" ? <Dashboard /> : <Apiaries />}{showNew && <ApiaryForm isNew title="Add Apiary" onCancel={() => setShowNew(false)} onSave={(data) => { if (addHive(data)) setShowNew(false); }} />}{editing && <ApiaryForm title={`Edit ${editing.name}`} initial={editing} onCancel={() => setEditing(null)} onSave={(data) => { updateHive(editing.id, data); setEditing(null); }} />}</div>;
}
