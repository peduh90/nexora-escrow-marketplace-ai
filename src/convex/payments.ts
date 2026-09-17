"use node";

/**
 * ─── NEXORA UNIFIED PAYMENT ENGINE (provider actions) ─────────────────────
 *
 * One architecture, three providers, zero checkout rewrites when more land:
 *
 *   provider        collect method                        payout/refund
 *   ───────────     ──────────────────────────────        ─────────────────
 *   mpesa           Daraja STK Push (existing, untouched) B2C payout flow
 *   airtel_money    Airtel OpenAPI USSD push collection   refund API
 *   card            Flutterwave hosted checkout           gateway refund
 *
 * Guarantees (state machinery lives in paymentStore.ts):
 *  • Idempotency    — one paymentTransactions row per reference.
 *  • Verification   — "paid" only after the PROVIDER confirms server-side.
 *  • Reconciliation — webhooks + a pending-sweep converge state.
 *  • Fee integrity  — fees computed ONCE via calculateTransactionFees(),
 *                     snapshotted immutably at initiate time.
 *  • Escrow         — order escrows fund only from VERIFIED payments;
 *                     release rules are untouched (wallet.createOrder gate).
 *
 * Credentials come exclusively from server env (API Keys UI):
 *   AIRTEL_CLIENT_ID, AIRTEL_CLIENT_SECRET, AIRTEL_ENV, AIRTEL_MSRISDN, AIRTEL_PIN
 *   FLW_SECRET_KEY, FLW_SECRET_HASH (webhook secret), FLW_ENV (test|live)
 * Missing keys disable the provider gracefully — checkout hides its option.
 */

import { v, ConvexError } from "convex/values";
import { action } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

// ─── Provider configuration (server-only) ────────────────────────────────

const AIRTEL_CLIENT_ID = process.env.AIRTEL_CLIENT_ID || "";
const AIRTEL_CLIENT_SECRET = process.env.AIRTEL_CLIENT_SECRET || "";
const AIRTEL_ENV = process.env.AIRTEL_ENV || "sandbox";

const AIRTEL_BASE =
  AIRTEL_ENV === "production"
    ? "https://openapi.airtel.africa"
    : "https://openapiuat.airtel.africa";

const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY || "";
const FLW_SECRET_HASH = process.env.FLW_SECRET_HASH || "";
const FLW_BASE = "https://api.flutterwave.com";

export type PaymentProvider = "mpesa" | "airtel_money" | "card";

function airtelConfigured(): boolean {
  return Boolean(AIRTEL_CLIENT_ID && AIRTEL_CLIENT_SECRET);
}
function cardConfigured(): boolean {
  return Boolean(FLW_SECRET_KEY);
}

let cachedAirtelToken: { value: string; expiresAt: number } | null = null;

