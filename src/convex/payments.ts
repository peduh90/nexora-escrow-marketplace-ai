"use node";

/**
 * Unified payment provider actions. M-Pesa remains delegated to the existing
 * Daraja/STK module. Flutterwave is a sibling provider: it creates a hosted
 * Kenya payment, then only a server-side transaction verification can mark it
 * paid and allow the existing escrow funding mutation to run.
 */

import { v, ConvexError } from "convex/values";
import { action } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  createFlutterwaveReference,
  flutterwaveEventId,
  lifecycleStatusForProviderEvent,
  verifyFlutterwaveTransaction,
  type VerifiedFlutterwaveTransaction,
} from "./paymentState";

const AIRTEL_CLIENT_ID = process.env.AIRTEL_CLIENT_ID || "";
const AIRTEL_CLIENT_SECRET = process.env.AIRTEL_CLIENT_SECRET || "";
const AIRTEL_ENV = process.env.AIRTEL_ENV || "sandbox";
const AIRTEL_BASE = AIRTEL_ENV === "production" ? "https://openapi.airtel.africa" : "https://openapiuat.airtel.africa";

const FLW_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY || process.env.FLW_SECRET_KEY || "";
const FLW_WEBHOOK_SECRET = process.env.FLUTTERWAVE_WEBHOOK_SECRET || process.env.FLW_SECRET_HASH || "";
const FLW_ENV = process.env.FLUTTERWAVE_ENV === "live" ? "live" : "test";
const FLW_ACCOUNT_VERIFIED = process.env.FLUTTERWAVE_ACCOUNT_VERIFIED === "true";
const FLW_LIVE_ENABLED = process.env.FLUTTERWAVE_LIVE_ENABLED === "true";
const FLW_BASE = "https://api.flutterwave.com";

export type PaymentProvider = "mpesa" | "airtel_money" | "card" | "flutterwave";

type StoredPayment = {
  _id: any;
  reference: string;
  provider: PaymentProvider;
  payerId: string;
  payerToken?: string;
  buyerId?: string;
  sellerId?: string;
  orderId?: string;
  amount: number;
  currency: string;
  status: string;
  providerTransactionId?: string;
  providerReference?: string;
  providerRef?: string;
  providerData?: string;
  customerId?: string;
  feeBreakdown?: { totalCharged?: number };
  feeSnapshot?: { totalCharge?: number; buyerTotal?: number };
  escrowId?: string;
};

function airtelConfigured() { return Boolean(AIRTEL_CLIENT_ID && AIRTEL_CLIENT_SECRET); }
function flutterwaveConfigured() { return Boolean(FLW_SECRET_KEY && FLW_WEBHOOK_SECRET); }
function flutterwaveStatus() {
  if (!flutterwaveConfigured()) return "not_configured" as const;
  if (!FLW_ACCOUNT_VERIFIED) return "account_not_verified" as const;
  if (FLW_ENV !== "live" || !FLW_LIVE_ENABLED) return "live_unavailable" as const;
  return "live_active" as const;
}
function flutterwaveCanInitiate() {
  // Test is safe for sandbox credentials. LIVE requires both the explicit
  // enable flag and an operator-confirmed, approved/verified account.
  return flutterwaveConfigured() && (FLW_ENV === "test" || flutterwaveStatus() === "live_active");
}

