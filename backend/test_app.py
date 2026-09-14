import sys
import os
import json
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.schemas import AISymptomRequest
from app.services.ai_service import AISymptomService

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "Online"
    print("[PASS] Root endpoint test passed!")

def test_departments_list():
    response = client.get("/api/departments")
    assert response.status_code == 200
    departments = response.json()
    assert len(departments) >= 8
    print(f"[PASS] Departments catalog test passed ({len(departments)} departments found)!")

def test_doctors_list():
    response = client.get("/api/doctors")
    assert response.status_code == 200
    doctors = response.json()
    assert len(doctors) >= 4
    print(f"[PASS] Doctors listing test passed ({len(doctors)} doctors found)!")

def test_ai_symptom_analysis_emergency():
    db = SessionLocal()
    try:
        req = AISymptomRequest(
            free_text="Tôi bị đau ngực dữ dội và khó thở cấp",
            symptom_tags=["Đau ngực", "Khó thở"]
        )
        result = AISymptomService.analyze_symptoms(db, req)
        assert result.is_emergency is True
        assert result.recommended_department_code == "CARDIOLOGY"
        assert result.emergency_warning is not None
        print("[PASS] Emergency AI Symptom Analysis test passed!")
    finally:
        db.close()

def test_ai_symptom_analysis_dermatology():
    db = SessionLocal()
    try:
        req = AISymptomRequest(
            free_text="Da tôi bị nổi mẩn đỏ và ngứa ngáy nhiều nốt",
            symptom_tags=["Nổi mẩn đỏ", "Ngứa da"]
        )
        result = AISymptomService.analyze_symptoms(db, req)
        assert result.is_emergency is False
        assert result.recommended_department_code == "DERMATOLOGY"
        print("[PASS] Dermatology AI Symptom Analysis test passed!")
    finally:
        db.close()

def test_login_flow():
    response = client.post("/api/auth/login", json={
        "email_or_phone": "patient@gmail.com",
        "password": "patient123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "PATIENT"
    print("[PASS] Authentication Login test passed!")

if __name__ == "__main__":
    print("Running integration test suite...")
    test_root_endpoint()
    test_departments_list()
    test_doctors_list()
    test_ai_symptom_analysis_emergency()
    test_ai_symptom_analysis_dermatology()
    test_login_flow()
    print("[SUCCESS] All backend integration tests PASSED successfully!")
