/**
 * ─── NEXORA PAYMENT STORE (queries & mutations, default runtime) ──────────
 * All unified payment persistence lives here. Provider actions orchestrate
 * gateways; this module owns idempotency, immutable fee snapshots, webhook
 * audit records, and the server-side funding gate.
 */

import { v, ConvexError } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { resolveFee } from "./fees";
import type { FeeMarketplace } from "./fees";
import {
  buildFlutterwaveFeeSnapshot,
  canTransitionPayment,
  type PaymentLifecycleStatus,
} from "./paymentState";

const PAYMENT_PROVIDER = v.union(
  v.literal("mpesa"),
  v.literal("airtel_money"),
  v.literal("card"),
  v.literal("flutterwave"),
);

const PAYMENT_STATUS = v.union(
  v.literal("initiated"),
  v.literal("awaiting_confirmation"),
  v.literal("paid"),
  v.literal("failed"),
  v.literal("cancelled"),
  v.literal("expired"),
  v.literal("reversed"),
  v.literal("disputed"),
  v.literal("refunded"),
  v.literal("partially_refunded"),
);

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

export const computeFees = internalQuery({
  args: { marketplace: v.string(), amount: v.number() },
  handler: async (ctx, args) =>
    calculateTransactionFees(ctx.db, args.marketplace as FeeMarketplace, args.amount),
});

export const getByReference = internalQuery({
  args: { reference: v.string() },
  handler: async (ctx, args) =>
    await ctx.db.query("paymentTransactions").withIndex("by_reference", (q) => q.eq("reference", args.reference)).first(),
});

export const getByProviderRef = internalQuery({
  args: { providerRef: v.string() },
  handler: async (ctx, args) =>
    await ctx.db.query("paymentTransactions").withIndex("by_provider_ref", (q) => q.eq("providerRef", args.providerRef)).first(),
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
    const rows = await ctx.db.query("paymentTransactions").withIndex("by_status", (q) => q.eq("status", "awaiting_confirmation")).collect();
    return rows.filter((r: any) => r.createdAt <= cutoff);
  },
});

export const createTransaction = internalMutation({
  args: {
    reference: v.string(),
    provider: PAYMENT_PROVIDER,
    purpose: v.string(),
    payerId: v.string(),
    payerToken: v.optional(v.string()),
    buyerId: v.optional(v.string()),
    sellerId: v.optional(v.string()),
    orderId: v.optional(v.string()),
    amount: v.number(),
    totalCharge: v.number(),
    currency: v.string(),
    status: v.union(v.literal("initiated"), v.literal("awaiting_confirmation")),
    providerRef: v.optional(v.string()),
    providerTransactionId: v.optional(v.string()),
    providerReference: v.optional(v.string()),
    checkoutUrl: v.optional(v.string()),
    customerId: v.optional(v.string()),
    customerEmailHash: v.optional(v.string()),
    msisdn: v.optional(v.string()),
    deliveryFee: v.optional(v.number()),
    feeSnapshot: v.record(v.string(), v.number()),
    metadata: v.optional(v.record(v.string(), v.any())),
    commissionRuleKey: v.optional(v.string()),
    protectionRuleKey: v.optional(v.string()),
    commissionRuleRate: v.optional(v.number()),
    protectionRuleRate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("paymentTransactions").withIndex("by_reference", (q) => q.eq("reference", args.reference)).first();
    if (existing) return existing._id;
    const now = Date.now();
    const deliveryFee = Math.max(0, Math.round(args.deliveryFee || 0));
    const feeBreakdown = buildFlutterwaveFeeSnapshot({
      itemAmount: args.amount,
      deliveryFee,
      nexoraCommission: args.feeSnapshot.sellerCommissionFee || 0,
      buyerProtectionFee: args.feeSnapshot.buyerProtectionFee || 0,
      providerFee: args.feeSnapshot.providerFee || 0,
    });
    if (feeBreakdown.totalCharged !== args.totalCharge) {
      throw new ConvexError("Immutable fee breakdown does not match total charged");
    }
    const legacySnapshot = { ...args.feeSnapshot, deliveryFee, totalCharge: args.totalCharge };
    return await ctx.db.insert("paymentTransactions", {
      reference: args.reference,
      provider: args.provider,
      purpose: args.purpose,
      payerId: args.payerId,
      payerToken: args.payerToken,
      buyerId: args.buyerId || args.payerId,
      sellerId: args.sellerId,
      orderId: args.orderId,
      amount: args.amount,
      currency: args.currency,
      status: args.status,
      providerReference: args.providerReference || args.reference,
      escrowStatus: "not_funded",
      payoutStatus: "not_due",
      feeBreakdown,
      metadata: args.metadata,
      customerId: args.customerId,
      customerEmailHash: args.customerEmailHash,
      providerRef: args.providerRef || args.providerReference || args.reference,
      providerStatus: undefined,
      checkoutUrl: args.checkoutUrl,
      msisdn: args.msisdn,
      escrowId: undefined,
      verifiedAt: undefined,
      webhookReceivedAt: undefined,
      reconciledAt: undefined,
      failureReason: undefined,
      feeSnapshot: legacySnapshot,
      providerData: undefined,
      refundedAmount: 0,
      createdAt: now,
      updatedAt: now,
    } as any);
  },
});

