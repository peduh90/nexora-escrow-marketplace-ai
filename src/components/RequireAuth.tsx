import { useAuth } from "@/hooks/use-auth";
import { RoleRouter } from "@/components/RoleRouter";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";

// NOTE: RequireAuth reads the user record via useAuth() *inside* the component
// render, where ConvexAuthProvider is present. Do NOT call useAuth() at module
// scope — that crashes with "Cannot read properties of null (reading 'useContext')"
// because there is no React context outside a component tree.
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        <span className="sr-only">Loading authentication...</span>
      </main>
    );
  }

  if (!user) {
    // Auth identity present but no Nexora user record — the account was either
    // wiped/deleted or the profile never materialised. Don't hang on a spinner:
    // send the user to the auth page so they can sign in with a valid account.
    const returnTo = location.pathname + location.search;
    return <Navigate to={`/auth?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }

  if (!user.role || (user as any).accountStatus === "pending") {
    // Profile exists but the account is not activated yet (no role, or still
    // pending verification). Delegating to RoleRouter is the fix for the old
    // dead-end: its onboarding gate collects name/phone and activates the
    // account server-side (completeVerification), then renders this route.
    // The previous "Finish Account Setup" card just bounced to /auth, where a
    // pending account could NEVER be activated — service-provider signups were
    // trapped on an eternal "still being set up" screen.
    return <RoleRouter>{children}</RoleRouter>;
  }

  return children;
}
