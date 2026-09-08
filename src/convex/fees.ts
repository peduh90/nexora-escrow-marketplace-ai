/**
 * ─── NEXORA FEE ENGINE ─────────────────────────────────────────────────────
 *
 * Exact tiered fee schedule (KSh, single tier applies to the whole amount):
 *
 *  NORMAL MARKETPLACE
 *    Seller commission:  3%    KSh 1 – 4,999
 *                        2.5%  KSh 5,000 – 49,999
 *                        2%    KSh 50,000 – 199,999
 *                        1.5%  KSh 200,000+
 *    Buyer protection:   1%    KSh 1 – 10,000
 *                        0.75% KSh 10,001 – 50,000
 *                        0.5%  KSh 50,001 – 200,000
 *                        0.25% KSh 200,000+
 *
 *  FREELANCE MARKETPLACE
 *    Freelancer commission:  3%   KSh 1 – 5,000
 *                            2%   KSh 5,001 – 50,000
 *                            1.5% KSh 50,001 – 250,000
 *                            1%   KSh 250,000+
 *    Employer protection:    1%   KSh 1 – 10,000
 *                            0.75% KSh 10,001 – 50,000
 *                            0.5%  KSh 50,001 – 200,000
 *                            0.25% KSh 200,000+
 *
 * Rules enforced elsewhere:
 *  - Registration, listing, jobs, applications, portfolio, messaging, and
 *    browsing are always FREE (no fee function is ever applied to them).
 *  - Freelancers pay NO deposit / registration / application fee / mandatory
 *    subscription.
 *  - Withdrawals carry NO default Nexora percentage fee; only an actual
 *    configured external provider cost or a fixed service fee may apply, and it
 *    must be shown before confirmation.
 *  - Escrow is included within the applicable transaction fees (no separate
 *    escrow charge).
 */

export type FeeMarketplace = "product" | "freelance";

export interface Tier {
  min: number;
  max: number | null; // null = no upper bound
  rate: number; // decimal, e.g. 0.03 = 3%
}

export interface FeeBreakdown {
  rate: number; // effective rate for this amount
  fee: number; // rounded fee in KSh
  amount: number; // base amount the fee applies to
}

export const SELLER_COMMISSION_TIERS: Tier[] = [
  { min: 1, max: 4999, rate: 0.03 },
  { min: 5000, max: 49999, rate: 0.025 },
  { min: 50000, max: 199999, rate: 0.02 },
  { min: 200000, max: null, rate: 0.015 },
];

export const BUYER_PROTECTION_TIERS: Tier[] = [
  { min: 1, max: 10000, rate: 0.01 },
  { min: 10001, max: 50000, rate: 0.0075 },
  { min: 50001, max: 200000, rate: 0.005 },
  { min: 200001, max: null, rate: 0.0025 },
];

export const FREELANCER_COMMISSION_TIERS: Tier[] = [
  { min: 1, max: 5000, rate: 0.03 },
  { min: 5001, max: 50000, rate: 0.02 },
  { min: 50001, max: 250000, rate: 0.015 },
  { min: 250001, max: null, rate: 0.01 },
];

export const EMPLOYER_PROTECTION_TIERS: Tier[] = [
  { min: 1, max: 10000, rate: 0.01 },
  { min: 10001, max: 50000, rate: 0.0075 },
  { min: 50001, max: 200000, rate: 0.005 },
  { min: 200001, max: null, rate: 0.0025 },
];

/** Resolve the applicable tier for an amount, returning its rate. */
export function rateFor(tiers: Tier[], amount: number): number {
  const t = tiers.find((t) => amount >= t.min && (t.max === null || amount <= t.max));
  return t ? t.rate : tiers[tiers.length - 1].rate;
}

/** Compute a rounded fee breakdown for an amount against a tier list. */
export function feeFor(tiers: Tier[], amount: number): FeeBreakdown {
  const rate = rateFor(tiers, amount);
  return {
    rate,
    fee: Math.round(amount * rate),
    amount,
  };
}

/**
 * Seller (or freelancer) commission on a transaction amount, by marketplace.
 * `amount` is the listed price / service price before any fees.
 */
export function sellerCommission(marketplace: FeeMarketplace, amount: number): FeeBreakdown {
  const tiers =
    marketplace === "freelance" ? FREELANCER_COMMISSION_TIERS : SELLER_COMMISSION_TIERS;
  return feeFor(tiers, amount);
}

/**
 * Buyer (or employer) protection fee on a transaction amount, by marketplace.
 */
export function buyerProtectionFee(marketplace: FeeMarketplace, amount: number): FeeBreakdown {
  const tiers =
    marketplace === "freelance" ? EMPLOYER_PROTECTION_TIERS : BUYER_PROTECTION_TIERS;
  return feeFor(tiers, amount);
}

/**
 * Total the buyer pays for a transaction: base amount + buyer protection fee.
 * (Seller commission is deducted from the seller's payout, not added on top.)
 */
export function buyerTotal(marketplace: FeeMarketplace, amount: number): { total: number; buyerFee: FeeBreakdown } {
  const buyerFee = buyerProtectionFee(marketplace, amount);
  return { total: amount + buyerFee.fee, buyerFee };
}

/**
 * What the seller/freelancer nets from a transaction: amount − seller commission.
 */
export function sellerPayout(marketplace: FeeMarketplace, amount: number): { payout: number; commission: FeeBreakdown } {
  const commission = sellerCommission(marketplace, amount);
  return { payout: amount - commission.fee, commission };
}

/**
 * Human-readable rate label for display, e.g. "2.5%".
 */
export function rateLabel(rate: number): string {
  return `${(rate * 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;
}
