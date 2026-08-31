import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/** Initiate a wallet deposit via M-Pesa STK Push */
export const initiateDeposit = mutation({
  args: {
    amount: v.number(),
    phoneNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();

    if (!user) throw new Error("User not found");
    if (args.amount < 10) throw new Error("Minimum deposit is KES 10");

    const reference = `NX-DEP-${Date.now()}`;

    // Create pending wallet transaction
    await ctx.db.insert("walletTransactions", {
      userId: user._id,
      type: "deposit",
      amount: args.amount,
      currency: "KES",
      status: "pending",
      reference,
      description: `M-Pesa deposit of KES ${args.amount.toLocaleString()}`,
      createdAt: Date.now(),
    });

    return { reference, amount: args.amount, phoneNumber: args.phoneNumber };
  },
});

/** Confirm deposit (called after M-Pesa callback confirms payment) */
export const confirmDeposit = mutation({
  args: {
    reference: v.string(),
    mpesaReceipt: v.string(),
  },
  handler: async (ctx, args) => {
    const tx = await ctx.db
      .query("walletTransactions")
      .filter((q) => q.eq(q.field("reference"), args.reference))
      .first();

    if (!tx) throw new Error("Transaction not found");
    if (tx.status === "completed") return { alreadyCompleted: true };

    // Update transaction status
    await ctx.db.patch(tx._id, {
      status: "completed",
      reference: `${args.reference}|${args.mpesaReceipt}`,
    });

    // Credit user wallet
    const user = await ctx.db.get(tx.userId as any);
    if (user && "walletBalance" in user) {
      await ctx.db.patch(user._id, {
        walletBalance: (user.walletBalance || 0) + tx.amount,
      });
    }

    return { success: true, amount: tx.amount };
  },
});

/** Get wallet transactions for the current user */
export const getWalletTransactions = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();

    if (!user) return [];

    const transactions = await ctx.db
      .query("walletTransactions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return transactions;
  },
});

/** Get wallet balance for the current user */
export const getWalletBalance = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { walletBalance: 0, escrowBalance: 0 };

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();

    if (!user || !("walletBalance" in user)) return { walletBalance: 0, escrowBalance: 0 };

    return {
      walletBalance: (user as any).walletBalance || 0,
      escrowBalance: (user as any).escrowBalance || 0,
    };
  },
});

/** Create a new order (places product in escrow) */
export const createOrder = mutation({
  args: {
    listingId: v.id("listings"),
    sellerId: v.string(),
    amount: v.number(),
    deliveryCounty: v.string(),
    deliveryTown: v.string(),
    deliveryAddress: v.string(),
    paymentMethod: v.union(v.literal("wallet"), v.literal("mpesa")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const buyer = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();

    if (!buyer) throw new Error("Buyer not found");

    const listing = await ctx.db.get(args.listingId);
    if (!listing) throw new Error("Product not found");

    // Calculate platform fee (3%)
    const platformFee = Math.round(args.amount * 0.03);
    const totalAmount = args.amount + platformFee;

    // Check wallet balance for wallet payments
    if (args.paymentMethod === "wallet") {
      if ((("walletBalance" in buyer) ? (buyer as any).walletBalance : 0) < totalAmount) {
        throw new Error("Insufficient wallet balance");
      }
      // Deduct from wallet
      await ctx.db.patch(buyer._id, {
        walletBalance: ((("walletBalance" in buyer) ? (buyer as any).walletBalance : 0)) - totalAmount,
      });

      // Record wallet deduction
      await ctx.db.insert("walletTransactions", {
        userId: buyer._id,
        type: "escrow_fund",
        amount: totalAmount,
        currency: "KES",
        status: "completed",
        reference: `NX-ESC-${Date.now()}`,
        description: `Escrow payment for ${listing.title}`,
        createdAt: Date.now(),
      });
    }

    // Create escrow
    const escrowId = await ctx.db.insert("escrows", {
      buyerId: buyer._id,
      sellerId: args.sellerId,
      amount: args.amount,
      currency: "KES",
      status: "funded",
      title: listing.title,
      description: `Purchase of ${listing.title}`,
      conditions: "Buyer confirms delivery within 7 days",
      inspectionPeriodHours: 168,
      releaseCondition: "Buyer confirms receipt",
      transportRequired: true,
      deliveryAddress: args.deliveryAddress,
      deliveryCounty: args.deliveryCounty,
      deliveryTown: args.deliveryTown,
      originCounty: listing.originCounty,
      originTown: listing.originTown,
      createdAt: Date.now(),
      fundedAt: Date.now(),
      commissionRate: 3,
      platformFee,
    });

    // Mark listing as sold
    await ctx.db.patch(listing._id, { status: "sold" as any });

    return {
      escrowId,
      amount: args.amount,
      platformFee,
      totalPaid: totalAmount,
    };
  },
});
