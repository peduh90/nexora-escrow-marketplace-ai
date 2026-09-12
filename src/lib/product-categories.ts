import type { Category } from "./categories";

/**
 * PRODUCT categories only — this list must never contain services or jobs.
 * Services live in src/convex/services.ts (SERVICE_CATEGORIES); freelance
 * work lives in Nexora Freelance. Ordered by everyday Kenyan demand.
 */
export const PRODUCT_CATEGORIES: Category[] = [
  {
    name: "Phones & Tablets",
    slug: "mobile-phones",
    icon: "📱",
    description: "Phones, tablets, accessories",
    subcategories: [
      { name: "Smartphones", slug: "smartphones" },
      { name: "Feature Phones", slug: "feature-phones" },
      { name: "Phone Accessories", slug: "phone-accessories" },
      { name: "SIM Cards & Data", slug: "sim-cards-data" },
    ],
  },
  {
    name: "Computers & Laptops",
    slug: "computers-laptops",
    icon: "💻",
    description: "Laptops, desktops, accessories",
    subcategories: [
      { name: "Laptops", slug: "laptops" },
      { name: "Desktop Computers", slug: "desktops" },
      { name: "Monitors", slug: "monitors" },
      { name: "Computer Accessories", slug: "computer-accessories" },
    ],
  },
  {
    name: "Fashion & Clothing",
    slug: "fashion",
    icon: "👔",
    description: "Clothes, shoes, bags, watches",
    subcategories: [
      { name: "Men's Clothing", slug: "mens-clothing" },
      { name: "Women's Clothing", slug: "womens-clothing" },
      { name: "Shoes", slug: "shoes" },
      { name: "Bags & Luggage", slug: "bags" },
      { name: "Watches", slug: "watches" },
      { name: "Children's Fashion", slug: "childrens-fashion" },
    ],
  },
  {
    name: "Home & Living",
    slug: "home-living",
    icon: "🛋️",
    description: "Furniture, appliances, decor",
    subcategories: [
      { name: "Kitchen Appliances", slug: "kitchen-appliances" },
      { name: "Furniture", slug: "bedroom" },
      { name: "Decor", slug: "decor" },
      { name: "Mattresses & Beddings", slug: "mattresses" },
    ],
  },
  {
    name: "Electronics",
    slug: "tvs-video",
    icon: "📺",
    description: "TVs, audio, electronics",
    subcategories: [
      { name: "Televisions", slug: "televisions" },
      { name: "Home Theaters", slug: "home-theaters" },
      { name: "Soundbars", slug: "soundbars" },
      { name: "Streaming Devices", slug: "streaming-devices" },
    ],
  },
  {
    name: "Beauty & Personal Care",
    slug: "health-beauty",
    icon: "💄",
    description: "Skincare, hair, beauty products",
    subcategories: [
      { name: "Cosmetics", slug: "cosmetics" },
      { name: "Skincare", slug: "skincare" },
      { name: "Hair Care", slug: "hair-care" },
      { name: "Fragrances", slug: "fragrances" },
    ],
  },
  {
    name: "Agriculture",
    slug: "agriculture",
    icon: "🌾",
    description: "Farm inputs, tools, produce",
    subcategories: [
      { name: "Seeds & Seedlings", slug: "seeds" },
      { name: "Fertilizers", slug: "fertilizers" },
      { name: "Farm Produce", slug: "farm-produce" },
      { name: "Irrigation", slug: "irrigation" },
    ],
  },
  {
    name: "Baby & Kids",
    slug: "baby-kids",
    icon: "🍼",
    description: "Baby items, toys, kids' wear",
    subcategories: [
      { name: "Baby Clothing", slug: "baby-clothing" },
      { name: "Toys", slug: "toys" },
      { name: "Baby Cots & Cribs", slug: "cots" },
    ],
  },
  {
    name: "Gaming",
    slug: "gaming",
    icon: "🎮",
    description: "Consoles, games, accessories",
    subcategories: [
      { name: "PC Gaming", slug: "pc-gaming" },
      { name: "Gaming Accessories", slug: "gaming-accessories" },
    ],
  },
  {
    name: "Sports & Fitness",
    slug: "sports-fitness",
    icon: "⚽",
    description: "Sports gear, fitness equipment",
    subcategories: [
      { name: "Team Sports", slug: "team-sports" },
      { name: "Fitness Equipment", slug: "fitness-equipment" },
    ],
  },
  {
    name: "Handmade & Art",
    slug: "handmade-art",
    icon: "🎨",
    description: "Local crafts, art, handmade goods",
    subcategories: [
      { name: "Paintings", slug: "paintings" },
      { name: "Handmade Jewelry", slug: "handmade-jewelry" },
      { name: "Traditional Crafts", slug: "traditional-crafts" },
      { name: "Beadwork", slug: "beadwork" },
    ],
  },
  {
    name: "Events & Tickets",
    slug: "events-tickets",
    icon: "🎟️",
    description: "Event tickets and experiences",
    subcategories: [
      { name: "Concert Tickets", slug: "concert-tickets" },
      { name: "Sports Events", slug: "sports-events" },
      { name: "Festivals", slug: "festivals" },
    ],
  },
];
