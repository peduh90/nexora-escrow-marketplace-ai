import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { sellerCommission, buyerProtectionFee } from "./fees";

// ─── TRANSPORT & RIDES (Boda, Matatu, Tuk-Tuk, Taxi, Delivery) ──────────────
//
// On-demand services (boda, tuktuk, taxi, delivery) price ONLY through the
// fare engine driven by admin-configured rules — a rider can never set an
// arbitrary fare. Matatu is stage/route based: fares come from the route's
// cumulative fare table (fare A→B = |fares[B] − fares[A]|).
//
// Verification: identity + vehicle + regulatory documents, reviewed by an
// admin. Only `verified` providers can accept trips. Customers see the price
// BEFORE requesting and pay into escrow through the shared fee engine.

export const TRANSPORT_TYPES = [
  { value: "boda", label: "Boda Boda", emoji: "🏍️", onDemand: true },
  { value: "matatu", label: "Matatu", emoji: "🚐", onDemand: false },
  { value: "tuktuk", label: "Tuk-Tuk", emoji: "🛺", onDemand: true },
  { value: "taxi", label: "Taxi", emoji: "🚕", onDemand: true },
  { value: "delivery", label: "Delivery", emoji: "📦", onDemand: true },
] as const;

/** Nairobi-centre gazetteer anchor (deg) for straight-line distance. */
const PLACES: Record<string, { lat: number; lng: number }> = {
  "nairobi-cbd": { lat: -1.2864, lng: 36.8172 },
  "westlands": { lat: -1.2673, lng: 36.8065 },
  "karen": { lat: -1.3197, lng: 36.7076 },
  "kilimani": { lat: -1.2921, lng: 36.7832 },
  "lavington": { lat: -1.2790, lng: 36.7660 },
  "embakasi": { lat: -1.3167, lng: 36.9167 },
  "ruaraka": { lat: -1.2333, lng: 36.8833 },
  "kasarani": { lat: -1.2236, lng: 36.8964 },
  "roysambu": { lat: -1.2500, lng: 36.8833 },
  "thika-road": { lat: -1.2167, lng: 36.9167 },
  "kiambu": { lat: -1.1714, lng: 36.8356 },
  "ruiru": { lat: -1.1500, lng: 36.9667 },
  "thika": { lat: -1.0333, lng: 37.0833 },
  "machakos": { lat: -1.5167, lng: 37.2667 },
  "ngong": { lat: -1.3583, lng: 36.6500 },
  "kikuyu": { lat: -1.2500, lng: 36.6667 },
  "ugi": { lat: -1.1833, lng: 36.9833 },
  "mombasa": { lat: -4.0435, lng: 39.6682 },
  "kisumu": { lat: -0.0917, lng: 34.7680 },
  "nakuru": { lat: -0.3031, lng: 36.0800 },
  "eldoret": { lat: 0.5143, lng: 35.2698 },
  "nakawa-market": { lat: -1.3000, lng: 36.8333 },
  "gikomba": { lat: -1.2917, lng: 36.8460 },
  "kawangware": { lat: -1.2833, lng: 36.7500 },
  "dandora": { lat: -1.2833, lng: 36.9000 },
  "mtaani": { lat: -1.2921, lng: 36.7832 },
};

/** Simple English label for a gazetteer key. */
export function placeLabel(key: string): string {
  return (key || "")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export const getPlaces = query({
  args: {},
  handler: async () =>
    Object.keys(PLACES).map((k) => ({ key: k, label: placeLabel(k) })),
});

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
      .withIndex("email" as any, (q: any) => q.eq("email", email))
      .collect();
    if (rows.length > 0) return rows[0];
  }
  return null;
}

async function requireUser(ctx: any): Promise<any> {
  const user = await getSessionUser(ctx);
  if (!user) throw new Error("Not authenticated");
  return user;
}

async function requireAdmin(ctx: any): Promise<any> {
  const user = await requireUser(ctx);
  if (user.role !== "admin") throw new Error("Unauthorized: admin only");
  return user;
}

async function notify(ctx: any, userId: string, title: string, message: string, link: string) {
  await ctx.db.insert("notifications", {
    userId,
    type: "transport",
    title,
    message,
    read: false,
    link,
    createdAt: Date.now(),
  });
}

// ─── FARE ENGINE (admin-configured, server-only) ────────────────────────────

const DEFAULT_FARE_RULES = {
  baseFare: 70,
  pricePerKm: 35,
  pricePerMinute: 2,
  minimumFare: 100,
  routeFactor: 1.35,
  surgeEnabled: false,
  maxSurgeMultiplier: 1.5,
};

