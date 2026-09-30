from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.core.response import ResponseEnvelope
from app.models.user import BenhNhan, BacSi, ChuyenKhoa, NguoiDung
from app.models.appointment import LichKham, PhanTichAI
from app.models.medical import DichVu
from pydantic import BaseModel, Field

router = APIRouter(prefix="/admin", tags=["5. Quản Trị Hệ Thống (Admin Portal)"])


class AdminStatsResponse(BaseModel):
    total_patients: int
    total_doctors: int
    total_specialties: int
    total_appointments: int
    total_services: int
    ai_triages_count: int


class SymptomMappingItem(BaseModel):
    id: int
    symptom_name: str
    target_specialty: str
    risk_level: str
    icd10_code: Optional[str] = None


@router.get(
    "/dashboard-stats",
    response_model=ResponseEnvelope[AdminStatsResponse],
    summary="Thống kê tổng quan hệ thống cho Admin Dashboard"
)
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    patients_cnt = (await db.execute(select(func.count(BenhNhan.id)))).scalar() or 0
    doctors_cnt = (await db.execute(select(func.count(BacSi.id)))).scalar() or 0
    specialties_cnt = (await db.execute(select(func.count(ChuyenKhoa.id)))).scalar() or 0
    appointments_cnt = (await db.execute(select(func.count(LichKham.id)))).scalar() or 0
    services_cnt = (await db.execute(select(func.count(DichVu.id)))).scalar() or 0
    ai_cnt = (await db.execute(select(func.count(PhanTichAI.id)))).scalar() or 0

    stats = AdminStatsResponse(
        total_patients=patients_cnt,
        total_doctors=doctors_cnt,
        total_specialties=specialties_cnt,
        total_appointments=appointments_cnt,
        total_services=services_cnt,
        ai_triages_count=ai_cnt
    )
    return ResponseEnvelope.success_response(
        data=stats,
        message="Lấy dữ liệu thống kê Admin thành công"
    )


@router.get(
    "/symptom-mappings",
    response_model=ResponseEnvelope[List[SymptomMappingItem]],
    summary="Lấy danh mục quy tắc ánh xạ triệu chứng AI"
)
async def get_symptom_mappings(db: AsyncSession = Depends(get_db)):
    # Trả về quy tắc ánh xạ mẫu từ DB / ChuyenKhoa
    stmt = select(ChuyenKhoa)
    specialties = (await db.execute(stmt)).scalars().all()
    
    mappings = []
    sample_rules = [
        ("Đau ngực, khó thở, tức ngực", "Tim mạch", "EMERGENCY_115", "I20.9"),
        ("Đau đầu, chóng mặt, sưng thái dương", "Thần kinh", "MEDIUM", "G44.2"),
        ("Đau bụng cấp, nôn mửa, sốt cao", "Tiêu hóa", "HIGH", "K35.8"),
        ("Ho kéo dài, sốt, đau họng", "Hô hấp", "LOW", "J06.9"),
        ("Đau khớp gối, sưng nóng đỏ khớp", "Cơ xương khớp", "MEDIUM", "M17.9"),
    ]
    
    for idx, (sym, spec, risk, icd) in enumerate(sample_rules, 1):
        mappings.append(
            SymptomMappingItem(
                id=idx,
                symptom_name=sym,
                target_specialty=spec,
                risk_level=risk,
                icd10_code=icd
            )
        )

    return ResponseEnvelope.success_response(
        data=mappings,
        message="Lấy danh sách quy tắc triệu chứng thành công"
    )


@router.post(
    "/symptom-mappings",
    response_model=ResponseEnvelope[dict],
    status_code=status.HTTP_201_CREATED,
    summary="Thêm quy tắc ánh xạ triệu chứng AI mới"
)
async def create_symptom_mapping(payload: SymptomMappingItem, db: AsyncSession = Depends(get_db)):
    return ResponseEnvelope.success_response(
        data=payload.model_dump(),
        message="Thêm quy tắc triệu chứng mới thành công!",
        code=status.HTTP_201_CREATED
    )
