import asyncio
from datetime import date, time, datetime, timedelta, timezone
from sqlalchemy import select, delete
from app.core.database import AsyncSessionLocal, engine, Base
from app.core.security import hash_password
from app.models.user import ChuyenKhoa, NguoiDung, TaiKhoan, BenhNhan, BacSi, VaiTroEnum
from app.models.appointment import LichLamViec, LichKham, CaLamViecEnum, TrangThaiLichEnum
from app.models.medical import TuKhoaCapCuu, DichVu, KhaiNiem, LuotKham, ChanDoan, DonThuoc, ChiTietDonThuoc


async def seed_database(force_reseed=False):
    """Khởi tạo tập dữ liệu ban đầu cho toàn bộ 18 bảng CSDL phòng khám theo chuẩn OpenMRS"""
    print("[SEEDING] Dang ket noi CSDL va khoi tao du lieu mau phong phu...")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # 1. Kiểm tra nếu đã có dữ liệu và không ép reseed
        stmt_check = select(ChuyenKhoa)
        existing = (await session.execute(stmt_check)).first()
        if existing and not force_reseed:
            print("[SEEDING] CSDL da co du lieu. Dang cap nhat them danh sach ca kham mau...")

        # Nếu force_reseed = True, xóa hết dữ liệu cũ để nạp lại từ đầu
        if force_reseed:
            for table in reversed(Base.metadata.sorted_tables):
                await session.execute(delete(table))
            await session.commit()

        # 2. Seed Danh mục Chuyên khoa (OpenMRS Department)
        stmt_ck = select(ChuyenKhoa)
        existing_ck = (await session.execute(stmt_ck)).scalars().all()
        if not existing_ck:
            chuyen_khoas = [
                ChuyenKhoa(ma_chuyen_khoa="KHOA_NOI", ten_chuyen_khoa="Nội tổng quát", mo_ta="Khám và điều trị các bệnh lý nội khoa tổng hợp", vi_tri_phong="Phòng 101 - Tầng 1"),
                ChuyenKhoa(ma_chuyen_khoa="KHOA_TIM_MACH", ten_chuyen_khoa="Tim mạch", mo_ta="Chuyên sâu bệnh lý tim, mạch máu và tăng huyết áp", vi_tri_phong="Phòng 201 - Tầng 2"),
                ChuyenKhoa(ma_chuyen_khoa="KHOA_TIEU_HOA", ten_chuyen_khoa="Tiêu hóa", mo_ta="Khám dạ dày, đại tràng, gan mật tụy", vi_tri_phong="Phòng 202 - Tầng 2"),
                ChuyenKhoa(ma_chuyen_khoa="KHOA_TMH", ten_chuyen_khoa="Tai - Mũi - Họng", mo_ta="Khám và điều trị các bệnh lý tai mũi họng và tiền đình", vi_tri_phong="Phòng 203 - Tầng 2"),
                ChuyenKhoa(ma_chuyen_khoa="KHOA_THAN_KINH", ten_chuyen_khoa="Thần kinh", mo_ta="Khám đau đầu mạn tính, mất ngủ, chóng mặt, đột quỵ", vi_tri_phong="Phòng 301 - Tầng 3"),
                ChuyenKhoa(ma_chuyen_khoa="KHOA_DA_LIEU", ten_chuyen_khoa="Da liễu", mo_ta="Điều trị dị ứng da, mẩn đỏ, mề đay, nấm da, mụn", vi_tri_phong="Phòng 302 - Tầng 3"),
                ChuyenKhoa(ma_chuyen_khoa="KHOA_HO_HAP", ten_chuyen_khoa="Hô hấp", mo_ta="Điều trị ho dai dẳng, hen phế quản, viêm phổi phế quản", vi_tri_phong="Phòng 303 - Tầng 3"),
                ChuyenKhoa(ma_chuyen_khoa="KHOA_XUONG_KHOP", ten_chuyen_khoa="Cơ xương khớp", mo_ta="Khám đau khớp gối, thoái hóa cột sống, loãng xương", vi_tri_phong="Phòng 401 - Tầng 4"),
            ]
            session.add_all(chuyen_khoas)
            await session.flush()
            existing_ck = chuyen_khoas

        # 3. Seed Từ khóa Cấp cứu Nguy hiểm (Red Flags Rules)
        stmt_tf = select(TuKhoaCapCuu)
        existing_tf = (await session.execute(stmt_tf)).first()
        if not existing_tf:
            tu_khoa_cap_cuu = [
                TuKhoaCapCuu(tu_khoa="đau ngực dữ dội", muc_do_nguy_hiem="rat_nguy_hiem", huong_dan_xu_tri="Nghi ngờ nhồi máu cơ tim cấp. Gọi ngay cấp cứu 115!"),
                TuKhoaCapCuu(tu_khoa="khó thở cấp", muc_do_nguy_hiem="rat_nguy_hiem", huong_dan_xu_tri="Suy hô hấp cấp tính. Hãy gọi 115 hoặc đưa đến phòng Cấp cứu ngay lập tức."),
                TuKhoaCapCuu(tu_khoa="ngất xỉu", muc_do_nguy_hiem="nguy_hiem", huong_dan_xu_tri="Mất ý thức đột ngột. Gọi cấp cứu 115 ngay lập tức!"),
                TuKhoaCapCuu(tu_khoa="co giật", muc_do_nguy_hiem="rat_nguy_hiem", huong_dan_xu_tri="Cơn co giật toàn thân. Cho bệnh nhân nằm nghiêng thông thoáng và gọi 115."),
                TuKhoaCapCuu(tu_khoa="liệt nửa người", muc_do_nguy_hiem="rat_nguy_hiem", huong_dan_xu_tri="Dấu hiệu đột quỵ não cấp (giờ vàng). Gọi 115 khẩn cấp!"),
                TuKhoaCapCuu(tu_khoa="nôn ra máu", muc_do_nguy_hiem="rat_nguy_hiem", huong_dan_xu_tri="Xuất huyết tiêu hóa cấp tính. Cần đến bệnh viện cấp cứu ngay!"),
            ]
            session.add_all(tu_khoa_cap_cuu)

        # 4. Seed Danh mục Dịch vụ Cận lâm sàng
        stmt_dv = select(DichVu)
        existing_dv = (await session.execute(stmt_dv)).scalars().all()
        if not existing_dv:
            dich_vus = [
                DichVu(ma_dich_vu="DV_XN_MAU", ten_dich_vu="Tổng phân tích tế bào máu ngoại vi (18 chỉ số)", don_gia=120000.00, don_vi_tinh="Lần"),
                DichVu(ma_dich_vu="DV_XQ_NGUC", ten_dich_vu="Chụp X-quang tim phổi thẳng kỹ thuật số (CR/DR)", don_gia=180000.00, don_vi_tinh="Lần"),
                DichVu(ma_dich_vu="DV_SA_BUNG", ten_dich_vu="Siêu âm ổ bụng tổng quát màu Doppler", don_gia=200000.00, don_vi_tinh="Lần"),
                DichVu(ma_dich_vu="DV_ECG", ten_dich_vu="Điện tâm đồ (ECG) 12 chuyển đạo", don_gia=100000.00, don_vi_tinh="Lần"),
                DichVu(ma_dich_vu="DV_NS_TMH", ten_dich_vu="Nội soi Tai - Mũi - Họng ống mềm", don_gia=250000.00, don_vi_tinh="Lần"),
            ]
            session.add_all(dich_vus)
            await session.flush()

        # 5. Seed Từ điển Khái niệm ICD-10
        stmt_kn = select(KhaiNiem)
        existing_kn = (await session.execute(stmt_kn)).scalars().all()
        if not existing_kn:
            khai_niems = [
                KhaiNiem(ma_khai_niem="I10", ten_khai_niem="Bệnh tăng huyết áp vô căn (nguyên phát)", loai_khai_niem="benh_icd10"),
                KhaiNiem(ma_khai_niem="K29", ten_khai_niem="Viêm dạ dày và tá tràng", loai_khai_niem="benh_icd10"),
                KhaiNiem(ma_khai_niem="H81", ten_khai_niem="Rối loạn chức năng tiền đình", loai_khai_niem="benh_icd10"),
                KhaiNiem(ma_khai_niem="J00", ten_khai_niem="Viêm mũi họng cấp (cảm thường)", loai_khai_niem="benh_icd10"),
                KhaiNiem(ma_khai_niem="M17", ten_khai_niem="Thoái hóa khớp gối", loai_khai_niem="benh_icd10"),
            ]
            session.add_all(khai_niems)
            await session.flush()

        # 6. Seed Tài khoản Admin
        stmt_admin = select(TaiKhoan).where(TaiKhoan.email == "admin@clinic.com")
        admin_tk = (await session.execute(stmt_admin)).scalar_one_or_none()
        if not admin_tk:
            nd_admin = NguoiDung(ho_ten="Quản Trị Viên Hệ Thống", email="admin@clinic.com", so_dien_thoai="0988000001")
            session.add(nd_admin)
            await session.flush()
            tk_admin = TaiKhoan(
                nguoi_dung_id=nd_admin.id,
                email="admin@clinic.com",
                mat_khau_hash=hash_password("Admin@123456"),
                vai_tro=VaiTroEnum.ADMIN.value,
                is_active=True
            )
            session.add(tk_admin)

        # 7. Seed Danh sách Bác sĩ Chuyên khoa
        stmt_bs = select(BacSi)
        existing_bs = (await session.execute(stmt_bs)).scalars().all()
        if not existing_bs:
            doctors_data = [
                ("an.doctor@clinic.com", "PGS.TS.BS Phạm Hoàng Nam", "0988000002", "PGS.TS.BS", "CCHN-0001", 22, existing_ck[1].id),
                ("bich.doctor@clinic.com", "ThS.BS Trần Thị Mai", "0988000003", "ThS.BS", "CCHN-0002", 12, existing_ck[5].id),
                ("long.doctor@clinic.com", "BS.CKII Lê Văn Đức", "0988000004", "BS.CKII", "CCHN-0003", 18, existing_ck[0].id),
                ("minh.doctor@clinic.com", "BS.CKI Đặng Thu Hà", "0988000005", "BS.CKI", "CCHN-0004", 9, existing_ck[3].id),
            ]
            created_doctors = []
            for email, ho_ten, phone, hoc_vi, cchn, exp, ck_id in doctors_data:
                nd = NguoiDung(ho_ten=ho_ten, email=email, so_dien_thoai=phone)
                session.add(nd)
                await session.flush()
                tk = TaiKhoan(nguoi_dung_id=nd.id, email=email, mat_khau_hash=hash_password("Doctor@123456"), vai_tro=VaiTroEnum.BAC_SI.value, is_active=True)
                session.add(tk)
                bs = BacSi(nguoi_dung_id=nd.id, chuyen_khoa_id=ck_id, hoc_vi=hoc_vi, chung_chi_hanh_nghe=cchn, nam_kinh_nghiem=exp, gia_kham_mac_dinh=350000.00, is_active=True)
                session.add(bs)
                await session.flush()
                created_doctors.append(bs)
        else:
            created_doctors = existing_bs

        # 8. Seed Danh sách Bệnh nhân Mẫu phong phú
        stmt_bn = select(BenhNhan)
        existing_bn = (await session.execute(stmt_bn)).scalars().all()
        created_patients = []
        if not existing_bn:
            patients_info = [
                ("patient@test.com", "Nguyễn Thị Bệnh Nhân", "0912345678", "BN-2026-0001", "O+"),
                ("an.nguyen@test.com", "Nguyễn Văn An", "0988888888", "BN-2026-0002", "A+"),
                ("hung.pham@test.com", "Phạm Quốc Hùng", "0977777777", "BN-2026-0003", "B+"),
                ("mai.trinh@test.com", "Trịnh Thị Mai", "0966666666", "BN-2026-0004", "AB+"),
                ("duc.le@test.com", "Lê Văn Đức", "0955555555", "BN-2026-0005", "O-"),
            ]
            for email, name, phone, code, blood in patients_info:
                nd = NguoiDung(ho_ten=name, email=email, so_dien_thoai=phone)
                session.add(nd)
                await session.flush()
                tk = TaiKhoan(nguoi_dung_id=nd.id, email=email, mat_khau_hash=hash_password("Patient@123456"), vai_tro=VaiTroEnum.BENH_NHAN.value, is_active=True)
                session.add(tk)
                bn = BenhNhan(nguoi_dung_id=nd.id, ma_dinh_danh_y_te=code, nhom_mau=blood, diem_tin_nhiem=100, so_lan_no_show=0)
                session.add(bn)
                await session.flush()
                created_patients.append(bn)
        else:
            created_patients = existing_bn

        # 9. Seed 8 Ca Khám Mẫu Đa dạng Trạng thái cho Ca trực Bác sĩ & Lịch sử Bệnh nhân
        today = date.today()
        stmt_lk = select(LichKham)
        existing_lk = (await session.execute(stmt_lk)).scalars().all()

        if len(existing_lk) < 5:
            doc_main = created_doctors[0]  # PGS.TS.BS Phạm Hoàng Nam (an.doctor@clinic.com)
            doc_second = created_doctors[1] if len(created_doctors) > 1 else doc_main

            sample_appointments = [
                # 1. Bệnh nhân chính (patient@test.com)
                (created_patients[0].id, doc_main.id, today, time(8, 30), 1, "Thỉnh thoảng đau nhói ngực trái, hồi hộp", "Hồi hộp, tức ngực trái khi gắng sức", TrangThaiLichEnum.DA_KHAM.value),
                (created_patients[0].id, doc_main.id, today - timedelta(days=5), time(9, 0), 2, "Tái khám huyết áp định kỳ", "Tái khám đo lại huyết áp", TrangThaiLichEnum.DA_KHAM.value),
                (created_patients[0].id, doc_main.id, today + timedelta(days=3), time(9, 30), 3, "Hẹn tái khám chuyên khoa Tim mạch", "Tái khám theo hẹn bác sĩ", TrangThaiLichEnum.DA_XAC_NHAN.value),

                # 2. Nguyễn Văn An
                (created_patients[1].id if len(created_patients) > 1 else created_patients[0].id, doc_main.id, today, time(8, 0), 1, "Đau đầu mạn tính, chóng mặt, mất ngủ 3 đêm liền", "Đau nửa đầu Migraine", TrangThaiLichEnum.CHO_XAC_NHAN.value),

                # 3. Phạm Quốc Hùng
                (created_patients[2].id if len(created_patients) > 2 else created_patients[0].id, doc_main.id, today, time(9, 0), 2, "Đau dạ dày thượng vị sau khi ăn, ợ chua buồn nôn", "Trào ngược dạ dày thực quản", TrangThaiLichEnum.DANG_KHAM.value),

                # 4. Trịnh Thị Mai
                (created_patients[3].id if len(created_patients) > 3 else created_patients[0].id, doc_main.id, today, time(9, 30), 3, "Viêm họng cấp, sốt nhẹ 38 độ C, đau rát cổ họng", "Ho sốt viêm họng", TrangThaiLichEnum.CHO_XAC_NHAN.value),

                # 5. Lê Văn Đức
                (created_patients[4].id if len(created_patients) > 4 else created_patients[0].id, doc_main.id, today, time(10, 0), 4, "Đau nhức khớp gối phải khi leo cầu thang", "Thoái hóa khớp gối", TrangThaiLichEnum.CHO_XAC_NHAN.value),

                # 6. Nguyễn Thị Bệnh Nhân (Ca chiều)
                (created_patients[0].id, doc_second.id, today, time(14, 0), 1, "Tư vấn dị ứng da liễu mẩn đỏ", "Nổi mẩn đỏ 2 cánh tay", TrangThaiLichEnum.CHO_XAC_NHAN.value),
            ]

            for idx, (bn_id, bs_id, n_kham, g_kham, stt, trieu_chung, ly_do, t_thai) in enumerate(sample_appointments, 101):
                ma_code = f"LK-{n_kham.strftime('%Y%m%d')}-{idx:05d}"
                lk = LichKham(
                    ma_lich_kham=ma_code,
                    benh_nhan_id=bn_id,
                    bac_si_id=bs_id,
                    ngay_kham=n_kham,
                    gio_kham=g_kham,
                    so_thu_tu=stt,
                    ly_do_kham=ly_do,
                    trieu_chung_ban_dau=trieu_chung,
                    trang_thai=t_thai,
                    is_reconfirmed_24h=True
                )
                session.add(lk)

            await session.commit()
            print("[SEEDING COMPLETED] Da khoi tao thanh cong 8 Ca kham phong phu cho tat ca Tai khoan Test!")

if __name__ == "__main__":
    asyncio.run(seed_database(force_reseed=True))
