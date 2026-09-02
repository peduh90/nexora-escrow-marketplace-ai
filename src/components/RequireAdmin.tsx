import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader2, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useEffect, useState } from "react";

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated, user } = useAuth();
  const checkAndPromoteAdmin = useMutation(api.users.checkAndPromoteAdmin);
  const [promoting, setPromoting] = useState(false);
  const [promoted, setPromoted] = useState(false);

  const admin2FAStatus = useQuery(
    api.adminAuth.isAdmin2FAEnabled,
    isAuthenticated && user?.role === "admin" ? {} : "skip"
  );

  // Auto-promote admin email when they visit /admin
  useEffect(() => {
    if (!isLoading && isAuthenticated && user && user.role !== "admin" && !promoting && !promoted) {
      setPromoting(true);
      checkAndPromoteAdmin()
        .then((result) => {
          if (result?.promoted) {
            setPromoted(true);
          }
        })
        .catch(() => {})
        .finally(() => setPromoting(false));
    }
  }, [isLoading, isAuthenticated, user, promoting, promoted, checkAndPromoteAdmin]);

  // After promotion, Convex reactive query will re-run and user.role will update automatically.
  // Show loading until the role updates or we've already promoted.
  if (isLoading || promoting || (isAuthenticated && user?.role !== "admin" && !promoted)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05050A]">
        <div className="text-center">
          <Loader2 className="size-8 animate-spin text-nx-gold mx-auto mb-3" />
          <p className="text-white/40 text-sm">Verifying admin access...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/auth?returnTo=/admin"
        replace
      />
    );
  }

  // Check if user has admin role
  if (user?.role !== "admin") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05050A]">
        <div className="text-center p-8">
          <ShieldAlert className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-white/40 mb-6">Your account ({user?.email}) does not have administrator privileges.</p>
          <a
            href="/"
            className="px-6 py-2.5 rounded-lg bg-nx-gold text-black text-sm font-medium hover:bg-nx-gold/80 transition-colors inline-block"
          >
            Return Home
          </a>
        </div>
      </main>
    );
  }

  // Check if admin 2FA is required and not yet verified this session
  if (admin2FAStatus?.enabled) {
    const verified = sessionStorage.getItem("admin2fa_verified");
    if (verified !== "true") {
      return (
        <Navigate to="/auth?returnTo=/admin" replace />
      );
    }
  }

  return children;
}
