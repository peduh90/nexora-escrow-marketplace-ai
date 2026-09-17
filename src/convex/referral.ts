import { getAuthUserId } from "@convex-dev/auth/server";
import { v, ConvexError } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";

// ─── NEXORA CREATOR / REFERRAL PROGRAM ──────────────────────────────────────
//
// Server-authoritative referral engine. Rules that matter:
//  1. Attribution is permanent and server-side: the creator→user relationship
//     is written ONCE at registration from a server-verified click record.
//     The client cannot create, move, or replace attribution.
//  2. Creators are NOT rewarded for clicks or raw registrations — a referral
//     only earns after the referred user passes real verification, and
//     bonuses follow seller/freelancer activation and first transactions.
//  3. Anti-fraud: self-referrals blocked, duplicate identity detection,
//     hourly registration caps, click-proof requirement, admin fraud queue.
//  4. Commission rules live in the referralSettings singleton — never
//     hard-coded — and are editable from the admin panel.

// ─── HELPERS ────────────────────────────────────────────────────────────────

/** Unambiguous referral-code alphabet (no 0/O, 1/I). */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  let out = "";
  for (const b of bytes) out += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return out;
}

/** Resolve the session's user record (auth-session-bound, email fallback). */
async function getSessionUser(ctx: any): Promise<any | null> {
  const userId = await getAuthUserId(ctx);
  if (userId !== null) {
    const user = await ctx.db.get(userId);
    if (user) return user;
  }
  const identity = await ctx.auth.getUserIdentity();
  const email = typeof identity?.email === "string" ? identity.email : null;
  if (email && email.length > 0) {
    const rows = await ctx.db
      .query("users")
      .withIndex("email", (q: any) => q.eq("email", email))
      .collect();
    if (rows.length > 0) return rows[0];
  }
  return null;
}

async function requireUser(ctx: any): Promise<any> {
  const user = await getSessionUser(ctx);
  if (!user) throw new ConvexError("Not authenticated");
  return user;
}

/** Admin guard — mirrors the platform's admin rule (role === "admin"). */
async function requireAdmin(ctx: any): Promise<any> {
  const user = await requireUser(ctx);
  if (user.role !== "admin") throw new ConvexError("Unauthorized: admin only");
  return user;
}

const DEFAULT_SETTINGS = {
  fixedPerVerifiedUser: 50,
  sellerActivationBonus: 200,
  freelancerActivationBonus: 100,
  employerActivationBonus: 150,
  firstTransactionBonus: 150,
  revenueSharePercent: 1,
  revenueShareCap: 500,
  maxReferralsPerHour: 10,
};

/**
 * The commission-rules singleton. Mutating contexts (mutations) may seed the
 * row on first use; queries MUST use getSettingsRowReadOnly because Convex
 * forbids writes inside queries — that was the "Server Error" on the admin
 * referrals page.
 */
export async function getSettingsRow(ctx: any): Promise<any> {
  const row = await ctx.db.query("referralSettings").first();
  if (row) return row;
  const id = await ctx.db.insert("referralSettings", {
    ...DEFAULT_SETTINGS,
    updatedAt: Date.now(),
  });
  return await ctx.db.get(id);
}

/** Read-only twin for queries — returns defaults when the row doesn't exist
 * yet, without writing. */
export async function getSettingsRowReadOnly(ctx: any): Promise<any> {
  const row = await ctx.db.query("referralSettings").first();
  if (row) return row;
  return { ...DEFAULT_SETTINGS, updatedBy: undefined, updatedAt: undefined };
}

function normalizeCode(code: string): string {
  return (code || "").trim().toUpperCase();
}

async function insertNotification(ctx: any, userId: string, title: string, message: string, link: string) {
  await ctx.db.insert("notifications", {
    userId,
    type: "creator",
    title,
    message,
    read: false,
    link,
    createdAt: Date.now(),
  });
}

/**
 * Recompute a creator's referral counters straight from the referral ledger —
 * never drifts, never trusts client input, and reflects admin decisions
 * (approvals/rejections) immediately.
 */
async function recomputeCreatorCounters(ctx: any, creatorId: string) {
  const referrals = await ctx.db
    .query("referralRecords")
    .withIndex("by_creator", (q: any) => q.eq("creatorId", creatorId))
    .collect();
  const patch = {
    registrations: referrals.length,
    verified: referrals.filter((r: any) => !!r.verifiedAt).length,
    activeUsers: referrals.filter((r: any) => !!r.activatedAt).length,
    sellersReferred: referrals.filter((r: any) => !!r.sellerActivatedAt).length,
    freelancersReferred: referrals.filter((r: any) => !!r.freelancerActivatedAt).length,
    transactionsGenerated: referrals.filter((r: any) => !!r.firstTransactionAt).length,
  };
  await ctx.db.patch(creatorId, patch);
  return patch;
}

/**
 * Recompute a creator's money counters from the earnings ledger. The ledger
 * is the single source of truth: pendingCommission covers pending+approved
 * (earned, not yet paid out), paidCommission covers paid.
 */
async function recomputeCreatorMoney(ctx: any, creatorId: string) {
  const earnings = await ctx.db
    .query("referralEarnings")
    .withIndex("by_creator", (q: any) => q.eq("creatorId", creatorId))
    .collect();
  let pending = 0;
  let paid = 0;
  let total = 0;
  for (const e of earnings) {
    if (e.status === "rejected") continue;
    total += e.amount;
    if (e.status === "paid") paid += e.amount;
    else pending += e.amount;
  }
  await ctx.db.patch(creatorId, { totalEarned: total, pendingCommission: pending, paidCommission: paid });
}

/**
 * Award every stage earning this referral has qualified for but does not yet
 * have a ledger row for. Idempotent: keyed by (referralId, type), so replayed
 * events can never double-pay a creator.
 */
