'use client';

import { useState } from 'react';

interface OnboardingStepFormProps {
  salonName?: string;
  subCity?: string;
  onStatusChange?: (status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED') => void;
}

export default function OnboardingStepForm({
  salonName = 'Aura Luxury Lounge',
  subCity = 'Bole Medhanialem',
  onStatusChange
}: OnboardingStepFormProps) {
  const [step, setStep] = useState<number>(1);
  const [tradeLicenseUrl, setTradeLicenseUrl] = useState('https://storage.aurasalon.et/docs/license-trade-9941.pdf');
  const [tinNumber, setTinNumber] = useState('0049281742');
  const [kebeleIdUrl, setKebeleIdUrl] = useState('https://storage.aurasalon.et/docs/kebele-id-8812.pdf');
  const [payoutBank, setPayoutBank] = useState('TELEBIRR');
  const [payoutAccount, setPayoutAccount] = useState('+251911889900');

  const [submitted, setSubmitted] = useState(true);

  const handleSubmitKyc = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (onStatusChange) onStatusChange('PENDING_REVIEW');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Top Banner Status */}
      <div className="bg-amber-50 border border-amber-300 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-800 flex items-center justify-center text-xl font-bold border border-amber-400">
            ⏳
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-amber-200 text-amber-900 font-mono text-[10px] font-bold uppercase rounded-full">
                Status: PENDING REVIEW
              </span>
              <span className="text-xs text-amber-700 font-mono">KYC Application #8841</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">{salonName} ({subCity})</h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Your legal trade license and TIN registration are currently under review by Super Admin HQ in Addis Ababa.
            </p>
          </div>
        </div>

        {/* Demo Fast-Forward Button */}
        {onStatusChange && (
          <div className="flex flex-col gap-1 shrink-0">
            <span className="text-[10px] font-mono text-slate-400 uppercase text-right">Demo Status Simulator:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onStatusChange('APPROVED')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold rounded-lg shadow-xs"
              >
                Simulate Approval ✓
              </button>
              <button
                type="button"
                onClick={() => onStatusChange('REJECTED')}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs font-bold rounded-lg shadow-xs"
              >
                Simulate Rejection ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Onboarding Steps Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-mono uppercase tracking-wider">
              Vendor Legal & Financial Onboarding Desk
            </h3>
            <p className="text-xs text-slate-500">Provide official Ethiopian business registration and payout account</p>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className={`px-3 py-1 rounded-full font-bold ${step === 1 ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'}`}>
              Step 1: Business KYC
            </span>
            <span className={`px-3 py-1 rounded-full font-bold ${step === 2 ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'}`}>
              Step 2: Bank Payouts
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmitKyc} className="p-6 space-y-6">
          {step === 1 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Commercial Trade License Number *</label>
                  <input
                    type="text"
                    required
                    value={tinNumber}
                    onChange={(e) => setTinNumber(e.target.value)}
                    placeholder="e.g. BL-ETH-2026-9941"
                    className="w-full text-xs p-3 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">TIN (Taxpayer Identification Number) *</label>
                  <input
                    type="text"
                    required
                    value={tinNumber}
                    onChange={(e) => setTinNumber(e.target.value)}
                    placeholder="e.g. 0049281742"
                    className="w-full text-xs p-3 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Trade License Document URL / PDF Upload</label>
                <input
                  type="text"
                  value={tradeLicenseUrl}
                  onChange={(e) => setTradeLicenseUrl(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-300 rounded-lg text-slate-900 bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Kebele Resident ID Card Document URL</label>
                <input
                  type="text"
                  value={kebeleIdUrl}
                  onChange={(e) => setKebeleIdUrl(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-300 rounded-lg text-slate-900 bg-white font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs transition"
                >
                  Proceed to Bank Payout Setup →
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Preferred Disbursal Bank / Mobile Wallet *</label>
                <select
                  value={payoutBank}
                  onChange={(e) => setPayoutBank(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-300 rounded-lg text-slate-900 bg-white font-bold"
                >
                  <option value="TELEBIRR">Telebirr Merchant SuperApp</option>
                  <option value="CBE_BIRR">CBE Birr (Commercial Bank of Ethiopia)</option>
                  <option value="AWASH_BANK">Awash Bank Account</option>
                  <option value="DASHEN_BANK">Dashen Bank Account</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Account / Phone Number for 90% Vendor Payouts *</label>
                <input
                  type="text"
                  required
                  value={payoutAccount}
                  onChange={(e) => setPayoutAccount(e.target.value)}
                  placeholder="+251 91 188 9900 or Account No"
                  className="w-full text-xs p-3 border border-slate-300 rounded-lg text-slate-900 bg-white font-mono font-bold"
                />
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <p className="font-bold text-slate-900">Payout Agreement Notice:</p>
                <p className="text-slate-600">
                  AuraSalon automatically retains 10% platform commission fee on completed online reservations and disburses 90% directly to your designated account.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-100"
                >
                  ← Back to KYC Uploads
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition"
                >
                  Submit KYC for Review
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
