"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

/**
 * NEXORA AI — Core Chat Engine
 * Advanced AI assistant with intent understanding, multilingual, voice, marketplace integration
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
      return getSmartFallback(args.messages[args.messages.length - 1]?.content || "", args.userRole);
    }

    const systemPrompt = `You are NEXORA AI — the intelligent copilot of Nexora Market, Kenya's #1 AI-powered escrow marketplace.

## CORE IDENTITY
- You are a helpful, conversational, intelligent marketplace assistant
- You understand typos, slang, mixed languages, incomplete sentences, and informal speech
- You respond naturally — never robotic, never overly formal
- You guide users instead of making them figure things out
- You are proactive — suggest next steps and actions
- Keep responses SHORT (2-4 sentences) unless explaining something complex
- Use emojis sparingly but naturally (👍, ✅, 🔍, 💡)

## LANGUAGE SUPPORT
- Detect language automatically and respond in the same language
- Support: English, Swahili, mixed (Sheng), French, Spanish, Arabic
- Mixed language examples: "Naweza kupata laptop ya cheap chini ya 30k?" → understand naturally
- Swahili examples: "Natafuta simu chini ya elfu ishirini" → "Looking for a phone under KSh 20,000"
- Always respond in the user's language unless they ask otherwise

## UNDERSTANDING IMPERFECT INPUT
- "lapto" → laptop, "iphne" → iPhone, "sumsung" → Samsung
- "delivary" → delivery, "recieve" → receive, "chep" → cheap
- "am loking for" → "I'm looking for"
- Understand intent even with bad spelling: "i need lapto for programming under 30k"
- Correct naturally without pointing out mistakes

## PLATFORM KNOWLEDGE
Nexora Market features:
- ESCROW: Funds held until buyer confirms delivery. 2.5-5% commission. Protects both parties.
- PAYMENTS: M-Pesa (STK Push via Daraja API), Credit/Debit Card (Stripe), Nexora Wallet
- DELIVERY: Fully managed by Nexora. Sellers don't control delivery. Buyers select location. System calculates fee. Free delivery in Nairobi CBD, Westlands.
- SELLERS: Must complete KYC verification. Get verified badge. Can list products, manage orders, withdraw earnings.
- BUYERS: Browse, search, buy with escrow protection. Track orders. Open disputes if needed.
- DISPUTES: AI-assisted resolution. Evidence review. Fair outcomes.
- FEES: Transaction commission 2.5-5%, Escrow fee 0.5-2%, Delivery varies by location
- WALLET: Deposit via M-Pesa, hold balance, withdraw to M-Pesa or bank
- JOBS: Post and apply for job/service requests
- CATEGORIES: Vehicles, Property, Phones & Tablets, Electronics, Home & Furniture, Fashion, Beauty, Services, Agriculture, Jobs

## TRANSACTION FLOW
1. Buyer searches/browses → selects product
2. Buyer chats with seller, negotiates price
3. Buyer places order → funds locked in escrow
4. Nexora collects from seller → delivers to buyer
5. Buyer confirms receipt → funds released to seller
6. Platform commission deducted automatically

## AI CAPABILITIES
You can help with:
- Product search and recommendations
- Price analysis and negotiation advice
- Order tracking and status
- Payment guidance (M-Pesa, cards, wallet)
- Escrow explanation
- Delivery information
- Dispute assistance
- Seller verification help
- Account and wallet management
- Platform navigation
- Compare products
- Find deals and alternatives

## RESPONSE STYLE
- Be direct and helpful
- Use structured responses for complex topics:
  - ANSWER: Direct answer
  - WHY: Brief reasoning
  - OPTIONS: 2-5 choices (if applicable)
  - NEXT STEP: One clear action
- For product searches: show top 3-5 with reasoning, not 50 results
- For price questions: give assessment (Good Deal / Fair Price / Above Average / Overpriced)
- For "what should I buy": ask minimum follow-ups, give recommendation

## PROACTIVE HELP
- If user seems lost, suggest relevant actions
- If they mention a problem, offer to help resolve it
- If they're browsing, suggest related products or categories
- Surface useful alerts: "You have 2 orders awaiting confirmation"

## SAFETY RULES
- Never fabricate products, prices, or data
- Never promise seller will accept an offer
- Never execute sensitive actions without confirmation
- Direct complex issues to human support
- Never reveal API keys, credentials, or internal system details
- Financial data always comes from the backend, never invented

## CONVERSATION MEMORY
- Remember context from earlier in the conversation
- If user says "find laptops" then "under 30k" → understand the budget applies to laptops
- If user says "which is better?" → refer to previously discussed items
- Don't make users repeat themselves

## FORMAT EXAMPLES
User: "find me a phone under 20k"
AI: "🔍 I'll help you find a phone under KSh 20,000. Here are the best options on Nexora right now:\n\n1. **Samsung Galaxy A15** — KSh 15,500 ⭐ 4.6 | Verified Seller\n2. **Infinix Hot 40** — KSh 12,800 ⭐ 4.4 | Delivery Available\n3. **Tecno Spark 20** — KSh 13,200 ⭐ 4.5 | Escrow Protected\n\nWant me to compare any of these, or filter by a specific brand?\n\n💡 **My pick:** Samsung Galaxy A15 — best camera and update support for the price."

User: "nataka laptop poa ya coding around 30k"
AI: "Nimekupata 👍 Unatafuta laptop nzuri ya coding around KSh 30,000. For coding, you need at least 8GB RAM, SSD storage, and a decent processor.\n\nBest options on Nexora:\n1. **HP EliteBook 840 G3** — KSh 22,000 | i7, 8GB, 256GB SSD ⭐ 4.8\n2. **Lenovo ThinkPad T480** — KSh 28,000 | i5 8th Gen, 8GB, 256GB SSD ⭐ 4.7\n3. **Dell Latitude 5490** — KSh 25,000 | i5, 8GB, 256GB SSD ⭐ 4.6\n\n💡 **My pick:** Lenovo ThinkPad — best keyboard for coding and great build quality.\n\nUnataka nikucompare hizi au una brand preference?";

${args.userRole ? `Current user role: ${args.userRole}` : "User role: visitor"}
${args.context ? `Context: ${args.context}` : ""}

IMPORTANT: Keep responses concise. Use markdown formatting for readability. Always be helpful and natural.`;

    // Try API with retry
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        if (attempt > 0) await new Promise(r => setTimeout(r, 3000));

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
            max_tokens: 800,
            temperature: 0.7,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) return content;
        }

        // If rate limited on last attempt, fall through to fallback
        if (response.status === 429 && attempt === 0) continue;
        break;
      } catch (error) {
        console.error("AI chat error:", error);
        break;
      }
    }

    // Smart fallback
    return getSmartFallback(args.messages[args.messages.length - 1]?.content || "", args.userRole);
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
    if (!apiKey) return ruleBasedFraudScore(args);

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        if (attempt > 0) await new Promise(r => setTimeout(r, 2000));

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `You are a fraud detection system for Nexora Market, a Kenyan escrow marketplace. Analyze the transaction and return ONLY valid JSON with: "score" (0-100), "level" ("low"/"medium"/"high"/"critical"), "flags" (array of strings), "recommendation" (string), "reason" (string). Risk factors: high amounts, unverified sellers, new accounts, location mismatches, high-risk categories (electronics, vehicles).`,
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
                }),
              },
            ],
            max_tokens: 300,
            temperature: 0.1,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content || "{}";
          const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
          return JSON.parse(cleaned);
        }
      } catch {}
    }
    return ruleBasedFraudScore(args);
  },
});

/**
 * AI Price Analysis
 */