async function syncReferralEarnings(ctx: any, referralId: string) {
  const rec = await ctx.db.get(referralId);
  if (!rec || (rec as any).status !== "qualified") return;
  const r = rec as any;
  const settings = await getSettingsRow(ctx);

  const existing = await ctx.db
    .query("referralEarnings")
    .withIndex("by_referral", (q: any) => q.eq("referralId", referralId))
    .collect();
  const has = (t: string) => existing.some((e: any) => e.type === t && e.status !== "rejected");

  const awards: Array<{ type: string; amount: number; reason: string }> = [];
  if (r.verifiedAt && settings.fixedPerVerifiedUser > 0 && !has("verified_user")) {
    awards.push({
      type: "verified_user",
      amount: settings.fixedPerVerifiedUser,
      reason: "Referred user completed registration & verification",
    });
  }
  if (r.sellerActivatedAt && settings.sellerActivationBonus > 0 && !has("seller_bonus")) {
    awards.push({
      type: "seller_bonus",
      amount: settings.sellerActivationBonus,
      reason: "Referred seller FULLY verified: genuine listing live (+ KYC for product sellers)",
    });
  }
  if (r.freelancerActivatedAt && settings.freelancerActivationBonus > 0 && !has("freelancer_bonus")) {
    awards.push({
      type: "freelancer_bonus",
      amount: settings.freelancerActivationBonus,
      reason: "Referred user activated as a freelancer",
    });
  }
  if (r.employerActivatedAt && (settings.employerActivationBonus ?? 0) > 0 && !has("employer_bonus")) {
    awards.push({
      type: "employer_bonus",
      amount: settings.employerActivationBonus ?? 0,
      reason: "Referred employer FULLY verified: complete profile + 5 distinct legitimate jobs",
    });
  }
  if (r.firstTransactionAt && settings.firstTransactionBonus > 0 && !has("first_transaction")) {
    awards.push({
      type: "first_transaction",
      amount: settings.firstTransactionBonus,
      reason: "Referred user completed their first escrow transaction",
    });
  }

  for (const a of awards) {
    await ctx.db.insert("referralEarnings", {
      creatorId: r.creatorId,
      referralId,
      referredUserId: r.referredUserId,
      type: a.type as any,
      amount: Math.round(a.amount),
      currency: "KES",
      reason: a.reason,
      status: "pending" as any,
      txAmount: r.firstTransactionAmount,
      createdAt: Date.now(),
    });
  }
  if (awards.length > 0) {
    await recomputeCreatorMoney(ctx, r.creatorId);
  }
}

/**
 * Award the per-transaction revenue share. Called on every escrow release
 * involving a referred user; capped per transaction by revenueShareCap.
 */
async function awardRevenueShare(ctx: any, rec: any, amount: number, currency: string, escrowId: string) {
  const settings = await getSettingsRowReadOnly(ctx);
  if (settings.revenueSharePercent <= 0) return;
  const share = Math.min(
    Math.round((amount * settings.revenueSharePercent) / 100),
    Math.round(settings.revenueShareCap),
  );
  if (share <= 0) return;
  await ctx.db.insert("referralEarnings", {
    creatorId: rec.creatorId,
    referralId: rec._id,
    referredUserId: rec.referredUserId,
    type: "revenue_share" as any,
    amount: share,
    currency: currency || "KES",
    reason: `${settings.revenueSharePercent}% share of a KES ${Math.round(amount).toLocaleString()} completed transaction (capped at KES ${Math.round(settings.revenueShareCap).toLocaleString()})`,
    status: "pending" as any,
    escrowId,
    txAmount: amount,
    createdAt: Date.now(),
  });
  await recomputeCreatorMoney(ctx, rec.creatorId);
}

// ─── PUBLIC: CLICK TRACKING ─────────────────────────────────────────────────

/**
 * Record a referral-link click. Public (pre-auth visitors hit this), but it
 * only counts for APPROVED creators and dedupes per visitor device, so raw
 * refreshes or bot retries never inflate stats.
 */
