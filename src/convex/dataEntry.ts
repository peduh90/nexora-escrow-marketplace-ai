import { v, ConvexError } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { getSessionUser } from "./users";
import { ALLOWED_ROLES } from "./roles";

const ADMIN_EMAIL = "murimiedwin227@gmail.com";

async function requireAdmin(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError("Not authenticated");
  const user = await getSessionUser(ctx);
  if (!user) throw new ConvexError("User not found");
  const fresh = await ctx.db.get(user._id);
  if (!fresh) throw new ConvexError("Unauthorized: admin only");
  const isOwner =
    (typeof identity.email === "string" && identity.email === ADMIN_EMAIL) ||
    (typeof (fresh as any).email === "string" && (fresh as any).email === ADMIN_EMAIL);
  if ((fresh as any).role !== "admin" && !isOwner) {
    throw new ConvexError("Unauthorized: admin only");
  }
  return fresh as any;
}

// ─── PERMISSIONS ───────────────────────────────────────────────────────────
const DEFAULT_DATA_ENTRY_PERMISSIONS = [
  "PRODUCT_CREATE",
  "PRODUCT_EDIT",
  "PRODUCT_IMAGE_UPLOAD",
  "PRODUCT_VIEW",
  "PRODUCT_SUBMIT",
  "PRODUCT_DELETE_DRAFT",
];

// ─── HELPERS ───────────────────────────────────────────────────────────────

async function requireSeller(ctx: any): Promise<any> {
  const user = await getSessionUser(ctx);
  if (!user) throw new ConvexError("Not authenticated");
  if (user.role !== "seller") throw new ConvexError("Seller account required");
  return user;
}

async function requireDataEntryWorker(ctx: any): Promise<any> {
  const user = await getSessionUser(ctx);
  if (!user) throw new ConvexError("Not authenticated");
  if (user.role !== "data_entry") throw new ConvexError("Data entry account required");
  return user;
}

async function requireWorkerAccessToSeller(
  ctx: any,
  workerId: string,
  sellerId: string,
): Promise<any> {
  const staff = await ctx.db
    .query("sellerStaff")
    .withIndex("by_worker", (q: any) => q.eq("workerId", workerId))
    .first();
  if (!staff) throw new ConvexError("No staff relationship found");
  if (staff.sellerId !== sellerId) throw new ConvexError("Not authorized for this seller");
  if (staff.status !== "active") throw new ConvexError("Staff access is not active");
  return staff;
}

async function insertAudit(
  ctx: any,
  actorId: string,
  actorName: string,
  actorRole: string,
  action: string,
  sellerId: string,
  jobId?: string,
  productId?: string,
  details?: string,
) {
  const now = Date.now();
  await ctx.db.insert("auditLogs", {
    adminId: actorId,
    adminName: actorName,
    adminRole: actorRole,
    action,
    target: jobId ? "data_entry_job" : "data_entry_staff",
    targetId: jobId || undefined,
    details: details || undefined,
    createdAt: now,
  });

  if (sellerId) {
    await ctx.db.insert("notifications", {
      userId: sellerId,
      type: "data_entry",
      title: `Staff: ${action}`,
      message: details || `${action} — ${new Date(now).toLocaleString()}`,
      read: false,
      link: "/seller/my-team",
      createdAt: now,
    });
  }
}

// ─── INVITATIONS ───────────────────────────────────────────────────────────

/**
 * Listing docs store image storage keys; readers need real URLs. Mirrors
 * listings.resolveListingImages (storage key → signed URL, else pass through
 * http URLs).
 */
async function resolveListingImages(ctx: any, images: string[] | undefined): Promise<string[]> {
  const out: string[] = [];
  for (const img of images || []) {
    try {
      const url = await ctx.storage.getUrl(img);
      if (url) { out.push(url); continue; }
    } catch { /* not a storage key */ }
    if (typeof img === "string" && img.startsWith("http")) out.push(img);
  }
  return out;
}

async function listingWithUrls(ctx: any, listing: any) {
  if (!listing) return null;
  return { ...listing, images: await resolveListingImages(ctx, listing.images) };
}

export const myPendingInvitations = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireSeller(ctx);
    const rows = await ctx.db
      .query("sellerStaffInvitations")
      .withIndex("by_seller", (q: any) => q.eq("sellerId", user._id))
      .collect();
    return rows.filter((r: any) => r.status === "pending");
  },
});

export const myActiveStaff = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireSeller(ctx);
    const rows = await ctx.db
      .query("sellerStaff")
      .withIndex("by_seller", (q) => q.eq("sellerId", user._id))
      .collect();
    const active = rows.filter((r: any) => r.status === "active");
    return Promise.all(
      active.map(async (r: any) => {
        const w = await ctx.db.get(r.workerId as any);
        return {
          ...r,
          workerName: (w as any)?.name || (w as any)?.email || "Worker",
          workerEmail: (w as any)?.email,
          workerPhone: (w as any)?.phone,
        };
      }),
    );
  },
});

export const myStaffActivity = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireSeller(ctx);
    const staff = await ctx.db
      .query("sellerStaff")
      .withIndex("by_seller", (q) => q.eq("sellerId", user._id))
      .collect();
    return Promise.all(
      staff.map(async (r: any) => {
        const w = await ctx.db.get(r.workerId as any);
        const products = await ctx.db
          .query("dataEntryProducts")
          .withIndex("by_worker", (q: any) => q.eq("workerId", r.workerId))
          .collect();
        const submitted = products.filter((p: any) => p.status === "pending_seller_review").length;
        const approved = products.filter((p: any) => p.status === "approved" || p.status === "published").length;
        const rejected = products.filter((p: any) => p.status === "rejected").length;
        const changes = products.filter((p: any) => p.status === "changes_requested").length;
        return {
          ...r,
          workerName: (w as any)?.name || (w as any)?.email || "Worker",
          totalProducts: products.length,
          submitted,
          approved,
          rejected,
          changesRequested: changes,
        };
      }),
    );
  },
});

export const createInvitation = mutation({
  args: {
    inviteeName: v.optional(v.string()),
    inviteeEmail: v.optional(v.string()),
    inviteePhone: v.optional(v.string()),
    description: v.optional(v.string()),
    permissions: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const seller = await requireSeller(ctx);

    if (!args.inviteeEmail && !args.inviteePhone) {
      throw new ConvexError("Provide an email or phone for the worker");
    }

    const now = Date.now();
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000;

    const permissions = (args.permissions?.length ? args.permissions : DEFAULT_DATA_ENTRY_PERMISSIONS) as string[];

    const id = await ctx.db.insert("sellerStaffInvitations", {
      sellerId: seller._id,
      inviteeEmail: args.inviteeEmail,
      inviteePhone: args.inviteePhone,
      inviteeName: args.inviteeName,
      description: args.description,
      role: "data_entry",
      permissions,
      status: "pending",
      invitedBy: seller._id,
      invitedByName: seller.name || seller.businessName || seller.email || "Seller",
      createdAt: now,
      expiresAt,
    });

    await insertAudit(
      ctx,
      seller._id,
      seller.name || seller.businessName || "Seller",
      "seller",
      "WORKER_INVITED",
      seller._id,
      undefined,
      undefined,
      `Invited ${args.inviteeName || args.inviteeEmail || args.inviteePhone} to join data entry team`,
    );

    return { invitationId: id };
  },
});

