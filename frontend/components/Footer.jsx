import React from 'react';
import Link from 'next/link';
import { Stethoscope, Phone, MapPin, Mail, ShieldAlert } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-20 bg-[#FFFFFF] border-t border-[#E4E1D8] px-4 lg:px-8 py-10 text-left text-xs text-[#6B6A65]">
      <div className="max-w-[1080px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand Info */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-[#1F6F5C] font-bold text-base">
            <Stethoscope className="w-5 h-5" />
            <span>Sức Khoẻ Thông Minh</span>
          </div>
          <p className="text-xs text-[#6B6A65] leading-relaxed">
            Hệ thống y tế hỗ trợ phân tích triệu chứng bệnh ban đầu bằng AI, kết nối đặt lịch khám 30 phút nhanh chóng và quản lý bệnh án điện tử an toàn.
          </p>
        </div>

        {/* Quick Links */}
        <div className="space-y-2">
          <h4 className="font-semibold text-[#1C1B19] text-sm">Danh mục dịch vụ</h4>
          <ul className="space-y-1.5 text-xs">
            <li><Link href="/symptom-checker" className="hover:text-[#1F6F5C]">Phân tích triệu chứng AI</Link></li>
            <li><Link href="/departments" className="hover:text-[#1F6F5C]">Danh mục Chuyên khoa</Link></li>
            <li><Link href="/doctors" className="hover:text-[#1F6F5C]">Đội ngũ Bác sĩ</Link></li>
            <li><Link href="/how-it-works" className="hover:text-[#1F6F5C]">Hướng dẫn đặt lịch</Link></li>
            <li><Link href="/about" className="hover:text-[#1F6F5C]">Giới thiệu hệ thống</Link></li>
            <li><Link href="/contact" className="hover:text-[#1F6F5C]">Liên hệ & Cấp cứu 115</Link></li>
          </ul>
        </div>

        {/* Contact Hotline */}
        <div className="space-y-2">
          <h4 className="font-semibold text-[#1C1B19] text-sm">Liên hệ & Hỗ trợ</h4>
          <p className="flex items-center space-x-1.5 text-xs text-[#1C1B19]">
            <Phone className="w-3.5 h-3.5 text-[#1F6F5C]" />
            <span>Hotline CSKH: <strong>1900 1234</strong></span>
          </p>
          <p className="flex items-center space-x-1.5 text-xs text-[#C1443C] font-semibold">
            <ShieldAlert className="w-3.5 h-3.5 text-[#C1443C]" />
            <span>Cấp cứu y tế: Gọi ngay 115</span>
          </p>
          <p className="flex items-center space-x-1.5 text-xs text-[#6B6A65]">
            <MapPin className="w-3.5 h-3.5 text-[#6B6A65]" />
            <span>Tòa nhà Y tế Quốc tế, Hà Nội</span>
          </p>
        </div>

        {/* Medical Disclaimer per design.md */}
        <div className="space-y-2 bg-[#F7F5F0] p-3 rounded-sm border border-[#E4E1D8]">
          <h4 className="font-semibold text-[#1C1B19] text-xs">Khuyến cáo y tế quan trọng</h4>
          <p className="text-[11px] text-[#6B6A65] leading-relaxed">
            Thông tin đề xuất từ trí tuệ nhân tạo (AI) mang tính chất tham khảo sơ bộ, hỗ trợ định hướng phòng khám. Không có giá trị thay thế cho chẩn đoán y khoa chính thức từ bác sĩ chuyên khoa.
          </p>
        </div>
      </div>

      <div className="max-w-[1080px] mx-auto pt-8 mt-8 border-t border-[#E4E1D8] flex flex-col sm:flex-row items-center justify-between text-xs text-[#6B6A65] gap-2">
        <p>© 2026 Sức Khoẻ Thông Minh — SmartCare Health Platform. Tất cả quyền được bảo lưu.</p>
        <p className="text-[11px]">Tuân thủ quy chuẩn thiết kế Y tế Việt Nam</p>
      </div>
    </footer>
  );
}
