import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";

// ═══════════════════════════════════════════════════════════════
// NEXORA OWNER CONTROL CENTER
// 100% owner authority + AI automation engine
// ═══════════════════════════════════════════════════════════════

const OWNER_EMAIL = "murimiedwin227@gmail.com";

// ─── OWNER AUTH GUARD ───

async function requireOwner(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  const user = await ctx.db
    .query("users")
    .withIndex("email", (q: any) => q.eq("email", identity.email))
    .first();

  if (!user) throw new Error("User not found");

  // Auto-promote owner email
  if (identity.email === OWNER_EMAIL) {
    if (user.role !== "admin") await ctx.db.patch(user._id, { role: "admin" });
    if (user.adminRole !== "super_admin") await ctx.db.patch(user._id, { adminRole: "super_admin" });
  }

  const fresh = await ctx.db.get(user._id);
  if (!fresh || fresh.role !== "admin") throw new Error("Unauthorized");
  if (fresh.adminRole !== "super_admin" && identity.email !== OWNER_EMAIL) {
    throw new Error("Owner access only");
  }

  return { user: fresh, identity, isOwner: identity.email === OWNER_EMAIL };
}

async function requireAdmin(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  const user = await ctx.db
    .query("users")
    .withIndex("email", (q: any) => q.eq("email", identity.email))
    .first();
  if (!user || user.role !== "admin") throw new Error("Unauthorized: admin only");
  return { user, identity };
}

// ─── AI EMERGENCY SHUTDOWN ───

/** Get AI system status (shutdown or active) */
export const getAiSystemStatus = query({
  args: {},
  handler: async (ctx) => {
    const shutdownSetting = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q: any) => q.eq("key", "ai_emergency_shutdown"))
      .first();

    const shutdownAt = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q: any) => q.eq("key", "ai_shutdown_timestamp"))
      .first();

    const shutdownReason = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q: any) => q.eq("key", "ai_shutdown_reason"))
      .first();

    const shutdownBy = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q: any) => q.eq("key", "ai_shutdown_by"))
      .first();

    return {
      isShutdown: shutdownSetting?.value === "true",
      shutdownAt: shutdownAt ? parseInt(shutdownAt.value) : undefined,
      shutdownReason: shutdownReason?.value || undefined,
      shutdownBy: shutdownBy?.value || undefined,
    };
  },
});

/** Owner: Emergency shutdown all AI operations */
export const emergencyShutdown = mutation({
  args: { reason: v.string() },
  handler: async (ctx, args) => {
    const { user, isOwner } = await requireOwner(ctx);
    const now = Date.now();

    const upsertSetting = async (key: string, value: string) => {
      const existing = await ctx.db
        .query("platformSettings")
        .withIndex("by_key", (q: any) => q.eq("key", key))
        .first();
      if (existing) await ctx.db.patch(existing._id, { value, updatedAt: now });
      else await ctx.db.insert("platformSettings", { key, value, updatedBy: user._id, updatedAt: now });
    };

    await upsertSetting("ai_emergency_shutdown", "true");
    await upsertSetting("ai_shutdown_timestamp", String(now));
    await upsertSetting("ai_shutdown_reason", args.reason);
    await upsertSetting("ai_shutdown_by", user._id);

    // Audit log
    await ctx.db.insert("auditLogs", {
      adminId: user._id,
      adminName: user.name || user.email || "Owner",
      adminRole: user.adminRole,
      action: "EMERGENCY_AI_SHUTDOWN",
      target: "ai_system",
      targetId: undefined,
      details: `Reason: ${args.reason}`,
      createdAt: now,
    });

    return { success: true, message: "AI system emergency shutdown activated" };
  },
});

