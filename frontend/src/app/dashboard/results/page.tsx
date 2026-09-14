"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Exam, SchoolClass, Result } from "@/lib/types";
import GradeBadge from "@/components/GradeBadge";

export default function ResultsPage() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [classId, setClassId] = useState<number | "">("");
  const [examId, setExamId] = useState<number | "">("");
  const [results, setResults] = useState<Result[]>([]);
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);
  const [remarkDraft, setRemarkDraft] = useState("");

  useEffect(() => {
    api.get<SchoolClass[]>("/classes").then((r) => setClasses(r.data));
  }, []);

  useEffect(() => {
    if (!classId) {
      setExams([]);
      return;
    }
    api.get<Exam[]>("/exams", { params: { class_id: classId } }).then((r) => setExams(r.data));
  }, [classId]);

  useEffect(() => {
    if (!examId) {
      setResults([]);
      return;
    }
    api.get<Result[]>(`/results/exam/${examId}`).then((r) => setResults(r.data));
  }, [examId]);

  async function saveRemark() {
    if (!selectedResult) return;
    await api.put(`/results/${selectedResult.id}/remarks`, null, {
      params: { remarks: remarkDraft },
    });
    setResults((prev) =>
      prev.map((r) => (r.id === selectedResult.id ? { ...r, remarks: remarkDraft } : r))
    );
    setSelectedResult(null);
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-ink mb-1">Results</h1>
      <p className="text-sm text-muted mb-8">
        View the result card for each student, ranked by position.
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
              <option key={c.id} value={c.id}>
                {c.name}
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

      {results.length > 0 && (
        <div className="border border-hairline rounded-lg bg-paper-raised overflow-hidden">
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Position</th>
                <th>Student</th>
                <th>Obtained / Total</th>
                <th>Percentage</th>
                <th>Grade</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id}>
                  <td className="font-serif font-semibold">{r.position}</td>
                  <td>{r.student_name}</td>
                  <td>
                    {r.total_obtained_marks} / {r.total_max_marks}
                  </td>
                  <td>{r.percentage}%</td>
                  <td>
                    <GradeBadge grade={r.grade} />
                  </td>
                  <td>
                    <span
                      className={
                        r.status === "Pass"
                          ? "text-ledger-green font-medium"
                          : "text-pen-red font-medium"
                      }
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => {
                        setSelectedResult(r);
                        setRemarkDraft(r.remarks || "");
                      }}
                      className="text-xs text-ledger-green hover:underline"
                    >
                      View / Remark
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {examId && results.length === 0 && (
        <p className="text-sm text-muted">No marks have been entered for this exam yet.</p>
      )}

      {/* Result card modal */}
      {selectedResult && (
        <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50">
          <div className="bg-paper-raised border border-hairline rounded-lg max-w-md w-full p-7">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-xs text-muted mb-1">Result Card</p>
                <h2 className="font-serif text-xl font-semibold text-ink">
                  {selectedResult.student_name}
                </h2>
              </div>
              <GradeBadge grade={selectedResult.grade} />
            </div>

            <dl className="space-y-2 mb-5 text-sm">
              <Row label="Obtained Marks" value={`${selectedResult.total_obtained_marks} / ${selectedResult.total_max_marks}`} />
              <Row label="Percentage" value={`${selectedResult.percentage}%`} />
              <Row label="Position" value={String(selectedResult.position)} />
              <Row
                label="Status"
                value={selectedResult.status}
                valueClass={selectedResult.status === "Pass" ? "text-ledger-green" : "text-pen-red"}
              />
            </dl>

            <label className="block text-xs text-muted mb-1.5">Teacher Remarks</label>
            <textarea
              value={remarkDraft}
              onChange={(e) => setRemarkDraft(e.target.value)}
              rows={3}
              className="w-full border border-hairline rounded-md px-3 py-2 text-sm bg-paper mb-5"
              placeholder="e.g. Consistent improvement across subjects."
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSelectedResult(null)}
                className="text-sm text-muted px-3 py-2"
              >
                Close
              </button>
              <button
                onClick={saveRemark}
                className="bg-ledger-green text-white text-sm font-medium px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
              >
                Save Remark
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, valueClass = "text-ink" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between border-b border-hairline pb-2">
      <dt className="text-muted">{label}</dt>
      <dd className={`font-medium ${valueClass}`}>{value}</dd>
    </div>
  );
}