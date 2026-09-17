import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { sellerCommission, buyerProtectionFee, resolveFee, recordFeeEarning } from "./fees";

// ─── SHARED HELPERS ───

/** Resolve the session's user record (auth-session-bound, email fallback). */
async function requireUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError("Not authenticated");
  const user = await ctx.db
    .query("users")
    .withIndex("email", (q: any) => q.eq("email", identity.email))
    .first();
  if (!user) throw new ConvexError("User not found");
  return user;
}

/**
 * Resolve task attachment storage keys to displayable URLs. Dead/invalid keys
 * are skipped so a single bad attachment never breaks a job posting page.
 */
async function resolveAttachments(ctx: any, attachments: string[] | undefined): Promise<string[]> {
  const out: string[] = [];
  for (const att of attachments || []) {
    try {
      const url = await ctx.storage.getUrl(att);
      if (url) { out.push(url); continue; }
    } catch { /* dead or invalid storage key — skip */ }
  }
  return out;
}

/** Insert an in-app notification for a user. */
async function notify(
  ctx: any,
  userId: string,
  type: string,
  title: string,
  message: string,
  link?: string,
) {
  await ctx.db.insert("notifications", {
    userId,
    type,
    title,
    message,
    read: false,
    link: link || "/freelance/dashboard",
    createdAt: Date.now(),
  });
}

// ─── FREELANCER PROFILE ───

/** Create or update freelancer profile */
export const upsertProfile = mutation({
  args: {
    displayName: v.string(),
    title: v.optional(v.string()),
    bio: v.optional(v.string()),
    skills: v.array(v.string()),
    categories: v.array(v.string()),
    languages: v.optional(v.array(v.string())),
    hourlyRate: v.optional(v.number()),
    location: v.optional(v.string()),
    roleMode: v.union(v.literal("freelancer"), v.literal("employer"), v.literal("both")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    if (!user) throw new ConvexError("User not found");

    const existing = await ctx.db
      .query("freelanceProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    const now = Date.now();
    const data = {
      userId: user._id,
      displayName: args.displayName,
      title: args.title,
      bio: args.bio,
      skills: args.skills,
      categories: args.categories,
      languages: args.languages || ["English"],
      hourlyRate: args.hourlyRate,
      currency: "KES",
      availability: "available" as const,
      location: args.location,
      completedProjects: existing?.completedProjects || 0,
      totalEarnings: existing?.totalEarnings || 0,
      successRate: existing?.successRate || 100,
      responseRate: existing?.responseRate || 100,
      avgRating: existing?.avgRating || 0,
      totalReviews: existing?.totalReviews || 0,
      // Verified badge: KYC (voluntary) OR full business verification from the
      // progressive engine — freelance providers never REQUIRE KYC.
      isVerified:
        user.kycStatus === "verified" || (user as any).verificationLevel === "business",
      status: "active" as const,
      roleMode: args.roleMode,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, { ...data, createdAt: existing.createdAt });
      return { profileId: existing._id };
    }

    const profileId = await ctx.db.insert("freelanceProfiles", {
      ...data,
      createdAt: now,
    });
    return { profileId };
  },
});

/** Get freelancer profile for current user */
export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    if (!user) return null;

    const profile = await ctx.db
      .query("freelanceProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    return profile || null;
  },
});

/**
 * Legacy role repair (authenticated, self-scoped): align the signed-in user's
 * account role with the roleMode stored on their verified freelance profile.
 *
 * Earlier signup flows saved Employers with the account role "freelancer"
 * (the Employer card on /auth selected the freelancer role), so some existing
 * accounts are mislabelled. The profile's roleMode is the user's explicit
 * choice, so it wins — in both directions. This only ever moves a role between
 * "freelancer" and "employer"; buyer, seller, driver, and admin accounts are
 * never touched, and marketplace roles never leak into Freelance.
 */
export const syncProfileRole = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    if (user.role !== "freelancer" && user.role !== "employer") {
      return { success: false, reason: "not a freelance account", role: user.role ?? null };
    }

    const profile = await ctx.db
      .query("freelanceProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();
    if (!profile || profile.roleMode === "both") {
      return { success: false, reason: "no freelance profile or dual mode", role: user.role };
    }

    const desired = profile.roleMode === "employer" ? "employer" : "freelancer";
    if (user.role !== desired) {
      await ctx.db.patch(user._id, { role: desired });
    }
    return { success: true, role: desired };
  },
});

/** Get freelancer profile by user ID */
export const getProfile = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("freelanceProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (!profile) return null;
    // Attach the profile photo: the freelance avatar, falling back to the
    // account image — so profile pages show real uploaded faces.
    const user = await ctx.db.get(profile.userId as any);
    return {
      ...profile,
      photo: profile.avatar || (user as any)?.image || undefined,
    };
  },
});

