import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { processFlwWebhook } from "./payments";

const http = httpRouter();

auth.addHttpRoutes(http);

/**
 * Flutterwave card-payment webhook — verified via the verif-hash secret
 * header, then re-verified against the API before any state flips.
 */
http.route({
  path: "/payments/flw/webhook",
  method: "POST",
  handler: httpAction((ctx, request) => processFlwWebhook(ctx, request)),
});

/**
 * M-Pesa B2C result callback — the payout completion truth.
 * Safaricom POSTs here after attempting the B2C disbursement. ResultCode 0
 * with a TransactionID means the money actually landed on the owner's M-Pesa.
 */
http.route({
  path: "/mpesa/b2c/result",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const result = body?.Result;
      if (!result) {
        return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "OK" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      const conversationId = result.ConversationID || "";
      const resultCode = typeof result.ResultCode === "number"
        ? result.ResultCode
        : Number(result.ResultCode);
      const resultDesc = result.ResultDesc || "";
      // TransactionID lives in the ReferenceData when the payment succeeded.
      const refItems = result.ReferenceData?.ReferenceItem || [];
      const transactionId =
        refItems.find((i: any) => i?.Key === "TransactionID")?.Value || "";

      if (conversationId) {
        await ctx.runMutation(internal.feeRules.completePayoutFromB2C, {
          conversationId,
          resultCode: Number.isFinite(resultCode) ? resultCode : 1,
          resultDesc,
          transactionId: transactionId || undefined,
        });
      }

      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Success" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("M-Pesa B2C result callback error:", error);
      // Always 200 so Safaricom doesn't retry-loop; failures are logged.
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Received" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

/** M-Pesa B2C queue timeout — Safaricom could not process in time. */
http.route({
  path: "/mpesa/b2c/timeout",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const conversationId = body?.Result?.ConversationID || "";
      if (conversationId) {
        await ctx.runMutation(internal.feeRules.completePayoutFromB2C, {
          conversationId,
          resultCode: 1,
          resultDesc: "M-Pesa queue timeout — payout was not processed",
        });
      }
    } catch (error) {
      console.error("M-Pesa B2C timeout callback error:", error);
    }
    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Success" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

/**
 * M-Pesa STK Push callback endpoint.
 * Safaricom POSTs payment results here after the user enters their PIN.
 */
http.route({
  path: "/mpesa/callback",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const stkCallback = body?.Body?.stkCallback;

      if (!stkCallback) {
        return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "OK" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      const resultCode = stkCallback.ResultCode;
      const checkoutRequestId = stkCallback.CheckoutRequestID || "";

      if (resultCode === 0) {
        const metadata = stkCallback.CallbackMetadata?.Item || [];
        const mpesaReceipt = metadata.find((i: any) => i.Name === "MpesaReceiptNumber")?.Value || "";

        // Credit wallet via internal mutation (server-to-server, no session).
        await ctx.runMutation(internal.wallet.completeDepositFromCallback, {
          checkoutRequestId,
          mpesaReceipt,
        });
      }

      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Success" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("M-Pesa callback error:", error);
      return new Response(JSON.stringify({ ResultCode: 1, ResultDesc: "Error" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

export default http;
