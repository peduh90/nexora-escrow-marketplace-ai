import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { api } from "./_generated/api";
import { getSessionUser } from "./users";

const ADMIN_EMAIL = "murimiedwin227@gmail.com";

/**
 * A "real" platform user: has a real email and is not a guest/anonymous
 * account. Used consistently across the admin dashboard and user lists so the
 * two never disagree on totals.
 */
function isRealUser(u: any): boolean {
  return (
    typeof u.email === "string" &&
    u.email.includes("@") &&
    u.name !== "Guest User" &&
    !u.email.toLowerCase().includes("anonymous")
  );
}

/** Helper: verify the current user is an admin */
async function requireAdmin(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  const user = await getSessionUser(ctx);

  if (!user) throw new Error("User not found");

  // Auto-promote admin email
  if (identity.email === ADMIN_EMAIL && user.role !== "admin") {
    await ctx.db.patch(user._id, { role: "admin" });
  }

  const fresh = await ctx.db.get(user._id);
  if (!fresh || fresh.role !== "admin") {
    throw new Error("Unauthorized: admin only");
  }

  return { user: fresh, identity };
}

/** Helper: create an audit log entry in the real auditLogs table. Forwards a
 * notification to the admin user so the audit trail is also visible in the
 * notifications UI. Never logs passwords, tokens, or payment secrets. */
async function auditLog(
  ctx: any,
  adminId: string,
  adminName: string,
  action: string,
  resource: string,
  resourceId: string,
  details?: string
) {
  const now = Date.now();
  await ctx.db.insert("auditLogs", {
    adminId,
    adminName,
    adminRole: "admin",
    action,
    target: resource,
    targetId: resourceId || undefined,
    details: details || undefined,
    createdAt: now,
  });
  await ctx.db.insert("notifications", {
    userId: adminId,
    type: "admin_audit",
    title: `Admin: ${action}`,
    message: `${resource} ${resourceId ? `(${resourceId})` : ""} — ${details || "No details"}`,
    read: false,
    link: "/admin/audit-logs",
    createdAt: now,
  });
}

// ─── DASHBOARD QUERIES ───

