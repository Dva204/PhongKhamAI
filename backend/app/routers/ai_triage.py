from typing import Optional, List
from fastapi import APIRouter, Depends
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import security
from app.core.security import decode_access_token
from app.core.response import ResponseEnvelope
from app.models.user import TaiKhoan
from app.schemas.ai import SymptomTriageRequest, SymptomTriageResponse, CSVSymptomItem
from app.services.ai_service import ai_service
from sqlalchemy import select

router = APIRouter(prefix="/ai", tags=["3. Trí Tuệ Nhân Tạo & Red Flags (Package C)"])


@router.get(
    "/csv-symptoms",
    response_model=ResponseEnvelope[List[CSVSymptomItem]],
    summary="Lấy danh sách 132 triệu chứng chuẩn CSV phục vụ lựa chọn từ Checklist (Package C)"
)
async def get_csv_symptoms():
    items = ai_service.get_csv_symptoms_list()
    return ResponseEnvelope.success_response(
        data=items,
        message="Lấy danh sách triệu chứng thành công"
    )


@router.post(
    "/analyze-symptoms",
    response_model=ResponseEnvelope[SymptomTriageResponse],
    summary="Phân tích triệu chứng bằng mô hình AI Machine Learning, quét Red Flags và gợi ý chuyên khoa (UC-C01 -> UC-C03)"
)
async def analyze_symptoms(
    payload: SymptomTriageRequest,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    current_user = None
    if credentials and credentials.credentials:
        decoded = decode_access_token(credentials.credentials)
        if decoded and "sub" in decoded:
            stmt = select(TaiKhoan).where(TaiKhoan.id == int(decoded["sub"]))
            current_user = (await db.execute(stmt)).scalar_one_or_none()

    result = await ai_service.analyze_symptoms(payload, current_user, db)
    return ResponseEnvelope.success_response(
        data=result,
        message="Phân tích triệu chứng thành công"
    )
