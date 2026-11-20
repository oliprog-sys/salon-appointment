'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeOffIcon } from '@/components/icons/Icons';
import { saveOwnerSession } from '@/utils/authSession';
import KycFileUpload from '@/components/onboarding/KycFileUpload';

type VerificationTier = 'TRADE_LICENSE' | 'SOLE_PROPRIETOR';
type GovtIdType = 'KEBELE_ID' | 'NATIONAL_ID' | 'PASSPORT';

export default function RegisterPartnerPage() {
  const router = useRouter();

  // Wizard Step State
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1: Owner Profile & Salon Details
  const [ownerFullName, setOwnerFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [salonName, setSalonName] = useState('');
  const [subCity, setSubCity] = useState('Bole');
  const [address, setAddress] = useState('');

  // Step 2: Legal Verification & KYC
  const [tier, setTier] = useState<VerificationTier>('TRADE_LICENSE');
  const [tinNumber, setTinNumber] = useState('');
  const [tradeLicenseUrl, setTradeLicenseUrl] = useState('');
  const [govtIdType, setGovtIdType] = useState<GovtIdType>('KEBELE_ID');
  const [govtIdNumber, setGovtIdNumber] = useState('');
  const [govtIdUrl, setGovtIdUrl] = useState('');

  // Step 3: Payout Designation & Agreement
  const [payoutBank, setPayoutBank] = useState('TELEBIRR');
  const [payoutAccount, setPayoutAccount] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const formatEthiopianPhone = (phone: string): string | null => {
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    if (/^\+251[79]\d{8}$/.test(cleaned)) {
      return cleaned;
    }
    if (/^0[79]\d{8}$/.test(cleaned)) {
      return `+251${cleaned.slice(1)}`;
    }
    if (/^[79]\d{8}$/.test(cleaned)) {
      return `+251${cleaned}`;
    }
    return null;
  };

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (ownerFullName.trim().length < 3) {
      setErrorMessage('Please enter the owner full name (at least 3 characters).');
      return;
    }

    const formattedPhone = formatEthiopianPhone(phoneNumber);
    if (!formattedPhone) {
      setErrorMessage('Please enter a valid Ethiopian mobile phone number (e.g. 0911 234567 or +251 911 234567).');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (salonName.trim().length < 2) {
      setErrorMessage('Please enter a valid salon name.');
      return;
    }

    if (!address.trim()) {
      setErrorMessage('Please enter the salon physical address in Addis Ababa.');
      return;
    }

    setCurrentStep(2);
  };

  const handleStep2Next = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (tier === 'TRADE_LICENSE') {
      const cleanTin = tinNumber.replace(/\D/g, '');
      if (cleanTin.length !== 10) {
        setErrorMessage('Ministry Taxpayer Identification Number (TIN) must be exactly 10 digits.');
        return;
      }
      if (!tradeLicenseUrl) {
        setErrorMessage('Please upload a copy of your Commercial Trade License (PDF, PNG, JPG).');
        return;
      }
    } else {
      if (!govtIdNumber.trim()) {
        setErrorMessage('Please enter your Government ID / Kebele card / Passport number.');
        return;
      }
      if (!govtIdUrl) {
        setErrorMessage('Please upload your Government-issued ID document (PDF, PNG, JPG).');
        return;
      }
    }

    setCurrentStep(3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!payoutAccount.trim()) {
      setErrorMessage('Please provide your payout account or mobile wallet number.');
      return;
    }

    if (!agreedToTerms) {
      setErrorMessage('You must accept the partner agreement and 90/10 payout terms to register.');
      return;
    }

    const formattedPhone = formatEthiopianPhone(phoneNumber);
    if (!formattedPhone) {
      setErrorMessage('Invalid phone number. Please return to Step 1.');
      return;
    }

    setIsLoading(true);

    try {
      const resolvedIdType = tier === 'TRADE_LICENSE' ? 'TRADE_LICENSE' : govtIdType;
      const cleanTin = tinNumber.replace(/\D/g, '');

      const payload: any = {
        ownerFullName: ownerFullName.trim(),
        phoneNumber: formattedPhone,
        email: email.trim() || undefined,
        password,
        salonName: salonName.trim(),
        address: address.trim(),
        subCity,
        idType: resolvedIdType,
        payoutBank,
        payoutAccount: payoutAccount.trim(),
      };

      if (tier === 'TRADE_LICENSE') {
        payload.tinNumber = cleanTin;
        payload.tradeLicenseUrl = tradeLicenseUrl;
      } else {
        payload.kebeleIdUrl = govtIdUrl;
        if (govtIdNumber.trim()) {
          payload.tinNumber = govtIdNumber.trim();
        }
      }

      const res = await fetch('http://localhost:4000/auth/partner/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        const message = Array.isArray(data.message) ? data.message.join(', ') : data.message;
        throw new Error(message || 'Registration failed. Please check your inputs.');
      }

      // Save backend session token, user data, and active salon state
      saveOwnerSession(data.accessToken, data.user);
      if (data.salon?.id) {
        localStorage.setItem('aurasalon_active_salon_id', data.salon.id);
      }
      localStorage.setItem('aurasalon_salon_status', 'PENDING_REVIEW');

      router.push('/');
    } catch (err: any) {
      setErrorMessage(err.message || 'Connection to backend server failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 selection:bg-emerald-500 selection:text-slate-950">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-extrabold text-2xl mx-auto shadow-lg shadow-emerald-500/20">
          A
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Partner with AuraSalon
        </h1>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Addis Ababa’s premier salon booking platform. Register your business and access verified client bookings.
        </p>

        {/* Wizard Progress Bar */}
        <div className="pt-6 pb-2">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-xl mx-auto">
            {/* Step 1 Pill */}
            <div
              onClick={() => currentStep > 1 && setCurrentStep(1)}
              className={`p-2.5 rounded-xl border text-left transition ${
                currentStep === 1
                  ? 'bg-slate-800 border-emerald-500 ring-1 ring-emerald-500/30'
                  : currentStep > 1
                  ? 'bg-slate-900 border-emerald-500/50 text-slate-300 cursor-pointer hover:bg-slate-850'
                  : 'bg-slate-900/60 border-slate-800 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    currentStep > 1
                      ? 'bg-emerald-500 text-slate-950'
                      : currentStep === 1
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {currentStep > 1 ? '✓' : '1'}
                </span>
                <span className="text-xs font-bold truncate">Salon Profile</span>
              </div>
            </div>

            {/* Step 2 Pill */}
            <div
              onClick={() => currentStep > 2 && setCurrentStep(2)}
              className={`p-2.5 rounded-xl border text-left transition ${
                currentStep === 2
                  ? 'bg-slate-800 border-emerald-500 ring-1 ring-emerald-500/30'
                  : currentStep > 2
                  ? 'bg-slate-900 border-emerald-500/50 text-slate-300 cursor-pointer hover:bg-slate-850'
                  : 'bg-slate-900/60 border-slate-800 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    currentStep > 2
                      ? 'bg-emerald-500 text-slate-950'
                      : currentStep === 2
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {currentStep > 2 ? '✓' : '2'}
                </span>
                <span className="text-xs font-bold truncate">Legal & KYC</span>
              </div>
            </div>

            {/* Step 3 Pill */}
            <div
              className={`p-2.5 rounded-xl border text-left transition ${
                currentStep === 3
                  ? 'bg-slate-800 border-emerald-500 ring-1 ring-emerald-500/30'
                  : 'bg-slate-900/60 border-slate-800 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    currentStep === 3
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  3
                </span>
                <span className="text-xs font-bold truncate">Payout & Terms</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-slate-900/90 py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-800 space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs font-medium flex items-center justify-between">
              <span>⚠️ {errorMessage}</span>
              <button
                type="button"
                onClick={() => setErrorMessage('')}
                className="text-rose-400 hover:text-rose-200 font-bold ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* STEP 1: OWNER PROFILE & SALON DETAILS */}
          {currentStep === 1 && (
            <form onSubmit={handleStep1Next} className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-base font-bold text-white">Owner & Salon Information</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enter your contact details and primary salon location in Addis Ababa.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Owner Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={ownerFullName}
                    onChange={(e) => setOwnerFullName(e.target.value)}
                    placeholder="e.g. Tigist Alemu"
                    className="w-full text-xs p-3 border border-slate-700 rounded-lg text-white bg-slate-800/90 font-medium focus:ring-2 focus:ring-emerald-500 outline-none placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Phone Number (+251) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0911 234567 or +251 911 234567"
                    className="w-full text-xs p-3 border border-slate-700 rounded-lg text-white bg-slate-800/90 font-mono font-medium focus:ring-2 focus:ring-emerald-500 outline-none placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Email Address (Optional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tigist@aurasalon.et"
                    className="w-full text-xs p-3 border border-slate-700 rounded-lg text-white bg-slate-800/90 font-medium focus:ring-2 focus:ring-emerald-500 outline-none placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Create Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full text-xs p-3 pr-10 border border-slate-700 rounded-lg text-white bg-slate-800/90 font-mono focus:ring-2 focus:ring-emerald-500 outline-none placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOffIcon className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <EyeIcon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Salon / Studio Brand Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={salonName}
                  onChange={(e) => setSalonName(e.target.value)}
                  placeholder="e.g. Queen Saba VIP Hair & Spa"
                  className="w-full text-xs p-3 border border-slate-700 rounded-lg text-white bg-slate-800/90 font-medium focus:ring-2 focus:ring-emerald-500 outline-none placeholder:text-slate-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Sub-City <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={subCity}
                    onChange={(e) => setSubCity(e.target.value)}
                    className="w-full text-xs p-3 border border-slate-700 rounded-lg text-white bg-slate-800/90 font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="Bole">Bole</option>
                    <option value="Kirkos">Kirkos</option>
                    <option value="Yeka">Yeka</option>
                    <option value="Arada">Arada</option>
                    <option value="Nifas Silk-Lafto">Nifas Silk-Lafto</option>
                    <option value="Kolfe Keranio">Kolfe Keranio</option>
                    <option value="Lideta">Lideta</option>
                    <option value="Akaki Kality">Akaki Kality</option>
                    <option value="Gullele">Gullele</option>
                    <option value="Addis Ketema">Addis Ketema</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Physical Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Bole Medhanialem, Edna Mall Tower 3rd Fl"
                    className="w-full text-xs p-3 border border-slate-700 rounded-lg text-white bg-slate-800/90 font-medium focus:ring-2 focus:ring-emerald-500 outline-none placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  Proceed to Legal & Document Verification →
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: LEGAL VERIFICATION & KYC */}
          {currentStep === 2 && (
            <form onSubmit={handleStep2Next} className="space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-base font-bold text-white">Business Verification & Legal KYC</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select your registration tier. Commercial businesses require a Ministry TIN & Trade License. Sole proprietors without a license can verify using official Government ID.
                </p>
              </div>

              {/* Verification Tier Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setTier('TRADE_LICENSE')}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    tier === 'TRADE_LICENSE'
                      ? 'bg-slate-800/90 border-emerald-500 ring-2 ring-emerald-500/30'
                      : 'bg-slate-850/50 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🏢</span>
                        <h3 className="text-xs font-bold text-white">Commercial Business</h3>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Registered salon, spa, or barbershop with official Ethiopian Trade License & TIN.
                      </p>
                    </div>
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
                        tier === 'TRADE_LICENSE'
                          ? 'border-emerald-500 bg-emerald-500 text-slate-950 font-bold text-[10px]'
                          : 'border-slate-600'
                      }`}
                    >
                      {tier === 'TRADE_LICENSE' && '✓'}
                    </span>
                  </div>
                  <div className="mt-2.5 inline-block">
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                      Recommended for Salons
                    </span>
                  </div>
                </div>

                <div
                  onClick={() => setTier('SOLE_PROPRIETOR')}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    tier === 'SOLE_PROPRIETOR'
                      ? 'bg-slate-800/90 border-emerald-500 ring-2 ring-emerald-500/30'
                      : 'bg-slate-850/50 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">👤</span>
                        <h3 className="text-xs font-bold text-white">Independent Artisan / Sole Proprietor</h3>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Operating without a trade license yet. Requires Kebele Resident ID, Fayda National ID, or Passport.
                      </p>
                    </div>
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
                        tier === 'SOLE_PROPRIETOR'
                          ? 'border-emerald-500 bg-emerald-500 text-slate-950 font-bold text-[10px]'
                          : 'border-slate-600'
                      }`}
                    >
                      {tier === 'SOLE_PROPRIETOR' && '✓'}
                    </span>
                  </div>
                  <div className="mt-2.5 inline-block">
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 rounded-full">
                      Government ID Fallback
                    </span>
                  </div>
                </div>
              </div>

              {/* TIER A FIELDS: TRADE LICENSE & TIN */}
              {tier === 'TRADE_LICENSE' && (
                <div className="space-y-4 pt-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-300">
                        Ministry Taxpayer Identification Number (TIN) <span className="text-rose-400">*</span>
                      </label>
                      <span className="text-[10px] font-mono text-slate-400">10-Digit Ministry Code</span>
                    </div>
                    <input
                      type="text"
                      maxLength={10}
                      value={tinNumber}
                      onChange={(e) => setTinNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 0049281742"
                      className="w-full text-xs p-3 border border-slate-700 rounded-lg text-white bg-slate-800/90 font-mono tracking-widest font-bold focus:ring-2 focus:ring-emerald-500 outline-none placeholder:text-slate-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Entered: {tinNumber.length} / 10 digits
                    </p>
                  </div>

                  <div>
                    <KycFileUpload
                      label="Commercial Trade License Document"
                      description="Clear copy of renewed business trade license (Addis Ababa City Admin)"
                      required
                      value={tradeLicenseUrl}
                      onChange={(url) => setTradeLicenseUrl(url)}
                      darkMode
                    />
                  </div>
                </div>
              )}

              {/* TIER B FIELDS: GOVT ID & ID NUMBER */}
              {tier === 'SOLE_PROPRIETOR' && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Government Identity Type <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={govtIdType}
                        onChange={(e) => setGovtIdType(e.target.value as GovtIdType)}
                        className="w-full text-xs p-3 border border-slate-700 rounded-lg text-white bg-slate-800/90 font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                      >
                        <option value="KEBELE_ID">Kebele Resident ID Card</option>
                        <option value="NATIONAL_ID">National ID (Fayda Digital ID)</option>
                        <option value="PASSPORT">Ethiopian Passport</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        {govtIdType === 'KEBELE_ID'
                          ? 'Kebele ID / Registration #'
                          : govtIdType === 'NATIONAL_ID'
                          ? 'Fayda National Identification #'
                          : 'Passport Number'}{' '}
                        <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={govtIdNumber}
                        onChange={(e) => setGovtIdNumber(e.target.value)}
                        placeholder="e.g. KB-104928"
                        className="w-full text-xs p-3 border border-slate-700 rounded-lg text-white bg-slate-800/90 font-mono font-medium focus:ring-2 focus:ring-emerald-500 outline-none placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  <div>
                    <KycFileUpload
                      label={
                        govtIdType === 'KEBELE_ID'
                          ? 'Upload Kebele ID Card (Front & Back)'
                          : govtIdType === 'NATIONAL_ID'
                          ? 'Upload National ID (Fayda Slip / Card)'
                          : 'Upload Passport Bio Page'
                      }
                      description="Ensure photo, name, and ID number are clearly legible"
                      required
                      value={govtIdUrl}
                      onChange={(url) => setGovtIdUrl(url)}
                      darkMode
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="w-1/3 py-3 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl transition"
                >
                  ← Back to Profile
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  Continue to Payout & Agreement →
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: PAYOUT DESIGNATION & PLATFORM AGREEMENT */}
          {currentStep === 3 && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-base font-bold text-white">Payout Account & Vendor Agreement</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Designate where your booking revenue will be deposited and review vendor payout terms.
                </p>
              </div>

              {/* Application Summary Box */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Application Summary
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full">
                    Ready for Submission
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-slate-400">Salon: </span>
                    <span className="font-bold text-white">{salonName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Sub-City: </span>
                    <span className="font-bold text-white">{subCity}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Owner: </span>
                    <span className="font-bold text-white">{ownerFullName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Tier: </span>
                    <span className="font-bold text-emerald-400">
                      {tier === 'TRADE_LICENSE' ? 'Commercial (Trade License)' : `Sole Proprietor (${govtIdType})`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payout Bank / Wallet */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Payout Destination <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={payoutBank}
                    onChange={(e) => setPayoutBank(e.target.value)}
                    className="w-full text-xs p-3 border border-slate-700 rounded-lg text-white bg-slate-800/90 font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="TELEBIRR">Telebirr (Instant Mobile Payout)</option>
                    <option value="CBE_BIRR">CBE Birr (Mobile Wallet)</option>
                    <option value="CBE">Commercial Bank of Ethiopia (CBE)</option>
                    <option value="AWASH">Awash Bank</option>
                    <option value="DASHEN">Dashen Bank</option>
                    <option value="ABYSSINIA">Bank of Abyssinia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Account / Mobile Wallet Number <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={payoutAccount}
                    onChange={(e) => setPayoutAccount(e.target.value)}
                    placeholder={
                      payoutBank === 'TELEBIRR' || payoutBank === 'CBE_BIRR'
                        ? 'e.g. 0911 234567'
                        : 'e.g. 1000123456789'
                    }
                    className="w-full text-xs p-3 border border-slate-700 rounded-lg text-white bg-slate-800/90 font-mono font-medium focus:ring-2 focus:ring-emerald-500 outline-none placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* 90/10 Agreement & Compliance Checkbox */}
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 space-y-3">
                <div className="flex items-start gap-3">
                  <input
                    id="termsAgreement"
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-400 cursor-pointer"
                  />
                  <label htmlFor="termsAgreement" className="text-xs text-slate-300 leading-relaxed cursor-pointer select-none">
                    <span className="font-bold text-white">Vendor Commercial Agreement & 90/10 Payout Terms:</span>{' '}
                    I certify that all business information and uploaded identity documents are authentic. I agree that AuraSalon retains a 10% platform fee and remits 90% of completed customer booking receipts to the designated payout account on a weekly settlement cycle.
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="w-1/3 py-3 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl transition"
                >
                  ← Back to KYC
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !agreedToTerms}
                  className="w-2/3 py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? 'Submitting Application...' : 'Submit Application & Create Partner Account →'}
                </button>
              </div>
            </form>
          )}

          {/* Direct link for existing owners & staff */}
          <div className="pt-4 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Already have a registered salon?{' '}
              <Link
                href="/login"
                className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2 ml-1"
              >
                Sign in to Dashboard
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
