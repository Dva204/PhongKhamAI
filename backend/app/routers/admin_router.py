from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import (
    User, DoctorProfile, Department, Appointment, SymptomMapping, AIFeedback
)
from app.schemas import (
    AdminDashboardStats, SymptomMappingCreate, SymptomMappingResponse
)
from app.auth import require_roles

router = APIRouter(prefix="/api/admin", tags=["Admin Portal & Analytics"])

@router.get("/dashboard-stats", response_model=AdminDashboardStats)
def get_admin_dashboard_stats(
    current_user = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db)
):
    total_users = db.query(User).count()
    total_doctors = db.query(DoctorProfile).count()
    total_patients = db.query(User).filter(User.role == "PATIENT").count()

    total_apts = db.query(Appointment).count()
    pending = db.query(Appointment).filter(Appointment.status == "PENDING").count()
    confirmed = db.query(Appointment).filter(Appointment.status == "CONFIRMED").count()
    completed = db.query(Appointment).filter(Appointment.status == "COMPLETED").count()
    cancelled = db.query(Appointment).filter(Appointment.status == "CANCELLED").count()

    cancellation_pct = round((cancelled / total_apts * 100.0), 1) if total_apts > 0 else 0.0

    avg_ai_rating_query = db.query(func.avg(AIFeedback.rating)).scalar()
    avg_ai_rating = round(float(avg_ai_rating_query), 2) if avg_ai_rating_query else 4.8
    total_feedbacks = db.query(AIFeedback).count()

    # Department distribution
    dept_counts = db.query(
        Department.name, func.count(Appointment.id)
    ).join(Appointment, Appointment.department_id == Department.id, isouter=True).group_by(Department.id).all()

    dept_dist = [{"department_name": name, "count": count} for name, count in dept_counts]

    return AdminDashboardStats(
        total_users=total_users,
        total_doctors=total_doctors,
        total_patients=total_patients,
        total_appointments=total_apts,
        pending_appointments=pending,
        confirmed_appointments=confirmed,
        completed_appointments=completed,
        cancelled_appointments=cancelled,
        cancellation_rate_pct=cancellation_pct,
        avg_ai_rating=avg_ai_rating,
        total_feedbacks=total_feedbacks,
        department_distribution=dept_dist
    )

@router.get("/symptom-mappings", response_model=List[SymptomMappingResponse])
def list_symptom_mappings(
    current_user = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db)
):
    results = db.query(SymptomMapping, Department).join(
        Department, SymptomMapping.department_id == Department.id
    ).all()

    out = []
    for m, dept in results:
        out.append(SymptomMappingResponse(
            id=m.id,
            symptom_keyword=m.symptom_keyword,
            symptom_tag=m.symptom_tag,
            department_id=m.department_id,
            department_name=dept.name,
            severity=m.severity,
            notes=m.notes
        ))
    return out

@router.post("/symptom-mappings", response_model=SymptomMappingResponse)
def create_symptom_mapping(
    rule_in: SymptomMappingCreate,
    current_user = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db)
):
    dept = db.query(Department).filter(Department.id == rule_in.department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Chuyên khoa không tồn tại.")

    rule = SymptomMapping(
        symptom_keyword=rule_in.symptom_keyword,
        symptom_tag=rule_in.symptom_tag,
        department_id=rule_in.department_id,
        severity=rule_in.severity,
        notes=rule_in.notes
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)

    return SymptomMappingResponse(
        id=rule.id,
        symptom_keyword=rule.symptom_keyword,
        symptom_tag=rule.symptom_tag,
        department_id=rule.department_id,
        department_name=dept.name,
        severity=rule.severity,
        notes=rule.notes
    )
