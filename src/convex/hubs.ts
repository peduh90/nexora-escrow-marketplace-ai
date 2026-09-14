import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─── Phase 2: Local Pickup Hubs (#71) ───────────────────────────────────────
// Seller → Nexora pickup point → buyer collects. Kenya's National E-Commerce
// Strategy identifies pickup/alternative addressing as a last-mile fix, and
// hubs dramatically cut delivery cost for orders that don't need door drop.
// Hubs are admin-managed; buyers see the collection fee at checkout before
// committing — no surprises.

const ADMIN_EMAIL = "murimiedwin227@gmail.com";

async function requireAdmin(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.email) throw new Error("Not authenticated");
  const { getSessionUser } = await import("./users");
  const user: any = await getSessionUser(ctx);
  const role = user?.role ?? (identity.email === ADMIN_EMAIL ? "admin" : null);
  if (role !== "admin") throw new Error("Admin access required");
  return user;
}

/** Public: active hubs, grouped client-side by county. */
export const listActiveHubs = query({
  args: { county: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let rows = await ctx.db
      .query("pickupHubs")
      .withIndex("by_active" as any, (q: any) => q.eq("active", true))
      .collect();
    if (args.county) {
      rows = rows.filter((h: any) => (h.county || "").toLowerCase() === args.county!.toLowerCase());
    }
    return rows.sort((a: any, b: any) =>
      (a.county || "").localeCompare(b.county || "") || (a.town || "").localeCompare(b.town || ""),
    );
  },
});

/** Admin: every hub, including inactive. */
export const adminListHubs = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("pickupHubs").collect();
    return rows.sort((a: any, b: any) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  },
});

/** Admin: create a hub. */
export const adminCreateHub = mutation({
  args: {
    name: v.string(),
    county: v.string(),
    town: v.string(),
    landmark: v.optional(v.string()),
    directions: v.optional(v.string()),
    phone: v.optional(v.string()),
    hours: v.optional(v.string()),
    fee: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const name = args.name.trim();
    const county = args.county.trim();
    const town = args.town.trim();
    if (!name || !county || !town) throw new Error("Name, county and town are required");
    const now = Date.now();
    const id = await ctx.db.insert("pickupHubs", {
      name,
      county,
      town,
      landmark: args.landmark?.trim() || undefined,
      directions: args.directions?.trim() || undefined,
      phone: args.phone?.trim() || undefined,
      hours: args.hours?.trim() || undefined,
      fee: args.fee && args.fee >= 0 ? Math.round(args.fee) : 0,
      active: true,
      createdAt: now,
    });
    await ctx.db.insert("auditLogs", {
      adminId: String((admin as any)._id),
      adminName: (admin as any).name || "Admin",
      adminRole: "admin",
      action: "hub_created",
      target: `pickupHub:${id}`,
      details: `${name} — ${town}, ${county}`,
      createdAt: now,
    });
    return { hubId: id };
  },
});

/** Admin: edit a hub. */
export const adminUpdateHub = mutation({
  args: {
    hubId: v.id("pickupHubs"),
    name: v.string(),
    county: v.string(),
    town: v.string(),
    landmark: v.optional(v.string()),
    directions: v.optional(v.string()),
    phone: v.optional(v.string()),
    hours: v.optional(v.string()),
    fee: v.optional(v.number()),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const hub = await ctx.db.get(args.hubId);
    if (!hub) throw new Error("Hub not found");
    await ctx.db.patch(args.hubId, {
      name: args.name.trim(),
      county: args.county.trim(),
      town: args.town.trim(),
      landmark: args.landmark?.trim() || undefined,
      directions: args.directions?.trim() || undefined,
      phone: args.phone?.trim() || undefined,
      hours: args.hours?.trim() || undefined,
      fee: args.fee && args.fee >= 0 ? Math.round(args.fee) : 0,
      active: args.active,
      updatedAt: Date.now(),
    });
    await ctx.db.insert("auditLogs", {
      adminId: String((admin as any)._id),
      adminName: (admin as any).name || "Admin",
      adminRole: "admin",
      action: "hub_updated",
      target: `pickupHub:${args.hubId}`,
      details: args.active ? `Updated: ${args.name}` : `Deactivated: ${args.name}`,
      createdAt: Date.now(),
    });
    return { success: true };
  },
});