/** Airtel OpenAPI OAuth2 token (cached ~4 min before expiry). */
async function getAirtelToken(): Promise<string> {
  if (cachedAirtelToken && Date.now() < cachedAirtelToken.expiresAt) {
    return cachedAirtelToken.value;
  }
  const res = await fetch(`${AIRTEL_BASE}/auth/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "*/*" },
    body: JSON.stringify({
      client_id: AIRTEL_CLIENT_ID,
      client_secret: AIRTEL_CLIENT_SECRET,
      grant_type: "client_credentials",
    }),
  });
  const data = (await res.json()) as {
    access_token?: string;
    expires_in?: string | number;
    error?: string;
    error_description?: string;
  };
  if (!data.access_token) {
    throw new ConvexError(
      `Airtel Money auth failed: ${data.error_description || data.error || "check AIRTEL_CLIENT_ID / AIRTEL_CLIENT_SECRET in API Keys"}`,
    );
  }
  const ttl = Math.max(60, (Number(data.expires_in) || 3600) - 240) * 1000;
  cachedAirtelToken = { value: data.access_token, expiresAt: Date.now() + ttl };
  return cachedAirtelToken.value;
}

/** Common Airtel OpenAPI headers — Kenya market headers included. */
function airtelHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "*/*",
    "X-Country": "KE",
    "X-Currency": "KES",
  };
}

/** Normalize a Kenyan number to 2547XXXXXXXX / 2541XXXXXXXX. */
function normalizeKePhone(input: string): string {
  let phone = input.replace(/[^0-9]/g, "");
  if (phone.startsWith("0")) phone = "254" + phone.slice(1);
  if (phone.startsWith("254") && phone.length === 12) return phone;
  if (phone.length === 9 && phone.startsWith("7")) return "254" + phone;
  return phone;
}

/** Generate a unique idempotent payment reference. */
function newReference(): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `NX-TX-${Date.now().toString(36).toUpperCase()}-${rand}`;
}

// ─── Initiate: one entry point, three providers ──────────────────────────

export const initiatePayment = action({
  args: {
    provider: v.union(v.literal("mpesa"), v.literal("airtel_money"), v.literal("card")),
    purpose: v.string(), // "order" | "deposit"
    amount: v.number(), // base amount — buyer protection fee rides on top
    marketplace: v.optional(v.string()),
    msisdn: v.optional(v.string()),
    listingTitle: v.optional(v.string()),
    redirectUrl: v.optional(v.string()),
    // Flat surcharge on top of the fee-engine total (e.g. delivery fee) so
    // the buyer pays exactly the checkout grand total with any provider.
    extraCharge: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");
    const sessionUserId = await getAuthUserId(ctx);
    if (!sessionUserId) throw new ConvexError("Not authenticated");

    if (args.amount <= 0) throw new ConvexError("Invalid amount");

    const marketplace = (args.marketplace as string) || "product";

    // ── Fees snapshot NOW through the centralized calculator ──
    const feeResult = (await ctx.runQuery(internal.paymentStore.computeFees, {
      marketplace,
      amount: args.amount,
    })) as any;
    const fees = feeResult.fees;
    const extra = Math.max(0, Math.round(args.extraCharge || 0));
    const totalCharge = fees.buyerTotal + extra; // buyer always pays this, any provider

    const reference = newReference();
    let providerRef: string | undefined;
    let checkoutUrl: string | undefined;
    let status: "initiated" | "awaiting_confirmation" = "initiated";

    if (args.provider === "mpesa") {
      if (!args.msisdn) throw new ConvexError("Enter your M-Pesa number.");
      // Delegate to the EXISTING, proven Daraja action — untouched.
      const stk = (await ctx.runAction(api.mpesa.initiateStkPush, {
        phoneNumber: args.msisdn,
        amount: totalCharge,
        accountReference: reference.slice(0, 12),
        description: args.listingTitle
          ? `Nexora: ${args.listingTitle}`.slice(0, 60)
          : "NEXORA MARKETPLACE",
      })) as { checkoutRequestId?: string };
      if (!stk?.checkoutRequestId) throw new ConvexError("M-Pesa push failed — try again.");
      providerRef = stk.checkoutRequestId;
      status = "awaiting_confirmation";
    } else if (args.provider === "airtel_money") {
      if (!airtelConfigured()) {
        throw new ConvexError("Airtel Money is not configured yet — add AIRTEL_CLIENT_ID and AIRTEL_CLIENT_SECRET in API Keys.");
      }
      if (!args.msisdn) throw new ConvexError("Enter your Airtel Money number.");
      const phone = normalizeKePhone(args.msisdn);
      if (!/^254[0-9]{9}$/.test(phone)) throw new ConvexError("Enter a valid Kenyan Airtel number.");

      const token = await getAirtelToken();
      const res = await fetch(`${AIRTEL_BASE}/merchant/v1/payments/`, {
        method: "POST",
        headers: airtelHeaders(token),
        body: JSON.stringify({
          reference: `Nexora ${args.listingTitle || "order"} ${reference}`.slice(0, 120),
          subscriber: { country: "KE", currency: "KES", msisdn: phone },
          transaction: { amount: totalCharge, country: "KE", currency: "KES", id: reference },
        }),
      });
      const data = (await res.json()) as {
        data?: { transaction?: { id?: string; status?: string } };
        status?: any;
        message?: string;
      };
      const ts = data?.data?.transaction;
      if (!ts?.id) {
        throw new ConvexError(
          `Airtel Money push failed: ${data.message || data.status?.message || "try again"}`,
        );
      }
      providerRef = ts.id;
      status = "awaiting_confirmation";
    } else {
      // card — Flutterwave hosted checkout (card data NEVER touches Nexora).
      if (!cardConfigured()) {
        throw new ConvexError("Card payments are not configured yet — add FLW_SECRET_KEY in API Keys.");
      }
      const res = await fetch(`${FLW_BASE}/v3/payments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tx_ref: reference,
          amount: totalCharge,
          currency: "KES",
          redirect_url: args.redirectUrl || undefined,
          meta: { purpose: args.purpose, payer: String(sessionUserId) },
          customer: identity.email ? { email: identity.email } : undefined,
          payment_options: "card",
        }),
      });
      const data = (await res.json()) as {
        status?: string;
        message?: string;
        data?: { link?: string };
      };
      if (data.status !== "success" || !data.data?.link) {
        throw new ConvexError(`Card checkout failed: ${data.message || "try again"}`);
      }
      providerRef = reference; // Flutterwave verifies by tx_ref
      checkoutUrl = data.data.link;
      status = "awaiting_confirmation";
    }

    const txId = (await ctx.runMutation(internal.paymentStore.createTransaction, {
      reference,
      provider: args.provider,
      purpose: args.purpose,
      payerId: String(sessionUserId),
      payerToken: identity.subject,
      amount: args.amount,
      totalCharge,
      currency: "KES",
      status,
      providerRef,
      checkoutUrl,
      msisdn: args.msisdn,
      feeSnapshot: {
        baseAmount: fees.baseAmount,
        buyerProtectionFee: fees.buyerProtectionFee,
        buyerProtectionRate: fees.buyerProtectionRate,
        sellerCommissionFee: fees.sellerCommissionFee,
        sellerCommissionRate: fees.sellerCommissionRate,
        buyerTotal: fees.buyerTotal,
        sellerNet: fees.sellerNet,
      },
      commissionRuleKey: feeResult.commissionRuleKey,
      protectionRuleKey: feeResult.protectionRuleKey,
      commissionRuleRate: feeResult.commissionRuleRate,
      protectionRuleRate: feeResult.protectionRuleRate,
    })) as any;

    return { transactionId: String(txId), reference, providerRef, checkoutUrl, totalCharge, fees };
  },
});

