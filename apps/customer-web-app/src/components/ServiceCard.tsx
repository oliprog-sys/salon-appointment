import React from 'react';
import { Service } from '../types';

interface ServiceCardProps {
  service: Service;
  isSelected?: boolean;
  onSelect?: (service: Service) => void;
}

export default function ServiceCard({ service, isSelected = false, onSelect }: ServiceCardProps) {
  return (
    <div
      className={`glass-card rounded-xl p-5 transition-all duration-300 flex flex-col justify-between border ${
        isSelected ? 'border-[#E5B869] bg-[#E5B869]/10' : 'border-[#222734] hover:border-[#E5B869]/40'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            {service.categoryName && (
              <span className="text-[10px] uppercase tracking-wider text-[#E5B869] font-semibold block mb-0.5">
                {service.categoryName}
              </span>
            )}
            <h4 className="font-syne text-base font-bold text-white">{service.name}</h4>
          </div>
          <span className="text-sm font-bold text-[#E5B869] whitespace-nowrap bg-[#0A0B0E]/60 px-2.5 py-1 rounded-md border border-[#E5B869]/20">
            ETB {service.priceETB.toLocaleString()}
          </span>
        </div>

        <p className="text-xs text-[#8A92A6] leading-relaxed mb-4">{service.description}</p>
      </div>

      <div className="flex items-center justify-between border-t border-[#222734] pt-3 text-xs text-[#8A92A6]">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5 text-[#E5B869]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {service.durationMin} mins
        </span>

        {onSelect && (
          <button
            onClick={() => onSelect(service)}
            type="button"
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
              isSelected
                ? 'bg-[#E5B869] text-[#0A0B0E] shadow-gold-glow-sm'
                : 'bg-[#111318] border border-[#E5B869]/40 text-[#E5B869] hover:bg-[#E5B869] hover:text-[#0A0B0E]'
            }`}
          >
            {isSelected ? '✓ Selected' : '+ Select Service'}
          </button>
        )}
      </div>
    </div>
  );
}