export const trackClick = mutation({
  args: { code: v.string(), visitorKey: v.string(), referrerDomain: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const code = normalizeCode(args.code);
    const visitorKey = (args.visitorKey || "").slice(0, 64);
    if (!code || !visitorKey) return { counted: false };

    const creator = await ctx.db
      .query("referralCreators")
      .withIndex("by_code", (q: any) => q.eq("referralCode", code))
      .first();
    if (!creator || (creator as any).status !== "approved") {
      return { counted: false };
    }

    const existing = await ctx.db
      .query("referralClicks")
      .withIndex("by_creator_visitor", (q: any) =>
        q.eq("creatorId", (creator as any)._id).eq("visitorKey", visitorKey),
      )
      .first();
    if (existing) return { counted: false };

    const refDomain = args.referrerDomain
      ? String(args.referrerDomain).replace(/^https?:\/\//, "").split("/")[0].slice(0, 120)
      : undefined;

    await ctx.db.insert("referralClicks", {
      creatorId: (creator as any)._id,
      code,
      visitorKey,
      referrerDomain: refDomain,
      createdAt: Date.now(),
    });
    await ctx.db.patch((creator as any)._id, {
      clicks: ((creator as any).clicks || 0) + 1,
    });
    return { counted: true };
  },
});

// ─── CREATOR ONBOARDING ─────────────────────────────────────────────────────

/**
 * Apply to the Creator Program. Any authenticated user may apply. Being a
 * creator NEVER changes the user's marketplace role or permissions. One live
 * application per user; re-applying after rejection waits 24 hours.
 */
export const applyToBeCreator = mutation({
  args: {
    displayName: v.string(),
    platform: v.union(
      v.literal("tiktok"),
      v.literal("whatsapp"),
      v.literal("instagram"),
      v.literal("youtube"),
      v.literal("x"),
      v.literal("facebook"),
      v.literal("other"),
    ),
    platformHandle: v.string(),
    audienceSize: v.optional(v.string()),
    promoPlan: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const displayName = args.displayName.trim();
    const handle = args.platformHandle.trim();
    const plan = args.promoPlan.trim();
    if (displayName.length < 2) throw new ConvexError("Enter the name your audience knows you by.");
    if (handle.length < 2) throw new ConvexError("Enter your social media handle.");
    if (plan.length < 20) {
      throw new ConvexError("Describe how you will promote Nexora in at least 20 characters.");
    }

    const existing = await ctx.db
      .query("referralCreators")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .first();
    if (existing) {
      const e = existing as any;
      if (e.status === "pending") return { status: "pending", creatorId: e._id };
      if (e.status === "approved") return { status: "approved", creatorId: e._id };
      if (e.status === "suspended") throw new ConvexError("Your creator account is suspended. Contact support.");
      // Rejected — allow one re-application per 24h.
      if (e.reviewedAt && Date.now() - e.reviewedAt < 24 * 60 * 60 * 1000) {
        throw new ConvexError("Your application was recently reviewed. You can re-apply after 24 hours.");
      }
      await ctx.db.patch(e._id, {
        displayName,
        platform: args.platform,
        platformHandle: handle,
        audienceSize: args.audienceSize,
        promoPlan: plan,
        status: "pending" as any,
        appliedAt: Date.now(),
        reviewedAt: undefined,
        reviewedBy: undefined,
        reviewNotes: undefined,
      });
      return { status: "pending", creatorId: e._id };
    }

    // Unique code with collision retry.
    let referralCode = "";
    for (let i = 0; i < 5; i++) {
      const candidate = generateCode();
      const clash = await ctx.db
        .query("referralCreators")
        .withIndex("by_code", (q: any) => q.eq("referralCode", candidate))
        .first();
      if (!clash) {
        referralCode = candidate;
        break;
      }
    }
    if (!referralCode) throw new ConvexError("Could not allocate a referral code. Please try again.");

    const id = await ctx.db.insert("referralCreators", {
      userId: user._id,
      referralCode,
      displayName,
      platform: args.platform,
      platformHandle: handle,
      audienceSize: args.audienceSize,
      promoPlan: plan,
      status: "pending" as any,
      appliedAt: Date.now(),
    });
    return { status: "pending", creatorId: id };
  },
});

// ─── REGISTRATION ATTRIBUTION ───────────────────────────────────────────────

/**
 * Bind the just-registered user to a creator — the ONLY place attribution is
 * written, and it is written exactly once per user. The client supplies the
 * remembered code + its visitor key; everything else is verified here:
 *  - the creator must exist and be approved,
 *  - a real tracked click must exist for that visitor key (within 30 days),
 *  - self-referrals are refused,
 *  - a user can only ever have one referral record.
 */
export const onUserRegistered = mutation({
  args: { code: v.string(), visitorKey: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const already = await ctx.db
      .query("referralRecords")
      .withIndex("by_referred", (q: any) => q.eq("referredUserId", user._id))
      .first();
    if (already) return { attributed: false, reason: "already_attributed" };

    const code = normalizeCode(args.code);
    if (!code) return { attributed: false, reason: "no_code" };

    const creator = await ctx.db
      .query("referralCreators")
      .withIndex("by_code", (q: any) => q.eq("referralCode", code))
      .first();
    if (!creator || (creator as any).status !== "approved") {
      return { attributed: false, reason: "creator_not_active" };
    }
    // Self-referral block.
    if ((creator as any).userId === user._id) {
      return { attributed: false, reason: "self_referral" };
    }

    // Click proof: the visitor must have actually landed via this creator's
    // link recently. This is what stops fabricated attribution.
    const visitorKey = (args.visitorKey || "").slice(0, 64);
    let click: any = null;
    if (visitorKey) {
      const clicks = await ctx.db
        .query("referralClicks")
        .withIndex("by_creator_visitor", (q: any) =>
          q.eq("creatorId", (creator as any)._id).eq("visitorKey", visitorKey),
        )
        .collect();
      const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
      click = clicks
        .filter((c: any) => c.createdAt >= cutoff)
        .sort((a: any, b: any) => b.createdAt - a.createdAt)[0];
    }

    const flags: string[] = [];
    if (!click) flags.push("no_tracked_click");

    // Duplicate-identity heuristics across ALL referred users: same email or
    // phone digits registering again under this program is a classic fraud
    // pattern. The record is created but held for admin review.
    const email = typeof user.email === "string" ? user.email.toLowerCase() : "";
    const phoneDigits = typeof user.phone === "string" ? user.phone.replace(/\D/g, "").slice(-9) : "";
    if (email || phoneDigits) {
      const allReferrals = await ctx.db.query("referralRecords").collect();
      for (const other of allReferrals) {
        const otherId = (other as any).referredUserId;
        if (otherId === user._id) continue;
        const otherUser = await ctx.db.get(otherId as any);
        if (!otherUser) continue;
        const oEmail = typeof (otherUser as any).email === "string" ? (otherUser as any).email.toLowerCase() : "";
        const oPhone =
          typeof (otherUser as any).phone === "string"
            ? (otherUser as any).phone.replace(/\D/g, "").slice(-9)
            : "";
        if ((email && oEmail && email === oEmail) || (phoneDigits && oPhone && phoneDigits === oPhone)) {
          flags.push("duplicate_identity");
          break;
        }
      }
    }

    // Hourly registration cap for this creator.
    const settings = await getSettingsRowReadOnly(ctx);
    const hourAgo = Date.now() - 60 * 60 * 1000;
    const creatorsRefs = await ctx.db
      .query("referralRecords")
      .withIndex("by_creator", (q: any) => q.eq("creatorId", (creator as any)._id))
      .collect();
    const recentCount = creatorsRefs.filter((r: any) => r.registeredAt >= hourAgo).length;
    if (recentCount >= (settings.maxReferralsPerHour || 10)) flags.push("rate_limit_exceeded");

    // Verification by OTP at signup means the account's email is real, but the
    // platform's formal verification gate is completeVerification — the record
    // starts at "registered" and is promoted by that event.
    await ctx.db.insert("referralRecords", {
      creatorId: (creator as any)._id,
      code,
      referredUserId: user._id,
      registeredAt: Date.now(),
      stage: "registered" as any,
      status: flags.length > 0 ? ("pending" as any) : ("pending" as any),
      qualified: false,
      flags: flags.length > 0 ? flags : undefined,
      clickId: click ? click._id : undefined,
    });

    // Notify the creator that someone signed up via their link (no PII).
    await insertNotification(
      ctx,
      (creator as any).userId,
      "New referral signup",
      `Someone just registered through your link. It will count once they complete verification.`,
      "/creator",
    );

    return { attributed: true, flagged: flags.length > 0 };
  },
});

// ─── JOURNEY EVENT HOOKS (called internally by the platform) ────────────────

/** The referred user passed the platform's verification gate. */
export const internalOnUserVerified = internalMutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const rec = await ctx.db
      .query("referralRecords")
      .withIndex("by_referred", (q: any) => q.eq("referredUserId", args.userId))
      .first();
    if (!rec) return;
    const r = rec as any;
    if (r.status === "rejected") return;

    const patch: Record<string, any> = { verifiedAt: Date.now(), stage: "verified" as any };
    // Clean records (no flags) qualify immediately and start earning.
    if (r.status === "pending" && (!r.flags || r.flags.length === 0)) {
      patch.status = "qualified" as any;
      patch.qualified = true;
      patch.qualifiedAt = Date.now();
    }
    await ctx.db.patch(r._id, patch);
    await recomputeCreatorCounters(ctx, r.creatorId);
    await syncReferralEarnings(ctx, r._id);
  },
});