/** Get top freelancers */
export const getTopFreelancers = query({
  args: {
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let profiles = await ctx.db
      .query("freelanceProfiles")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    if (args.category) {
      profiles = profiles.filter((p) => p.categories.includes(args.category!));
    }

    return profiles
      .sort((a, b) => b.avgRating - a.avgRating || b.completedProjects - a.completedProjects)
      .slice(0, args.limit ?? 20);
  },
});

/**
 * Proof-of-work helpers. Writers upload sample essays, reports, PDFs, images
 * etc. to Convex Storage; the profile stores stable keys, resolved to signed
 * URLs only at read time. Deletes also delete the stored file itself so the
 * storage doesn't accumulate dead objects.
 */
async function resolveProofs(ctx: any, keys: string[] | undefined): Promise<{ key: string; url: string; kind: "image" | "document" }[]> {
  const out: { key: string; url: string; kind: "image" | "document" }[] = [];
  for (const k of keys || []) {
    try {
      const url = await ctx.storage.getUrl(k as any);
      if (url) {
        out.push({
          key: k,
          url,
          // Storage metadata: if it's a media type treat it as an image preview.
          kind: /image|avif/.test((await ctx.db.system.get(k as any))?.contentType || "") ? "image" : "document",
        });
      }
    } catch { /* dead key — skip */ }
  }
  return out;
}