async function getFareRules(ctx: any) {
  const row = await ctx.db.query("transportSettings").first();
  if (row) return row as any;
  return { ...DEFAULT_FARE_RULES, updatedAt: undefined, updatedBy: undefined };
}

/** Haversine distance in km. */
function straightLineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * The one true fare calculator. Deterministic from (from, to, rules, surge):
 * distance × routeFactor, time ≈ distance ÷ 25km/h, fare = base + perKm×km +
 * perMin×min, floored at minimumFare, × surge cap. No caller passes an amount.
 */
function computeFare(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  rules: any,
  now = Date.now(),
) {
  const km = straightLineKm(from, to) * (rules.routeFactor || DEFAULT_FARE_RULES.routeFactor);
  const durationMin = Math.max(3, Math.round((km / 25) * 60));
  let fare =
    (rules.baseFare ?? 0) + km * (rules.pricePerKm ?? 0) + durationMin * (rules.pricePerMinute ?? 0);
  let surge = 1;
  if (rules.surgeEnabled) {
    const hour = new Date(now).getHours();
    const peak = (hour >= 6 && hour <= 9) || (hour >= 16 && hour <= 20);
    if (peak) surge = Math.min(rules.maxSurgeMultiplier || 1.5, rules.maxSurgeMultiplier || 1.5);
  }
  fare = Math.max(Math.round(fare * surge), Math.round(rules.minimumFare ?? 100));
  return {
    fare,
    distanceKm: Math.round(km * 10) / 10,
    durationMin,
    surge,
    breakdown: {
      baseFare: Math.round(rules.baseFare ?? 0),
      distanceKm: Math.round(km * 10) / 10,
      perKm: Math.round(rules.pricePerKm ?? 0),
      timeMin: durationMin,
      perMin: Math.round(rules.pricePerMinute ?? 0),
      surge,
      minimumFare: Math.round(rules.minimumFare ?? 100),
    },
  };
}

function resolvePlace(key?: string): { lat: number; lng: number } | null {
  if (!key) return null;
  const hit = PLACES[key];
  return hit ? { ...hit } : null;
}

/**
 * Quote a fare. Public (customers compare before signing in) but NEVER stores
 * anything and never trusts client amounts.
 */
export const quoteFare = query({
  args: {
    serviceType: v.union(v.literal("boda"), v.literal("tuktuk"), v.literal("taxi"), v.literal("delivery")),
    fromPlace: v.string(),
    toPlace: v.string(),
  },
  handler: async (ctx, args) => {
    const rules = await getFareRules(ctx);
    const from = resolvePlace(args.fromPlace);
    const to = resolvePlace(args.toPlace);
    if (!from || !to) throw new Error("Unknown location — pick pickup and destination from the list");
    const typeFactor =
      args.serviceType === "boda" ? 0.8 : args.serviceType === "tuktuk" ? 0.9 : args.serviceType === "delivery" ? 1.0 : 1.4;
    const adjusted = {
      ...rules,
      baseFare: Math.round((rules.baseFare ?? 70) * typeFactor),
      pricePerKm: Math.round((rules.pricePerKm ?? 35) * typeFactor * 10) / 10,
    };
    const q = computeFare(from, to, adjusted);
    const protection = buyerProtectionFee("product", q.fare);
    return {
      ...q,
      protectionFee: protection.fee,
      total: q.fare + protection.fee,
      currency: "KES",
    };
  },
});

// ─── PUBLIC DISCOVERY ───────────────────────────────────────────────────────

async function toPublicTransport(ctx: any, p: any) {
  const user = await ctx.db.get(p.userId as any);
  return {
    _id: p._id,
    displayName: p.displayName,
    serviceType: p.serviceType,
    vehicleModel: p.vehicleModel,
    county: p.county,
    town: p.town,
    baseStage: p.baseStage,
    routeCodes: p.routeCodes,
    schedule: p.schedule,
    availability: p.availability,
    verificationStatus: p.verificationStatus,
    rating: p.ratingCount ? Math.round(((p.ratingSum || 0) / p.ratingCount) * 10) / 10 : null,
    ratingCount: p.ratingCount || 0,
    completedTrips: p.completedTrips || 0,
    image: (user as any)?.image ?? undefined,
  };
}

