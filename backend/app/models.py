"""
Database Models for School Grading System
Using SQLAlchemy ORM with PostgreSQL
"""

from sqlalchemy import (
    Column, Integer, String, Float, ForeignKey, Boolean, DateTime, Text, Enum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import enum


class UserRole(str, enum.Enum):
    admin = "admin"
    teacher = "teacher"


class User(Base):
    """Admin and Teacher accounts"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.teacher, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    teacher_profile = relationship("Teacher", back_populates="user", uselist=False)


class AcademicSession(Base):
    """e.g. 2025-2026"""
    __tablename__ = "academic_sessions"

    id = Column(Integer, primary_key=True, index=True)
    year_label = Column(String, nullable=False)  # e.g. "2025-2026"
    is_active = Column(Boolean, default=True)

    students = relationship("Student", back_populates="session")
    exams = relationship("Exam", back_populates="session")


class SchoolClass(Base):
    """e.g. Class 9, Class 10"""
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # e.g. "Class 9"

    sections = relationship("Section", back_populates="school_class")
    subjects = relationship("Subject", back_populates="school_class")


class Section(Base):
    """e.g. Section A, B under a class"""
    __tablename__ = "sections"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # e.g. "A"
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)

    school_class = relationship("SchoolClass", back_populates="sections")
    students = relationship("Student", back_populates="section")


class Subject(Base):
    """Subjects belonging to a class"""
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # e.g. "Mathematics"
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    passing_marks_percent = Column(Float, default=33.0)  # min % to pass this subject

    school_class = relationship("SchoolClass", back_populates="subjects")
    marks = relationship("Mark", back_populates="subject")
    teacher_links = relationship("TeacherSubject", back_populates="subject")


class Teacher(Base):
    """Teacher profile linked to a User account"""
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    user = relationship("User", back_populates="teacher_profile")
    subject_links = relationship("TeacherSubject", back_populates="teacher")


class TeacherSubject(Base):
    """Many-to-many: which teacher teaches which subject"""
    __tablename__ = "teacher_subjects"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)

    teacher = relationship("Teacher", back_populates="subject_links")
    subject = relationship("Subject", back_populates="teacher_links")


class Student(Base):
    """Student enrolled in a class/section for a session"""
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    roll_no = Column(String, nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    section_id = Column(Integer, ForeignKey("sections.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("academic_sessions.id"), nullable=False)

    section = relationship("Section", back_populates="students")
    session = relationship("AcademicSession", back_populates="students")
    marks = relationship("Mark", back_populates="student")
    results = relationship("Result", back_populates="student")


class Exam(Base):
    """e.g. Mid-term, Final Term"""
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # e.g. "Mid Term 2025"
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("academic_sessions.id"), nullable=False)

    session = relationship("AcademicSession", back_populates="exams")
    marks = relationship("Mark", back_populates="exam")
    results = relationship("Result", back_populates="exam")


class Mark(Base):
    """Individual subject marks for a student in an exam"""
    __tablename__ = "marks"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False)
    total_marks = Column(Float, nullable=False, default=100.0)
    obtained_marks = Column(Float, nullable=False, default=0.0)

    student = relationship("Student", back_populates="marks")
    subject = relationship("Subject", back_populates="marks")
    exam = relationship("Exam", back_populates="marks")


class Result(Base):
    """Aggregated result per student per exam (auto-calculated)"""
    __tablename__ = "results"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False)
    total_max_marks = Column(Float, nullable=False)
    total_obtained_marks = Column(Float, nullable=False)
    percentage = Column(Float, nullable=False)
    grade = Column(String, nullable=False)
    position = Column(Integer, nullable=True)
    status = Column(String, nullable=False)  # "Pass" or "Fail"
    remarks = Column(Text, nullable=True)

    student = relationship("Student", back_populates="results")
    exam = relationship("Exam", back_populates="results")