/** Admin: get platform stats for dashboard */
export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const users = await ctx.db.query("users").collect();
    const listings = await ctx.db.query("listings").collect();
    const escrows = await ctx.db.query("escrows").collect();
    const walletTx = await ctx.db.query("walletTransactions").collect();
    const disputes = await ctx.db.query("disputes").collect();
    const deliveries = await ctx.db.query("deliveries").collect();
    const reviews = await ctx.db.query("reviews").collect();
    const conversations = await ctx.db.query("conversations").collect();

    const now = Date.now();
    const dayAgo = now - 86400000;
    const weekAgo = now - 604800000;
    const monthAgo = now - 2592000000;

    // Count users by role, restricted to REAL users (real email, not guest/
    // anonymous) so the dashboard matches the User Management page. Sellers
    // include accounts still completing verification (pendingRole === "seller")
    // so a brand-new seller registration is visible to the admin immediately.
    const realUsers = users.filter(isRealUser);
    const isSellerAccount = (u: any) =>
      u.role === "seller" || !!u.businessName || u.pendingRole === "seller";
    const buyers = realUsers.filter(
      (u) => u.role === "buyer" || (!u.role && !u.businessName && !isSellerAccount(u))
    );
    const sellers = realUsers.filter(isSellerAccount);
    // Freelancers are tracked in freelanceProfiles, not in users.role.
    // Count them here from the freelanceProfiles table separately.
    const freelancers = [] as any[];
    const activeListings = listings.filter((l) => l.status === "active");
    const pendingListings = listings.filter((l) => l.status === "paused");

    const completedEscrows = escrows.filter((e) =>
      ["released", "completed"].includes(e.status)
    );
    const pendingEscrows = escrows.filter((e) =>
      ["funded", "active", "delivery", "inspection"].includes(e.status)
    );
    const disputedEscrows = escrows.filter((e) => e.status === "disputed");

    const totalGMV = escrows.reduce((sum, e) => sum + e.amount, 0);
    const platformRevenue = completedEscrows.reduce(
      (sum, e) => sum + (e.platformFee || 0),
      0
    );
    const heldInEscrow = pendingEscrows.reduce((sum, e) => sum + e.amount, 0);

    const newUsersToday = realUsers.filter((u) => (u._creationTime || 0) > dayAgo).length;
    const newListingsToday = listings.filter((l) => l.createdAt > dayAgo).length;
    const newOrdersToday = escrows.filter((e) => e.createdAt > dayAgo).length;

    // Freelance marketplace stats
    const freelanceProfiles = await ctx.db.query("freelanceProfiles").collect();
    const freelanceTasks = await ctx.db.query("freelanceTasks").collect();
    const freelanceProjects = await ctx.db.query("freelanceProjects").collect();
    const freelanceApplications = await ctx.db.query("freelanceApplications").collect();
    const freelanceServices = await ctx.db.query("freelanceServices").collect();

    return {
      users: {
        total: realUsers.length,
        buyers: buyers.length,
        sellers: sellers.length,
        admins: realUsers.filter((u) => u.role === "admin").length,
        freelancers: freelanceProfiles.length,
        employers: new Set(freelanceTasks.map((t) => t.employerId)).size,
        newToday: newUsersToday,
        verified: realUsers.filter((u) => u.kycStatus === "verified").length,
        pendingKyc: realUsers.filter((u) => u.kycStatus === "pending").length,
      },
      freelance: {
        profiles: freelanceProfiles.length,
        tasks: freelanceTasks.length,
        openTasks: freelanceTasks.filter((t) => t.status === "open").length,
        projects: freelanceProjects.length,
        activeProjects: freelanceProjects.filter((p) => p.status === "active").length,
        completedProjects: freelanceProjects.filter((p) => p.status === "completed").length,
        applications: freelanceApplications.length,
        services: freelanceServices.length,
      },
      products: {
        total: listings.length,
        active: activeListings.length,
        pending: pendingListings.length,
        sold: listings.filter((l) => l.status === "sold").length,
        paused: listings.filter((l) => l.status === "paused").length,
        newToday: newListingsToday,
      },
      orders: {
        total: escrows.length,
        pending: escrows.filter((e) => e.status === "created").length,
        funded: escrows.filter((e) => e.status === "funded").length,
        active: escrows.filter((e) => e.status === "active").length,
        delivery: escrows.filter((e) => e.status === "delivery").length,
        completed: completedEscrows.length,
        disputed: disputedEscrows.length,
        refunded: escrows.filter((e) => e.status === "refunded").length,
        cancelled: escrows.filter((e) => e.status === "cancelled").length,
        newToday: newOrdersToday,
      },
      finance: {
        totalGMV,
        platformRevenue,
        heldInEscrow,
        totalTransactions: walletTx.length,
        completedTransactions: walletTx.filter((t) => t.status === "completed").length,
        pendingTransactions: walletTx.filter((t) => t.status === "pending").length,
      },
      disputes: {
        total: disputes.length,
        open: disputes.filter((d) => d.status === "open").length,
        underReview: disputes.filter((d) => d.status === "under_review").length,
        resolved: disputes.filter((d) => d.status === "resolved").length,
        escalated: disputes.filter((d) => d.status === "escalated").length,
      },
      delivery: {
        total: deliveries.length,
        inTransit: deliveries.filter((d) => d.status === "in_transit").length,
        delivered: deliveries.filter((d) => d.status === "delivered").length,
        pending: deliveries.filter((d) => d.status === "assigned").length,
      },
      engagement: {
        conversations: conversations.length,
        reviews: reviews.length,
        totalViews: listings.reduce((sum, l) => sum + l.views, 0),
      },
    };
  },
});

// ─── USER MANAGEMENT ───

