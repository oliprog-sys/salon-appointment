import type { Metadata } from 'next';
import { Hanken_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const hankenGrotesk = Hanken_Grotesk({
  variable: '--font-hanken',
  subsets: ['latin'],
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'AuraSalon Vendor Management Suite',
  description: 'Salon Owner & Manager Dashboard for AuraSalon Addis Ababa',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${hankenGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-50 text-slate-900 font-sans">{children}</body>
    </html>
  );
}
