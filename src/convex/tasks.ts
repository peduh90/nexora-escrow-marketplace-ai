import { getAuthUserId } from "@convex-dev/auth/server";
import { v, ConvexError } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { internal } from "./_generated/api";
import { sellerCommission, buyerProtectionFee } from "./fees";

// ═════════════════════════════════════════════════════════════════════════
// NEXORA AI TASKER — both user sides, one escrow engine
//
// POSTER SIDE: describe what you need done in plain English/Swahili/Sheng;
// the AI drafts a structured task (title, category, skills, budget hints).
// Offers arrive → accept one → fund escrow through the normal wallet +
// fee engine → review the delivery → approve → tasker gets paid.
//
// TASKER SIDE: browse open tasks → send AI-drafted offers with your price
// → get accepted → do the work → submit → get paid on approval.
//
// No fake data, no auto-charges, no documents required — money only ever
// moves through the real escrow engine the buyer controls.
// ═════════════════════════════════════════════════════════════════════════

export const TASK_CATEGORIES = [
  { slug: "errands", name: "Errands & Deliveries", emoji: "🏃" },
  { slug: "research", name: "Research & Summaries", emoji: "📚" },
  { slug: "writing", name: "Writing & Translation", emoji: "✍️" },
  { slug: "design", name: "Design & Media", emoji: "🎨" },
  { slug: "data", name: "Data Entry & Web", emoji: "📊" },
  { slug: "tech", name: "Tech & Setup", emoji: "💻" },
  { slug: "home", name: "Home & Handyman", emoji: "🔧" },
  { slug: "events", name: "Events & Promotion", emoji: "📣" },
  { slug: "other", name: "Other Tasks", emoji: "🧩" },
] as const;

async function requireUser(ctx: any): Promise<any> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new ConvexError("Please sign in first");
  const user = await ctx.db.get(userId);
  if (!user) throw new ConvexError("Account not found — sign in again");
  return user;
}

async function notify(ctx: any, userId: string, title: string, message: string, link: string) {
  await ctx.db.insert("notifications", {
    userId,
    type: "ai_tasker",
    title,
    message,
    read: false,
    link,
    createdAt: Date.now(),
  });
}

function taskLink(taskId: any, role: "poster" | "tasker") {
  return role === "poster" ? `/ai-tasker?task=${taskId}` : `/ai-tasker/tasker?task=${taskId}`;
}

// ─── POSTER: create a task ──────────────────────────────────────────────────

export const createTask = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.string(),
    skills: v.optional(v.array(v.string())),
    location: v.optional(v.string()),
    county: v.optional(v.string()),
    budgetMin: v.optional(v.number()),
    budgetMax: v.optional(v.number()),
    deadline: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const title = args.title.trim();
    const description = args.description.trim();
    if (title.length < 4) throw new ConvexError("Add a short title (at least 4 characters)");
    if (description.length < 10) throw new ConvexError("Describe the task in a little more detail");
    if (args.budgetMin !== undefined && args.budgetMax !== undefined && args.budgetMin > args.budgetMax) {
      throw new ConvexError("Budget minimum cannot be greater than the maximum");
    }

    const now = Date.now();
    const id = await ctx.db.insert("aiTasks", {
      posterId: user._id,
      title,
      description,
      category: args.category,
      skills: args.skills,
      location: args.location?.trim() || undefined,
      county: args.county?.trim() || undefined,
      budgetMin: args.budgetMin,
      budgetMax: args.budgetMax,
      deadline: args.deadline,
      currency: "KES",
      status: "open" as const,
      createdAt: now,
    });

    return { taskId: id };
  },
});

// ─── POSTER: AI drafts the task from a plain-language blurb ────────────────