// ─── Server-side verification (the ONLY client-callable truth check) ─────

export const verifyPayment = action({
  args: { reference: v.string() },
  handler: async (ctx, args): Promise<{ status: string; reference: string; reason?: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const tx = (await ctx.runQuery(internal.paymentStore.getByReference, {
      reference: args.reference,
    })) as any;
    if (!tx) throw new ConvexError("Payment not found");
    if (tx.payerToken && identity.subject !== tx.payerToken) {
      throw new ConvexError("This payment belongs to another account");
    }

    if (tx.status === "paid") return { status: "paid", reference: args.reference };

    if (tx.provider === "mpesa") {
      // Reuse the existing verified gate: it re-queries Safaricom server-side
      // and stamps verifiedStkPayments (the escrow-funding gate stays intact).
      const status = (await ctx.runAction(api.mpesa.verifyStkPayment, {
        checkoutRequestId: tx.providerRef,
      })) as { paid: boolean; pending: boolean; failed: boolean; resultDesc: string };
      if (status.paid) {
        await ctx.runMutation(internal.paymentStore.markTransactionPaid, {
          reference: args.reference,
          providerStatus: "STK_CONFIRMED",
        });
        return { status: "paid", reference: args.reference };
      }
      if (status.failed) {
        await ctx.runMutation(internal.paymentStore.markTransactionFailed, {
          reference: args.reference,
          failureReason: status.resultDesc || "M-Pesa payment failed",
        });
        return { status: "failed", reference: args.reference, reason: status.resultDesc };
      }
      return { status: "pending", reference: args.reference };
    }

    if (tx.provider === "airtel_money") {
      if (!airtelConfigured()) throw new ConvexError("Airtel Money not configured");
      const token = await getAirtelToken();
      const res = await fetch(
        `${AIRTEL_BASE}/standard/v1/payments/${encodeURIComponent(tx.providerRef)}`,
        { method: "GET", headers: airtelHeaders(token) },
      );
      const data = (await res.json()) as {
        data?: {
          transaction?: {
            id?: string;
            status?: string;
            message?: string;
            airtel_money_id?: string;
          };
        };
      };
      const t = data?.data?.transaction;
      const state = (t?.status || "").toUpperCase();
      if (state === "TS" || state === "SUCCESS" || state === "SUCCESSFUL") {
        await ctx.runMutation(internal.paymentStore.markTransactionPaid, {
          reference: args.reference,
          providerStatus: t?.airtel_money_id || state,
          providerData: JSON.stringify({ airtelMoneyId: t?.airtel_money_id, state }),
        });
        return { status: "paid", reference: args.reference };
      }
      if (state === "TF" || state === "FAILED" || state === "FA") {
        await ctx.runMutation(internal.paymentStore.markTransactionFailed, {
          reference: args.reference,
          failureReason: t?.message || "Airtel Money payment failed",
        });
        return { status: "failed", reference: args.reference, reason: t?.message };
      }
      return { status: "pending", reference: args.reference };
    }

    // card — Flutterwave: re-query by reference (never trust the redirect).
    if (!cardConfigured()) throw new ConvexError("Card payments not configured");
    const res = await fetch(
      `${FLW_BASE}/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(tx.reference)}`,
      { headers: { Authorization: `Bearer ${FLW_SECRET_KEY}` } },
    );
    const data = (await res.json()) as {
      status?: string;
      data?: {
        status?: string;
        amount?: number;
        currency?: string;
        tx_ref?: string;
        id?: number | string;
        flw_ref?: string;
      };
    };
    const d = data?.data;
    const expected = (tx.feeSnapshot as any)?.totalCharge ?? (tx.feeSnapshot as any)?.buyerTotal ?? tx.amount;
    const amountOk = Number(d?.amount) === Number(expected);
    const currencyOk = d?.currency === "KES";
    if (
      data.status === "success" &&
      d?.status === "successful" &&
      amountOk &&
      currencyOk &&
      d?.tx_ref === tx.reference
    ) {
      await ctx.runMutation(internal.paymentStore.markTransactionPaid, {
        reference: args.reference,
        providerStatus: String(d.id ?? d.flw_ref ?? "FLW_CONFIRMED"),
        providerData: JSON.stringify({ flwId: d.id, flwRef: d.flw_ref, chargedAmount: d.amount }),
      });
      return { status: "paid", reference: args.reference };
    }
    if (d?.status === "failed" || d?.status === "cancelled") {
      await ctx.runMutation(internal.paymentStore.markTransactionFailed, {
        reference: args.reference,
        failureReason: `Card payment ${d?.status}`,
      });
      return { status: "failed", reference: args.reference };
    }
    return { status: "pending", reference: args.reference };
  },
});

