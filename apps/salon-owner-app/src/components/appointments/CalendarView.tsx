'use client';

import { useState, useEffect } from 'react';
import { Appointment, StaffMember, ServiceOffering, AppointmentStatus } from '../../types';

interface CalendarViewProps {
  initialAppointments: Appointment[];
  staffList: StaffMember[];
  services: ServiceOffering[];
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

export default function CalendarView({
  initialAppointments,
  staffList,
  services
}: CalendarViewProps) {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');
  const [selectedDate, setSelectedDate] = useState('2026-10-03');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  // Live Current Time state
  const [currentTimeLabel, setCurrentTimeLabel] = useState<string>('11:45 AM');
  const [currentHourNumber, setCurrentHourNumber] = useState<number>(11);

  useEffect(() => {
    const syncAppointments = () => {
      const storedData = localStorage.getItem('aurasalon_appointments');
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Map customer appointment format to salon owner appointment format if needed
            const mapped: Appointment[] = parsed.map((a: any) => ({
              id: a.id,
              customerName: a.customerName || 'Customer',
              customerPhone: a.customerPhone || '+251 9...',
              serviceId: a.services?.[0]?.id || 'srv-1',
              serviceName: a.services?.[0]?.name || a.serviceName || 'Hair & Beauty Service',
              staffId: a.staffId || 'st-1',
              staffName: a.staffName || 'Master Stylist',
              timeSlot: a.appointmentTime || a.timeSlot || '10:30 AM',
              durationMinutes: a.services?.[0]?.durationMin || 60,
              status: (a.status as AppointmentStatus) || 'CONFIRMED',
              priceETB: Number(a.totalPriceETB) || 500,
              date: a.appointmentDate || a.date || '2026-10-03',
            }));

            // Merge with initial seed appointments avoiding duplicates
            const ids = new Set(mapped.map((m) => m.id));
            const merged = [...mapped, ...initialAppointments.filter((init) => !ids.has(init.id))];
            setAppointments(merged);
          }
        } catch (e) {
          console.error(e);
        }
      }
    };

    syncAppointments();
    window.addEventListener('aurasalon_appointments_changed', syncAppointments);
    window.addEventListener('storage', syncAppointments);

