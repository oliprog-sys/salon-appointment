import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[var(--bg-surface)] border-t border-[var(--border-primary)] pt-16 pb-12 text-[var(--text-secondary)] transition-colors duration-250">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-[var(--border-primary)]">
          {/* Brand Column */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="inline-block">
              <span className="font-syne text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                Aura<span className="text-[var(--aura-gold)] font-extrabold">Salon</span>
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-[var(--text-muted)]">
              Ethiopia’s leading digital sanctuary for luxury beauty, hair braiding, barbers, and wellness reservations in Addis Ababa.
            </p>
          </div>

          {/* Popular Districts */}
          <div>
            <h4 className="font-syne text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-4">
              Addis Ababa Sub-Cities
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/?district=Bole" className="hover:text-[var(--aura-gold)] transition-colors">Bole Medhanialem & Atlas</Link></li>
              <li><Link href="/?district=Kazanchis" className="hover:text-[var(--aura-gold)] transition-colors">Kazanchis & UNECA Area</Link></li>
              <li><Link href="/?district=Old+Airport" className="hover:text-[var(--aura-gold)] transition-colors">Old Airport & Sarbet</Link></li>
              <li><Link href="/?district=Piassa" className="hover:text-[var(--aura-gold)] transition-colors">Piassa & Churchill Ave</Link></li>
              <li><Link href="/?district=Sarbet" className="hover:text-[var(--aura-gold)] transition-colors">Sarbet & Vatican Embassy</Link></li>
            </ul>
          </div>

          {/* Service Categories */}
          <div>
            <h4 className="font-syne text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-4">
              Featured Categories
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/#explore" className="hover:text-[var(--aura-gold)] transition-colors">Hair Braiding & Artistry</Link></li>
              <li><Link href="/#explore" className="hover:text-[var(--aura-gold)] transition-colors">Luxury Spa & Body Therapy</Link></li>
              <li><Link href="/#explore" className="hover:text-[var(--aura-gold)] transition-colors">Barber & Executive Grooming</Link></li>
              <li><Link href="/#explore" className="hover:text-[var(--aura-gold)] transition-colors">Nails & Deluxe Manicure</Link></li>
              <li><Link href="/#explore" className="hover:text-[var(--aura-gold)] transition-colors">Skin & Botanical Facials</Link></li>
            </ul>
          </div>

          {/* Partner Onboarding & Payment Methods */}
          <div>
            <h4 className="font-syne text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-4">
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
              <p className="text-[11px] text-[var(--text-muted)]">
                List your salon, expand client reach in Addis Ababa, and automate floor management.
              </p>
              <div>
                <a
                  href={process.env.NEXT_PUBLIC_SALON_OWNER_URL ? `${process.env.NEXT_PUBLIC_SALON_OWNER_URL}/login` : "http://localhost:3001/login"}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-[var(--aura-gold)] hover:underline inline-flex items-center gap-1 font-semibold"
                >
                  Already a partner? Sign in here →
                </a>
              </div>
            </div>

            <h4 className="font-syne text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-2">
              Accepted Payments
            </h4>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-primary)] text-[var(--text-primary)] font-medium">Telebirr</span>
              <span className="px-2.5 py-1 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-primary)] text-[var(--text-primary)] font-medium">CBE Birr</span>
              <span className="px-2.5 py-1 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-primary)] text-[var(--text-primary)] font-medium">Chapa</span>
              <span className="px-2.5 py-1 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-primary)] text-[var(--aura-gold)] font-bold">Pay at Salon</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--text-muted)] gap-4">
          <p>© {new Date().getFullYear()} AuraSalon Technologies. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-[var(--aura-gold)]">Privacy Policy</Link>
            <Link href="#" className="hover:text-[var(--aura-gold)]">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
