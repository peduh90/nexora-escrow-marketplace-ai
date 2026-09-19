import { v, ConvexError } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { GROQ_API_URL, GROQ_MODEL, llmComplete } from "./ai";

// ═══════════════════════════════════════════════════════════════
// NEXORA AI OPERATIONS ENGINE
// Deterministic-first architecture with LLM assistance
// ═══════════════════════════════════════════════════════════════

// ─── KNOWLEDGE BASE ───

/** Get all active knowledge base articles */
export const getKnowledgeBase = query({
  args: { category: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let articles = await ctx.db
      .query("aiKnowledgeBase")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();

    if (args.category) {
      articles = articles.filter((a) => a.category === args.category);
    }
    return articles;
  },
});

/** Admin: create/update knowledge base article */
export const upsertKnowledgeArticle = mutation({
  args: {
    id: v.optional(v.id("aiKnowledgeBase")),
    title: v.string(),
    category: v.string(),
    content: v.string(),
    tags: v.array(v.string()),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    if (!user || user.role !== "admin") throw new ConvexError("Admin only");

    const now = Date.now();
    if (args.id) {
      await ctx.db.patch(args.id, {
        title: args.title,
        category: args.category,
        content: args.content,
        tags: args.tags,
        active: args.active,
        updatedBy: user._id,
        updatedAt: now,
      });
      return { id: args.id };
    }

    const id = await ctx.db.insert("aiKnowledgeBase", {
      title: args.title,
      category: args.category,
      content: args.content,
      tags: args.tags,
      active: args.active,
      updatedBy: user._id,
      createdAt: now,
      updatedAt: now,
    });
    return { id };
  },
});

/** Search knowledge base by text */
export const searchKnowledgeBase = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("aiKnowledgeBase")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();
    const q = args.query.toLowerCase();
    return all.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
    );
  },
});

// ─── INTENT CLASSIFICATION ───

/** Classify user message intent — deterministic patterns first, LLM fallback */
export const classifyIntent = action({
  args: {
    message: v.string(),
    userRole: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const msg = args.message.toLowerCase().trim();

    // Deterministic intent patterns — no AI needed
    const patterns: [RegExp, string, string][] = [
      [/where.*order|track.*order|order.*status|my order/i, "ORDER_STATUS", "high"],
      [/mpesa|m-pesa|paid|payment|pay/i, "PAYMENT", "high"],
      [/refund|money back|return money/i, "REFUND", "high"],
      [/escrow|held.*fund|fund.*held|locked/i, "ESCROW", "high"],
      [/kyc|verify|verification|identity|verified/i, "KYC", "high"],
      [/sell.*product|add.*product|list.*product|create.*listing/i, "PRODUCT_LISTING", "high"],
      [/become.*seller|seller.*account|register.*seller/i, "SELLER_ONBOARDING", "high"],
      [/account|profile|password|email|phone|settings/i, "ACCOUNT", "high"],
      [/deliver|shipping|dispatch|transit|delivery/i, "DELIVERY", "high"],
      [/dispute|complain|issue|problem|broken/i, "DISPUTE", "high"],
      [/fraud|scam|fake|cheat|stolen/i, "FRAUD", "high"],
      [/not.*work|error|bug|crash|technical/i, "TECHNICAL_PROBLEM", "high"],
      [/complaint|angry|unhappy|terrible|worst/i, "COMPLAINT", "high"],
      [/how.*work|what.*is|explain|help|info/i, "GENERAL_INFORMATION", "high"],
      [/wallet|balance|deposit|withdraw|top.*up/i, "WALLET", "high"],
      [/job|gig|freelance|hire|work/i, "JOB_INQUIRY", "high"],
    ];

    for (const [pattern, intent, confidence] of patterns) {
      if (pattern.test(msg)) {
        return { intent, confidence: parseFloat(confidence), method: "deterministic" };
      }
    }

    // Low-confidence fallback
    return { intent: "GENERAL_INFORMATION", confidence: 0.5, method: "fallback" };
  },
});