/** KYC approved for a referred user (admin KYC decision). */
export const internalOnKycVerified = internalMutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const rec = await ctx.db
      .query("referralRecords")
      .withIndex("by_referred", (q: any) => q.eq("referredUserId", args.userId))
      .first();
    if (!rec) return;
    await ctx.db.patch((rec as any)._id, { kycVerifiedAt: Date.now() });
  },
});

/** The referred user became active and received their role. */
export const internalOnUserActivated = internalMutation({
  args: { userId: v.string(), role: v.string() },
  handler: async (ctx, args) => {
    const rec = await ctx.db
      .query("referralRecords")
      .withIndex("by_referred", (q: any) => q.eq("referredUserId", args.userId))
      .first();
    if (!rec) return;
    const r = rec as any;
    if (r.status === "rejected") return;

    const patch: Record<string, any> = { activatedAt: Date.now(), stage: "active" as any };
    if (args.role === "freelancer") {
      patch.freelancerActivatedAt = Date.now();
      patch.stage = "freelancer" as any;
    }
    await ctx.db.patch(r._id, patch);
    await recomputeCreatorCounters(ctx, r.creatorId);
    await syncReferralEarnings(ctx, r._id);
  },
});

/**
 * The referred seller/employer passed the FULL business-verification gate
 * (progressive verification engine). This — not merely choosing a role — is
 * what unlocks the seller/employer activation bonus: a referred seller must
 * have KYC approved plus a genuine listing; an employer must have a complete
 * profile plus 5 distinct legitimate jobs. Clicks and unverified accounts can
 * never reach this hook.
 */
export const internalOnBusinessActivated = internalMutation({
  args: { userId: v.string(), role: v.string() },
  handler: async (ctx, args) => {
    const rec = await ctx.db
      .query("referralRecords")
      .withIndex("by_referred", (q: any) => q.eq("referredUserId", args.userId))
      .first();
    if (!rec) return;
    const r = rec as any;
    if (r.status === "rejected") return;

    const patch: Record<string, any> = {};
    if (args.role === "seller" && !r.sellerActivatedAt) {
      patch.sellerActivatedAt = Date.now();
      patch.stage = "seller" as any;
    } else if (args.role === "employer" && !r.employerActivatedAt) {
      patch.employerActivatedAt = Date.now();
      patch.stage = "employer" as any;
    }
    if (Object.keys(patch).length === 0) return;

    await ctx.db.patch(r._id, patch);
    await recomputeCreatorCounters(ctx, r.creatorId);
    await syncReferralEarnings(ctx, r._id);

    // Tell the creator their big milestone hit (no PII about the referred user).
    const creator = await ctx.db.get(r.creatorId as any);
    if (creator) {
      await insertNotification(
        ctx,
        (creator as any).userId,
        args.role === "seller" ? "Referred seller fully verified!" : "Referred employer fully verified!",
        args.role === "seller"
          ? "A seller you referred passed full business verification (genuine live listing; KYC too if they sell products). Your activation bonus is now pending."
          : "An employer you referred passed full business verification (complete profile + 5 distinct jobs). Your activation bonus is now pending.",
        "/creator",
      );
    }
  },
});

/**
 * A completed escrow transaction involving a referred user (product or
 * freelance marketplace). First transaction per referred user advances the
 * journey and can earn the transaction bonus; every transaction can earn the
 * configurable revenue share.
 */
export const internalOnEscrowReleased = internalMutation({
  args: {
    participantIds: v.array(v.string()),
    escrowId: v.string(),
    amount: v.number(),
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    if (!(args.amount > 0)) return;
    const seenCreators = new Set<string>();
    for (const userId of args.participantIds) {
      const rec = await ctx.db
        .query("referralRecords")
        .withIndex("by_referred", (q: any) => q.eq("referredUserId", userId))
        .first();
      if (!rec) continue;
      const r = rec as any;
      if (r.status === "rejected") continue;

      const patch: Record<string, any> = {};
      if (!r.firstTransactionAt) {
        patch.firstTransactionAt = Date.now();
        patch.firstTransactionAmount = args.amount;
        patch.stage = "transaction" as any;
      }
      if (r.status === "pending" && (!r.flags || r.flags.length === 0) && r.verifiedAt) {
        patch.status = "qualified" as any;
        patch.qualified = true;
        patch.qualifiedAt = patch.qualifiedAt || Date.now();
      }
      if (Object.keys(patch).length > 0) await ctx.db.patch(r._id, patch);
      if (!seenCreators.has(r.creatorId)) {
        seenCreators.add(r.creatorId);
        await recomputeCreatorCounters(ctx, r.creatorId);
      }
      await syncReferralEarnings(ctx, r._id);
      if (r.status === "qualified") {
        await awardRevenueShare(ctx, r, args.amount, args.currency, args.escrowId);
      }
    }
  },
});

