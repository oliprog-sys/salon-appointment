import { SalonApprovalItem, CommissionLedgerItem, EscalationTicket } from '../types';

export const INITIAL_SALON_APPROVALS: SalonApprovalItem[] = [
  {
    id: 'kyc-101',
    salonName: 'Queen Saba Beauty Lounge',
    ownerName: 'Wassihun Tadesse',
    subCity: 'Bole Medhanialem',
    tradeLicenseNo: 'BL-ETH-2026-9941',
    tinNumber: '0049281742',
    phone: '+251 91 188 9900',
    submittedDate: '2026-10-01',
    status: 'PENDING_KYC',
    documentCount: 4
  },
  {
    id: 'kyc-102',
    salonName: 'Sarbet Velvet Nail & Lash Bar',
    ownerName: 'Tigist Bekele',
    subCity: 'Sarbet',
    tradeLicenseNo: 'SB-ETH-2026-3310',
    tinNumber: '0091823741',
    phone: '+251 92 334 5566',
    submittedDate: '2026-10-02',
    status: 'PENDING_KYC',
    documentCount: 3
  },
  {
    id: 'kyc-103',
    salonName: 'Aura Luxe Sanctuary',
    ownerName: 'Kedir Mohammed',
    subCity: 'Kazanchis',
    tradeLicenseNo: 'KZ-ETH-2026-1102',
    tinNumber: '0012938475',
    phone: '+251 91 223 4455',
    submittedDate: '2026-09-28',
    status: 'APPROVED',
    documentCount: 5
  },
  {
    id: 'kyc-104',
    salonName: 'Old Airport Executive Grooming',
    ownerName: 'Yonas Kebede',
    subCity: 'Old Airport',
    tradeLicenseNo: 'OA-ETH-2026-4481',
    tinNumber: '0055443322',
    phone: '+251 93 445 6677',
    submittedDate: '2026-09-25',
    status: 'APPROVED',
    documentCount: 4
  }
];

export const INITIAL_COMMISSION_LEDGERS: CommissionLedgerItem[] = [
  {
    id: 'led-501',
    bookingId: 'apt-101',
    salonName: 'Aura Luxe Sanctuary',
    subCity: 'Bole',
    customerName: 'Meron Hailu',
    totalBookingAmountETB: 1200,
    platformCommissionETB: 120, // 10%
    vendorPayoutETB: 1080, // 90%
    payoutMethod: 'TELEBIRR',
    payoutStatus: 'PAID',
    disbursementDate: '2026-10-03'
  },
  {
    id: 'led-502',
    bookingId: 'apt-102',
    salonName: 'Queen Saba Beauty Lounge',
    subCity: 'Bole Medhanialem',
    customerName: 'Tigist Bekele',
    totalBookingAmountETB: 2500,
    platformCommissionETB: 250,
    vendorPayoutETB: 2250,
    payoutMethod: 'CBE_BIRR',
    payoutStatus: 'PAID',
    disbursementDate: '2026-10-03'
  },
  {
    id: 'led-503',
    bookingId: 'apt-103',
    salonName: 'Sarbet Velvet Nail & Lash Bar',
    subCity: 'Sarbet',
    customerName: 'Henok Girma',
    totalBookingAmountETB: 1800,
    platformCommissionETB: 180,
    vendorPayoutETB: 1620,
    payoutMethod: 'AWASH_BANK',
    payoutStatus: 'PENDING_PAYOUT',
    disbursementDate: '2026-10-04'
  },
  {
    id: 'led-504',
    bookingId: 'apt-104',
    salonName: 'Old Airport Executive Grooming',
    subCity: 'Old Airport',
    customerName: 'Dawit Solomon',
    totalBookingAmountETB: 950,
    platformCommissionETB: 95,
    vendorPayoutETB: 855,
    payoutMethod: 'DASHEN_BANK',
    payoutStatus: 'PENDING_PAYOUT',
    disbursementDate: '2026-10-04'
  },
  {
    id: 'led-505',
    bookingId: 'apt-105',
    salonName: 'Aura Luxe Sanctuary',
    subCity: 'Bole',
    customerName: 'Rahel Alemu',
    totalBookingAmountETB: 2200,
    platformCommissionETB: 220,
    vendorPayoutETB: 1980,
    payoutMethod: 'TELEBIRR',
    payoutStatus: 'PAID',
    disbursementDate: '2026-10-03'
  }
];

export const INITIAL_ESCALATIONS: EscalationTicket[] = [
  {
    id: 'esc-901',
    customerName: 'Hiwot Worku',
    customerPhone: '+251 91 999 8877',
    salonName: 'Queen Saba Beauty Lounge',
    issueType: 'REFUND_REQUEST',
    amountETB: 850,
    status: 'OPEN',
    createdDate: '2026-10-02'
  },
  {
    id: 'esc-902',
    customerName: 'Sami Berhanu',
    customerPhone: '+251 92 111 4433',
    salonName: 'Sarbet Velvet Nail & Lash Bar',
    issueType: 'NO_SHOW',
    amountETB: 1100,
    status: 'IN_REVIEW',
    createdDate: '2026-10-01'
  }
];
