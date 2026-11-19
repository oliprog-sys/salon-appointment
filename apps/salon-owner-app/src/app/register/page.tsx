'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeOffIcon } from '@/components/icons/Icons';
import { saveOwnerSession } from '@/utils/authSession';

export default function RegisterPartnerPage() {
  const router = useRouter();

  // Register Fields
  const [ownerFullName, setOwnerFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [salonName, setSalonName] = useState('');
  const [address, setAddress] = useState('');
  const [subCity, setSubCity] = useState('Bole');
  const [tinNumber, setTinNumber] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const formatEthiopianPhone = (phone: string): string | null => {
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    if (/^\+251[79]\d{8}$/.test(cleaned)) {
      return cleaned;
    }
    if (/^0[79]\d{8}$/.test(cleaned)) {
      return `+251${cleaned.slice(1)}`;
    }
    if (/^[79]\d{8}$/.test(cleaned)) {
      return `+251${cleaned}`;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (ownerFullName.trim().length < 3) {
      setErrorMessage('Please enter the owner full name (at least 3 characters).');
      return;
    }

    const formattedPhone = formatEthiopianPhone(phoneNumber);
    if (!formattedPhone) {
      setErrorMessage('Please enter a valid Ethiopian mobile phone number (e.g. 0911 234567 or +251 911 234567).');
      return;
    }

    if (salonName.trim().length < 2) {
      setErrorMessage('Please enter a valid salon name.');
      return;
    }

    if (!address.trim()) {
      setErrorMessage('Please enter the salon physical address in Addis Ababa.');
      return;
    }

    setIsLoading(true);

    try {
      const payload: any = {
        ownerFullName: ownerFullName.trim(),
        phoneNumber: formattedPhone,
        email: email.trim() || undefined,
        password,
        salonName: salonName.trim(),
        address: address.trim(),
        subCity,
      };

      if (tinNumber.trim()) {
        payload.tinNumber = tinNumber.trim();
      }

      const res = await fetch('http://localhost:4000/auth/partner/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        const message = Array.isArray(data.message) ? data.message.join(', ') : data.message;
        throw new Error(message || 'Registration failed. Please check your inputs.');
      }

      // Save backend session token, user data, and active salon state
      saveOwnerSession(data.accessToken, data.user);
      if (data.salon?.id) {
        localStorage.setItem('aurasalon_active_salon_id', data.salon.id);
      }
      localStorage.setItem('aurasalon_salon_status', 'PENDING_REVIEW');

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
          Partner with AuraSalon
        </h2>
        <p className="text-xs text-slate-400">
          List your salon in Addis Ababa & access floor management tools
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800 py-8 px-6 shadow-2xl rounded-2xl border border-slate-700 sm:px-10 space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-xs text-center font-medium">
              ⚠️ {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Owner Full Name *</label>
              <input
                type="text"
                required
                value={ownerFullName}
                onChange={(e) => setOwnerFullName(e.target.value)}
                placeholder="e.g. Tigist Alemu"
                className="w-full text-xs p-3 border border-slate-700 rounded-lg text-slate-900 bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Email Address (Optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tigist.alemu@aurasalon.et"
                className="w-full text-xs p-3 border border-slate-700 rounded-lg text-slate-900 bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Phone Number (+251) *</label>
              <input
                type="text"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+251 91 111 1111"
                className="w-full text-xs p-3 border border-slate-700 rounded-lg text-slate-900 bg-white font-mono font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Salon Name *</label>
              <input
                type="text"
                required
                value={salonName}
                onChange={(e) => setSalonName(e.target.value)}
                placeholder="e.g. Aura Luxe Salon"
                className="w-full text-xs p-3 border border-slate-700 rounded-lg text-slate-900 bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Sub-City *</label>
                <select
                  value={subCity}
                  onChange={(e) => setSubCity(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-700 rounded-lg text-slate-900 bg-white font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="Bole">Bole</option>
                  <option value="Kirkos">Kirkos</option>
                  <option value="Yeka">Yeka</option>
                  <option value="Arada">Arada</option>
                  <option value="Nifas Silk-Lafto">Nifas Silk-Lafto</option>
                  <option value="Kolfe Keranio">Kolfe Keranio</option>
                  <option value="Lideta">Lideta</option>
                  <option value="Akaki Kality">Akaki Kality</option>
                  <option value="Gullele">Gullele</option>
                  <option value="Addis Ketema">Addis Ketema</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Address *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Near Edna Mall"
                  className="w-full text-xs p-3 border border-slate-700 rounded-lg text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Ministry TIN Number (Optional)
              </label>
              <input
                type="text"
                value={tinNumber}
                onChange={(e) => setTinNumber(e.target.value)}
                placeholder="e.g. 0049281742"
                className="w-full text-xs p-3 border border-slate-700 rounded-lg text-slate-900 bg-white font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-slate-950 text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? 'Registering Salon...' : 'Register Salon & Proceed to Onboarding →'}
            </button>
          </form>

          {/* Direct link for existing owners & staff */}
          <div className="pt-4 border-t border-slate-700/80 text-center">
            <p className="text-xs text-slate-400">
              Already have a registered salon?{' '}
              <Link
                href="/login"
                className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2 ml-1"
              >
                Sign in to Dashboard
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
