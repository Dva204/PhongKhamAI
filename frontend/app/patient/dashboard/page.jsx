'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import SymptomCheckerBooking from '../../../components/SymptomCheckerBooking';
import ApiService from '../../../services/api';

export default function PatientDashboardPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const token = ApiService.getToken();
      if (!token) {
        router.replace('/');
        return;
      }
      try {
        const user = await ApiService.getCurrentUser();
        if (user && user.role === 'PATIENT') {
          setAuthorized(true);
        } else if (user && user.role === 'DOCTOR') {
          router.replace('/doctor/dashboard');
        } else if (user && user.role === 'ADMIN') {
          router.replace('/admin/dashboard');
        } else {
          router.replace('/');
        }
      } catch (e) {
        ApiService.setToken(null);
        router.replace('/');
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  if (loading || !authorized) {
    return (
      <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-[#1F6F5C] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-[#6B6A65]">Đang kiểm tra quyền truy cập Lịch hẹn...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5F0]">
      <Navbar />
      <div className="py-4">
        <SymptomCheckerBooking initialTab="patient" hideLandingSections={true} />
      </div>
      <Footer />
    </div>
  );
}
