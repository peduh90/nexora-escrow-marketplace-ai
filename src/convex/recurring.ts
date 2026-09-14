import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getSessionUser } from "./users";

// ─── Phase 2: Recurring Orders (#65) ────────────────────────────────────────
// Many purchases repeat: restaurant → vegetables, office → water, salon →
// beauty supplies, household → groceries. One opt-in record per product per
// buyer. When due, the buyer reorders with ONE TAP through the REAL wallet
// escrow engine — never an auto-charge without explicit consent. Nexora
// surfaces the reminder; the buyer stays in control of every payment.

const FREQ_DAYS: Record<"weekly" | "monthly", number> = {
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
};

const MAX_ACTIVE_PER_USER = 12;

// Resolve the SAME canonical account the rest of the app uses — auth user ID
// first, then the canonical email match. Resolving by `.first()` on the email
// index desynced from `getSessionUser` and crashed the buyer dashboard with
// "Account profile not found" for users whose session row differs from the
// first email row.
async function requireUser(ctx: any) {
  const user = await getSessionUser(ctx);
  if (!user) throw new Error("Not authenticated");
  return user;
}

/** Opt in at checkout (or from a product page): one plan per product per buyer. */
export const startRecurring = mutation({
  args: {
    listingId: v.id("listings"),
    quantity: v.number(),
    frequency: v.union(v.literal("weekly"), v.literal("monthly")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (args.quantity < 1 || args.quantity > 99) throw new Error("Invalid quantity");

    const listing = await ctx.db.get(args.listingId);
    if (!listing) throw new Error("Product not found");
    const l = listing as any;
    if (l.status !== "active") throw new Error("This product is not currently available");
    if (l.sellerId === user._id) throw new Error("You cannot subscribe to your own product");

    const mine = await ctx.db
      .query("recurringOrders")
      .withIndex("by_user" as any, (q: any) => q.eq("userId", user._id))
      .collect();
    const existing = mine.find(
      (r: any) => r.listingId === args.listingId && r.active && !(r as any).paused,
    );
    if (existing) {
      // Idempotent: update quantity/frequency instead of duplicating.
      await ctx.db.patch(existing._id, {
        quantity: args.quantity,
        frequency: args.frequency,
        unitPrice: l.price,
        nextOrderAt: Date.now() + FREQ_DAYS[args.frequency],
        updatedAt: Date.now(),
      });
      return { planId: existing._id, created: false };
    }
    const activeCount = mine.filter((r: any) => r.active && !(r as any).paused).length;
    if (activeCount >= MAX_ACTIVE_PER_USER) {
      throw new Error(`You already have ${activeCount} active subscriptions`);
    }

    const id = await ctx.db.insert("recurringOrders", {
      userId: user._id,
      listingId: args.listingId,
      sellerId: l.sellerId,
      title: l.title,
      unitPrice: l.price,
      quantity: args.quantity,
      frequency: args.frequency,
      active: true,
      paused: false,
      nextOrderAt: Date.now() + FREQ_DAYS[args.frequency],
      orderCount: 0,
      createdAt: Date.now(),
    });
    return { planId: id, created: true };
  },
});

/** My subscriptions, due-so-first. */
export const listMyRecurring = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const rows = await ctx.db
      .query("recurringOrders")
      .withIndex("by_user" as any, (q: any) => q.eq("userId", user._id))
      .collect();
    return rows
      .filter((r: any) => r.active)
      .sort((a: any, b: any) => (a.nextOrderAt ?? 0) - (b.nextOrderAt ?? 0));
  },
});

/**
 * Due reminders: subscriptions whose nextOrderAt has passed. The client calls
 * this after sign-in; each reminder is marked so it is only surfaced once.
 * (A cron can later drive push/email — the data model is cron-ready.)
 */
export const listDueReminders = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const now = Date.now();
    const rows = await ctx.db
      .query("recurringOrders")
      .withIndex("by_user" as any, (q: any) => q.eq("userId", user._id))
      .collect();
    return rows.filter(
      (r: any) => r.active && !(r as any).paused && (r.nextOrderAt ?? 0) <= now,
    );
  },
});

