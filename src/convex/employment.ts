import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getSessionUser } from "./users";

/**
 * ─── FLOW A: EMPLOYMENT JOBS ───────────────────────────────────────────────
 *
 * A real employment board, separate from the other two Nexora work flows:
 *
 *   Flow A  employment vacancy   → jobPosts      (THIS FILE)
 *   Flow B  local service booking→ serviceRequests (services.ts)
 *   Flow C  freelance project    → freelanceTasks/freelanceProjects (freelance.ts)
 *
 * Rules enforced HERE (server-side, not just in the UI):
 *  • Only an `employer` (or admin) can publish a vacancy.
 *  • An employer NEVER needs a company. `employerType` is individual |
 *    business | organization; companyName is optional and only displayed.
 *  • Only the poster can read applications, shortlist, accept or reject, or
 *    close the job. Ownership is checked against posterId on every write.
 *  • The poster can never apply to their own vacancy.
 *  • An applicant can hold exactly ONE application per vacancy.
 */

export const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "temporary", label: "Temporary" },
  { value: "internship", label: "Internship" },
  { value: "casual", label: "Casual / one-off" },
  { value: "commission", label: "Commission" },
  { value: "other", label: "Other arrangement" },
] as const;

export const EMPLOYER_TYPES = [
  { value: "individual", label: "Individual" },
  { value: "business", label: "Business" },
  { value: "organization", label: "Organization / NGO" },
] as const;

export const PAYMENT_FREQUENCIES = [
  { value: "per_hour", label: "Per hour" },
  { value: "per_day", label: "Per day" },
  { value: "per_week", label: "Per week" },
  { value: "per_month", label: "Per month" },
  { value: "per_project", label: "Per project" },
  { value: "negotiable", label: "Negotiable" },
] as const;

/** Common Kenyan vacancy categories — a job seeker filters on these. */
export const JOB_CATEGORIES = [
  { slug: "house-help", name: "House help & housekeeping", emoji: "🏠" },
  { slug: "driving", name: "Driver / transport", emoji: "🚗" },
  { slug: "cooking", name: "Cook / kitchen", emoji: "🍳" },
  { slug: "shops", name: "Shop & retail", emoji: "🏪" },
  { slug: "agriculture", name: "Farm & agriculture", emoji: "🌾" },
  { slug: "mechanics", name: "Mechanic & repair", emoji: "🔧" },
  { slug: "security", name: "Security guard", emoji: "🛡️" },
  { slug: "reception", name: "Reception & admin", emoji: "🗂️" },
  { slug: "teaching", name: "Teaching & tutoring", emoji: "📚" },
  { slug: "sales", name: "Sales", emoji: "📣" },
  { slug: "care", name: "Care & support", emoji: "🧓" },
  { slug: "construction", name: "Construction & manual work", emoji: "🧱" },
  { slug: "hospitality", name: "Hospitality", emoji: "🍽️" },
  { slug: "other", name: "Other", emoji: "🧩" },
] as const;

type SessionUser = any;

async function requireSessionUser(ctx: any): Promise<SessionUser> {
  const user = await getSessionUser(ctx);
  if (!user) throw new ConvexError("Please sign in first");
  return user;
}

/** Only employers (and admins acting on the platform) may manage vacancies. */
function requireEmployer(user: SessionUser) {
  const role = user.role as string | undefined;
  if (role === "admin") return;
  if (role !== "employer") {
    throw new ConvexError(
      "Only Employer accounts can post a job. Your account type does not allow hiring.",
    );
  }
}

function cleanList(values: string[] | undefined, max = 20): string[] | undefined {
  if (!values) return undefined;
  const out = values
    .map((v) => v.trim())
    .filter((v) => v.length > 0)
    .slice(0, max);
  return out.length > 0 ? out : undefined;
}

function employerLabel(u: SessionUser): string {
  const name = typeof u.name === "string" ? u.name.trim() : "";
  return name.length > 1 ? name : (typeof u.email === "string" ? u.email.split("@")[0] : "Employer");
}

