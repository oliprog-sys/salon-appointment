'use client';

import { useState } from 'react';
import { CommissionLedgerItem, PayoutStatus } from '../../types';

interface CommissionLedgersViewProps {
  initialLedgers: CommissionLedgerItem[];
}

export default function CommissionLedgersView({ initialLedgers }: CommissionLedgersViewProps) {
  const [ledgers, setLedgers] = useState<CommissionLedgerItem[]>(initialLedgers);
  const [payoutFilter, setPayoutFilter] = useState<string>('ALL');

  const filtered = ledgers.filter(
    (item) => payoutFilter === 'ALL' || item.payoutStatus === payoutFilter
  );

  const togglePayout = (id: string) => {
    setLedgers((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextStatus: PayoutStatus = item.payoutStatus === 'PAID' ? 'PENDING_PAYOUT' : 'PAID';
        return { ...item, payoutStatus: nextStatus };
      })
    );
  };

  const totalPlatformETB = ledgers.reduce((a, b) => a + b.platformCommissionETB, 0);
  const totalVendorETB = ledgers.reduce((a, b) => a + b.vendorPayoutETB, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-mono font-bold text-slate-500 uppercase">Platform 10% Share</p>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1 font-mono">{totalPlatformETB.toLocaleString()} ETB</p>
          <p className="text-xs text-slate-500 mt-0.5">Retained platform commission</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-mono font-bold text-slate-500 uppercase">Vendor 90% Share</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">{totalVendorETB.toLocaleString()} ETB</p>
          <p className="text-xs text-slate-500 mt-0.5">Disbursed to salon bank accounts</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-mono font-bold text-slate-500 uppercase">Supported Payout Rails</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold rounded">Telebirr</span>
            <span className="px-2 py-0.5 bg-sky-100 text-sky-800 text-[10px] font-mono font-bold rounded">CBE Birr</span>
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-mono font-bold rounded">Awash</span>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-800 text-[10px] font-mono font-bold rounded">Dashen</span>
          </div>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xs font-bold font-mono text-slate-900 uppercase tracking-wider">
            Commission Ledger & Bank Disbursement Queue ({filtered.length})
          </h2>

          <div className="flex items-center gap-2">
            {['ALL', 'PENDING_PAYOUT', 'PAID'].map((st) => (
              <button
                key={st}
                onClick={() => setPayoutFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition ${
                  payoutFilter === st
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-xs font-mono text-slate-700 uppercase">
                <th className="p-3.5 border-r border-slate-200">Booking ID</th>
                <th className="p-3.5">Salon Partner</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Total Amount</th>
                <th className="p-3.5">10% Platform</th>
                <th className="p-3.5">90% Vendor Payout</th>
                <th className="p-3.5">Disbursement Channel</th>
                <th className="p-3.5 text-right">Payout Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="p-3.5 font-mono font-bold text-slate-900 border-r border-slate-200 bg-slate-50/50">
                    {item.bookingId}
                  </td>
                  <td className="p-3.5 font-bold text-slate-900">{item.salonName}</td>
                  <td className="p-3.5 font-medium text-slate-700">{item.customerName}</td>
                  <td className="p-3.5 font-mono font-bold text-slate-900">{item.totalBookingAmountETB.toLocaleString()} ETB</td>
                  <td className="p-3.5 font-mono font-extrabold text-emerald-700">{item.platformCommissionETB.toLocaleString()} ETB</td>
                  <td className="p-3.5 font-mono font-bold text-slate-800">{item.vendorPayoutETB.toLocaleString()} ETB</td>
                  <td className="p-3.5 font-mono font-bold text-sky-700">{item.payoutMethod.replace('_', ' ')}</td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => togglePayout(item.id)}
                      className={`px-3 py-1 text-[10px] font-mono font-bold uppercase rounded-full border transition ${
                        item.payoutStatus === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}
                    >
                      {item.payoutStatus.replace('_', ' ')} (Toggle)
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
