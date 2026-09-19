# TỔNG HỢP BỘ THIẾT KẾ (DESIGN SYSTEM) VÀ DANH SÁCH LANDING PAGES (CẬP NHẬT THEO YÊU CẦU ĐẶC TẢ)
## Dự án: Nền tảng Y tế Thông minh — Đặt lịch khám bệnh & AI Phân tích triệu chứng

---

## 📖 1. BỐI CẢNH VÀ TẦM NHÌN SẢN PHẨM

- **Tên sản phẩm**: SmartCare Health Platform — Sức Khoẻ Thông Minh
- **Mô tả**: Ứng dụng web y tế dành cho người Việt, tích hợp AI phân tích triệu chứng ban đầu, gợi ý 1–2 chuyên khoa chính xác và kết nối đặt lịch khám bệnh 30 phút không chờ đợi.
- **3 Nhóm người dùng (RBAC)**:
  1. `PATIENT` (Bệnh nhân): Mọi độ tuổi (kể cả người lớn tuổi / người nhà đặt hộ).
  2. `DOCTOR` (Bác sĩ): Tiếp nhận ca khám với 3 bước quy trình riêng biệt (Ghi kết luận khám, Lập chỉ định cận lâm sàng UC-D03, Kê đơn thuốc ngoại trú UC-D05).
  3. `ADMIN` (Quản trị viên): Thống kê hệ thống, quản lý chuyên khoa, quản lý bảng ánh xạ triệu chứng AI.
- **Tinh thần thiết kế cốt lõi**: **Đáng tin cậy — Rõ ràng — Ấm áp**. Không lạnh lẽo kiểu bệnh viện truyền thống, không màu mè phong cách giải trí. Phân biệt rõ ràng trạng thái bình thường và trạng thái cảnh báo y tế khẩn cấp 115.

---

## 🎨 2. HỆ THỐNG THIẾT KẾ (DESIGN SYSTEM)

### 2.1 Bảng màu chính thức (Color Tokens)

| Token | Giá trị Hex | Vai trò trong giao diện |
|---|---|---|
| `--bg` | `#F7F5F0` | **Nền chính toàn trang** — Màu trắng ngà ấm áp, tạo cảm giác thư thái |
| `--surface` | `#FFFFFF` | Nền các thẻ Card, Modal, Input nổi trên nền `--bg` |
| `--primary` | `#1F6F5C` | **Xanh lục-lam đậm** — Nút chính (CTA), thanh điều hướng, logo thương hiệu |
| `--primary-soft` | `#DCEAE6` | Nền nhạt của primary — Badge "Đã xác nhận", highlight chuyên khoa, icon container |
| `--accent` | `#E8A33D` | **Vàng nghệ ấm** — Nút phụ/khung giờ được chọn, đánh giá sao, điểm nhấn kết quả AI |
| `--accent-soft` | `#FBEACB` | Nền nhạt của accent — Badge "Chờ xác nhận", cảnh báo lưu ý nhẹ |
| `--danger` | `#C1443C` | **Đỏ gạch** — **CHỈ DÙNG RIÊNG CHO CẢNH BÁO NGUY HIỂM / CẤP CỨU 115** |
| `--danger-soft` | `#F6DEDC` | Nền nhạt của danger — Nền của banner cảnh báo cấp cứu khẩn cấp 115 |
| `--warning-form` | `#B45309` | **Cam đất** — Dùng riêng cho thông báo lỗi validate form (KHÁC với `--danger` để không gây hoang mang) |
| `--success` | `#2F8F5B` | Xác nhận thao tác thành công (Đặt lịch thành công, Lưu hồ sơ thành công) |
| `--ink` | `#1C1B19` | Màu chữ chính — Đen than ấm |
| `--ink-muted` | `#6B6A65` | Màu chữ phụ, mô tả, caption |
| `--border` | `#E4E1D8` | Màu viền mặc định cho Card, Input, Divider |

---

### 2.2 ĐIỂM CẬP NHẬT THEO TÀI LIỆU CẮN CỨ

