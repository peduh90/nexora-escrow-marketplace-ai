import { v } from "convex/values";
import { query, mutation, internalQuery, internalMutation } from "./_generated/server";
import { ConvexError } from "convex/values";
import { internal } from "./_generated/api";
import { getSessionUser } from "./users";
import { ruleKeyFor, feeFromRule, AdminFeeRule, FeeBreakdown, rateLabel } from "./fees";

/** Require an authenticated admin — throws ConvexError otherwise. */
async function requireAdmin(ctx: any) {
  const admin = await getSessionUser(ctx);
  if (!admin || (admin as any).role !== "admin") {
    throw new ConvexError("Admin access required");
  }
  return admin;
}

/** Tier validator shared by create/update. */
const tierV = v.object({
  min: v.number(),
  max: v.optional(v.number()),
  rate: v.optional(v.number()),
  fixed: v.optional(v.number()),
});

// ─── Rules ────────────────────────────────────────────────────────────────

export const listRules = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("feeRules").collect();
  },
});

/** Immutable audit trail for one rule (or all rules when ruleKey omitted). */
export const listRulesHistory = query({
  args: { ruleKey: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (args.ruleKey) {
      return await ctx.db
        .query("feeRulesHistory")
        .withIndex("by_rule", (q: any) => q.eq("ruleKey", args.ruleKey))
        .collect();
    }
    return await ctx.db.query("feeRulesHistory").collect();
  },
});

// ─── Earnings ledger queries ──────────────────────────────────────────────

/** Totals: overall, by fee type, by marketplace, and last-30-days series. */
export const earningsSummary = query({
  args: { marketplace: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const all = await ctx.db.query("platformFeeEarnings").collect();
    const rows =
      args.marketplace && args.marketplace !== "all"
        ? all.filter((r: any) => r.marketplace === args.marketplace)
        : all;
    const sum = (list: any[]) => list.reduce((s: number, r: any) => s + (r.amount || 0), 0);
    const total = sum(rows);
    const commissions = sum(rows.filter((r: any) => r.feeType === "seller_commission"));
    const protections = sum(rows.filter((r: any) => r.feeType === "buyer_protection"));
    const byMarketplace = ["product", "freelance", "services", "transport"].map((m) => ({
      marketplace: m,
      total: sum(rows.filter((r: any) => r.marketplace === m)),
    }));
    const now = Date.now();
    const byDay: { date: string; total: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const dayStart = new Date(now - i * 86_400_000);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = dayStart.getTime() + 86_400_000;
      byDay.push({
        date: dayStart.toISOString().slice(0, 10),
        total: sum(rows.filter((r: any) => r.createdAt >= dayStart.getTime() && r.createdAt < dayEnd)),
      });
    }
    const last30 = byDay.reduce((s, d) => s + d.total, 0);
    return { total, commissions, protections, byMarketplace, byDay, last30, count: rows.length };
  },
});

/** Recent ledger entries (newest first) for the earnings table. */
export const listEarnings = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("platformFeeEarnings").withIndex("by_created").order("desc").collect();
    return typeof args.limit === "number" ? rows.slice(0, args.limit) : rows.slice(0, 200);
  },
});

// ─── OWNER EARNINGS PAYOUT (system fees → M-Pesa / bank) ─────────────────

/**
 * Payout overview for the owner: how much fee revenue has accumulated, how
 * much has already been paid out to M-Pesa/bank, and what is available now.
 */
export const payoutOverview = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const fees = await ctx.db.query("platformFeeEarnings").collect();
    const payouts = await ctx.db.query("ownerPayouts").collect();
    const sum = (list: any[]) => list.reduce((s: number, r: any) => s + (r.amount || 0), 0);

    const totalEarned = sum(fees);
    const completedPayouts = payouts.filter((p: any) => p.status === "completed");
    const paidOut = sum(completedPayouts);
    const processing = payouts.filter((p: any) => p.status === "processing");
    const processingAmount = sum(processing);
    const pending = payouts.filter((p: any) => p.status === "pending");
    const pendingAmount = sum(pending);
    const available = totalEarned - paidOut - processingAmount - pendingAmount;

    const last30 = fees.filter(
      (r: any) => r.createdAt >= Date.now() - 30 * 86_400_000,
    );

    return {
      totalEarned,
      paidOut,
      processingAmount,
      pendingAmount,
      available: Math.max(0, available),
      payoutCount: payouts.length,
      last30: sum(last30),
      recent: payouts
        .sort((a: any, b: any) => b.createdAt - a.createdAt)
        .slice(0, 25),
    };
  },
});