/** Verified transport providers, optionally filtered by type & availability. */
export const getTransportProviders = query({
  args: {
    serviceType: v.optional(v.string()),
    availableNow: v.optional(v.boolean()),
    county: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let rows = await ctx.db
      .query("transportProfiles")
      .withIndex("by_verification" as any, (q: any) => q.eq("verificationStatus", "verified"))
      .collect();
    if (args.serviceType) rows = rows.filter((p: any) => p.serviceType === args.serviceType);
    if (args.availableNow) rows = rows.filter((p: any) => p.availability === "available_now");
    if (args.county) rows = rows.filter((p: any) => p.county === args.county);
    const out = await Promise.all(rows.map((p: any) => toPublicTransport(ctx, p)));
    out.sort((a: any, b: any) =>
      (b.availability === "available_now" ? 1 : 0) - (a.availability === "available_now" ? 1 : 0) ||
      (b.rating ?? 0) - (a.rating ?? 0),
    );
    return out;
  },
});

/** Matatu routes with stage-based fares (public). */
export const getRoutes = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("transportRoutes").collect();
    return rows.filter((r: any) => r.active).map((r: any) => ({
      _id: r._id,
      name: r.name,
      code: r.code,
      stages: r.stages,
      fares: r.fares,
      notes: r.notes,
    }));
  },
});

/** Fare between two stages on a route — |fares[to] − fares[from]|, server-side. */
export const quoteMatatuFare = query({
  args: { routeCode: v.string(), fromStageIndex: v.number(), toStageIndex: v.number() },
  handler: async (ctx, args) => {
    const route = await ctx.db
      .query("transportRoutes")
      .withIndex("by_code" as any, (q: any) => q.eq("code", args.routeCode))
      .first();
    if (!route) throw new Error("Route not found");
    const r = route as any;
    if (
      args.fromStageIndex < 0 || args.toStageIndex < 0 ||
      args.fromStageIndex >= r.stages.length || args.toStageIndex >= r.stages.length
    ) {
      throw new Error("Invalid stage");
    }
    const fare = Math.abs(r.fares[args.toStageIndex] - r.fares[args.fromStageIndex]);
    const protection = buyerProtectionFee("product", fare);
    return {
      fare: Math.max(fare, 20),
      protectionFee: protection.fee,
      total: Math.max(fare, 20) + protection.fee,
      fromStage: r.stages[args.fromStageIndex],
      toStage: r.stages[args.toStageIndex],
      routeName: r.name,
      schedule: r.notes || undefined,
      currency: "KES",
    };
  },
});

// ─── PROVIDER: REGISTRATION & VERIFICATION ──────────────────────────────────

/** Register as a transport provider (identity + vehicle + regulatory docs). */
export const upsertTransportProfile = mutation({
  args: {
    displayName: v.string(),
    serviceType: v.union(v.literal("boda"), v.literal("matatu"), v.literal("tuktuk"), v.literal("taxi"), v.literal("delivery")),
    vehicleModel: v.optional(v.string()),
    plateNumber: v.optional(v.string()),
    licenseNumber: v.optional(v.string()),
    county: v.string(),
    town: v.string(),
    baseStage: v.optional(v.string()),
    routeCodes: v.optional(v.array(v.string())),
    schedule: v.optional(v.string()),
    phone: v.optional(v.string()),
    idDocumentUrl: v.optional(v.string()),
    vehicleDocumentUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const isMatatu = args.serviceType === "matatu";
    // Register first, verify before earning (#51 informal-commerce principle):
    // documents are optional at registration so no one is scared away by a
    // logbook upload wall. Admin verification is still mandatory before the
    // provider can accept trips — that gate is enforced below, not here.
    if (isMatatu && (!args.routeCodes || args.routeCodes.length === 0)) {
      throw new Error("Matatu operators must list at least one route code");
    }
    if (!isMatatu && !args.plateNumber) {
      throw new Error("Plate number is required");
    }
    const now = Date.now();
    const existing = await ctx.db
      .query("transportProfiles")
      .withIndex("by_user" as any, (q: any) => q.eq("userId", user._id))
      .first();
    const payload: Record<string, any> = {
      displayName: args.displayName.trim(),
      serviceType: args.serviceType,
      vehicleModel: args.vehicleModel,
      plateNumber: args.plateNumber,
      licenseNumber: args.licenseNumber,
      county: args.county,
      town: args.town,
      baseStage: args.baseStage,
      routeCodes: args.routeCodes,
      schedule: args.schedule,
      phone: args.phone,
      idDocumentUrl: args.idDocumentUrl,
      vehicleDocumentUrl: args.vehicleDocumentUrl,
      // Registration completeness marker: documents can be added later, but a
      // provider without documents stays "pending" and cannot accept trips.
      // Any re-submission goes back to pending for fresh admin review.
      verificationStatus: "pending" as any,
      updatedAt: now,
    };
    if (existing) {
      await ctx.db.patch((existing as any)._id, payload);
      return { profileId: (existing as any)._id, created: false };
    }
    const id = await ctx.db.insert("transportProfiles", {
      ...payload,
      userId: user._id,
      availability: "off" as any,
      ratingSum: 0,
      ratingCount: 0,
      completedTrips: 0,
      createdAt: now,
    } as any);
    const admins = await ctx.db
      .query("users")
      .withIndex("by_role" as any, (q: any) => q.eq("role", "admin"))
      .collect();
    for (const admin of admins) {
      await notify(ctx, admin._id, "New transport provider to verify", `${args.displayName} registered as ${args.serviceType} in ${args.town}.`, "/admin/transport");
    }
    return { profileId: id, created: true };
  },
});

