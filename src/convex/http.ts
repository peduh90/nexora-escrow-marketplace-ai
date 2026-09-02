import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

auth.addHttpRoutes(http);

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

        // Credit wallet via mutation
        await ctx.runMutation(api.wallet.confirmDeposit, {
          reference: checkoutRequestId,
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
