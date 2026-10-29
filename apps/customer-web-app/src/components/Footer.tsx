import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#0A0B0E] border-t border-[#222734] pt-16 pb-12 text-[#8A92A6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-[#222734]">
          {/* Brand Column */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="inline-block">
              <span className="font-syne text-2xl font-bold tracking-tight text-white">
                Aura<span className="text-[#E5B869] font-extrabold">Salon</span>
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-[#8A92A6]">
              Ethiopia’s leading digital sanctuary for luxury beauty, hair braiding, barbers, and wellness reservations in Addis Ababa.
            </p>
          </div>

          {/* Popular Districts */}
          <div>
            <h4 className="font-syne text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Addis Ababa Sub-Cities
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/?district=Bole" className="hover:text-[#E5B869] transition-colors">Bole Medhanialem & Atlas</Link></li>
              <li><Link href="/?district=Kazanchis" className="hover:text-[#E5B869] transition-colors">Kazanchis & UNECA Area</Link></li>
              <li><Link href="/?district=Old+Airport" className="hover:text-[#E5B869] transition-colors">Old Airport & Sarbet</Link></li>
              <li><Link href="/?district=Piassa" className="hover:text-[#E5B869] transition-colors">Piassa & Churchill Ave</Link></li>
              <li><Link href="/?district=Yeka" className="hover:text-[#E5B869] transition-colors">Yeka & CMC District</Link></li>
            </ul>
          </div>

          {/* Service Categories */}
          <div>
            <h4 className="font-syne text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Featured Categories
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/#explore" className="hover:text-[#E5B869] transition-colors">Hair Braiding & Artistry</Link></li>
              <li><Link href="/#explore" className="hover:text-[#E5B869] transition-colors">Luxury Spa & Body Therapy</Link></li>
              <li><Link href="/#explore" className="hover:text-[#E5B869] transition-colors">Executive Gentleman Grooming</Link></li>
              <li><Link href="/#explore" className="hover:text-[#E5B869] transition-colors">Volcanic Stone Pedicures</Link></li>
              <li><Link href="/#explore" className="hover:text-[#E5B869] transition-colors">Bridal & Glamour Makeup</Link></li>
            </ul>
          </div>

          {/* Partner Onboarding & Payment Methods */}
          <div>
            <h4 className="font-syne text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Partner With Us
            </h4>
            <div className="space-y-3 mb-6">
              <a
                href={process.env.NEXT_PUBLIC_SALON_OWNER_URL ? `${process.env.NEXT_PUBLIC_SALON_OWNER_URL}/register` : "http://localhost:3001/register"}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E5B869] text-[#0A0B0E] font-syne font-bold text-xs hover:bg-[#F3D28E] transition-all shadow-gold-glow-sm"
              >
                🤝 Partner with AuraSalon
              </a>
              <p className="text-[11px] text-[#8A92A6]">
                List your salon, expand client reach in Addis Ababa, and automate floor management.
              </p>
            </div>

            <h4 className="font-syne text-xs font-semibold text-white uppercase tracking-wider mb-2">
              Accepted Payments
            </h4>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 rounded bg-[#161922] border border-[#222734] text-white">Telebirr</span>
              <span className="px-2.5 py-1 rounded bg-[#161922] border border-[#222734] text-white">CBE Birr</span>
              <span className="px-2.5 py-1 rounded bg-[#161922] border border-[#222734] text-white">Chapa</span>
              <span className="px-2.5 py-1 rounded bg-[#161922] border border-[#222734] text-[#E5B869]">Pay at Salon</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#8A92A6] gap-4">
          <p>© {new Date().getFullYear()} AuraSalon Technologies. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-[#E5B869]">Privacy Policy</Link>
            <Link href="#" className="hover:text-[#E5B869]">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
