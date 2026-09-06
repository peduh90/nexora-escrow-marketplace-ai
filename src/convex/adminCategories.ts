import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all categories (admin view - includes inactive)
export const getAllCategories = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db.query("productCategories").collect();
    return categories.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

// Get active categories only (for seller form)
export const getActiveCategories = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db
      .query("productCategories")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();
    return categories.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

// Create a new category
export const createCategory = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    icon: v.string(),
    image: v.optional(v.string()),
    description: v.string(),
    subcategories: v.array(v.string()),
    attributes: v.optional(v.array(v.object({
      name: v.string(),
      type: v.union(
        v.literal("text"), v.literal("number"), v.literal("dropdown"),
        v.literal("multi-select"), v.literal("checkbox"), v.literal("radio"),
        v.literal("boolean"), v.literal("textarea"),
      ),
      required: v.boolean(),
      options: v.optional(v.array(v.string())),
      placeholder: v.optional(v.string()),
    }))),
    sortOrder: v.optional(v.number()),
    createdBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("productCategories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (existing) {
      throw new Error("A category with this slug already exists");
    }

    const maxOrder = await ctx.db.query("productCategories").collect();
    const sortOrder = args.sortOrder ?? maxOrder.length;

    const categoryId = await ctx.db.insert("productCategories", {
      name: args.name,
      slug: args.slug,
      icon: args.icon,
      image: args.image,
      description: args.description,
      subcategories: args.subcategories,
      attributes: args.attributes,
      active: true,
      sortOrder,
      createdBy: args.createdBy,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Audit log
    await ctx.db.insert("auditLogs", {
      adminId: args.createdBy || "system",
      adminName: "Admin",
      action: "category_created",
      target: "category",
      targetId: categoryId,
      details: `Created category: ${args.name}`,
      createdAt: Date.now(),
    });

    return { categoryId, success: true };
  },
});

