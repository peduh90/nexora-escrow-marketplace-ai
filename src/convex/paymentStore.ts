/**
 * ─── NEXORA PAYMENT STORE (queries & mutations, default runtime) ──────────
 *
 * All database access for the unified payment engine lives here so the
 * node-runtime actions in payments.ts can orchestrate providers while this
 * module guarantees idempotency, verification truth, and immutable fee
 * snapshots. Nothing here is client-callable except the explicitly exported
 * public queries marked as such.
 */

import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { resolveFee } from "./fees";
import type { FeeMarketplace } from "./fees";

// ─── Fee computation (centralized) ───────────────────────────────────────

export interface TransactionFees {
  baseAmount: number;
  buyerProtectionFee: number;
  buyerProtectionRate: number;
  sellerCommissionFee: number;
  sellerCommissionRate: number;
  buyerTotal: number;
  sellerNet: number;
  currency: string;
  marketplace: FeeMarketplace;
}

/**
 * THE centralized fee calculator — every provider path charges through this.
 * Wraps the platform fee engine (admin rules → tier schedule). Result is
 * snapshotted immutably onto the payment transaction at initiate time.
 */
export async function calculateTransactionFees(
  db: any,
  marketplace: FeeMarketplace,
  amount: number,
): Promise<{
  fees: TransactionFees;
  commissionRuleKey: string | null;
  protectionRuleKey: string | null;
  commissionRuleRate: number | null;
  protectionRuleRate: number | null;
}> {
  const commission = await resolveFee(db, marketplace, "seller_commission", amount);
  const protection = await resolveFee(db, marketplace, "buyer_protection", amount);
  const fees: TransactionFees = {
    baseAmount: amount,
    buyerProtectionFee: protection.breakdown.fee,
    buyerProtectionRate: protection.breakdown.rate,
    sellerCommissionFee: commission.breakdown.fee,
    sellerCommissionRate: commission.breakdown.rate,
    buyerTotal: amount + protection.breakdown.fee,
    sellerNet: amount - commission.breakdown.fee,
    currency: "KES",
    marketplace,
  };
  return {
    fees,
    commissionRuleKey: commission.ruleKey,
    protectionRuleKey: protection.ruleKey,
    commissionRuleRate: commission.ruleRate,
    protectionRuleRate: protection.ruleRate,
  };
}

// ─── Internal queries ────────────────────────────────────────────────────

/** Server-side fee computation for actions. */
export const computeFees = internalQuery({
  args: { marketplace: v.string(), amount: v.number() },
  handler: async (ctx, args) =>
    calculateTransactionFees(ctx.db, args.marketplace as FeeMarketplace, args.amount),
});

export const getByReference = internalQuery({
  args: { reference: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("paymentTransactions")
      .withIndex("by_reference", (q) => q.eq("reference", args.reference))
      .first();
  },
});

export const getByProviderRef = internalQuery({
  args: { providerRef: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("paymentTransactions")
      .withIndex("by_provider_ref", (q) => q.eq("providerRef", args.providerRef))
      .first();
  },
});

export const getTxById = internalQuery({
  args: { txId: v.string() },
  handler: async (ctx, args) => ctx.db.get(args.txId as any),
});

export const getRefund = internalQuery({
  args: { refundId: v.string() },
  handler: async (ctx, args) => ctx.db.get(args.refundId as any),
});

export const listAwaiting = internalQuery({
  args: { olderThanMs: v.number() },
  handler: async (ctx, args) => {
    const cutoff = Date.now() - args.olderThanMs;
    const rows = await ctx.db
      .query("paymentTransactions")
      .withIndex("by_status", (q) => q.eq("status", "awaiting_confirmation"))
      .collect();
    return rows.filter((r: any) => r.createdAt <= cutoff);
  },
});

// ─── Internal mutators (idempotent state machine) ────────────────────────