    return () => {
      window.removeEventListener('aurasalon_appointments_changed', syncAppointments);
      window.removeEventListener('storage', syncAppointments);
    };
  }, [initialAppointments]);

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
    const interval = setInterval(updateTime, 30000); // update every 30s
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
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('10:00 AM');
  const [notes, setNotes] = useState('');

  const timeSlots = [
    '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'
  ];

  // Calculated Metrics
  const totalRevenue = appointments
    .filter(a => a.status === 'CONFIRMED' || a.status === 'IN_PROGRESS' || a.status === 'COMPLETED')
    .reduce((sum, a) => sum + a.priceETB, 0);

  const totalBookings = appointments.length;
  const completedBookings = appointments.filter(a => a.status === 'COMPLETED').length;
  const activeBookings = appointments.filter(a => a.status === 'IN_PROGRESS').length;

  const filteredAppointments = appointments.filter(apt => {
    if (selectedStaffFilter !== 'ALL' && apt.staffId !== selectedStaffFilter) return false;
    if (selectedStatusFilter !== 'ALL' && apt.status !== selectedStatusFilter) return false;
    return true;
  });

  const displayStaffList = selectedStaffFilter === 'ALL'
    ? staffList
    : staffList.filter(s => s.id === selectedStaffFilter);

  const handleOpenBookingForSlot = (staffId: string, time: string) => {
    setSelectedStaffId(staffId);
    setSelectedTimeSlot(time);
    setIsModalOpen(true);
  };

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const serviceObj = services.find(s => s.id === selectedServiceId);
    const staffObj = staffList.find(s => s.id === selectedStaffId);

    if (!serviceObj || !staffObj || !customerName.trim()) return;

    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || '+251 91 000 0000',
      serviceId: serviceObj.id,
      serviceName: serviceObj.name,
      staffId: staffObj.id,
      staffName: staffObj.name,
      timeSlot: selectedTimeSlot,
      durationMinutes: serviceObj.durationMinutes,
      priceETB: serviceObj.priceETB,
      status: 'CONFIRMED',
      date: selectedDate,
      notes
    };

    setAppointments([newApt, ...appointments]);
    setIsModalOpen(false);
    setCustomerName('');
    setCustomerPhone('');
    setNotes('');
  };

  const updateStatus = (id: string, newStatus: AppointmentStatus) => {
    setAppointments(prev =>
      prev.map(apt => (apt.id === id ? { ...apt, status: newStatus } : apt))
    );
    if (selectedAppointmentDetail && selectedAppointmentDetail.id === id) {
      setSelectedAppointmentDetail(prev => prev ? { ...prev, status: newStatus } : null);
    }
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
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">Today's Revenue</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">{totalRevenue.toLocaleString()} ETB</p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">↑ 14% vs last week</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 font-extrabold flex items-center justify-center text-base border border-emerald-200">
            ብር
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">Total Bookings</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">{totalBookings}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Scheduled for today</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">Active in Chair</p>
            <p className="text-2xl font-extrabold text-indigo-600 mt-1 font-mono">{activeBookings}</p>
            <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">Currently serving guests</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200">
            <span className="w-3 h-3 rounded-full bg-indigo-600 animate-ping"></span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">Completed</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1 font-mono">{completedBookings}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Checked out & paid</p>
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
        {/* Date Selector Shortcuts & Live Clock Badge */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setSelectedDate('2026-10-02')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${selectedDate === '2026-10-02' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Yesterday
            </button>
            <button
              onClick={() => setSelectedDate('2026-10-03')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${selectedDate === '2026-10-03' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Today (Oct 3)
            </button>
            <button
              onClick={() => setSelectedDate('2026-10-04')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${selectedDate === '2026-10-04' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Tomorrow
            </button>
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs font-mono font-semibold px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

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
            className="text-xs font-semibold px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Staff Specialists ({staffList.length})</option>
            {staffList.map(st => (
              <option key={st.id} value={st.id}>{st.name}</option>
            ))}
          </select>

          {/* View Mode Toggle Button */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('GRID')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition ${viewMode === 'GRID' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Staff Schedule Grid
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition ${viewMode === 'TABLE' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
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

      {/* VIEW MODE 1: VISUAL STAFF COLUMN SCHEDULE MATRIX GRID */}
      {viewMode === 'GRID' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-3 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h2 className="text-xs font-bold font-mono text-slate-900 uppercase tracking-wider">
                Live Floor Schedule Matrix (Staff Columns vs Time Slots)
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
                  {displayStaffList.map((st) => (
                    <th key={st.id} className="p-3 border-r border-slate-200 min-w-[200px]">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={st.avatarUrl}
                          alt={st.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-300"
                        />
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{st.name}</p>
                          <p className="text-[10px] text-slate-500 font-sans font-medium">{st.role.split(' ')[0]} • {st.status.replace('_', ' ')}</p>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {timeSlots.map((slot) => {
                  const isCurrent = isSlotCurrentHour(slot);

                  return (
                    <tr key={slot} className={`relative hover:bg-slate-50/40 ${isCurrent ? 'bg-rose-50/30' : ''}`}>
                      {/* Time Slot Label */}
                      <td className="p-3 font-mono font-bold text-slate-800 text-center border-r border-slate-200 bg-slate-50/70 sticky left-0 z-10 whitespace-nowrap">
                        {slot}
                      </td>

                      {/* Staff Columns */}
                      {displayStaffList.map((st, colIndex) => {
                        const slotAppointments = filteredAppointments.filter(
                          (a) => a.staffId === st.id && a.timeSlot === slot
                        );

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
                                  return (
                                    <div
                                      key={apt.id}
                                      onClick={() => setSelectedAppointmentDetail(apt)}
                                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${getStatusStyle(apt.status)}`}
                                    >
                                      <div className="flex items-center justify-between gap-1 mb-1">
                                        <span className="font-bold truncate text-xs">{apt.customerName}</span>
                                        <span className="font-mono text-[10px] font-bold shrink-0 opacity-90">
                                          {apt.priceETB} ETB
                                        </span>
                                      </div>
                                      <p className="text-[11px] truncate opacity-90">{apt.serviceName}</p>
                                      
                                      {/* Exact Start - End Time Interval */}
                                      <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono opacity-90 font-semibold border-t border-black/10 pt-1">
                                        <span>🕒 {apt.timeSlot} – {endTimeStr}</span>
                                        <span className="uppercase font-extrabold">{apt.status.replace('_', ' ')}</span>
                                      </div>
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
                    <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">
                      No bookings found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((apt) => {
                    const endTimeStr = getEndTimeString(apt.timeSlot, apt.durationMinutes);
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
                        <td className="p-3.5 font-medium text-slate-800">
                          {apt.staffName}
                        </td>
                        <td className="p-3.5 font-mono font-extrabold text-slate-900 whitespace-nowrap">
                          {apt.priceETB.toLocaleString()} ETB
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded-full border ${
                            apt.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                            apt.status === 'IN_PROGRESS' ? 'bg-indigo-100 text-indigo-800 border-indigo-300' :
                            apt.status === 'PENDING' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                            'bg-slate-100 text-slate-700 border-slate-300'
                          }`}>
                            {apt.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <select
                            value={apt.status}
                            onChange={(e) => updateStatus(apt.id, e.target.value as AppointmentStatus)}
                            className="text-[11px] font-medium border border-slate-300 rounded px-2.5 py-1 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                          </select>
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
      {selectedAppointmentDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold uppercase rounded border border-emerald-500/30">
                  Appointment Overview
                </span>
                <h3 className="font-bold text-lg text-white mt-1">{selectedAppointmentDetail.customerName}</h3>
              </div>
              <button
                onClick={() => setSelectedAppointmentDetail(null)}
                className="text-slate-400 hover:text-white p-1 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 font-mono text-[11px]">Time Interval:</span>
                  <p className="font-bold text-slate-900 font-mono">
                    {selectedAppointmentDetail.timeSlot} – {getEndTimeString(selectedAppointmentDetail.timeSlot, selectedAppointmentDetail.durationMinutes)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 font-mono text-[11px]">Assigned Staff:</span>
                  <p className="font-bold text-slate-900">{selectedAppointmentDetail.staffName}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-mono text-[11px]">Phone Number:</span>
                  <p className="font-bold text-slate-900 font-mono">{selectedAppointmentDetail.customerPhone}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-mono text-[11px]">Price in ETB:</span>
                  <p className="font-extrabold text-emerald-700 font-mono text-sm">{selectedAppointmentDetail.priceETB.toLocaleString()} ETB</p>
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-mono text-xs block mb-1">Requested Service:</span>
                <p className="font-bold text-slate-900 text-sm">{selectedAppointmentDetail.serviceName}</p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">Estimated Duration: {selectedAppointmentDetail.durationMinutes} Minutes</p>
              </div>

              {selectedAppointmentDetail.notes && (
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs">
                  <span className="font-bold text-amber-900 block mb-0.5">Special Guest Notes:</span>
                  <p className="text-amber-800">{selectedAppointmentDetail.notes}</p>
                </div>
              )}

              {/* Status Change Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 font-mono uppercase">Update Booking Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as AppointmentStatus[]).map((st) => (
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
                  ))}
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
      )}

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
                <label className="block text-xs font-bold text-slate-800 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bethlehem Tsegaye"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Phone Number (+251)</label>
                <input
                  type="text"
                  placeholder="+251 91 123 4567"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Select Service *</label>
                  <select
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    {services.map((srv) => (
                      <option key={srv.id} value={srv.id}>
                        {srv.name} ({srv.priceETB} ETB)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Assigned Specialist *</label>
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
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
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                >
                  {timeSlots.map((ts) => (
                    <option key={ts} value={ts}>{ts}</option>
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
