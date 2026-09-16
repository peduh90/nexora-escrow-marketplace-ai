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

export type FeeMarketplace = "product" | "freelance" | "services" | "transport";

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
// Rule-driven resolution lives further below (feeFromRule / resolveFee).
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

// ─── Rule-driven fee engine (admin-configurable) ───────────────────────
// Admin-managed rules live in the feeRules table; transactions snapshot their
// fees at charge time, so editing a rule NEVER changes fees already applied to
// completed or in-flight transactions. Falls back to the legacy tiered
// constants above when a rule is missing or inactive (so the engine never
// computes 0 fees by accident).

export interface AdminFeeRule {
  key: string;
  marketplace: string;
  feeType: string;
  label: string;
  payer: "seller" | "buyer";
  mode: "percentage" | "fixed";
  tiers: { min: number; max?: number; rate?: number; fixed?: number }[];
  minThreshold?: number;
  maxCap?: number;
  effectiveFrom: number;
  active: boolean;
}

/** Rule key for a marketplace + fee type pair. */
export function ruleKeyFor(marketplace: string, feeType: string): string {
  return `${marketplace}.${feeType}`;
}

/**
 * Compute a fee breakdown from an admin rule. Returns null when the rule is
 * inactive, not yet effective, or below the minimum threshold — the caller
 * then falls back to the legacy tier constants.
 */
export function feeFromRule(
  rule: AdminFeeRule | null | undefined,
  amount: number,
): FeeBreakdown | null {
  if (!rule || !rule.active) return null;
  if (rule.effectiveFrom > Date.now()) return null;
  if (typeof rule.minThreshold === "number" && amount < rule.minThreshold) return null;

  const tier = rule.tiers.find((t) => amount >= t.min && (t.max === undefined || amount <= t.max));
  const useTier = tier ?? rule.tiers[rule.tiers.length - 1];
  if (!useTier) return null;

  let fee: number;
  let rate: number;
  if (rule.mode === "fixed") {
    fee = Math.round(useTier.fixed ?? 0);
    rate = amount > 0 ? fee / amount : 0;
  } else {
    rate = useTier.rate ?? 0;
    fee = Math.round(amount * rate);
  }
  if (typeof rule.maxCap === "number" && fee > rule.maxCap) fee = Math.round(rule.maxCap);

  return { rate, fee, amount };
}

/**
 * Canonical backend resolver used by every transaction engine: try the admin
 * rule first, then the legacy tiered constants. This is the single source of
 * truth for what a transaction is actually charged.
 */
export async function resolveFee(
  db: any,
  marketplace: FeeMarketplace,
  feeType: "seller_commission" | "buyer_protection",
  amount: number,
): Promise<{ breakdown: FeeBreakdown; ruleKey: string | null; ruleRate: number | null }> {
  const key = ruleKeyFor(marketplace, feeType);
  try {
    const rule = await db.query("feeRules").withIndex("by_key", (q: any) => q.eq("key", key)).unique();
    const fromRule = feeFromRule(rule as AdminFeeRule | undefined, amount);
    if (fromRule) return { breakdown: fromRule, ruleKey: key, ruleRate: fromRule.rate };
  } catch {
    // Table not deployed yet or query failed — legacy tiers keep fees flowing.
  }
  const breakdown =
    feeType === "seller_commission" ? sellerCommission(marketplace, amount) : buyerProtectionFee(marketplace, amount);
  return { breakdown, ruleKey: null, ruleRate: null };
}

/**
 * Append a collected fee to the platformFeeEarnings ledger. One row per fee
 * actually charged — this is where the platform's fee revenue accumulates.
 * Called by the transaction engines at the moment a fee is realized.
 */
export async function recordFeeEarning(
  db: any,
  entry: {
    sourceType: string;
    marketplace: string;
    feeType: string;
    ruleKey?: string | null;
    ruleRate?: number | null;
    amount: number;
    baseAmount: number;
    escrowId?: string;
    bookingId?: string;
    orderId?: string;
    projectId?: string;
    requestId?: string;
    tripId?: string;
    buyerId?: string;
    sellerId?: string;
    description?: string;
  },
): Promise<void> {
  if (!entry.amount || entry.amount <= 0) return; // never ledger zero fees
  await db.insert("platformFeeEarnings", {
    sourceType: entry.sourceType,
    marketplace: entry.marketplace,
    feeType: entry.feeType,
    ruleKey: entry.ruleKey ?? undefined,
    ruleRate: entry.ruleRate ?? undefined,
    amount: Math.round(entry.amount),
    baseAmount: entry.baseAmount,
    escrowId: entry.escrowId,
    bookingId: entry.bookingId,
    orderId: entry.orderId,
    projectId: entry.projectId,
    requestId: entry.requestId,
    tripId: entry.tripId,
    buyerId: entry.buyerId,
    sellerId: entry.sellerId,
    description: entry.description,
    createdAt: Date.now(),
  });
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
