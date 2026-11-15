'use client';

import React, { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, useRouter } from 'next/navigation';
import ServiceCard from '@/components/ServiceCard';
import { fetchSalonBySlug } from '@/utils/salonApi';
import { MOCK_SALONS } from '@/data/mockData';
import { Salon, Service, StaffProfile } from '@/types';

export default function SalonDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [salon, setSalon] = useState<Salon | null>(() => {
    return MOCK_SALONS.find((s) => s.slug === resolvedParams.slug) || null;
  });
  const [loading, setLoading] = useState(!salon);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<StaffProfile | null>(null);

  // Always scroll to top on route change or when studio loads
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [resolvedParams.slug]);

  // Fetch real salon from backend database
  useEffect(() => {
    let isMounted = true;
    async function loadSalon() {
      try {
        const data = await fetchSalonBySlug(resolvedParams.slug);
        if (isMounted && data) {
          setSalon(data);
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
          if (data.staff && data.staff.length > 0) {
            setSelectedStaff((prev) => {
              if (prev && data.staff.some((st: any) => st.id === prev.id)) {
                return prev;
              }
              return data.staff[0];
            });
          }
        }
      } catch (e) {
        console.error('Error fetching salon by slug:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadSalon();
    return () => {
      isMounted = false;
    };
  }, [resolvedParams.slug]);

  if (!salon && !loading) {
    return notFound();
  }

  if (loading || !salon) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-10 h-10 border-2 border-[var(--aura-gold)] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-[var(--text-secondary)]">Loading studio details...</p>
      </div>
    );
  }

  const toggleService = (service: Service) => {
    if (selectedServices.some((s) => s.id === service.id)) {
      setSelectedServices(selectedServices.filter((s) => s.id !== service.id));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const totalPriceETB = selectedServices.reduce((sum, s) => sum + s.priceETB, 0);
  const totalDurationMin = selectedServices.reduce((sum, s) => sum + s.durationMin, 0);

  const handleProceedToBooking = () => {
    if (selectedServices.length === 0) return;
    const serviceIds = selectedServices.map((s) => s.id).join(',');
    const staffId = selectedStaff ? selectedStaff.id : '';
    router.push(`/booking?salonId=${salon.id}&services=${serviceIds}&staffId=${staffId}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      {/* Back Navigation & Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <Link href="/" className="hover:text-[var(--aura-gold)] transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-[var(--text-secondary)]">{salon.subCity}</span>
        <span>/</span>
        <span className="text-[var(--text-primary)] font-bold">{salon.name}</span>
      </div>

      {/* Salon Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden glass-card border border-[var(--border-primary)] shadow-2xl">
        <div className="relative h-72 sm:h-96 w-full">
          <Image
            src={salon.coverImageUrl}
            alt={salon.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
        </div>

        {/* Hero Overlay Info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="bg-[#E5B869] text-[#0A0B0E] text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
              {salon.subCity} District
            </span>
            {salon.isVerified && (
              <span className="bg-black/60 backdrop-blur border border-[#E5B869]/50 text-[#E5B869] text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                <svg className="w-3.5 h-3.5 fill-[#E5B869]" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Verified Sanctuary
              </span>
            )}
            <span className="bg-black/60 backdrop-blur border border-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <span className="text-[#E5B869]">★</span> {salon.rating} ({salon.reviewCount} Reviews)
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-syne font-extrabold text-white tracking-tight drop-shadow-md">
            {salon.name}
          </h1>

          <p className="text-xs sm:text-sm text-gray-200 max-w-3xl leading-relaxed drop-shadow">
            {salon.description}
          </p>

          <div className="flex flex-wrap items-center gap-6 text-xs text-gray-300 pt-2 border-t border-white/20">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#E5B869]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <span>{salon.address}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#E5B869]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{salon.workingHours.day}: {salon.workingHours.time}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Catalog & Selection Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left 2 Columns: Services & Staff Catalog */}
        <div className="lg:col-span-2 space-y-10">
          {/* Staff Specialists Grid */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-syne font-bold text-[var(--text-primary)] tracking-tight">
                Select Specialist / Stylist
              </h2>
              <span className="text-xs text-[var(--text-muted)] font-medium">
                {salon.staff.length} Specialist{salon.staff.length !== 1 ? 's' : ''} available
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {salon.staff.map((staffMember) => {
                const isSelected = selectedStaff?.id === staffMember.id;
                return (
                  <button
                    key={staffMember.id}
                    onClick={() => setSelectedStaff(staffMember)}
                    type="button"
                    className={`relative glass-card p-4 rounded-2xl flex items-center gap-3.5 text-left transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'border-2 border-[#E5B869] bg-[#E5B869]/20 shadow-md ring-2 ring-[#E5B869]/40 text-[var(--text-primary)]'
                        : 'border border-[var(--border-primary)] hover:border-[#E5B869]/60 hover:bg-[var(--bg-card-subtle)]'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-[#E5B869] text-[#0A0B0E] text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
                        <span>✓</span>
                        <span>Selected</span>
                      </div>
                    )}
                    <div
                      className={`relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border-2 shadow-sm ${
                        isSelected
                          ? 'border-[#E5B869] ring-2 ring-[#E5B869]/40'
                          : 'border-[var(--border-primary)]'
                      }`}
                    >
                      <Image
                        src={staffMember.avatarUrl}
                        alt={staffMember.fullName}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="pr-10 sm:pr-0">
                      <h4
                        className={`font-syne text-xs sm:text-sm font-bold ${
                          isSelected ? 'text-[var(--text-primary)] font-extrabold' : 'text-[var(--text-primary)]'
                        }`}
                      >
                        {staffMember.fullName}
                      </h4>
                      <p className="text-[11px] text-[var(--text-secondary)] font-medium line-clamp-1">
                        {staffMember.title}
                      </p>
                      <span className="text-[11px] text-[var(--aura-gold)] font-bold">
                        ★ {staffMember.rating}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Service Catalog */}
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--border-primary)] pb-4">
              <h2 className="text-2xl font-syne font-bold text-[var(--text-primary)] tracking-tight">
                Service Catalog & Treatments
              </h2>
              <span className="text-xs text-[var(--text-muted)] font-medium">Prices listed in Ethiopian Birr (ETB)</span>
            </div>

            {salon.services.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {salon.services.map((service) => {
                  const isSelected = selectedServices.some((s) => s.id === service.id);
                  return (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      isSelected={isSelected}
                      onSelect={toggleService}
                      salon={salon}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center glass-card rounded-2xl border border-[var(--border-primary)]">
                <p className="text-xs text-[var(--text-muted)]">No services listed yet for this studio.</p>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Interactive Booking Summary Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 glass-card rounded-2xl p-6 border border-[var(--border-primary)] space-y-6 shadow-xl">
            <div className="border-b border-[var(--border-primary)] pb-4">
              <span className="text-xs uppercase tracking-wider text-[var(--aura-gold)] font-bold">
                Booking Summary
              </span>
              <h3 className="text-xl font-syne font-bold text-[var(--text-primary)] mt-1">
                Your Selection
              </h3>
            </div>

            {/* Selected Specialist Info */}
            {selectedStaff && (
              <div className="bg-[var(--bg-card-subtle)] p-3 rounded-xl border border-[var(--border-primary)] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[var(--aura-gold)]/40 shadow-sm">
                    <Image
                      src={selectedStaff.avatarUrl}
                      alt={selectedStaff.fullName}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block">Selected Specialist</span>
                    <span className="text-xs font-bold text-[var(--text-primary)]">{selectedStaff.fullName}</span>
                  </div>
                </div>
                <span className="text-[10px] bg-[var(--aura-gold)]/20 text-[var(--aura-gold)] px-2 py-0.5 rounded-full font-bold">
                  Confirmed
                </span>
              </div>
            )}

            {/* Selected Services List */}
            {selectedServices.length > 0 ? (
              <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                {selectedServices.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between text-xs p-2.5 bg-[var(--bg-card-subtle)]/70 rounded-lg border border-[var(--border-primary)]"
                  >
                    <div>
                      <h5 className="font-bold text-[var(--text-primary)]">{service.name}</h5>
                      <span className="text-[10px] text-[var(--text-muted)]">{service.durationMin} mins</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--aura-gold)]">
                        ETB {service.priceETB.toLocaleString()}
                      </span>
                      <button
                        onClick={() => toggleService(service)}
                        className="text-[var(--text-muted)] hover:text-red-500 font-bold ml-1 transition-colors"
                        title="Remove service"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-primary)] rounded-xl p-4">
                No services selected yet. Click &quot;+ Select Service&quot; from the catalog to build your appointment package.
              </div>
            )}

            {/* Totals & Duration */}
            <div className="border-t border-[var(--border-primary)] pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Total Duration:</span>
                <span className="text-[var(--text-primary)] font-bold">{totalDurationMin} mins</span>
              </div>
              <div className="flex justify-between text-sm pt-1">
                <span className="font-syne font-bold text-[var(--text-primary)]">Total Amount:</span>
                <span className="font-syne font-extrabold text-[var(--aura-gold)] text-base">
                  ETB {totalPriceETB.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Checkout Action Button */}
            <button
              onClick={handleProceedToBooking}
              disabled={selectedServices.length === 0}
              className={`w-full py-3.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-gold-glow ${
                selectedServices.length > 0
                  ? 'bg-[#E5B869] text-[#0A0B0E] hover:bg-[#F3D28E] active:scale-95'
                  : 'bg-[var(--bg-card-subtle)] text-[var(--text-muted)] border border-[var(--border-primary)] cursor-not-allowed'
              }`}
            >
              Proceed to Booking & Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