export const getInvitation = query({
  args: {
    invitationId: v.id("sellerStaffInvitations"),
    inviteeEmail: v.optional(v.string()),
    inviteePhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getSessionUser(ctx);
    if (!user) throw new ConvexError("Not authenticated");
    const inv = await ctx.db.get(args.invitationId);
    if (!inv) throw new ConvexError("Invitation not found");
    const invAny = inv as any;
    if (user._id !== invAny.sellerId) {
      if (args.inviteeEmail && invAny.inviteeEmail !== args.inviteeEmail) throw new ConvexError("Not authorized");
      if (args.inviteePhone && invAny.inviteePhone !== args.inviteePhone) throw new ConvexError("Not authorized");
    }
    return inv;
  },
});

export const acceptInvitation = mutation({
  args: { invitationId: v.id("sellerStaffInvitations") },
  handler: async (ctx, args) => {
    const user = await getSessionUser(ctx);
    if (!user) throw new ConvexError("Not authenticated");

    const inv = await ctx.db.get(args.invitationId);
    if (!inv) throw new ConvexError("Invitation not found");
    const invAny = inv as any;
    if (invAny.status !== "pending") throw new ConvexError("Invitation already processed");
    if (invAny.expiresAt < Date.now()) {
      await ctx.db.patch(args.invitationId, { status: "expired" });
      throw new ConvexError("Invitation expired");
    }

    const identity = await ctx.auth.getUserIdentity();
    const email = typeof identity?.email === "string" ? identity.email : undefined;
    const phone = user.phone;

    if (invAny.inviteeEmail && email && invAny.inviteeEmail.toLowerCase() !== email.toLowerCase()) {
      throw new ConvexError("This invitation was sent to a different email");
    }
    if (!invAny.inviteeEmail && invAny.inviteePhone && phone && invAny.inviteePhone !== phone) {
      throw new ConvexError("This invitation was sent to a different phone");
    }

    const now = Date.now();
    const staffId = await ctx.db.insert("sellerStaff", {
      sellerId: invAny.sellerId,
      workerId: user._id,
      role: "data_entry",
      status: "active",
      permissions: invAny.permissions,
      invitedBy: invAny.invitedBy,
      invitedByName: invAny.invitedByName,
      invitedAt: invAny.createdAt,
      acceptedAt: now,
      createdAt: now,
    });

    await ctx.db.patch(args.invitationId, { status: "accepted" });

    // The worker panel is gated on the data_entry role. Accepting an
    // invitation is the explicit, audited moment this account becomes a
    // data-entry worker — one account, one role, per the platform rule
    // (internalEnsureDataEntryRole exists for admin-driven repairs).
    if (user.role !== "data_entry") {
      await ctx.db.patch(user._id, { role: "data_entry" });
    }

    await insertAudit(
      ctx,
      user._id,
      user.name || user.email || "Worker",
      "data_entry",
      "WORKER_ACCEPTED",
      inv.sellerId,
      undefined,
      undefined,
      `Worker accepted invitation and joined ${inv.invitedByName}'s team`,
    );

    const seller = await ctx.db.get(inv.sellerId as any);
    if (seller) {
      await ctx.db.insert("notifications", {
        userId: inv.sellerId,
        type: "data_entry",
        title: "Worker accepted invitation",
        message: `${user.name || user.email || "A worker"} has joined your data entry team.`,
        read: false,
        link: "/seller/my-team",
        createdAt: now,
      });
    }

    return { staffId };
  },
});

export const cancelInvitation = mutation({
  args: { invitationId: v.id("sellerStaffInvitations") },
  handler: async (ctx, args) => {
    const seller = await requireSeller(ctx);
    const inv = await ctx.db.get(args.invitationId);
    if (!inv) throw new ConvexError("Invitation not found");
    const invAny = inv as any;
    if (invAny.sellerId !== seller._id) throw new ConvexError("Not your invitation");
    if (invAny.status !== "pending") throw new ConvexError("Cannot cancel this invitation");

    await ctx.db.patch(args.invitationId, { status: "cancelled" });

    await insertAudit(
      ctx,
      seller._id,
      seller.name || seller.businessName || "Seller",
      "seller",
      "INVITATION_CANCELLED",
      seller._id,
      undefined,
      undefined,
      `Cancelled invitation to ${invAny.inviteeName || invAny.inviteeEmail || invAny.inviteePhone}`,
    );

    return { success: true };
  },
});

// ─── STAFF MANAGEMENT ──────────────────────────────────────────────────────

export const revokeAccess = mutation({
  args: {
    workerId: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const seller = await requireSeller(ctx);
    // Find staff by workerId index then filter by sellerId
    const allByWorker = await ctx.db
      .query("sellerStaff")
      .withIndex("by_worker", (q: any) => q.eq("workerId", args.workerId))
      .collect();
    const staff = allByWorker.find((r: any) => r.sellerId === seller._id);
    if (!staff) throw new ConvexError("Staff record not found");
    if (staff.status !== "active") throw new ConvexError("Staff is not active");

    const now = Date.now();
    await ctx.db.patch(staff._id, {
      status: "revoked",
      revokedAt: now,
      revokedBy: seller._id,
      revokeReason: args.reason,
    });

    // Mark any in-progress assignments as rejected
    const assignments = await ctx.db
      .query("dataEntryAssignments")
      .withIndex("by_worker", (q: any) => q.eq("workerId", args.workerId))
      .collect();
    for (const a of assignments) {
      if (a.sellerId === seller._id && (a.status === "assigned" || a.status === "in_progress" || a.status === "submitted")) {
        await ctx.db.patch(a._id, {
          status: "rejected" as any,
          reviewNote: `Access revoked: ${args.reason || "No reason provided"}`,
        });
      }
    }

    await insertAudit(
      ctx,
      seller._id,
      seller.name || seller.businessName || "Seller",
      "seller",
      "ACCESS_REVOKED",
      seller._id,
      undefined,
      args.workerId,
      `Revoked data entry access: ${args.reason || "No reason provided"}`,
    );

    const worker = await ctx.db.get(args.workerId as any);
    if (worker) {
      await ctx.db.insert("notifications", {
        userId: args.workerId,
        type: "data_entry",
        title: "Access revoked",
        message: `Your data entry access to ${(seller as any)?.businessName || (seller as any)?.name || "this seller"} has been revoked.`,
        read: false,
        link: "/data-entry",
        createdAt: now,
      });
    }

    return { success: true };
  },
});

export const updateStaffPermissions = mutation({
  args: {
    workerId: v.string(),
    permissions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const seller = await requireSeller(ctx);
    const allByWorker = await ctx.db
      .query("sellerStaff")
      .withIndex("by_worker", (q: any) => q.eq("workerId", args.workerId))
      .collect();
    const staff = allByWorker.find((r: any) => r.sellerId === seller._id);
    if (!staff) throw new ConvexError("Staff record not found");
    if (staff.status !== "active") throw new ConvexError("Staff is not active");

    await ctx.db.patch(staff._id, { permissions: args.permissions });

    await insertAudit(
      ctx,
      seller._id,
      seller.name || seller.businessName || "Seller",
      "seller",
      "STAFF_PERMISSIONS_UPDATED",
      seller._id,
      undefined,
      args.workerId,
      `Updated permissions: ${args.permissions.join(", ")}`,
    );

    return { success: true };
  },
});