/** Add a proof-of-work file (writer-only). Called after the file is in Storage. */
export const addProofOfWork = mutation({
  args: { storageId: v.string(), title: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (user.role !== "freelancer") {
      throw new ConvexError("Only Writer/Freelancer accounts can upload proof of work.");
    }
    const profile = await ctx.db
      .query("freelanceProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();
    if (!profile) throw new ConvexError("Create your freelance profile first (Profile Settings).");
    const existing = profile.proofOfWork ?? [];
    if (existing.length >= 10) throw new ConvexError("Proof-of-work limit reached (10 files). Remove one to add another.");
    await ctx.db.patch(profile._id, {
      proofOfWork: [...existing, args.storageId],
      updatedAt: Date.now(),
    });
    return { ok: true, count: existing.length + 1 };
  },
});

/** Remove a proof-of-work file (writer-only, self-scoped). */
export const removeProofOfWork = mutation({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const profile = await ctx.db
      .query("freelanceProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();
    if (!profile) return { ok: true };
    const existing = profile.proofOfWork ?? [];
    if (!existing.includes(args.storageId)) return { ok: true };
    await ctx.db.patch(profile._id, {
      proofOfWork: existing.filter((k: string) => k !== args.storageId),
      updatedAt: Date.now(),
    });
    // Delete the stored object so removed samples disappear from storage too.
    try { await ctx.storage.delete(args.storageId as any); } catch { /* already gone */ }
    return { ok: true };
  },
});

/**
 * Directory filter slug → every profile-category slug that belongs under it.
 * Profiles saved with either the current FREELANCE_CATEGORIES taxonomy or the
 * legacy short slugs still land in the right group on the directory.
 */
const CATEGORY_ALIASES: Record<string, string[]> = {
  writing: ["writing"],
  design: ["design"],
  "video-photo": ["video-photo", "video"],
  marketing: ["marketing"],
  development: ["development", "web-development"],
  "data-research": ["data-research"],
  "virtual-assistance": ["virtual-assistance"],
  education: ["education"],
  "business-professional": ["business-professional", "business"],
  "ai-accounts-tools": ["ai-accounts-tools", "ai-tech", "ai-tasker"],
  "digital-products": ["digital-products"],
  "other-services": ["other-services"],
};

/**
 * Search freelancers — used by the homepage Writers Spotlight and the
 * employer directory. Sorted by proof-of-work strength then jobs completed:
 * a writer with more proven samples and more completed work ranks higher.
 */
export const searchFreelancers = query({
  args: {
    query: v.optional(v.string()),
    category: v.optional(v.string()),
    minRate: v.optional(v.number()),
    maxRate: v.optional(v.number()),
    availability: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // The directory starts from the PEOPLE — every active freelancer-role
    // account appears here the moment they register, profile or no profile.
    // AI Taskers and sellers/employers with a published freelance service
    // join the list too.
    const freelancerAccounts = await ctx.db
      .query("users")
      .withIndex("by_role" as any, (q: any) => q.eq("role", "freelancer"))
      .collect();
    const aiTaskerAccounts = await ctx.db
      .query("users")
      .withIndex("by_role" as any, (q: any) => q.eq("role", "ai_tasker"))
      .collect();

    const allProfiles = await ctx.db
      .query("freelanceProfiles")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
    const profileByUser = new Map<string, any>();
    for (const p of allProfiles) profileByUser.set((p as any).userId, p);

    // Sellers/employers with a published freelance service join the list.
    const serviceSellerIds = new Set<string>();
    for (const p of allProfiles) {
      const u: any = await ctx.db.get((p as any).userId as any);
      if (u && (u.role === "seller" || u.role === "employer") && u.accountStatus !== "suspended") {
        serviceSellerIds.add((p as any).userId);
      }
    }

    // Build one unified row per person.
    type Row = {
      userId: string;
      displayName: string;
      title?: string;
      bio?: string;
      photo?: string;
      phone?: string;
      role: string;
      categories: string[];
      skills: string[];
      hourlyRate?: number;
      availability: string;
      completedProjects: number;
      avgRating: number;
      isVerified: boolean;
      hasProfile: boolean;
      isAiTasker: boolean;
      proofCount: number;
      profileId?: string;
    };
    const rows: Row[] = [];

    const buildRow = async (userId: string, account: any, hasProfile: boolean): Promise<Row> => {
      const profile = hasProfile ? profileByUser.get(userId) : undefined;
      const isTasker = (account?.role as string) === "ai_tasker";
      return {
        userId,
        displayName: (profile?.displayName || account?.name || "Freelancer").trim(),
        title: profile?.title || (account?.freelanceTitle as string | undefined) || (isTasker ? "AI Tasker" : undefined),
        bio: profile?.bio || undefined,
        photo: profile?.avatar || account?.image || undefined,
        phone: account?.phone || undefined,
        role: (account?.role as string) || "freelancer",
        categories: profile?.categories ?? (isTasker ? ["ai-tasker"] : []),
        skills: profile?.skills ?? [],
        hourlyRate: profile?.hourlyRate || undefined,
        availability: profile?.availability || "available",
        completedProjects: profile?.completedProjects ?? 0,
        avgRating: profile?.avgRating ?? 5,
        isVerified: !!profile?.isVerified,
        hasProfile,
        isAiTasker: isTasker,
        proofCount: profile?.proofOfWork?.length ?? 0,
        profileId: profile?._id,
      };
    };

    for (const account of [...freelancerAccounts, ...aiTaskerAccounts]) {
      const u = account as any;
      if (u.accountStatus === "suspended") continue;
      rows.push(await buildRow(u._id, u, profileByUser.has(u._id)));
    }
    for (const userId of serviceSellerIds) {
      if (rows.some((r) => r.userId === userId)) continue;
      const u: any = await ctx.db.get(userId as any);
      if (u) rows.push(await buildRow(userId, u, true));
    }

    let out = rows;
    if (args.query) {
      const q = args.query.toLowerCase();
      out = out.filter(
        (p) =>
          p.displayName.toLowerCase().includes(q) ||
          (p.title && p.title.toLowerCase().includes(q)) ||
          p.skills.some((s) => s.toLowerCase().includes(q)) ||
          p.bio?.toLowerCase().includes(q),
      );
    }
    if (args.category) {
      const wanted = CATEGORY_ALIASES[args.category] || [args.category];
      out = out.filter(
        (p) =>
          p.categories.some((c) => wanted.includes(c)) ||
          // A registered AI Tasker sits in the AI & Digital Tools group even
          // without a profile.
          (wanted.includes("ai-accounts-tools") && p.isAiTasker),
      );
    }
    if (args.minRate !== undefined) out = out.filter((p) => (p.hourlyRate || 0) >= args.minRate!);
    if (args.maxRate !== undefined) out = out.filter((p) => (p.hourlyRate || 0) <= args.maxRate!);
    if (args.availability) out = out.filter((p) => p.availability === args.availability);

    // Proven profiles first, then set-up profiles, then new registrations.
    return out.sort(
      (a, b) =>
        Number(b.hasProfile) - Number(a.hasProfile) ||
        b.proofCount - a.proofCount ||
        b.completedProjects - a.completedProjects,
    );
  },
});

/** Public profile incl. resolved proof-of-work URLs for a specific writer. */
export const getProfileWithProofs = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("freelanceProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (!profile) return null;
    return {
      ...profile,
      proofs: await resolveProofs(ctx, profile.proofOfWork),
    };
  },
});

/** The signed-in writer's own profile incl. proof-of-work URLs. */
export const getMyProfileWithProofs = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    if (!user) return null;
    const profile = await ctx.db
      .query("freelanceProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();
    if (!profile) return null;
    return {
      ...profile,
      proofs: await resolveProofs(ctx, profile.proofOfWork),
    };
  },
});

// ─── FREELANCE TASKS ───