export const getMyTransport = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const profile = await ctx.db
      .query("transportProfiles")
      .withIndex("by_user" as any, (q: any) => q.eq("userId", user._id))
      .first();
    const trips = await ctx.db
      .query("trips")
      .withIndex("by_provider_user" as any, (q: any) => q.eq("providerUserId", user._id))
      .order("desc")
      .take(100);
    const withCustomer = await Promise.all(
      trips.map(async (t: any) => {
        const c = await ctx.db.get(t.customerId as any);
        return { ...t, customerName: (c as any)?.name || "Customer", customerPhone: (c as any)?.phone || null };
      }),
    );
    const done = withCustomer.filter((t: any) => t.status === "completed");
    return {
      profile: profile ?? null,
      trips: withCustomer,
      completedCount: done.length,
      earnings: done.reduce((s: number, t: any) => s + (t.payout ?? 0), 0),
    };
  },
});

export const setTransportAvailability = mutation({
  args: { availability: v.union(v.literal("available_now"), v.literal("busy"), v.literal("off")) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const profile = await ctx.db
      .query("transportProfiles")
      .withIndex("by_user" as any, (q: any) => q.eq("userId", user._id))
      .first();
    if (!profile) throw new Error("Register as a transport provider first");
    if ((profile as any).verificationStatus !== "verified") {
      throw new Error("Your documents must be verified by Nexora before you can accept trips");
    }
    await ctx.db.patch((profile as any)._id, { availability: args.availability, updatedAt: Date.now() });
    return { success: true };
  },
});

// ─── CUSTOMER: REQUEST, TRACK, PAY ──────────────────────────────────────────

/**
 * Request an on-demand trip. The fare is recomputed server-side from the same
 * rules shown in the quote — the client cannot influence the amount.
 */
export const requestTrip = mutation({
  args: {
    serviceType: v.union(v.literal("boda"), v.literal("tuktuk"), v.literal("taxi"), v.literal("delivery")),
    providerId: v.optional(v.id("transportProfiles")),
    fromPlace: v.string(),
    fromLabel: v.string(),
    toPlace: v.string(),
    toLabel: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const rules = await getFareRules(ctx);
    const from = resolvePlace(args.fromPlace);
    const to = resolvePlace(args.toPlace);
    if (!from || !to) throw new Error("Unknown location — choose from the list");
    if (args.fromPlace === args.toPlace) throw new Error("Pickup and destination must differ");

    let providerUserId: string | undefined;
    if (args.providerId) {
      const p = await ctx.db.get(args.providerId);
      if (!p || (p as any).serviceType !== args.serviceType) throw new Error("Provider not found for this service");
      if ((p as any).verificationStatus !== "verified") throw new Error("This provider is not verified yet");
      if ((p as any).userId === user._id) throw new Error("You cannot request your own trip");
      providerUserId = (p as any).userId;
    }

    const typeFactor =
      args.serviceType === "boda" ? 0.8 : args.serviceType === "tuktuk" ? 0.9 : args.serviceType === "delivery" ? 1.0 : 1.4;
    const adjusted = {
      ...rules,
      baseFare: Math.round((rules.baseFare ?? 70) * typeFactor),
      pricePerKm: Math.round((rules.pricePerKm ?? 35) * typeFactor * 10) / 10,
    };
    const q = computeFare(from, to, adjusted);
    const now = Date.now();

    const id = await ctx.db.insert("trips", {
      customerId: user._id,
      providerId: args.providerId,
      providerUserId,
      serviceType: args.serviceType,
      pickup: args.fromLabel,
      pickupPlace: args.fromPlace,
      destination: args.toLabel,
      destinationPlace: args.toPlace,
      distanceKm: q.distanceKm,
      durationMin: q.durationMin,
      fare: q.fare,
      currency: "KES",
      fareBreakdown: q.breakdown,
      status: "requested" as any,
      requestedAt: now,
      createdAt: now,
    });

    if (providerUserId) {
      await notify(
        ctx,
        providerUserId,
        "New trip request",
        `${q.distanceKm} km ${args.serviceType} trip: ${args.fromLabel} → ${args.toLabel}. KES ${q.fare.toLocaleString()} secured on acceptance.`,
        "/transport/dashboard",
      );
    }
    return { tripId: id, fare: q.fare, distanceKm: q.distanceKm, durationMin: q.durationMin };
  },
});

