"""
School Grading System - Main FastAPI Application
"""

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List

from . import models, schemas, auth, grading
from .database import engine, get_db, Base

# Create all tables (for dev; use Alembic migrations for production)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="School Grading System API")

# Allow the Next.js frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== AUTH ====================

@app.post("/auth/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = models.User(
        name=user.name,
        email=user.email,
        password_hash=auth.hash_password(user.password),
        role=user.role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.post("/auth/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    token = auth.create_access_token(data={"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}


@app.get("/auth/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


# ==================== ACADEMIC SESSIONS ====================

@app.post("/sessions", response_model=schemas.SessionOut)
def create_session(payload: schemas.SessionCreate, db: Session = Depends(get_db),
                    current_user: models.User = Depends(auth.get_current_user)):
    obj = models.AcademicSession(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@app.get("/sessions", response_model=List[schemas.SessionOut])
def list_sessions(db: Session = Depends(get_db),
                   current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.AcademicSession).all()


@app.delete("/sessions/{session_id}")
def delete_session(session_id: int, db: Session = Depends(get_db),
                    current_user: models.User = Depends(auth.get_current_user)):
    obj = db.query(models.AcademicSession).filter(models.AcademicSession.id == session_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(obj)
    db.commit()
    return {"detail": "Session deleted"}


# ==================== CLASSES ====================

@app.post("/classes", response_model=schemas.ClassOut)
def create_class(payload: schemas.ClassCreate, db: Session = Depends(get_db),
                  current_user: models.User = Depends(auth.get_current_user)):
    obj = models.SchoolClass(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@app.get("/classes", response_model=List[schemas.ClassOut])
def list_classes(db: Session = Depends(get_db),
                  current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.SchoolClass).all()


@app.delete("/classes/{class_id}")
def delete_class(class_id: int, db: Session = Depends(get_db),
                  current_user: models.User = Depends(auth.get_current_user)):
    obj = db.query(models.SchoolClass).filter(models.SchoolClass.id == class_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Class not found")
    db.delete(obj)
    db.commit()
    return {"detail": "Class deleted"}


# ==================== SECTIONS ====================

@app.post("/sections", response_model=schemas.SectionOut)
def create_section(payload: schemas.SectionCreate, db: Session = Depends(get_db),
                    current_user: models.User = Depends(auth.get_current_user)):
    obj = models.Section(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@app.get("/sections", response_model=List[schemas.SectionOut])
def list_sections(class_id: int = None, db: Session = Depends(get_db),
                   current_user: models.User = Depends(auth.get_current_user)):
    q = db.query(models.Section)
    if class_id:
        q = q.filter(models.Section.class_id == class_id)
    return q.all()


@app.delete("/sections/{section_id}")
def delete_section(section_id: int, db: Session = Depends(get_db),
                    current_user: models.User = Depends(auth.get_current_user)):
    obj = db.query(models.Section).filter(models.Section.id == section_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Section not found")
    db.delete(obj)
    db.commit()
    return {"detail": "Section deleted"}


# ==================== SUBJECTS ====================

@app.post("/subjects", response_model=schemas.SubjectOut)
def create_subject(payload: schemas.SubjectCreate, db: Session = Depends(get_db),
                    current_user: models.User = Depends(auth.get_current_user)):
    obj = models.Subject(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@app.get("/subjects", response_model=List[schemas.SubjectOut])
def list_subjects(class_id: int = None, db: Session = Depends(get_db),
                   current_user: models.User = Depends(auth.get_current_user)):
    q = db.query(models.Subject)
    if class_id:
        q = q.filter(models.Subject.class_id == class_id)
    return q.all()


@app.delete("/subjects/{subject_id}")
def delete_subject(subject_id: int, db: Session = Depends(get_db),
                    current_user: models.User = Depends(auth.get_current_user)):
    obj = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Subject not found")
    db.delete(obj)
    db.commit()
    return {"detail": "Subject deleted"}


# ==================== STUDENTS ====================

@app.post("/students", response_model=schemas.StudentOut)
def create_student(payload: schemas.StudentCreate, db: Session = Depends(get_db),
                    current_user: models.User = Depends(auth.get_current_user)):
    obj = models.Student(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@app.get("/students", response_model=List[schemas.StudentOut])
def list_students(class_id: int = None, section_id: int = None,
                   db: Session = Depends(get_db),
                   current_user: models.User = Depends(auth.get_current_user)):
    q = db.query(models.Student)
    if class_id:
        q = q.filter(models.Student.class_id == class_id)
    if section_id:
        q = q.filter(models.Student.section_id == section_id)
    return q.all()


@app.put("/students/{student_id}", response_model=schemas.StudentOut)
def update_student(student_id: int, payload: schemas.StudentCreate,
                    db: Session = Depends(get_db),
                    current_user: models.User = Depends(auth.get_current_user)):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    for key, value in payload.dict().items():
        setattr(student, key, value)
    db.commit()
    db.refresh(student)
    return student


@app.delete("/students/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db),
                    current_user: models.User = Depends(auth.get_current_user)):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    db.delete(student)
    db.commit()
    return {"detail": "Student deleted"}


# ==================== EXAMS ====================

@app.post("/exams", response_model=schemas.ExamOut)
def create_exam(payload: schemas.ExamCreate, db: Session = Depends(get_db),
                 current_user: models.User = Depends(auth.get_current_user)):
    obj = models.Exam(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@app.get("/exams", response_model=List[schemas.ExamOut])
def list_exams(class_id: int = None, db: Session = Depends(get_db),
                current_user: models.User = Depends(auth.get_current_user)):
    q = db.query(models.Exam)
    if class_id:
        q = q.filter(models.Exam.class_id == class_id)
    return q.all()


@app.delete("/exams/{exam_id}")
def delete_exam(exam_id: int, db: Session = Depends(get_db),
                 current_user: models.User = Depends(auth.get_current_user)):
    obj = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Exam not found")
    db.delete(obj)
    db.commit()
    return {"detail": "Exam deleted"}


# ==================== MARKS ENTRY (core feature) ====================

@app.post("/marks", response_model=schemas.MarkOut)
def add_mark(payload: schemas.MarkCreate, db: Session = Depends(get_db),
             current_user: models.User = Depends(auth.get_current_user)):
    """Add or update a single subject mark, then auto-recalculate the student's result."""
    existing = (
        db.query(models.Mark)
        .filter(
            models.Mark.student_id == payload.student_id,
            models.Mark.subject_id == payload.subject_id,
            models.Mark.exam_id == payload.exam_id,
        )
        .first()
    )
    if existing:
        existing.total_marks = payload.total_marks
        existing.obtained_marks = payload.obtained_marks
        mark = existing
    else:
        mark = models.Mark(**payload.dict())
        db.add(mark)

    db.commit()
    db.refresh(mark)

    # Auto-calculate result (percentage, grade, pass/fail, position) immediately
    grading.generate_result_for_student(db, payload.student_id, payload.exam_id)

    return mark


@app.post("/marks/bulk")
def add_bulk_marks(payload: schemas.BulkMarkEntry, db: Session = Depends(get_db),
                    current_user: models.User = Depends(auth.get_current_user)):
    """Enter all subject marks for one student in one exam at once."""
    for item in payload.marks:
        existing = (
            db.query(models.Mark)
            .filter(
                models.Mark.student_id == payload.student_id,
                models.Mark.subject_id == item["subject_id"],
                models.Mark.exam_id == payload.exam_id,
            )
            .first()
        )
        if existing:
            existing.total_marks = item.get("total_marks", 100.0)
            existing.obtained_marks = item["obtained_marks"]
        else:
            db.add(models.Mark(
                student_id=payload.student_id,
                subject_id=item["subject_id"],
                exam_id=payload.exam_id,
                total_marks=item.get("total_marks", 100.0),
                obtained_marks=item["obtained_marks"],
            ))
    db.commit()

    result = grading.generate_result_for_student(db, payload.student_id, payload.exam_id)
    return {"detail": "Marks saved", "result_id": result.id if result else None}


@app.get("/marks/student/{student_id}/exam/{exam_id}", response_model=List[schemas.MarkOut])
def get_student_marks(student_id: int, exam_id: int, db: Session = Depends(get_db),
                       current_user: models.User = Depends(auth.get_current_user)):
    return (
        db.query(models.Mark)
        .filter(models.Mark.student_id == student_id, models.Mark.exam_id == exam_id)
        .all()
    )


# ==================== RESULTS / RESULT CARD ====================

@app.get("/results/exam/{exam_id}", response_model=List[schemas.ResultOut])
def get_exam_results(exam_id: int, db: Session = Depends(get_db),
                      current_user: models.User = Depends(auth.get_current_user)):
    """Full result list for an exam (for dashboard/class view), sorted by position."""
    results = (
        db.query(models.Result)
        .filter(models.Result.exam_id == exam_id)
        .order_by(models.Result.position)
        .all()
    )
    output = []
    for r in results:
        student = db.query(models.Student).filter(models.Student.id == r.student_id).first()
        output.append(schemas.ResultOut(
            id=r.id, student_id=r.student_id,
            student_name=student.name if student else None,
            exam_id=r.exam_id, total_max_marks=r.total_max_marks,
            total_obtained_marks=r.total_obtained_marks, percentage=r.percentage,
            grade=r.grade, position=r.position, status=r.status, remarks=r.remarks,
        ))
    return output


@app.get("/results/student/{student_id}/exam/{exam_id}", response_model=schemas.ResultOut)
def get_student_result_card(student_id: int, exam_id: int, db: Session = Depends(get_db),
                             current_user: models.User = Depends(auth.get_current_user)):
    """Single student's full result card."""
    r = (
        db.query(models.Result)
        .filter(models.Result.student_id == student_id, models.Result.exam_id == exam_id)
        .first()
    )
    if not r:
        raise HTTPException(status_code=404, detail="Result not found for this student/exam")
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    return schemas.ResultOut(
        id=r.id, student_id=r.student_id,
        student_name=student.name if student else None,
        exam_id=r.exam_id, total_max_marks=r.total_max_marks,
        total_obtained_marks=r.total_obtained_marks, percentage=r.percentage,
        grade=r.grade, position=r.position, status=r.status, remarks=r.remarks,
    )


@app.put("/results/{result_id}/remarks")
def update_remarks(result_id: int, remarks: str, db: Session = Depends(get_db),
                    current_user: models.User = Depends(auth.get_current_user)):
    """Teacher adds a remark to a student's result card."""
    r = db.query(models.Result).filter(models.Result.id == result_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Result not found")
    r.remarks = remarks
    db.commit()
    return {"detail": "Remarks updated"}


# ==================== DASHBOARD / ANALYTICS ====================

@app.get("/dashboard/exam/{exam_id}")
def exam_dashboard(exam_id: int, db: Session = Depends(get_db),
                    current_user: models.User = Depends(auth.get_current_user)):
    """Summary stats for a given exam: totals, pass/fail, average, highest, grade distribution."""
    results = db.query(models.Result).filter(models.Result.exam_id == exam_id).all()
    if not results:
        return {
            "total_students": 0, "passed": 0, "failed": 0,
            "class_average": 0, "highest_marks": 0, "grade_distribution": {},
        }

    total_students = len(results)
    passed = sum(1 for r in results if r.status == "Pass")
    failed = total_students - passed
    class_average = round(sum(r.percentage for r in results) / total_students, 2)
    highest_marks = max(r.total_obtained_marks for r in results)

    grade_distribution = {}
    for r in results:
        grade_distribution[r.grade] = grade_distribution.get(r.grade, 0) + 1

    return {
        "total_students": total_students,
        "passed": passed,
        "failed": failed,
        "class_average": class_average,
        "highest_marks": highest_marks,
        "grade_distribution": grade_distribution,
    }

@app.get("/marks/exam/{exam_id}", response_model=List[schemas.MarkOut])
def get_all_marks_for_exam(exam_id: int, db: Session = Depends(get_db),
                            current_user: models.User = Depends(auth.get_current_user)):
    """All marks for every student in a given exam — used for the spreadsheet-style entry table."""
    return db.query(models.Mark).filter(models.Mark.exam_id == exam_id).all()