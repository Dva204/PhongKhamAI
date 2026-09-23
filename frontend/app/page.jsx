'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SymptomCheckerBooking from '../components/SymptomCheckerBooking';
import {
  Stethoscope, Search, Calendar, Phone, CheckCircle, ShieldCheck,
  Star, ArrowRight, Award, Users, HeartPulse, Building2, Cpu,
  FileText, Activity, ChevronRight, Newspaper, MapPin, Check
} from 'lucide-react';

export default function Home() {
  const [quickSearchTab, setQuickSearchTab] = useState('ALL');
  const [quickSearchInput, setQuickSearchInput] = useState('');

  // Quick Booking Widget state (TNH Booking Form inspired)
  const [quickForm, setQuickForm] = useState({
    name: '',
    phone: '',
    branch: 'HN01',
    specialty: 'Tim mạch',
    doctor: '',
    datetime: '',
    symptoms: ''
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleQuickFormSubmit = (e) => {
    e.preventDefault();
    if (!quickForm.name || !quickForm.phone) {
      alert('Vui lòng nhập đầy đủ Họ tên và Số điện thoại.');
      return;
    }
    setFormSubmitted(true);
  };

  const whyUsFeatures = [
    {
      title: 'Công nghệ AI Phân loại Y tế Kép',
      desc: 'Kết hợp mô hình LLM tiên tiến với bộ quy tắc y khoa chuẩn hóa (Rule Engine mapping) giúp gợi ý 1-2 chuyên khoa chính xác 98%.',
      icon: Cpu
    },
    {
      title: 'Đội ngũ Bác sĩ Trưởng khoa 20+ Năm',
      desc: 'Quy tụ các Phó Giáo sư, Tiến sĩ, Bác sĩ Chuyên khoa II từ các bệnh viện tuyến trung ương hàng đầu.',
      icon: Users
    },
    {
      title: 'Cơ sở vật chất 5 Sao & Thiết bị 4.0',
      desc: 'Hệ thống chụp MRI 3.0 Tesla, CT 128 lát cắt, Siêu âm 4D và Hệ thống nội soi ống mềm chuẩn quốc tế.',
      icon: Building2
    },
    {
      title: 'Khám 30 Phút Không Chờ Đợi',
      desc: 'Quy trình phân bổ khung giờ thông minh giúp tối ưu hóa thời gian, không còn cảnh xếp hàng lấy số.',
      icon: CheckCircle
    }
  ];

  const equipmentGallery = [
    { name: 'Máy chụp cộng hưởng từ MRI 3.0 Tesla', desc: 'Chẩn đoán hình ảnh thần kinh, cột sống và tầm soát đột quỵ sớm.', icon: 'MRI' },
    { name: 'Máy chụp cắt lớp CT 128 lát cắt', desc: 'Dựng hình mạch máu tim và tổn thương phổi độ phân giải cao.', icon: 'CT' },
    { name: 'Hệ thống Siêu âm Tim Doppler màu 4D', desc: 'Đánh giá chức năng cơ tim, hở van tim và lưu lượng máu qua cuống tim.', icon: 'US' },
    { name: 'Hệ thống Nội soi Tai Mũi Họng ống mềm', desc: 'Chẩn đoán không đau, phát hiện sớm polyp và tổn thương vòm họng.', icon: 'ENT' }
  ];

  const pressPartners = [
    { name: 'Đài Truyền hình Việt Nam (VTV)', badge: 'VTV1 / VTV3' },
    { name: 'Báo Điện tử VNExpress', badge: 'VNExpress Health' },
    { name: 'Báo Tuổi Trẻ', badge: 'Báo Tuổi Trẻ' },
    { name: 'Báo Dân Trí', badge: 'Dân Trí Y Tế' }
  ];

  return (
    <div className="min-h-screen bg-[#F7F5F0]">
      <Navbar />

      {/* 1. TNH INSPIRED STATS COUNTER BAR */}
      <section className="bg-[#1C1B19] text-[#F7F5F0] py-6 border-b border-gray-800">
        <div className="max-w-[1080px] mx-auto px-4 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1 border-r border-gray-800 last:border-r-0">
            <span className="text-3xl font-bold text-[#1F6F5C] block">04</span>
            <span className="text-xs text-gray-400">Cơ sở Bệnh viện Quốc tế</span>
          </div>
          <div className="space-y-1 border-r border-gray-800 last:border-r-0">
            <span className="text-3xl font-bold text-[#E8A33D] block">1.000+</span>
            <span className="text-xs text-gray-400">Giường bệnh tiêu chuẩn 5 sao</span>
          </div>
          <div className="space-y-1 border-r border-gray-800 last:border-r-0">
            <span className="text-3xl font-bold text-[#1F6F5C] block">200+</span>
            <span className="text-xs text-gray-400">Chuyên gia / Bác sĩ Trưởng khoa</span>
          </div>
          <div className="space-y-1">
            <span className="text-3xl font-bold text-[#E8A33D] block">1.8M+</span>
            <span className="text-xs text-gray-400">Lượt bệnh nhân đã phục vụ</span>
          </div>
        </div>
      </section>

      {/* 2. WHY CHOOSE US (TNH "Vì sao chọn TNH" Section) */}
      <section className="py-12 bg-[#FFFFFF] border-b border-[#E4E1D8]">
        <div className="max-w-[1080px] mx-auto px-4 lg:px-8 space-y-8 text-left">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl font-bold text-[#1C1B19]">
              Vì sao <span className="text-[#1F6F5C]">SmartCare</span> là lựa chọn ưu tiên hàng đầu?
            </h2>
            <p className="text-xs text-[#6B6A65]">
              Nâng tầm trải nghiệm y tế với định hướng lấy người bệnh làm trung tâm, kết hợp công nghệ AI hiện đại
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {whyUsFeatures.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} className="medical-card p-6 space-y-3 hover:border-[#1F6F5C] transition">
                  <div className="w-10 h-10 rounded-sm bg-[#DCEAE6] text-[#1F6F5C] flex items-center justify-center font-bold">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-[#1C1B19]">{feat.title}</h3>
                  <p className="text-xs text-[#6B6A65] leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. CORE AI SYMPTOM CHECKER & DOCTOR BOOKING COMPONENT */}
      <div className="py-8">
        <SymptomCheckerBooking initialTab="checker" hideLandingSections={true} />
      </div>

      {/* 4. MODERN FACILITIES & DIAGNOSTIC EQUIPMENT GALLERY */}
      <section className="py-12 bg-[#FFFFFF] border-y border-[#E4E1D8]">
        <div className="max-w-[1080px] mx-auto px-4 lg:px-8 space-y-8 text-left">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[#E4E1D8] pb-4 gap-2">
            <div>
              <h2 className="text-2xl font-bold text-[#1C1B19]">Cơ sở vật chất & Trang thiết bị hiện đại</h2>
              <p className="text-xs text-[#6B6A65]">Hệ thống máy móc chẩn đoán hình ảnh chuẩn Châu Âu</p>
            </div>
            <Link href="/about" className="text-xs font-semibold text-[#1F6F5C] flex items-center space-x-1 hover:underline">
              <span>Khám phá cơ sở vật chất</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {equipmentGallery.map((item, idx) => (
              <div key={idx} className="medical-card p-5 space-y-3">
                <div className="w-12 h-12 rounded-sm bg-[#F7F5F0] border border-[#E4E1D8] text-[#1F6F5C] font-mono font-bold flex items-center justify-center text-sm">
                  {item.icon}
                </div>
                <h3 className="text-sm font-bold text-[#1C1B19]">{item.name}</h3>
                <p className="text-xs text-[#6B6A65] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. TNH INSPIRED QUICK BOOKING WIDGET FORM SECTION */}
      <section className="py-12 max-w-[1080px] mx-auto px-4 lg:px-8">
        <div className="medical-card p-8 bg-[#FFFFFF] border border-[#E4E1D8] grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
          {/* Left Info Panel */}
          <div className="lg:col-span-5 space-y-4">
            <span className="px-3 py-1 rounded-sm bg-[#DCEAE6] text-[#1F6F5C] text-xs font-bold uppercase tracking-wider">
              ĐẶT LỊCH TRỰC TUYẾN 24/7
            </span>
            <h2 className="text-2xl font-bold text-[#1C1B19] leading-tight">
              Bạn muốn đặt lịch khám trực tiếp với bác sĩ?
            </h2>
            <p className="text-xs text-[#6B6A65] leading-relaxed">
              Thao tác dễ dàng, đặt lịch nhanh chóng - linh hoạt chọn khung giờ, tiết kiệm thời gian và đảm bảo ưu tiên thăm khám không phải xếp hàng.
            </p>
            <div className="space-y-2 pt-2 text-xs text-[#1C1B19]">
              <p className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-[#1F6F5C]" />
                <span>Xác nhận mã đặt lịch qua SMS & Zalo tức thì</span>
              </p>
              <p className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-[#1F6F5C]" />
                <span>Miễn phí tư vấn phân loại triệu chứng bằng AI</span>
              </p>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="lg:col-span-7 bg-[#F7F5F0] p-6 rounded-sm border border-[#E4E1D8]">
            {formSubmitted ? (
              <div className="bg-[#E6F4EA] border border-[#2F8F5B] p-6 rounded-sm text-center space-y-3">
                <CheckCircle className="w-10 h-10 text-[#2F8F5B] mx-auto" />
                <h3 className="text-base font-bold text-[#1C1B19]">Gửi yêu cầu đặt lịch thành công!</h3>
                <p className="text-xs text-[#6B6A65]">
                  Bộ phận CSKH Bệnh viện sẽ gọi lại cho bạn qua SĐT <strong>{quickForm.phone}</strong> trong vòng 15 phút để xác nhận khung giờ khám.
                </p>
                <button
                  onClick={() => setFormSubmitted(false)}
                  className="btn-secondary px-4 py-2 text-xs"
                >
                  Tạo yêu cầu mới
                </button>
              </div>
            ) : (
              <form onSubmit={handleQuickFormSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#1C1B19]">Họ và tên *</label>
                    <input
                      type="text"
                      value={quickForm.name}
                      onChange={(e) => setQuickForm({ ...quickForm, name: e.target.value })}
                      placeholder="Nhập đầy đủ họ tên..."
                      className="w-full bg-white border border-[#E4E1D8] rounded-sm p-2 text-xs text-[#1C1B19] focus:outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#1C1B19]">Số điện thoại *</label>
                    <input
                      type="tel"
                      value={quickForm.phone}
                      onChange={(e) => setQuickForm({ ...quickForm, phone: e.target.value })}
                      placeholder="0912..."
                      className="w-full bg-white border border-[#E4E1D8] rounded-sm p-2 text-xs text-[#1C1B19] focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#1C1B19]">Cơ sở Bệnh viện *</label>
                    <select
                      value={quickForm.branch}
                      onChange={(e) => setQuickForm({ ...quickForm, branch: e.target.value })}
                      className="w-full bg-white border border-[#E4E1D8] rounded-sm p-2 text-xs text-[#1C1B19] focus:outline-none"
                    >
                      <option value="HN01">Bệnh viện Quốc tế Hà Nội</option>
                      <option value="HCM01">Bệnh viện Đa khoa TP. Hồ Chí Minh</option>
                      <option value="DN01">Bệnh viện Đa khoa Đà Nẵng</option>
                      <option value="TN01">Bệnh viện Quốc tế Thái Nguyên</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#1C1B19]">Chuyên khoa khám</label>
                    <select
                      value={quickForm.specialty}
                      onChange={(e) => setQuickForm({ ...quickForm, specialty: e.target.value })}
                      className="w-full bg-white border border-[#E4E1D8] rounded-sm p-2 text-xs text-[#1C1B19] focus:outline-none"
                    >
                      <option value="Tim mạch">Tim mạch</option>
                      <option value="Da liễu">Da liễu</option>
                      <option value="Nội tổng quát">Nội tổng quát</option>
                      <option value="Nhi khoa">Nhi khoa</option>
                      <option value="Tai Mũi Họng">Tai Mũi Họng</option>
                      <option value="Thần kinh">Thần kinh</option>
                      <option value="Hô hấp & Phổi">Hô hấp & Phổi</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#1C1B19]">Mô tả biểu hiện triệu chứng / Nhu cầu khám</label>
                  <textarea
                    rows={2}
                    value={quickForm.symptoms}
                    onChange={(e) => setQuickForm({ ...quickForm, symptoms: e.target.value })}
                    placeholder="Mô tả ngắn gọn dấu hiệu triệu chứng đang gặp phải..."
                    className="w-full bg-white border border-[#E4E1D8] rounded-sm p-2 text-xs text-[#1C1B19] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary w-full py-2.5 text-xs font-semibold flex items-center justify-center space-x-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Gửi yêu cầu đặt lịch khám</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 6. MEDIA & PRESS PARTNERS SECTION */}
      <section className="py-8 bg-[#FFFFFF] border-t border-[#E4E1D8] text-left">
        <div className="max-w-[1080px] mx-auto px-4 lg:px-8 space-y-4">
          <h2 className="text-sm font-bold text-[#6B6A65] uppercase tracking-wider text-center">
            Báo chí & Truyền thông đưa tin về SmartCare Hospital Group
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {pressPartners.map((p, idx) => (
              <div key={idx} className="bg-[#F7F5F0] p-3 rounded-sm border border-[#E4E1D8] text-xs font-semibold text-[#1C1B19]">
                {p.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
