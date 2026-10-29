'use client';

import { useState } from 'react';
import { ServiceOffering } from '../../types';

interface ServicesConfiguratorProps {
  initialServices: ServiceOffering[];
}

export default function ServicesConfigurator({ initialServices }: ServicesConfiguratorProps) {
  const [services, setServices] = useState<ServiceOffering[]>(initialServices);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'HAIR' | 'NAILS' | 'SPA' | 'BARBER'>('HAIR');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [priceETB, setPriceETB] = useState(1000);
  const [description, setDescription] = useState('');

  const filteredServices = services.filter((srv) => {
    if (selectedCategory !== 'ALL' && srv.category !== selectedCategory) return false;
    if (searchQuery && !srv.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const toggleStatus = (id: string) => {
    setServices((prev) =>
      prev.map((srv) => (srv.id === id ? { ...srv, isActive: !srv.isActive } : srv))
    );
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newSrv: ServiceOffering = {
      id: `srv-${Date.now()}`,
      name: name.trim(),
      category,
      durationMinutes: Number(durationMinutes),
      priceETB: Number(priceETB),
      description: description.trim(),
      isActive: true,
      assignedStaffIds: []
    };

    setServices([newSrv, ...services]);
    setIsModalOpen(false);
    setName('');
    setDescription('');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-mono font-bold text-slate-500 uppercase">Total Offerings</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">{services.length} Services</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Active across 4 main categories</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-mono font-bold text-slate-500 uppercase">Active Menu Items</p>
          <p className="text-2xl font-extrabold text-emerald-600 font-mono mt-1">
            {services.filter((s) => s.isActive).length} Active
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Available for online client booking</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-mono font-bold text-slate-500 uppercase">Average Ticket</p>
          <p className="text-2xl font-extrabold text-indigo-600 font-mono mt-1">
            {Math.round(services.reduce((a, b) => a + b.priceETB, 0) / (services.length || 1))} ETB
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Per treatment session</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'HAIR', 'NAILS', 'SPA', 'BARBER'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search service name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48 sm:w-64 font-medium"
            />
            <svg
              className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-1.5"
          >
            + Add New Service
          </button>
        </div>
      </div>

      {/* Services Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map((srv) => (
          <div
            key={srv.id}
            className={`bg-white rounded-xl border transition-all p-5 flex flex-col justify-between shadow-xs ${
              srv.isActive ? 'border-slate-200 hover:border-slate-300' : 'border-slate-200 bg-slate-50/70 opacity-75'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-mono font-bold uppercase rounded border border-slate-200">
                  {srv.category}
                </span>
                <button
                  onClick={() => toggleStatus(srv.id)}
                  className={`px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full transition ${
                    srv.isActive
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {srv.isActive ? 'Active' : 'Disabled'}
                </button>
              </div>

              <h3 className="font-bold text-slate-900 text-base leading-snug">{srv.name}</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{srv.description}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-mono">Duration: </span>
                <span className="text-xs font-semibold text-slate-700 font-mono">{srv.durationMinutes} mins</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-extrabold text-slate-900 font-mono">{srv.priceETB.toLocaleString()}</span>
                <span className="text-xs text-slate-500 font-mono ml-1">ETB</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Service Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white">Add New Service Offering</h3>
                <p className="text-xs text-slate-400">Configure catalog details & price in ETB</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddService} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Service Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Organic Herbal Head Massage"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="HAIR">HAIR</option>
                    <option value="NAILS">NAILS</option>
                    <option value="SPA">SPA</option>
                    <option value="BARBER">BARBER</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    min={15}
                    step={15}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Price (ETB) *</label>
                <input
                  type="number"
                  required
                  min={100}
                  step={50}
                  value={priceETB}
                  onChange={(e) => setPriceETB(Number(e.target.value))}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Briefly describe what this service includes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
