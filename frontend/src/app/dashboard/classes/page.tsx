"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import type { SchoolClass, Section as SectionType, Subject, AcademicSession, Exam } from "@/lib/types";

const CLASS_OPTIONS = Array.from({ length: 10 }, (_, i) => `Class ${i + 1}`);
const SECTION_OPTIONS = ["A", "B", "C", "D", "E"];
const COMMON_SUBJECTS = [
  "English", "Urdu", "Mathematics", "Science", "Social Studies",
  "Islamiat", "Computer Science", "Physics", "Chemistry", "Biology",
  "General Knowledge", "Art",
];

const DEFAULT_SUBJECTS_FOR_NEW_CLASS = [
  "English", "Urdu", "Mathematics", "Science", "Social Studies", "Islamiat",
];

type TabKey = "sessions" | "classes" | "sections" | "subjects" | "exams";

const TABS: { key: TabKey; label: string }[] = [
  { key: "sessions", label: "Sessions" },
  { key: "classes", label: "Classes" },
  { key: "sections", label: "Sections" },
  { key: "subjects", label: "Subjects" },
  { key: "exams", label: "Exams" },
];

// Helper: normalize text for duplicate comparisons (case + extra spaces don't matter)
function normalize(text: string) {
  return text.trim().toLowerCase();
}