// ─── Webhook processor (called from http.ts httpAction) ──────────────────

/**
 * Flutterwave webhook: verify the verif-hash header against the configured
 * secret, then re-verify the transaction via API before flipping state
 * (official best practice — never give value on a webhook alone).
 */
export async function processFlwWebhook(ctx: any, request: Request): Promise<Response> {
  try {
    const signature = request.headers.get("verif-hash");
    if (!FLW_SECRET_HASH || !signature || signature !== FLW_SECRET_HASH) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 401 });
    }
    const body = (await request.json()) as {
      event?: string;
      data?: {
        id?: number | string;
        tx_ref?: string;
        status?: string;
        amount?: number;
        currency?: string;
      };
    };
    const d = body?.data;
    if (!d?.tx_ref) return new Response("ok", { status: 200 });

    const tx = (await ctx.runQuery(internal.paymentStore.getByReference, {
      reference: d.tx_ref,
    })) as any;
    if (!tx) return new Response("ok", { status: 200 }); // unknown ref — ack

    if (body.event === "charge.completed") {
      // ALWAYS re-verify via API before giving value.
      const res = await fetch(
        `${FLW_BASE}/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(d.tx_ref)}`,
        { headers: { Authorization: `Bearer ${FLW_SECRET_KEY}` } },
      );
      const data = (await res.json()) as {
        status?: string;
        data?: { status?: string; amount?: number; currency?: string; tx_ref?: string };
      };
      const dd = data?.data;
      const expected = (tx.feeSnapshot as any)?.totalCharge ?? (tx.feeSnapshot as any)?.buyerTotal ?? tx.amount;
      if (
        data.status === "success" &&
        dd?.status === "successful" &&
        Number(dd?.amount) === Number(expected) &&
        dd?.currency === "KES" &&
        dd?.tx_ref === d.tx_ref
      ) {
        await ctx.runMutation(internal.paymentStore.markTransactionPaid, {
          reference: d.tx_ref,
          providerStatus: "WEBHOOK_VERIFIED",
          providerData: JSON.stringify({ flwId: d.id, chargedAmount: dd.amount }),
          fromWebhook: true,
        });
      } else if (dd?.status === "failed" || dd?.status === "cancelled") {
        await ctx.runMutation(internal.paymentStore.markTransactionFailed, {
          reference: d.tx_ref,
          failureReason: `Card payment ${dd.status} (webhook)`,
          fromWebhook: true,
        });
      }
    }
    return new Response(JSON.stringify({ status: "ok" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Flutterwave webhook error:", error);
    return new Response("ok", { status: 200 }); // never 500 — avoids retry storms
  }
}

// ─── Reconciliation: sweep stale awaiting payments ───────────────────────

export const reconcilePending = action({
  args: {},
  handler: async (ctx) => {
    const stale = (await ctx.runQuery(internal.paymentStore.listAwaiting, {
      olderThanMs: 2 * 60 * 1000,
    })) as any[];
    let checked = 0;
    let resolved = 0;
    for (const tx of stale.slice(0, 20)) {
      checked++;
      try {
        // verifyPayment requires the payer session; for reconciliation use a
        // direct provider check instead (admin/system context).
        const r = (await ctx.runAction(api.payments.adminVerifyPayment, {
          reference: tx.reference,
        })) as { status: string };
        if (r.status !== "pending") resolved++;
      } catch {
        // Provider hiccup — the next sweep retries.
      }
    }
    return { checked, resolved, remaining: Math.max(0, stale.length - resolved) };
  },
});

/** Provider re-query without session binding — used by reconciliation only. */
export const adminVerifyPayment = action({
  args: { reference: v.string() },
  handler: async (ctx, args): Promise<{ status: string }> => {
    const tx = (await ctx.runQuery(internal.paymentStore.getByReference, {
      reference: args.reference,
    })) as any;
    if (!tx || tx.status !== "awaiting_confirmation") {
      return { status: tx?.status ?? "unknown" };
    }

    if (tx.provider === "airtel_money" && airtelConfigured()) {
      const token = await getAirtelToken();
      const res = await fetch(
        `${AIRTEL_BASE}/standard/v1/payments/${encodeURIComponent(tx.providerRef)}`,
        { method: "GET", headers: airtelHeaders(token) },
      );
      const data = (await res.json()) as {
        data?: { transaction?: { status?: string; airtel_money_id?: string; message?: string } };
      };
      const state = ((data?.data?.transaction?.status) || "").toUpperCase();
      if (state === "TS" || state === "SUCCESS" || state === "SUCCESSFUL") {
        await ctx.runMutation(internal.paymentStore.markTransactionPaid, {
          reference: args.reference,
          providerStatus: data?.data?.transaction?.airtel_money_id || state,
          providerData: JSON.stringify({ airtelMoneyId: data?.data?.transaction?.airtel_money_id, state }),
        });
        return { status: "paid" };
      }
      if (state === "TF" || state === "FAILED" || state === "FA") {
        await ctx.runMutation(internal.paymentStore.markTransactionFailed, {
          reference: args.reference,
          failureReason: data?.data?.transaction?.message || "Airtel Money payment failed",
        });
        return { status: "failed" };
      }
      return { status: "pending" };
    }

    if (tx.provider === "card" && cardConfigured()) {
      const res = await fetch(
        `${FLW_BASE}/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(tx.reference)}`,
        { headers: { Authorization: `Bearer ${FLW_SECRET_KEY}` } },
      );
      const data = (await res.json()) as {
        status?: string;
        data?: { status?: string; amount?: number; currency?: string; tx_ref?: string };
      };
      const d = data?.data;
      const expected = (tx.feeSnapshot as any)?.totalCharge ?? (tx.feeSnapshot as any)?.buyerTotal ?? tx.amount;
      if (data.status === "success" && d?.status === "successful" && Number(d?.amount) === Number(expected) && d?.currency === "KES") {
        await ctx.runMutation(internal.paymentStore.markTransactionPaid, {
          reference: args.reference,
          providerStatus: "RECONCILED",
        });
        return { status: "paid" };
      }
      if (d?.status === "failed" || d?.status === "cancelled") {
        await ctx.runMutation(internal.paymentStore.markTransactionFailed, {
          reference: args.reference,
          failureReason: `Card payment ${d?.status} (reconciled)`,
        });
        return { status: "failed" };
      }
      return { status: "pending" };
    }

    // M-Pesa rows reconcile through verifyStkPayment with the payer's session;
    // Safaricom also pushes the callback path, so leave those to the callback.
    return { status: "pending" };
  },
});

// ─── Refund execution (provider-routed) ──────────────────────────────────

export const executeRefund = action({
  args: { refundId: v.string() },
  handler: async (ctx, args): Promise<{ ok: boolean; status: string }> => {
    const refund = (await ctx.runQuery(internal.paymentStore.getRefund, {
      refundId: args.refundId,
    })) as any;
    if (!refund) throw new ConvexError("Refund not found");
    if (refund.status !== "pending") throw new ConvexError("Refund already processed");
    const tx = (await ctx.runQuery(internal.paymentStore.getTxById, {
      txId: refund.paymentTxId,
    })) as any;
    if (!tx) throw new ConvexError("Payment not found");

    await ctx.runMutation(internal.paymentStore.markRefundProcessing, {
      refundId: args.refundId,
    });

    if (tx.provider === "card" && cardConfigured()) {
      const flwId = (() => {
        try {
          return JSON.parse(tx.providerData || "{}").flwId;
        } catch {
          return undefined;
        }
      })();
      if (!flwId) throw new ConvexError("Cannot locate the Flutterwave transaction for refund");
      const res = await fetch(`${FLW_BASE}/v3/transactions/${flwId}/refund`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: refund.amount, comments: refund.reason }),
      });
      const data = (await res.json()) as { status?: string; data?: { id?: number; status?: string } };
      if (data.status !== "success") {
        await ctx.runMutation(internal.paymentStore.markRefundFailed, {
          refundId: args.refundId,
          reason: "Gateway rejected the refund",
        });
        throw new ConvexError("Refund failed at the gateway — it has been marked failed.");
      }
      await ctx.runMutation(internal.paymentStore.markRefundCompleted, {
        refundId: args.refundId,
        providerRefundId: String(data.data?.id ?? ""),
        providerStatus: data.data?.status ?? "completed",
      });
      await ctx.runMutation(internal.paymentStore.applyRefundToTransaction, {
        txId: tx._id,
        amount: refund.amount,
      });
      return { ok: true, status: "completed" };
    }

    if (tx.provider === "airtel_money" && airtelConfigured()) {
      const token = await getAirtelToken();
      const airtelId = (() => {
        try {
          return JSON.parse(tx.providerData || "{}").airtelMoneyId;
        } catch {
          return undefined;
        }
      })();
      if (!airtelId) throw new ConvexError("Cannot locate the Airtel transaction for refund");
      const res = await fetch(`${AIRTEL_BASE}/standard/v1/payments/refunds/`, {
        method: "POST",
        headers: airtelHeaders(token),
        body: JSON.stringify({
          transaction: { airtel_money_id: airtelId },
          refund: {
            amount: refund.amount,
            currency: "KES",
            reference: `NX-REF-${args.refundId}`.slice(0, 40),
          },
        }),
      });
      const data = (await res.json()) as { status?: any; data?: any; message?: string };
      const ok = data?.status?.success || data?.status?.code === "200" || res.ok;
      if (!ok) {
        await ctx.runMutation(internal.paymentStore.markRefundFailed, {
          refundId: args.refundId,
          reason: data.message || "Airtel rejected the refund",
        });
        throw new ConvexError("Refund failed at Airtel Money — it has been marked failed.");
      }
      await ctx.runMutation(internal.paymentStore.markRefundCompleted, {
        refundId: args.refundId,
        providerRefundId: String(data?.data?.transaction?.airtel_money_id ?? ""),
        providerStatus: "REFUND_INITIATED",
      });
      await ctx.runMutation(internal.paymentStore.applyRefundToTransaction, {
        txId: tx._id,
        amount: refund.amount,
      });
      return { ok: true, status: "completed" };
    }

    // M-Pesa refunds ride the existing B2C payout engine with the Safaricom
    // result callback as truth — complete them from the Payouts page.
    await ctx.runMutation(internal.paymentStore.markRefundFailed, {
      refundId: args.refundId,
      reason: "Route through M-Pesa B2C payout flow (Payouts page)",
    });
    throw new ConvexError(
      "M-Pesa refunds are issued through the B2C payout flow (Payouts page).",
    );
  },
});
