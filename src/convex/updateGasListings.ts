import { v } from "convex/values";
import { mutation } from "./_generated/server";

/** Update existing cooking gas listings with seller phone numbers and business info */
export const updateGasListings = mutation({
  args: {},
  handler: async (ctx) => {
    const allActive = await ctx.db
      .query("listings")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    const gasListings = allActive.filter(
      (l: any) => l.subcategory === "cooking-gas" && l.category === "home-living"
    );

    let updated = 0;
    for (const listing of gasListings) {
      const existingAttrs = listing.attributes || {};
      const alreadyHasPhone = existingAttrs.SellerPhone;
      if (alreadyHasPhone) continue;

      const isStanish = listing.sellerName?.includes("Stanish");
      const newAttrs: Record<string, string> = {
        ...existingAttrs,
        SellerPhone: "0796342951",
        SellerAltPhone: "0701976130",
        BusinessName: isStanish ? "Stanish Gas Suppliers" : "Smart Fill Gas Point",
        WhatsApp: "Gas! Gas! Gas! - Smart Fill Gas Point - FREE DELIVERY - WhatsApp/Call/ReverseCall: 0796342951 / 0701976130",
      };

      await ctx.db.patch(listing._id, {
        attributes: newAttrs as any,
      });
      updated++;
    }

    return { updated, total: gasListings.length };
  },
});
