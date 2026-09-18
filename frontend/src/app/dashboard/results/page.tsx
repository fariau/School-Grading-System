"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Exam, SchoolClass, Result, Mark, Subject } from "@/lib/types";
import GradeBadge from "@/components/GradeBadge";

function generateAutoRemark(grade: string, percentage: number, status: string): string {
  if (status === "Fail") {
    return "Needs significant improvement. Extra attention and practice recommended in the subjects where marks fell short.";
  }
  if (grade === "A+") {
    return "Outstanding performance. Keep up the excellent work and consistency.";
  }
  if (grade === "A") {
    return "Excellent performance this term. Keep up the great effort.";
  }
  if (grade === "B") {
    return "Good performance overall. Continued focus will help push results even higher.";
  }
  if (grade === "C") {
    return "Satisfactory performance. More consistent effort and revision is encouraged.";
  }
  if (grade === "D") {
    return `Passed with ${percentage}%. Needs to work harder to strengthen understanding across subjects.`;
  }
  return "Result recorded.";
}

export default function ResultsPage() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classId, setClassId] = useState<number | "">("");
  const [examId, setExamId] = useState<number | "">("");
  const [results, setResults] = useState<Result[]>([]);
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);
  const [selectedMarks, setSelectedMarks] = useState<Mark[]>([]);
  const [remarkDraft, setRemarkDraft] = useState("");
  const [loadingCard, setLoadingCard] = useState(false);

  useEffect(() => {
    api.get<SchoolClass[]>("/classes").then((r) => setClasses(r.data));
  }, []);

  useEffect(() => {
    if (!classId) {
      setExams([]);
      setSubjects([]);
      return;
    }
    api.get<Exam[]>("/exams", { params: { class_id: classId } }).then((r) => setExams(r.data));
    api.get<Subject[]>("/subjects", { params: { class_id: classId } }).then((r) => setSubjects(r.data));
  }, [classId]);

  useEffect(() => {
    if (!examId) {
      setResults([]);
      return;
    }
    api.get<Result[]>(`/results/exam/${examId}`).then((r) => setResults(r.data));
  }, [examId]);

  async function openResultCard(r: Result) {
    setSelectedResult(r);
    setRemarkDraft(r.remarks || generateAutoRemark(r.grade, r.percentage, r.status));
    setLoadingCard(true);
    try {
      const res = await api.get<Mark[]>(`/marks/student/${r.student_id}/exam/${r.exam_id}`);
      setSelectedMarks(res.data);
    } finally {
      setLoadingCard(false);
    }
  }

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

  function handlePrint() {
    window.print();
  }

  function subjectName(subjectId: number) {
    return subjects.find((s) => s.id === subjectId)?.name ?? "Subject";
  }

  function subjectStatus(subjectId: number, obtained: number, total: number): "Pass" | "Fail" {
    if (total <= 0) return "Pass";
    const passPercent = subjects.find((s) => s.id === subjectId)?.passing_marks_percent ?? 33;
    return (obtained / total) * 100 >= passPercent ? "Pass" : "Fail";
  }

  const examName = exams.find((e) => e.id === examId)?.name ?? "";
  const className = classes.find((c) => c.id === classId)?.name ?? "";
  // Father Name isn't in the current Result type yet. Wire this up once the
  // backend sends it (e.g. r.father_name) — falls back to "-" for now.
  const fatherName = (selectedResult as unknown as { father_name?: string })?.father_name ?? "-";
  const todayStr = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-ink mb-1 print:hidden">Results</h1>
      <p className="text-sm text-muted mb-8 print:hidden">
        View the result card for each student, ranked by position.
      </p>

      <div className="border border-hairline rounded-lg bg-paper-raised p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-3 print:hidden">
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
        <div className="border border-hairline rounded-lg bg-paper-raised overflow-hidden print:hidden">
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
                      onClick={() => openResultCard(r)}
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
        <p className="text-sm text-muted print:hidden">No marks have been entered for this exam yet.</p>
      )}

      {/* Result card modal */}
      {selectedResult && (
        <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50 overflow-y-auto print:static print:bg-transparent print:p-0">
          {/* ===== On-screen card (unchanged) ===== */}
          <div className="bg-paper-raised border border-hairline rounded-lg max-w-md w-full p-7 my-8 print:hidden">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-xs text-muted mb-1">Result Card</p>
                <h2 className="font-serif text-xl font-semibold text-ink">
                  {selectedResult.student_name}
                </h2>
              </div>
              <GradeBadge grade={selectedResult.grade} />
            </div>

            <div className="mb-5">
              <p className="text-xs font-medium text-ink-soft mb-2">Subject-wise Marks</p>
              {loadingCard ? (
                <p className="text-sm text-muted">Loading…</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-hairline">
                      <th className="text-left text-xs font-semibold text-muted py-2">Subject</th>
                      <th className="text-right text-xs font-semibold text-muted py-2">Obtained Marks</th>
                      <th className="text-right text-xs font-semibold text-muted py-2">Total Marks</th>
                      <th className="text-right text-xs font-semibold text-muted py-2">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedMarks.map((m) => (
                      <tr key={m.id} className="border-b border-hairline">
                        <td className="py-2 text-sm">{subjectName(m.subject_id)}</td>
                        <td className="py-2 text-sm text-right font-medium">{m.obtained_marks}</td>
                        <td className="py-2 text-sm text-right text-muted">{m.total_marks}</td>
                        <td className="py-2 text-sm text-right text-muted">
                          {m.total_marks > 0 ? Math.round((m.obtained_marks / m.total_marks) * 1000) / 10 : 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-hairline">
                      <td className="py-2 text-sm font-semibold">Total</td>
                      <td className="py-2 text-sm text-right font-semibold">
                        {selectedResult.total_obtained_marks}
                      </td>
                      <td className="py-2 text-sm text-right font-semibold text-muted">
                        {selectedResult.total_max_marks}
                      </td>
                      <td className="py-2 text-sm text-right font-semibold">{selectedResult.percentage}%</td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>

            <dl className="space-y-2 mb-5 text-sm">
              <Row label="Position" value={String(selectedResult.position)} />
              <Row
                label="Status"
                value={selectedResult.status}
                valueClass={selectedResult.status === "Pass" ? "text-ledger-green" : "text-pen-red"}
              />
            </dl>

            <label className="block text-xs text-muted mb-1.5">
              Teacher Remarks (auto-generated — edit if needed)
            </label>
            <textarea
              value={remarkDraft}
              onChange={(e) => setRemarkDraft(e.target.value)}
              rows={3}
              className="w-full border border-hairline rounded-md px-3 py-2 text-sm bg-paper mb-5"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={handlePrint}
                className="text-sm text-ink-soft border border-hairline px-4 py-2 rounded-md hover:bg-paper transition-colors"
              >
                Download / Print PDF
              </button>
              <button onClick={() => setSelectedResult(null)} className="text-sm text-muted px-3 py-2">
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

          {/* ===== Print-only report card ===== */}
          <div id="printable-result-card" className="hidden print:block report-card">
            <div className="report-card-inner">
              <h1 className="report-title">** REPORT CARD **</h1>

              <table className="info-table">
                <tbody>
                  <tr>
                    <td className="info-label">NAME</td>
                    <td className="info-colon">:</td>
                    <td className="info-value">{(selectedResult.student_name ?? "-").toUpperCase()}</td>
                  </tr>
                  <tr>
                    <td className="info-label">FATHER NAME</td>
                    <td className="info-colon">:</td>
                    <td className="info-value">{fatherName.toUpperCase()}</td>
                  </tr>
                  <tr>
                    <td className="info-label">CLASS</td>
                    <td className="info-colon">:</td>
                    <td className="info-value">{className.toUpperCase()}</td>
                  </tr>
                </tbody>
              </table>

              <p className="section-label">RESULT STATUS{examName ? ` — ${examName.toUpperCase()}` : ""}</p>

              <table className="marks-table">
                <thead>
                  <tr>
                    <th>SUBJECT</th>
                    <th>TOTAL MARKS</th>
                    <th>OBT. MARKS</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedMarks.map((m) => (
                    <tr key={m.id}>
                      <td className="cell-subject">{subjectName(m.subject_id).toUpperCase()}</td>
                      <td className="cell-num">{m.total_marks}</td>
                      <td className="cell-num">{m.obtained_marks}</td>
                      <td className="cell-status">{subjectStatus(m.subject_id, m.obtained_marks, m.total_marks)}</td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td>TOTAL MARKS</td>
                    <td className="cell-num">{selectedResult.total_max_marks}</td>
                    <td className="cell-num">{selectedResult.total_obtained_marks}</td>
                    <td className="cell-status">{(selectedResult.status ?? "").toUpperCase()}</td>
                  </tr>
                </tbody>
              </table>

              <p className="date-line">DATE : {todayStr}</p>

              <div className="remarks-block">
                <p className="remarks-label">TEACHER REMARKS:</p>
                <p className="remarks-text">{remarkDraft}</p>
              </div>

              <div className="signatures">
                <div className="sig-block">
                  <div className="sig-line" />
                  <p>TEACHER SIGNATURE :</p>
                </div>
                <div className="sig-block">
                  <div className="sig-line" />
                  <p>PARENT'S SIGNATURE :</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media screen {
          .report-card {
            display: none;
          }
        }
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-result-card,
          #printable-result-card * {
            visibility: visible;
          }
          #printable-result-card {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            color: #000 !important;
          }

          .report-card {
            padding: 14px;
          }

          .report-card-inner {
            border: 6px double #1e7d34;
            outline: 3px solid #1e7d34;
            outline-offset: -12px;
            padding: 28px 32px;
            font-family: Georgia, "Times New Roman", serif;
            color: #111;
          }

          .report-title {
            text-align: center;
            font-size: 26px;
            font-weight: 700;
            letter-spacing: 1px;
            margin: 0 0 20px 0;
          }

          .info-table {
            margin-bottom: 14px;
            font-size: 14px;
          }
          .info-table td {
            padding: 3px 0;
            vertical-align: top;
          }
          .info-label {
            font-weight: 700;
            width: 120px;
          }
          .info-colon {
            width: 16px;
          }
          .info-value {
            font-style: italic;
          }

          .section-label {
            text-align: center;
            font-weight: 700;
            font-style: italic;
            font-size: 14px;
            margin: 16px 0 10px 0;
          }

          .marks-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
            margin-bottom: 16px;
          }
          .marks-table th,
          .marks-table td {
            border: 1px solid #1e7d34;
            padding: 8px 6px;
            text-align: center;
          }
          .marks-table th {
            background: #eaf5ec;
            font-weight: 700;
          }
          .cell-subject {
            text-align: left;
            font-weight: 600;
          }
          .cell-num {
            font-weight: 700;
            font-size: 15px;
          }
          .cell-status {
            font-weight: 700;
          }
          .total-row td {
            background: #eaf5ec;
            font-weight: 700;
          }
          .total-row .cell-num,
          .total-row .cell-status {
            font-size: 16px;
          }

          .date-line {
            font-size: 12px;
            margin: 10px 0 20px 0;
          }

          .remarks-block {
            margin-bottom: 28px;
          }
          .remarks-label {
            font-size: 12px;
            font-weight: 700;
            margin: 0 0 2px 0;
          }
          .remarks-text {
            font-size: 13px;
            margin: 0;
          }

          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
            font-size: 12px;
            font-weight: 700;
          }
          .sig-block {
            width: 45%;
          }
          .sig-line {
            border-top: 1px solid #111;
            margin-bottom: 6px;
            height: 24px;
          }
        }
      `}</style>
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