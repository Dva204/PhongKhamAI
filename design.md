# Design Brief — Hệ thống đặt lịch khám bệnh + AI phân tích triệu chứng

Tài liệu này mô tả đầy đủ phong cách thiết kế (design system) cho toàn bộ dự án, dùng làm brief để AI hoặc designer khác thực hiện giao diện. Bám sát vào brief này khi tạo bất kỳ màn hình nào để đảm bảo tính nhất quán xuyên suốt sản phẩm.

## 1. Bối cảnh sản phẩm

- Ứng dụng web đặt lịch khám bệnh dành cho người Việt, có tính năng AI phân tích triệu chứng và đề xuất bác sĩ
- 3 nhóm người dùng: Bệnh nhân (đa dạng độ tuổi, kể cả người lớn tuổi/đặt hộ), Bác sĩ, Admin/Nhân viên
- Tinh thần thiết kế: **đáng tin cậy, rõ ràng, ấm áp** — không lạnh lẽo kiểu bệnh viện, không màu mè kiểu app giải trí. Có 1 trạng thái đặc biệt cần nổi bật rõ ràng: cảnh báo nguy hiểm/khẩn cấp

## 2. Nguyên tắc chỉ đạo (Design principles)

1. Trạng thái khẩn cấp (AI phát hiện từ khóa nguy hiểm) luôn phải khác biệt hoàn toàn về màu sắc và bố cục so với luồng bình thường — không được để người dùng nhầm lẫn mức độ nghiêm trọng
2. Độ tin cậy AI hiển thị trung thực — khi thấp, giao diện chủ động "khiêm tốn" hơn, không cố làm đẹp số liệu
3. Mỗi màn hình chỉ nên có 1 điểm nhấn thị giác chính; màn hình quản trị/CRUD giữ trung tính, không cần đầu tư thẩm mỹ ngang màn hình chính (đề xuất AI)
4. Cỡ chữ tối thiểu 16px cho nội dung chính, vì đối tượng dùng có người lớn tuổi
5. Ưu tiên bố cục căn trái (left-aligned), thao tác 1 tay trên di động
6. Trány các mô-típ thiết kế mặc định của AI-generated UI: card đồng loạt bo góc + shadow xám giống hệt nhau, nhãn ALL CAPS, icon trang trí thừa, gradient/hiệu ứng bóng đổ nặng

## 3. Color tokens

| Token | Hex | Vai trò |
|---|---|---|
| `--bg` | `#F7F5F0` | Nền chính — trắng ngà ấm |
| `--surface` | `#FFFFFF` | Nền card/component nổi trên `--bg` |
| `--primary` | `#1F6F5C` | Xanh lục-lam đậm — nút chính, điều hướng, biểu tượng thương hiệu |
| `--primary-soft` | `#DCEAE6` | Nền nhạt của primary — badge trạng thái "Đã xác nhận", highlight nhẹ |
| `--accent` | `#E8A33D` | Vàng nghệ ấm — CTA phụ, điểm nhấn cho kết quả đề xuất AI |
| `--accent-soft` | `#FBEACB` | Nền nhạt của accent |
| `--danger` | `#C1443C` | Đỏ gạch — **chỉ dùng riêng cho cảnh báo nguy hiểm/khẩn cấp** |
| `--danger-soft` | `#F6DEDC` | Nền nhạt của danger |
| `--warning-form` | `#B45309` | Cam đất — dùng cho lỗi validate form thông thường (KHÁC với `--danger`, để không gây hoang mang) |
| `--success` | `#2F8F5B` | Xác nhận thao tác thành công (đặt lịch thành công...) |
| `--ink` | `#1C1B19` | Chữ chính |
| `--ink-muted` | `#6B6A65` | Chữ phụ/mô tả |
| `--border` | `#E4E1D8` | Viền mặc định |

**Quy tắc dùng màu quan trọng nhất**: `--danger` chỉ xuất hiện khi AI cảnh báo nguy hiểm thật sự. Lỗi form thông thường (nhập sai định dạng, thiếu trường bắt buộc) dùng `--warning-form`, không dùng `--danger` — tránh làm loãng ý nghĩa "khẩn cấp".

## 4. Typography

- **Font family**: Be Vietnam Pro (Google Fonts, mã nguồn mở, hỗ trợ dấu tiếng Việt tốt) — dùng cho cả heading và body, không cần font thứ 2
- **Type scale**:
  - H1 (tiêu đề trang): 28px / weight 600
  - H2 (tiêu đề section): 20px / weight 600
  - H3 (tiêu đề card): 16px / weight 600
  - Body: 16px / weight 400 / line-height 1.6
  - Caption/phụ: 13px / weight 400, màu `--ink-muted`
- Không dùng UPPERCASE cho nhãn hoặc tiêu đề
- Không in đậm/nghiêng 1 từ giữa câu để nhấn mạnh — dùng màu hoặc vị trí bố cục để nhấn thay vì kiểu chữ

## 5. Layout & spacing

