# Công nghệ / Kỹ thuật xây dựng hệ thống

## Phần 1: Báo cáo chi tiết về Công nghệ & Kỹ thuật xây dựng hệ thống

### 1.1 Đặc tả chi tiết Tech Stack

**Kiến trúc tổng thể**: dùng **1 backend duy nhất bằng FastAPI (Python)**, xử lý cả nghiệp vụ (xác thực, đặt lịch, hồ sơ, quản trị) lẫn AI (phân tích triệu chứng) trong cùng 1 service. Bên trong tổ chức theo router riêng biệt cho từng nhóm chức năng để giữ code tách bạch rõ ràng dù chạy chung 1 process — phù hợp quy mô đồ án, dễ triển khai và không cần quản lý giao tiếp giữa 2 service như phương án tách riêng trước đó.

| Lớp | Công nghệ | Vai trò |
|---|---|---|
| Frontend | React + Tailwind CSS | Giao diện 3 actor (Bệnh nhân, Bác sĩ, Admin), gọi API qua REST/HTTPS |
| Backend | Python FastAPI | Toàn bộ API: xác thực, quản lý lịch hẹn, hồ sơ, phân quyền, quản trị, và pipeline AI phân tích triệu chứng |
| Database | PostgreSQL (khuyến nghị) hoặc MySQL | Lưu dữ liệu quan hệ (tài khoản, lịch hẹn, hồ sơ, bảng ánh xạ triệu chứng-chuyên khoa) |

**Tổ chức router bên trong FastAPI** (feature-based, khớp với 5 nhóm use case đã thiết kế):
```
/app
  /routers
    auth.py          → A: đăng ký, đăng nhập, phân quyền
    appointments.py  → B: đặt lịch, xem/hủy/đổi lịch
    ai_diagnosis.py  → C: nhập triệu chứng, đề xuất AI
    visits.py        → D: ghi nhận lượt khám, lịch sử khám
    admin.py         → E: quản lý danh mục, thống kê
  /services           → business logic từng nhóm (tương ứng router)
  /models             → SQLAlchemy models
  /ai                 → pipeline tiền xử lý + model inference (mục 1.2)
```

**Lưu ý về khả năng mở rộng**: nếu sau này lượng truy vấn AI tăng cao và cần scale riêng phần AI (ví dụ chạy trên máy có GPU), có thể tách module `/ai` thành 1 service FastAPI độc lập mà không cần đổi công nghệ — vì đã cùng là Python/FastAPI, việc tách ra sau này chỉ là thay đổi hạ tầng, không phải viết lại code.

**Vì sao PostgreSQL được khuyến nghị hơn MySQL**: hỗ trợ kiểu dữ liệu JSONB (lưu kết quả phân tích AI linh hoạt), full-text search tiếng Việt tốt hơn cho bảng ánh xạ triệu chứng, và Row Level Security (RLS) hỗ trợ trực tiếp cho RBAC ở tầng database.

**Giao tiếp giữa các thành phần**: Frontend gọi thẳng FastAPI backend qua REST API (HTTPS) cho mọi chức năng, bao gồm cả endpoint phân tích triệu chứng — không cần lớp giao tiếp nội bộ giữa 2 service như trước, giúp giảm độ phức tạp triển khai cho quy mô đồ án.

### 1.2 Kỹ thuật tiền xử lý văn bản tiếng Việt & AI Model

#### a) Tiền xử lý văn bản tiếng Việt (pipeline)
1. **Chuẩn hóa Unicode** — đưa văn bản về 1 chuẩn duy nhất (NFC), vì tiếng Việt có nhiều cách encode dấu khác nhau
2. **Chuẩn hóa chính tả/viết tắt y tế** — ánh xạ các từ viết tắt phổ biến (VD: "đau bụg" → "đau bụng", "sốt caO" → "sốt cao") qua từ điển tự xây dựng
3. **Tách từ (word segmentation)** — dùng thư viện `underthesea` hoặc `pyvi`, vì tiếng Việt không phân tách từ bằng khoảng trắng đơn thuần (VD: "đau bụng" là 1 cụm từ, không phải 2 từ riêng)
4. **Loại bỏ stopword** — loại các từ không mang nghĩa (là, thì, mà, rất...), giữ lại từ khóa y tế
5. **Chuẩn hóa vector hóa** — chuyển văn bản đã xử lý thành vector số để đưa vào model (TF-IDF hoặc embedding)

#### b) Kiến trúc mô hình AI (hybrid — kết hợp rule-based và ML)

Thiết kế theo dạng hybrid thay vì thuần ML, vì đây là lĩnh vực y tế — cần tính an toàn và khả năng giải thích cao hơn là chỉ tối ưu độ chính xác:

- **Tầng 1 — Rule-based safety layer (bắt buộc, không dùng ML)**: kiểm tra danh sách từ khóa nguy hiểm (VD: đau ngực dữ dội, khó thở, ngất xỉu...) bằng khớp chuỗi/regex trên văn bản đã tiền xử lý. Đây là lớp an toàn cứng, phải chạy trước và độc lập với model ML để đảm bảo không bỏ sót trường hợp cấp cứu do model dự đoán sai
- **Tầng 2 — Model phân loại chuyên khoa**: dùng TF-IDF + thuật toán phân loại truyền thống (SVM hoặc Logistic Regression đa lớp) làm baseline dễ triển khai; nếu cần độ chính xác cao hơn có thể nâng cấp lên PhoBERT (mô hình embedding tiếng Việt) fine-tune cho bài toán phân loại văn bản y tế
- **Tầng 3 — Bảng ánh xạ triệu chứng-chuyên khoa**: dữ liệu nền do Admin quản lý (đã có trong use case E), dùng làm nhãn huấn luyện và làm fallback khi model không đủ tin cậy
- **Đầu ra**: nhãn chuyên khoa + điểm tin cậy (confidence score, 0-1) — điểm này quyết định rẽ nhánh trong Activity Diagram đã thiết kế (thấp → gợi ý khám tổng quát, cao → đề xuất bác sĩ cụ thể)

