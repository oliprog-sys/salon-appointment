'use client';

import { useState } from 'react';
import { StaffMember } from '../../types';

interface StaffDirectoryProps {
  initialStaff: StaffMember[];
}

export default function StaffDirectory({ initialStaff }: StaffDirectoryProps) {
  const [staffList, setStaffList] = useState<StaffMember[]>(initialStaff);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New staff form state
  const [name, setName] = useState('');
  const [role, setRole] = useState('Hair Stylist');
  const [phone, setPhone] = useState('');
  const [specialties, setSpecialties] = useState('Hair Styling, Silk Press');

  const toggleStatus = (id: string) => {
    setStaffList((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const nextStatus =
          s.status === 'ON_SHIFT' ? 'ON_BREAK' : s.status === 'ON_BREAK' ? 'OFF_DUTY' : 'ON_SHIFT';
        return { ...s, status: nextStatus };
      })
    );
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newStaff: StaffMember = {
      id: `st-${Date.now()}`,
      name: name.trim(),
      role,
      avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      phone: phone.trim() || '+251 91 000 0000',
      specialties: specialties.split(',').map((s) => s.trim()),
      workingHours: '09:00 AM - 06:00 PM',
      status: 'ON_SHIFT',
      rating: 5.0,
      totalBookingsToday: 0
    };

    setStaffList([...staffList, newStaff]);
    setIsModalOpen(false);
    setName('');
    setPhone('');
  };

  const getStatusBadge = (status: StaffMember['status']) => {
    switch (status) {
      case 'ON_SHIFT':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'ON_BREAK':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'OFF_DUTY':
        return 'bg-slate-200 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Top Banner & Stats */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider">
            Staff Roster & Duty Shifts
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {staffList.filter((s) => s.status === 'ON_SHIFT').length} of {staffList.length} specialists active on duty today.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-2"
        >
          + Add Staff Member
        </button>
      </div>

      {/* Staff Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {staffList.map((st) => (
          <div
            key={st.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={st.avatarUrl}
                  alt={st.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-slate-200"
                />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{st.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">{st.role}</p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">{st.phone}</p>
                </div>
              </div>

              <button
                onClick={() => toggleStatus(st.id)}
                className={`px-3 py-1 text-[11px] font-mono font-bold uppercase rounded-full border transition ${getStatusBadge(
                  st.status
                )}`}
              >
                {st.status.replace('_', ' ')}
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 font-mono text-[11px]">Shift Hours:</span>
                <p className="font-semibold text-slate-800 font-mono">{st.workingHours}</p>
              </div>
              <div>
                <span className="text-slate-400 font-mono text-[11px]">Today's Bookings:</span>
                <p className="font-semibold text-slate-800 font-mono">{st.totalBookingsToday} clients</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {st.specialties.map((spec) => (
                <span
                  key={spec}
                  className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-medium rounded border border-slate-200"
                >
                  {spec}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white">Add Staff Member</h3>
                <p className="text-xs text-slate-400">Register a new specialist or stylist</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mahlet Desalegn"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Role Title</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Lash & Brows Specialist"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Phone Number (+251)</label>
                <input
                  type="text"
                  placeholder="+251 91 222 3333"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Specialties (Comma Separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Microblading, Lash Lift, Tinting"
                  value={specialties}
                  onChange={(e) => setSpecialties(e.target.value)}
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
                  Save Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
