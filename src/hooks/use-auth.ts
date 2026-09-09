import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useEffect } from "react";

// Must match ADMIN_EMAIL in src/convex/roles.ts — the platform owner's record
// can be repaired from any panel, not just /admin, so it never gets trapped
// in the buyer panel with no link back to the admin.
const OWNER_EMAIL = "murimiedwin227@gmail.com";

// Module-level guard so the role repair fires at most once per page load —
// useAuth is consumed by many components at once.
let roleRepairFired = false;

export function useAuth() {
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.currentUser);
  const { signIn, signOut } = useAuthActions();
  const ensureUserProfile = useMutation(api.users.ensureUserProfile);

  // Self-heal: if a session exists but the persistent profile has no role yet
  // (a profile sync that failed mid-signup, or a legacy account), patch the
  // role server-side instead of leaving the user on an infinite "account is
  // still being set up" spinner. The server also force-promotes the platform
  // owner (OWNER_EMAIL) to admin + active through the same mutation, which
  // un-sticks a stale buyer/pending record from an older auth flow.
  useEffect(() => {
    if (isAuthLoading || !isAuthenticated) {
      roleRepairFired = false;
      return;
    }
    const email = (user as any)?.email as string | undefined;
    const ownerNeedsPromotion =
      !!email && email.toLowerCase() === OWNER_EMAIL && (user as any)?.role !== "admin";
    if (user && (!user.role || ownerNeedsPromotion) && !roleRepairFired) {
      roleRepairFired = true;
      void ensureUserProfile({}).catch((err) => {
        console.error("Account role repair failed:", err);
        roleRepairFired = false;
      });
    }
  }, [isAuthLoading, isAuthenticated, user, ensureUserProfile]);

  // Derive isLoading directly from the dependencies instead of managing separate state.
  // We wait until the Convex user record is materialised before considering the
  // session ready. This prevents the UI from assuming "buyer" while the profile
  // is still loading (the root cause of the seller -> buyer regression).
  const isLoading = isAuthLoading || user === undefined;
  const role = user?.role ?? null;

  return {
    isLoading,
    isAuthenticated,
    user,
    role,
    signIn,
    signOut,
  };
}