/** Preview what a rule WOULD charge for a test amount (no writes). */
export const previewFee = query({
  args: {
    marketplace: v.string(),
    feeType: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const key = ruleKeyFor(args.marketplace, args.feeType);
    const rule = (await ctx.db
      .query("feeRules")
      .withIndex("by_key", (q: any) => q.eq("key", key))
      .unique()) as AdminFeeRule | null;
    const fromRule: FeeBreakdown | null = feeFromRule(rule, args.amount);
    return {
      ruleKey: key,
      ruleActive: !!rule?.active,
      fromRule,
      rateLabel: fromRule ? rateLabel(fromRule.rate) : null,
    };
  },
});

// ─── Mutations ────────────────────────────────────────────────────────────

/** Validate tiers before persisting: every tier needs a rate or fixed value. */
function validateTiers(mode: string, tiers: any[]) {
  if (!Array.isArray(tiers) || tiers.length === 0) {
    throw new ConvexError("Add at least one tier");
  }
  let prevMax = 0;
  for (const t of tiers) {
    if (typeof t.min !== "number" || t.min < 0) throw new ConvexError("Each tier needs a minimum amount");
    if (t.min <= prevMax) throw new ConvexError("Tier minimums must increase in order");
    prevMax = t.min;
    if (mode === "percentage") {
      if (typeof t.rate !== "number" || t.rate <= 0 || t.rate > 1) {
        throw new ConvexError("Percentage tiers need a rate between 0 and 1 (e.g. 0.025 = 2.5%)");
      }
    } else {
      if (typeof t.fixed !== "number" || t.fixed < 0) {
        throw new ConvexError("Fixed tiers need a fixed KES amount");
      }
    }
    if (typeof t.max === "number" && t.max < t.min) {
      throw new ConvexError("Tier maximum must be greater than its minimum");
    }
  }
}

/**
 * Create or replace a fee rule. Every write appends an immutable history row
 * with the admin identity, timestamp and full snapshot — historical records
 * are never edited.
 */
export const upsertRule = mutation({
  args: {
    marketplace: v.string(),
    feeType: v.string(),
    label: v.string(),
    payer: v.union(v.literal("seller"), v.literal("buyer")),
    mode: v.union(v.literal("percentage"), v.literal("fixed")),
    tiers: v.array(tierV),
    minThreshold: v.optional(v.number()),
    maxCap: v.optional(v.number()),
    effectiveFrom: v.optional(v.number()),
    active: v.boolean(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    validateTiers(args.mode, args.tiers);
    if (!args.label.trim()) throw new ConvexError("Give the rule a label");

    const key = ruleKeyFor(args.marketplace, args.feeType);
    const now = Date.now();
    const existing = await ctx.db
      .query("feeRules")
      .withIndex("by_key", (q: any) => q.eq("key", key))
      .unique();

    const doc = {
      key,
      marketplace: args.marketplace,
      feeType: args.feeType,
      label: args.label.trim(),
      payer: args.payer,
      mode: args.mode,
      tiers: args.tiers,
      minThreshold: args.minThreshold,
      maxCap: args.maxCap,
      effectiveFrom: args.effectiveFrom ?? now,
      active: args.active,
      createdBy: String(admin._id ?? admin.userId ?? ""),
      createdByName: String((admin as any).name || (admin as any).email || "Admin"),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, doc);
    } else {
      await ctx.db.insert("feeRules", doc);
    }

    // Immutable audit row — the owner can always see who changed what, when.
    await ctx.db.insert("feeRulesHistory", {
      ruleKey: key,
      action: existing ? "updated" : "created",
      adminId: String(admin._id ?? admin.userId ?? ""),
      adminName: String((admin as any).name || (admin as any).email || "Admin"),
      snapshot: doc,
      note: args.note,
      at: now,
    });

    return { key, created: !existing };
  },
});

/** Toggle a rule active/inactive without touching its tiers. */
export const setRuleActive = mutation({
  args: { key: v.string(), active: v.boolean(), note: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const rule = await ctx.db
      .query("feeRules")
      .withIndex("by_key", (q: any) => q.eq("key", args.key))
      .unique();
    if (!rule) throw new ConvexError("Rule not found");
    const now = Date.now();
    await ctx.db.patch(rule._id, { active: args.active, updatedAt: now });
    await ctx.db.insert("feeRulesHistory", {
      ruleKey: args.key,
      action: args.active ? "activated" : "deactivated",
      adminId: String(admin._id ?? admin.userId ?? ""),
      adminName: String((admin as any).name || (admin as any).email || "Admin"),
      snapshot: { ...rule, active: args.active, updatedAt: now },
      note: args.note,
      at: now,
    });
    return { ok: true };
  },
});

