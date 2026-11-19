'use client';

import { useState } from 'react';
import KycFileUpload from './KycFileUpload';

interface KycResubmissionProps {
  salonId?: string;
  salonName?: string;
  rejectionReason?: string;
  onResubmitSuccess?: () => void;
}

export default function KycResubmission({
  salonId,
  salonName = 'Aura Luxury Lounge',
  rejectionReason = 'Incomplete or unreadable Commercial Trade License scan uploaded.',
  onResubmitSuccess,
}: KycResubmissionProps) {
  const [newLicenseUrl, setNewLicenseUrl] = useState('');
  const [newTin, setNewTin] = useState('');
  const [newKebeleIdUrl, setNewKebeleIdUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleResubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!newLicenseUrl) {
      setErrorMessage('Please upload the updated Trade License document (PDF or image).');
      return;
    }

    const activeId = salonId || (typeof window !== 'undefined' ? localStorage.getItem('aurasalon_active_salon_id') : null);
    if (!activeId) {
      setErrorMessage('Active salon session not found. Please log in again.');
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
          tradeLicenseUrl: newLicenseUrl,
          ...(newTin.trim() ? { tinNumber: newTin.trim() } : {}),
          ...(newKebeleIdUrl ? { kebeleIdUrl: newKebeleIdUrl } : {}),
          status: 'PENDING_REVIEW',
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to resubmit KYC documents to backend.');
      }

      localStorage.setItem('aurasalon_salon_status', 'PENDING_REVIEW');
      if (onResubmitSuccess) onResubmitSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error occurred during resubmission. Please check server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Rejection Alert Banner */}
      <div className="bg-rose-50 border border-rose-300 rounded-2xl p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-rose-600/20 text-rose-700 flex items-center justify-center text-xl font-bold border border-rose-400">
            ⚠️
          </div>
          <div>
            <span className="px-2.5 py-0.5 bg-rose-200 text-rose-900 font-mono text-[10px] font-bold uppercase rounded-full">
              Status: ACTION REQUIRED (KYC REJECTED)
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-1">{salonName}</h2>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 text-xs text-rose-900 font-medium">
          <p className="font-bold font-mono text-rose-950 uppercase mb-1">Super Admin Rejection Feedback:</p>
          <p className="text-slate-700 leading-relaxed">{rejectionReason}</p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center justify-between">
          <span>⚠️ {errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="font-bold text-rose-500 hover:text-rose-700 ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Resubmission Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div>
          <h3 className="font-bold text-slate-900 text-base font-mono uppercase tracking-wider">
            Resubmit Updated Legal Documents
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload the corrected documents addressing the reviewer's feedback above.
          </p>
        </div>

        <form onSubmit={handleResubmit} className="space-y-4">
          <KycFileUpload
            label="Updated Commercial Trade License (High Resolution Scan)"
            description="Required: Official Ministry of Trade copy with clear stamp"
            required
            value={newLicenseUrl}
            onChange={(url) => setNewLicenseUrl(url)}
          />

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Corrected TIN Number (Optional if already accurate)
            </label>
            <input
              type="text"
              value={newTin}
              onChange={(e) => setNewTin(e.target.value)}
              placeholder="e.g. 0049281742"
              className="w-full text-xs p-3 border border-slate-300 rounded-lg text-slate-900 bg-white font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <KycFileUpload
            label="Additional Supporting Document (Kebele ID / Power of Attorney)"
            description="Optional: Attach if requested by Super Admin"
            value={newKebeleIdUrl}
            onChange={(url) => setNewKebeleIdUrl(url)}
          />

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Note to Reviewer (Optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Re-scanned the trade license in 300 DPI showing both pages and official stamp."
              className="w-full text-xs p-3 border border-slate-300 rounded-lg text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? 'Uploading & Resubmitting...' : 'Resubmit KYC Application to Super Admin HQ →'}
          </button>
        </form>
      </div>
    </div>
  );
}
