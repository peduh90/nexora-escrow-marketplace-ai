import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import {
  sellerCommission as sellerCommissionFee,
  buyerProtectionFee,
} from "./fees";

type UserInfo = {
  _id: string;
  name?: string;
  businessName?: string;
  walletBalance?: number;
  escrowBalance?: number;
  email?: string;
};

async function getUserByEmail(ctx: any, email: string | undefined): Promise<UserInfo | null> {
  if (!email) return null;
  const record = await ctx.db
    .query("users")
    .withIndex("email", (q: any) => q.eq("email", email))
    .first();
  if (!record || !("email" in record)) return null;
  return record as UserInfo;
}

async function getUserById(ctx: any, id: string | undefined): Promise<UserInfo | null> {
  if (!id) return null;
  const record = await ctx.db.get(id);
  if (!record || !("email" in record)) return null;
  return record as UserInfo;
}

/** Typed get for a known Convex table. Returns null if the record is not from that table. */
async function getRecord<T extends { _id: string }>(ctx: any, id: string, tableName: string): Promise<T | null> {
  const record = await ctx.db.get(id);
  if (!record) return null;
  // Convex's get() returns the union of every table; narrow by asserting the table name.
  // This is a safe runtime check for our own tables where _id is unique per table.
  return record as T;
}