#### c) Đóng gói mô hình (model packaging)
- Huấn luyện offline bằng script Python riêng, không huấn luyện trực tiếp trên server production
- Xuất model bằng `joblib`/`pickle` (nếu dùng sklearn) hoặc `TorchScript`/`ONNX` (nếu dùng PhoBERT) để tối ưu tốc độ inference
- Đóng gói AI service thành 1 Docker image riêng, có thể deploy/scale độc lập với backend nghiệp vụ
- Lưu version model (ngày huấn luyện, độ chính xác trên tập test) để dễ rollback nếu bản mới hoạt động kém hơn
- Dữ liệu đánh giá kết quả đề xuất (use case "Đánh giá kết quả đề xuất") được thu thập làm dữ liệu để huấn luyện lại model theo chu kỳ

### 1.3 Giải pháp bảo mật dữ liệu y tế

| Giải pháp | Áp dụng cho |
|---|---|
| **RBAC (Role-Based Access Control)** | Phân 3 role: Bệnh nhân (chỉ truy cập dữ liệu của chính mình), Bác sĩ (chỉ truy cập bệnh nhân có lịch hẹn với mình), Admin (toàn quyền quản trị, không truy cập trực tiếp hồ sơ bệnh án). Thực thi ở middleware backend + RLS ở tầng database nếu dùng PostgreSQL |
| **BCrypt** | Hash mật khẩu người dùng trước khi lưu DB, không bao giờ lưu plaintext, dùng salt tự động của BCrypt để chống rainbow table attack |
| **HTTPS/TLS** | Toàn bộ kết nối Frontend↔Backend và Backend↔AI service đều qua HTTPS, chống nghe lén dữ liệu triệu chứng (thông tin nhạy cảm) khi truyền trên mạng |
| **Bổ sung khuyến nghị** | Mã hóa dữ liệu nhạy cảm khi lưu trữ (encryption at rest) cho trường triệu chứng/kết luận khám; ghi audit log cho các thao tác truy cập hồ sơ bệnh án; giới hạn tần suất gọi API (rate limiting) cho endpoint nhập triệu chứng để tránh lạm dụng AI service |

---

## Phần 2: Đặc tả kỹ thuật mô hình AI và Pipeline triển khai

### 2.1 Sơ đồ pipeline xử lý

```
Triệu chứng (text) 
    → Tiền xử lý tiếng Việt (chuẩn hóa, tách từ, loại stopword)
    → [Tầng 1] Kiểm tra từ khóa nguy hiểm (rule-based)
        → Nếu có: trả cảnh báo cấp cứu, dừng pipeline
    → [Tầng 2] Vector hóa (TF-IDF/embedding) → Model phân loại chuyên khoa
    → Tính điểm tin cậy (confidence score)
        → Nếu thấp: trả gợi ý khám tổng quát
        → Nếu cao: trả chuyên khoa + danh sách bác sĩ phù hợp + điểm tin cậy
    → Lưu log triệu chứng + kết quả vào DB (phục vụ retrain sau này)
```

### 2.2 Đặc tả input/output API (giữa Backend nghiệp vụ và AI service)

**Request** (`POST /api/ai/analyze-symptoms`):
```json
{
  "patient_id": "uuid",
  "symptom_text": "Bị đau bụng dữ dội kèm sốt cao 2 ngày nay"
}
```

**Response** (trường hợp tin cậy cao):
```json
{
  "is_emergency": false,
  "confidence": 0.87,
  "recommended_specialty": "Tiêu hóa",
  "recommended_doctors": ["doctor_id_1", "doctor_id_2"],
  "message": null
}
```

**Response** (trường hợp phát hiện nguy hiểm):
```json
{
  "is_emergency": true,
  "confidence": null,
  "recommended_specialty": null,
  "recommended_doctors": [],
  "message": "Triệu chứng có dấu hiệu nguy hiểm, vui lòng đến cấp cứu ngay hoặc gọi 115"
}
```

### 2.3 Chỉ số đánh giá mô hình
- **Accuracy / F1-score** trên tập test để đánh giá độ chính xác phân loại chuyên khoa
- **Recall của tầng rule-based nguy hiểm** cần đạt gần tuyệt đối (ưu tiên an toàn hơn độ chính xác — thà cảnh báo nhầm còn hơn bỏ sót)
- **Tỷ lệ gợi ý đúng** (đã có trong use case E — Admin xem thống kê) — tính từ dữ liệu "Đánh giá kết quả đề xuất" của bệnh nhân sau khi khám thực tế

### 2.4 Pipeline triển khai (deployment)
1. Model được huấn luyện và đánh giá offline, đạt ngưỡng chất lượng mới được đưa vào production — file model (đã đóng gói theo mục 1.2c) được load vào bộ nhớ khi FastAPI khởi động (startup event), tránh load lại mỗi request
2. Đóng gói toàn bộ FastAPI backend (bao gồm cả router AI) thành 1 Docker image duy nhất, deploy 1 lần
3. Endpoint AI (`/api/ai/analyze-symptoms`) nằm chung route prefix với các endpoint khác, chỉ khác ở tầng router/service bên trong — không cần cấu hình network riêng
4. Có cơ chế fallback: nếu bước inference model lỗi/timeout, endpoint vẫn trả về response hợp lệ (gợi ý khám tổng quát) thay vì để cả API sập, đảm bảo bệnh nhân vẫn đặt lịch trực tiếp được bình thường
