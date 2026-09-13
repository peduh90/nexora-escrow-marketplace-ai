import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─── Kenya-first delivery addresses (#72/#73) ────────────────────────────────
//
// Structured landmark addressing: Kenya's formal addressing system is still
// maturing, so Nexora treats "area + landmark + direction + building + pin"
// as first-class, structured data — not a free-text workaround. Saved
// addresses are private personal data: every query/mutation is bound to the
// authenticated session, and no other user (sellers, riders, admins included)
// can read them. Sellers only ever receive the composed delivery string on an
// order — never the user's whole address book.

const MAX_ADDRESSES = 20;

async function requireUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.email) throw new Error("Not authenticated");
  const user = await ctx.db
    .query("users")
    .withIndex("email", (q: any) => q.eq("email", identity.email))
    .first();
  if (!user) throw new Error("Account profile not found");
  return user;
}

/** Compose a delivery string from structured landmark fields (shared shape). */
function composeAddressLine(a: {
  county: string;
  town: string;
  area?: string;
  landmark?: string;
  direction?: string;
  building?: string;
  floorUnit?: string;
  instructions?: string;
}): string {
  const parts = [
    a.area,
    a.building,
    a.floorUnit,
    a.landmark ? (a.direction ? `${a.direction} ${a.landmark}` : a.landmark) : undefined,
    a.town,
    a.county,
  ].filter((p): p is string => !!p && p.trim().length > 0);
  return parts.join(", ");
}

/** All saved addresses for the signed-in user (private). */
export const listAddresses = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const rows = await ctx.db
      .query("savedAddresses")
      .withIndex("by_user" as any, (q: any) => q.eq("userId", user._id))
      .collect();
    // Default first, then most recently used/created.
    return rows.sort((a: any, b: any) => {
      if (!!b.isDefault !== !!a.isDefault) return b.isDefault ? 1 : -1;
      return (b.lastUsedAt ?? b.createdAt) - (a.lastUsedAt ?? a.createdAt);
    });
  },
});

/** Save (create or update) one named address. */
export const saveAddress = mutation({
  args: {
    addressId: v.optional(v.id("savedAddresses")),
    label: v.string(),
    county: v.string(),
    town: v.string(),
    area: v.optional(v.string()),
    landmark: v.optional(v.string()),
    landmarkType: v.optional(v.string()),
    direction: v.optional(v.string()),
    building: v.optional(v.string()),
    floorUnit: v.optional(v.string()),
    instructions: v.optional(v.string()),
    pin: v.optional(v.string()),
    recipientName: v.optional(v.string()),
    recipientPhone: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const label = args.label.trim() || "Other";
    const county = args.county.trim();
    const town = args.town.trim();
    if (!county || !town) throw new Error("County and town are required");

    const now = Date.now();
    const existing = args.addressId
      ? await ctx.db.get(args.addressId)
      : undefined;
    if (existing && (existing as any).userId !== user._id) {
      throw new Error("Not authorized");
    }

    // Enforce a sane cap so address books stay light on low-data devices.
    const mine = await ctx.db
      .query("savedAddresses")
      .withIndex("by_user" as any, (q: any) => q.eq("userId", user._id))
      .collect();
    if (!existing && mine.length >= MAX_ADDRESSES) {
      throw new Error(`You can save up to ${MAX_ADDRESSES} addresses`);
    }

    // Only one default at a time.
    if (args.isDefault) {
      for (const row of mine) {
        if ((row as any).isDefault && (row as any)._id !== (existing as any)?._id) {
          await ctx.db.patch((row as any)._id, { isDefault: false });
        }
      }
    }

    const payload: Record<string, any> = {
      userId: user._id,
      label,
      county,
      town,
      area: args.area?.trim() || undefined,
      landmark: args.landmark?.trim() || undefined,
      landmarkType: args.landmarkType?.trim() || undefined,
      direction: args.direction?.trim() || undefined,
      building: args.building?.trim() || undefined,
      floorUnit: args.floorUnit?.trim() || undefined,
      instructions: args.instructions?.trim() || undefined,
      pin: args.pin?.trim() || undefined,
      recipientName: args.recipientName?.trim() || undefined,
      recipientPhone: args.recipientPhone?.trim() || undefined,
      isDefault: args.isDefault ?? existing?.isDefault ?? mine.length === 0,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch((existing as any)._id, payload);
      return { addressId: (existing as any)._id, line: composeAddressLine(payload as any) };
    }
    const id = await ctx.db.insert("savedAddresses", { ...payload, createdAt: now } as any);
    return { addressId: id, line: composeAddressLine(payload as any) };
  },
});

/** Delete one of my addresses. */
export const deleteAddress = mutation({
  args: { addressId: v.id("savedAddresses") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const row = await ctx.db.get(args.addressId);
    if (!row || (row as any).userId !== user._id) throw new Error("Not authorized");
    await ctx.db.delete(args.addressId);
    return { success: true };
  },
});

/**
 * Record a successful delivery to this address (#73): after the buyer
 * confirms receipt, mark the address "verifiedDelivery" so the user can trust
 * reusing it. Best-effort — never blocks confirmation.
 */
export const markAddressUsed = mutation({
  args: { addressId: v.id("savedAddresses") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const row = await ctx.db.get(args.addressId);
    if (!row || (row as any).userId !== user._id) return { ok: false };
    await ctx.db.patch(args.addressId, {
      verifiedDelivery: true,
      useCount: ((row as any).useCount ?? 0) + 1,
      lastUsedAt: Date.now(),
    });
    return { ok: true };
  },
});
