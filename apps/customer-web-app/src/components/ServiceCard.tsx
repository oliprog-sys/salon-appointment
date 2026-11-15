'use client';

import React, { useState, useEffect } from 'react';
import { Service } from '../types';
import { isServiceFavorited, toggleFavorite } from '@/utils/favoritesStore';

interface ServiceCardProps {
  service: Service;
  isSelected?: boolean;
  onSelect?: (service: Service) => void;
  salon?: { id: string; name: string; slug: string; subCity: string; coverImageUrl: string };
}

export default function ServiceCard({
  service,
  isSelected = false,
  onSelect,
  salon,
}: ServiceCardProps) {
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    if (salon) {
      setFavorited(isServiceFavorited(salon.id, service.id));
    }
  }, [salon, service.id]);

  const handleToggleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!salon) return;
    const nowFav = toggleFavorite(salon, service);
    setFavorited(nowFav);
  };

  return (
    <div
      className={`glass-card rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between border ${
        isSelected
          ? 'border-2 border-[#E5B869] bg-[#E5B869]/15 shadow-md ring-1 ring-[#E5B869]/30'
          : 'border-[var(--border-primary)] hover:border-[var(--aura-gold)]/50'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            {service.categoryName && (
              <span className="text-[10px] uppercase tracking-wider text-[var(--aura-gold)] font-bold block mb-0.5">
                {service.categoryName}
              </span>
            )}
            <h4 className="font-syne text-base font-bold text-[var(--text-primary)]">
              {service.name}
            </h4>
          </div>

          <div className="flex items-center gap-2">
            {salon && (
              <button
                type="button"
                onClick={handleToggleFav}
                title={
                  favorited
                    ? 'Remove from Instant VIP Favorites'
                    : 'Save to Instant VIP Favorites for 1-Click Booking'
                }
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all ${
                  favorited
                    ? 'bg-rose-500/20 text-rose-500 border border-rose-500/40 shadow-xs'
                    : 'bg-[var(--bg-card-subtle)] text-[var(--text-muted)] hover:text-rose-500 border border-[var(--border-primary)]'
                }`}
              >
                {favorited ? '❤️' : '🤍'}
              </button>
            )}
            <span className="text-sm font-extrabold text-[var(--aura-gold)] whitespace-nowrap bg-[var(--bg-card-subtle)] px-2.5 py-1 rounded-lg border border-[var(--border-primary)] shadow-sm font-mono">
              ETB {service.priceETB.toLocaleString()}
            </span>
          </div>
        </div>

        <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
          {service.description}
        </p>
      </div>

      <div className="flex items-center justify-between border-t border-[var(--border-primary)] pt-3 text-xs text-[var(--text-muted)]">
        <span className="flex items-center gap-1 font-mono text-[11px]">
          <svg className="w-3.5 h-3.5 text-[var(--aura-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {service.durationMin} mins
        </span>

        {onSelect && (
          <button
            onClick={() => onSelect(service)}
            type="button"
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
              isSelected
                ? 'bg-[#E5B869] text-[#0A0B0E] shadow-gold-glow-sm'
                : 'bg-[var(--bg-card-subtle)] border border-[var(--aura-gold)]/40 text-[var(--aura-gold)] hover:bg-[#E5B869] hover:text-[#0A0B0E]'
            }`}
          >
            {isSelected ? '✓ Selected' : '+ Select Service'}
          </button>
        )}
      </div>
    </div>
  );
}
