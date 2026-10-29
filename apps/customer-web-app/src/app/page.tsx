'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import SalonCard from '@/components/SalonCard';
import { MOCK_SALONS } from '@/data/mockData';
import { SubCity } from '@/types';

const DISTRICTS: (SubCity | 'All')[] = ['All', 'Bole', 'Kazanchis', 'Piassa', 'Old Airport', 'Sarbet'];

const CATEGORIES = [
  'All Categories',
  'Hair Braiding & Artistry',
  'Luxury Spa & Massage',
  'Barber & Grooming',
  'Nails & Manicure',
  'Skin & Facial',
];

export default function Home() {
  const [selectedDistrict, setSelectedDistrict] = useState<SubCity | 'All'>('All');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter logic
  const filteredSalons = MOCK_SALONS.filter((salon) => {
    const matchesDistrict =
      selectedDistrict === 'All' || salon.subCity.toLowerCase() === selectedDistrict.toLowerCase();

    const matchesCategory =
      selectedCategory === 'All Categories' ||
      salon.services.some((s) => s.categoryName === selectedCategory);

    const matchesQuery =
      searchQuery.trim() === '' ||
      salon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      salon.subCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      salon.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      salon.services.some((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesDistrict && matchesCategory && matchesQuery;
  });

  return (
    <div className="space-y-16">
      {/* BEGIN: Hero Search Section */}
      <section className="relative hero-radial-glow pt-8 pb-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#E5B869]/30 bg-[#E5B869]/10 text-[#E5B869] text-xs font-semibold uppercase tracking-[0.2em] shadow-gold-glow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E5B869] animate-ping" />
            Refined Aesthetics & Sanctuary Care
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-syne font-extrabold text-white tracking-tight leading-tight">
            The Pinnacle of Beauty in <span className="text-gold-gradient">Addis Ababa</span>
          </h1>

          <p className="text-sm sm:text-base text-[#8A92A6] max-w-2xl mx-auto font-normal">
            Discover verified luxury sanctuaries, reserve master braiders, executive barbers, and natural Ethiopian botanical spa sessions with instant digital confirmation.
          </p>

          {/* Search Input Bar */}
          <div className="relative max-w-2xl mx-auto pt-2">
            <div className="relative flex items-center bg-[#111318]/90 border border-[#222734] hover:border-[#E5B869]/50 focus-within:border-[#E5B869] rounded-full p-2 shadow-2xl transition-all duration-300">
              <div className="pl-4 pr-3 text-[#8A92A6]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by sub-city (Bole, Kazanchis...), salon name, or treatment..."
                className="w-full bg-transparent border-0 text-white placeholder-[#8A92A6]/70 text-sm sm:text-base focus:ring-0 focus:outline-none py-1 px-1"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="pr-3 text-[#8A92A6] hover:text-white text-xs uppercase"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                className="flex-shrink-0 w-11 h-11 bg-[#E5B869] text-[#0A0B0E] rounded-full flex items-center justify-center hover:bg-[#F3D28E] active:scale-95 transition-transform duration-150 shadow-gold-glow-sm"
              >
                <svg className="w-5 h-5 transform -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>

          {/* Filter Chips: Popular Districts */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs">
            <span className="text-[#8A92A6] font-medium mr-1 tracking-wider uppercase text-[11px]">
              Popular Districts:
            </span>
            {DISTRICTS.map((district) => {
              const isActive = selectedDistrict === district;
              return (
                <button
                  key={district}
                  onClick={() => setSelectedDistrict(district)}
                  type="button"
                  className={`px-4 py-1.5 rounded-full border text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'border-[#E5B869] bg-[#E5B869]/15 text-[#E5B869] shadow-gold-glow-sm'
                      : 'border-[#222734] bg-[#111318] text-gray-300 hover:border-[#E5B869]/50 hover:text-white'
                  }`}
                >
                  {district === 'All' ? 'All Districts' : district}
                </button>
              );
            })}
          </div>
        </div>
      </section>
      {/* END: Hero Search Section */}

      {/* BEGIN: Premium Curations Gallery */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="explore">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#222734] pb-5 mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-syne font-bold text-white tracking-tight">
              Premium Curations
            </h2>
            <p className="text-sm text-[#8A92A6] mt-1">
              Top-rated verified beauty & wellness studios in Addis Ababa
            </p>
          </div>

          {/* Category Filter Horizontal Scroll */}
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2 md:pb-0">
            {CATEGORIES.map((category) => {
              const isActive = selectedCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  type="button"
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-[#E5B869] text-[#0A0B0E] font-semibold shadow-gold-glow-sm'
                      : 'bg-[#161922] text-[#8A92A6] hover:text-white hover:bg-[#222734]'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        {/* Salons Grid */}
        {filteredSalons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredSalons.map((salon) => (
              <SalonCard key={salon.id} salon={salon} />
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#E5B869]/10 text-[#E5B869] flex items-center justify-center mx-auto text-xl">
              🔍
            </div>
            <h3 className="font-syne text-lg font-bold text-white">No Studios Match Your Search</h3>
            <p className="text-xs text-[#8A92A6]">
              Try adjusting your sub-city filter or clearing your query to discover all available luxury studios in Addis Ababa.
            </p>
            <button
              onClick={() => {
                setSelectedDistrict('All');
                setSelectedCategory('All Categories');
                setSearchQuery('');
              }}
              className="px-5 py-2 rounded-full bg-[#E5B869] text-[#0A0B0E] text-xs font-semibold hover:bg-[#F3D28E]"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>
      {/* END: Premium Curations Gallery */}

      {/* BEGIN: How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" id="how-it-works">
        <div className="glass-card rounded-3xl p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#E5B869]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs uppercase tracking-[0.2em] text-[#E5B869] font-semibold">
              Seamless Digital Sanctuary
            </span>
            <h2 className="text-3xl font-syne font-bold text-white mt-2">
              How AuraSalon Works
            </h2>
            <p className="text-xs sm:text-sm text-[#8A92A6] mt-2">
              From discovery to check-in, enjoy a luxury appointment booking experience tuned for Addis Ababa.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-3 p-4 bg-[#111318]/50 rounded-2xl border border-[#222734]">
              <div className="w-10 h-10 rounded-full bg-[#E5B869]/20 text-[#E5B869] font-syne font-bold flex items-center justify-center">
                01
              </div>
              <h3 className="font-syne font-bold text-white text-base">Select Your Studio</h3>
              <p className="text-xs text-[#8A92A6] leading-relaxed">
                Filter verified salons across Bole, Kazanchis, Piassa, Old Airport, and Sarbet.
              </p>
            </div>

            <div className="space-y-3 p-4 bg-[#111318]/50 rounded-2xl border border-[#222734]">
              <div className="w-10 h-10 rounded-full bg-[#E5B869]/20 text-[#E5B869] font-syne font-bold flex items-center justify-center">
                02
              </div>
              <h3 className="font-syne font-bold text-white text-base">Choose Service & Stylist</h3>
              <p className="text-xs text-[#8A92A6] leading-relaxed">
                Browse detailed service menus with upfront ETB pricing and pick your preferred specialist.
              </p>
            </div>

            <div className="space-y-3 p-4 bg-[#111318]/50 rounded-2xl border border-[#222734]">
              <div className="w-10 h-10 rounded-full bg-[#E5B869]/20 text-[#E5B869] font-syne font-bold flex items-center justify-center">
                03
              </div>
              <h3 className="font-syne font-bold text-white text-base">Local Mobile Payment</h3>
              <p className="text-xs text-[#8A92A6] leading-relaxed">
                Pay securely via Telebirr, CBE Birr, Chapa, or choose to pay directly at the salon.
              </p>
            </div>

            <div className="space-y-3 p-4 bg-[#111318]/50 rounded-2xl border border-[#222734]">
              <div className="w-10 h-10 rounded-full bg-[#E5B869]/20 text-[#E5B869] font-syne font-bold flex items-center justify-center">
                04
              </div>
              <h3 className="font-syne font-bold text-white text-base">QR Check-in Arrival</h3>
              <p className="text-xs text-[#8A92A6] leading-relaxed">
                Receive an instant QR booking code on your phone for priority entrance without waiting.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* END: How It Works */}

      {/* BEGIN: VIP Membership Callout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#161922] via-[#111318] to-[#0A0B0E] border border-[#E5B869]/40 rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-gold-glow-sm">
          <div className="space-y-3 max-w-xl">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#E5B869]">
              Exclusive Privilege
            </span>
            <h2 className="text-2xl sm:text-3xl font-syne font-bold text-white">
              Join the Aura VIP Sanctuary Club
            </h2>
            <p className="text-xs sm:text-sm text-[#8A92A6] leading-relaxed">
              Unlock complimentary hair treatment upgrades, priority weekend slot reservations, and 10% cashback on Telebirr and CBE transactions.
            </p>
          </div>

          <Link
            href="/auth"
            className="px-8 py-3.5 rounded-full text-xs uppercase tracking-wider font-bold bg-[#E5B869] text-[#0A0B0E] hover:bg-[#F3D28E] active:scale-95 transition-transform duration-200 shadow-gold-glow whitespace-nowrap"
          >
            Claim VIP Membership
          </Link>
        </div>
      </section>
    </div>
  );
}
