import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getSessionUser } from "./users";

const ADMIN_EMAIL = "murimiedwin227@gmail.com";

async function requireAdmin(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.email) throw new Error("Not authenticated");
  const user: any = await getSessionUser(ctx);
  const role = user?.role ?? (identity.email === ADMIN_EMAIL ? "admin" : null);
  if (role !== "admin") throw new Error("Admin access required");
  return { user };
}

// ─── Creator Referral Agreement ──────────────────────────────────────────────
// The agreement document is rendered (embedded) in the signup flow. The user
// fills their declaration, signs and ticks "I agree". Submission creates a
// pending record for admin review — the creator program only activates after
// an admin approves.

export const submitAgreement = mutation({
  args: {
    fullName: v.string(),
    phone: v.string(),
    email: v.string(),
    creatorCode: v.optional(v.string()),
    signature: v.string(),
    agreedTerms: v.boolean(),
    commissionScheduleJson: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getSessionUser(ctx);
    if (!user) throw new Error("Sign in before submitting the agreement");
    if (!args.agreedTerms) throw new Error("You must tick the agreement checkbox");
    if (!args.fullName.trim() || !args.phone.trim() || !args.signature.trim()) {
      throw new Error("Fill your name, phone and signature");
    }
    if ((args.signature.trim().toLowerCase() !== args.fullName.trim().toLowerCase())) {
      throw new Error("Your signature must match your full name");
    }
    const existing = await ctx.db
      .query("referralAgreements")
      .withIndex("by_user", (q) => q.eq("userId", user._id as any))
      .first();
    const payload = {
      fullName: args.fullName.trim(),
      phone: args.phone.trim(),
      email: args.email.trim(),
      creatorCode: args.creatorCode?.trim() || undefined,
      signature: args.signature.trim(),
      agreedTerms: true,
      commissionScheduleJson: args.commissionScheduleJson || undefined,
      status: "pending" as const,
      createdAt: Date.now(),
    };
    if (existing) {
      if ((existing as any).status === "pending") {
        throw new Error("Your agreement is already with the admin for review");
      }
      await ctx.db.patch((existing as any)._id, { ...payload, reviewNote: undefined, reviewedBy: undefined, reviewedAt: undefined });
      return { id: (existing as any)._id, status: "pending" as const };
    }
    const id = await ctx.db.insert("referralAgreements", { ...payload, userId: user._id as any } as any);

    // Notify admins for review.
    const admins = await ctx.db
      .query("users")
      .withIndex("by_role" as any, (q: any) => q.eq("role", "admin"))
      .collect();
    for (const admin of admins) {
      await ctx.db.insert("notifications", {
        userId: admin._id,
        type: "account",
        title: "Creator agreement to review",
        message: `${args.fullName} signed the Creator Referral Agreement — review and approve.`,
        read: false,
        link: "/admin/referrals",
        createdAt: Date.now(),
      });
    }
    return { id, status: "pending" as const };
  },
});

/** My own agreement (shows status inside the signup/dashboard). */
export const getMyAgreement = query({
  args: {},
  handler: async (ctx) => {
    const user = await getSessionUser(ctx);
    if (!user) return null;
    return await ctx.db
      .query("referralAgreements")
      .withIndex("by_user", (q) => q.eq("userId", user._id as any))
      .first();
  },
});

/** Admin: all agreements. Degrades gracefully — returns an empty list for
 *  non-admins or mid-sync deployments instead of throwing, so the Creator
 *  Program page never crashes on this query. */
export const adminListAgreements = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) return [];
    let role: string | null = null;
    try {
      const user: any = await getSessionUser(ctx);
      role = (user?.role as string) ?? null;
    } catch {
      role = null;
    }
    if (role !== "admin" && identity.email !== ADMIN_EMAIL) return [];
    return await ctx.db.query("referralAgreements").order("desc").take(500);
  },
});

/** Admin: approve or reject. */
export const adminReviewAgreement = mutation({
  args: {
    id: v.id("referralAgreements"),
    approve: v.boolean(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireAdmin(ctx);
    const rec = (await ctx.db.get(args.id)) as any;
    if (!rec) throw new Error("Agreement not found");
    await ctx.db.patch(args.id, {
      status: args.approve ? "approved" : "rejected",
      reviewNote: args.note,
      reviewedBy: user.name || user.email || "Admin",
      reviewedAt: Date.now(),
    });
    await ctx.db.insert("notifications", {
      userId: rec.userId,
      type: "account",
      title: args.approve ? "Creator agreement approved 🎉" : "Creator agreement not approved",
      message: args.approve
        ? "Your Creator Referral Agreement was approved. Your referral link is now active in the Creator Program."
        : `Your Creator Referral Agreement was not approved.${args.note ? ` Note: ${args.note}` : ""}`,
      read: false,
      link: "/creator",
      createdAt: Date.now(),
    });
    return { success: true };
  },
});