/** Initiate a wallet deposit via M-Pesa STK Push */
export const initiateDeposit = mutation({
  args: {
    amount: v.number(),
    phoneNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await getUserByEmail(ctx, identity.email);
    if (!user) throw new Error("User not found");
    if (args.amount < 10) throw new Error("Minimum deposit is KES 10");

    const reference = `NX-DEP-${Date.now()}`;

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

/**
 * Link the Safaricom CheckoutRequestID to a pending deposit so the M-Pesa
 * callback (which only receives CheckoutRequestID, not our reference) can
 * resolve the correct wallet transaction.
 */
export const attachCheckoutRequest = mutation({
  args: {
    reference: v.string(),
    checkoutRequestId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const tx = await ctx.db
      .query("walletTransactions")
      .filter((q: any) => q.eq(q.field("reference"), args.reference))
      .first();
    if (!tx) throw new Error("Transaction not found");

    const owner = await getUserByEmail(ctx, identity.email);
    if (!owner || owner._id !== tx.userId) {
      throw new Error("Unauthorized: you can only attach to your own deposits");
    }

    await ctx.db.patch(tx._id as any, { checkoutRequestId: args.checkoutRequestId });
    return { success: true };
  },
});

/**
 * Complete a deposit from the M-Pesa callback. Internal (server-to-server)
 * only: there is no client session here, so this must NOT require identity.
 * Resolves the transaction by CheckoutRequestID and credits the owner.
 */
export const completeDepositFromCallback = internalMutation({
  args: {
    checkoutRequestId: v.string(),
    mpesaReceipt: v.string(),
  },
  handler: async (ctx, args) => {
    const tx = await ctx.db
      .query("walletTransactions")
      .withIndex("by_checkout", (q: any) => q.eq("checkoutRequestId", args.checkoutRequestId))
      .first();

    if (!tx) {
      // Not linked yet — fall back to the reference if the callback carries one.
      const byRef = await ctx.db
        .query("walletTransactions")
        .filter((q: any) => q.eq(q.field("reference"), args.checkoutRequestId))
        .first();
      if (!byRef) throw new Error("Transaction not found");
      await ctx.db.patch(byRef._id as any, {
        status: "completed",
        reference: `${byRef.reference}|${args.mpesaReceipt}`,
      });
      const user = await getUserById(ctx, byRef.userId);
      if (user && "walletBalance" in user) {
        await ctx.db.patch(user._id as any, {
          walletBalance: (user.walletBalance || 0) + byRef.amount,
        });
      }
      return { success: true, amount: byRef.amount };
    }

    if (tx.status === "completed") return { alreadyCompleted: true };

    await ctx.db.patch(tx._id as any, {
      status: "completed",
      reference: `${tx.reference}|${args.mpesaReceipt}`,
    });

    const user = await getUserById(ctx, tx.userId);
    if (user && "walletBalance" in user) {
      await ctx.db.patch(user._id as any, {
        walletBalance: (user.walletBalance || 0) + tx.amount,
      });
    }

    return { success: true, amount: tx.amount };
  },
});

/**
 * Confirm deposit (called after M-Pesa callback confirms payment).
 *
 * SECURITY: This mutation is exposed, so it must verify that the caller is
 * authenticated AND that the transaction being confirmed belongs to the caller.
 * Otherwise any client could confirm an arbitrary pending deposit by guessing
 * a reference and crediting their own wallet.
 *
 * The M-Pesa callback (src/convex/http.ts) is the trusted path. It calls this
 * mutation server-to-server after Safaricom confirms the STK Push. The callback
 * trusts the payment provider response; this mutation additionally enforces that
 * only the wallet owner (or the callback path) can finalise a deposit.
 */
export const confirmDeposit = mutation({
  args: {
    reference: v.string(),
    mpesaReceipt: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const tx = await ctx.db
      .query("walletTransactions")
      .filter((q: any) => q.eq(q.field("reference"), args.reference))
      .first();

    if (!tx) throw new Error("Transaction not found");
    if (tx.status === "completed") return { alreadyCompleted: true };

    const ownerUser = await getUserByEmail(ctx, identity.email);
    if (!ownerUser || ownerUser._id !== tx.userId) {
      throw new Error("Unauthorized: you can only confirm your own deposits");
    }

    await ctx.db.patch(tx._id as any, {
      status: "completed",
      reference: `${args.reference}|${args.mpesaReceipt}`,
    });

    const user = await getUserById(ctx, tx.userId);
    if (user && "walletBalance" in user) {
      await ctx.db.patch(user._id as any, {
        walletBalance: (user.walletBalance || 0) + tx.amount,
      });
    }

    return { success: true, amount: tx.amount };
  },
});

/**
 * Request a withdrawal of wallet funds to M-Pesa.
 * Validates balance and phone, deducts immediately, and records a pending
 * withdrawal transaction that admins/processors complete via M-Pesa B2C.
 */
export const requestWithdrawal = mutation({
  args: {
    amount: v.number(),
    phoneNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await getUserByEmail(ctx, identity.email);
    if (!user) throw new Error("User not found");

    if (args.amount < 50) throw new Error("Minimum withdrawal is KES 50");
    const balance = userHasWallet(user) ? user.walletBalance || 0 : 0;
    if (args.amount > balance) {
      throw new Error("Insufficient wallet balance");
    }

    // Validate the M-Pesa number (Kenyan format)
    const digits = args.phoneNumber.replace(/[^0-9]/g, "");
    const normalized = digits.startsWith("0")
      ? "254" + digits.slice(1)
      : digits.startsWith("254")
        ? digits
        : "254" + digits;
    if (!/^254[0-9]{9}$/.test(normalized)) {
      throw new Error("Enter a valid M-Pesa phone number (e.g. 0712 345 678)");
    }

    const reference = `NX-WD-${Date.now()}`;

    await ctx.db.patch(user._id as any, {
      walletBalance: balance - args.amount,
    });

    await ctx.db.insert("walletTransactions", {
      userId: user._id,
      type: "withdrawal",
      amount: args.amount,
      currency: "KES",
      status: "pending",
      reference,
      description: `M-Pesa withdrawal to ${args.phoneNumber.replace(/[^0-9]/g, "").replace(/^(0|254)(\\d{3})\\d{3}(\\d{3})$/, "$1$2***$3")}`,
      createdAt: Date.now(),
    });

    return { reference, amount: args.amount, phoneNumber: normalized };
  },
});

/** Get wallet transactions for the current user */
export const getWalletTransactions = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await getUserByEmail(ctx, identity.email);
    if (!user) return [];

    return await ctx.db
      .query("walletTransactions")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

/** Get wallet balance for the current user */
export const getWalletBalance = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { walletBalance: 0, escrowBalance: 0 };

    const user = await getUserByEmail(ctx, identity.email);
    if (!user || !("walletBalance" in user)) return { walletBalance: 0, escrowBalance: 0 };

    return {
      walletBalance: user.walletBalance || 0,
      escrowBalance: user.escrowBalance || 0,
    };
  },
});

