"use node";

import { v, ConvexError } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || "";
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || "";
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE || "607501";
const MPESA_PASSKEY = process.env.MPESA_PASSKEY || "";
const MPESA_CALLBACK_URL = process.env.MPESA_CALLBACK_URL || "";
const MPESA_ENV = process.env.MPESA_ENV || "sandbox";

const BASE_URL =
  MPESA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

function credentialsConfigured(): boolean {
  return Boolean(MPESA_CONSUMER_KEY && MPESA_CONSUMER_SECRET && MPESA_PASSKEY);
}

// Short-lived OAuth cache so polling (every ~5s per payment) doesn't hammer
// the token endpoint. Safe as per-instance memory inside Convex actions.
let cachedToken: { value: string; expiresAt: number } | null = null;

/** Get OAuth token from Safaricom (cached until ~1 minute before expiry) */
async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.value;
  }
  const credentials = Buffer.from(
    `${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`
  ).toString("base64");

  const res = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    method: "GET",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
  });

  const data = (await res.json()) as { access_token?: string; error?: string; message?: string; expires_in?: string };
  if (!data.access_token) {
    throw new ConvexError(`M-Pesa OAuth failed: ${data.message || data.error || JSON.stringify(data)}. Check MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET in API Keys.`);
  }
  // Safaricom tokens live ~3600s; refresh a minute early.
  const ttl = Math.max(60, (Number(data.expires_in) || 3600) - 60) * 1000;
  cachedToken = { value: data.access_token, expiresAt: Date.now() + ttl };
  return data.access_token;
}

/** Generate M-Pesa password from shortcode + passkey + timestamp */
function generatePassword(timestamp: string): string {
  const dataToEncode = `${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`;
  return Buffer.from(dataToEncode).toString("base64");
}

/** Format current timestamp as YYYYMMDDHHmmss */
function getTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    now.getFullYear().toString() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds())
  );
}

/** Normalize a Kenyan phone number to 2547XXXXXXXX / 2541XXXXXXXX */
export function normalizePhone(input: string): string {
  let phone = input.replace(/[^0-9]/g, "");
  if (phone.startsWith("0")) {
    phone = "254" + phone.slice(1);
  }
  if (!phone.startsWith("254")) {
    phone = "254" + phone;
  }
  return phone;
}

/** Initiate M-Pesa STK Push (Lipa Na M-Pesa Online) */
export const initiateStkPush = action({
  args: {
    phoneNumber: v.string(),
    amount: v.number(),
    accountReference: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    if (!credentialsConfigured()) {
      throw new ConvexError("M-Pesa credentials not configured. Add MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET and MPESA_PASSKEY in API Keys.");
    }

    const accessToken = await getAccessToken();
    const timestamp = getTimestamp();
    const password = generatePassword(timestamp);
    const phone = normalizePhone(args.phoneNumber);

    const stkPushPayload = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(args.amount),
      PartyA: phone,
      PartyB: MPESA_SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: MPESA_CALLBACK_URL,
      AccountReference: args.accountReference.slice(0, 12),
      TransactionDesc: args.description.slice(0, 60) || "NEXORA MARKETPLACE",
    };

    const res = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(stkPushPayload),
    });

    const data = (await res.json()) as {
      MerchantRequestID?: string;
      CheckoutRequestID?: string;
      ResponseCode?: string;
      ResponseDescription?: string;
      CustomerMessage?: string;
      errorCode?: string;
      errorMessage?: string;
    };

    if (data.ResponseCode !== "0") {
      throw new ConvexError(
        `STK Push failed: ${data.errorMessage || data.ResponseDescription || "Unknown error"}`
      );
    }

    return {
      merchantRequestId: data.MerchantRequestID,
      checkoutRequestId: data.CheckoutRequestID,
      responseCode: data.ResponseCode,
      customerMessage: data.CustomerMessage,
    };
  },
});

/**
 * Shared STK status query. Runs ONLY on the server (this module holds the
 * M-Pesa credentials). Result codes:
 *   0    → paid
 *   1032 → cancelled by user (treated as pending until confirmed otherwise)
 *   1036 → request timeout / cancelled
 *   1037 → still processing
 */