// ─── CREATOR DASHBOARD (server-side, real data only) ────────────────────────

/**
 * Creator dashboard payload: live counters (recomputed from the ledger on
 * read so they can never drift) + referral history + earnings history.
 * Referral rows are privacy-filtered: stage/status only, no contact PII.
 */
export const getMyDashboard = query({
  args: {},
  handler: async (ctx) => {
    const user = await getSessionUser(ctx);
    if (!user) return null;
    const creator = await ctx.db
      .query("referralCreators")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .first();
    if (!creator) return { creator: null };
    const c = creator as any;

    // Fresh counters from source tables.
    const referrals = await ctx.db
      .query("referralRecords")
      .withIndex("by_creator", (q: any) => q.eq("creatorId", c._id))
      .collect();
    const earnings = await ctx.db
      .query("referralEarnings")
      .withIndex("by_creator", (q: any) => q.eq("creatorId", c._id))
      .collect();

    let pending = 0;
    let paid = 0;
    let total = 0;
    for (const e of earnings) {
      if ((e as any).status === "rejected") continue;
      total += (e as any).amount;
      if ((e as any).status === "paid") paid += (e as any).amount;
      else pending += (e as any).amount;
    }

    // Privacy-filtered referral history for the creator.
    const history = [...referrals]
      .sort((a: any, b: any) => b.registeredAt - a.registeredAt)
      .map((r: any) => ({
        _id: r._id,
        registeredAt: r.registeredAt,
        stage: r.stage,
        status: r.status,
        verifiedAt: r.verifiedAt,
        sellerActivatedAt: r.sellerActivatedAt,
        freelancerActivatedAt: r.freelancerActivatedAt,
        firstTransactionAt: r.firstTransactionAt,
        firstTransactionAmount: r.firstTransactionAmount,
      }));

    const earningsHistory = [...earnings]
      .sort((a: any, b: any) => b.createdAt - a.createdAt)
      .map((e: any) => ({
        _id: e._id,
        type: e.type,
        amount: e.amount,
        currency: e.currency,
        reason: e.reason,
        status: e.status,
        createdAt: e.createdAt,
        paidAt: e.paidAt,
        payoutReference: e.payoutReference,
        rejectionReason: e.rejectionReason,
        adjustNote: e.adjustNote,
      }));

    return {
      creator: {
        _id: c._id,
        referralCode: c.referralCode,
        referralLink: `https://nexoramarketplace.freebuff.app/join?ref=${c.referralCode}`,
        displayName: c.displayName,
        platform: c.platform,
        platformHandle: c.platformHandle,
        status: c.status,
        appliedAt: c.appliedAt,
        reviewNotes: c.reviewNotes,
        clicks: c.clicks || 0,
        registrations: referrals.length,
        verified: referrals.filter((r: any) => !!r.verifiedAt).length,
        activeUsers: referrals.filter((r: any) => !!r.activatedAt).length,
        sellersReferred: referrals.filter((r: any) => !!r.sellerActivatedAt).length,
        freelancersReferred: referrals.filter((r: any) => !!r.freelancerActivatedAt).length,
        transactionsGenerated: referrals.filter((r: any) => !!r.firstTransactionAt).length,
        totalEarned: total,
        pendingCommission: pending,
        paidCommission: paid,
      },
      referrals: history,
      earnings: earningsHistory,
    };
  },
});

/**
 * Program-wide stats — VISIBLE TO APPROVED CREATORS AND ADMINS ONLY.
 * The /join landing page must not expose program performance to visitors;
 * the same numbers live inside the approved creator's dashboard instead.
 * IMPORTANT: unauthorized callers get `null`, never a thrown error — a
 * thrown query error crashes the whole creator dashboard (pending applicants
 * legitimately load the page before approval).
 */
export const getProgramStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getSessionUser(ctx);
    if (!user) return null;
    const creator = await ctx.db
      .query("referralCreators")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .first();
    const isApprovedCreator = !!creator && (creator as any).status === "approved";
    const isAdmin = (user as any).role === "admin";
    if (!isApprovedCreator && !isAdmin) return null;

    const referrals = await ctx.db.query("referralRecords").collect();
    const earnings = await ctx.db.query("referralEarnings").collect();
    const creators = await ctx.db.query("referralCreators").collect();
    let paid = 0;
    for (const e of earnings) if ((e as any).status === "paid") paid += (e as any).amount;
    return {
      activeCreators: creators.filter((c: any) => c.status === "approved").length,
      qualifiedReferrals: referrals.filter((r: any) => r.status === "qualified").length,
      transactionsGenerated: referrals.filter((r: any) => !!r.firstTransactionAt).length,
      totalPaidOut: paid,
    };
  },
});

// ─── ADMIN: REFERRAL MANAGEMENT ─────────────────────────────────────────────

