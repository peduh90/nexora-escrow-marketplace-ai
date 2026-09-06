import { useAuth } from "@/hooks/use-auth";
import { Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import { Navigate } from "react-router";

interface RoleRouterProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function RoleRouter({ children, allowedRoles }: RoleRouterProps) {
  const { isLoading, isAuthenticated, user } = useAuth();

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (!user) {
    // Auth identity present but no Nexora profile yet: sync flow must handle this.
    // Do NOT guess role or redirect to /buyer.
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        <span className="sr-only">Loading account profile...</span>
      </main>
    );
  }

  const role = user?.role;

  if (!role) {
    // Persistent profile exists but role field is missing — this is an account
    // configuration problem, not a buyer account. Show a real error, do not
    // silently downgrade to buyer.
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center p-6 max-w-sm">
          <Loader2 className="size-8 animate-spin text-amber-400 mx-auto mb-3" />
          <p className="text-sm text-white/70">Your account profile is still being set up.</p>
          <p className="text-xs text-white/30 mt-1">Please wait a moment and refresh.</p>
        </div>
      </main>
    );
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect to the correct panel for this role
    const roleRedirects: Record<string, string> = {
      admin: "/admin",
      seller: "/seller",
      buyer: "/buyer",
      freelancer: "/freelance/dashboard",
      employer: "/employer",
      driver: "/driver",
    };
    const target = roleRedirects[role];
    if (target) {
      return <Navigate to={target} replace />;
    }
    // Unknown role — do not default to buyer
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center p-6 max-w-sm">
          <ShieldAlert className="size-8 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-white/70">Your account role is not recognised.</p>
          <p className="text-xs text-white/30 mt-1">Contact Nexora support if this persists.</p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}

// Get the dashboard root path for the current user's role.
// Unknown roles do NOT default to /buyer — the caller must handle the missing
// role through the auth/profile sync path instead.
export function getDashboardPath(role?: string | null): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "seller":
      return "/seller";
    case "buyer":
      return "/buyer";
    case "freelancer":
      return "/freelance/dashboard";
    case "employer":
      return "/employer";
    case "driver":
      return "/driver";
    default:
      return "/auth?returnTo=/";
  }
}

export function getDefaultRedirect(role?: string | null): string {
  return getDashboardPath(role);
}