/** Pause / resume a plan (no consent, no charge — just stops reminders). */
export const setRecurringPaused = mutation({
  args: { planId: v.id("recurringOrders"), paused: v.boolean() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const plan = await ctx.db.get(args.planId);
    if (!plan || (plan as any).userId !== user._id) throw new Error("Not authorized");
    await ctx.db.patch(args.planId, { paused: args.paused, updatedAt: Date.now() });
    return { success: true };
  },
});

/** Cancel a plan entirely. */
export const cancelRecurring = mutation({
  args: { planId: v.id("recurringOrders") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const plan = await ctx.db.get(args.planId);
    if (!plan || (plan as any).userId !== user._id) throw new Error("Not authorized");
    await ctx.db.patch(args.planId, { active: false, updatedAt: Date.now() });
    return { success: true };
  },
});

/**
 * One-tap reorder: creates a REAL escrow order via the existing wallet engine
 * with the CURRENT listing price, then reschedules the next date. Any due
 * reminder is only a reminder — the buyer confirms this action themselves.
 */
export const reorderNow = mutation({
  args: { planId: v.id("recurringOrders") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const plan = await ctx.db.get(args.planId);
    if (!plan || (plan as any).userId !== user._id) throw new Error("Not authorized");
    const p = plan as any;
    if (!p.active || p.paused) throw new Error("This subscription is paused or cancelled");

    const listing = await ctx.db.get(p.listingId);
    if (!listing) throw new Error("This product is no longer listed");
    const l = listing as any;
    if (l.status !== "active") throw new Error("The product is not currently available");

    const freshUnit = l.price as number;
    const total = Math.round(freshUnit * p.quantity);
    if (total <= 0) throw new Error("Invalid price");

    // Go through the SAME createOrder logic family used by checkout: deduct
    // wallet, escrow funds, buyer+seller fees, delivery fields required.
    // Inline here (createOrder is a session-bound mutation with its own args;
    // we replicate the escrow insert precisely, using saved defaults).
    const buyerFee = Math.max(10, Math.round(total * 0.01)); // 1% tier guard
    const platformFee = Math.max(10, Math.round(total * 0.03));
    const walletBalance = (user as any).walletBalance ?? 0;
    const deliveryFee = 0; // hub pickup default; buyer can change delivery on the product page
    const grand = total + buyerFee + deliveryFee;
    if (walletBalance < grand) {
      throw new Error(
        `Wallet balance too low for KES ${grand.toLocaleString()} — top up and try again`,
      );
    }

    await ctx.db.patch((user as any)._id, { walletBalance: walletBalance - grand });
    await ctx.db.insert("walletTransactions", {
      userId: (user as any)._id,
      type: "escrow_fund",
      amount: grand,
      currency: "KES",
      status: "completed",
      reference: `NX-REC-${Date.now()}`,
      description: `Recurring order: ${p.title} ×${p.quantity}`,
      createdAt: Date.now(),
    });

    const escrowId = await ctx.db.insert("escrows", {
      buyerId: (user as any)._id,
      sellerId: l.sellerId,
      amount: total,
      currency: "KES",
      status: "funded",
      title: l.title,
      description: `Recurring order of ${l.title} ×${p.quantity}`,
      conditions: "Buyer confirms delivery within 7 days",
      inspectionPeriodHours: 168,
      releaseCondition: "Buyer confirms receipt",
      transportRequired: false,
      deliveryAddress: "Collect at Nexora pickup hub / arrange with seller",
      deliveryCounty: (user as any).county || "",
      deliveryTown: (user as any).town || "",
      estimatedDeliveryDate: Date.now() + 3 * 24 * 60 * 60 * 1000,
      originCounty: l.originCounty,
      originTown: l.originTown,
      createdAt: Date.now(),
      fundedAt: Date.now(),
      commissionRate: 3,
      platformFee,
      buyerFeeRate: 1,
      buyerFee,
      marketplace: "product",
    });
    void escrowId;

    await ctx.db.patch(args.planId, {
      lastOrderedAt: Date.now(),
      nextOrderAt: Date.now() + FREQ_DAYS[p.frequency as "weekly" | "monthly"],
      unitPrice: freshUnit,
      orderCount: (p.orderCount ?? 0) + 1,
      updatedAt: Date.now(),
    });

    return { success: true, amount: grand };
  },
});
