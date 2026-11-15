'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getStoredUser, logoutUser, setStoredUser, UserProfile } from '@/utils/authStore';
import { useTheme } from '@/context/ThemeContext';
import { SunIcon, MoonIcon, UserIcon } from '@/components/icons/Icons';

export default function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Profile Edit State
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Click Outside Ref for Dropdown
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncUser = () => {
      const u = getStoredUser();
      setCurrentUser(u);
      if (u) {
        setEditName(u.fullName || '');
        setEditPhone(u.phoneNumber || '');
        setEditEmail(u.email || '');
      }
    };
    syncUser();

    window.addEventListener('aurasalon_auth_changed', syncUser);
    window.addEventListener('storage', syncUser);

    return () => {
      window.removeEventListener('aurasalon_auth_changed', syncUser);
      window.removeEventListener('storage', syncUser);
    };
  }, []);

  // Handle clicking outside the profile dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logoutUser();
    setUserMenuOpen(false);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const updated: UserProfile = {
      ...currentUser,
      fullName: editName.trim() || currentUser.fullName,
      phoneNumber: editPhone.trim() || currentUser.phoneNumber,
      email: editEmail.trim() || undefined,
    };
    setStoredUser(updated);
    setProfileSuccess(true);
    setTimeout(() => {
      setProfileSuccess(false);
      setShowProfileModal(false);
    }, 1200);
  };

  const partnerPortalUrl =
    typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? 'http://localhost:3001/register'
      : process.env.NEXT_PUBLIC_SALON_OWNER_URL || 'http://localhost:3001/register';

  const navLinks = [
    { label: 'Explore Salons', href: '/' },
    { label: 'My Appointments', href: '/appointments' },
    ...(!currentUser ? [{ label: 'Sign In / Sign Up', href: '/auth' }] : []),
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 glass-nav transition-all duration-300">
        {/* Expansive wide desktop container */}
        <div className="max-w-[1536px] w-full mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="font-syne text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)] group-hover:opacity-90 transition-opacity">
              Aura<span className="text-[var(--aura-gold)] font-black">Salon</span>
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--aura-gold)] animate-pulse"></span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 lg:gap-10 text-sm font-medium">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative transition-all duration-200 py-1 ${
                    isActive
                      ? 'text-[var(--text-primary)] font-bold after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[2px] after:bg-[var(--aura-gold)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--aura-gold)]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

          </nav>

          {/* Action Area: Theme Toggle & User Account */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Theme Toggle Button (Icon-only, Light default) */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              className="w-9 h-9 rounded-full border border-[var(--border-primary)] bg-[var(--bg-card-subtle)] text-[var(--text-primary)] hover:border-[var(--aura-gold)] transition-all duration-200 flex items-center justify-center shadow-xs hover:scale-105 active:scale-95 cursor-pointer"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? (
                <SunIcon className="w-4 h-4 text-amber-500" />
              ) : (
                <MoonIcon className="w-4 h-4 text-[#E5B869]" />
              )}
            </button>

            {/* User Profile Menu or Sign In */}
            {currentUser ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[var(--bg-card-subtle)] border border-[var(--aura-gold)]/50 hover:border-[var(--aura-gold)] transition-all shadow-sm active:scale-95"
                >
                  <div className="w-7 h-7 rounded-full bg-[#E5B869] text-[#0A0B0E] font-syne font-bold text-xs flex items-center justify-center">
                    {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="text-xs font-semibold text-[var(--text-primary)] max-w-[120px] truncate hidden sm:inline">
                    {currentUser.fullName}
                  </span>
                  <span className="text-[10px] text-[var(--aura-gold)]">▼</span>
                </button>

                {/* Dropdown Menu (Closes when clicking outside) */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-2xl p-2 shadow-2xl space-y-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2.5 border-b border-[var(--border-primary)] text-xs">
                      <p className="text-[var(--text-primary)] font-bold truncate">
                        {currentUser.fullName}
                      </p>
                      <p className="text-[var(--text-muted)] text-[10px] font-mono mt-0.5">
                        {currentUser.phoneNumber}
                      </p>
                      {currentUser.email && (
                        <p className="text-[var(--text-muted)] text-[10px] truncate">
                          {currentUser.email}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        setShowProfileModal(true);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--aura-gold)] hover:bg-[var(--bg-card-subtle)] rounded-xl transition-colors flex items-center gap-2"
                    >
                      <span>👤</span>
                      <span>Edit Profile Info</span>
                    </button>

                    <Link
                      href="/appointments"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-3 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--aura-gold)] hover:bg-[var(--bg-card-subtle)] rounded-xl transition-colors flex items-center gap-2"
                    >
                      <span>📅</span>
                      <span>My Appointments</span>
                    </Link>

                    {/* Only show Salon Owner Desk in dropdown if customer is registered as a salon owner */}
                    {(currentUser.role === 'SALON_OWNER' || (currentUser.ownedSalons && currentUser.ownedSalons.length > 0)) && (
                      <a
                        href={partnerPortalUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-3 py-2 text-xs text-[var(--aura-gold)] hover:bg-[var(--bg-card-subtle)] rounded-xl transition-colors flex items-center gap-2 font-semibold"
                      >
                        <span>🏢</span>
                        <span>Salon Owner Desk ↗</span>
                      </a>
                    )}

                    <div className="border-t border-[var(--border-primary)] pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-500/10 rounded-xl transition-colors flex items-center gap-2"
                      >
                        <span>🚪</span>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth"
                  className="px-4 py-2 rounded-full border border-[var(--border-primary)] hover:border-[var(--aura-gold)] text-xs font-bold text-[var(--text-primary)] bg-[var(--bg-surface)] transition-all shadow-sm"
                >
                  Sign In / Sign Up
                </Link>
              </div>
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
          <div className="md:hidden bg-[var(--bg-surface)] border-b border-[var(--border-primary)] px-6 pt-3 pb-6 space-y-3 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-primary)]">
              <span className="text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)]">
                Appearance
              </span>
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

            <a
              href={partnerPortalUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-semibold text-[var(--aura-gold)]"
            >
              🤝 Partner with AuraSalon ↗
            </a>

            {currentUser ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowProfileModal(true);
                  }}
                  className="block w-full text-left py-2 text-base font-medium text-[var(--text-primary)]"
                >
                  👤 Edit Profile Info
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left py-2 text-base font-medium text-red-500"
                >
                  Sign Out ({currentUser.fullName})
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2.5 rounded-full text-xs uppercase tracking-wider font-bold bg-[#E5B869] text-[#0A0B0E]"
              >
                Sign In / Join VIP
              </Link>
            )}
          </div>
        )}
      </header>

      {/* Customer Profile Edit Modal */}
      {showProfileModal && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="glass-card max-w-md w-full rounded-3xl p-6 sm:p-8 border border-[var(--border-primary)] shadow-2xl space-y-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-5 right-5 text-[var(--text-muted)] hover:text-[var(--text-primary)] w-8 h-8 rounded-full bg-[var(--bg-card-subtle)] flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              ✕
            </button>

            <div className="space-y-1">
              <span className="text-xs uppercase tracking-[0.2em] text-[var(--aura-gold)] font-bold">
                Account Details
              </span>
              <h3 className="text-xl font-syne font-extrabold text-[var(--text-primary)]">
                Update Profile Information
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Manage your name, verified phone number, and appointment contact details.
              </p>
            </div>

            {profileSuccess && (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 rounded-xl text-xs font-semibold flex items-center gap-2">
                <span>✓</span>
                <span>Profile updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--aura-gold)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card-subtle)] text-[var(--text-primary)] text-sm font-mono focus:outline-none focus:border-[var(--aura-gold)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--aura-gold)]"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="flex-1 py-2.5 rounded-full border border-[var(--border-primary)] text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-card-subtle)] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-full bg-[#E5B869] text-[#0A0B0E] text-xs font-bold uppercase tracking-wider hover:bg-[#F3D28E] transition shadow-gold-glow active:scale-95"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
