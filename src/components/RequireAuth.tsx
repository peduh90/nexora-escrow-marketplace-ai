import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { Link, Navigate, useLocation } from "react-router";

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
    // Auth identity present but no Nexora user record — let the auth flow repair it.
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-amber-400" />
        <span className="sr-only">Loading account profile...</span>
      </main>
    );
  }

  if (!user.role) {
    // Profile exists but role has not been set — do not assume buyer.
    // Offer a real exit instead of leaving the user on an infinite spinner:
    // finishing the sign-up flow on /auth repairs the role (server-side) and
    // routes back here.
    const returnTo = location.pathname + location.search;
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center p-6 max-w-sm">
          <Loader2 className="size-8 animate-spin text-amber-400 mx-auto mb-3" />
          <p className="text-sm text-white/70">Your account is still being set up.</p>
          <p className="text-xs text-white/30 mt-1">
            Finish your sign-up to activate this account.
          </p>
          <Link
            to={`/auth?returnTo=${encodeURIComponent(returnTo)}`}
            className="mt-4 inline-flex items-center rounded-lg bg-nx-violet px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-nx-violet/80"
          >
            Finish Account Setup
          </Link>
        </div>
      </main>
    );
  }

  return children;
}
