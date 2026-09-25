import { v, ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { getSessionUser } from "./users";

const ADMIN_EMAIL = "murimiedwin227@gmail.com";

// Every row in `users` is part of the admin account directory. In particular,
// partial/auth-library accounts may not have an email, role, or completion
// status yet; requiring those fields here made real signups disappear from
// User Management and made the displayed total smaller than the users table.

/** Helper: verify the current user is an admin.
 * STRICTLY read-only: this runs inside queries, and Convex queries must never
 * write. (The old version patched the role here, which made EVERY admin query
 * throw "Server Error" whenever the stored role was still stale — exactly the
 * getDashboardStats crash on the published site.) The actual role repair is
 * done by the ensureUserProfile / ensureAdminAccess mutations, which run from
 * use-auth and the admin route guard.
 */
async function requireAdmin(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError("Not authenticated");

  const user = await getSessionUser(ctx);
  if (!user) throw new ConvexError("User not found");

  const fresh = await ctx.db.get(user._id);
  if (!fresh) throw new ConvexError("Unauthorized: admin only");

  // Owner fallback: the platform owner email is always authorized, even while
  // the stored role is still being repaired by the mutations above.
  //
  // Match BOTH the session identity's email claim AND the DB record's email.
  // Password-auth sessions on production may not carry an email claim in the
  // identity token, which previously let this check fail while users:isAdmin
  // (which reads the record's email) already passed — the gate opened the panel
  // and every admin query then crashed with "Server Error". Using the same
  // criteria as the gate makes that split impossible.
  const isOwner =
    (typeof identity.email === "string" && identity.email === ADMIN_EMAIL) ||
    (typeof (fresh as any).email === "string" &&
      (fresh as any).email === ADMIN_EMAIL);

  if (fresh.role !== "admin" && !isOwner) {
    throw new ConvexError("Unauthorized: admin only");
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
    const realUsers = users;
    const isSellerAccount = (u: any) =>
      u.role === "seller" || !!u.businessName || u.pendingRole === "seller";
    // Buyers are ONLY accounts with the real buyer role — role-less pending
    // accounts are never silently counted as buyers (each user has exactly
    // one role, assigned through registration/verification).
    const buyers = realUsers.filter((u: any) => (u as any).role === "buyer");
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
    const flProfileUserIds = new Set<string>(freelanceProfiles.map((p: any) => (p as any).userId));
    const freelanceTasks = await ctx.db.query("freelanceTasks").collect();
    const freelanceProjects = await ctx.db.query("freelanceProjects").collect();
    const freelanceApplications = await ctx.db.query("freelanceApplications").collect();
    // Freelance services are listings published to the Freelance Marketplace.
    const freelanceServiceCount = listings.filter(
      (l: any) => l.marketplace === "freelance"
    ).length;

    return {
      users: {
        total: realUsers.length,
        buyers: buyers.length,
        sellers: sellers.length,
        admins: realUsers.filter((u) => u.role === "admin").length,
        // Freelancers counted by role OR profile — the join flow assigns the
        // role at signup, profiles only appear once completed.
        freelancers: realUsers.filter((u: any) => u.role === "freelancer" || flProfileUserIds.has(u._id as any)).length,
        // Counted by role, not by who has posted a task — an employer with no
        // job posts yet is still an employer account.
        employers: realUsers.filter((u) => u.role === "employer").length,
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
        services: freelanceServiceCount,
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

/** Admin: get every user account with computed stats.
 * Partial registrations and auth-library rows are included so admins can see
 * and complete them. Sensitive credential fields (password hashes, auth
 * account ids, admin 2FA secrets) are stripped before records leave the
 * server — the admin UI never needs them. */
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const users = await ctx.db.query("users").collect();
    const listings = await ctx.db.query("listings").collect();
    const escrows = await ctx.db.query("escrows").collect();
    // Phase 2/3: surface service & transport provider status in User Management.
    const serviceProfiles = await ctx.db.query("serviceProfiles").collect();
    const transportProfiles = await ctx.db.query("transportProfiles").collect();
    // Freelance layer: skills/title/rating from freelanceProfiles so the admin
    // users table can show what a freelancer actually does.
    const freelanceProfiles = await ctx.db.query("freelanceProfiles").collect();
    // AI Tasker layer: how many AI-assisted tasks each user posted or worked.
    const aiTasks = await ctx.db.query("aiTasks").collect();
    // Creator program: application/approval state per user.
    const creatorRecords = await ctx.db.query("referralCreators").collect();

    const result = users.map((u) => {
      const userListings = listings.filter((l) => l.sellerId === u._id);
      // Marketplace split: physical product listings vs digital (freelance)
      // listings — legacy rows without the field count as product listings.
      const productListings = userListings.filter(
        (l) => (l as any).marketplace !== "freelance",
      );
      const freelanceListings = userListings.filter(
        (l) => (l as any).marketplace === "freelance",
      );
      const userEscrows = escrows.filter(
        (e) => e.buyerId === u._id || e.sellerId === u._id
      );
      const svcProfile = serviceProfiles.find((p: any) => (p as any).userId === u._id);
      const trpProfile = transportProfiles.find((p: any) => (p as any).userId === u._id);
      const flProfile = freelanceProfiles.find((p: any) => (p as any).userId === u._id);
      const {
        passwordHash: _ph,
        tokenIdentifier: _ti,
        adminPasswordHash: _aph,
        adminPasswordSalt: _aps,
        adminTotpSecret: _ats,
        ...safeUser
      } = u as any;
      // Seller registration completion: a seller only FINISHES registration
      // by uploading + publishing at least one genuine listing (active, with at
      // least one usable character of description — same bar the seller
      // dashboard gate uses, so Admin and the seller panel never disagree).
      const publishedListings = userListings.filter(
        (l: any) =>
          l.status === "active" &&
          typeof l.description === "string" &&
          l.description.replace(/\s+/g, " ").trim().length >= 1,
      ).length;
      const isSeller = safeUser.role === "seller" || safeUser.pendingRole === "seller";
      return {
        ...safeUser,
        listingCount: userListings.length,
        orderCount: userEscrows.length,
        publishedListings,
        // undefined for non-sellers so the UI can show seller-only status.
        registrationComplete: isSeller ? publishedListings > 0 : undefined,
        // Marketplace breakdown for the admin sellers panel.
        productListings: productListings.length,
        freelanceListings: freelanceListings.length,
        totalSpent: escrows
          .filter((e) => e.buyerId === u._id)
          .reduce((sum, e) => sum + e.amount, 0),
        totalEarned: escrows
          .filter((e) => e.sellerId === u._id && ["released", "completed"].includes(e.status))
          .reduce((sum, e) => sum + e.amount, 0),
        // Service/transport provider info for the admin users table.
        serviceType: (svcProfile as any)?.serviceType,
        serviceCategory: (svcProfile as any)?.category,
        serviceVerified: !!(svcProfile as any)?.adminVerified,
        transportType: (trpProfile as any)?.serviceType,
        transportVerified: (trpProfile as any)?.verificationStatus === "verified",
        // Freelance info for the admin users table.
        freelanceTitle: (flProfile as any)?.title,
        freelanceSkills: (flProfile as any)?.skills,
        freelanceStatus: (flProfile as any)?.status,
        freelanceVerified: !!(flProfile as any)?.isVerified,
        // Fields the freelancer picked (e.g. "ai-tasking") — AI tasking is a
        // freelance FIELD, not a separate role.
        freelanceCategories: (flProfile as any)?.categories ?? [],
        // AI Tasker activity (freelance layer — not a separate role).
        aiTasksPosted: aiTasks.filter((t: any) => (t as any).posterId === u._id).length,
        aiTasksWorked: aiTasks.filter((t: any) => (t as any).taskerId === u._id).length,
        // Creator program state.
        creatorStatus: (creatorRecords.find((c: any) => (c as any).userId === u._id) as any)?.status,
      };
    });

    // Newest first — freshly registered accounts surface at the top of every
    // admin user table (Users, Sellers) so the owner sees new signups without
    // scrolling. `_creationTime` is Convex's server write time (always set);
    // joinedAt/lastLoginAt are best-effort fallbacks for legacy rows.
    return result.sort((a: any, b: any) =>
      (b._creationTime ?? b.joinedAt ?? b.lastLoginAt ?? 0) -
      (a._creationTime ?? a.joinedAt ?? a.lastLoginAt ?? 0),
    );
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
    // Use the same complete account set as getAllUsers. Sidebar badges must
    // never disagree with the visible user directory.
    const realUsers = all;
    const freelanceProfiles = await ctx.db.query("freelanceProfiles").collect();
    // A freelancer is a PERSON, not just a completed profile: count every
    // account with the freelancer role (the freelance join flow assigns it
    // at signup) plus anyone with a freelance profile.
    const flProfileUserIds = new Set<string>(freelanceProfiles.map((p: any) => (p as any).userId));
    const isFreelancerAccount = (u: any) => u.role === "freelancer" || flProfileUserIds.has(u._id as any);

    // Sellers include still-verifying accounts (pendingRole === "seller") so
    // new seller registrations are counted the moment they sign up.
    const isSellerAccount = (u: any) =>
      u.role === "seller" || !!u.businessName || u.pendingRole === "seller";
    // Buyers are ONLY accounts with the real buyer role — role-less pending
    // accounts are never silently counted as buyers (each user has exactly
    // one role, assigned through registration/verification).
    const buyers = realUsers.filter(
      (u: any) => (u as any).role === "buyer"
    );
    const sellers = realUsers.filter(isSellerAccount);
    const admins = realUsers.filter((u: any) => u.role === "admin");
    // Employers live in users.role — counted directly so the admin panel
    // always shows every employer account, even ones that haven't posted a
    // job yet (task-based counting would hide them).
    const employers = realUsers.filter((u: any) => u.role === "employer");

    // Service & transport provider count for the User Management stat card.
    const serviceProfiles = await ctx.db.query("serviceProfiles").collect();
    const transportProfiles = await ctx.db.query("transportProfiles").collect();
    const providerUserIds = new Set<string>([
      ...serviceProfiles.map((p: any) => (p as any).userId),
      ...transportProfiles.map((p: any) => (p as any).userId),
    ]);

    return {
      total: realUsers.length,
      buyers: buyers.length,
      sellers: sellers.length,
      freelancers: realUsers.filter(isFreelancerAccount).length,
      freelanceProfiles: freelanceProfiles.length,
      employers: employers.length,
      admins: admins.length,
      serviceProviders: realUsers.filter((u: any) => providerUserIds.has(u._id as any)).length,
      verified: realUsers.filter((u: any) => u.kycStatus === "verified").length,
      pendingKyc: realUsers.filter((u: any) => u.kycStatus === "pending").length,
      recent: realUsers.filter((u: any) => (u._creationTime || 0) > Date.now() - 86400000).length,
    };
  },
});

/** Admin: suspend a user */
/**
 * Admin: set a user's account status (suspend / reactivate).
 *
 * A suspended user is blocked from every panel by the verification gate
 * (RoleRouter treats non-active as unverified) and from placing orders by
 * wallet.createOrder. The owner admin account can never be suspended.
 */
export const setUserSuspended = mutation({
  args: { userId: v.string(), suspended: v.boolean(), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { user } = await requireAdmin(ctx);
    const target = (await ctx.db.get(args.userId as any)) as any;
    if (!target) throw new ConvexError("User not found");
    if (target.email === ADMIN_EMAIL) {
      throw new ConvexError("The platform owner account cannot be suspended");
    }

    if (args.suspended) {
      await ctx.db.patch(target._id, {
        accountStatus: "suspended" as const,
        suspensionReason: args.reason || "Policy violation",
        suspendedAt: Date.now(),
      });
      await ctx.db.insert("notifications", {
        userId: target._id,
        type: "account",
        title: "Account suspended",
        message: `Your Nexora account has been suspended. Reason: ${args.reason || "Policy violation"}. Contact support if you believe this is a mistake.`,
        read: false,
        link: "/",
        createdAt: Date.now(),
      });
    } else {
      await ctx.db.patch(target._id, {
        accountStatus: "active" as const,
        suspensionReason: undefined,
        suspendedAt: undefined,
      });
      await ctx.db.insert("notifications", {
        userId: target._id,
        type: "account",
        title: "Account reinstated",
        message: "Your Nexora account has been reinstated. Welcome back!",
        read: false,
        link: "/",
        createdAt: Date.now(),
      });
    }

    await auditLog(
      ctx as any,
      user._id,
      user.name || user.email || "Admin",
      args.suspended ? "SUSPEND_USER" : "REINSTATE_USER",
      "user",
      String(args.userId),
      `${target.email} — ${args.reason || (args.suspended ? "Suspended" : "Reinstated")}`
    );
    return { success: true };
  },
});

/**
 * @deprecated Legacy stub kept only so old clients don't crash. Does nothing.
 */
export const suspendUser = mutation({
  args: { userId: v.string(), reason: v.string() },
  handler: async (ctx, args) => {
    const { user } = await requireAdmin(ctx);
    const target = await ctx.db.get(args.userId as any);
    if (!target) throw new ConvexError("User not found");

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
/**
 * Admin: assign (or correct) a user's primary role. For accounts stuck in
 * registration (crash mid-signup, interrupted profile sync, legacy stubs) the
 * owner can finish their account here: role is set, the account is activated,
 * and any pendingRole is cleared. Admin itself is deliberately NOT assignable
 * from this UI — admin comes only from the owner-email bootstrap path.
 */
export const adminSetUserRole = mutation({
  args: { userId: v.string(), role: v.string() },
  handler: async (ctx, args) => {
    const { user: admin } = await requireAdmin(ctx);
    const target = (await ctx.db.get(args.userId as any)) as any;
    if (!target) throw new ConvexError("User not found");
    if (target.email === ADMIN_EMAIL) {
      throw new ConvexError("The platform owner account's role is managed by the system");
    }
    if ((target as any).role === "admin") {
      throw new ConvexError("Admin accounts cannot be re-assigned here");
    }

    const allowed = ["buyer", "seller", "freelancer", "employer", "creator", "service_provider", "driver"] as const;
    if (!(allowed as readonly string[]).includes(args.role)) {
      throw new ConvexError("Unknown account type.");
    }

    const previousRole = typeof target.role === "string" && target.role ? target.role : null;
    await ctx.db.patch(target._id, {
      role: args.role as any,
      accountStatus: "active" as const,
      pendingRole: undefined,
    });

    await auditLog(
      ctx,
      admin._id,
      admin.name || admin.email || "admin",
      previousRole ? `role changed: ${previousRole} → ${args.role}` : `role assigned: ${args.role}`,
      "user",
      String(target._id),
      `${target.name || target.email} is now a ${args.role}`,
    );

    // Tell the user their account is ready — the live subscription picks the
    // new role up on their next render, no re-login needed.
    await ctx.db.insert("notifications", {
      userId: target._id,
      type: "account",
      title: "Account updated",
      message: previousRole
        ? `An administrator updated your account type from ${previousRole} to ${args.role}.`
        : `Your Nexora ${args.role} account is ready. Welcome aboard!`,
      read: false,
      link: "/",
      createdAt: Date.now(),
    });

    return { success: true, role: args.role, previousRole };
  },
});

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
    if (!dispute) throw new ConvexError("Dispute not found");
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
    if (!app) throw new ConvexError("KYC application not found");

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
      // Progressive verification + referral: a KYC approval may complete the
      // seller's business gate (KYC + genuine listing). Best-effort.
      if (args.status === "approved") {
        try {
          await ctx.runMutation(internal.referral.internalOnKycVerified, { userId: kycApp.userId });
        } catch (err) {
          console.error("[referral] KYC hook failed:", err);
        }
        try {
          await ctx.runMutation(internal.verification.internalOnKycVerified, { userId: kycApp.userId });
        } catch (err) {
          console.error("[verification] KYC hook failed:", err);
        }
      }
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
    county: v.string(),
    town: v.string(),
    phone: v.string(),
    businessDocumentUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getSessionUser(ctx);
    if (!user) throw new ConvexError("Not authenticated");

    const now = Date.now();

    // ── Registration is OPTIONAL (small-scale sellers) ──
    // Individual sellers and unregistered small traders can verify with just
    // their business details. Format-check only what was actually provided.
    const registrationNumber = args.registrationNumber?.trim() || undefined;

    // One pending application per seller — resubmitting replaces the old one.
    const mine = await ctx.db.query("kycApplications").collect();
    const pending = mine.find(
      (a: any) => a.userId === (user as any)._id && a.status === "pending"
    );
    if (pending) {
      await ctx.db.patch(pending._id, {
        ...args,
        registrationNumber,
        submittedAt: now,
      });
      return { success: true, applicationId: pending._id as string };
    }

    const applicationId = await ctx.db.insert("kycApplications", {
      userId: (user as any)._id,
      businessName: args.businessName,
      businessType: args.businessType,
      registrationNumber,
      county: args.county,
      town: args.town,
      phone: args.phone,
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
    const profiles = await ctx.db.query("freelanceProfiles").collect();
    // Newest first, consistent with the user tables.
    return profiles.sort((a: any, b: any) =>
      (b._creationTime ?? 0) - (a._creationTime ?? 0),
    );
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

// ═══════════════════════════════════════════════════════════════════════════
// COMMAND CENTER — one query powering the upgraded admin dashboard:
// actionable alerts, money-movement reconciliation, 7-day trends, and
// cross-panel deep links. Every number comes from real tables.
// ═══════════════════════════════════════════════════════════════════════════

export const getCommandCenter = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const [
      users, listings, escrows, walletTx, disputes, deliveries, reviews,
      conversations, serviceProfiles, transportProfiles, freelanceProfiles,
      supportTickets, kycApps,
    ] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("listings").collect(),
      ctx.db.query("escrows").collect(),
      ctx.db.query("walletTransactions").collect(),
      ctx.db.query("disputes").collect(),
      ctx.db.query("deliveries").collect(),
      ctx.db.query("reviews").collect(),
      ctx.db.query("conversations").collect(),
      ctx.db.query("serviceProfiles").collect(),
      ctx.db.query("transportProfiles").collect(),
      ctx.db.query("freelanceProfiles").collect(),
      ctx.db.query("supportTickets").collect(),
      ctx.db.query("kycApplications").collect(),
    ]);

    const now = Date.now();
    const DAY = 86400000;
    const realUsers = users;
    const flProfileUserIds = new Set<string>(
      freelanceProfiles.map((p: any) => (p as any).userId)
    );

    // ── Money movement (reconciliation) ──
    const completedEscrows = escrows.filter((e: any) => ["released", "completed"].includes((e as any).status));
    const pendingEscrows = escrows.filter((e: any) => ["funded", "active", "delivery", "inspection"].includes((e as any).status));
    const deposits = walletTx.filter((t: any) => (t as any).type === "deposit" && (t as any).status === "completed");
    const withdrawals = walletTx.filter((t: any) => (t as any).type === "withdrawal");
    const pendingWithdrawals = withdrawals.filter((t: any) => (t as any).status === "pending");
    const refunds = walletTx.filter((t: any) => (t as any).type === "refund");

    // ── 7-day trend (real daily buckets) ──
    const trend: Array<{ day: string; orders: number; revenue: number; users: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const start = now - (i + 1) * DAY;
      const end = now - i * DAY;
      trend.push({
        day: new Date(end).toLocaleDateString("en-GB", { weekday: "short" }),
        orders: escrows.filter((e: any) => (e as any).createdAt >= start && (e as any).createdAt < end).length,
        revenue: completedEscrows
          .filter((e: any) => ((e as any).releasedAt || (e as any).createdAt) >= start && ((e as any).releasedAt || (e as any).createdAt) < end)
          .reduce((s: number, e: any) => s + ((e as any).platformFee || 0), 0),
        users: realUsers.filter((u: any) => (u as any)._creationTime >= start && (u as any)._creationTime < end).length,
      });
    }

    // ── Actionable alerts (every one is a real condition + deep link) ──
    const alerts: Array<{ severity: "critical" | "warning" | "info"; title: string; detail: string; link: string }> = [];
    const openDisputes = disputes.filter((d: any) => ["open", "under_review", "escalated"].includes((d as any).status));
    for (const d of openDisputes) {
      const ageDays = Math.floor((now - ((d as any).createdAt || now)) / DAY);
      if (ageDays >= 3) {
        alerts.push({
          severity: "critical",
          title: `Dispute aging ${ageDays} days`,
          detail: (d as any).title || (d as any).reason || "Dispute needs resolution",
          link: "/admin/disputes",
        });
      }
    }
    if (pendingWithdrawals.length > 0) {
      alerts.push({
        severity: "warning",
        title: `${pendingWithdrawals.length} withdrawal${pendingWithdrawals.length === 1 ? "" : "s"} awaiting payout`,
        detail: `KES ${pendingWithdrawals.reduce((s: number, w: any) => s + (w as any).amount, 0).toLocaleString()} owed to users`,
        link: "/admin/withdrawals",
      });
    }
    const pendingKyc = kycApps.filter((k: any) => (k as any).status === "pending");
    if (pendingKyc.length > 0) {
      alerts.push({
        severity: "info",
        title: `${pendingKyc.length} KYC application${pendingKyc.length === 1 ? "" : "s"} to review`,
        detail: "Sellers waiting for verification",
        link: "/admin/kyc",
      });
    }
    const suspendedUsers = realUsers.filter((u: any) => (u as any).accountStatus === "suspended");
    const fraudReports = supportTickets.filter((r: any) =>
      ["open", "ai_handling", "escalated", "human_review"].includes((r as any).status)
    );
    if (fraudReports.length > 0) {
      alerts.push({
        severity: "warning",
        title: `${fraudReports.length} open report${fraudReports.length === 1 ? "" : "s"}`,
        detail: "User reports need triage",
        link: "/admin/reports",
      });
    }
    const unverifiedProviders = serviceProfiles.filter((p: any) => !(p as any).adminVerified).length +
      transportProfiles.filter((p: any) => (p as any).verificationStatus !== "verified").length;
    if (unverifiedProviders > 0) {
      alerts.push({
        severity: "info",
        title: `${unverifiedProviders} service/transport provider${unverifiedProviders === 1 ? "" : "s"} pending verification`,
        detail: "Providers cannot accept jobs until verified",
        link: "/admin/services",
      });
    }
    const staleEscrows = pendingEscrows.filter(
      (e: any) => now - ((e as any).createdAt || now) > 14 * DAY
    );
    if (staleEscrows.length > 0) {
      alerts.push({
        severity: "warning",
        title: `${staleEscrows.length} order${staleEscrows.length === 1 ? "" : "s"} stuck 14+ days`,
        detail: "Funds still in escrow with no movement",
        link: "/admin/escrow",
      });
    }
    const recentLowReviews = reviews.filter(
      (r: any) => (r as any).rating <= 2 && (now - ((r as any).createdAt || 0)) < 7 * DAY
    );
    if (recentLowReviews.length >= 3) {
      alerts.push({
        severity: "warning",
        title: `${recentLowReviews.length} low ratings this week`,
        detail: "Possible quality or fraud signal",
        link: "/admin/reviews",
      });
    }
    const severityRank = { critical: 0, warning: 1, info: 2 } as const;
    alerts.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

    // ── Users needing attention (finite actionable lists) ──
    const pendingProviderList = [
      ...serviceProfiles.filter((p: any) => !(p as any).adminVerified).map((p: any) => ({
        id: p._id as string,
        name: (p as any).displayName,
        kind: (p as any).serviceType,
        createdAt: (p as any).createdAt,
      })),
      ...transportProfiles.filter((p: any) => (p as any).verificationStatus !== "verified").map((p: any) => ({
        id: p._id as string,
        name: (p as any).displayName,
        kind: (p as any).serviceType,
        createdAt: (p as any).createdAt,
      })),
    ].slice(0, 8);

    return {
      counts: {
        users: realUsers.length,
        buyers: realUsers.filter((u: any) => (u as any).role === "buyer").length,
        sellers: realUsers.filter((u: any) => (u as any).role === "seller" || !!(u as any).businessName).length,
        freelancers: realUsers.filter((u: any) => (u as any).role === "freelancer" || flProfileUserIds.has(u._id as any)).length,
        employers: realUsers.filter((u: any) => (u as any).role === "employer").length,
        suspended: suspendedUsers.length,
        providers: new Set<string>([
          ...serviceProfiles.map((p: any) => (p as any).userId),
          ...transportProfiles.map((p: any) => (p as any).userId),
        ]).size,
        listings: listings.length,
        activeListings: listings.filter((l: any) => (l as any).status === "active").length,
        orders: escrows.length,
        activeOrders: pendingEscrows.length,
        disputes: openDisputes.length,
        inTransit: deliveries.filter((d: any) => (d as any).status === "in_transit").length,
        conversations: conversations.length,
      },
      finance: {
        gmv: escrows.reduce((s: number, e: any) => s + ((e as any).amount || 0), 0),
        revenue: completedEscrows.reduce((s: number, e: any) => s + ((e as any).platformFee || 0), 0),
        buyerFees: completedEscrows.reduce((s: number, e: any) => s + ((e as any).buyerFee || 0), 0),
        heldInEscrow: pendingEscrows.reduce((s: number, e: any) => s + ((e as any).amount || 0), 0),
        deposits: deposits.reduce((s: number, t: any) => s + ((t as any).amount || 0), 0),
        withdrawalsPaid: withdrawals.filter((t: any) => (t as any).status === "completed").reduce((s: number, t: any) => s + ((t as any).amount || 0), 0),
        withdrawalsPending: pendingWithdrawals.reduce((s: number, t: any) => s + ((t as any).amount || 0), 0),
        refunded: refunds.reduce((s: number, t: any) => s + ((t as any).amount || 0), 0),
        pendingWithdrawalCount: pendingWithdrawals.length,
      },
      trend,
      alerts,
      pendingProviders: pendingProviderList,
      recentOrders: escrows
        .slice()
        .sort((a: any, b: any) => ((b as any).createdAt || 0) - ((a as any).createdAt || 0))
        .slice(0, 8)
        .map((e: any) => ({
          id: e._id as string,
          title: (e as any).title || "Order",
          amount: (e as any).amount || 0,
          status: (e as any).status,
          marketplace: (e as any).marketplace,
          createdAt: (e as any).createdAt,
        })),
    };
  },
});

// ─── WITHDRAWAL APPROVALS ───────────────────────────────────────────────────
// Admin marks a pending withdrawal paid (M-Pesa sent the money) or rejects it
// (auto-refund back to the user's wallet). Every action is audit-logged.

export const reviewWithdrawal = mutation({
  args: {
    transactionId: v.string(),
    approve: v.boolean(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireAdmin(ctx);
    const tx = (await ctx.db.get(args.transactionId as any)) as any;
    if (!tx) throw new ConvexError("Withdrawal not found");
    if (tx.type !== "withdrawal") throw new ConvexError("Not a withdrawal transaction");
    if (tx.status !== "pending" && tx.status !== "processing") {
      throw new ConvexError(`This withdrawal is already ${tx.status}`);
    }

    if (args.approve) {
      await ctx.db.patch(tx._id, { status: "completed" });
      await auditLog(
        ctx as any, user._id, user.name || user.email || "Admin",
        "WITHDRAWAL_APPROVED", "walletTransaction", tx._id,
        `KES ${tx.amount} paid out. ${args.note || ""}`
      );
      await ctx.db.insert("notifications", {
        userId: tx.userId,
        type: "payment",
        title: "Withdrawal paid ✓",
        message: `KES ${tx.amount.toLocaleString()} has been sent to your M-Pesa. ${args.note || ""}`.trim(),
        read: false,
        link: "/buyer/wallet",
        createdAt: Date.now(),
      });
      return { success: true, status: "completed" as const };
    }

    // Reject → auto-refund the money back to the wallet.
    const u = (await ctx.db.get(tx.userId as any)) as any;
    await ctx.db.patch(tx._id, { status: "failed" });
    if (u) {
      await ctx.db.patch(u._id, { walletBalance: (u.walletBalance || 0) + tx.amount });
      await ctx.db.insert("walletTransactions", {
        userId: u._id,
        type: "refund",
        amount: tx.amount,
        currency: "KES",
        status: "completed",
        reference: `NX-WDREF-${Date.now()}`,
        description: `Withdrawal ${tx.reference} rejected — amount returned to wallet`,
        createdAt: Date.now(),
      });
      await ctx.db.insert("notifications", {
        userId: u._id,
        type: "payment",
        title: "Withdrawal returned to wallet",
        message: `Your withdrawal of KES ${tx.amount.toLocaleString()} could not be processed and the amount is back in your wallet. ${args.note || ""}`.trim(),
        read: false,
        link: "/buyer/wallet",
        createdAt: Date.now(),
      });
    }
    await auditLog(
      ctx as any, user._id, user.name || user.email || "Admin",
      "WITHDRAWAL_REJECTED", "walletTransaction", tx._id,
      `KES ${tx.amount} refunded to wallet. ${args.note || ""}`
    );
    return { success: true, status: "failed" as const };
  },
});

// ─── WALLET ADJUSTMENT (manual correction, fully audited) ───────────────────
// For support cases: correct a wallet by ±amount with a mandatory reason.

export const adjustWallet = mutation({
  args: {
    userId: v.string(),
    amount: v.number(), // positive = credit, negative = debit
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const { user: admin } = await requireAdmin(ctx);
    if (!args.reason.trim()) throw new ConvexError("A reason is required for any wallet adjustment");
    if (args.amount === 0) throw new ConvexError("Adjustment amount cannot be zero");
    const target = (await ctx.db.get(args.userId as any)) as any;
    if (!target) throw new ConvexError("User not found");

    const newBalance = Math.max(0, (target.walletBalance || 0) + args.amount);
    await ctx.db.patch(target._id, { walletBalance: newBalance });
    await ctx.db.insert("walletTransactions", {
      userId: target._id,
      type: args.amount > 0 ? "deposit" : "withdrawal",
      amount: Math.abs(args.amount),
      currency: "KES",
      status: "completed",
      reference: `NX-ADJ-${Date.now()}`,
      description: `Admin adjustment (${args.amount > 0 ? "+" : "-"}KES ${Math.abs(args.amount).toLocaleString()}): ${args.reason.trim()}`,
      createdAt: Date.now(),
    });
    await ctx.db.insert("notifications", {
      userId: target._id,
      type: "payment",
      title: args.amount > 0 ? "Wallet credited" : "Wallet adjusted",
      message: `${args.amount > 0 ? "KES " + args.amount.toLocaleString() + " was added to" : "KES " + Math.abs(args.amount).toLocaleString() + " was deducted from"} your wallet. Reason: ${args.reason.trim()}`,
      read: false,
      link: "/buyer/wallet",
      createdAt: Date.now(),
    });
    await auditLog(
      ctx as any, admin._id, admin.name || admin.email || "Admin",
      "WALLET_ADJUSTMENT", "user", target._id,
      `${args.amount > 0 ? "+" : "-"}KES ${Math.abs(args.amount).toLocaleString()} — ${args.reason.trim()}`
    );
    return { success: true, newBalance };
  },
});