export const aiDraftTask = action({
  args: { blurb: v.string(), location: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Please sign in first");
    const blurb = args.blurb.trim();
    if (blurb.length < 5) throw new ConvexError("Type what you need done — even one line is enough");

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Deterministic fallback: still useful without an API key.
      const firstLine = blurb.split(/[.\n]/)[0].slice(0, 70);
      const lower = blurb.toLowerCase();
      let category = "other";
      if (/(deliver|pickup|carry|boda|parcel|buy)/.test(lower)) category = "errands";
      else if (/(research|summar|find out|information)/.test(lower)) category = "research";
      else if (/(write|translate|article|cv|resume)/.test(lower)) category = "writing";
      else if (/(design|logo|poster|photo|video|edit)/.test(lower)) category = "design";
      else if (/(data|excel|typing|entry|scrap)/.test(lower)) category = "data";
      else if (/(computer|website|phone|setup|install|fix my)/.test(lower)) category = "tech";
      else if (/(repair|plumb|electric|paint|clean|compound|jiko)/.test(lower)) category = "home";
      else if (/(event|promote|market|flier|flyer|campaign)/.test(lower)) category = "events";
      return {
        title: firstLine.charAt(0).toUpperCase() + firstLine.slice(1),
        description: blurb,
        category,
        skills: [] as string[],
        budgetHint: null as string | null,
      };
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You help Kenyan users post tasks on Nexora AI Tasker. The user describes what they need done in English, Kiswahili or Sheng. Reply with ONLY a JSON object: {\"title\": short clear English title, \"description\": clear full task description in English a worker can act on, \"category\": one of [errands, research, writing, design, data, tech, home, events, other], \"skills\": [up to 4 short skill tags], \"budgetHint\": one short sentence suggesting a fair KES budget range for Kenya}. No markdown, no code fences, JSON only.",
          },
          { role: "user", content: args.location ? `${blurb} (Location: ${args.location})` : blurb },
        ],
        max_tokens: 500,
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      throw new ConvexError("The AI is busy right now — try again in a moment, or fill the form yourself.");
    }
    const data = await response.json();
    const content: string | undefined = data.choices?.[0]?.message?.content;
    if (!content) throw new ConvexError("The AI could not draft the task — try again or fill the form yourself.");
    try {
      const cleaned = content.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      const validCats = TASK_CATEGORIES.map((c) => c.slug) as readonly string[];
      return {
        title: String(parsed.title || firstLineOf(blurb)).slice(0, 90),
        description: String(parsed.description || blurb),
        category: validCats.includes(parsed.category) ? parsed.category : "other",
        skills: Array.isArray(parsed.skills) ? parsed.skills.slice(0, 4).map(String) : [],
        budgetHint: typeof parsed.budgetHint === "string" ? parsed.budgetHint : null,
      };
    } catch {
      throw new ConvexError("The AI reply was malformed — try again or fill the form yourself.");
    }
  },
});

function firstLineOf(s: string) {
  return s.split(/[.\n]/)[0].slice(0, 70);
}

// ─── TASKER: send an offer ──────────────────────────────────────────────────

export const sendOffer = mutation({
  args: {
    taskId: v.id("aiTasks"),
    amount: v.number(),
    message: v.string(),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new ConvexError("Task not found");
    const t = task as any;
    if (t.posterId === user._id) throw new ConvexError("You cannot offer on your own task");
    if (t.status !== "open" || t.taskerId) throw new ConvexError("This task is no longer accepting offers");
    if (!(args.amount > 0)) throw new ConvexError("Enter your price in KES");
    const message = args.message.trim();
    if (message.length < 10) throw new ConvexError("Tell the poster briefly how you'll do it");

    // One live offer per tasker per task.
    const existing = await ctx.db
      .query("aiTaskOffers")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
    const mine = existing.find((o: any) => o.taskerId === user._id && o.status === "pending");
    const now = Date.now();
    if (mine) {
      await ctx.db.patch(mine._id, { amount: args.amount, message, days: args.days, updatedAt: now });
      await notify(ctx, t.posterId, "Offer updated", `${user.name || "A tasker"} updated their offer on "${t.title}" — KES ${args.amount.toLocaleString()}.`, taskLink(args.taskId, "poster"));
      return { offerId: mine._id, updated: true };
    }

    const offerId = await ctx.db.insert("aiTaskOffers", {
      taskId: args.taskId,
      taskerId: user._id,
      amount: args.amount,
      message,
      days: args.days,
      status: "pending" as const,
      createdAt: now,
    });
    await notify(ctx, t.posterId, "New offer received", `${user.name || "A tasker"} offered KES ${args.amount.toLocaleString()} for "${t.title}".`, taskLink(args.taskId, "poster"));
    return { offerId, updated: false };
  },
});