/** "Posted by Jane" — an individual employer is displayed as a PERSON, never
 *  as "Company: Jane". */
export function employerDisplayLabel(args: {
  name?: string;
  employerType?: string;
  companyName?: string;
  employerDisplay?: string;
}): string {
  const name = (args.name ?? "").trim();
  const company = (args.companyName ?? "").trim();
  const display = (args.employerDisplay ?? "").trim();
  if (args.employerType === "individual" || (!company && display)) {
    const who = display || name || "Individual employer";
    return `Posted by ${who}`;
  }
  if (company) return display ? `${display} · ${company}` : company;
  if (display) return display;
  return name ? `Posted by ${name}` : "Individual employer";
}

/* ────────────────────────── POST A VACANCY ─────────────────────────────── */

export const createEmploymentJob = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.string(),
    employmentType: v.optional(v.string()),
    responsibilities: v.optional(v.array(v.string())),
    requiredSkills: v.optional(v.array(v.string())),
    experienceRequired: v.optional(v.string()),
    location: v.string(),
    county: v.string(),
    town: v.optional(v.string()),
    salaryMin: v.optional(v.number()),
    salaryMax: v.optional(v.number()),
    paymentFrequency: v.optional(v.string()),
    positions: v.optional(v.number()),
    startDate: v.optional(v.number()),
    workingHours: v.optional(v.string()),
    applicationMethod: v.optional(v.string()),
    deadline: v.optional(v.number()),
    remote: v.optional(v.boolean()),
    employerType: v.optional(v.union(v.literal("individual"), v.literal("business"), v.literal("organization"))),
    companyName: v.optional(v.string()),
    employerDisplay: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireSessionUser(ctx);
    requireEmployer(user);

    const title = args.title.trim();
    const description = args.description.trim();
    if (title.length < 4) throw new ConvexError("Give the job a clear title (at least 4 characters)");
    if (description.length < 10) throw new ConvexError("Describe the job in a little more detail");
    if (!args.county.trim()) throw new ConvexError("Select the county where this job is based");
    if (!args.location.trim()) throw new ConvexError("Add the location (town or estate)");

    const employerType = args.employerType ?? "individual";
    const companyName = args.companyName?.trim();
    // A company name is OPTIONAL everywhere. For `business`/`organization`
    // employers we merely record it when given — it is never a gate. This is
    // the Part-3 rule: "I need a house help" must never require a company.
    if (companyName && companyName.length < 2) {
      throw new ConvexError("Company / organisation name looks too short");
    }
    if (args.salaryMin !== undefined && args.salaryMax !== undefined && args.salaryMin > args.salaryMax) {
      throw new ConvexError("Minimum pay cannot be greater than the maximum");
    }

    const now = Date.now();
    const jobId = await ctx.db.insert("jobPosts", {
      posterId: String(user._id),
      posterName: employerLabel(user),
      posterVerified: user.accountStatus === "active",
      type: "job" as const,
      title,
      description,
      category: args.category,
      currency: "KES",
      location: args.location.trim(),
      county: args.county.trim(),
      town: args.town?.trim() || undefined,
      remote: args.remote ?? false,
      skills: cleanList(args.requiredSkills),
      deadline: args.deadline,
      status: "open" as const,
      applicants: 0,
      views: 0,
      createdAt: now,
      updatedAt: now,
      employmentType: (args.employmentType as any) || undefined,
      responsibilities: cleanList(args.responsibilities),
      requiredSkills: cleanList(args.requiredSkills),
      experienceRequired: args.experienceRequired?.trim() || undefined,
      salaryMin: args.salaryMin,
      salaryMax: args.salaryMax,
      paymentFrequency: (args.paymentFrequency as any) || undefined,
      positions: args.positions,
      startDate: args.startDate,
      workingHours: args.workingHours?.trim() || undefined,
      applicationMethod: args.applicationMethod?.trim() || undefined,
      employerType,
      companyName: companyName || undefined,
      employerDisplay: args.employerDisplay?.trim() || undefined,
    });

    // Remember the employer identity on the account so admin (and the public
    // job page) can tell an individual employer from a company.
    const patch: Record<string, any> = {};
    if (user.employerType !== employerType) patch.employerType = employerType;
    if (companyName && user.companyName !== companyName) patch.companyName = companyName;
    if (!user.employerActivatedAt) patch.employerActivatedAt = now;
    if (Object.keys(patch).length > 0) await ctx.db.patch(user._id, patch);

    return { jobId };
  },
});

