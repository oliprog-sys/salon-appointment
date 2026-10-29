'use client';

import { useState } from 'react';

interface KycResubmissionProps {
  salonName?: string;
  rejectionReason?: string;
  onResubmitSuccess?: () => void;
}

export default function KycResubmission({
  salonName = 'Aura Luxury Lounge',
  rejectionReason = 'Incomplete Commercial Trade License copy uploaded. Please re-scan with readable stamp.',
  onResubmitSuccess
}: KycResubmissionProps) {
  const [newLicenseUrl, setNewLicenseUrl] = useState('');
  const [newTin, setNewTin] = useState('0049281742');

  const handleResubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onResubmitSuccess) onResubmitSuccess();
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="bg-rose-50 border border-rose-300 rounded-2xl p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-rose-600/20 text-rose-700 flex items-center justify-center text-xl font-bold border border-rose-400">
            ⚠️
          </div>
          <div>
            <span className="px-2.5 py-0.5 bg-rose-200 text-rose-900 font-mono text-[10px] font-bold uppercase rounded-full">
              Status: REJECTED BY SUPER ADMIN
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-1">{salonName}</h2>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 text-xs text-rose-900 font-medium">
          <p className="font-bold font-mono text-rose-950 uppercase mb-1">Super Admin Rejection Feedback:</p>
          <p>{rejectionReason}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h3 className="font-bold text-slate-900 text-base font-mono uppercase tracking-wider">
          Resubmit Updated Legal Documents
        </h3>

        <form onSubmit={handleResubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Updated Trade License URL / File *</label>
            <input
              type="text"
              required
              value={newLicenseUrl}
              onChange={(e) => setNewLicenseUrl(e.target.value)}
              placeholder="https://storage.aurasalon.et/docs/updated-license.pdf"
              className="w-full text-xs p-3 border border-slate-300 rounded-lg text-slate-900 bg-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Verified TIN Number *</label>
            <input
              type="text"
              required
              value={newTin}
              onChange={(e) => setNewTin(e.target.value)}
              className="w-full text-xs p-3 border border-slate-300 rounded-lg text-slate-900 bg-white font-mono font-bold"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition"
          >
            Resubmit Application to Super Admin HQ
          </button>
        </form>
      </div>
    </div>
  );
}