- Grid cơ sở: bội số của 8px (8, 16, 24, 32...)
- Bo góc: `--radius-sm: 8px` cho input/button, `--radius-md: 12px` cho card
- Card: nền `--surface`, viền 1px `--border`, không dùng shadow đậm — nếu cần phân lớp, dùng shadow rất nhẹ `0 1px 3px rgba(0,0,0,0.06)`
- Khoảng cách giữa các section: tối thiểu 24px, giữa các phần tử trong cùng nhóm: 8-12px
- Bố cục di động ưu tiên (mobile-first), nội dung căn trái, container max-width 480px trên mobile / 1080px trên desktop cho các trang danh sách

## 6. Component patterns

| Component | Quy tắc |
|---|---|
| Button chính (primary) | Nền `--primary`, chữ trắng, bo góc 8px, chỉ 1 nút primary mỗi màn hình |
| Button phụ (secondary) | Viền `--border`, nền trong suốt, chữ `--ink` |
| Badge trạng thái lịch hẹn | Chờ xác nhận: nền `--accent-soft`; Đã xác nhận: nền `--primary-soft`; Đã hủy/Không đến: nền xám nhạt trung tính; Đã khám: nền `--success` nhạt |
| Thanh độ tin cậy AI | Progress bar ngang, màu đổi theo mức: ≥70% dùng `--primary`, 40-70% dùng `--accent`, <40% dùng tông xám trung tính (không dùng đỏ — vì đỏ dành riêng cho khẩn cấp) |
| Card bác sĩ | Avatar tròn/ảnh + tên + chuyên khoa + đánh giá sao + trạng thái lịch trống, bố cục hàng ngang |
| Step indicator (luồng đặt lịch) | Dùng số thứ tự 1-2-3 vì đây thật sự là quy trình tuần tự, không dùng cho các trang không có tính tuần tự |
| Empty state | Có câu mời hành động rõ ràng (VD: "Bạn chưa có lịch hẹn nào — Đặt lịch ngay"), không chỉ ghi "Không có dữ liệu" |
| Thông báo lỗi | Nêu rõ vấn đề + cách khắc phục, giọng văn trung tính, không dùng "Rất tiếc", "Xin lỗi" |

## 7. Trạng thái đặc biệt — Cảnh báo khẩn cấp

Khi AI phát hiện từ khóa nguy hiểm trong triệu chứng:
- Toàn bộ nền khu vực kết quả chuyển sang `--danger-soft`, viền `--danger`
- Icon cảnh báo rõ ràng, kích thước lớn hơn icon thông thường
- Nội dung: nêu rõ khuyến cáo đến cơ sở y tế gần nhất hoặc gọi cấp cứu 115
- **Không** áp dụng animation fade nhẹ nhàng như các bước khác — hiển thị ngay lập tức, không làm chậm trễ thông tin quan trọng
- Ẩn hoàn toàn các CTA đặt lịch thông thường ở màn hình này, chỉ giữ CTA liên quan đến cấp cứu/liên hệ hỗ trợ

## 8. Danh sách màn hình cần thiết kế (theo actor)

**Bệnh nhân**: Đăng ký/Đăng nhập/Quên mật khẩu · Trang chủ · Hồ sơ cá nhân · Danh sách chuyên khoa & bác sĩ · Chi tiết bác sĩ · Đặt lịch khám · Xác nhận đặt lịch · Lịch hẹn của tôi (xem/hủy/đổi) · Nhập triệu chứng · Kết quả đề xuất AI (2 biến thể: bình thường + cảnh báo khẩn cấp) · Đánh giá kết quả đề xuất · Lịch sử khám · Trung tâm thông báo

**Bác sĩ**: Đăng nhập/Hồ sơ · Lịch hẹn của tôi (dạng calendar) · Chi tiết lịch hẹn + triệu chứng bệnh nhân · Ghi nhận kết luận khám · Lịch sử khám bệnh nhân

**Admin/Nhân viên**: Dashboard thống kê · Quản lý tài khoản & phân quyền · Quản lý danh mục chuyên khoa · Quản lý lịch làm việc/nghỉ bác sĩ · Quản lý bảng ánh xạ triệu chứng-chuyên khoa

Màn hình quan trọng nhất cần đầu tư thẩm mỹ kỹ nhất: **Kết quả đề xuất AI** (cả 2 biến thể) — đây là màn hình thể hiện giá trị cốt lõi của sản phẩm.

## 9. Việc cần tránh (Do NOT)

- Không dùng bảng màu cliché: nền cream + accent cam đất `#D97757`, hoặc nền đen + neon xanh/tím
- Không dùng bộ "SaaS card" đồng loạt bo góc + shadow xám giống hệt nhau cho mọi loại nội dung khác nhau
- Không trộn màu `--danger` vào bất kỳ lỗi/thông báo nào ngoài cảnh báo y tế khẩn cấp thật sự
- Không dùng emoji trong giao diện chính thức, chỉ dùng icon outline nhất quán 1 bộ
- Không thêm animation/hiệu ứng chuyển động thừa ở màn hình cảnh báo khẩn cấp