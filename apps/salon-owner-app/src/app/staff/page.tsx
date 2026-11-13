'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import StaffDirectory from '../../components/staff/StaffDirectory';
import { StaffMember } from '../../types';

export default function StaffPage() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [activeSalonId, setActiveSalonId] = useState<string>('');
  const [salonName, setSalonName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStaff = async () => {
      try {
        let salonId = localStorage.getItem('aurasalon_active_salon_id');
        if (!salonId) {
          const storedUser = localStorage.getItem('aurasalon_owner_user');
          if (storedUser) {
            const user = JSON.parse(storedUser);
            salonId = user.ownedSalons?.[0]?.id || user.staffProfile?.salon?.id || '';
          }
        }

        if (salonId) {
          setActiveSalonId(salonId);
          const res = await fetch(`http://localhost:4000/salons/${salonId}`);
          if (res.ok) {
            const salon = await res.json();
            if (salon.name) setSalonName(salon.name);

            if (Array.isArray(salon.staff)) {
              const mapped: StaffMember[] = salon.staff.map((s: any) => ({
                id: s.id,
                name: s.user?.fullName || 'Specialist',
                role: s.title || 'Stylist',
                avatarUrl:
                  s.user?.avatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                phone: s.user?.phoneNumber || '',
                specialties: [],
                workingHours: '08:30 AM - 05:30 PM',
                status: s.isAvailable ? 'ON_SHIFT' : 'OFF_DUTY',
                rating: 5.0,
                totalBookingsToday: 0,
              }));
              setStaffList(mapped);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load staff:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStaff();
    window.addEventListener('aurasalon_active_salon_changed', loadStaff);
    return () => {
      window.removeEventListener('aurasalon_active_salon_changed', loadStaff);
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Staff Directory & Shift Schedules"
          subtitle="Monitor active specialists, working hours, and duty status"
        />
        <main className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500 font-medium text-xs">
              Loading salon staff from database...
            </div>
          ) : (
            <StaffDirectory
              initialStaff={staffList}
              activeSalonId={activeSalonId}
              salonName={salonName}
            />
          )}
        </main>
      </div>
    </div>
  );
}
