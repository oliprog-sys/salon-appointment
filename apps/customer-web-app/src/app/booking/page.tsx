'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { MOCK_SALONS } from '@/data/mockData';
import { PaymentMethod, Service, Appointment, Salon } from '@/types';
import { getStoredUser, setStoredUser } from '@/utils/authStore';
import { saveNewAppointment } from '@/utils/appointmentStore';
import { fetchSalonById, fetchSalonBySlug } from '@/utils/salonApi';

interface PromoCampaign {
  id: string;
  salonId: string;
  code: string;
  title: string;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  discountDisplay: string;
  validUntil: string;
  active: boolean;
  uses: number;
  totalSavingsETB: number;
  createdAt: string;
}

function BookingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const salonIdParam = searchParams.get('salonId') || MOCK_SALONS[0].id;
  const serviceIdsParam = searchParams.get('services') || MOCK_SALONS[0].services[0].id;

  // Real or fallback target salon
  const [targetSalon, setTargetSalon] = useState<Salon>(() => {
    return MOCK_SALONS.find((s) => s.id === salonIdParam || s.slug === salonIdParam) || MOCK_SALONS[0];
  });

  // Fetch real salon from backend database
  useEffect(() => {
    async function loadSalonData() {
      if (salonIdParam) {
        let real = await fetchSalonById(salonIdParam);
        if (!real) {
          real = await fetchSalonBySlug(salonIdParam);
        }
        if (real) {
          setTargetSalon(real);
        }
      }
    }
    loadSalonData();
  }, [salonIdParam]);

  const initialServiceIds = serviceIdsParam.split(',');
  const matchedServices: Service[] = targetSalon.services.filter((s) =>
    initialServiceIds.includes(s.id)
  );
  const selectedServices: Service[] =
    matchedServices.length > 0 ? matchedServices : targetSalon.services.slice(0, 1);

  // Auth Interception State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [otpStep, setOtpStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phoneInput, setPhoneInput] = useState('+251911234567');
  const [otpInput, setOtpInput] = useState('123456');

  // Booking Form State - defaults to current date
  const [appointmentDate, setAppointmentDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('10:30 AM');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('TELEBIRR');
  const [customerName, setCustomerName] = useState('Abebe Bikila');
  const [customerPhone, setCustomerPhone] = useState('+251911234567');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<{
    bookingCode: string;
    qrUrl: string;
  } | null>(null);

  // Active Promo Code State
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCampaign | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);
  const [activePromoKey, setActivePromoKey] = useState<string>('');

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      setIsAuthenticated(true);
      if (user.fullName) setCustomerName(user.fullName);
      if (user.phoneNumber) setCustomerPhone(user.phoneNumber);
    }
  }, []);

  const timeSlots = [
    '09:00 AM',
    '10:30 AM',
    '12:00 PM',
    '02:00 PM',
    '03:30 PM',
    '05:00 PM',
    '06:30 PM',
  ];

  const totalETB = selectedServices.reduce((sum, s) => sum + s.priceETB, 0);

  // Calculate discount based on applied promo campaign
  const discountAmountETB = appliedPromo
    ? appliedPromo.discountType === 'PERCENT'
      ? Math.round(totalETB * (appliedPromo.discountValue / 100))
      : Math.min(totalETB, appliedPromo.discountValue)
    : 0;

  const finalTotalETB = Math.max(0, totalETB - discountAmountETB);

  // Read available promos from salon's storage or fallback seed
  const getAvailablePromos = (): { key: string; promos: PromoCampaign[] } => {
    const primaryKey = `aurasalon_salon_promos_${targetSalon.id}`;
    const primaryStored = typeof window !== 'undefined' ? localStorage.getItem(primaryKey) : null;
    if (primaryStored) {
      try {
        const parsed = JSON.parse(primaryStored);
        if (Array.isArray(parsed) && parsed.length > 0) return { key: primaryKey, promos: parsed };
      } catch (e) {}
    }

    // Check for Queen Saba active keys if target is Saba or generic
    const sabaBoleKey = 'aurasalon_salon_promos_b045c798-6815-41fd-b784-a97c2e6aaeb0';
    const sabaSarbetKey = 'aurasalon_salon_promos_fb3144c4-186e-4d26-a58b-181ccdddf5bb';
    for (const key of [sabaBoleKey, sabaSarbetKey]) {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return { key, promos: parsed };
        } catch (e) {}
      }
    }

    if (typeof window !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('aurasalon_salon_promos_')) {
          const stored = localStorage.getItem(k);
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (Array.isArray(parsed) && parsed.length > 0) return { key: k, promos: parsed };
            } catch (e) {}
          }
        }
      }
    }

    const fallbackPromos: PromoCampaign[] = [
      {
        id: 'p-default-1',
        salonId: targetSalon.id,
        code: 'VIPSILK20',
        title: 'Weekend Silk Press & Spa Special',
        discountType: 'PERCENT',
        discountValue: 20,
        discountDisplay: '20% OFF',
        validUntil: '2026-12-31',
        active: true,
        uses: 4,
        totalSavingsETB: 960,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'p-default-2',
        salonId: targetSalon.id,
        code: 'GLOW15',
        title: 'Gold Glow Facial Launch Voucher',
        discountType: 'PERCENT',
        discountValue: 15,
        discountDisplay: '15% OFF',
        validUntil: '2026-12-31',
        active: true,
        uses: 2,
        totalSavingsETB: 750,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'p-default-3',
        salonId: targetSalon.id,
        code: 'SARBETVIP',
        title: 'Sarbet VIP Spa Grand Opening',
        discountType: 'FIXED',
        discountValue: 250,
        discountDisplay: '250 ETB OFF',
        validUntil: '2026-12-31',
        active: true,
        uses: 0,
        totalSavingsETB: 0,
        createdAt: new Date().toISOString(),
      },
    ];

    if (typeof window !== 'undefined') {
      localStorage.setItem(primaryKey, JSON.stringify(fallbackPromos));
    }
    return { key: primaryKey, promos: fallbackPromos };
  };

  const handleApplyPromo = () => {
    setPromoError(null);
    setPromoSuccess(null);
    const cleaned = promoInput.trim().toUpperCase();

    if (!cleaned) {
      setPromoError('Please enter a promo code');
      return;
    }

    const { key, promos } = getAvailablePromos();
    const matched = promos.find((p) => p.code.toUpperCase() === cleaned);

    if (!matched) {
      setPromoError(`Promo code "${cleaned}" is not valid for this salon.`);
      return;
    }

    if (!matched.active) {
      setPromoError(`Promo code "${cleaned}" has been paused or stopped by the salon.`);
      return;
    }

    const expiry = new Date(matched.validUntil);
    expiry.setHours(23, 59, 59, 999);
    if (expiry < new Date()) {
      setPromoError(`Promo code "${cleaned}" expired on ${matched.validUntil}.`);
      return;
    }

    setAppliedPromo(matched);
    setActivePromoKey(key);
    setPromoSuccess(`"${matched.code}" applied! You save ${matched.discountDisplay}.`);
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoInput('');
    setPromoError(null);
    setPromoSuccess(null);
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    processBooking();
  };

  const processBooking = async () => {
    setIsSubmitting(true);
    try {
      const code = `AURA-${Math.floor(1000 + Math.random() * 9000)}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${code}`;

      const token = localStorage.getItem('aurasalon_token');

      // Async post to backend API for database persistence
      if (token) {
        try {
          const startTime = new Date(`${appointmentDate}T10:30:00Z`).toISOString();
          await fetch('http://localhost:4000/appointments', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              salonId: targetSalon.id,
              serviceIds: selectedServices.map((s) => s.id),
              startTime,
              notes: `Paid via ${selectedPaymentMethod}${appliedPromo ? ` (Promo: ${appliedPromo.code})` : ''}`,
            }),
          });
        } catch (e) {
          // Backend sync error handled gracefully
        }
      }

      // If a promo was applied, increment its redemptions and recorded savings
      if (appliedPromo) {
        try {
          const keyToUpdate = activePromoKey || `aurasalon_salon_promos_${targetSalon.id}`;
          const raw = localStorage.getItem(keyToUpdate);
          if (raw) {
            const list: PromoCampaign[] = JSON.parse(raw);
            const idx = list.findIndex((p) => p.code.toUpperCase() === appliedPromo.code.toUpperCase());
            if (idx !== -1) {
              list[idx].uses = (list[idx].uses || 0) + 1;
              list[idx].totalSavingsETB = (list[idx].totalSavingsETB || 0) + discountAmountETB;
              localStorage.setItem(keyToUpdate, JSON.stringify(list));
              window.dispatchEvent(new Event('aurasalon_promos_changed'));
            }
          }
        } catch (err) {
          console.error('Failed to record promo redemption:', err);
        }
      }

      const newApp: Appointment = {
        id: `app_${Date.now()}`,
        bookingCode: code,
        customerId: `usr_${Date.now()}`,
        customerName: customerName || 'Abebe Bikila',
        customerPhone: customerPhone || '+251911234567',
        salonId: targetSalon.id,
        salonName: targetSalon.name,
        salonAddress: `${targetSalon.subCity}, Addis Ababa`,
        salonCoverImage: targetSalon.coverImageUrl,
        services: selectedServices,
        staffName: 'Master Stylist',
        appointmentDate: appointmentDate,
        appointmentTime: selectedTimeSlot,
        status: 'CONFIRMED',
        paymentMethod: selectedPaymentMethod,
        paymentStatus: 'SUCCESSFUL',
        totalPriceETB: finalTotalETB,
        appliedPromoCode: appliedPromo?.code,
        discountETB: discountAmountETB > 0 ? discountAmountETB : undefined,
        qrCodeUrl: qrUrl,
        createdAt: new Date().toISOString(),
      };

      saveNewAppointment(newApp);

      setConfirmedBooking({
        bookingCode: code,
        qrUrl: qrUrl,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput) return;
    setCustomerPhone(phoneInput);
    setOtpStep('OTP');
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const userObj = {
      id: `usr_${Date.now()}`,
      fullName: customerName || 'Abebe Bikila',
      phoneNumber: phoneInput,
      role: 'CUSTOMER' as const,
    };
    setStoredUser(userObj, `jwt_token_${Date.now()}`);
    setIsAuthenticated(true);
    setShowAuthModal(false);
    processBooking();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header Title */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs uppercase tracking-[0.2em] text-[var(--aura-gold)] font-bold">
          Finalize Reservation
        </span>
        <h1 className="text-3xl sm:text-4xl font-syne font-extrabold text-[var(--text-primary)]">
          Complete Booking & Payment
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
          Confirm your appointment at <span className="text-[var(--text-primary)] font-bold">{targetSalon.name}</span> in {targetSalon.subCity}
        </p>
      </div>

      {!confirmedBooking ? (
        <form onSubmit={handleConfirmBooking} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Columns: Date, Time, Payment Options & Client Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Step 1: Select Date & Time */}
            <div className="glass-card rounded-2xl p-6 border border-[var(--border-primary)] space-y-5">
              <div className="flex items-center gap-3 border-b border-[var(--border-primary)] pb-4">
                <span className="w-8 h-8 rounded-full bg-[#E5B869] text-[#0A0B0E] font-syne font-bold flex items-center justify-center text-sm shadow-sm">
                  1
                </span>
                <h3 className="font-syne text-lg font-bold text-[var(--text-primary)]">Choose Date & Time Slot</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2 font-bold">
                    Appointment Date
                  </label>
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    required
                    className="w-full bg-[var(--bg-card-subtle)] border border-[var(--border-primary)] focus:border-[var(--aura-gold)] rounded-xl px-4 py-3 text-[var(--text-primary)] text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2 font-bold">
                    Customer Full Name
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    placeholder="e.g. Abebe Bikila"
                    className="w-full bg-[var(--bg-card-subtle)] border border-[var(--border-primary)] focus:border-[var(--aura-gold)] rounded-xl px-4 py-3 text-[var(--text-primary)] text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2 font-bold">
                  Phone Number (Ethiopia E.164 Format)
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                  placeholder="+251 9..."
                  className="w-full bg-[var(--bg-card-subtle)] border border-[var(--border-primary)] focus:border-[var(--aura-gold)] rounded-xl px-4 py-3 text-[var(--text-primary)] text-sm focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2 font-bold">
                  Available Time Slots
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                  {timeSlots.map((slot) => {
                    const isSelected = selectedTimeSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedTimeSlot(slot)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                          isSelected
                            ? 'border-[var(--aura-gold)] bg-[var(--aura-gold)]/15 text-[var(--aura-gold)] shadow-gold-glow-sm'
                            : 'border-[var(--border-primary)] bg-[var(--bg-card-subtle)] text-[var(--text-secondary)] hover:border-[var(--aura-gold)]/40 hover:text-[var(--text-primary)]'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Step 2: Payment Method Selection */}
            <div className="glass-card rounded-2xl p-6 border border-[var(--border-primary)] space-y-5">
              <div className="flex items-center gap-3 border-b border-[var(--border-primary)] pb-4">
                <span className="w-8 h-8 rounded-full bg-[#E5B869] text-[#0A0B0E] font-syne font-bold flex items-center justify-center text-sm shadow-sm">
                  2
                </span>
                <h3 className="font-syne text-lg font-bold text-[var(--text-primary)]">Select Ethiopian Payment Method</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Telebirr */}
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('TELEBIRR')}
                  className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                    selectedPaymentMethod === 'TELEBIRR'
                      ? 'border-[var(--aura-gold)] bg-[var(--aura-gold)]/10 shadow-sm'
                      : 'border-[var(--border-primary)] bg-[var(--bg-card-subtle)] hover:border-[var(--aura-gold)]/40'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-500 font-extrabold flex items-center justify-center text-xs flex-shrink-0">
                    tb
                  </div>
                  <div>
                    <h4 className="font-syne font-bold text-[var(--text-primary)] text-sm">Telebirr SuperApp</h4>
                    <p className="text-[10px] text-[var(--text-muted)]">Instant Ethio Telecom mobile transfer</p>
                  </div>
                </button>

                {/* CBE Birr */}
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('CBE_BIRR')}
                  className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                    selectedPaymentMethod === 'CBE_BIRR'
                      ? 'border-[var(--aura-gold)] bg-[var(--aura-gold)]/10 shadow-sm'
                      : 'border-[var(--border-primary)] bg-[var(--bg-card-subtle)] hover:border-[var(--aura-gold)]/40'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-500 font-extrabold flex items-center justify-center text-xs flex-shrink-0">
                    CBE
                  </div>
                  <div>
                    <h4 className="font-syne font-bold text-[var(--text-primary)] text-sm">CBE Birr</h4>
                    <p className="text-[10px] text-[var(--text-muted)]">Commercial Bank of Ethiopia transfer</p>
                  </div>
                </button>

                {/* Chapa */}
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('CHAPA')}
                  className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                    selectedPaymentMethod === 'CHAPA'
                      ? 'border-[var(--aura-gold)] bg-[var(--aura-gold)]/10 shadow-sm'
                      : 'border-[var(--border-primary)] bg-[var(--bg-card-subtle)] hover:border-[var(--aura-gold)]/40'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-500 font-extrabold flex items-center justify-center text-xs flex-shrink-0">
                    CP
                  </div>
                  <div>
                    <h4 className="font-syne font-bold text-[var(--text-primary)] text-sm">Chapa Gateway</h4>
                    <p className="text-[10px] text-[var(--text-muted)]">Debit / Credit Cards & e-wallets</p>
                  </div>
                </button>

                {/* Pay at Salon */}
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('PAY_AT_SALON')}
                  className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                    selectedPaymentMethod === 'PAY_AT_SALON'
                      ? 'border-[var(--aura-gold)] bg-[var(--aura-gold)]/10 shadow-sm'
                      : 'border-[var(--border-primary)] bg-[var(--bg-card-subtle)] hover:border-[var(--aura-gold)]/40'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#E5B869]/20 text-[var(--aura-gold)] font-bold flex items-center justify-center text-xs flex-shrink-0">
                    💵
                  </div>
                  <div>
                    <h4 className="font-syne font-bold text-[var(--text-primary)] text-sm">Pay at Salon</h4>
                    <p className="text-[10px] text-[var(--text-muted)]">Cash or POS on appointment arrival</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Checkout Summary Card */}
          <div className="lg:col-span-1">
            <div className="glass-card rounded-2xl p-6 border border-[var(--border-primary)] space-y-6 sticky top-28 shadow-xl">
              <h3 className="font-syne text-xl font-bold text-[var(--text-primary)] border-b border-[var(--border-primary)] pb-4">
                Reservation Breakdown
              </h3>

              <div className="space-y-3">
                <div className="text-xs">
                  <span className="text-[var(--text-muted)] font-semibold block">Studio:</span>
                  <span className="text-[var(--text-primary)] font-bold">{targetSalon.name} ({targetSalon.subCity})</span>
                </div>

                <div className="text-xs">
                  <span className="text-[var(--text-muted)] font-semibold block">Scheduled Slot:</span>
                  <span className="text-[var(--aura-gold)] font-bold">{appointmentDate} at {selectedTimeSlot}</span>
                </div>

                <div className="text-xs border-t border-[var(--border-primary)] pt-3">
                  <span className="text-[var(--text-muted)] block mb-2 font-bold uppercase tracking-wider text-[10px]">
                    Services Package:
                  </span>
                  <div className="space-y-2">
                    {selectedServices.map((s) => (
                      <div key={s.id} className="flex justify-between text-xs">
                        <span className="text-[var(--text-secondary)]">{s.name}</span>
                        <span className="text-[var(--aura-gold)] font-bold">ETB {s.priceETB.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Promo Code Input & Active Discount */}
              <div className="border-t border-[var(--border-primary)] pt-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-bold">
                    Promo / Voucher
                  </label>
                  {appliedPromo && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      ACTIVE
                    </span>
                  )}
                </div>

                {appliedPromo ? (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300">
                        🏷️ {appliedPromo.code}
                      </div>
                      <div className="text-[10px] text-emerald-600/90 dark:text-emerald-400/80">
                        {appliedPromo.discountDisplay} • {appliedPromo.title}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePromo}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-red-500/20 hover:text-red-500 text-emerald-700 dark:text-emerald-300 font-bold transition-colors"
                    >
                      ✕ Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => {
                        setPromoInput(e.target.value);
                        if (promoError) setPromoError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleApplyPromo();
                        }
                      }}
                      placeholder="e.g. VIPSILK20"
                      className="flex-1 bg-[var(--bg-card-subtle)] border border-[var(--border-primary)] focus:border-[var(--aura-gold)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] uppercase placeholder:normal-case placeholder:text-[var(--text-muted)] focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      className="px-4 py-2 rounded-xl bg-[#222734] hover:bg-[#E5B869] hover:text-[#0A0B0E] text-white text-xs font-bold transition-all shadow-sm"
                    >
                      Apply
                    </button>
                  </div>
                )}

                {promoError && (
                  <p className="text-[11px] text-red-500 font-medium flex items-center gap-1">
                    <span>⚠️</span> {promoError}
                  </p>
                )}
                {promoSuccess && !promoError && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <span>✓</span> {promoSuccess}
                  </p>
                )}
              </div>

              {/* Price Calculation Breakdown */}
              <div className="border-t border-[var(--border-primary)] pt-4 space-y-2">
                <div className="flex justify-between items-center text-xs text-[var(--text-muted)]">
                  <span>Subtotal:</span>
                  <span className="text-[var(--text-primary)] font-semibold">ETB {totalETB.toLocaleString()}</span>
                </div>
                {appliedPromo && discountAmountETB > 0 && (
                  <div className="flex justify-between items-center text-xs text-emerald-600 dark:text-emerald-400">
                    <span>Promo Discount ({appliedPromo.code}):</span>
                    <span className="font-bold">- ETB {discountAmountETB.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-[var(--border-primary)]/50">
                  <span className="font-syne font-bold text-[var(--text-primary)] text-base">Total Payment:</span>
                  <span className="font-syne font-extrabold text-[var(--aura-gold)] text-xl">
                    ETB {finalTotalETB.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-full text-xs font-bold uppercase tracking-wider bg-[#E5B869] text-[#0A0B0E] hover:bg-[#F3D28E] active:scale-95 transition-all shadow-gold-glow flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-[#0A0B0E] border-t-transparent rounded-full animate-spin" />
                    Generating Booking QR...
                  </>
                ) : (
                  `Confirm & Pay via ${selectedPaymentMethod}`
                )}
              </button>
            </div>
          </div>
        </form>
      ) : (
        /* Instant Booking Confirmation View */
        <div className="glass-card rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto space-y-6 border border-[#E5B869]/50 shadow-gold-glow">
          <div className="w-16 h-16 rounded-full bg-[#E5B869]/20 text-[#E5B869] border border-[#E5B869] flex items-center justify-center mx-auto text-2xl animate-bounce">
            ✓
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase tracking-[0.2em] text-[#E5B869] font-bold">
              Appointment Verified
            </span>
            <h2 className="text-3xl font-syne font-bold text-[var(--text-primary)]">
              Booking Confirmed!
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Your reservation reference code is <span className="text-[#E5B869] font-bold font-mono text-sm">{confirmedBooking.bookingCode}</span>
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl w-48 h-48 mx-auto flex items-center justify-center shadow-2xl relative">
            <Image
              src={confirmedBooking.qrUrl}
              alt="Booking Check-in QR Code"
              width={180}
              height={180}
              unoptimized
            />
          </div>
          <p className="text-[11px] text-[var(--text-muted)]">
            Present this QR code at {targetSalon.name} reception in {targetSalon.subCity} for instant express check-in.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Link
              href="/appointments"
              className="px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider bg-[#E5B869] text-[#0A0B0E] hover:bg-[#F3D28E]"
            >
              View In My Appointments
            </Link>
            <Link
              href="/"
              className="px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--bg-card-subtle)] border border-[var(--border-primary)] text-[var(--text-primary)] hover:border-[#E5B869]/50"
            >
              Return Home
            </Link>
          </div>
        </div>
      )}

      {/* AUTH INTERCEPTION MODAL (PHONE + OTP) */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--aura-gold)]/50 rounded-3xl p-8 max-w-md w-full space-y-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-[#E5B869]/20 text-[#E5B869] flex items-center justify-center mx-auto text-xl font-bold">
                🔒
              </div>
              <h3 className="font-syne text-2xl font-bold text-[var(--text-primary)]">
                {otpStep === 'PHONE' ? 'Sign In to Complete Booking' : 'Verify Phone Number'}
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                {otpStep === 'PHONE'
                  ? 'Enter your phone number to receive an instant OTP verification code.'
                  : `Enter the 6-digit verification code sent to ${phoneInput}`}
              </p>
            </div>

            {otpStep === 'PHONE' ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                    Ethiopia Phone Number
                  </label>
                  <input
                    type="text"
                    required
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="+251 91 123 4567"
                    className="w-full bg-[var(--bg-card-subtle)] border border-[var(--border-primary)] focus:border-[var(--aura-gold)] rounded-xl px-4 py-3 text-[var(--text-primary)] text-sm focus:outline-none font-mono"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAuthModal(false)}
                    className="w-1/2 py-3 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--bg-card-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-primary)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-3 rounded-full text-xs font-bold uppercase tracking-wider bg-[#E5B869] text-[#0A0B0E] hover:bg-[#F3D28E] shadow-gold-glow"
                  >
                    Send OTP
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                    6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    placeholder="e.g. 123456"
                    className="w-full bg-[var(--bg-card-subtle)] border border-[var(--border-primary)] focus:border-[var(--aura-gold)] rounded-xl px-4 py-3 text-[var(--text-primary)] text-sm focus:outline-none font-mono text-center tracking-widest text-lg"
                  />
                  <p className="text-[11px] text-[var(--aura-gold)] mt-1 text-center font-mono font-bold">
                    Test Mode Code: 123456
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setOtpStep('PHONE')}
                    className="w-1/2 py-3 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--bg-card-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-primary)]"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-3 rounded-full text-xs font-bold uppercase tracking-wider bg-[#E5B869] text-[#0A0B0E] hover:bg-[#F3D28E] shadow-gold-glow"
                  >
                    Verify & Pay
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-[var(--text-primary)]">Loading Booking Portal...</div>}>
      <BookingForm />
    </Suspense>
  );
}
