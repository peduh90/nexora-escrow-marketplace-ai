import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
  SELLER: "seller",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
  v.literal(ROLES.SELLER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    ...authTables,

    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      role: v.optional(roleValidator),
      phone: v.optional(v.string()),
      kycVerified: v.optional(v.boolean()),
      kycVerifiedAt: v.optional(v.number()),
      walletBalance: v.optional(v.number()),
      escrowBalance: v.optional(v.number()),
      reputation: v.optional(v.number()),
      country: v.optional(v.string()),
      currency: v.optional(v.string()),
    }).index("email", ["email"]),

    // Escrow transactions
    escrows: defineTable({
      buyerId: v.string(),
      sellerId: v.string(),
      amount: v.number(),
      currency: v.string(),
      status: v.union(
        v.literal("created"),
        v.literal("funded"),
        v.literal("active"),
        v.literal("delivery"),
        v.literal("inspection"),
        v.literal("released"),
        v.literal("disputed"),
        v.literal("completed"),
        v.literal("refunded"),
        v.literal("cancelled"),
      ),
      title: v.string(),
      description: v.string(),
      conditions: v.string(),
      inspectionPeriodHours: v.number(),
      releaseCondition: v.string(),
      aiRiskScore: v.optional(v.number()),
      aiRiskLevel: v.optional(v.string()),
      createdAt: v.number(),
      fundedAt: v.optional(v.number()),
      deliveredAt: v.optional(v.number()),
      releasedAt: v.optional(v.number()),
      completedAt: v.optional(v.number()),
      commissionRate: v.number(),
    })
      .index("by_buyer", ["buyerId"])
      .index("by_seller", ["sellerId"])
      .index("by_status", ["status"])
      .index("by_created", ["createdAt"]),

    // Marketplace listings
    listings: defineTable({
      sellerId: v.string(),
      title: v.string(),
      description: v.string(),
      price: v.number(),
      currency: v.string(),
      category: v.string(),
      images: v.optional(v.array(v.string())),
      escrowProtection: v.boolean(),
      verified: v.boolean(),
      sellerName: v.string(),
      sellerReputation: v.number(),
      sellerVerified: v.boolean(),
      views: v.number(),
      status: v.union(
        v.literal("active"),
        v.literal("sold"),
        v.literal("paused"),
        v.literal("removed"),
      ),
      createdAt: v.number(),
    })
      .index("by_seller", ["sellerId"])
      .index("by_category", ["category"])
      .index("by_status", ["status"])
      .index("by_created", ["createdAt"]),

    // Wallet transactions
    walletTransactions: defineTable({
      userId: v.string(),
      type: v.union(
        v.literal("deposit"),
        v.literal("withdrawal"),
        v.literal("escrow_fund"),
        v.literal("escrow_release"),
        v.literal("commission"),
        v.literal("transfer"),
        v.literal("refund"),
      ),
      amount: v.number(),
      currency: v.string(),
      status: v.union(
        v.literal("pending"),
        v.literal("processing"),
        v.literal("completed"),
        v.literal("failed"),
      ),
      reference: v.string(),
      description: v.string(),
      createdAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_type", ["type"])
      .index("by_created", ["createdAt"]),

    // Disputes
    disputes: defineTable({
      escrowId: v.string(),
      filedBy: v.string(),
      reason: v.string(),
      evidence: v.optional(v.array(v.string())),
      status: v.union(
        v.literal("open"),
        v.literal("under_review"),
        v.literal("resolved"),
        v.literal("escalated"),
        v.literal("closed"),
      ),
      resolution: v.optional(v.string()),
      aiRecommendation: v.optional(v.string()),
      createdAt: v.number(),
      resolvedAt: v.optional(v.number()),
    })
      .index("by_escrow", ["escrowId"])
      .index("by_filer", ["filedBy"])
      .index("by_status", ["status"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
