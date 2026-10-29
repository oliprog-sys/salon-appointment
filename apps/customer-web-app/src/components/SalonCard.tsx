import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Salon } from '../types';

interface SalonCardProps {
  salon: Salon;
}

export default function SalonCard({ salon }: SalonCardProps) {
  return (
    <div className="group glass-card rounded-2xl overflow-hidden hover:border-[#E5B869]/50 transition-all duration-300 shadow-card-hover flex flex-col justify-between">
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
          <div className="absolute inset-0 bg-gradient-to-t from-[#111318] via-transparent to-transparent opacity-80" />

          {/* Rating Badge */}
          <div className="absolute top-3 right-3 bg-[#0A0B0E]/85 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 border border-[#E5B869]/30">
            <svg className="w-3.5 h-3.5 fill-[#E5B869]" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-xs font-bold text-white">{salon.rating}</span>
            <span className="text-[10px] text-[#8A92A6]">({salon.reviewCount})</span>
          </div>

          {/* Sub-City Location Tag */}
          <div className="absolute top-3 left-3 bg-[#E5B869]/20 backdrop-blur-md border border-[#E5B869]/40 text-[#E5B869] text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full">
            {salon.subCity}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="font-syne text-xl font-bold text-white group-hover:text-[#E5B869] transition-colors">
              {salon.name}
            </h3>
            {salon.isVerified && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#E5B869] text-[#0A0B0E]" title="Verified Studio">
                <svg className="w-2.5 h-2.5 stroke-current stroke-[3]" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
            )}
          </div>

          <p className="text-xs text-[#8A92A6] line-clamp-2 mb-4">
            {salon.description}
          </p>

          <div className="flex items-center justify-between text-xs text-[#8A92A6] border-t border-[#222734] pt-4">
            <span className="flex items-center gap-1.5 text-gray-300">
              <svg className="w-4 h-4 text-[#E5B869]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {salon.address}
            </span>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="px-6 pb-6 pt-2 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-[#8A92A6] block">Starting from</span>
          <span className="text-sm font-semibold text-[#E5B869]">{salon.priceRange}</span>
        </div>

        <Link
          href={`/salon/${salon.slug}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[#111318] border border-[#E5B869]/40 text-[#E5B869] hover:bg-[#E5B869] hover:text-[#0A0B0E] transition-all duration-200"
        >
          <span>View Menu & Book</span>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
