'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import SalonCard from '@/components/SalonCard';
import { fetchAllSalons } from '@/utils/salonApi';
import { Salon, SubCity } from '@/types';
import {
  SparklesIcon,
  StarIcon,
  BuildingIcon,
  LocationPinIcon,
  SearchIcon,
  CheckIcon,
  ShieldCheckIcon,
  ChevronDownIcon,
  CategoryIcon,
} from '@/components/icons/Icons';

export default function Home() {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [districtDropdownOpen, setDistrictDropdownOpen] = useState(false);
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const districtMenuRef = useRef<HTMLDivElement>(null);

  // Close category and district dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
        setCategoryDropdownOpen(false);
      }
      if (districtMenuRef.current && !districtMenuRef.current.contains(event.target as Node)) {
        setDistrictDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Fetch real salons from backend PostgreSQL database with live revalidation on window focus and polling
  useEffect(() => {
    let isMounted = true;
    async function loadRealSalons() {
      try {
        const data = await fetchAllSalons();
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setSalons(data);
        }
      } catch (err) {
        console.error('Failed to load real salons:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadRealSalons();

    // Instant revalidation whenever user switches back to this tab from partner portal
    const onFocus = () => loadRealSalons();
    window.addEventListener('focus', onFocus);

    // Periodic live sync (every 6 seconds) so any promotion stops or boosts reflect automatically
    const timer = setInterval(loadRealSalons, 6000);

    // BroadcastChannel listener for immediate single-origin tab sync
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('aurasalon_booking_events');
      bc.onmessage = (event) => {
        if (event.data?.type === 'SALON_BOOSTED') {
          const { salonId, isFeatured } = event.data;
          setSalons((prev) =>
            prev.map((s) => (s.id === salonId ? { ...s, isFeatured } : s))
          );
        }
      };
    } catch (e) {}

    return () => {
      isMounted = false;
      window.removeEventListener('focus', onFocus);
      clearInterval(timer);
      if (bc) bc.close();
    };
  }, []);

  // Dynamically compute all categories from registered salons in database
  const dynamicCategories = React.useMemo(() => {
    const catMap = new Map<string, { count: number; icon: string }>();

    salons.forEach((salon) => {
      salon.services?.forEach((srv) => {
        const cat = (srv.categoryName || '').trim();
        if (cat) {
          const existing = catMap.get(cat);
          if (existing) {
            existing.count += 1;
          } else {
            let icon = '✨';
            const lower = cat.toLowerCase();
            if (lower.includes('hair') || lower.includes('braid')) icon = '💇';
            else if (lower.includes('nail') || lower.includes('mani') || lower.includes('pedi')) icon = '💅';
            else if (lower.includes('spa') || lower.includes('massage')) icon = '🧖';
            else if (lower.includes('barber') || lower.includes('groom') || lower.includes('cut')) icon = '✂️';
            else if (lower.includes('botanical') || lower.includes('ritual') || lower.includes('ethiopian')) icon = '🌿';
            else if (lower.includes('skin') || lower.includes('facial')) icon = '🌸';
            else if (lower.includes('bridal') || lower.includes('royal')) icon = '👑';
            else if (lower.includes('lash') || lower.includes('brow')) icon = '👁️';
            catMap.set(cat, { count: 1, icon });
          }
        }
      });
    });

    return Array.from(catMap.entries())
      .map(([name, data]) => ({ name, icon: data.icon, count: data.count }))
      .sort((a, b) => b.count - a.count);
  }, [salons]);

  // Primary categories to show directly as pills (All Services + top 4)
  const primaryPills = React.useMemo(() => {
    return [
      { id: 'All Categories', label: 'All Services', icon: '✨' },
      ...dynamicCategories.slice(0, 4).map((c) => ({
        id: c.name,
        label: c.name,
        icon: c.icon,
      })),
    ];
  }, [dynamicCategories]);

  // Remaining categories for the dropdown menu
  const specialtyCategories = React.useMemo(() => {
    return dynamicCategories.slice(4).map((c) => ({
      id: c.name,
      label: c.name,
      icon: c.icon,
      count: c.count,
    }));
  }, [dynamicCategories]);

  // Reset pagination to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDistrict, selectedCategory, searchQuery]);

  // Dynamically compute available districts and studio counts from loaded salons
  const availableDistricts = React.useMemo(() => {
    const counts = new Map<string, number>();
    salons.forEach((s) => {
      if (s.subCity) {
        const sub = s.subCity.trim();
        counts.set(sub, (counts.get(sub) || 0) + 1);
      }
    });

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [salons]);

  // Primary district quick pills (All Districts + top 4 most common)
  const primaryDistricts = React.useMemo(() => {
    return [
      { id: 'All', label: 'All Districts', count: salons.length },
      ...availableDistricts.slice(0, 4).map((d) => ({
        id: d.name,
        label: d.name,
        count: d.count,
      })),
    ];
  }, [availableDistricts, salons.length]);

  // Remaining districts in modern dropdown (scalable to 50+ sub-cities without cluttering UI)
  const specialtyDistricts = React.useMemo(() => {
    return availableDistricts.slice(4).map((d) => ({
      id: d.name,
      label: d.name,
      count: d.count,
    }));
  }, [availableDistricts]);

  // Featured Salons (All verified featured spotlight partners without arbitrary limit)
  const featuredSalons = salons.filter((s) => s.isFeatured);

  // Filter logic across real database salons
  const filteredSalons = salons.filter((salon) => {
    const matchesDistrict =
      selectedDistrict === 'All' || salon.subCity.toLowerCase() === selectedDistrict.toLowerCase();

    const matchesCategory =
      selectedCategory === 'All Categories' ||
      salon.services.some((s) => {
        const catName = (s.categoryName || '').toLowerCase().trim();
        const target = selectedCategory.toLowerCase().trim();
        return catName === target || catName.includes(target) || target.includes(catName);
      });

    const matchesQuery =
      searchQuery.trim() === '' ||
      salon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      salon.subCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      salon.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      salon.services.some((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesDistrict && matchesCategory && matchesQuery;
  });

  const totalPages = Math.ceil(filteredSalons.length / ITEMS_PER_PAGE);
  const paginatedSalons = filteredSalons.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-16">
      {/* BEGIN: Hero Search Section */}
      <section className="relative hero-radial-glow pt-8 pb-16 px-4 sm:px-6 lg:px-12 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--aura-gold)]/40 bg-[var(--aura-gold)]/10 text-[var(--aura-gold)] text-xs font-bold uppercase tracking-[0.2em] shadow-gold-glow-sm">
            <ShieldCheckIcon className="w-3.5 h-3.5 text-[var(--aura-gold)] animate-pulse" />
            Verified Sanctuaries & Priority Concierge
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-syne font-extrabold text-[var(--text-primary)] tracking-tight leading-tight">
            The Pinnacle of Beauty in <span className="text-gold-gradient">Addis Ababa</span>
          </h1>

          <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-2xl mx-auto font-normal leading-relaxed">
            Discover verified luxury sanctuaries, reserve master braiders, executive barbers, and natural Ethiopian botanical spa sessions with instant digital confirmation.
          </p>

          {/* Search Input Bar */}
          <div className="relative max-w-2xl mx-auto pt-2">
            <div className="relative flex items-center bg-[var(--bg-surface)] border border-[var(--border-primary)] hover:border-[var(--aura-gold)]/60 focus-within:border-[var(--aura-gold)] rounded-full p-2 shadow-lg transition-all duration-300">
              <div className="pl-4 pr-3 text-[var(--text-muted)]">
                <SearchIcon className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by district (Bole, Kazanchis...), salon name, or treatment..."
                className="w-full bg-transparent border-0 text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm sm:text-base focus:ring-0 focus:outline-none py-1 px-1"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="pr-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs uppercase font-semibold cursor-pointer"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                className="flex-shrink-0 w-11 h-11 bg-[#E5B869] text-[#0A0B0E] rounded-full flex items-center justify-center hover:bg-[#F3D28E] active:scale-95 transition-transform duration-150 shadow-gold-glow-sm cursor-pointer"
                aria-label="Search"
              >
                <SearchIcon className="w-5 h-5 text-[#0A0B0E]" />
              </button>
            </div>
          </div>

          {/* District Quick Filter: Top Pills + Scalable More Districts Dropdown */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs">
            <span className="text-[var(--text-muted)] font-bold mr-1 tracking-wider uppercase text-[11px] flex items-center gap-1">
              <LocationPinIcon className="w-3.5 h-3.5 text-[var(--aura-gold)]" />
              <span>District:</span>
            </span>

            {/* Primary District Pills */}
            {primaryDistricts.map((district) => {
              const isActive = selectedDistrict === district.id;
              return (
                <button
                  key={district.id}
                  onClick={() => {
                    setSelectedDistrict(district.id);
                    setDistrictDropdownOpen(false);
                  }}
                  type="button"
                  className={`px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'border-[var(--aura-gold)] bg-[var(--aura-gold)]/15 text-[var(--aura-gold)] shadow-gold-glow-sm font-bold'
                      : 'border-[var(--border-primary)] bg-[var(--bg-card-subtle)] text-[var(--text-secondary)] hover:border-[var(--aura-gold)]/50 hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span>{district.label}</span>
                </button>
              );
            })}

            {/* Dropdown for More Districts (Scalable without disrupting the UI) */}
            {specialtyDistricts.length > 0 && (
              <div className="relative" ref={districtMenuRef}>
                <button
                  type="button"
                  onClick={() => setDistrictDropdownOpen(!districtDropdownOpen)}
                  className={`px-3.5 py-1.5 rounded-full border text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                    specialtyDistricts.some((d) => d.id === selectedDistrict)
                      ? 'border-[var(--aura-gold)] bg-[var(--aura-gold)]/15 text-[var(--aura-gold)] font-bold shadow-gold-glow-sm'
                      : 'border-[var(--border-primary)] bg-[var(--bg-card-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--aura-gold)]/50'
                  }`}
                >
                  <LocationPinIcon className="w-3.5 h-3.5" />
                  <span>
                    {specialtyDistricts.find((d) => d.id === selectedDistrict)?.label ||
                      `More Districts (${specialtyDistricts.length})`}
                  </span>
                  <ChevronDownIcon
                    className={`w-3 h-3 transition-transform duration-200 ${
                      districtDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {districtDropdownOpen && (
                  <div className="absolute left-1/2 -translate-x-1/2 sm:left-auto sm:right-0 sm:translate-x-0 mt-2 w-56 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-2xl p-2 shadow-2xl z-40 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border-primary)] flex justify-between items-center">
                      <span>Addis Ababa Sub-Cities</span>
                      <span className="text-[9px] text-[var(--aura-gold)] font-bold">Auto-Derived</span>
                    </div>
                    {specialtyDistricts.map((dist) => {
                      const isSelected = selectedDistrict === dist.id;
                      return (
                        <button
                          key={dist.id}
                          type="button"
                          onClick={() => {
                            setSelectedDistrict(dist.id);
                            setDistrictDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#E5B869]/15 text-[var(--aura-gold)] font-bold'
                              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-subtle)]'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <LocationPinIcon className="w-3.5 h-3.5 text-[var(--aura-gold)]" />
                            <span>{dist.label}</span>
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] font-mono">
                            {dist.count} {dist.count === 1 ? 'studio' : 'studios'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
      {/* END: Hero Search Section */}

      {/* SECTION 1: Featured Luxury Sanctuaries */}
      {featuredSalons.length > 0 && searchQuery === '' && selectedDistrict === 'All' && selectedCategory === 'All Categories' && (
        <section className="max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[var(--border-primary)] pb-4 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <StarIcon className="w-4 h-4 text-[var(--aura-gold)]" />
                <span className="text-xs uppercase tracking-[0.2em] text-[var(--aura-gold)] font-bold">
                  Editorial Spotlight
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-syne font-extrabold text-[var(--text-primary)] tracking-tight mt-1">
                Featured Sanctuaries
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
                Top-rated verified studios with priority booking and verified master specialists
              </p>
            </div>
            <a
              href="#all-salons"
              className="text-xs font-bold text-[var(--aura-gold)] hover:underline inline-flex items-center gap-1"
            >
              <span>Explore all studios below</span>
              <span>↓</span>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredSalons.map((salon) => (
              <SalonCard key={`featured-${salon.id}`} salon={salon} />
            ))}
          </div>
        </section>
      )}

      {/* SECTION 2: All Sanctuaries & Studios (Complete Filterable Directory) */}
      <section className="max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 space-y-8" id="all-salons">
        {/* Section Header with Category Filters */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between border-b border-[var(--border-primary)] pb-5 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BuildingIcon className="w-5 h-5 text-[var(--aura-gold)]" />
              <h2 className="text-2xl sm:text-3xl font-syne font-extrabold text-[var(--text-primary)] tracking-tight">
                All Sanctuaries & Studios
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
              Browse all registered beauty sanctuaries and studios across Addis Ababa ({filteredSalons.length} studios)
            </p>
          </div>

          {/* Modern Dynamic Category Selector: Top Pills + Sleek Dropdown */}
          <div className="flex flex-wrap items-center gap-2 relative">
            {/* Primary Category Quick Pills (Top 4 most common + All) */}
            {primaryPills.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setCategoryDropdownOpen(false);
                  }}
                  type="button"
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-[#E5B869] text-[#0A0B0E] font-bold shadow-gold-glow-sm scale-[1.02]'
                      : 'bg-[var(--bg-card-subtle)] border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--aura-gold)]/50'
                  }`}
                >
                  <CategoryIcon name={cat.id} className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}

            {/* Modern Dropdown for Specialty & Newly Registered Categories */}
            {specialtyCategories.length > 0 && (
              <div className="relative" ref={categoryMenuRef}>
                <button
                  type="button"
                  onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                    specialtyCategories.some((s) => s.id === selectedCategory)
                      ? 'bg-[#E5B869] text-[#0A0B0E] font-bold shadow-gold-glow-sm'
                      : 'bg-[var(--bg-card-subtle)] border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--aura-gold)]/50'
                  }`}
                >
                  <CategoryIcon
                    name={specialtyCategories.find((s) => s.id === selectedCategory)?.id || 'all'}
                    className="w-3.5 h-3.5"
                  />
                  <span>
                    {specialtyCategories.find((s) => s.id === selectedCategory)?.label ||
                      `More Rituals (${specialtyCategories.length})`}
                  </span>
                  <ChevronDownIcon
                    className={`w-3 h-3 transition-transform duration-200 ${
                      categoryDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {categoryDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-2xl p-2 shadow-2xl z-40 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border-primary)] flex justify-between items-center">
                      <span>Specialized Beauty Rituals</span>
                      <span className="text-[9px] text-[var(--aura-gold)] font-bold">Auto-Synced</span>
                    </div>
                    {specialtyCategories.map((spec) => {
                      const isSelected = selectedCategory === spec.id;
                      return (
                        <button
                          key={spec.id}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(spec.id);
                            setCategoryDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#E5B869]/15 text-[var(--aura-gold)] font-bold'
                              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-subtle)]'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <CategoryIcon name={spec.id} className="w-4 h-4 text-[var(--aura-gold)]" />
                            <span>{spec.label}</span>
                          </span>
                          {isSelected && <CheckIcon className="w-3.5 h-3.5 text-[var(--aura-gold)]" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Salons Grid (Paginated at 9 studios per page) */}
        {isLoading && salons.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={`skel-${i}`} className="glass-card rounded-3xl overflow-hidden border border-[var(--border-primary)] animate-pulse">
                <div className="h-60 bg-[var(--bg-card-subtle)]" />
                <div className="p-6 space-y-3">
                  <div className="h-4 bg-[var(--bg-card-subtle)] rounded w-3/4" />
                  <div className="h-3 bg-[var(--bg-card-subtle)] rounded w-1/2" />
                  <div className="h-8 bg-[var(--bg-card-subtle)] rounded w-full mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : paginatedSalons.length > 0 ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {paginatedSalons.map((salon) => (
                <SalonCard key={salon.id} salon={salon} />
              ))}
            </div>

            {/* Pagination Controls when studios exceed 9 */}
            {totalPages > 1 && (
              <div className="pt-6 flex flex-col sm:flex-row items-center justify-between border-t border-[var(--border-primary)] gap-4">
                <div className="text-xs text-[var(--text-secondary)] font-medium">
                  Showing{' '}
                  <span className="text-[var(--aura-gold)] font-bold">
                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                  </span>{' '}
                  -{' '}
                  <span className="text-[var(--aura-gold)] font-bold">
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredSalons.length)}
                  </span>{' '}
                  of <span className="text-[var(--text-primary)] font-bold">{filteredSalons.length}</span> studios
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPage((p) => Math.max(1, p - 1));
                      const el = document.getElementById('all-salons');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-xl text-xs font-bold border border-[var(--border-primary)] bg-[var(--bg-card-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--aura-gold)]/50 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                  >
                    ← Previous
                  </button>

                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: totalPages }).map((_, idx) => {
                      const pageNum = idx + 1;
                      const isActive = currentPage === pageNum;
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => {
                            setCurrentPage(pageNum);
                            const el = document.getElementById('all-salons');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className={`w-9 h-9 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                            isActive
                              ? 'bg-[#E5B869] text-[#0A0B0E] font-black shadow-gold-glow-sm scale-105'
                              : 'bg-[var(--bg-card-subtle)] border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--aura-gold)]/40'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                      const el = document.getElementById('all-salons');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-xl text-xs font-bold border border-[var(--border-primary)] bg-[var(--bg-card-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--aura-gold)]/50 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="glass-card rounded-3xl p-12 text-center max-w-xl mx-auto space-y-4 border border-[var(--border-primary)]">
            <div className="w-12 h-12 rounded-full bg-[var(--aura-gold)]/10 text-[var(--aura-gold)] flex items-center justify-center mx-auto">
              <SearchIcon className="w-6 h-6 text-[var(--aura-gold)]" />
            </div>
            <h3 className="font-syne text-lg font-bold text-[var(--text-primary)]">
              No Studios Match Your Search
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Try adjusting your district filter or clearing your search term to view all registered luxury studios in Addis Ababa.
            </p>
            <button
              onClick={() => {
                setSelectedDistrict('All');
                setSelectedCategory('All Categories');
                setSearchQuery('');
              }}
              className="px-6 py-2.5 rounded-full bg-[#E5B869] text-[#0A0B0E] text-xs font-bold hover:bg-[#F3D28E] transition shadow-sm cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </section>

      {/* BEGIN: How It Works */}
      <section className="max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-12" id="how-it-works">
        <div className="glass-card rounded-3xl p-8 sm:p-12 relative overflow-hidden border border-[var(--border-primary)] shadow-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--aura-gold)]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs uppercase tracking-[0.2em] text-[var(--aura-gold)] font-bold">
              Seamless Digital Sanctuary
            </span>
            <h2 className="text-3xl font-syne font-bold text-[var(--text-primary)] mt-2">
              How AuraSalon Works
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-2">
              From discovery to check-in, enjoy a luxury appointment booking experience tuned for Addis Ababa.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-3 p-5 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-primary)]">
              <span className="w-10 h-10 rounded-full bg-[#E5B869]/20 text-[#E5B869] font-syne font-bold flex items-center justify-center text-sm">
                01
              </span>
              <h4 className="font-syne font-bold text-base text-[var(--text-primary)]">
                Discover Verified Studios
              </h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Filter by Bole, Kazanchis, Sarbet, Piassa, or Old Airport. Review real customer ratings and transparent Ethiopian Birr pricing.
              </p>
            </div>

            <div className="space-y-3 p-5 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-primary)]">
              <span className="w-10 h-10 rounded-full bg-[#E5B869]/20 text-[#E5B869] font-syne font-bold flex items-center justify-center text-sm">
                02
              </span>
              <h4 className="font-syne font-bold text-base text-[var(--text-primary)]">
                Select Master Stylists
              </h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Choose your favorite specialist and choose precise appointment time slots directly matched with live salon timetables.
              </p>
            </div>

            <div className="space-y-3 p-5 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-primary)]">
              <span className="w-10 h-10 rounded-full bg-[#E5B869]/20 text-[#E5B869] font-syne font-bold flex items-center justify-center text-sm">
                03
              </span>
              <h4 className="font-syne font-bold text-base text-[var(--text-primary)]">
                Local Ethiopian Payment
              </h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Pay seamlessly with Telebirr, CBE Birr, Chapa, or opt for secure salon reception settlement with promo vouchers.
              </p>
            </div>

            <div className="space-y-3 p-5 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-primary)]">
              <span className="w-10 h-10 rounded-full bg-[#E5B869]/20 text-[#E5B869] font-syne font-bold flex items-center justify-center text-sm">
                04
              </span>
              <h4 className="font-syne font-bold text-base text-[var(--text-primary)]">
                Express QR Check-In
              </h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Receive an encrypted digital QR check-in pass. Scan on arrival at reception for VIP fast-track entrance.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* END: How It Works */}
    </div>
  );
}
