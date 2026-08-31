import { action, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * AI Chat Assistant — Nexora Market AI
 * Handles buyer/seller/admin queries about escrow, payments, delivery, disputes, etc.
 */
export const chat = action({
  args: {
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      })
    ),
    userRole: v.optional(v.string()),
    context: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return "AI assistant is not configured yet. Please add your OpenAI API key to the environment variables. You can get one from https://platform.openai.com/api-keys";
    }

    const systemPrompt = `You are NexoraAI, the intelligent assistant for Nexora Market — Kenya's most trusted AI-powered escrow marketplace.

CORE RULES:
- Always be helpful, professional, and concise
- Only provide information about Nexora Market's features and services
- Never make up features that don't exist
- Always recommend using escrow for safety
- For financial/transaction issues, direct users to contact support
- For technical issues, suggest checking the relevant panel section

PLATFORM FEATURES YOU KNOW:
- Escrow Protection: Funds held securely until buyer confirms delivery
- AI Fraud Detection: Real-time ML risk scoring on every transaction
- Platform-Managed Delivery: Nexora handles all delivery logistics
- M-Pesa Integration: STK Push payments via Safaricom
- Seller Verification (KYC): Business and identity verification
- Dispute Resolution: AI-assisted evidence review
- Wallet System: Deposit, withdraw, send funds
- Job Board: Post and apply for jobs/services
- Multi-vendor Marketplace: Buy and sell across Kenya

TRANSACTION FLOW:
1. Buyer searches/browses products
2. Buyer places order → funds locked in escrow
3. Nexora collects product from seller
4. Nexora delivers to buyer
5. Buyer confirms receipt → funds released to seller
6. Platform commission deducted (2.5-5%)

PAYMENT METHODS:
- M-Pesa (primary, via Daraja API STK Push)
- Credit/Debit Card (Stripe)
- Nexora Wallet

DELIVERY:
- All delivery managed by Nexora Market
- Sellers do NOT control delivery
- Buyers select delivery location
- System calculates delivery fee automatically
- Free delivery available in some zones (Nairobi CBD, Westlands)

ESCROW:
- Funds held until buyer confirms delivery
- 3% platform commission
- Disputes can be opened if issues arise
- Admin reviews disputes with AI assistance

FEES:
- Transaction commission: 2.5-5%
- Escrow fee: 0.5-2%
- Delivery fee: calculated by location
- Premium seller subscriptions available

SECURITY:
- KYC verification for sellers
- AI fraud detection on all transactions
- Encrypted payments
- Secure escrow system
- Platform-managed delivery (no direct buyer-seller cash)

${args.userRole ? `Current user role: ${args.userRole}` : ""}
${args.context ? `Additional context: ${args.context}` : ""}

Be helpful but keep responses concise (2-4 sentences max unless explaining something complex).`;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            ...args.messages,
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("OpenAI API error:", errorData);
        return "I'm experiencing technical difficulties. Please try again in a moment.";
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";
    } catch (error) {
      console.error("AI chat error:", error);
      return "I'm temporarily unavailable. Please try again later.";
    }
  },
});

/**
 * AI Product Recommendations — suggest products based on user activity
 */
export const getRecommendations = action({
  args: {
    recentSearches: v.optional(v.array(v.string())),
    recentCategories: v.optional(v.array(v.string())),
    budget: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return [
        "Electronics & Gadgets",
        "Fashion & Clothing",
        "Home & Furniture",
        "Phones & Tablets",
        "Vehicles",
        "Agriculture",
      ];
    }

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a product recommendation engine for Nexora Market, a Kenyan marketplace. 
Given user activity, suggest 6 relevant product categories or search terms.
Return ONLY a JSON array of strings, no other text. Example: ["Laptops", "Phones", "Fashion"]`,
            },
            {
              role: "user",
              content: JSON.stringify({
                recentSearches: args.recentSearches || [],
                recentCategories: args.recentCategories || [],
                budget: args.budget,
                market: "Kenya",
                currency: "KES",
              }),
            },
          ],
          max_tokens: 200,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        return ["Electronics", "Fashion", "Phones", "Home", "Vehicles", "Agriculture"];
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "[]";
      const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
      return JSON.parse(cleaned);
    } catch {
      return ["Electronics", "Fashion", "Phones", "Home", "Vehicles", "Agriculture"];
    }
  },
});

/**
 * AI Fraud Detection — score a transaction for risk
 */
export const scoreTransaction = action({
  args: {
    sellerId: v.string(),
    amount: v.number(),
    productCategory: v.string(),
    buyerLocation: v.optional(v.string()),
    sellerLocation: v.optional(v.string()),
    sellerTransactionCount: v.optional(v.number()),
    sellerRating: v.optional(v.number()),
    sellerVerified: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENAI_API_KEY;
    
    // If no AI key, use rule-based scoring
    if (!apiKey) {
      return ruleBasedFraudScore(args);
    }

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a fraud detection system for Nexora Market, a Kenyan escrow marketplace.
Analyze the transaction and return a JSON object with:
- "score": number 0-100 (0=low risk, 100=high risk)
- "level": "low" | "medium" | "high" | "critical"
- "flags": array of risk flags (strings)
- "recommendation": short action recommendation
- "reason": brief explanation

Risk factors to consider:
- Very high amounts without verification
- Unverified sellers
- New accounts with large transactions
- Location mismatches
- Category-specific fraud patterns (electronics, vehicles high-risk)
- Low seller ratings

Return ONLY valid JSON, no other text.`,
            },
            {
              role: "user",
              content: JSON.stringify({
                amount: args.amount,
                category: args.productCategory,
                buyerLocation: args.buyerLocation,
                sellerLocation: args.sellerLocation,
                sellerTransactions: args.sellerTransactionCount || 0,
                sellerRating: args.sellerRating || 0,
                sellerVerified: args.sellerVerified || false,
                currency: "KES",
              }),
            },
          ],
          max_tokens: 300,
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        return ruleBasedFraudScore(args);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "{}";
      const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
      return JSON.parse(cleaned);
    } catch {
      return ruleBasedFraudScore(args);
    }
  },
});