/* ────────────────────────── BROWSE REAL JOBS ───────────────────────────── */

export const listOpenJobs = query({
  args: {
    category: v.optional(v.string()),
    county: v.optional(v.string()),
    employmentType: v.optional(v.string()),
    remote: v.optional(v.boolean()),
    search: v.optional(v.string()),
    minSalary: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 60, 1), 200);
    // Paginated scan of REAL rows only — never demo data.
    const page: any = await ctx.db
      .query("jobPosts")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .paginate({ cursor: null, numItems: Math.min(limit * 4, 400) });

    const search = (args.search ?? "").trim().toLowerCase();
    const jobs = page.page
      .filter((j: any) => (j.type ?? "job") === "job")
      .filter((j: any) => (args.category ? j.category === args.category : true))
      .filter((j: any) => (args.county ? j.county === args.county : true))
      .filter((j: any) => (args.employmentType ? j.employmentType === args.employmentType : true))
      .filter((j: any) => (args.remote !== undefined ? j.remote === args.remote : true))
      .filter((j: any) =>
        args.minSalary !== undefined
          ? typeof j.salaryMax === "number"
            ? j.salaryMax >= (args.minSalary as number)
            : typeof j.salaryMin === "number"
            ? j.salaryMin >= (args.minSalary as number)
            : true
          : true,
      )
      .filter((j: any) =>
        search
          ? `${j.title} ${j.description} ${j.location} ${j.county}`.toLowerCase().includes(search)
          : true,
      )
      .slice(0, limit)
      .map((j: any) => ({
        ...j,
        byline: employerDisplayLabel({
          name: j.posterName,
          employerType: j.employerType,
          companyName: j.companyName,
          employerDisplay: j.employerDisplay,
        }),
      }));
    return { jobs, hasMore: page.isDone === false };
  },
});

export const getJob = query({
  args: { jobId: v.id("jobPosts") },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job || (job as any).type !== "job") return null;
    return {
      ...job,
      byline: employerDisplayLabel({
        name: (job as any).posterName,
        employerType: (job as any).employerType,
        companyName: (job as any).companyName,
        employerDisplay: (job as any).employerDisplay,
      }),
    };
  },
});

/* ────────────────────────── APPLICATIONS ────────────────────────────────── */