// ─── TASKER: AI drafts the proposal ────────────────────────────────────────

export const aiDraftOffer = action({
  args: {
    taskTitle: v.string(),
    taskDescription: v.string(),
    taskerPitch: v.string(),
    amount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Please sign in first");
    const pitch = args.taskerPitch.trim();
    if (pitch.length < 3) throw new ConvexError("Add a few words about your skills or plan first");

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return `Hi! I can handle "${args.taskTitle}" for you. ${pitch.charAt(0).toUpperCase() + pitch.slice(1)}. I'll keep you updated at every step, and you only release payment once you're happy with the result${args.amount ? ` — KES ${args.amount.toLocaleString()} covers everything` : ""}. Thank you!`;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You write short, honest task proposals for a Kenyan task marketplace. Using the tasker's own words (any language — English, Kiswahili, Sheng), write a friendly 3-5 sentence proposal in clear simple English: greet, state you can do the task and how, mention the tasker's relevant strength, reassure about quality and the escrow protection. No bullet points, no headings, plain text only.",
          },
          {
            role: "user",
            content: `TASK: ${args.taskTitle}\nDETAILS: ${args.taskDescription}\nMY SKILLS/PLAN: ${pitch}${args.amount ? `\nMY PRICE: KES ${args.amount}` : ""}`,
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) throw new ConvexError("The AI is busy right now — try again in a moment.");
    const data = await response.json();
    const content: string | undefined = data.choices?.[0]?.message?.content;
    if (!content) throw new ConvexError("The AI could not draft the proposal — try again.");
    return content.trim();
  },
});

// ─── POSTER: accept an offer ────────────────────────────────────────────────

export const acceptOffer = mutation({
  args: { offerId: v.id("aiTaskOffers") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const offer = await ctx.db.get(args.offerId);
    if (!offer) throw new ConvexError("Offer not found");
    const o = offer as any;
    const task = await ctx.db.get(o.taskId);
    if (!task) throw new ConvexError("Task not found");
    const t = task as any;
    if (t.posterId !== user._id) throw new ConvexError("Only the poster can accept offers");
    if (o.status !== "pending") throw new ConvexError("This offer is no longer available");
    if (t.status !== "open") throw new ConvexError("This task already has an accepted offer");
    const now = Date.now();

    await ctx.db.patch(args.offerId, { status: "accepted" as const, updatedAt: now });
    // Status stays "open" until escrow is funded — but the accepted tasker
    // is locked in, so no new offers can slip in (sendOffer checks taskerId).
    await ctx.db.patch(o.taskId, {
      taskerId: o.taskerId,
      agreedAmount: o.amount,
      updatedAt: now,
    });
    // Mark other pending offers declined.
    const others = await ctx.db
      .query("aiTaskOffers")
      .withIndex("by_task", (q) => q.eq("taskId", o.taskId))
      .collect();
    for (const other of others) {
      if ((other as any)._id !== args.offerId && (other as any).status === "pending") {
        await ctx.db.patch((other as any)._id, { status: "declined" as const, updatedAt: now });
      }
    }

    const tasker: any = await ctx.db.get(o.taskerId);
    await notify(ctx, o.taskerId, "🎉 Your offer was accepted!", `"${t.title}" — fund nothing, just confirm you'll start. The poster is now securing KES ${o.amount.toLocaleString()} in escrow.`, taskLink(o.taskId, "tasker"));
    return { success: true, taskerName: tasker?.name || "Tasker" };
  },
});

// ─── POSTER: fund escrow (the ONLY money-in step, buyer-controlled) ────────

