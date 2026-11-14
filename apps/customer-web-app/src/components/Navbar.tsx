'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getStoredUser, logoutUser, UserProfile } from '@/utils/authStore';
import { useTheme } from '@/context/ThemeContext';

export default function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
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
          <span className="font-syne text-2xl font-bold tracking-tight text-[var(--text-primary)] group-hover:opacity-90 transition-opacity">
            Aura<span className="text-[var(--aura-gold)] font-extrabold">Salon</span>
          </span>
          <span className="w-2 h-2 rounded-full bg-[var(--aura-gold)] animate-pulse"></span>
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
                    ? 'text-[var(--text-primary)] font-semibold after:absolute after:bottom-[-6px] after:left-0 after:w-full after:h-[2px] after:bg-[var(--aura-gold)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--aura-gold)]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Button, Theme Switcher & User Profile Menu */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            className="p-2 sm:px-3 sm:py-2 rounded-full border border-[var(--border-primary)] bg-[var(--bg-card-subtle)] text-[var(--text-primary)] hover:border-[var(--aura-gold)] transition-all duration-200 flex items-center gap-1.5 shadow-sm hover:scale-105 active:scale-95"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? (
              <>
                <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
                </svg>
                <span className="text-xs font-semibold text-amber-800 hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-[#E5B869]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
                <span className="text-xs font-semibold text-[#E5B869] hidden sm:inline">Dark</span>
              </>
            )}
          </button>

          {/* Instant Booking CTA */}
          <Link
            href="/booking"
            className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 rounded-full text-xs uppercase tracking-wider font-bold bg-[#E5B869] text-[#0A0B0E] hover:bg-[#F3D28E] active:scale-95 transition duration-200 shadow-gold-glow"
          >
            Instant Booking
          </Link>

          {/* User Auth Badge */}
          {currentUser ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[var(--bg-card-subtle)] border border-[var(--aura-gold)]/40 hover:border-[var(--aura-gold)] transition-all"
              >
                <div className="w-7 h-7 rounded-full bg-[var(--aura-gold)] text-[#0A0B0E] font-syne font-bold text-xs flex items-center justify-center">
                  {currentUser.fullName.charAt(0)}
                </div>
                <span className="text-xs font-semibold text-[var(--text-primary)] max-w-[100px] truncate hidden sm:inline">
                  {currentUser.fullName}
                </span>
                <span className="text-xs text-[var(--aura-gold)]">▼</span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-2xl p-2 shadow-2xl space-y-1 z-50">
                  <div className="px-3 py-2 border-b border-[var(--border-primary)] text-xs">
                    <p className="text-[var(--text-primary)] font-bold truncate">{currentUser.fullName}</p>
                    <p className="text-[var(--text-muted)] text-[10px]">{currentUser.phoneNumber}</p>
                  </div>

                  <Link
                    href="/appointments"
                    onClick={() => setUserMenuOpen(false)}
                    className="block px-3 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--aura-gold)] hover:bg-[var(--bg-card-subtle)] rounded-xl transition-colors"
                  >
                    📅 My Appointments
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                  >
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth"
              className="px-4 py-2 rounded-full border border-[var(--border-primary)] hover:border-[var(--aura-gold)]/60 text-xs font-semibold text-[var(--text-primary)] bg-[var(--bg-surface)] transition-all"
            >
              Sign In
            </Link>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
            className="md:hidden p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus:outline-none"
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
        <div className="md:hidden bg-[var(--bg-surface)] border-b border-[var(--border-primary)] px-4 pt-3 pb-6 space-y-3 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-primary)]">
            <span className="text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)]">Appearance</span>
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border-primary)] text-xs font-medium bg-[var(--bg-card-subtle)] text-[var(--text-primary)]"
            >
              {theme === 'light' ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
          </div>

          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-medium text-[var(--text-secondary)] hover:text-[var(--aura-gold)]"
            >
              {link.label}
            </Link>
          ))}
          {currentUser && (
            <button
              onClick={handleLogout}
              className="w-full text-left py-2 text-base font-medium text-red-500"
            >
              Sign Out ({currentUser.fullName})
            </button>
          )}
          <Link
            href="/booking"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-center py-3 rounded-full text-xs uppercase tracking-wider font-bold bg-[#E5B869] text-[#0A0B0E]"
          >
            Instant Booking
          </Link>
        </div>
      )}
    </header>
  );
}
