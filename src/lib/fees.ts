/**
 * Frontend mirror of the canonical Nexora fee engine (src/convex/fees.ts).
 * Keep both files in sync — the convex one is authoritative for charging.
 */

export type FeeMarketplace = "product" | "freelance";

export interface Tier {
  min: number;
  max: number | null;
  rate: number;
}

export interface FeeBreakdown {
  rate: number;
  fee: number;
  amount: number;
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

export function rateFor(tiers: Tier[], amount: number): number {
  const t = tiers.find((t) => amount >= t.min && (t.max === null || amount <= t.max));
  return t ? t.rate : tiers[tiers.length - 1].rate;
}

export function feeFor(tiers: Tier[], amount: number): FeeBreakdown {
  const rate = rateFor(tiers, amount);
  return { rate, fee: Math.round(amount * rate), amount };
}

export function sellerCommission(marketplace: FeeMarketplace, amount: number): FeeBreakdown {
  const tiers = marketplace === "freelance" ? FREELANCER_COMMISSION_TIERS : SELLER_COMMISSION_TIERS;
  return feeFor(tiers, amount);
}

export function buyerProtectionFee(marketplace: FeeMarketplace, amount: number): FeeBreakdown {
  const tiers = marketplace === "freelance" ? EMPLOYER_PROTECTION_TIERS : BUYER_PROTECTION_TIERS;
  return feeFor(tiers, amount);
}

export function buyerTotal(marketplace: FeeMarketplace, amount: number): { total: number; buyerFee: FeeBreakdown } {
  const buyerFee = buyerProtectionFee(marketplace, amount);
  return { total: amount + buyerFee.fee, buyerFee };
}

export function sellerPayout(marketplace: FeeMarketplace, amount: number): { payout: number; commission: FeeBreakdown } {
  const commission = sellerCommission(marketplace, amount);
  return { payout: amount - commission.fee, commission };
}

export function rateLabel(rate: number): string {
  return `${(rate * 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;
}
