'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPartnerPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<'REGISTER' | 'LOGIN'>('REGISTER');

  // Register Fields
  const [ownerFullName, setOwnerFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [salonName, setSalonName] = useState('');
  const [address, setAddress] = useState('');
  const [subCity, setSubCity] = useState('Bole');

  // Login Fields
  const [identifier, setIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const endpoint = authMode === 'REGISTER' ? '/auth/partner/register' : '/auth/login';

      let payload: any;
      if (authMode === 'REGISTER') {
        const formattedPhone = phoneNumber.startsWith('+251') ? phoneNumber : `+251${phoneNumber.replace(/^0/, '')}`;
        payload = {
          ownerFullName: ownerFullName.trim(),
          phoneNumber: formattedPhone,
          email: email.trim() || undefined,
          password,
          salonName: salonName.trim(),
          address: address.trim(),
          subCity,
        };
      } else {
        if (!identifier.trim()) {
          throw new Error('Please enter your email or phone number.');
        }
        payload = {
          identifier: identifier.trim(),
          password: loginPassword,
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

      // Strictly save backend JWT & user data
      localStorage.setItem('aurasalon_owner_token', data.accessToken);
      localStorage.setItem('aurasalon_owner_user', JSON.stringify(data.user));
      localStorage.setItem('aurasalon_salon_status', data.user.salonStatus || 'APPROVED');

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
          {authMode === 'REGISTER' ? 'Partner with AuraSalon' : 'Salon Owner Login'}
        </h2>
        <p className="text-xs text-slate-400">
          List your salon in Addis Ababa & access floor management tools
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800 py-8 px-6 shadow-2xl rounded-2xl border border-slate-700 sm:px-10 space-y-6">
          {/* Mode Switcher */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={() => {
                setAuthMode('REGISTER');
                setErrorMessage('');
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                authMode === 'REGISTER'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign Up Partner
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('LOGIN');
                setErrorMessage('');
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                authMode === 'LOGIN'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Owner Login
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-xs text-center font-medium">
              ⚠️ {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {authMode === 'REGISTER' ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Owner Full Name *</label>
                  <input
                    type="text"
                    required
                    value={ownerFullName}
                    onChange={(e) => setOwnerFullName(e.target.value)}
                    placeholder="e.g. Tigist Alemu"
                    className="w-full text-xs p-3 border border-slate-700 rounded-lg text-slate-900 bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Email Address (Optional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tigist.alemu@aurasalon.et"
                    className="w-full text-xs p-3 border border-slate-700 rounded-lg text-slate-900 bg-white font-medium"
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
                    className="w-full text-xs p-3 border border-slate-700 rounded-lg text-slate-900 bg-white font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs p-3 border border-slate-700 rounded-lg text-slate-900 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Initial Salon Name *</label>
                  <input
                    type="text"
                    required
                    value={salonName}
                    onChange={(e) => setSalonName(e.target.value)}
                    placeholder="e.g. Aura Luxe Salon"
                    className="w-full text-xs p-3 border border-slate-700 rounded-lg text-slate-900 bg-white font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Sub-City *</label>
                    <select
                      value={subCity}
                      onChange={(e) => setSubCity(e.target.value)}
                      className="w-full text-xs p-3 border border-slate-700 rounded-lg text-slate-900 bg-white font-bold"
                    >
                      <option value="Bole">Bole</option>
                      <option value="Kazanchis">Kazanchis</option>
                      <option value="Sarbet">Sarbet</option>
                      <option value="Old Airport">Old Airport</option>
                      <option value="Piassa">Piassa</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Address *</label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Medhanialem Rd"
                      className="w-full text-xs p-3 border border-slate-700 rounded-lg text-slate-900 bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg transition flex items-center justify-center gap-2"
                >
                  {isLoading ? 'Registering Salon...' : 'Register Salon & Proceed to Onboarding →'}
                </button>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Email or Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="tigist.alemu@aurasalon.et or +251911111111"
                    className="w-full text-xs p-3 border border-slate-700 rounded-lg text-slate-900 bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs p-3 border border-slate-700 rounded-lg text-slate-900 bg-white font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg transition flex items-center justify-center gap-2"
                >
                  {isLoading ? 'Authenticating...' : 'Sign In to Dashboard →'}
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
