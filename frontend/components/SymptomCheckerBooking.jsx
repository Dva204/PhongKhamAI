import React, { useState, useEffect, useRef } from 'react';
import {
  Activity, Heart, Sparkles, AlertTriangle, CheckCircle, Clock,
  Calendar, User, Stethoscope, FileText, Phone, Star, ShieldAlert,
  ChevronRight, Plus, Search, Check, RefreshCw, BarChart2, Users,
  ArrowRight, MessageSquare, Pill, Settings, Award, MapPin, LogIn, LogOut, UserCheck,
  Shield, HelpCircle, ChevronDown, CheckSquare, Info
} from 'lucide-react';
import ApiService from '../services/api';
import AuthModal from './AuthModal';

export default function SymptomCheckerBooking() {
  const [activeTab, setActiveTab] = useState('checker'); // checker, doctor, patient, admin
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Ref for scrolling to AI Symptom Checker
  const checkerSectionRef = useRef(null);

  // --- Backend Connection & Catalog State ---
  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState(null);

  // --- Symptom Checker State ---
  const [freeText, setFreeText] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [recommendedDoctors, setRecommendedDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Preset symptom tags (Sentence case per design.md)
  const symptomPresetTags = [
    'Đau ngực', 'Khó thở', 'Sốt cao', 'Đau đầu', 'Nổi mẩn đỏ',
    'Chóng mặt', 'Đau họng', 'Sổ mũi', 'Trẻ sốt quấy', 'Đau bụng quanh rốn', 'Ù tai'
  ];

  // Medical Specialties Catalog Data
  const initialDepartmentsData = [
    { id: 1, code: 'INTERNAL_MEDICINE', name: 'Nội tổng quát', doctor_count: 5, description: 'Chẩn đoán và điều trị bệnh lý đường tiêu hóa, hô hấp, tuần hoàn tổng quát.' },
    { id: 2, code: 'CARDIOLOGY', name: 'Tim mạch', doctor_count: 4, description: 'Tầm soát bệnh mạch vành, tăng huyết áp, suy tim và rối loạn nhịp tim.' },
    { id: 3, code: 'DERMATOLOGY', name: 'Da liễu', doctor_count: 3, description: 'Trị liệu dị ứng da, mề đay mãn tính, chàm và viêm da cơ địa.' },
    { id: 4, code: 'PEDIATRICS', name: 'Nhi khoa', doctor_count: 4, description: 'Chăm sóc sức khỏe toàn diện và tiêm chủng phòng bệnh cho trẻ sơ sinh và trẻ nhỏ.' },
    { id: 5, code: 'ENT', name: 'Tai Mũi Họng', doctor_count: 3, description: 'Nội soi chẩn đoán viêm xoang, viêm họng cấp, viêm amidan và tổn thương màng nhĩ.' },
    { id: 6, code: 'NEUROLOGY', name: 'Thần kinh', doctor_count: 3, description: 'Tầm soát đau đầu mãn tính, rối loạn giấc ngủ, tiền đình và thiếu máu não.' },
    { id: 7, code: 'OBGYN', name: 'Sản phụ khoa', doctor_count: 3, description: 'Khám thai định kỳ, chăm sóc sức khỏe phụ nữ và tư vấn sinh sản.' },
    { id: 8, code: 'OPHTHALMOLOGY', name: 'Mắt (Nhãn khoa)', doctor_count: 2, description: 'Đo tật khúc xạ, tầm soát đau mắt đỏ, đục thủy tinh thể và cận thị.' }
  ];

  // Default Mock Doctors
  const defaultMockDoctors = [
    {
      id: 1,
      full_name: 'PGS.TS.BS Phạm Hoàng Nam',
      title: 'PGS.TS.BS',
      department_name: 'Tim mạch',
      department_id: 2,
      years_experience: 22,
      consultation_fee: 500000,
      rating_avg: 4.9,
      rating_count: 42,
      hospital_address: 'Bệnh viện Đa khoa Quốc tế — Tầng 3, Khoa Tim mạch'
    },
    {
      id: 2,
      full_name: 'ThS.BS Trần Thị Mai',
      title: 'ThS.BS',
      department_name: 'Da liễu',
      department_id: 3,
      years_experience: 12,
      consultation_fee: 350000,
      rating_avg: 4.8,
      rating_count: 29,
      hospital_address: 'Bệnh viện Đa khoa Quốc tế — Tầng 2, Khoa Da liễu'
    },
    {
      id: 3,
      full_name: 'BS.CKII Lê Văn Đức',
      title: 'BS.CKII',
      department_name: 'Nội tổng quát',
      department_id: 1,
      years_experience: 18,
      consultation_fee: 400000,
      rating_avg: 4.95,
      rating_count: 51,
      hospital_address: 'Bệnh viện Đa khoa Quốc tế — Tầng 1, Khoa Nội tổng quát'
    },
    {
      id: 4,
      full_name: 'BS.CKI Đặng Thu Hà',
      title: 'BS.CKI',
      department_name: 'Tai Mũi Họng',
      department_id: 5,
      years_experience: 9,
      consultation_fee: 300000,
      rating_avg: 4.75,
      rating_count: 18,
      hospital_address: 'Bệnh viện Đa khoa Quốc tế — Tầng 4, Khoa Tai Mũi Họng'
    }
  ];

  // Default Slots Fallback
  const defaultSlots = [
    { start_time: '08:00', end_time: '08:30', is_available: true },
    { start_time: '08:30', end_time: '09:00', is_available: true },
    { start_time: '09:00', end_time: '09:30', is_available: false },
    { start_time: '09:30', end_time: '10:00', is_available: true },
    { start_time: '10:00', end_time: '10:30', is_available: true },
    { start_time: '14:00', end_time: '14:30', is_available: true },
    { start_time: '14:30', end_time: '15:00', is_available: true },
    { start_time: '15:00', end_time: '15:30', is_available: true },
  ];

  // --- Doctor Workstation State ---
  const [doctorAppointments, setDoctorAppointments] = useState([
    {
      id: 101,
      appointment_code: 'APT-20260904-9812',
      patient_name: 'Nguyễn Văn An',
      patient_phone: '0988888888',
      appointment_date: new Date().toISOString().split('T')[0],
      start_time: '09:30',
      end_time: '10:00',
      status: 'CONFIRMED',
      department_name: 'Tim mạch',
      symptoms_text: 'Thỉnh thoảng đau ép ngực trái khi vội vã, khó thở nhẹ kèm hồi hộp tim đập nhanh.',
      symptom_tags: ['Đau ngực', 'Khó thở', 'Tim đập nhanh'],
      ai_analysis: {
        is_emergency: false,
        recommended_department_name: 'Tim mạch',
        confidence_score: 0.91,
        medical_explanation: 'Triệu chứng đau ép ngực trái liên quan tới vận động gợi ý kiểm tra tim mạch tầm soát thiếu máu cơ tim.'
      },
      diagnosis: '',
      prescription: ''
    }
  ]);
  const [selectedAptToExamine, setSelectedAptToExamine] = useState(null);
  const [clinicalDiagnosis, setClinicalDiagnosis] = useState('');
  const [clinicalPrescription, setClinicalPrescription] = useState('');

  // --- Patient Medical History State ---
  const [patientHistory, setPatientHistory] = useState([
    {
      id: 100,
      appointment_code: 'APT-20260901-7712',
      doctor_name: 'PGS.TS.BS Phạm Hoàng Nam',
      doctor_title: 'PGS.TS.BS',
      department_name: 'Tim mạch',
      appointment_date: '2026-09-01',
      start_time: '09:00',
      end_time: '09:30',
      status: 'COMPLETED',
      symptoms_text: 'Đau thắt ngực khi leo cầu thang',
      diagnosis: 'Thiếu máu cơ tim thoáng qua / Rối loạn thần kinh tim',
      prescription: '1. Concor 5mg (1 viên/sáng)\n2. Magnesium B6 (2 viên/ngày)',
      feedback_rating: 5,
      feedback_comment: 'Đề xuất chuyên khoa Tim mạch rất chính xác với tình trạng bệnh thực tế.'
    }
  ]);
  const [feedbackRatingModal, setFeedbackRatingModal] = useState(null);
  const [userRating, setUserRating] = useState(5);
  const [userFeedbackComment, setUserFeedbackComment] = useState('');

  // --- Admin Dashboard State ---
  const [adminStats, setAdminStats] = useState({
    total_users: 156,
    total_doctors: 12,
    total_patients: 142,
    total_appointments: 384,
    cancellation_rate_pct: 4.2,
    avg_ai_rating: 4.88,
    total_feedbacks: 198
  });
  const [symptomRules, setSymptomRules] = useState([
    { id: 1, keyword: 'đau ngực dữ dội', tag: 'Đau ngực', dept_name: 'Tim mạch', severity: 'EMERGENCY' },
    { id: 2, keyword: 'nổi mẩn đỏ', tag: 'Nổi mẩn', dept_name: 'Da liễu', severity: 'MEDIUM' },
    { id: 3, keyword: 'ho kéo dài', tag: 'Ho', dept_name: 'Nội tổng quát', severity: 'MEDIUM' },
    { id: 4, keyword: 'sốt cao quấy khóc', tag: 'Trẻ sốt', dept_name: 'Nhi khoa', severity: 'HIGH' }
  ]);
  const [newRuleKeyword, setNewRuleKeyword] = useState('');
  const [newRuleTag, setNewRuleTag] = useState('');
  const [newRuleDept, setNewRuleDept] = useState('Tim mạch');
  const [newRuleSeverity, setNewRuleSeverity] = useState('MEDIUM');

  // Load Current User Profile on Mount
  useEffect(() => {
    fetchCurrentUser();
    fetchDepartments();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      if (ApiService.getToken()) {
        const user = await ApiService.getCurrentUser();
        setCurrentUser(user);
      }
    } catch (e) {
      console.log('No active session or backend offline');
    }
  };

  const fetchDepartments = async () => {
    setLoadingDepts(true);
    try {
      const depts = await ApiService.getDepartments();
      if (depts && depts.length > 0) {
        setDepartments(depts);
      } else {
        setDepartments(initialDepartmentsData);
      }
    } catch (e) {
      setDepartments(initialDepartmentsData);
    } finally {
      setLoadingDepts(false);
    }
  };

  // Fetch Available Slots when Doctor & Date change
  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetchSlots(selectedDoctor.id, selectedDate);
    }
  }, [selectedDoctor, selectedDate]);

  const fetchSlots = async (doctorId, dateStr) => {
    setLoadingSlots(true);
    setSelectedSlot(null);
    try {
      const slots = await ApiService.getDoctorAvailableSlots(doctorId, dateStr);
      setAvailableSlots(slots);
    } catch (e) {
      setAvailableSlots(defaultSlots);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Fetch Doctor Shift Queue when Tab switched
  useEffect(() => {
    if (activeTab === 'doctor') {
      fetchDoctorQueue();
    } else if (activeTab === 'patient') {
      fetchPatientHistory();
    } else if (activeTab === 'admin') {
      fetchAdminStats();
    }
  }, [activeTab]);

  const fetchDoctorQueue = async () => {
    try {
      const list = await ApiService.getDoctorShiftAppointments();
      if (list && list.length > 0) setDoctorAppointments(list);
    } catch (e) {}
  };

  const fetchPatientHistory = async () => {
    try {
      const list = await ApiService.getPatientHistory();
      if (list && list.length > 0) setPatientHistory(list);
    } catch (e) {}
  };

  const fetchAdminStats = async () => {
    try {
      const stats = await ApiService.getAdminDashboardStats();
      setAdminStats(stats);
      const rules = await ApiService.getSymptomMappings();
      if (rules) setSymptomRules(rules);
    } catch (e) {}
  };

  // Scroll to AI Symptom Checker Tool
  const scrollToChecker = () => {
    setActiveTab('checker');
    if (checkerSectionRef.current) {
      checkerSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Toggle Symptom Tag
  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Trigger AI Symptom Analysis
  const handleAnalyzeSymptoms = async () => {
    if (!freeText.trim() && selectedTags.length === 0) {
      alert('Vui lòng nhập mô tả triệu chứng hoặc chọn ít nhất 1 triệu chứng có sẵn.');
      return;
    }

    setAnalyzing(true);
    setAiResult(null);
    setBookingSuccess(null);
    setSelectedDoctor(null);

    try {
      const data = await ApiService.analyzeSymptoms({
        free_text: freeText,
        symptom_tags: selectedTags,
        patient_gender: currentUser?.profile?.gender || 'Nam',
        patient_age: 30
      });

      setAiResult(data.analysis);
      if (data.recommended_doctors && data.recommended_doctors.length > 0) {
        setRecommendedDoctors(data.recommended_doctors);
      } else {
        setRecommendedDoctors(defaultMockDoctors);
      }
    } catch (err) {
      // Fallback local simulation
      const lower = `${freeText} ${selectedTags.join(' ')}`.toLowerCase();
      let deptName = 'Nội tổng quát';
      let deptId = 1;
      let isEmerg = false;
      let explanation = 'Dựa trên mô tả triệu chứng, hệ thống đề xuất bạn thăm khám tại chuyên khoa Nội tổng quát để được chẩn đoán và hướng dẫn chi tiết.';

      if (lower.includes('ngực') || lower.includes('tim') || lower.includes('ép ngực')) {
        deptName = 'Tim mạch';
        deptId = 2;
        explanation = 'Các triệu chứng đau ép ngực và thay đổi nhịp tim cần được thăm khám tại chuyên khoa Tim mạch để kiểm tra điện tâm đồ và chức năng mạch vành.';
        if (lower.includes('dữ dội') || lower.includes('khó thở cấp')) isEmerg = true;
      } else if (lower.includes('nổi mẩn') || lower.includes('ngứa') || lower.includes('da')) {
        deptName = 'Da liễu';
        deptId = 3;
        explanation = 'Biểu hiện nổi mẩn đỏ hoặc ngứa ngoài da phù hợp với thăm khám và điều trị tại chuyên khoa Da liễu.';
      } else if (lower.includes('họng') || lower.includes('sổ mũi') || lower.includes('ù tai')) {
        deptName = 'Tai Mũi Họng';
        deptId = 5;
        explanation = 'Các triệu chứng đường hô hấp trên phù hợp với phạm vi khám chữa bệnh của chuyên khoa Tai Mũi Họng.';
      }

      setAiResult({
        is_emergency: isEmerg,
        emergency_warning: isEmerg ? 'CẢNH BÁO CẤP CỨU Y TẾ: Triệu chứng đau ngực hoặc khó thở dữ dội có dấu hiệu đe dọa tính mạng. Vui lòng gọi Cấp cứu 115 hoặc di chuyển ngay đến cơ sở y tế gần nhất!' : null,
        recommended_department_name: deptName,
        recommended_department_id: deptId,
        confidence_score: 0.88,
        medical_explanation: explanation,
        suggested_action: `Bạn nên đặt lịch thăm khám trực tiếp với Bác sĩ chuyên khoa ${deptName}.`,
        suggested_questions: [
          'Triệu chứng này bắt đầu xuất hiện từ khi nào?',
          'Cơn đau có tăng lên khi vận động hay thở sâu không?',
          'Bạn có kèm theo biểu hiện vã mồ hôi hoặc chóng mặt không?'
        ]
      });

      const filteredDocs = defaultMockDoctors.filter(d => d.department_name === deptName);
      setRecommendedDoctors(filteredDocs.length > 0 ? filteredDocs : defaultMockDoctors);
    } finally {
      setAnalyzing(false);
    }
  };

  // Submit Appointment Booking
  const handleConfirmBooking = async () => {
    if (!selectedDoctor || !selectedSlot) {
      alert('Vui lòng chọn bác sĩ và khung giờ khám.');
      return;
    }

    setBookingLoading(true);

    try {
      const payload = {
        doctor_id: selectedDoctor.id,
        department_id: selectedDoctor.department_id || 1,
        appointment_date: selectedDate,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        symptoms_text: freeText,
        symptom_tags: selectedTags,
        ai_analysis: aiResult
      };

      let newApt;
      try {
        newApt = await ApiService.createAppointment(payload);
      } catch (e) {
        let code = `APT-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(1000+Math.random()*9000)}`;
        newApt = {
          id: Date.now(),
          appointment_code: code,
          doctor_name: selectedDoctor.full_name,
          doctor_title: selectedDoctor.title,
          department_name: selectedDoctor.department_name,
          appointment_date: selectedDate,
          start_time: selectedSlot.start_time,
          end_time: selectedSlot.end_time,
          status: 'CONFIRMED',
          symptoms_text: freeText,
          symptom_tags: selectedTags,
          ai_analysis: aiResult
        };
      }

      setBookingSuccess(newApt);
      setPatientHistory([newApt, ...patientHistory]);
    } catch (e) {
      console.error(e);
    } finally {
      setBookingLoading(false);
    }
  };

  // Complete Doctor Examination
  const handleDoctorCompleteApt = async (aptId) => {
    if (!clinicalDiagnosis.trim()) {
      alert('Vui lòng ghi nhận kết luận chẩn đoán lâm sàng.');
      return;
    }

    try {
      await ApiService.doctorCompleteAppointment(aptId, {
        diagnosis: clinicalDiagnosis,
        prescription: clinicalPrescription,
        doctor_notes: 'Bệnh nhân nghỉ ngơi và theo dõi diễn biến sức khỏe.'
      });
    } catch (e) {}

    const updated = doctorAppointments.map(a => {
      if (a.id === aptId) {
        return {
          ...a,
          status: 'COMPLETED',
          diagnosis: clinicalDiagnosis,
          prescription: clinicalPrescription
        };
      }
      return a;
    });

    setDoctorAppointments(updated);
    setSelectedAptToExamine(null);
    setClinicalDiagnosis('');
    setClinicalPrescription('');
    alert('Đã hoàn tất ghi nhận kết luận khám và đơn thuốc.');
  };

  // Submit Rating Feedback for AI
  const handleSubmitFeedback = async (aptId) => {
    try {
      await ApiService.submitAIFeedback({
        appointment_id: aptId,
        rating: userRating,
        comment: userFeedbackComment,
        was_accurate: userRating >= 4
      });
    } catch (e) {}

    const updated = patientHistory.map(a => {
      if (a.id === aptId) {
        return {
          ...a,
          feedback_rating: userRating,
          feedback_comment: userFeedbackComment
        };
      }
      return a;
    });
    setPatientHistory(updated);
    setFeedbackRatingModal(null);
    setUserFeedbackComment('');
    alert('Cảm ơn bạn đã phản hồi đánh giá độ chính xác của AI.');
  };

  // Add Admin Rule
  const handleAddAdminRule = async () => {
    if (!newRuleKeyword || !newRuleTag) return;
    try {
      await ApiService.createSymptomMapping({
        symptom_keyword: newRuleKeyword,
        symptom_tag: newRuleTag,
        department_id: 1,
        severity: newRuleSeverity
      });
    } catch (e) {}

    setSymptomRules([
      ...symptomRules,
      {
        id: Date.now(),
        keyword: newRuleKeyword,
        tag: newRuleTag,
        dept_name: newRuleDept,
        severity: newRuleSeverity
      }
    ]);
    setNewRuleKeyword('');
    setNewRuleTag('');
  };

  // Handle Logout
  const handleLogout = () => {
    ApiService.setToken(null);
    setCurrentUser(null);
  };

  // Confidence bar color logic per design.md (>=70% primary #1F6F5C, 40-70% accent #E8A33D, <40% neutral gray - NO RED!)
  const getConfidenceBarColor = (score) => {
    if (score >= 0.7) return 'bg-[#1F6F5C]';
    if (score >= 0.4) return 'bg-[#E8A33D]';
    return 'bg-[#9CA3AF]';
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#1C1B19] font-sans antialiased pb-20">
      {/* 1. Navigation Header per design.md */}
      <header className="bg-[#FFFFFF] border-b border-[#E4E1D8] px-4 lg:px-8 py-4 sticky top-0 z-30 shadow-subtle">
        <div className="max-w-[1080px] mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('checker')}>
            <div className="w-10 h-10 rounded-sm bg-[#1F6F5C] text-white flex items-center justify-center font-bold">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[#1C1B19]">Sức Khoẻ Thông Minh</h1>
              <p className="text-xs text-[#6B6A65] hidden sm:block">Nền tảng Đặt lịch khám bệnh & AI Phân tích triệu chứng</p>
            </div>
          </div>

          {/* Account Profile or Auth Login */}
          <div className="flex items-center space-x-3">
            {currentUser ? (
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <span className="text-sm font-medium text-[#1C1B19] block">{currentUser.full_name}</span>
                  <span className="text-xs text-[#6B6A65]">
                    {currentUser.role === 'PATIENT' ? 'Bệnh nhân' : currentUser.role === 'DOCTOR' ? 'Bác sĩ' : 'Quản trị viên'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-sm bg-[#F7F5F0] hover:bg-[#EFECE6] border border-[#E4E1D8] text-[#1C1B19] text-xs font-medium transition flex items-center space-x-1"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Thoát</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="btn-primary px-4 py-2 text-sm flex items-center space-x-1.5"
              >
                <LogIn className="w-4 h-4" />
                <span>Đăng nhập</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. Navigation Sub-header Tabs */}
      <div className="bg-[#FFFFFF] border-b border-[#E4E1D8] px-4 lg:px-8">
        <div className="max-w-[1080px] mx-auto flex space-x-8 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('checker')}
            className={`pb-3 pt-3 font-semibold text-sm border-b-2 transition whitespace-nowrap ${
              activeTab === 'checker' ? 'border-[#1F6F5C] text-[#1F6F5C]' : 'border-transparent text-[#6B6A65] hover:text-[#1C1B19]'
            }`}
          >
            Trang chủ & AI Symptom Checker
          </button>

          <button
            onClick={() => setActiveTab('doctor')}
            className={`pb-3 pt-3 font-semibold text-sm border-b-2 transition whitespace-nowrap ${
              activeTab === 'doctor' ? 'border-[#1F6F5C] text-[#1F6F5C]' : 'border-transparent text-[#6B6A65] hover:text-[#1C1B19]'
            }`}
          >
            Ca khám Bác sĩ
          </button>

          <button
            onClick={() => setActiveTab('patient')}
            className={`pb-3 pt-3 font-semibold text-sm border-b-2 transition whitespace-nowrap ${
              activeTab === 'patient' ? 'border-[#1F6F5C] text-[#1F6F5C]' : 'border-transparent text-[#6B6A65] hover:text-[#1C1B19]'
            }`}
          >
            Lịch hẹn của tôi & Đánh giá
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`pb-3 pt-3 font-semibold text-sm border-b-2 transition whitespace-nowrap ${
              activeTab === 'admin' ? 'border-[#1F6F5C] text-[#1F6F5C]' : 'border-transparent text-[#6B6A65] hover:text-[#1C1B19]'
            }`}
          >
            Quản trị & Quy tắc AI
          </button>
        </div>
      </div>

      {/* Main Container (Max width 1080px per design.md) */}
      <main className="max-w-[1080px] mx-auto px-4 lg:px-8 mt-8 space-y-12">
        {/* ============================================================ */}
        {/* TAB 1: MAIN LANDING PAGE & AI SYMPTOM CHECKER & BOOKING */}
        {/* ============================================================ */}
        {activeTab === 'checker' && (
          <>
            {/* HERO SECTION */}
            <section className="bg-[#FFFFFF] border border-[#E4E1D8] rounded-[12px] p-8 lg:p-10 shadow-subtle relative overflow-hidden">
              <div className="max-w-2xl space-y-4 text-left">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-sm bg-[#DCEAE6] text-[#1F6F5C] text-xs font-semibold">
                  <Sparkles className="w-4 h-4 text-[#1F6F5C]" />
                  <span>Trí tuệ nhân tạo Y tế chuẩn mực</span>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-[#1C1B19] leading-tight">
                  Chăm sóc sức khỏe thông minh và đặt lịch khám tiện lợi
                </h1>
                <p className="text-base text-[#6B6A65] leading-relaxed">
                  Phân tích triệu chứng bệnh ban đầu bằng công nghệ AI, nhận đề xuất chuyên khoa chính xác và chủ động chọn khung giờ khám 30 phút với bác sĩ hàng đầu.
                </p>
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={scrollToChecker}
                    className="btn-primary px-6 py-3 text-sm flex items-center justify-center space-x-2"
                  >
                    <span>Phân tích triệu chứng ngay</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <a
                    href="#doctors-section"
                    className="btn-secondary px-6 py-3 text-sm flex items-center justify-center text-center"
                  >
                    Tra cứu Bác sĩ
                  </a>
                </div>
              </div>

              {/* Trust Metric Badges */}
              <div className="mt-8 pt-6 border-t border-[#E4E1D8] grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
                <div>
                  <span className="text-2xl font-bold text-[#1F6F5C] block">8+</span>
                  <span className="text-xs text-[#6B6A65]">Chuyên khoa y tế</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-[#1F6F5C] block">50+</span>
                  <span className="text-xs text-[#6B6A65]">Bác sĩ chuyên khoa</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-[#1F6F5C] block">98%</span>
                  <span className="text-xs text-[#6B6A65]">Độ hài lòng gợi ý AI</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-[#1F6F5C] block">24/7</span>
                  <span className="text-xs text-[#6B6A65]">Hỗ trợ trực tuyến</span>
                </div>
              </div>
            </section>

            {/* HOW IT WORKS / 3-STEP PROCESS SECTION (Per design.md section 6: Step indicator) */}
            <section className="space-y-6 text-left">
              <div>
                <h2 className="text-2xl font-semibold text-[#1C1B19]">Quy trình 3 bước khám bệnh đơn giản</h2>
                <p className="text-sm text-[#6B6A65]">Dễ dàng thực hiện cho cả gia đình và người lớn tuổi</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="medical-card p-6 space-y-2">
                  <div className="w-8 h-8 rounded-sm bg-[#1F6F5C] text-white font-bold flex items-center justify-center text-sm">
                    1
                  </div>
                  <h3 className="text-base font-semibold text-[#1C1B19]">Nhập triệu chứng</h3>
                  <p className="text-sm text-[#6B6A65]">
                    Nhập biểu hiện sức khỏe tự do bằng lời hoặc bấm chọn các tag triệu chứng có sẵn.
                  </p>
                </div>

                <div className="medical-card p-6 space-y-2">
                  <div className="w-8 h-8 rounded-sm bg-[#1F6F5C] text-white font-bold flex items-center justify-center text-sm">
                    2
                  </div>
                  <h3 className="text-base font-semibold text-[#1C1B19]">AI đề xuất chuyên khoa</h3>
                  <p className="text-sm text-[#6B6A65]">
                    Hệ thống AI tự động đánh giá mức độ rủi ro, phát hiện dấu hiệu cấp cứu và gợi ý phòng khám thích hợp.
                  </p>
                </div>

                <div className="medical-card p-6 space-y-2">
                  <div className="w-8 h-8 rounded-sm bg-[#1F6F5C] text-white font-bold flex items-center justify-center text-sm">
                    3
                  </div>
                  <h3 className="text-base font-semibold text-[#1C1B19]">Chọn bác sĩ & Đặt lịch</h3>
                  <p className="text-sm text-[#6B6A65]">
                    Xem danh sách bác sĩ thuộc chuyên khoa được đề xuất, lựa chọn khung giờ 30 phút phù hợp và nhận mã xác nhận.
                  </p>
                </div>
              </div>
            </section>

            {/* CORE TOOL SECTION: AI SYMPTOM CHECKER TOOL */}
            <section ref={checkerSectionRef} className="space-y-6 text-left">
              <div className="border-b border-[#E4E1D8] pb-3">
                <h2 className="text-2xl font-semibold text-[#1C1B19]">Công cụ Phân tích triệu chứng bằng AI</h2>
                <p className="text-sm text-[#6B6A65]">Bắt đầu nhập tình trạng sức khỏe của bạn bên dưới</p>
              </div>

              {/* Input Form Section */}
              <div className="medical-card p-6 space-y-5">
                {/* Free Text Description Input */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#1C1B19]">Mô tả chi tiết cảm giác sức khỏe</label>
                  <textarea
                    rows={4}
                    value={freeText}
                    onChange={(e) => setFreeText(e.target.value)}
                    placeholder="Ví dụ: Tôi bị đau thắt vùng ngực trái khi leo cầu thang, kèm cảm giác hồi hộp tim đập nhanh..."
                    className="w-full bg-[#FFFFFF] border border-[#E4E1D8] rounded-sm p-3.5 text-sm text-[#1C1B19] placeholder-[#9CA3AF] focus:outline-none focus:border-[#1F6F5C] resize-none"
                  />
                </div>

                {/* Preset Symptom Tags */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1C1B19]">Hoặc bấm chọn nhanh các triệu chứng ({selectedTags.length} đã chọn)</label>
                  <div className="flex flex-wrap gap-2">
                    {symptomPresetTags.map((tag) => {
                      const active = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`px-3 py-1.5 rounded-sm text-sm font-medium transition flex items-center space-x-1 ${
                            active
                              ? 'bg-[#DCEAE6] text-[#1F6F5C] border border-[#1F6F5C]'
                              : 'bg-[#FFFFFF] text-[#1C1B19] border border-[#E4E1D8] hover:bg-[#F7F5F0]'
                          }`}
                        >
                          {active && <Check className="w-3.5 h-3.5 text-[#1F6F5C]" />}
                          <span>{tag}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Single Primary Action Button per design.md */}
                <div className="pt-2">
                  <button
                    onClick={handleAnalyzeSymptoms}
                    disabled={analyzing}
                    className="btn-primary w-full py-3.5 text-base flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {analyzing ? (
                      <span>Hệ thống AI đang phân tích dữ liệu y tế...</span>
                    ) : (
                      <span>Phân tích triệu chứng bằng AI ngay</span>
                    )}
                  </button>
                </div>
              </div>

              {/* ============================================================ */}
              {/* SPECIAL STATE: EMERGENCY WARNING ALERT (Design.md Section 7) */}
              {/* ============================================================ */}
              {aiResult && aiResult.is_emergency && (
                <div className="emergency-panel p-6 space-y-4 text-[#1C1B19]">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-sm bg-[#C1443C] text-white flex items-center justify-center flex-shrink-0">
                      <ShieldAlert className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-xl font-bold text-[#C1443C]">CẢNH BÁO NGUY HIỂM — CẦN KHÁM CẤP CỨU NGAY</h2>
                      <p className="text-sm font-medium text-[#1C1B19]">
                        {aiResult.emergency_warning || 'Phát hiện triệu chứng có nguy cơ đe dọa tính mạng người bệnh. Vui lòng di chuyển đến cơ sở y tế gần nhất hoặc gọi cấp cứu 115!'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#FFFFFF] p-4 rounded-sm border border-[#C1443C]/40 text-sm text-[#1C1B19] space-y-2">
                    <p className="font-semibold text-[#C1443C]">Khuyến cáo an toàn khẩn cấp:</p>
                    <ul className="list-disc list-inside text-sm space-y-1 text-[#1C1B19]">
                      <li>Giữ người bệnh ở tư thế nghỉ ngơi thoải mái, tránh vận động.</li>
                      <li>Gọi ngay tổng đài Cấp cứu 115 hoặc nhờ người thân đưa tới khoa Cấp cứu bệnh viện gần nhất.</li>
                      <li>Không tự ý uống các loại thuốc khi chưa có chỉ định trực tiếp từ bác sĩ.</li>
                    </ul>
                  </div>

                  {/* Only Emergency Hotline CTA per design.md section 7 */}
                  <div className="pt-2">
                    <a
                      href="tel:115"
                      className="inline-flex items-center justify-center space-x-2 w-full py-3.5 rounded-sm bg-[#C1443C] hover:bg-[#a83831] text-white font-bold text-base transition text-center shadow-sm"
                    >
                      <Phone className="w-5 h-5" />
                      <span>GỌI CẤP CỨU 115 NGAY LẬP TỨC</span>
                    </a>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* NORMAL STATE: AI RECOMMENDATION RESULT (Key Feature Visual Highlight) */}
              {/* ============================================================ */}
              {aiResult && !aiResult.is_emergency && (
                <div className="medical-card p-6 space-y-6">
                  <div className="border-b border-[#E4E1D8] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold text-[#1C1B19]">Kết quả phân tích đề xuất chuyên khoa</h2>
                      <p className="text-sm text-[#6B6A65]">Đề xuất dựa trên dữ liệu triệu chứng bạn đã cung cấp</p>
                    </div>

                    {/* Recommended Department Highlight Badge */}
                    <div className="bg-[#DCEAE6] border border-[#1F6F5C]/30 px-3.5 py-1.5 rounded-sm font-semibold text-sm text-[#1F6F5C] flex items-center space-x-2">
                      <Stethoscope className="w-4 h-4 text-[#1F6F5C]" />
                      <span>Khoa {aiResult.recommended_department_name}</span>
                    </div>
                  </div>

                  {/* AI Confidence Progress Bar (Per design.md: >=70% primary, 40-70% accent, <40% neutral gray - NO RED!) */}
                  <div className="space-y-2 bg-[#F7F5F0] p-4 rounded-sm border border-[#E4E1D8]">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-[#1C1B19]">Độ tin cậy của đề xuất AI:</span>
                      <span className="font-semibold text-[#1F6F5C]">{Math.round(aiResult.confidence_score * 100)}%</span>
                    </div>
                    <div className="w-full bg-[#E4E1D8] h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${getConfidenceBarColor(aiResult.confidence_score)}`}
                        style={{ width: `${Math.min(100, Math.max(10, aiResult.confidence_score * 100))}%` }}
                      />
                    </div>
                  </div>

                  {/* Medical Explanation Text */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-[#1C1B19]">Giải thích y khoa tóm tắt</h3>
                    <p className="text-base text-[#1C1B19] leading-relaxed bg-[#FFFFFF] p-4 rounded-sm border border-[#E4E1D8]">
                      {aiResult.medical_explanation}
                    </p>
                  </div>

                  {/* Suggested Questions for Consultation */}
                  {aiResult.suggested_questions && aiResult.suggested_questions.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-[#1C1B19]">Các câu hỏi bác sĩ có thể sẽ hỏi bạn khi khám</h3>
                      <ul className="space-y-1.5 pl-1">
                        {aiResult.suggested_questions.map((q, idx) => (
                          <li key={idx} className="text-sm text-[#1C1B19] flex items-start space-x-2">
                            <span className="text-[#1F6F5C] font-bold">•</span>
                            <span>{q}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Doctor Discovery & Booking Slot Picker */}
              {aiResult && !aiResult.is_emergency && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-[#1C1B19]">
                      Danh sách bác sĩ thuộc Chuyên khoa {aiResult.recommended_department_name}
                    </h2>
                  </div>

                  {/* Doctor List */}
                  <div className="space-y-3">
                    {recommendedDoctors.map((doc) => {
                      const isSelected = selectedDoctor?.id === doc.id;
                      return (
                        <div
                          key={doc.id}
                          onClick={() => setSelectedDoctor(doc)}
                          className={`medical-card p-5 cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                            isSelected ? 'border-2 border-[#1F6F5C] bg-[#F7F5F0]/50' : 'hover:border-[#1F6F5C]/50'
                          }`}
                        >
                          <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 rounded-full bg-[#DCEAE6] text-[#1F6F5C] font-semibold flex items-center justify-center text-sm flex-shrink-0">
                              {doc.title.slice(0, 3)}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <h3 className="text-base font-semibold text-[#1C1B19]">{doc.full_name}</h3>
                                <span className="px-2 py-0.5 rounded-sm text-xs font-medium bg-[#DCEAE6] text-[#1F6F5C]">
                                  {doc.department_name}
                                </span>
                              </div>
                              <p className="text-xs text-[#6B6A65]">
                                {doc.years_experience} năm kinh nghiệm • ★ {doc.rating_avg} ({doc.rating_count} đánh giá)
                              </p>
                              <p className="text-xs text-[#6B6A65] flex items-center">
                                <MapPin className="w-3.5 h-3.5 mr-1 text-[#6B6A65]" />
                                {doc.hospital_address}
                              </p>
                            </div>
                          </div>

                          <div className="text-right sm:self-center flex sm:flex-col justify-between items-center sm:items-end border-t sm:border-t-0 pt-2 sm:pt-0 border-[#E4E1D8]">
                            <span className="text-base font-bold text-[#1F6F5C]">
                              {doc.consultation_fee ? doc.consultation_fee.toLocaleString('vi-VN') : '350.000'} đ
                            </span>
                            <span className={`text-xs px-3 py-1 rounded-sm font-medium mt-1 transition ${
                              isSelected ? 'bg-[#1F6F5C] text-white' : 'btn-secondary'
                            }`}>
                              {isSelected ? 'Đã chọn bác sĩ' : 'Chọn bác sĩ'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Date & 30-min Slot Picker */}
                  {selectedDoctor && (
                    <div className="medical-card p-6 space-y-5">
                      <h3 className="text-base font-semibold text-[#1C1B19]">Chọn ngày và khung giờ khám (Slot 30 phút)</h3>

                      <div className="flex items-center space-x-3">
                        <label className="text-sm font-medium text-[#1C1B19]">Chọn ngày khám:</label>
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="bg-[#FFFFFF] border border-[#E4E1D8] rounded-sm px-3 py-1.5 text-sm text-[#1C1B19] focus:outline-none focus:border-[#1F6F5C]"
                        />
                      </div>

                      {/* Slot Grid */}
                      {loadingSlots ? (
                        <p className="text-xs text-[#6B6A65]">Đang kiểm tra khung giờ khả dụng...</p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          {(availableSlots.length > 0 ? availableSlots : defaultSlots).map((slot, idx) => {
                            const isSlotSelected = selectedSlot?.start_time === slot.start_time;
                            return (
                              <button
                                key={idx}
                                disabled={!slot.is_available}
                                onClick={() => setSelectedSlot(slot)}
                                className={`py-2.5 px-3 rounded-sm text-xs font-semibold border transition text-center ${
                                  !slot.is_available
                                    ? 'bg-[#F7F5F0] text-[#9CA3AF] border-[#E4E1D8] cursor-not-allowed line-through'
                                    : isSlotSelected
                                    ? 'bg-[#1F6F5C] text-white border-[#1F6F5C]'
                                    : 'bg-[#FFFFFF] text-[#1C1B19] border-[#E4E1D8] hover:border-[#1F6F5C]'
                                }`}
                              >
                                {slot.start_time} - {slot.end_time}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Single Primary Booking Button */}
                      <div className="pt-2">
                        <button
                          onClick={handleConfirmBooking}
                          disabled={!selectedSlot || bookingLoading}
                          className="btn-primary w-full py-3 text-sm flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                          {bookingLoading ? (
                            <span>Đang tạo lịch hẹn...</span>
                          ) : (
                            <span>Xác nhận đặt lịch khám</span>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Booking Success Banner */}
                  {bookingSuccess && (
                    <div className="bg-[#E6F4EA] border border-[#2F8F5B] rounded-md p-5 space-y-3">
                      <div className="flex items-center space-x-3 text-[#2F8F5B]">
                        <CheckCircle className="w-6 h-6 flex-shrink-0" />
                        <div>
                          <h3 className="text-base font-semibold text-[#1C1B19]">Đặt lịch khám thành công</h3>
                          <p className="text-xs text-[#6B6A65]">Mã lịch hẹn: <span className="font-mono font-bold text-[#1F6F5C]">{bookingSuccess.appointment_code}</span></p>
                        </div>
                      </div>
                      <div className="text-xs text-[#1C1B19] space-y-1 bg-[#FFFFFF] p-3 rounded-sm border border-[#E4E1D8]">
                        <p><strong>Bác sĩ:</strong> {bookingSuccess.doctor_name} ({bookingSuccess.department_name})</p>
                        <p><strong>Thời gian:</strong> {bookingSuccess.start_time} - {bookingSuccess.end_time} ngày {bookingSuccess.appointment_date}</p>
                        <p><strong>Trạng thái:</strong> <span className="text-[#1F6F5C] font-semibold">Đã xác nhận</span></p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* MEDICAL SPECIALTIES CATALOG SECTION */}
            <section className="space-y-6 text-left">
              <div className="border-b border-[#E4E1D8] pb-3">
                <h2 className="text-2xl font-semibold text-[#1C1B19]">Danh mục chuyên khoa y tế</h2>
                <p className="text-sm text-[#6B6A65]">Phòng khám đa khoa hỗ trợ khám chữa các nhóm bệnh phổ biến</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(departments.length > 0 ? departments : initialDepartmentsData).map((dept) => (
                  <div
                    key={dept.id}
                    onClick={() => {
                      setFreeText(`Tôi muốn tư vấn và khám chuyên khoa ${dept.name}`);
                      scrollToChecker();
                    }}
                    className="medical-card p-5 space-y-2.5 cursor-pointer hover:border-[#1F6F5C]/60 transition"
                  >
                    <div className="w-10 h-10 rounded-sm bg-[#DCEAE6] text-[#1F6F5C] flex items-center justify-center font-bold">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-semibold text-[#1C1B19]">{dept.name}</h3>
                    <p className="text-xs text-[#6B6A65] line-clamp-2">{dept.description}</p>
                    <div className="pt-2 text-xs font-semibold text-[#1F6F5C] flex items-center space-x-1">
                      <span>Đặt khám chuyên khoa</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* DOCTOR DIRECTORY SECTION */}
            <section id="doctors-section" className="space-y-6 text-left">
              <div className="border-b border-[#E4E1D8] pb-3">
                <h2 className="text-2xl font-semibold text-[#1C1B19]">Đội ngũ Bác sĩ Chuyên khoa</h2>
                <p className="text-sm text-[#6B6A65]">Bác sĩ giàu kinh nghiệm chẩn đoán và điều trị tại các bệnh viện uy tín</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {defaultMockDoctors.map((doc) => (
                  <div key={doc.id} className="medical-card p-5 space-y-3">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 rounded-full bg-[#DCEAE6] text-[#1F6F5C] font-semibold flex items-center justify-center text-sm flex-shrink-0">
                        {doc.title.slice(0, 3)}
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-semibold text-[#1C1B19]">{doc.full_name}</h3>
                          <span className="px-2 py-0.5 rounded-sm text-xs font-medium bg-[#DCEAE6] text-[#1F6F5C]">
                            {doc.department_name}
                          </span>
                        </div>
                        <p className="text-xs text-[#6B6A65]">{doc.years_experience} năm kinh nghiệm • ★ {doc.rating_avg} ({doc.rating_count} đánh giá)</p>
                        <p className="text-xs text-[#6B6A65] flex items-center">
                          <MapPin className="w-3.5 h-3.5 mr-1 text-[#6B6A65]" />
                          {doc.hospital_address}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-[#E4E1D8] pt-3">
                      <span className="text-sm font-bold text-[#1F6F5C]">
                        {doc.consultation_fee.toLocaleString('vi-VN')} đ / lượt khám
                      </span>
                      <button
                        onClick={() => {
                          setSelectedDoctor(doc);
                          scrollToChecker();
                        }}
                        className="btn-secondary px-3 py-1.5 text-xs"
                      >
                        Đặt lịch với bác sĩ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* PATIENT TESTIMONIALS SECTION */}
            <section className="space-y-6 text-left">
              <div className="border-b border-[#E4E1D8] pb-3">
                <h2 className="text-2xl font-semibold text-[#1C1B19]">Đánh giá từ Bệnh nhân</h2>
                <p className="text-sm text-[#6B6A65]">Ý kiến phản hồi thực tế về chất lượng tư vấn AI và khám bệnh</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="medical-card p-5 space-y-3">
                  <div className="flex items-center space-x-1 text-[#E8A33D]">
                    ★★★★★
                  </div>
                  <p className="text-sm text-[#1C1B19]">
                    "AI gợi ý đúng chuyên khoa Tim mạch ngay khi tôi nhập triệu chứng đau ép ngực. Đặt lịch khám 30 phút rất nhanh chóng."
                  </p>
                  <span className="text-xs text-[#6B6A65] block font-medium">— Nguyễn Văn An (Hà Nội)</span>
                </div>

                <div className="medical-card p-5 space-y-3">
                  <div className="flex items-center space-x-1 text-[#E8A33D]">
                    ★★★★★
                  </div>
                  <p className="text-sm text-[#1C1B19]">
                    "Giao diện dễ dùng, chữ to rõ ràng nên người lớn tuổi như tôi cũng tự thao tác đặt lịch cho cháu được."
                  </p>
                  <span className="text-xs text-[#6B6A65] block font-medium">— Lê Thị Bích (Đà Nẵng)</span>
                </div>

                <div className="medical-card p-5 space-y-3">
                  <div className="flex items-center space-x-1 text-[#E8A33D]">
                    ★★★★★
                  </div>
                  <p className="text-sm text-[#1C1B19]">
                    "Bác sĩ khám rất kỹ, đơn thuốc và kết luận chẩn đoán được lưu sẵn trong tài khoản xem lại bất cứ lúc nào."
                  </p>
                  <span className="text-xs text-[#6B6A65] block font-medium">— Trần Hoàng Minh (TP. Hồ Chí Minh)</span>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ============================================================ */}
        {/* TAB 2: DOCTOR CLINICAL WORKSTATION (Pkg D) */}
        {/* ============================================================ */}
        {activeTab === 'doctor' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
            {/* Left: Doctor Appointment Queue */}
            <div className="lg:col-span-5 space-y-4">
              <div className="medical-card p-5 space-y-3">
                <h2 className="text-base font-semibold text-[#1C1B19]">Danh sách bệnh nhân ca trực</h2>

                <div className="space-y-3">
                  {doctorAppointments.map((apt) => {
                    const isSelected = selectedAptToExamine?.id === apt.id;
                    return (
                      <div
                        key={apt.id}
                        onClick={() => {
                          setSelectedAptToExamine(apt);
                          setClinicalDiagnosis(apt.diagnosis || '');
                          setClinicalPrescription(apt.prescription || '');
                        }}
                        className={`p-4 rounded-sm border cursor-pointer transition space-y-2 ${
                          isSelected ? 'border-2 border-[#1F6F5C] bg-[#F7F5F0]' : 'border-[#E4E1D8] bg-[#FFFFFF] hover:border-[#1F6F5C]/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-sm text-[#1C1B19]">{apt.patient_name}</h3>
                          <span className={`px-2.5 py-0.5 rounded-sm text-xs font-medium ${
                            apt.status === 'COMPLETED' ? 'bg-[#E6F4EA] text-[#2F8F5B]' : 'bg-[#DCEAE6] text-[#1F6F5C]'
                          }`}>
                            {apt.status === 'COMPLETED' ? 'Đã khám' : 'Chờ khám'}
                          </span>
                        </div>
                        <p className="text-xs text-[#6B6A65]">Ca khám: {apt.start_time} - {apt.end_time} • SĐT: {apt.patient_phone || '0988888888'}</p>
                        <p className="text-xs text-[#1C1B19] line-clamp-1 italic bg-[#F7F5F0] p-2 rounded-sm border border-[#E4E1D8]">
                          Triệu chứng: "{apt.symptoms_text}"
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Clinical Diagnosis Form */}
            <div className="lg:col-span-7">
              {selectedAptToExamine ? (
                <div className="medical-card p-6 space-y-5">
                  <div className="border-b border-[#E4E1D8] pb-3">
                    <h2 className="text-lg font-semibold text-[#1C1B19]">Hồ sơ bệnh án: {selectedAptToExamine.patient_name}</h2>
                    <p className="text-xs text-[#6B6A65]">Mã hồ sơ: {selectedAptToExamine.appointment_code} • Khung giờ: {selectedAptToExamine.start_time} - {selectedAptToExamine.end_time}</p>
                  </div>

                  {/* AI Assessment Report Pre-inspection for Doctor */}
                  <div className="bg-[#DCEAE6]/50 border border-[#1F6F5C]/30 p-4 rounded-sm text-xs space-y-1.5 text-[#1C1B19]">
                    <span className="font-semibold text-[#1F6F5C] block">Báo cáo tham khảo từ AI Symptom Checker:</span>
                    <p><strong>Chuyên khoa đề xuất:</strong> Khoa {selectedAptToExamine.ai_analysis?.recommended_department_name || selectedAptToExamine.department_name}</p>
                    <p><strong>Giải thích y khoa:</strong> {selectedAptToExamine.ai_analysis?.medical_explanation}</p>
                  </div>

                  {/* Form */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-[#1C1B19]">Chẩn đoán lâm sàng của bác sĩ (Diagnosis)</label>
                      <textarea
                        rows={3}
                        value={clinicalDiagnosis}
                        onChange={(e) => setClinicalDiagnosis(e.target.value)}
                        placeholder="Nhập kết luận chẩn đoán lâm sàng..."
                        className="w-full bg-[#FFFFFF] border border-[#E4E1D8] rounded-sm p-3 text-sm text-[#1C1B19] focus:outline-none focus:border-[#1F6F5C]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-[#1C1B19]">Đơn thuốc và hướng dẫn điều trị (Prescription)</label>
                      <textarea
                        rows={4}
                        value={clinicalPrescription}
                        onChange={(e) => setClinicalPrescription(e.target.value)}
                        placeholder="1. Tên thuốc A (Số lượng, Liều dùng sáng/tối)..."
                        className="w-full bg-[#FFFFFF] border border-[#E4E1D8] rounded-sm p-3 text-sm text-[#1C1B19] focus:outline-none focus:border-[#1F6F5C]"
                      />
                    </div>

                    <button
                      onClick={() => handleDoctorCompleteApt(selectedAptToExamine.id)}
                      className="btn-primary w-full py-3 text-sm flex items-center justify-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Hoàn tất lượt khám & Lưu hồ sơ</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="medical-card p-12 text-center text-[#6B6A65]">
                  <Stethoscope className="w-10 h-10 mx-auto mb-2 text-[#9CA3AF]" />
                  <p className="text-sm">Vui lòng chọn 1 ca khám từ danh sách bên trái để ghi nhận kết luận bệnh án.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: PATIENT PORTAL & HISTORY (Module A & C) */}
        {/* ============================================================ */}
        {activeTab === 'patient' && (
          <div className="space-y-6 text-left">
            <div className="medical-card p-6 space-y-4">
              <h2 className="text-xl font-semibold text-[#1C1B19]">Lịch hẹn khám của tôi</h2>

              <div className="space-y-4">
                {patientHistory.map((apt) => (
                  <div key={apt.id} className="bg-[#FFFFFF] border border-[#E4E1D8] rounded-sm p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E4E1D8] pb-3 gap-2">
                      <div>
                        <span className="text-xs font-mono font-bold text-[#1F6F5C]">{apt.appointment_code}</span>
                        <h3 className="text-base font-semibold text-[#1C1B19]">{apt.doctor_name} ({apt.department_name})</h3>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-[#6B6A65]">{apt.appointment_date} ({apt.start_time} - {apt.end_time})</span>
                        <span className={`px-2.5 py-0.5 rounded-sm text-xs font-medium ${
                          apt.status === 'COMPLETED'
                            ? 'bg-[#E6F4EA] text-[#2F8F5B]'
                            : apt.status === 'CONFIRMED'
                            ? 'bg-[#DCEAE6] text-[#1F6F5C]'
                            : apt.status === 'CANCELLED'
                            ? 'bg-[#F1F0EC] text-[#6B6A65]'
                            : 'bg-[#FBEACB] text-[#B45309]'
                        }`}>
                          {apt.status === 'COMPLETED' ? 'Đã khám' : apt.status === 'CONFIRMED' ? 'Đã xác nhận' : apt.status === 'CANCELLED' ? 'Đã hủy' : 'Chờ xác nhận'}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[#1C1B19]"><strong>Mô tả triệu chứng:</strong> {apt.symptoms_text}</p>

                    {apt.diagnosis && (
                      <div className="bg-[#F7F5F0] p-3 rounded-sm border border-[#E4E1D8] text-xs space-y-1">
                        <p className="font-semibold text-[#1F6F5C]">Chẩn đoán của bác sĩ: {apt.diagnosis}</p>
                        <p className="text-[#1C1B19]"><strong>Đơn thuốc:</strong> {apt.prescription}</p>
                      </div>
                    )}

                    {/* AI Feedback Button */}
                    {apt.status === 'COMPLETED' && (
                      <div className="pt-1 flex items-center justify-between text-xs">
                        {apt.feedback_rating ? (
                          <span className="text-amber-700 font-medium flex items-center">
                            Đã đánh giá gợi ý AI: ★ {apt.feedback_rating}/5
                          </span>
                        ) : (
                          <button
                            onClick={() => setFeedbackRatingModal(apt)}
                            className="btn-secondary px-3 py-1.5 text-xs font-medium"
                          >
                            Đánh giá độ chính xác đề xuất AI (1-5 sao)
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Rating Modal */}
            {feedbackRatingModal && (
              <div className="fixed inset-0 z-50 bg-[#1C1B19]/40 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-[#FFFFFF] border border-[#E4E1D8] rounded-md p-6 max-w-md w-full space-y-4 shadow-lg text-[#1C1B19]">
                  <h3 className="text-base font-semibold text-[#1C1B19]">Đánh giá độ chính xác của đề xuất AI</h3>
                  <p className="text-xs text-[#6B6A65]">
                    Đề xuất chuyên khoa <strong>{feedbackRatingModal.department_name}</strong> của AI có phù hợp với thực tế chẩn đoán bệnh của bạn không?
                  </p>

                  <div className="flex justify-center space-x-2 py-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setUserRating(star)}
                        className="text-2xl transition hover:scale-110"
                      >
                        <span className={star <= userRating ? 'text-[#E8A33D]' : 'text-[#E4E1D8]'}>★</span>
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={3}
                    value={userFeedbackComment}
                    onChange={(e) => setUserFeedbackComment(e.target.value)}
                    placeholder="Nhập ý kiến góp ý của bạn (tùy chọn)..."
                    className="w-full bg-[#FFFFFF] border border-[#E4E1D8] rounded-sm p-2.5 text-xs text-[#1C1B19] focus:outline-none"
                  />

                  <div className="flex space-x-3">
                    <button
                      onClick={() => setFeedbackRatingModal(null)}
                      className="btn-secondary flex-1 py-2 text-xs"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={() => handleSubmitFeedback(feedbackRatingModal.id)}
                      className="btn-primary flex-1 py-2 text-xs"
                    >
                      Gửi đánh giá
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: ADMIN DASHBOARD & RULES (Pkg E) */}
        {/* ============================================================ */}
        {activeTab === 'admin' && (
          <div className="space-y-8 text-left">
            {/* Neutral Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="medical-card p-4">
                <span className="text-xs text-[#6B6A65]">Tổng lượt đặt hẹn</span>
                <div className="text-2xl font-bold text-[#1C1B19] mt-1">{adminStats.total_appointments}</div>
              </div>

              <div className="medical-card p-4">
                <span className="text-xs text-[#6B6A65]">Tỷ lệ hủy lịch</span>
                <div className="text-2xl font-bold text-[#1C1B19] mt-1">{adminStats.cancellation_rate_pct}%</div>
              </div>

              <div className="medical-card p-4">
                <span className="text-xs text-[#6B6A65]">Độ hài lòng gợi ý AI</span>
                <div className="text-2xl font-bold text-[#1F6F5C] mt-1">★ {adminStats.avg_ai_rating}</div>
              </div>

              <div className="medical-card p-4">
                <span className="text-xs text-[#6B6A65]">Tổng số Bác sĩ</span>
                <div className="text-2xl font-bold text-[#1C1B19] mt-1">{adminStats.total_doctors}</div>
              </div>
            </div>

            {/* Symptom Mapping Rule Management */}
            <div className="medical-card p-6 space-y-5">
              <div>
                <h3 className="text-base font-semibold text-[#1C1B19]">Quản lý bảng ánh xạ triệu chứng và chuyên khoa (AI Rules)</h3>
                <p className="text-xs text-[#6B6A65]">Cấu hình quy tắc tri thức nội bộ cho AI Symptom Checker Fallback</p>
              </div>

              {/* Form Input */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-[#F7F5F0] p-3 rounded-sm border border-[#E4E1D8]">
                <input
                  type="text"
                  placeholder="Từ khóa triệu chứng (vd: đau ngực)"
                  value={newRuleKeyword}
                  onChange={(e) => setNewRuleKeyword(e.target.value)}
                  className="bg-[#FFFFFF] border border-[#E4E1D8] rounded-sm px-3 py-1.5 text-xs text-[#1C1B19] focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Tag triệu chứng"
                  value={newRuleTag}
                  onChange={(e) => setNewRuleTag(e.target.value)}
                  className="bg-[#FFFFFF] border border-[#E4E1D8] rounded-sm px-3 py-1.5 text-xs text-[#1C1B19] focus:outline-none"
                />
                <select
                  value={newRuleDept}
                  onChange={(e) => setNewRuleDept(e.target.value)}
                  className="bg-[#FFFFFF] border border-[#E4E1D8] rounded-sm px-3 py-1.5 text-xs text-[#1C1B19] focus:outline-none"
                >
                  <option value="Tim mạch">Tim mạch</option>
                  <option value="Da liễu">Da liễu</option>
                  <option value="Nội tổng quát">Nội tổng quát</option>
                  <option value="Tai Mũi Họng">Tai Mũi Họng</option>
                  <option value="Nhi khoa">Nhi khoa</option>
                </select>
                <button
                  onClick={handleAddAdminRule}
                  className="btn-primary py-1.5 text-xs flex items-center justify-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm quy tắc</span>
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7F5F0] text-[#6B6A65] border-b border-[#E4E1D8]">
                    <tr>
                      <th className="p-2.5 font-semibold">Mã</th>
                      <th className="p-2.5 font-semibold">Từ khóa</th>
                      <th className="p-2.5 font-semibold">Tag</th>
                      <th className="p-2.5 font-semibold">Chuyên khoa đề xuất</th>
                      <th className="p-2.5 font-semibold">Mức độ rủi ro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E1D8] text-[#1C1B19]">
                    {symptomRules.map((r) => (
                      <tr key={r.id}>
                        <td className="p-2.5 font-mono text-[#6B6A65]">#{r.id}</td>
                        <td className="p-2.5 font-medium">{r.keyword}</td>
                        <td className="p-2.5">{r.tag}</td>
                        <td className="p-2.5 font-semibold text-[#1F6F5C]">{r.dept_name || 'Tim mạch'}</td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded-sm font-medium ${
                            r.severity === 'EMERGENCY' ? 'bg-[#F6DEDC] text-[#C1443C]' : 'bg-[#FBEACB] text-[#B45309]'
                          }`}>
                            {r.severity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER SECTION */}
      <footer className="mt-20 bg-[#FFFFFF] border-t border-[#E4E1D8] px-4 lg:px-8 py-10 text-left text-xs text-[#6B6A65]">
        <div className="max-w-[1080px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-[#1F6F5C] font-bold text-base">
              <Stethoscope className="w-5 h-5" />
              <span>Sức Khoẻ Thông Minh</span>
            </div>
            <p className="text-xs text-[#6B6A65] leading-relaxed">
              Nền tảng đặt lịch khám bệnh trực tuyến kết hợp trợ lý AI hỗ trợ chẩn đoán triệu chứng ban đầu.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-[#1C1B19] text-sm">Chuyên khoa nổi bật</h4>
            <ul className="space-y-1 text-xs">
              <li>• Khoa Tim mạch</li>
              <li>• Khoa Da liễu</li>
              <li>• Khoa Nội tổng quát</li>
              <li>• Khoa Tai Mũi Họng</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-[#1C1B19] text-sm">Liên hệ & Hỗ trợ</h4>
            <p>Hotline CSKH: 1900 1234</p>
            <p>Khám Cấp cứu: Gọi 115</p>
            <p>Địa chỉ: Tòa nhà Y Tế Quốc Tế, Hà Nội</p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-[#1C1B19] text-sm">Miễn trừ trách nhiệm y tế</h4>
            <p className="text-[11px] text-[#6B6A65] leading-relaxed">
              Kết quả phân tích từ AI chỉ mang tính chất tham khảo sơ bộ và hỗ trợ định hướng phòng khám. Không thay thế cho chẩn đoán y khoa chính thức từ bác sĩ chuyên khoa.
            </p>
          </div>
        </div>

        <div className="max-w-[1080px] mx-auto pt-8 mt-8 border-t border-[#E4E1D8] text-center text-xs text-[#6B6A65]">
          © 2026 SmartCare Health Management System. All rights reserved.
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
        }}
      />
    </div>
  );
}