export const analyzePrice = action({
  args: {
    productTitle: v.string(),
    price: v.number(),
    category: v.string(),
    condition: v.optional(v.string()),
    sellerRating: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return { assessment: "fair", reasoning: "AI pricing analysis not available. Check similar listings on Nexora." };

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a price analysis AI for Nexora Market (Kenyan marketplace, KES currency). Analyze if a product price is fair. Return ONLY valid JSON: "assessment" ("great_deal"/"good_deal"/"fair_price"/"above_average"/"overpriced"), "reasoning" (string), "estimatedRange" (string like "KSh 15,000 - 25,000"), "tips" (array of strings). Consider: Kenyan market prices, product condition, seller reputation, specifications.`,
            },
            {
              role: "user",
              content: JSON.stringify(args),
            },
          ],
          max_tokens: 300,
          temperature: 0.2,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "{}";
        const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
        return JSON.parse(cleaned);
      }
    } catch {}
    return { assessment: "fair", reasoning: "AI pricing analysis unavailable. Compare with similar listings on Nexora.", estimatedRange: "Check marketplace", tips: [] };
  },
});

/**
 * AI Dispute Resolution
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
      return { recommendation: "pending_review", reasoning: "AI not configured. Admin review required.", suggestedAction: "Manual review", confidence: 0 };
    }

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a dispute resolution AI for Nexora Market. Analyze disputes fairly. Return ONLY valid JSON: "recommendation" ("release_to_seller"/"refund_buyer"/"partial_refund"/"pending_review"/"mediate"), "reasoning" (string), "suggestedAction" (string), "confidence" (0-100).`,
            },
            { role: "user", content: JSON.stringify(args) },
          ],
          max_tokens: 400,
          temperature: 0.2,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "{}";
        const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
        return JSON.parse(cleaned);
      }
    } catch {}
    return { recommendation: "pending_review", reasoning: "AI analysis unavailable.", suggestedAction: "Manual review", confidence: 0 };
  },
});

