import sys
import os
import logging

# Ensure backend root directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base

from app.routers import (
    auth_router, department_router, doctor_router,
    ai_router, appointment_router, admin_router
)

# Auto create DB tables if not existing
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Nền tảng Y tế Thông minh API",
    description="Backend Service cho Đặt lịch khám và Phân tích triệu chứng bằng AI (FastAPI + SQLAlchemy + OpenAI/Gemini)",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router.router)
app.include_router(department_router.router)
app.include_router(doctor_router.router)
app.include_router(ai_router.router)
app.include_router(appointment_router.router)
app.include_router(admin_router.router)

@app.get("/")
def read_root():
    return {
        "system": "Nền tảng Y tế Thông minh: Đặt lịch khám & AI Symptom Analysis",
        "status": "Online",
        "version": "1.0.0",
        "docs_url": "/docs"
    }
