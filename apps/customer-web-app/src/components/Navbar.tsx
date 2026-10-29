'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getStoredUser, logoutUser, UserProfile } from '@/utils/authStore';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const syncUser = () => {
      setCurrentUser(getStoredUser());
    };
    syncUser();

    window.addEventListener('aurasalon_auth_changed', syncUser);
    window.addEventListener('storage', syncUser);

    return () => {
      window.removeEventListener('aurasalon_auth_changed', syncUser);
      window.removeEventListener('storage', syncUser);
    };
  }, []);

  const handleLogout = () => {
    logoutUser();
    setUserMenuOpen(false);
  };

  const navLinks = [
    { label: 'Explore Salons', href: '/' },
    { label: 'My Appointments', href: '/appointments' },
    ...(!currentUser ? [{ label: 'Sign In / Join VIP', href: '/auth' }] : []),
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-nav transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="font-syne text-2xl font-bold tracking-tight text-white group-hover:opacity-90 transition-opacity">
            Aura<span className="text-[#E5B869] font-extrabold">Salon</span>
          </span>
          <span className="w-2 h-2 rounded-full bg-[#E5B869] animate-pulse"></span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative transition-all duration-200 ${
                  isActive
                    ? 'text-white font-semibold after:absolute after:bottom-[-6px] after:left-0 after:w-full after:h-[2px] after:bg-[#E5B869]'
                    : 'text-[#8A92A6] hover:text-[#E5B869]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Button & User Profile Menu */}
        <div className="flex items-center gap-4">
          <Link
            href="/booking"
            className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 rounded-full text-xs uppercase tracking-wider font-semibold bg-[#E5B869] text-[#0A0B0E] hover:bg-[#F3D28E] active:scale-95 transition duration-200 shadow-gold-glow"
          >
            Instant Booking
          </Link>

          {/* User Auth Badge */}
          {currentUser ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#161922] border border-[#E5B869]/40 hover:border-[#E5B869] transition-all"
              >
                <div className="w-7 h-7 rounded-full bg-[#E5B869] text-[#0A0B0E] font-syne font-bold text-xs flex items-center justify-center">
                  {currentUser.fullName.charAt(0)}
                </div>
                <span className="text-xs font-semibold text-white max-w-[100px] truncate hidden sm:inline">
                  {currentUser.fullName}
                </span>
                <span className="text-xs text-[#E5B869]">▼</span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#111318] border border-[#222734] rounded-2xl p-2 shadow-2xl space-y-1 z-50">
                  <div className="px-3 py-2 border-b border-[#222734] text-xs">
                    <p className="text-white font-bold truncate">{currentUser.fullName}</p>
                    <p className="text-[#8A92A6] text-[10px]">{currentUser.phoneNumber}</p>
                  </div>

                  <Link
                    href="/appointments"
                    onClick={() => setUserMenuOpen(false)}
                    className="block px-3 py-2 text-xs text-gray-300 hover:text-[#E5B869] hover:bg-[#161922] rounded-xl transition-colors"
                  >
                    📅 My Appointments
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                  >
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth"
              className="px-4 py-2 rounded-full border border-[#222734] hover:border-[#E5B869]/50 text-xs font-semibold text-white transition-all"
            >
              Sign In
            </Link>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
            className="md:hidden p-2 rounded-lg text-[#8A92A6] hover:text-white focus:outline-none"
            type="button"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#111318] border-b border-[#222734] px-4 pt-3 pb-6 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-medium text-[#8A92A6] hover:text-[#E5B869]"
            >
              {link.label}
            </Link>
          ))}
          {currentUser && (
            <button
              onClick={handleLogout}
              className="w-full text-left py-2 text-base font-medium text-red-400"
            >
              Sign Out ({currentUser.fullName})
            </button>
          )}
          <Link
            href="/booking"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-center py-3 rounded-full text-xs uppercase tracking-wider font-semibold bg-[#E5B869] text-[#0A0B0E]"
          >
            Instant Booking
          </Link>
        </div>
      )}
    </header>
  );
}