/** Customer funds the trip into escrow (fare + protection fee). */
export const fundTrip = mutation({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const trip = await ctx.db.get(args.tripId);
    if (!trip) throw new Error("Trip not found");
    const t = trip as any;
    if (t.customerId !== user._id) throw new Error("Not authorized");
    if (t.status !== "requested") throw new Error("This trip is no longer awaiting payment");

    const protection = buyerProtectionFee("product", t.fare);
    const total = t.fare + protection.fee;
    const walletBalance = (user as any).walletBalance || 0;
    if (walletBalance < total) {
      throw new Error(
        `You need KES ${total.toLocaleString()} in your wallet (fare KES ${t.fare.toLocaleString()} + protection KES ${protection.fee.toLocaleString()}). Deposit with M-Pesa first.`,
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
      reference: `NX-TRP-ESC-${now}`,
      description: `Escrow for ${t.serviceType} trip ${t.pickup} → ${t.destination} (incl. KES ${protection.fee.toLocaleString()} protection)`,
      createdAt: now,
    });
    await ctx.db.patch(args.tripId, { status: "funded" as any, customerFunded: true, updatedAt: now });

    // A funded trip without a chosen provider is visible to all verified
    // providers of that type ("Available Now" riders see it on their dashboard).
    await notify(ctx, user._id, "Trip funded", "Your fare is safely held. A verified rider/driver will accept shortly.", "/transport/trips");
    return { success: true, total };
  },
});

/** A verified provider accepts a funded trip (or a rider grabs an open trip). */
export const acceptTrip = mutation({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const profile = await ctx.db
      .query("transportProfiles")
      .withIndex("by_user" as any, (q: any) => q.eq("userId", user._id))
      .first();
    if (!profile) throw new Error("Register as a transport provider first");
    const p = profile as any;
    if (p.verificationStatus !== "verified") throw new Error("Your documents must be verified first");
    if (p.availability !== "available_now") throw new Error("Go 'Available Now' before accepting trips");

    const trip = await ctx.db.get(args.tripId);
    if (!trip) throw new Error("Trip not found");
    const t = trip as any;
    if (t.providerUserId && t.providerUserId !== user._id) throw new Error("Already assigned to another provider");
    if (!["requested", "funded"].includes(t.status)) throw new Error("Trip is closed");
    if (t.customerId === user._id) throw new Error("You cannot accept your own trip");
    if (p.serviceType !== t.serviceType) throw new Error("This trip needs a different vehicle type");

    const now = Date.now();
    await ctx.db.patch(args.tripId, {
      providerId: p._id,
      providerUserId: user._id,
      status: (t.status === "funded" ? "accepted" : "funded") as any,
      customerFunded: t.status === "funded" ? true : t.customerFunded,
      acceptedAt: now,
      updatedAt: now,
    });
    await notify(
      ctx,
      t.customerId,
      `${p.serviceType === "boda" ? "Rider" : "Driver"} assigned`,
      `${p.displayName} accepted your trip ${t.pickup} → ${t.destination}. Fare KES ${t.fare.toLocaleString()} is held safely.`,
      "/transport/trips",
    );
    return { success: true };
  },
});

/** Provider marks arriving → customer sees "your rider is coming". */
export const markArriving = mutation({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const trip = await ctx.db.get(args.tripId);
    if (!trip) throw new Error("Trip not found");
    const t = trip as any;
    if (t.providerUserId !== user._id) throw new Error("Not authorized");
    if (t.status !== "accepted") throw new Error("Accept the trip first");
    const now = Date.now();
    await ctx.db.patch(args.tripId, { status: "arriving" as any, updatedAt: now });
    await notify(ctx, t.customerId, "Your ride is arriving", `${t.serviceType === "boda" ? "Your rider" : "Your driver"} is on the way to ${t.pickup}.`, "/transport/trips");
    return { success: true };
  },
});

/** Provider starts the trip (customer aboard / parcel picked). */
export const startTrip = mutation({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const trip = await ctx.db.get(args.tripId);
    if (!trip) throw new Error("Trip not found");
    const t = trip as any;
    if (t.providerUserId !== user._id) throw new Error("Not authorized");
    if (!["accepted", "arriving"].includes(t.status)) throw new Error("Wrong trip state");
    if (!t.customerFunded) throw new Error("The customer must fund the fare first");
    const now = Date.now();
    await ctx.db.patch(args.tripId, { status: "in_progress" as any, startedAt: now, updatedAt: now });
    await notify(ctx, t.customerId, "Trip started", `Your trip to ${t.destination} has started. Confirm arrival when you get there.`, "/transport/trips");
    return { success: true };
  },
});

