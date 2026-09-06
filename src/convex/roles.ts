import { QueryCtx } from "./_generated/server";
import { v } from "convex/values";

export const ALLOWED_ROLES = [
  "admin",
  "buyer",
  "seller",
  "driver",
  "freelancer",
  "employer",
] as const;

export type AllowedRole = (typeof ALLOWED_ROLES)[number];

export const ADMIN_EMAIL = "murimiedwin227@gmail.com";

/**
 * Resolve the canonical role for a user during profile creation/update.
 *
 * Order of precedence:
 *  1. The hardcoded admin email always maps to "admin".
 *  2. An explicitly requested role, if it is an allowed platform role.
 *  3. A seller, identified by a non-empty business name.
 *  4. For an existing user, keep the existing role.
 *  5. Otherwise, default to "buyer".
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
): AllowedRole {
  if (identityEmail === ADMIN_EMAIL) return "admin";

  if (typeof requestedRole === "string" && ALLOWED_ROLES.includes(requestedRole as AllowedRole)) {
    return requestedRole as AllowedRole;
  }

  if (typeof businessName === "string" && businessName.trim().length > 0) {
    return "seller";
  }

  if (typeof existingRole === "string" && existingRole.length > 0) {
    return existingRole as AllowedRole;
  }

  return "buyer";
}

/**
 * Backward-compatible resolver used by checkAndPromoteAdmin, whose args shape
 * is { role?, phone?, displayName? } (no businessName). Sellers in that flow
 * are identified by the presence of a business name on the existing user record.
 */
export function resolveRoleForAdminFlow(
  identityEmail: string | undefined,
  requestedRole: string | undefined,
  existingUser: { role?: string | undefined; businessName?: string | undefined } | null,
): AllowedRole {
  if (identityEmail === ADMIN_EMAIL) return "admin";

  if (typeof requestedRole === "string" && ALLOWED_ROLES.includes(requestedRole as AllowedRole)) {
    return requestedRole as AllowedRole;
  }

  if (existingUser && typeof existingUser.businessName === "string" && existingUser.businessName.trim().length > 0) {
    return "seller";
  }

  if (existingUser && typeof existingUser.role === "string" && existingUser.role.length > 0) {
    return existingUser.role as AllowedRole;
  }

  return "buyer";
}