// ─── SELLER: JOBS ───────────────────────────────────────────────────────────

export const myJobs = query({
  args: {},
  handler: async (ctx) => {
    const seller = await requireSeller(ctx);
    const jobs = await ctx.db
      .query("dataEntryJobs")
      .withIndex("by_seller", (q: any) => q.eq("sellerId", seller._id))
      .order("desc")
      .collect();
    return jobs;
  },
});

export const createJob = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    productCount: v.number(),
    category: v.string(),
    deadline: v.optional(v.number()),
    pricePerProduct: v.number(),
    requiredSkills: v.optional(v.array(v.string())),
    publishMode: v.union(v.literal("manual"), v.literal("auto")),
  },
  handler: async (ctx, args) => {
    const seller = await requireSeller(ctx);
    if (args.productCount < 1) throw new ConvexError("productCount must be at least 1");
    if (args.pricePerProduct <= 0) throw new ConvexError("pricePerProduct must be greater than 0");

    const now = Date.now();
    const totalBudget = args.pricePerProduct * args.productCount;

    const id = await ctx.db.insert("dataEntryJobs", {
      sellerId: seller._id,
      createdBy: seller._id,
      createdByName: seller.name || seller.businessName || seller.email || "Seller",
      title: args.title,
      description: args.description,
      productCount: args.productCount,
      category: args.category,
      deadline: args.deadline,
      pricePerProduct: args.pricePerProduct,
      totalBudget,
      requiredSkills: args.requiredSkills,
      status: "draft",
      publishMode: args.publishMode || "manual",
      createdAt: now,
    });

    await insertAudit(
      ctx,
      seller._id,
      seller.name || seller.businessName || "Seller",
      "seller",
      "JOB_CREATED",
      seller._id,
      id as any,
      undefined,
      `${args.title} — ${args.productCount} products, ${args.pricePerProduct} per product`,
    );

    return { jobId: id };
  },
});

export const publishJob = mutation({
  args: { jobId: v.id("dataEntryJobs") },
  handler: async (ctx, args) => {
    const seller = await requireSeller(ctx);
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new ConvexError("Job not found");
    if (job.sellerId !== seller._id) throw new ConvexError("Not your job");
    if (job.status !== "draft") throw new ConvexError("Only draft jobs can be published");

    await ctx.db.patch(args.jobId, { status: "open", updatedAt: Date.now() });

    await insertAudit(
      ctx,
      seller._id,
      seller.name || seller.businessName || "Seller",
      "seller",
      "JOB_PUBLISHED",
      seller._id,
      args.jobId as any,
      undefined,
      `${job.title} is now open for workers`,
    );

    return { success: true };
  },
});

export const cancelJob = mutation({
  args: { jobId: v.id("dataEntryJobs") },
  handler: async (ctx, args) => {
    const seller = await requireSeller(ctx);
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new ConvexError("Job not found");
    if (job.sellerId !== seller._id) throw new ConvexError("Not your job");

    await ctx.db.patch(args.jobId, { status: "cancelled", updatedAt: Date.now() });

    await insertAudit(
      ctx,
      seller._id,
      seller.name || seller.businessName || "Seller",
      "seller",
      "JOB_CANCELLED",
      seller._id,
      args.jobId as any,
      undefined,
      `${job.title} cancelled`,
    );

    return { success: true };
  },
});

// ─── WORKER: BROWSE JOBS ────────────────────────────────────────────────────

export const browseJobs = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireDataEntryWorker(ctx);
    const jobs = await ctx.db
      .query("dataEntryJobs")
      .withIndex("by_status", (q: any) => q.eq("status", "open"))
      .order("desc")
      .collect();
    return jobs.map((j: any) => ({
      ...j,
      sellerName: j.createdByName,
    }));
  },
});

export const myAssignedJobs = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireDataEntryWorker(ctx);
    const apps = await ctx.db
      .query("dataEntryApplications")
      .withIndex("by_worker", (q: any) => q.eq("workerId", user._id))
      .collect();
    const jobIds = apps
      .filter((a: any) => a.status === "accepted")
      .map((a: any) => a.jobId);
    const jobs = await Promise.all(jobIds.map((jid) => ctx.db.get(jid)));
    return jobs.filter(Boolean);
  },
});

export const applyToJob = mutation({
  args: {
    jobId: v.id("dataEntryJobs"),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const worker = await requireDataEntryWorker(ctx);
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new ConvexError("Job not found");
    if (job.status !== "open") throw new ConvexError("Job is not open");

    const existing = await ctx.db
      .query("dataEntryApplications")
      .withIndex("by_worker", (q: any) => q.eq("workerId", worker._id))
      .collect();
    if (existing.some((a: any) => a.jobId === args.jobId && a.status === "pending")) {
      throw new ConvexError("You have already applied to this job");
    }

    const now = Date.now();
    const id = await ctx.db.insert("dataEntryApplications", {
      jobId: args.jobId as any,
      workerId: worker._id,
      workerName: worker.name || worker.email || "Worker",
      message: args.message,
      status: "pending",
      appliedAt: now,
    });

    await insertAudit(
      ctx,
      worker._id,
      worker.name || worker.email || "Worker",
      "data_entry",
      "JOB_APPLIED",
      job.sellerId,
      args.jobId as any,
      undefined,
      `Applied to ${job.title}`,
    );

    await ctx.db.insert("notifications", {
      userId: job.sellerId,
      type: "data_entry",
      title: "New job application",
      message: `${worker.name || worker.email || "A worker"} applied to "${job.title}".`,
      read: false,
      link: "/seller/my-team",
      createdAt: now,
    });

    return { applicationId: id };
  },
});

export const acceptApplication = mutation({
  args: {
    jobId: v.id("dataEntryJobs"),
    applicationId: v.id("dataEntryApplications"),
  },
  handler: async (ctx, args) => {
    const seller = await requireSeller(ctx);
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new ConvexError("Job not found");
    if (job.sellerId !== seller._id) throw new ConvexError("Not your job");

    const app = await ctx.db.get(args.applicationId);
    if (!app) throw new ConvexError("Application not found");
    if (app.jobId !== args.jobId) throw new ConvexError("Application does not match job");
    if (app.status !== "pending") throw new ConvexError("Application already processed");

    await ctx.db.patch(args.applicationId, {
      status: "accepted",
      reviewedAt: Date.now(),
      reviewedBy: seller._id,
    });
    await ctx.db.patch(args.jobId, {
      status: "assigned",
      acceptedWorkerId: app.workerId,
      updatedAt: Date.now(),
    });

    await insertAudit(
      ctx,
      seller._id,
      seller.name || seller.businessName || "Seller",
      "seller",
      "JOB_ACCEPTED",
      seller._id,
      args.jobId as any,
      app.workerId,
      `Accepted ${app.workerName} for ${job.title}`,
    );

    const now2 = Date.now();
    const assignments: string[] = [];
    for (let i = 0; i < job.productCount; i++) {
      const aid = await ctx.db.insert("dataEntryAssignments", {
        jobId: args.jobId as any,
        sellerId: seller._id,
        workerId: app.workerId,
        status: "assigned",
        assignedAt: now2,
      });
      assignments.push(aid);
    }

    await ctx.db.insert("notifications", {
      userId: app.workerId,
      type: "data_entry",
      title: "Job accepted",
      message: `You have been accepted for "${job.title}". Start entering products.`,
      read: false,
      link: "/data-entry",
      createdAt: now2,
    });

    return { success: true, assignmentCount: assignments.length };
  },
});

