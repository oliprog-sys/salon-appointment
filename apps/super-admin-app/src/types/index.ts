export type KycStatus = 'PENDING_KYC' | 'APPROVED' | 'REJECTED';

export interface SalonApprovalItem {
  id: string;
  salonName: string;
  ownerName: string;
  subCity: string; // e.g. "Bole", "Kazanchis", "Sarbet", "Old Airport", "Piassa"
  tradeLicenseNo: string;
  tinNumber: string;
  phone: string;
  submittedDate: string;
  status: KycStatus;
  rejectionReason?: string;
  documentCount: number;
}

export type PayoutStatus = 'PAID' | 'PENDING_PAYOUT' | 'PROCESSING';
export type PayoutMethod = 'CBE_BIRR' | 'TELEBIRR' | 'AWASH_BANK' | 'DASHEN_BANK';

export interface CommissionLedgerItem {
  id: string;
  bookingId: string;
  salonName: string;
  subCity: string;
  customerName: string;
  totalBookingAmountETB: number;
  platformCommissionETB: number; // 10% platform share
  vendorPayoutETB: number; // 90% vendor share
  payoutMethod: PayoutMethod;
  payoutStatus: PayoutStatus;
  disbursementDate: string;
}

export interface EscalationTicket {
  id: string;
  customerName: string;
  customerPhone: string;
  salonName: string;
  issueType: 'NO_SHOW' | 'OVERCHARGED' | 'SERVICE_QUALITY' | 'REFUND_REQUEST';
  amountETB: number;
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED';
  createdDate: string;
}