/**
 * Rule-based fraud scoring fallback
 */
function ruleBasedFraudScore(args: { amount: number; sellerTransactionCount?: number; sellerRating?: number; sellerVerified?: boolean; productCategory: string; buyerLocation?: string; sellerLocation?: string }) {
  let score = 0;
  const flags: string[] = [];
  if (args.amount > 500000) { score += 30; flags.push("Very high amount (KES 500K+)"); }
  else if (args.amount > 200000) { score += 15; flags.push("High amount (KES 200K+)"); }
  if (!args.sellerVerified) { score += 20; flags.push("Seller not verified"); }
  if ((args.sellerTransactionCount || 0) < 3) { score += 15; flags.push("New seller"); }
  if ((args.sellerRating || 0) < 3.5 && (args.sellerRating || 0) > 0) { score += 10; flags.push("Low seller rating"); }
  const highRisk = ["Vehicles", "Property", "Electronics"];
  if (highRisk.some(c => args.productCategory.toLowerCase().includes(c.toLowerCase()))) {
    score += 10; flags.push(`High-risk category: ${args.productCategory}`);
  }
  if (args.buyerLocation && args.sellerLocation && args.buyerLocation !== args.sellerLocation) {
    score += 5; flags.push("Location mismatch");
  }
  score = Math.min(score, 100);
  const level = score < 20 ? "low" : score < 45 ? "medium" : score < 70 ? "high" : "critical";
  const rec = level === "critical" ? "Block and review" : level === "high" ? "Enhanced escrow required" : level === "medium" ? "Standard escrow recommended" : "Proceed safely";
  return { score, level, flags, recommendation: rec, reason: flags.length > 0 ? `${flags.length} risk factor(s) detected` : "No significant risks" };
}

/**
 * Smart rule-based fallback when API is unavailable
 */
