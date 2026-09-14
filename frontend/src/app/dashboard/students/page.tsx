"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Student, SchoolClass, Section, AcademicSession } from "@/lib/types";

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);

  const [name, setName] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [classId, setClassId] = useState<number | "">("");
  const [sectionId, setSectionId] = useState<number | "">("");
  const [sessionId, setSessionId] = useState<number | "">("");
  const [editingId, setEditingId] = useState<number | null>(null);

  function refresh() {
    api.get<Student[]>("/students").then((r) => setStudents(r.data));
    api.get<SchoolClass[]>("/classes").then((r) => setClasses(r.data));
    api.get<Section[]>("/sections").then((r) => setSections(r.data));
    api.get<AcademicSession[]>("/sessions").then((r) => setSessions(r.data));
  }

  useEffect(refresh, []);

  function resetForm() {
    setName("");
    setRollNo("");
    setClassId("");
    setSectionId("");
    setSessionId("");
    setEditingId(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !rollNo.trim() || !classId || !sectionId || !sessionId) return;

    const payload = {
      name,
      roll_no: rollNo,
      class_id: classId,
      section_id: sectionId,
      session_id: sessionId,
    };

    if (editingId) {
      await api.put(`/students/${editingId}`, payload);
    } else {
      await api.post("/students", payload);
    }
    resetForm();
    refresh();
  }

  function startEdit(s: Student) {
    setEditingId(s.id);
    setName(s.name);
    setRollNo(s.roll_no);
    setClassId(s.class_id);
    setSectionId(s.section_id);
    setSessionId(s.session_id);
  }

  async function handleDelete(id: number) {
    if (!confirm("Remove this student?")) return;
    await api.delete(`/students/${id}`);
    refresh();
  }

  const filteredSections = sections.filter((s) => s.class_id === classId);

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-ink mb-1">Students</h1>
      <p className="text-sm text-muted mb-8">Manage student enrollment records.</p>

      <form
        onSubmit={handleSubmit}
        className="border border-hairline rounded-lg bg-paper-raised p-6 mb-8 grid grid-cols-1 md:grid-cols-5 gap-3 items-end"
      >
        <div className="md:col-span-2">
          <label className="block text-xs text-muted mb-1.5">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-hairline rounded-md px-3 py-2 text-sm bg-paper"
            placeholder="Student name"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1.5">Roll No.</label>
          <input
            value={rollNo}
            onChange={(e) => setRollNo(e.target.value)}
            className="w-full border border-hairline rounded-md px-3 py-2 text-sm bg-paper"
            placeholder="e.g. 21"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1.5">Class</label>
          <select
            value={classId}
            onChange={(e) => {
              setClassId(Number(e.target.value));
              setSectionId("");
            }}
            className="w-full border border-hairline rounded-md px-3 py-2 text-sm bg-paper"
          >
            <option value="">Select</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted mb-1.5">Section</label>
          <select
            value={sectionId}
            onChange={(e) => setSectionId(Number(e.target.value))}
            className="w-full border border-hairline rounded-md px-3 py-2 text-sm bg-paper"
          >
            <option value="">Select</option>
            {filteredSections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-muted mb-1.5">Session</label>
          <select
            value={sessionId}
            onChange={(e) => setSessionId(Number(e.target.value))}
            className="w-full border border-hairline rounded-md px-3 py-2 text-sm bg-paper"
          >
            <option value="">Select</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.year_label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-ledger-green text-white text-sm font-medium px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
          >
            {editingId ? "Update" : "Add Student"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-sm text-muted px-3 py-2"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="border border-hairline rounded-lg bg-paper-raised overflow-hidden">
        <table className="ledger-table">
          <thead>
            <tr>
              <th>Roll No.</th>
              <th>Name</th>
              <th>Class</th>
              <th>Section</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id}>
                <td>{s.roll_no}</td>
                <td>{s.name}</td>
                <td>{classes.find((c) => c.id === s.class_id)?.name}</td>
                <td>{sections.find((sec) => sec.id === s.section_id)?.name}</td>
                <td className="text-right">
                  <button
                    onClick={() => startEdit(s)}
                    className="text-xs text-ledger-green hover:underline mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="text-xs text-pen-red hover:underline"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-muted py-8">
                  No students enrolled yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}