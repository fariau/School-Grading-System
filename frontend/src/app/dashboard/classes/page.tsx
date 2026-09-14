"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import type { SchoolClass, Section as SectionType, Subject, AcademicSession, Exam } from "@/lib/types";

export default function ClassesPage() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<SectionType[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);

  const [className, setClassName] = useState("");
  const [sectionName, setSectionName] = useState("");
  const [sectionClassId, setSectionClassId] = useState<number | "">("");
  const [subjectName, setSubjectName] = useState("");
  const [subjectClassId, setSubjectClassId] = useState<number | "">("");
  const [passingPercent, setPassingPercent] = useState("33");
  const [sessionLabel, setSessionLabel] = useState("");
  const [examName, setExamName] = useState("");
  const [examClassId, setExamClassId] = useState<number | "">("");
  const [examSessionId, setExamSessionId] = useState<number | "">("");

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
    if (!className.trim()) return;
    await api.post("/classes", { name: className });
    setClassName("");
    refreshAll();
  }

  async function addSection(e: React.FormEvent) {
    e.preventDefault();
    if (!sectionName.trim() || !sectionClassId) return;
    await api.post("/sections", { name: sectionName, class_id: sectionClassId });
    setSectionName("");
    refreshAll();
  }

  async function addSubject(e: React.FormEvent) {
    e.preventDefault();
    if (!subjectName.trim() || !subjectClassId) return;
    await api.post("/subjects", {
      name: subjectName,
      class_id: subjectClassId,
      passing_marks_percent: Number(passingPercent),
    });
    setSubjectName("");
    refreshAll();
  }

  async function addSession(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionLabel.trim()) return;
    await api.post("/sessions", { year_label: sessionLabel, is_active: true });
    setSessionLabel("");
    refreshAll();
  }

  async function addExam(e: React.FormEvent) {
    e.preventDefault();
    if (!examName.trim() || !examClassId || !examSessionId) return;
    await api.post("/exams", {
      name: examName,
      class_id: examClassId,
      session_id: examSessionId,
    });
    setExamName("");
    refreshAll();
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-ink mb-1">
        Classes & Subjects
      </h1>
      <p className="text-sm text-muted mb-8">
        Set up the structure your marks and results will be organized under.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Academic Sessions */}
        <Section title="Academic Sessions" items={sessions.map((s) => s.year_label)}>
          <form onSubmit={addSession} className="flex gap-2 mt-4">
            <input
              value={sessionLabel}
              onChange={(e) => setSessionLabel(e.target.value)}
              placeholder="e.g. 2025-2026"
              className="flex-1 border border-hairline rounded-md px-3 py-2 text-sm bg-paper"
            />
            <AddButton />
          </form>
        </Section>

        {/* Classes */}
        <Section title="Classes" items={classes.map((c) => c.name)}>
          <form onSubmit={addClass} className="flex gap-2 mt-4">
            <input
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="e.g. Class 9"
              className="flex-1 border border-hairline rounded-md px-3 py-2 text-sm bg-paper"
            />
            <AddButton />
          </form>
        </Section>

        {/* Sections */}
        <Section
          title="Sections"
          items={sections.map(
            (s) =>
              `${s.name} — ${classes.find((c) => c.id === s.class_id)?.name ?? ""}`
          )}
        >
          <form onSubmit={addSection} className="flex flex-col gap-2 mt-4">
            <select
              value={sectionClassId}
              onChange={(e) => setSectionClassId(Number(e.target.value))}
              className="border border-hairline rounded-md px-3 py-2 text-sm bg-paper"
            >
              <option value="">Select class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
                placeholder="e.g. A"
                className="flex-1 border border-hairline rounded-md px-3 py-2 text-sm bg-paper"
              />
              <AddButton />
            </div>
          </form>
        </Section>

        {/* Subjects */}
        <Section
          title="Subjects"
          items={subjects.map(
            (s) =>
              `${s.name} — ${classes.find((c) => c.id === s.class_id)?.name ?? ""} (pass ${s.passing_marks_percent}%)`
          )}
        >
          <form onSubmit={addSubject} className="flex flex-col gap-2 mt-4">
            <select
              value={subjectClassId}
              onChange={(e) => setSubjectClassId(Number(e.target.value))}
              className="border border-hairline rounded-md px-3 py-2 text-sm bg-paper"
            >
              <option value="">Select class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="e.g. Mathematics"
              className="border border-hairline rounded-md px-3 py-2 text-sm bg-paper"
            />
            <div className="flex gap-2 items-center">
              <label className="text-xs text-muted whitespace-nowrap">
                Passing %
              </label>
              <input
                type="number"
                value={passingPercent}
                onChange={(e) => setPassingPercent(e.target.value)}
                className="w-20 border border-hairline rounded-md px-3 py-2 text-sm bg-paper"
              />
              <div className="flex-1" />
              <AddButton />
            </div>
          </form>
        </Section>

        {/* Exams */}
        <Section
          title="Exams"
          items={exams.map(
            (ex) =>
              `${ex.name} — ${classes.find((c) => c.id === ex.class_id)?.name ?? ""}`
          )}
        >
          <form onSubmit={addExam} className="flex flex-col gap-2 mt-4">
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
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <select
                value={examSessionId}
                onChange={(e) => setExamSessionId(Number(e.target.value))}
                className="flex-1 border border-hairline rounded-md px-3 py-2 text-sm bg-paper"
              >
                <option value="">Select session</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.year_label}
                  </option>
                ))}
              </select>
              <AddButton />
            </div>
          </form>
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  items,
  children,
}: {
  title: string;
  items: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="border border-hairline rounded-lg bg-paper-raised p-6">
      <h3 className="text-sm font-medium text-ink-soft mb-3">{title}</h3>
      {items.length > 0 ? (
        <ul className="space-y-1.5">
          {items.map((item, i) => (
            <li
              key={i}
              className="text-sm text-ink border-b border-hairline pb-1.5 last:border-0"
            >
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">Nothing added yet.</p>
      )}
      {children}
    </div>
  );
}

function AddButton() {
  return (
    <button
      type="submit"
      className="bg-ledger-green text-white text-sm font-medium px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
    >
      Add
    </button>
  );
}