/** Create a freelance task */
export const createTask = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.string(),
    subcategory: v.optional(v.string()),
    skills: v.array(v.string()),
    budget: v.number(),
    budgetType: v.union(v.literal("fixed"), v.literal("milestone"), v.literal("hourly")),
    deadline: v.optional(v.number()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    experienceLevel: v.optional(v.string()),
    remote: v.boolean(),
    location: v.optional(v.string()),
    // Briefs, spec sheets, reference images — Convex storage keys resolved to
    // URLs whenever the task is read.
    attachments: v.optional(v.array(v.string())),
    freelancerCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    // ── ROLE GATE: only verified Employers may post jobs ──
    // Writers/Freelancers must not be able to create or post jobs. Buyers and
    // sellers are also blocked — Freelance is a separate system with its own
    // verified roles.
    if (user.role !== "employer") {
      throw new ConvexError(
        "Only Employer accounts can post jobs. Register as an Employer at Nexora Freelance to hire."
      );
    }

    const now = Date.now();
    const taskId = await ctx.db.insert("freelanceTasks", {
      employerId: user._id,
      employerName: user.name || "Employer",
      employerImage: user.image,
      title: args.title,
      description: args.description,
      category: args.category,
      subcategory: args.subcategory,
      skills: args.skills,
      budget: args.budget,
      budgetType: args.budgetType,
      currency: "KES",
      deadline: args.deadline,
      priority: args.priority,
      experienceLevel: args.experienceLevel,
      remote: args.remote,
      location: args.location,
      attachments: args.attachments ?? [],
      freelancerCount: args.freelancerCount || 1,
      applicants: 0,
      views: 0,
      status: "open",
      createdAt: now,
      updatedAt: now,
    });

    // ── Progressive verification: each new legitimate job counts toward the
    // employer's 5-distinct-offerings gate. Best-effort — posting must never
    // fail because of verification bookkeeping.
    try {
      await ctx.runMutation(internal.verification.internalOnJobPosted, {
        userId: user._id,
      });
    } catch (err) {
      console.error("[verification] job hook failed:", err);
    }

    return { taskId };
  },
});

/** Get all open tasks */
export const getOpenTasks = query({
  args: {
    category: v.optional(v.string()),
    query: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let tasks = await ctx.db
      .query("freelanceTasks")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .order("desc")
      .collect();

    if (args.category) {
      tasks = tasks.filter((t) => t.category === args.category);
    }

    if (args.query) {
      const q = args.query.toLowerCase();
      tasks = tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.skills.some((s) => s.toLowerCase().includes(q))
      );
    }

    const sliced = tasks.slice(0, args.limit ?? 50);

    return Promise.all(
      sliced.map(async (task: any) => ({
        ...task,
        attachments: await resolveAttachments(ctx, task.attachments),
      }))
    );
  },
});

/** Get tasks by employer */
export const getMyTasks = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    if (!user) return [];

    const tasks = await ctx.db
      .query("freelanceTasks")
      .withIndex("by_employer", (q) => q.eq("employerId", user._id))
      .order("desc")
      .collect();

    return Promise.all(
      tasks.map(async (task: any) => ({
        ...task,
        attachments: await resolveAttachments(ctx, task.attachments),
      }))
    );
  },
});

/** Get a single task by ID */
export const getTask = query({
  args: { taskId: v.id("freelanceTasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) return null;
    return { ...task, attachments: await resolveAttachments(ctx, task.attachments) };
  },
});

// ─── APPLICATIONS ───

/** Apply to a task */
export const applyToTask = mutation({
  args: {
    taskId: v.id("freelanceTasks"),
    proposal: v.string(),
    proposedBudget: v.number(),
    estimatedDuration: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    // ── ROLE GATE: only Writers/Freelancers may apply ──
    // Employers hire; they don't apply. Buyers/sellers are also blocked —
    // a marketplace Buyer or Seller never automatically gains a freelance
    // role.
    if (user.role !== "freelancer") {
      throw new ConvexError(
        "Only Writer/Freelancer accounts can apply to jobs. Employers post and manage jobs instead."
      );
    }

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new ConvexError("Task not found");
    if (task.status !== "open") throw new ConvexError("Task is not accepting applications");

    // Check if already applied
    const existing = await ctx.db
      .query("freelanceApplications")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
    if (existing.some((a) => a.freelancerId === user._id)) {
      throw new ConvexError("You have already applied to this task");
    }

    const profile = await ctx.db
      .query("freelanceProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    const applicationId = await ctx.db.insert("freelanceApplications", {
      taskId: args.taskId,
      freelancerId: user._id,
      freelancerName: user.name || "Freelancer",
      freelancerImage: user.image,
      freelancerRating: profile?.avgRating || 0,
      freelancerCompletedProjects: profile?.completedProjects || 0,
      proposal: args.proposal,
      proposedBudget: args.proposedBudget,
      estimatedDuration: args.estimatedDuration,
      status: "pending",
      createdAt: Date.now(),
    });

    // Increment applicants count
    await ctx.db.patch(args.taskId, {
      applicants: task.applicants + 1,
      updatedAt: Date.now(),
    });

    return { applicationId };
  },
});

/** Get applications for a task */
export const getTaskApplications = query({
  args: { taskId: v.id("freelanceTasks") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("freelanceApplications")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .order("desc")
      .collect();
  },
});

/** Get applications by freelancer */
export const getMyApplications = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    if (!user) return [];

    const applications = await ctx.db
      .query("freelanceApplications")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", user._id))
      .order("desc")
      .collect();

    // Enrich with task info
    return Promise.all(
      applications.map(async (app) => {
        const task = await ctx.db.get(app.taskId as any);
        return {
          ...app,
          taskTitle: task && "title" in task ? (task as any).title : "Unknown Task",
          taskBudget: task && "budget" in task ? (task as any).budget : 0,
        };
      })
    );
  },
});

