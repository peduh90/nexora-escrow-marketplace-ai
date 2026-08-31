import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
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

  const role = user?.role || "buyer";

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect to the appropriate panel based on role
    const roleRedirects: Record<string, string> = {
      admin: "/admin",
      seller: "/seller",
      buyer: "/buyer",
      driver: "/driver",
    };
    return <Navigate to={roleRedirects[role] || "/buyer"} replace />;
  }

  return <>{children}</>;
}

// Get the dashboard root path for the current user's role
export function getDashboardPath(role?: string): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "seller":
      return "/seller";
    case "buyer":
    default:
      return "/buyer";
  }
}

// Default redirect after auth based on role
export function getDefaultRedirect(role?: string): string {
  return getDashboardPath(role);
}
