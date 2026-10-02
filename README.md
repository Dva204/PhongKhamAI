# 🏥 NỀN TẢNG Y TẾ THÔNG MINH PHONG KHÁM AI (SMARTCARE AI HEALTH PLATFORM)
> **Học phần:** Project 1 (IT1.241.3) — Trường Đại học Giao Thông Vận Tải (UTC)  
> **Giảng viên hướng dẫn:** TS. Nguyễn Đức Dư  
> **Đơn vị thực hiện:** Nhóm 2 — Lớp Project 1-1-1-26 (N05)  
> **Mô hình kế thừa:** Chuẩn quốc tế **OpenMRS 3.0** (Person, Encounter, Concept Dictionary) & Thông tư 32/2023/TT-BYT  

---

## 🌟 TỔNG QUAN HỆ THỐNG FULLSTACK

Dự án cung cấp giải pháp toàn diện bao gồm **Frontend Web Application (Next.js 14)** và **Backend RESTful API (FastAPI)** phục vụ quản lý phòng khám đa khoa & phân tích triệu chứng y tế thông minh bằng trí tuệ nhân tạo (AI Triage):

* **Xác thực & Phân quyền Role-based (Package A):** Đăng ký, đăng nhập tài khoản xác thực OTP qua Email, băm mật khẩu chuẩn **BCrypt**, cấp phát **JWT Bearer Token** 24 giờ. Phân quyền 3 vai trò có Guard bảo vệ route: **Bệnh nhân (PATIENT)**, **Bác sĩ (DOCTOR)** và **Quản trị viên (ADMIN)**.
* **Điều phối & Đặt lịch khám 30 phút (Package B):** Thuật toán tính toán Dynamic Slot 30 phút trong ngày, cơ chế khóa dòng **Pessimistic Locking (`SELECT ... FOR UPDATE`)** kết hợp **Unique Partial Index** cấp CSDL triệt tiêu hoàn toàn lỗi đặt trùng khung giờ (Overbooking).
* **Trí tuệ nhân tạo & Phân loại lâm sàng (Package C):** 
  * Bộ lọc từ khóa **Red Flags** phát hiện nguy cơ CẤP CỨU 115 lập tức.
  * Mô hình Học máy NLP tiếng Việt (**Scikit-Learn TF-IDF + Logistic Regression** & **Underthesea**) huấn luyện dự đoán Top 3 chẩn đoán khả thi từ 132 triệu chứng chuẩn y khoa và gợi ý 14 chuyên khoa phù hợp.
* **Thăm khám lâm sàng & Bệnh án điện tử (Package D):** Mô hình hóa buổi khám thực tế (OpenMRS Encounter Pattern), ghi nhận chỉ số sinh hiệu, chẩn đoán bệnh theo mã quốc tế **WHO ICD-10**, kê đơn thuốc ngoại trú kèm cơ chế **Khóa bệnh án Read-only**.
* **Bảng điều khiển Quản trị (Package E):** Thống kê KPI lượt khám, tỷ lệ đặt lịch, phân công lịch làm việc bác sĩ và cấu hình ánh xạ triệu chứng - chuyên khoa.

---

## 🏗️ CÔNG NGHỆ ÁP DỤNG (TECH STACK)

| Tầng hệ thống | Công nghệ sử dụng | Vai trò & Đặc tính |
| :--- | :--- | :--- |
| **Giao diện (Frontend)** | **Next.js 14 (App Router) + React 18** | Giao diện hiện đại, tối ưu SEO, Server/Client Components, hỗ trợ Responsive |
| **Styling & UI Components** | **Tailwind CSS + Lucide React Icons** | Design System chuẩn phòng khám, Glassmorphism, animations mượt mà |
| **Giao tiếp API (Frontend)** | **Axios / Fetch Client (`services/api.js`)** | Tích hợp tự động với Backend API, quản lý token JWT & xử lý lỗi tập trung |
| **Máy chủ API (Backend)** | **FastAPI (Python 3.11+)** | Hiệu năng cao, bất đồng bộ (ASGI), tự động sinh tài liệu OpenAPI / Swagger UI |
| **Trí tuệ nhân tạo (AI Engine)**| **Scikit-learn + Underthesea NLP** | Xử lý ngôn ngữ tự nhiên tiếng Việt, Vector hóa TF-IDF, Logistic Regression |
| **Cơ sở dữ liệu (Database)** | **PostgreSQL 15+ / SQLite Fallback** | Quản trị CSDL quan hệ, hỗ trợ khóa dòng `SELECT FOR UPDATE` & Async Driver |
| **ORM & Database Driver** | **SQLAlchemy 2.0 Async + asyncpg / aiosqlite** | Ánh xạ đối tượng CSDL bất đồng bộ với Connection Pool |
| **Xác thực & Bảo mật** | **Passlib (BCrypt) + Python-Jose (JWT)** | Băm mật khẩu an toàn, cấp phát và xác thực JWT Bearer Token |
| **Containerization & CI** | **Docker, Docker Compose, Pytest** | Đóng gói môi trường đồng nhất & kiểm thử tự động toàn bộ API |