let cachedAirtelToken: { value: string; expiresAt: number } | null = null;
async function getAirtelToken() {
  if (cachedAirtelToken && Date.now() < cachedAirtelToken.expiresAt) return cachedAirtelToken.value;
  const res = await fetch(`${AIRTEL_BASE}/auth/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "*/*" },
    body: JSON.stringify({ client_id: AIRTEL_CLIENT_ID, client_secret: AIRTEL_CLIENT_SECRET, grant_type: "client_credentials" }),
  });
  const data = await res.json() as { access_token?: string; expires_in?: string | number; error_description?: string; error?: string };
  if (!data.access_token) throw new ConvexError(`Airtel Money auth failed: ${data.error_description || data.error || "check API keys"}`);
  cachedAirtelToken = { value: data.access_token, expiresAt: Date.now() + Math.max(60, (Number(data.expires_in) || 3600) - 240) * 1000 };
  return data.access_token;
}
function airtelHeaders(token: string) { return { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "*/*", "X-Country": "KE", "X-Currency": "KES" }; }
function normalizeKePhone(input: string) {
  let phone = input.replace(/[^0-9]/g, "");
  if (phone.startsWith("0")) phone = `254${phone.slice(1)}`;
  if (phone.startsWith("254") && phone.length === 12) return phone;
  if (phone.length === 9 && phone.startsWith("7")) return `254${phone}`;
  return phone;
}

async function fetchFlutterwave(path: string, init: RequestInit = {}, timeoutMs = 12_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(`${FLW_BASE}${path}`, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function safeProviderData(data: any) {
  return JSON.stringify({
    id: data?.id,
    flwRef: data?.flw_ref,
    status: data?.status,
    amount: data?.amount,
    currency: data?.currency,
    txRef: data?.tx_ref,
  });
}

async function fetchFlutterwaveByReference(reference: string): Promise<any | null> {
  const res = await fetchFlutterwave(`/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${FLW_SECRET_KEY}` },
  });
  const payload = await res.json() as { status?: string; message?: string; data?: any };
  if (payload.status !== "success" || !payload.data) return payload.data ? payload.data : null;
  return payload.data;
}

async function verifyStoredFlutterwave(ctx: any, tx: StoredPayment, fromWebhook = false) {    const actual = await fetchFlutterwaveByReference(tx.reference) as VerifiedFlutterwaveTransaction | null;
    const result = verifyFlutterwaveTransaction({
    reference: tx.reference,      orderId: tx.orderId || "",
      buyerId: tx.buyerId || tx.payerId,
      sellerId: tx.sellerId || "",
      amount: Number(tx.feeBreakdown?.totalCharged ?? tx.feeSnapshot?.totalCharge ?? tx.feeSnapshot?.buyerTotal ?? tx.amount),
    currency: tx.currency,      customerId: tx.customerId,
  }, actual);
  if (result.verified) {
    await ctx.runMutation(internal.paymentStore.markTransactionPaid, {
      reference: tx.reference,
      providerTransactionId: String(actual!.id),
      providerStatus: "FLUTTERWAVE_VERIFIED",
      providerData: safeProviderData(actual),
      fromWebhook,
    });
    return { status: "paid" as const };
  }
  const providerStatus = String(actual?.status || "unknown");
  const lifecycle = lifecycleStatusForProviderEvent("", providerStatus);
  if (lifecycle && ["failed", "cancelled", "expired", "reversed", "disputed", "refunded"].includes(lifecycle)) {
    await ctx.runMutation(internal.paymentStore.markTransactionFailed, {
      reference: tx.reference,
      failureReason: `Flutterwave ${providerStatus}${result.reason ? ` (${result.reason})` : ""}`,
      status: lifecycle,
      providerStatus,
      providerData: safeProviderData(actual),
      fromWebhook,
    });
    return { status: lifecycle };
  }
  return { status: "pending" as const, reason: result.reason || `provider_status_${providerStatus}` };
}

export const initiatePayment = action({
  args: {
    provider: v.union(v.literal("mpesa"), v.literal("airtel_money"), v.literal("card"), v.literal("flutterwave")),
    purpose: v.string(),
    amount: v.number(),
    orderId: v.optional(v.string()),
    sellerId: v.optional(v.string()),
    customerEmail: v.optional(v.string()),
    customerId: v.optional(v.string()),
    marketplace: v.optional(v.string()),
    msisdn: v.optional(v.string()),
    listingTitle: v.optional(v.string()),
    redirectUrl: v.optional(v.string()),
    extraCharge: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<any> => {
    const identity = await ctx.auth.getUserIdentity();
    const sessionUserId = await getAuthUserId(ctx);
    if (!identity || !sessionUserId) throw new ConvexError("Not authenticated");
    if (args.amount <= 0) throw new ConvexError("Invalid amount");
    if (args.provider === "flutterwave" && (!args.orderId || !args.sellerId)) {
      throw new ConvexError("Flutterwave requires a pending Nexora order and seller.");
    }
    if (args.provider === "flutterwave" && !flutterwaveCanInitiate()) {
      throw new ConvexError(flutterwaveStatus() === "account_not_verified"
        ? "Flutterwave account verification is not confirmed; LIVE remains disabled."
        : "Flutterwave LIVE is unavailable until verified LIVE credentials and approval are configured.");
    }

    const marketplace = args.marketplace || "product";
    const feeResult = await ctx.runQuery(internal.paymentStore.computeFees, { marketplace, amount: args.amount }) as any;
    const fees = feeResult.fees;
    const deliveryFee = Math.max(0, Math.round(args.extraCharge || 0));
    const totalCharge = fees.buyerTotal + deliveryFee;
    const reference = createFlutterwaveReference(args.orderId || "PENDING", `${Date.now()}${Math.random()}`);
    let providerRef: string | undefined;
    let providerTransactionId: string | undefined;
    let checkoutUrl: string | undefined;
    let status: "initiated" | "awaiting_confirmation" = "initiated";

    if (args.provider === "mpesa") {
      if (!args.msisdn) throw new ConvexError("Enter your M-Pesa number.");
      const stk = await ctx.runAction(api.mpesa.initiateStkPush, {
        phoneNumber: args.msisdn,
        amount: totalCharge,
        accountReference: reference.slice(0, 12),
        description: args.listingTitle ? `Nexora: ${args.listingTitle}`.slice(0, 60) : "NEXORA MARKETPLACE",
      }) as { checkoutRequestId?: string };
      if (!stk?.checkoutRequestId) throw new ConvexError("M-Pesa push failed — try again.");
      providerRef = stk.checkoutRequestId;
      status = "awaiting_confirmation";
    } else if (args.provider === "airtel_money") {
      if (!airtelConfigured()) throw new ConvexError("Airtel Money is not configured yet.");
      if (!args.msisdn) throw new ConvexError("Enter your Airtel Money number.");
      const phone = normalizeKePhone(args.msisdn);
      if (!/^254[0-9]{9}$/.test(phone)) throw new ConvexError("Enter a valid Kenyan Airtel number.");
      const token = await getAirtelToken();
      const res = await fetch(`${AIRTEL_BASE}/merchant/v1/payments/`, { method: "POST", headers: airtelHeaders(token), body: JSON.stringify({ reference: `Nexora ${args.listingTitle || "order"} ${reference}`.slice(0, 120), subscriber: { country: "KE", currency: "KES", msisdn: phone }, transaction: { amount: totalCharge, country: "KE", currency: "KES", id: reference } }) });
      const data = await res.json() as any;
      if (!data?.data?.transaction?.id) throw new ConvexError(`Airtel Money push failed: ${data.message || "try again"}`);
      providerRef = data.data.transaction.id;
      status = "awaiting_confirmation";
    } else {
      if (!FLW_SECRET_KEY) throw new ConvexError("Flutterwave is not configured yet.");
      const res = await fetchFlutterwave("/v3/payments", {
        method: "POST",
        headers: { Authorization: `Bearer ${FLW_SECRET_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          tx_ref: reference,
          amount: totalCharge,
          currency: "KES",
          redirect_url: args.redirectUrl || undefined,
          meta: { orderId: args.orderId, buyerId: String(sessionUserId), sellerId: args.sellerId, purpose: args.purpose },
          customer: args.customerEmail ? { email: args.customerEmail } : undefined,
          // Flutterwave chooses the enabled Kenyan methods at hosted checkout.
          // No card or mobile-money instrument details pass through Nexora.
          payment_options: "mobilemoney,card,banktransfer",
        }),
      });
      const data = await res.json() as any;
      if (data.status !== "success" || !data.data?.link) throw new ConvexError(`Flutterwave checkout failed: ${data.message || "try again"}`);
      providerRef = reference;
      providerTransactionId = data.data.id ? String(data.data.id) : undefined;
      checkoutUrl = data.data.link;
      status = "awaiting_confirmation";
    }

    const txId: any = await ctx.runMutation(internal.paymentStore.createTransaction, {
      reference,
      provider: args.provider,
      purpose: args.purpose,
      payerId: String(sessionUserId),
      payerToken: identity.subject,
      buyerId: String(sessionUserId),
      sellerId: args.sellerId,
      orderId: args.orderId,
      amount: args.amount,
      totalCharge,
      currency: "KES",
      status,
      providerRef,
      providerTransactionId,
      providerReference: reference,
      checkoutUrl,
      customerId: args.customerId,
      msisdn: args.msisdn,
      deliveryFee,
      feeSnapshot: {
        baseAmount: fees.baseAmount,
        buyerProtectionFee: fees.buyerProtectionFee,
        buyerProtectionRate: fees.buyerProtectionRate,
        sellerCommissionFee: fees.sellerCommissionFee,
        sellerCommissionRate: fees.sellerCommissionRate,
        buyerTotal: fees.buyerTotal,
        sellerNet: fees.sellerNet,
        providerFee: 0,
        deliveryFee,
      },
      metadata: { purpose: args.purpose },
      commissionRuleKey: feeResult.commissionRuleKey,
      protectionRuleKey: feeResult.protectionRuleKey,
      commissionRuleRate: feeResult.commissionRuleRate,
      protectionRuleRate: feeResult.protectionRuleRate,
    });
    return { transactionId: String(txId), reference, providerRef, providerTransactionId, checkoutUrl, totalCharge, fees: { ...fees, deliveryFee, totalCharge } };
  },
});

