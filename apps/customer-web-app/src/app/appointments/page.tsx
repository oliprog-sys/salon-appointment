'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Appointment, AppointmentStatus } from '@/types';
import { getStoredAppointments, updateAppointmentStatusInStore } from '@/utils/appointmentStore';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'COMPLETED' | 'CANCELLED'>('UPCOMING');
  const [selectedQRAppointment, setSelectedQRAppointment] = useState<Appointment | null>(null);
  const [selectedReviewAppointment, setSelectedReviewAppointment] = useState<Appointment | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewSubmitted, setReviewSubmitted] = useState<boolean>(false);

  useEffect(() => {
    const syncAppointments = () => {
      setAppointments(getStoredAppointments());
    };
    syncAppointments();

    window.addEventListener('aurasalon_appointments_changed', syncAppointments);
    window.addEventListener('storage', syncAppointments);

    return () => {
      window.removeEventListener('aurasalon_appointments_changed', syncAppointments);
      window.removeEventListener('storage', syncAppointments);
    };
  }, []);

  const filteredAppointments = appointments.filter((app) => {
    if (activeTab === 'UPCOMING') return app.status === 'CONFIRMED' || app.status === 'IN_PROGRESS';
    if (activeTab === 'COMPLETED') return app.status === 'COMPLETED';
    if (activeTab === 'CANCELLED') return app.status === 'CANCELLED';
    return true;
  });

  const handleCancelAppointment = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this appointment? This will release your time slot for other clients.')) {
      return;
    }

    const targetAppt = appointments.find((a) => a.id === id);
    const token = typeof window !== 'undefined' ? localStorage.getItem('aurasalon_token') : null;

    // 1. Sync cancellation to PostgreSQL backend if real database ID
    if (token && id && !id.startsWith('app_')) {
      try {
        await fetch(`http://localhost:4000/appointments/${id}/cancel`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (e) {
        console.warn('Backend cancel sync failed:', e);
      }
    }

    // 2. Update local state and storage
    const updated = updateAppointmentStatusInStore(id, 'CANCELLED');
    setAppointments(updated);
    window.dispatchEvent(new Event('aurasalon_appointments_changed'));
    window.dispatchEvent(new Event('storage'));

    // 3. Emit real-time notification to the salon owner via BroadcastChannel
    try {
      const ch = new BroadcastChannel('aurasalon_booking_events');
      ch.postMessage({
        type: 'APPOINTMENT_CANCELLED',
        appointmentId: id,
        salonId: targetAppt?.salonId,
        customerName: targetAppt?.customerName || 'A client',
        serviceName: targetAppt?.services?.[0]?.name || 'Salon Treatment',
        timeSlot: targetAppt?.appointmentTime,
        date: targetAppt?.appointmentDate,
        priceETB: targetAppt?.totalPriceETB,
        timestamp: Date.now(),
      });
    } catch (e) {}
  };

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'IN_PROGRESS':
        return 'bg-[var(--aura-gold)]/20 text-[var(--aura-gold)] border-[var(--aura-gold)]/40';
      case 'COMPLETED':
        return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30';
      case 'CANCELLED':
        return 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[var(--border-primary)] pb-6 gap-4">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-[var(--aura-gold)] font-bold">
            Client Sanctuary Hub
          </span>
          <h1 className="text-3xl font-syne font-extrabold text-[var(--text-primary)] mt-1">
            My Appointments & QR Passes
          </h1>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 bg-[var(--bg-card-subtle)] p-1.5 rounded-full border border-[var(--border-primary)]">
          <button
            onClick={() => setActiveTab('UPCOMING')}
            type="button"
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === 'UPCOMING'
                ? 'bg-[#E5B869] text-[#0A0B0E] shadow-gold-glow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveTab('COMPLETED')}
            type="button"
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === 'COMPLETED'
                ? 'bg-[#E5B869] text-[#0A0B0E] shadow-gold-glow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Past & Completed
          </button>
          <button
            onClick={() => setActiveTab('CANCELLED')}
            type="button"
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === 'CANCELLED'
                ? 'bg-[#E5B869] text-[#0A0B0E] shadow-gold-glow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Cancelled
          </button>
        </div>
      </div>

      {/* Appointments Cards List */}
      {filteredAppointments.length > 0 ? (
        <div className="space-y-6">
          {filteredAppointments.map((appointment) => (
            <div
              key={appointment.id}
              className="glass-card rounded-2xl p-6 border border-[var(--border-primary)] hover:border-[var(--aura-gold)]/40 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            >
              {/* Studio & Service Details */}
              <div className="flex items-start gap-4">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-[var(--border-primary)]">
                  <Image
                    src={appointment.salonCoverImage}
                    alt={appointment.salonName}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-syne font-bold text-[var(--text-primary)] text-lg">{appointment.salonName}</h3>
                    <span
                      className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                        appointment.status
                      )}`}
                    >
                      {appointment.status}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--text-muted)]">{appointment.salonAddress}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                    <span className="text-[var(--aura-gold)] font-bold">
                      📅 {appointment.appointmentDate} at {appointment.appointmentTime}
                    </span>
                    {appointment.staffName && (
                      <span className="text-[var(--text-secondary)]">Stylist: {appointment.staffName}</span>
                    )}
                    <span className="text-[var(--text-muted)]">
                      Ref: <code className="font-mono text-[var(--text-primary)] font-bold">{appointment.bookingCode}</code>
                    </span>
                  </div>
                </div>
              </div>

              {/* Price & Action Buttons */}
              <div className="flex flex-col sm:flex-row items-end md:items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-[var(--border-primary)] pt-4 md:pt-0">
                <div className="text-right">
                  <span className="text-[10px] text-[var(--text-muted)] block uppercase font-bold">
                    Total Paid ({appointment.paymentMethod})
                  </span>
                  <span className="font-syne font-extrabold text-[var(--aura-gold)] text-base">
                    ETB {appointment.totalPriceETB.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {appointment.status === 'CONFIRMED' && (
                    <>
                      <button
                        onClick={() => setSelectedQRAppointment(appointment)}
                        type="button"
                        className="px-4 py-2 rounded-full text-xs font-bold bg-[#E5B869] text-[#0A0B0E] hover:bg-[#F3D28E] shadow-gold-glow-sm flex items-center gap-1.5"
                      >
                        <span>📱 Check-in QR</span>
                      </button>
                      <button
                        onClick={() => handleCancelAppointment(appointment.id)}
                        type="button"
                        className="px-3 py-2 rounded-full text-xs font-bold bg-[var(--bg-card-subtle)] border border-red-500/40 text-red-500 hover:bg-red-500/10"
                      >
                        Cancel
                      </button>
                    </>
                  )}

                  {appointment.status === 'COMPLETED' && (
                    <button
                      onClick={() => setSelectedReviewAppointment(appointment)}
                      type="button"
                      className="px-4 py-2 rounded-full text-xs font-bold bg-[var(--aura-gold)]/20 border border-[var(--aura-gold)]/50 text-[var(--aura-gold)] hover:bg-[#E5B869] hover:text-[#0A0B0E] transition-all flex items-center gap-1.5"
                    >
                      <span>⭐ Leave Review</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-12 text-center max-w-md mx-auto space-y-4">
          <div className="text-3xl">🗓️</div>
          <h3 className="font-syne font-bold text-[var(--text-primary)] text-lg">No Appointments Found</h3>
          <p className="text-xs text-[var(--text-muted)]">
            You have no appointments listed under the selected status filter.
          </p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 rounded-full bg-[#E5B869] text-[#0A0B0E] text-xs font-bold uppercase tracking-wider shadow-gold-glow-sm"
          >
            Explore & Book Now
          </Link>
        </div>
      )}

      {/* QR Code Modal Overlay */}
      {selectedQRAppointment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-8 max-w-sm w-full text-center space-y-5 border border-[#E5B869]/50 shadow-2xl relative">
            <button
              onClick={() => setSelectedQRAppointment(null)}
              className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold text-lg"
            >
              ✕
            </button>

            <h3 className="font-syne text-xl font-bold text-[var(--text-primary)]">Express Check-in Pass</h3>
            <p className="text-xs text-[var(--text-muted)]">{selectedQRAppointment.salonName}</p>

            <div className="bg-white p-4 rounded-2xl w-48 h-48 mx-auto flex items-center justify-center shadow-2xl border border-gray-200">
              <Image
                src={
                  selectedQRAppointment.qrCodeUrl ||
                  `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${selectedQRAppointment.bookingCode}`
                }
                alt="QR Code"
                width={180}
                height={180}
                unoptimized
              />
            </div>

            <div className="bg-[var(--bg-card-subtle)] p-3 rounded-xl border border-[var(--border-primary)] text-xs space-y-1">
              <div className="text-[var(--text-muted)] font-semibold">Booking Reference:</div>
              <div className="font-mono text-[var(--aura-gold)] font-extrabold text-base">
                {selectedQRAppointment.bookingCode}
              </div>
            </div>

            <button
              onClick={() => setSelectedQRAppointment(null)}
              className="w-full py-3 rounded-full text-xs font-bold uppercase bg-[#E5B869] text-[#0A0B0E] hover:bg-[#F3D28E]"
            >
              Done / Close
            </button>
          </div>
        </div>
      )}

      {/* Review Modal Overlay */}
      {selectedReviewAppointment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-8 max-w-md w-full space-y-6 border border-[#E5B869]/50 shadow-2xl relative">
            <button
              onClick={() => {
                setSelectedReviewAppointment(null);
                setReviewSubmitted(false);
              }}
              className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold text-lg"
            >
              ✕
            </button>

            {reviewSubmitted ? (
              <div className="text-center py-6 space-y-4">
                <div className="text-4xl">✨</div>
                <h3 className="font-syne text-xl font-bold text-[var(--text-primary)]">Review Submitted!</h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Thank you for rating your experience at {selectedReviewAppointment.salonName}. Your feedback helps our Addis Ababa community.
                </p>
                <button
                  onClick={() => {
                    setSelectedReviewAppointment(null);
                    setReviewSubmitted(false);
                  }}
                  className="px-6 py-2.5 rounded-full text-xs font-bold uppercase bg-[#E5B869] text-[#0A0B0E]"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[var(--aura-gold)] font-bold">Feedback Sanctuary</span>
                  <h3 className="font-syne text-xl font-bold text-[var(--text-primary)]">Rate Your Salon Experience</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{selectedReviewAppointment.salonName}</p>
                </div>

                {/* Star Picker */}
                <div className="space-y-1.5">
                  <label className="text-xs text-[var(--text-muted)] font-semibold block">Overall Rating</label>
                  <div className="flex gap-2 text-2xl">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className={`transition-all ${star <= reviewRating ? 'text-[#E5B869] scale-110' : 'text-gray-400 hover:text-gray-500'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment Textarea */}
                <div className="space-y-1.5">
                  <label className="text-xs text-[var(--text-muted)] font-semibold block">Your Comments (Optional)</label>
                  <textarea
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Tell us about the atmosphere, stylist precision, and service quality..."
                    className="w-full bg-[var(--bg-card-subtle)] border border-[var(--border-primary)] rounded-xl p-3 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--aura-gold)]"
                  />
                </div>

                <button
                  onClick={() => setReviewSubmitted(true)}
                  className="w-full py-3 rounded-full text-xs font-bold uppercase bg-[#E5B869] text-[#0A0B0E] hover:bg-[#F3D28E] transition-all shadow-gold-glow-sm"
                >
                  Submit Review ⭐
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
