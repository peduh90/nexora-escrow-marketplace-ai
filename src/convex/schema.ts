import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

export const ROLES = {
  ADMIN: "admin",
  BUYER: "buyer",
  SELLER: "seller",
  DRIVER: "driver",
} as const;

export const ADMIN_ROLES = {
  SUPER_ADMIN: "super_admin",
  MARKETPLACE_ADMIN: "marketplace_admin",
  FINANCE_ADMIN: "finance_admin",
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
      // Admin auth
      adminPasswordHash: v.optional(v.string()),
      adminPasswordSalt: v.optional(v.string()),
      adminTotpSecret: v.optional(v.string()),
      adminTwoFactorEnabled: v.optional(v.boolean()),
      adminLastLogin: v.optional(v.number()),
      adminRole: v.optional(v.union(
        v.literal("super_admin"),
        v.literal("marketplace_admin"),
        v.literal("finance_admin"),
      )),
      adminPermissions: v.optional(v.array(v.string())),
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
      // Category-specific attributes (flexible key-value pairs)
      attributes: v.optional(v.record(v.string(), v.string())),
      // Stats
      views: v.number(),
      favorites: v.number(),
      // Condition
      condition: v.optional(v.string()),
      // Negotiable
      negotiable: v.optional(v.boolean()),
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

    // Product categories (admin-controlled)
    productCategories: defineTable({
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
      active: v.boolean(),
      sortOrder: v.number(),
      createdBy: v.optional(v.string()),
      createdAt: v.optional(v.number()),
      updatedAt: v.optional(v.number()),
    })
      .index("by_slug", ["slug"])
      .index("by_active", ["active"]),

    // Buyer-Seller Messages
    messages: defineTable({
      senderId: v.string(),
      receiverId: v.string(),
      listingId: v.optional(v.string()),
      escrowId: v.optional(v.string()),
      content: v.string(),
      read: v.boolean(),
      createdAt: v.number(),
    })
      .index("by_sender", ["senderId"])
      .index("by_receiver", ["receiverId"])
      .index("by_listing", ["listingId"])
      .index("by_created", ["createdAt"]),

    // Conversations (buyer-seller threads)
    conversations: defineTable({
      buyerId: v.string(),
      sellerId: v.string(),
      listingId: v.optional(v.string()),
      lastMessage: v.string(),
      lastMessageAt: v.number(),
      unreadBuyer: v.number(),
      unreadSeller: v.number(),
      createdAt: v.number(),
    })
      .index("by_buyer", ["buyerId"])
      .index("by_seller", ["sellerId"])
      .index("by_last_message", ["lastMessageAt"]),

    // Reviews
    reviews: defineTable({
      orderId: v.string(),
      listingId: v.string(),
      buyerId: v.string(),
      sellerId: v.string(),
      rating: v.number(),
      comment: v.optional(v.string()),
      sellerReply: v.optional(v.string()),
      createdAt: v.number(),
    })
      .index("by_listing", ["listingId"])
      .index("by_seller", ["sellerId"])
      .index("by_buyer", ["buyerId"]),

    // Notifications
    notifications: defineTable({
      userId: v.string(),
      type: v.string(),
      title: v.string(),
      message: v.string(),
      read: v.boolean(),
      link: v.optional(v.string()),
      createdAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_read", ["userId", "read"]),

    // Platform settings (admin)
    platformSettings: defineTable({
      key: v.string(),
      value: v.string(),
      updatedBy: v.optional(v.string()),
      updatedAt: v.number(),
    })
      .index("by_key", ["key"]),

    // Audit logs
    auditLogs: defineTable({
      adminId: v.string(),
      adminName: v.string(),
      adminRole: v.optional(v.string()),
      action: v.string(),
      target: v.string(),
      targetId: v.optional(v.string()),
      details: v.optional(v.string()),
      ipAddress: v.optional(v.string()),
      createdAt: v.number(),
    })
      .index("by_admin", ["adminId"])
      .index("by_action", ["action"])
      .index("by_created", ["createdAt"]),

    // ─── AI OPERATIONS LAYER ───

    // AI Knowledge Base — verified Nexora documentation for AI responses
    aiKnowledgeBase: defineTable({
      title: v.string(),
      category: v.string(), // e.g. "escrow", "payments", "kyc", "seller_rules", "buyer_rules", "delivery", "disputes", "faq"
      content: v.string(),
      tags: v.array(v.string()),
      active: v.boolean(),
      updatedBy: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_category", ["category"])
      .index("by_active", ["active"]),

    // Support Tickets — AI-created or human-created
    supportTickets: defineTable({
      userId: v.string(),
      userRole: v.string(), // buyer, seller, admin
      userName: v.optional(v.string()),
      userEmail: v.optional(v.string()),
      subject: v.string(),
      category: v.string(), // ORDER_PROBLEM, PAYMENT, REFUND, ESCROW, KYC, SELLER_ONBOARDING, PRODUCT_LISTING, ACCOUNT, DELIVERY, DISPUTE, FRAUD, TECHNICAL_PROBLEM, COMPLAINT, GENERAL_INFORMATION
      priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
      status: v.union(v.literal("open"), v.literal("ai_handling"), v.literal("ai_resolved"), v.literal("escalated"), v.literal("human_review"), v.literal("resolved"), v.literal("closed")),
      assignedTo: v.optional(v.string()), // team member userId or "ai"
      relatedOrderId: v.optional(v.string()),
      relatedListingId: v.optional(v.string()),
      relatedEscrowId: v.optional(v.string()),
      relatedDisputeId: v.optional(v.string()),
      aiIntent: v.optional(v.string()),
      aiConfidence: v.optional(v.number()),
      aiSummary: v.optional(v.string()),
      aiRecommendedAction: v.optional(v.string()),
      escalationReason: v.optional(v.string()),
      customerSatisfaction: v.optional(v.number()),
      resolution: v.optional(v.string()),
      resolvedBy: v.optional(v.string()), // "ai" or userId
      createdAt: v.number(),
      updatedAt: v.number(),
      resolvedAt: v.optional(v.number()),
    })
      .index("by_user", ["userId"])
      .index("by_status", ["status"])
      .index("by_category", ["category"])
      .index("by_priority", ["priority"])
      .index("by_created", ["createdAt"]),

    // Ticket Messages — conversation history for each ticket
    ticketMessages: defineTable({
      ticketId: v.string(),
      senderId: v.string(), // userId, "ai", or "system"
      senderName: v.string(),
      content: v.string(),
      isAi: v.boolean(),
      isSystem: v.boolean(),
      createdAt: v.number(),
    })
      .index("by_ticket", ["ticketId"])
      .index("by_created", ["createdAt"]),

    // AI Audit Log — every AI decision is recorded
    aiAuditLog: defineTable({
      action: v.string(), // e.g. "intent_classification", "auto_resolve", "escalate", "moderation_review", "fraud_score", "kyc_review", "dispute_analysis"
      entityType: v.string(), // ticket, listing, kyc, dispute, user, escrow
      entityId: v.string(),
      userId: v.optional(v.string()),
      aiDecision: v.string(),
      aiConfidence: v.number(),
      riskLevel: v.optional(v.string()),
      reasoning: v.optional(v.string()),
      dataSourcesUsed: v.optional(v.array(v.string())),
      humanOverride: v.optional(v.boolean()),
      overrideBy: v.optional(v.string()),
      overrideReason: v.optional(v.string()),
      finalOutcome: v.optional(v.string()),
      createdAt: v.number(),
    })
      .index("by_entity", ["entityType", "entityId"])
      .index("by_action", ["action"])
      .index("by_created", ["createdAt"]),

    // AI Metrics — daily snapshots for analytics
    aiMetrics: defineTable({
      date: v.string(), // YYYY-MM-DD
      totalConversations: v.number(),
      aiResolved: v.number(),
      humanEscalated: v.number(),
      aiAssisted: v.number(),
      avgResolutionTime: v.number(), // ms
      customerSatisfaction: v.number(), // 0-100
      automationRate: v.number(), // 0-100
      qualityScore: v.number(), // 0-100
      ticketsCreated: v.number(),
      ticketsResolved: v.number(),
      hallucinationReports: v.number(),
      incorrectAnswers: v.number(),
      avgConfidence: v.number(),
      aiCost: v.number(), // USD
      aiRequests: v.number(),
      createdAt: v.number(),
    })
      .index("by_date", ["date"]),

    // Fraud Alerts — AI-detected suspicious activity
    fraudAlerts: defineTable({
      entityType: v.string(), // user, listing, transaction, escrow
      entityId: v.string(),
      userId: v.optional(v.string()),
      riskScore: v.number(), // 0-100
      riskLevel: v.string(), // low, medium, high, critical
      flags: v.array(v.string()),
      recommendation: v.string(),
      status: v.union(v.literal("new"), v.literal("reviewing"), v.literal("confirmed"), v.literal("dismissed")),
      reviewedBy: v.optional(v.string()),
      reviewNotes: v.optional(v.string()),
      createdAt: v.number(),
      reviewedAt: v.optional(v.number()),
    })
      .index("by_status", ["status"])
      .index("by_risk", ["riskLevel"])
      .index("by_created", ["createdAt"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
