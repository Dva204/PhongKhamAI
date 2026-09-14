from typing import Optional, List, Any
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

# --- Auth & User Schemas ---
class UserRoleEnum(str):
    PATIENT = "PATIENT"
    DOCTOR = "DOCTOR"
    ADMIN = "ADMIN"

class UserRegister(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: Optional[str] = Field(None, min_length=6)
    role: str = "PATIENT"  # PATIENT, DOCTOR, ADMIN

class UserLoginPassword(BaseModel):
    email_or_phone: str
    password: str

class OTPRequest(BaseModel):
    phone: str

class OTPVerify(BaseModel):
    phone: str
    code: str

class GoogleAuthRequest(BaseModel):
    id_token: str
    email: str
    full_name: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class PatientProfileUpdate(BaseModel):
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    blood_type: Optional[str] = None
    allergies: Optional[str] = None
    medical_history: Optional[str] = None
    emergency_contact: Optional[str] = None

class PatientProfileResponse(BaseModel):
    id: int
    user_id: int
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    blood_type: Optional[str] = None
    allergies: Optional[str] = None
    medical_history: Optional[str] = None
    emergency_contact: Optional[str] = None

class DoctorProfileUpdate(BaseModel):
    department_id: Optional[int] = None
    title: Optional[str] = None
    years_experience: Optional[int] = None
    bio: Optional[str] = None
    hospital_address: Optional[str] = None
    consultation_fee: Optional[float] = None
    is_available: Optional[bool] = None

class DoctorProfileResponse(BaseModel):
    id: int
    user_id: int
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    department_id: int
    department_name: Optional[str] = None
    department_code: Optional[str] = None
    title: str
    years_experience: int
    bio: Optional[str] = None
    hospital_address: str
    consultation_fee: float
    rating_avg: float
    rating_count: int
    is_available: bool

# --- Department Schemas ---
class DepartmentCreate(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    icon: Optional[str] = "Stethoscope"

class DepartmentResponse(BaseModel):
    id: int
    code: str
    name: str
    description: Optional[str] = None
    icon: str
    is_active: bool

# --- Doctor Schedule Schemas ---
class DoctorScheduleCreate(BaseModel):
    doctor_id: int
    day_of_week: int
    start_time: str = "08:00"
    end_time: str = "17:00"
    slot_duration: int = 30
    max_patients_per_slot: int = 1

class DoctorScheduleResponse(BaseModel):
    id: int
    doctor_id: int
    day_of_week: int
    start_time: str
    end_time: str
    slot_duration: int
    max_patients_per_slot: int
    is_active: bool

class SlotInfo(BaseModel):
    start_time: str
    end_time: str
    is_available: bool

# --- AI Symptom Checker Schemas ---
class AISymptomRequest(BaseModel):
    free_text: str = Field(..., description="Mô tả triệu chứng bệnh nhân gặp phải")
    symptom_tags: List[str] = Field(default=[], description="Danh sách tag triệu chứng chọn sẵn")
    patient_gender: Optional[str] = None
    patient_age: Optional[int] = None

class AISymptomAnalysisResult(BaseModel):
    is_emergency: bool = Field(..., description="Cảnh báo cấp cứu 115 lập tức")
    emergency_warning: Optional[str] = Field(None, description="Chi tiết lời khuyên cấp cứu nếu is_emergency=True")
    recommended_department_code: str = Field(..., description="Mã chuyên khoa được đề xuất")
    recommended_department_name: str = Field(..., description="Tên chuyên khoa được đề xuất")
    recommended_department_id: int = Field(..., description="ID phòng khám/chuyên khoa")
    confidence_score: float = Field(..., description="Điểm tin cậy từ 0.0 đến 1.0")
    medical_explanation: str = Field(..., description="Giải thích y khoa tóm tắt bằng tiếng Việt")
    suggested_action: str = Field(..., description="Hành động khuyến nghị (ví dụ: Đặt lịch khám chuyên khoa)")
    suggested_questions: List[str] = Field(default=[], description="Các câu hỏi bác sĩ có thể sẽ hỏi")

# --- Appointment Schemas ---
class AppointmentCreate(BaseModel):
    doctor_id: int
    department_id: int
    appointment_date: str  # YYYY-MM-DD
    start_time: str        # HH:MM
    end_time: str          # HH:MM
    symptoms_text: Optional[str] = None
    symptom_tags: List[str] = []
    ai_analysis: Optional[dict] = None

class AppointmentStatusUpdate(BaseModel):
    status: str  # PENDING, CONFIRMED, CANCELLED, COMPLETED
    cancelled_reason: Optional[str] = None

class DoctorCompleteAppointment(BaseModel):
    diagnosis: str
    prescription: Optional[str] = None
    doctor_notes: Optional[str] = None

class AppointmentResponse(BaseModel):
    id: int
    appointment_code: str
    patient_id: int
    patient_name: str
    patient_phone: Optional[str] = None
    doctor_id: int
    doctor_name: str
    doctor_title: str
    department_id: int
    department_name: str
    appointment_date: str
    start_time: str
    end_time: str
    status: str
    symptoms_text: Optional[str] = None
    symptom_tags: Optional[List[str]] = None
    ai_analysis: Optional[dict] = None
    diagnosis: Optional[str] = None
    prescription: Optional[str] = None
    doctor_notes: Optional[str] = None
    cancelled_reason: Optional[str] = None
    created_at: datetime

# --- Symptom Mapping Schemas ---
class SymptomMappingCreate(BaseModel):
    symptom_keyword: str
    symptom_tag: str
    department_id: int
    severity: str = "MEDIUM"
    notes: Optional[str] = None

class SymptomMappingResponse(BaseModel):
    id: int
    symptom_keyword: str
    symptom_tag: str
    department_id: int
    department_name: str
    severity: str
    notes: Optional[str] = None

# --- AI Feedback Schemas ---
class AIFeedbackCreate(BaseModel):
    appointment_id: int
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None
    was_accurate: bool = True

class AIFeedbackResponse(BaseModel):
    id: int
    appointment_id: int
    patient_id: int
    patient_name: str
    rating: int
    comment: Optional[str] = None
    was_accurate: bool
    created_at: datetime

# --- Admin Dashboard Stats Schema ---
class AdminDashboardStats(BaseModel):
    total_users: int
    total_doctors: int
    total_patients: int
    total_appointments: int
    pending_appointments: int
    confirmed_appointments: int
    completed_appointments: int
    cancelled_appointments: int
    cancellation_rate_pct: float
    avg_ai_rating: float
    total_feedbacks: int
    department_distribution: List[dict]
