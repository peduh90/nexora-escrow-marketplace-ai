import { v } from "convex/values";
import { query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { getSessionUser } from "./users";

// ─── NEXORA PROGRESSIVE VERIFICATION ────────────────────────────────────────
//
// Two tiers, enforced server-side:
//  • basic    — phone/email + real name + phone number (every active account,
//               including buyers: simple, secure, no onboarding friction).
//  • business — the role's full business gate:
//               · Seller   → KYC verified AND ≥1 genuine product listing.
//               · Employer → complete profile AND ≥5 legitimate, DIFFERENT
//                 jobs/services posted.
//
// `verificationLevel` and the activation timestamps on `users` are written
// ONLY by this engine (internal mutations) — the client can never grant itself
// privileges. Referral commissions for seller/freelancer/employer bonuses are
// unlocked strictly by these milestones, never by clicks or raw signups.

/** Minimum length for a "genuine" listing/task description (anti-spam). */
const MIN_DESCRIPTION_CHARS = 60;
/** A genuine employer must post at least this many distinct real offerings. */
export const EMPLOYER_REQUIRED_JOBS = 5;

/** Approximate title distinctness: normalized, first 5 meaningful words. */
function titleKey(title: string): string {
  const stop = new Set([
    "the", "a", "an", "for", "and", "with", "of", "to", "in", "on", "my",
    "need", "wanted", "looking", "help",
  ]);
  const words = (title || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !stop.has(w));
  return words.slice(0, 5).join(" ") || (title || "").toLowerCase().trim();
}

/** How many DISTINCT legitimate offerings this employer has posted so far. */
async function employerDistinctJobCount(ctx: any, userId: string): Promise<number> {
  const tasks = await ctx.db
    .query("freelanceTasks")
    .withIndex("by_employer", (q: any) => q.eq("employerId", userId))
    .collect();
  const legit = tasks.filter(
    (t: any) =>
      t.status !== "removed" &&
      typeof t.description === "string" &&
      t.description.replace(/\s+/g, " ").trim().length >= MIN_DESCRIPTION_CHARS
  );
  const seen = new Set<string>();
  for (const t of legit) seen.add(titleKey(t.title));
  return seen.size;
}

/** Whether this seller has at least one genuine, active marketplace offering. */
async function sellerHasGenuineListing(ctx: any, userId: string): Promise<boolean> {
  const listings = await ctx.db
    .query("listings")
    .withIndex("by_seller", (q: any) => q.eq("sellerId", userId))
    .collect();
  return listings.some(
    (l: any) =>
      l.status === "active" &&
      typeof l.description === "string" &&
      l.description.replace(/\s+/g, " ").trim().length >= MIN_DESCRIPTION_CHARS
  );
}

/** The shared checklist powering dashboards and the activation engines. */
async function buildChecklist(ctx: any, user: any) {
  const role = (user.role as string) || "";
  const u = user as any;

  const emailOk = typeof u.email === "string" && u.email.includes("@");
  const nameOk = typeof u.name === "string" && u.name.trim().length >= 3;
  const phoneOk =
    typeof u.phone === "string" && u.phone.replace(/\D/g, "").length >= 9;
  const profileOk =
    emailOk && nameOk && phoneOk &&
    typeof u.county === "string" && !!u.county.trim() &&
    typeof u.town === "string" && !!u.town.trim();

  const kycStatus = (u.kycStatus as string) || "not_started";
  const kycVerified = kycStatus === "verified";
  const hasListing = role === "seller" ? await sellerHasGenuineListing(ctx, u._id) : false;
  const jobCount = role === "employer" ? await employerDistinctJobCount(ctx, u._id) : 0;

  const requirements: Array<{
    key: string;
    label: string;
    done: boolean;
    detail?: string;
    action?: string;
  }> = [
    {
      key: "email",
      label: "Verified email address",
      done: emailOk,
      detail: emailOk ? undefined : "Confirm the email you registered with.",
    },
    {
      key: "name",
      label: "Full name on the account",
      done: nameOk,
      detail: nameOk ? undefined : "Add your real full name.",
      action: nameOk ? undefined : "/buyer/settings",
    },
    {
      key: "phone",
      label: "Phone number (M-Pesa reachable)",
      done: phoneOk,
      detail: phoneOk ? undefined : "Add a phone number so escrow payouts can reach you.",
      action: phoneOk ? undefined : "/buyer/settings",
    },
  ];

  if (role === "seller") {
    requirements.push(
      {
        key: "profile",
        label: "Business location (county & town)",
        done: profileOk,
        detail: profileOk ? undefined : "Complete your business profile location.",
        action: profileOk ? undefined : "/seller/store",
      },
      {
        key: "kyc",
        label: "KYC business verification approved",
        done: kycVerified,
        detail:
          kycVerified
            ? undefined
            : kycStatus === "pending"
              ? "Under review by the Nexora team."
              : "Submit your ID and business documents.",
        action: kycVerified ? undefined : "/seller/kyc",
      },
      {
        key: "listing",
        label: "At least one genuine product listing",
        done: hasListing,
        detail:
          hasListing
            ? undefined
            : "Publish a real product with a full description (60+ characters).",
        action: hasListing ? undefined : "/seller/add-product",
      },
    );
  }

  if (role === "employer") {
    requirements.push(
      {
        key: "profile",
        label: "Complete profile (name, phone, county & town)",
        done: profileOk,
        detail: profileOk ? undefined : "Finish your profile so freelancers know who's hiring.",
        action: profileOk ? undefined : "/freelance/settings",
      },
      {
        key: "jobs",
        label: `Post ${EMPLOYER_REQUIRED_JOBS} legitimate, different jobs or services`,
        done: jobCount >= EMPLOYER_REQUIRED_JOBS,
        detail: `${jobCount} of ${EMPLOYER_REQUIRED_JOBS} distinct offerings so far — each needs a real description (60+ characters).`,
        action: jobCount >= EMPLOYER_REQUIRED_JOBS ? undefined : "/employer/post-job",
      },
    );
  }

  const businessRequirements = requirements.filter((r) =>
    ["profile", "kyc", "listing", "jobs"].includes(r.key),
  );
  const businessDone = businessRequirements.every((r) => r.done);
  const businessVerified = (u.verificationLevel as string | undefined) === "business";

  return {
    role,
    level: (u.verificationLevel as string | undefined) || "basic",
    basicDone: emailOk && nameOk && phoneOk,
    businessDone,
    businessVerified,
    sellerActivatedAt: u.sellerActivatedAt,
    employerActivatedAt: u.employerActivatedAt,
    kycStatus,
    genuineListings: role === "seller" ? (hasListing ? 1 : 0) : undefined,
    distinctJobs: role === "employer" ? jobCount : undefined,
    requiredJobs: role === "employer" ? EMPLOYER_REQUIRED_JOBS : undefined,
    requirements,
  };
}

/** Live verification checklist for the signed-in user's dashboard. */
export const getMyVerificationStatus = query({
  args: {},
  handler: async (ctx) => {
    const user = await getSessionUser(ctx);
    if (!user) return null;
    return await buildChecklist(ctx, user);
  },
});

// ─── ACTIVATION ENGINES (internal — server events only) ─────────────────────

/**
 * Re-evaluate BUSINESS verification for a seller/employer after a server
 * event (KYC decision, listing published, job posted). Grants the level,
 * stamps the activation milestone and advances the referral journey.
 */
async function reevaluateBusinessVerification(ctx: any, user: any) {
  const u = user as any;
  const role = (u.role as string) || "";
  if (role !== "seller" && role !== "employer") return;

  const kycVerified = u.kycStatus === "verified";
  const profileOk =
    typeof u.email === "string" && u.email.includes("@") &&
    typeof u.name === "string" && u.name.trim().length >= 3 &&
    typeof u.phone === "string" && u.phone.replace(/\D/g, "").length >= 9 &&
    typeof u.county === "string" && !!u.county.trim() &&
    typeof u.town === "string" && !!u.town.trim();

  let qualified = false;
  if (role === "seller") {
    qualified = kycVerified && profileOk && (await sellerHasGenuineListing(ctx, u._id));
  } else {
    qualified =
      profileOk && (await employerDistinctJobCount(ctx, u._id)) >= EMPLOYER_REQUIRED_JOBS;
  }
  if (!qualified) return;

  const alreadyBusiness = (u.verificationLevel as string | undefined) === "business";
  const now = Date.now();
  const patch: Record<string, any> = { verificationLevel: "business" as any };
  if (role === "seller" && !u.sellerActivatedAt) patch.sellerActivatedAt = now;
  if (role === "employer" && !u.employerActivatedAt) patch.employerActivatedAt = now;
  await ctx.db.patch(u._id, patch);

  // Advance the referral journey — commissions unlock strictly here.
  try {
    await ctx.runMutation(internal.referral.internalOnBusinessActivated, {
      userId: u._id,
      role,
    });
  } catch (err) {
    console.error("[verification] referral activation hook failed:", err);
  }

  if (!alreadyBusiness) {
    await ctx.db.insert("notifications", {
      userId: u._id,
      type: "account",
      title: "Business verification complete",
      message:
        role === "seller"
          ? "Your store is fully verified (KYC + genuine listing). All seller privileges are now active."
          : "Your employer account is fully verified — you've posted 5 distinct legitimate offerings. Full hiring privileges are active.",
      read: false,
      link: role === "seller" ? "/seller" : "/employer",
      createdAt: now,
    });
  }
}

/** KYC decision landed (admin approved) — re-check the seller's full gate. */
export const internalOnKycVerified = internalMutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId as any);
    if (!user) return;
    await reevaluateBusinessVerification(ctx, user);
  },
});

/** A listing was just published — re-check the seller's full gate. */
export const internalOnListingCreated = internalMutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId as any);
    if (!user) return;
    await reevaluateBusinessVerification(ctx, user);
  },
});

/** A job/service was just posted — re-check the employer's full gate. */
export const internalOnJobPosted = internalMutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId as any);
    if (!user) return;
    await reevaluateBusinessVerification(ctx, user);
  },
});

/** Backfill: re-evaluate one user (CLI/admin utility, runs against current data). */
export const internalRecheckUser = internalMutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId as any);
    if (!user) return { changed: false };
    await reevaluateBusinessVerification(ctx, user);
    return { changed: true };
  },
});
