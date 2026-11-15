'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getStoredFavorites, removeFavorite, FavoriteItem, toggleFavorite } from '@/utils/favoritesStore';
import { fetchAllSalons } from '@/utils/salonApi';
import { Salon, Service } from '@/types';

export default function InstantBookingWidget() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'FAVORITES' | 'EXPLORE_SALONS'>('FAVORITES');

  // Favorites state
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [selectedFavId, setSelectedFavId] = useState<string>('');

  // Real database salons for browsing/searching
  const [allSalons, setAllSalons] = useState<Salon[]>([]);
  const [salonSearchQuery, setSalonSearchQuery] = useState('');
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState('All');
  const [expandedSalonId, setExpandedSalonId] = useState<string>('');

  // Sync favorites
  useEffect(() => {
    const sync = () => {
      const items = getStoredFavorites();
      setFavorites(items);
      if (items.length > 0 && !selectedFavId) {
        setSelectedFavId(items[0].id);
      }
      if (items.length === 0) {
        setActiveTab('EXPLORE_SALONS');
      }
    };
    sync();

    window.addEventListener('aurasalon_favorites_changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('aurasalon_favorites_changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, [selectedFavId]);

  // Load all salons from backend API
  useEffect(() => {
    if (isOpen) {
      async function loadSalons() {
        try {
          const list = await fetchAllSalons();
          if (Array.isArray(list) && list.length > 0) {
            setAllSalons(list);
            if (!expandedSalonId) {
              setExpandedSalonId(list[0].id);
            }
          }
        } catch (e) {
          console.error('Failed to load salons for instant booking:', e);
        }
      }
      loadSalons();
    }
  }, [isOpen, expandedSalonId]);

  const handleQuickBook = (fav: FavoriteItem) => {
    setIsOpen(false);
    router.push(`/booking?salonId=${fav.salonId}&services=${fav.serviceId}`);
  };

  const handleToggleServiceFav = (salon: Salon, service: Service) => {
    toggleFavorite(
      {
        id: salon.id,
        name: salon.name,
        slug: salon.slug,
        subCity: salon.subCity,
        coverImageUrl: salon.coverImageUrl,
      },
      {
        id: service.id,
        name: service.name,
        durationMin: service.durationMin,
        priceETB: service.priceETB,
        categoryName: service.categoryName,
      }
    );
  };

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeFavorite(id);
    if (selectedFavId === id) {
      const remaining = favorites.filter((f) => f.id !== id);
      setSelectedFavId(remaining.length > 0 ? remaining[0].id : '');
    }
  };

  const filteredSalons = allSalons.filter((s) => {
    const matchesDistrict =
      selectedDistrictFilter === 'All' || s.subCity.toLowerCase() === selectedDistrictFilter.toLowerCase();
    const matchesQuery =
      salonSearchQuery.trim() === '' ||
      s.name.toLowerCase().includes(salonSearchQuery.toLowerCase()) ||
      s.subCity.toLowerCase().includes(salonSearchQuery.toLowerCase()) ||
      s.services.some((srv) => srv.name.toLowerCase().includes(salonSearchQuery.toLowerCase()));
    return matchesDistrict && matchesQuery;
  });

  const activeFavorite = favorites.find((f) => f.id === selectedFavId) || favorites[0];

  return (
    <>
      {/* Floating Speed-Dial Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-5 py-3.5 rounded-full bg-gradient-to-r from-[#E5B869] to-[#C99A45] text-[#0A0B0E] font-syne font-extrabold text-xs uppercase tracking-wider shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 ring-2 ring-[#E5B869]/50 cursor-pointer"
          title="Instant VIP 1-Click Booking"
        >
          <span className="text-base animate-pulse">⚡</span>
          <span className="font-bold">Instant Booking</span>
          {favorites.length > 0 ? (
            <span className="w-5 h-5 rounded-full bg-[#0A0B0E] text-[#E5B869] text-[10px] flex items-center justify-center font-mono font-bold shadow-sm">
              {favorites.length}
            </span>
          ) : (
            <span className="w-2 h-2 rounded-full bg-[#0A0B0E] animate-ping" />
          )}
        </button>
      </div>

      {/* Modal Flyout */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="glass-card max-w-2xl w-full rounded-3xl p-6 sm:p-8 border border-[var(--border-primary)] shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-5 text-[var(--text-muted)] hover:text-[var(--text-primary)] w-8 h-8 rounded-full bg-[var(--bg-card-subtle)] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close"
            >
              ✕
            </button>

            {/* Header */}
            <div className="space-y-1.5 pr-8">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚡</span>
                <span className="text-xs uppercase tracking-[0.2em] text-[var(--aura-gold)] font-bold">
                  VIP Concierge Service
                </span>
              </div>
              <h3 className="text-2xl font-syne font-extrabold text-[var(--text-primary)]">
                Instant 1-Click Booking
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Choose your favorite salons and treatments across Addis Ababa for fast, 1-click reservations.
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center bg-[var(--bg-card-subtle)] p-1 rounded-2xl border border-[var(--border-primary)]">
              <button
                type="button"
                onClick={() => setActiveTab('FAVORITES')}
                className={`flex-1 py-2 text-xs font-syne font-bold uppercase tracking-wider rounded-xl transition cursor-pointer ${
                  activeTab === 'FAVORITES'
                    ? 'bg-[#E5B869] text-[#0A0B0E] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                My VIP Favorites ({favorites.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('EXPLORE_SALONS')}
                className={`flex-1 py-2 text-xs font-syne font-bold uppercase tracking-wider rounded-xl transition cursor-pointer ${
                  activeTab === 'EXPLORE_SALONS'
                    ? 'bg-[#E5B869] text-[#0A0B0E] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                🔍 Browse & Add Salons
              </button>
            </div>

            {/* TAB 1: USER'S FAVORITES */}
            {activeTab === 'FAVORITES' && (
              <div className="space-y-5">
                {favorites.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-3">
                    <p className="font-syne font-bold text-sm text-[var(--text-primary)]">
                      No Favorites Added Yet
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto leading-relaxed">
                      Select any salon in Addis Ababa to browse and choose your favorite signature treatments for 1-click booking.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('EXPLORE_SALONS')}
                      className="px-5 py-2 rounded-full bg-[#E5B869] text-[#0A0B0E] text-xs font-bold hover:bg-[#F3D28E] transition cursor-pointer shadow-sm"
                    >
                      Browse Salons & Pick Favorites →
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                      {favorites.map((fav) => {
                        const isSelected = (selectedFavId || favorites[0].id) === fav.id;
                        return (
                          <div
                            key={fav.id}
                            onClick={() => setSelectedFavId(fav.id)}
                            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                              isSelected
                                ? 'border-2 border-[#E5B869] bg-[#E5B869]/15 shadow-md'
                                : 'border-[var(--border-primary)] bg-[var(--bg-card-subtle)] hover:border-[var(--aura-gold)]/50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-[var(--border-primary)]">
                                <Image
                                  src={fav.salonCoverImage}
                                  alt={fav.salonName}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-syne font-bold text-xs text-[var(--text-primary)]">
                                    {fav.salonName}
                                  </h4>
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-primary)] text-[var(--text-muted)] font-medium">
                                    {fav.salonSubCity}
                                  </span>
                                </div>
                                <p className="text-xs font-semibold text-[var(--aura-gold)]">
                                  {fav.serviceName}
                                </p>
                                <p className="text-[10px] text-[var(--text-muted)] font-mono">
                                  {fav.durationMin} mins • ETB {fav.priceETB.toLocaleString()}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {isSelected && (
                                <span className="w-6 h-6 rounded-full bg-[#E5B869] text-[#0A0B0E] font-bold text-xs flex items-center justify-center">
                                  ✓
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={(e) => handleRemove(e, fav.id)}
                                className="text-[var(--text-muted)] hover:text-red-500 text-xs p-1 transition-colors cursor-pointer"
                                title="Remove from favorites"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Instant Action CTA */}
                    {activeFavorite && (
                      <div className="pt-2 border-t border-[var(--border-primary)] space-y-3">
                        <button
                          type="button"
                          onClick={() => handleQuickBook(activeFavorite)}
                          className="w-full py-4 rounded-full bg-gradient-to-r from-[#E5B869] to-[#C99A45] text-[#0A0B0E] font-syne font-extrabold text-sm uppercase tracking-wider hover:opacity-95 active:scale-95 transition-all shadow-gold-glow flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <span>⚡ Instant Reserve: {activeFavorite.serviceName}</span>
                          <span>→</span>
                        </button>
                        <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                          <span>
                            Direct checkout at <strong className="text-[var(--text-primary)]">{activeFavorite.salonName}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveTab('EXPLORE_SALONS')}
                            className="text-[var(--aura-gold)] font-bold hover:underline cursor-pointer"
                          >
                            + Add Another Salon / Treatment
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* TAB 2: EXPLORE ANY SALON & CHOOSE SERVICES */}
            {activeTab === 'EXPLORE_SALONS' && (
              <div className="space-y-4">
                {/* Search & Filter Bar */}
                <div className="space-y-2">
                  <input
                    type="text"
                    value={salonSearchQuery}
                    onChange={(e) => setSalonSearchQuery(e.target.value)}
                    placeholder="Search any salon (e.g. Queen Saba, Sarbet, Kazanchis, Piassa)..."
                    className="w-full bg-[var(--bg-card-subtle)] border border-[var(--border-primary)] rounded-xl px-4 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--aura-gold)]"
                  />

                  {/* District Chips */}
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    {['All', 'Bole', 'Kazanchis', 'Piassa', 'Old Airport', 'Sarbet'].map((dist) => (
                      <button
                        key={dist}
                        type="button"
                        onClick={() => setSelectedDistrictFilter(dist)}
                        className={`px-3 py-1 rounded-full border text-[11px] font-semibold transition cursor-pointer ${
                          selectedDistrictFilter === dist
                            ? 'bg-[#E5B869] text-[#0A0B0E] border-[#E5B869] font-bold'
                            : 'bg-[var(--bg-card-subtle)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:border-[var(--aura-gold)]/40'
                        }`}
                      >
                        {dist}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Salons List with Expandable Treatments */}
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {filteredSalons.map((salon) => {
                    const isExpanded = expandedSalonId === salon.id;
                    const favoriteServicesInThisSalon = favorites.filter((f) => f.salonId === salon.id);

                    return (
                      <div
                        key={salon.id}
                        className={`rounded-2xl border transition-all overflow-hidden ${
                          isExpanded
                            ? 'border-[var(--aura-gold)] bg-[var(--bg-card-subtle)]/90 shadow-sm'
                            : 'border-[var(--border-primary)] bg-[var(--bg-card-subtle)]/50 hover:border-[var(--aura-gold)]/40'
                        }`}
                      >
                        {/* Salon Item Header */}
                        <div
                          onClick={() => setExpandedSalonId(isExpanded ? '' : salon.id)}
                          className="p-3.5 flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-[var(--border-primary)]">
                              <Image
                                src={salon.coverImageUrl}
                                alt={salon.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-syne font-bold text-xs text-[var(--text-primary)]">
                                  {salon.name}
                                </h4>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-surface)] text-[var(--text-muted)] font-medium border border-[var(--border-primary)]">
                                  {salon.subCity}
                                </span>
                              </div>
                              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                                {salon.services.length} Treatment{salon.services.length !== 1 ? 's' : ''} available
                                {favoriteServicesInThisSalon.length > 0 && (
                                  <span className="text-[var(--aura-gold)] font-bold ml-1.5">
                                    • {favoriteServicesInThisSalon.length} Saved in Favorites
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-syne font-bold text-[var(--aura-gold)]">
                              {isExpanded ? 'Hide Treatments ▲' : 'Select Treatments ▼'}
                            </span>
                          </div>
                        </div>

                        {/* Expanded Treatments List */}
                        {isExpanded && (
                          <div className="p-3.5 pt-0 border-t border-[var(--border-primary)] bg-[var(--bg-surface)]/70 space-y-2">
                            <p className="text-[10px] uppercase tracking-wider font-bold text-[var(--text-muted)] pt-2">
                              Tap to add or remove signature treatments from this salon:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {salon.services.map((service) => {
                                const isFav = favorites.some(
                                  (f) => f.salonId === salon.id && f.serviceId === service.id
                                );
                                return (
                                  <div
                                    key={service.id}
                                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition ${
                                      isFav
                                        ? 'border-[#E5B869] bg-[#E5B869]/15'
                                        : 'border-[var(--border-primary)] bg-[var(--bg-card-subtle)]'
                                    }`}
                                  >
                                    <div className="min-w-0">
                                      <p className="font-bold text-xs text-[var(--text-primary)] truncate">
                                        {service.name}
                                      </p>
                                      <p className="text-[10px] text-[var(--text-muted)] font-mono">
                                        {service.durationMin}m • ETB {service.priceETB.toLocaleString()}
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleServiceFav(salon, service)}
                                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 transition cursor-pointer ${
                                        isFav
                                          ? 'bg-rose-500/20 text-rose-500 border border-rose-500/40'
                                          : 'bg-[#E5B869] text-[#0A0B0E] hover:bg-[#F3D28E]'
                                      }`}
                                    >
                                      {isFav ? '❤️ Saved' : '+ Add'}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
