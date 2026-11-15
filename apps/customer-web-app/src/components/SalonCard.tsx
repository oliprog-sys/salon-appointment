import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Salon } from '../types';
import { StarIcon, CheckIcon, LocationPinIcon, ChevronRightIcon } from './icons/Icons';

interface SalonCardProps {
  salon: Salon;
}

export default function SalonCard({ salon }: SalonCardProps) {
  return (
    <div className="group glass-card rounded-2xl overflow-hidden hover:border-[var(--aura-gold)]/60 transition-all duration-300 shadow-card-hover flex flex-col justify-between">
      <div>
        {/* Card Media Header */}
        <div className="relative h-56 w-full overflow-hidden">
          <Image
            src={salon.coverImageUrl}
            alt={salon.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />

          {/* Rating Badge */}
          <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 border border-[#E5B869]/40 shadow-sm">
            <StarIcon className="w-3.5 h-3.5 text-[#E5B869]" fill="#E5B869" />
            <span className="text-xs font-bold text-white">{salon.rating}</span>
            <span className="text-[10px] text-gray-300">({salon.reviewCount})</span>
          </div>

          {/* Sub-City Location Tag */}
          <div className="absolute top-3 left-3 bg-[#E5B869]/25 backdrop-blur-md border border-[#E5B869]/50 text-[#E5B869] text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
            <LocationPinIcon className="w-3 h-3 text-[#E5B869]" />
            <span>{salon.subCity}</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="font-syne text-xl font-bold text-[var(--text-primary)] group-hover:text-[var(--aura-gold)] transition-colors">
              {salon.name}
            </h3>
            {salon.isVerified ? (
              <span
                className="shrink-0 w-4 h-4 min-w-[16px] min-h-[16px] aspect-square inline-flex items-center justify-center rounded-full bg-[#E5B869] text-[#0A0B0E] shadow-xs"
                title="Super Admin Verified Studio (KYC & Safety Standards Approved)"
              >
                <CheckIcon className="w-2.5 h-2.5 stroke-[3]" />
              </span>
            ) : (
              <span
                className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border border-[var(--border-primary)] text-[var(--text-muted)] bg-[var(--bg-card-subtle)]"
                title="Studio registration submitted — undergoing platform verification"
              >
                Unverified
              </span>
            )}
          </div>

          <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-4 leading-relaxed">
            {salon.description}
          </p>

          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] border-t border-[var(--border-primary)] pt-4">
            <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
              <LocationPinIcon className="w-4 h-4 text-[var(--aura-gold)] shrink-0" />
              <span className="truncate">{salon.address}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="px-6 pb-6 pt-2 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold block">Starting from</span>
          <span className="text-sm font-extrabold text-[var(--aura-gold)]">{salon.priceRange}</span>
        </div>

        <Link
          href={`/salon/${salon.slug}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-[var(--bg-card-subtle)] border border-[var(--aura-gold)]/40 text-[var(--aura-gold)] hover:bg-[#E5B869] hover:text-[#0A0B0E] transition-all duration-200 shadow-sm"
        >
          <span>View Menu & Book</span>
          <ChevronRightIcon className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