export const rejectApplication = mutation({
  args: {
    jobId: v.id("dataEntryJobs"),
    applicationId: v.id("dataEntryApplications"),
  },
  handler: async (ctx, args) => {
    const seller = await requireSeller(ctx);
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new ConvexError("Job not found");
    if (job.sellerId !== seller._id) throw new ConvexError("Not your job");

    const app = await ctx.db.get(args.applicationId);
    if (!app) throw new ConvexError("Application not found");
    if (app.jobId !== args.jobId) throw new ConvexError("Application does not match job");
    if (app.status !== "pending") throw new ConvexError("Application already processed");

    await ctx.db.patch(args.applicationId, {
      status: "rejected",
      reviewedAt: Date.now(),
      reviewedBy: seller._id,
    });

    await insertAudit(
      ctx,
      seller._id,
      seller.name || seller.businessName || "Seller",
      "seller",
      "JOB_APPLICATION_REJECTED",
      seller._id,
      args.jobId as any,
      app.workerId,
      `Rejected ${app.workerName}`,
    );

    return { success: true };
  },
});

// ─── WORKER: PRODUCT CREATION ──────────────────────────────────────────────

export const createDelegatedProduct = mutation({
  args: {
    sellerId: v.string(),
    jobId: v.optional(v.string()),
    assignmentId: v.optional(v.id("dataEntryAssignments")),
    listingArgs: v.object({
      title: v.string(),
      description: v.string(),
      price: v.number(),
      currency: v.string(),
      category: v.string(),
      subcategory: v.optional(v.string()),
      images: v.optional(v.array(v.string())),
      transportAvailable: v.boolean(),
      transportFee: v.optional(v.number()),
      originCounty: v.string(),
      originTown: v.string(),
      condition: v.optional(v.string()),
      attributes: v.optional(v.record(v.string(), v.string())),
      negotiable: v.optional(v.boolean()),
      originalPrice: v.optional(v.number()),
      wholesale: v.optional(v.boolean()),
      moq: v.optional(v.number()),
      tierPrices: v.optional(v.array(v.object({ minQty: v.number(), price: v.number() }))),
      rental: v.optional(v.boolean()),
      ratePerDay: v.optional(v.number()),
      depositAmount: v.optional(v.number()),
      minRentalDays: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const worker = await requireDataEntryWorker(ctx);
    await requireWorkerAccessToSeller(ctx, worker._id, args.sellerId);

    if (args.jobId) {
      const job = await ctx.db.get(args.jobId as any);
      if (!job) throw new ConvexError("Job not found");
      const jobAny = job as any;
      if (jobAny.sellerId !== args.sellerId) throw new ConvexError("Job does not belong to this seller");
      if (jobAny.acceptedWorkerId !== worker._id) throw new ConvexError("You are not the accepted worker for this job");
    }
    if (args.assignmentId) {
      const a = await ctx.db.get(args.assignmentId);
      if (!a) throw new ConvexError("Assignment not found");
      if (a.workerId !== worker._id || a.sellerId !== args.sellerId) {
        throw new ConvexError("Assignment does not belong to you for this seller");
      }
      if (a.status !== "assigned" && a.status !== "in_progress") {
        throw new ConvexError("Assignment is not open for work");
      }
    }

    const now = Date.now();
    const seller = (await ctx.db.get(args.sellerId as any)) as any;
    if (!seller) throw new ConvexError("Seller not found");

    const la = args.listingArgs as any;

    const listingId = await ctx.db.insert("listings", {
      marketplace: "product",
      sellerId: args.sellerId,
      title: la.title,
      description: la.description,
      price: la.price,
      currency: la.currency || "KES",
      category: la.category,
      subcategory: la.subcategory,
      images: la.images ?? [],
      documents: [],
      transportAvailable: la.transportAvailable,
      transportFee: la.transportFee,
      originCounty: la.originCounty,
      originTown: la.originTown,
      escrowProtection: true,
      insuranceProtection: false,
      condition: la.condition || "Brand New",
      verified: seller.kycStatus === "verified" || seller.verificationLevel === "business",
      sellerName: seller.businessName || seller.name || "Seller",
      sellerReputation: seller.reputation || 0,
      sellerVerified: seller.kycStatus === "verified" || seller.verificationLevel === "business",
      attributes: la.attributes,
      negotiable: la.negotiable || false,
      originalPrice: la.originalPrice && la.originalPrice > la.price ? Math.round(la.originalPrice) : undefined,
      wholesale:
        la.wholesale && la.moq && la.moq >= 2 && la.tierPrices && la.tierPrices.length > 0 &&
        la.tierPrices.every((t: any) => t.minQty >= 2 && t.price > 0)
          ? true
          : undefined,
      moq: la.wholesale && la.moq && la.moq >= 2 ? Math.round(la.moq) : undefined,
      tierPrices:
        la.wholesale && la.tierPrices && la.tierPrices.length > 0
          ? la.tierPrices
              .filter((t: any) => t.minQty >= 2 && t.price > 0)
              .map((t: any) => ({ minQty: Math.round(t.minQty), price: Math.round(t.price) }))
              .sort((a: any, b: any) => a.minQty - b.minQty)
          : undefined,
      rental:
        la.rental && la.ratePerDay && la.ratePerDay > 0 && la.depositAmount !== undefined && la.depositAmount >= 0
          ? true
          : undefined,
      ratePerDay: la.rental && la.ratePerDay && la.ratePerDay > 0 ? Math.round(la.ratePerDay) : undefined,
      depositAmount: la.rental && la.depositAmount !== undefined && la.depositAmount >= 0 ? Math.round(la.depositAmount) : undefined,
      minRentalDays: la.rental && la.minRentalDays && la.minRentalDays >= 1 ? Math.round(la.minRentalDays) : undefined,
      views: 0,
      favorites: 0,
      status: "active",
      createdAt: now,
    });

    await ctx.db.insert("listingAuthorNotes", {
      listingId,
      sellerId: args.sellerId,
      createdBy: worker._id,
      createdVia: "data_entry",
      createdAt: now,
    });

    const depId = await ctx.db.insert("dataEntryProducts", {
      listingId,
      sellerId: args.sellerId,
      workerId: worker._id,
      jobId: args.jobId,
      assignmentId: args.assignmentId,
      status: "draft",
      publishMode: "manual",
      createdAt: now,
    });

    if (args.assignmentId) {
      await ctx.db.patch(args.assignmentId, {
        productId: listingId as any,
        status: "in_progress",
      });
    }

    await insertAudit(
      ctx,
      worker._id,
      worker.name || worker.email || "Worker",
      "data_entry",
      "PRODUCT_CREATED",
      args.sellerId,
      args.jobId,
      listingId as any,
      `${la.title} created for ${seller.businessName || seller.name || "seller"}`,
    );

    await ctx.db.insert("notifications", {
      userId: args.sellerId,
      type: "data_entry",
      title: "New product draft",
      message: `${worker.name || worker.email || "A worker"} created a new product draft: ${la.title}.`,
      read: false,
      link: "/seller/my-team",
      createdAt: now,
    });

    return { listingId, productEntryId: depId };
  },
});

// ─── WORKER: SUBMIT FOR REVIEW ─────────────────────────────────────────────

export const submitForReview = mutation({
  args: {
    sellerId: v.string(),
    productEntryId: v.id("dataEntryProducts"),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const worker = await requireDataEntryWorker(ctx);
    await requireWorkerAccessToSeller(ctx, worker._id, args.sellerId);

    const dep = await ctx.db.get(args.productEntryId);
    if (!dep) throw new ConvexError("Product entry not found");
    if (dep.sellerId !== args.sellerId) throw new ConvexError("Not your product");
    if (dep.workerId !== worker._id) throw new ConvexError("Not your product");
    if (dep.status !== "draft") throw new ConvexError("Only draft products can be submitted");

    const now = Date.now();
    await ctx.db.patch(args.productEntryId, {
      status: "pending_seller_review",
      submittedAt: now,
    });

    if (dep.assignmentId) {
      await ctx.db.patch(dep.assignmentId, {
        status: "submitted",
        submittedAt: now,
      });
    }

    await insertAudit(
      ctx,
      worker._id,
      worker.name || worker.email || "Worker",
      "data_entry",
      "PRODUCT_SUBMITTED",
      args.sellerId,
      dep.jobId,
      args.productEntryId as any,
      `Submitted for seller review: ${dep.listingId}`,
    );

    await ctx.db.insert("notifications", {
      userId: args.sellerId,
      type: "data_entry",
      title: "Product submitted for review",
      message: `${worker.name || worker.email || "A worker"} submitted a product for your review.`,
      read: false,
      link: "/seller/my-team",
      createdAt: now,
    });

    return { success: true };
  },
});

// ─── SELLER: REVIEW PRODUCTS ───────────────────────────────────────────────

export const myPendingReviewProducts = query({
  args: {},
  handler: async (ctx) => {
    const seller = await requireSeller(ctx);
    const products = await ctx.db
      .query("dataEntryProducts")
      .withIndex("by_seller", (q) => q.eq("sellerId", seller._id))
      .collect();
    const pending = products.filter((p: any) => p.status === "pending_seller_review");
    return Promise.all(
      pending.map(async (p: any) => {
        const listing = await listingWithUrls(ctx, await ctx.db.get(p.listingId));
        return { ...p, listing };
      }),
    );
  },
});

export const myWorkerProducts = query({
  args: { sellerId: v.string() },
  handler: async (ctx) => {
    const seller = await requireSeller(ctx);
    const products = await ctx.db
      .query("dataEntryProducts")
      .withIndex("by_seller", (q) => q.eq("sellerId", seller._id))
      .collect();
    return Promise.all(
      products.map(async (p: any) => {
        const listing = await listingWithUrls(ctx, await ctx.db.get(p.listingId as any));
        const worker = await ctx.db.get(p.workerId as any);
        return { ...p, listing, workerName: (worker as any)?.name || (worker as any)?.email || "Worker" };
      }),
    );
  },
});

export const reviewProduct = mutation({
  args: {
    sellerId: v.string(),
    productEntryId: v.id("dataEntryProducts"),
    action: v.union(
      v.literal("approve"),
      v.literal("reject"),
      v.literal("changes_requested"),
    ),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const seller = await requireSeller(ctx);
    const dep = await ctx.db.get(args.productEntryId);
    if (!dep) throw new ConvexError("Product entry not found");
    if (dep.sellerId !== seller._id) throw new ConvexError("Not your product");
    if (dep.status !== "pending_seller_review") throw new ConvexError("Product is not pending review");

    const statusMap: Record<string, "approved" | "rejected" | "changes_requested"> = {
      approve: "approved",
      reject: "rejected",
      changes_requested: "changes_requested",
    };
    const newStatus = statusMap[args.action];

    const now = Date.now();
    await ctx.db.patch(args.productEntryId, {
      status: newStatus,
      reviewedAt: now,
      reviewedBy: seller._id,
      reviewNote: args.note,
    });

    if (dep.assignmentId) {
      await ctx.db.patch(dep.assignmentId, {
        status: newStatus,
        reviewedAt: now,
        reviewedBy: seller._id,
        reviewNote: args.note,
      });
    }

    if (newStatus === "approved" && dep.jobId) {
      const job = (await ctx.db.get(dep.jobId as any)) as any;
      if (job && job.publishMode === "auto") {
        await ctx.db.patch(args.productEntryId, { status: "published" });
        await ctx.db.patch(dep.listingId, { status: "active" });
      }
    }

    await insertAudit(
      ctx,
      seller._id,
      seller.name || seller.businessName || "Seller",
      "seller",
      `PRODUCT_${args.action.toUpperCase()}`,
      seller._id,
      dep.jobId,
      args.productEntryId as any,
      `${args.action} — product ${dep.listingId}`,
    );

    const worker = await ctx.db.get(dep.workerId as any);
    if (worker) {
      const workerAny = worker as any;
      const actionLabels: Record<string, string> = {
        approve: "approved ✅",
        reject: "rejected ❌",
        changes_requested: "changes requested 🔄",
      };
      await ctx.db.insert("notifications", {
        userId: dep.workerId,
        type: "data_entry",
        title: `Product ${actionLabels[args.action] || args.action}`,
        message: `${(seller as any)?.businessName || (seller as any)?.name || "Seller"} ${actionLabels[args.action] || args.action} your product.${args.note ? " " + args.note : ""}`,
        read: false,
        link: "/data-entry",
        createdAt: now,
      });
    }

    return { success: true };
  },
});

// ─── SELLER: PUBLISH APPROVED PRODUCT ──────────────────────────────────────

export const publishApprovedProduct = mutation({
  args: {
    sellerId: v.string(),
    productEntryId: v.id("dataEntryProducts"),
  },
  handler: async (ctx, args) => {
    const seller = await requireSeller(ctx);
    const dep = await ctx.db.get(args.productEntryId);
    if (!dep) throw new ConvexError("Product entry not found");
    if (dep.sellerId !== seller._id) throw new ConvexError("Not your product");
    if (dep.status !== "approved") throw new ConvexError("Only approved products can be published");

    const now = Date.now();
    await ctx.db.patch(args.productEntryId, { status: "published" });
    await ctx.db.patch(dep.listingId, { status: "active" });

    await insertAudit(
      ctx,
      seller._id,
      seller.name || seller.businessName || "Seller",
      "seller",
      "PRODUCT_PUBLISHED",
      seller._id,
      dep.jobId,
      args.productEntryId as any,
      `Published product ${dep.listingId}`,
    );

    return { success: true };
  },
});

// ─── SELLER: EDIT WORKER DRAFT ─────────────────────────────────────────────

/**
 * Shared listing-patch builder for worker-draft edits (seller review loop and
 * the worker's own revision pass). Returns raw field updates — callers add
 * timestamps/status and persist.
 */
function buildListingUpdates(la: any): Record<string, unknown> {
  const updates: Record<string, unknown> = {};
  if (la.title !== undefined) updates.title = la.title;
  if (la.description !== undefined) updates.description = la.description;
  if (la.price !== undefined) updates.price = la.price;
  if (la.subcategory !== undefined) updates.subcategory = la.subcategory;
  if (la.condition !== undefined) updates.condition = la.condition;
  if (la.attributes !== undefined) updates.attributes = la.attributes;
  if (la.negotiable !== undefined) updates.negotiable = la.negotiable;
  if (la.originalPrice !== undefined) updates.originalPrice = la.originalPrice;

  if (la.wholesale !== undefined || la.moq !== undefined || la.tierPrices !== undefined) {
    updates.wholesale =
      la.wholesale && la.moq && la.moq >= 2 && la.tierPrices && la.tierPrices.length > 0 &&
      la.tierPrices.every((t: any) => t.minQty >= 2 && t.price > 0)
        ? true
        : undefined;
    updates.moq = la.wholesale && la.moq && la.moq >= 2 ? Math.round(la.moq) : undefined;
    updates.tierPrices =
      la.wholesale && la.tierPrices && la.tierPrices.length > 0
        ? la.tierPrices
            .filter((t: any) => t.minQty >= 2 && t.price > 0)
            .map((t: any) => ({ minQty: Math.round(t.minQty), price: Math.round(t.price) }))
            .sort((a: any, b: any) => a.minQty - b.minQty)
        : undefined;
  }

  if (la.rental !== undefined || la.ratePerDay !== undefined || la.depositAmount !== undefined || la.minRentalDays !== undefined) {
    updates.rental =
      la.rental && la.ratePerDay && la.ratePerDay > 0 && la.depositAmount !== undefined && la.depositAmount >= 0
        ? true
        : undefined;
    updates.ratePerDay = la.rental && la.ratePerDay && la.ratePerDay > 0 ? Math.round(la.ratePerDay) : undefined;
    updates.depositAmount = la.rental && la.depositAmount !== undefined && la.depositAmount >= 0 ? Math.round(la.depositAmount) : undefined;
    updates.minRentalDays = la.rental && la.minRentalDays && la.minRentalDays >= 1 ? Math.round(la.minRentalDays) : undefined;
  }

  return updates;
}

export const editWorkerDraft = mutation({
  args: {
    sellerId: v.string(),
    productEntryId: v.id("dataEntryProducts"),
    listingArgs: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      price: v.optional(v.number()),
      subcategory: v.optional(v.string()),
      condition: v.optional(v.string()),
      attributes: v.optional(v.record(v.string(), v.string())),
      negotiable: v.optional(v.boolean()),
      originalPrice: v.optional(v.number()),
      wholesale: v.optional(v.boolean()),
      moq: v.optional(v.number()),
      tierPrices: v.optional(v.array(v.object({ minQty: v.number(), price: v.number() }))),
      rental: v.optional(v.boolean()),
      ratePerDay: v.optional(v.number()),
      depositAmount: v.optional(v.number()),
      minRentalDays: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const seller = await requireSeller(ctx);
    const dep = await ctx.db.get(args.productEntryId);
    if (!dep) throw new ConvexError("Product entry not found");
    if (dep.sellerId !== seller._id) throw new ConvexError("Not your product");
    if (dep.status !== "draft" && dep.status !== "changes_requested") {
      throw new ConvexError("Only draft or changes_requested products can be edited by seller");
    }

    const updates = buildListingUpdates(args.listingArgs as any);
    updates.updatedAt = Date.now();
    // Listing fields live on the listing document — the tracking row only
    // carries workflow state, so patching title/price onto it would be a
    // no-op the seller never sees.
    await ctx.db.patch(dep.listingId, updates);

    const listing2 = await ctx.db.get(dep.listingId);
    if (!listing2) throw new ConvexError("Listing not found after update");

    await insertAudit(
      ctx,
      seller._id,
      seller.name || seller.businessName || "Seller",
      "seller",
      "PRODUCT_EDITED",
      seller._id,
      dep.jobId,
      args.productEntryId as any,
      `Edited worker draft ${dep.listingId}`,
    );

    return { success: true };
  },
});

// ─── WORKER: SELLERS I WORK FOR ──────────────────────────────────────────────

/**
 * The sellers this data-entry worker has active staff access to. The product
 * entry workspace needs this list so a worker can pick which store they are
 * entering a product for.
 */
export const mySellers = query({
  args: {},
  handler: async (ctx) => {
    const worker = await requireDataEntryWorker(ctx);
    const rows = await ctx.db
      .query("sellerStaff")
      .withIndex("by_worker", (q: any) => q.eq("workerId", worker._id))
      .collect();
    const active = rows.filter((r: any) => r.status === "active");
    return Promise.all(
      active.map(async (r: any) => {
        const seller = (await ctx.db.get(r.sellerId as any)) as any;
        return {
          staffId: r._id,
          sellerId: r.sellerId,
          permissions: r.permissions ?? [],
          businessName: seller?.businessName || seller?.name || "Seller",
          kycStatus: seller?.kycStatus,
        };
      }),
    );
  },
});

// ─── WORKER: REVISE OWN DRAFT ──────────────────────────────────────────────

/**
 * The worker's counterpart to the seller's editWorkerDraft: they revise their
 * own draft (or a product the seller sent back with changes requested). A
 * changes_requested product drops back to draft so the normal
 * submit-for-review loop can run again.
 */
export const updateMyDraft = mutation({
  args: {
    productEntryId: v.id("dataEntryProducts"),
    listingArgs: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      price: v.optional(v.number()),
      subcategory: v.optional(v.string()),
      condition: v.optional(v.string()),
      images: v.optional(v.array(v.string())),
      attributes: v.optional(v.record(v.string(), v.string())),
      negotiable: v.optional(v.boolean()),
      originalPrice: v.optional(v.number()),
      wholesale: v.optional(v.boolean()),
      moq: v.optional(v.number()),
      tierPrices: v.optional(v.array(v.object({ minQty: v.number(), price: v.number() }))),
      rental: v.optional(v.boolean()),
      ratePerDay: v.optional(v.number()),
      depositAmount: v.optional(v.number()),
      minRentalDays: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const worker = await requireDataEntryWorker(ctx);
    const dep = (await ctx.db.get(args.productEntryId)) as any;
    if (!dep) throw new ConvexError("Product entry not found");
    if (dep.workerId !== worker._id) throw new ConvexError("Not your product");
    if (dep.status !== "draft" && dep.status !== "changes_requested") {
      throw new ConvexError("Only drafts or change-requested products can be edited");
    }

    const la = args.listingArgs as any;
    const listingUpdates = buildListingUpdates(la);
    if (la.images !== undefined) listingUpdates.images = la.images;
    listingUpdates.updatedAt = Date.now();
    await ctx.db.patch(dep.listingId, listingUpdates);
    if (dep.status === "changes_requested") {
      await ctx.db.patch(args.productEntryId, { status: "draft" });
    }

    await insertAudit(
      ctx,
      worker._id,
      worker.name || worker.email || "Worker",
      "data_entry",
      "PRODUCT_EDITED",
      dep.sellerId,
      dep.jobId,
      args.productEntryId as any,
      `Revised product draft ${dep.listingId}`,
    );

    await ctx.db.insert("notifications", {
      userId: dep.sellerId,
      type: "data_entry",
      title: "Draft revised",
      message: `${worker.name || worker.email || "A worker"} revised a product draft and is ready to resubmit.`,
      read: false,
      link: "/seller/my-team",
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// ─── WORKER: VIEW ASSIGNED PRODUCTS ────────────────────────────────────────

export const myProducts = query({
  args: {},
  handler: async (ctx) => {
    const worker = await requireDataEntryWorker(ctx);
    const products = await ctx.db
      .query("dataEntryProducts")
      .withIndex("by_worker", (q) => q.eq("workerId", worker._id))
      .collect();
    return Promise.all(
      products.map(async (p: any) => {
        const listing = await listingWithUrls(ctx, await ctx.db.get(p.listingId as any));
        const seller = await ctx.db.get(p.sellerId as any);
        const job = p.jobId ? await ctx.db.get(p.jobId as any) : null;
        return { ...p, listing, sellerName: (seller as any)?.businessName || (seller as any)?.name || "Seller", job };
      }),
    );
  },
});

export const myStats = query({
  args: {},
  handler: async (ctx) => {
    const worker = await requireDataEntryWorker(ctx);
    const products = await ctx.db
      .query("dataEntryProducts")
      .withIndex("by_worker", (q) => q.eq("workerId", worker._id))
      .collect();
    const totals = {
      total: products.length,
      draft: products.filter((p: any) => p.status === "draft").length,
      submitted: products.filter((p: any) => p.status === "pending_seller_review").length,
      approved: products.filter((p: any) => p.status === "approved").length,
      rejected: products.filter((p: any) => p.status === "rejected").length,
      changesRequested: products.filter((p: any) => p.status === "changes_requested").length,
      published: products.filter((p: any) => p.status === "published").length,
      completionPercent: 0,
    };
    const completed = totals.approved + totals.published + totals.rejected;
    totals.completionPercent = totals.total > 0 ? Math.round((completed / totals.total) * 100) : 0;
    return totals;
  },
});

// ─── DISPUTES ──────────────────────────────────────────────────────────────

export const createDispute = mutation({
  args: {
    jobId: v.string(),
    title: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getSessionUser(ctx);
    if (!user) throw new ConvexError("Not authenticated");

    const job = (await ctx.db.get(args.jobId as any)) as any;
    if (!job) throw new ConvexError("Job not found");

    if (user._id !== job.sellerId && user._id !== job.acceptedWorkerId) {
      throw new ConvexError("Not party to this job");
    }

    const now = Date.now();
    const id = await ctx.db.insert("dataEntryDisputes", {
      jobId: args.jobId,
      sellerId: job.sellerId,
      workerId: job.acceptedWorkerId || user._id,
      title: args.title,
      description: args.description,
      status: "open",
      createdAt: now,
    });

    await insertAudit(
      ctx,
      user._id,
      user.name || user.email || "User",
      user.role || "user",
      "DISPUTE_OPENED",
      job.sellerId,
      args.jobId,
      undefined,
      args.title,
    );

    const otherParty = user._id === job.sellerId ? job.acceptedWorkerId : job.sellerId;
    if (otherParty) {
      await ctx.db.insert("notifications", {
        userId: otherParty,
        type: "data_entry",
        title: "Dispute opened",
        message: `A dispute has been opened on job "${job.title}": ${args.title}`,
        read: false,
        link: "/data-entry",
        createdAt: now,
      });
    }

    return { disputeId: id };
  },
});

export const resolveDispute = mutation({
  args: {
    disputeId: v.id("dataEntryDisputes"),
    resolution: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const d = await ctx.db.get(args.disputeId);
    if (!d) throw new ConvexError("Dispute not found");
    if (d.status === "resolved") throw new ConvexError("Dispute already resolved");

    const now = Date.now();
    await ctx.db.patch(args.disputeId, {
      status: "resolved",
      resolution: args.resolution,
      resolvedBy: admin._id,
      resolvedAt: now,
    });

    await insertAudit(
      ctx,
      admin._id,
      admin.name || "Admin",
      "admin",
      "DISPUTE_RESOLVED",
      d.sellerId,
      d.jobId,
      undefined,
      args.resolution,
    );

    return { success: true };
  },
});

// ─── PAYMENTS ──────────────────────────────────────────────────────────────

export const approvePaymentForProduct = mutation({
  args: {
    sellerId: v.string(),
    productEntryId: v.id("dataEntryProducts"),
  },
  handler: async (ctx, args) => {
    const seller = await requireSeller(ctx);
    const dep = (await ctx.db.get(args.productEntryId)) as any;
    if (!dep) throw new ConvexError("Product entry not found");
    if (dep.sellerId !== seller._id) throw new ConvexError("Not your product");
    if (dep.status !== "approved") throw new ConvexError("Product must be approved first");

    const job = (await ctx.db.get(dep.jobId as any)) as any;
    if (!job) throw new ConvexError("Job not found");
    if (job.sellerId !== seller._id) throw new ConvexError("Job not yours");

    const now = Date.now();
    const paymentId = await ctx.db.insert("dataEntryPayments", {
      jobId: dep.jobId,
      workerId: dep.workerId,
      sellerId: seller._id,
      productId: dep.listingId as any,
      ratePerProduct: job.pricePerProduct,
      amount: job.pricePerProduct,
      currency: "KES",
      status: "pending",
      createdAt: now,
    });

    await insertAudit(
      ctx,
      seller._id,
      seller.name || seller.businessName || "Seller",
      "seller",
      "PAYMENT_APPROVED",
      seller._id,
      dep.jobId,
      dep.listingId as any,
      `Approved payment of ${job.pricePerProduct} KES for product ${dep.listingId}`,
    );

    return { paymentId };
  },
});

export const releasePayment = mutation({
  args: {
    jobId: v.id("dataEntryJobs"),
    paymentId: v.id("dataEntryPayments"),
  },
  handler: async (ctx, args) => {
    const seller = await requireSeller(ctx);
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new ConvexError("Job not found");
    if (job.sellerId !== seller._id) throw new ConvexError("Not your job");

    const payment = await ctx.db.get(args.paymentId);
    if (!payment) throw new ConvexError("Payment not found");
    if (payment.jobId !== args.jobId) throw new ConvexError("Payment does not belong to this job");
    if (payment.status !== "pending") throw new ConvexError("Payment already processed");

    const now = Date.now();
    await ctx.db.patch(args.paymentId, {
      status: "paid",
      paidAt: now,
    });

    await insertAudit(
      ctx,
      seller._id,
      seller.name || seller.businessName || "Seller",
      "seller",
      "PAYMENT_RELEASED",
      seller._id,
      args.jobId as any,
      args.paymentId as any,
      `Released ${payment.amount} KES to worker`,
    );

    const worker = await ctx.db.get(payment.workerId as any);
    if (worker) {
      const workerAny = worker as any;
      await ctx.db.insert("notifications", {
        userId: payment.workerId,
        type: "data_entry",
        title: "Payment received",
        message: `You received ${workerAny.amount} KES for a completed product.`,
        read: false,
        link: "/data-entry",
        createdAt: now,
      });
    }

    return { success: true };
  },
});

// ─── ADMIN QUERIES ─────────────────────────────────────────────────────────

export const adminGetAllStaffRelationships = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("sellerStaff").collect();
    return Promise.all(
      rows.map(async (r: any) => {
        const seller = await ctx.db.get(r.sellerId as any);
        const worker = await ctx.db.get(r.workerId as any);
        return {
          ...r,
          sellerName: (seller as any)?.businessName || (seller as any)?.name || "Seller",
          sellerEmail: (seller as any)?.email,
          workerName: (worker as any)?.name || (worker as any)?.email || "Worker",
          workerEmail: (worker as any)?.email,
          workerPhone: (worker as any)?.phone,
        };
      }),
    );
  },
});

export const adminGetAllInvitations = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("sellerStaffInvitations").collect();
    return Promise.all(
      rows.map(async (r: any) => {
        const seller = await ctx.db.get(r.sellerId as any);
        return {
          ...r,
          sellerName: (seller as any)?.businessName || (seller as any)?.name || "Seller",
          sellerEmail: (seller as any)?.email,
        };
      }),
    );
  },
});

export const adminGetAllJobs = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("dataEntryJobs").collect();
    return Promise.all(
      rows.map(async (r: any) => {
        const seller = await ctx.db.get(r.sellerId as any);
        const worker = r.acceptedWorkerId ? await ctx.db.get(r.acceptedWorkerId as any) : null;
        return {
          ...r,
          sellerName: (seller as any)?.businessName || (seller as any)?.name || "Seller",
          sellerEmail: (seller as any)?.email,
          workerName: (worker as any)?.name || (worker as any)?.email || null,
        };
      }),
    );
  },
});

