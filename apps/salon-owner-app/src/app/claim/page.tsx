'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function ClaimAccountForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tokenParam = searchParams.get('token') || 'setup-demo-token-9981';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    setIsSuccess(true);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-white font-extrabold text-2xl mx-auto shadow-lg">
          🔑
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Claim Salon Owner Account</h2>
        <p className="text-xs text-slate-400">
          Super Admin Invitation Token: <span className="font-mono text-sky-400 font-bold">{tokenParam}</span>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800 py-8 px-6 shadow-2xl rounded-2xl border border-slate-700 sm:px-10">
          {!isSuccess ? (
            <form onSubmit={handleClaim} className="space-y-4">
              <p className="text-xs text-slate-300">
                Set a secure password for your newly onboarded salon account.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">New Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs p-3 border border-slate-700 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Confirm Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs p-3 border border-slate-700 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 text-slate-950 text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg transition"
              >
                Activate Account & Access Dashboard
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4 py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400 flex items-center justify-center mx-auto text-2xl">
                ✓
              </div>
              <h3 className="text-xl font-bold text-white">Account Claimed Successfully!</h3>
              <p className="text-xs text-slate-300">
                Your credentials have been set. You may now log in and complete your KYC submission.
              </p>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-lg"
              >
                Go to Vendor Suite →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ClaimAccountPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-white">Loading Setup Token...</div>}>
      <ClaimAccountForm />
    </Suspense>
  );
}
