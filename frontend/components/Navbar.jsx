import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Stethoscope, LogIn, LogOut, User, Menu, X, ShieldCheck } from 'lucide-react';
import ApiService from '../services/api';
import AuthModal from './AuthModal';

export default function Navbar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
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

  const handleLogout = () => {
    ApiService.setToken(null);
    setCurrentUser(null);
  };

  const navLinks = [
    { href: '/', label: 'Trang chủ' },
    { href: '/symptom-checker', label: 'Phân tích AI & Đặt lịch' },
    { href: '/departments', label: 'Chuyên khoa' },
    { href: '/doctors', label: 'Đội ngũ bác sĩ' },
    { href: '/how-it-works', label: 'Hướng dẫn' },
    { href: '/about', label: 'Về chúng tôi' },
    { href: '/contact', label: 'Liên hệ' },
  ];

  const getPortalLink = () => {
    if (!currentUser) return null;
    if (currentUser.role === 'DOCTOR') return { href: '/doctor/dashboard', label: 'Cổng Bác sĩ' };
    if (currentUser.role === 'ADMIN') return { href: '/admin/dashboard', label: 'Cổng Admin' };
    return { href: '/patient/dashboard', label: 'Lịch hẹn của tôi' };
  };

  const portalLink = getPortalLink();

  return (
    <>
      <header className="bg-[#FFFFFF] border-b border-[#E4E1D8] px-4 lg:px-8 py-3.5 sticky top-0 z-40 shadow-subtle text-[#1C1B19]">
        <div className="max-w-[1080px] mx-auto flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-sm bg-[#1F6F5C] text-white flex items-center justify-center font-bold">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-bold text-[#1C1B19] block leading-tight">Sức Khoẻ Thông Minh</span>
              <span className="text-xs text-[#6B6A65] hidden sm:block">Đặt lịch khám bệnh & AI Symptom Analysis</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition ${active ? 'text-[#1F6F5C] font-semibold border-b-2 border-[#1F6F5C] pb-1' : 'text-[#6B6A65] hover:text-[#1C1B19]'}`}
                >
                  {link.label}
                </Link>
              );
            })}
            {portalLink && (
              <Link
                href={portalLink.href}
                className={`transition font-semibold px-2.5 py-1 rounded-sm ${pathname === portalLink.href ? 'bg-[#1F6F5C] text-white' : 'bg-[#DCEAE6] text-[#1F6F5C] hover:bg-[#c6dfd8]'}`}
              >
                {portalLink.label}
              </Link>
            )}
          </nav>

          {/* User Auth Action & Mobile Menu Toggle */}
          <div className="flex items-center space-x-3">
            {currentUser ? (
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <span className="text-xs font-semibold text-[#1C1B19] block">{currentUser.full_name}</span>
                  <span className="text-[11px] text-[#6B6A65]">
                    {currentUser.role === 'PATIENT' ? 'Bệnh nhân' : currentUser.role === 'DOCTOR' ? 'Bác sĩ' : 'Quản trị viên'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-sm bg-[#F7F5F0] hover:bg-[#EFECE6] border border-[#E4E1D8] text-[#1C1B19] text-xs font-medium transition"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="btn-primary px-4 py-2 text-xs flex items-center space-x-1.5"
              >
                <LogIn className="w-4 h-4" />
                <span>Đăng nhập</span>
              </button>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-sm text-[#1C1B19] hover:bg-[#F7F5F0] transition"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-[#E4E1D8] mt-3 pt-3 pb-2 space-y-2 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-sm ${pathname === link.href ? 'bg-[#DCEAE6] text-[#1F6F5C] font-semibold' : 'text-[#6B6A65] hover:bg-[#F7F5F0]'}`}
              >
                {link.label}
              </Link>
            ))}
            {portalLink && (
              <Link
                href={portalLink.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-sm bg-[#1F6F5C] text-white font-semibold"
              >
                {portalLink.label}
              </Link>
            )}
          </div>
        )}
      </header>

      {/* Shared Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
        }}
      />
    </>
  );
}
