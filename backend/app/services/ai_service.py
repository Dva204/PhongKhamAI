import os
import json
import logging
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models import Department, SymptomMapping
from app.schemas import AISymptomAnalysisResult, AISymptomRequest

logger = logging.getLogger("ai_service")
logging.basicConfig(level=logging.INFO)

# High severity emergency keyword list for quick triage safety check
EMERGENCY_KEYWORDS = [
    "đau ngực dữ dội", "ép ngực", "khó thở trầm trọng", "khó thở cấp",
    "đột quỵ", "méo miệng", "tê yếu nửa người", "mất ý thức", "hôn mê",
    "co giật", "chấn thương đầu nặng", "chảy máu không cầm", "nôn ra máu",
    "đau bụng cấp dữ dội", "sốc dị ứng", "phù quincke"
]

class AISymptomService:
    @staticmethod
    def analyze_symptoms(
        db: Session,
        request: AISymptomRequest
    ) -> AISymptomAnalysisResult:
        """
        Analyzes patient symptoms using LLM structured output or internal rule engine fallback.
        Returns validated AISymptomAnalysisResult schema.
        """
        user_input_combined = f"{request.free_text} {' '.join(request.symptom_tags)}".lower()
        
        # 1. Quick Emergency Safety Pre-check
        is_hard_emergency = any(kw in user_input_combined for kw in EMERGENCY_KEYWORDS)
        
        # 2. Query system departments for context
        departments = db.query(Department).filter(Department.is_active == True).all()
        dept_map = {d.code: d for d in departments}
        dept_list_str = "\n".join([f"- {d.code}: {d.name} ({d.description})" for d in departments])

        # 3. Attempt OpenAI / Gemini Call if API keys are set
        openai_api_key = os.getenv("OPENAI_API_KEY")
        gemini_api_key = os.getenv("GEMINI_API_KEY")

        if openai_api_key:
            try:
                return AISymptomService._call_openai_llm(request, dept_list_str, dept_map, is_hard_emergency)
            except Exception as e:
                logger.warning(f"OpenAI API call failed: {e}. Falling back to Rule Engine.")

        if gemini_api_key:
            try:
                return AISymptomService._call_gemini_llm(request, dept_list_str, dept_map, is_hard_emergency)
            except Exception as e:
                logger.warning(f"Gemini API call failed: {e}. Falling back to Rule Engine.")

        # 4. Fallback: Internal Rule Engine based on symptom_mappings table
        return AISymptomService._rule_based_analysis(db, request, dept_map, is_hard_emergency)

    @staticmethod
    def _call_openai_llm(
        request: AISymptomRequest,
        dept_list_str: str,
        dept_map: dict,
        is_hard_emergency: bool
    ) -> AISymptomAnalysisResult:
        import openai

        client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

        system_prompt = (
            "Bạn là trợ lý y tế AI chuyên nghiệp thuộc Nền tảng Y tế Thông minh.\n"
            "Nhiệm vụ của bạn là phân tích mô tả triệu chứng của bệnh nhân, xác định dấu hiệu cấp cứu,\n"
            "gợi ý Chuyên khoa phòng khám phù hợp nhất và đưa ra lời giải thích y khoa tóm tắt bằng tiếng Việt.\n\n"
            f"Danh sách các chuyên khoa hiện có tại hệ thống phòng khám:\n{dept_list_str}\n\n"
            "Yêu cầu:\n"
            "1. Nếu triệu chứng có dấu hiệu đe dọa tính mạng (đau ngực dữ dội, khó thở nặng, đột quỵ, mất ý thức...), set is_emergency = True.\n"
            "2. Điểm tin cậy confidence_score từ 0.0 - 1.0.\n"
            "3. Trả về đúng định dạng JSON tuân thủ Schema."
        )

        user_content = (
            f"Mô tả tự do: {request.free_text}\n"
            f"Các tag triệu chứng đã chọn: {', '.join(request.symptom_tags)}\n"
            f"Giới tính: {request.patient_gender or 'Không rõ'}, Tuổi: {request.patient_age or 'Không rõ'}"
        )

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            response_format={"type": "json_object"},
            temperature=0.2
        )

        raw_json = json.loads(response.choices[0].message.content)
        
        dept_code = raw_json.get("recommended_department_code", "INTERNAL_MEDICINE")
        dept_obj = dept_map.get(dept_code) or list(dept_map.values())[0]

        return AISymptomAnalysisResult(
            is_emergency=raw_json.get("is_emergency", is_hard_emergency),
            emergency_warning=raw_json.get("emergency_warning") or ("CẢNH BÁO CẤP CỨU 115: Triệu chứng nguy hiểm! Bạn nên gọi 115 hoặc đến trung tâm y tế gần nhất ngay lập tức!" if is_hard_emergency else None),
            recommended_department_code=dept_obj.code,
            recommended_department_name=dept_obj.name,
            recommended_department_id=dept_obj.id,
            confidence_score=float(raw_json.get("confidence_score", 0.85)),
            medical_explanation=raw_json.get("medical_explanation", "Dựa trên mô tả triệu chứng, hệ thống đề xuất khám chuyên khoa phù hợp."),
            suggested_action=raw_json.get("suggested_action", f"Vui lòng chọn bác sĩ thuộc chuyên khoa {dept_obj.name} để đặt lịch khám."),
            suggested_questions=raw_json.get("suggested_questions", ["Triệu chứng xuất hiện từ khi nào?", "Mức độ đau 1-10 là bao nhiêu?"])
        )

    @staticmethod
    def _call_gemini_llm(
        request: AISymptomRequest,
        dept_list_str: str,
        dept_map: dict,
        is_hard_emergency: bool
    ) -> AISymptomAnalysisResult:
        # Fallback to internal rule engine if google.generativeai not installed
        raise NotImplementedError("Fallback to rule engine")

    @staticmethod
    def _rule_based_analysis(
        db: Session,
        request: AISymptomRequest,
        dept_map: dict,
        is_hard_emergency: bool
    ) -> AISymptomAnalysisResult:
        """
        Deterministic Rule Engine matching symptom_mappings table keywords & tags.
        """
        combined_text = f"{request.free_text} {' '.join(request.symptom_tags)}".lower()
        mappings = db.query(SymptomMapping).all()

        best_match_dept_id = None
        matched_severity = "LOW"
        highest_score = 0
        matched_notes = []

        # Default department
        default_dept = list(dept_map.values())[0] if dept_map else None
        default_dept_id = default_dept.id if default_dept else 1

        for m in mappings:
            score = 0
            if m.symptom_keyword.lower() in combined_text:
                score += 3
            if m.symptom_tag.lower() in combined_text:
                score += 2

            if score > highest_score:
                highest_score = score
                best_match_dept_id = m.department_id
                matched_severity = m.severity
                if m.notes:
                    matched_notes.append(m.notes)

        # Retrieve matched department
        target_dept = None
        if best_match_dept_id:
            target_dept = db.query(Department).filter(Department.id == best_match_dept_id).first()

        if not target_dept:
            target_dept = db.query(Department).first() or Department(id=1, code="INTERNAL_MEDICINE", name="Nội tổng quát")

        is_emergency = is_hard_emergency or (matched_severity == "EMERGENCY")
        confidence = min(0.92, 0.65 + (highest_score * 0.08)) if highest_score > 0 else 0.70

        explanation_text = (
            f"Phân tích hệ thống nhận thấy các triệu chứng của bạn ('{request.free_text}') "
            f"phù hợp với phạm vi chẩn đoán và điều trị của Chuyên khoa {target_dept.name}. "
            f"{' '.join(matched_notes) if matched_notes else 'Khuyến cáo nên thăm khám sớm với bác sĩ chuyên khoa để được tư vấn chính xác.'}"
        )

        emergency_msg = None
        if is_emergency:
            emergency_msg = "🚨 CẢNH BÁO CẤP CỨU Y TẾ: Triệu chứng của bạn có dấu hiệu nguy hiểm (khó thở, đau ngực dữ dội hoặc dấu hiệu thần kinh). Hãy gọi ngay Cấp cứu 115 hoặc nhờ người thân đưa đến cơ sở y tế gần nhất!"

        return AISymptomAnalysisResult(
            is_emergency=is_emergency,
            emergency_warning=emergency_msg,
            recommended_department_code=target_dept.code,
            recommended_department_name=target_dept.name,
            recommended_department_id=target_dept.id,
            confidence_score=round(confidence, 2),
            medical_explanation=explanation_text,
            suggested_action=f"Đặt lịch thăm khám ngay với các Bác sĩ chuyên khoa {target_dept.name} bên dưới.",
            suggested_questions=[
                "Triệu chứng này kéo dài bao lâu rồi?",
                "Bạn có tiền sử bệnh lý gia đình liên quan không?",
                "Triệu chứng tăng lên khi vận động hay nghỉ ngơi?"
            ]
        )
