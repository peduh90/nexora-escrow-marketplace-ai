import { v } from "convex/values";
import { mutation } from "./_generated/server";

/** Seed sample marketplace listings for home & living - cooking gas.
 * Run once to populate the database with initial product listings.
 */
export const seedListings = mutation({
  args: {},
  handler: async (ctx) => {
    // Check how many listings exist (skip duplicates by title)
    const existing = await ctx.db.query("listings").collect();
    const existingTitles = new Set((existing as any[]).map((l: any) => l.title));

    // Seller accounts used for seeding (emails that should exist after signup)
    const sellers = [
      {
        id: "s24",
        email: "smartfill@example.com",
        name: "Smart Fill Gas Point",
        reputation: 4.9,
        verified: true,
      },
      {
        id: "s25",
        email: "stanish@example.com",
        name: "Stanish Gas Suppliers",
        reputation: 4.8,
        verified: true,
      },
    ];

    const listings = [
      // ===== COOKING GAS - REFILL (KES 1,200) - Real prices from CylinTech =====
      {
        title: "6kg Gas Cylinder Refill - Delivery to Doorstep",
        description: "Complete 6kg cooking gas refill delivered to your doorstep anywhere in Nairobi and surrounding areas. EPRA-certified fill, safe and fast same-day delivery. Compare prices from verified vendors. Pay via M-Pesa.",
        price: 1200,
        currency: "KES",
        category: "home-living",
        subcategory: "cooking-gas",
        images: [
          "https://images.unsplash.com/photo-1563986768609-3b560d672299?w=600&h=400&fit=crop",
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop",
          "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&h=400&fit=crop",
        ],
        transportAvailable: true,
        originCounty: "Nairobi",
        originTown: "Kayole",
        escrowProtection: true,
        condition: "Brand New",
        verified: true,
        sellerName: "Smart Fill Gas Point",
        sellerReputation: 4.9,
        sellerVerified: true,
        negotiable: false,
        attributes: {
          "Type": "Gas Refill",
          "CylinderSize": "6kg",
          "Brand": "Any Cylinder - Total Gas, Afrigas, Jamii, Cashug",
          "Delivery": "Same-day Nairobi and surrounds - 20 min express",
          "Safety": "EPRA certified fill",
          "Payment": "M-Pesa or Card",
          "SellerPhone": "0796342951",
          "SellerAltPhone": "0701976130",
          "BusinessName": "Smart Fill Gas Point",
          "WhatsApp": "Gas! Gas! Gas! - Smart Fill Gas Point - FREE DELIVERY - WhatsApp/Call/ReverseCall: 0796342951 / 0701976130",
        },
        views: 1247,
        favorites: 203,
      },
      // ===== COOKING GAS - 6KG FULL CYLINDER (KES 2,500) - Real prices from CylinTech =====
      {
        title: "6kg Cooking Gas Cylinder - New Full Cylinder with Valve",
        description: "Brand new 6kg full cooking gas cylinder. Ready for immediate use. Includes proper valve, safety seal, and weight certificate. Choose from Total Gas, Afrigas, Jamii Gas, Cashug, and Handi Gas brands. Delivery available within Nairobi.",
        price: 2500,
        currency: "KES",
        category: "home-living",
        subcategory: "cooking-gas",
        images: [
          "https://images.unsplash.com/photo-1563986768609-3b560d672299?w=600&h=400&fit=crop",
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop",
          "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&h=400&fit=crop",
        ],
        transportAvailable: true,
        originCounty: "Nairobi",
        originTown: "Kayole",
        escrowProtection: true,
        condition: "Brand New",
        verified: true,
        sellerName: "Stanish Gas Suppliers",
        sellerReputation: 4.8,
        sellerVerified: true,
        negotiable: true,
        attributes: {
          "Type": "New Cylinder + Gas",
          "Capacity": "6kg",
          "BrandsAvailable": "Total Gas, Afrigas, Jamii Gas, Cashug, Handi Gas",
          "Condition": "Brand New with valve + safety seal",
          "Includes": "Valve + Safety Seal + 6kg Gas",
          "Delivery": "Nairobi doorstep delivery",
          "Payment": "M-Pesa or Card",
          "SellerPhone": "0796342951",
          "SellerAltPhone": "0701976130",
          "BusinessName": "Stanish Gas Suppliers",
          "WhatsApp": "Gas! Gas! Gas! - Smart Fill Gas Point - FREE DELIVERY - WhatsApp/Call/ReverseCall: 0796342951 / 0701976130",
        },
        views: 2341,
        favorites: 387,
      },
    ];

    let seeded = 0;
    for (const listing of listings) {
      // Skip if a listing with this title already exists
      if (existingTitles.has(listing.title)) continue;
      // Find a real user to associate with this listing, or use a system placeholder
      const user = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", listing.sellerName.toLowerCase().replace(/\s+/g, "@") + ".com"))
        .first();

      // If no matching user, create a synthetic seller identity or use any active seller
      const sellerUser = user || (await ctx.db.query("users").first()) || null;

      const sellerId = sellerUser?._id || "system";
      const finalSellerName = sellerUser?.name || listing.sellerName;
      const finalSellerReputation = (sellerUser as any)?.sellerReputation || listing.sellerReputation;
      const finalSellerVerified = (sellerUser as any)?.sellerVerified ?? listing.sellerVerified;

      await ctx.db.insert("listings", {
        sellerId: sellerId as any,
        title: listing.title,
        description: listing.description,
        price: listing.price,
        currency: listing.currency,
        category: listing.category,
        subcategory: listing.subcategory,
        images: listing.images,
        transportAvailable: listing.transportAvailable,
        originCounty: listing.originCounty,
        originTown: listing.originTown,
        escrowProtection: listing.escrowProtection,
        insuranceProtection: false,
        condition: listing.condition,
        verified: listing.verified,
        sellerName: finalSellerName,
        sellerReputation: finalSellerReputation,
        sellerVerified: finalSellerVerified,
        attributes: Object.fromEntries(Object.entries(listing.attributes).map(([k, v]) => [k, String(v)])) as any,
        negotiable: listing.negotiable,
        views: listing.views,
        favorites: listing.favorites,
        status: "active",
        createdAt: Date.now() - Math.floor(Math.random() * 86400000 * 3), // spread across last 3 days
        updatedAt: Date.now(),
      });
    }

    return { message: `Seeded ${seeded} new cooking gas listings`, count: seeded };
  },
});