export const attachProviderSession = internalMutation({
  args: {
    reference: v.string(),
    providerTransactionId: v.optional(v.string()),
    providerReference: v.optional(v.string()),
    checkoutUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tx = await findTransaction(ctx, args.reference);
    if (!tx) return null;
    await ctx.db.patch(tx._id as any, {
      providerTransactionId: args.providerTransactionId ?? tx.providerTransactionId,
      providerReference: args.providerReference ?? tx.providerReference,
      providerRef: args.providerReference ?? tx.providerRef,
      checkoutUrl: args.checkoutUrl ?? tx.checkoutUrl,
      updatedAt: Date.now(),
    } as any);
    return tx._id;
  },
});

export const markTransactionPaid = internalMutation({
  args: {
    reference: v.optional(v.string()),
    providerRef: v.optional(v.string()),
    providerTransactionId: v.optional(v.string()),
    providerStatus: v.optional(v.string()),
    providerData: v.optional(v.string()),
    fromWebhook: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const tx = await findTransaction(ctx, args.reference, args.providerRef);
    if (!tx) return null;
    if (!canTransitionPayment(tx.status as PaymentLifecycleStatus, "paid") && tx.status !== "paid") return tx._id;
    const now = Date.now();
    await ctx.db.patch(tx._id, {
      status: "paid",
      verifiedAt: now,
      providerTransactionId: args.providerTransactionId ?? tx.providerTransactionId,
      providerData: args.providerData ?? tx.providerData,
      providerStatus: args.providerStatus ?? tx.providerStatus,
      webhookReceivedAt: args.fromWebhook ? now : tx.webhookReceivedAt,
      reconciledAt: args.fromWebhook ? tx.reconciledAt : (tx.reconciledAt ?? now),
      updatedAt: now,
    } as any);
    return tx._id;
  },
});

export const markTransactionFailed = internalMutation({
  args: {
    reference: v.optional(v.string()),
    providerRef: v.optional(v.string()),
    failureReason: v.string(),
    status: v.optional(PAYMENT_STATUS),
    cancelled: v.optional(v.boolean()),
    providerTransactionId: v.optional(v.string()),
    providerStatus: v.optional(v.string()),
    providerData: v.optional(v.string()),
    fromWebhook: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const tx = await findTransaction(ctx, args.reference, args.providerRef);
    if (!tx) return null;
    const nextStatus = (args.status || (args.cancelled ? "cancelled" : "failed")) as PaymentLifecycleStatus;
    if (!canTransitionPayment(tx.status as PaymentLifecycleStatus, nextStatus)) return tx._id;
    const now = Date.now();
    await ctx.db.patch(tx._id, {
      status: nextStatus,
      failureReason: args.failureReason,
      providerStatus: args.providerStatus ?? tx.providerStatus,
      providerTransactionId: args.providerTransactionId ?? tx.providerTransactionId,
      providerData: args.providerData ?? tx.providerData,
      webhookReceivedAt: args.fromWebhook ? now : tx.webhookReceivedAt,
      updatedAt: now,
    } as any);
    return tx._id;
  },
});

function parseProviderData(tx: any): any {
  try { return JSON.parse(tx?.providerData || "{}"); } catch { return {}; }
}

