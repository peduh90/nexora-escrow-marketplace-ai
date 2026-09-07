import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useEffect } from "react";

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
  // still being set up" spinner. Role inference follows the project
  // convention: businessName ⇒ seller, otherwise buyer.
  useEffect(() => {
    if (isAuthLoading || !isAuthenticated) {
      roleRepairFired = false;
      return;
    }
    if (user && !user.role && !roleRepairFired) {
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