export const adminGetAllWorkerProducts = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("dataEntryProducts").collect();
    return Promise.all(
      rows.map(async (r: any) => {
        const listing = await listingWithUrls(ctx, await ctx.db.get(r.listingId as any));
        const seller = await ctx.db.get(r.sellerId as any);
        const worker = await ctx.db.get(r.workerId as any);
        return {
          ...r,
          listing,
          sellerName: (seller as any)?.businessName || (seller as any)?.name || "Seller",
          workerName: (worker as any)?.name || (worker as any)?.email || "Worker",
        };
      }),
    );
  },
});

export const adminGetAllDataEntryDisputes = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("dataEntryDisputes").collect();
    return Promise.all(
      rows.map(async (r: any) => {
        const seller = (await ctx.db.get(r.sellerId as any)) as any;
        const worker = (await ctx.db.get(r.workerId as any)) as any;
        const job = (await ctx.db.get(r.jobId as any)) as any;
        return {
          ...r,
          sellerName: seller?.businessName || seller?.name || "Seller",
          workerName: worker?.name || worker?.email || "Worker",
          jobTitle: job?.title,
        };
      }),
    );
  },
});

export const adminGetAllDataEntryPayments = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("dataEntryPayments").collect();
    return Promise.all(
      rows.map(async (r: any) => {
        const seller = (await ctx.db.get(r.sellerId as any)) as any;
        const worker = (await ctx.db.get(r.workerId as any)) as any;
        const job = (await ctx.db.get(r.jobId as any)) as any;
        return {
          ...r,
          sellerName: seller?.businessName || seller?.name || "Seller",
          workerName: worker?.name || worker?.email || "Worker",
          jobTitle: job?.title,
        };
      }),
    );
  },
});

