"""
Pydantic Schemas - request/response validation for the API
"""

from pydantic import BaseModel, EmailStr
from typing import Optional, List


# ---------- Academic Session ----------
class SessionCreate(BaseModel):
    year_label: str
    is_active: bool = True


class SessionOut(SessionCreate):
    id: int
    class Config:
        from_attributes = True


# ---------- Class ----------
class ClassCreate(BaseModel):
    name: str


class ClassOut(ClassCreate):
    id: int
    class Config:
        from_attributes = True


# ---------- Section ----------
class SectionCreate(BaseModel):
    name: str
    class_id: int


class SectionOut(SectionCreate):
    id: int
    class Config:
        from_attributes = True


# ---------- Subject ----------
class SubjectCreate(BaseModel):
    name: str
    class_id: int
    passing_marks_percent: float = 33.0


class SubjectOut(SubjectCreate):
    id: int
    class Config:
        from_attributes = True


# ---------- Student ----------
class StudentCreate(BaseModel):
    name: str
    roll_no: str
    class_id: int
    section_id: int
    session_id: int


class StudentOut(StudentCreate):
    id: int
    class Config:
        from_attributes = True


# ---------- Exam ----------
class ExamCreate(BaseModel):
    name: str
    class_id: int
    session_id: int


class ExamOut(ExamCreate):
    id: int
    class Config:
        from_attributes = True


# ---------- Marks ----------
class MarkCreate(BaseModel):
    student_id: int
    subject_id: int
    exam_id: int
    total_marks: float = 100.0
    obtained_marks: float


class MarkOut(MarkCreate):
    id: int
    class Config:
        from_attributes = True


class BulkMarkEntry(BaseModel):
    """For entering one student's marks across multiple subjects at once"""
    student_id: int
    exam_id: int
    marks: List[dict]  # [{"subject_id": 1, "total_marks": 100, "obtained_marks": 85}, ...]


# ---------- Result ----------
class ResultOut(BaseModel):
    id: int
    student_id: int
    student_name: Optional[str] = None
    exam_id: int
    total_max_marks: float
    total_obtained_marks: float
    percentage: float
    grade: str
    position: Optional[int] = None
    status: str
    remarks: Optional[str] = None

    class Config:
        from_attributes = True


# ---------- Auth ----------
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "teacher"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"