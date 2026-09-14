import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import DoctorProfile, User, Department, DoctorSchedule, Appointment
from app.schemas import (
    DoctorProfileResponse, DoctorScheduleCreate, DoctorScheduleResponse, SlotInfo
)
from app.auth import get_current_user, require_roles

router = APIRouter(prefix="/api/doctors", tags=["Doctor Discovery & Schedules"])

@router.get("", response_model=List[DoctorProfileResponse])
def list_doctors(
    department_id: Optional[int] = Query(None, description="Lọc theo ID Chuyên khoa"),
    db: Session = Depends(get_db)
):
    query = db.query(DoctorProfile, User, Department).join(
        User, DoctorProfile.user_id == User.id
    ).join(
        Department, DoctorProfile.department_id == Department.id
    ).filter(DoctorProfile.is_available == True)

    if department_id:
        query = query.filter(DoctorProfile.department_id == department_id)

    results = query.all()
    out = []
    for doc, usr, dept in results:
        out.append(DoctorProfileResponse(
            id=doc.id,
            user_id=doc.user_id,
            full_name=usr.full_name,
            email=usr.email,
            phone=usr.phone,
            department_id=dept.id,
            department_name=dept.name,
            department_code=dept.code,
            title=doc.title,
            years_experience=doc.years_experience,
            bio=doc.bio,
            hospital_address=doc.hospital_address,
            consultation_fee=doc.consultation_fee,
            rating_avg=doc.rating_avg,
            rating_count=doc.rating_count,
            is_available=doc.is_available
        ))
    return out

@router.get("/{doctor_id}", response_model=DoctorProfileResponse)
def get_doctor_detail(doctor_id: int, db: Session = Depends(get_db)):
    result = db.query(DoctorProfile, User, Department).join(
        User, DoctorProfile.user_id == User.id
    ).join(
        Department, DoctorProfile.department_id == Department.id
    ).filter(DoctorProfile.id == doctor_id).first()

    if not result:
        raise HTTPException(status_code=404, detail="Không tìm thấy bác sĩ.")

    doc, usr, dept = result
    return DoctorProfileResponse(
        id=doc.id,
        user_id=doc.user_id,
        full_name=usr.full_name,
        email=usr.email,
        phone=usr.phone,
        department_id=dept.id,
        department_name=dept.name,
        department_code=dept.code,
        title=doc.title,
        years_experience=doc.years_experience,
        bio=doc.bio,
        hospital_address=doc.hospital_address,
        consultation_fee=doc.consultation_fee,
        rating_avg=doc.rating_avg,
        rating_count=doc.rating_count,
        is_available=doc.is_available
    )

@router.get("/{doctor_id}/slots", response_model=List[SlotInfo])
def get_doctor_available_slots(
    doctor_id: int,
    date_str: str = Query(..., description="Ngày khám dạng YYYY-MM-DD"),
    db: Session = Depends(get_db)
):
    """
    Generates 30-minute slot list for chosen date and checks booked appointments.
    """
    doc = db.query(DoctorProfile).filter(DoctorProfile.id == doctor_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy bác sĩ.")

    try:
        dt = datetime.datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD.")

    day_of_week = dt.weekday()  # 0=Monday, 6=Sunday

    # Fetch doctor schedule for this day of week
    schedules = db.query(DoctorSchedule).filter(
        DoctorSchedule.doctor_id == doctor_id,
        DoctorSchedule.day_of_week == day_of_week,
        DoctorSchedule.is_active == True
    ).all()

    # Default working hours if no custom schedule defined: 08:00 - 17:00
    time_windows = []
    if not schedules:
        time_windows.append(("08:00", "12:00"))
        time_windows.append(("13:30", "17:00"))
    else:
        for s in schedules:
            time_windows.append((s.start_time, s.end_time))

    # Fetch existing appointments for this doctor on this date
    booked_appointments = db.query(Appointment).filter(
        Appointment.doctor_id == doctor_id,
        Appointment.appointment_date == date_str,
        Appointment.status.in_(["PENDING", "CONFIRMED", "COMPLETED"])
    ).all()
    booked_start_times = set(a.start_time for a in booked_appointments)

    slots = []
    for start_w, end_w in time_windows:
        sh, sm = map(int, start_w.split(":"))
        eh, em = map(int, end_w.split(":"))

        current_time = datetime.datetime(2000, 1, 1, sh, sm)
        end_time = datetime.datetime(2000, 1, 1, eh, em)

        while current_time + datetime.timedelta(minutes=30) <= end_time:
            s_str = current_time.strftime("%H:%M")
            next_time = current_time + datetime.timedelta(minutes=30)
            e_str = next_time.strftime("%H:%M")

            is_available = s_str not in booked_start_times
            slots.append(SlotInfo(
                start_time=s_str,
                end_time=e_str,
                is_available=is_available
            ))
            current_time = next_time

    return slots

@router.post("/schedule", response_model=DoctorScheduleResponse)
def create_or_update_schedule(
    sched_in: DoctorScheduleCreate,
    current_user = Depends(require_roles(["DOCTOR", "ADMIN"])),
    db: Session = Depends(get_db)
):
    sched = DoctorSchedule(
        doctor_id=sched_in.doctor_id,
        day_of_week=sched_in.day_of_week,
        start_time=sched_in.start_time,
        end_time=sched_in.end_time,
        slot_duration=sched_in.slot_duration,
        max_patients_per_slot=sched_in.max_patients_per_slot
    )
    db.add(sched)
    db.commit()
    db.refresh(sched)
    return sched