async function queryStkStatus(checkoutRequestId: string): Promise<{
  paid: boolean;
  pending: boolean;
  failed: boolean;
  resultCode?: string;
  resultDesc: string;
  raw: Record<string, unknown>;
}> {
  if (!credentialsConfigured()) {
    throw new ConvexError("M-Pesa credentials not configured. Add MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET and MPESA_PASSKEY in API Keys.");
  }

  const accessToken = await getAccessToken();
  const timestamp = getTimestamp();
  const password = generatePassword(timestamp);

  const res = await fetch(`${BASE_URL}/mpesa/stkpushquery/v1/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    }),
  });

  const data = (await res.json()) as {
    ResponseCode?: string;
    ResponseDescription?: string;
    ResultCode?: string;
    ResultDesc?: string;
    MerchantRequestID?: string;
    CheckoutRequestID?: string;
  };

  const resultCode = data.ResultCode;
  const paid = resultCode === "0";
  const pending = resultCode === "1037" || resultCode === undefined;
  // 1032/1036: the user dismissed the prompt — keep polling briefly in case
  // Safaricom lags, but the UI shows it as still waiting.
  const stillWaiting = pending || resultCode === "1032" || resultCode === "1036";

  return {
    paid,
    pending: stillWaiting,
    failed: paid || stillWaiting ? false : true,
    resultCode,
    resultDesc: data.ResultDesc || data.ResponseDescription || "",
    raw: data as Record<string, unknown>,
  };
}

/**
 * Client-facing status poll (READ-ONLY). Never credits anything. Used by the
 * UI to show live Safaricom state during checkout.
 */
export const checkTransactionStatus = action({
  args: {
    checkoutRequestId: v.string(),
  },
  handler: async (ctx, args) => {
    const result = await queryStkStatus(args.checkoutRequestId);
    return {
      responseCode: (result.raw.ResponseCode as string) ?? undefined,
      resultCode: result.resultCode,
      resultDesc: result.resultDesc,
      merchantRequestId: (result.raw.MerchantRequestID as string) ?? undefined,
    };
  },
});

/**
 * SERVER-VERIFIED payment check — the gate for money movement.
 *
 * The client polls this (not checkTransactionStatus) before creating an order
 * or completing anything of value. The Safaricom query happens HERE, on the
 * server, with server credentials — the client can never assert a payment.
 * When Safaricom confirms the payment, a tamper-evident verification record is
 * written; `wallet.createOrder` (mpesa path) refuses to fund an escrow unless
 * that record exists for the CheckoutRequestID it is given.
 */
export const verifyStkPayment = action({
  args: {
    checkoutRequestId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const status = await queryStkStatus(args.checkoutRequestId);

    if (status.paid) {
      await ctx.runMutation(internal.wallet.recordVerifiedStkPayment, {
        checkoutRequestId: args.checkoutRequestId,
        payerToken: identity.subject,
      });
    }

    return {
      paid: status.paid,
      pending: status.pending,
      failed: status.failed,
      resultDesc: status.resultDesc,
    };
  },
});

/**
 * SERVER-VERIFIED completion of a wallet deposit — the ONLY client-callable
 * path that credits a wallet. The deposit must already exist (created by
 * `wallet.initiateDeposit`) and be linked to this CheckoutRequestID via
 * `wallet.attachCheckoutRequest`. Ownership is enforced against the session;
 * the payment is confirmed by re-querying Safaricom here. No receipt string
 * ever comes from the client.
 */
export const verifyStkDeposit = action({
  args: {
    checkoutRequestId: v.string(),
  },
  handler: async (ctx, args): Promise<
    | { status: "already_completed"; amount: number }
    | { status: "paid"; amount: number }
    | { status: "pending"; resultDesc: string }
    | { status: "failed"; resultDesc: string }
  > => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    // The pending deposit must exist and belong to the caller.
    const tx = (await ctx.runQuery(internal.wallet.getDepositByCheckout, {
      checkoutRequestId: args.checkoutRequestId,
    })) as { _id: any; userId: string; amount: number; status: string } | null;
    if (!tx) {
      throw new ConvexError("Deposit not found for this payment. Start the deposit again from the wallet page.");
    }
    const owner = (await ctx.runQuery(internal.wallet.getUserByEmailInternal, {
      email: identity.email!,
    })) as { _id: string } | null;
    if (!owner || owner._id !== tx.userId) {
      throw new ConvexError("Unauthorized: this deposit belongs to another account");
    }
    if (tx.status === "completed") {
      return { status: "already_completed", amount: tx.amount };
    }

    const status = await queryStkStatus(args.checkoutRequestId);

    if (status.paid) {
      const result = (await ctx.runMutation(internal.wallet.completeVerifiedDeposit, {
        txId: tx._id,
      })) as { amount: number };
      return { status: "paid", amount: result.amount };
    }
    if (status.pending) {
      return { status: "pending", resultDesc: status.resultDesc };
    }
    return { status: "failed", resultDesc: status.resultDesc || "M-Pesa payment failed" };
  },
});