/** All creators + program totals + fraud queue + pending earnings. */
export const adminOverview = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const creators = await ctx.db.query("referralCreators").collect();
    const referrals = await ctx.db.query("referralRecords").collect();
    const earnings = await ctx.db.query("referralEarnings").collect();

    let pendingCommission = 0;
    let paidCommission = 0;
    for (const e of earnings) {
      if ((e as any).status === "rejected") continue;
      if ((e as any).status === "paid") paidCommission += (e as any).amount;
      else pendingCommission += (e as any).amount;
    }

    const creatorRows = [...creators]
      .sort((a: any, b: any) => b.appliedAt - a.appliedAt)
      .map((c: any) => ({
        _id: c._id,
        userId: c.userId,
        displayName: c.displayName,
        referralCode: c.referralCode,
        platform: c.platform,
        platformHandle: c.platformHandle,
        audienceSize: c.audienceSize,
        promoPlan: c.promoPlan,
        status: c.status,
        appliedAt: c.appliedAt,
        reviewNotes: c.reviewNotes,
        clicks: c.clicks || 0,
        registrations: referrals.filter((r: any) => r.creatorId === c._id).length,
        verified: referrals.filter((r: any) => r.creatorId === c._id && r.verifiedAt).length,
        activeUsers: referrals.filter((r: any) => r.creatorId === c._id && r.activatedAt).length,
        sellersReferred: referrals.filter((r: any) => r.creatorId === c._id && r.sellerActivatedAt).length,
        freelancersReferred: referrals.filter((r: any) => r.creatorId === c._id && r.freelancerActivatedAt).length,
        transactionsGenerated: referrals.filter((r: any) => r.creatorId === c._id && r.firstTransactionAt).length,
        pendingCommission: earnings
          .filter((e: any) => e.creatorId === c._id && e.status !== "paid" && e.status !== "rejected")
          .reduce((s: number, e: any) => s + e.amount, 0),
        paidCommission: earnings
          .filter((e: any) => e.creatorId === c._id && e.status === "paid")
          .reduce((s: number, e: any) => s + e.amount, 0),
      }));

    // Fraud queue: flagged referrals joined with user + creator for review.
    const flagged = [] as any[];
    for (const r of referrals) {
      const rr = r as any;
      if (rr.status === "rejected") continue;
      if (!rr.flags || rr.flags.length === 0) continue;
      const u = await ctx.db.get(rr.referredUserId as any);
      const c = await ctx.db.get(rr.creatorId as any);
      flagged.push({
        _id: rr._id,
        registeredAt: rr.registeredAt,
        stage: rr.stage,
        status: rr.status,
        flags: rr.flags,
        creatorName: (c as any)?.displayName || "—",
        creatorCode: (c as any)?.referralCode || "—",
        userName: (u as any)?.name || "—",
        userEmail: (u as any)?.email || "—",
        userPhone: (u as any)?.phone || "—",
        userJoinedAt: (u as any)?.joinedAt,
      });
    }

    const pendingEarnings = [...earnings]
      .filter((e: any) => e.status === "pending")
      .sort((a: any, b: any) => b.createdAt - a.createdAt)
      .map((e: any) => {
        const c = creators.find((x: any) => x._id === (e as any).creatorId);
        return {
          _id: e._id,
          creatorName: (c as any)?.displayName || "—",
          type: e.type,
          amount: e.amount,
          currency: e.currency,
          reason: e.reason,
          createdAt: e.createdAt,
        };
      });

    return {
      creators: creatorRows,
      totals: {
        creators: creatorRows.length,
        pendingApplications: creatorRows.filter((c) => c.status === "pending").length,
        approvedCreators: creatorRows.filter((c) => c.status === "approved").length,
        suspendedCreators: creatorRows.filter((c) => c.status === "suspended").length,
        totalReferrals: referrals.length,
        qualifiedReferrals: referrals.filter((r: any) => r.status === "qualified").length,
        flaggedReferrals: flagged.length,
        pendingCommission,
        paidCommission,
      },
      flagged,
      pendingEarnings,
    };
  },
});

/** Deep view of one creator: profile, every referral (with user identity —
 *  admins may see what creators may not), and the full earnings ledger. */
export const creatorDetail = query({
  args: { creatorId: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const creator = await ctx.db.get(args.creatorId as any);
    if (!creator) throw new ConvexError("Creator not found");
    const c = creator as any;

    const referrals = await ctx.db
      .query("referralRecords")
      .withIndex("by_creator", (q: any) => q.eq("creatorId", args.creatorId))
      .collect();
    const referralRows = [] as any[];
    for (const r of referrals) {
      const rr = r as any;
      const u = await ctx.db.get(rr.referredUserId as any);
      referralRows.push({
        _id: rr._id,
        registeredAt: rr.registeredAt,
        stage: rr.stage,
        status: rr.status,
        flags: rr.flags,
        adminNotes: rr.adminNotes,
        verifiedAt: rr.verifiedAt,
        sellerActivatedAt: rr.sellerActivatedAt,
        freelancerActivatedAt: rr.freelancerActivatedAt,
        firstTransactionAt: rr.firstTransactionAt,
        firstTransactionAmount: rr.firstTransactionAmount,
        userName: (u as any)?.name || "—",
        userEmail: (u as any)?.email || "—",
        userPhone: (u as any)?.phone || "—",
        userRole: (u as any)?.role || null,
        userKyc: (u as any)?.kycStatus || "not_started",
        userJoinedAt: (u as any)?.joinedAt,
      });
    }
    referralRows.sort((a: any, b: any) => b.registeredAt - a.registeredAt);

    const earnings = await ctx.db
      .query("referralEarnings")
      .withIndex("by_creator", (q: any) => q.eq("creatorId", args.creatorId))
      .collect();
    const earningsRows = [...earnings]
      .sort((a: any, b: any) => b.createdAt - a.createdAt)
      .map((e: any) => e);

    const owner = await ctx.db.get(c.userId as any);
    return {
      creator: {
        ...c,
        ownerName: (owner as any)?.name || "—",
        ownerEmail: (owner as any)?.email || "—",
      },
      referrals: referralRows,
      earnings: earningsRows,
    };
  },
});

