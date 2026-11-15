'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeOffIcon } from '@/components/icons/Icons';

export default function LoginPage() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      if (!identifier.trim()) {
        throw new Error('Please enter your email or phone number.');
      }
      if (!loginPassword) {
        throw new Error('Please enter your password.');
      }

      const res = await fetch('http://localhost:4000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password: loginPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const message = Array.isArray(data.message) ? data.message.join(', ') : data.message;
        throw new Error(message || 'Invalid credentials. Please verify your email/phone and password.');
      }

      // Check if user has vendor/staff permissions
      const allowedRoles = ['SALON_OWNER', 'STAFF', 'SUPER_ADMIN'];
      if (!allowedRoles.includes(data.user.role)) {
        throw new Error('This portal is reserved for Salon Owners and Staff members.');
      }

      // Strictly save backend JWT & user data
      localStorage.setItem('aurasalon_owner_token', data.accessToken);
      localStorage.setItem('aurasalon_owner_user', JSON.stringify(data.user));

      const salonStatus =
        data.user.ownedSalons?.[0]?.status ||
        data.user.staffProfile?.salon?.status ||
        data.user.salonStatus ||
        'APPROVED';

      localStorage.setItem('aurasalon_salon_status', salonStatus);

      router.push('/');
    } catch (err: any) {
      setErrorMessage(err.message || 'Connection to backend server failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-900 font-extrabold text-2xl mx-auto shadow-lg">
          A
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Salon Portal Login
        </h2>
        <p className="text-xs text-slate-400">
          Sign in to manage your salon appointments, staff, and services
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800 py-8 px-6 shadow-2xl rounded-2xl border border-slate-700 sm:px-10 space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-xs text-center font-medium">
              ⚠️ {errorMessage}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Email or Phone Number *
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. tigist@queensaba.et or +251911111111"
                className="w-full text-xs p-3 border border-slate-700 rounded-lg text-slate-900 bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-300">Password *</label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs p-3 pr-10 border border-slate-700 rounded-lg text-slate-900 bg-white font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOffIcon className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <EyeIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-slate-950 text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? 'Authenticating...' : 'Sign In to Dashboard →'}
            </button>
          </form>

          {/* Registration Link for New Partners */}
          <div className="pt-4 border-t border-slate-700/80 text-center">
            <p className="text-xs text-slate-400">
              Not yet registered with AuraSalon?{' '}
              <Link
                href="/register"
                className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2 ml-1"
              >
                Sign up as a Partner
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