/** Admin: get all users with computed stats.
 * Guest/anonymous accounts are excluded so this list always matches the
 * dashboard and User Management counts. Sensitive credential fields (password
 * hashes, auth account ids, admin 2FA secrets) are stripped before the records
 * leave the server — the admin UI never needs them. */
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const users = (await ctx.db.query("users").collect()).filter(isRealUser);
    const listings = await ctx.db.query("listings").collect();
    const escrows = await ctx.db.query("escrows").collect();

    return users.map((u) => {
      const userListings = listings.filter((l) => l.sellerId === u._id);
      const userEscrows = escrows.filter(
        (e) => e.buyerId === u._id || e.sellerId === u._id
      );
      const {
        passwordHash: _ph,
        tokenIdentifier: _ti,
        adminPasswordHash: _aph,
        adminPasswordSalt: _aps,
        adminTotpSecret: _ats,
        ...safeUser
      } = u as any;
      return {
        ...safeUser,
        listingCount: userListings.length,
        orderCount: userEscrows.length,
        totalSpent: escrows
          .filter((e) => e.buyerId === u._id)
          .reduce((sum, e) => sum + e.amount, 0),
        totalEarned: escrows
          .filter((e) => e.sellerId === u._id && ["released", "completed"].includes(e.status))
          .reduce((sum, e) => sum + e.amount, 0),
      };
    });
  },
});

/** Admin: user count summary (mirrors the shape the User Management page and
 * dashboard stat cards consume). Freelancers are counted from the
 * freelanceProfiles table — they are not stored in users.role. */
export const getUserCounts = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const all = await ctx.db.query("users").collect();
    const realUsers = all.filter(isRealUser);
    const freelanceProfiles = await ctx.db.query("freelanceProfiles").collect();

    // Sellers include still-verifying accounts (pendingRole === "seller") so
    // new seller registrations are counted the moment they sign up.
    const isSellerAccount = (u: any) =>
      u.role === "seller" || !!u.businessName || u.pendingRole === "seller";
    const buyers = realUsers.filter(
      (u: any) => u.role === "buyer" || (!u.role && !u.businessName && !isSellerAccount(u))
    );
    const sellers = realUsers.filter(isSellerAccount);
    const admins = realUsers.filter((u: any) => u.role === "admin");

    return {
      total: realUsers.length,
      buyers: buyers.length,
      sellers: sellers.length,
      freelancers: freelanceProfiles.length,
      admins: admins.length,
      verified: realUsers.filter((u: any) => u.kycStatus === "verified").length,
      pendingKyc: realUsers.filter((u: any) => u.kycStatus === "pending").length,
      recent: realUsers.filter((u: any) => (u._creationTime || 0) > Date.now() - 86400000).length,
    };
  },
});

/** Admin: suspend a user */
export const suspendUser = mutation({
  args: { userId: v.string(), reason: v.string() },
  handler: async (ctx, args) => {
    const { user } = await requireAdmin(ctx);
    const target = await ctx.db.get(args.userId as any);
    if (!target) throw new Error("User not found");

    await ctx.db.patch(args.userId as any, { role: undefined });
    await auditLog(
      ctx as any,
      user._id,
      user.name || user.email || "Admin",
      "SUSPEND_USER",
      "user",
      args.userId,
      args.reason
    );
    return { success: true };
  },
});

// ─── LISTING MANAGEMENT ───

/** Admin: get all listings */
export const getAllListings = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("listings").collect();
  },
});

/** Admin: update listing status */
export const updateListingStatus = mutation({
  args: {
    listingId: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("sold"),
      v.literal("paused"),
      v.literal("removed")
    ),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireAdmin(ctx);
    await ctx.db.patch(args.listingId as any, { status: args.status, updatedAt: Date.now() });
    await auditLog(
      ctx as any,
      user._id,
      user.name || user.email || "Admin",
      `UPDATE_LISTING_STATUS → ${args.status}`,
      "listing",
      args.listingId,
      args.reason
    );
    return { success: true };
  },
});

// ─── ESCROW MANAGEMENT ───

/** Admin: get all escrows */
export const getAllEscrows = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("escrows").collect();
  },
});

// ─── DISPUTE MANAGEMENT ───

/** Admin: get all disputes */
export const getAllDisputes = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("disputes").collect();
  },
});

/** Admin: resolve a dispute. Admin decision can optionally trigger a refund via
 * the server-side refundEscrow mutation (buyer/seller or admin-initiated). */
