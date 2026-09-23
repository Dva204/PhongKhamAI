const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiService {
  static getToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  static setToken(token) {
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('access_token', token);
      } else {
        localStorage.removeItem('access_token');
      }
    }
  }

  static getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  static async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = { ...this.getHeaders(), ...options.headers };

    try {
      const response = await fetch(url, { ...options, headers });
      
      if (!response.ok) {
        let errorMsg = 'Đã có lỗi xảy ra từ máy chủ.';
        try {
          const errData = await response.json();
          errorMsg = errData.detail || errData.message || errorMsg;
        } catch (e) {}
        throw new Error(errorMsg);
      }

      const resJson = await response.json();
      // Handle ResponseEnvelope wrapper: return resJson.data if wrapped, else resJson
      if (resJson && typeof resJson === 'object' && 'success' in resJson && 'data' in resJson) {
        return resJson.data !== null && resJson.data !== undefined ? resJson.data : resJson;
      }
      return resJson;
    } catch (error) {
      console.warn(`API Request Warning [${endpoint}]:`, error.message);
      throw error;
    }
  }

  // --- Auth APIs (Package A) ---
  static async register(data) {
    // API: POST /api/v1/auth/register
    return await this.request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        ho_ten: data.full_name || data.ho_ten,
        email: data.email,
        so_dien_thoai: data.phone || data.so_dien_thoai,
        mat_khau: data.password || data.mat_khau,
        ngay_sinh: data.dob || data.ngay_sinh || null,
        gioi_tinh: data.gender || data.gioi_tinh || 'Khác'
      }),
    });
  }

  static async verifyOTP(email, code) {
    // API: POST /api/v1/auth/verify-otp
    const res = await this.request('/api/v1/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp_code: code }),
    });
    if (res?.access_token) this.setToken(res.access_token);
    return res;
  }

  static async loginPassword(email, password) {
    // API: POST /api/v1/auth/login
    const res = await this.request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, mat_khau: password }),
    });
    if (res?.access_token) this.setToken(res.access_token);
    return res;
  }

  static async getCurrentUser() {
    // API: GET /api/v1/auth/me
    return await this.request('/api/v1/auth/me');
  }

  // --- Medical Catalog APIs (Package D & E) ---
  static async getDepartments() {
    // API: GET /api/v1/medical/specialties
    return await this.request('/api/v1/medical/specialties');
  }

  static async getDoctors(specialtyId = null) {
    // API: GET /api/v1/medical/doctors?specialty_id=X
    const query = specialtyId ? `?specialty_id=${specialtyId}` : '';
    return await this.request(`/api/v1/medical/doctors${query}`);
  }

  static async getMedicalServices() {
    // API: GET /api/v1/medical/services
    return await this.request('/api/v1/medical/services');
  }

  // --- AI Symptom Checker APIs (Package C) ---
  static async analyzeSymptoms(symptomData) {
    // API: POST /api/v1/ai/analyze-symptoms
    return await this.request('/api/v1/ai/analyze-symptoms', {
      method: 'POST',
      body: JSON.stringify({
        trieu_chung: symptomData.trieu_chung || symptomData.free_text || symptomData.symptom_tags?.join(', '),
        tuoi: symptomData.tuoi || symptomData.patient_age || 30,
        gioi_tinh: symptomData.gioi_tinh || symptomData.patient_gender || 'Nam'
      }),
    });
  }

  // --- Appointment Booking & Slots APIs (Package B) ---
  static async getDoctorAvailableSlots(doctorId, dateStr) {
    // API: GET /api/v1/appointments/doctors/{doctor_id}/slots?query_date=YYYY-MM-DD
    return await this.request(`/api/v1/appointments/doctors/${doctorId}/slots?query_date=${dateStr}`);
  }

  static async createAppointment(bookingData) {
    // API: POST /api/v1/appointments
    return await this.request('/api/v1/appointments', {
      method: 'POST',
      body: JSON.stringify({
        bac_si_id: bookingData.bac_si_id || bookingData.doctor_id,
        ngay_kham: bookingData.ngay_kham || bookingData.appointment_date,
        gio_kham: bookingData.gio_kham || bookingData.start_time || '08:00:00',
        ly_do_kham: bookingData.ly_do_kham || bookingData.notes || 'Khám sức khỏe',
        trieu_chung_ban_dau: bookingData.trieu_chung_ban_dau || bookingData.symptoms_text || ''
      }),
    });
  }

  static async getPatientHistory() {
    // API: GET /api/v1/appointments/my-appointments
    return await this.request('/api/v1/appointments/my-appointments');
  }

  static async cancelAppointment(appointmentId, reason) {
    // API: POST /api/v1/appointments/{appointment_id}/cancel
    return await this.request(`/api/v1/appointments/${appointmentId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ ly_do_huy: reason }),
    });
  }

  // --- Doctor Workstation APIs ---
  static async getDoctorShiftAppointments(dateStr = null) {
    const query = dateStr ? `?date_str=${dateStr}` : '';
    return await this.request(`/api/v1/appointments/doctor-shift${query}`);
  }

  static async doctorCompleteAppointment(aptId, outcomeData) {
    return await this.request(`/api/v1/appointments/${aptId}/complete`, {
      method: 'PUT',
      body: JSON.stringify(outcomeData),
    });
  }

  // --- Admin Portal APIs ---
  static async getAdminDashboardStats() {
    return await this.request('/api/v1/admin/dashboard-stats');
  }

  static async getSymptomMappings() {
    return await this.request('/api/v1/admin/symptom-mappings');
  }

  static async createSymptomMapping(mappingData) {
    return await this.request('/api/v1/admin/symptom-mappings', {
      method: 'POST',
      body: JSON.stringify(mappingData),
    });
  }
}

export default ApiService;