function getSmartFallback(input: string, role?: string): string {
  const q = input.toLowerCase();

  // Greeting
  if (q.match(/^(hi|hello|hey|sup|yo|habari|jambo|mambo)/)) {
    return role === "seller"
      ? "Hey! 👋 I'm your NexoraAI copilot. I can help you:\n\n• 📦 Create or improve product listings\n• 💰 Analyze your pricing\n• 📊 Understand your sales analytics\n• 🛒 Manage orders\n• 💡 Get selling tips\n\nWhat do you need help with?"
      : role === "admin"
      ? "Hello, Admin. 🛡️ NexoraAI command center active. I can help with:\n\n• 📊 Platform performance reports\n• 🚨 Risk and fraud alerts\n• ⚖️ Dispute resolution\n• 👥 Seller/buyer analytics\n• 💰 Revenue and payments\n\nWhat would you like to analyze?"
      : "Hey! 👋 I'm NexoraAI — your smart shopping assistant. I can help you find products, compare prices, track orders, or answer any question about Nexora Market.\n\nWhat are you looking for?";
  }

  // Escrow
  if (q.includes("escrow")) {
    return "🔒 **Escrow** is how Nexora keeps your money safe:\n\n1. You pay → funds locked in escrow\n2. Seller prepares → Nexora collects & delivers\n3. You confirm receipt → funds released to seller\n\nYour money is **never** sent directly to the seller until you're satisfied. If there's a problem, you can open a dispute.\n\n💡 **It's free to use** — the 2.5-5% commission covers escrow protection.";
  }

  // Payment / M-Pesa
  if (q.match(/pay|mpesa|m-pesa|payment|lipa/)) {
    return "💳 **Payment options on Nexora:**\n\n1. **M-Pesa** (most popular) — Enter your phone number at checkout, get an STK push, enter your PIN. Done!\n2. **Credit/Debit Card** — Visa & Mastercard accepted via Stripe\n3. **Nexora Wallet** — Deposit funds first, pay from wallet balance\n\n💡 M-Pesa is the fastest and most secure option for Kenya.";
  }

  // Delivery
  if (q.match(/deliver|ship|track|delivery|kufika/)) {
    return "🚚 **Nexora manages ALL delivery** — sellers don't handle it.\n\n• Choose your delivery location at checkout\n• System calculates fee (some areas get **FREE delivery!**)\n• Track your order in **My Orders** or **Deliveries**\n• All deliveries are **insured & GPS-tracked**\n\nFree delivery zones: Nairobi CBD, Westlands, and select areas.\n\nWant me to check delivery to a specific location?";
  }

  // Dispute / problem / report
  if (q.match(/dispute|problem|issue|report|complain|scam/)) {
    return "⚖️ **If you have a problem:**\n\n1. Go to **Disputes** in your dashboard\n2. Select the order and describe the issue\n3. Upload any evidence (photos, screenshots)\n4. Our AI + admin team reviews within 24-48 hours\n\nYou can also **report a seller** or **report a product** from their profile page.\n\n💡 Most disputes are resolved fairly through our AI-assisted review.";
  }

  // Sell / list / product
  if (q.match(/sell|list|product|kuuza|uzaji/)) {
    return "📦 **To sell on Nexora:**\n\n1. **Create a seller account** (choose 'I'm a Seller' at signup)\n2. **Complete KYC** — business name, type, and ID docs\n3. **Add your first product** — photos, price, category, location\n4. **Start selling!**\n\nNexora handles delivery, payments & escrow. You just provide the product.\n\n💡 **Pro tip:** Verified sellers get 3x more sales on average.";
  }

  // Wallet / balance / withdraw
  if (q.match(/wallet|balance|withdraw|pesa|pesa yangu/)) {
    return "💰 **Your Nexora Wallet:**\n\n• **Deposit** via M-Pesa (STK Push)\n• **Pay** for orders directly from wallet\n• **Withdraw** to M-Pesa or bank account\n• **Escrow funds** shown separately\n\nAll balances are real-time from the backend.\n\n💡 Withdrawals typically process within 24 hours.";
  }

  // Fees / commission / charge
  if (q.match(/fee|commission|charge|bei|gharama/)) {
    return "💳 **Nexora fees (transparent & fair):**\n\n• **Transaction commission:** 2.5-5%\n• **Escrow fee:** 0.5-2%\n• **Delivery fee:** Varies by location (FREE in some areas!)\n• **Seller subscriptions:** KES 999-4,999/month for premium features\n\n💡 **Buyers pay NO extra fees** — the listed price is what you pay.";
  }

  // Verify / KYC
  if (q.match(/verify|kyc|identity|certificate/)) {
    return "✅ **Seller verification (KYC):**\n\n1. Submit business name & type\n2. Upload identity document\n3. Review within 24-48 hours\n4. Get your **Verified Badge** ✓\n\nVerified sellers get:\n• Higher visibility in search\n• Trust badge on listings\n• 3x more sales on average\n• Lower commission rates";
  }

  // Refund
  if (q.match(/refund|return|back money|pesa yangu/)) {
    return "💰 **Refund process:**\n\n1. Open a dispute for the order\n2. Explain the issue + upload evidence\n3. AI + admin reviews the case\n4. If approved → funds returned to your wallet\n\n💡 Refunds go back to your Nexora wallet, not directly to M-Pesa. You can then withdraw.";
  }

  // Price / cheap / expensive / deal
  if (q.match(/price|cheap|expensive|deal|afford|bei|nafuu/)) {
    return "💡 I can help you find the best deals!\n\nTell me:\n• What product are you looking for?\n• What's your budget?\n• What location?\n\nI'll find the best options with the best value.\n\nOr ask me: \"Is this price fair?\" about any listing!";
  }

  // Compare
  if (q.match(/compare|better|difference|versus|vs/)) {
    return "🔍 I can compare products for you!\n\nTell me:\n• Which products do you want to compare?\n• Or share the product names/links\n\nI'll compare price, specs, seller rating, delivery, and value — then recommend the best one for you.";
  }

  // Track order
  if (q.match(/where.*order|track.*order|my order|order.*status|iliwahi/)) {
    return "📦 **To track your order:**\n\n1. Go to **My Orders** in your dashboard\n2. Find the order and click **Track**\n3. See real-time status updates\n\nOr just tell me the order number and I'll look it up for you!";
  }

  // Help
  if (q.match(/help|assist|support|support|msaada/)) {
    return "🤝 **I can help you with:**\n\n🔍 **Search** — \"Find me a laptop under 30k\"\n💰 **Pricing** — \"Is this price fair?\"\n📦 **Orders** — \"Where is my order?\"\n🚚 **Delivery** — \"Track my delivery\"\n💳 **Payments** — \"How do I pay?\"\n⚖️ **Disputes** — \"I have a problem with my order\"\n📦 **Selling** — \"How do I start selling?\"\n💡 **Advice** — \"What should I buy?\"\n\nJust ask naturally — I understand typos, slang, and mixed languages!";
  }

  // Thank you
  if (q.match(/thank|asante|shukran|cheers/)) {
    return "You're welcome! 😊 Is there anything else I can help you with?";
  }

  // Default fallback — helpful
  return `I'm NexoraAI, your marketplace assistant! 💡\n\nI can help with:\n\n• 🔍 **Search** — "Find me a phone under 20k"\n• 💰 **Prices** — "Is this laptop worth 25k?"\n• 📦 **Orders** — "Where is my order?"\n• 🚚 **Delivery** — "Track my package"\n• 💳 **Payments** — "How do I pay with M-Pesa?"\n• ⚖️ **Disputes** — "I have a problem"\n• 📦 **Selling** — "How do I list products?"\n• 💡 **Advice** — "What should I buy with 30k?"\n\nJust ask naturally — I understand typos, slang, and mixed languages! 🇰🇪`;
}