export const verifyPayment = action({
  args: { reference: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");
    const tx = await ctx.runQuery(internal.paymentStore.getByReference, { reference: args.reference }) as StoredPayment | null;
    if (!tx) throw new ConvexError("Payment not found");
    if (tx.payerToken && identity.subject !== tx.payerToken) throw new ConvexError("This payment belongs to another account");
    if (tx.status === "paid" || ["reversed", "disputed", "refunded"].includes(tx.status)) return { status: tx.status, reference: args.reference };
    if (tx.provider === "flutterwave") {
      if (!flutterwaveConfigured()) throw new ConvexError("Flutterwave is not configured");
      return await verifyStoredFlutterwave(ctx, tx);
    }
    if (tx.provider === "mpesa") {
      const status = await ctx.runAction(api.mpesa.verifyStkPayment, { checkoutRequestId: tx.providerRef || "" }) as any;
      if (status.paid) await ctx.runMutation(internal.paymentStore.markTransactionPaid, { reference: args.reference, providerStatus: "STK_CONFIRMED" });
      else if (status.failed) await ctx.runMutation(internal.paymentStore.markTransactionFailed, { reference: args.reference, failureReason: status.resultDesc || "M-Pesa payment failed" });
      return { status: status.paid ? "paid" : status.failed ? "failed" : "pending", reference: args.reference };
    }
    if (tx.provider === "airtel_money" && airtelConfigured()) {
      const token = await getAirtelToken();
      const res = await fetch(`${AIRTEL_BASE}/standard/v1/payments/${encodeURIComponent(tx.providerRef || "")}`, { headers: airtelHeaders(token) });
      const data = await res.json() as any;
      const state = String(data?.data?.transaction?.status || "").toUpperCase();
      if (["TS", "SUCCESS", "SUCCESSFUL"].includes(state)) await ctx.runMutation(internal.paymentStore.markTransactionPaid, { reference: args.reference, providerTransactionId: data?.data?.transaction?.airtel_money_id, providerStatus: state });
      else if (["TF", "FAILED", "FA"].includes(state)) await ctx.runMutation(internal.paymentStore.markTransactionFailed, { reference: args.reference, failureReason: data?.data?.transaction?.message || "Airtel payment failed" });
      return { status: ["TS", "SUCCESS", "SUCCESSFUL"].includes(state) ? "paid" : ["TF", "FAILED", "FA"].includes(state) ? "failed" : "pending", reference: args.reference };
    }
    return { status: "pending", reference: args.reference };
  },
});

