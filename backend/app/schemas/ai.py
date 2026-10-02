from typing import Optional, List, Any
from pydantic import BaseModel, Field
from app.schemas.appointment import DoctorBriefResponse


class SymptomTriageRequest(BaseModel):
    """Yêu cầu phân tích triệu chứng ngôn ngữ tự nhiên hoặc từ 132 triệu chứng chuẩn CSV (UC-C01)"""
    trieu_chung: str = Field(..., min_length=2, description="Mô tả các triệu chứng khó chịu người bệnh đang gặp phải")
    tuoi: Optional[int] = Field(None, ge=0, le=120, description="Độ tuổi bệnh nhân")
    gioi_tinh: Optional[str] = Field(None, description="Giới tính")
    selected_symptoms: Optional[List[str]] = Field(None, description="Danh sách các mã triệu chứng CSV được chọn (nếu có)")


class TopDiseasePrediction(BaseModel):
    """Chi tiết bệnh dự đoán trong Top 3 kèm xác suất %"""
    disease_vn: str
    disease_en: str
    specialty: str
    probability_pct: float


class SpecialtySuggestion(BaseModel):
    """Gợi ý chuyên khoa phù hợp kèm độ tin cậy và danh sách bác sĩ"""
    chuyen_khoa_id: int
    ten_chuyen_khoa: str
    do_tin_cay: float = Field(..., description="Độ tin cậy từ mô hình AI (0.0 - 1.0)")
    ly_do_de_xuat: str = Field(..., description="Giải thích căn cứ y khoa tóm tắt")
    danh_sach_bac_si: List[DoctorBriefResponse] = []


class SymptomTriageResponse(BaseModel):
    """Kết quả phân tích từ AI Triage Assistant tích hợp mô hình ML (UC-C02, UC-C03)"""
    has_emergency: bool = Field(False, description="Cờ cảnh báo đỏ dấu hiệu nguy kịch cấp cứu")
    emergency_alert: Optional[str] = Field(None, description="Nội dung cảnh báo khẩn cấp (nếu có)")
    suggested_specialties: List[SpecialtySuggestion] = []
    default_assigned: bool = Field(False, description="True nếu tự động gán Nội tổng quát do độ tin cậy thấp")
    predicted_disease_vn: Optional[str] = Field(None, description="Tên bệnh tiếng Việt dự đoán sơ bộ")
    predicted_disease_en: Optional[str] = Field(None, description="Tên bệnh tiếng Anh dự đoán gốc từ model ML")
    detected_symptoms: List[str] = Field([], description="Danh sách cụm triệu chứng trích xuất từ câu nhập")
    top_predictions: List[TopDiseasePrediction] = Field([], description="Top 3 chẩn đoán bệnh khả thi nhất")
    match_count: int = Field(0, description="Số lượng thuộc tính triệu chứng trùng khớp trong Vectorizer")
    note: Optional[str] = Field(None, description="Ghi chú đánh giá độ tin cậy từ mô hình AI")
    disclaimer: str = Field(
        "Kết quả phân tích AI chỉ mang tính chất tham khảo sơ bộ, không thay thế chẩn đoán chuyên môn của bác sĩ.",
        description="Khuyến cáo miễn trừ trách nhiệm y tế bắt buộc"
    )


class CSVSymptomItem(BaseModel):
    """Bản ghi triệu chứng chuẩn 132 CSV kèm tên Tiếng Việt"""
    code: str
    name_vn: str