/** Customer confirms arrival — releases escrow, pays the provider net of fees. */
export const completeTrip = mutation({
  args: { tripId: v.id("trips"), note: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const trip = await ctx.db.get(args.tripId);
    if (!trip) throw new Error("Trip not found");
    const t = trip as any;
    if (t.customerId !== user._id) throw new Error("Only the customer can confirm arrival");
    if (t.status !== "in_progress") throw new Error("Trip is not in progress");
    if (!t.customerFunded || !t.providerUserId) throw new Error("Trip is not ready to complete");

    const now = Date.now();
    const amount = t.fare;
    const commission = sellerCommission("product", amount);
    const protection = buyerProtectionFee("product", amount);
    const payout = amount - commission.fee;

    const customer = await ctx.db.get(t.customerId as any);
    await ctx.db.patch(t.customerId as any, {
      escrowBalance: Math.max(0, ((customer as any).escrowBalance || 0) - (amount + protection.fee)),
    });
    const provider: any = await ctx.db.get(t.providerUserId as any);
    if (provider) {
      await ctx.db.patch(provider._id, { walletBalance: (provider.walletBalance || 0) + payout });
      await ctx.db.insert("walletTransactions", {
        userId: provider._id,
        type: "escrow_release" as any,
        amount: payout,
        currency: "KES",
        status: "completed" as any,
        reference: `NX-TRP-REL-${now}`,
        description: `Payment for ${t.serviceType} trip ${t.pickup} → ${t.destination} (gross KES ${amount.toLocaleString()} − ${(commission.rate * 100).toFixed(1)}% commission)`,
        createdAt: now,
      });
      const prof = await ctx.db.get(t.providerId as any);
      if (prof) {
        await ctx.db.patch(t.providerId as any, {
          completedTrips: ((prof as any).completedTrips || 0) + 1,
          updatedAt: now,
        });
      }
    }

    try {
      await ctx.runMutation(internal.referral.internalOnEscrowReleased, {
        participantIds: [t.customerId, t.providerUserId].filter(Boolean),
        escrowId: args.tripId,
        amount,
        currency: "KES",
      });
    } catch (err) {
      console.error("[referral] transport release hook failed:", err);
    }

    await ctx.db.patch(args.tripId, {
      status: "completed" as any,
      completedAt: now,
      payout,
      completionNote: args.note?.trim() || undefined,
      updatedAt: now,
    });
    await notify(ctx, t.providerUserId, "💰 Fare released!", `KES ${payout.toLocaleString()} (net of commission) is in your wallet.`, "/transport/dashboard");
    return { success: true, payout };
  },
});

/** Cancel before start. Funded trips are refunded in full. */
export const cancelTrip = mutation({
  args: { tripId: v.id("trips"), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const trip = await ctx.db.get(args.tripId);
    if (!trip) throw new Error("Trip not found");
    const t = trip as any;
    const isCustomer = t.customerId === user._id;
    const isProvider = t.providerUserId === user._id;
    if (!isCustomer && !isProvider) throw new Error("Not authorized");
    if (!["requested", "funded", "accepted", "arriving"].includes(t.status)) {
      throw new Error("Trip already started — use support");
    }
    const now = Date.now();
    if (t.customerFunded) {
      const protection = buyerProtectionFee("product", t.fare);
      const refund = t.fare + protection.fee;
      const customer = await ctx.db.get(t.customerId as any);
      await ctx.db.patch(t.customerId as any, {
        escrowBalance: Math.max(0, ((customer as any).escrowBalance || 0) - refund),
        walletBalance: ((customer as any).walletBalance || 0) + refund,
      });
      await ctx.db.insert("walletTransactions", {
        userId: t.customerId,
        type: "refund" as any,
        amount: refund,
        currency: "KES",
        status: "completed" as any,
        reference: `NX-TRP-REF-${now}`,
        description: `Refund — cancelled trip ${t.pickup} → ${t.destination}`,
        createdAt: now,
      });
    }
    await ctx.db.patch(args.tripId, {
      status: "cancelled" as any,
      cancelledAt: now,
      cancelledBy: user._id,
      cancelReason: args.reason,
      updatedAt: now,
    });
    const other = isCustomer ? t.providerUserId : t.customerId;
    if (other) {
      await notify(ctx, other, "Trip cancelled", `${isCustomer ? "The customer" : "The provider"} cancelled the trip. ${t.customerFunded ? "Escrow refunded in full." : ""}`, isCustomer ? "/transport/dashboard" : "/transport/trips");
    }
    return { success: true };
  },
});