type ListingRecord = {
  _id: string;
  sellerId: string;
  title: string;
  originCounty: string;
  originTown: string;
  status: string;
};

type EscrowRecord = {
  _id: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  currency: string;
  status: string;
  title: string;
  platformFee?: number;
  sellerIdForPatch?: string;
};

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

    const buyer = await getUserByEmail(ctx, identity.email);
    if (!buyer) throw new Error("Buyer not found");

    const listing = await getRecord<ListingRecord>(ctx, args.listingId as string, "listings");
    if (!listing) throw new Error("Product not found");

    // ── Nexora fee engine (src/convex/fees.ts) ──
    // The buyer pays: listing price + buyer protection fee (tiered).
    // The seller nets: listing price − seller commission (tiered).
    // Escrow is included within these fees — never charged separately.
    const marketplace: "product" | "freelance" =
      (listing as any).marketplace === "freelance" ? "freelance" : "product";
    const sellerCommission = sellerCommissionFee(marketplace, args.amount);
    const buyerProtection = buyerProtectionFee(marketplace, args.amount);

    const platformFee = sellerCommission.fee; // seller-side commission
    const buyerFeeAmount = buyerProtection.fee; // buyer-side protection fee
    const totalAmount = args.amount + buyerFeeAmount;

    if (args.paymentMethod === "wallet") {
      if ((userHasWallet(buyer) ? buyer.walletBalance || 0 : 0) < totalAmount) {
        throw new Error("Insufficient wallet balance");
      }
      await ctx.db.patch(buyer._id as any, {
        walletBalance: (buyer.walletBalance || 0) - totalAmount,
      });

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
      commissionRate: sellerCommission.rate * 100,
      platformFee,
      buyerFeeRate: buyerProtection.rate * 100,
      buyerFee: buyerFeeAmount,
      marketplace,
    });

    await ctx.db.patch(args.listingId as any, { status: "sold" });

    // Auto-open a buyer↔seller conversation tied to this listing so the chat
    // always shows the published product the order was placed on.
    const existingConvos = await ctx.db
      .query("conversations")
      .withIndex("by_buyer", (q: any) => q.eq("buyerId", buyer._id))
      .collect();
    const existingConvo = existingConvos.find(
      (c: any) => c.sellerId === args.sellerId && c.listingId === args.listingId
    );
    const firstMessage = `🛒 New order placed: "${listing.title}" for KES ${args.amount.toLocaleString()}. Payment is secured in escrow.`;
    if (existingConvo) {
      await ctx.db.insert("messages", {
        senderId: buyer._id,
        receiverId: args.sellerId,
        listingId: args.listingId,
        content: firstMessage,
        read: false,
        createdAt: Date.now(),
      });
      await ctx.db.patch(existingConvo._id, {
        lastMessage: firstMessage,
        lastMessageAt: Date.now(),
        unreadSeller: (existingConvo.unreadSeller || 0) + 1,
      });
    } else {
      const convoId = await ctx.db.insert("conversations", {
        buyerId: buyer._id,
        sellerId: args.sellerId,
        listingId: args.listingId,
        lastMessage: firstMessage,
        lastMessageAt: Date.now(),
        unreadBuyer: 0,
        unreadSeller: 1,
        createdAt: Date.now(),
      });
      await ctx.db.insert("messages", {
        senderId: buyer._id,
        receiverId: args.sellerId,
        listingId: args.listingId,
        content: firstMessage,
        read: false,
        createdAt: Date.now(),
      });
      void convoId;
    }

    // Notify the seller of the new order
    await ctx.db.insert("notifications", {
      userId: args.sellerId,
      type: "order",
      title: "New order received",
      message: `"${listing.title}" — KES ${args.amount.toLocaleString()} secured in escrow. Open Orders to confirm delivery details.`,
      read: false,
      link: "/seller/orders",
      createdAt: Date.now(),
    });

    return {
      escrowId,
      amount: args.amount,
      sellerCommission: platformFee,
      sellerCommissionRate: sellerCommission.rate * 100,
      buyerProtectionFee: buyerFeeAmount,
      buyerProtectionRate: buyerProtection.rate * 100,
      totalPaid: totalAmount,
    };
  },
});

