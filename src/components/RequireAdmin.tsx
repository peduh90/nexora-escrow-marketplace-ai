import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader2, ShieldAlert, Home } from "lucide-react";
import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useEffect, useRef, useState } from "react";

/**
 * Admin route guard.
 *
 * Authorization is 100% server-authoritative: `api.users.isAdmin` is a live
 * Convex subscription over the session's own user record, so the panel opens
 * the instant the server says "admin" and closes the moment it stops. There is
 * deliberately no client-side role caching or self-service promotion here —
 * the only bootstrap is `ensureAdminAccess`, which flips the platform owner
 * (ADMIN_EMAIL) to admin server-side and reports the authoritative state.
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated, user } = useAuth();
  const isAdmin = useQuery(api.users.isAdmin, isAuthenticated ? {} : "skip");
  const ensureAdminAccess = useMutation(api.users.ensureAdminAccess);
  const bootstrapping = useRef(false);
  const [bootstrapDone, setBootstrapDone] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  const needsBootstrap = isAuthenticated && !!user && isAdmin === false;

  useEffect(() => {
    if (!needsBootstrap || bootstrapping.current) return;
    bootstrapping.current = true;
    setBootstrapDone(false);
    ensureAdminAccess({})
      .then(() => {
        setBootstrapError(null);
        setBootstrapDone(true);
      })
      .catch((err: any) => {
        setBootstrapError(err?.message || "Admin verification failed");
        setBootstrapDone(true);
      })
      .finally(() => {
        bootstrapping.current = false;
      });
  }, [needsBootstrap, ensureAdminAccess]);

  if (isLoading || (isAuthenticated && isAdmin === undefined)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05050A]">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth?returnTo=/admin" replace />;
  }

  // Owner bootstrap in flight — hold the spinner until the server reports the
  // promoted state so the admin never sees a denied flash.
  if (isAdmin !== true && !bootstrapDone && needsBootstrap) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05050A]">
        <div className="text-center">
          <Loader2 className="size-8 animate-spin text-nx-violet mx-auto mb-3" />
          <p className="text-white/40 text-sm">Verifying admin access...</p>
        </div>
      </main>
    );
  }

  if (isAdmin !== true) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05050A] px-4">
        <div className="text-center p-8 max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-red-400/10 flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Admin Access Required</h1>
          <p className="text-white/40 mb-2">
            Your account (<span className="text-white/60">{user?.email}</span>) does not have administrator privileges.
          </p>
          <p className="text-white/25 text-xs mb-8">
            Only authorized administrators can access this panel. If you believe you should have access, contact the platform owner.
          </p>
          {bootstrapError && <p className="text-sm text-amber-400 mb-4">{bootstrapError}</p>}
          <a
            href="/"
            className="px-6 py-2.5 rounded-lg bg-nx-violet text-white text-sm font-medium hover:bg-nx-violet/80 transition-colors inline-flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Return to Home
          </a>
        </div>
      </main>
    );
  }

  return children;
}