/** Accept an application */
export const acceptApplication = mutation({
  args: { applicationId: v.id("freelanceApplications") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const application = await ctx.db.get(args.applicationId);
    if (!application) throw new ConvexError("Application not found");

    const task = await ctx.db.get(application.taskId as any);
    if (!task || !("employerId" in task)) throw new ConvexError("Task not found");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    if (!user || (task as any).employerId !== user._id) throw new ConvexError("Not authorized");

    // Accept this application
    await ctx.db.patch(args.applicationId, { status: "accepted" });

    // Reject all other applications
    const allApps = await ctx.db
      .query("freelanceApplications")
      .withIndex("by_task", (q) => q.eq("taskId", application.taskId))
      .collect();
    for (const app of allApps) {
      if (app._id !== args.applicationId && app.status === "pending") {
        await ctx.db.patch(app._id, { status: "rejected" });
        await notify(
          ctx,
          app.freelancerId,
          "freelance",
          "Application not selected",
          `Your proposal for "${(task as any).title}" was not selected this time. Keep applying — new jobs drop daily.`,
          "/freelance/find-work",
        );
      }
    }

    // Create project
    const now = Date.now();
    const projectId = await ctx.db.insert("freelanceProjects", {
      taskId: application.taskId,
      employerId: (task as any).employerId,
      freelancerId: application.freelancerId,
      title: (task as any).title,
      description: (task as any).description,
      budget: application.proposedBudget,
      budgetType: (task as any).budgetType,
      currency: (task as any).currency,
      status: "active",
      progress: 0,
      totalPaid: 0,
      messages: 0,
      startedAt: now,
      deadline: (task as any).deadline,
      createdAt: now,
      updatedAt: now,
    });

    // Update task status
    await ctx.db.patch(application.taskId as any, {
      status: "in_progress",
      assignedFreelancerId: application.freelancerId,
      updatedAt: now,
    });

    // Notify both sides of the hire.
    await notify(
      ctx,
      application.freelancerId,
      "freelance",
      "🎉 You've been hired!",
      `You were hired for "${(task as any).title}" (KES ${application.proposedBudget.toLocaleString()}). The employer will fund escrow — start working once it shows funded.`,
      "/freelance/projects",
    );
    await notify(
      ctx,
      (task as any).employerId,
      "freelance",
      "Freelancer hired",
      `You hired ${application.freelancerName} for "${(task as any).title}". Fund the escrow (KES ${application.proposedBudget.toLocaleString()} + protection fee) to activate the project.`,
      "/employer/projects",
    );

    return { projectId };
  },
});

// ─── PROJECTS ───

/** Get projects for current user (as employer or freelancer) */
export const getMyProjects = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    if (!user) return [];

    const asEmployer = await ctx.db
      .query("freelanceProjects")
      .withIndex("by_employer", (q) => q.eq("employerId", user._id))
      .collect();

    const asFreelancer = await ctx.db
      .query("freelanceProjects")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", user._id))
      .collect();

    const all = [...asEmployer, ...asFreelancer];

    // Enrich with names
    return Promise.all(
      all.map(async (proj) => {
        const employer = await ctx.db.get(proj.employerId as any);
        const freelancer = await ctx.db.get(proj.freelancerId as any);
        return {
          ...proj,
          employerName: employer && "name" in employer ? (employer as any).name : "Unknown",
          freelancerName: freelancer && "name" in freelancer ? (freelancer as any).name : "Unknown",
          isFreelancer: proj.freelancerId === user._id,
        };
      })
    );
  },
});

