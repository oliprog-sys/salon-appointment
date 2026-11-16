'use client';

import { useState, useEffect } from 'react';
import { StaffMember } from '../../types';

interface StaffDirectoryProps {
  initialStaff: StaffMember[];
  activeSalonId?: string;
  salonName?: string;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
];

export default function StaffDirectory({
  initialStaff,
  activeSalonId,
  salonName,
}: StaffDirectoryProps) {
  const [staffList, setStaffList] = useState<StaffMember[]>(initialStaff);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Synchronize when initialStaff prop changes from parent
  useEffect(() => {
    setStaffList(initialStaff);
  }, [initialStaff]);

  // New staff form state
  const [name, setName] = useState('');
  const [role, setRole] = useState('Hair Stylist & Specialist');
  const [phone, setPhone] = useState('');
  const [specialties, setSpecialties] = useState('Hair Care, Silk Press');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const targetSalonId =
        activeSalonId ||
        (typeof window !== 'undefined' ? localStorage.getItem('aurasalon_active_salon_id') : '') ||
        '';

      const token = typeof window !== 'undefined' ? localStorage.getItem('aurasalon_owner_token') : null;

      let createdStaffId = `st-${Date.now()}`;
      let createdName = name.trim();
      let createdRole = role.trim() || 'Staff Specialist';
      let createdAvatar = selectedAvatar;
      let createdPhone = phone.trim() || '+251 91 000 0000';

      if (targetSalonId) {
        try {
          const res = await fetch(`http://localhost:4000/salons/${targetSalonId}/staff`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              name: name.trim(),
              title: role.trim() || 'Staff Specialist',
              phoneNumber: phone.trim() || undefined,
              avatarUrl: selectedAvatar,
              bio: specialties.trim(),
              isAvailable: true,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.id) createdStaffId = data.id;
            if (data.user?.fullName) createdName = data.user.fullName;
            if (data.title) createdRole = data.title;
            if (data.user?.avatarUrl) createdAvatar = data.user.avatarUrl;
            if (data.user?.phoneNumber) createdPhone = data.user.phoneNumber;
          }
        } catch (apiErr) {
          console.warn('Backend staff sync warning (fallback to local state):', apiErr);
        }
      }

      const newStaff: StaffMember = {
        id: createdStaffId,
        name: createdName,
        role: createdRole,
        avatarUrl: createdAvatar,
        phone: createdPhone,
        specialties: specialties.split(',').map((s) => s.trim()).filter(Boolean),
        workingHours: '08:30 AM - 05:30 PM',
        status: 'ON_SHIFT',
        rating: 5.0,
        totalBookingsToday: 0,
      };

      setStaffList((prev) => [...prev, newStaff]);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('aurasalon_staff_changed'));
      }
      setIsModalOpen(false);
      setName('');
      setPhone('');
      setRole('Hair Stylist & Specialist');
    } catch (err) {
      console.error('Error adding staff member:', err);
    } finally {
      setIsSubmitting(false);
    }
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
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider">
              Staff Roster & Duty Shifts
            </h2>
            {salonName && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[10px] font-bold border border-emerald-200">
                {salonName}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {staffList.filter((s) => s.status === 'ON_SHIFT').length} of {staffList.length} specialists active on duty in this branch.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-2 cursor-pointer active:scale-95"
        >
          + Add Staff to {salonName ? salonName.split(' ')[0] : 'Branch'}
        </button>
      </div>

      {/* Staff Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {staffList.length === 0 ? (
          <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 font-medium">
            <p className="font-semibold text-slate-700">No staff members in this salon branch yet.</p>
            <p className="text-xs text-slate-400 mt-1">
              Click "+ Add Staff" to assign hair stylists, nail technicians, or barbers to this branch.
            </p>
          </div>
        ) : (
          staffList.map((st) => (
            <div
              key={st.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={st.avatarUrl}
                    alt={st.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500/30 shadow-xs"
                  />
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug">{st.name}</h3>
                    <p className="text-xs text-slate-500 font-medium">{st.role}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{st.phone}</p>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded-full border ${getStatusBadge(
                    st.status
                  )}`}
                >
                  {st.status.replace('_', ' ')}
                </span>
              </div>

              {/* Specialties Tags */}
              <div className="my-4">
                <p className="text-[10px] uppercase font-mono text-slate-400 font-semibold mb-1.5">Specialties</p>
                <div className="flex flex-wrap gap-1.5">
                  {st.specialties && st.specialties.length > 0 ? (
                    st.specialties.map((spec, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-medium"
                      >
                        {spec}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 text-[11px] italic">General Specialist</span>
                  )}
                </div>
              </div>

              {/* Working Hours & Shift Action Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="text-slate-500 font-mono text-[11px]">
                  <span>🕒 {st.workingHours}</span>
                </div>
                <button
                  onClick={() => toggleStatus(st.id)}
                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition cursor-pointer"
                >
                  Change Duty Status
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ADD STAFF MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white">Add New Staff Specialist</h3>
                <p className="text-xs text-slate-400">
                  Assign specialist to: <span className="text-emerald-400 font-semibold">{salonName || 'Current Branch'}</span>
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="p-5 space-y-4">
              {/* Branch Association Badge */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Branch Location:</span>
                <span className="font-bold text-emerald-800 font-mono">{salonName || 'Active Branch'}</span>
              </div>

              {/* Profile Photo Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Select Profile Photo
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {AVATAR_PRESETS.map((avatar, idx) => (
                    <img
                      key={idx}
                      src={avatar}
                      alt={`Avatar ${idx + 1}`}
                      onClick={() => setSelectedAvatar(avatar)}
                      className={`w-10 h-10 rounded-full object-cover cursor-pointer border-2 transition ${
                        selectedAvatar === avatar
                          ? 'border-emerald-500 scale-110 shadow-md ring-2 ring-emerald-300'
                          : 'border-slate-200 opacity-60 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mahlet Desalegn"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Role Title</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Silk Press & Hair Specialist"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Phone Number (+251)</label>
                <input
                  type="text"
                  placeholder="+251 91 222 3333"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Specialties (Comma Separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Silk Press, Protein Treatment, Scalp Detox"
                  value={specialties}
                  onChange={(e) => setSpecialties(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Save Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