/** Flutterwave webhook: signature + provider re-query + event idempotency. */
export async function processFlwWebhook(ctx: any, request: Request): Promise<Response> {
  try {
    const signature = request.headers.get("verif-hash");
    if (!FLW_WEBHOOK_SECRET || !signature || signature !== FLW_WEBHOOK_SECRET) return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 401 });
    const body = await request.json() as any;
    const data = body?.data || {};
    const eventType = String(body?.event || "unknown");
    const eventId = String(data?.id ? `${eventType}:${data.id}` : flutterwaveEventId(eventType, data));
    const claim = await ctx.runMutation(internal.paymentStore.recordWebhookEvent, {
      provider: "flutterwave",
      eventId,
      eventHash: request.headers.get("event-hash") || undefined,
      eventType,
      providerTransactionId: data?.id ? String(data.id) : undefined,
      providerReference: data?.tx_ref,
      safePayload: { status: data?.status, amount: data?.amount, currency: data?.currency, txRef: data?.tx_ref },
    }) as { claimed: boolean; eventId: string };
    if (!claim.claimed) return new Response(JSON.stringify({ status: "ok", duplicate: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    const tx = data?.tx_ref ? await ctx.runQuery(internal.paymentStore.getByReference, { reference: data.tx_ref }) as StoredPayment | null : null;
    if (!tx) {
      await ctx.runMutation(internal.paymentStore.finishWebhookEvent, { eventId: claim.eventId, status: "ignored", outcome: "unknown_reference" });
      return new Response(JSON.stringify({ status: "ok" }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    const result = await verifyStoredFlutterwave(ctx, tx, true);
    await ctx.runMutation(internal.paymentStore.finishWebhookEvent, { eventId: claim.eventId, status: "processed", outcome: result.status });
    return new Response(JSON.stringify({ status: "ok" }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Flutterwave webhook error:", error);
    return new Response(JSON.stringify({ status: "ok" }), { status: 200, headers: { "Content-Type": "application/json" } });
  }
}

export const reconcilePending = action({
  args: {},
  handler: async (ctx) => {
    await ctx.runQuery(internal.paymentStore.requirePaymentAdminInternal, {});
    const stale = await ctx.runQuery(internal.paymentStore.listAwaiting, { olderThanMs: 2 * 60 * 1000 }) as any[];
    let checked = 0;
    let resolved = 0;
    for (const tx of stale.slice(0, 20)) {
      checked++;
      try {
        const r = await ctx.runAction(api.payments.adminVerifyPayment, { reference: tx.reference }) as any;
        if (r.status !== "pending") resolved++;
      } catch { /* transient provider/network failure; next sweep retries */ }
    }
    return { checked, resolved, remaining: Math.max(0, stale.length - resolved) };
  },
});

export const adminVerifyPayment = action({
  args: { reference: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");
    const tx = await ctx.runQuery(internal.paymentStore.getByReference, { reference: args.reference }) as StoredPayment | null;
    if (!tx || tx.status !== "awaiting_confirmation") return { status: tx?.status || "unknown" };
    if (tx.provider === "flutterwave" && flutterwaveConfigured()) return await verifyStoredFlutterwave(ctx, tx);
    return { status: "pending" };
  },
});

export const executeRefund = action({
  args: { refundId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");
    await ctx.runQuery(internal.paymentStore.requirePaymentAdminInternal, {});
    const refund = await ctx.runQuery(internal.paymentStore.getRefund, { refundId: args.refundId }) as any;
    if (!refund) throw new ConvexError("Refund not found");
    if (refund.status !== "pending") throw new ConvexError("Refund already processed");
    const tx = await ctx.runQuery(internal.paymentStore.getTxById, { txId: refund.paymentTxId }) as StoredPayment | null;
    if (!tx) throw new ConvexError("Payment not found");
    await ctx.runMutation(internal.paymentStore.markRefundProcessing, { refundId: args.refundId });
    if ((tx.provider === "card" || tx.provider === "flutterwave") && FLW_SECRET_KEY) {
      const flwId = tx.providerTransactionId || (() => { try { return JSON.parse(tx.providerData || "{}").flwId; } catch { return undefined; } })();
      if (!flwId) throw new ConvexError("Cannot locate the Flutterwave transaction for refund");
      const res = await fetchFlutterwave(`/v3/transactions/${flwId}/refund`, { method: "POST", headers: { Authorization: `Bearer ${FLW_SECRET_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ amount: refund.amount, comments: refund.reason }) });
      const data = await res.json() as any;
      if (data.status !== "success") {
        await ctx.runMutation(internal.paymentStore.markRefundFailed, { refundId: args.refundId, reason: "Gateway rejected the refund" });
        throw new ConvexError("Refund failed at the gateway — it has been marked failed.");
      }
      await ctx.runMutation(internal.paymentStore.markRefundCompleted, { refundId: args.refundId, providerRefundId: String(data.data?.id || ""), providerStatus: data.data?.status || "completed" });
      await ctx.runMutation(internal.paymentStore.applyRefundToTransaction, { txId: tx._id, amount: refund.amount });
      return { ok: true, status: "completed" };
    }
    if (tx.provider === "airtel_money" && airtelConfigured()) {
      const token = await getAirtelToken();
      const airtelId = (() => { try { return JSON.parse(tx.providerData || "{}").airtelMoneyId; } catch { return undefined; } })();
      if (!airtelId) throw new ConvexError("Cannot locate the Airtel transaction for refund");
      const res = await fetch(`${AIRTEL_BASE}/standard/v1/payments/refunds/`, { method: "POST", headers: airtelHeaders(token), body: JSON.stringify({ transaction: { airtel_money_id: airtelId }, refund: { amount: refund.amount, currency: "KES", reference: `NX-REF-${args.refundId}`.slice(0, 40) } }) });
      const data = await res.json() as any;
      if (!(data?.status?.success || data?.status?.code === "200" || res.ok)) {
        await ctx.runMutation(internal.paymentStore.markRefundFailed, { refundId: args.refundId, reason: data.message || "Airtel rejected the refund" });
        throw new ConvexError("Refund failed at Airtel Money — it has been marked failed.");
      }
      await ctx.runMutation(internal.paymentStore.markRefundCompleted, { refundId: args.refundId, providerRefundId: String(data?.data?.transaction?.airtel_money_id || ""), providerStatus: "REFUND_INITIATED" });
      await ctx.runMutation(internal.paymentStore.applyRefundToTransaction, { txId: tx._id, amount: refund.amount });
      return { ok: true, status: "completed" };
    }
    await ctx.runMutation(internal.paymentStore.markRefundFailed, { refundId: args.refundId, reason: "Route through M-Pesa B2C payout flow" });
    throw new ConvexError("M-Pesa refunds are issued through the B2C payout flow.");
  },
});