export const adminAuditLogs = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const all = await ctx.db.query("auditLogs").collect();
    return all
      .filter((a: any) =>
        a.action.startsWith("WORKER_") ||
        a.action.startsWith("PRODUCT_") ||
        a.action.startsWith("JOB_") ||
        a.action.startsWith("ACCESS_") ||
        a.action.startsWith("INVITATION_") ||
        a.action.startsWith("DISPUTE_") ||
        a.action.startsWith("PAYMENT_") ||
        a.action.startsWith("STAFF_")
      )
      .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
  },
});

// ─── ADMIN: SELLER PRODUCT TRACE & RE-CHANNEL ────────────────────────────

/**
 * Trace a seller's account and every listing they own, across all statuses
 * and marketplaces, so an admin can see exactly where a store's products are
 * channelled (product market vs freelance/digital market).
 */
export const adminTraceSellerProducts = query({
  args: {
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    storeName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const email = args.email?.trim().toLowerCase() || "";
    const digits = (args.phone || "").replace(/\D/g, "");
    const needle = (args.storeName || "").trim().toLowerCase();
    if (!email && !needle && digits.length < 6) return { accounts: [], listings: [] };

    const allUsers = await ctx.db.query("users").collect();
    const accounts = allUsers
      .filter((u: any) => {
        const byEmail = !!email && (u.email || "").toLowerCase() === email;
        const byStore =
          !!needle &&
          [u.businessName, u.name, u.storeName]
            .filter(Boolean)
            .some((s: string) => s.toLowerCase().includes(needle));
        const byPhone =
          digits.length >= 6 &&
          String(u.phone || "").replace(/\D/g, "").includes(digits.slice(-9));
        return byEmail || byStore || byPhone;
      })
      .map((u: any) => ({
        _id: u._id,
        email: u.email,
        name: u.name,
        businessName: u.businessName,
        role: u.role,
        phone: u.phone,
        county: u.county,
        town: u.town,
        kycStatus: u.kycStatus,
      }));

    const ids = new Set(accounts.map((a) => a._id));
    const allListings = await ctx.db.query("listings").collect();
    const listings = allListings
      .filter(
        (l: any) =>
          ids.has(l.sellerId) ||
          (!!needle && (l.sellerName || "").toLowerCase().includes(needle)),
      )
      .map((l: any) => ({
        _id: l._id,
        title: l.title,
        marketplace: l.marketplace === "freelance" ? "freelance" : "product",
        category: l.category,
        status: l.status,
        price: l.price,
        sellerName: l.sellerName,
        sellerId: l.sellerId,
        createdAt: l.createdAt ?? l._creationTime,
      }))
      .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));

    return { accounts, listings };
  },
});

