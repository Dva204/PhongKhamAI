import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=True)
    phone = Column(String(20), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=True)
    full_name = Column(String(100), nullable=False)
    role = Column(String(20), default="PATIENT", nullable=False)  # PATIENT, DOCTOR, ADMIN
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    patient_profile = relationship("PatientProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    doctor_profile = relationship("DoctorProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="patient", foreign_keys="Appointment.patient_id")
    ai_feedbacks = relationship("AIFeedback", back_populates="patient")

class PatientProfile(Base):
    __tablename__ = "patient_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    date_of_birth = Column(String(20), nullable=True)
    gender = Column(String(20), nullable=True)  # Nam, Nữ, Khác
    blood_type = Column(String(10), nullable=True)
    allergies = Column(Text, nullable=True)
    medical_history = Column(Text, nullable=True)
    emergency_contact = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="patient_profile")

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)  # CARDIOLOGY, DERMATOLOGY, etc.
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(50), default="Stethoscope")
    is_active = Column(Boolean, default=True)

    # Relationships
    doctors = relationship("DoctorProfile", back_populates="department")
    symptom_mappings = relationship("SymptomMapping", back_populates="department")
    appointments = relationship("Appointment", back_populates="department")

class DoctorProfile(Base):
    __tablename__ = "doctor_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    title = Column(String(50), default="BS.CKI")  # PGS.TS.BS, ThS.BS, BS.CKI, BS.CKII
    years_experience = Column(Integer, default=5)
    bio = Column(Text, nullable=True)
    hospital_address = Column(String(255), default="Bệnh viện Đa khoa Quốc tế")
    consultation_fee = Column(Float, default=300000.0)
    rating_avg = Column(Float, default=5.0)
    rating_count = Column(Integer, default=0)
    is_available = Column(Boolean, default=True)

    # Relationships
    user = relationship("User", back_populates="doctor_profile")
    department = relationship("Department", back_populates="doctors")
    schedules = relationship("DoctorSchedule", back_populates="doctor", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="doctor")

class DoctorSchedule(Base):
    __tablename__ = "doctor_schedules"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctor_profiles.id"), nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 1=Tuesday, ..., 6=Sunday
    start_time = Column(String(10), default="08:00")  # HH:MM
    end_time = Column(String(10), default="17:00")    # HH:MM
    slot_duration = Column(Integer, default=30)  # minutes
    max_patients_per_slot = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)

    # Relationships
    doctor = relationship("DoctorProfile", back_populates="schedules")

class SymptomMapping(Base):
    __tablename__ = "symptom_mappings"

    id = Column(Integer, primary_key=True, index=True)
    symptom_keyword = Column(String(100), nullable=False, index=True)
    symptom_tag = Column(String(100), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    severity = Column(String(20), default="MEDIUM")  # EMERGENCY, HIGH, MEDIUM, LOW
    notes = Column(Text, nullable=True)

    # Relationships
    department = relationship("Department", back_populates="symptom_mappings")

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    appointment_code = Column(String(30), unique=True, index=True, nullable=False)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctor_profiles.id"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    appointment_date = Column(String(20), nullable=False)  # YYYY-MM-DD
    start_time = Column(String(10), nullable=False)        # HH:MM
    end_time = Column(String(10), nullable=False)          # HH:MM
    status = Column(String(20), default="PENDING")  # PENDING, CONFIRMED, CANCELLED, COMPLETED
    
    # AI & Patient Input
    symptoms_text = Column(Text, nullable=True)
    symptom_tags = Column(JSON, nullable=True)  # List of string tags
    ai_analysis = Column(JSON, nullable=True)   # Structured JSON from AI Engine

    # Doctor Clinical Outcome
    diagnosis = Column(Text, nullable=True)
    prescription = Column(Text, nullable=True)
    doctor_notes = Column(Text, nullable=True)
    cancelled_reason = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    patient = relationship("User", foreign_keys=[patient_id], back_populates="appointments")
    doctor = relationship("DoctorProfile", back_populates="appointments")
    department = relationship("Department", back_populates="appointments")
    feedback = relationship("AIFeedback", back_populates="appointment", uselist=False)

class AIFeedback(Base):
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), unique=True, nullable=False)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1 to 5 stars
    comment = Column(Text, nullable=True)
    was_accurate = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    appointment = relationship("Appointment", back_populates="feedback")
    patient = relationship("User", back_populates="ai_feedbacks")
