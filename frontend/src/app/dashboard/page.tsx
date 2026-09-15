"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import api from "@/lib/api";
import { Exam, DashboardStats } from "@/lib/types";
import StatCard from "@/components/StatCard";

const GRADE_ORDER = ["A+", "A", "B", "C", "D", "F"];
const GRADE_COLORS: Record<string, string> = {
  "A+": "#2F6F4E",
  A: "#4C8B67",
  B: "#7BAD8E",
  C: "#B8860B",
  D: "#C99A3C",
  F: "#B23A2E",
};

function normalize(text: string) {
  return text.trim().toLowerCase();
}

export default function OverviewPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamName, setSelectedExamName] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Exam[]>("/exams").then((res) => {
      setExams(res.data);
      if (res.data.length > 0) setSelectedExamName(res.data[0].name);
      else setLoading(false);
    });
  }, []);

  // Unique exam names across all classes (e.g. "Mid Term", "Final Term")
  const uniqueExamNames = Array.from(
    new Map(exams.map((ex) => [normalize(ex.name), ex.name])).values()
  );

  useEffect(() => {
    if (!selectedExamName) return;
    setLoading(true);

    // Every exam (in any class) that matches this name
    const matchingExams = exams.filter(
      (ex) => normalize(ex.name) === normalize(selectedExamName)
    );

    Promise.all(
      matchingExams.map((ex) => api.get<DashboardStats>(`/dashboard/exam/${ex.id}`))
    ).then((responses) => {
      const allStats = responses.map((r) => r.data);

      // Combine stats from every class into one overall picture
      const combined: DashboardStats = {
        total_students: allStats.reduce((sum, s) => sum + s.total_students, 0),
        passed: allStats.reduce((sum, s) => sum + s.passed, 0),
        failed: allStats.reduce((sum, s) => sum + s.failed, 0),
        highest_marks: Math.max(0, ...allStats.map((s) => s.highest_marks)),
        class_average: 0,
        grade_distribution: {},
      };

      const totalForAvg = allStats.reduce((sum, s) => sum + s.total_students, 0);
      const weightedSum = allStats.reduce(
        (sum, s) => sum + s.class_average * s.total_students,
        0
      );
      combined.class_average = totalForAvg > 0 ? Math.round((weightedSum / totalForAvg) * 100) / 100 : 0;

      for (const s of allStats) {
        for (const [grade, count] of Object.entries(s.grade_distribution)) {
          combined.grade_distribution[grade] = (combined.grade_distribution[grade] || 0) + count;
        }
      }

      setStats(combined);
      setLoading(false);
    });
  }, [selectedExamName, exams]);

  const gradeData = GRADE_ORDER.map((g) => ({
    grade: g,
    count: stats?.grade_distribution[g] || 0,
  })).filter((d) => d.count > 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-ink">Overview</h1>
          <p className="text-sm text-muted mt-1">
            Combined performance across all classes
          </p>
        </div>

        {uniqueExamNames.length > 0 && (
          <select
            value={selectedExamName ?? ""}
            onChange={(e) => setSelectedExamName(e.target.value)}
            className="border border-hairline rounded-md px-3 py-2 text-sm bg-paper-raised"
          >
            {uniqueExamNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        )}
      </div>

      {exams.length === 0 && !loading && (
        <div className="border border-hairline rounded-lg bg-paper-raised p-8 text-center">
          <p className="text-sm text-muted">
            No exams have been created yet. Add one from Classes & Subjects first.
          </p>
        </div>
      )}

      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Students" value={stats.total_students} />
            <StatCard label="Passed" value={stats.passed} tone="green" />
            <StatCard label="Failed" value={stats.failed} tone="red" />
            <StatCard
              label="Class Average"
              value={`${stats.class_average}%`}
              tone="gold"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-hairline rounded-lg bg-paper-raised p-6">
              <h3 className="text-sm font-medium text-ink-soft mb-4">
                Grade Distribution
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={gradeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4E1D8" />
                  <XAxis dataKey="grade" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "#FFFFFF",
                      border: "1px solid #E4E1D8",
                      borderRadius: 8,
                      fontSize: 13,
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {gradeData.map((entry) => (
                      <Cell key={entry.grade} fill={GRADE_COLORS[entry.grade]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="border border-hairline rounded-lg bg-paper-raised p-6">
              <h3 className="text-sm font-medium text-ink-soft mb-4">
                Pass / Fail Ratio
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Passed", value: stats.passed },
                      { name: "Failed", value: stats.failed },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    <Cell fill="#2F6F4E" />
                    <Cell fill="#B23A2E" />
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#FFFFFF",
                      border: "1px solid #E4E1D8",
                      borderRadius: 8,
                      fontSize: 13,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-6 border border-hairline rounded-lg bg-paper-raised px-6 py-4">
            <p className="text-sm text-ink-soft">
              Highest marks this exam:{" "}
              <span className="font-serif font-semibold text-ink">
                {stats.highest_marks}
              </span>
            </p>
          </div>
        </>
      )}
    </div>
  );
}