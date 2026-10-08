import { v } from "convex/values";
import { internalQuery } from "./_generated/server";

/**
 * Diagnostic: trace every listing belonging to a seller (by account email) or
 * matching a store name, across ALL statuses and marketplaces. Internal-only —
 * used from the CLI (`convex run sellerTrace:traceSeller …`) to audit where a
 * seller's products are actually channelled (product vs freelance/digital).
 */
export const traceSeller = internalQuery({
  args: {
    email: v.optional(v.string()),
    storeName: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let user: any = null;
    if (args.email) {
      user = await ctx.db
        .query("users")
        .withIndex("email", (q: any) => q.eq("email", args.email!.trim().toLowerCase()))
        .first();
    }

    const summary = (l: any) => ({
      _id: l._id,
      title: l.title,
      marketplace: l.marketplace,
      category: l.category,
      subcategory: l.subcategory,
      status: l.status,
      price: l.price,
      sellerName: l.sellerName,
      sellerId: l.sellerId,
      createdAt: l.createdAt ?? l._creationTime,
    });

    const byAccount = user
      ? await ctx.db
          .query("listings")
          .withIndex("by_seller", (q: any) => q.eq("sellerId", user._id))
          .collect()
      : [];

    let byName: any[] = [];
    if (args.storeName) {
      const all = await ctx.db.query("listings").collect();
      const needle = args.storeName.toLowerCase();
      byName = all.filter(
        (l: any) =>
          (l.sellerName || "").toLowerCase().includes(needle) ||
          (l.title || "").toLowerCase().includes(needle),
      );
    }

    // Fuzzy account hunt: store name / person name / phone anywhere in users.
    const allUsers = await ctx.db.query("users").collect();
    const needle = (args.storeName || "").toLowerCase();
    const digits = (args.phone || "").replace(/\D/g, "");
    const accountMatches = allUsers
      .filter((u: any) => {
        const byStore =
          needle &&
          [u.businessName, u.name, u.storeName]
            .filter(Boolean)
            .some((s: string) => s.toLowerCase().includes(needle));
        const byPhone =
          digits.length >= 6 &&
          String(u.phone || "").replace(/\D/g, "").includes(digits.slice(-9));
        const byEmail =
          !!args.email &&
          (u.email || "").toLowerCase() === args.email.trim().toLowerCase();
        return byStore || byPhone || byEmail;
      })
      .map((u: any) => ({
        _id: u._id,
        email: u.email,
        name: u.name,
        businessName: u.businessName,
        role: u.role,
        phone: u.phone,
        county: u.county,
        town: u.town,
        kycStatus: u.kycStatus,
      }));

    const matchedIds = new Set(accountMatches.map((u: any) => u._id));
    const everyone =
      !args.email && !args.storeName && !args.phone
        ? allUsers.map((u: any) => ({
            _id: u._id,
            email: u.email,
            name: u.name,
            businessName: u.businessName,
            role: u.role,
            phone: u.phone,
            county: u.county,
            town: u.town,
          }))
        : undefined;
    const listingsOfMatches = (await ctx.db.query("listings").collect()).filter((l: any) =>
      matchedIds.has(l.sellerId),
    );

    return {
      user: user
        ? {
            _id: user._id,
            email: user.email,
            name: user.name,
            businessName: user.businessName,
            role: user.role,
            phone: user.phone,
            county: user.county,
            town: user.town,
            kycStatus: user.kycStatus,
          }
        : null,
      listingsByAccount: byAccount.map(summary),
      listingsByName: byName.map(summary),
      accountMatches,
      everyone,
      listingsOfMatches: listingsOfMatches.map(summary),
      totalUsers: allUsers.length,
      totalListings: (await ctx.db.query("listings").collect()).length,
    };
  },
});