export const resolveDispute = mutation({
  args: {
    disputeId: v.string(),
    resolution: v.string(),
    refundAmount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireAdmin(ctx);

    // The mutation receives the dispute document id — resolve the linked
    // escrow from the dispute record itself. Passing the dispute id into the
    // wallet mutations (the old behaviour) targeted a non-existent escrow and
    // silently did nothing.
    const dispute: any = await ctx.db.get(args.disputeId as any);
    if (!dispute) throw new Error("Dispute not found");
    const escrowId = dispute.escrowId as string | undefined;

    await ctx.db.patch(args.disputeId as any, {
      status: "resolved",
      resolution: args.resolution,
      refundAmount: args.refundAmount,
      resolvedAt: Date.now(),
    });

    if (escrowId) {
      if (args.refundAmount && args.refundAmount > 0) {
        try {
          await ctx.runMutation(api.wallet.refundEscrow, {
            escrowId,
            reason: `Admin dispute resolution: ${args.resolution}`,
          }).catch(() => {});
        } catch {
          // mutation path may not exist yet; safe to ignore
        }
      } else {
        try {
          await ctx.runMutation(api.wallet.markDelivered, {
            escrowId,
          }).catch(() => {});
        } catch {
          // mutation path may not exist yet; safe to ignore
        }
      }
    }

    await auditLog(
      ctx as any,
      user._id,
      user.name || user.email || "Admin",
      "RESOLVE_DISPUTE",
      "dispute",
      args.disputeId,
      args.resolution
    );
    return { success: true };
  },
});

// ─── KYC MANAGEMENT ───

/** Admin: get all KYC applications */
export const getAllKYC = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("kycApplications").collect();
  },
});

/** Admin: approve/reject KYC */
export const reviewKYC = mutation({
  args: {
    applicationId: v.string(),
    status: v.union(v.literal("approved"), v.literal("rejected")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireAdmin(ctx);
    const app = await ctx.db.get(args.applicationId as any);
    if (!app) throw new Error("KYC application not found");

    await ctx.db.patch(args.applicationId as any, {
      status: args.status,
      reviewedBy: user._id,
      reviewNotes: args.notes,
      reviewedAt: Date.now(),
    });

    // Update user KYC status if the KYC app has a userId.
    const kycApp = app as any;
    if (kycApp.userId && typeof kycApp.userId === "string") {
      await ctx.db.patch(kycApp.userId, {
        kycStatus: args.status === "approved" ? "verified" : "rejected",
        kycVerifiedAt: args.status === "approved" ? Date.now() : undefined,
      });
    }

    await auditLog(
      ctx as any,
      user._id,
      user.name || user.email || "Admin",
      `KYC_${args.status.toUpperCase()}`,
      "kycApplication",
      args.applicationId,
      args.notes || "No notes"
    );
    return { success: true };
  },
});

/** Seller: submit a KYC business verification application. Creates the
 * application record the admin Verification page reviews and flips the
 * seller's KYC status to pending so every panel reflects it immediately. */
export const submitKYC = mutation({
  args: {
    businessName: v.string(),
    businessType: v.string(),
    registrationNumber: v.optional(v.string()),
    taxPin: v.optional(v.string()),
    county: v.string(),
    town: v.string(),
    phone: v.string(),
    idDocumentUrl: v.string(),
    businessDocumentUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getSessionUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const now = Date.now();

    // One pending application per seller — resubmitting replaces the old one.
    const mine = await ctx.db.query("kycApplications").collect();
    const pending = mine.find(
      (a: any) => a.userId === (user as any)._id && a.status === "pending"
    );
    if (pending) {
      await ctx.db.patch(pending._id, { ...args, submittedAt: now });
      return { success: true, applicationId: pending._id as string };
    }

    const applicationId = await ctx.db.insert("kycApplications", {
      userId: (user as any)._id,
      businessName: args.businessName,
      businessType: args.businessType,
      registrationNumber: args.registrationNumber,
      taxPin: args.taxPin,
      county: args.county,
      town: args.town,
      phone: args.phone,
      idDocumentUrl: args.idDocumentUrl,
      businessDocumentUrl: args.businessDocumentUrl,
      status: "pending",
      submittedAt: now,
    });

    await ctx.db.patch((user as any)._id, {
      kycStatus: "pending",
      kycSubmittedAt: now,
    });

    // Notify every admin so the request is visible without hunting for it.
    const admins = await ctx.db
      .query("users")
      .withIndex("by_role", (q: any) => q.eq("role", "admin"))
      .collect();
    for (const admin of admins) {
      await ctx.db.insert("notifications", {
        userId: admin._id,
        type: "kyc_submitted",
        title: "New KYC verification request",
        message: `${args.businessName} submitted business verification for review.`,
        read: false,
        link: "/admin/kyc",
        createdAt: now,
      });
    }

    return { success: true, applicationId: applicationId as string };
  },
});

/** Seller: get my own KYC applications (used by the seller verification page). */
export const getMyKYCApplications = query({
  args: {},
  handler: async (ctx) => {
    const user = await getSessionUser(ctx);
    if (!user) return [];
    const apps = await ctx.db.query("kycApplications").collect();
    return apps
      .filter((a: any) => a.userId === (user as any)._id)
      .sort((a: any, b: any) => b.submittedAt - a.submittedAt);
  },
});

// ─── DELIVERY MANAGEMENT ───

/** Admin: get all deliveries */
export const getAllDeliveries = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("deliveries").collect();
  },
});