---

## 📂 CẤU TRÚC HOÀN CHỈNH CỦA DỰ ÁN (PROJECT STRUCTURE)

```text
code/
├── backend/                             # MÁY CHỦ RESTFUL API & AI ENGINE (FASTAPI)
│   ├── app/
│   │   ├── ai_assets/                   # Mô hình ML & Dữ liệu huấn luyện AI
│   │   │   ├── ai_symptom_model.joblib  # Model Logistic Regression đã huấn luyện
│   │   │   ├── tfidf_vectorizer.joblib  # TF-IDF Vectorizer xử lý văn bản
│   │   │   ├── training_data.csv        # Bộ dữ liệu 132 triệu chứng y khoa
│   │   │   └── test_ai_app.py           # Script kiểm thử độc lập mô hình AI
│   │   ├── core/                        # Tầng hạ tầng, cấu hình & an ninh
│   │   │   ├── config.py                # Quản lý biến môi trường Pydantic Settings
│   │   │   ├── database.py              # Kết nối AsyncEngine & Session Factory
│   │   │   ├── security.py              # Băm BCrypt, sinh JWT token & OTP 6 số
│   │   │   ├── response.py              # Chuẩn hóa Response Envelope toàn cục
│   │   │   └── dependencies.py          # Dependency Injection & Phân quyền RBAC
│   │   ├── models/                      # ENTITY LAYER (SQLAlchemy 2.0 Async - OpenMRS)
│   │   │   ├── user.py                  # TaiKhoan, BenhNhan, BacSi, ChuyenKhoa
│   │   │   ├── appointment.py           # LichLamViec, LichKham, PhanTichAI, DanhGiaAI
│   │   │   └── medical.py               # ChanDoan (ICD-10), DonThuoc, TuKhoaCapCuu...
│   │   ├── schemas/                     # BOUNDARY LAYER (Pydantic v2 DTOs)
│   │   │   ├── auth.py                  # LoginRequest, RegisterRequest, TokenResponse
│   │   │   ├── appointment.py           # SlotBookingRequest, AppointmentResponse
│   │   │   ├── ai.py                    # SymptomAnalysisRequest, TopDiseasePrediction...
│   │   │   └── medical.py               # MedicalRecordSchema, PrescriptionSchema
│   │   ├── services/                    # CONTROL LAYER (Business Logic & Transactions)
│   │   │   ├── auth_service.py          # Logic Đăng ký, OTP, Đăng nhập & Token
│   │   │   ├── appointment_service.py   # Chia Slot 30 phút, Khóa Pessimistic Locking
│   │   │   └── ai_service.py            # Chốt chặn Red Flags 115 -> NLP -> ML Inference
│   │   ├── routers/                     # API ENDPOINTS (/api/v1)
│   │   │   ├── auth.py                  # Endpoints xác thực tài khoản
│   │   │   ├── appointment.py           # Endpoints đặt lịch & xem slot
│   │   │   ├── ai_triage.py             # Endpoints phân tích triệu chứng & CSV checklist
│   │   │   └── medical.py               # Endpoints chẩn đoán & bệnh án
│   │   └── main.py                      # Master Entrypoint, CORS & Exception Handlers
│   ├── database/                        # SQL Schemas & Alembic Migrations
│   ├── docs/                            # Tài liệu quy chuẩn kỹ thuật & phân công Sprint
│   ├── tests/                           # Bộ kiểm thử tự động Pytest
│   ├── seed_data.py                     # Script nạp CSDL mẫu (Bác sĩ, Khoa, Lịch khám)
│   ├── Dockerfile & docker-compose.yml  # Cấu hình containerization cho Backend
│   └── requirements.txt                 # Khai báo các thư viện Python
│
├── frontend/                            # GIAO DIỆN NGUỜI DÙNG WEB APP (NEXT.JS 14)
│   ├── app/                             # Next.js App Router (Pages & Layouts)
│   │   ├── page.jsx                     # Trang chủ Landing Page khám bệnh & AI
│   │   ├── layout.js                    # Root Layout chứa Header & Footer
│   │   ├── symptom-checker/             # Trang AI phân tích triệu chứng & Đặt lịch
│   │   ├── patient/dashboard/           # Dashboard Quản lý lịch hẹn Bệnh nhân
│   │   ├── doctor/dashboard/            # Bàn làm việc Bác sĩ & Kê đơn ICD-10
│   │   ├── admin/dashboard/             # Dashboard Quản trị hệ thống & KPI
│   │   ├── departments/                 # Danh mục 14 chuyên khoa y tế
│   │   ├── doctors/                     # Danh sách & Hồ sơ đội ngũ Bác sĩ
│   │   └── (auth, about, contact...)/   # Các trang phụ trợ khác
│   ├── components/                      # UI Components tái sử dụng
│   │   ├── Header.jsx & Footer.jsx      # Thanh điều hướng & Chân trang
│   │   ├── SymptomCheckerBooking.jsx    # Component chọn 132 triệu chứng & AI gợi ý
│   │   ├── AuthModal.jsx                # Modal Đăng nhập / Đăng ký 3 Roles
│   │   └── DoctorScheduleModal.jsx      # Modal chọn khung giờ đặt lịch 30 phút
│   ├── services/
│   │   └── api.js                       # Tầng kết nối REST API bất đồng bộ với Backend
│   ├── package.json                     # Dependencies (Next.js, React, Tailwind CSS)
│   └── tailwind.config.js               # Cấu hình Tailwind CSS Design System
│
├── docker-compose.yml                   # Root Docker Compose (Fullstack System)
└── README.md                            # Tài liệu hướng dẫn sử dụng dự án
```

