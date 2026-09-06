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
      // ===== COOKING GAS - REFILL (KES 1,100) =====
      {
        title: "Cooking Gas Refill - 6kg (Delivered)",
        description: "Complete cooking gas refill service. 6kg cylinder filled and delivered to your doorstep anywhere in Nairobi and surrounding areas. Safe, certified, and fast same-day delivery. WhatsApp / Call to order.",
        price: 1100,
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
        originTown: "Industrial Area",
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
          "Brand": "Any Cylinder",
          "Delivery": "Same-day Nairobi and surrounds",
          "Safety": "Certified fill",
          "SellerPhone": "0796342951",
          "SellerAltPhone": "0701976130",
          "BusinessName": "Smart Fill Gas Point",
          "WhatsApp": "Gas! Gas! Gas! - Smart Fill Gas Point - FREE DELIVERY - WhatsApp/Call/ReverseCall: 0796342951 / 0701976130",
        },
        views: 1247,
        favorites: 203,
      },
      // ===== COOKING GAS - 6KG FULL CYLINDER (KES 3,900) =====
      {
        title: "6kg Cooking Gas Cylinder - Full",
        description: "Brand new 6kg full cooking gas cylinder. Ready for immediate use. Includes proper valve, safety seal, and weight certificate. Available in Afrigas, Cashug, and standard green cylinders. Delivery available within Nairobi.",
        price: 3900,
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
        originTown: "Industrial Area",
        escrowProtection: true,
        condition: "Brand New",
        verified: true,
        sellerName: "Stanish Gas Suppliers",
        sellerReputation: 4.8,
        sellerVerified: true,
        negotiable: true,
        attributes: {
          "Type": "Full Cylinder",
          "Capacity": "6kg",
          "BrandsAvailable": "Afrigas, Cashug, Standard",
          "Condition": "Brand New with seal",
          "Includes": "Valve + Safety Seal",
          "SellerPhone": "0796342951",
          "SellerAltPhone": "0701976130",
          "BusinessName": "Stanish Gas Suppliers",
          "WhatsApp": "Gas! Gas! Gas! - Smart Fill Gas Point - FREE DELIVERY - WhatsApp/Call/ReverseCall: 0796342951 / 0701976130",
        },
        views: 2341,
        favorites: 387,
      },
      // ===== COOKING GAS - 12KG FULL CYLINDER (KES 6,500) =====
      {
        title: "12kg Cooking Gas Cylinder - Full",
        description: "Full 12kg cooking gas cylinder for larger households. Brand new, sealed, with proper labeling and safety certification. Available from top brands. Free delivery in Nairobi and nearby counties.",
        price: 6500,
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
        originTown: "Industrial Area",
        escrowProtection: true,
        condition: "Brand New",
        verified: true,
        sellerName: "Stanish Gas Suppliers",
        sellerReputation: 4.8,
        sellerVerified: true,
        negotiable: true,
        attributes: {
          "Type": "Full Cylinder",
          "Capacity": "12kg",
          "BrandsAvailable": "Afrigas, Cashug, Solgas",
          "Condition": "Brand New sealed",
          "IdealFor": "Large households",
          "SellerPhone": "0796342951",
          "SellerAltPhone": "0701976130",
          "BusinessName": "Stanish Gas Suppliers",
          "WhatsApp": "Gas! Gas! Gas! - Smart Fill Gas Point - FREE DELIVERY - WhatsApp/Call/ReverseCall: 0796342951 / 0701976130",
        },
        views: 876,
        favorites: 142,
      },
      // ===== COOKING GAS - 3KG PORTABLE (KES 2,500) =====
      {
        title: "3kg Portable Cooking Gas Cylinder",
        description: "Compact 3kg portable cooking gas cylinder. Perfect for single users, dorms, small kitchens, and outdoor cooking. Brand new with full warranty. Lightweight and easy to carry.",
        price: 2500,
        currency: "KES",
        category: "home-living",
        subcategory: "cooking-gas",
        images: [
          "https://images.unsplash.com/photo-1563986768609-3b560d672299?w=600&h=400&fit=crop",
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop",
        ],
        transportAvailable: true,
        originCounty: "Nairobi",
        originTown: "CBD",
        escrowProtection: true,
        condition: "Brand New",
        verified: true,
        sellerName: "Smart Fill Gas Point",
        sellerReputation: 4.9,
        sellerVerified: true,
        negotiable: false,
        attributes: {
          "Type": "Full Cylinder",
          "Capacity": "3kg",
          "BrandsAvailable": "Standard",
          "Condition": "Brand New",
          "Portable": "Yes - lightweight",
          "SellerPhone": "0796342951",
          "SellerAltPhone": "0701976130",
          "BusinessName": "Smart Fill Gas Point",
          "WhatsApp": "Gas! Gas! Gas! - Smart Fill Gas Point - FREE DELIVERY - WhatsApp/Call/ReverseCall: 0796342951 / 0701976130",
        },
        views: 567,
        favorites: 89,
      },
      // ===== GAS CYLINDER EXCHANGE (KES 2,800) =====
      {
        title: "Gas Cylinder Exchange - Bring Your Empty",
        description: "Exchange your empty 6kg cylinder for a filled one. Save on buying a new cylinder. We accept all brands. Fast swap service. Available for pickup in Industrial Area or delivery within Nairobi for KES 300 extra.",
        price: 2800,
        currency: "KES",
        category: "home-living",
        subcategory: "cooking-gas",
        images: [
          "https://images.unsplash.com/photo-1563986768609-3b560d672299?w=600&h=400&fit=crop",
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop",
        ],
        transportAvailable: true,
        originCounty: "Nairobi",
        originTown: "Industrial Area",
        escrowProtection: true,
        condition: "Used - Like New",
        verified: true,
        sellerName: "Smart Fill Gas Point",
        sellerReputation: 4.9,
        sellerVerified: true,
        negotiable: false,
        attributes: {
          "Type": "Cylinder Exchange",
          "CylinderSize": "6kg",
          "BrandsAccepted": "All brands",
          "DeliveryFee": "KES 300 extra in Nairobi",
          "Pickup": "Industrial Area, Nairobi",
          "SellerPhone": "0796342951",
          "SellerAltPhone": "0701976130",
          "BusinessName": "Smart Fill Gas Point",
          "WhatsApp": "Gas! Gas! Gas! - Smart Fill Gas Point - FREE DELIVERY - WhatsApp/Call/ReverseCall: 0796342951 / 0701976130",
        },
        views: 432,
        favorites: 67,
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
