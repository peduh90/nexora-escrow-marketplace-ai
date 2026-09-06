import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";

// NOTE: RequireAuth now requires the user record to be loaded via useAuth
// before it can authorise. If the user record has not loaded yet the component
// falls through to the loading state above.
const { user } = useAuth();

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();
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

  if (!user?.role) {
    // Profile exists but role has not been set — do not assume buyer.
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center p-6 max-w-sm">
          <Loader2 className="size-8 animate-spin text-amber-400 mx-auto mb-3" />
          <p className="text-sm text-white/70">Your account is still being set up.</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/auth?returnTo=${encodeURIComponent(returnTo)}`}
        replace
      />
    );
  }

  return children;
}
