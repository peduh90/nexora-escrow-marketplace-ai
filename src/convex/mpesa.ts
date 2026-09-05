"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";

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

/** Get OAuth token from Safaricom */
async function getAccessToken(): Promise<string> {
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

  const data = (await res.json()) as { access_token?: string; error?: string; message?: string };
  if (!data.access_token) {
    throw new Error(`M-Pesa OAuth failed: ${data.message || data.error || JSON.stringify(data)}. Check MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET in API Keys.`);
  }
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

/** Initiate M-Pesa STK Push (Lipa Na M-Pesa Online) */
export const initiateStkPush = action({
  args: {
    phoneNumber: v.string(),
    amount: v.number(),
    accountReference: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    if (!MPESA_CONSUMER_KEY || !MPESA_CONSUMER_SECRET) {
      throw new Error("M-Pesa credentials not configured. Add MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET in API Keys.");
    }

    const accessToken = await getAccessToken();
    const timestamp = getTimestamp();
    const password = generatePassword(timestamp);

    // Format phone: remove +, ensure 254 prefix
    let phone = args.phoneNumber.replace(/[^0-9]/g, "");
    if (phone.startsWith("0")) {
      phone = "254" + phone.slice(1);
    }
    if (!phone.startsWith("254")) {
      phone = "254" + phone;
    }

    const stkPushPayload = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: args.amount,
      PartyA: phone,
      PartyB: MPESA_SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: MPESA_CALLBACK_URL,
      AccountReference: args.accountReference,
      TransactionDesc: "NEXORA MARKETPLACE",
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
      throw new Error(
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

/** Check STK Push transaction status */
export const checkTransactionStatus = action({
  args: {
    checkoutRequestId: v.string(),
  },
  handler: async (ctx, args) => {
    if (!MPESA_CONSUMER_KEY || !MPESA_CONSUMER_SECRET) {
      throw new Error("M-Pesa credentials not configured.");
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
        CheckoutRequestID: args.checkoutRequestId,
      }),
    });

    const data = (await res.json()) as {
      ResponseCode?: string;
      ResponseDescription?: string;
      MerchantRequestID?: string;
      CheckoutRequestID?: string;
      ResultCode?: string;
      ResultDesc?: string;
    };

    return {
      responseCode: data.ResponseCode,
      resultCode: data.ResultCode,
      resultDesc: data.ResultDesc,
      merchantRequestId: data.MerchantRequestID,
    };
  },
});
