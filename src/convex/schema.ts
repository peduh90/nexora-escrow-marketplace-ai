import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";import { Infer, v } from "convex/values";

export const roleValidator = v.union(
  v.literal("admin"),
  v.literal("buyer"),
  v.literal("seller"),
  v.literal("driver"),
  v.literal("freelancer"),
  v.literal("employer"),
  v.literal("super_admin"),
  v.literal("marketplace_admin"),
  v.literal("finance_admin"),
);
export type Role = Infer<typeof roleValidator>;

export const ALL_ROLES = [
  "admin",
  "buyer",
  "seller",
  "driver",
  "freelancer",
  "employer",
  "super_admin",
  "marketplace_admin",
  "finance_admin",
] as const;

export type AnyRole = (typeof ALL_ROLES)[number];

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
  v.literal(KYC_STATUS.REJECTED),);

const schema = defineSchema(
  {
    ...authTables,

    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      // Written by the Convex Auth library during OTP/verification flows — the
      // auth library shares this `users` table, so these fields must exist in
      // the schema or code verification throws a validation error.
      emailVerified: v.optional(v.boolean()),
      phoneVerified: v.optional(v.boolean()),
      phoneVerificationTime: v.optional(v.number()),
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
      lastLoginAt: v.optional(v.number()),
      lastActivityAt: v.optional(v.number()),
      // Seller-specific
      businessName: v.optional(v.string()),
      businessType: v.optional(v.string()),
      // Seller store profile (set from the seller Store page, shown on the
      // public seller profile page)
      storeDescription: v.optional(v.string()),
      storeWebsite: v.optional(v.string()),
      storeHours: v.optional(v.string()),
      kycStatus: v.optional(kycStatusValidator),
      kycSubmittedAt: v.optional(v.number()),
      kycVerifiedAt: v.optional(v.number()),
      kycDocuments: v.optional(v.array(v.string())),
      // Account verification gate — a user has NO role (and no panel access)
      // until their registration/verification is complete and approved.
      // "pending" = still in onboarding/verification; "active" = verified,
      // role assigned, panel access granted.
      accountStatus: v.optional(v.union(
        v.literal("pending"),
        v.literal("active"),
        v.literal("suspended"),
      )),
      suspensionReason: v.optional(v.string()),
      suspendedAt: v.optional(v.number()),
      // The role the user requested during onboarding, held until verification
      // completes. Copied into `role` by completeVerification.
      pendingRole: v.optional(v.string()),
      sellerTier: v.optional(v.string()),
      commissionRate: v.optional(v.number()),
      subscriptionTier: v.optional(v.string()),
      subscriptionExpiry: v.optional(v.number()),
      // Social links
      whatsapp: v.optional(v.string()),
      facebook: v.optional(v.string()),
      instagram: v.optional(v.string()),
      tiktok: v.optional(v.string()),
      // Auth password (simple hash for email/password login)
      passwordHash: v.optional(v.string()),
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
      // ── Progressive verification ──
      // "basic" = phone/email + profile (every active account, incl. buyers).
      // "business" = the role's full business gate passed (seller KYC + genuine
      // listing; employer complete profile + 5 different real jobs/services).
      // Written ONLY by the server (verification engine) — never by the client.
      verificationLevel: v.optional(v.union(
        v.literal("basic"),
        v.literal("business"),
      )),
      // Server-written activation milestones used by the verification engine,
      // dashboards and the referral commission engine.
      sellerActivatedAt: v.optional(v.number()),
      employerActivatedAt: v.optional(v.number()),
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
      // Kenya-first landmark addressing (#72): structured fields supplementing
      // the free-text address. All optional — legacy rows keep working.
      deliveryArea: v.optional(v.string()),
      deliveryLandmark: v.optional(v.string()),
      // ─── Phase 3: Diaspora & Gift buying (#106/#107) ───
      // Payer and recipient can be different people: someone abroad (or in
      // another town) pays; Nexora delivers to the recipient in Kenya.
      recipientName: v.optional(v.string()),
      recipientPhone: v.optional(v.string()),
      recipientCounty: v.optional(v.string()),
      recipientTown: v.optional(v.string()),
      giftNote: v.optional(v.string()),
      deliveryBuilding: v.optional(v.string()),
      deliveryFloorUnit: vOptionalString(),
      deliveryInstructions: v.optional(v.string()),
      deliveryPin: v.optional(v.string()),
      deliveryAddressId: vOptionalString(),
      // Delivery proof (#74): OTP + receipt confirmation reference
      deliveryProofOtp: v.optional(v.string()),
      deliveryProofConfirmedAt: v.optional(v.number()),
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
      // Financials — Nexora fee engine (src/convex/fees.ts). commissionRate
      // holds the seller/freelancer commission percent actually charged;
      // platformFee is the seller commission amount (kept for compatibility).
      // buyerFeeRate/buyerFee store the buyer/employer protection fee actually
      // charged. Escrow is included within these fees — never charged twice.
      commissionRate: v.number(),
      platformFee: v.optional(v.number()),
      buyerFeeRate: v.optional(v.number()),
      buyerFee: v.optional(v.number()),
      marketplace: v.optional(v.string()),
    })
      .index("by_buyer", ["buyerId"])
      .index("by_seller", ["sellerId"])
      .index("by_status", ["status"])
      .index("by_created", ["createdAt"]),

    // Marketplace listings
    listings: defineTable({
      sellerId: v.string(),
      // Which marketplace this listing lives in. Legacy rows without the field
      // are treated as normal product listings. Freelance/digital-tool listings
      // only ever surface inside the Freelance Marketplace.
      marketplace: v.optional(v.union(
        v.literal("product"),
        v.literal("freelance"),
      )),
      // Local Deals: optional "was" price for honest discount display.
      originalPrice: v.optional(v.number()),
      // ─── Phase 3: B2B Wholesale (#63) ───
      // A listing may ALSO be offered wholesale with a minimum order quantity
      // and volume tiers. Consumer price stays untouched — business buyers
      // see the tier table and request bulk quotes through chat.
      wholesale: v.optional(v.boolean()),
      moq: v.optional(v.number()),
      tierPrices: v.optional(v.array(v.object({
        minQty: v.number(),
        price: v.number(),
      }))),
      // ─── Phase 3: Rentals (#67) ───
      // Rental instead of purchase: daily rate + refundable deposit + minimum
      // days. Booking funds (rate × days + deposit) through the SAME escrow
      // engine; deposit releases on return confirmation.
      rental: v.optional(v.boolean()),
      ratePerDay: v.optional(v.number()),
      depositAmount: v.optional(v.number()),
      minRentalDays: v.optional(v.number()),
      title: v.string(),
      description: v.string(),
      price: v.number(),
      currency: v.string(),
      category: v.string(),
      subcategory: v.optional(v.string()),
      images: v.optional(v.array(v.string())),
      // Supporting documents (spec sheets, invoices, portfolios, briefs).
      // Convex storage keys — resolved to URLs when listings are read.
      documents: v.optional(v.array(v.string())),
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
      .index("by_county", ["originCounty"])
      .index("by_marketplace", ["marketplace"]),

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
      // Linked from the M-Pesa STK Push response so the callback can resolve a
      // deposit by CheckoutRequestID (the reference stored at initiate time is
      // NOT what Safaricom echoes back).
      checkoutRequestId: v.optional(v.string()),
      createdAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_type", ["type"])
      .index("by_created", ["createdAt"])
      .index("by_checkout", ["checkoutRequestId"]),

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

    // Real view tracking: one row per unique viewer per listing. Views only
    // increment when a viewer (signed-in user id or anonymous device id) is
    // seen for the first time — refreshes and re-renders never inflate counts.
    listingViews: defineTable({
      listingId: v.string(),
      viewerKey: v.string(),
      viewedAt: v.number(),
    })
      .index("by_listing_viewer", ["listingId", "viewerKey"])
      .index("by_listing", ["listingId"]),

    // ─── Kenya-first delivery: structured landmark addresses (#72/#73) ───
    // A user can save named delivery locations (Home / Work / Shop / Farm /
    // Other) with structured landmark fields + optional map pin. Private
    // personal data: only ever read by the owner via session-bound queries.
    savedAddresses: defineTable({
      userId: v.string(),
      label: v.string(), // "Home", "Work", "Shop", "Farm", "Other"…
      county: v.string(),
      town: v.string(),
      area: v.optional(v.string()),
      landmark: v.optional(v.string()),
      landmarkType: v.optional(v.string()),
      direction: v.optional(v.string()),
      building: v.optional(v.string()),
      floorUnit: v.optional(v.string()),
      instructions: v.optional(v.string()),
      pin: v.optional(v.string()), // "lat,lng" string or placeholder
      recipientName: v.optional(v.string()),
      recipientPhone: v.optional(v.string()),
      isDefault: v.optional(v.boolean()),
      verifiedDelivery: v.optional(v.boolean()), // set after a successful delivery
      useCount: v.optional(v.number()),
      lastUsedAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    })
      .index("by_user", ["userId"]),

    // ─── Config/flag engine (#166–168) ───
    // Admin-controlled rollout flags. Every major feature ships dark and is
    // enabled per environment (dev / pilot county / full production) without
    // code deploys. Server reads these; the client receives only what it may
    // see (never internal thresholds).
    featureFlags: defineTable({
      key: v.string(), // e.g. "low_data_mode", "cod", "wholesale"
      label: v.string(),
      description: v.string(),
      enabled: v.boolean(),
      // Gradual rollout without code deploys (#168/#169)
      rollout: v.optional(v.union(
        v.literal("development"),
        v.literal("pilot"),
        v.literal("production"),
      )),
      updatedBy: v.optional(v.string()),
      updatedAt: v.number(),
    })
      .index("by_key", ["key"]),

    // ─── Data retention ledger (#118) ───
    // Policy declarations per data type; auditable, admin-editable.
    dataRetentionPolicies: defineTable({
      dataType: v.string(), // orders, payments, kyc, location, messages…
      retentionDays: v.number(),
      purpose: v.string(),
      legalBasis: v.optional(v.string()),
      updatedBy: v.optional(v.string()),
      updatedAt: v.number(),
    })
      .index("by_type", ["dataType"]),

    // Password reset codes: a 6-digit code emailed to the account holder.
    // One active code per email — requesting a new one replaces the old.
    passwordResetCodes: defineTable({
      email: v.string(),
      codeHash: v.string(), // PBKDF2 hash — the plaintext code is never stored
      expiresAt: v.number(),
      attempts: v.number(),
      createdAt: v.number(),
    })
      .index("by_email", ["email"]),

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

    // AI Permissions — granular control over what AI can do
    aiPermissions: defineTable({
      key: v.string(), // e.g. "auto_moderate_listings", "auto_resolve_tickets", "auto_approve_kyc", "auto_escrow_release"
      label: v.string(),
      description: v.string(),
      category: v.string(), // "support", "moderation", "kyc", "fraud", "disputes", "finance", "security"
      enabled: v.boolean(),
      riskLevel: v.string(), // "low", "medium", "high", "critical"
      requiresOwnerApproval: v.boolean(),
      maxConfidence: v.number(), // minimum AI confidence to auto-execute (0-100)
      autoActionCount: v.number(), // times AI has auto-executed this action
      lastTriggeredAt: v.optional(v.number()),
      updatedBy: v.optional(v.string()),
      updatedAt: v.number(),
    })
      .index("by_key", ["key"])
      .index("by_category", ["category"]),

    // AI Automation Log — tracks every automated action
    aiAutomationLog: defineTable({
      permissionKey: v.string(),
      entityType: v.string(),
      entityId: v.string(),
      action: v.string(),
      aiConfidence: v.number(),
      result: v.string(), // "approved", "rejected", "escalated", "failed"
      reasoning: v.optional(v.string()),
      overriddenBy: v.optional(v.string()),
      overrideReason: v.optional(v.string()),
      createdAt: v.number(),
    })
      .index("by_permission", ["permissionKey"])
      .index("by_entity", ["entityType", "entityId"])
      .index("by_created", ["createdAt"]),

    // ─── NEXORA FREELANCE MARKETPLACE ───

    // Freelancer profiles
    freelanceProfiles: defineTable({
      userId: v.string(),
      displayName: v.string(),
      title: v.optional(v.string()), // e.g. "Full-Stack Developer"
      bio: v.optional(v.string()),
      avatar: v.optional(v.string()),
      skills: v.array(v.string()),
      categories: v.array(v.string()),
      languages: v.optional(v.array(v.string())),
      hourlyRate: v.optional(v.number()),
      currency: v.string(),
      availability: v.union(
        v.literal("available"),
        v.literal("busy"),
        v.literal("offline"),
      ),
      location: v.optional(v.string()),
      portfolio: v.optional(v.array(v.object({
        title: v.string(),
        description: v.optional(v.string()),
        url: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
      }))),
      completedProjects: v.number(),
      totalEarnings: v.number(),
      successRate: v.number(), // 0-100
      responseRate: v.number(), // 0-100
      avgRating: v.number(), // 0-5
      totalReviews: v.number(),
      isVerified: v.boolean(),
      status: v.union(
        v.literal("active"),
        v.literal("suspended"),
        v.literal("pending_review"),
      ),
      roleMode: v.union(v.literal("freelancer"), v.literal("employer"), v.literal("both")),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_status", ["status"])
      .index("by_categories", ["categories"]),

    // Freelance tasks/projects posted by employers
    freelanceTasks: defineTable({
      employerId: v.string(),
      employerName: v.string(),
      employerImage: v.optional(v.string()),
      title: v.string(),
      description: v.string(),
      category: v.string(),
      subcategory: v.optional(v.string()),
      skills: v.array(v.string()),
      budget: v.number(),
      budgetType: v.union(v.literal("fixed"), v.literal("milestone"), v.literal("hourly")),
      currency: v.string(),
      deadline: v.optional(v.number()),
      priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
      experienceLevel: v.optional(v.string()), // beginner, intermediate, expert
      remote: v.boolean(),
      location: v.optional(v.string()),
      attachments: v.optional(v.array(v.string())),
      freelancerCount: v.number(), // how many freelancers needed
      applicants: v.number(),
      views: v.number(),
      status: v.union(
        v.literal("open"),
        v.literal("in_progress"),
        v.literal("completed"),
        v.literal("cancelled"),
        v.literal("closed"),
      ),
      assignedFreelancerId: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_employer", ["employerId"])
      .index("by_status", ["status"])
      .index("by_category", ["category"])
      .index("by_created", ["createdAt"]),

    // Freelance task applications
    freelanceApplications: defineTable({
      taskId: v.string(),
      freelancerId: v.string(),
      freelancerName: v.string(),
      freelancerImage: v.optional(v.string()),
      freelancerRating: v.number(),
      freelancerCompletedProjects: v.number(),
      proposal: v.string(),
      proposedBudget: v.number(),
      estimatedDuration: v.optional(v.string()),
      status: v.union(
        v.literal("pending"),
        v.literal("shortlisted"),
        v.literal("accepted"),
        v.literal("rejected"),
        v.literal("withdrawn"),
      ),
      createdAt: v.number(),
    })
      .index("by_task", ["taskId"])
      .index("by_freelancer", ["freelancerId"])
      .index("by_status", ["status"]),

    // Freelance projects (accepted tasks with milestones)
    freelanceProjects: defineTable({
      taskId: v.string(),
      employerId: v.string(),
      freelancerId: v.string(),
      title: v.string(),
      description: v.string(),
      budget: v.number(),
      budgetType: v.union(v.literal("fixed"), v.literal("milestone"), v.literal("hourly")),
      currency: v.string(),
      milestones: v.optional(v.array(v.object({
        id: v.string(),
        title: v.string(),
        amount: v.number(),
        status: v.union(
          v.literal("pending"),
          v.literal("in_progress"),
          v.literal("submitted"),
          v.literal("approved"),
          v.literal("rejected"),
        ),
        dueDate: v.optional(v.number()),
        completedAt: v.optional(v.number()),
      }))),
      status: v.union(
        v.literal("active"),
        v.literal("on_hold"),
        v.literal("submitted"),
        v.literal("revision_requested"),
        v.literal("completed"),
        v.literal("cancelled"),
        v.literal("disputed"),
      ),
      progress: v.number(), // 0-100
      totalPaid: v.number(),
      escrowId: v.optional(v.string()),
      // Escrow lifecycle for the project payment. employerFunded marks the
      // employer's wallet debit + escrow funding at hire time; escrowReleased
      // marks the payout to the freelancer on approval.
      employerFunded: v.optional(v.boolean()),
      escrowReleased: v.optional(v.boolean()),
      // Latest employer review decision on a submission.
      lastReview: v.optional(v.object({
        action: v.union(v.literal("submitted"), v.literal("revision_requested"), v.literal("approved")),
        note: v.optional(v.string()),
        by: v.string(),
        at: v.number(),
      })),
      // Number of revision rounds used (employer requests)
      revisionCount: v.optional(v.number()),
      files: v.optional(v.array(v.object({
        name: v.string(),
        url: v.string(),
        uploadedBy: v.string(),
        uploadedAt: v.number(),
        version: v.optional(v.number()),
        note: v.optional(v.string()),
      }))),
      messages: v.number(), // unread message count
      startedAt: v.number(),
      deadline: v.optional(v.number()),
      completedAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_task", ["taskId"])
      .index("by_employer", ["employerId"])
      .index("by_freelancer", ["freelancerId"])
      .index("by_status", ["status"]),

    // Freelance reviews
    freelanceReviews: defineTable({
      projectId: v.string(),
      reviewerId: v.string(),
      revieweeId: v.string(),
      rating: v.number(), // 1-5
      comment: v.optional(v.string()),
      type: v.union(v.literal("employer_to_freelancer"), v.literal("freelancer_to_employer")),
      createdAt: v.number(),
    })
      .index("by_project", ["projectId"])
      .index("by_reviewee", ["revieweeId"]),

    // Freelance messages (project-specific)
    freelanceMessages: defineTable({
      projectId: v.string(),
      senderId: v.string(),
      content: v.string(),
      attachmentUrl: v.optional(v.string()),
      read: v.boolean(),
      createdAt: v.number(),
    })
      .index("by_project", ["projectId"])
      .index("by_sender", ["senderId"]),

    // ─── NEXORA CREATOR / REFERRAL PROGRAM ───

    // Approved marketing creators with their unique referral code. The
    // creator program is SEPARATE from marketplace roles: being a creator
    // never grants buyer/seller/employer/freelancer permissions.
    referralCreators: defineTable({
      userId: v.string(),
      referralCode: v.string(),
      displayName: v.string(),
      platform: v.union(
        v.literal("tiktok"),
        v.literal("whatsapp"),
        v.literal("instagram"),
        v.literal("youtube"),
        v.literal("x"),
        v.literal("facebook"),
        v.literal("other"),
      ),
      platformHandle: v.string(),
      audienceSize: v.optional(v.string()),
      promoPlan: v.string(),
      status: v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("suspended"),
        v.literal("rejected"),
      ),
      appliedAt: v.number(),
      reviewedAt: v.optional(v.number()),
      reviewedBy: v.optional(v.string()),
      reviewNotes: v.optional(v.string()),
      // Live counters (server-maintained by the referral engine — never
      // written by the client).
      clicks: v.optional(v.number()),
      registrations: v.optional(v.number()),
      verified: v.optional(v.number()),
      activeUsers: v.optional(v.number()),
      sellersReferred: v.optional(v.number()),
      freelancersReferred: v.optional(v.number()),
      transactionsGenerated: v.optional(v.number()),
      totalEarned: v.optional(v.number()),
      pendingCommission: v.optional(v.number()),
      paidCommission: v.optional(v.number()),
      fraudFlags: v.optional(v.array(v.string())),
    })
      .index("by_user", ["userId"])
      .index("by_code", ["referralCode"])
      .index("by_status", ["status"]),

    // Click tracking — one row per unique visitor per creator code. No PII:
    // visitorKey is a random device id generated client-side; referrerDomain
    // is coarse (hostname only).
    referralClicks: defineTable({
      creatorId: v.string(),
      code: v.string(),
      visitorKey: v.string(),
      referrerDomain: v.optional(v.string()),
      createdAt: v.number(),
    })
      .index("by_creator_visitor", ["creatorId", "visitorKey"])
      .index("by_creator", ["creatorId"])
      .index("by_created", ["createdAt"]),

    // The permanent creator → referred-user relationship. Written ONCE at
    // registration time by the server (never by the client) and immutable in
    // its attribution fields afterwards.
    referralRecords: defineTable({
      creatorId: v.string(),
      code: v.string(),
      referredUserId: v.string(),
      registeredAt: v.number(),
      // Journey: registered → verified → active → (seller|freelancer|employer) → transaction
      stage: v.union(
        v.literal("registered"),
        v.literal("verified"),
        v.literal("active"),
        v.literal("seller"),
        v.literal("freelancer"),
        v.literal("employer"),
        v.literal("transaction"),
      ),
      verifiedAt: v.optional(v.number()),
      activatedAt: v.optional(v.number()),
      kycVerifiedAt: v.optional(v.number()),
      sellerActivatedAt: v.optional(v.number()),
      freelancerActivatedAt: v.optional(v.number()),
      employerActivatedAt: v.optional(v.number()),
      firstTransactionAt: v.optional(v.number()),
      firstTransactionAmount: v.optional(v.number()),
      qualified: v.optional(v.boolean()),
      qualifiedAt: v.optional(v.number()),
      status: v.union(
        v.literal("pending"),
        v.literal("qualified"),
        v.literal("flagged"),
        v.literal("rejected"),
      ),
      flags: v.optional(v.array(v.string())),
      adminNotes: v.optional(v.string()),
      clickId: v.optional(v.string()),
    })
      .index("by_referred", ["referredUserId"])
      .index("by_creator", ["creatorId"])
      .index("by_status", ["status"]),

    // Commission ledger — every shilling a creator earns, with the reason it
    // was earned. Pending → approved → paid (or rejected by admin).
    referralEarnings: defineTable({
      creatorId: v.string(),
      referralId: v.optional(v.string()),
      referredUserId: v.optional(v.string()),
      type: v.union(
        v.literal("verified_user"),
        v.literal("seller_bonus"),
        v.literal("freelancer_bonus"),
        v.literal("employer_bonus"),
        v.literal("first_transaction"),
        v.literal("revenue_share"),
      ),
      amount: v.number(),
      currency: v.string(),
      reason: v.string(),
      status: v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("paid"),
        v.literal("rejected"),
      ),
      escrowId: v.optional(v.string()),
      txAmount: v.optional(v.number()),
      createdAt: v.number(),
      approvedAt: v.optional(v.number()),
      approvedBy: v.optional(v.string()),
      paidAt: v.optional(v.number()),
      payoutReference: v.optional(v.string()),
      rejectionReason: v.optional(v.string()),
      adjustedBy: v.optional(v.string()),
      adjustNote: v.optional(v.string()),
    })
      .index("by_creator", ["creatorId"])
      .index("by_status", ["status"])
      .index("by_referral", ["referralId"]),

    // Admin-configurable commission rules (singleton doc). Never hard-coded
    // in the engine — always read live from here.
    referralSettings: defineTable({
      fixedPerVerifiedUser: v.number(),
      sellerActivationBonus: v.number(),
      freelancerActivationBonus: v.number(),
      employerActivationBonus: v.optional(v.number()),
      firstTransactionBonus: v.number(),
      revenueSharePercent: v.number(),
      revenueShareCap: v.number(),
      maxReferralsPerHour: v.number(),
      updatedBy: v.optional(v.string()),
      updatedAt: v.optional(v.number()),
    }),

    // Freelance earnings/wallet
    freelanceEarnings: defineTable({
      freelancerId: v.string(),
      projectId: v.string(),
      milestoneId: v.optional(v.string()),
      amount: v.number(),
      currency: v.string(),
      fee: v.number(), // platform fee
      netAmount: v.number(),
      status: v.union(
        v.literal("pending"),
        v.literal("in_escrow"),
        v.literal("released"),
        v.literal("paid_out"),
      ),
      createdAt: v.number(),
      releasedAt: v.optional(v.number()),
    })
      .index("by_freelancer", ["freelancerId"])
      .index("by_project", ["projectId"]),

    // ─── LOCAL SERVICES & TRANSPORT (Kenya-first, simple English) ───────────

    // A local service provider (salon, plumber, mechanic, cleaner, …).
    // Prices are the provider's own; verification = business verification or
    // direct admin approval. No fake rows anywhere — created by real users.
    serviceProfiles: defineTable({
      userId: v.string(),
      displayName: v.string(),
      category: v.string(), // services.ts category slug e.g. "beauty", "home"
      serviceType: v.string(), // simple type e.g. "Salon", "Plumber"
      tagline: v.optional(v.string()),
      description: v.optional(v.string()),
      county: v.string(),
      town: v.string(),
      coverageAreas: v.optional(v.array(v.string())),
      serviceRadiusKm: v.optional(v.number()),
      pricingMode: v.union(
        v.literal("fixed"),
        v.literal("starting_from"),
        v.literal("quote"),
      ),
      basePrice: v.optional(v.number()),
      phone: v.optional(v.string()),
      whatsapp: v.optional(v.string()),
      availability: v.union(
        v.literal("available_now"),
        v.literal("busy"),
        v.literal("off"),
      ),
      workingHours: v.optional(v.string()),
      adminVerified: v.optional(v.boolean()),
      verificationNote: v.optional(v.string()),
      // Server-maintained stats only.
      ratingSum: v.optional(v.number()),
      ratingCount: v.optional(v.number()),
      completedJobs: v.optional(v.number()),
      views: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    })
      .index("by_user", ["userId"])
      .index("by_category", ["category"])
      .index("by_availability", ["availability"]),

    // A customer's request for a local service (escrow-protected booking).
    serviceRequests: defineTable({
      providerId: v.string(),
      providerUserId: v.string(),
      customerId: v.string(),
      category: v.string(),
      serviceType: v.string(),
      title: v.string(),
      description: v.optional(v.string()),
      location: v.optional(v.string()),
      county: v.optional(v.string()),
      town: v.optional(v.string()),
      amount: v.number(),
      currency: v.string(),
      status: v.union(
        v.literal("pending"),
        v.literal("funded"),
        v.literal("accepted"),
        v.literal("in_progress"),
        v.literal("completed"),
        v.literal("declined"),
        v.literal("cancelled"),
        v.literal("disputed"),
      ),
      customerFunded: v.optional(v.boolean()),
      providerAcceptedAt: v.optional(v.number()),
      startedAt: v.optional(v.number()),
      completedAt: v.optional(v.number()),
      declinedReason: v.optional(v.string()),
      cancelledBy: v.optional(v.string()),
      cancelReason: v.optional(v.string()),
      completionNote: v.optional(v.string()),
      payout: v.optional(v.number()),
      rating: v.optional(v.number()),
      ratedAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    })
      .index("by_customer", ["customerId"])
      .index("by_provider", ["providerId"])
      .index("by_provider_user", ["providerUserId"])
      .index("by_status", ["status"]),

    // Transport provider (Boda Boda, Matatu, Tuk-Tuk, Taxi, Delivery).
    transportProfiles: defineTable({
      userId: v.string(),
      displayName: v.string(),
      serviceType: v.union(
        v.literal("boda"),
        v.literal("matatu"),
        v.literal("tuktuk"),
        v.literal("taxi"),
        v.literal("delivery"),
      ),
      vehicleModel: v.optional(v.string()),
      plateNumber: v.optional(v.string()),
      licenseNumber: v.optional(v.string()),
      county: v.string(),
      town: v.string(),
      baseStage: v.optional(v.string()),
      routeCodes: v.optional(v.array(v.string())), // matatu routes served
      schedule: v.optional(v.string()), // matatu departure times (text)
      availability: v.union(
        v.literal("available_now"),
        v.literal("busy"),
        v.literal("off"),
      ),
      phone: v.optional(v.string()),
      idDocumentUrl: v.optional(v.string()),
      vehicleDocumentUrl: v.optional(v.string()),
      // Verification: identity + vehicle + regulatory — reviewed by admin.
      verificationStatus: v.union(
        v.literal("unverified"),
        v.literal("pending"),
        v.literal("verified"),
        v.literal("rejected"),
      ),
      verificationNote: v.optional(v.string()),
      ratingSum: v.optional(v.number()),
      ratingCount: v.optional(v.number()),
      completedTrips: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    })
      .index("by_user", ["userId"])
      .index("by_service_type", ["serviceType"])
      .index("by_availability", ["availability"])
      .index("by_verification", ["verificationStatus"]),

    // Matatu routes: stage-based fares, NOT on-demand pricing. fares[i] is
    // the cumulative fare from stages[0]; fare(A→B) = |fares[B] − fares[A]).
    transportRoutes: defineTable({
      name: v.string(),
      code: v.string(),
      stages: v.array(v.string()),
      fares: v.array(v.number()),
      notes: v.optional(v.string()),
      active: v.boolean(),
      updatedBy: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    })
      .index("by_code", ["code"]),

    // A transport trip. Fares are computed ONLY by the pricing engine from
    // admin-configured rules — no client/provider can set an arbitrary price.
    trips: defineTable({
      customerId: v.string(),
      providerId: v.optional(v.string()),
      providerUserId: v.optional(v.string()),
      serviceType: v.union(
        v.literal("boda"),
        v.literal("matatu"),
        v.literal("tuktuk"),
        v.literal("taxi"),
        v.literal("delivery"),
      ),
      pickup: v.string(),
      pickupPlace: v.optional(v.string()), // gazetteer key (exact fare math)
      destination: v.string(),
      destinationPlace: v.optional(v.string()),
      routeCode: v.optional(v.string()), // matatu
      fromStage: v.optional(v.string()),
      toStage: v.optional(v.string()),
      distanceKm: v.optional(v.number()),
      durationMin: v.optional(v.number()),
      fare: v.number(),
      currency: v.string(),
      fareBreakdown: v.optional(v.record(v.string(), v.number())),
      status: v.union(
        v.literal("requested"),
        v.literal("funded"),
        v.literal("accepted"),
        v.literal("arriving"),
        v.literal("in_progress"),
        v.literal("completed"),
        v.literal("cancelled"),
        v.literal("disputed"),
      ),
      customerFunded: v.optional(v.boolean()),
      requestedAt: v.number(),
      acceptedAt: v.optional(v.number()),
      startedAt: v.optional(v.number()),
      completedAt: v.optional(v.number()),
      cancelledAt: v.optional(v.number()),
      cancelledBy: v.optional(v.string()),
      cancelReason: v.optional(v.string()),
      emergencyAt: v.optional(v.number()),
      payout: v.optional(v.number()),
      rating: v.optional(v.number()),
      ratedAt: v.optional(v.number()),
      completionNote: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    })
      .index("by_customer", ["customerId"])
      .index("by_provider", ["providerId"])
      .index("by_provider_user", ["providerUserId"])
      .index("by_status", ["status"]),

    // Admin-configurable transport pricing rules (singleton). The fare engine
    // reads these live — never hard-coded, never client-settable.
    transportSettings: defineTable({
      baseFare: v.number(),
      pricePerKm: v.number(),
      pricePerMinute: v.number(),
      minimumFare: v.number(),
      routeFactor: v.number(), // straight-line × this ≈ road distance
      surgeEnabled: v.boolean(),
      maxSurgeMultiplier: v.number(),
      updatedAt: v.optional(v.number()),
      updatedBy: v.optional(v.string()),
    }),

    // ─── Phase 2: Community Requests (#88/#89) — demand-first matching ───
    // A buyer posts what they need; relevant providers/sellers respond with
    // offers; the buyer compares and picks. Converts demand into supply.
    communityRequests: defineTable({
      customerId: v.string(),
      title: v.string(),
      details: v.optional(v.string()),
      // "product" | "service" | "procurement" — procurement is the Nexora
      // Business channel: institutions post bulk needs, suppliers quote.
      kind: v.union(v.literal("product"), v.literal("service"), v.literal("procurement")),
      // Free-text quantity for bulk needs, e.g. "500 × 50kg bags".
      quantity: v.optional(v.string()),
      category: v.optional(v.string()),
      county: v.optional(v.string()),
      town: v.optional(v.string()),
      budget: v.optional(v.number()),
      neededBy: v.optional(v.string()), // "today", "this week", free text
      status: v.union(v.literal("open"), v.literal("awarded"), v.literal("closed")),
      awardedOfferId: v.optional(v.string()),
      offerCount: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    })
      .index("by_status", ["status"])
      .index("by_customer", ["customerId"]),

    requestOffers: defineTable({
      requestId: v.string(),
      // The responding seller/provider's user id.
      responderId: v.string(),
      responderName: v.string(),
      amount: v.number(),
      message: v.optional(v.string()),
      // Denormalized so the buyer sees verification at a glance (#89).
      responderVerified: v.optional(v.boolean()),
      status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("declined")),
      createdAt: v.number(),
    })
      .index("by_request", ["requestId"]),

    // ─── Phase 2: Recurring Orders (#65) — purchases that repeat ───
    // One opt-in record per product per buyer. Reminder ticks are computed
    // from nextOrderAt; reordering creates a REAL escrow order through the
    // existing wallet engine — never a fake statistic.
    recurringOrders: defineTable({
      userId: v.string(),
      listingId: v.string(),
      sellerId: v.string(),
      title: v.string(),
      unitPrice: v.number(),
      quantity: v.number(),
      frequency: v.union(v.literal("weekly"), v.literal("monthly")),
      active: v.boolean(),
      paused: v.optional(v.boolean()),
      lastOrderedAt: v.optional(v.number()),
      nextOrderAt: v.number(),
      orderCount: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    })
      .index("by_user", ["userId"])
      .index("by_next", ["nextOrderAt"]),

    // ─── Phase 2: Pickup Hubs (#71) — cut last-mile cost ───
    // Admin-managed collection points; orders can be marked "collect at hub"
    // instead of door delivery.
    pickupHubs: defineTable({
      name: v.string(),
      county: v.string(),
      town: v.string(),
      // Landmark-style directions (#72) — hubs are found by landmark in Kenya.
      landmark: v.optional(v.string()),
      directions: v.optional(v.string()),
      phone: v.optional(v.string()),
      hours: v.optional(v.string()),
      fee: v.optional(v.number()), // collection fee shown at checkout
      active: v.boolean(),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    })
      .index("by_active", ["active"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;

/** Helper: optional string validator (schema file has no top-level imports beyond convex/values usage). */
function vOptionalString() {
  return v.optional(v.string());
}
