'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Appointment, StaffMember, ServiceOffering, AppointmentStatus } from '../../types';

interface CalendarViewProps {
  initialAppointments?: Appointment[];
  staffList: StaffMember[];
  services: ServiceOffering[];
  salonId?: string;
}

function getEndTimeString(timeSlot: string, durationMinutes: number): string {
  const match = timeSlot.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return timeSlot;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  const totalMinutes = hours * 60 + minutes + durationMinutes;
  let endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;

  const endPeriod = endHours >= 12 ? 'PM' : 'AM';
  let endDisplayHours = endHours % 12;
  if (endDisplayHours === 0) endDisplayHours = 12;

  const paddedMinutes = endMinutes < 10 ? `0${endMinutes}` : `${endMinutes}`;
  return `${endDisplayHours}:${paddedMinutes} ${endPeriod}`;
}

function checkAppointmentOverdue(apt: Appointment): { isOverdue: boolean; minutesOver: number } {
  if (apt.status !== 'IN_PROGRESS') return { isOverdue: false, minutesOver: 0 };

  const match = apt.timeSlot.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return { isOverdue: false, minutesOver: 0 };

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  const [y, m, d] = (apt.date || '').split('-').map(Number);
  if (!y || !m || !d) return { isOverdue: false, minutesOver: 0 };

  const startMs = new Date(y, m - 1, d, hours, minutes, 0).getTime();
  const endMs = startMs + (apt.durationMinutes || 60) * 60000;
  const nowMs = Date.now();

  if (nowMs > endMs) {
    const minutesOver = Math.max(1, Math.floor((nowMs - endMs) / 60000));
    return { isOverdue: true, minutesOver };
  }

  return { isOverdue: false, minutesOver: 0 };
}

function playBookingChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, now + 0.15);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.35); // D6

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.15);
    osc1.stop(now + 0.35);
    osc2.stop(now + 0.6);
  } catch (e) {}
}

