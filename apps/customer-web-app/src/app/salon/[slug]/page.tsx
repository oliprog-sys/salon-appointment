'use client';

import React, { useState, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, useRouter } from 'next/navigation';
import ServiceCard from '@/components/ServiceCard';
import { MOCK_SALONS } from '@/data/mockData';
import { Service, StaffProfile } from '@/types';

export default function SalonDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();

  const salon = MOCK_SALONS.find((s) => s.slug === resolvedParams.slug);

  if (!salon) {
    return notFound();
  }

  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<StaffProfile | null>(salon.staff[0] || null);

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

    // Save selected booking state in query or session storage if needed
    const serviceIds = selectedServices.map((s) => s.id).join(',');
    const staffId = selectedStaff ? selectedStaff.id : '';
    router.push(`/booking?salonId=${salon.id}&services=${serviceIds}&staffId=${staffId}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      {/* Back Navigation & Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#8A92A6]">
        <Link href="/" className="hover:text-[#E5B869] transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-gray-300">{salon.subCity}</span>
        <span>/</span>
        <span className="text-white font-medium">{salon.name}</span>
      </div>

      {/* Salon Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden glass-card border border-[#222734] shadow-2xl">
        <div className="relative h-72 sm:h-96 w-full">
          <Image
            src={salon.coverImageUrl}
            alt={salon.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0E] via-[#0A0B0E]/60 to-transparent" />
        </div>

        {/* Hero Overlay Info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="bg-[#E5B869] text-[#0A0B0E] text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full">
              {salon.subCity} District
            </span>
            {salon.isVerified && (
              <span className="bg-[#111318]/80 backdrop-blur border border-[#E5B869]/40 text-[#E5B869] text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 fill-[#E5B869]" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Verified Sanctuary
              </span>
            )}
            <span className="bg-[#0A0B0E]/80 backdrop-blur border border-[#222734] text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
              <span className="text-[#E5B869]">★</span> {salon.rating} ({salon.reviewCount} Reviews)
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-syne font-bold text-white tracking-tight">
            {salon.name}
          </h1>

          <p className="text-xs sm:text-sm text-gray-300 max-w-3xl leading-relaxed">
            {salon.description}
          </p>

          <div className="flex flex-wrap items-center gap-6 text-xs text-[#8A92A6] pt-2 border-t border-[#222734]/80">
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
            <h2 className="text-xl font-syne font-bold text-white tracking-tight">
              Select Specialist / Stylist
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {salon.staff.map((staffMember) => {
                const isSelected = selectedStaff?.id === staffMember.id;
                return (
                  <button
                    key={staffMember.id}
                    onClick={() => setSelectedStaff(staffMember)}
                    type="button"
                    className={`glass-card p-4 rounded-2xl flex items-center gap-3 text-left transition-all duration-200 border ${
                      isSelected
                        ? 'border-[#E5B869] bg-[#E5B869]/10 shadow-gold-glow-sm'
                        : 'border-[#222734] hover:border-[#E5B869]/40'
                    }`}
                  >
                    <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border border-[#E5B869]/40">
                      <Image
                        src={staffMember.avatarUrl}
                        alt={staffMember.fullName}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-syne font-semibold text-white text-xs sm:text-sm">
                        {staffMember.fullName}
                      </h4>
                      <p className="text-[10px] text-[#8A92A6] line-clamp-1">{staffMember.title}</p>
                      <span className="text-[10px] text-[#E5B869] font-bold">★ {staffMember.rating}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Service Catalog */}
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-[#222734] pb-4">
              <h2 className="text-2xl font-syne font-bold text-white tracking-tight">
                Service Catalog & Treatments
              </h2>
              <span className="text-xs text-[#8A92A6]">Prices listed in Ethiopian Birr (ETB)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {salon.services.map((service) => {
                const isSelected = selectedServices.some((s) => s.id === service.id);
                return (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    isSelected={isSelected}
                    onSelect={toggleService}
                  />
                );
              })}
            </div>
          </section>
        </div>

        {/* Right Column: Interactive Booking Summary Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 glass-card rounded-2xl p-6 border border-[#222734] space-y-6 shadow-2xl">
            <div className="border-b border-[#222734] pb-4">
              <span className="text-xs uppercase tracking-wider text-[#E5B869] font-semibold">
                Booking Summary
              </span>
              <h3 className="text-xl font-syne font-bold text-white mt-1">
                Your Selection
              </h3>
            </div>

            {/* Selected Specialist Info */}
            {selectedStaff && (
              <div className="bg-[#111318] p-3 rounded-xl border border-[#222734] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[#E5B869]/30">
                    <Image
                      src={selectedStaff.avatarUrl}
                      alt={selectedStaff.fullName}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8A92A6] block">Selected Specialist</span>
                    <span className="text-xs font-semibold text-white">{selectedStaff.fullName}</span>
                  </div>
                </div>
                <span className="text-[10px] bg-[#E5B869]/20 text-[#E5B869] px-2 py-0.5 rounded-full font-semibold">
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
                    className="flex items-center justify-between text-xs p-2.5 bg-[#111318]/60 rounded-lg border border-[#222734]"
                  >
                    <div>
                      <h5 className="font-semibold text-white">{service.name}</h5>
                      <span className="text-[10px] text-[#8A92A6]">{service.durationMin} mins</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#E5B869]">
                        ETB {service.priceETB.toLocaleString()}
                      </span>
                      <button
                        onClick={() => toggleService(service)}
                        className="text-[#8A92A6] hover:text-red-400 font-bold ml-1"
                        title="Remove service"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-[#8A92A6] border border-dashed border-[#222734] rounded-xl p-4">
                No services selected yet. Click &quot;+ Select Service&quot; from the catalog to build your appointment package.
              </div>
            )}

            {/* Totals & Duration */}
            <div className="border-t border-[#222734] pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-[#8A92A6]">
                <span>Total Duration:</span>
                <span className="text-white font-medium">{totalDurationMin} mins</span>
              </div>
              <div className="flex justify-between text-sm pt-1">
                <span className="font-syne font-bold text-white">Total Amount:</span>
                <span className="font-syne font-bold text-[#E5B869] text-base">
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
                  : 'bg-[#222734] text-[#8A92A6] cursor-not-allowed'
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
