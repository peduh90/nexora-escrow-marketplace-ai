import { v } from "convex/values";
import { mutation } from "./_generated/server";

/** Update cooking gas listings with correct prices and attributes from CylinTech */
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
      const isRefill = listing.title.includes("Refill");
      const newPrice = isRefill ? 1200 : 2500;

      const newAttrs: Record<string, string> = {
        ...existingAttrs,
        SellerPhone: "0796342951",
        SellerAltPhone: "0701976130",
        BusinessName: isRefill ? "Smart Fill Gas Point" : "Stanish Gas Suppliers",
        WhatsApp: "Gas! Gas! Gas! - Smart Fill Gas Point - FREE DELIVERY - WhatsApp/Call/ReverseCall: 0796342951 / 0701976130",
      };

      if (isRefill) {
        newAttrs.Type = "Gas Refill";
        newAttrs.CylinderSize = "6kg";
        newAttrs.Brand = "Total Gas, Afrigas, Jamii Gas, Cashug, Handi Gas";
        newAttrs.Delivery = "Same-day Nairobi and surrounds - 20 min express";
        newAttrs.Safety = "EPRA certified fill";
        newAttrs.Payment = "M-Pesa or Card";
        await ctx.db.patch(listing._id, {
          price: newPrice,
          originTown: "Kayole",
          attributes: newAttrs as any,
        });
      } else {
        newAttrs.Type = "New Cylinder + Gas";
        newAttrs.Capacity = "6kg";
        newAttrs.BrandsAvailable = "Total Gas, Afrigas, Jamii Gas, Cashug, Handi Gas";
        newAttrs.Condition = "Brand New with valve + safety seal";
        newAttrs.Includes = "Valve + Safety Seal + 6kg Gas";
        newAttrs.Delivery = "Nairobi doorstep delivery";
        newAttrs.Payment = "M-Pesa or Card";
        await ctx.db.patch(listing._id, {
          price: newPrice,
          originTown: "Kayole",
          attributes: newAttrs as any,
        });
      }
      updated++;
    }

    return { updated, total: gasListings.length };
  },
});