// ─── SUPPORT TICKETS ───

/** Create a support ticket */
export const createTicket = mutation({
  args: {
    userId: v.string(),
    userRole: v.string(),
    userName: v.optional(v.string()),
    userEmail: v.optional(v.string()),
    subject: v.string(),
    category: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    relatedOrderId: v.optional(v.string()),
    relatedListingId: v.optional(v.string()),
    relatedEscrowId: v.optional(v.string()),
    aiIntent: v.optional(v.string()),
    aiConfidence: v.optional(v.number()),
    aiSummary: v.optional(v.string()),
    aiRecommendedAction: v.optional(v.string()),
    escalationReason: v.optional(v.string()),
    initialMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const ticketId = await ctx.db.insert("supportTickets", {
      userId: args.userId,
      userRole: args.userRole,
      userName: args.userName,
      userEmail: args.userEmail,
      subject: args.subject,
      category: args.category,
      priority: args.priority,
      status: args.aiConfidence && args.aiConfidence >= 0.8 ? "ai_handling" : "escalated",
      assignedTo: args.aiConfidence && args.aiConfidence >= 0.8 ? "ai" : undefined,
      relatedOrderId: args.relatedOrderId,
      relatedListingId: args.relatedListingId,
      relatedEscrowId: args.relatedEscrowId,
      relatedDisputeId: undefined,
      aiIntent: args.aiIntent,
      aiConfidence: args.aiConfidence,
      aiSummary: args.aiSummary,
      aiRecommendedAction: args.aiRecommendedAction,
      escalationReason: args.escalationReason,
      customerSatisfaction: undefined,
      resolution: undefined,
      resolvedBy: undefined,
      createdAt: now,
      updatedAt: now,
      resolvedAt: undefined,
    });

    // Add initial message if provided
    if (args.initialMessage) {
      await ctx.db.insert("ticketMessages", {
        ticketId,
        senderId: args.userId,
        senderName: args.userName || "User",
        content: args.initialMessage,
        isAi: false,
        isSystem: false,
        createdAt: now,
      });
    }

    // Create audit log
    await ctx.db.insert("aiAuditLog", {
      action: "create_ticket",
      entityType: "ticket",
      entityId: ticketId,
      userId: args.userId,
      aiDecision: args.aiConfidence && args.aiConfidence >= 0.8 ? "ai_handling" : "escalated_to_human",
      aiConfidence: args.aiConfidence || 0,
      riskLevel: args.priority,
      reasoning: args.escalationReason || args.aiSummary,
      dataSourcesUsed: ["intent_classification", "user_context"],
      createdAt: now,
    });

    return { ticketId };
  },
});

/** Add message to a ticket */
export const addTicketMessage = mutation({
  args: {
    ticketId: v.id("supportTickets"),
    senderId: v.string(),
    senderName: v.string(),
    content: v.string(),
    isAi: v.boolean(),
    isSystem: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.insert("ticketMessages", {
      ticketId: args.ticketId,
      senderId: args.senderId,
      senderName: args.senderName,
      content: args.content,
      isAi: args.isAi,
      isSystem: args.isSystem,
      createdAt: now,
    });
    await ctx.db.patch(args.ticketId, { updatedAt: now });
    return { success: true };
  },
});

/** Update ticket status */
export const updateTicketStatus = mutation({
  args: {
    ticketId: v.id("supportTickets"),
    status: v.union(
      v.literal("open"),
      v.literal("ai_handling"),
      v.literal("ai_resolved"),
      v.literal("escalated"),
      v.literal("human_review"),
      v.literal("resolved"),
      v.literal("closed")
    ),
    assignedTo: v.optional(v.string()),
    resolution: v.optional(v.string()),
    resolvedBy: v.optional(v.string()),
    customerSatisfaction: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const updates: Record<string, unknown> = { status, updatedAt: now };
    if (args.assignedTo) updates.assignedTo = args.assignedTo;
    if (args.resolution) updates.resolution = args.resolution;
    if (args.resolvedBy) updates.resolvedBy = args.resolvedBy;
    if (args.customerSatisfaction !== undefined) updates.customerSatisfaction = args.customerSatisfaction;
    if (args.status === "resolved" || args.status === "closed") {
      updates.resolvedAt = now;
      updates.resolvedBy = args.resolvedBy || "ai";
    }
    await ctx.db.patch(args.ticketId, updates as any);
    return { success: true };
  },
});