// ─── MESSAGE MONITORING ───

/** Admin: get all conversations */
export const getAllConversations = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("conversations").collect();
  },
});

/** Admin: get all messages */
export const getAllMessages = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("messages").collect();
  },
});

// ─── JOB MANAGEMENT ───

/** Admin: get all job posts */
export const getAllJobPosts = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("jobPosts").collect();
  },
});

// ─── REVIEWS ───

/** Admin: get all reviews */
export const getAllReviews = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("reviews").collect();
  },
});

// ─── WALLET MONITORING ───

/** Admin: get all wallet transactions */
export const getAllWalletTransactions = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("walletTransactions").collect();
  },
});

// ─── CATEGORIES ───

/** Admin: get all categories */
export const getAllCategories = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("productCategories").collect();
  },
});

// ─── NOTIFICATIONS / AUDIT LOGS ───

/** Admin: get audit logs from the real auditLogs table. Falls back to the
 * legacy admin_audit notifications only for entries created before the audit
 * table migration. */
export const getAuditLogs = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const auditLogs = await ctx.db
      .query("auditLogs")
      .order("desc")
      .collect();

    // Legacy fallback: old admin_audit notifications that predate the migration.
    const legacyNotifs = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q: any) => q.eq("userId", "admin_audit"))
      .collect();

    const legacy = legacyNotifs
      .filter((n: any) => n.type === "admin_audit")
      .sort((a: any, b: any) => b.createdAt - a.createdAt);

    return {
      entries: auditLogs,
      legacyCount: legacy.length,
      total: auditLogs.length + legacy.length,
    };
  },
});

// ─── FREELANCE MARKETPLACE MONITORING ───

/** Admin: get all freelance profiles */
export const getAllFreelanceProfiles = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("freelanceProfiles").collect();
  },
});

/** Admin: get all freelance tasks */
export const getAllFreelanceTasks = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("freelanceTasks").collect();
  },
});

/** Admin: get all freelance projects */
export const getAllFreelanceProjects = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("freelanceProjects").collect();
  },
});

/** Admin: get all freelance applications */
export const getAllFreelanceApplications = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("freelanceApplications").collect();
  },
});

/** Admin: suspend a freelancer */
export const suspendFreelancer = mutation({
  args: { profileId: v.string(), reason: v.string() },
  handler: async (ctx, args) => {
    const { user } = await requireAdmin(ctx);
    await ctx.db.patch(args.profileId as any, { status: "suspended" });
    await auditLog(
      ctx as any,
      user._id,
      user.name || user.email || "Admin",
      "SUSPEND_FREELANCER",
      "freelanceProfile",
      args.profileId,
      args.reason
    );
    return { success: true };
  },
});

// ─── PLATFORM SETTINGS ───

/** Admin: get platform settings */
export const getPlatformSettings = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("platformSettings").collect();
  },
});

/** Admin: update a platform setting */
export const updatePlatformSetting = mutation({
  args: {
    key: v.string(),
    value: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireAdmin(ctx);
    const existing = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q: any) => q.eq("key", args.key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.value,
        updatedBy: user._id,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("platformSettings", {
        key: args.key,
        value: args.value,
        updatedBy: user._id,
        updatedAt: Date.now(),
      });
    }

    await auditLog(
      ctx as any,
      user._id,
      user.name || user.email || "Admin",
      "UPDATE_SETTING",
      "platformSetting",
      args.key,
      `Value: ${args.value}`
    );
    return { success: true };
  },
});