/** Approve / reject / suspend / re-activate a creator application. */
export const reviewCreator = mutation({
  args: {
    creatorId: v.string(),
    decision: v.union(
      v.literal("approve"),
      v.literal("reject"),
      v.literal("suspend"),
      v.literal("reactivate"),
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const creator = await ctx.db.get(args.creatorId as any);
    if (!creator) throw new ConvexError("Creator not found");
    const c = creator as any;

    const status =
      args.decision === "approve" || args.decision === "reactivate"
        ? "approved"
        : args.decision === "reject"
          ? "rejected"
          : "suspended";

    await ctx.db.patch(c._id, {
      status: status as any,
      reviewedAt: Date.now(),
      reviewedBy: admin._id,
      reviewNotes: args.notes?.trim() || c.reviewNotes,
    });

    // ONE approval unlocks everything: approving (or re-activating) a creator
    // here also approves their pending signed agreement, so the creator panel
    // opens immediately no matter which admin surface was used. (The reverse
    // direction — agreement approval activating the creator — lives in
    // referralAgreement.adminReviewAgreement.)
    if (status === "approved") {
      const agreements = (await ctx.db
        .query("referralAgreements")
        .withIndex("by_user" as any, (q: any) => q.eq("userId", c.userId))
        .collect()) as any[];
      for (const a of agreements) {
        if (a.status === "pending") {
          await ctx.db.patch(a._id, {
            status: "approved" as any,
            reviewNote: a.reviewNote || "Approved together with creator approval",
            reviewedBy: admin.name || admin.email || "Admin",
            reviewedAt: Date.now(),
          });
        }
      }
    }

    const titles: Record<string, string> = {
      approved: "Creator application approved 🎉",
      rejected: "Creator application declined",
      suspended: "Creator account suspended",
      reactivate: "Creator account re-activated",
    };
    const messages: Record<string, string> = {
      approved: `You are officially a Nexora Creator! Share your link: https://nexoramarketplace.freebuff.app/join?ref=${c.referralCode}`,
      rejected: args.notes?.trim() || "Your application did not meet the program requirements. You can re-apply after 24 hours.",
      suspended: args.notes?.trim() || "Your creator account was suspended pending review. Your link is paused.",
      reactivate: "Your creator account is active again. Your referral link is live.",
    };
    await insertNotification(ctx, c.userId, titles[args.decision], messages[args.decision], "/creator");

    // Creator is a first-class user ROLE: approval activates it so every
    // routing surface (password login, OTP effect, nav "Dashboard") sends the
    // user to the Creator panel — never a buyer dashboard. Rejection or
    // suspension reverts the role to "buyer" so they keep a working panel.
    if (args.decision === "approve" || args.decision === "reactivate") {
      const creatorUser = await ctx.db.get(c.userId);
      if (creatorUser && (creatorUser as any).role !== "creator") {
        await ctx.db.patch(c.userId, { role: "creator" as any });
      }
    } else if (args.decision === "reject" || args.decision === "suspend") {
      const creatorUser = await ctx.db.get(c.userId);
      if (creatorUser && (creatorUser as any).role === "creator") {
        await ctx.db.patch(c.userId, { role: "buyer" as any });
      }
    }

    return { status };
  },
});

/** Admin decision on a suspicious referral: approve (qualify) or reject. */
export const reviewReferral = mutation({
  args: {
    referralId: v.string(),
    decision: v.union(v.literal("approve"), v.literal("reject")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const rec = await ctx.db.get(args.referralId as any);
    if (!rec) throw new ConvexError("Referral not found");
    const r = rec as any;

    if (args.decision === "reject") {
      await ctx.db.patch(r._id, {
        status: "rejected" as any,
        qualified: false,
        adminNotes: args.notes?.trim() || "Rejected by admin",
      });
      // Reject its non-paid earnings so pending money disappears from totals.
      const earnings = await ctx.db
        .query("referralEarnings")
        .withIndex("by_referral", (q: any) => q.eq("referralId", r._id))
        .collect();
      for (const e of earnings) {
        if ((e as any).status === "pending" || (e as any).status === "approved") {
          await ctx.db.patch((e as any)._id, {
            status: "rejected" as any,
            rejectionReason: args.notes?.trim() || "Referral rejected during fraud review",
          });
        }
      }
      await recomputeCreatorMoney(ctx, r.creatorId);
    } else {
      if (!r.verifiedAt) throw new ConvexError("This referral has not completed verification yet.");
      await ctx.db.patch(r._id, {
        status: "qualified" as any,
        qualified: true,
        qualifiedAt: r.qualifiedAt || Date.now(),
        flags: undefined,
        adminNotes: args.notes?.trim() || "Approved by admin after review",
      });
      await recomputeCreatorCounters(ctx, r.creatorId);
      await syncReferralEarnings(ctx, r._id);
    }
    return { success: true };
  },
});

/** Approve one pending earning (or reject with a reason). */
export const reviewEarning = mutation({
  args: {
    earningId: v.string(),
    decision: v.union(v.literal("approve"), v.literal("reject")),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const earning = await ctx.db.get(args.earningId as any);
    if (!earning) throw new ConvexError("Earning not found");
    const e = earning as any;
    if (e.status !== "pending") throw new ConvexError("Only pending earnings can be reviewed");

    if (args.decision === "approve") {
      await ctx.db.patch(e._id, { status: "approved" as any, approvedAt: Date.now() });
    } else {
      await ctx.db.patch(e._id, {
        status: "rejected" as any,
        rejectionReason: args.reason?.trim() || "Rejected by admin",
      });
    }
    await recomputeCreatorMoney(ctx, e.creatorId);
    return { success: true };
  },
});

/** Adjust a pending earning's amount (fraud control / goodwill), with a note. */
export const adjustEarning = mutation({
  args: { earningId: v.string(), newAmount: v.number(), note: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const earning = await ctx.db.get(args.earningId as any);
    if (!earning) throw new ConvexError("Earning not found");
    const e = earning as any;
    if (e.status !== "pending" && e.status !== "approved") {
      throw new ConvexError("Only unpaid earnings can be adjusted");
    }
    if (!(args.newAmount >= 0)) throw new ConvexError("Amount must be zero or more");
    await ctx.db.patch(e._id, {
      amount: Math.round(args.newAmount),
      adjustedBy: admin._id,
      adjustNote: args.note.trim(),
    });
    await recomputeCreatorMoney(ctx, e.creatorId);
    return { success: true };
  },
});

/** Pay out every approved earning for a creator (marks them paid + notifies). */
export const payoutCreator = mutation({
  args: { creatorId: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const creator = await ctx.db.get(args.creatorId as any);
    if (!creator) throw new ConvexError("Creator not found");
    const c = creator as any;

    const earnings = await ctx.db
      .query("referralEarnings")
      .withIndex("by_creator", (q: any) => q.eq("creatorId", args.creatorId))
      .collect();
    const payable = earnings.filter((e: any) => e.status === "approved");
    if (payable.length === 0) throw new ConvexError("No approved earnings ready for payout");

    const reference = `NX-CRP-${Date.now()}`;
    let total = 0;
    const now = Date.now();
    for (const e of payable) {
      await ctx.db.patch((e as any)._id, { status: "paid" as any, paidAt: now, payoutReference: reference });
      total += (e as any).amount;
    }
    await recomputeCreatorMoney(ctx, c._id);
    await insertNotification(
      ctx,
      c.userId,
      "Commission paid 💸",
      `KES ${total.toLocaleString()} in creator commissions has been paid out (ref ${reference}).`,
      "/creator",
    );
    return { paidCount: payable.length, total, reference };
  },
});

/** Program commission rules — admin-editable, engine reads them live.
 *  Read-only: settings show defaults until an admin first saves them. */
export const getProgramSettings = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await getSettingsRowReadOnly(ctx);
  },
});

