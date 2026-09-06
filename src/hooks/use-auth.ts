import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";

export function useAuth() {
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.currentUser);
  const { signIn, signOut } = useAuthActions();

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
