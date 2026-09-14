import { Email } from "@convex-dev/auth/providers/Email";
import axios from "axios";
import { ConvexError } from "convex/values";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";

export const emailOtp = Email({
  id: "email-otp",
  maxAge: 60 * 15, // 15 minutes
  // This function can be asynchronous
  async generateVerificationToken() {
    const random: RandomReader = {
      read(bytes: Uint8Array) {
        crypto.getRandomValues(bytes);
      },
    };
    const alphabet = "0123456789";
    return generateRandomString(random, alphabet, 6);
  },
  async sendVerificationRequest({ identifier: email, token }) {
    try {
      await axios.post(
        "https://auth.freebuff.app/send_otp",
        {
          to: email,
          otp: token,
          appName: process.env.VLY_APP_NAME || "a freebuff.com application",
        },
        {
          headers: {
            "x-api-key": "fb_email_2crN1hqIArZP2bEfvjp5Qik4",
          },
        },
      );
    } catch (error: any) {
      const status = error?.response?.status;
      const detail = error?.response?.data ? JSON.stringify(error.response.data).slice(0, 200) : error?.message;
      console.error("[emailOtp] Failed to send verification email:", status, detail);
      // Throw a ConvexError so the structured data reaches the client as
      // error.data — a plain Error here is masked into the opaque
      // "[CONVEX A(auth:signIn)] Server Error" banner users saw before.
      throw new ConvexError({
        code: "email_delivery_failed",
        message:
          "We couldn't email your verification code right now. Check your connection, then tap \"Resend code\" — it usually works on the next try.",
        detail,
      });
    }
  },
});
