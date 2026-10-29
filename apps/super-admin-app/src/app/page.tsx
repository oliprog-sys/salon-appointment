'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import RevenueAnalytics from '../components/analytics/RevenueAnalytics';
import { INITIAL_COMMISSION_LEDGERS } from '../data/mockData';

export default function SuperAdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('aurasalon_admin_token');
    const adminUser = localStorage.getItem('aurasalon_admin_user');
    if (token && adminUser) {
      try {
        const parsed = JSON.parse(adminUser);
        if (parsed.role === 'SUPER_ADMIN') {
          setIsAuthenticated(true);
        }
      } catch (e) {
        // invalid token
      }
    }
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      if (!identifier.trim()) {
        throw new Error('Please enter your admin email or phone number.');
      }

      const res = await fetch('http://localhost:4000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const message = Array.isArray(data.message) ? data.message.join(', ') : data.message;
        throw new Error(message || 'Invalid admin credentials');
      }

      if (data.user?.role !== 'SUPER_ADMIN') {
        throw new Error('Access denied. Account does not have SUPER_ADMIN privileges.');
      }

      localStorage.setItem('aurasalon_admin_token', data.accessToken);
      localStorage.setItem('aurasalon_admin_user', JSON.stringify(data.user));
      setIsAuthenticated(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Connection to backend server failed.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black text-2xl mx-auto shadow-2xl">
            👑
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Super Admin Portal</h2>
          <p className="text-xs text-slate-400">
            Restricted access portal for AuraSalon platform operations team
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-slate-800 py-8 px-6 shadow-2xl rounded-2xl border border-slate-700 sm:px-10 space-y-6">
            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-xs text-center font-semibold">
                ⚠️ {errorMessage}
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Admin Email or Phone Number *
                </label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin@aurasalon.et or +251911000000"
                  className="w-full text-xs p-3 border border-slate-700 rounded-lg text-slate-900 bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs p-3 border border-slate-700 rounded-lg text-slate-900 bg-white font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg transition flex items-center justify-center gap-2"
              >
                {isLoading ? 'Verifying Credentials...' : 'Authenticate Super Admin →'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          title="Global Revenue & Platform Analytics"
          subtitle="Real-time GMV, 10% commission revenue & sub-city performance in Addis Ababa"
        />
        <main className="flex-1 overflow-y-auto">
          <RevenueAnalytics ledgers={INITIAL_COMMISSION_LEDGERS} />
        </main>
      </div>
    </div>
  );
}
