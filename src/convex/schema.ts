import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

export const ROLES = {
  ADMIN: "admin",
  BUYER: "buyer",
  SELLER: "seller",
  DRIVER: "driver",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.BUYER),
  v.literal(ROLES.SELLER),
  v.literal(ROLES.DRIVER),
);
export type Role = Infer<typeof roleValidator>;

export const KYC_STATUS = {
  NOT_STARTED: "not_started",
  PENDING: "pending",
  VERIFIED: "verified",
  REJECTED: "rejected",
} as const;

export const kycStatusValidator = v.union(
  v.literal(KYC_STATUS.NOT_STARTED),
  v.literal(KYC_STATUS.PENDING),
  v.literal(KYC_STATUS.VERIFIED),
  v.literal(KYC_STATUS.REJECTED),
);

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
      county: v.optional(v.string()),
      town: v.optional(v.string()),
      country: v.optional(v.string()),
      currency: v.optional(v.string()),
      walletBalance: v.optional(v.number()),
      escrowBalance: v.optional(v.number()),
      reputation: v.optional(v.number()),
      totalTransactions: v.optional(v.number()),
      joinedAt: v.optional(v.number()),
      // Seller-specific
      businessName: v.optional(v.string()),
      businessType: v.optional(v.string()),
      kycStatus: v.optional(kycStatusValidator),
      kycSubmittedAt: v.optional(v.number()),
      kycVerifiedAt: v.optional(v.number()),
      kycDocuments: v.optional(v.array(v.string())),
      sellerTier: v.optional(v.string()),
      commissionRate: v.optional(v.number()),
      subscriptionTier: v.optional(v.string()),
      subscriptionExpiry: v.optional(v.number()),
      // Social links
      whatsapp: v.optional(v.string()),
      facebook: v.optional(v.string()),
      instagram: v.optional(v.string()),
      tiktok: v.optional(v.string()),
      // Stats
      totalSales: v.optional(v.number()),
      totalPurchases: v.optional(v.number()),
      activeListings: v.optional(v.number()),
      successfulDeliveries: v.optional(v.number()),
    }).index("email", ["email"])
      .index("by_role", ["role"])
      .index("by_kyc", ["kycStatus"]),

    // KYC applications
    kycApplications: defineTable({
      userId: v.string(),
      businessName: v.string(),
      businessType: v.string(),
      registrationNumber: v.optional(v.string()),
      taxPin: v.optional(v.string()),
      county: v.string(),
      town: v.string(),
      phone: v.string(),
      idDocumentUrl: v.string(),
      businessDocumentUrl: v.optional(v.string()),
      status: v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected"),
      ),
      reviewedBy: v.optional(v.string()),
      reviewNotes: v.optional(v.string()),
      submittedAt: v.number(),
      reviewedAt: v.optional(v.number()),
    })
      .index("by_user", ["userId"])
      .index("by_status", ["status"]),

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
      // Delivery
      transportRequired: v.boolean(),
      transportFee: v.optional(v.number()),
      transportPartner: v.optional(v.string()),
      deliveryAddress: v.optional(v.string()),
      deliveryCounty: v.optional(v.string()),
      deliveryTown: v.optional(v.string()),
      estimatedDeliveryDate: v.optional(v.number()),
      actualDeliveryDate: v.optional(v.number()),
      // Location
      originCounty: v.optional(v.string()),
      originTown: v.optional(v.string()),
      // AI
      aiRiskScore: v.optional(v.number()),
      aiRiskLevel: v.optional(v.string()),
      // Timestamps
      createdAt: v.number(),
      fundedAt: v.optional(v.number()),
      deliveredAt: v.optional(v.number()),
      releasedAt: v.optional(v.number()),
      completedAt: v.optional(v.number()),
      // Financials
      commissionRate: v.number(),
      platformFee: v.optional(v.number()),
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
      subcategory: v.optional(v.string()),
      images: v.optional(v.array(v.string())),
      // Transport
      transportAvailable: v.boolean(),
      transportFee: v.optional(v.number()),
      originCounty: v.string(),
      originTown: v.string(),
      // Trust
      escrowProtection: v.boolean(),
      insuranceProtection: v.optional(v.boolean()),
      verified: v.boolean(),
      sellerName: v.string(),
      sellerReputation: v.number(),
      sellerVerified: v.boolean(),
      // Stats
      views: v.number(),
      favorites: v.number(),
      // Condition
      condition: v.optional(v.string()),
      // Status
      status: v.union(
        v.literal("active"),
        v.literal("sold"),
        v.literal("paused"),
        v.literal("removed"),
      ),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    })
      .index("by_seller", ["sellerId"])
      .index("by_category", ["category"])
      .index("by_status", ["status"])
      .index("by_created", ["createdAt"])
      .index("by_county", ["originCounty"]),

    // Wallet transactions
    walletTransactions: defineTable({
      userId: v.string(),
      type: v.union(
        v.literal("deposit"),
        v.literal("withdrawal"),
        v.literal("escrow_fund"),
        v.literal("escrow_release"),
        v.literal("commission"),
        v.literal("transport_fee"),
        v.literal("transfer"),
        v.literal("refund"),
        v.literal("subscription"),
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
      description: v.optional(v.string()),
      evidence: v.optional(v.array(v.string())),
      status: v.union(
        v.literal("open"),
        v.literal("under_review"),
        v.literal("resolved"),
        v.literal("escalated"),
        v.literal("closed"),
      ),
      resolution: v.optional(v.string()),
      refundAmount: v.optional(v.number()),
      aiRecommendation: v.optional(v.string()),
      createdAt: v.number(),
      resolvedAt: v.optional(v.number()),
    })
      .index("by_escrow", ["escrowId"])
      .index("by_filer", ["filedBy"])
      .index("by_status", ["status"]),

    // Job/Service posts
    jobPosts: defineTable({
      posterId: v.string(),
      posterName: v.string(),
      posterVerified: v.boolean(),
      type: v.union(
        v.literal("job"),
        v.literal("service"),
        v.literal("gig"),
        v.literal("freelance"),
      ),
      title: v.string(),
      description: v.string(),
      category: v.string(),
      budget: v.optional(v.number()),
      budgetType: v.optional(v.string()),
      currency: v.string(),
      location: v.string(),
      county: v.string(),
      town: v.optional(v.string()),
      remote: v.boolean(),
      skills: v.optional(v.array(v.string())),
      duration: v.optional(v.string()),
      deadline: v.optional(v.number()),
      status: v.union(
        v.literal("open"),
        v.literal("in_progress"),
        v.literal("completed"),
        v.literal("closed"),
      ),
      applicants: v.number(),
      views: v.number(),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    })
      .index("by_poster", ["posterId"])
      .index("by_type", ["type"])
      .index("by_status", ["status"])
      .index("by_category", ["category"])
      .index("by_county", ["county"]),

    // Job applications
    jobApplications: defineTable({
      jobId: v.string(),
      applicantId: v.string(),
      applicantName: v.string(),
      message: v.string(),
      proposedBudget: v.optional(v.number()),
      status: v.union(
        v.literal("pending"),
        v.literal("shortlisted"),
        v.literal("accepted"),
        v.literal("rejected"),
      ),
      createdAt: v.number(),
    })
      .index("by_job", ["jobId"])
      .index("by_applicant", ["applicantId"]),

    // Transport/Delivery tracking
    deliveries: defineTable({
      escrowId: v.string(),
      driverId: v.optional(v.string()),
      driverName: v.optional(v.string()),
      driverPhone: v.optional(v.string()),
      vehicleType: v.optional(v.string()),
      vehicleReg: v.optional(v.string()),
      pickupCounty: v.string(),
      pickupTown: v.string(),
      pickupAddress: v.string(),
      dropoffCounty: v.string(),
      dropoffTown: v.string(),
      dropoffAddress: v.string(),
      status: v.union(
        v.literal("assigned"),
        v.literal("pickup"),
        v.literal("in_transit"),
        v.literal("delivered"),
        v.literal("confirmed"),
        v.literal("issue"),
      ),
      estimatedKm: v.number(),
      estimatedDuration: v.string(),
      transportFee: v.number(),
      insuranceCovered: v.boolean(),
      insuranceAmount: v.optional(v.number()),
      trackingCode: v.string(),
      specialInstructions: v.optional(v.string()),
      createdAt: v.number(),
      pickedUpAt: v.optional(v.number()),
      deliveredAt: v.optional(v.number()),
    })
      .index("by_escrow", ["escrowId"])
      .index("by_driver", ["driverId"])
      .index("by_status", ["status"]),

    // Product categories
    productCategories: defineTable({
      name: v.string(),
      slug: v.string(),
      icon: v.string(),
      description: v.string(),
      subcategories: v.array(v.string()),
      active: v.boolean(),
      sortOrder: v.number(),
    })
      .index("by_slug", ["slug"])
      .index("by_active", ["active"]),

    // Platform settings (admin)
    platformSettings: defineTable({
      key: v.string(),
      value: v.string(),
      updatedBy: v.optional(v.string()),
      updatedAt: v.number(),
    })
      .index("by_key", ["key"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
