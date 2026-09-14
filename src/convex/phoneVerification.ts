import { v } from "convex/values";
import { action, mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { getSessionUser } from "./users";
import type { QueryCtx } from "./_generated/server";

// ─── Phone verification: 6-digit code to the user's handset ──────────────────
// Delivery via Africa's Talking (Kenya-native SMS gateway). Set
// AFRICASTALKING_API_KEY (+ optional AFRICASTALKING_USERNAME, default "sandbox")
// in the project's Keys/API keys tab. Until keys are set the mutation reports
// a clear "not configured" state — registration still works via email OTP.

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

/** Normalize any Kenyan phone format to 2547XXXXXXXX. */
export function normalizeKePhone(raw: string): string | null {
  const d = (raw || "").replace(/[^0-9]/g, "");
  if (d.startsWith("254") && d.length === 12) return d;
  if (d.startsWith("0") && d.length === 10) return `254${d.slice(1)}`;
  if ((d.startsWith("7") || d.startsWith("1")) && d.length === 9) return `254${d}`;
  return null;
}

async function hashCode(code: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(code));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Internal delivery. Kept as an internalMutation so the action wrapper below
 * can call it after the HTTP hop without exposing raw code setting publicly.
 */
export const requestPhoneCodeInternal = internalMutation({
  args: { userId: v.string(), phone: v.string() },
  handler: async (ctx, args) => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + CODE_TTL_MS;
    // Invalidate previous codes for this number.
    const old = await ctx.db
      .query("phoneOtps")
      .withIndex("by_phone", (q) => q.eq("phone", args.phone))
      .collect();
    for (const o of old) await ctx.db.delete(o._id);
    await ctx.db.insert("phoneOtps", {
      phone: args.phone,
      userId: args.userId,
      codeHash: await hashCode(code),
      expiresAt,
      attempts: 0,
      consumed: false,
      createdAt: Date.now(),
    });
    return { code };
  },
});

// Public: ask for a code on your own account's phone.
export const sendPhoneCode = mutation({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    const user = await getSessionUser(ctx);
    if (!user) throw new Error("Not authenticated");
    const phone = normalizeKePhone(args.phone);
    if (!phone) throw new Error("Enter a valid Kenyan number, e.g. 0712 345 678");
    // Rate limit: one code per number per minute.
    const recent = await ctx.db
      .query("phoneOtps")
      .withIndex("by_phone", (q) => q.eq("phone", phone))
      .first();
    if (recent && Date.now() - (recent as any).createdAt < 60 * 1000) {
      throw new Error("Wait a minute before requesting another code");
    }
    return { ok: true as const, phone };
  },
});

// Action that performs the HTTP send (mutations cannot do fetch). Resolves
// the signed-in user itself so the client never passes a userId.
export const deliverPhoneCode = action({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    const phone = normalizeKePhone(args.phone);
    if (!phone) throw new Error("Invalid phone number");
    const user: any = await getSessionUser(ctx as unknown as Parameters<typeof getSessionUser>[0]);
    if (!user) throw new Error("Not authenticated");

    const apiKey = process.env.AFRICASTALKING_API_KEY;
    if (!apiKey) {
      throw new Error(
        "SMS is not configured yet — add your Africa's Talking API key (AFRICASTALKING_API_KEY) in the Keys tab.",
      );
    }
    const username = process.env.AFRICASTALKING_USERNAME || "sandbox";

    const { code } = await ctx.runMutation(internal.phoneVerification.requestPhoneCodeInternal, {
      userId: user._id,
      phone,
    });

    const res = await fetch("https://api.africastalking.com/version1/messaging", {
      method: "POST",
      headers: {
        apiKey,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        username,
        to: `+${phone}`,
        message: `Your Nexora Market verification code is ${code}. It expires in 10 minutes. Never share this code.`,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Could not send the SMS (${res.status}). ${text.slice(0, 120)}`);
    }
    return { sent: true as const };
  },
});

// Public verify: mark the user's phone as verified on success.
export const verifyPhoneCode = mutation({
  args: { phone: v.string(), code: v.string() },
  handler: async (ctx, args) => {
    const user = await getSessionUser(ctx);
    if (!user) throw new Error("Not authenticated");
    const phone = normalizeKePhone(args.phone);
    if (!phone) throw new Error("Invalid phone number");

    const rec = (await ctx.db
      .query("phoneOtps")
      .withIndex("by_phone", (q) => q.eq("phone", phone))
      .first()) as any;
    if (!rec || rec.userId !== user._id) throw new Error("Request a code first");
    if (rec.consumed) throw new Error("This code was already used — request a new one");
    if (Date.now() > rec.expiresAt) throw new Error("Code expired — request a new one");
    if ((rec.attempts ?? 0) >= MAX_ATTEMPTS) throw new Error("Too many attempts — request a new code");

    const ok = (await hashCode(args.code)) === rec.codeHash;
    if (!ok) {
      await ctx.db.patch(rec._id, { attempts: (rec.attempts ?? 0) + 1 });
      throw new Error("Wrong code — check the SMS and try again");
    }
    await ctx.db.patch(rec._id, { consumed: true });
    await ctx.db.patch(user._id as any, { phone, phoneVerified: true });
    return { verified: true as const };
  },
});
