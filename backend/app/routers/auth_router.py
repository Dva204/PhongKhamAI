from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, PatientProfile, DoctorProfile, Department
from app.schemas import (
    UserRegister, UserLoginPassword, OTPRequest, OTPVerify, GoogleAuthRequest,
    Token, PatientProfileUpdate, PatientProfileResponse, DoctorProfileUpdate, DoctorProfileResponse
)
from app.auth import (
    get_password_hash, verify_password, create_access_token,
    send_mock_otp, verify_mock_otp, get_current_user, require_roles
)

router = APIRouter(prefix="/api/auth", tags=["Auth & Profile"])

@router.post("/register", response_model=Token)
def register_user(user_in: UserRegister, db: Session = Depends(get_db)):
    # Check duplicate email/phone
    if user_in.email:
        existing = db.query(User).filter(User.email == user_in.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email này đã được đăng ký.")
    if user_in.phone:
        existing = db.query(User).filter(User.phone == user_in.phone).first()
        if existing:
            raise HTTPException(status_code=400, detail="Số điện thoại này đã được đăng ký.")

    hashed_pwd = get_password_hash(user_in.password) if user_in.password else None

    user = User(
        full_name=user_in.full_name,
        email=user_in.email,
        phone=user_in.phone,
        hashed_password=hashed_pwd,
        role=user_in.role.upper()
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Automatically create profile record depending on role
    if user.role == "PATIENT":
        patient_profile = PatientProfile(user_id=user.id)
        db.add(patient_profile)
        db.commit()
    elif user.role == "DOCTOR":
        default_dept = db.query(Department).first()
        dept_id = default_dept.id if default_dept else 1
        doctor_profile = DoctorProfile(user_id=user.id, department_id=dept_id)
        db.add(doctor_profile)
        db.commit()

    token = create_access_token({"sub": user.id, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role
        }
    }

@router.post("/login", response_model=Token)
def login_password(credentials: UserLoginPassword, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        (User.email == credentials.email_or_phone) | (User.phone == credentials.email_or_phone)
    ).first()

    if not user or not user.hashed_password or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Email/SĐT hoặc mật khẩu không chính xác.")

    token = create_access_token({"sub": user.id, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role
        }
    }

@router.post("/request-otp")
def request_otp(req: OTPRequest):
    code = send_mock_otp(req.phone)
    return {"message": f"Mã OTP thử nghiệm đã được gửi tới số {req.phone}", "mock_code": code}

@router.post("/verify-otp", response_model=Token)
def verify_otp(req: OTPVerify, db: Session = Depends(get_db)):
    if not verify_mock_otp(req.phone, req.code):
        raise HTTPException(status_code=400, detail="Mã OTP không hợp lệ hoặc đã hết hạn (Mã test mặc định: 123456).")

    user = db.query(User).filter(User.phone == req.phone).first()
    if not user:
        # Create new patient user on the fly if not exists
        user = User(
            full_name=f"Bệnh nhân {req.phone[-4:]}",
            phone=req.phone,
            role="PATIENT"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        patient_profile = PatientProfile(user_id=user.id)
        db.add(patient_profile)
        db.commit()

    token = create_access_token({"sub": user.id, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "phone": user.phone,
            "role": user.role
        }
    }

@router.post("/google-login", response_model=Token)
def google_login(req: GoogleAuthRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        user = User(
            full_name=req.full_name,
            email=req.email,
            role="PATIENT"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        patient_profile = PatientProfile(user_id=user.id)
        db.add(patient_profile)
        db.commit()

    token = create_access_token({"sub": user.id, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role
        }
    }

@router.get("/me")
def get_current_user_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile_data = None
    if current_user.role == "PATIENT":
        profile = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
        if profile:
            profile_data = {
                "date_of_birth": profile.date_of_birth,
                "gender": profile.gender,
                "blood_type": profile.blood_type,
                "allergies": profile.allergies,
                "medical_history": profile.medical_history,
                "emergency_contact": profile.emergency_contact
            }
    elif current_user.role == "DOCTOR":
        profile = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user.id).first()
        if profile:
            dept = db.query(Department).filter(Department.id == profile.department_id).first()
            profile_data = {
                "doctor_profile_id": profile.id,
                "department_id": profile.department_id,
                "department_name": dept.name if dept else None,
                "title": profile.title,
                "years_experience": profile.years_experience,
                "bio": profile.bio,
                "hospital_address": profile.hospital_address,
                "consultation_fee": profile.consultation_fee,
                "rating_avg": profile.rating_avg,
                "rating_count": profile.rating_count
            }

    return {
        "id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "phone": current_user.phone,
        "role": current_user.role,
        "profile": profile_data
    }

@router.put("/patient-profile", response_model=PatientProfileResponse)
def update_patient_profile(
    profile_in: PatientProfileUpdate,
    current_user: User = Depends(require_roles(["PATIENT"])),
    db: Session = Depends(get_db)
):
    profile = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
    if not profile:
        profile = PatientProfile(user_id=current_user.id)
        db.add(profile)

    for field, val in profile_in.dict(exclude_unset=True).items():
        setattr(profile, field, val)

    db.commit()
    db.refresh(profile)
    return PatientProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        date_of_birth=profile.date_of_birth,
        gender=profile.gender,
        blood_type=profile.blood_type,
        allergies=profile.allergies,
        medical_history=profile.medical_history,
        emergency_contact=profile.emergency_contact
    )

@router.put("/doctor-profile", response_model=DoctorProfileResponse)
def update_doctor_profile(
    profile_in: DoctorProfileUpdate,
    current_user: User = Depends(require_roles(["DOCTOR"])),
    db: Session = Depends(get_db)
):
    profile = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ bác sĩ.")

    for field, val in profile_in.dict(exclude_unset=True).items():
        if val is not None:
            setattr(profile, field, val)

    db.commit()
    db.refresh(profile)
    dept = db.query(Department).filter(Department.id == profile.department_id).first()

    return DoctorProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        full_name=current_user.full_name,
        email=current_user.email,
        phone=current_user.phone,
        department_id=profile.department_id,
        department_name=dept.name if dept else None,
        department_code=dept.code if dept else None,
        title=profile.title,
        years_experience=profile.years_experience,
        bio=profile.bio,
        hospital_address=profile.hospital_address,
        consultation_fee=profile.consultation_fee,
        rating_avg=profile.rating_avg,
        rating_count=profile.rating_count,
        is_available=profile.is_available
    )