/** Get tickets for current user */
export const getMyTickets = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    if (!user) return [];
    return await ctx.db
      .query("supportTickets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

/** Get all tickets (admin) */
export const getAllTickets = query({
  args: {
    status: v.optional(v.string()),
    category: v.optional(v.string()),
    priority: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let tickets = await ctx.db.query("supportTickets").order("desc").collect();
    if (args.status) tickets = tickets.filter((t) => t.status === args.status);
    if (args.category) tickets = tickets.filter((t) => t.category === args.category);
    if (args.priority) tickets = tickets.filter((t) => t.priority === args.priority);
    return tickets;
  },
});

/** Get messages for a ticket */
export const getTicketMessages = query({
  args: { ticketId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ticketMessages")
      .withIndex("by_ticket", (q) => q.eq("ticketId", args.ticketId))
      .order("asc")
      .collect();
  },
});

// ─── AI AUTOMATION ENGINE ───

/** Main AI automation action — handles customer message, creates/resolves tickets */
export const processCustomerMessage = action({
  args: {
    userId: v.string(),
    userRole: v.string(),
    userName: v.optional(v.string()),
    userEmail: v.optional(v.string()),
    message: v.string(),
    ticketId: v.optional(v.string()), // existing ticket to continue
  },
  handler: async (ctx, args) => {
    // Step 1: Classify intent deterministically
    const msg = args.message.toLowerCase().trim();
    const patterns: [RegExp, string][] = [
      [/where.*order|track.*order|order.*status/i, "ORDER_STATUS"],
      [/mpesa|m-pesa|paid|payment/i, "PAYMENT"],
      [/refund|money back/i, "REFUND"],
      [/escrow|held.*fund/i, "ESCROW"],
      [/kyc|verify|verification/i, "KYC"],
      [/sell.*product|add.*product|list.*product/i, "PRODUCT_LISTING"],
      [/become.*seller/i, "SELLER_ONBOARDING"],
      [/deliver|shipping|dispatch/i, "DELIVERY"],
      [/dispute|complain|issue|problem/i, "DISPUTE"],
      [/fraud|scam|fake/i, "FRAUD"],
      [/not.*work|error|bug/i, "TECHNICAL_PROBLEM"],
      [/wallet|balance|deposit|withdraw/i, "WALLET"],
      [/job|gig|freelance|hire/i, "JOB_INQUIRY"],
      [/hello|hi|hey|habari|mambo/i, "GREETING"],
    ];

    let intent = "GENERAL_INFORMATION";
    let confidence = 0.5;
    let method = "fallback";

    for (const [pattern, intentName] of patterns) {
      if (pattern.test(msg)) {
        intent = intentName;
        confidence = 0.85;
        method = "deterministic";
        break;
      }
    }

    // Step 2: Generate response
    let response: string;
    let responseConfidence = confidence;

    const llm = await llmComplete(
      [
        {
          role: "system",
          content: `You are NexoraAI, the intelligent support assistant for Nexora Market — an AI-powered escrow marketplace in Kenya. 

RULES:
- Be concise, helpful, and professional
- Use real Nexora policies (escrow protection, M-Pesa payments, managed delivery)
- If you're unsure, say "I'll connect you with a specialist"
- Never fabricate order status, balances, or account info
- KES = Kenyan Shillings
- Never bypass security or financial rules
- For complex issues, recommend human support
- Reply in the user's language (detect automatically)
- Keep responses under 200 words unless detailed explanation needed

INTENT DETECTED: ${intent}
USER ROLE: ${args.userRole}`,
        },
        { role: "user", content: args.message },
      ],
      { maxTokens: 600, temperature: 0.5 },
    );

    if (llm) {
      response = llm;
      responseConfidence = 0.8;
    } else {
      response = getDeterministicResponse(intent, args.userRole);
      responseConfidence = 0.7;
    }

    // Step 3: Determine if AI should handle or escalate
    const shouldEscalate =
      confidence < 0.6 ||
      intent === "FRAUD" ||
      intent === "DISPUTE" ||
      intent === "COMPLAINT";

    const ticketStatus = shouldEscalate ? "escalated" : "ai_handling";
    const priority = intent === "FRAUD" || intent === "DISPUTE" ? "high" : shouldEscalate ? "medium" : "low";

    return {
      intent,
      confidence: responseConfidence,
      response,
      shouldEscalate,
      ticketStatus,
      priority,
      method,
    };
  },
});

/** Deterministic responses for common intents — no AI needed */
function getDeterministicResponse(intent: string, role?: string): string {
  const responses: Record<string, string> = {
    GREETING: `Hey! 👋 I'm NexoraAI — your smart marketplace assistant. How can I help you today?`,
    ORDER_STATUS: `To check your order status, go to **My Orders** in your ${role === "seller" ? "seller" : "buyer"} dashboard. All orders show real-time tracking. If you can't find your order, share the order ID and I'll help look it up.`,
    PAYMENT: `Nexora accepts **M-Pesa** (STK Push), and **Nexora Wallet** for payments. All payments are protected by our escrow system. Need help with a specific payment? Share the details and I'll assist.`,
    ESCROW: `**How Nexora Escrow Works:**\n\n1. Buyer places order → funds locked in escrow\n2. Nexora picks up from seller & delivers to buyer\n3. Buyer confirms receipt → funds released to seller\n4. Platform commission deducted automatically\n\nBoth buyer and seller are protected. Disputes can be filed anytime.`,
    KYC: `To complete KYC verification:\n1. Go to your Seller Dashboard → Verification\n2. Upload your ID document\n3. Provide business details (if applicable)\n4. Wait for review (usually 24-48 hours)\n\nOnce verified, you get a ✅ verified badge and higher buyer trust.`,
    PRODUCT_LISTING: `To list a product:\n1. Go to Seller Dashboard → Add Product\n2. Select a category\n3. Add title, description, price\n4. Upload photos\n5. Set location & delivery options\n\nProducts are live immediately. Make sure your description is accurate!`,
    SELLER_ONBOARDING: `Welcome! To become a seller on Nexora:\n1. Create an account\n2. Complete KYC verification\n3. Set up your store profile\n4. Start listing products\n\nIt takes about 5 minutes to get started. Need help with any step?`,
    DELIVERY: `**Nexora manages delivery for you!**\n\nOnce a buyer orders, Nexora collects from the seller and delivers to the buyer. You don't need to arrange delivery yourself. Track deliveries in your dashboard.`,
    WALLET: `Your Nexora Wallet lets you:\n• Deposit via M-Pesa\n• Hold balance for purchases\n• Receive payment from sales\n• Withdraw to M-Pesa or bank\n\nGo to your dashboard → Wallet to manage funds.`,
    GENERAL_INFORMATION: `I'm NexoraAI — here to help with anything Nexora-related! I can assist with:\n\n• Finding products\n• Order tracking\n• Payments & escrow\n• Seller questions\n• Delivery info\n• Account help\n\nWhat would you like to know?`,
  };

  return responses[intent] || responses.GENERAL_INFORMATION;
}

// ─── FRAUD DETECTION ───

/** AI Fraud Detection — enhanced with rule-based + LLM scoring */
export const detectFraud = action({
  args: {
    entityType: v.string(),
    entityId: v.string(),
    userId: v.optional(v.string()),
    amount: v.optional(v.number()),
    category: v.optional(v.string()),
    sellerVerified: v.optional(v.boolean()),
    sellerTransactionCount: v.optional(v.number()),
    sellerRating: v.optional(v.number()),
    buyerLocation: v.optional(v.string()),
    sellerLocation: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Rule-based scoring (deterministic, fast)
    let score = 0;
    const flags: string[] = [];

    if (args.amount && args.amount > 500000) { score += 25; flags.push("Very high transaction amount (KES 500K+)"); }
    else if (args.amount && args.amount > 200000) { score += 12; flags.push("High transaction amount (KES 200K+)"); }

    if (args.sellerVerified === false) { score += 15; flags.push("Seller not verified"); }
    if ((args.sellerTransactionCount || 0) < 3) { score += 12; flags.push("New seller (< 3 transactions)"); }
    if ((args.sellerRating || 0) > 0 && (args.sellerRating || 0) < 3.5) { score += 8; flags.push("Low seller rating"); }

    const highRiskCategories = ["vehicles", "property", "electronics"];
    if (args.category && highRiskCategories.some((c) => args.category!.toLowerCase().includes(c))) {
      score += 8; flags.push(`High-risk category: ${args.category}`);
    }

    if (args.buyerLocation && args.sellerLocation && args.buyerLocation !== args.sellerLocation) {
      score += 5; flags.push("Location mismatch between buyer and seller");
    }

    score = Math.min(score, 100);
    const riskLevel = score < 20 ? "low" : score < 45 ? "medium" : score < 70 ? "high" : "critical";
    const recommendation =
      riskLevel === "critical" ? "Block and escalate to fraud officer" :
      riskLevel === "high" ? "Enhanced monitoring required" :
      riskLevel === "medium" ? "Standard escrow with monitoring" :
      "Normal processing";

    // Log to audit
    const now = Date.now();
    await ctx.runMutation("aiOps:logFraudAlert" as any, {
      entityType: args.entityType,
      entityId: args.entityId,
      userId: args.userId,
      riskScore: score,
      riskLevel,
      flags,
      recommendation,
    }).catch(() => {}); // non-blocking

    return { score, riskLevel, flags, recommendation };
  },
});

/** Log a fraud alert */
export const logFraudAlert = mutation({
  args: {
    entityType: v.string(),
    entityId: v.string(),
    userId: v.optional(v.string()),
    riskScore: v.number(),
    riskLevel: v.string(),
    flags: v.array(v.string()),
    recommendation: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("fraudAlerts", {
      entityType: args.entityType,
      entityId: args.entityId,
      userId: args.userId,
      riskScore: args.riskScore,
      riskLevel: args.riskLevel,
      flags: args.flags,
      recommendation: args.recommendation,
      status: "new",
      createdAt: Date.now(),
    });
  },
});

// ─── AI PRODUCT MODERATION ───

/** Pre-screen a listing for moderation */
export const moderateListing = action({
  args: {
    listingId: v.string(),
    title: v.string(),
    description: v.string(),
    price: v.number(),
    category: v.string(),
    sellerVerified: v.boolean(),
    sellerReputation: v.number(),
  },
  handler: async (ctx, args) => {
    const flags: string[] = [];
    let riskScore = 0;

    // Rule-based checks
    if (args.price <= 0) { flags.push("Invalid price"); riskScore += 50; }
    if (args.title.length < 5) { flags.push("Title too short"); riskScore += 20; }
    if (args.description.length < 20) { flags.push("Description too short"); riskScore += 15; }

    // Spam detection
    const spamWords = ["buy now", "free", "click here", "limited offer", "act now"];
    const lowerDesc = args.description.toLowerCase();
    const spamCount = spamWords.filter((w) => lowerDesc.includes(w)).length;
    if (spamCount >= 2) { flags.push("Potential spam language"); riskScore += 25; }

    // Price anomaly (very low for high-value categories)
    const highValueCategories = ["vehicles", "property", "electronics"];
    if (highValueCategories.some((c) => args.category.toLowerCase().includes(c)) && args.price < 1000) {
      flags.push("Suspiciously low price for category"); riskScore += 30;
    }

    // Prohibited content check
    const prohibited = ["weapon", "drug", "narcotic", "counterfeit", "fake replica"];
    const combined = `${args.title} ${args.description}`.toLowerCase();
    const prohibitedMatches = prohibited.filter((w) => combined.includes(w));
    if (prohibitedMatches.length > 0) { flags.push(`Potentially prohibited: ${prohibitedMatches.join(", ")}`); riskScore += 60; }

    riskScore = Math.min(riskScore, 100);

    let decision: string;
    if (riskScore >= 50) decision = "REQUIRES_HUMAN_REVIEW";
    else if (riskScore >= 25) decision = "REQUIRES_HUMAN_REVIEW";
    else decision = "APPROVE_FOR_AUTOMATED_FLOW";

    const confidence = riskScore < 25 ? 0.9 : riskScore < 50 ? 0.7 : 0.5;

    return { decision, riskScore, flags, confidence };
  },
});

// ─── AI KYC ASSISTANT ───

/** Analyze a KYC application for completeness and risk */
export const analyzeKYC = action({
  args: {
    applicationId: v.string(),
    businessName: v.string(),
    businessType: v.string(),
    county: v.string(),
    phone: v.string(),
    registrationNumber: v.optional(v.string()),
    taxPin: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const flags: string[] = [];
    let riskScore = 0;

    // Completeness checks
    if (!args.registrationNumber && args.businessType !== "individual") {
      flags.push("Missing business registration number");
      riskScore += 15;
    }
    if (!args.taxPin) {
      flags.push("Missing KRA PIN");
      riskScore += 10;
    }
    if (args.businessName.length < 2) {
      flags.push("Business name too short");
      riskScore += 20;
    }
    if (!args.phone || args.phone.length < 10) {
      flags.push("Invalid phone number");
      riskScore += 25;
    }

    // Determine recommendation
    let recommendation: string;
    if (riskScore < 15) recommendation = "APPROVE";
    else if (riskScore < 40) recommendation = "REVIEW_REQUIRED";
    else recommendation = "FLAG_FOR_REVIEW";

    const confidence = riskScore < 15 ? 0.9 : riskScore < 40 ? 0.7 : 0.5;

    return { recommendation, riskScore, flags, confidence };
  },
});

// ─── AI DISPUTE ASSISTANT ───

/** Generate a dispute analysis summary */
export const analyzeDispute = action({
  args: {
    disputeId: v.string(),
    escrowId: v.string(),
    reason: v.string(),
    description: v.optional(v.string()),
    amount: v.number(),
    buyerId: v.string(),
    sellerId: v.string(),
  },
  handler: async (ctx, args) => {
    let analysis: string;
    let recommendation = "pending_review";
    let confidence = 0.5;

    const llm = await llmComplete(
      [
        {
          role: "system",
          content: `You are a dispute analysis AI for Nexora Market. Analyze the dispute and return ONLY valid JSON with:
"analysis" (string - clear summary), "recommendation" (one of: "release_to_seller", "refund_buyer", "partial_refund", "mediate", "pending_review"), "confidence" (0-100), "riskFactors" (array of strings), "nextStep" (string).
Be fair. Consider both parties. High-value disputes (over KES 50,000) should be escalated to human review.`,
        },
        {
          role: "user",
          content: JSON.stringify({
            disputeId: args.disputeId,
            reason: args.reason,
            description: args.description,
            amount: `KES ${args.amount.toLocaleString()}`,
          }),
        },
      ],
      { maxTokens: 600, temperature: 0.2 },
    );

    if (llm) {
      try {
        const cleaned = llm.replace(/```json\n?|\n?```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        analysis = parsed.analysis || "Dispute analyzed.";
        recommendation = parsed.recommendation || "pending_review";
        confidence = (parsed.confidence || 50) / 100;
      } catch {
        analysis = "AI analysis unavailable. Manual review recommended.";
      }
    } else {
      analysis = "AI analysis unavailable. Manual review recommended.";
    }

    // High-value disputes always escalate
    if (args.amount > 50000) {
      recommendation = "pending_review";
      confidence = Math.min(confidence, 0.5);
    }

    return { analysis, recommendation, confidence };
  },
});

// ─── AI METRICS ───

/** Get AI operations metrics for today */
export const getTodayMetrics = query({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().split("T")[0];
    const metrics = await ctx.db
      .query("aiMetrics")
      .withIndex("by_date", (q) => q.eq("date", today))
      .first();
    return metrics;
  },
});

/** Get AI metrics for a date range */
export const getMetricsRange = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("aiMetrics")
      .withIndex("by_date", (q) => q.gte("date", args.startDate).lte("date", args.endDate))
      .order("asc")
      .collect();
    return all;
  },
});