/** Owner: Reactivate AI operations */
export const reactivateAi = mutation({
  args: {},
  handler: async (ctx) => {
    const { user } = await requireOwner(ctx);
    const now = Date.now();

    const upsertSetting = async (key: string, value: string) => {
      const existing = await ctx.db
        .query("platformSettings")
        .withIndex("by_key", (q: any) => q.eq("key", key))
        .first();
      if (existing) await ctx.db.patch(existing._id, { value, updatedAt: now });
      else await ctx.db.insert("platformSettings", { key, value, updatedBy: user._id, updatedAt: now });
    };

    await upsertSetting("ai_emergency_shutdown", "false");

    await ctx.db.insert("auditLogs", {
      adminId: user._id,
      adminName: user.name || user.email || "Owner",
      adminRole: user.adminRole,
      action: "AI_REACTIVATED",
      target: "ai_system",
      details: "AI operations reactivated by owner",
      createdAt: now,
    });

    return { success: true };
  },
});

// ─── AI PERMISSIONS MANAGEMENT ───

/** Default AI permissions */
const DEFAULT_PERMISSIONS = [
  { key: "auto_resolve_tickets", label: "Auto-Resolve Support Tickets", description: "AI resolves routine customer support tickets without human review", category: "support", riskLevel: "low", requiresOwnerApproval: false, maxConfidence: 85 },
  { key: "auto_escalate_tickets", label: "Auto-Escalate Complex Tickets", description: "AI escalates tickets it cannot handle to human agents", category: "support", riskLevel: "low", requiresOwnerApproval: false, maxConfidence: 50 },
  { key: "auto_moderate_listings", label: "Auto-Moderate Product Listings", description: "AI pre-screens listings for spam, prohibited content, and policy violations", category: "moderation", riskLevel: "medium", requiresOwnerApproval: false, maxConfidence: 90 },
  { key: "auto_reject_listings", label: "Auto-Reject Violating Listings", description: "AI automatically rejects listings with clear policy violations", category: "moderation", riskLevel: "high", requiresOwnerApproval: false, maxConfidence: 95 },
  { key: "auto_screen_kyc", label: "Auto Pre-Screen KYC", description: "AI analyzes KYC applications for completeness and risk signals", category: "kyc", riskLevel: "low", requiresOwnerApproval: false, maxConfidence: 80 },
  { key: "auto_approve_kyc", label: "Auto-Approve Low-Risk KYC", description: "AI approves KYC applications that pass all automated checks", category: "kyc", riskLevel: "high", requiresOwnerApproval: true, maxConfidence: 95 },
  { key: "auto_score_fraud", label: "Auto-Score Fraud Risk", description: "AI scores every transaction for fraud risk using rules and patterns", category: "fraud", riskLevel: "low", requiresOwnerApproval: false, maxConfidence: 80 },
  { key: "auto_flag_fraud", label: "Auto-Flag High-Risk Transactions", description: "AI flags transactions exceeding fraud thresholds for human review", category: "fraud", riskLevel: "medium", requiresOwnerApproval: false, maxConfidence: 75 },
  { key: "auto_analyze_disputes", label: "Auto-Analyze Disputes", description: "AI generates dispute summaries and recommendations", category: "disputes", riskLevel: "low", requiresOwnerApproval: false, maxConfidence: 80 },
  { key: "auto_resolve_disputes", label: "Auto-Resolve Low-Value Disputes", description: "AI resolves disputes under KES 5,000 with clear evidence", category: "disputes", riskLevel: "high", requiresOwnerApproval: true, maxConfidence: 95 },
  { key: "auto_generate_reports", label: "Auto-Generate Reports", description: "AI generates daily operational reports and briefings", category: "support", riskLevel: "low", requiresOwnerApproval: false, maxConfidence: 90 },
  { key: "auto_send_alerts", label: "Auto-Send Priority Alerts", description: "AI sends real-time alerts for critical events to the team", category: "fraud", riskLevel: "medium", requiresOwnerApproval: false, maxConfidence: 85 },
  { key: "auto_classify_intents", label: "Auto-Classify Customer Intent", description: "AI classifies incoming customer messages by intent and priority", category: "support", riskLevel: "low", requiresOwnerApproval: false, maxConfidence: 85 },
  { key: "auto_route_tickets", label: "Auto-Route to Correct Team", description: "AI routes tickets to the appropriate team member based on category", category: "support", riskLevel: "low", requiresOwnerApproval: false, maxConfidence: 80 },
  { key: "auto_suspend_suspicious", label: "Auto-Suspend Suspicious Accounts", description: "AI suspends accounts with critical fraud scores pending review", category: "security", riskLevel: "critical", requiresOwnerApproval: true, maxConfidence: 98 },
  { key: "auto_release_escrow", label: "Auto-Release Escrow (Low Value)", description: "AI auto-releases escrow for completed deliveries under KES 10,000", category: "finance", riskLevel: "critical", requiresOwnerApproval: true, maxConfidence: 99 },
  { key: "auto_process_refunds", label: "Auto-Process Small Refunds", description: "AI processes refunds under KES 2,000 for clear non-delivery cases", category: "finance", riskLevel: "critical", requiresOwnerApproval: true, maxConfidence: 98 },
];

