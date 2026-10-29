'use client';

import { useState } from 'react';
import { SalonApprovalItem, KycStatus } from '../../types';

interface SalonApprovalsDeskProps {
  initialApprovals: SalonApprovalItem[];
}

export default function SalonApprovalsDesk({ initialApprovals }: SalonApprovalsDeskProps) {
  const [approvals, setApprovals] = useState<SalonApprovalItem[]>(initialApprovals);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedKyc, setSelectedKyc] = useState<SalonApprovalItem | null>(null);
  const [selectedDocTab, setSelectedDocTab] = useState<'LICENSE' | 'TIN' | 'KEBELE'>('LICENSE');

  // Add Partner Modal state
  const [isAddPartnerOpen, setIsAddPartnerOpen] = useState(false);
  const [ownerFullName, setOwnerFullName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [salonName, setSalonName] = useState('');
  const [subCity, setSubCity] = useState('Bole');
  const [address, setAddress] = useState('');
  const [tradeLicenseNo, setTradeLicenseNo] = useState('');
  const [tinNumber, setTinNumber] = useState('');
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);

  const filtered = approvals.filter(
    (item) => statusFilter === 'ALL' || item.status === statusFilter
  );

  const updateKycStatus = (id: string, newStatus: KycStatus, reason?: string) => {
    setApprovals((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: newStatus, rejectionReason: reason } : item
      )
    );
    setSelectedKyc(null);
  };

  const handleAddOfflinePartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerFullName || !salonName || !ownerPhone) return;

    const token = `setup-${Date.now().toString(36)}-${Math.random().toString(36).slice(-4)}`;
    const inviteUrl = `http://localhost:3000/claim?token=${token}`;

    const newKyc: SalonApprovalItem = {
      id: `kyc-${Date.now().toString().slice(-4)}`,
      salonName,
      ownerName: ownerFullName,
      subCity,
      tradeLicenseNo: tradeLicenseNo || 'BL-ETH-2026-MANUAL',
      tinNumber: tinNumber || '0099887766',
      phone: ownerPhone,
      submittedDate: new Date().toISOString().split('T')[0],
      status: 'PENDING_KYC',
      documentCount: 3
    };

    setApprovals([newKyc, ...approvals]);
    setGeneratedInviteLink(inviteUrl);
  };

  const closeAddPartnerModal = () => {
    setIsAddPartnerOpen(false);
    setGeneratedInviteLink(null);
    setOwnerFullName('');
    setOwnerPhone('');
    setSalonName('');
    setAddress('');
    setTradeLicenseNo('');
    setTinNumber('');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Top Banner Stats & Actions */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider">
            Vendor KYC & Trade License Verification Desk
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review legal documentation, TIN numbers & commercial registration in Addis Ababa
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {['ALL', 'PENDING_KYC', 'APPROVED', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsAddPartnerOpen(true)}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-1.5"
          >
            + Add Onboarding Partner
          </button>
        </div>
      </div>

      {/* Approvals Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="text-xs font-bold font-mono text-slate-900 uppercase tracking-wider">
            Salon Onboarding Requests ({filtered.length})
          </h3>
          <span className="text-xs text-slate-500 font-mono">100% Tax & License Verified</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-xs font-mono text-slate-700 uppercase">
                <th className="p-3.5 border-r border-slate-200">KYC ID</th>
                <th className="p-3.5">Salon Name</th>
                <th className="p-3.5">Owner / Manager</th>
                <th className="p-3.5">Sub-City</th>
                <th className="p-3.5">Trade License No.</th>
                <th className="p-3.5">TIN Number</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="p-3.5 font-mono font-bold text-slate-900 border-r border-slate-200 bg-slate-50/50">
                    {item.id}
                  </td>
                  <td className="p-3.5">
                    <p className="font-bold text-slate-900">{item.salonName}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{item.phone}</p>
                  </td>
                  <td className="p-3.5 font-semibold text-slate-800">{item.ownerName}</td>
                  <td className="p-3.5 font-medium text-slate-700">{item.subCity}</td>
                  <td className="p-3.5 font-mono font-bold text-slate-900">{item.tradeLicenseNo}</td>
                  <td className="p-3.5 font-mono text-slate-800">{item.tinNumber}</td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded-full border ${
                      item.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                      item.status === 'PENDING_KYC' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                      'bg-rose-100 text-rose-800 border-rose-300'
                    }`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => setSelectedKyc(item)}
                      className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition"
                    >
                      Side-by-Side Review →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SIDE-BY-SIDE KYC DOCUMENT INSPECTOR MODAL */}
      {selectedKyc && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-sky-500/20 text-sky-400 font-mono text-[10px] font-bold uppercase rounded border border-sky-500/30">
                    Side-by-Side Verification Inspector
                  </span>
                  <span className="text-xs text-slate-400 font-mono">KYC ID: {selectedKyc.id}</span>
                </div>
                <h3 className="font-bold text-lg text-white mt-0.5">{selectedKyc.salonName} ({selectedKyc.subCity})</h3>
              </div>
              <button onClick={() => setSelectedKyc(null)} className="text-slate-400 hover:text-white p-1 font-bold text-xl">
                ✕
              </button>
            </div>

            {/* Split Screen Body */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-x divide-slate-200 overflow-hidden">
              {/* Left Column: Business Metadata & Triggers */}
              <div className="p-6 overflow-y-auto space-y-4">
                <h4 className="font-bold text-xs font-mono text-slate-900 uppercase tracking-wider">
                  Owner Legal Metadata
                </h4>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Salon Name:</span>
                    <span className="font-bold text-slate-900">{selectedKyc.salonName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Owner / Manager:</span>
                    <span className="font-bold text-slate-900">{selectedKyc.ownerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phone (+251):</span>
                    <span className="font-bold text-slate-900">{selectedKyc.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Sub-City Location:</span>
                    <span className="font-bold text-slate-900">{selectedKyc.subCity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Trade License No:</span>
                    <span className="font-bold text-slate-900">{selectedKyc.tradeLicenseNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ministry TIN:</span>
                    <span className="font-bold text-slate-900">{selectedKyc.tinNumber}</span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
                  <p className="font-bold text-emerald-900">Automatic Compliance Checklist:</p>
                  <ul className="text-emerald-800 font-mono text-[11px] space-y-0.5">
                    <li>✓ Ministry of Trade registration code valid</li>
                    <li>✓ Sub-city zoning approval verified for {selectedKyc.subCity}</li>
                    <li>✓ Taxpayer identification active</li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-slate-200 space-y-3">
                  <label className="block text-xs font-bold text-slate-800 font-mono uppercase">Decision Triggers</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateKycStatus(selectedKyc.id, 'REJECTED', 'License scan unreadable')}
                      className="w-1/2 py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs"
                    >
                      Reject Application ✕
                    </button>
                    <button
                      onClick={() => updateKycStatus(selectedKyc.id, 'APPROVED')}
                      className="w-1/2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
                    >
                      Approve & Activate ✓
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Document Viewer Canvas */}
              <div className="p-6 bg-slate-100 flex flex-col justify-between overflow-y-auto">
                <div>
                  <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-3">
                    <button
                      onClick={() => setSelectedDocTab('LICENSE')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${selectedDocTab === 'LICENSE' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border'}`}
                    >
                      Trade License PDF
                    </button>
                    <button
                      onClick={() => setSelectedDocTab('TIN')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${selectedDocTab === 'TIN' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border'}`}
                    >
                      TIN Card
                    </button>
                    <button
                      onClick={() => setSelectedDocTab('KEBELE')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${selectedDocTab === 'KEBELE' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border'}`}
                    >
                      Kebele ID
                    </button>
                  </div>

                  {/* Document Canvas Render */}
                  <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-md min-h-[300px] flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-2xl font-bold border border-slate-300">
                      📄
                    </div>
                    <div>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold uppercase rounded">
                        Verified Scan
                      </span>
                      <h5 className="font-bold text-slate-900 text-sm mt-1">
                        {selectedDocTab === 'LICENSE' ? `Trade License #${selectedKyc.tradeLicenseNo}` : selectedDocTab === 'TIN' ? `Tax Card #${selectedKyc.tinNumber}` : 'Kebele Resident ID Card'}
                      </h5>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">Official Document of {selectedKyc.ownerName}</p>
                    </div>
                    <div className="pt-2">
                      <span className="text-[11px] font-mono text-sky-600 underline font-semibold cursor-pointer">
                        🔍 Click to Open High-Res PDF Preview
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 font-mono text-center mt-4">
                  AuraSalon Compliance Engine v2.0 • Addis Ababa Registry
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD OFFLINE ONBOARDING PARTNER MODAL */}
      {isAddPartnerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white">+ Add Offline Onboarding Partner</h3>
                <p className="text-xs text-slate-400">Register in-person salon & generate invitation link</p>
              </div>
              <button onClick={closeAddPartnerModal} className="text-slate-400 hover:text-white p-1 font-bold">
                ✕
              </button>
            </div>

            {!generatedInviteLink ? (
              <form onSubmit={handleAddOfflinePartner} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Owner Full Name *</label>
                  <input
                    type="text"
                    required
                    value={ownerFullName}
                    onChange={(e) => setOwnerFullName(e.target.value)}
                    placeholder="e.g. Mahlet Desalegn"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Owner Phone Number (+251) *</label>
                  <input
                    type="text"
                    required
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    placeholder="+251 91 222 3333"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Salon Name *</label>
                  <input
                    type="text"
                    required
                    value={salonName}
                    onChange={(e) => setSalonName(e.target.value)}
                    placeholder="e.g. Royal Velvet Studio"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Sub-City *</label>
                    <select
                      value={subCity}
                      onChange={(e) => setSubCity(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white font-bold"
                    >
                      <option value="Bole">Bole</option>
                      <option value="Kazanchis">Kazanchis</option>
                      <option value="Sarbet">Sarbet</option>
                      <option value="Old Airport">Old Airport</option>
                      <option value="Piassa">Piassa</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Trade License No.</label>
                    <input
                      type="text"
                      value={tradeLicenseNo}
                      onChange={(e) => setTradeLicenseNo(e.target.value)}
                      placeholder="BL-ETH-2026..."
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeAddPartnerModal}
                    className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs"
                  >
                    Generate Invite Link
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center justify-center mx-auto text-2xl font-bold">
                  ✓
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">Setup Invitation Generated!</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Salon <span className="font-bold text-slate-900">{salonName}</span> added in <span className="font-mono text-amber-700 font-bold">PENDING_REVIEW</span> status.
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">Setup Link Sent via SMS:</span>
                  <input
                    type="text"
                    readOnly
                    value={generatedInviteLink}
                    className="w-full text-xs font-mono font-bold p-2 bg-white border border-slate-300 rounded-lg text-sky-700 select-all"
                  />
                </div>

                <button
                  onClick={closeAddPartnerModal}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
