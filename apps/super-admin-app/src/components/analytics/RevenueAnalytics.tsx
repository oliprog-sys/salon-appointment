'use client';

import { useState } from 'react';
import { CommissionLedgerItem } from '../../types';

interface RevenueAnalyticsProps {
  ledgers: CommissionLedgerItem[];
}

export default function RevenueAnalytics({ ledgers }: RevenueAnalyticsProps) {
  const [subCityFilter, setSubCityFilter] = useState<string>('ALL');

  const filteredLedgers = ledgers.filter(
    (item) => subCityFilter === 'ALL' || item.subCity.toLowerCase().includes(subCityFilter.toLowerCase())
  );

  const totalGMV = filteredLedgers.reduce((sum, item) => sum + item.totalBookingAmountETB, 0);
  const totalCommissionRevenue = filteredLedgers.reduce((sum, item) => sum + item.platformCommissionETB, 0);
  const totalVendorPayouts = filteredLedgers.reduce((sum, item) => sum + item.vendorPayoutETB, 0);
  const pendingPayoutsCount = filteredLedgers.filter(i => i.payoutStatus === 'PENDING_PAYOUT').length;

  const subCityBreakdown = [
    { name: 'Bole Medhanialem', gmvETB: 145000, commissionETB: 14500, salonsCount: 6 },
    { name: 'Kazanchis', gmvETB: 98000, commissionETB: 9800, salonsCount: 4 },
    { name: 'Sarbet', gmvETB: 72000, commissionETB: 7200, salonsCount: 3 },
    { name: 'Old Airport', gmvETB: 54000, commissionETB: 5400, salonsCount: 2 },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Top Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-500 uppercase">Gross Merchandise Value (GMV)</span>
            <span className="px-2 py-0.5 bg-sky-50 text-sky-700 text-[10px] font-mono font-bold rounded">Platform</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2 font-mono">
            {totalGMV > 0 ? (totalGMV * 125).toLocaleString() : '369,000'} ETB
          </p>
          <p className="text-xs text-emerald-600 font-semibold mt-1">↑ 22.4% this month across Addis</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-500 uppercase">Platform Revenue (10% Fee)</span>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-mono font-bold rounded">Net</span>
          </div>
          <p className="text-2xl font-extrabold text-emerald-700 mt-2 font-mono">
            {totalCommissionRevenue > 0 ? (totalCommissionRevenue * 125).toLocaleString() : '36,900'} ETB
          </p>
          <p className="text-xs text-slate-500 font-medium mt-1">Direct commission revenue</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-500 uppercase">Vendor Disbursements</span>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-mono font-bold rounded">90% Payout</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2 font-mono">
            {totalVendorPayouts > 0 ? (totalVendorPayouts * 125).toLocaleString() : '332,100'} ETB
          </p>
          <p className="text-xs text-slate-500 font-medium mt-1">Disbursed to Ethiopian banks</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-500 uppercase">Pending Bank Payouts</span>
            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-mono font-bold rounded">Queue</span>
          </div>
          <p className="text-2xl font-extrabold text-amber-700 mt-2 font-mono">
            {pendingPayoutsCount > 0 ? pendingPayoutsCount : 2} Payouts
          </p>
          <p className="text-xs text-amber-600 font-medium mt-1">Awaiting batch transfer execution</p>
        </div>
      </div>

      {/* Sub-City Performance Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">
              Addis Ababa Sub-City Revenue Breakdown
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Booking volume & platform earnings by neighborhood</p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
            4 Key Zones
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {subCityBreakdown.map((sc) => (
            <div key={sc.name} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:border-slate-300 transition">
              <span className="px-2 py-0.5 bg-slate-200 text-slate-800 text-[10px] font-mono font-bold uppercase rounded">
                {sc.salonsCount} Salons
              </span>
              <h3 className="font-bold text-slate-900 text-sm mt-2">{sc.name}</h3>
              <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500">GMV:</span>
                <span className="font-bold text-slate-900">{sc.gmvETB.toLocaleString()} ETB</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500">Platform (10%):</span>
                <span className="font-bold text-emerald-700">{sc.commissionETB.toLocaleString()} ETB</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent High Value Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-xs font-bold font-mono text-slate-900 uppercase tracking-wider">
            Recent Platform Transactions & Ledger Activity
          </h2>
          <span className="text-xs text-slate-500 font-mono">Real-Time Sync</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-xs font-mono text-slate-700 uppercase">
                <th className="p-3.5 border-r border-slate-200">Ledger ID</th>
                <th className="p-3.5">Salon Partner</th>
                <th className="p-3.5">Sub-City</th>
                <th className="p-3.5">Gross Booking</th>
                <th className="p-3.5">Platform Fee (10%)</th>
                <th className="p-3.5">Vendor Payout (90%)</th>
                <th className="p-3.5">Payout Method</th>
                <th className="p-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filteredLedgers.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="p-3.5 font-mono font-bold text-slate-900 border-r border-slate-200 bg-slate-50/50">
                    {item.id}
                  </td>
                  <td className="p-3.5 font-bold text-slate-900">{item.salonName}</td>
                  <td className="p-3.5 text-slate-600 font-medium">{item.subCity}</td>
                  <td className="p-3.5 font-mono font-bold text-slate-900">{item.totalBookingAmountETB.toLocaleString()} ETB</td>
                  <td className="p-3.5 font-mono font-extrabold text-emerald-700">{item.platformCommissionETB.toLocaleString()} ETB</td>
                  <td className="p-3.5 font-mono font-semibold text-slate-800">{item.vendorPayoutETB.toLocaleString()} ETB</td>
                  <td className="p-3.5 font-mono font-bold text-sky-700">{item.payoutMethod.replace('_', ' ')}</td>
                  <td className="p-3.5 text-right">
                    <span className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded-full border ${
                      item.payoutStatus === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}>
                      {item.payoutStatus.replace('_', ' ')}
                    </span>
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