export const createTransaction = internalMutation({
  args: {
    reference: v.string(),
    provider: v.union(v.literal("mpesa"), v.literal("airtel_money"), v.literal("card")),
    purpose: v.string(),
    payerId: v.string(),
    payerToken: v.optional(v.string()),
    amount: v.number(),
    totalCharge: v.number(),
    currency: v.string(),
    status: v.union(v.literal("initiated"), v.literal("awaiting_confirmation")),
    providerRef: v.optional(v.string()),
    checkoutUrl: v.optional(v.string()),
    msisdn: v.optional(v.string()),
    feeSnapshot: v.record(v.string(), v.number()),
    commissionRuleKey: v.optional(v.string()),
    protectionRuleKey: v.optional(v.string()),
    commissionRuleRate: v.optional(v.number()),
    protectionRuleRate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("paymentTransactions")
      .withIndex("by_reference", (q) => q.eq("reference", args.reference))
      .first();
    if (existing) return existing._id;
    const now = Date.now();
    // Fold the charge totals into the immutable snapshot so verification and
    // the order gate always compare against the exact amount the buyer pays.
    const snapshot = {
      ...args.feeSnapshot,
      totalCharge: args.totalCharge,
    };
    return await ctx.db.insert("paymentTransactions", {
      reference: args.reference,
      provider: args.provider,
      purpose: args.purpose,
      payerId: args.payerId,
      payerToken: args.payerToken,
      amount: args.amount,
      currency: args.currency,
      status: args.status,
      providerRef: args.providerRef,
      checkoutUrl: args.checkoutUrl,
      msisdn: args.msisdn,
      feeSnapshot: snapshot,
      commissionRuleKey: args.commissionRuleKey,
      protectionRuleKey: args.protectionRuleKey,
      commissionRuleRate: args.commissionRuleRate,
      protectionRuleRate: args.protectionRuleRate,
      createdAt: now,
      updatedAt: now,
    } as any);
  },
});

/** Mark paid — idempotent; terminal-positive states never regress. */
export const markTransactionPaid = internalMutation({
  args: {
    reference: v.optional(v.string()),
    providerRef: v.optional(v.string()),
    providerStatus: v.optional(v.string()),
    providerData: v.optional(v.string()),
    fromWebhook: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const tx = await findTransaction(ctx, args.reference, args.providerRef);
    if (!tx) return null;
    if (["paid", "refunded", "partially_refunded"].includes(tx.status)) return tx._id;
    const now = Date.now();
    await ctx.db.patch(tx._id, {
      status: "paid",
      verifiedAt: now,
      providerStatus: args.providerStatus ?? tx.providerStatus,
      providerData: args.providerData ?? tx.providerData,
      webhookReceivedAt: args.fromWebhook ? now : tx.webhookReceivedAt,
      reconciledAt: args.fromWebhook ? tx.reconciledAt : (tx.reconciledAt ?? now),
      updatedAt: now,
    } as any);
    return tx._id;
  },
});

/** Mark failed/cancelled — idempotent; never overwrites a paid state. */
export const markTransactionFailed = internalMutation({
  args: {
    reference: v.optional(v.string()),
    providerRef: v.optional(v.string()),
    failureReason: v.string(),
    cancelled: v.optional(v.boolean()),
    providerData: v.optional(v.string()),
    fromWebhook: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const tx = await findTransaction(ctx, args.reference, args.providerRef);
    if (!tx) return null;
    if (["paid", "refunded", "partially_refunded"].includes(tx.status)) return tx._id;
    const now = Date.now();
    await ctx.db.patch(tx._id, {
      status: args.cancelled ? "cancelled" : "failed",
      failureReason: args.failureReason,
      providerData: args.providerData ?? tx.providerData,
      webhookReceivedAt: args.fromWebhook ? now : tx.webhookReceivedAt,
      updatedAt: now,
    } as any);
    return tx._id;
  },
});

async function findTransaction(ctx: any, reference?: string, providerRef?: string) {
  if (reference) {
    const byRef = await ctx.db
      .query("paymentTransactions")
      .withIndex("by_reference", (q: any) => q.eq("reference", reference))
      .first();
    if (byRef) return byRef;
  }
  if (providerRef) {
    return await ctx.db
      .query("paymentTransactions")
      .withIndex("by_provider_ref", (q: any) => q.eq("providerRef", providerRef))
      .first();
  }
  return null;
}

// ─── Refund state machine ────────────────────────────────────────────────

export const markRefundProcessing = internalMutation({
  args: { refundId: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.refundId as any, { status: "processing" } as any);
  },
});