/**
 * Seed the four canonical rules from the platform's documented tier schedule
 * so the control center starts fully populated (idempotent — skips existing).
 */
export const seedDefaultRules = mutation({
  args: {},
  handler: async (ctx) => {
    const admin = await requireAdmin(ctx);
    const defaults = [
      {
        marketplace: "product",
        feeType: "seller_commission",
        label: "Marketplace seller commission",
        payer: "seller" as const,
        tiers: [
          { min: 1, max: 4999, rate: 0.03 },
          { min: 5000, max: 49999, rate: 0.025 },
          { min: 50000, max: 199999, rate: 0.02 },
          { min: 200000, rate: 0.015 },
        ],
      },
      {
        marketplace: "product",
        feeType: "buyer_protection",
        label: "Marketplace buyer protection fee",
        payer: "buyer" as const,
        tiers: [
          { min: 1, max: 10000, rate: 0.01 },
          { min: 10001, max: 50000, rate: 0.0075 },
          { min: 50001, max: 200000, rate: 0.005 },
          { min: 200001, rate: 0.0025 },
        ],
      },
      {
        marketplace: "freelance",
        feeType: "seller_commission",
        label: "Freelancer commission",
        payer: "seller" as const,
        tiers: [
          { min: 1, max: 5000, rate: 0.03 },
          { min: 5001, max: 50000, rate: 0.02 },
          { min: 50001, max: 250000, rate: 0.015 },
          { min: 250001, rate: 0.01 },
        ],
      },
      {
        marketplace: "freelance",
        feeType: "buyer_protection",
        label: "Employer protection fee",
        payer: "buyer" as const,
        tiers: [
          { min: 1, max: 10000, rate: 0.01 },
          { min: 10001, max: 50000, rate: 0.0075 },
          { min: 50001, max: 200000, rate: 0.005 },
          { min: 200001, rate: 0.0025 },
        ],
      },
    ];
    const created: string[] = [];
    for (const d of defaults) {
      const key = ruleKeyFor(d.marketplace, d.feeType);
      const existing = await ctx.db
        .query("feeRules")
        .withIndex("by_key", (q: any) => q.eq("key", key))
        .unique();
      if (existing) continue;
      const now = Date.now();
      const doc = {
        key,
        marketplace: d.marketplace,
        feeType: d.feeType,
        label: d.label,
        payer: d.payer,
        mode: "percentage" as const,
        tiers: d.tiers,
        effectiveFrom: now,
        active: true,
        createdBy: String(admin._id ?? admin.userId ?? ""),
        createdByName: String((admin as any).name || (admin as any).email || "Admin"),
        createdAt: now,
      };
      await ctx.db.insert("feeRules", doc);
      await ctx.db.insert("feeRulesHistory", {
        ruleKey: key,
        action: "created",
        adminId: String(admin._id ?? admin.userId ?? ""),
        adminName: String((admin as any).name || (admin as any).email || "Admin"),
        snapshot: doc,
        note: "Seeded from the platform's documented tier schedule",
        at: now,
      });
      created.push(key);
    }
    return { created };
  },
});

// ─── OWNER PAYOUT MUTATIONS (system earnings → M-Pesa / bank) ─────────────

/**
 * Create a payout request against accumulated platform fee earnings.
 * The amount can never exceed what is actually available (fees collected
 * minus everything already paid out or in flight). Real ledger math — no
 * virtual balance.
 */
export const createOwnerPayout = mutation({
  args: {
    amount: v.number(),
    method: v.union(v.literal("mpesa"), v.literal("bank")),
    destination: v.string(), // M-Pesa phone (2547XXXXXXXX) or bank account label
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    if (args.amount <= 0) throw new ConvexError("Amount must be greater than zero");
    if (!args.destination.trim()) throw new ConvexError("Enter the M-Pesa number or bank account to pay to");

    if (args.method === "mpesa") {
      const digits = args.destination.replace(/[^0-9]/g, "");
      const normalized = digits.startsWith("0")
        ? "254" + digits.slice(1)
        : digits.startsWith("254")
          ? digits
          : "254" + digits;
      if (!/^254[0-9]{9}$/.test(normalized)) {
        throw new ConvexError("Enter a valid M-Pesa number (e.g. 0712 345 678)");
      }
      args.destination = normalized;
    }

    // Real available balance: fees earned − payouts completed/processing/pending.
    const fees = await ctx.db.query("platformFeeEarnings").collect();
    const payouts = await ctx.db.query("ownerPayouts").collect();
    const sum = (list: any[]) => list.reduce((s: number, r: any) => s + (r.amount || 0), 0);
    const reserved = sum(payouts.filter((p: any) => p.status !== "failed" && p.status !== "rejected"));
    const available = sum(fees) - reserved;
    if (args.amount > available) {
      throw new ConvexError(
        `Only KES ${Math.max(0, available).toLocaleString()} is available. Fees already reserved by other payouts: KES ${reserved.toLocaleString()}.`,
      );
    }

    const now = Date.now();
    const id = await ctx.db.insert("ownerPayouts", {
      amount: args.amount,
      method: args.method,
      destination: args.destination.trim(),
      status: "pending",
      note: args.note,
      createdBy: String(admin._id ?? admin.userId ?? ""),
      createdByName: String((admin as any).name || (admin as any).email || "Admin"),
      createdAt: now,
    });
    return { payoutId: id, amount: args.amount, method: args.method };
  },
});