/** Get a single project */
export const getProject = query({
  args: { projectId: v.id("freelanceProjects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    return project || null;
  },
});

/** Update project progress */
export const updateProjectProgress = mutation({
  args: {
    projectId: v.id("freelanceProjects"),
    progress: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    await ctx.db.patch(args.projectId, {
      progress: args.progress,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

/** Send a project message */
export const sendProjectMessage = mutation({
  args: {
    projectId: v.id("freelanceProjects"),
    content: v.string(),
    attachmentUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    if (!user) throw new ConvexError("User not found");

    const msgId = await ctx.db.insert("freelanceMessages", {
      projectId: args.projectId,
      senderId: user._id,
      content: args.content,
      attachmentUrl: args.attachmentUrl,
      read: false,
      createdAt: Date.now(),
    });

    return { messageId: msgId };
  },
});

/** Get project messages */
export const getProjectMessages = query({
  args: { projectId: v.id("freelanceProjects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("freelanceMessages")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("asc")
      .collect();
  },
});

// ─── PRICING ENGINE ───

/** Calculate freelance pricing — server-side only */
export const calculateFreelancePricing = query({
  args: { amount: v.number() },
  handler: async (ctx, args) => {
    const amount = args.amount;
    // Freelancer commission tiers
    let freelancerFee: number;
    if (amount <= 5000) freelancerFee = Math.round(amount * 0.03);
    else if (amount <= 50000) freelancerFee = Math.round(amount * 0.02);
    else if (amount <= 250000) freelancerFee = Math.round(amount * 0.015);
    else freelancerFee = Math.round(amount * 0.01);

    // Employer protection fee tiers
    let employerFee: number;
    if (amount <= 10000) employerFee = Math.round(amount * 0.01);
    else if (amount <= 50000) employerFee = Math.round(amount * 0.0075);
    else if (amount <= 200000) employerFee = Math.round(amount * 0.005);
    else employerFee = Math.round(amount * 0.0025);

    return {
      projectAmount: amount,
      freelancerCommission: freelancerFee,
      freelancerNetEarnings: amount - freelancerFee,
      employerProtectionFee: employerFee,
      employerTotalPayable: amount + employerFee,
      currency: "KES",
    };
  },
});

// ─── FILE UPLOAD (via Convex storage) ───

/** Generate a Convex file storage upload URL for project files */
export const generateFileUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");
    return await ctx.storage.generateUploadUrl();
  },
});

// ─── SUBMISSIONS ───

/**
 * Employer funds the project escrow from their Nexora wallet.
 *
 * Debits the employer's wallet for the project amount + the employer
 * protection fee (fee engine, freelance tiers) and marks the project
 * employerFunded. Funds are released to the freelancer (minus their
 * commission) only when the employer approves the work (approveWork).
 */
export const fundProjectEscrow = mutation({
  args: { projectId: v.id("freelanceProjects") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new ConvexError("Project not found");
    if (project.employerId !== user._id) {
      throw new ConvexError("Not authorized: only the employer on this project can fund it");
    }
    if (project.employerFunded) throw new ConvexError("Escrow is already funded for this project");
    if (project.status !== "active") throw new ConvexError("Project is not active");

    const amount = project.budget;
    const protectionResolved = await resolveFee(ctx.db, "freelance", "buyer_protection", amount);
    const protection = protectionResolved.breakdown;
    const total = amount + protection.fee;

    const walletBalance = user.walletBalance || 0;
    if (walletBalance < total) {
      throw new ConvexError(
        `Insufficient wallet balance. You need KES ${total.toLocaleString()} (project KES ${amount.toLocaleString()} + protection fee KES ${protection.fee.toLocaleString()}). Deposit via M-Pesa on the Earnings page first.`
      );
    }

    const now = Date.now();
    await ctx.db.patch(user._id, {
      walletBalance: walletBalance - total,
      escrowBalance: (user.escrowBalance || 0) + total,
    });

    await ctx.db.insert("walletTransactions", {
      userId: user._id,
      type: "escrow_fund",
      amount: total,
      currency: "KES",
      status: "completed",
      reference: `NX-FL-ESC-${now}`,
      description: `Freelance escrow funding for "${project.title}" (incl. KES ${protection.fee.toLocaleString()} protection fee)`,
      createdAt: now,
    });

    await ctx.db.patch(args.projectId, {
      employerFunded: true,
      updatedAt: now,
    });

    await notify(
      ctx,
      project.freelancerId,
      "freelance",
      "Escrow funded — safe to start",
      `The employer funded KES ${amount.toLocaleString()} for "${project.title}". Funds are held by Nexora and released when your work is approved.`,
      "/freelance/projects",
    );

    return { success: true, funded: total, protectionFee: protection.fee };
  },
});

/**
 * Freelancer submits completed work. Moves the project to "submitted" and
 * notifies the employer to review. Each delivery is versioned so the employer
 * can track rounds.
 */
export const submitWork = mutation({
  args: {
    projectId: v.id("freelanceProjects"),
    message: v.string(),
    fileIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new ConvexError("Project not found");
    if (project.freelancerId !== user._id) throw new ConvexError("Not authorized: only the hired freelancer can submit work");
    if (project.status !== "active" && project.status !== "revision_requested") {
      throw new ConvexError(`Work cannot be submitted while the project is ${project.status.replace("_", " ")}`);
    }
    if (!args.message.trim()) throw new ConvexError("Describe what you delivered");

    const now = Date.now();
    const existingSubmissions = project.files || [];
    const version = existingSubmissions.length + 1;

    const submissionFiles = (args.fileIds || []).map((fileId, idx) => ({
      name: `submission-v${version}-file${idx + 1}`,
      url: fileId,
      uploadedBy: user._id,
      uploadedAt: now,
      version,
      note: idx === 0 ? args.message.trim() : undefined,
    }));

    await ctx.db.patch(args.projectId, {
      files: [...existingSubmissions, ...submissionFiles],
      status: "submitted",
      lastReview: {
        action: "submitted",
        note: args.message.trim(),
        by: user._id,
        at: now,
      },
      updatedAt: now,
    });

    // Deliverable note is also posted to the project thread.
    await ctx.db.insert("freelanceMessages", {
      projectId: args.projectId,
      senderId: user._id,
      content: `📦 [Work submitted — delivery v${version}] ${args.message.trim()}`,
      read: false,
      createdAt: now,
    });

    await notify(
      ctx,
      project.employerId,
      "freelance",
      "Work submitted for review",
      `${user.name || "Your freelancer"} submitted delivery v${version} on "${project.title}". Review it, request revisions, or approve to release payment.`,
      "/employer/projects",
    );

    return { version, submissionCount: version };
  },
});

/**
 * Employer requests a revision on a submission. The project moves to
 * "revision_requested" and the freelancer is notified with the employer's
 * notes. Escrow stays locked through revision rounds.
 */
export const requestRevision = mutation({
  args: {
    projectId: v.id("freelanceProjects"),
    note: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new ConvexError("Project not found");
    if (project.employerId !== user._id) throw new ConvexError("Not authorized: only the employer can request revisions");
    if (project.status !== "submitted") throw new ConvexError("There is no new submission to review");
    if (!args.note.trim()) throw new ConvexError("Describe what needs to change");

    const now = Date.now();
    const nextRound = (project.revisionCount || 0) + 1;

    await ctx.db.patch(args.projectId, {
      status: "revision_requested",
      revisionCount: nextRound,
      lastReview: {
        action: "revision_requested",
        note: args.note.trim(),
        by: user._id,
        at: now,
      },
      updatedAt: now,
    });

    await ctx.db.insert("freelanceMessages", {
      projectId: args.projectId,
      senderId: user._id,
      content: `🔁 [Revision requested — round ${nextRound}] ${args.note.trim()}`,
      read: false,
      createdAt: now,
    });

    await notify(
      ctx,
      project.freelancerId,
      "freelance",
      `Revision requested (round ${nextRound})`,
      `The employer requested changes on "${project.title}": ${args.note.trim()}`, 
      "/freelance/projects",
    );

    return { success: true, revisionRound: nextRound };
  },
});

/**
 * Employer approves the work. This is the payment moment:
 *  - the escrow (project + employer protection fee, already debited at
 *    fundProjectEscrow) is released from the employer's escrow balance,
 *  - the freelancer receives the project amount minus their commission
 *    (freelance tier engine) into their wallet,
 *  - both users get a completed transaction record, and
 *  - the project + task move to completed.
 */
export const approveWork = mutation({
  args: {
    projectId: v.id("freelanceProjects"),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new ConvexError("Project not found");
    if (project.employerId !== user._id) throw new ConvexError("Not authorized: only the employer can approve work");
    if (project.status === "completed") throw new ConvexError("Project is already completed");
    if (project.status !== "submitted") {
      throw new ConvexError("Wait for the freelancer's submission before approving");
    }
    if (!project.employerFunded) {
      throw new ConvexError("Escrow was never funded for this project — approve only funded projects");
    }

    const now = Date.now();
    const amount = project.budget;
    const commissionResolved = await resolveFee(ctx.db, "freelance", "seller_commission", amount);
    const protectionResolved = await resolveFee(ctx.db, "freelance", "buyer_protection", amount);
    const commission = commissionResolved.breakdown;
    const protection = protectionResolved.breakdown;
    const netToFreelancer = amount - commission.fee;

    // Ledger: freelancer commission + employer protection realized at release.
    try {
      await recordFeeEarning(ctx.db, {
        sourceType: "freelance_release",
        marketplace: "freelance",
        feeType: "seller_commission",
        ruleKey: commissionResolved.ruleKey,
        ruleRate: commissionResolved.ruleRate,
        amount: commission.fee,
        baseAmount: amount,
        projectId: project._id,
        buyerId: user._id,
        sellerId: project.freelancerId,
        description: `Freelancer commission on "${project.title}"`,
      });
      await recordFeeEarning(ctx.db, {
        sourceType: "freelance_release",
        marketplace: "freelance",
        feeType: "buyer_protection",
        ruleKey: protectionResolved.ruleKey,
        ruleRate: protectionResolved.ruleRate,
        amount: protection.fee,
        baseAmount: amount,
        projectId: project._id,
        buyerId: user._id,
        sellerId: project.freelancerId,
        description: `Employer protection fee on "${project.title}"`,
      });
    } catch (err) {
      console.error("[fees] ledger insert failed (freelance_release):", err);
    }

    const employer: any = await ctx.db.get(user._id);
    if (!employer) throw new ConvexError("Employer account not found");
    const freelancer: any = project.freelancerId ? await ctx.db.get(project.freelancerId as any) : null;

    // Release from employer escrow balance.
    await ctx.db.patch(employer._id, {
      escrowBalance: Math.max(0, (employer.escrowBalance || 0) - (amount + protection.fee)),
    });

    // ── Referral hook: completed freelance project payment ──
    try {
      await ctx.runMutation(internal.referral.internalOnEscrowReleased, {
        participantIds: [employer._id, project.freelancerId].filter(Boolean),
        escrowId: (project.escrowId as string) || args.projectId,
        amount,
        currency: project.currency || "KES",
      });
    } catch (err) {
      console.error("[referral] freelance release hook failed:", err);
    }

    // Pay the freelancer their net earnings into their wallet.
    if (freelancer) {
      await ctx.db.patch(freelancer._id, {
        walletBalance: (freelancer.walletBalance || 0) + netToFreelancer,
      });
      await ctx.db.insert("walletTransactions", {
        userId: freelancer._id,
        type: "escrow_release",
        amount: netToFreelancer,
        currency: "KES",
        status: "completed",
        reference: `NX-FL-REL-${now}`,
        description: `Escrow release for "${project.title}" (gross KES ${amount.toLocaleString()} − ${commission.rate * 100}% commission KES ${commission.fee.toLocaleString()})`,
        createdAt: now,
      });

      // Update the freelancer's freelance profile stats.
      const fProfile = await ctx.db
        .query("freelanceProfiles")
        .withIndex("by_user", (q: any) => q.eq("userId", freelancer._id))
        .first();
      if (fProfile) {
        await ctx.db.patch(fProfile._id, {
          completedProjects: (fProfile.completedProjects || 0) + 1,
          totalEarnings: (fProfile.totalEarnings || 0) + netToFreelancer,
          updatedAt: now,
        });
      }
    }

    // Employer-side ledger entry for the release.
    await ctx.db.insert("walletTransactions", {
      userId: user._id,
      type: "escrow_release",
      amount,
      currency: "KES",
      status: "completed",
      reference: `NX-FL-EMP-${now}`,
      description: `Escrow released to freelancer for "${project.title}"`,
      createdAt: now,
    });

    await ctx.db.patch(args.projectId, {
      status: "completed",
      progress: 100,
      totalPaid: netToFreelancer,
      escrowReleased: true,
      completedAt: now,
      lastReview: {
        action: "approved",
        note: args.note?.trim() || undefined,
        by: user._id,
        at: now,
      },
      updatedAt: now,
    });

    // Close out the originating task.
    if (project.taskId) {
      const task = await ctx.db.get(project.taskId as any);
      if (task && "status" in task) {
        await ctx.db.patch(project.taskId as any, { status: "completed", updatedAt: now });
      }
    }

    if (args.note?.trim()) {
      await ctx.db.insert("freelanceMessages", {
        projectId: args.projectId,
        senderId: user._id,
        content: `✅ [Work approved] ${args.note.trim()}`,
        read: false,
        createdAt: now,
      });
    }

    await notify(
      ctx,
      project.freelancerId,
      "freelance",
      "💰 Payment released!",
      `The employer approved "${project.title}". KES ${netToFreelancer.toLocaleString()} (net of commission) has been added to your wallet.`,
      "/freelance/earnings",
    );
    await notify(
      ctx,
      user._id,
      "freelance",
      "Project completed",
      `You approved "${project.title}". The escrow has been released to the freelancer and the project is closed.`,
      "/employer/projects",
    );

    return { success: true, paidToFreelancer: netToFreelancer, commission: commission.fee };
  },
});

/**
 * Projects where the current user is the EMPLOYER (scoped read for the
 * employer panel). getMyProjects mixes both sides, which is correct for the
 * writer dashboard but wrong for employer management screens.
 */
export const getEmployerProjects = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q: any) => q.eq("email", identity.email))
      .first();
    if (!user) return [];

    const projects = await ctx.db
      .query("freelanceProjects")
      .withIndex("by_employer", (q: any) => q.eq("employerId", user._id))
      .order("desc")
      .collect();

    return Promise.all(
      projects.map(async (proj) => {
        const freelancer = await ctx.db.get(proj.freelancerId as any);
        return {
          ...proj,
          freelancerName:
            freelancer && "name" in freelancer ? (freelancer as any).name : "Unknown",
        };
      })
    );
  },
});

/** Get total freelance stats for current user */
export const getFreelanceStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { totalTasks: 0, totalProjects: 0, totalApplications: 0, activeProjects: 0 };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    if (!user) return { totalTasks: 0, totalProjects: 0, totalApplications: 0, activeProjects: 0 };

    const tasks = await ctx.db
      .query("freelanceTasks")
      .withIndex("by_employer", (q) => q.eq("employerId", user._id))
      .collect();

    const projects = await ctx.db
      .query("freelanceProjects")
      .filter((q) =>
        q.or(
          q.eq(q.field("employerId"), user._id),
          q.eq(q.field("freelancerId"), user._id)
        )
      )
      .collect();

    const applications = await ctx.db
      .query("freelanceApplications")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", user._id))
      .collect();

    return {
      totalTasks: tasks.length,
      totalProjects: projects.length,
      totalApplications: applications.length,
      activeProjects: projects.filter((p) => p.status === "active").length,
    };
  },
});