async function findTransaction(ctx: any, reference?: string, providerRef?: string) {
  if (reference) {
    const byRef = await ctx.db.query("paymentTransactions").withIndex("by_reference", (q: any) => q.eq("reference", reference)).first();
    if (byRef) return byRef;
  }
  if (providerRef) {
    return await ctx.db.query("paymentTransactions").withIndex("by_provider_ref", (q: any) => q.eq("providerRef", providerRef)).first();
  }
  return null;
}

export const recordWebhookEvent = internalMutation({
  args: {
    provider: PAYMENT_PROVIDER,
    eventId: v.string(),
    eventHash: v.optional(v.string()),
    eventType: v.string(),
    providerTransactionId: v.optional(v.string()),
    providerReference: v.optional(v.string()),
    orderId: v.optional(v.string()),
    paymentReference: v.optional(v.string()),
    safePayload: v.optional(v.record(v.string(), v.any())),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("paymentWebhookEvents")
      .withIndex("by_event", (q) => q.eq("provider", args.provider).eq("eventId", args.eventId))
      .first();
    if (existing) {
      // A received event was previously interrupted (for example, provider
      // timeout). Let a replay retry it; terminal outcomes stay idempotent.
      if (existing.processingStatus === "received") {
        await ctx.db.patch(existing._id, { receivedAt: Date.now(), safePayload: args.safePayload });
        return { claimed: true, eventId: existing._id };
      }
      return { claimed: false, eventId: existing._id };
    }
    const id = await ctx.db.insert("paymentWebhookEvents", {
      ...args,
      processingStatus: "received",
      receivedAt: Date.now(),
    } as any);
    return { claimed: true, eventId: id };
  },
});

export const finishWebhookEvent = internalMutation({
  args: {
    eventId: v.string(),
    status: v.union(v.literal("processed"), v.literal("ignored"), v.literal("failed")),
    outcome: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.eventId as any);
    if (!row) return;
    await ctx.db.patch(row._id, {
      processingStatus: args.status,
      outcome: args.outcome,
      processedAt: Date.now(),
    } as any);
  },
});

export const requirePaymentAdminInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity ? await getAuthUserId(ctx) : null;
    const user = userId ? await ctx.db.get(userId) : null;
    if (!user || user.role !== "admin") throw new ConvexError("Unauthorized: admin only");
    return { _id: user._id };
  },
});

export const listWebhookEvents = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requirePaymentAdmin(ctx);
    return await ctx.db.query("paymentWebhookEvents").withIndex("by_received").order("desc").take(args.limit ?? 100) as any[];
  },
});

export const markRefundProcessing = internalMutation({
  args: { refundId: v.string() },
  handler: async (ctx, args) => { await ctx.db.patch(args.refundId as any, { status: "processing" } as any); },
});

export const markRefundCompleted = internalMutation({
  args: { refundId: v.string(), providerRefundId: v.string(), providerStatus: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.refundId as any, { status: "completed", providerRefundId: args.providerRefundId, providerStatus: args.providerStatus, completedAt: Date.now() } as any);
  },
});

export const markRefundFailed = internalMutation({
  args: { refundId: v.string(), reason: v.string() },
  handler: async (ctx, args) => { await ctx.db.patch(args.refundId as any, { status: "failed", providerStatus: args.reason } as any); },
});

export const applyRefundToTransaction = internalMutation({
  args: { txId: v.string(), amount: v.number() },
  handler: async (ctx, args) => {
    const tx = await ctx.db.get(args.txId as any) as any;
    if (!tx) return;
    const refunded = (tx.refundedAmount || 0) + args.amount;
    const status = refunded >= (tx.feeBreakdown?.totalCharged ?? tx.amount) ? "refunded" : "partially_refunded";
    await ctx.db.patch(tx._id as any, { refundedAmount: refunded, status, updatedAt: Date.now() } as any);
  },
});

async function requirePaymentAdmin(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  const userId = identity ? await getAuthUserId(ctx) : null;
  const user = userId ? await ctx.db.get(userId) : null;
  if (!user || user.role !== "admin") throw new ConvexError("Unauthorized: admin only");
  return user;
}