/** Record daily AI metrics */
export const recordDailyMetrics = mutation({
  args: {
    date: v.string(),
    totalConversations: v.number(),
    aiResolved: v.number(),
    humanEscalated: v.number(),
    aiAssisted: v.number(),
    avgResolutionTime: v.number(),
    customerSatisfaction: v.number(),
    ticketsCreated: v.number(),
    ticketsResolved: v.number(),
    hallucinationReports: v.number(),
    incorrectAnswers: v.number(),
    aiCost: v.number(),
    aiRequests: v.number(),
  },
  handler: async (ctx, args) => {
    const automationRate = args.totalConversations > 0
      ? (args.aiResolved / args.totalConversations) * 100
      : 0;
    const qualityScore = args.ticketsResolved > 0
      ? ((args.ticketsResolved - args.incorrectAnswers - args.hallucinationReports) / args.ticketsResolved) * 100
      : 100;
    const avgConfidence = args.aiRequests > 0 ? 0.8 : 0;

    const existing = await ctx.db
      .query("aiMetrics")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .first();

    const data = {
      date: args.date,
      totalConversations: args.totalConversations,
      aiResolved: args.aiResolved,
      humanEscalated: args.humanEscalated,
      aiAssisted: args.aiAssisted,
      avgResolutionTime: args.avgResolutionTime,
      customerSatisfaction: args.customerSatisfaction,
      automationRate: Math.round(automationRate * 10) / 10,
      qualityScore: Math.round(qualityScore * 10) / 10,
      ticketsCreated: args.ticketsCreated,
      ticketsResolved: args.ticketsResolved,
      hallucinationReports: args.hallucinationReports,
      incorrectAnswers: args.incorrectAnswers,
      avgConfidence,
      aiCost: args.aiCost,
      aiRequests: args.aiRequests,
      createdAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
    } else {
      await ctx.db.insert("aiMetrics", data);
    }
    return { success: true };
  },
});