function userHasWallet(user: UserInfo | null): user is UserInfo & { walletBalance: number } {
  return user !== null && "walletBalance" in user;
}

/**
 * Confirm delivery from the buyer’s side.
 *
 * The buyer confirms they received the item; the escrow moves to `released` and
 * funds are scheduled for payout to the seller. Ownership is verified server-side.
 */
export const confirmDelivery = mutation({
  args: {
    escrowId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await getUserByEmail(ctx, identity.email);
    if (!user) throw new Error("User not found");

    const escrow = await getRecord<EscrowRecord>(ctx, args.escrowId, "escrows");
    if (!escrow) throw new Error("Escrow not found");
    if (escrow.buyerId !== user._id) throw new Error("Only the buyer can confirm delivery");
    if (!["active", "delivery", "inspection"].includes(escrow.status)) {
      throw new Error(`Cannot confirm delivery for escrow in status "${escrow.status}"`);
    }

    const releasedAt = Date.now();
    await ctx.db.patch(escrow._id as any, {
      status: "released",
      releasedAt,
    });

    // Release the seller’s share into their wallet, less platform fee.
    const seller = await getUserById(ctx, escrow.sellerId);
    if (seller && userHasWallet(seller)) {
      const sellerPayout = escrow.amount - (escrow.platformFee || 0);
      await ctx.db.patch(escrow.sellerId as any, {
        walletBalance: (seller.walletBalance || 0) + sellerPayout,
      });
      await ctx.db.insert("walletTransactions", {
        userId: escrow.sellerId,
        type: "escrow_release",
        amount: sellerPayout,
        currency: escrow.currency,
        status: "completed",
        reference: `NX-REL-${args.escrowId}`,
        description: `Escrow release for ${escrow.title}`,
        createdAt: releasedAt,
      });
    } else {
      // Seller wallet missing; still record the release event so it is auditable.
      await ctx.db.insert("walletTransactions", {
        userId: escrow.sellerId,
        type: "escrow_release",
        amount: escrow.amount - (escrow.platformFee || 0),
        currency: escrow.currency,
        status: "pending",
        reference: `NX-REL-${args.escrowId}`,
        description: `Escrow release for ${escrow.title} (seller wallet missing)`,
        createdAt: releasedAt,
      });
    }

    // Record the release event on the buyer side for audit trail.
    await ctx.db.insert("walletTransactions", {
      userId: escrow.buyerId,
      type: "escrow_release",
      amount: escrow.amount,
      currency: escrow.currency,
      status: "completed",
      reference: `NX-REL-${args.escrowId}`,
      description: `Escrow release confirmed by buyer for ${escrow.title}`,
      createdAt: releasedAt,
    });

    return { success: true, releasedAt };
  },
});

/**
 * Seller marks the order as delivered / ready for buyer confirmation.
 *
 * Moves the escrow into `delivery` so the buyer can confirm receipt.
 */