export const markRefundCompleted = internalMutation({
  args: { refundId: v.string(), providerRefundId: v.string(), providerStatus: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.refundId as any, {
      status: "completed",
      providerRefundId: args.providerRefundId,
      providerStatus: args.providerStatus,
      completedAt: Date.now(),
    } as any);
  },
});

export const markRefundFailed = internalMutation({
  args: { refundId: v.string(), reason: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.refundId as any, {
      status: "failed",
      providerStatus: args.reason,
    } as any);
  },
});

export const applyRefundToTransaction = internalMutation({
  args: { txId: v.string(), amount: v.number() },
  handler: async (ctx, args) => {
    const tx = await ctx.db.get(args.txId as any);
    if (!tx) return;
    const refunded = ((tx as any).refundedAmount || 0) + args.amount;
    const status = refunded >= (tx as any).amount ? "refunded" : "partially_refunded";
    await ctx.db.patch(tx._id, { refundedAmount: refunded, status, updatedAt: Date.now() } as any);
  },
});

// ─── Public (client-callable) ────────────────────────────────────────────

/** Create a refund request. Admin surfaces call this from admin-only pages;
 * execution re-validates the caller's admin status server-side. */
export const requestRefund = mutation({
  args: {
    paymentTxId: v.string(),
    amount: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const target = (await ctx.db.get(args.paymentTxId as any)) as any;
    if (!target) throw new Error("Payment not found");
    if (target.status !== "paid") throw new Error("Only paid payments can be refunded");
    const refunded = target.refundedAmount || 0;
    const refundableBase = target.feeSnapshot?.buyerTotal ?? target.amount;
    if (args.amount <= 0 || refunded + args.amount > refundableBase) {
      throw new Error("Refund amount exceeds the refundable balance");
    }
    return await ctx.db.insert("refundRequests", {
      paymentTxId: args.paymentTxId,
      amount: args.amount,
      reason: args.reason,
      status: "pending",
      requestedBy: "admin",
      createdAt: Date.now(),
    } as any);
  },
});

/** Live status of one payment for the paying user (checkout polling). */
export const getMyPaymentStatus = query({
  args: { reference: v.string() },
  handler: async (ctx, args) => {
    const tx = (await ctx.db
      .query("paymentTransactions")
      .withIndex("by_reference", (q) => q.eq("reference", args.reference))
      .first()) as any;
    if (!tx) return null;
    return {
      reference: tx.reference,
      provider: tx.provider,
      status: tx.status,
      providerStatus: tx.providerStatus,
      failureReason: tx.failureReason,
      feeSnapshot: tx.feeSnapshot,
      checkoutUrl: tx.checkoutUrl,
    };
  },
});

/** Admin: recent unified transactions. */
export const listTransactions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return (await ctx.db
      .query("paymentTransactions")
      .withIndex("by_created")
      .order("desc")
      .take(args.limit ?? 100)) as any[];
  },
});

/**
 * Which providers are configured (server env check) — drives checkout options.
 * Public + reactive: when keys are added/removed the checkout updates live.
 */
export const providerAvailability = query({
  args: {},
  handler: async () => {
    return {
      mpesa: true, // existing Daraja integration — always available
      airtel_money: Boolean(
        process.env.AIRTEL_CLIENT_ID && process.env.AIRTEL_CLIENT_SECRET,
      ),
      card: Boolean(process.env.FLW_SECRET_KEY),
    };
  },
});

/** Admin: provider breakdown + reconciliation health. */
export const paymentStats = query({
  args: {},
  handler: async (ctx) => {
    const rows = (await ctx.db.query("paymentTransactions").collect()) as any[];
    const byProvider: Record<string, { count: number; paid: number; failed: number; pending: number; volume: number }> = {};
    for (const tx of rows) {
      const p = (byProvider[tx.provider] ||= { count: 0, paid: 0, failed: 0, pending: 0, volume: 0 });
      p.count++;
      if (tx.status === "paid") {
        p.paid++;
        p.volume += Number(tx.feeSnapshot?.buyerTotal ?? tx.amount) || 0;
      }
      if (tx.status === "failed" || tx.status === "cancelled") p.failed++;
      if (tx.status === "awaiting_confirmation" || tx.status === "initiated") p.pending++;
    }
    return { byProvider, total: rows.length };
  },
});