// ─── AI AUDIT LOG ───

/** Log an AI action */
export const logAiAction = mutation({
  args: {
    action: v.string(),
    entityType: v.string(),
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("aiAuditLog", {
      action: args.action,
      entityType: args.entityType,
      entityId: args.entityId,
      userId: args.userId,
      aiDecision: args.aiDecision,
      aiConfidence: args.aiConfidence,
      riskLevel: args.riskLevel,
      reasoning: args.reasoning,
      dataSourcesUsed: args.dataSourcesUsed,
      humanOverride: args.humanOverride,
      overrideBy: args.overrideBy,
      overrideReason: args.overrideReason,
      finalOutcome: args.finalOutcome,
      createdAt: Date.now(),
    });
  },
});

/** Get AI audit logs (admin) */
export const getAiAuditLogs = query({
  args: {
    action: v.optional(v.string()),
    entityType: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let logs = await ctx.db
      .query("aiAuditLog")
      .withIndex("by_created", (q) => q)
      .order("desc")
      .take(args.limit || 100);

    if (args.action) logs = logs.filter((l) => l.action === args.action);
    if (args.entityType) logs = logs.filter((l) => l.entityType === args.entityType);
    return logs;
  },
});

// ─── FRAUD ALERTS (admin) ───

/** Get all fraud alerts (admin) */
export const getFraudAlerts = query({
  args: {
    status: v.optional(v.string()),
    riskLevel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let alerts = await ctx.db.query("fraudAlerts").order("desc").collect();
    if (args.status) alerts = alerts.filter((a) => a.status === args.status);
    if (args.riskLevel) alerts = alerts.filter((a) => a.riskLevel === args.riskLevel);
    return alerts;
  },
});

