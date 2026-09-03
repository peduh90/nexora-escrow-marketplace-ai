import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader2, ShieldAlert, Shield } from "lucide-react";
import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useEffect, useState } from "react";

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated, user } = useAuth();
  const checkAndPromoteAdmin = useMutation(api.users.checkAndPromoteAdmin);
  const [promoting, setPromoting] = useState(false);
  const [promoted, setPromoted] = useState(false);
  const [showDenied, setShowDenied] = useState(false);

  const admin2FAStatus = useQuery(
    api.adminAuth.isAdmin2FAEnabled,
    isAuthenticated && user?.role === "admin" ? {} : "skip"
  );

  // Auto-promote admin email when they visit /admin
  useEffect(() => {
    if (!isLoading && isAuthenticated && user && user.role !== "admin" && !promoting && !promoted && !showDenied) {
      setPromoting(true);
      checkAndPromoteAdmin()
        .then((result) => {
          if (result?.promoted) {
            setPromoted(true);
          } else {
            // Not auto-promoted — show access denied after a short delay
            // (gives Convex reactive query time to update role if it changed)
            setTimeout(() => {
              setPromoting(false);
              setShowDenied(true);
            }, 2000);
            return;
          }
        })
        .catch(() => {
          setTimeout(() => {
            setPromoting(false);
            setShowDenied(true);
          }, 1000);
        })
        .finally(() => {
          if (!promoted) setPromoting(false);
        });
    }
  }, [isLoading, isAuthenticated, user, promoting, promoted, showDenied, checkAndPromoteAdmin]);

  // Loading state — show briefly while checking
  if (isLoading || promoting) {
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

  // Check if user has admin role (after promotion attempt)
  if (user?.role !== "admin" && !promoted) {
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
          <div className="flex flex-col gap-3">
            <a
              href="/"
              className="px-6 py-2.5 rounded-lg bg-nx-gold text-black text-sm font-medium hover:bg-nx-gold/80 transition-colors inline-block"
            >
              Return to Home
            </a>
            <a
              href="https://wa.me/254706116043?text=Hello%2C%20I%20need%20admin%20access%20for%20Nexora%20Market%20admin%20panel.%20My%20email%20is%3A%20"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors inline-flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Request Admin Access via WhatsApp
            </a>
          </div>
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
