'use client';

import { useState } from 'react';
import Link from 'next/link';

interface InitialSetupWizardProps {
  salonId: string;
  salonName: string;
  hasWorkingHours: boolean;
  hasServices: boolean;
  hasStaff: boolean;
  onRefreshSalon: () => void;
}

export default function InitialSetupWizard({
  salonId,
  salonName,
  hasWorkingHours,
  hasServices,
  hasStaff,
  onRefreshSalon,
}: InitialSetupWizardProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isApplyingHours, setIsApplyingHours] = useState(false);
  const [hoursAppliedMessage, setHoursAppliedMessage] = useState('');

  const isComplete = hasWorkingHours && hasServices && hasStaff;
  if (!isOpen || isComplete) return null;

  const handleApplyDefaultHours = async () => {
    if (!salonId) return;
    setIsApplyingHours(true);
    setHoursAppliedMessage('');

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('aurasalon_owner_token') : null;
      // Default: Monday through Saturday, 08:30 AM to 07:30 PM (dayOfWeek 1 to 6)
      const standardSchedules = [1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
        dayOfWeek,
        openTime: '08:30',
        closeTime: '19:30',
        isOpen: true,
      }));
      // Sunday closed or shorter shift (dayOfWeek 0)
      standardSchedules.push({
        dayOfWeek: 0,
        openTime: '10:00',
        closeTime: '17:00',
        isOpen: true,
      });

      const res = await fetch(`http://localhost:4000/salons/${salonId}/working-hours`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ schedules: standardSchedules }),
      });

      if (res.ok) {
        setHoursAppliedMessage('Standard Addis Ababa working hours applied successfully!');
        onRefreshSalon();
      }
    } catch (e) {
      // Ignore
    } finally {
      setIsApplyingHours(false);
    }
  };

  return (
    <div className="mb-6 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 shadow-xl border border-slate-700/80">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-700/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold uppercase rounded-full border border-emerald-500/30">
              ✓ Account Approved
            </span>
            <span className="text-xs text-slate-300 font-mono">Quick Launch Checklist</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">Welcome to AuraSalon, {salonName}!</h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Complete these 3 simple steps to start receiving client bookings in Addis Ababa.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-xs text-slate-400 hover:text-white px-3 py-1 rounded-lg border border-slate-700 hover:bg-slate-800 transition"
        >
          Dismiss Checklist ✕
        </button>
      </div>

      {hoursAppliedMessage && (
        <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-medium">
          ✓ {hoursAppliedMessage}
        </div>
      )}

      {/* 3 Step Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
        {/* Step 1: Hours */}
        <div className={`p-4 rounded-xl border transition ${hasWorkingHours ? 'bg-slate-800/40 border-emerald-500/50' : 'bg-slate-800/80 border-slate-600'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-400">Step 1</span>
            {hasWorkingHours ? (
              <span className="text-xs font-bold text-emerald-400">✓ Configured</span>
            ) : (
              <span className="text-xs font-bold text-amber-400">Action Required</span>
            )}
          </div>
          <h4 className="font-bold text-sm text-white mt-1">Operating Hours</h4>
          <p className="text-xs text-slate-300 mt-1">
            Define daily shifts and customer appointment booking windows.
          </p>
          <div className="mt-3">
            {hasWorkingHours ? (
              <p className="text-[11px] font-mono text-emerald-300">Working hours active (Mon - Sat)</p>
            ) : (
              <button
                type="button"
                onClick={handleApplyDefaultHours}
                disabled={isApplyingHours}
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-slate-950 text-xs font-bold rounded-lg transition shadow-xs cursor-pointer"
              >
                {isApplyingHours ? 'Applying...' : 'Apply Default Hours (08:30 - 19:30) ⚡'}
              </button>
            )}
          </div>
        </div>

        {/* Step 2: Services */}
        <div className={`p-4 rounded-xl border transition ${hasServices ? 'bg-slate-800/40 border-emerald-500/50' : 'bg-slate-800/80 border-slate-600'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-400">Step 2</span>
            {hasServices ? (
              <span className="text-xs font-bold text-emerald-400">✓ Active</span>
            ) : (
              <span className="text-xs font-bold text-amber-400">Action Required</span>
            )}
          </div>
          <h4 className="font-bold text-sm text-white mt-1">Service Treatments</h4>
          <p className="text-xs text-slate-300 mt-1">
            List your hair styling, skin spa, barber, or manicure treatments with ETB pricing.
          </p>
          <div className="mt-3">
            <Link
              href="/services"
              className="w-full py-2 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold rounded-lg transition shadow-xs flex items-center justify-center gap-1 cursor-pointer"
            >
              Configure Services Catalog →
            </Link>
          </div>
        </div>

        {/* Step 3: Staff */}
        <div className={`p-4 rounded-xl border transition ${hasStaff ? 'bg-slate-800/40 border-emerald-500/50' : 'bg-slate-800/80 border-slate-600'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-400">Step 3</span>
            {hasStaff ? (
              <span className="text-xs font-bold text-emerald-400">✓ On Roster</span>
            ) : (
              <span className="text-xs font-bold text-amber-400">Action Required</span>
            )}
          </div>
          <h4 className="font-bold text-sm text-white mt-1">Specialists & Stylists</h4>
          <p className="text-xs text-slate-300 mt-1">
            Add team members so clients can select their preferred specialist.
          </p>
          <div className="mt-3">
            <Link
              href="/staff"
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center justify-center gap-1 cursor-pointer"
            >
              Add Staff Members →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
