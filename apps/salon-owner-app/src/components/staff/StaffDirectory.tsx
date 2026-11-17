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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  // Synchronize when initialStaff prop changes from parent
  useEffect(() => {
    setStaffList(initialStaff);
  }, [initialStaff]);

  // Add staff form state
  const [name, setName] = useState('');
  const [role, setRole] = useState('Hair Stylist & Specialist');
  const [phone, setPhone] = useState('');
  const [specialties, setSpecialties] = useState('Hair Care, Silk Press');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);

  // Edit staff form state
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editSpecialties, setEditSpecialties] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editStatus, setEditStatus] = useState<StaffMember['status']>('ON_SHIFT');
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Deleting staff state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getTargetSalonId = () => {
    return (
      activeSalonId ||
      (typeof window !== 'undefined' ? localStorage.getItem('aurasalon_active_salon_id') : '') ||
      ''
    );
  };

  const getToken = () => {
    return typeof window !== 'undefined' ? localStorage.getItem('aurasalon_owner_token') : null;
  };

  // Toggle or switch Duty Status with Database Persistence
  const handleUpdateDutyStatus = async (id: string, nextStatus: StaffMember['status']) => {
    // Optimistically update local UI state
    setStaffList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: nextStatus } : s))
    );

    try {
      const targetSalonId = getTargetSalonId();
      const token = getToken();

      if (targetSalonId) {
        await fetch(`http://localhost:4000/salons/${targetSalonId}/staff/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            dutyStatus: nextStatus,
            isAvailable: nextStatus === 'ON_SHIFT',
          }),
        });

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('aurasalon_staff_changed'));
        }
      }
    } catch (err) {
      console.error('Failed to update duty status on backend:', err);
    }
  };

  const toggleStatus = (id: string) => {
    const current = staffList.find((s) => s.id === id);
    if (!current) return;
    const nextStatus: StaffMember['status'] =
      current.status === 'ON_SHIFT' ? 'ON_BREAK' : current.status === 'ON_BREAK' ? 'OFF_DUTY' : 'ON_SHIFT';
    handleUpdateDutyStatus(id, nextStatus);
  };

  // Add new staff member
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setStaffError(null);
    try {
      const targetSalonId = getTargetSalonId();
      const token = getToken();

      let createdStaffId = `st-${Date.now()}`;
      let createdName = name.trim();
      let createdRole = role.trim() || 'Staff Specialist';
      let createdAvatar = selectedAvatar;
      let createdPhone = phone.trim() || '+251 91 000 0000';

      if (targetSalonId) {
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

        const data = await res.json();
        if (!res.ok) {
          const msg = Array.isArray(data.message) ? data.message.join(', ') : data.message;
          throw new Error(msg || 'Failed to save staff member in database');
        }

        if (data.id) createdStaffId = data.id;
        if (data.user?.fullName) createdName = data.user.fullName;
        if (data.title) createdRole = data.title;
        if (data.user?.avatarUrl) createdAvatar = data.user.avatarUrl;
        if (data.user?.phoneNumber) createdPhone = data.user.phoneNumber;
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
      setIsAddModalOpen(false);
      setName('');
      setPhone('');
      setStaffError(null);
      setRole('Hair Stylist & Specialist');
    } catch (err: any) {
      console.error('Error adding staff member:', err);
      setStaffError(err.message || 'Error adding staff member to database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (st: StaffMember) => {
    setEditingStaff(st);
    setEditName(st.name);
    setEditRole(st.role);
    setEditPhone(st.phone);
    setEditSpecialties(st.specialties.join(', '));
    setEditAvatar(st.avatarUrl);
    setEditStatus(st.status);
    setEditError(null);
  };

  // Save Edited Staff Member
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff || !editName.trim()) return;

    setIsUpdating(true);
    setEditError(null);
    try {
      const targetSalonId = getTargetSalonId();
      const token = getToken();

      if (targetSalonId) {
        const res = await fetch(
          `http://localhost:4000/salons/${targetSalonId}/staff/${editingStaff.id}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              fullName: editName.trim(),
              title: editRole.trim() || 'Staff Specialist',
              phoneNumber: editPhone.trim() || undefined,
              avatarUrl: editAvatar,
              bio: editSpecialties.trim(),
              dutyStatus: editStatus,
              isAvailable: editStatus === 'ON_SHIFT',
            }),
          }
        );

        const data = await res.json();
        if (!res.ok) {
          const msg = Array.isArray(data.message) ? data.message.join(', ') : data.message;
          throw new Error(msg || 'Failed to update staff member in database');
        }
      }

      setStaffList((prev) =>
        prev.map((s) =>
          s.id === editingStaff.id
            ? {
                ...s,
                name: editName.trim(),
                role: editRole.trim() || 'Staff Specialist',
                phone: editPhone.trim(),
                avatarUrl: editAvatar,
                specialties: editSpecialties.split(',').map((sp) => sp.trim()).filter(Boolean),
                status: editStatus,
              }
            : s
        )
      );

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('aurasalon_staff_changed'));
      }
      setEditingStaff(null);
    } catch (err: any) {
      console.error('Error updating staff member:', err);
      setEditError(err.message || 'Error updating staff member profile.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete / Remove Staff Member
  const handleDeleteStaff = async (st: StaffMember) => {
    const confirmed = confirm(
      `Are you sure you want to remove "${st.name}" (${st.role}) from this salon? They will no longer appear on the salon roster or timetable.`
    );
    if (!confirmed) return;

    setDeletingId(st.id);
    try {
      const targetSalonId = getTargetSalonId();
      const token = getToken();

      if (targetSalonId) {
        const res = await fetch(
          `http://localhost:4000/salons/${targetSalonId}/staff/${st.id}`,
          {
            method: 'DELETE',
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const msg = Array.isArray(data.message) ? data.message.join(', ') : data.message;
          throw new Error(msg || 'Failed to remove staff member from database');
        }
      }

      setStaffList((prev) => prev.filter((s) => s.id !== st.id));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('aurasalon_staff_changed'));
      }
    } catch (err: any) {
      alert(`Error removing staff member: ${err.message || 'Network error'}`);
    } finally {
      setDeletingId(null);
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
          onClick={() => setIsAddModalOpen(true)}
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
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={st.avatarUrl}
                      alt={st.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500/30 shadow-xs shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 text-sm leading-snug truncate">{st.name}</h3>
                      <p className="text-xs text-slate-500 font-medium truncate">{st.role}</p>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">{st.phone}</p>
                    </div>
                  </div>

                  {/* Actions & Badge */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full border ${getStatusBadge(
                        st.status
                      )}`}
                    >
                      {st.status.replace('_', ' ')}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(st)}
                        className="p-1.5 text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition"
                        title="Edit Specialist Profile"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === st.id}
                        onClick={() => handleDeleteStaff(st)}
                        className="p-1.5 text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition disabled:opacity-50"
                        title="Remove Specialist from Salon"
                      >
                        {deletingId === st.id ? '⌛' : '🗑️'}
                      </button>
                    </div>
                  </div>
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
              </div>

              {/* Working Hours & Shift Action Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="text-slate-500 font-mono text-[11px]">
                  <span>🕒 {st.workingHours}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <select
                    value={st.status}
                    onChange={(e) =>
                      handleUpdateDutyStatus(st.id, e.target.value as StaffMember['status'])
                    }
                    className="text-xs font-semibold py-1 px-2 border border-slate-300 rounded-md bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="ON_SHIFT">🟢 On Shift</option>
                    <option value="ON_BREAK">🟡 On Break</option>
                    <option value="OFF_DUTY">⚪ Off Duty</option>
                  </select>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ADD STAFF MODAL */}
      {isAddModalOpen && (
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
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="p-5 space-y-4">
              {staffError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium animate-in fade-in">
                  ⚠️ {staffError}
                </div>
              )}

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
                <label className="block text-xs font-bold text-slate-800 mb-1">Phone Number (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. +251 91 234 5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Specialties (Comma Separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Balayage, Silk Press, Scalp Care"
                  value={specialties}
                  onChange={(e) => setSpecialties(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Registering Staff...' : 'Add Specialist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STAFF MODAL */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white">Edit Specialist Profile</h3>
                <p className="text-xs text-slate-400">
                  Update employee details for: <span className="text-emerald-400 font-semibold">{editingStaff.name}</span>
                </p>
              </div>
              <button
                onClick={() => setEditingStaff(null)}
                className="text-slate-400 hover:text-white p-1 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              {editError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium animate-in fade-in">
                  ⚠️ {editError}
                </div>
              )}

              {/* Profile Photo Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Update Profile Photo
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {AVATAR_PRESETS.map((avatar, idx) => (
                    <img
                      key={idx}
                      src={avatar}
                      alt={`Avatar ${idx + 1}`}
                      onClick={() => setEditAvatar(avatar)}
                      className={`w-10 h-10 rounded-full object-cover cursor-pointer border-2 transition ${
                        editAvatar === avatar
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
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Role Title</label>
                <input
                  type="text"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Duty Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as StaffMember['status'])}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium cursor-pointer"
                >
                  <option value="ON_SHIFT">🟢 On Shift (Accepting Bookings)</option>
                  <option value="ON_BREAK">🟡 On Break (Temporarily Paused)</option>
                  <option value="OFF_DUTY">⚪ Off Duty (Not Available)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Specialties (Comma Separated)
                </label>
                <input
                  type="text"
                  value={editSpecialties}
                  onChange={(e) => setEditSpecialties(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    const st = editingStaff;
                    setEditingStaff(null);
                    handleDeleteStaff(st);
                  }}
                  className="text-xs text-rose-600 hover:text-rose-800 font-bold px-2 py-1 rounded hover:bg-rose-50 transition cursor-pointer"
                >
                  Remove Specialist
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingStaff(null)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isUpdating ? 'Saving Changes...' : 'Save Profile Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
