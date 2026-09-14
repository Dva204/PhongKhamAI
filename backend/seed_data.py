import sys
import os
import datetime

# Add current dir to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, SessionLocal, Base
from app.models import (
    User, PatientProfile, DoctorProfile, Department, DoctorSchedule,
    SymptomMapping, Appointment, AIFeedback
)
from app.auth import get_password_hash

def seed_database():
    print("[INIT] Re-creating database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        print("[SEED] Seeding Medical Departments...")
        depts = [
            Department(
                code="INTERNAL_MEDICINE",
                name="Nội tổng quát",
                description="Thăm khám, chẩn đoán các bệnh lý nội khoa đường tiêu hóa, hô hấp, tuần hoàn.",
                icon="Activity"
            ),
            Department(
                code="CARDIOLOGY",
                name="Tim mạch",
                description="Tầm soát và điều trị tăng huyết áp, rối loạn nhịp tim, bệnh mạch vành.",
                icon="Heart"
            ),
            Department(
                code="DERMATOLOGY",
                name="Da liễu",
                description="Chẩn đoán & điều trị viêm da, dị ứng, mụn trứng cá, bệnh ngoài da.",
                icon="Sparkles"
            ),
            Department(
                code="PEDIATRICS",
                name="Nhi khoa",
                description="Chăm sóc sức khỏe toàn diện và tiêm chủng cho trẻ sơ sinh và trẻ nhỏ.",
                icon="Baby"
            ),
            Department(
                code="ENT",
                name="Tai Mũi Họng",
                description="Khám chữa viêm xoang, viêm họng, viêm tai giữa, hạt dây thanh.",
                icon="Headphones"
            ),
            Department(
                code="NEUROLOGY",
                name="Thần kinh",
                description="Điều trị đau đầu mãn tính, rối loạn giấc ngủ, thần kinh tọa, tiền đình.",
                icon="Brain"
            ),
            Department(
                code="OBGYN",
                name="Sản phụ khoa",
                description="Khám thai định kỳ, chăm sóc sức khỏe phụ nữ, tư vấn sinh sản.",
                icon="Users"
            ),
            Department(
                code="OPHTHALMOLOGY",
                name="Mắt (Nhãn khoa)",
                description="Tầm soát khúc xạ, đau mắt đỏ, đục thủy tinh thể và tổn thương võng mạc.",
                icon="Eye"
            )
        ]
        db.add_all(depts)
        db.commit()

        dept_map = {d.code: d.id for d in db.query(Department).all()}

        print("[SEED] Seeding AI Symptom Mapping Rules (Internal Knowledge Base)...")
        rules = [
            # Tim mạch / Emergency
            SymptomMapping(symptom_keyword="đau ngực dữ dội", symptom_tag="Đau ngực", department_id=dept_map["CARDIOLOGY"], severity="EMERGENCY", notes="Dấu hiệu đe dọa nhồi máu cơ tim cấp. Gọi ngay 115!"),
            SymptomMapping(symptom_keyword="ép ngực", symptom_tag="Khó thở", department_id=dept_map["CARDIOLOGY"], severity="EMERGENCY", notes="Nguy cơ suy tim cấp hoặc thắt ngực ổn định."),
            SymptomMapping(symptom_keyword="hồi hộp đánh trống ngực", symptom_tag="Tim đập nhanh", department_id=dept_map["CARDIOLOGY"], severity="HIGH", notes="Rối loạn nhịp tim."),
            
            # Da liễu
            SymptomMapping(symptom_keyword="nổi mẩn đỏ", symptom_tag="Nổi mẩn", department_id=dept_map["DERMATOLOGY"], severity="MEDIUM", notes="Biểu hiện dị ứng ngoài da hoặc mề đay."),
            SymptomMapping(symptom_keyword="ngứa da", symptom_tag="Ngứa ngoài da", department_id=dept_map["DERMATOLOGY"], severity="LOW", notes="Viêm da tiếp xúc hoặc chàm."),
            SymptomMapping(symptom_keyword="mụn viêm", symptom_tag="Mụn nhọt", department_id=dept_map["DERMATOLOGY"], severity="LOW", notes="Mụn trứng cá nhiễm khuẩn."),

            # Tai Mũi Họng
            SymptomMapping(symptom_keyword="đau họng", symptom_tag="Đau họng", department_id=dept_map["ENT"], severity="MEDIUM", notes="Viêm họng cấp hoặc viêm amidan."),
            SymptomMapping(symptom_keyword="sổ mũi", symptom_tag="Sổ mũi", department_id=dept_map["ENT"], severity="LOW", notes="Viêm mũi dị ứng hoặc cảm cúm."),
            SymptomMapping(symptom_keyword="ù tai", symptom_tag="Ù tai", department_id=dept_map["ENT"], severity="MEDIUM", notes="Tổn thương màng nhĩ hoặc rối loạn vòi eustache."),

            # Nội khoa
            SymptomMapping(symptom_keyword="sốt cao", symptom_tag="Sốt", department_id=dept_map["INTERNAL_MEDICINE"], severity="HIGH", notes="Nhiễm trùng cấp tính hoặc sốt xuất huyết."),
            SymptomMapping(symptom_keyword="ho kéo dài", symptom_tag="Ho", department_id=dept_map["INTERNAL_MEDICINE"], severity="MEDIUM", notes="Viêm phế quản hoặc nhiễm trùng đường hô hấp."),
            SymptomMapping(symptom_keyword="đau bụng quanh rốn", symptom_tag="Đau bụng", department_id=dept_map["INTERNAL_MEDICINE"], severity="HIGH", notes="Theo dõi viêm ruột thừa hoặc rối loạn tiêu hóa."),

            # Thần kinh
            SymptomMapping(symptom_keyword="đau đầu dữ dội", symptom_tag="Đau đầu", department_id=dept_map["NEUROLOGY"], severity="HIGH", notes="Migraine hoặc tăng áp lực nội sọ."),
            SymptomMapping(symptom_keyword="chóng mặt tiền đình", symptom_tag="Chóng mặt", department_id=dept_map["NEUROLOGY"], severity="MEDIUM", notes="Rối loạn tiền đình hoặc thiếu máu não."),

            # Nhi khoa
            SymptomMapping(symptom_keyword="trẻ sốt quấy khóc", symptom_tag="Trẻ sốt", department_id=dept_map["PEDIATRICS"], severity="HIGH", notes="Sốt vi rút hoặc nhiễm trùng tai mũi họng ở trẻ em.")
        ]
        db.add_all(rules)
        db.commit()

        print("[SEED] Seeding System Users & Roles...")
        # Admin User
        admin_user = User(
            full_name="Quản trị viên Hệ thống",
            email="admin@healthcare.com",
            phone="0901111111",
            hashed_password=get_password_hash("admin123"),
            role="ADMIN"
        )
        db.add(admin_user)

        # Patient User
        patient_user = User(
            full_name="Nguyễn Văn An (Bệnh nhân)",
            email="patient@gmail.com",
            phone="0988888888",
            hashed_password=get_password_hash("patient123"),
            role="PATIENT"
        )
        db.add(patient_user)
        db.commit()
        db.refresh(patient_user)

        patient_profile = PatientProfile(
            user_id=patient_user.id,
            date_of_birth="1995-08-20",
            gender="Nam",
            blood_type="O+",
            allergies="Dị ứng Penicillin",
            medical_history="Tiền sử dị ứng thời tiết",
            emergency_contact="0912345678 (Vợ: Lê Thị Bích)"
        )
        db.add(patient_profile)

        # Doctors
        doctors_data = [
            {
                "full_name": "PGS.TS.BS Phạm Hoàng Nam",
                "email": "dr.nam@healthcare.com",
                "phone": "0902222221",
                "title": "PGS.TS.BS",
                "dept_code": "CARDIOLOGY",
                "years": 22,
                "fee": 500000.0,
                "bio": "Trưởng khoa Tim mạch, hơn 22 năm kinh nghiệm chẩn đoán và can thiệp mạch vành."
            },
            {
                "full_name": "ThS.BS Trần Thị Mai",
                "email": "dr.mai@healthcare.com",
                "phone": "0902222222",
                "title": "ThS.BS",
                "dept_code": "DERMATOLOGY",
                "years": 12,
                "fee": 350000.0,
                "bio": "Chuyên gia trị liệu da liễu thẩm mỹ, mề đay mãn tính và viêm da cơ địa."
            },
            {
                "full_name": "BS.CKII Lê Văn Đức",
                "email": "dr.duc@healthcare.com",
                "phone": "0902222223",
                "title": "BS.CKII",
                "dept_code": "INTERNAL_MEDICINE",
                "years": 18,
                "fee": 400000.0,
                "bio": "Chuyên khoa Nội tổng hợp, tiêu hóa, hô hấp và quản lý bệnh mãn tính."
            },
            {
                "full_name": "BS.CKI Đặng Thu Hà",
                "email": "dr.ha@healthcare.com",
                "phone": "0902222224",
                "title": "BS.CKI",
                "dept_code": "ENT",
                "years": 9,
                "fee": 300000.0,
                "bio": "Chuyên gia khám điều trị nội soi Tai Mũi Họng, viêm xoang và viêm amidan."
            }
        ]

        for ddata in doctors_data:
            doc_u = User(
                full_name=ddata["full_name"],
                email=ddata["email"],
                phone=ddata["phone"],
                hashed_password=get_password_hash("doctor123"),
                role="DOCTOR"
            )
            db.add(doc_u)
            db.commit()
            db.refresh(doc_u)

            doc_p = DoctorProfile(
                user_id=doc_u.id,
                department_id=dept_map[ddata["dept_code"]],
                title=ddata["title"],
                years_experience=ddata["years"],
                consultation_fee=ddata["fee"],
                bio=ddata["bio"],
                rating_avg=4.9,
                rating_count=38
            )
            db.add(doc_p)
            db.commit()
            db.refresh(doc_p)

            # Create default schedules (Mon-Fri)
            for day in range(5):
                sched = DoctorSchedule(
                    doctor_id=doc_p.id,
                    day_of_week=day,
                    start_time="08:00",
                    end_time="17:00"
                )
                db.add(sched)
        db.commit()

        print("[SEED] Seeding Historical Appointments & AI Feedback...")
        doc1 = db.query(DoctorProfile).first()
        sample_apt = Appointment(
            appointment_code="APT-20260901-7712",
            patient_id=patient_user.id,
            doctor_id=doc1.id,
            department_id=doc1.department_id,
            appointment_date="2026-09-01",
            start_time="09:00",
            end_time="09:30",
            status="COMPLETED",
            symptoms_text="Thỉnh thoảng đau thắt ngực khi leo cầu thang, kèm hồi hộp tim đập nhanh.",
            symptom_tags=["Đau ngực", "Tim đập nhanh"],
            ai_analysis={
                "is_emergency": False,
                "recommended_department_code": "CARDIOLOGY",
                "recommended_department_name": "Tim mạch",
                "confidence_score": 0.91,
                "medical_explanation": "Triệu chứng đau thắt ngực liên quan gắng sức gợi ý kiểm tra tim mạch tầm soát bệnh mạch vành.",
                "suggested_action": "Khám chuyên khoa Tim mạch ngay"
            },
            diagnosis="Theo dõi Thiếu máu cơ tim thoáng qua / Rối loạn thần kinh tim",
            prescription="1. Concor 5mg - Uống 1 viên/sáng\n2. Magnesium B6 - Uống 2 viên/ngày chia 2 lần",
            doctor_notes="Bệnh nhân cần nghỉ ngơi, tránh căng thẳng, đo huyết áp định kỳ."
        )
        db.add(sample_apt)
        db.commit()
        db.refresh(sample_apt)

        fb = AIFeedback(
            appointment_id=sample_apt.id,
            patient_id=patient_user.id,
            rating=5,
            comment="AI gợi ý đúng chuyên khoa Tim mạch! Bác sĩ Phạm Hoàng Nam khám rất kỹ và tận tâm.",
            was_accurate=True
        )
        db.add(fb)
        db.commit()

        print("[SUCCESS] Seed data populated successfully!")
        print("--------------------------------------------------")
        print("Test Accounts:")
        print("   Admin:   admin@healthcare.com / admin123")
        print("   Doctor:  dr.nam@healthcare.com / doctor123")
        print("   Patient: patient@gmail.com / patient123  (Or Phone: 0988888888 / OTP: 123456)")

        print("--------------------------------------------------")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
