"""
Core Grading Logic
- Percentage calculation
- Grade assignment
- Pass/Fail determination
- Position/ranking
"""

from sqlalchemy.orm import Session
from . import models


def calculate_grade(percentage: float) -> str:
    """Assign letter grade based on percentage"""
    if percentage >= 90:
        return "A+"
    elif percentage >= 80:
        return "A"
    elif percentage >= 70:
        return "B"
    elif percentage >= 60:
        return "C"
    elif percentage >= 50:
        return "D"
    else:
        return "F"


def calculate_student_result(db: Session, student_id: int, exam_id: int):
    """
    Calculate a single student's result for an exam:
    - Sums all subject marks
    - Computes percentage & grade
    - Checks pass/fail (fails if ANY subject is below that subject's passing %)
    """
    marks = (
        db.query(models.Mark)
        .filter(models.Mark.student_id == student_id, models.Mark.exam_id == exam_id)
        .all()
    )

    if not marks:
        return None

    total_max = sum(m.total_marks for m in marks)
    total_obtained = sum(m.obtained_marks for m in marks)
    percentage = round((total_obtained / total_max) * 100, 2) if total_max > 0 else 0.0
    grade = calculate_grade(percentage)

    # Check each subject against its own passing threshold
    failed_any_subject = False
    for m in marks:
        subject = db.query(models.Subject).filter(models.Subject.id == m.subject_id).first()
        subject_percent = (m.obtained_marks / m.total_marks) * 100 if m.total_marks > 0 else 0
        if subject and subject_percent < subject.passing_marks_percent:
            failed_any_subject = True
            break

    status = "Fail" if failed_any_subject else "Pass"

    return {
        "total_max_marks": total_max,
        "total_obtained_marks": total_obtained,
        "percentage": percentage,
        "grade": grade,
        "status": status,
    }


def calculate_positions(db: Session, exam_id: int):
    """
    Rank all students in an exam by total_obtained_marks (descending).
    Returns dict: {student_id: position}
    """
    results = (
        db.query(models.Result)
        .filter(models.Result.exam_id == exam_id)
        .order_by(models.Result.total_obtained_marks.desc())
        .all()
    )

    positions = {}
    rank = 1
    prev_marks = None
    for i, r in enumerate(results):
        if prev_marks is not None and r.total_obtained_marks < prev_marks:
            rank = i + 1
        positions[r.student_id] = rank
        prev_marks = r.total_obtained_marks

    return positions


def generate_result_for_student(db: Session, student_id: int, exam_id: int):
    """
    Full pipeline: calculate result, save/update Result row.
    Call this after marks are entered for a student.
    """
    calc = calculate_student_result(db, student_id, exam_id)
    if calc is None:
        return None

    existing = (
        db.query(models.Result)
        .filter(models.Result.student_id == student_id, models.Result.exam_id == exam_id)
        .first()
    )

    if existing:
        existing.total_max_marks = calc["total_max_marks"]
        existing.total_obtained_marks = calc["total_obtained_marks"]
        existing.percentage = calc["percentage"]
        existing.grade = calc["grade"]
        existing.status = calc["status"]
        result = existing
    else:
        result = models.Result(
            student_id=student_id,
            exam_id=exam_id,
            total_max_marks=calc["total_max_marks"],
            total_obtained_marks=calc["total_obtained_marks"],
            percentage=calc["percentage"],
            grade=calc["grade"],
            status=calc["status"],
        )
        db.add(result)

    db.commit()
    db.refresh(result)

    # Recalculate positions for the whole exam (since a new/updated result affects ranking)
    positions = calculate_positions(db, exam_id)
    for res in db.query(models.Result).filter(models.Result.exam_id == exam_id).all():
        res.position = positions.get(res.student_id)
    db.commit()
    db.refresh(result)

    return result