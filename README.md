# Nền tảng Y tế Thông minh: Đặt lịch khám & Phân tích triệu chứng bằng AI

Hệ thống y tế thông minh toàn diện tích hợp AI Engine (OpenAI / Gemini Structured Output & Rule Fallback Engine), Đặt lịch khám 30 phút, Giao diện bác sĩ chẩn đoán & kê đơn, cùng Trang quản trị Admin Dashboard.

---

## 🏗 TECH STACK SYSTEM ARCHITECTURE

1. **Backend Service**:
   - **Framework**: FastAPI (Python 3.11+)
   - **ORM & DB**: SQLAlchemy 2.0 ORM, Alembic, PostgreSQL / SQLite Fallback
   - **Schemas & Validation**: Pydantic v2
   - **Security**: JWT Token + OAuth 2.0 (Google Mock) + SMS/OTP Mock Service (Mã test: `123456`)

2. **AI / LLM Triage Engine**:
   - **Provider**: OpenAI API (`gpt-4o-mini`) / Gemini API
   - **Safety First**: Phát hiện dấu hiệu CẤP CỨU (`is_emergency=True`) -> Cảnh báo đỏ kích hoạt nút gọi 115 lập tức.
   - **Structured Output**: Trả về Pydantic JSON Schema (`confidence_score`, `recommended_department_code`, `medical_explanation`).
   - **Deterministic Fallback**: Tự động dùng bảng quy tắc nội bộ `symptom_mappings` khi mất kết nối API.

3. **Frontend Dashboard UI**:
   - Next.js (App Router), React, Tailwind CSS, Lucide Icons.

---

## 🔑 TÀI KHOẢN MẪU DÙNG THỬ (SEED DATA ACCOUNTS)

| Vai trò (Role) | Email / SĐT | Mật khẩu (Password) | Mô tả |
| :--- | :--- | :--- | :--- |
| **Bệnh nhân (PATIENT)** | `patient@gmail.com` | `patient123` | Hoặc đăng nhập SĐT: `0988888888` / OTP: `123456` |
| **Bác sĩ (DOCTOR)** | `dr.nam@healthcare.com` | `doctor123` | PGS.TS.BS Phạm Hoàng Nam (Khoa Tim mạch) |
| **Quản trị viên (ADMIN)** | `admin@healthcare.com` | `admin123` | Admin Dashboard & Quản lý quy tắc AI |

---

## 🚀 HƯỚNG DẪN CHẠY MÔI TRƯỜNG (LOCAL & DOCKER)

### Cách 1: Chạy trực tiếp trên Local (Khuyên dùng thử nghiệm nhanh)

#### 1. Khởi tạo Backend FastAPI
```bash
# Di chuyển vào thư mục dự án
cd c:\Users\Admin\OneDrive\Desktop\Documents\Project1

# Cài đặt thư viện Python
pip install -r backend/requirements.txt

# Khởi tạo cơ sở dữ liệu và seed dữ liệu mẫu
python backend/seed_data.py

# Khởi chạy server FastAPI
python -m uvicorn backend.app.main:app --reload --port 8000
```
- Swagger API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

#### 2. Kiểm thử Unit / Integration Tests
```bash
python backend/test_app.py
```

#### 3. Khởi chạy Frontend UI (Next.js)
```bash
# Di chuyển vào thư mục frontend
cd frontend

# Cài đặt package & khởi chạy
npm install
npm run dev
```
- Truy cập giao diện web: [http://localhost:3000](http://localhost:3000)

---

### Cách 2: Chạy bằng Docker Compose (PostgreSQL + FastAPI)

```bash
# Set API Key (tùy chọn nếu muốn gọi LLM thực tế)
export OPENAI_API_KEY="sk-..."

# Build & Run Docker Containers
docker-compose up -d --build

# Populate Seed Data trong Container
docker exec -it healthcare_backend python seed_data.py
```

---

## 📋 BẢNG CÁC GÓI CHỨC NĂNG (PACKAGES)

1. **Pkg A: Account & Profiles**: Phân quyền 3 role (PATIENT, DOCTOR, ADMIN), OTP Auth mock, Hồ sơ bệnh án & Hồ sơ bác sĩ.
2. **Pkg B: Booking Management**: Danh mục 8 chuyên khoa, Lịch bác sĩ, Đặt lịch slot 30 phút, Quản lý trạng thái lịch hẹn (`PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`).
3. **Pkg C: AI Symptom Checker**: Phân tích triệu chứng tự do + tags, Cảnh báo CẤP CỨU 115, Đề xuất chuyên khoa & bác sĩ phù hợp, Đánh giá độ chính xác AI 1-5 sao.
4. **Pkg D: Doctor Examination**: Bác sĩ xem triệu chứng & báo cáo AI, Nhập chẩn đoán lâm sàng & kê đơn thuốc, Bệnh nhân xem lịch sử khám.
5. **Pkg E: Admin Dashboard**: KPI lượt đặt, tỷ lệ hủy lịch, điểm hài lòng AI, CRUD quy tắc ánh xạ triệu chứng - chuyên khoa (`symptom_mappings`).