/** Initialize default AI permissions (owner only) */
export const initializePermissions = mutation({
  args: {},
  handler: async (ctx) => {
    const { user } = await requireOwner(ctx);
    const now = Date.now();
    let created = 0;

    for (const perm of DEFAULT_PERMISSIONS) {
      const existing = await ctx.db
        .query("aiPermissions")
        .withIndex("by_key", (q: any) => q.eq("key", perm.key))
        .first();
      if (!existing) {
        await ctx.db.insert("aiPermissions", {
          ...perm,
          enabled: true,
          autoActionCount: 0,
          updatedBy: user._id,
          updatedAt: now,
        });
        created++;
      }
    }

    return { success: true, created };
  },
});

/** Get all AI permissions */
export const getAiPermissions = query({
  args: { category: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let perms = await ctx.db.query("aiPermissions").collect();
    if (args.category) perms = perms.filter((p) => p.category === args.category);
    return perms.sort((a, b) => {
      const catOrder = { security: 0, finance: 1, kyc: 2, fraud: 3, disputes: 4, moderation: 5, support: 6 };
      return (catOrder[a.category as keyof typeof catOrder] || 7) - (catOrder[b.category as keyof typeof catOrder] || 7);
    });
  },
});

/** Owner: Update a single AI permission */
export const updatePermission = mutation({
  args: {
    permissionId: v.id("aiPermissions"),
    enabled: v.optional(v.boolean()),
    maxConfidence: v.optional(v.number()),
    requiresOwnerApproval: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { user, isOwner } = await requireOwner(ctx);
    const perm = await ctx.db.get(args.permissionId);
    if (!perm) throw new Error("Permission not found");

    // Critical permissions can only be changed by owner
    if ((perm.riskLevel === "critical" || perm.riskLevel === "high") && !isOwner) {
      throw new Error("Only the owner can modify high/critical risk permissions");
    }

    const updates: Record<string, unknown> = { updatedBy: user._id, updatedAt: Date.now() };
    if (args.enabled !== undefined) updates.enabled = args.enabled;
    if (args.maxConfidence !== undefined) updates.maxConfidence = args.maxConfidence;
    if (args.requiresOwnerApproval !== undefined) updates.requiresOwnerApproval = args.requiresOwnerApproval;

    await ctx.db.patch(args.permissionId, updates as any);

    // Audit log
    await ctx.db.insert("auditLogs", {
      adminId: user._id,
      adminName: user.name || user.email || "Owner",
      adminRole: user.adminRole,
      action: "UPDATE_AI_PERMISSION",
      target: "aiPermission",
      targetId: args.permissionId,
      details: `Updated: ${JSON.stringify(args).slice(0, 200)}`,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/** Owner: Toggle all AI permissions on/off */
export const toggleAllPermissions = mutation({
  args: { enabled: v.boolean() },
  handler: async (ctx, args) => {
    const { user, isOwner } = await requireOwner(ctx);
    if (!isOwner) throw new Error("Owner only");

    const perms = await ctx.db.query("aiPermissions").collect();
    for (const perm of perms) {
      await ctx.db.patch(perm._id, { enabled: args.enabled, updatedBy: user._id, updatedAt: Date.now() });
    }

    await ctx.db.insert("auditLogs", {
      adminId: user._id,
      adminName: user.name || user.email || "Owner",
      adminRole: user.adminRole,
      action: args.enabled ? "ENABLE_ALL_AI_PERMISSIONS" : "DISABLE_ALL_AI_PERMISSIONS",
      target: "aiPermissions",
      details: `All permissions ${args.enabled ? "enabled" : "disabled"}`,
      createdAt: Date.now(),
    });

    return { success: true, count: perms.length };
  },
});

// ─── AI AUTOMATION ENGINE ───

/** Check if AI is allowed to perform an action */
export const checkAiPermission = action({
  args: {
    permissionKey: v.string(),
    confidence: v.number(),
    entityType: v.string(),
    entityId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if AI is shut down
    const shutdown = await ctx.runQuery("ownerControl:getAiSystemStatus" as any);
    if (shutdown.isShutdown) {
      return { allowed: false, reason: "AI system is in emergency shutdown mode" };
    }

    // Check permission
    const perm = await ctx.runQuery("ownerControl:getAiPermissions" as any, {});
    const permission = perm.find((p: any) => p.key === args.permissionKey);

    if (!permission) {
      return { allowed: false, reason: `Permission '${args.permissionKey}' not found` };
    }

    if (!permission.enabled) {
      return { allowed: false, reason: `Permission '${permission.label}' is disabled` };
    }

    if (args.confidence < permission.maxConfidence) {
      return { allowed: false, reason: `AI confidence (${args.confidence}%) below threshold (${permission.maxConfidence}%)` };
    }

    if (permission.requiresOwnerApproval) {
      return { allowed: false, reason: `Requires owner approval: ${permission.label}`, needsOwnerApproval: true };
    }

    return { allowed: true, permission };
  },
});

/** Log an AI automation action */
export const logAutomation = mutation({
  args: {
    permissionKey: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    action: v.string(),
    aiConfidence: v.number(),
    result: v.string(),
    reasoning: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const logId = await ctx.db.insert("aiAutomationLog", {
      permissionKey: args.permissionKey,
      entityType: args.entityType,
      entityId: args.entityId,
      action: args.action,
      aiConfidence: args.aiConfidence,
      result: args.result,
      reasoning: args.reasoning,
      createdAt: Date.now(),
    });

    // Update permission counter
    const perm = await ctx.db
      .query("aiPermissions")
      .withIndex("by_key", (q: any) => q.eq("key", args.permissionKey))
      .first();
    if (perm) {
      await ctx.db.patch(perm._id, {
        autoActionCount: perm.autoActionCount + 1,
        lastTriggeredAt: Date.now(),
      });
    }

    return { logId };
  },
});

/** Owner: Override an AI automation action */
export const overrideAutomation = mutation({
  args: {
    logId: v.id("aiAutomationLog"),
    overrideReason: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireOwner(ctx);
    await ctx.db.patch(args.logId, {
      overriddenBy: user._id,
      overrideReason: args.overrideReason,
    });

    await ctx.db.insert("auditLogs", {
      adminId: user._id,
      adminName: user.name || user.email || "Owner",
      adminRole: user.adminRole,
      action: "OVERRIDE_AI_AUTOMATION",
      target: "aiAutomation",
      targetId: args.logId,
      details: args.overrideReason,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/** Get automation logs */
export const getAutomationLogs = query({
  args: {
    permissionKey: v.optional(v.string()),
    entityType: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let logs = await ctx.db
      .query("aiAutomationLog")
      .withIndex("by_created", (q) => q)
      .order("desc")
      .take(args.limit || 200);

    if (args.permissionKey) logs = logs.filter((l) => l.permissionKey === args.permissionKey);
    if (args.entityType) logs = logs.filter((l) => l.entityType === args.entityType);
    return logs;
  },
});

// ─── OWNER UNIFIED DASHBOARD ───

/** Owner: Get complete platform status for unified dashboard */
export const getOwnerDashboard = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const dayAgo = now - 86400000;

    // Core platform data
    const users = await ctx.db.query("users").collect();
    const listings = await ctx.db.query("listings").collect();
    const escrows = await ctx.db.query("escrows").collect();
    const disputes = await ctx.db.query("disputes").collect();
    const tickets = await ctx.db.query("supportTickets").collect();
    const fraudAlerts = await ctx.db.query("fraudAlerts").collect();
    const kycApps = await ctx.db.query("kycApplications").collect();
    const walletTx = await ctx.db.query("walletTransactions").collect();
    const deliveries = await ctx.db.query("deliveries").collect();

    // AI data
    const aiPerms = await ctx.db.query("aiPermissions").collect();
    const aiLogs = await ctx.db.query("aiAutomationLog").order("desc").take(50);
    const aiMetrics = await ctx.db.query("aiMetrics").order("desc").take(7);
    const aiAudit = await ctx.db.query("aiAuditLog").order("desc").take(30);

    // Shutdown status
    const shutdownSetting = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q: any) => q.eq("key", "ai_emergency_shutdown"))
      .first();

    const aiShutdown = shutdownSetting?.value === "true";

    // Compute stats
    const sellers = users.filter((u) => u.role === "seller");
    const buyers = users.filter((u) => u.role === "buyer");
    const activeListings = listings.filter((l) => l.status === "active");
    const completedEscrows = escrows.filter((e) => ["released", "completed"].includes(e.status));
    const pendingEscrows = escrows.filter((e) => ["funded", "active", "delivery", "inspection"].includes(e.status));

    const totalGMV = escrows.reduce((sum, e) => sum + e.amount, 0);
    const platformRevenue = completedEscrows.reduce((sum, e) => sum + (e.platformFee || 0), 0);
    const heldInEscrow = pendingEscrows.reduce((sum, e) => sum + e.amount, 0);

    // AI stats
    const todayMetrics = aiMetrics[0];
    const enabledPerms = aiPerms.filter((p) => p.enabled);
    const totalAutoActions = aiPerms.reduce((sum, p) => sum + p.autoActionCount, 0);
    const recentAutomations = aiLogs.filter((l) => l.createdAt > dayAgo);
    const recentOverrides = aiLogs.filter((l) => l.overriddenBy && l.createdAt > dayAgo);

    // Automation by category
    const permByCategory: Record<string, { total: number; enabled: number; actions: number }> = {};
    for (const p of aiPerms) {
      if (!permByCategory[p.category]) permByCategory[p.category] = { total: 0, enabled: 0, actions: 0 };
      permByCategory[p.category].total++;
      if (p.enabled) permByCategory[p.category].enabled++;
      permByCategory[p.category].actions += p.autoActionCount;
    }

    // Critical alerts requiring owner attention
    const criticalAlerts: string[] = [];
    if (fraudAlerts.filter((a) => a.riskLevel === "critical" && a.status === "new").length > 0) {
      criticalAlerts.push(`${fraudAlerts.filter((a) => a.riskLevel === "critical" && a.status === "new").length} critical fraud alerts`);
    }
    if (disputes.filter((d) => d.status === "escalated").length > 0) {
      criticalAlerts.push(`${disputes.filter((d) => d.status === "escalated").length} escalated disputes`);
    }
    const highValuePending = escrows.filter((e) => e.amount > 100000 && ["funded", "active"].includes(e.status));
    if (highValuePending.length > 0) {
      criticalAlerts.push(`${highValuePending.length} high-value escrows (KES 100K+)`);
    }
    if (aiShutdown) {
      criticalAlerts.push("AI SYSTEM IS IN EMERGENCY SHUTDOWN");
    }

    return {
      platform: {
        totalUsers: users.length,
        buyers: buyers.length,
        sellers: sellers.length,
        admins: users.filter((u) => u.role === "admin").length,
        activeListings: activeListings.length,
        totalProducts: listings.length,
        totalOrders: escrows.length,
        activeOrders: pendingEscrows.length,
        completedOrders: completedEscrows.length,
        disputedOrders: escrows.filter((e) => e.status === "disputed").length,
        totalGMV,
        platformRevenue,
        heldInEscrow,
        todayNewUsers: users.filter((u) => (u._creationTime || 0) > dayAgo).length,
        todayNewOrders: escrows.filter((e) => e.createdAt > dayAgo).length,
        todayRevenue: completedEscrows.filter((e) => (e.completedAt || 0) > dayAgo).reduce((s, e) => s + (e.platformFee || 0), 0),
        totalDeliveries: deliveries.length,
        pendingDeliveries: deliveries.filter((d) => ["assigned", "pickup", "in_transit"].includes(d.status)).length,
      },
      ai: {
        isShutdown: aiShutdown,
        totalPermissions: aiPerms.length,
        enabledPermissions: enabledPerms.length,
        disabledPermissions: aiPerms.length - enabledPerms.length,
        totalAutoActions,
        todayAutomations: recentAutomations.length,
        todayOverrides: recentOverrides.length,
        automationRate: todayMetrics?.automationRate || 0,
        qualityScore: todayMetrics?.qualityScore || 0,
        aiResolved: todayMetrics?.aiResolved || 0,
        humanEscalated: todayMetrics?.humanEscalated || 0,
        totalConversations: todayMetrics?.totalConversations || 0,
        permissionsByCategory: permByCategory,
      },
      operations: {
        openTickets: tickets.filter((t) => ["open", "escalated", "human_review"].includes(t.status)).length,
        aiHandledTickets: tickets.filter((t) => t.status === "ai_handling").length,
        escalatedTickets: tickets.filter((t) => t.status === "escalated").length,
        resolvedTickets: tickets.filter((t) => ["resolved", "ai_resolved", "closed"].includes(t.status)).length,
        pendingKyc: kycApps.filter((a) => a.status === "pending").length,
        verifiedSellers: users.filter((u) => u.kycStatus === "verified").length,
        openDisputes: disputes.filter((d) => ["open", "under_review", "escalated"].includes(d.status)).length,
        highValueDisputes: disputes.filter((d) => {
          const escrow = escrows.find((e) => e._id === d.escrowId);
          return escrow && escrow.amount > 50000 && ["open", "under_review", "escalated"].includes(d.status);
        }).length,
        newFraudAlerts: fraudAlerts.filter((a) => a.status === "new").length,
        criticalFraudAlerts: fraudAlerts.filter((a) => a.riskLevel === "critical" && a.status !== "dismissed").length,
        pendingWalletTx: walletTx.filter((t) => t.status === "pending").length,
      },
      alerts: criticalAlerts,
      recentAuditLogs: aiAudit.slice(0, 15),
      aiMetricsHistory: aiMetrics,
    };
  },
});

// ─── OWNER: BULK ACTIONS ───

/** Owner: Mass-resolve all low-priority tickets */
export const bulkResolveLowTickets = mutation({
  args: { resolution: v.string() },
  handler: async (ctx, args) => {
    const { user, isOwner } = await requireOwner(ctx);
    const tickets = await ctx.db.query("supportTickets").collect();
    const lowPriority = tickets.filter(
      (t) => t.priority === "low" && ["open", "ai_handling"].includes(t.status)
    );

    let count = 0;
    for (const ticket of lowPriority) {
      await ctx.db.patch(ticket._id, {
        status: "resolved" as any,
        resolution: args.resolution,
        resolvedBy: user._id,
        resolvedAt: Date.now(),
        updatedAt: Date.now(),
      });
      count++;
    }

    await ctx.db.insert("auditLogs", {
      adminId: user._id,
      adminName: user.name || user.email || "Owner",
      adminRole: user.adminRole,
      action: "BULK_RESOLVE_TICKETS",
      target: "supportTickets",
      details: `Resolved ${count} low-priority tickets: ${args.resolution}`,
      createdAt: Date.now(),
    });

    return { success: true, count };
  },
});

/** Owner: Mass-approve pending KYC that AI cleared */
export const bulkApproveKyc = mutation({
  args: { notes: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { user, isOwner } = await requireOwner(ctx);
    const apps = await ctx.db.query("kycApplications").collect();
    const pending = apps.filter((a) => a.status === "pending");

    let count = 0;
    for (const app of pending) {
      await ctx.db.patch(app._id, {
        status: "approved" as any,
        reviewedBy: user._id,
        reviewNotes: args.notes || "Bulk approved by owner",
        reviewedAt: Date.now(),
      });
      // Update user KYC status
      if (app.userId) {
        await ctx.db.patch(app.userId as any, {
          kycStatus: "verified" as any,
          kycVerifiedAt: Date.now(),
        });
      }
      count++;
    }

    await ctx.db.insert("auditLogs", {
      adminId: user._id,
      adminName: user.name || user.email || "Owner",
      adminRole: user.adminRole,
      action: "BULK_APPROVE_KYC",
      target: "kycApplications",
      details: `Approved ${count} KYC applications`,
      createdAt: Date.now(),
    });

    return { success: true, count };
  },
});

/** Owner: Dismiss all low/medium fraud alerts */
export const dismissLowFraudAlerts = mutation({
  args: {},
  handler: async (ctx) => {
    const { user, isOwner } = await requireOwner(ctx);
    const alerts = await ctx.db.query("fraudAlerts").collect();
    const lowMedium = alerts.filter(
      (a) => ["low", "medium"].includes(a.riskLevel) && a.status === "new"
    );

    let count = 0;
    for (const alert of lowMedium) {
      await ctx.db.patch(alert._id, {
        status: "dismissed" as any,
        reviewedBy: user._id,
        reviewNotes: "Dismissed by owner - low/medium risk",
        reviewedAt: Date.now(),
      });
      count++;
    }

    await ctx.db.insert("auditLogs", {
      adminId: user._id,
      adminName: user.name || user.email || "Owner",
      adminRole: user.adminRole,
      action: "DISMISS_LOW_FRAUD_ALERTS",
      target: "fraudAlerts",
      details: `Dismissed ${count} low/medium risk alerts`,
      createdAt: Date.now(),
    });

    return { success: true, count };
  },
});

// ─── OWNER: PERMISSION STATS ───

/** Get detailed permission usage stats */
export const getPermissionStats = query({
  args: {},
  handler: async (ctx) => {
    const perms = await ctx.db.query("aiPermissions").collect();
    const logs = await ctx.db.query("aiAutomationLog").order("desc").take(500);

    return perms.map((p) => {
      const permLogs = logs.filter((l) => l.permissionKey === p.key);
      const today = Date.now() - 86400000;
      const todayCount = permLogs.filter((l) => l.createdAt > today).length;
      const overridden = permLogs.filter((l) => l.overriddenBy).length;
      const successRate = permLogs.length > 0
        ? (permLogs.filter((l) => l.result === "approved").length / permLogs.length) * 100
        : 0;

      return {
        ...p,
        todayCount,
        overriddenCount: overridden,
        successRate: Math.round(successRate * 10) / 10,
        last7Days: permLogs.filter((l) => l.createdAt > Date.now() - 604800000).length,
      };
    });
  },
});
