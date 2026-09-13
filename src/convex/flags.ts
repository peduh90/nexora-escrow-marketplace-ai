import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

// ─── Feature flag / configuration engine (#166–#168) ────────────────────────
//
// Every major feature ships dark behind a flag and is enabled per environment
// (development → pilot county → full production) without code deploys. Admin
// mutations are audit-logged; the public surface only exposes safe fields —
// never internal thresholds or policy values.

export type FlagKey =
  | "low_data_mode"
  | "voice_search"
  | "cod"
  | "wholesale"
  | "business_procurement"
  | "rentals"
  | "multi_currency"
  | "eac_crossborder"
  | "group_buying"
  | "diaspora_buying"
  | "agent_network"
  | "market_day_mode"
  | "community_requests"
  | "recurring_orders"
  | "pickup_hubs"
  | "local_deals";

export const FLAG_DEFAULTS: Array<{
  key: FlagKey;
  label: string;
  description: string;
  enabled: boolean;
  rollout: "development" | "pilot" | "production";
}> = [
  { key: "low_data_mode", label: "Low-data mode", description: "Compressed, text-first experience for slow connections and low-end phones.", enabled: true, rollout: "production" },
  { key: "voice_search", label: "Voice search", description: "Speak your search or request instead of typing.", enabled: false, rollout: "pilot" },
  { key: "cod", label: "Cash on delivery (controlled)", description: "Pay-on-delivery for eligible buyers with reliability controls.", enabled: false, rollout: "pilot" },
  { key: "wholesale", label: "Wholesale marketplace", description: "Bulk pricing, MOQs and quotes for retailers and institutions.", enabled: false, rollout: "pilot" },
  { key: "business_procurement", label: "Nexora Business procurement", description: "Businesses post procurement needs; verified suppliers respond.", enabled: false, rollout: "pilot" },
  { key: "rentals", label: "Rental marketplace", description: "Rent tools, equipment, tents, sound, vehicles with deposit-held flows.", enabled: false, rollout: "pilot" },
  { key: "multi_currency", label: "Multi-currency display", description: "Show prices in UGX/TZS/RWF/USD alongside KES where configured.", enabled: false, rollout: "pilot" },
  { key: "eac_crossborder", label: "EAC cross-border", description: "Kenya↔Uganda/Tanzania/Rwanda commerce with duties-shown-later pricing.", enabled: false, rollout: "development" },
  { key: "group_buying", label: "Community group buying", description: "Neighbours combine demand to unlock bulk pricing.", enabled: false, rollout: "development" },
  { key: "diaspora_buying", label: "Diaspora buying", description: "Pay abroad, deliver in Kenya — recipient-based transactions.", enabled: false, rollout: "development" },
  { key: "agent_network", label: "Agent network", description: "Trusted physical agents help communities join, list and order.", enabled: false, rollout: "development" },
  { key: "market_day_mode", label: "Market-day mode", description: "Traders mark \"Selling at this market today\" for town market days.", enabled: false, rollout: "pilot" },
  // Phase 2 (sticky) — shipped, still kill-switchable without a deploy.
  { key: "community_requests", label: "Community requests", description: "Post what you need; sellers and providers respond with offers.", enabled: true, rollout: "production" },
  { key: "recurring_orders", label: "Repeat orders", description: "Weekly/monthly repeat purchases with one-tap escrow reorder.", enabled: true, rollout: "production" },
  { key: "pickup_hubs", label: "Pickup hubs", description: "Collect orders at Nexora pickup points instead of door delivery.", enabled: true, rollout: "production" },
  { key: "local_deals", label: "Local deals feed", description: "Honest discount feed from sellers' real was-prices.", enabled: true, rollout: "production" },
];

/** Seed defaults on first read — idempotent, no destructive updates. */
export const ensureFlags = mutation({
  args: {},
  handler: async (ctx) => {
    for (const def of FLAG_DEFAULTS) {
      const existing = await ctx.db
        .query("featureFlags")
        .withIndex("by_key", (q) => q.eq("key", def.key))
        .first();
      if (!existing) {
        await ctx.db.insert("featureFlags", {
          key: def.key,
          label: def.label,
          description: def.description,
          enabled: def.enabled,
          rollout: def.rollout,
          updatedAt: Date.now(),
        });
      }
    }
    return { seeded: FLAG_DEFAULTS.length };
  },
});

/**
 * Public flags read: returns safe fields only. The client must never learn
 * internal thresholds — those stay in server-only settings tables.
 */
export const getFlags = query({
  args: {},
  handler: async (ctx) => {
    let rows = await ctx.db.query("featureFlags").collect();
    if (rows.length === 0) {
      // First-ever read: serve defaults while ensureFlags seeds.
      return FLAG_DEFAULTS.map((d) => ({ ...d, updatedAt: 0 }));
    }
    rows = rows.sort((a, b) => a.key.localeCompare(b.key));
    return rows.map((f) => ({
      key: f.key,
      label: f.label,
      description: f.description,
      enabled: f.enabled,
      rollout: f.rollout ?? "development",
      updatedAt: f.updatedAt,
    }));
  },
});

const ADMIN_EMAIL = "murimiedwin227@gmail.com";

async function requireAdmin(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.email) throw new Error("Not authenticated");
  const user = await ctx.db
    .query("users")
    .withIndex("email", (q: any) => q.eq("email", identity.email))
    .first();
  if (!user || ((user as any).role !== "admin" && identity.email !== ADMIN_EMAIL)) {
    throw new Error("Admin access required");
  }
  return user;
}

/** Toggle one flag (admin only, audit-logged). */
export const setFlag = mutation({
  args: {
    key: v.string(),
    enabled: v.boolean(),
    rollout: v.optional(v.union(v.literal("development"), v.literal("pilot"), v.literal("production"))),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const row = await ctx.db
      .query("featureFlags")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    if (!row) throw new Error("Unknown flag");

    await ctx.db.patch(row._id, {
      enabled: args.enabled,
      rollout: args.rollout ?? (row as any).rollout,
      updatedBy: (admin as any).email,
      updatedAt: Date.now(),
    });

    // Audit trail (#121) — every sensitive admin action is logged.
    await ctx.db.insert("auditLogs", {
      adminId: String((admin as any)._id),
      adminName: (admin as any).name || "Admin",
      adminRole: "admin",
      action: args.enabled ? "flag_enabled" : "flag_disabled",
      target: `featureFlag:${args.key}`,
      details: `Rollout: ${args.rollout ?? (row as any).rollout ?? "development"}`,
      createdAt: Date.now(),
    });
    return { success: true };
  },
});

/** Call once (admin action or CLI) to create any missing defaults. */
export const seedFlags = mutation({
  args: {},
  handler: async (ctx) => {
    const admin = await requireAdmin(ctx);
    for (const def of FLAG_DEFAULTS) {
      const existing = await ctx.db
        .query("featureFlags")
        .withIndex("by_key", (q) => q.eq("key", def.key))
        .first();
      if (!existing) {
        await ctx.db.insert("featureFlags", { ...def, updatedAt: Date.now(), updatedBy: (admin as any).email });
      }
    }
    return { success: true };
  },
});