---

## 🚀 HƯỚNG DẪN KHỞI CHẠY HỆ THỐNG FULLSTACK

### 1. Khởi chạy Backend (FastAPI - Port 8000)

Mở Terminal tại thư mục `code/backend`:

```bash
# 1. Di chuyển vào thư mục backend
cd backend

# 2. Tạo và kích hoạt môi trường ảo Python
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# 3. Cài đặt các gói phụ thuộc
pip install -r requirements.txt

# 4. Khởi tạo Cơ sở dữ liệu & Nạp dữ liệu mẫu (Seed Data)
python seed_data.py

# 5. Khởi chạy Server FastAPI phát triển
python -m uvicorn app.main:app --reload --port 8000
```
* 📘 **Swagger UI API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
* 🔴 **Healthcheck:** [http://localhost:8000/health](http://localhost:8000/health)

---

### 2. Khởi chạy Frontend (Next.js 14 - Port 3000)

Mở một cửa sổ Terminal mới tại thư mục `code/frontend`:

```bash
# 1. Di chuyển vào thư mục frontend
cd frontend

# 2. Cài đặt các gói npm phụ thuộc
npm install

# 3. Khởi chạy máy chủ giao diện Next.js
npm run dev
```
* 🌐 **Truy cập Giao diện Web App:** [http://localhost:3000](http://localhost:3000)

---

### 3. Khởi chạy bằng Docker Compose (Khuyên dùng thử nghiệm nhanh)

Mở Terminal tại thư mục gốc `code/`:

```bash
docker compose up -d --build
```
Hệ thống sẽ tự động khởi chạy toàn bộ Backend (FastAPI), Cơ sở dữ liệu (PostgreSQL) và Frontend (Next.js).

---

## 🔑 TÀI KHOẢN MẪU DÙNG ĐỂ ĐĂNG NHẬP & TEST NGAY

Sau khi chạy `seed_data.py`, hệ thống tự động nạp sẵn các tài khoản thử nghiệm cho các vai trò:

| Vai trò (Role) | Email đăng nhập | Mật khẩu | Chức năng kiểm thử |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (ADMIN)** | `admin@clinic.com` | `Admin@123456` | Dashboard Admin, Xem KPI, Phân công lịch trực bác sĩ |
| **Bác sĩ (DOCTOR)** | `an.doctor@clinic.com` | `Doctor@123456` | BSCKI. Nguyễn Văn An (Khoa Tim mạch) — Xem ca khám & Kê đơn ICD-10 |
| **Bác sĩ (DOCTOR)** | `bich.doctor@clinic.com` | `Doctor@123456` | ThS.BS. Trần Thị Bích (Khoa Tiêu hóa) — Tiếp nhận bệnh nhân & đơn thuốc |
| **Bệnh nhân (PATIENT)**| `patient@test.com` | `Patient@123456` | Nguyễn Thị Bệnh Nhân — Test AI Check triệu chứng & Đặt lịch slot 30p |

---

## 🧪 QUY TRÌNH KIỂM THỬ TỰ ĐỘNG (AUTOMATED TESTING)

Chạy bộ kiểm thử Pytest tự động tại thư mục `backend/`:

```bash
cd backend
pytest tests/ -v
```

**Kết quả mong đợi:**
```text
tests/test_security.py::test_password_hashing PASSED                  [ 20%]
tests/test_security.py::test_otp_generation PASSED                    [ 40%]
tests/test_security.py::test_jwt_token_encode_decode PASSED           [ 60%]
tests/test_ai_red_flags.py::test_vietnamese_normalization PASSED     [ 80%]
tests/test_appointment_rules.py::test_slot_generator_calculation PASSED [100%]
============================== 10 passed in 1.48s ==============================
```

---

## 📚 TÀI LIỆU KỸ THUẬT NỘI BỘ (THƯ MỤC `backend/docs/`)

Toàn bộ các quy tắc kỹ thuật của dự án được lưu trữ chi tiết tại:
* 📄 [**CODING_STANDARDS.md**](backend/docs/CODING_STANDARDS.md) — Quy tắc đặt tên biến/hàm/bảng CSDL, chuẩn Response Envelope, quy tắc khóa dòng PostgreSQL, đạo đức AI y tế.
* 📄 [**PRE_PUSH_AND_CI_GUIDE.md**](backend/docs/PRE_PUSH_AND_CI_GUIDE.md) — Hướng dẫn 2 bước kiểm thử trước khi push và cơ chế tự động chặn lỗi của GitHub Actions CI.
* 📄 [**NGHIEP_VU_VA_KIEN_TRUC.md**](backend/docs/NGHIEP_VU_VA_KIEN_TRUC.md) — Phân tích thực trạng 58% đặt nhầm khoa, chi tiết 5 luồng nghiệp vụ y tế cốt lõi và đối chiếu mô hình OpenMRS 3.0.
* 📄 [**THIET_KE_CSDL_POSTGRESQL_OPENMRS.md**](backend/docs/THIET_KE_CSDL_POSTGRESQL_OPENMRS.md) — Bản đặc tả kiến trúc CSDL PostgreSQL, sơ đồ quan hệ ERD và giải pháp kỹ thuật.
* 📄 [**BANG_PHAN_CONG_CHI_TIET_SPRINT_2.md**](backend/docs/BANG_PHAN_CONG_CHI_TIET_SPRINT_2.md) — Bảng phân công chi tiết công việc cho 5 thành viên.

---

## 👥 THÔNG TIN ĐỘI NGŨ PHÁT TRIỂN (NHÓM 2)

| STT | Họ và tên | Mã sinh viên | Vai trò phụ trách |
| :---: | :--- | :---: | :--- |
| 1 | **Lương Duyên Hợp** | 231230794 | **Nhóm trưởng** — DevOps, Hạ tầng CSDL PostgreSQL 15, Seed Data & CI/CD |
| 2 | **Bùi Thanh Tùng** | 231230948 | **Backend Developer** — Phân hệ Xác thực, Bảo mật JWT/BCrypt, OTP & Hồ sơ (Pkg A) |
| 3 | **Đỗ Văn An** | 231220700 | **Backend & AI Engineer** — Huấn luyện mô hình AI trên Kaggle, Tích hợp Model & Khung FE (Pkg C) |
| 4 | **Hoàng Đức Trọng** | 231230931 | **Backend Developer** — Lõi Đặt lịch, Thuật toán Dynamic Slot 30p, Khóa Concurrency (Pkg B) |
| 5 | **Đinh Đức Hoàng** | 231230787 | **Backend & QA** — Kiểm soát No-show, Danh sách chờ Waitlist, Khám lâm sàng Pkg D & Pytest |

---
*© 2026 Nhóm 2 — Học phần Project 1 (IT1.241.3) — Trường Đại học Giao Thông Vận Tải.*
