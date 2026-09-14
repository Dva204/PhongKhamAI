from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import AIFeedback, Appointment, User, DoctorProfile, Department
from app.schemas import AISymptomRequest, AIFeedbackCreate, AIFeedbackResponse
from app.services.ai_service import AISymptomService
from app.auth import get_current_user

router = APIRouter(prefix="/api/ai", tags=["AI Symptom Checker & Feedback"])

@router.post("/analyze-symptoms")
def analyze_symptoms(
    req: AISymptomRequest,
    db: Session = Depends(get_db)
):
    """
    Core AI Symptom Analysis Endpoint:
    1. Analyzes free text symptoms & tags via LLM or Rule Engine.
    2. Detects life-threatening emergency signs (is_emergency).
    3. Recommends target clinical department.
    4. Automatically retrieves doctors in that department for instant booking.
    """
    analysis_result = AISymptomService.analyze_symptoms(db, req)

    # Automatically fetch available doctors in the recommended department
    doctors_query = db.query(DoctorProfile, User, Department).join(
        User, DoctorProfile.user_id == User.id
    ).join(
        Department, DoctorProfile.department_id == Department.id
    ).filter(
        DoctorProfile.department_id == analysis_result.recommended_department_id,
        DoctorProfile.is_available == True
    ).all()

    doctor_list = []
    for doc, usr, dept in doctors_query:
        doctor_list.append({
            "id": doc.id,
            "full_name": usr.full_name,
            "title": doc.title,
            "years_experience": doc.years_experience,
            "bio": doc.bio,
            "consultation_fee": doc.consultation_fee,
            "rating_avg": doc.rating_avg,
            "rating_count": doc.rating_count,
            "department_name": dept.name
        })

    return {
        "analysis": analysis_result.dict(),
        "recommended_doctors": doctor_list
    }

@router.post("/feedback", response_model=AIFeedbackResponse)
def submit_ai_feedback(
    fb_in: AIFeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify appointment belongs to user or check existence
    appointment = db.query(Appointment).filter(Appointment.id == fb_in.appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Không tìm thấy lịch khám liên quan.")

    existing_fb = db.query(AIFeedback).filter(AIFeedback.appointment_id == fb_in.appointment_id).first()
    if existing_fb:
        # Update existing feedback
        existing_fb.rating = fb_in.rating
        existing_fb.comment = fb_in.comment
        existing_fb.was_accurate = fb_in.was_accurate
        db.commit()
        db.refresh(existing_fb)
        fb_obj = existing_fb
    else:
        fb_obj = AIFeedback(
            appointment_id=fb_in.appointment_id,
            patient_id=current_user.id,
            rating=fb_in.rating,
            comment=fb_in.comment,
            was_accurate=fb_in.was_accurate
        )
        db.add(fb_obj)
        db.commit()
        db.refresh(fb_obj)

    return AIFeedbackResponse(
        id=fb_obj.id,
        appointment_id=fb_obj.appointment_id,
        patient_id=fb_obj.patient_id,
        patient_name=current_user.full_name,
        rating=fb_obj.rating,
        comment=fb_obj.comment,
        was_accurate=fb_obj.was_accurate,
        created_at=fb_obj.created_at
    )
