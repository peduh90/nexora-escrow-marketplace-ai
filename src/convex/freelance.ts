import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    if (!user) throw new Error("User not found");

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
      isVerified: user.kycStatus === "verified",
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

/** Get freelancer profile by user ID */
export const getProfile = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("freelanceProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    return profile || null;
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

/** Search freelancers */
export const searchFreelancers = query({
  args: {
    query: v.optional(v.string()),
    category: v.optional(v.string()),
    minRate: v.optional(v.number()),
    maxRate: v.optional(v.number()),
    availability: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let profiles = await ctx.db
      .query("freelanceProfiles")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    if (args.query) {
      const q = args.query.toLowerCase();
      profiles = profiles.filter(
        (p) =>
          p.displayName.toLowerCase().includes(q) ||
          (p.title && p.title.toLowerCase().includes(q)) ||
          p.skills.some((s) => s.toLowerCase().includes(q))
      );
    }

    if (args.category) {
      profiles = profiles.filter((p) => p.categories.includes(args.category!));
    }

    if (args.minRate !== undefined) {
      profiles = profiles.filter((p) => (p.hourlyRate || 0) >= args.minRate!);
    }
    if (args.maxRate !== undefined) {
      profiles = profiles.filter((p) => (p.hourlyRate || 0) <= args.maxRate!);
    }

    if (args.availability) {
      profiles = profiles.filter((p) => p.availability === args.availability);
    }

    return profiles;
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
    freelancerCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    if (!user) throw new Error("User not found");

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
      freelancerCount: args.freelancerCount || 1,
      applicants: 0,
      views: 0,
      status: "open",
      createdAt: now,
      updatedAt: now,
    });

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

    return tasks.slice(0, args.limit ?? 50);
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

    return await ctx.db
      .query("freelanceTasks")
      .withIndex("by_employer", (q) => q.eq("employerId", user._id))
      .order("desc")
      .collect();
  },
});

/** Get a single task by ID */
export const getTask = query({
  args: { taskId: v.id("freelanceTasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    return task || null;
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    if (!user) throw new Error("User not found");

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    if (task.status !== "open") throw new Error("Task is not accepting applications");

    // Check if already applied
    const existing = await ctx.db
      .query("freelanceApplications")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
    if (existing.some((a) => a.freelancerId === user._id)) {
      throw new Error("You have already applied to this task");
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
    if (!identity) throw new Error("Not authenticated");

    const application = await ctx.db.get(args.applicationId);
    if (!application) throw new Error("Application not found");

    const task = await ctx.db.get(application.taskId as any);
    if (!task || !("employerId" in task)) throw new Error("Task not found");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    if (!user || (task as any).employerId !== user._id) throw new Error("Not authorized");

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
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.patch(args.projectId, {
      progress: args.progress,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

// ─── FREELANCE SERVICES (Account Marketplace) ───

/** Create a service listing */
export const createService = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.string(),
    price: v.number(),
    priceType: v.union(v.literal("fixed"), v.literal("hourly"), v.literal("starting_at")),
    deliveryTime: v.string(),
    revisions: v.number(),
    features: v.array(v.string()),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    if (!user) throw new Error("User not found");

    const now = Date.now();
    const serviceId = await ctx.db.insert("freelanceServices", {
      freelancerId: user._id,
      freelancerName: user.name || "Freelancer",
      freelancerImage: user.image,
      title: args.title,
      description: args.description,
      category: args.category,
      price: args.price,
      priceType: args.priceType,
      currency: "KES",
      deliveryTime: args.deliveryTime,
      revisions: args.revisions,
      features: args.features,
      tags: args.tags,
      orders: 0,
      views: 0,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    return { serviceId };
  },
});

/** Get services by freelancer */
export const getMyServices = query({
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
      .query("freelanceServices")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", user._id))
      .order("desc")
      .collect();
  },
});

/** Get active services */
export const getActiveServices = query({
  args: {
    category: v.optional(v.string()),
    query: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let services = await ctx.db
      .query("freelanceServices")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .order("desc")
      .collect();

    if (args.category) {
      services = services.filter((s) => s.category === args.category);
    }

    if (args.query) {
      const q = args.query.toLowerCase();
      services = services.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return services.slice(0, args.limit ?? 50);
  },
});

// ─── FREELANCE MESSAGES ───

/** Send a project message */
export const sendProjectMessage = mutation({
  args: {
    projectId: v.id("freelanceProjects"),
    content: v.string(),
    attachmentUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    if (!user) throw new Error("User not found");

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
    if (!identity) throw new Error("Not authenticated");
    return await ctx.storage.generateUploadUrl();
  },
});

// ─── SUBMISSIONS ───

/** Submit work for a project */
export const submitWork = mutation({
  args: {
    projectId: v.id("freelanceProjects"),
    message: v.string(),
    fileIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    if (!user) throw new Error("User not found");

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    if (project.freelancerId !== user._id) throw new Error("Not authorized");

    const now = Date.now();
    const existingSubmissions = project.files || [];
    const version = existingSubmissions.length + 1;

    const submissionFiles = (args.fileIds || []).map((fileId, idx) => ({
      name: `submission-v${version}-file${idx + 1}`,
      url: fileId, // will be resolved by storage on read
      uploadedBy: user._id,
      uploadedAt: now,
    }));

    await ctx.db.patch(args.projectId, {
      files: [...existingSubmissions, ...submissionFiles],
      status: "active",
      updatedAt: now,
    });

    // Create a notification-like message in freelanceMessages
    await ctx.db.insert("freelanceMessages", {
      projectId: args.projectId,
      senderId: user._id,
      content: `[Submission v${version}] ${args.message}`,
      read: false,
      createdAt: now,
    });

    return { version, submissionCount: version };
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