export const fundTask = mutation({
  args: { taskId: v.id("aiTasks") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new ConvexError("Task not found");
    const t = task as any;
    if (t.posterId !== user._id) throw new ConvexError("Only the poster can fund this task");
    if (!t.agreedAmount) throw new ConvexError("Accept an offer first");
    if (t.status !== "open" || t.fundedAt) throw new ConvexError("This task is already funded or past that stage");

    const amount = Math.round(t.agreedAmount);
    const protection = buyerProtectionFee("freelance", amount);
    const total = amount + protection.fee;
    const walletBalance = (user as any).walletBalance || 0;
    if (walletBalance < total) {
      throw new ConvexError(
        `You need KES ${total.toLocaleString()} in your wallet (task KES ${amount.toLocaleString()} + protection KES ${protection.fee.toLocaleString()}). Deposit with M-Pesa first.`,
      );
    }
    const now = Date.now();
    await ctx.db.patch(user._id, {
      walletBalance: walletBalance - total,
      escrowBalance: ((user as any).escrowBalance || 0) + total,
    });
    await ctx.db.insert("walletTransactions", {
      userId: user._id,
      type: "escrow_fund" as any,
      amount: total,
      currency: "KES",
      status: "completed" as any,
      reference: `NX-TSK-ESC-${now}`,
      description: `Escrow for task "${t.title}" (incl. KES ${protection.fee.toLocaleString()} protection)`,
      createdAt: now,
    });
    await ctx.db.patch(args.taskId, {
      status: "assigned" as const,
      amount,
      fundedAt: now,
      assignedAt: now,
      updatedAt: now,
    });

    await notify(ctx, t.taskerId!, "💰 Escrow secured — you can start", `"${t.title}" is funded: KES ${amount.toLocaleString()} is held safely for you. Submit your work when done.`, taskLink(args.taskId, "tasker"));
    return { success: true, total };
  },
});

// ─── TASKER: submit the work ────────────────────────────────────────────────

export const submitTask = mutation({
  args: { taskId: v.id("aiTasks"), note: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new ConvexError("Task not found");
    const t = task as any;
    if (t.taskerId !== user._id) throw new ConvexError("Only the assigned tasker can submit");
    if (!["assigned", "in_progress"].includes(t.status)) throw new ConvexError("This task is not active");
    const note = args.note.trim();
    if (note.length < 5) throw new ConvexError("Describe what you delivered");
    const now = Date.now();
    await ctx.db.patch(args.taskId, {
      status: "submitted" as const,
      submittedNote: note,
      submittedAt: now,
      updatedAt: now,
    });
    await notify(ctx, t.posterId, "Task delivered", `"${t.title}" was submitted: ${note.slice(0, 120)}. Review and approve to release payment.`, taskLink(args.taskId, "poster"));
    return { success: true };
  },
});

// ─── POSTER: approve → tasker is paid (net of commission) ──────────────────

