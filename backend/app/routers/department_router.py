from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Department, DoctorProfile
from app.schemas import DepartmentCreate, DepartmentResponse
from app.auth import require_roles

router = APIRouter(prefix="/api/departments", tags=["Departments Catalog"])

@router.get("", response_model=List[DepartmentResponse])
def list_departments(db: Session = Depends(get_db)):
    departments = db.query(Department).filter(Department.is_active == True).all()
    return departments

@router.get("/{dept_id}", response_model=DepartmentResponse)
def get_department_detail(dept_id: int, db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.id == dept_id, Department.is_active == True).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Không tìm thấy chuyên khoa yêu cầu.")
    return dept

@router.post("", response_model=DepartmentResponse)
def create_department(
    dept_in: DepartmentCreate,
    current_user = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db)
):
    existing = db.query(Department).filter(Department.code == dept_in.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Mã chuyên khoa này đã tồn tại.")

    dept = Department(
        code=dept_in.code,
        name=dept_in.name,
        description=dept_in.description,
        icon=dept_in.icon or "Stethoscope"
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept
