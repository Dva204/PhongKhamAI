import random
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Appointment, DoctorProfile, User, Department, AIFeedback
from app.schemas import (
    AppointmentCreate, AppointmentStatusUpdate, DoctorCompleteAppointment, AppointmentResponse
)
from app.auth import get_current_user, require_roles

router = APIRouter(prefix="/api/appointments", tags=["Appointment Booking & Management"])

def generate_appointment_code() -> str:
    today_str = datetime.date.today().strftime("%Y%m%d")
    rand_digits = random.randint(1000, 9999)
    return f"APT-{today_str}-{rand_digits}"

@router.post("", response_model=AppointmentResponse)
def create_appointment(
    apt_in: AppointmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify doctor existence
    doc = db.query(DoctorProfile).filter(DoctorProfile.id == apt_in.doctor_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy thông tin bác sĩ.")

    doc_user = db.query(User).filter(User.id == doc.user_id).first()
    dept = db.query(Department).filter(Department.id == apt_in.department_id).first()

    # Check slot collision
    existing = db.query(Appointment).filter(
        Appointment.doctor_id == apt_in.doctor_id,
        Appointment.appointment_date == apt_in.appointment_date,
        Appointment.start_time == apt_in.start_time,
        Appointment.status.in_(["PENDING", "CONFIRMED"])
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Khung giờ này đã có người khác đặt. Vui lòng chọn khung giờ khác.")

    code = generate_appointment_code()

    apt = Appointment(
        appointment_code=code,
        patient_id=current_user.id,
        doctor_id=apt_in.doctor_id,
        department_id=apt_in.department_id,
        appointment_date=apt_in.appointment_date,
        start_time=apt_in.start_time,
        end_time=apt_in.end_time,
        status="CONFIRMED",  # Instant booking confirmed
        symptoms_text=apt_in.symptoms_text,
        symptom_tags=apt_in.symptom_tags,
        ai_analysis=apt_in.ai_analysis
    )

    db.add(apt)
    db.commit()
    db.refresh(apt)

    return AppointmentResponse(
        id=apt.id,
        appointment_code=apt.appointment_code,
        patient_id=current_user.id,
        patient_name=current_user.full_name,
        patient_phone=current_user.phone,
        doctor_id=doc.id,
        doctor_name=doc_user.full_name if doc_user else "Bác sĩ",
        doctor_title=doc.title,
        department_id=dept.id,
        department_name=dept.name if dept else "Chuyên khoa",
        appointment_date=apt.appointment_date,
        start_time=apt.start_time,
        end_time=apt.end_time,
        status=apt.status,
        symptoms_text=apt.symptoms_text,
        symptom_tags=apt.symptom_tags,
        ai_analysis=apt.ai_analysis,
        diagnosis=apt.diagnosis,
        prescription=apt.prescription,
        doctor_notes=apt.doctor_notes,
        cancelled_reason=apt.cancelled_reason,
        created_at=apt.created_at
    )

@router.get("/my-history", response_model=List[AppointmentResponse])
def get_patient_appointment_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Appointment, DoctorProfile, User, Department).join(
        DoctorProfile, Appointment.doctor_id == DoctorProfile.id
    ).join(
        User, DoctorProfile.user_id == User.id
    ).join(
        Department, Appointment.department_id == Department.id
    ).filter(
        Appointment.patient_id == current_user.id
    ).order_by(Appointment.created_at.desc()).all()

    out = []
    for apt, doc, doc_usr, dept in query:
        out.append(AppointmentResponse(
            id=apt.id,
            appointment_code=apt.appointment_code,
            patient_id=current_user.id,
            patient_name=current_user.full_name,
            patient_phone=current_user.phone,
            doctor_id=doc.id,
            doctor_name=doc_usr.full_name,
            doctor_title=doc.title,
            department_id=dept.id,
            department_name=dept.name,
            appointment_date=apt.appointment_date,
            start_time=apt.start_time,
            end_time=apt.end_time,
            status=apt.status,
            symptoms_text=apt.symptoms_text,
            symptom_tags=apt.symptom_tags,
            ai_analysis=apt.ai_analysis,
            diagnosis=apt.diagnosis,
            prescription=apt.prescription,
            doctor_notes=apt.doctor_notes,
            cancelled_reason=apt.cancelled_reason,
            created_at=apt.created_at
        ))
    return out

@router.get("/doctor-shift", response_model=List[AppointmentResponse])
def get_doctor_shift_appointments(
    date_str: Optional[str] = Query(None, description="YYYY-MM-DD filter"),
    current_user: User = Depends(require_roles(["DOCTOR", "ADMIN"])),
    db: Session = Depends(get_db)
):
    # Find doctor profile ID
    doc_profile = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user.id).first()
    if not doc_profile and current_user.role == "DOCTOR":
        raise HTTPException(status_code=404, detail="Chưa cấu hình hồ sơ bác sĩ.")

    query = db.query(Appointment, User, Department).join(
        User, Appointment.patient_id == User.id
    ).join(
        Department, Appointment.department_id == Department.id
    )

    if current_user.role == "DOCTOR":
        query = query.filter(Appointment.doctor_id == doc_profile.id)

    if date_str:
        query = query.filter(Appointment.appointment_date == date_str)

    results = query.order_by(Appointment.appointment_date.desc(), Appointment.start_time.asc()).all()

    out = []
    for apt, pat_usr, dept in results:
        doc = db.query(DoctorProfile).filter(DoctorProfile.id == apt.doctor_id).first()
        doc_usr = db.query(User).filter(User.id == doc.user_id).first() if doc else None

        out.append(AppointmentResponse(
            id=apt.id,
            appointment_code=apt.appointment_code,
            patient_id=pat_usr.id,
            patient_name=pat_usr.full_name,
            patient_phone=pat_usr.phone,
            doctor_id=apt.doctor_id,
            doctor_name=doc_usr.full_name if doc_usr else "Bác sĩ",
            doctor_title=doc.title if doc else "BS",
            department_id=dept.id,
            department_name=dept.name,
            appointment_date=apt.appointment_date,
            start_time=apt.start_time,
            end_time=apt.end_time,
            status=apt.status,
            symptoms_text=apt.symptoms_text,
            symptom_tags=apt.symptom_tags,
            ai_analysis=apt.ai_analysis,
            diagnosis=apt.diagnosis,
            prescription=apt.prescription,
            doctor_notes=apt.doctor_notes,
            cancelled_reason=apt.cancelled_reason,
            created_at=apt.created_at
        ))
    return out

@router.put("/{apt_id}/status", response_model=AppointmentResponse)
def update_appointment_status(
    apt_id: int,
    status_in: AppointmentStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    apt = db.query(Appointment).filter(Appointment.id == apt_id).first()
    if not apt:
        raise HTTPException(status_code=404, detail="Không tìm thấy lịch khám.")

    apt.status = status_in.status.upper()
    if status_in.cancelled_reason:
        apt.cancelled_reason = status_in.cancelled_reason

    db.commit()
    db.refresh(apt)

    pat_usr = db.query(User).filter(User.id == apt.patient_id).first()
    doc = db.query(DoctorProfile).filter(DoctorProfile.id == apt.doctor_id).first()
    doc_usr = db.query(User).filter(User.id == doc.user_id).first() if doc else None
    dept = db.query(Department).filter(Department.id == apt.department_id).first()

    return AppointmentResponse(
        id=apt.id,
        appointment_code=apt.appointment_code,
        patient_id=apt.patient_id,
        patient_name=pat_usr.full_name if pat_usr else "Bệnh nhân",
        patient_phone=pat_usr.phone if pat_usr else None,
        doctor_id=apt.doctor_id,
        doctor_name=doc_usr.full_name if doc_usr else "Bác sĩ",
        doctor_title=doc.title if doc else "BS",
        department_id=dept.id,
        department_name=dept.name if dept else "Chuyên khoa",
        appointment_date=apt.appointment_date,
        start_time=apt.start_time,
        end_time=apt.end_time,
        status=apt.status,
        symptoms_text=apt.symptoms_text,
        symptom_tags=apt.symptom_tags,
        ai_analysis=apt.ai_analysis,
        diagnosis=apt.diagnosis,
        prescription=apt.prescription,
        doctor_notes=apt.doctor_notes,
        cancelled_reason=apt.cancelled_reason,
        created_at=apt.created_at
    )

@router.put("/{apt_id}/complete", response_model=AppointmentResponse)
def doctor_complete_appointment(
    apt_id: int,
    outcome: DoctorCompleteAppointment,
    current_user: User = Depends(require_roles(["DOCTOR", "ADMIN"])),
    db: Session = Depends(get_db)
):
    """
    Pkg D: Doctor inputs final diagnosis and prescription, marking appointment as COMPLETED.
    """
    apt = db.query(Appointment).filter(Appointment.id == apt_id).first()
    if not apt:
        raise HTTPException(status_code=404, detail="Không tìm thấy ca khám.")

    apt.diagnosis = outcome.diagnosis
    apt.prescription = outcome.prescription
    apt.doctor_notes = outcome.doctor_notes
    apt.status = "COMPLETED"

    db.commit()
    db.refresh(apt)

    pat_usr = db.query(User).filter(User.id == apt.patient_id).first()
    doc = db.query(DoctorProfile).filter(DoctorProfile.id == apt.doctor_id).first()
    doc_usr = db.query(User).filter(User.id == doc.user_id).first() if doc else None
    dept = db.query(Department).filter(Department.id == apt.department_id).first()

    return AppointmentResponse(
        id=apt.id,
        appointment_code=apt.appointment_code,
        patient_id=apt.patient_id,
        patient_name=pat_usr.full_name if pat_usr else "Bệnh nhân",
        patient_phone=pat_usr.phone if pat_usr else None,
        doctor_id=apt.doctor_id,
        doctor_name=doc_usr.full_name if doc_usr else "Bác sĩ",
        doctor_title=doc.title if doc else "BS",
        department_id=dept.id,
        department_name=dept.name if dept else "Chuyên khoa",
        appointment_date=apt.appointment_date,
        start_time=apt.start_time,
        end_time=apt.end_time,
        status=apt.status,
        symptoms_text=apt.symptoms_text,
        symptom_tags=apt.symptom_tags,
        ai_analysis=apt.ai_analysis,
        diagnosis=apt.diagnosis,
        prescription=apt.prescription,
        doctor_notes=apt.doctor_notes,
        cancelled_reason=apt.cancelled_reason,
        created_at=apt.created_at
    )
