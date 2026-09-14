"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Student, Subject, Exam, SchoolClass } from "@/lib/types";

interface MarkRow {
  subject_id: number;
  subject_name: string;
  total_marks: number;
  obtained_marks: string;
}

export default function MarksEntryPage() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [classId, setClassId] = useState<number | "">("");
  const [studentId, setStudentId] = useState<number | "">("");
  const [examId, setExamId] = useState<number | "">("");
  const [rows, setRows] = useState<MarkRow[]>([]);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<SchoolClass[]>("/classes").then((r) => setClasses(r.data));
  }, []);

  useEffect(() => {
    if (!classId) {
      setStudents([]);
      setExams([]);
      setSubjects([]);
      return;
    }
    api.get<Student[]>("/students", { params: { class_id: classId } }).then((r) => setStudents(r.data));
    api.get<Exam[]>("/exams", { params: { class_id: classId } }).then((r) => setExams(r.data));
    api.get<Subject[]>("/subjects", { params: { class_id: classId } }).then((r) => setSubjects(r.data));
  }, [classId]);

  useEffect(() => {
    if (!studentId || !examId || subjects.length === 0) {
      setRows([]);
      return;
    }
    api
      .get(`/marks/student/${studentId}/exam/${examId}`)
      .then((res) => {
        const existing: Record<number, number> = {};
        res.data.forEach((m: { subject_id: number; obtained_marks: number }) => {
          existing[m.subject_id] = m.obtained_marks;
        });
        setRows(
          subjects.map((s) => ({
            subject_id: s.id,
            subject_name: s.name,
            total_marks: 100,
            obtained_marks: existing[s.id] !== undefined ? String(existing[s.id]) : "",
          }))
        );
      });
  }, [studentId, examId, subjects]);

  function updateRow(subjectId: number, field: "total_marks" | "obtained_marks", value: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.subject_id === subjectId
          ? { ...r, [field]: field === "total_marks" ? Number(value) : value }
          : r
      )
    );
  }

  async function handleSave() {
    if (!studentId || !examId) return;
    setSaving(true);
    setSaved(false);
    try {
      await api.post("/marks/bulk", {
        student_id: studentId,
        exam_id: examId,
        marks: rows.map((r) => ({
          subject_id: r.subject_id,
          total_marks: r.total_marks,
          obtained_marks: Number(r.obtained_marks) || 0,
        })),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-ink mb-1">Marks Entry</h1>
      <p className="text-sm text-muted mb-8">
        Select a student and exam, then enter marks for every subject. The result is calculated automatically.
      </p>

      <div className="border border-hairline rounded-lg bg-paper-raised p-6 mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-muted mb-1.5">Class</label>
          <select
            value={classId}
            onChange={(e) => {
              setClassId(Number(e.target.value));
              setStudentId("");
              setExamId("");
            }}
            className="w-full border border-hairline rounded-md px-3 py-2 text-sm bg-paper"
          >
            <option value="">Select class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted mb-1.5">Student</label>
          <select
            value={studentId}
            onChange={(e) => setStudentId(Number(e.target.value))}
            className="w-full border border-hairline rounded-md px-3 py-2 text-sm bg-paper"
            disabled={!classId}
          >
            <option value="">Select student</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.roll_no} — {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted mb-1.5">Exam</label>
          <select
            value={examId}
            onChange={(e) => setExamId(Number(e.target.value))}
            className="w-full border border-hairline rounded-md px-3 py-2 text-sm bg-paper"
            disabled={!classId}
          >
            <option value="">Select exam</option>
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {rows.length > 0 && (
        <div className="border border-hairline rounded-lg bg-paper-raised overflow-hidden">
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th className="w-32">Total Marks</th>
                <th className="w-32">Obtained Marks</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.subject_id}>
                  <td>{row.subject_name}</td>
                  <td>
                    <input
                      type="number"
                      value={row.total_marks}
                      onChange={(e) => updateRow(row.subject_id, "total_marks", e.target.value)}
                      className="w-24 border border-hairline rounded-md px-2 py-1.5 text-sm bg-paper"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={row.obtained_marks}
                      onChange={(e) => updateRow(row.subject_id, "obtained_marks", e.target.value)}
                      className="w-24 border border-hairline rounded-md px-2 py-1.5 text-sm bg-paper"
                      placeholder="0"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-4 flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-ledger-green text-white text-sm font-medium px-5 py-2.5 rounded-md hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Marks & Calculate Result"}
            </button>
            {saved && (
              <span className="text-sm text-ledger-green">Saved — result updated.</span>
            )}
          </div>
        </div>
      )}

      {classId && subjects.length === 0 && (
        <p className="text-sm text-muted mt-4">
          No subjects have been created for this class yet. Add one from &quot;Classes & Subjects&quot; first.
        </p>
      )}
    </div>
  );
}