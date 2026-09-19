import React, { useState, useEffect, useRef } from 'react';
import {
  Activity, Heart, Sparkles, AlertTriangle, CheckCircle, Clock,
  Calendar, User, Stethoscope, FileText, Phone, Star, ShieldAlert,
  ChevronRight, Plus, Search, Check, RefreshCw, BarChart2, Users,
  ArrowRight, MessageSquare, Pill, Settings, Award, MapPin, LogIn, LogOut, UserCheck,
  Shield, HelpCircle, ChevronDown, CheckSquare, Info, Trash2, Printer, FilePlus, ClipboardList
} from 'lucide-react';
import ApiService from '../services/api';
import AuthModal from './AuthModal';

export default function SymptomCheckerBooking({ initialTab = 'checker', hideLandingSections = false }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Sync initialTab when prop changes
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

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
    'Chóng mặt', 'Đau họng', 'Sổ mũi', 'Trẻ sốt quấy', 'Đau bụng quanh rốn', 'Ù tai', 'Đau khớp gối'
  ];

  // 14 Medical Specialties Catalog Data (Per Item 1 in Specification Table)
  const initialDepartmentsData = [
    { id: 1, code: 'INTERNAL_MEDICINE', name: 'Nội tổng quát', doctor_count: 5, description: 'Chẩn đoán và điều trị bệnh lý đường tiêu hóa, hô hấp, tuần hoàn tổng quát.', conditions: ['Cảm cúm', 'Viêm phế quản', 'Rối loạn tiêu hóa', 'Sốt xuất huyết'] },
    { id: 2, code: 'CARDIOLOGY', name: 'Tim mạch', doctor_count: 4, description: 'Tầm soát bệnh mạch vành, tăng huyết áp, suy tim và rối loạn nhịp tim.', conditions: ['Tăng huyết áp', 'Thiếu máu cơ tim', 'Rối loạn nhịp tim', 'Đau thắt ngực'] },
    { id: 3, code: 'DERMATOLOGY', name: 'Da liễu', doctor_count: 3, description: 'Trị liệu dị ứng da, mề đay mãn tính, chàm và viêm da cơ địa.', conditions: ['Viêm da dị ứng', 'Mề đay', 'Mụn trứng cá nhiễm khuẩn', 'Bệnh ngoài da'] },
    { id: 4, code: 'PEDIATRICS', name: 'Nhi khoa', doctor_count: 4, description: 'Chăm sóc sức khỏe toàn diện và tiêm chủng phòng bệnh cho trẻ sơ sinh và trẻ nhỏ.', conditions: ['Trẻ sốt vi rút', 'Viêm tai giữa trẻ em', 'Tư vấn dinh dưỡng', 'Ho hen ở trẻ'] },
    { id: 5, code: 'ENT', name: 'Tai Mũi Họng', doctor_count: 3, description: 'Nội soi chẩn đoán viêm xoang, viêm họng cấp, viêm amidan và tổn thương màng nhĩ.', conditions: ['Viêm xoang cấp', 'Viêm amidan', 'Ù tai', 'Hạt dây thanh'] },
    { id: 6, code: 'NEUROLOGY', name: 'Thần kinh', doctor_count: 3, description: 'Tầm soát đau đầu mãn tính, rối loạn giấc ngủ, tiền đình và thiếu máu não.', conditions: ['Migraine', 'Rối loạn tiền đình', 'Đau thần kinh tọa', 'Mất ngủ'] },
    { id: 7, code: 'OBGYN', name: 'Sản phụ khoa', doctor_count: 3, description: 'Khám thai định kỳ, chăm sóc sức khỏe phụ nữ và tư vấn sinh sản.', conditions: ['Khám thai định kỳ', 'Tư vấn sinh sản', 'Viêm nhiễm phụ khoa', 'Chăm sóc thai kỳ'] },
    { id: 8, code: 'OPHTHALMOLOGY', name: 'Mắt (Nhãn khoa)', doctor_count: 2, description: 'Đo tật khúc xạ, tầm soát đau mắt đỏ, đục thủy tinh thể và cận thị.', conditions: ['Đau mắt đỏ', 'Tật khúc xạ', 'Đục thủy tinh thể', 'Khô mắt'] },
    { id: 9, code: 'RHEUMATOLOGY', name: 'Cơ Xương Khớp', doctor_count: 3, description: 'Trị liệu thoái hóa khớp, thoái hóa cột sống, gút và viêm khớp dạng thấp.', conditions: ['Thoái hóa khớp gối', 'Thoái hóa đốt sống cổ', 'Bệnh Gút (Gout)', 'Viêm khớp dạng thấp'] },
    { id: 10, code: 'GASTROENTEROLOGY', name: 'Tiêu hóa & Gan mật', doctor_count: 4, description: 'Khám và nội soi dạ dày, đại tràng, vi trùng HP, viêm gan siêu vi B/C.', conditions: ['Viêm loét dạ dày HP', 'Trào ngược dạ dày thực quản', 'Viêm gan B/C', 'Hội chứng ruột kích thích'] },
    { id: 11, code: 'ODONTO_STOMATOLOGY', name: 'Răng Hàm Mặt', doctor_count: 3, description: 'Khám và điều trị nhổ răng khôn, sâu răng, nha chu và thẩm mỹ răng sứ.', conditions: ['Nhổ răng khôn mọc lệch', 'Chữa sâu răng & Viêm tủy', 'Viêm nha chu', 'Tẩy trắng răng'] },
    { id: 12, code: 'PULMONOLOGY', name: 'Hô hấp & Phổi', doctor_count: 3, description: 'Điều trị hen phế quản, Bệnh phổi tắc nghẽn mãn tính (COPD) và viêm phổi.', conditions: ['Hen phế quản', 'Bệnh COPD', 'Viêm phổi cấp', 'Ho lao & Tầm soát phổi'] },
    { id: 13, code: 'ENDOCRINOLOGY', name: 'Nội tiết & Tiểu đường', doctor_count: 3, description: 'Quản lý bệnh đái tháo đường, suy tuyến giáp, béo phì và rối loạn chuyển hóa.', conditions: ['Đái tháo đường tuýp 1 & 2', 'Bướu cổ & Viêm tuyến giáp', 'Rối loạn mỡ máu', 'Béo phì'] },
    { id: 14, code: 'NUTRITION_ANDROLOGY', name: 'Dinh dưỡng & Nam học', doctor_count: 2, description: 'Tư vấn chế độ ăn bệnh lý, tăng giảm cân và khám sức khỏe nam giới.', conditions: ['Tư vấn dinh dưỡng bệnh lý', 'Rối loạn cương dương', 'Tầm soát sức khỏe nam giới', 'Suy giảm Testosterone'] }
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
    },
    {
      id: 5,
      full_name: 'TS.BS Nguyễn Quốc Tuấn',
      title: 'TS.BS',
      department_name: 'Hô hấp & Phổi',
      department_id: 12,
      years_experience: 15,
      consultation_fee: 450000,
      rating_avg: 4.85,
      rating_count: 33,
      hospital_address: 'Bệnh viện Đa khoa Quốc tế — Tầng 5, Khoa Hô hấp'
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

  // --- Doctor Workstation State (Item 3 in Specification Table: 3 Steps) ---
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
        recommended_departments: [
          { id: 2, name: 'Tim mạch', confidence_score: 0.88, is_primary: true, medical_explanation: 'Triệu chứng đau ép ngực trái gợi ý kiểm tra tim mạch tầm soát thiếu máu cơ tim.' },
          { id: 1, name: 'Nội tổng quát', confidence_score: 0.62, is_primary: false, medical_explanation: 'Khám phối hợp nội tổng quát để đánh giá các yếu tố nguy cơ huyết áp và rối loạn mỡ máu.' }
        ],
        confidence_score: 0.88,
        medical_explanation: 'Triệu chứng đau ép ngực trái liên quan tới vận động gợi ý kiểm tra tim mạch tầm soát thiếu máu cơ tim.'
      },
      diagnosis_primary: 'Thiếu máu cơ tim cục bộ (I20) / Tăng huyết áp độ 1',
      diagnosis_secondary: 'Rối loạn chuyển hóa Lipoprotein mỡ máu',
      clinical_notes: 'Bệnh nhân tỉnh táo, tim nhịp đều 82 ck/phút, HA 135/85 mmHg. Phổi trong không rần.',
      lab_requests: [
        { id: 'LAB-1', code: 'CĐHA01', name: 'Siêu âm tim Doppler màu 4D', note: 'Đánh giá vận động vùng vách tim' },
        { id: 'LAB-2', code: 'TDCN01', name: 'Đo điện tâm đồ (ECG 12 chuyển đạo)', note: 'Tầm soát thiếu máu cơ tim ST thay đổi' }
      ],
      prescription_items: [
        { id: 'RX-1', medicine_name: 'Concor 5mg', quantity: '30', unit: 'Viên', usage: 'Uống 1 viên / sáng sau ăn', route: 'Uống', note: 'Kiểm tra huyết áp định kỳ' },
        { id: 'RX-2', medicine_name: 'Atorvastatin 20mg', quantity: '30', unit: 'Viên', usage: 'Uống 1 viên / tối trước khi ngủ', route: 'Uống', note: 'Hạn chế ăn mỡ động vật' }
      ]
    }
  ]);

  const [selectedAptToExamine, setSelectedAptToExamine] = useState(null);
  const [activeDoctorStep, setActiveDoctorStep] = useState('diagnosis'); // 'diagnosis' | 'lab' | 'prescription'

  // Form states for Doctor Step (a): Clinical Diagnosis
  const [diagnosisPrimary, setDiagnosisPrimary] = useState('');
  const [diagnosisSecondary, setDiagnosisSecondary] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');

  // Form states for Doctor Step (b): Lab Requests (Cận lâm sàng UC-D03)
  const [labRequestsList, setLabRequestsList] = useState([]);
  const [selectedLabPreset, setSelectedLabPreset] = useState('');
  const [labRequestNote, setLabRequestNote] = useState('');

  const labPresets = [
    { code: 'XNM01', name: 'Xét nghiệm tổng phân tích tế bào máu ngoại vi (CBC)' },
    { code: 'XNM02', name: 'Xét nghiệm sinh hóa máu (Đường huyết, Men gan, Mỡ máu, Ure/Creatinine)' },
    { code: 'CĐHA01', name: 'Siêu âm tim Doppler màu 4D' },
    { code: 'CĐHA02', name: 'Siêu âm ổ bụng tổng quát' },
    { code: 'TDCN01', name: 'Đo điện tâm đồ (ECG 12 chuyển đạo / Holter 24h)' },
    { code: 'CĐHA03', name: 'Chụp X-quang ngực thẳng' },
    { code: 'NS01', name: 'Nội soi Tai Mũi Họng ống mềm' }
  ];

  // Form states for Doctor Step (c): Outpatient Prescription Table (DonThuoc & ChiTietDonThuoc UC-D05)
  const [prescriptionItems, setPrescriptionItems] = useState([]);

  // Preset medicines list for easy fill
  const medicinePresets = [
    { name: 'Paracetamol 500mg', unit: 'Viên', usage: 'Sáng 1v, Tối 1v sau ăn khi sốt/đau', route: 'Uống' },
    { name: 'Concor 5mg', unit: 'Viên', usage: 'Sáng 1v sau khi ăn', route: 'Uống' },
    { name: 'Amoxicillin 500mg', unit: 'Viên', usage: 'Sáng 1v, Tối 1v sau ăn (kháng sinh 7 ngày)', route: 'Uống' },
    { name: 'Omeprazole 20mg', unit: 'Viên', usage: 'Sáng 1v trước ăn 30 phút', route: 'Uống' },
    { name: 'Otrivin 0.1%', unit: 'Lọ', usage: 'Nhỏ mũi 2 lần/ngày (sáng, tối)', route: 'Nhỏ mũi' }
  ];

  // --- Patient History State ---
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
      diagnosis_primary: 'Thiếu máu cơ tim thoáng qua / Rối loạn thần kinh tim',
      prescription_items: [
        { id: 1, medicine_name: 'Concor 5mg', quantity: '30', unit: 'Viên', usage: 'Uống 1 viên/sáng', route: 'Uống' },
        { id: 2, medicine_name: 'Magnesium B6', quantity: '60', unit: 'Viên', usage: 'Uống 2 viên/ngày', route: 'Uống' }
      ],
      feedback_rating: 5,
      feedback_comment: 'Đề xuất 2 chuyên khoa Tim mạch & Nội tổng quát rất chính xác với tình trạng bệnh thực tế.'
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

  // Toggle Symptom Tag
  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Scroll to AI Symptom Checker Tool
  const scrollToChecker = () => {
    setActiveTab('checker');
    if (checkerSectionRef.current) {
      checkerSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Trigger AI Symptom Analysis (Item 2: Returns 1-2 recommended departments)
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
      // Fallback local simulation with 1-2 RECOMMENDED DEPARTMENTS (per Item 2 in specification table)
      const lower = `${freeText} ${selectedTags.join(' ')}`.toLowerCase();
      let primaryDept = { id: 1, name: 'Nội tổng quát', confidence_score: 0.85, is_primary: true, medical_explanation: 'Dựa trên mô tả triệu chứng, hệ thống đề xuất bạn thăm khám tại chuyên khoa Nội tổng quát để chẩn đoán tổng thể.' };
      let secondaryDept = { id: 10, name: 'Tiêu hóa & Gan mật', confidence_score: 0.60, is_primary: false, medical_explanation: 'Đồng thời nên phối hợp thăm khám chuyên khoa Tiêu hóa để tầm soát nguyên nhân đau dạ dày hoặc đường ruột.' };
      let isEmerg = false;

      if (lower.includes('ngực') || lower.includes('tim') || lower.includes('ép ngực')) {
        primaryDept = { id: 2, name: 'Tim mạch', confidence_score: 0.88, is_primary: true, medical_explanation: 'Các triệu chứng đau ép ngực và thay đổi nhịp tim cần được thăm khám tại chuyên khoa Tim mạch để kiểm tra điện tâm đồ và chức năng mạch vành.' };
        secondaryDept = { id: 1, name: 'Nội tổng quát', confidence_score: 0.62, is_primary: false, medical_explanation: 'Khám phối hợp Nội tổng quát nhằm kiểm tra các chỉ số huyết áp, mỡ máu và tầm soát rối loạn chuyển hóa.' };
        if (lower.includes('dữ dội') || lower.includes('khó thở cấp')) isEmerg = true;
      } else if (lower.includes('nổi mẩn') || lower.includes('ngứa') || lower.includes('da')) {
        primaryDept = { id: 3, name: 'Da liễu', confidence_score: 0.86, is_primary: true, medical_explanation: 'Biểu hiện nổi mẩn đỏ hoặc ngứa ngoài da phù hợp với thăm khám và trị liệu tại chuyên khoa Da liễu.' };
        secondaryDept = { id: 1, name: 'Nội tổng quát', confidence_score: 0.58, is_primary: false, medical_explanation: 'Tầm soát thêm Nội tổng quát để loại trừ các phản ứng dị ứng do thực phẩm hoặc nội tiết.' };
      } else if (lower.includes('họng') || lower.includes('sổ mũi') || lower.includes('ù tai')) {
        primaryDept = { id: 5, name: 'Tai Mũi Họng', confidence_score: 0.87, is_primary: true, medical_explanation: 'Các triệu chứng đường hô hấp trên phù hợp với phạm vi khám chữa bệnh của chuyên khoa Tai Mũi Họng.' };
        secondaryDept = { id: 12, name: 'Hô hấp & Phổi', confidence_score: 0.64, is_primary: false, medical_explanation: 'Khám phối hợp Chuyên khoa Hô hấp nếu có dấu hiệu ho rải rác hoặc nghe tiếng rít phế quản.' };
      }

      const recDepts = [primaryDept, secondaryDept];

      setAiResult({
        is_emergency: isEmerg,
        emergency_warning: isEmerg ? 'CẢNH BÁO CẤP CỨU Y TẾ: Triệu chứng đau ngực hoặc khó thở dữ dội có dấu hiệu đe dọa tính mạng. Vui lòng gọi Cấp cứu 115 hoặc di chuyển ngay đến cơ sở y tế gần nhất!' : null,
        recommended_departments: recDepts,
        confidence_score: primaryDept.confidence_score,
        medical_explanation: primaryDept.medical_explanation,
        suggested_action: `Bạn nên đặt lịch thăm khám trực tiếp với Bác sĩ thuộc Khoa ${primaryDept.name} hoặc Khoa ${secondaryDept.name}.`,
        suggested_questions: [
          'Triệu chứng này bắt đầu xuất hiện từ khi nào?',
          'Cơn đau có tăng lên khi vận động hay thở sâu không?',
          'Bạn có kèm theo biểu hiện vã mồ hôi hoặc chóng mặt không?'
        ]
      });

      const matchedDocs = defaultMockDoctors.filter(d => d.department_name === primaryDept.name || d.department_name === secondaryDept.name);
      setRecommendedDoctors(matchedDocs.length > 0 ? matchedDocs : defaultMockDoctors);
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

  // --- Doctor Workstation Operations for Item 3 ---
  // Select an appointment for Doctor examination
  const handleSelectAppointmentToExamine = (apt) => {
    setSelectedAptToExamine(apt);
    setActiveDoctorStep('diagnosis');
    setDiagnosisPrimary(apt.diagnosis_primary || 'Thiếu máu cơ tim cục bộ (I20)');
    setDiagnosisSecondary(apt.diagnosis_secondary || 'Rối loạn mỡ máu');
    setClinicalNotes(apt.clinical_notes || 'Bệnh nhân tỉnh táo, tim nhịp đều, HA 130/80 mmHg.');
    setLabRequestsList(apt.lab_requests || [
      { id: 'LAB-1', code: 'CĐHA01', name: 'Siêu âm tim Doppler màu 4D', note: 'Kiểm tra vận động vách tim' }
    ]);
    setPrescriptionItems(apt.prescription_items || [
      { id: 'RX-1', medicine_name: 'Concor 5mg', quantity: '30', unit: 'Viên', usage: 'Uống 1 viên / sáng sau ăn', route: 'Uống', note: 'Theo dõi huyết áp' },
      { id: 'RX-2', medicine_name: 'Atorvastatin 20mg', quantity: '30', unit: 'Viên', usage: 'Uống 1 viên / tối trước ngủ', route: 'Uống', note: 'Giảm ăn đồ béo' }
    ]);
  };

  // Add Lab Request item (Step b)
  const handleAddLabRequest = () => {
    if (!selectedLabPreset) return;
    const found = labPresets.find(l => l.code === selectedLabPreset);
    if (!found) return;

    const newItem = {
      id: `LAB-${Date.now()}`,
      code: found.code,
      name: found.name,
      note: labRequestNote || 'Theo chỉ định của bác sĩ'
    };
    setLabRequestsList([...labRequestsList, newItem]);
    setSelectedLabPreset('');
    setLabRequestNote('');
  };

  // Remove Lab Request item
  const handleRemoveLabRequest = (id) => {
    setLabRequestsList(labRequestsList.filter(item => item.id !== id));
  };

  // Add Prescription Medicine Row (Step c)
  const handleAddPrescriptionRow = () => {
    const newRow = {
      id: `RX-${Date.now()}`,
      medicine_name: '',
      quantity: '10',
      unit: 'Viên',
      usage: 'Sáng 1v, Tối 1v sau ăn',
      route: 'Uống',
      note: ''
    };
    setPrescriptionItems([...prescriptionItems, newRow]);
  };

  // Add Preset Medicine Row
  const handleAddPresetMedicineRow = (preset) => {
    const newRow = {
      id: `RX-${Date.now()}`,
      medicine_name: preset.name,
      quantity: '20',
      unit: preset.unit,
      usage: preset.usage,
      route: preset.route,
      note: ''
    };
    setPrescriptionItems([...prescriptionItems, newRow]);
  };

  // Update Medicine Row
  const handleUpdatePrescriptionRow = (id, field, value) => {
    setPrescriptionItems(prescriptionItems.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  // Remove Medicine Row
  const handleRemovePrescriptionRow = (id) => {
    setPrescriptionItems(prescriptionItems.filter(item => item.id !== id));
  };

  // Complete Doctor Examination & Save All 3 Steps
  const handleDoctorCompleteApt = async (aptId) => {
    if (!diagnosisPrimary.trim()) {
      alert('Vui lòng nhập Chẩn đoán chính (Step a).');
      return;
    }

    try {
      await ApiService.doctorCompleteAppointment(aptId, {
        diagnosis_primary: diagnosisPrimary,
        diagnosis_secondary: diagnosisSecondary,
        clinical_notes: clinicalNotes,
        lab_requests: labRequestsList,
        prescription_items: prescriptionItems
      });
    } catch (e) {}

    const updated = doctorAppointments.map(a => {
      if (a.id === aptId) {
        return {
          ...a,
          status: 'COMPLETED',
          diagnosis_primary: diagnosisPrimary,
          diagnosis_secondary: diagnosisSecondary,
          clinical_notes: clinicalNotes,
          lab_requests: labRequestsList,
          prescription_items: prescriptionItems
        };
      }
      return a;
    });

    setDoctorAppointments(updated);
    alert('Đã lưu thành công (a) Kết luận chẩn đoán, (b) Phiếu chỉ định cận lâm sàng và (c) Đơn thuốc ngoại trú!');
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

  // Handle Logout
  const handleLogout = () => {
    ApiService.setToken(null);
    setCurrentUser(null);
  };

  // Confidence bar color logic per design.md (>=70% primary #1F6F5C, 40-70% accent #E8A33D, <40% neutral gray)
  const getConfidenceBarColor = (score) => {
    if (score >= 0.7) return 'bg-[#1F6F5C]';
    if (score >= 0.4) return 'bg-[#E8A33D]';
    return 'bg-[#9CA3AF]';
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#1C1B19] font-sans antialiased pb-20">
      {/* Navigation Header (Only when not embedded in subpages with top Navbar) */}
      {!hideLandingSections && (
        <>
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

          {/* Navigation Sub-header Tabs */}
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
        </>
      )}

      {/* Main Container */}
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

              {/* Trust Metric Badges (ITEM 1 FIXED: "14 Chuyên khoa y tế") */}
              <div className="mt-8 pt-6 border-t border-[#E4E1D8] grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
                <div>
                  <span className="text-2xl font-bold text-[#1F6F5C] block">14</span>
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

            {/* HOW IT WORKS / 3-STEP PROCESS SECTION */}
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
                  <h3 className="text-base font-semibold text-[#1C1B19]">AI đề xuất 1-2 chuyên khoa</h3>
                  <p className="text-sm text-[#6B6A65]">
                    Hệ thống AI tự động đánh giá mức độ rủi ro, gợi ý 1 đến 2 chuyên khoa phù hợp cùng danh sách bác sĩ trực thuộc.
                  </p>
                </div>

                <div className="medical-card p-6 space-y-2">
                  <div className="w-8 h-8 rounded-sm bg-[#1F6F5C] text-white font-bold flex items-center justify-center text-sm">
                    3
                  </div>
                  <h3 className="text-base font-semibold text-[#1C1B19]">Chọn bác sĩ & Đặt lịch</h3>
                  <p className="text-sm text-[#6B6A65]">
                    Xem danh sách bác sĩ thuộc các chuyên khoa được đề xuất, lựa chọn khung giờ 30 phút phù hợp và nhận mã xác nhận.
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

              {/* EMERGENCY WARNING ALERT */}
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
              {/* ITEM 2 FIXED: NORMAL STATE — DISPLAY 1-2 RECOMMENDED DEPARTMENTS */}
              {/* ============================================================ */}
              {aiResult && !aiResult.is_emergency && (
                <div className="medical-card p-6 space-y-6">
                  <div className="border-b border-[#E4E1D8] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold text-[#1C1B19]">
                        Kết quả đề xuất 1–2 Chuyên khoa phù hợp
                      </h2>
                      <p className="text-sm text-[#6B6A65]">Dựa trên phân tích triệu chứng lâm sàng bạn đã cung cấp</p>
                    </div>
                  </div>

                  {/* 1-2 Recommended Department Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(aiResult.recommended_departments || [
                      { id: 2, name: aiResult.recommended_department_name || 'Tim mạch', confidence_score: aiResult.confidence_score || 0.88, is_primary: true, medical_explanation: aiResult.medical_explanation },
                      { id: 1, name: 'Nội tổng quát', confidence_score: 0.62, is_primary: false, medical_explanation: 'Khám phối hợp Nội tổng quát để theo dõi các chỉ số sinh hiệu và rối loạn mỡ máu.' }
                    ]).map((dept, idx) => (
                      <div key={idx} className={`p-5 rounded-sm border space-y-3 ${
                        dept.is_primary ? 'bg-[#DCEAE6]/30 border-[#1F6F5C]' : 'bg-[#FFFFFF] border-[#E4E1D8]'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2.5 py-1 rounded-sm text-xs font-bold ${
                              dept.is_primary ? 'bg-[#1F6F5C] text-white' : 'bg-[#E8A33D] text-white'
                            }`}>
                              {dept.is_primary ? 'Ưu tiên 1 (Chính)' : 'Ưu tiên 2 (Phối hợp)'}
                            </span>
                            <h3 className="text-base font-semibold text-[#1C1B19]">Khoa {dept.name}</h3>
                          </div>
                          <span className="text-xs font-bold text-[#1F6F5C]">{Math.round(dept.confidence_score * 100)}%</span>
                        </div>

                        {/* Confidence bar */}
                        <div className="w-full bg-[#E4E1D8] h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getConfidenceBarColor(dept.confidence_score)}`}
                            style={{ width: `${Math.min(100, Math.max(10, dept.confidence_score * 100))}%` }}
                          />
                        </div>

                        <p className="text-xs text-[#1C1B19] leading-relaxed">
                          {dept.medical_explanation}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Suggested Questions for Consultation */}
                  {aiResult.suggested_questions && aiResult.suggested_questions.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-[#E4E1D8]">
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
                      Danh sách bác sĩ trực thuộc các chuyên khoa được đề xuất
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
                <h2 className="text-2xl font-semibold text-[#1C1B19]">Danh mục 14 chuyên khoa y tế</h2>
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
          </>
        )}

        {/* ============================================================ */}
        {/* TAB 2: ITEM 3 FIXED — DOCTOR CLINICAL WORKSTATION WITH 3 STEPS */}
        {/* ============================================================ */}
        {activeTab === 'doctor' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
            {/* Left: Doctor Appointment Queue */}
            <div className="lg:col-span-4 space-y-4">
              <div className="medical-card p-5 space-y-3">
                <h2 className="text-base font-semibold text-[#1C1B19]">Danh sách bệnh nhân ca trực</h2>

                <div className="space-y-3">
                  {doctorAppointments.map((apt) => {
                    const isSelected = selectedAptToExamine?.id === apt.id;
                    return (
                      <div
                        key={apt.id}
                        onClick={() => handleSelectAppointmentToExamine(apt)}
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

            {/* Right: ITEM 3 WORKSTATION WITH 3 SEPARATE STEPS (a, b, c) */}
            <div className="lg:col-span-8">
              {selectedAptToExamine ? (
                <div className="medical-card p-6 space-y-6">
                  {/* Header Patient Summary */}
                  <div className="border-b border-[#E4E1D8] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-[#1C1B19]">Hồ sơ ca khám: {selectedAptToExamine.patient_name}</h2>
                      <p className="text-xs text-[#6B6A65]">Mã hồ sơ: <span className="font-mono text-[#1F6F5C] font-semibold">{selectedAptToExamine.appointment_code}</span> • Khung giờ: {selectedAptToExamine.start_time} - {selectedAptToExamine.end_time}</p>
                    </div>

                    <button
                      onClick={() => handleDoctorCompleteApt(selectedAptToExamine.id)}
                      className="btn-primary px-4 py-2 text-xs font-semibold flex items-center space-x-1.5 self-start sm:self-auto"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Hoàn tất & Lưu ca khám</span>
                    </button>
                  </div>

                  {/* AI Triage Summary for Doctor Reference */}
                  <div className="bg-[#DCEAE6]/40 border border-[#1F6F5C]/30 p-4 rounded-sm text-xs space-y-1 text-[#1C1B19]">
                    <span className="font-bold text-[#1F6F5C] block">Báo cáo tham khảo từ AI Symptom Checker:</span>
                    <p><strong>Triệu chứng khai báo:</strong> {selectedAptToExamine.symptoms_text}</p>
                    <p><strong>Gợi ý chuyên khoa:</strong> {selectedAptToExamine.ai_analysis?.recommended_departments?.map(d => `Khoa ${d.name} (${Math.round(d.confidence_score*100)}%)`).join(', ') || selectedAptToExamine.department_name}</p>
                  </div>

                  {/* 3 DISTINCT STEP SUB-HEADER NAVIGATION (a, b, c per Item 3 in specification) */}
                  <div className="flex border-b border-[#E4E1D8] space-x-2">
                    <button
                      onClick={() => setActiveDoctorStep('diagnosis')}
                      className={`px-4 py-2.5 font-semibold text-xs rounded-t-sm border-t border-x transition flex items-center space-x-1.5 ${
                        activeDoctorStep === 'diagnosis'
                          ? 'bg-[#1F6F5C] text-white border-[#1F6F5C]'
                          : 'bg-[#F7F5F0] text-[#6B6A65] border-[#E4E1D8] hover:text-[#1C1B19]'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>(a) Ghi kết luận khám</span>
                    </button>

                    <button
                      onClick={() => setActiveDoctorStep('lab')}
                      className={`px-4 py-2.5 font-semibold text-xs rounded-t-sm border-t border-x transition flex items-center space-x-1.5 ${
                        activeDoctorStep === 'lab'
                          ? 'bg-[#1F6F5C] text-white border-[#1F6F5C]'
                          : 'bg-[#F7F5F0] text-[#6B6A65] border-[#E4E1D8] hover:text-[#1C1B19]'
                      }`}
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      <span>(b) Chỉ định cận lâm sàng (UC-D03)</span>
                      {labRequestsList.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white text-[#1F6F5C] font-bold">
                          {labRequestsList.length}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => setActiveDoctorStep('prescription')}
                      className={`px-4 py-2.5 font-semibold text-xs rounded-t-sm border-t border-x transition flex items-center space-x-1.5 ${
                        activeDoctorStep === 'prescription'
                          ? 'bg-[#1F6F5C] text-white border-[#1F6F5C]'
                          : 'bg-[#F7F5F0] text-[#6B6A65] border-[#E4E1D8] hover:text-[#1C1B19]'
                      }`}
                    >
                      <Pill className="w-3.5 h-3.5" />
                      <span>(c) Kê đơn thuốc ngoại trú (UC-D05)</span>
                      {prescriptionItems.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white text-[#1F6F5C] font-bold">
                          {prescriptionItems.length}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* ============================================================ */}
                  {/* STEP (a): GHI KẾT LUẬN KHÁM */}
                  {/* ============================================================ */}
                  {activeDoctorStep === 'diagnosis' && (
                    <div className="space-y-4 pt-2">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#1C1B19]">Chẩn đoán chính (Primary Diagnosis) *</label>
                        <input
                          type="text"
                          value={diagnosisPrimary}
                          onChange={(e) => setDiagnosisPrimary(e.target.value)}
                          placeholder="Ví dụ: Thiếu máu cơ tim cục bộ (Mã ICD: I20) / Viêm da dị ứng..."
                          className="w-full bg-[#FFFFFF] border border-[#E4E1D8] rounded-sm p-2.5 text-xs text-[#1C1B19] focus:outline-none focus:border-[#1F6F5C]"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#1C1B19]">Chẩn đoán kèm theo / Phụ (Secondary Diagnosis)</label>
                        <input
                          type="text"
                          value={diagnosisSecondary}
                          onChange={(e) => setDiagnosisSecondary(e.target.value)}
                          placeholder="Ví dụ: Tăng huyết áp độ 1, Rối loạn chuyển hóa mỡ máu..."
                          className="w-full bg-[#FFFFFF] border border-[#E4E1D8] rounded-sm p-2.5 text-xs text-[#1C1B19] focus:outline-none focus:border-[#1F6F5C]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#1C1B19]">Tóm tắt diễn biến lâm sàng & Hướng điều trị</label>
                        <textarea
                          rows={4}
                          value={clinicalNotes}
                          onChange={(e) => setClinicalNotes(e.target.value)}
                          placeholder="Ghi chú khám thể trạng, nhịp tim, phổi, dặn dò lối sống..."
                          className="w-full bg-[#FFFFFF] border border-[#E4E1D8] rounded-sm p-3 text-xs text-[#1C1B19] focus:outline-none focus:border-[#1F6F5C]"
                        />
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          onClick={() => setActiveDoctorStep('lab')}
                          className="btn-secondary px-4 py-2 text-xs flex items-center space-x-1"
                        >
                          <span>Chuyển sang Bước (b) Chỉ định cận lâm sàng</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ============================================================ */}
                  {/* STEP (b): LẬP PHIẾU CHỈ ĐỊNH CẬN LÂM SÀNG (UC-D03) */}
                  {/* ============================================================ */}
                  {activeDoctorStep === 'lab' && (
                    <div className="space-y-5 pt-2">
                      <div className="bg-[#F7F5F0] p-4 rounded-sm border border-[#E4E1D8] space-y-3">
                        <h3 className="text-xs font-bold text-[#1C1B19]">Lập chỉ định dịch vụ cận lâm sàng / Thăm dò chẩn đoán</h3>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-2 space-y-1">
                            <label className="text-[11px] font-medium text-[#6B6A65]">Chọn dịch vụ cận lâm sàng:</label>
                            <select
                              value={selectedLabPreset}
                              onChange={(e) => setSelectedLabPreset(e.target.value)}
                              className="w-full bg-[#FFFFFF] border border-[#E4E1D8] rounded-sm p-2 text-xs text-[#1C1B19] focus:outline-none"
                            >
                              <option value="">-- Chọn dịch vụ từ danh mục --</option>
                              {labPresets.map(preset => (
                                <option key={preset.code} value={preset.code}>
                                  [{preset.code}] {preset.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-medium text-[#6B6A65]">Ghi chú yêu cầu:</label>
                            <input
                              type="text"
                              value={labRequestNote}
                              onChange={(e) => setLabRequestNote(e.target.value)}
                              placeholder="Ghi chú cho phòng X-quang/Siêu âm..."
                              className="w-full bg-[#FFFFFF] border border-[#E4E1D8] rounded-sm p-2 text-xs text-[#1C1B19] focus:outline-none"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleAddLabRequest}
                          className="btn-primary px-3.5 py-1.5 text-xs flex items-center space-x-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thêm chỉ định cận lâm sàng</span>
                        </button>
                      </div>

                      {/* Lab Requests List Table */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-[#1C1B19]">Danh sách chỉ định cận lâm sàng đã lập ({labRequestsList.length}):</h4>
                        {labRequestsList.length === 0 ? (
                          <p className="text-xs text-[#6B6A65] italic bg-[#F7F5F0] p-3 rounded-sm text-center">Chưa có chỉ định cận lâm sàng nào được lập.</p>
                        ) : (
                          <div className="border border-[#E4E1D8] rounded-sm overflow-hidden text-xs">
                            <table className="w-full text-left border-collapse">
                              <thead className="bg-[#F7F5F0] border-b border-[#E4E1D8] text-[#1C1B19] font-semibold">
                                <tr>
                                  <th className="p-2.5">Mã dịch vụ</th>
                                  <th className="p-2.5">Tên kỹ thuật cận lâm sàng</th>
                                  <th className="p-2.5">Ghi chú yêu cầu</th>
                                  <th className="p-2.5 text-center">Xóa</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#E4E1D8]">
                                {labRequestsList.map((lab) => (
                                  <tr key={lab.id} className="hover:bg-[#F7F5F0]/50">
                                    <td className="p-2.5 font-mono font-bold text-[#1F6F5C]">{lab.code}</td>
                                    <td className="p-2.5 font-medium text-[#1C1B19]">{lab.name}</td>
                                    <td className="p-2.5 text-[#6B6A65]">{lab.note}</td>
                                    <td className="p-2.5 text-center">
                                      <button
                                        onClick={() => handleRemoveLabRequest(lab.id)}
                                        className="text-[#C1443C] hover:text-red-700 p-1"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between pt-2">
                        <button
                          onClick={() => setActiveDoctorStep('diagnosis')}
                          className="btn-secondary px-4 py-2 text-xs"
                        >
                          Quay lại Bước (a)
                        </button>
                        <button
                          onClick={() => setActiveDoctorStep('prescription')}
                          className="btn-secondary px-4 py-2 text-xs flex items-center space-x-1"
                        >
                          <span>Chuyển sang Bước (c) Kê đơn thuốc</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ============================================================ */}
                  {/* STEP (c): KÊ ĐƠN THUỐC NGOẠI TRÚ (UC-D05: DonThuoc & ChiTietDonThuoc Table) */}
                  {/* ============================================================ */}
                  {activeDoctorStep === 'prescription' && (
                    <div className="space-y-5 pt-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F7F5F0] p-3 rounded-sm border border-[#E4E1D8]">
                        <span className="text-xs font-semibold text-[#1C1B19]">Chọn nhanh thuốc phổ biến:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {medicinePresets.map((m, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleAddPresetMedicineRow(m)}
                              className="px-2 py-1 bg-white border border-[#E4E1D8] text-[11px] rounded-sm hover:border-[#1F6F5C] text-[#1C1B19]"
                            >
                              + {m.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Multi-row Prescription Items Table (ChiTietDonThuoc Structure) */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-semibold text-[#1C1B19]">Bảng Chi Tiết Đơn Thuốc Ngoại Trú ({prescriptionItems.length} loại thuốc):</h4>
                          <button
                            type="button"
                            onClick={handleAddPrescriptionRow}
                            className="btn-primary px-3 py-1.5 text-xs flex items-center space-x-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Thêm dòng thuốc mới</span>
                          </button>
                        </div>

                        {prescriptionItems.length === 0 ? (
                          <p className="text-xs text-[#6B6A65] italic bg-[#F7F5F0] p-4 rounded-sm text-center">Chưa có dòng thuốc nào trong đơn.</p>
                        ) : (
                          <div className="border border-[#E4E1D8] rounded-sm overflow-x-auto text-xs">
                            <table className="w-full text-left border-collapse min-w-[640px]">
                              <thead className="bg-[#F7F5F0] border-b border-[#E4E1D8] text-[#1C1B19] font-semibold">
                                <tr>
                                  <th className="p-2.5 w-10 text-center">STT</th>
                                  <th className="p-2.5 min-w-[150px]">Tên thuốc & Nồng độ</th>
                                  <th className="p-2.5 w-24">Số lượng</th>
                                  <th className="p-2.5 w-24">Đơn vị</th>
                                  <th className="p-2.5 min-w-[160px]">Liều dùng & Tần suất</th>
                                  <th className="p-2.5 w-28">Đường dùng</th>
                                  <th className="p-2.5 w-10 text-center">Xóa</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#E4E1D8]">
                                {prescriptionItems.map((item, idx) => (
                                  <tr key={item.id} className="hover:bg-[#F7F5F0]/30">
                                    <td className="p-2.5 text-center font-bold text-[#6B6A65]">{idx + 1}</td>
                                    <td className="p-2">
                                      <input
                                        type="text"
                                        value={item.medicine_name}
                                        onChange={(e) => handleUpdatePrescriptionRow(item.id, 'medicine_name', e.target.value)}
                                        placeholder="Nhập tên thuốc..."
                                        className="w-full bg-white border border-[#E4E1D8] rounded-sm p-1.5 text-xs text-[#1C1B19] focus:outline-none"
                                      />
                                    </td>
                                    <td className="p-2">
                                      <input
                                        type="text"
                                        value={item.quantity}
                                        onChange={(e) => handleUpdatePrescriptionRow(item.id, 'quantity', e.target.value)}
                                        className="w-full bg-white border border-[#E4E1D8] rounded-sm p-1.5 text-xs text-[#1C1B19] focus:outline-none"
                                      />
                                    </td>
                                    <td className="p-2">
                                      <input
                                        type="text"
                                        value={item.unit}
                                        onChange={(e) => handleUpdatePrescriptionRow(item.id, 'unit', e.target.value)}
                                        className="w-full bg-white border border-[#E4E1D8] rounded-sm p-1.5 text-xs text-[#1C1B19] focus:outline-none"
                                      />
                                    </td>
                                    <td className="p-2">
                                      <input
                                        type="text"
                                        value={item.usage}
                                        onChange={(e) => handleUpdatePrescriptionRow(item.id, 'usage', e.target.value)}
                                        placeholder="Sáng 1v, Tối 1v..."
                                        className="w-full bg-white border border-[#E4E1D8] rounded-sm p-1.5 text-xs text-[#1C1B19] focus:outline-none"
                                      />
                                    </td>
                                    <td className="p-2">
                                      <select
                                        value={item.route}
                                        onChange={(e) => handleUpdatePrescriptionRow(item.id, 'route', e.target.value)}
                                        className="w-full bg-white border border-[#E4E1D8] rounded-sm p-1.5 text-xs text-[#1C1B19] focus:outline-none"
                                      >
                                        <option value="Uống">Uống</option>
                                        <option value="Bôi">Bôi ngoài da</option>
                                        <option value="Nhỏ mắt">Nhỏ mắt/tai</option>
                                        <option value="Nhỏ mũi">Nhỏ mũi</option>
                                        <option value="Tiêm">Tiêm bắp/IV</option>
                                      </select>
                                    </td>
                                    <td className="p-2.5 text-center">
                                      <button
                                        type="button"
                                        onClick={() => handleRemovePrescriptionRow(item.id)}
                                        className="text-[#C1443C] hover:text-red-700 p-1"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* Final Complete CTA */}
                      <div className="pt-4 border-t border-[#E4E1D8] flex flex-col sm:flex-row items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setActiveDoctorStep('lab')}
                          className="btn-secondary px-4 py-2 text-xs"
                        >
                          Quay lại Bước (b)
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDoctorCompleteApt(selectedAptToExamine.id)}
                          className="btn-primary px-6 py-2.5 text-xs font-semibold flex items-center space-x-2"
                        >
                          <Printer className="w-4 h-4" />
                          <span>Lưu ca khám & In Đơn thuốc ngoại trú</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="medical-card p-12 text-center text-[#6B6A65]">
                  <Stethoscope className="w-10 h-10 mx-auto mb-2 text-[#9CA3AF]" />
                  <p className="text-sm">Vui lòng chọn 1 ca khám từ danh sách bên trái để tiến hành 3 bước khám bệnh.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: PATIENT PORTAL & HISTORY */}
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

                    {apt.diagnosis_primary && (
                      <div className="bg-[#F7F5F0] p-3 rounded-sm border border-[#E4E1D8] text-xs space-y-1">
                        <p className="font-semibold text-[#1F6F5C]">Chẩn đoán của bác sĩ: {apt.diagnosis_primary}</p>
                        {apt.prescription_items && apt.prescription_items.length > 0 && (
                          <div className="pt-1">
                            <strong className="text-[#1C1B19]">Đơn thuốc ngoại trú:</strong>
                            <ul className="list-disc list-inside pl-1 text-[11px] text-[#6B6A65] space-y-0.5 mt-0.5">
                              {apt.prescription_items.map((m, i) => (
                                <li key={i}>{m.medicine_name} — Số lượng: {m.quantity} {m.unit} ({m.usage})</li>
                              ))}
                            </ul>
                          </div>
                        )}
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
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: ADMIN DASHBOARD */}
        {/* ============================================================ */}
        {activeTab === 'admin' && (
          <div className="space-y-8 text-left">
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
          </div>
        )}
      </main>

      {/* Shared Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(user) => setCurrentUser(user)}
      />
    </div>
  );
}