| # | Vị trí | Trước khi sửa | Sau khi sửa | Căn cứ tài liệu gốc |
|---|---|---|---|---|
| **1** | Trang chủ (`/`) — Trust Metrics | `"8+ Chuyên khoa y tế"` | **`"14 Chuyên khoa y tế"`** | Mục B: *"nhóm xây dựng bảng dữ liệu mẫu ánh xạ cho 14 chuyên khoa tại phòng khám"* |
| **2** | `/symptom-checker` — Trạng thái "Đủ tin cậy" | `"Hiển thị Chuyên khoa gợi ý..."` (số ít) | **`"Hiển thị 1-2 chuyên khoa gợi ý..."`** (Ưu tiên 1 chính + Ưu tiên 2 phối hợp cùng danh sách bác sĩ trực thuộc) | Sequence Diagram Alt 2: *"đề xuất 1-2 chuyên khoa cùng danh sách bác sĩ trực thuộc"* |
| **3** | `/doctor/dashboard` — Ca khám Bác sĩ | Gộp chung sơ sài | **Tách thành 3 bước riêng biệt**:<br>(a) **Ghi kết luận khám** (Chẩn đoán chính/phụ, diễn biến)<br>(b) **Lập phiếu chỉ định cận lâm sàng (UC-D03)** (Xét nghiệm, siêu âm 4D, ECG, X-quang, CT Scan, Nội soi)<br>(c) **Kê đơn thuốc ngoại trú (UC-D05)** (Bảng nhiều dòng `DonThuoc` - `ChiTietDonThuoc` gồm Tên thuốc, Số lượng, Đơn vị, Liều dùng, Đường dùng, Dặn dò, Nút Thêm/Xóa dòng) | UC-D03 và UC-D05 là 2 use case tách biệt, đơn thuốc có cấu trúc `DonThuoc` chứa nhiều `ChiTietDonThuoc` |

---

## 🌐 3. DANH SÁCH 13 LANDING PAGES & APPS ROUTES

1. **Trang chủ (`/`)**: Hero banner, Trust metrics với **14 Chuyên khoa y tế**, Quy trình 3 bước, Khung AI Symptom Checker, Danh mục 14 Chuyên khoa, Đội ngũ Bác sĩ, Đánh giá bệnh nhân.
2. **Công cụ AI Symptom Checker & Đặt lịch (`/symptom-checker`)**: Màn hình phân tích AI với **đề xuất 1–2 chuyên khoa gợi ý** (Ưu tiên 1 + Ưu tiên 2) cùng danh sách bác sĩ trực thuộc.
3. **Danh mục 14 Chuyên khoa Y tế (`/departments`)**: Tra cứu 14 chuyên khoa phòng khám.
4. **Chi tiết Chuyên khoa (`/departments/[id]`)**: Thông tin chuyên sâu, danh mục bệnh lý, quy trình 4 bước khám & danh sách bác sĩ thuộc khoa.
5. **Danh mục Bác sĩ (`/doctors`)**: Bộ lọc chuyên khoa, tìm kiếm bác sĩ theo tên/học vị.
6. **Chi tiết Bác sĩ & Đặt lịch 30 phút (`/doctors/[id]`)**: Học vấn, kinh nghiệm, chọn khung giờ khám 30 phút trực quan, form xác nhận & nhận xét bệnh nhân.
7. **Hướng dẫn & FAQ (`/how-it-works`)**: Các bước đặt lịch bằng hình ảnh/icon & giải đáp thắc mắc FAQ.
8. **Giới thiệu / Về chúng tôi (`/about`)**: Sứ mệnh, Kiến trúc AI Kép (LLM + Rule Engine) & Hội đồng Cố vấn Y khoa.
9. **Liên hệ & Cấp cứu 115 (`/contact`)**: Banner Cấp cứu 115 màu gạch đỏ chuẩn quy chuẩn, mạng lưới phòng khám & form gửi thắc mắc 24/7.
10. **Cổng Bệnh nhân (`/patient/dashboard`)**: Quản lý lịch hẹn, xem chẩn đoán AI, hủy/đổi lịch.
11. **Cổng Bác sĩ (`/doctor/dashboard`)**: Ca khám bác sĩ với **3 bước quy trình chuyên sâu**: (a) Ghi kết luận khám, (b) Chỉ định cận lâm sàng (UC-D03), (c) Kê đơn thuốc ngoại trú bảng nhiều dòng (UC-D05).
12. **Cổng Quản trị viên (`/admin/dashboard`)**: Thống kê hệ thống, quản lý tài khoản, chuyên khoa & bảng ánh xạ triệu chứng AI.
13. **Trang Lỗi 404 (`/_not-found`)**: Giao diện thông báo lỗi đường dẫn thân thiện.
