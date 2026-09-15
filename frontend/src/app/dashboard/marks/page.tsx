"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Student, Subject, Exam, SchoolClass, Mark } from "@/lib/types";

export default function MarksEntryPage() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [classId, setClassId] = useState<number | "">("");
  const [examId, setExamId] = useState<number | "">("");

  // grid[studentId][subjectId] = obtained marks (as string, for the input)
  const [grid, setGrid] = useState<Record<number, Record<number, string>>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadingGrid, setLoadingGrid] = useState(false);

  useEffect(() => {
    api.get<SchoolClass[]>("/classes").then((r) => setClasses(r.data));
  }, []);

  useEffect(() => {
    if (!classId) {
      setStudents([]);
      setExams([]);
      setSubjects([]);
      setExamId("");
      return;
    }
    api.get<Student[]>("/students", { params: { class_id: classId } }).then((r) => setStudents(r.data));
    api.get<Exam[]>("/exams", { params: { class_id: classId } }).then((r) => setExams(r.data));
    api.get<Subject[]>("/subjects", { params: { class_id: classId } }).then((r) => setSubjects(r.data));
  }, [classId]);

  // Load the whole grid at once when class + exam are both picked
  useEffect(() => {
    if (!examId || students.length === 0 || subjects.length === 0) {
      setGrid({});
      return;
    }
    setLoadingGrid(true);
    api.get<Mark[]>(`/marks/exam/${examId}`).then((res) => {
      const newGrid: Record<number, Record<number, string>> = {};
      for (const student of students) {
        newGrid[student.id] = {};
        for (const subject of subjects) {
          const existing = res.data.find(
            (m) => m.student_id === student.id && m.subject_id === subject.id
          );
          newGrid[student.id][subject.id] = existing ? String(existing.obtained_marks) : "";
        }
      }
      setGrid(newGrid);
      setLoadingGrid(false);
    });
  }, [examId, students, subjects]);

  function updateCell(studentId: number, subjectId: number, value: string) {
    setGrid((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [subjectId]: value },
    }));
  }

  async function handleSaveAll() {
    if (!examId) return;
    setSaving(true);
    setSaved(false);
    try {
      await Promise.all(
        students.map((student) => {
          const marksForStudent = subjects.map((subject) => ({
            subject_id: subject.id,
            total_marks: 100,
            obtained_marks: Number(grid[student.id]?.[subject.id]) || 0,
          }));
          return api.post("/marks/bulk", {
            student_id: student.id,
            exam_id: examId,
            marks: marksForStudent,
          });
        })
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-ink mb-1">Marks Entry</h1>
      <p className="text-sm text-muted mb-8">
        Pick a class and exam once — then fill in marks for the whole class in one table and save all at once.
      </p>

      <div className="border border-hairline rounded-lg bg-paper-raised p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-muted mb-1.5">Class</label>
          <select
            value={classId}
            onChange={(e) => {
              setClassId(Number(e.target.value));
              setExamId("");
            }}
            className="w-full border border-hairline rounded-md px-3 py-2 text-sm bg-paper"
          >
            <option value="">Select class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
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
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>
        </div>
      </div>

      {classId && students.length === 0 && (
        <p className="text-sm text-muted">No students enrolled in this class yet.</p>
      )}
      {classId && subjects.length === 0 && (
        <p className="text-sm text-muted">No subjects set up for this class yet.</p>
      )}

      {loadingGrid && <p className="text-sm text-muted">Loading grid…</p>}

      {!loadingGrid && examId && students.length > 0 && subjects.length > 0 && (
        <div className="border border-hairline rounded-lg bg-paper-raised overflow-hidden">
          <div className="overflow-x-auto">
            <table className="ledger-table">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-paper-raised">Student</th>
                  {subjects.map((s) => (
                    <th key={s.id} className="whitespace-nowrap">{s.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td className="sticky left-0 bg-paper-raised font-medium whitespace-nowrap">
                      {student.roll_no} — {student.name}
                    </td>
                    {subjects.map((subject) => (
                      <td key={subject.id}>
                        <input
                          type="number"
                          value={grid[student.id]?.[subject.id] ?? ""}
                          onChange={(e) => updateCell(student.id, subject.id, e.target.value)}
                          placeholder="0"
                          className="w-16 border border-hairline rounded-md px-2 py-1.5 text-sm bg-paper"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-4 flex items-center gap-3 border-t border-hairline">
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="bg-ledger-green text-white text-sm font-medium px-6 py-2.5 rounded-md hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save All & Calculate Results"}
            </button>
            {saved && (
              <span className="text-sm text-ledger-green">Saved — all results updated.</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}