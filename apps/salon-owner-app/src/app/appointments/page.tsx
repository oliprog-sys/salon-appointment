'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import CalendarView from '../../components/appointments/CalendarView';
import { StaffMember, ServiceOffering } from '../../types';

export default function AppointmentsPage() {
  const router = useRouter();
  const [activeSalonId, setActiveSalonId] = useState<string>('');
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [services, setServices] = useState<ServiceOffering[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadSalonDetails = useCallback(async (salonId: string) => {
    if (!salonId) return;
    try {
      const res = await fetch(`http://localhost:4000/salons/${salonId}`);
      let salon = null;
      if (res.ok) {
        salon = await res.json();
      }

      if (salon) {
        if (Array.isArray(salon.staff)) {
          const mappedStaff: StaffMember[] = salon.staff.map((s: any) => ({
            id: s.id,
            name: s.user?.fullName || 'Specialist',
            role: s.title || 'Stylist',
            avatarUrl:
              s.user?.avatarUrl ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
            phone: s.user?.phoneNumber || '',
            specialties: s.bio ? s.bio.split(',').map((b: string) => b.trim()) : [],
            workingHours: '08:30 AM - 05:30 PM',
            status: (s.dutyStatus as any) || (s.isAvailable ? 'ON_SHIFT' : 'OFF_DUTY'),
            rating: 5.0,
            totalBookingsToday: 0,
          }));
          setStaffList(mappedStaff);
        } else {
          setStaffList([]);
        }

        if (Array.isArray(salon.categories)) {
          const mappedServices: ServiceOffering[] = salon.categories.flatMap((cat: any) =>
            (cat.services || []).map((srv: any) => ({
              id: srv.id,
              name: srv.name,
              category: 'HAIR',
              durationMinutes: srv.durationMin || 60,
              priceETB: Number(srv.priceETB) || 0,
              description: srv.description || '',
              isActive: srv.isActive ?? true,
              assignedStaffIds: [],
            }))
          );
          setServices(mappedServices);
        }
      }
    } catch (err) {
      console.error('Failed to load salon details from backend:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('aurasalon_owner_token');
    const storedUser = localStorage.getItem('aurasalon_owner_user');
    if (!token || !storedUser) {
      router.push('/login');
      return;
    }

    // Verify session with backend /auth/me
    fetch('http://localhost:4000/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.ok) {
          return res.json();
        } else if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('aurasalon_owner_token');
          localStorage.removeItem('aurasalon_owner_user');
          router.push('/login');
          return null;
        }
      })
      .then((verifiedUser) => {
        if (verifiedUser) {
          localStorage.setItem('aurasalon_owner_user', JSON.stringify(verifiedUser));
        }
      })
      .catch(() => {});

    try {
      const user = JSON.parse(storedUser);
      let targetId = localStorage.getItem('aurasalon_active_salon_id');
      if (!targetId || (user.ownedSalons && !user.ownedSalons.some((s: any) => s.id === targetId))) {
        targetId =
          user.ownedSalons?.[0]?.id ||
          user.staffProfile?.salon?.id ||
          user.staffProfile?.salonId ||
          '';
        if (targetId) localStorage.setItem('aurasalon_active_salon_id', targetId);
      }

      setActiveSalonId(targetId || '');
      if (targetId) {
        loadSalonDetails(targetId);
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.error('Failed to parse user data:', e);
      setLoading(false);
    }

    const onSalonChange = () => {
      const newId = localStorage.getItem('aurasalon_active_salon_id');
      if (newId) {
        setActiveSalonId(newId);
        loadSalonDetails(newId);
      }
    };

    const onStaffChange = () => {
      const currentId = localStorage.getItem('aurasalon_active_salon_id') || activeSalonId;
      if (currentId) {
        loadSalonDetails(currentId);
      }
    };

    window.addEventListener('aurasalon_active_salon_changed', onSalonChange);
    window.addEventListener('aurasalon_staff_changed', onStaffChange);
    return () => {
      window.removeEventListener('aurasalon_active_salon_changed', onSalonChange);
      window.removeEventListener('aurasalon_staff_changed', onStaffChange);
    };
  }, [router, loadSalonDetails, activeSalonId]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Appointments & Live Timetable"
          subtitle="Manage client bookings, staff schedules & status updates"
        />
        <main className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500 font-medium text-xs">
              Loading salon workspace from database...
            </div>
          ) : (
            <CalendarView
              staffList={staffList}
              services={services}
              salonId={activeSalonId}
            />
          )}
        </main>
      </div>
    </div>
  );
}