// Update a category
export const updateCategory = mutation({
  args: {
    categoryId: v.id("productCategories"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    icon: v.optional(v.string()),
    image: v.optional(v.string()),
    description: v.optional(v.string()),
    subcategories: v.optional(v.array(v.string())),
    attributes: v.optional(v.array(v.object({
      name: v.string(),
      type: v.union(
        v.literal("text"), v.literal("number"), v.literal("dropdown"),
        v.literal("multi-select"), v.literal("checkbox"), v.literal("radio"),
        v.literal("boolean"), v.literal("textarea"),
      ),
      required: v.boolean(),
      options: v.optional(v.array(v.string())),
      placeholder: v.optional(v.string()),
    }))),
    sortOrder: v.optional(v.number()),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { categoryId, ...updates } = args;
    const cleanedUpdates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) cleanedUpdates[key] = value;
    }

    await ctx.db.patch(categoryId, cleanedUpdates);

    await ctx.db.insert("auditLogs", {
      adminId: args.updatedBy || "system",
      adminName: "Admin",
      action: "category_updated",
      target: "category",
      targetId: categoryId,
      details: `Updated category fields: ${Object.keys(cleanedUpdates).filter(k => k !== "updatedAt").join(", ")}`,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Toggle category active status
export const toggleCategoryActive = mutation({
  args: {
    categoryId: v.id("productCategories"),
    active: v.boolean(),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.categoryId, {
      active: args.active,
      updatedAt: Date.now(),
    });

    const category = await ctx.db.get(args.categoryId);

    await ctx.db.insert("auditLogs", {
      adminId: args.updatedBy || "system",
      adminName: "Admin",
      action: args.active ? "category_activated" : "category_deactivated",
      target: "category",
      targetId: args.categoryId,
      details: `${args.active ? "Activated" : "Deactivated"} category: ${category?.name || "Unknown"}`,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Delete a category
export const deleteCategory = mutation({
  args: {
    categoryId: v.id("productCategories"),
    deletedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.categoryId);
    await ctx.db.delete(args.categoryId);

    await ctx.db.insert("auditLogs", {
      adminId: args.deletedBy || "system",
      adminName: "Admin",
      action: "category_deleted",
      target: "category",
      targetId: args.categoryId,
      details: `Deleted category: ${category?.name || "Unknown"}`,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Reorder categories
export const reorderCategories = mutation({
  args: {
    orderedIds: v.array(v.id("productCategories")),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    for (let i = 0; i < args.orderedIds.length; i++) {
      await ctx.db.patch(args.orderedIds[i], { sortOrder: i, updatedAt: Date.now() });
    }
    return { success: true };
  },
});

// Seed default categories (run once)
export const seedDefaultCategories = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("productCategories").first();
    if (existing) return { message: "Categories already seeded" };

    const defaults = [
      { name: "Mobile Phones", slug: "mobile-phones", icon: "📱", subcategories: ["iPhone", "Samsung", "Google Pixel", "Tecno", "Infinix", "Xiaomi", "Oppo", "Other"] },
      { name: "Computers & Laptops", slug: "computers-laptops", icon: "💻", subcategories: ["Laptops", "Desktops", "Monitors", "Accessories", "Software"] },
      { name: "Fashion & Clothing", slug: "fashion", icon: "👕", subcategories: ["Men's Wear", "Women's Wear", "Shoes", "Accessories", "Bags", "Watches"] },
      { name: "Home & Living", slug: "home-living", icon: "🏠", subcategories: ["Furniture", "Kitchen", "Bedroom", "Bathroom", "Decor", "Appliances", "Cooking Gas & Fuel"] },
      { name: "Vehicles", slug: "vehicles", icon: "🚗", subcategories: ["Cars", "Motorcycles", "Trucks", "Spare Parts", "Accessories"] },
      { name: "Electronics", slug: "electronics", icon: "📺", subcategories: ["TVs", "Audio", "Cameras", "Gadgets", "Wearables"] },
      { name: "Health & Beauty", slug: "health-beauty", icon: "💄", subcategories: ["Skincare", "Makeup", "Hair Care", "Supplements", "Personal Care"] },
      { name: "Agriculture & Farming", slug: "agriculture", icon: "🌾", subcategories: ["Tractors", "Seeds", "Livestock", "Produce", "Equipment"] },
      { name: "Gaming", slug: "gaming", icon: "🎮", subcategories: ["Consoles", "PC Gaming", "Games", "Accessories", "VR"] },
      { name: "Baby & Kids", slug: "baby-kids", icon: "👶", subcategories: ["Toys", "Clothing", "Furniture", "Strollers", "Feeding"] },
      { name: "Sports & Fitness", slug: "sports-fitness", icon: "⚽", subcategories: ["Gym Equipment", "Sportswear", "Outdoor", "Team Sports", "Cycling"] },
      { name: "Arts & Handmade", slug: "arts-handmade", icon: "🎨", subcategories: ["Paintings", "Sculptures", "Jewelry", "Textiles", "Crafts"] },
      { name: "Music & Entertainment", slug: "music-entertainment", icon: "🎵", subcategories: ["Instruments", "Audio Equipment", "Vinyl", "Merchandise"] },
      { name: "School & Education", slug: "school-education", icon: "📚", subcategories: ["Textbooks", "Stationery", "Electronics", "Uniforms"] },
      { name: "Events & Tickets", slug: "events-tickets", icon: "🎫", subcategories: ["Concerts", "Sports Events", "Conferences", "Exhibitions"] },
      { name: "Business & Industrial", slug: "business-industrial", icon: "🏭", subcategories: ["Machinery", "Office Equipment", "Safety Gear", "Raw Materials"] },
      { name: "Pets & Animals", slug: "pets-animals", icon: "🐕", subcategories: ["Dogs", "Cats", "Birds", "Fish", "Pet Supplies"] },
      { name: "Services", slug: "services", icon: "🔧", subcategories: ["Plumbing", "Electrical", "Cleaning", "Catering", "Photography"] },
      { name: "Jobs & Gigs", slug: "jobs-gigs", icon: "💼", subcategories: ["Full-Time", "Part-Time", "Freelance", "Internship", "Gig Work"] },
    ];

    for (let i = 0; i < defaults.length; i++) {
      const cat = defaults[i];
      await ctx.db.insert("productCategories", {
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        description: `Browse ${cat.name} on Nexora Market`,
        subcategories: cat.subcategories,
        active: true,
        sortOrder: i,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return { message: `Seeded ${defaults.length} default categories`, count: defaults.length };
  },
});
