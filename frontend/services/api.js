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

      return await response.json();
    } catch (error) {
      console.warn(`API Request Error [${endpoint}]:`, error.message);
      throw error;
    }
  }

  // --- Auth APIs ---
  static async register(data) {
    const res = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.access_token) this.setToken(res.access_token);
    return res;
  }

  static async loginPassword(emailOrPhone, password) {
    const res = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email_or_phone: emailOrPhone, password }),
    });
    if (res.access_token) this.setToken(res.access_token);
    return res;
  }

  static async requestOTP(phone) {
    return await this.request('/api/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  static async verifyOTP(phone, code) {
    const res = await this.request('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    });
    if (res.access_token) this.setToken(res.access_token);
    return res;
  }

  static async googleLogin(email, fullName) {
    const res = await this.request('/api/auth/google-login', {
      method: 'POST',
      body: JSON.stringify({ id_token: 'mock_google_token', email, full_name: fullName }),
    });
    if (res.access_token) this.setToken(res.access_token);
    return res;
  }

  static async getCurrentUser() {
    return await this.request('/api/auth/me');
  }

  static async updatePatientProfile(profileData) {
    return await this.request('/api/auth/patient-profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  static async updateDoctorProfile(profileData) {
    return await this.request('/api/auth/doctor-profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // --- Department APIs ---
  static async getDepartments() {
    return await this.request('/api/departments');
  }

  // --- Doctor Discovery & Slot APIs ---
  static async getDoctors(departmentId = null) {
    const query = departmentId ? `?department_id=${departmentId}` : '';
    return await this.request(`/api/doctors${query}`);
  }

  static async getDoctorDetail(doctorId) {
    return await this.request(`/api/doctors/${doctorId}`);
  }

  static async getDoctorAvailableSlots(doctorId, dateStr) {
    return await this.request(`/api/doctors/${doctorId}/slots?date_str=${dateStr}`);
  }

  // --- AI Symptom Checker APIs ---
  static async analyzeSymptoms(symptomData) {
    return await this.request('/api/ai/analyze-symptoms', {
      method: 'POST',
      body: JSON.stringify(symptomData),
    });
  }

  static async submitAIFeedback(feedbackData) {
    return await this.request('/api/ai/feedback', {
      method: 'POST',
      body: JSON.stringify(feedbackData),
    });
  }

  // --- Appointment Booking APIs ---
  static async createAppointment(bookingData) {
    return await this.request('/api/appointments', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  static async getPatientHistory() {
    return await this.request('/api/appointments/my-history');
  }

  static async getDoctorShiftAppointments(dateStr = null) {
    const query = dateStr ? `?date_str=${dateStr}` : '';
    return await this.request(`/api/appointments/doctor-shift${query}`);
  }

  static async doctorCompleteAppointment(aptId, outcomeData) {
    return await this.request(`/api/appointments/${aptId}/complete`, {
      method: 'PUT',
      body: JSON.stringify(outcomeData),
    });
  }

  static async updateAppointmentStatus(aptId, status, cancelledReason = null) {
    return await this.request(`/api/appointments/${aptId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, cancelled_reason: cancelledReason }),
    });
  }

  // --- Admin Portal APIs ---
  static async getAdminDashboardStats() {
    return await this.request('/api/admin/dashboard-stats');
  }

  static async getSymptomMappings() {
    return await this.request('/api/admin/symptom-mappings');
  }

  static async createSymptomMapping(mappingData) {
    return await this.request('/api/admin/symptom-mappings', {
      method: 'POST',
      body: JSON.stringify(mappingData),
    });
  }
}

export default ApiService;
