'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import CalendarView from '../components/appointments/CalendarView';
import OnboardingStepForm from '../components/onboarding/OnboardingStepForm';
import KycResubmission from '../components/onboarding/KycResubmission';
import { StaffMember, ServiceOffering } from '../types';

export default function DashboardPage() {
  const router = useRouter();
  const [salonStatus, setSalonStatus] = useState<'PENDING_REVIEW' | 'APPROVED' | 'REJECTED'>('APPROVED');
  const [salonName, setSalonName] = useState('My Salon');
  const [subCity, setSubCity] = useState('Addis Ababa');
  const [activeSalonId, setActiveSalonId] = useState<string>('');
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [services, setServices] = useState<ServiceOffering[]>([]);

  const loadSalonDetails = useCallback(async (salonId: string) => {
    if (!salonId) return;
    try {
      let res = await fetch(`http://localhost:4000/salons/${salonId}`);
      let salon = null;
      if (res.ok) {
        salon = await res.json();
      } else {
        // If salonId failed to fetch, look up available salons and match the user's intended branch
        const listRes = await fetch('http://localhost:4000/salons?limit=20');
        if (listRes.ok) {
          const listData = await listRes.json();
          const allSalons: any[] = listData.data || [];
          // Match by ID, slug, or matching name from stored user's ownedSalons
          const storedUserStr = typeof window !== 'undefined' ? localStorage.getItem('aurasalon_owner_user') : null;
          let matched: any = null;
          if (storedUserStr) {
            try {
              const u = JSON.parse(storedUserStr);
              const targetSalon = u.ownedSalons?.find((s: any) => s.id === salonId) || u.ownedSalons?.[0];
              if (targetSalon) {
                matched = allSalons.find((s: any) => s.name === targetSalon.name || s.slug === targetSalon.slug);
              }
            } catch (e) {}
          }
          salon = matched || allSalons.find((s: any) => s.id === salonId) || null;
          if (salon) {
            localStorage.setItem('aurasalon_active_salon_id', salon.id);
            setActiveSalonId(salon.id);
          }
        }
      }

      if (salon) {
        if (salon.id) {
          localStorage.setItem('aurasalon_active_salon_id', salon.id);
          setActiveSalonId(salon.id);
        }
        if (salon.name) setSalonName(salon.name);
        if (salon.subCity) setSubCity(salon.subCity);
        if (salon.status) {
          setSalonStatus(salon.status);
          localStorage.setItem('aurasalon_salon_status', salon.status);
        }

        // Map real staff profiles belonging to this specific salon
        if (Array.isArray(salon.staff)) {
          const mappedStaff: StaffMember[] = salon.staff.map((s: any) => ({
            id: s.id,
            name: s.user?.fullName || 'Specialist',
            role: s.title || 'Stylist',
            avatarUrl:
              s.user?.avatarUrl ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
            phone: s.user?.phoneNumber || '',
            specialties: [],
            workingHours: '08:30 AM - 05:30 PM',
            status: s.isAvailable ? 'ON_SHIFT' : 'OFF_DUTY',
            rating: 5.0,
            totalBookingsToday: 0,
          }));
          setStaffList(mappedStaff);
        } else {
          setStaffList([]);
        }

        // Map real services from backend categories
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
      }
    } catch (e) {
      console.error('Failed to parse user data:', e);
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
  }, [router, loadSalonDetails]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={
            salonStatus === 'APPROVED'
              ? 'Live Workspace Timetable'
              : salonStatus === 'PENDING_REVIEW'
              ? 'Vendor Onboarding Desk'
              : 'KYC Resubmission'
          }
          subtitle="Vendor Management Suite for Addis Ababa"
        />
        <main className="flex-1 overflow-y-auto">
          {salonStatus === 'APPROVED' && (
            <CalendarView
              staffList={staffList}
              services={services}
              salonId={activeSalonId}
            />
          )}

          {salonStatus === 'PENDING_REVIEW' && (
            <OnboardingStepForm
              salonName={salonName}
              subCity={subCity}
              onStatusChange={(status) => setSalonStatus(status)}
            />
          )}

          {salonStatus === 'REJECTED' && (
            <KycResubmission
              salonName={salonName}
              rejectionReason="Trade License scan is blurry. Please upload a clear digital PDF showing the Ministry seal."
              onResubmitSuccess={() => setSalonStatus('PENDING_REVIEW')}
            />
          )}
        </main>
      </div>
    </div>
  );
}