/**
 * Rule-based fraud scoring fallback (no API key needed)
 */
function ruleBasedFraudScore(args: {
  amount: number;
  sellerTransactionCount?: number;
  sellerRating?: number;
  sellerVerified?: boolean;
  productCategory: string;
  buyerLocation?: string;
  sellerLocation?: string;
}) {
  let score = 0;
  const flags: string[] = [];

  // Amount-based risk
  if (args.amount > 500000) { score += 30; flags.push("Very high transaction amount (KES 500K+)"); }
  else if (args.amount > 200000) { score += 15; flags.push("High transaction amount (KES 200K+)"); }
  else if (args.amount > 100000) { score += 5; flags.push("Moderate transaction amount"); }

  // Seller verification
  if (!args.sellerVerified) { score += 20; flags.push("Seller not KYC verified"); }
  
  // Seller history
  if ((args.sellerTransactionCount || 0) < 3) { score += 15; flags.push("New seller with few transactions"); }
  if ((args.sellerRating || 0) < 3.5 && (args.sellerRating || 0) > 0) { score += 10; flags.push("Low seller rating"); }

  // Category risk
  const highRiskCategories = ["Vehicles", "Property", "Electronics"];
  if (highRiskCategories.some(c => args.productCategory.toLowerCase().includes(c.toLowerCase()))) {
    score += 10; flags.push(`High-risk category: ${args.productCategory}`);
  }

  // Location mismatch
  if (args.buyerLocation && args.sellerLocation && args.buyerLocation !== args.sellerLocation) {
    score += 5; flags.push("Buyer and seller in different locations");
  }

  // Cap at 100
  score = Math.min(score, 100);

  let level: "low" | "medium" | "high" | "critical";
  if (score < 20) level = "low";
  else if (score < 45) level = "medium";
  else if (score < 70) level = "high";
  else level = "critical";

  const recommendation = level === "critical"
    ? "Block transaction and require manual review"
    : level === "high"
    ? "Enable enhanced escrow protection and verify seller identity"
    : level === "medium"
    ? "Standard escrow protection recommended"
    : "Transaction appears safe — proceed with standard escrow";

  return {
    score,
    level,
    flags,
    recommendation,
    reason: flags.length > 0
      ? `${flags.length} risk factor(s) detected: ${flags.slice(0, 3).join("; ")}`
      : "No significant risk factors detected",
  };
}

/**
 * Get AI-generated dispute resolution recommendation
 */
export const resolveDispute = action({
  args: {
    disputeType: v.string(),
    buyerClaim: v.string(),
    sellerResponse: v.optional(v.string()),
    amount: v.number(),
    evidence: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return {
        recommendation: "pending_review",
        reasoning: "AI assistant not configured. A human admin will review this dispute.",
        suggestedAction: "Admin review required",
      };
    }

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are an AI dispute resolution assistant for Nexora Market, a Kenyan escrow marketplace.
Analyze the dispute and recommend a fair resolution.

Return a JSON object with:
- "recommendation": "release_to_seller" | "refund_buyer" | "partial_refund" | "pending_review" | "mediate"
- "reasoning": detailed explanation
- "suggestedAction": specific action to take
- "confidence": number 0-100
- "riskFactors": array of factors considered

Consider:
- Product description vs buyer claim
- Evidence provided
- Transaction amount
- Seller/buyer history
- Platform policies
- Fairness to both parties

Return ONLY valid JSON.`,
            },
            {
              role: "user",
              content: JSON.stringify({
                type: args.disputeType,
                buyerClaim: args.buyerClaim,
                sellerResponse: args.sellerResponse,
                amount: args.amount,
                evidence: args.evidence,
              }),
            },
          ],
          max_tokens: 500,
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        return {
          recommendation: "pending_review",
          reasoning: "AI analysis unavailable. Admin review recommended.",
          suggestedAction: "Manual review required",
          confidence: 0,
        };
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "{}";
      const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
      return JSON.parse(cleaned);
    } catch {
      return {
        recommendation: "pending_review",
        reasoning: "AI analysis failed. Admin review recommended.",
        suggestedAction: "Manual review required",
        confidence: 0,
      };
    }
  },
});

/**
 * Admin: Get AI insights about platform health
 */
export const getPlatformInsights = query({
  args: {},
  handler: async (ctx) => {
    // This provides static insights — real-time would use actions
    return {
      tips: [
        "Monitor escrow hold times — releases over 7 days may indicate delivery issues",
        "Track seller verification rates — unverified sellers have 3x higher dispute rates",
        "Watch for rapid price changes on high-value items — potential fraud indicator",
        "Review flagged transactions weekly for patterns",
        "Maintain delivery zone pricing — review quarterly based on logistics costs",
      ],
      alerts: [],
    };
  },
});