export const approveTask = mutation({
  args: { taskId: v.id("aiTasks") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new ConvexError("Task not found");
    const t = task as any;
    if (t.posterId !== user._id) throw new ConvexError("Only the poster can approve");
    if (t.status !== "submitted") throw new ConvexError("Wait for the tasker to submit the work");
    if (!t.amount || !t.taskerId) throw new ConvexError("This task was never funded");

    const now = Date.now();
    const amount = t.amount;
    const commission = sellerCommission("freelance", amount);
    const protection = buyerProtectionFee("freelance", amount);
    const payout = amount - commission.fee;

    const poster = await ctx.db.get(t.posterId);
    await ctx.db.patch(t.posterId, {
      escrowBalance: Math.max(0, ((poster as any).escrowBalance || 0) - (amount + protection.fee)),
    });

    const tasker: any = await ctx.db.get(t.taskerId);
    if (tasker) {
      await ctx.db.patch(tasker._id, { walletBalance: (tasker.walletBalance || 0) + payout });
      await ctx.db.insert("walletTransactions", {
        userId: tasker._id,
        type: "escrow_release" as any,
        amount: payout,
        currency: "KES",
        status: "completed" as any,
        reference: `NX-TSK-REL-${now}`,
        description: `Task payment: "${t.title}" (gross KES ${amount.toLocaleString()} − ${(commission.rate * 100).toFixed(1)}% commission KES ${commission.fee.toLocaleString()})`,
        createdAt: now,
      });
    }
    await ctx.db.insert("walletTransactions", {
      userId: user._id,
      type: "escrow_release" as any,
      amount,
      currency: "KES",
      status: "completed" as any,
      reference: `NX-TSK-DONE-${now}`,
      description: `Escrow released for task "${t.title}"`,
      createdAt: now,
    });

    // Referral hook: a real completed task transaction.
    try {
      await ctx.runMutation(internal.referral.internalOnEscrowReleased, {
        participantIds: [t.posterId, t.taskerId].filter(Boolean),
        escrowId: args.taskId,
        amount,
        currency: "KES",
      });
    } catch (err) {
      console.error("[referral] task release hook failed:", err);
    }

    await ctx.db.patch(args.taskId, {
      status: "completed" as const,
      completedAt: now,
      posterApprovedAt: now,
      payout,
      updatedAt: now,
    });
    await notify(ctx, t.taskerId!, "💰 Payment released!", `"${t.title}" is complete. KES ${payout.toLocaleString()} (net of commission) is in your wallet.`, "/ai-tasker/tasker");
    return { success: true, payout };
  },
});

// ─── POSTER: request changes instead of approving ──────────────────────────

export const requestChanges = mutation({
  args: { taskId: v.id("aiTasks"), note: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new ConvexError("Task not found");
    const t = task as any;
    if (t.posterId !== user._id) throw new ConvexError("Only the poster can request changes");
    if (t.status !== "submitted") throw new ConvexError("There is no delivery to review");
    const note = args.note.trim();
    if (note.length < 5) throw new ConvexError("Tell the tasker what needs to change");
    const now = Date.now();
    await ctx.db.patch(args.taskId, { status: "in_progress" as const, updatedAt: now });
    await notify(ctx, t.taskerId!, "Changes requested", `On "${t.title}": ${note.slice(0, 140)}`, taskLink(args.taskId, "tasker"));
    return { success: true };
  },
});

// ─── CANCEL & REFUND (poster-side, only before approval) ───────────────────

export const cancelTask = mutation({
  args: { taskId: v.id("aiTasks"), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new ConvexError("Task not found");
    const t = task as any;
    if (t.posterId !== user._id) throw new ConvexError("Only the poster can cancel");
    if (["completed", "cancelled", "disputed"].includes(t.status)) throw new ConvexError("This task is already closed");
    const now = Date.now();

    if (t.status !== "open" && t.fundedAt) {
      // Refund full escrow (amount + protection) — buyer-controlled.
      const poster = await ctx.db.get(t.posterId);
      const protection = buyerProtectionFee("freelance", t.amount);
      const refund = t.amount + protection.fee;
      await ctx.db.patch(t.posterId, {
        escrowBalance: Math.max(0, ((poster as any).escrowBalance || 0) - refund),
        walletBalance: ((poster as any).walletBalance || 0) + refund,
      });
      await ctx.db.insert("walletTransactions", {
        userId: t.posterId,
        type: "refund" as any,
        amount: refund,
        currency: "KES",
        status: "completed" as any,
        reference: `NX-TSK-REF-${now}`,
        description: `Refund — cancelled task "${t.title}"`,
        createdAt: now,
      });
      if (t.taskerId) {
        await notify(ctx, t.taskerId, "Task cancelled", `"${t.title}" was cancelled by the poster. Escrow refunded to them.`, taskLink(args.taskId, "tasker"));
      }
    }
    await ctx.db.patch(args.taskId, {
      status: "cancelled" as const,
      cancelReason: args.reason?.trim() || undefined,
      updatedAt: now,
    });
    return { success: true };
  },
});

// ─── TASKER: withdraw a pending offer ──────────────────────────────────────

