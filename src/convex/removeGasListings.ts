import { v } from "convex/values";
import { mutation } from "./_generated/server";

/** Remove the 3 unwanted cooking gas listings:
 * - 3kg Portable Cooking Gas Cylinder
 * - 12kg Cooking Gas Cylinder - Full
 * - Gas Cylinder Exchange - Bring Your Empty
 */
export const removeGasListings = mutation({
  args: {},
  handler: async (ctx) => {
    // Find by title to be safe
    const allActive = await ctx.db
      .query("listings")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    const unwantedTitles = [
      "3kg Portable Cooking Gas Cylinder",
      "12kg Cooking Gas Cylinder - Full",
      "Gas Cylinder Exchange - Bring Your Empty",
    ];

    let removed = 0;
    for (const listing of allActive) {
      if (unwantedTitles.includes(listing.title)) {
        await ctx.db.patch(listing._id, { status: "removed" });
        removed++;
      }
    }

    return { removed, titles: unwantedTitles };
  },
});
