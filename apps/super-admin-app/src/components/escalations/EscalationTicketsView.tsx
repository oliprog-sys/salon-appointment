'use client';

import { useState } from 'react';
import { EscalationTicket } from '../../types';

interface EscalationTicketsViewProps {
  initialEscalations: EscalationTicket[];
}

export default function EscalationTicketsView({ initialEscalations }: EscalationTicketsViewProps) {
  const [escalations, setEscalations] = useState<EscalationTicket[]>(initialEscalations);

  const resolveTicket = (id: string) => {
    setEscalations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'RESOLVED' } : item))
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider">
            Customer Dispute & Refund Escalation Desk
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor open disputes, no-show claims, and process customer refunds
          </p>
        </div>

        <span className="px-3 py-1 bg-rose-50 text-rose-800 text-xs font-mono font-bold rounded-lg border border-rose-200">
          {escalations.filter((e) => e.status !== 'RESOLVED').length} Active Disputes
        </span>
      </div>

      {/* Escalations Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="text-xs font-bold font-mono text-slate-900 uppercase tracking-wider">
            Dispute Queue ({escalations.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-xs font-mono text-slate-700 uppercase">
                <th className="p-3.5 border-r border-slate-200">Ticket ID</th>
                <th className="p-3.5">Customer Name</th>
                <th className="p-3.5">Salon Partner</th>
                <th className="p-3.5">Dispute Type</th>
                <th className="p-3.5">Disputed Amount</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Resolution Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {escalations.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="p-3.5 font-mono font-bold text-slate-900 border-r border-slate-200 bg-slate-50/50">
                    {item.id}
                  </td>
                  <td className="p-3.5">
                    <p className="font-bold text-slate-900">{item.customerName}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{item.customerPhone}</p>
                  </td>
                  <td className="p-3.5 font-semibold text-slate-800">{item.salonName}</td>
                  <td className="p-3.5 font-mono font-bold text-rose-700">{item.issueType.replace('_', ' ')}</td>
                  <td className="p-3.5 font-mono font-extrabold text-slate-900">{item.amountETB.toLocaleString()} ETB</td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded-full border ${
                      item.status === 'RESOLVED'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : item.status === 'IN_REVIEW'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-rose-100 text-rose-800 border-rose-300'
                    }`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    {item.status !== 'RESOLVED' ? (
                      <button
                        onClick={() => resolveTicket(item.id)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition"
                      >
                        Resolve Dispute
                      </button>
                    ) : (
                      <span className="text-slate-400 font-mono text-[11px]">Completed</span>
                    )}
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