/**
 * Owner confirms the money actually left — the M-Pesa/B2C was sent or the
 * bank transfer executed. Records the provider reference (e.g. the M-Pesa
 * receipt or bank transaction code) for reconciliation.
 */
export const completeOwnerPayout = mutation({
  args: {
    payoutId: v.id("ownerPayouts"),
    providerReference: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const payout = await ctx.db.get(args.payoutId);
    if (!payout) throw new ConvexError("Payout not found");
    if ((payout as any).status === "completed") return { alreadyCompleted: true };
    if (!args.providerReference.trim()) {
      throw new ConvexError("Enter the M-Pesa receipt / bank transaction reference");
    }

    await ctx.db.patch(args.payoutId, {
      status: "completed",
      providerReference: args.providerReference.trim(),
      completedBy: String(admin._id ?? admin.userId ?? ""),
      completedAt: Date.now(),
    });
    return { success: true };
  },
});

/** Cancel a payout that was never sent (frees the reserved amount). */
export const cancelOwnerPayout = mutation({
  args: {
    payoutId: v.id("ownerPayouts"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const payout = await ctx.db.get(args.payoutId);
    if (!payout) throw new ConvexError("Payout not found");
    if ((payout as any).status === "completed") {
      throw new ConvexError("This payout already completed — record a reversal with the admin instead");
    }
    await ctx.db.patch(args.payoutId, {
      status: "rejected",
      failReason: args.reason.trim() || "Cancelled by admin",
    });
    return { success: true };
  },
});

// ─── B2C AUTO-DISBURSEMENT (server-to-server M-Pesa payout) ───────────────
// These are internal: only the B2C action and the Safaricom result callback
// touch them, so no client can fabricate a completed payout.

/** Fetch a payout by id (internal, for the B2C action). */
export const getOwnerPayoutInternal = internalQuery({
  args: { payoutId: v.id("ownerPayouts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.payoutId);
  },
});

/** Mark a payout as processing with its Daraja conversation id. */
export const markPayoutProcessing = internalMutation({
  args: {
    payoutId: v.id("ownerPayouts"),
    conversationId: v.string(),
    originatorConversationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const payout = await ctx.db.get(args.payoutId);
    if (!payout) throw new ConvexError("Payout not found");
    if ((payout as any).status === "completed") return { alreadyCompleted: true };
    await ctx.db.patch(args.payoutId, {
      status: "processing",
      conversationId: args.conversationId,
      originatorConversationId: args.originatorConversationId,
      sentViaB2C: true,
      failReason: undefined,
    });
    return { ok: true };
  },
});

/**
 * Complete a payout from the Safaricom B2C result callback. Resolved by
 * ConversationID; requires ResultCode 0 (real money moved) and records the
 * actual M-Pesa TransactionID as the provider reference.
 */
export const completePayoutFromB2C = internalMutation({
  args: {
    conversationId: v.string(),
    resultCode: v.number(),
    resultDesc: v.optional(v.string()),
    transactionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const payout = await ctx.db
      .query("ownerPayouts")
      .withIndex("by_conversation", (q: any) => q.eq("conversationId", args.conversationId))
      .first();
    if (!payout) {
      console.error("[b2c] result for unknown conversationId:", args.conversationId);
      return { found: false };
    }
    if (payout.status === "completed") return { found: true, alreadyCompleted: true };

    if (args.resultCode === 0) {
      await ctx.db.patch(payout._id, {
        status: "completed",
        providerReference: args.transactionId || payout.providerReference || "B2C-CONFIRMED",
        resultDesc: args.resultDesc,
        completedAt: Date.now(),
      });
      return { found: true, completed: true };
    }

    // Hard failure from Safaricom → release the reserved amount.
    await ctx.db.patch(payout._id, {
      status: "failed",
      resultDesc: args.resultDesc,
      failReason: args.resultDesc || `M-Pesa B2C failed (code ${args.resultCode})`,
    });
    return { found: true, failed: true };
  },
});