/**
 * Move a listing between the product market and the freelance/digital market.
 * Physical-goods sellers accidentally channelled into the digital marketplace
 * are corrected here, with a full audit trail.
 */
export const adminSetListingMarketplace = mutation({
  args: {
    listingId: v.id("listings"),
    marketplace: v.union(v.literal("product"), v.literal("freelance")),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const listing = (await ctx.db.get(args.listingId)) as any;
    if (!listing) throw new ConvexError("Listing not found");

    const current = listing.marketplace === "freelance" ? "freelance" : "product";
    if (current === args.marketplace) {
      throw new ConvexError(`Already in the ${args.marketplace} market`);
    }

    await ctx.db.patch(args.listingId, { marketplace: args.marketplace });

    await insertAudit(
      ctx,
      admin._id,
      (admin as any).name || (admin as any).email || "Admin",
      "admin",
      "PRODUCT_MARKETPLACE_CHANGED",
      listing.sellerId,
      undefined,
      args.listingId as any,
      `Moved "${listing.title}" from ${current} market to ${args.marketplace} market`,
    );

    return { success: true, from: current, to: args.marketplace };
  },
});

// ─── INTERNAL ───────────────────────────────────────────────────────────────

export const internalEnsureDataEntryRole = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new ConvexError("User not found");
    if (user.role === "data_entry") return { success: true };
    await ctx.db.patch(args.userId, { role: "data_entry" });
    return { success: true };
  },
});