/**
 * Self-sync: an approved creator's user record always carries role "creator"
 * (the account's default panel is the Creator dashboard). Repairs accounts
 * approved before "creator" became a first-class role — safe to call on every
 * panel load; writes only when the role is actually wrong.
 */
export const syncMyCreatorRole = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getSessionUser(ctx);
    if (!user) return { synced: false };
    const u = user as any;
    if (u.role === "creator" || u.role === "admin") return { synced: false };
    const creator = await ctx.db
      .query("referralCreators")
      .withIndex("by_user", (q: any) => q.eq("userId", u._id))
      .first();
    if (!creator || (creator as any).status !== "approved") return { synced: false };
    await ctx.db.patch(u._id, { role: "creator" as any });
    return { synced: true };
  },
});

export const updateProgramSettings = mutation({
  args: {
    fixedPerVerifiedUser: v.number(),
    sellerActivationBonus: v.number(),
    freelancerActivationBonus: v.number(),
    employerActivationBonus: v.optional(v.number()),
    firstTransactionBonus: v.number(),
    revenueSharePercent: v.number(),
    revenueShareCap: v.number(),
    maxReferralsPerHour: v.number(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    if (
      args.fixedPerVerifiedUser < 0 ||
      args.sellerActivationBonus < 0 ||
      args.freelancerActivationBonus < 0 ||
      (args.employerActivationBonus ?? 0) < 0 ||
      args.firstTransactionBonus < 0 ||
      args.revenueSharePercent < 0 ||
      args.revenueSharePercent > 20 ||
      args.revenueShareCap < 0 ||
      args.maxReferralsPerHour < 1
    ) {
      throw new ConvexError("Invalid settings: amounts must be ≥ 0, revenue share ≤ 20%, hourly cap ≥ 1");
    }
    const row = await ctx.db.query("referralSettings").first();
    const patch = { ...args, updatedBy: admin._id, updatedAt: Date.now() };
    if (row) await ctx.db.patch(row._id, patch);
    else await ctx.db.insert("referralSettings", patch);
    return { success: true };
  },
});

/**
 * Export referral data flattened for CSV (admin reports). Fetched on demand
 * via convex.query() — real ledger data, joined with creator + user identity
 * for audit purposes.
 */
export const generateExport = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const creators = await ctx.db.query("referralCreators").collect();
    const referrals = await ctx.db.query("referralRecords").collect();
    const referralRows: any[] = [];
    for (const r of referrals) {
      const rr = r as any;
      const c = creators.find((x: any) => x._id === rr.creatorId);
      const u = await ctx.db.get(rr.referredUserId as any);
      referralRows.push({
        referralId: rr._id,
        creatorName: (c as any)?.displayName || "",
        creatorCode: (c as any)?.referralCode || "",
        creatorStatus: (c as any)?.status || "",
        userName: (u as any)?.name || "",
        userEmail: (u as any)?.email || "",
        userPhone: (u as any)?.phone || "",
        registeredAt: rr.registeredAt,
        verifiedAt: rr.verifiedAt || "",
        sellerActivatedAt: rr.sellerActivatedAt || "",
        freelancerActivatedAt: rr.freelancerActivatedAt || "",
        firstTransactionAt: rr.firstTransactionAt || "",
        firstTransactionAmount: rr.firstTransactionAmount || "",
        stage: rr.stage,
        status: rr.status,
        flags: (rr.flags || []).join(";"),
      });
    }
    const earnings = await ctx.db.query("referralEarnings").collect();
    const earningRows = earnings.map((e: any) => {
      const c = creators.find((x: any) => x._id === e.creatorId);
      return {
        earningId: e._id,
        creatorName: (c as any)?.displayName || "",
        creatorCode: (c as any)?.referralCode || "",
        type: e.type,
        amount: e.amount,
        currency: e.currency,
        status: e.status,
        reason: e.reason,
        createdAt: e.createdAt,
        paidAt: e.paidAt || "",
        payoutReference: e.payoutReference || "",
      };
    });
    return { referrals: referralRows, earnings: earningRows };
  },
});
