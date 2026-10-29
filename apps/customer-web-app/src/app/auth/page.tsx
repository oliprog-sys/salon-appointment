'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { setStoredUser } from '@/utils/authStore';

export default function AuthPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<'SIGN_IN' | 'SIGN_UP'>('SIGN_IN');

  // Form Inputs
  const [identifier, setIdentifier] = useState(''); // Email or Phone Number
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [authenticatedUserName, setAuthenticatedUserName] = useState('');

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const endpoint = authMode === 'SIGN_IN' ? '/auth/login' : '/auth/register';

      let payload: any;
      if (authMode === 'SIGN_IN') {
        if (!identifier.trim()) {
          throw new Error('Please enter your email or phone number.');
        }
        payload = {
          identifier: identifier.trim(),
          password,
        };
      } else {
        const formattedPhone = phone.startsWith('+251') ? phone : `+251${phone.replace(/^0/, '')}`;
        payload = {
          fullName: fullName.trim(),
          email: email.trim() || undefined,
          phoneNumber: formattedPhone,
          password,
          role: 'CUSTOMER',
        };
      }

      const res = await fetch(`http://localhost:4000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        const message = Array.isArray(data.message) ? data.message.join(', ') : data.message;
        throw new Error(message || 'Authentication failed. Please check your credentials.');
      }

      // Strictly save user and token returned by backend
      setStoredUser(data.user, data.accessToken);
      setAuthenticatedUserName(data.user?.fullName || 'VIP Client');
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Connection to authentication server failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
      <div className="text-center max-w-xl mx-auto space-y-3">
        <span className="text-xs uppercase tracking-[0.25em] text-[#E5B869] font-semibold">
          Luxury Access Portal
        </span>
        <h1 className="text-3xl sm:text-4xl font-syne font-bold text-white">
          {authMode === 'SIGN_IN' ? 'Welcome Back to AuraSalon' : 'Join VIP Sanctuary'}
        </h1>
        <p className="text-xs sm:text-sm text-[#8A92A6]">
          Sign in or register to unlock priority weekend bookings and cashback pricing across Addis Ababa.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Auth Form Card */}
        <div className="glass-card rounded-3xl p-8 border border-[#222734] space-y-6 shadow-2xl">
          {!isSuccess ? (
            <>
              {/* Mode Switcher */}
              <div className="flex bg-[#111318] p-1 rounded-full border border-[#222734]">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('SIGN_IN');
                    setErrorMessage('');
                  }}
                  className={`flex-1 py-2 rounded-full text-xs font-semibold transition-all ${
                    authMode === 'SIGN_IN'
                      ? 'bg-[#E5B869] text-[#0A0B0E] shadow-gold-glow-sm'
                      : 'text-[#8A92A6] hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('SIGN_UP');
                    setErrorMessage('');
                  }}
                  className={`flex-1 py-2 rounded-full text-xs font-semibold transition-all ${
                    authMode === 'SIGN_UP'
                      ? 'bg-[#E5B869] text-[#0A0B0E] shadow-gold-glow-sm'
                      : 'text-[#8A92A6] hover:text-white'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/50 text-red-400 text-xs text-center font-medium">
                  ⚠️ {errorMessage}
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authMode === 'SIGN_UP' && (
                  <div>
                    <label className="block text-xs text-[#8A92A6] uppercase tracking-wider mb-1 font-semibold">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Abebe Bikila"
                      className="w-full bg-[#111318] border border-[#222734] focus:border-[#E5B869] rounded-xl px-4 py-3 text-white text-sm focus:outline-none"
                    />
                  </div>
                )}

                {authMode === 'SIGN_IN' ? (
                  <div>
                    <label className="block text-xs text-[#8A92A6] uppercase tracking-wider mb-1 font-semibold">
                      Email or Phone Number (+251...)
                    </label>
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="admin@aurasalon.et or +251911..."
                      className="w-full bg-[#111318] border border-[#222734] focus:border-[#E5B869] rounded-xl px-4 py-3 text-white text-sm focus:outline-none"
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs text-[#8A92A6] uppercase tracking-wider mb-1 font-semibold">
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="vip@aurasalon.et"
                        className="w-full bg-[#111318] border border-[#222734] focus:border-[#E5B869] rounded-xl px-4 py-3 text-white text-sm focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-[#8A92A6] uppercase tracking-wider mb-1 font-semibold">
                        Ethiopia Mobile Number (+251) *
                      </label>
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+251 91 123 4567"
                        className="w-full bg-[#111318] border border-[#222734] focus:border-[#E5B869] rounded-xl px-4 py-3 text-white text-sm focus:outline-none font-mono"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs text-[#8A92A6] uppercase tracking-wider mb-1 font-semibold">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#111318] border border-[#222734] focus:border-[#E5B869] rounded-xl px-4 py-3 text-white text-sm focus:outline-none font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#E5B869] text-[#0A0B0E] hover:bg-[#F3D28E] active:scale-95 transition-all shadow-gold-glow flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-[#0A0B0E] border-t-transparent rounded-full animate-spin" />
                      Authenticating...
                    </>
                  ) : authMode === 'SIGN_IN' ? (
                    'Sign In'
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center space-y-4 py-6">
              <div className="w-14 h-14 rounded-full bg-[#E5B869]/20 text-[#E5B869] border border-[#E5B869] flex items-center justify-center mx-auto text-xl">
                ✓
              </div>
              <h3 className="font-syne text-xl font-bold text-white">Welcome, {authenticatedUserName}!</h3>
              <p className="text-xs text-[#8A92A6]">
                You are authenticated. Your session token has been verified against PostgreSQL.
              </p>
              <div className="space-y-2">
                <Link
                  href="/booking"
                  className="inline-block w-full py-3.5 rounded-full text-xs font-bold uppercase bg-[#E5B869] text-[#0A0B0E]"
                >
                  Book a Service Now
                </Link>
                <Link
                  href="/appointments"
                  className="inline-block w-full py-3.5 rounded-full text-xs font-bold uppercase bg-[#111318] border border-[#222734] text-white"
                >
                  Go to My Appointments
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: VIP Membership Perks Showcase */}
        <div className="space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#E5B869]">
              VIP Tier Benefits
            </span>
            <h2 className="text-2xl font-syne font-bold text-white">
              Why Join Aura VIP Sanctuary?
            </h2>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#111318]/70 border border-[#222734] flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#E5B869]/20 text-[#E5B869] flex items-center justify-center font-bold text-sm flex-shrink-0">
                10%
              </div>
              <div>
                <h4 className="font-syne font-bold text-white text-sm">Telebirr & CBE Cashback</h4>
                <p className="text-xs text-[#8A92A6]">
                  Earn 10% credit back on every digital payment executed through Telebirr or CBE Birr.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#111318]/70 border border-[#222734] flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#E5B869]/20 text-[#E5B869] flex items-center justify-center font-bold text-sm flex-shrink-0">
                ⭐
              </div>
              <div>
                <h4 className="font-syne font-bold text-white text-sm">Priority Weekend Booking</h4>
                <p className="text-xs text-[#8A92A6]">
                  Reserve coveted prime weekend slots at top Bole and Kazanchis salons up to 30 days in advance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
