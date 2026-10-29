'use client';

import { useState } from 'react';

export default function MarketingDashboard() {
  const [promos, setPromos] = useState([
    {
      id: 'p-1',
      code: 'NEWYEAR20',
      title: 'Ethiopian New Year Special 20% Off',
      discount: '20% OFF',
      validUntil: '2026-10-30',
      active: true,
      uses: 42
    },
    {
      id: 'p-2',
      code: 'AURAEXECUTIVE',
      title: 'Barber & Spa Bundle VIP Discount',
      discount: '300 ETB OFF',
      validUntil: '2026-11-15',
      active: true,
      uses: 19
    }
  ]);

  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [discount, setDiscount] = useState('');

  const handleCreatePromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !title) return;

    setPromos([
      ...promos,
      {
        id: `p-${Date.now()}`,
        code: code.toUpperCase(),
        title,
        discount: discount || '15% OFF',
        validUntil: '2026-12-31',
        active: true,
        uses: 0
      }
    ]);

    setCode('');
    setTitle('');
    setDiscount('');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Featured Banner Settings Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-xl border border-slate-700 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold uppercase rounded border border-emerald-500/30">
            Featured Partner Listing
          </span>
          <h2 className="text-xl font-bold mt-2">Aura Lounge & Spa — Bole Medhanialem</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Your salon is currently highlighted as a **Top Verified Sanctuary** on the AuraSalon Customer App in Addis Ababa.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right font-mono">
            <p className="text-xs text-slate-400">Monthly Impressions</p>
            <p className="text-xl font-extrabold text-emerald-400">14,280 Views</p>
          </div>
        </div>
      </div>

      {/* Promos & Discounts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Promo Form */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm font-mono uppercase tracking-wider">
            Create Promo Campaign
          </h3>

          <form onSubmit={handleCreatePromo} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Promo Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. VIPSILK2026"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:outline-none focus:border-indigo-500 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Campaign Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Weekend Silk Press Deal"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Discount Amount</label>
              <input
                type="text"
                placeholder="e.g. 200 ETB OFF or 15% OFF"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-xs transition"
            >
              Launch Campaign
            </button>
          </form>
        </div>

        {/* Promo Codes List */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-xs font-mono uppercase tracking-wider">
              Active Promo Codes
            </h3>
            <span className="text-xs text-slate-500 font-mono">{promos.length} Campaigns</span>
          </div>

          <div className="divide-y divide-slate-200">
            {promos.map((p) => (
              <div key={p.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-mono font-bold text-xs rounded border border-indigo-200">
                      {p.code}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{p.title}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Discount: <span className="font-semibold text-slate-800">{p.discount}</span> | Valid until {p.validUntil}
                  </p>
                </div>

                <div className="text-right font-mono">
                  <p className="text-xs text-slate-400">Total Redemptions</p>
                  <p className="text-base font-extrabold text-slate-900">{p.uses} uses</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
