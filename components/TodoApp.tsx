"use client";
import React, { useEffect, useMemo, useState } from "react";
import { nextDueFrom, shouldIncrementStreak, toLocalISODate } from "../lib/recurrence";

type RepeatRule = "none" | "daily" | "weekly" | "monthly";
type Priority = "low" | "medium" | "high";

type Task = {
  id: string;
  title: string;
  done: boolean;
  due?: string | null;
  createdAt: number;
  updatedAt: number;
  recurrence?: RepeatRule;
  lastCompleted?: string | null;
  priority?: Priority;
  tags?: string[];
  notes?: string;
  streakCount?: number;
  bestStreak?: number;
};

type Filter = "all" | "active" | "done";

const LS_KEY = "vercel_todo_pro_v1";

function loadTasks(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Task[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveTasks(tasks: Task[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(tasks));
}

function getAllTags(tasks: Task[]): string[] {
  const s = new Set<string>();
  for (const t of tasks) (t.tags || []).forEach(tag => s.add(tag.toLowerCase()));
  return Array.from(s).sort();
}

export default function TodoApp() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState<string>("");
  const [due, setDue] = useState<string>("");
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");
  const [recurrence, setRecurrence] = useState<RepeatRule>("none");
  const [priority, setPriority] = useState<Priority>("medium");
  const [tagInput, setTagInput] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [activeTagFilters, setActiveTagFilters] = useState<string[]>([]);
  const todayISO = toLocalISODate(new Date());

  useEffect(() => { setTasks(loadTasks()); }, []);
  useEffect(() => { saveTasks(tasks); }, [tasks]);

  function resetEntry() {
    setInput(""); setDue(""); setRecurrence("none"); setPriority("medium"); setTags([]); setNotes(""); setTagInput("");
  }

  function addTask() {
    const title = input.trim();
    if (!title) return;
    const now = Date.now();
    const newTask: Task = {
      id: Math.random().toString(36).slice(2),
      title,
      done: false,
      due: due || null,
      createdAt: now,
      updatedAt: now,
      recurrence: recurrence || "none",
      priority,
      tags: tags.map(t => t.toLowerCase()),
      notes,
      streakCount: 0,
      bestStreak: 0,
      lastCompleted: null
    };
    setTasks(prev => [newTask, ...prev]);
    resetEntry();
  }

  function toggleTask(id: string) {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      if (!t.done) {
        let newStreak = t.streakCount || 0;
        let bestStreak = t.bestStreak || 0;
        if ((t.recurrence && t.recurrence !== "none")) {
          const inc = shouldIncrementStreak(todayISO, t.due || null);
          if (inc) {
            newStreak += 1;
            if (newStreak > bestStreak) bestStreak = newStreak;
          } else {
            newStreak = 0;
          }
        }
        const newDue = (t.recurrence && t.recurrence !== "none") ? nextDueFrom(t.due || todayISO, t.recurrence!, todayISO) : t.due || null;
        return { ...t, done: true, updatedAt: Date.now(), lastCompleted: todayISO, streakCount: newStreak, bestStreak, due: newDue };
      } else {
        return { ...t, done: false, updatedAt: Date.now() };
      }
    }));
  }

  function deleteTask(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  function startEdit(task: Task) {
    setEditingId(task.id);
    setEditingText(task.title);
  }

  function saveEdit(id: string) {
    const text = editingText.trim();
    if (!text) return;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, title: text, updatedAt: Date.now() } : t));
    setEditingId(null);
    setEditingText("");
  }

  function setTaskPriority(id: string, to: Priority) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, priority: to, updatedAt: Date.now() } : t));
  }

  function addTagToEntry() {
    const t = tagInput.trim().toLowerCase();
    if (!t) return;
    if (!tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput("");
  }

  function addTagToTask(id: string, t: string) {
    t = t.toLowerCase().trim();
    if (!t) return;
    setTasks(prev => prev.map(task => task.id === id ? { ...task, tags: Array.from(new Set([...(task.tags||[]), t])) } : task));
  }

  function saveNotes(id: string, text: string) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, notes: text, updatedAt: Date.now() } : t));
  }

  function toggleTagFilter(tag: string) {
    tag = tag.toLowerCase();
    setActiveTagFilters(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }

  useEffect(() => {
    setTasks(prev => prev.map(t => {
      if (t.done) return t;
      if (t.recurrence && t.recurrence !== "none" && t.due) {
        const dueTime = new Date(t.due).getTime();
        const todayTime = new Date(todayISO).getTime();
        if (todayTime > dueTime) {
          if ((t.streakCount || 0) !== 0) {
            return { ...t, streakCount: 0 };
          }
        }
      }
      return t;
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayISO]);

  const allTags = useMemo(() => getAllTags(tasks), [tasks]);

  const filtered = useMemo(() => {
    let t = tasks;
    if (filter === "active") t = tasks.filter(t => !t.done);
    if (filter === "done") t = tasks.filter(t => t.done);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      t = t.filter(x => x.title.toLowerCase().includes(q) || (x.notes || "").toLowerCase().includes(q));
    }
    if (activeTagFilters.length) {
      t = t.filter(x => {
        const xtags = (x.tags || []).map(tt => tt.toLowerCase());
        return activeTagFilters.every(tf => xtags.includes(tf));
      });
    }
    const pRank = (p?: Priority) => p === "high" ? 0 : p === "medium" ? 1 : 2;
    return [...t].sort((a,b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      const ad = a.due ? Date.parse(a.due) : Infinity;
      const bd = b.due ? Date.parse(b.due) : Infinity;
      if (ad !== bd) return ad - bd;
      const ap = pRank(a.priority); const bp = pRank(b.priority);
      if (ap !== bp) return ap - bp;
      return b.createdAt - a.createdAt;
    });
  }, [tasks, filter, query, activeTagFilters]);

  const leftCount = tasks.filter(t => !t.done).length;

  return (
    <div className="container">
      <div className="card">
        <header className="hero">
          <div>
            <h1>ToDo Pro</h1>
            <div className="muted">Recurring tasks, priorities, tags, notes, and streaks</div>
          </div>
          <div className="row" style={{minWidth:280}}>
            <input type="text" placeholder="Search tasks…" value={query} onChange={e => setQuery(e.target.value)} aria-label="Search tasks" />
            <select value={filter} onChange={e => setFilter(e.target.value as Filter)} aria-label="Filter tasks">
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="done">Done</option>
            </select>
          </div>
        </header>

        {allTags.length ? (
          <div className="row" style={{ padding: "0 16px 8px" }}>
            {allTags.map(t => (
              <span key={t} className={"tag-chip " + (activeTagFilters.includes(t) ? "active" : "")}
                onClick={() => toggleTagFilter(t)} role="button" aria-pressed={activeTagFilters.includes(t)}>#{t}</span>
            ))}
          </div>
        ) : null}

        <div className="grid">
          <div className="input-row" style={{flexDirection:"column", gap: 10}}>
            <input type="text" placeholder="Add a new task…" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addTask(); }} aria-label="New task title" />
            <div className="row" style={{width:"100%"}}>
              <input type="date" value={due} onChange={e => setDue(e.target.value)} aria-label="Due date" />
              <select value={recurrence} onChange={e => setRecurrence(e.target.value as RepeatRule)} aria-label="Repeat">
                <option value="none">No repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              <select value={priority} onChange={e => setPriority(e.target.value as Priority)} aria-label="Priority">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="row" style={{width:"100%"}}>
              <input type="text" placeholder="Add tag and press Enter…" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { const t = (e.target as HTMLInputElement).value; (t.trim()) && setTags(prev => prev.includes(t.trim().toLowerCase()) ? prev : [...prev, t.trim().toLowerCase()]); setTagInput(''); } }} aria-label="New tag input" />
              <button className="secondary" onClick={() => { const t = tagInput.trim().toLowerCase(); if (t) { setTags(prev => prev.includes(t) ? prev : [...prev, t]); setTagInput(''); } }}>Add tag</button>
              <button onClick={addTask} aria-label="Add task">Add</button>
            </div>
            {!!tags.length && (<div className="row">{tags.map(t => <span key={t} className="pill">#{t}</span>)}</div>)}
            <textarea placeholder="Notes (optional)…" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          <ul className="tasks" role="list" aria-label="Task list">
            {filtered.map((task) => {
              const overdue = task.due ? (new Date(task.due).getTime() < new Date(toLocalISODate(new Date())).getTime() && !task.done) : false;
              return (
              <li key={task.id} className={"task " + (task.done ? "done" : "")}>
                <input type="checkbox" checked={task.done} onChange={() => toggleTask(task.id)} aria-label={`Mark ${task.title} ${task.done ? "active" : "done"}`} />
                <div className="task-main">
                  {editingId === task.id ? (
                    <input className="edit" value={editingText} onChange={(e) => setEditingText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveEdit(task.id); }} aria-label="Edit task title" autoFocus />
                  ) : (<div>{task.title}</div>)}
                  <div className="row">
                    <span className={"pill priority-" + (task.priority || "medium")}>{task.priority || "medium"}</span>
                    {task.due ? <span className={"pill " + (overdue ? "overdue" : "")}>Due: {task.due}</span> : null}
                    {task.recurrence && task.recurrence !== "none" ? <span className="pill">↻ {task.recurrence}</span> : null}
                    {(task.streakCount || 0) > 0 ? <span className="pill">🔥 {task.streakCount} (best {(task.bestStreak||0)})</span> : null}
                    {(task.tags || []).map(t => <span key={t} className="pill">#{t}</span>)}
                  </div>
                  {task.notes ? <div className="note">{task.notes}</div> : null}
                </div>
                {editingId === task.id ? (
                  <div className="row">
                    <button className="secondary" onClick={() => saveEdit(task.id)}>Save</button>
                    <button className="secondary" onClick={() => { setEditingId(null); setEditingText(""); }}>Cancel</button>
                  </div>
                ) : (
                  <div className="row">
                    <button className="secondary" onClick={() => startEdit(task)}>Edit</button>
                    <button className="secondary" onClick={() => setTaskPriority(task.id, "low")}>Low</button>
                    <button className="secondary" onClick={() => setTaskPriority(task.id, "medium")}>Med</button>
                    <button className="secondary" onClick={() => setTaskPriority(task.id, "high")}>High</button>
                    <button className="secondary" onClick={() => { const val = prompt("Add tag") || ""; if (val.trim()) { const t = val.trim().toLowerCase(); setTasks(prev => prev.map(x => x.id === task.id ? { ...x, tags: Array.from(new Set([...(x.tags||[]), t])) } : x)); } }}>+Tag</button>
                    <button className="secondary" onClick={() => { const current = task.notes || ""; const next = prompt("Edit notes", current) ?? current; setTasks(prev => prev.map(x => x.id === task.id ? { ...x, notes: next } : x)); }}>Notes</button>
                    <button className="secondary" onClick={() => deleteTask(task.id)}>Delete</button>
                  </div>
                )}
              </li>
            )})}
          </ul>
        </div>

        <div className="footer"><span className="muted">{leftCount} left</span></div>
      </div>
    </div>
  );
}
