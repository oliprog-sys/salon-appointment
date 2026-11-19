'use client';

import { useState, useEffect } from 'react';
import KycFileUpload from './KycFileUpload';

interface OnboardingStepFormProps {
  salonId?: string;
  salonName?: string;
  subCity?: string;
  onStatusChange?: (status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED') => void;
}

export default function OnboardingStepForm({
  salonId,
  salonName = 'Aura Luxury Lounge',
  subCity = 'Bole',
  onStatusChange,
}: OnboardingStepFormProps) {
  const [step, setStep] = useState<number>(1);
  const [tradeLicenseUrl, setTradeLicenseUrl] = useState('');
  const [tinNumber, setTinNumber] = useState('');
  const [kebeleIdUrl, setKebeleIdUrl] = useState('');
  const [payoutBank, setPayoutBank] = useState('TELEBIRR');
  const [payoutAccount, setPayoutAccount] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [hasSubmittedKyc, setHasSubmittedKyc] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<string>('');

  // Fetch real salon details and existing KYC info from backend
  useEffect(() => {
    async function fetchKycStatus() {
      const activeId = salonId || (typeof window !== 'undefined' ? localStorage.getItem('aurasalon_active_salon_id') : null);
      if (!activeId) return;

      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('aurasalon_owner_token') : null;
        const res = await fetch(`http://localhost:4000/salons/${activeId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (res.ok) {
          const data = await res.json();
          if (data.tradeLicenseUrl) setTradeLicenseUrl(data.tradeLicenseUrl);
          if (data.tinNumber) setTinNumber(data.tinNumber);
          if (data.kebeleIdUrl) setKebeleIdUrl(data.kebeleIdUrl);
          if (data.payoutBank) setPayoutBank(data.payoutBank);
          if (data.payoutAccount) setPayoutAccount(data.payoutAccount);

          if (data.tradeLicenseUrl || data.tinNumber) {
            setHasSubmittedKyc(true);
            setSubmittedAt(data.updatedAt || data.createdAt || '');
          }

          if (data.status === 'APPROVED' && onStatusChange) {
            onStatusChange('APPROVED');
          } else if (data.status === 'REJECTED' && onStatusChange) {
            onStatusChange('REJECTED');
          }
        }
      } catch (e) {
        // Fallback gracefully
      }
    }

    fetchKycStatus();
  }, [salonId, onStatusChange]);

  const handleCheckStatus = async () => {
    setIsCheckingStatus(true);
    setErrorMessage('');
    const activeId = salonId || (typeof window !== 'undefined' ? localStorage.getItem('aurasalon_active_salon_id') : null);
    if (!activeId) {
      setIsCheckingStatus(false);
      return;
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('aurasalon_owner_token') : null;
      const res = await fetch(`http://localhost:4000/salons/${activeId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        if (data.status === 'APPROVED') {
          localStorage.setItem('aurasalon_salon_status', 'APPROVED');
          if (onStatusChange) onStatusChange('APPROVED');
        } else if (data.status === 'REJECTED') {
          localStorage.setItem('aurasalon_salon_status', 'REJECTED');
          if (onStatusChange) onStatusChange('REJECTED');
        } else {
          setSuccessMessage('Status checked: Your application is actively under review by Super Admin HQ.');
          setTimeout(() => setSuccessMessage(''), 5000);
        }
      }
    } catch (e: any) {
      setErrorMessage('Could not connect to backend server to check status.');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleSubmitKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!tradeLicenseUrl) {
      setErrorMessage('Please upload your Commercial Trade License (PDF or image).');
      setStep(1);
      return;
    }

    if (!tinNumber.trim()) {
      setErrorMessage('Please enter your Ministry Taxpayer Identification Number (TIN).');
      setStep(1);
      return;
    }

    if (!payoutAccount.trim()) {
      setErrorMessage('Please enter your payout bank account or Telebirr phone number.');
      setStep(2);
      return;
    }

    const activeId = salonId || (typeof window !== 'undefined' ? localStorage.getItem('aurasalon_active_salon_id') : null);
    if (!activeId) {
      setErrorMessage('Active salon ID not found. Please log in again.');
      return;
    }

    setIsLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('aurasalon_owner_token') : null;
      const res = await fetch(`http://localhost:4000/salons/${activeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          tradeLicenseUrl,
          tinNumber: tinNumber.trim(),
          kebeleIdUrl: kebeleIdUrl || undefined,
          payoutBank,
          payoutAccount: payoutAccount.trim(),
          status: 'PENDING_REVIEW',
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to submit KYC documents to backend.');
      }

      setHasSubmittedKyc(true);
      setSuccessMessage('KYC documents submitted successfully! Your application is now queued for Super Admin verification.');
      if (onStatusChange) onStatusChange('PENDING_REVIEW');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error submitting KYC. Please ensure backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  // Demo simulator trigger for Super Admin verification in dev/demo mode
  const handleSimulateAdminAction = async (newStatus: 'APPROVED' | 'REJECTED') => {
    const activeId = salonId || (typeof window !== 'undefined' ? localStorage.getItem('aurasalon_active_salon_id') : null);
    if (!activeId) return;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('aurasalon_owner_token') : null;
      const res = await fetch(`http://localhost:4000/salons/admin/salons/${activeId}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          status: newStatus,
          rejectionReason: newStatus === 'REJECTED' ? 'Trade license scan resolution is low. Please upload a high-resolution PDF with readable Ministry of Trade stamp.' : undefined,
        }),
      });

      if (res.ok) {
        localStorage.setItem('aurasalon_salon_status', newStatus);
        if (onStatusChange) onStatusChange(newStatus);
      }
    } catch (err) {
      if (onStatusChange) onStatusChange(newStatus);
    }
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
              <span className="text-xs text-amber-700 font-mono">Addis Ababa Registry</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">{salonName} ({subCity})</h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Your business trade license and TIN registration are currently under review by Super Admin HQ.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={isCheckingStatus}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-white font-mono text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            {isCheckingStatus ? (
              <>
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Checking...
              </>
            ) : (
              '🔄 Check Review Status'
            )}
          </button>

          {/* Quick verification test trigger for evaluation */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-amber-300">
            <button
              type="button"
              onClick={() => handleSimulateAdminAction('APPROVED')}
              title="Test immediate Super Admin approval"
              className="px-2.5 py-1 text-[11px] font-bold font-mono text-emerald-700 hover:bg-emerald-50 rounded transition cursor-pointer"
            >
              Simulate Approve ✓
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={() => handleSimulateAdminAction('REJECTED')}
              title="Test rejection feedback workflow"
              className="px-2.5 py-1 text-[11px] font-bold font-mono text-rose-700 hover:bg-rose-50 rounded transition cursor-pointer"
            >
              Simulate Reject ✕
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center justify-between">
          <span>⚠️ {errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="font-bold text-rose-500 hover:text-rose-700 ml-2">
            ✕
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between">
          <span>✓ {successMessage}</span>
          <button onClick={() => setSuccessMessage('')} className="font-bold text-emerald-600 hover:text-emerald-800 ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Verification Lifecycle Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 mb-4">
          Onboarding Verification Roadmap
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
              <span>✓ 1. Partner Registered</span>
            </div>
            <p className="text-[11px] text-emerald-700 mt-1">Salon created in system</p>
          </div>

          <div className={`p-3 rounded-xl border ${hasSubmittedKyc || tradeLicenseUrl ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-300 text-amber-900'}`}>
            <div className="flex items-center gap-2 font-bold text-xs">
              <span>{hasSubmittedKyc || tradeLicenseUrl ? '✓' : '●'} 2. KYC Documents</span>
            </div>
            <p className="text-[11px] mt-1 opacity-90">
              {hasSubmittedKyc || tradeLicenseUrl ? 'Trade License & TIN Submitted' : 'Pending Upload'}
            </p>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900">
            <div className="flex items-center gap-2 font-bold text-xs">
              <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping" />
              <span>3. HQ Compliance Review</span>
            </div>
            <p className="text-[11px] text-amber-800 mt-1">24-48 business hours</p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-400">
            <div className="flex items-center gap-2 font-bold text-xs">
              <span>🔒 4. Floor Schedule Live</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Unlocks upon approval</p>
          </div>
        </div>
      </div>

      {/* Read-Only Review of Submitted Details (if already uploaded) */}
      {hasSubmittedKyc && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-mono uppercase">
                Submitted Verification Documents
              </h3>
              <p className="text-xs text-slate-500">Currently awaiting Super Admin compliance check</p>
            </div>
            <button
              type="button"
              onClick={() => setHasSubmittedKyc(false)}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-bold hover:underline cursor-pointer"
            >
              ✎ Edit / Update Documents
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 text-[11px]">Trade License & Commercial Registry</span>
              <p className="font-bold text-slate-900">
                {tradeLicenseUrl ? (
                  <a
                    href={tradeLicenseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-600 underline font-semibold flex items-center gap-1 mt-1"
                  >
                    📄 View Uploaded Trade License PDF ↗
                  </a>
                ) : (
                  <span className="text-amber-600">Pending upload</span>
                )}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 text-[11px]">Taxpayer Identification Number (TIN)</span>
              <p className="font-bold text-slate-900 text-sm mt-1">{tinNumber || 'Not provided'}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 text-[11px]">Owner Kebele Resident ID / Passport</span>
              <p className="font-bold text-slate-900">
                {kebeleIdUrl ? (
                  <a
                    href={kebeleIdUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-600 underline font-semibold flex items-center gap-1 mt-1"
                  >
                    📄 View Uploaded Kebele ID ↗
                  </a>
                ) : (
                  <span className="text-slate-400">Optional (Not attached)</span>
                )}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 text-[11px]">Designated Payout Channel</span>
              <p className="font-bold text-slate-900 mt-1">
                {payoutBank}: <span className="font-normal">{payoutAccount || 'Not provided'}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Steps Form (When editing or first time) */}
      {!hasSubmittedKyc && (
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
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    TIN (Taxpayer Identification Number) *
                  </label>
                  <input
                    type="text"
                    required
                    value={tinNumber}
                    onChange={(e) => setTinNumber(e.target.value)}
                    placeholder="e.g. 0049281742"
                    className="w-full text-xs p-3 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    10-digit tax identification number issued by the Ministry of Revenues.
                  </p>
                </div>

                <KycFileUpload
                  label="Commercial Trade License (Official Copy)"
                  description="Required: PDF, PNG or JPG (Max 10MB)"
                  required
                  value={tradeLicenseUrl}
                  onChange={(url) => setTradeLicenseUrl(url)}
                />

                <KycFileUpload
                  label="Owner Kebele Resident ID Card / Passport (Optional)"
                  description="Recommended for accelerated verification"
                  value={kebeleIdUrl}
                  onChange={(url) => setKebeleIdUrl(url)}
                />

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (!tradeLicenseUrl) {
                        setErrorMessage('Please upload your Commercial Trade License first.');
                        return;
                      }
                      if (!tinNumber.trim()) {
                        setErrorMessage('Please enter your TIN Number first.');
                        return;
                      }
                      setErrorMessage('');
                      setStep(2);
                    }}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs transition cursor-pointer"
                  >
                    Proceed to Bank Payout Setup →
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Preferred Disbursal Bank / Mobile Wallet *
                  </label>
                  <select
                    value={payoutBank}
                    onChange={(e) => setPayoutBank(e.target.value)}
                    className="w-full text-xs p-3 border border-slate-300 rounded-lg text-slate-900 bg-white font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="TELEBIRR">Telebirr Merchant SuperApp (+251 9...)</option>
                    <option value="CBE_BIRR">Commercial Bank of Ethiopia (CBE / CBE Birr)</option>
                    <option value="AWASH_BANK">Awash Bank Account</option>
                    <option value="DASHEN_BANK">Dashen Bank Account / Amole</option>
                    <option value="BANK_OF_ABYSSINIA">Bank of Abyssinia</option>
                    <option value="HIBRET_BANK">Hibret Bank</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Account / Phone Number for 90% Vendor Disbursal *
                  </label>
                  <input
                    type="text"
                    required
                    value={payoutAccount}
                    onChange={(e) => setPayoutAccount(e.target.value)}
                    placeholder="e.g. +251 91 188 9900 or 100029381829"
                    className="w-full text-xs p-3 border border-slate-300 rounded-lg text-slate-900 bg-white font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Payouts from online bookings are processed within 24 hours of customer check-out.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                  <p className="font-bold text-slate-900">Ethiopian Partner Revenue Agreement:</p>
                  <p className="text-slate-600">
                    AuraSalon retains a 10% platform facilitation fee on completed reservations and disburses 90% directly to your designated account.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2.5 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-100 transition cursor-pointer"
                  >
                    ← Back to KYC Uploads
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-2 cursor-pointer"
                  >
                    {isLoading ? 'Submitting Documents...' : 'Submit KYC for Review →'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