export const withdrawOffer = mutation({
  args: { offerId: v.id("aiTaskOffers") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const offer = await ctx.db.get(args.offerId);
    if (!offer) throw new ConvexError("Offer not found");
    const o = offer as any;
    if (o.taskerId !== user._id) throw new ConvexError("Not your offer");
    if (o.status !== "pending") throw new ConvexError("This offer was already decided");
    await ctx.db.patch(args.offerId, { status: "withdrawn" as const, updatedAt: Date.now() });
    return { success: true };
  },
});

// ─── QUERIES ────────────────────────────────────────────────────────────────

/** Public board of open tasks. */
export const listOpenTasks = query({
  args: { category: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let tasks = await ctx.db
      .query("aiTasks")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .order("desc")
      .collect();
    // Tasks with an accepted tasker (awaiting funding) leave the public board.
    tasks = tasks.filter((t: any) => !t.taskerId);
    if (args.category) tasks = tasks.filter((t: any) => t.category === args.category);
    const enriched = await Promise.all(
      tasks.map(async (t: any) => {
        const offers = await ctx.db
          .query("aiTaskOffers")
          .withIndex("by_task", (q) => q.eq("taskId", t._id))
          .collect();
        const poster: any = await ctx.db.get(t.posterId);
        return {
          ...t,
          offerCount: offers.filter((o: any) => o.status === "pending").length,
          minOffer: offers.filter((o: any) => o.status === "pending").reduce((m: number | null, o: any) => (m === null || o.amount < m ? o.amount : m), null),
          posterName: poster?.name || "Nexora user",
        };
      }),
    );
    return enriched;
  },
});

/** One task with its offers. */
export const getTask = query({
  args: { taskId: v.id("aiTasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) return null;
    const t = task as any;
    const offers = await ctx.db
      .query("aiTaskOffers")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .order("desc")
      .collect();
    const withNames = await Promise.all(
      offers.map(async (o: any) => {
        const tasker: any = await ctx.db.get(o.taskerId);
        return {
          ...o,
          taskerName: tasker?.name || "Tasker",
          taskerRating: tasker?.ratingCount ? (tasker.ratingSum || 0) / tasker.ratingCount : null,
        };
      }),
    );
    const poster: any = await ctx.db.get(t.posterId);
    return { ...t, offers: withNames, posterName: poster?.name || "Nexora user" };
  },
});

/** Poster dashboard: my tasks. */
export const myPostedTasks = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const tasks = await ctx.db
      .query("aiTasks")
      .withIndex("by_poster", (q) => q.eq("posterId", user._id))
      .order("desc")
      .collect();
    return Promise.all(
      tasks.map(async (t: any) => {
        const offers = await ctx.db
          .query("aiTaskOffers")
          .withIndex("by_task", (q) => q.eq("taskId", t._id))
          .collect();
        const pending = offers.filter((o: any) => o.status === "pending");
        const tasker: any = t.taskerId ? await ctx.db.get(t.taskerId) : null;
        return {
          ...t,
          pendingOffers: pending.length,
          minOffer: pending.reduce((m: number | null, o: any) => (m === null || o.amount < m ? o.amount : m), null),
          taskerName: tasker?.name || null,
        };
      }),
    );
  },
});

/** Tasker dashboard: my offers + assigned work. */
export const myTaskerWork = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const offers = await ctx.db
      .query("aiTaskOffers")
      .withIndex("by_tasker", (q) => q.eq("taskerId", user._id))
      .order("desc")
      .collect();
    const withTasks = await Promise.all(
      offers.map(async (o: any) => {
        const task: any = await ctx.db.get(o.taskId);
        return { ...o, taskTitle: task?.title || "Task", taskStatus: task?.status || null };
      }),
    );
    const assigned = await ctx.db
      .query("aiTasks")
      .withIndex("by_tasker", (q) => q.eq("taskerId", user._id))
      .order("desc")
      .collect();
    const earned = assigned
      .filter((t: any) => t.status === "completed")
      .reduce((s: number, t: any) => s + (t.payout || 0), 0);
    return { offers: withTasks, assigned, earned, completedCount: assigned.filter((t: any) => t.status === "completed").length };
  },
});