/**
 * Emergency / safety: flags the trip with a timestamp, notifies both parties
 * and (via notification) points them to the SOS line. Recorded permanently on
 * the trip for audit.
 */
export const raiseEmergency = mutation({
  args: { tripId: v.id("trips"), note: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const trip = await ctx.db.get(args.tripId);
    if (!trip) throw new Error("Trip not found");
    const t = trip as any;
    if (t.customerId !== user._id && t.providerUserId !== user._id) throw new Error("Not authorized");
    const now = Date.now();
    await ctx.db.patch(args.tripId, { emergencyAt: now, updatedAt: now });
    const admins = await ctx.db
      .query("users")
      .withIndex("by_role" as any, (q: any) => q.eq("role", "admin"))
      .collect();
    for (const admin of admins) {
      await notify(ctx, admin._id, "🚨 Trip emergency raised", `Trip ${args.tripId} (${t.pickup} → ${t.destination}) raised an emergency alert. ${args.note || ""}`, "/admin/transport");
    }
    return { success: true, at: now };
  },
});

/** Customer rates a completed trip (provider aggregate updated). */
export const rateTrip = mutation({
  args: { tripId: v.id("trips"), rating: v.number(), comment: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (args.rating < 1 || args.rating > 5) throw new Error("Rating must be 1–5");
    const trip = await ctx.db.get(args.tripId);
    if (!trip) throw new Error("Trip not found");
    const t = trip as any;
    if (t.customerId !== user._id) throw new Error("Not authorized");
    if (t.status !== "completed") throw new Error("You can only rate completed trips");
    if (t.rating) throw new Error("You already rated this trip");
    const now = Date.now();
    await ctx.db.patch(args.tripId, { rating: args.rating, ratedAt: now });
    if (t.providerId) {
      const prof = await ctx.db.get(t.providerId as any);
      if (prof) {
        await ctx.db.patch(t.providerId as any, {
          ratingSum: ((prof as any).ratingSum || 0) + args.rating,
          ratingCount: ((prof as any).ratingCount || 0) + 1,
          updatedAt: now,
        });
      }
    }
    if (t.providerUserId) {
      await notify(ctx, t.providerUserId, "New trip rating", `${args.rating}★${args.comment ? ` — "${args.comment}"` : ""}`, "/transport/dashboard");
    }
    return { success: true };
  },
});

// ─── CUSTOMER TRIP LIST ─────────────────────────────────────────────────────

export const getMyTrips = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const trips = await ctx.db
      .query("trips")
      .withIndex("by_customer" as any, (q: any) => q.eq("customerId", user._id))
      .order("desc")
      .take(100);
    return Promise.all(
      trips.map(async (t: any) => {
        const p = t.providerUserId ? await ctx.db.get(t.providerUserId as any) : null;
        const prof = t.providerId ? await ctx.db.get(t.providerId as any) : null;
        return {
          ...t,
          providerName: (prof as any)?.displayName || (p as any)?.name || null,
          providerPhone: (prof as any)?.phone || (p as any)?.phone || null,
          providerVehicle: (prof as any)?.vehicleModel || null,
          providerPlate: (prof as any)?.plateNumber || null,
        };
      }),
    );
  },
});

// ─── ADMIN: RULES, ROUTES, VERIFICATION ─────────────────────────────────────

export const adminGetTransportData = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rules = await getFareRules(ctx);
    const providers = await ctx.db.query("transportProfiles").order("desc").collect();
    const routes = await ctx.db.query("transportRoutes").order("desc").collect();
    return {
      rules: {
        baseFare: rules.baseFare,
        pricePerKm: rules.pricePerKm,
        pricePerMinute: rules.pricePerMinute,
        minimumFare: rules.minimumFare,
        routeFactor: rules.routeFactor,
        surgeEnabled: rules.surgeEnabled,
        maxSurgeMultiplier: rules.maxSurgeMultiplier,
      },
      providers: providers.map((p: any) => ({
        _id: p._id,
        displayName: p.displayName,
        serviceType: p.serviceType,
        county: p.county,
        town: p.town,
        plateNumber: p.plateNumber,
        routeCodes: p.routeCodes,
        verificationStatus: p.verificationStatus,
        availability: p.availability,
        rating: p.ratingCount ? Math.round(((p.ratingSum || 0) / p.ratingCount) * 10) / 10 : null,
        completedTrips: p.completedTrips || 0,
        idDocumentUrl: p.idDocumentUrl,
        vehicleDocumentUrl: p.vehicleDocumentUrl,
        createdAt: p.createdAt,
      })),
      routes: routes.map((r: any) => ({
        _id: r._id,
        name: r.name,
        code: r.code,
        stages: r.stages,
        fares: r.fares,
        notes: r.notes,
        active: r.active,
      })),
    };
  },
});

