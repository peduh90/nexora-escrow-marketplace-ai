import { QueryCtx } from "./_generated/server";

/**
 * ─── NEXORA ROLE RULES ─────────────────────────────────────────────────────
 *
 * One email = one account = ONE role. The role is locked at registration:
 * once a user has a role, nothing (profile syncs, re-registrations, admin
 * flows) silently changes it. Only explicit admin action may move a role.
 *
 * There is NO default role. An account that has not completed a role-specific
 * registration simply has no role yet (pendingRole holds what they asked for
 * until verification completes).
 */
export const ALLOWED_ROLES = [
  "admin",
  "buyer",
  "seller",
  "driver",
  "service_provider",
  "freelancer",
  "employer",
  "creator",
] as const;

export type AllowedRole = (typeof ALLOWED_ROLES)[number];

export const ADMIN_EMAIL = "murimiedwin227@gmail.com";

/**
 * Resolve the canonical role for a user during profile creation/update.
 *
 * Order of precedence:
 *  1. The hardcoded admin email always maps to "admin".
 *  2. An EXISTING role on the account is LOCKED — it always wins over any
 *     newly requested role, so one email can never drift between roles
 *     (the old bug: a service provider re-syncing their profile flipped
 *     back to "buyer").
 *  3. An explicitly requested role, if it is an allowed platform role.
 *  4. A seller, identified by a non-empty business name.
 *  5. Otherwise null — NO default role. The caller keeps the account pending
 *     until a real role is chosen and verification completes.
 *
 * This is intentionally NOT open-ended: arbitrary client-supplied roles are
 * ignored unless they are in the allowed list. This prevents a malicious client
 * from promoting itself to admin by sending { role: "admin" }.
 */
export function resolveRole(
  identityEmail: string | undefined,
  requestedRole: string | undefined,
  existingRole: string | undefined,
  businessName: string | undefined,
): AllowedRole | null {
  if (identityEmail === ADMIN_EMAIL) return "admin";

  // Role is LOCKED once assigned — never overwritten by a later sync.
  if (typeof existingRole === "string" && existingRole.length > 0) {
    return existingRole as AllowedRole;
  }

  if (typeof requestedRole === "string" && ALLOWED_ROLES.includes(requestedRole as AllowedRole)) {
    return requestedRole as AllowedRole;
  }

  if (typeof businessName === "string" && businessName.trim().length > 0) {
    return "seller";
  }

  return null;
}

/**
 * Backward-compatible resolver used by checkAndPromoteAdmin, whose args shape
 * is { role?, phone?, displayName? } (no businessName). Same locked-role rule
 * applies: an existing role always wins over a requested one.
 */
export function resolveRoleForAdminFlow(
  identityEmail: string | undefined,
  requestedRole: string | undefined,
  existingUser: { role?: string | undefined; businessName?: string | undefined } | null,
): AllowedRole | null {
  if (identityEmail === ADMIN_EMAIL) return "admin";

  if (
    existingUser &&
    typeof existingUser.role === "string" &&
    existingUser.role.length > 0
  ) {
    return existingUser.role as AllowedRole;
  }

  if (typeof requestedRole === "string" && ALLOWED_ROLES.includes(requestedRole as AllowedRole)) {
    return requestedRole as AllowedRole;
  }

  if (existingUser && typeof existingUser.businessName === "string" && existingUser.businessName.trim().length > 0) {
    return "seller";
  }

  return null;
}
