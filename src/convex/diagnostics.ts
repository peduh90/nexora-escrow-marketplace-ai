// TEMPORARY internal-only diagnostics (CLI-run via `bun convex run`).
// Internal functions are never exposed to the public HTTP API — only the
// authenticated CLI can call them. Delete this file after debugging.
import { internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const listingStats = internalQuery({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("listings").collect();
    const byStatus: Record<string, number> = {};
    const byMarketplace: Record<string, number> = {};
    for (const l of all as any[]) {
      byStatus[l.status] = (byStatus[l.status] || 0) + 1;
      const mp = l.marketplace ?? "product(legacy)";
      byMarketplace[mp] = (byMarketplace[mp] || 0) + 1;
    }
    const recent = (all as any[])
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, 15)
      .map((l) => ({
        id: l._id,
        title: l.title,
        status: l.status,
        marketplace: l.marketplace ?? "(legacy/product)",
        category: l.category,
        sellerId: l.sellerId,
        sellerName: l.sellerName,
        price: l.price,
        createdAt: new Date(l._creationTime).toISOString(),
      }));
    return { total: all.length, byStatus, byMarketplace, recent };
  },
});

export const sellerDebug = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    const rows = (await ctx.db.query("users").collect()).filter(
      (u: any) => typeof u.email === "string" && u.email.toLowerCase() === email
    ) as any[];
    const out = [];
    for (const u of rows) {
      const listings = (await ctx.db
        .query("listings")
        .withIndex("by_seller", (q: any) => q.eq("sellerId", u._id))
        .collect()) as any[];
      out.push({
        userId: u._id,
        name: u.name,
        role: u.role,
        pendingRole: u.pendingRole,
        accountStatus: u.accountStatus,
        businessName: u.businessName,
        isAnonymous: u.isAnonymous,
        verificationLevel: u.verificationLevel,
        createdAt: new Date(u._creationTime).toISOString(),
        listingCount: listings.length,
        listings: listings.map((l) => ({
          id: l._id,
          title: l.title,
          status: l.status,
          marketplace: l.marketplace ?? "(legacy/product)",
        })),
      });
    }  return { matches: out.length, users: out };
},
});

export const userCensus = internalQuery({
  args: {},
  handler: async (ctx) => {
    const all = (await ctx.db.query("users").collect()) as any[];
    const recent = all
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, 25)
      .map((u) => ({
        id: u._id,
        email: u.email ?? null,
        name: u.name ?? null,
        role: u.role ?? null,
        pendingRole: u.pendingRole ?? null,
        accountStatus: u.accountStatus ?? null,
        businessName: u.businessName ?? null,
        isAnonymous: !!u.isAnonymous,
        createdAt: new Date(u._creationTime).toISOString(),
      }));
    const georean = all.filter(
      (u) =>
        (typeof u.email === "string" && u.email.toLowerCase().includes("georean")) ||
        (typeof u.name === "string" && u.name.toLowerCase().includes("georean")) ||
        (typeof u.businessName === "string" && u.businessName.toLowerCase().includes("georean")) ||
        (typeof u.email === "string" && u.email.toLowerCase().includes("motors"))
    );
    return {
      totalUsers: all.length,
      georeanMatches: georean.map((u) => ({ id: u._id, email: u.email, name: u.name, role: u.role, accountStatus: u.accountStatus })),
      recent,
    };
  },
});