/** Admin: update the fare engine rules (live — next quote uses them). */
export const adminUpdateFareRules = mutation({
  args: {
    baseFare: v.number(),
    pricePerKm: v.number(),
    pricePerMinute: v.number(),
    minimumFare: v.number(),
    routeFactor: v.number(),
    surgeEnabled: v.boolean(),
    maxSurgeMultiplier: v.number(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    if (
      args.baseFare < 0 || args.pricePerKm < 0 || args.pricePerMinute < 0 ||
      args.minimumFare < 20 || args.routeFactor < 1 || args.routeFactor > 2.5 ||
      args.maxSurgeMultiplier < 1 || args.maxSurgeMultiplier > 3
    ) {
      throw new Error("Invalid fare rules — check the ranges");
    }
    const row = await ctx.db.query("transportSettings").first();
    const patch = { ...args, updatedAt: Date.now(), updatedBy: admin._id };
    if (row) await ctx.db.patch((row as any)._id, patch);
    else await ctx.db.insert("transportSettings", patch);
    return { success: true };
  },
});

/** Admin: create/update a matatu route with cumulative stage fares. */
export const adminUpsertRoute = mutation({
  args: {
    routeId: v.optional(v.id("transportRoutes")),
    name: v.string(),
    code: v.string(),
    stages: v.array(v.string()),
    fares: v.array(v.number()),
    notes: v.optional(v.string()),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    if (args.stages.length < 2) throw new Error("A route needs at least 2 stages");
    if (args.stages.length !== args.fares.length) throw new Error("Each stage needs one cumulative fare");
    if (args.fares.some((f) => f < 0)) throw new Error("Fares must be ≥ 0");
    for (let i = 1; i < args.fares.length; i++) {
      if (args.fares[i] < args.fares[i - 1]) throw new Error("Cumulative fares must be non-decreasing along the route");
    }
    const now = Date.now();
    const payload = {
      name: args.name.trim(),
      code: args.code.trim().toUpperCase(),
      stages: args.stages.map((s) => s.trim()),
      fares: args.fares,
      notes: args.notes,
      active: args.active,
      updatedBy: admin._id,
      updatedAt: now,
    };
    if (args.routeId) {
      await ctx.db.patch(args.routeId, payload);
      return { routeId: args.routeId, created: false };
    }
    const id = await ctx.db.insert("transportRoutes", { ...payload, createdAt: now });
    return { routeId: id, created: true };
  },
});

/** Admin: verify a transport provider (identity + vehicle + regulatory). */
export const adminVerifyTransportProvider = mutation({
  args: {
    providerId: v.id("transportProfiles"),
    decision: v.union(v.literal("verified"), v.literal("rejected")),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const p = await ctx.db.get(args.providerId);
    if (!p) throw new Error("Provider not found");
    await ctx.db.patch(args.providerId, {
      verificationStatus: args.decision,
      verificationNote: args.note,
      updatedAt: Date.now(),
    });
    await notify(
      ctx,
      (p as any).userId,
      args.decision === "verified" ? "✅ You're verified" : "Verification declined",
      args.decision === "verified"
        ? "Your identity, vehicle and regulatory documents passed review. Set yourself 'Available Now' to receive trips."
        : `Verification was declined. ${args.note || "Check your documents and resubmit."}`,
      "/transport/dashboard",
    );
    return { success: true, by: admin._id };
  },
});

/**
 * Internal repair (server/CLI): recompute transport provider aggregates from
 * real trips.
 */
export const internalRecomputeTransportStats = internalMutation({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db.query("transportProfiles").collect();
    let touched = 0;
    for (const p of profiles) {
      const trips = await ctx.db
        .query("trips")
        .withIndex("by_provider" as any, (q: any) => q.eq("providerId", p._id))
        .collect();
      const done = trips.filter((t: any) => t.status === "completed");
      const rated = done.filter((t: any) => t.rating);
      await ctx.db.patch(p._id, {
        completedTrips: done.length,
        ratingSum: rated.reduce((s: number, t: any) => s + t.rating, 0),
        ratingCount: rated.length,
      });
      touched += 1;
    }
    return { providers: touched };
  },
});