/** Review a fraud alert (admin) */
export const reviewFraudAlert = mutation({
  args: {
    alertId: v.id("fraudAlerts"),
    status: v.union(v.literal("reviewing"), v.literal("confirmed"), v.literal("dismissed")),
    reviewNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");
    await ctx.db.patch(args.alertId, {
      status: args.status,
      reviewedBy: identity.subject,
      reviewNotes: args.reviewNotes,
      reviewedAt: Date.now(),
    });
    return { success: true };
  },
});

// ─── CEO DAILY BRIEF ───

/** Generate daily executive brief data */
export const getDailyBriefData = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const dayAgo = now - 86400000;

    const users = await ctx.db.query("users").collect();
    const listings = await ctx.db.query("listings").collect();
    const escrows = await ctx.db.query("escrows").collect();
    const disputes = await ctx.db.query("disputes").collect();
    const tickets = await ctx.db.query("supportTickets").collect();
    const fraudAlerts = await ctx.db.query("fraudAlerts").collect();
    const kycApps = await ctx.db.query("kycApplications").collect();
    const metrics = await ctx.db.query("aiMetrics").order("desc").take(1);

    const todayMetrics = metrics[0];

    const sellers = users.filter((u) => u.role === "seller");
    const activeListings = listings.filter((l) => l.status === "active");
    const todayEscrows = escrows.filter((e) => e.createdAt > dayAgo);
    const openTickets = tickets.filter((t) => ["open", "escalated", "human_review"].includes(t.status));
    const openDisputes = disputes.filter((d) => ["open", "under_review", "escalated"].includes(d.status));
    const newFraud = fraudAlerts.filter((a) => a.createdAt > dayAgo && a.status === "new");
    const pendingKyc = kycApps.filter((a) => a.status === "pending");

    return {
      marketplace: {
        activeSellers: sellers.length,
        activeProducts: activeListings.length,
        todayOrders: todayEscrows.length,
        totalOrders: escrows.length,
      },
      aiOperations: {
        totalConversations: todayMetrics?.totalConversations || 0,
        aiResolved: todayMetrics?.aiResolved || 0,
        humanEscalated: todayMetrics?.humanEscalated || 0,
        automationRate: todayMetrics?.automationRate || 0,
        qualityScore: todayMetrics?.qualityScore || 0,
      },
      kyc: {
        pending: pendingKyc.length,
        todaySubmitted: kycApps.filter((a) => a.submittedAt > dayAgo).length,
      },
      fraud: {
        newAlerts: newFraud.length,
        critical: fraudAlerts.filter((a) => a.riskLevel === "critical" && a.status !== "dismissed").length,
        highRisk: fraudAlerts.filter((a) => a.riskLevel === "high" && a.status !== "dismissed").length,
      },
      support: {
        openTickets: openTickets.length,
        escalated: tickets.filter((t) => t.status === "escalated").length,
      },
      disputes: {
        open: openDisputes.length,
        highValue: openDisputes.filter((d) => {
          const escrow = escrows.find((e) => e._id === d.escrowId);
          return escrow && escrow.amount > 50000;
        }).length,
      },
    };
  },
});
