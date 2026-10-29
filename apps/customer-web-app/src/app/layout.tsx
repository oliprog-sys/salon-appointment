import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "AuraSalon — Premier Beauty & Wellness Directory in Addis Ababa",
  description: "Discover and book top-rated salons, luxury spa sanctuaries, master braiders, and barbers in Addis Ababa with instant digital confirmation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Syne:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#0A0B0E] text-slate-100 min-h-screen flex flex-col justify-between selection:bg-[#E5B869] selection:text-[#0A0B0E]">
        <Navbar />
        <main className="flex-grow pt-24 pb-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