export default function CalendarView({
  initialAppointments = [],
  staffList,
  services,
  salonId: propSalonId,
}: CalendarViewProps) {
  // Format Date Helpers
  const formatIsoDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayObj = new Date();
  const todayDate = formatIsoDate(todayObj);
  const yesterdayDate = formatIsoDate(new Date(Date.now() - 86400000));
  const tomorrowDate = formatIsoDate(new Date(Date.now() + 86400000));
  const todayLabel = todayObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  // State
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const knownApptIdsRef = useRef<Set<string> | null>(null);
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');
  const [selectedDate, setSelectedDate] = useState<string>(todayDate);
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [isLoadingAppointments, setIsLoadingAppointments] = useState<boolean>(false);
  const [newBookingAlert, setNewBookingAlert] = useState<{
    customerName: string;
    serviceName: string;
    timeSlot: string;
    priceETB: number;
    date: string;
  } | null>(null);
  const [cancellationAlert, setCancellationAlert] = useState<{
    customerName: string;
    serviceName: string;
    timeSlot: string;
    date: string;
  } | null>(null);

  // Shift Schedule: Day Shift (6am-6pm) vs Night Shift (6pm-6am)
  const [shift, setShift] = useState<'DAY' | 'NIGHT'>(() => {
    const currentHour = new Date().getHours();
    return currentHour >= 18 || currentHour < 6 ? 'NIGHT' : 'DAY';
  });

  const dayShiftSlots = [
    '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM',
  ];

  const nightShiftSlots = [
    '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM', '11:00 PM',
    '12:00 AM', '01:00 AM', '02:00 AM', '03:00 AM', '04:00 AM', '05:00 AM', '06:00 AM',
  ];

  const timeSlots = shift === 'DAY' ? dayShiftSlots : nightShiftSlots;

  // Live Current Time state
  const [currentTimeLabel, setCurrentTimeLabel] = useState<string>('12:00 PM');
  const [currentHourNumber, setCurrentHourNumber] = useState<number>(12);

  // Determine active Salon ID
  const getActiveSalonId = useCallback(() => {
    if (propSalonId) return propSalonId;
    if (typeof window !== 'undefined') {
      const active = localStorage.getItem('aurasalon_active_salon_id');
      if (active) return active;
      const storedUser = localStorage.getItem('aurasalon_owner_user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          return user.ownedSalons?.[0]?.id || user.staffProfile?.salon?.id || user.staffProfile?.salonId || '';
        } catch (e) {}
      }
    }
    return '';
  }, [propSalonId]);

  // Fetch real database appointments for the selected salon and date
  const fetchAppointments = useCallback(
    async (date: string) => {
      const salonId = getActiveSalonId();
      if (!salonId) {
        setAppointments([]);
        return;
      }

      setIsLoadingAppointments(true);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('aurasalon_owner_token') : null;
        const res = await fetch(
          `http://localhost:4000/appointments/salon/${salonId}?date=${date}&limit=100`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );

        let dbAppointments: Appointment[] = [];
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.data)) {
            dbAppointments = json.data.map((apt: any) => {
              const start = new Date(apt.startTime);
              let hours = start.getHours();
              const minutes = start.getMinutes();
              const period = hours >= 12 ? 'PM' : 'AM';
              const displayHours = hours % 12 === 0 ? 12 : hours % 12;
              const paddedHours = displayHours < 10 ? `0${displayHours}` : `${displayHours}`;
              const paddedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
              const timeSlot = `${paddedHours}:${paddedMinutes} ${period}`;

              return {
                id: apt.id,
                customerName: apt.customer?.fullName || 'Walk-in Guest',
                customerPhone: apt.customer?.phoneNumber || '',
                serviceId: apt.services?.[0]?.service?.id || '',
                serviceName: apt.services?.map((s: any) => s.service?.name).join(', ') || 'Salon Service',
                staffId: apt.staff?.id || '',
                staffName: apt.staff?.user?.fullName || 'Assigned Specialist',
                timeSlot,
                durationMinutes: apt.services?.[0]?.service?.durationMin || 60,
                priceETB: Number(apt.totalPriceETB) || 0,
                status: apt.status as AppointmentStatus,
                date: date,
                notes: apt.notes || '',
              };
            });
          }
        }

        // Check localStorage for customer bookings in current browser session
        const storedData = typeof window !== 'undefined' ? localStorage.getItem('aurasalon_appointments') : null;
        let localAppointments: Appointment[] = [];
        if (storedData) {
          try {
            const parsed = JSON.parse(storedData);
            if (Array.isArray(parsed)) {
              localAppointments = parsed
                .filter(
                  (a: any) =>
                    (!a.salonId || a.salonId === salonId) &&
                    (a.appointmentDate === date || a.date === date)
                )
                .map((a: any) => ({
                  id: a.id,
                  customerName: a.customerName || 'Customer',
                  customerPhone: a.customerPhone || '',
                  serviceId: a.services?.[0]?.id || 'srv-1',
                  serviceName: a.services?.[0]?.name || a.serviceName || 'Hair Care Service',
                  staffId: a.staffId || '',
                  staffName: a.staffName || 'Specialist',
                  timeSlot: a.appointmentTime || a.timeSlot || '10:00 AM',
                  durationMinutes: a.services?.[0]?.durationMin || a.durationMinutes || 60,
                  priceETB: Number(a.totalPriceETB) || Number(a.priceETB) || 500,
                  status: (a.status as AppointmentStatus) || 'CONFIRMED',
                  date: date,
                  notes: a.notes || '',
                }));
            }
          } catch (e) {
            console.error(e);
          }
        }

        const existingIds = new Set(dbAppointments.map((a) => a.id));
        const merged = [...dbAppointments, ...localAppointments.filter((a) => !existingIds.has(a.id))];

        // Trigger real-time audio chime and visual banner when a new live appointment arrives via database sync
        if (knownApptIdsRef.current !== null) {
          const newApts = merged.filter((a) => !knownApptIdsRef.current!.has(a.id) && a.status !== 'CANCELLED');
          if (newApts.length > 0) {
            const latest = newApts[0];
            playBookingChime();
            setNewBookingAlert({
              customerName: latest.customerName || 'A client',
              serviceName: latest.serviceName || 'Salon Service',
              timeSlot: latest.timeSlot || 'Scheduled Time',
              priceETB: latest.priceETB || 0,
              date: latest.date || date,
            });
          }
        }
        knownApptIdsRef.current = new Set(merged.map((a) => a.id));

        setAppointments(merged);
      } catch (err) {
        console.error('Failed to fetch salon appointments:', err);
        setAppointments([]);
      } finally {
        setIsLoadingAppointments(false);
      }
    },
    [getActiveSalonId]
  );

  useEffect(() => {
    fetchAppointments(selectedDate);

    const onAppChange = () => fetchAppointments(selectedDate);
    const onSalonChange = () => fetchAppointments(selectedDate);

    window.addEventListener('aurasalon_appointments_changed', onAppChange);
    window.addEventListener('aurasalon_active_salon_changed', onSalonChange);
    window.addEventListener('aurasalon_staff_changed', onSalonChange);
    window.addEventListener('storage', onAppChange);

    // Instant cross-tab BroadcastChannel listener for incoming bookings
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('aurasalon_booking_events');
      channel.onmessage = (event) => {
        if (event.data && event.data.type === 'NEW_BOOKING') {
          playBookingChime();
          setNewBookingAlert({
            customerName: event.data.customerName || 'A client',
            serviceName: event.data.serviceName || 'Salon Service',
            timeSlot: event.data.timeSlot || 'Scheduled Time',
            priceETB: event.data.priceETB || 0,
            date: event.data.date || selectedDate,
          });
          fetchAppointments(selectedDate);
        } else if (event.data && event.data.type === 'APPOINTMENT_CANCELLED') {
          playBookingChime();
          setCancellationAlert({
            customerName: event.data.customerName || 'A client',
            serviceName: event.data.serviceName || 'Salon Service',
            timeSlot: event.data.timeSlot || 'Scheduled Time',
            date: event.data.date || selectedDate,
          });
          fetchAppointments(selectedDate);
        }
      };
    } catch (e) {}

    // Responsive 4-second periodic polling interval to sync database in real-time
    const interval = setInterval(() => {
      fetchAppointments(selectedDate);
    }, 4000);

    return () => {
      window.removeEventListener('aurasalon_appointments_changed', onAppChange);
      window.removeEventListener('aurasalon_active_salon_changed', onSalonChange);
      window.removeEventListener('aurasalon_staff_changed', onSalonChange);
      window.removeEventListener('storage', onAppChange);
      if (channel) channel.close();
      clearInterval(interval);
    };
  }, [selectedDate, fetchAppointments]);

  // Live Current Time updates
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 === 0 ? 12 : hours % 12;
      const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;

      setCurrentTimeLabel(`${displayHours}:${displayMinutes} ${period}`);
      setCurrentHourNumber(hours);
    };

    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Modal & Detail Popover state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointmentDetail, setSelectedAppointmentDetail] = useState<Appointment | null>(null);

  // New appointment form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id || '');
  const [selectedStaffId, setSelectedStaffId] = useState(staffList[0]?.id || '');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(timeSlots[0] || '10:00 AM');
  const [notes, setNotes] = useState('');

  // Keep modal defaults in sync when services/staff list loads from DB
  useEffect(() => {
    if (services.length > 0 && !selectedServiceId) {
      setSelectedServiceId(services[0].id);
    }
    if (staffList.length > 0 && !selectedStaffId) {
      setSelectedStaffId(staffList[0].id);
    }
  }, [services, staffList, selectedServiceId, selectedStaffId]);

  // Calculated Real Database Metrics
  const totalRevenue = appointments
    .filter((a) => a.status === 'CONFIRMED' || a.status === 'IN_PROGRESS' || a.status === 'COMPLETED' || a.status === 'PENDING')
    .reduce((sum, a) => sum + (Number(a.priceETB) || 0), 0);

  const totalBookings = appointments.length;
  const completedBookings = appointments.filter((a) => a.status === 'COMPLETED').length;
  const activeBookings = appointments.filter((a) => a.status === 'IN_PROGRESS').length;

  // Filtered Appointments
  const filteredAppointments = appointments.filter((apt) => {
    if (selectedStaffFilter !== 'ALL' && apt.staffId !== selectedStaffFilter) return false;
    if (selectedStatusFilter !== 'ALL' && apt.status !== selectedStatusFilter) return false;
    return true;
  });

  const displayStaffList =
    selectedStaffFilter === 'ALL' ? staffList : staffList.filter((s) => s.id === selectedStaffFilter);

  // Overdue Appointments List (Time elapsed while In Progress)
  const overdueAppointments = appointments.filter((a) => checkAppointmentOverdue(a).isOverdue);

  const handleOpenBookingForSlot = (staffId: string, time: string) => {
    setSelectedStaffId(staffId);
    setSelectedTimeSlot(time);
    setIsModalOpen(true);
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    const serviceObj = services.find((s) => s.id === selectedServiceId) || services[0];
    const staffObj = staffList.find((s) => s.id === selectedStaffId) || staffList[0];

    if (!customerName.trim() || !serviceObj) return;

    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || '+251 91 000 0000',
      serviceId: serviceObj.id,
      serviceName: serviceObj.name,
      staffId: staffObj ? staffObj.id : '',
      staffName: staffObj ? staffObj.name : 'Unassigned Specialist',
      timeSlot: selectedTimeSlot,
      durationMinutes: serviceObj.durationMinutes,
      priceETB: serviceObj.priceETB,
      status: 'CONFIRMED',
      date: selectedDate,
      notes,
    };

    const updated = [newApt, ...appointments];
    setAppointments(updated);

    // Save in localStorage for real-time consistency
    try {
      const stored = localStorage.getItem('aurasalon_appointments');
      const parsed = stored ? JSON.parse(stored) : [];
      localStorage.setItem('aurasalon_appointments', JSON.stringify([newApt, ...parsed]));
      window.dispatchEvent(new Event('aurasalon_appointments_changed'));
    } catch (e) {}

    setIsModalOpen(false);
    setCustomerName('');
    setCustomerPhone('');
    setNotes('');
  };

  const handleClearAllAppointments = async () => {
    if (!confirm('Are you sure you want to clear all previous appointments to test the booking flow from scratch?')) return;
    try {
      setAppointments([]);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('aurasalon_appointments');
        localStorage.removeItem('aurasalon_user_appointments');
        window.dispatchEvent(new Event('aurasalon_appointments_changed'));
      }
      try {
        await fetch('http://localhost:4000/appointments/all/reset', {
          method: 'DELETE',
        });
      } catch (e) {}

      const bc = typeof window !== 'undefined' && 'BroadcastChannel' in window
        ? new BroadcastChannel('aurasalon_booking_events')
        : null;
      if (bc) {
        bc.postMessage({ type: 'APPOINTMENTS_RESET' });
      }

      alert('All appointments cleared! The calendar is now completely fresh.');
    } catch (e) {
      console.error(e);
    }
  };

  const updateStatus = async (id: string, newStatus: AppointmentStatus) => {
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === id ? { ...apt, status: newStatus } : apt))
    );
    if (selectedAppointmentDetail && selectedAppointmentDetail.id === id) {
      setSelectedAppointmentDetail((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    try {
      const token = localStorage.getItem('aurasalon_owner_token');
      await fetch(`http://localhost:4000/appointments/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (e) {
      console.warn('Backend status update failed, state maintained locally:', e);
    }
  };

  const extendAppointmentTime = (id: string, extraMinutes: number) => {
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === id
          ? { ...apt, durationMinutes: (apt.durationMinutes || 60) + extraMinutes }
          : apt
      )
    );
    if (selectedAppointmentDetail && selectedAppointmentDetail.id === id) {
      setSelectedAppointmentDetail((prev) =>
        prev
          ? { ...prev, durationMinutes: (prev.durationMinutes || 60) + extraMinutes }
          : null
      );
    }

    try {
      const stored = localStorage.getItem('aurasalon_appointments');
      if (stored) {
        const parsed = JSON.parse(stored);
        const updated = parsed.map((a: any) =>
          a.id === id ? { ...a, durationMinutes: (a.durationMinutes || 60) + extraMinutes } : a
        );
        localStorage.setItem('aurasalon_appointments', JSON.stringify(updated));
        window.dispatchEvent(new Event('aurasalon_appointments_changed'));
      }
    } catch (e) {}
  };

  const getStatusStyle = (status: AppointmentStatus) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-indigo-700 shadow-md ring-2 ring-indigo-400';
      case 'CONFIRMED':
        return 'bg-emerald-50/95 text-emerald-950 border-emerald-300 hover:bg-emerald-100 shadow-xs';
      case 'PENDING':
        return 'bg-amber-50/95 text-amber-950 border-amber-300 hover:bg-amber-100 shadow-xs';
      case 'COMPLETED':
        return 'bg-slate-100/90 text-slate-700 border-slate-300 hover:bg-slate-200';
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-800 border-rose-300 opacity-60 line-through';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const isSlotCurrentHour = (slot: string) => {
    const match = slot.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return false;
    let h = parseInt(match[1], 10);
    const p = match[3].toUpperCase();
    if (p === 'PM' && h !== 12) h += 12;
    if (p === 'AM' && h === 12) h = 0;
    return h === currentHourNumber;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Live Direct Booking Notification Banner */}
      {newBookingAlert && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-4 sm:p-5 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-top-3 border-2 border-emerald-400">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/20 text-white flex items-center justify-center text-2xl font-bold shrink-0 animate-bounce">
              🔔
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                <p className="text-xs font-mono font-extrabold uppercase tracking-wider text-emerald-100">
                  New Live Appointment Confirmed!
                </p>
              </div>
              <p className="text-sm font-bold mt-1 text-white">
                <span className="underline decoration-white/60">{newBookingAlert.customerName}</span> just booked{' '}
                <span className="font-extrabold text-amber-200">{newBookingAlert.serviceName}</span> for{' '}
                <span className="font-mono bg-black/20 px-2 py-0.5 rounded-md">{newBookingAlert.timeSlot}</span> on {newBookingAlert.date} (ETB {newBookingAlert.priceETB.toLocaleString()})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setSelectedDate(newBookingAlert.date);
                setNewBookingAlert(null);
              }}
              className="px-4 py-2 bg-white text-emerald-900 text-xs font-extrabold rounded-xl shadow-md hover:bg-emerald-50 transition active:scale-95 cursor-pointer"
            >
              View on Timetable →
            </button>
            <button
              type="button"
              onClick={() => setNewBookingAlert(null)}
              className="text-white/80 hover:text-white p-1 text-sm transition-colors rounded-lg hover:bg-white/10 cursor-pointer"
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Real-time Cancellation Notification Banner */}
      {cancellationAlert && (
        <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-red-800 text-white p-4 sm:p-5 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-top-3 border-2 border-rose-400">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/20 text-white flex items-center justify-center text-2xl font-bold shrink-0">
              ℹ️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                <p className="text-xs font-mono font-extrabold uppercase tracking-wider text-rose-100">
                  Appointment Cancelled — Timetable Slot Released
                </p>
              </div>
              <p className="text-sm font-bold mt-1 text-white">
                <span className="underline decoration-white/60">{cancellationAlert.customerName}</span> cancelled their{' '}
                <span className="font-extrabold text-amber-200">{cancellationAlert.serviceName}</span> booking for{' '}
                <span className="font-mono bg-black/20 px-2 py-0.5 rounded-md">{cancellationAlert.timeSlot}</span> on {cancellationAlert.date}. The time slot is now open for new reservations!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setSelectedDate(cancellationAlert.date);
                setCancellationAlert(null);
              }}
              className="px-4 py-2 bg-white text-rose-900 text-xs font-extrabold rounded-xl shadow-md hover:bg-rose-50 transition active:scale-95 cursor-pointer"
            >
              View Available Slot →
            </button>
            <button
              type="button"
              onClick={() => setCancellationAlert(null)}
              className="text-white/80 hover:text-white p-1 text-sm transition-colors rounded-lg hover:bg-white/10 cursor-pointer"
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Real-time Overdue Notification Banner */}
      {overdueAppointments.length > 0 && (
        <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-amber-950 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold text-lg shrink-0">
              ⏱️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                <p className="text-xs font-extrabold uppercase font-mono tracking-wider text-amber-900">
                  {overdueAppointments.length} Active Booking(s) Running Past Scheduled End Time
                </p>
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                <span className="font-bold">{overdueAppointments[0].customerName}</span> with{' '}
                <span className="font-bold">{overdueAppointments[0].staffName}</span> was scheduled to end at{' '}
                <span className="font-mono font-bold">
                  {getEndTimeString(
                    overdueAppointments[0].timeSlot,
                    overdueAppointments[0].durationMinutes
                  )}
                </span>
                . Has the service concluded?
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateStatus(overdueAppointments[0].id, 'COMPLETED')}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <span>✓</span>
              <span>Complete & Checkout</span>
            </button>
            <button
              onClick={() => extendAppointmentTime(overdueAppointments[0].id, 15)}
              className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm transition active:scale-95 cursor-pointer"
              title="Add 15 minutes extension"
            >
              +15 Mins
            </button>
            <button
              onClick={() => extendAppointmentTime(overdueAppointments[0].id, 30)}
              className="px-3 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-lg shadow-sm transition active:scale-95 cursor-pointer"
              title="Add 30 minutes extension"
            >
              +30 Mins
            </button>
          </div>
        </div>
      )}

      {/* Top Real Database Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Revenue */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">
              Total Revenue
            </p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">
              {totalRevenue.toLocaleString()} ETB
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              Live from active bookings
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 font-extrabold flex items-center justify-center text-base border border-emerald-200">
            ብር
          </div>
        </div>

        {/* Card 2: Total Bookings */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">
              Total Bookings
            </p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">
              {totalBookings}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Appointments on {selectedDate}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        {/* Card 3: Active in Chair */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">
              Active in Chair
            </p>
            <p className="text-2xl font-extrabold text-indigo-600 mt-1 font-mono">
              {activeBookings}
            </p>
            <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">
              Currently serving guests
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200">
            <span className="w-3 h-3 rounded-full bg-indigo-600 animate-ping"></span>
          </div>
        </div>

        {/* Card 4: Completed */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">
              Completed
            </p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1 font-mono">
              {completedBookings}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Checked out & paid
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Date Navigation & Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Dynamic Date Selector Shortcuts & Live Clock Badge */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setSelectedDate(yesterdayDate)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                selectedDate === yesterdayDate
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Yesterday
            </button>
            <button
              onClick={() => setSelectedDate(todayDate)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                selectedDate === todayDate
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today ({todayLabel})
            </button>
            <button
              onClick={() => setSelectedDate(tomorrowDate)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                selectedDate === tomorrowDate
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tomorrow
            </button>
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs font-mono font-semibold px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          {/* Shift Switcher: Day Shift (6am-6pm) vs Night Shift (6pm-6am) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setShift('DAY')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md flex items-center gap-1 transition ${
                shift === 'DAY'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Day Shift: 06:00 AM to 06:00 PM"
            >
              <span>☀️</span>
              <span>Day (6am-6pm)</span>
            </button>
            <button
              onClick={() => setShift('NIGHT')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md flex items-center gap-1 transition ${
                shift === 'NIGHT'
                  ? 'bg-indigo-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Night Shift: 06:00 PM to 06:00 AM"
            >
              <span>🌙</span>
              <span>Night (6pm-6am)</span>
            </button>
          </div>

          {/* Live Current Time Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg font-mono text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
            <span>Live Time: {currentTimeLabel}</span>
          </div>
        </div>

        {/* View Switcher & Filters */}
        <div className="flex items-center gap-3">
          {/* Staff Filter */}
          <select
            value={selectedStaffFilter}
            onChange={(e) => setSelectedStaffFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Staff Specialists ({staffList.length})</option>
            {staffList.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name}
              </option>
            ))}
          </select>

          {/* View Mode Toggle Button */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('GRID')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition ${
                viewMode === 'GRID'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Schedule Grid
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition ${
                viewMode === 'TABLE'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              List View
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-1.5 active:scale-95"
          >
            + New Booking
          </button>
        </div>
      </div>

      {isLoadingAppointments && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
          <span>Syncing real-time appointments from database for {selectedDate}...</span>
        </div>
      )}

      {/* VIEW MODE 1: VISUAL STAFF COLUMN SCHEDULE MATRIX GRID */}
      {viewMode === 'GRID' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-3 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h2 className="text-xs font-bold font-mono text-slate-900 uppercase tracking-wider">
                Live Floor Schedule ({shift === 'DAY' ? 'Day Shift: 06:00 AM – 06:00 PM' : 'Night Shift: 06:00 PM – 06:00 AM'})
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              💡 Tip: Red horizontal line indicates live time ({currentTimeLabel}). Click any slot to book.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left min-w-[800px]">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-xs text-slate-700 font-mono uppercase">
                  <th className="p-3 w-28 border-r border-slate-200 text-center sticky left-0 bg-slate-100 z-10 font-bold">
                    Time Slot
                  </th>
                  {displayStaffList.length === 0 ? (
                    <th className="p-3 text-slate-500 font-sans normal-case">
                      No staff members registered for this salon yet.
                    </th>
                  ) : (
                    displayStaffList.map((st) => (
                      <th key={st.id} className="p-3 border-r border-slate-200 min-w-[200px]">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={st.avatarUrl}
                            alt={st.name}
                            className="w-9 h-9 rounded-full object-cover border-2 border-emerald-500/40 shadow-xs"
                          />
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{st.name}</p>
                            <p className="text-[10px] text-slate-500 font-sans font-medium">
                              {st.role.split('&')[0]} • {st.status.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                      </th>
                    ))
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {timeSlots.map((slot) => {
                  const isCurrent = isSlotCurrentHour(slot);

                  return (
                    <tr
                      key={slot}
                      className={`relative hover:bg-slate-50/40 ${isCurrent ? 'bg-rose-50/30' : ''}`}
                    >
                      {/* Time Slot Label */}
                      <td className="p-3 font-mono font-bold text-slate-800 text-center border-r border-slate-200 bg-slate-50/70 sticky left-0 z-10 whitespace-nowrap">
                        {slot}
                      </td>

                      {/* Staff Columns */}
                      {displayStaffList.map((st, colIndex) => {
                        const slotAppointments = filteredAppointments.filter((a) => {
                          // Exclude CANCELLED bookings so the slot is instantly freed on the timetable
                          if (a.status === 'CANCELLED') return false;
                          const staffMatches = !a.staffId || a.staffId === st.id;
                          if (!staffMatches) return false;
                          if (a.timeSlot === slot) return true;
                          const aptMatch = a.timeSlot.match(/(\d+):(\d+)\s*(AM|PM)/i);
                          const slotMatch = slot.match(/(\d+):(\d+)\s*(AM|PM)/i);
                          if (aptMatch && slotMatch) {
                            const aptH = parseInt(aptMatch[1], 10);
                            const slotH = parseInt(slotMatch[1], 10);
                            const aptP = aptMatch[3].toUpperCase();
                            const slotP = slotMatch[3].toUpperCase();
                            return aptH === slotH && aptP === slotP;
                          }
                          return false;
                        });

                        return (
                          <td
                            key={st.id}
                            className="p-2 border-r border-slate-200 align-top relative group min-h-[72px]"
                          >
                            {/* Live Current Time Horizontal Red Line */}
                            {isCurrent && colIndex === 0 && (
                              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 z-20 pointer-events-none flex items-center w-[1000px]">
                                <div className="bg-rose-600 text-white text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-r-md shadow-sm shrink-0 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                                  <span>{currentTimeLabel}</span>
                                </div>
                                <div className="h-0.5 bg-rose-500 flex-1 shadow-sm"></div>
                              </div>
                            )}

                            {slotAppointments.length > 0 ? (
                              <div className="space-y-1.5">
                                {slotAppointments.map((apt) => {
                                  const endTimeStr = getEndTimeString(apt.timeSlot, apt.durationMinutes);
                                  const overdueInfo = checkAppointmentOverdue(apt);

                                  return (
                                    <div
                                      key={apt.id}
                                      onClick={() => setSelectedAppointmentDetail(apt)}
                                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                                        overdueInfo.isOverdue
                                          ? 'bg-gradient-to-r from-amber-600 to-rose-600 text-white border-rose-600 ring-2 ring-rose-400 shadow-md'
                                          : getStatusStyle(apt.status)
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-1 mb-1">
                                        <span className="font-bold truncate text-xs">
                                          {apt.customerName}
                                        </span>
                                        <span className="font-mono text-[10px] font-bold shrink-0 opacity-90">
                                          {apt.priceETB} ETB
                                        </span>
                                      </div>
                                      <p className="text-[11px] truncate opacity-90">{apt.serviceName}</p>

                                      <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono opacity-90 font-semibold border-t border-black/10 pt-1">
                                        <span>🕒 {apt.timeSlot} – {endTimeStr}</span>
                                        <span className="uppercase font-extrabold">
                                          {apt.status.replace('_', ' ')}
                                        </span>
                                      </div>

                                      {/* Overdue Action Quick Bar */}
                                      {overdueInfo.isOverdue && (
                                        <div className="mt-2 pt-1 border-t border-white/20 flex items-center justify-between gap-1 text-[10px]">
                                          <span className="font-bold bg-black/20 px-1 py-0.5 rounded">
                                            ⚠️ +{overdueInfo.minutesOver}m over
                                          </span>
                                          <div className="flex items-center gap-1">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                extendAppointmentTime(apt.id, 15);
                                              }}
                                              className="px-1.5 py-0.5 bg-black/30 hover:bg-black/50 text-white rounded font-mono font-bold"
                                              title="Add 15 minutes extension"
                                            >
                                              +15m
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                updateStatus(apt.id, 'COMPLETED');
                                              }}
                                              className="px-1.5 py-0.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded"
                                              title="Mark Completed & Checkout"
                                            >
                                              ✓ Done
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <button
                                onClick={() => handleOpenBookingForSlot(st.id, slot)}
                                className="w-full h-full min-h-[52px] rounded-lg border border-dashed border-slate-200 text-slate-400 hover:border-emerald-400 hover:bg-emerald-50/50 hover:text-emerald-700 flex items-center justify-center text-xs font-semibold transition group-hover:border-slate-300"
                              >
                                <span className="hidden group-hover:inline-block">+ Book {slot}</span>
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: TABULAR SEARCH LIST VIEW */}
      {viewMode === 'TABLE' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h2 className="text-xs font-bold font-mono text-slate-900 uppercase tracking-wider">
              Searchable Booking Directory ({filteredAppointments.length} Records)
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-xs font-mono text-slate-700 uppercase">
                  <th className="p-3.5 w-44 border-r border-slate-200">Time Interval</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Service Requested</th>
                  <th className="p-3.5">Assigned Specialist</th>
                  <th className="p-3.5">Amount (ETB)</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Quick Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-500 font-medium space-y-1">
                      <p className="font-semibold text-slate-700">No appointments scheduled for this date ({selectedDate}).</p>
                      <p className="text-xs text-slate-400">
                        Bookings created from the customer web app or via "+ New Booking" will appear here in real-time.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((apt) => {
                    const endTimeStr = getEndTimeString(apt.timeSlot, apt.durationMinutes);
                    const overdueInfo = checkAppointmentOverdue(apt);

                    return (
                      <tr key={apt.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-slate-900 border-r border-slate-200 whitespace-nowrap bg-slate-50/50">
                          {apt.timeSlot} – {endTimeStr}
                        </td>
                        <td className="p-3.5">
                          <p className="font-bold text-slate-900">{apt.customerName}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{apt.customerPhone}</p>
                        </td>
                        <td className="p-3.5">
                          <p className="font-semibold text-slate-800">{apt.serviceName}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{apt.durationMinutes} mins</p>
                        </td>
                        <td className="p-3.5 font-medium text-slate-800">{apt.staffName}</td>
                        <td className="p-3.5 font-mono font-extrabold text-slate-900 whitespace-nowrap">
                          <p>{apt.priceETB.toLocaleString()} ETB</p>
                          {apt.notes && apt.notes.includes('Promo') && (
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-sans font-semibold">
                              🏷️ Promo Applied
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded-full border ${
                                apt.status === 'CONFIRMED'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : apt.status === 'IN_PROGRESS'
                                  ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                                  : apt.status === 'PENDING'
                                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                                  : 'bg-slate-100 text-slate-700 border-slate-300'
                              }`}
                            >
                              {apt.status.replace('_', ' ')}
                            </span>
                            {overdueInfo.isOverdue && (
                              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-300 rounded-full animate-pulse">
                                +{overdueInfo.minutesOver}m over
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {overdueInfo.isOverdue && (
                              <button
                                onClick={() => extendAppointmentTime(apt.id, 15)}
                                className="px-2 py-1 text-[10px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 rounded transition"
                                title="Add 15 mins"
                              >
                                +15m
                              </button>
                            )}
                            <select
                              value={apt.status}
                              onChange={(e) => updateStatus(apt.id, e.target.value as AppointmentStatus)}
                              className="text-[11px] font-medium border border-slate-300 rounded px-2.5 py-1 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="CONFIRMED">Confirmed</option>
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="COMPLETED">Completed</option>
                              <option value="CANCELLED">Cancelled</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* APPOINTMENT DETAIL & ACTION MODAL */}
      {selectedAppointmentDetail && (() => {
        const modalOverdue = checkAppointmentOverdue(selectedAppointmentDetail);
        const modalEndTime = getEndTimeString(
          selectedAppointmentDetail.timeSlot,
          selectedAppointmentDetail.durationMinutes
        );

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
              <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold uppercase rounded border border-emerald-500/30">
                    Appointment Overview
                  </span>
                  <h3 className="font-bold text-lg text-white mt-1">
                    {selectedAppointmentDetail.customerName}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedAppointmentDetail(null)}
                  className="text-slate-400 hover:text-white p-1 text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Overdue Warning Alert Box */}
                {modalOverdue.isOverdue && (
                  <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl space-y-2 text-rose-900">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping shrink-0" />
                      <p className="text-xs font-extrabold font-mono">
                        ⚠️ Service Elapsed by {modalOverdue.minutesOver} Minutes
                      </p>
                    </div>
                    <p className="text-[11px] text-rose-700">
                      This service was scheduled to finish at <span className="font-bold font-mono">{modalEndTime}</span>. If finished, checkout below or extend duration for unexpected delays.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => updateStatus(selectedAppointmentDetail.id, 'COMPLETED')}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition"
                      >
                        ✓ Complete Service Now
                      </button>
                      <button
                        onClick={() => extendAppointmentTime(selectedAppointmentDetail.id, 15)}
                        className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs transition"
                      >
                        +15m
                      </button>
                      <button
                        onClick={() => extendAppointmentTime(selectedAppointmentDetail.id, 30)}
                        className="px-2.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-lg shadow-xs transition"
                      >
                        +30m
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 font-mono text-[11px]">Time Interval:</span>
                    <p className="font-bold text-slate-900 font-mono">
                      {selectedAppointmentDetail.timeSlot} – {modalEndTime}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-mono text-[11px]">Assigned Staff:</span>
                    <p className="font-bold text-slate-900">{selectedAppointmentDetail.staffName}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-mono text-[11px]">Phone Number:</span>
                    <p className="font-bold text-slate-900 font-mono">
                      {selectedAppointmentDetail.customerPhone}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-mono text-[11px]">Price in ETB:</span>
                    <p className="font-extrabold text-emerald-700 font-mono text-sm">
                      {selectedAppointmentDetail.priceETB.toLocaleString()} ETB
                    </p>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 font-mono text-xs block mb-1">
                    Requested Service:
                  </span>
                  <p className="font-bold text-slate-900 text-sm">
                    {selectedAppointmentDetail.serviceName}
                  </p>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Estimated Duration: {selectedAppointmentDetail.durationMinutes} Minutes
                  </p>
                </div>

                {selectedAppointmentDetail.notes && (
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs">
                    <span className="font-bold text-amber-900 block mb-0.5">Special Guest Notes:</span>
                    <p className="text-amber-800">{selectedAppointmentDetail.notes}</p>
                  </div>
                )}

                {/* Status Change Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 font-mono uppercase">
                    Update Booking Status
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as AppointmentStatus[]).map(
                      (st) => (
                        <button
                          key={st}
                          onClick={() => updateStatus(selectedAppointmentDetail.id, st)}
                          className={`py-2 px-3 text-xs font-bold font-mono rounded-lg border transition ${
                            selectedAppointmentDetail.status === st
                              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {st.replace('_', ' ')}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setSelectedAppointmentDetail(null)}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition"
                  >
                    Close Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* NEW APPOINTMENT MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white">New Appointment Booking</h3>
                <p className="text-xs text-slate-400">Schedule walk-in or phone client in Addis Ababa</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Customer Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bethlehem Tsegaye"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Phone Number (+251)
                </label>
                <input
                  type="text"
                  placeholder="+251 91 123 4567"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Select Service *
                  </label>
                  <select
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    {services.map((srv) => (
                      <option key={srv.id} value={srv.id}>
                        {srv.name} ({srv.priceETB} ETB)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Assigned Specialist *
                  </label>
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    {staffList.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Time Slot *</label>
                <select
                  value={selectedTimeSlot}
                  onChange={(e) => setSelectedTimeSlot(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                >
                  {timeSlots.map((ts) => (
                    <option key={ts} value={ts}>
                      {ts}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Special Notes</label>
                <textarea
                  rows={2}
                  placeholder="Special requests or client hair/skin preferences..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                  Save Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