export const requestRefund = mutation({
  args: { paymentTxId: v.string(), amount: v.number(), reason: v.string() },
  handler: async (ctx, args) => {
    const admin = await requirePaymentAdmin(ctx);
    if (!args.reason.trim()) throw new ConvexError("An auditable refund reason is required");
    const target = await ctx.db.get(args.paymentTxId as any) as any;
    if (!target) throw new ConvexError("Payment not found");
    if (target.status !== "paid") throw new ConvexError("Only verified paid payments can be refunded");
    const refunded = target.refundedAmount || 0;
    const refundableBase = target.feeBreakdown?.totalCharged ?? target.feeSnapshot?.totalCharge ?? target.amount;
    if (args.amount <= 0 || refunded + args.amount > refundableBase) throw new ConvexError("Refund amount exceeds the refundable balance");
    return await ctx.db.insert("refundRequests", {
      paymentTxId: args.paymentTxId,
      amount: args.amount,
      reason: args.reason.trim(),
      status: "pending",
      requestedBy: admin._id,
      createdAt: Date.now(),
    } as any);
  },
});

export const getMyPaymentStatus = query({
  args: { reference: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const tx = await ctx.db.query("paymentTransactions").withIndex("by_reference", (q) => q.eq("reference", args.reference)).first();
    if (!tx || !identity) return null;
    if (tx.payerToken && identity.subject !== tx.payerToken) throw new ConvexError("Unauthorized");
    return {
      reference: tx.reference,
      provider: tx.provider,
      status: tx.status,
      providerStatus: tx.providerStatus,
      providerTransactionId: tx.providerTransactionId,
      failureReason: tx.failureReason,
      feeSnapshot: tx.feeSnapshot,
      feeBreakdown: tx.feeBreakdown,
      checkoutUrl: tx.checkoutUrl,
    };
  },
});

export const listTransactions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requirePaymentAdmin(ctx);
    return await ctx.db.query("paymentTransactions").withIndex("by_created").order("desc").take(args.limit ?? 100);
  },
});

export const providerAvailability = query({
  args: {},
  handler: async () => ({
    mpesa: true,
    airtel_money: Boolean(process.env.AIRTEL_CLIENT_ID && process.env.AIRTEL_CLIENT_SECRET),
    card: Boolean(process.env.FLW_SECRET_KEY),
    flutterwave: {
      configured: Boolean((process.env.FLUTTERWAVE_SECRET_KEY || process.env.FLW_SECRET_KEY) && (process.env.FLUTTERWAVE_WEBHOOK_SECRET || process.env.FLW_SECRET_HASH)),
      mode: process.env.FLUTTERWAVE_ENV === "live" ? "live" : "test",
      liveEnabled: process.env.FLUTTERWAVE_ENV === "live" && process.env.FLUTTERWAVE_LIVE_ENABLED === "true",
      accountVerified: process.env.FLUTTERWAVE_ACCOUNT_VERIFIED === "true",
      status: !((process.env.FLUTTERWAVE_SECRET_KEY || process.env.FLW_SECRET_KEY) && (process.env.FLUTTERWAVE_WEBHOOK_SECRET || process.env.FLW_SECRET_HASH))
        ? "not_configured"
        : process.env.FLUTTERWAVE_ACCOUNT_VERIFIED !== "true"
          ? "account_not_verified"
          : process.env.FLUTTERWAVE_ENV !== "live" || process.env.FLUTTERWAVE_LIVE_ENABLED !== "true"
            ? "live_unavailable"
            : "live_active",
    },
  }),
});

export const paymentStats = query({
  args: {},
  handler: async (ctx) => {
    await requirePaymentAdmin(ctx);
    const rows = await ctx.db.query("paymentTransactions").collect();
    const byProvider: Record<string, { count: number; paid: number; failed: number; pending: number; volume: number }> = {};
    for (const tx of rows) {
      const p = (byProvider[tx.provider] ||= { count: 0, paid: 0, failed: 0, pending: 0, volume: 0 });
      p.count++;
      if (tx.status === "paid") { p.paid++; p.volume += Number(tx.feeBreakdown?.totalCharged ?? tx.amount) || 0; }
      if (["failed", "cancelled", "expired", "reversed"].includes(tx.status)) p.failed++;
      if (["awaiting_confirmation", "initiated", "disputed"].includes(tx.status)) p.pending++;
    }
    return { byProvider, total: rows.length };
  },
});