export default function ClassesPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("classes");

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<SectionType[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);

  const [className, setClassName] = useState(CLASS_OPTIONS[0]);
  const [sectionName, setSectionName] = useState(SECTION_OPTIONS[0]);
  const [sectionClassId, setSectionClassId] = useState<number | "">("");
  const [subjectClassId, setSubjectClassId] = useState<number | "">("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [customSubject, setCustomSubject] = useState("");
  const [passingPercent, setPassingPercent] = useState("33");
  const [sessionLabel, setSessionLabel] = useState("");
  const [examName, setExamName] = useState("");
  const [examClassId, setExamClassId] = useState<number | "">("");
  const [examSessionId, setExamSessionId] = useState<number | "">("");
  const [addingClass, setAddingClass] = useState(false);

  function refreshAll() {
    api.get<SchoolClass[]>("/classes").then((r) => setClasses(r.data));
    api.get<SectionType[]>("/sections").then((r) => setSections(r.data));
    api.get<Subject[]>("/subjects").then((r) => setSubjects(r.data));
    api.get<AcademicSession[]>("/sessions").then((r) => setSessions(r.data));
    api.get<Exam[]>("/exams").then((r) => setExams(r.data));
  }

  useEffect(refreshAll, []);

  async function addClass(e: React.FormEvent) {
    e.preventDefault();
    if (classes.some((c) => normalize(c.name) === normalize(className))) {
      alert("This class already exists.");
      return;
    }

    setAddingClass(true);
    try {
      const res = await api.post<SchoolClass>("/classes", { name: className });
      const newClassId = res.data.id;

      await Promise.all(
        DEFAULT_SUBJECTS_FOR_NEW_CLASS.map((name) =>
          api.post("/subjects", {
            name,
            class_id: newClassId,
            passing_marks_percent: Number(passingPercent) || 33,
          })
        )
      );

      refreshAll();
    } finally {
      setAddingClass(false);
    }
  }

  async function addSection(e: React.FormEvent) {
    e.preventDefault();
    if (!sectionClassId) return;

    const isDuplicate = sections.some(
      (s) => s.class_id === sectionClassId && normalize(s.name) === normalize(sectionName)
    );
    if (isDuplicate) {
      alert("This section already exists for this class.");
      return;
    }

    await api.post("/sections", { name: sectionName, class_id: sectionClassId });
    refreshAll();
  }

  function toggleSubject(subject: string) {
    setSelectedSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  }

  async function addSubjects(e: React.FormEvent) {
    e.preventDefault();
    if (!subjectClassId) return;

    const allToAdd = [...selectedSubjects];
    if (customSubject.trim()) allToAdd.push(customSubject.trim());
    if (allToAdd.length === 0) return;

    // Skip anything that's already a subject for this class
    const existingNames = subjects
      .filter((s) => s.class_id === subjectClassId)
      .map((s) => normalize(s.name));
    const newOnes = allToAdd.filter((name) => !existingNames.includes(normalize(name)));

    if (newOnes.length === 0) {
      alert("All selected subjects already exist for this class.");
      return;
    }

    await Promise.all(
      newOnes.map((name) =>
        api.post("/subjects", { name, class_id: subjectClassId, passing_marks_percent: Number(passingPercent) })
      )
    );
    setSelectedSubjects([]);
    setCustomSubject("");
    refreshAll();
  }

  async function addSession(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionLabel.trim()) return;

    const isDuplicate = sessions.some((s) => normalize(s.year_label) === normalize(sessionLabel));
    if (isDuplicate) {
      alert("This session already exists.");
      return;
    }

    await api.post("/sessions", { year_label: sessionLabel.trim(), is_active: true });
    setSessionLabel("");
    refreshAll();
  }

  async function addExam(e: React.FormEvent) {
    e.preventDefault();
    if (!examName.trim() || !examClassId || !examSessionId) return;

    const isDuplicate = exams.some(
      (ex) => ex.class_id === examClassId && normalize(ex.name) === normalize(examName)
    );
    if (isDuplicate) {
      alert("An exam with this name already exists for this class.");
      return;
    }

    await api.post("/exams", { name: examName.trim(), class_id: examClassId, session_id: examSessionId });
    setExamName("");
    refreshAll();
  }

  async function handleDelete(kind: TabKey, id: number) {
    const endpoints: Record<TabKey, string> = {
      sessions: "sessions",
      classes: "classes",
      sections: "sections",
      subjects: "subjects",
      exams: "exams",
    };
    if (!confirm("Remove this item? This cannot be undone.")) return;
    await api.delete(`/${endpoints[kind]}/${id}`);
    refreshAll();
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-ink mb-1">
        Classes & Subjects
      </h1>
      <p className="text-sm text-muted mb-6">
        Set up the structure your marks and results will be organized under.
      </p>

      <div className="flex gap-1 border-b border-hairline mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.key
                ? "border-ledger-green text-ledger-green"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "sessions" && (
        <Panel>
          <form onSubmit={addSession} className="flex gap-2 mb-5">
            <input
              value={sessionLabel}
              onChange={(e) => setSessionLabel(e.target.value)}
              placeholder="e.g. 2025-2026"
              className="flex-1 border border-hairline rounded-md px-3 py-2 text-sm bg-paper"
            />
            <AddButton />
          </form>
          <DataTable
            headers={["Session"]}
            rows={sessions.map((s) => ({ id: s.id, cells: [s.year_label] }))}
            onDelete={(id) => handleDelete("sessions", id)}
            emptyText="No academic sessions yet."
          />
        </Panel>
      )}

      {activeTab === "classes" && (
        <Panel>
          <form onSubmit={addClass} className="flex gap-2 mb-2">
            <select
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="flex-1 border border-hairline rounded-md px-3 py-2 text-sm bg-paper"
            >
              {CLASS_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={addingClass}
              className="bg-ledger-green text-white text-sm font-medium px-5 py-2 rounded-md hover:opacity-90 transition-opacity disabled:opacity-60 whitespace-nowrap"
            >
              {addingClass ? "Adding…" : "Add"}
            </button>
          </form>
          <p className="text-xs text-muted mb-5">
            English, Urdu, Mathematics, Science, Social Studies and Islamiat are added automatically for every new class.
          </p>
          <DataTable
            headers={["Class"]}
            rows={classes.map((c) => ({ id: c.id, cells: [c.name] }))}
            onDelete={(id) => handleDelete("classes", id)}
            emptyText="No classes yet."
          />
        </Panel>
      )}

      {activeTab === "sections" && (
        <Panel>
          <form onSubmit={addSection} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-5">
            <select
              value={sectionClassId}
              onChange={(e) => setSectionClassId(Number(e.target.value))}
              className="border border-hairline rounded-md px-3 py-2 text-sm bg-paper"
            >
              <option value="">Select class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              className="border border-hairline rounded-md px-3 py-2 text-sm bg-paper"
            >
              {SECTION_OPTIONS.map((s) => (
                <option key={s} value={s}>Section {s}</option>
              ))}
            </select>
            <AddButton />
          </form>
          <DataTable
            headers={["Section", "Class"]}
            rows={sections.map((s) => ({
              id: s.id,
              cells: [s.name, classes.find((c) => c.id === s.class_id)?.name ?? "—"],
            }))}
            onDelete={(id) => handleDelete("sections", id)}
            emptyText="No sections yet."
          />
        </Panel>
      )}

      {activeTab === "subjects" && (
        <Panel>
          <p className="text-xs text-muted mb-4">
            Default subjects are already added automatically when you create a class. Use this tab only to add extra subjects (like Physics for a specific class).
          </p>
          <form onSubmit={addSubjects} className="flex flex-col gap-3 mb-5">
            <select
              value={subjectClassId}
              onChange={(e) => setSubjectClassId(Number(e.target.value))}
              className="border border-hairline rounded-md px-3 py-2 text-sm bg-paper"
            >
              <option value="">Select class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border border-hairline rounded-md p-4 bg-paper">
              {COMMON_SUBJECTS.map((subj) => (
                <label key={subj} className="flex items-center gap-2 text-sm text-ink-soft cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedSubjects.includes(subj)}
                    onChange={() => toggleSubject(subj)}
                    className="accent-ledger-green"
                  />
                  {subj}
                </label>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="Add another subject (optional)"
                className="flex-1 border border-hairline rounded-md px-3 py-2 text-sm bg-paper"
              />
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted whitespace-nowrap">Passing %</label>
                <input
                  type="number"
                  value={passingPercent}
                  onChange={(e) => setPassingPercent(e.target.value)}
                  className="w-16 border border-hairline rounded-md px-2 py-2 text-sm bg-paper"
                />
              </div>
              <AddButton />
            </div>
          </form>
          <DataTable
            headers={["Subject", "Class", "Passing %"]}
            rows={subjects.map((s) => ({
              id: s.id,
              cells: [s.name, classes.find((c) => c.id === s.class_id)?.name ?? "—", `${s.passing_marks_percent}%`],
            }))}
            onDelete={(id) => handleDelete("subjects", id)}
            emptyText="No subjects yet."
          />
        </Panel>
      )}

      {activeTab === "exams" && (
        <Panel>
          <form onSubmit={addExam} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-5">
            <input
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              placeholder="e.g. Mid Term 2025"
              className="border border-hairline rounded-md px-3 py-2 text-sm bg-paper"
            />
            <select
              value={examClassId}
              onChange={(e) => setExamClassId(Number(e.target.value))}
              className="border border-hairline rounded-md px-3 py-2 text-sm bg-paper"
            >
              <option value="">Select class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={examSessionId}
              onChange={(e) => setExamSessionId(Number(e.target.value))}
              className="border border-hairline rounded-md px-3 py-2 text-sm bg-paper"
            >
              <option value="">Select session</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>{s.year_label}</option>
              ))}
            </select>
            <AddButton />
          </form>
          <DataTable
            headers={["Exam", "Class", "Session"]}
            rows={exams.map((ex) => ({
              id: ex.id,
              cells: [
                ex.name,
                classes.find((c) => c.id === ex.class_id)?.name ?? "—",
                sessions.find((s) => s.id === ex.session_id)?.year_label ?? "—",
              ],
            }))}
            onDelete={(id) => handleDelete("exams", id)}
            emptyText="No exams yet."
          />
        </Panel>
      )}
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-hairline rounded-lg bg-paper-raised p-6">
      {children}
    </div>
  );
}

function DataTable({
  headers,
  rows,
  onDelete,
  emptyText,
}: {
  headers: string[];
  rows: { id: number; cells: string[] }[];
  onDelete: (id: number) => void;
  emptyText: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted py-6 text-center">{emptyText}</p>;
  }

  return (
    <div className="border border-hairline rounded-md overflow-hidden">
      <table className="ledger-table">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
            <th className="w-16"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {row.cells.map((cell, i) => (
                <td key={i}>{cell}</td>
              ))}
              <td className="text-right">
                <button
                  onClick={() => onDelete(row.id)}
                  className="text-xs text-pen-red hover:underline"
                  title="Remove"
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AddButton() {
  return (
    <button
      type="submit"
      className="bg-ledger-green text-white text-sm font-medium px-5 py-2 rounded-md hover:opacity-90 transition-opacity whitespace-nowrap"
    >
      Add
    </button>
  );
}