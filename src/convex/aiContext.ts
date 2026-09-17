import { v } from "convex/values";
import { internalQuery } from "./_generated/server";

/**
 * ─── NEXORA AI LIVE CONTEXT ───────────────────────────────────────────────
 *
 * Gathers the signed-in user's REAL system data into a compact summary that
 * is injected into the AI chat's system prompt. This is what lets the
 * assistant answer "where is my order?" with the actual order status instead
 * of canned text. Read-only, session-scoped, and cheap (bounded takes).
 */

function fmtKES(n: number | undefined): string {
  return `KES ${Math.round(Number(n || 0)).toLocaleString()}`;
}

function ago(ts: number | undefined): string {
  if (!ts) return "";
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ts).toLocaleDateString("en-KE");
}

export const gather = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user: any = await ctx.db.get(args.userId as any);
    if (!user) return null;

    // ── Profile summary ──
    const profile = {
      name: user.name || "Unknown",
      role: user.role || "buyer",
      county: user.county || undefined,
      kycStatus: user.kycStatus || "not_started",
      verificationLevel: user.verificationLevel || undefined,
      walletBalance: fmtKES(user.walletBalance),
      escrowBalance: fmtKES(user.escrowBalance),
      memberSince: user.joinedAt ? new Date(user.joinedAt).toLocaleDateString("en-KE") : undefined,
    };

    // ── Orders / escrows (as buyer AND seller) ──
    const buyerEscrows = await ctx.db
      .query("escrows")
      .withIndex("by_buyer", (q) => q.eq("buyerId", args.userId))
      .collect();
    const sellerEscrows = await ctx.db
      .query("escrows")
      .withIndex("by_seller", (q) => q.eq("sellerId", args.userId))
      .collect();

    const seen = new Set<string>();
    const allEscrows = [...buyerEscrows, ...sellerEscrows]
      .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0))
      .filter((e: any) => {
        if (seen.has(e._id)) return false;
        seen.add(e._id);
        return true;
      })
      .slice(0, 8);

    const orders = allEscrows.map((e: any) => ({
      id: String(e._id).slice(-8),
      fullId: String(e._id),
      title: e.title,
      amount: fmtKES(e.amount),
      status: e.status,
      userIsBuyer: e.buyerId === args.userId,
      created: ago(e.createdAt),
      county: e.deliveryCounty || undefined,
      note: e.status === "funded" || e.status === "active"
        ? "awaiting delivery/seller action"
        : e.status === "delivery"
          ? "out for delivery"
          : e.status === "inspection"
            ? "buyer inspecting"
            : e.status === "disputed"
              ? "UNDER DISPUTE"
              : undefined,
    }));

    // ── Deliveries for those orders ──
    const deliveries: any[] = [];
    for (const e of allEscrows.slice(0, 6)) {
      const d = await ctx.db
        .query("deliveries")
        .withIndex("by_escrow", (q) => q.eq("escrowId", e._id))
        .order("desc")
        .first();
      if (d) {
        deliveries.push({
          orderId: String(e._id).slice(-8),
          trackingCode: d.trackingCode,
          status: d.status,
          driver: d.driverName || undefined,
          driverPhone: d.driverPhone || undefined,
          dropoff: [d.dropoffTown, d.dropoffCounty].filter(Boolean).join(", "),
          pickedUpAt: d.pickedUpAt ? ago(d.pickedUpAt) : undefined,
          deliveredAt: d.deliveredAt ? ago(d.deliveredAt) : undefined,
        });
      }
    }

    // ── Wallet transactions ──
    const walletTx = (await ctx.db
      .query("walletTransactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect())
      .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 6)
      .map((t: any) => ({
        type: t.type,
        amount: fmtKES(t.amount),
        status: t.status,
        description: t.description?.slice(0, 80),
        when: ago(t.createdAt),
      }));

    // ── Unified payments (M-Pesa/Airtel/Card attempts) ──
    const payments = (await ctx.db
      .query("paymentTransactions")
      .withIndex("by_payer", (q) => q.eq("payerId", args.userId))
      .collect())
      .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 5)
      .map((t: any) => ({
        reference: t.reference,
        provider: t.provider,
        amount: fmtKES(t.feeSnapshot?.totalCharge ?? t.amount),
        status: t.status,
        failureReason: t.failureReason?.slice(0, 80),
        when: ago(t.createdAt),
      }));

    // ── Disputes (filed by user + against their escrows) ──
    const myEscrowIds = new Set(allEscrows.map((e: any) => String(e._id)));
    const filed = await ctx.db
      .query("disputes")
      .withIndex("by_filer", (q) => q.eq("filedBy", args.userId))
      .collect();
    const disputes = filed
      .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 4)
      .map((d: any) => ({
        orderId: String(d.escrowId).slice(-8),
        reason: d.reason,
        status: d.status,
        refundAmount: d.refundAmount ? fmtKES(d.refundAmount) : undefined,
        resolution: d.resolution?.slice(0, 100),
        filed: ago(d.createdAt),
      }));

    return {
      generatedAt: new Date().toLocaleString("en-KE"),
      profile,
      orders,
      deliveries,
      walletTransactions: walletTx,
      payments,
      disputes,
      counts: {
        totalOrders: buyerEscrows.length + sellerEscrows.length,
        asBuyer: buyerEscrows.length,
        asSeller: sellerEscrows.length,
        openDisputes: disputes.filter((d) => d.status === "open" || d.status === "under_review" || d.status === "escalated").length,
      },
    };
  },
});