export const applyToJob = mutation({
  args: {
    jobId: v.id("jobPosts"),
    message: v.string(),
    proposedPay: v.optional(v.number()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireSessionUser(ctx);
    const job = await ctx.db.get(args.jobId);
    if (!job || (job as any).type !== "job") throw new ConvexError("This job is no longer available");
    if (job.status !== "open") throw new ConvexError("This job is closed to applications");
    if (String(job.posterId) === String(user._id)) {
      throw new ConvexError("You cannot apply to your own job post");
    }
    const message = args.message.trim();
    if (message.length < 10) throw new ConvexError("Tell the employer a little about yourself (10+ characters)");

    const existing = (await ctx.db
      .query("jobApplications")
      .withIndex("by_job", (q) => q.eq("jobId", String(args.jobId)))
      .collect()) as any[];
    if (existing.some((a) => String(a.applicantId) === String(user._id))) {
      throw new ConvexError("You have already applied to this job");
    }

    const now = Date.now();
    const applicationId = await ctx.db.insert("jobApplications", {
      jobId: String(args.jobId),
      jobTitle: job.title,
      employerId: job.posterId,
      applicantId: String(user._id),
      applicantName: employerLabel(user),
      applicantRole: user.role,
      applicantPhone: args.phone?.trim() || (typeof user.phone === "string" ? user.phone : undefined),
      message,
      proposedBudget: args.proposedPay,
      status: "pending" as const,
      createdAt: now,
    });

    await ctx.db.patch(args.jobId, { applicants: (job.applicants ?? 0) + 1, updatedAt: now });

    await ctx.db.insert("notifications", {
      userId: job.posterId,
      type: "job_application",
      title: "New job application",
      message: `${employerLabel(user)} applied for "${job.title}".`,
      read: false,
      link: `/employer/jobs`,
      createdAt: now,
    });

    return { applicationId };
  },
});

export const getMyApplications = query({
  args: {},
  handler: async (ctx) => {
    const user = await getSessionUser(ctx);
    if (!user) return [];
    const rows = (await ctx.db
      .query("jobApplications")
      .withIndex("by_applicant", (q) => q.eq("applicantId", String(user._id)))
      .collect()) as any[];
    return rows.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/* ────────────────────────── EMPLOYER MANAGEMENT ─────────────────────────── */

export const getMyEmploymentJobs = query({
  args: {},
  handler: async (ctx) => {
    const user = await getSessionUser(ctx);
    if (!user) return [];
    const rows = (await ctx.db
      .query("jobPosts")
      .withIndex("by_poster", (q) => q.eq("posterId", String(user._id)))
      .collect()) as any[];
    return rows
      .filter((j) => j.type === "job")
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((j) => ({ ...j, byline: employerDisplayLabel({ name: j.posterName, employerType: j.employerType, companyName: j.companyName, employerDisplay: j.employerDisplay }) }));
  },
});

export const getJobApplications = query({
  args: { jobId: v.id("jobPosts") },
  handler: async (ctx, args) => {
    const user = await requireSessionUser(ctx);
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new ConvexError("Job not found");
    if (String(job.posterId) !== String(user._id) && user.role !== "admin") {
      throw new ConvexError("Only the employer who posted this job can view its applicants");
    }
    const rows = (await ctx.db
      .query("jobApplications")
      .withIndex("by_job", (q) => q.eq("jobId", String(args.jobId)))
      .collect()) as any[];
    return rows.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const updateApplicationStatus = mutation({
  args: {
    applicationId: v.id("jobApplications"),
    status: v.union(v.literal("pending"), v.literal("shortlisted"), v.literal("accepted"), v.literal("rejected")),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireSessionUser(ctx);
    const application = await ctx.db.get(args.applicationId);
    if (!application) throw new ConvexError("Application not found");
    const job: any = await ctx.db.get(application.jobId as any);
    if (!job) throw new ConvexError("Job not found");
    if (String(job.posterId) !== String(user._id) && user.role !== "admin") {
      throw new ConvexError("Only the employer who posted this job can change applicants");
    }
    const now = Date.now();
    await ctx.db.patch(args.applicationId, {
      status: args.status,
      reviewNote: args.note?.trim() || undefined,
      reviewedAt: now,
    });
    await ctx.db.insert("notifications", {
      userId: application.applicantId,
      type: "job_application",
      title:
        args.status === "accepted"
          ? "Application accepted"
          : args.status === "rejected"
          ? "Application not successful"
          : args.status === "shortlisted"
          ? "You were shortlisted"
          : "Application updated",
      message: `${job.title} — ${args.status}.${args.note ? ` ${args.note}` : ""}`,
      read: false,
      link: `/employment/jobs/${job._id}`,
      createdAt: now,
    });
    return { ok: true };
  },
});

export const setJobStatus = mutation({
  args: {
    jobId: v.id("jobPosts"),
    status: v.union(v.literal("open"), v.literal("in_progress"), v.literal("completed"), v.literal("closed")),
  },
  handler: async (ctx, args) => {
    const user = await requireSessionUser(ctx);
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new ConvexError("Job not found");
    if (String(job.posterId) !== String(user._id) && user.role !== "admin") {
      throw new ConvexError("Only the employer who posted this job can change its status");
    }
    await ctx.db.patch(args.jobId, { status: args.status, updatedAt: Date.now() });
    return { ok: true };
  },
});