export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "teacher";
}

export interface AcademicSession {
  id: number;
  year_label: string;
  is_active: boolean;
}

export interface SchoolClass {
  id: number;
  name: string;
}

export interface Section {
  id: number;
  name: string;
  class_id: number;
}

export interface Subject {
  id: number;
  name: string;
  class_id: number;
  passing_marks_percent: number;
}

export interface Student {
  id: number;
  name: string;
  roll_no: string;
  class_id: number;
  section_id: number;
  session_id: number;
}

export interface Exam {
  id: number;
  name: string;
  class_id: number;
  session_id: number;
}

export interface Mark {
  id: number;
  student_id: number;
  subject_id: number;
  exam_id: number;
  total_marks: number;
  obtained_marks: number;
}

export interface Result {
  id: number;
  student_id: number;
  student_name?: string;
  exam_id: number;
  total_max_marks: number;
  total_obtained_marks: number;
  percentage: number;
  grade: string;
  position: number | null;
  status: "Pass" | "Fail";
  remarks: string | null;
}

export interface DashboardStats {
  total_students: number;
  passed: number;
  failed: number;
  class_average: number;
  highest_marks: number;
  grade_distribution: Record<string, number>;
}