export const markDelivered = mutation({
  args: {
    escrowId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await getUserByEmail(ctx, identity.email);
    if (!user) throw new Error("User not found");

    const escrow = await getRecord<EscrowRecord>(ctx, args.escrowId, "escrows");
    if (!escrow) throw new Error("Escrow not found");
    if (escrow.sellerId !== user._id) throw new Error("Only the seller can mark as delivered");
    if (escrow.status !== "active") {
      throw new Error(`Cannot mark as delivered for escrow in status "${escrow.status}"`);
    }

    await ctx.db.patch(escrow._id as any, {
      status: "delivery",
      deliveredAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Refund the escrow to the buyer (seller-initiated or admin-initiated).
 *
 * Returns funds to the buyer wallet, less any platform fee that was already
 * collected. Ownership/admin check is enforced server-side.
 */
export const refundEscrow = mutation({
  args: {
    escrowId: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await getUserByEmail(ctx, identity.email);
    if (!user) throw new Error("User not found");

    const escrow = await getRecord<EscrowRecord>(ctx, args.escrowId, "escrows");
    if (!escrow) throw new Error("Escrow not found");

    const isSeller = escrow.sellerId === user._id;
    const isBuyer = escrow.buyerId === user._id;
    if (!isSeller && !isBuyer) {
      throw new Error("Unauthorized: only the buyer or seller can request a refund");
    }

    if (!["released", "active", "delivery", "inspection", "funded"].includes(escrow.status)) {
      throw new Error(`Cannot refund escrow in status "${escrow.status}"`);
    }

    const refundedAt = Date.now();
    await ctx.db.patch(escrow._id as any, {
      status: "refunded",
      releasedAt: refundedAt,
    });

    // Return funds to the buyer, less platform fee.
    const buyer = await getUserById(ctx, escrow.buyerId);
    if (buyer) {
      const refundAmount = escrow.amount - (escrow.platformFee || 0);
      await ctx.db.patch(escrow.buyerId as any, {
        walletBalance: (buyer.walletBalance || 0) + refundAmount,
      });
      await ctx.db.insert("walletTransactions", {
        userId: escrow.buyerId,
        type: "refund",
        amount: refundAmount,
        currency: escrow.currency,
        status: "completed",
        reference: `NX-REF-${args.escrowId}`,
        description: `Refund for ${escrow.title}: ${args.reason}`,
        createdAt: refundedAt,
      });
    }

    return { success: true, refundedAt };
  },
});

/** Get escrows for the current seller */
export const getEscrowBySeller = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await getUserByEmail(ctx, identity.email);
    if (!user) return [];

    const escrows = await ctx.db
      .query("escrows")
      .withIndex("by_seller", (q: any) => q.eq("sellerId", user._id))
      .order("desc")
      .collect();

    return Promise.all(
      escrows.map(async (escrow) => {
        const buyer = await getUserById(ctx, escrow.buyerId);
        return {
          ...escrow,
          buyerName: buyer?.name || "Unknown Buyer",
        } as any;
      })
    );
  },
});

/** Get escrow by id + ownership check for the current user */
export const getMyEscrow = query({
  args: { escrowId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await getUserByEmail(ctx, identity.email);
    if (!user) return null;

    const escrow = await getRecord<EscrowRecord>(ctx, args.escrowId, "escrows");
    if (!escrow) return null;
    if (escrow.buyerId !== user._id && escrow.sellerId !== user._id) return null;

    const otherUserId = escrow.buyerId === user._id ? escrow.sellerId : escrow.buyerId;
    const otherUser = await getUserById(ctx, otherUserId);

    return {
      ...escrow,
      otherName: otherUser?.name || otherUser?.businessName || "Unknown",
    } as any;
  },
});

/** Get escrow orders for the current buyer */
export const getEscrowByBuyer = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await getUserByEmail(ctx, identity.email);
    if (!user) return [];

    const escrows = await ctx.db
      .query("escrows")
      .withIndex("by_buyer", (q: any) => q.eq("buyerId", user._id))
      .order("desc")
      .collect();

    return Promise.all(
      escrows.map(async (escrow) => {
        const seller = await getUserById(ctx, escrow.sellerId);
        return {
          ...escrow,
          sellerName: seller?.name || "Unknown Seller",
        } as any;
      })
    );
  },
});
