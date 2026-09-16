import { useAuth } from "@/hooks/use-auth";
import { Loader2, ShieldAlert, CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { Navigate } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";

// Must match ADMIN_EMAIL in src/convex/users.ts and OWNER_EMAIL in
// src/hooks/use-auth.ts — the platform owner is never blocked by the
// buyer-oriented verification gate.
const OWNER_EMAIL = "murimiedwin227@gmail.com";

interface RoleRouterProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

/**
 * Panel access gate. A user must be fully verified (accountStatus "active"
 * with an assigned role) before any panel renders. Pending users are held on
 * an onboarding screen that shows exactly what is left to complete and lets
 * them finish verification inline — the role is only assigned server-side
 * (completeVerification) once every requirement is met.
 */
export function RoleRouter({ children, allowedRoles }: RoleRouterProps) {
  const { isLoading, isAuthenticated, user } = useAuth();
  const onboarding = useQuery(api.users.getOnboardingStatus);
  const completeVerification = useMutation(api.users.completeVerification);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Inline inputs so the user can actually complete pending steps here.
  // (Previously the screen listed pending requirements with no way to fill
  // them in, so "Finish verification" stayed disabled forever.)
  const [nameInput, setNameInput] = useState<string | null>(null);
  const [phoneInput, setPhoneInput] = useState<string | null>(null);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05050A]">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05050A]">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        <span className="sr-only">Loading account profile...</span>
      </main>
    );
  }

  const role = user?.role;
  const accountStatus = (user as any)?.accountStatus;

  // ── Verification gate ──
  // A user with no role yet is unverified by definition, regardless of the
  // stored accountStatus, so they never reach a panel. Show onboarding.
  // Admins (including the platform owner) are exempt: this buyer-oriented
  // name/phone gate must never be able to trap the admin out of the panel.
  const isOwner =
    typeof (user as any)?.email === "string" &&
    (user as any).email === OWNER_EMAIL;
  const isUnverified =
    (!role || accountStatus === "pending") && role !== "admin" && !isOwner;

  // ── Suspension gate ──
  // A suspended account is blocked from every panel (admins/owner exempt).
  if (accountStatus === "suspended" && role !== "admin" && !isOwner) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05050A] px-4">
        <div className="w-full max-w-md rounded-2xl border border-red-400/10 bg-[#0A0A12]/90 p-8 shadow-2xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-400/10 flex items-center justify-center mx-auto mb-5">
            <ShieldAlert className="w-7 h-7 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white text-center">Account suspended</h1>
          <p className="text-sm text-white/40 text-center mt-2">
            Your Nexora account has been suspended by an administrator.
            {(user as any)?.suspensionReason
              ? ` Reason: ${(user as any).suspensionReason}.`
              : ""}{" "}
            Contact support if you believe this is a mistake.
          </p>
          <button
            onClick={() => { window.location.href = "/"; }}
            className="mt-6 w-full py-3 rounded-xl bg-white/[0.03] border border-white/5 text-white/60 text-sm font-medium hover:bg-white/[0.06] transition-colors"
          >
            Back to home
          </button>
        </div>
      </main>
    );
  }

  if (isUnverified) {
    if (!onboarding || onboarding.authenticated === false) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-[#05050A]">
          <Loader2 className="size-8 animate-spin text-nx-violet" />
        </main>
      );
    }

    const reqs = onboarding.requirements ?? [];

    // Effective values: local edits win over the stored profile.
    const effName = (nameInput ?? onboarding.profile?.name ?? "").trim();
    const effPhone = (phoneInput ?? onboarding.profile?.phone ?? "").trim();
    const reqMet = (key: string, extra: boolean) =>
      !!reqs.find((r: any) => r.key === key)?.met || extra;
    const emailMet = reqMet("email", false);
    const nameMet = reqMet("name", effName.length > 1);
    const phoneMet = reqMet("phone", effPhone.replace(/[^0-9]/g, "").length >= 9);
    const allMet = emailMet && nameMet && phoneMet;

    const handleComplete = async () => {
      setSubmitting(true);
      setError(null);
      try {
        const result = await completeVerification({
          name: effName || undefined,
          phone: effPhone || undefined,
        });
        if (result?.role) {
          // Reload so the auth hook picks up the newly assigned role.
          window.location.reload();
        }
      } catch (err: any) {
        setError(err?.message || "Could not complete verification.");
        setSubmitting(false);
      }
    };

    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05050A] px-4">
        <div className="w-full max-w-md rounded-2xl border border-white/5 bg-[#0A0A12]/90 p-8 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-400/10 flex items-center justify-center mx-auto mb-5">
            <ShieldAlert className="w-7 h-7 text-amber-400" />
          </div>
          <h1 className="text-xl font-bold text-white text-center">Complete your verification</h1>
          <p className="text-sm text-white/40 text-center mt-2">
            Your account is not verified yet. Panel access unlocks once every step below is complete.
          </p>

          <div className="mt-6 space-y-2.5">
            {reqs.map((r: any) => {
              const rowMet =
                r.met ||
                (r.key === "name" && nameMet) ||
                (r.key === "phone" && phoneMet);
              const showNameInput = !rowMet && r.key === "name";
              const showPhoneInput = !rowMet && r.key === "phone";
              return (
                <div
                  key={r.key}
                  className={`p-3 rounded-lg border ${
                    rowMet
                      ? "border-nx-emerald/20 bg-nx-emerald/5"
                      : "border-white/5 bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {rowMet ? (
                      <CheckCircle2 className="w-4 h-4 text-nx-emerald shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-white/25 shrink-0" />
                    )}
                    <span className={`text-sm ${rowMet ? "text-white/70" : "text-white"}`}>
                      {r.label}
                    </span>
                    <span
                      className={`ml-auto text-[10px] px-2 py-0.5 rounded-full ${
                        rowMet
                          ? "bg-nx-emerald/10 text-nx-emerald"
                          : "bg-white/5 text-white/40"
                      }`}
                    >
                      {rowMet ? "Done" : "Pending"}
                    </span>
                  </div>
                  {showNameInput && (
                    <input
                      type="text"
                      value={effName}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="Enter your full name, e.g. Jane Wanjiku"
                      autoComplete="name"
                      className="mt-2.5 w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-nx-violet/40"
                    />
                  )}
                  {showPhoneInput && (
                    <input
                      type="tel"
                      value={effPhone}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="M-Pesa number, e.g. 07XX XXX XXX"
                      autoComplete="tel"
                      className="mt-2.5 w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-nx-violet/40"
                    />
                  )}
                </div>
              );
            })}
          </div>

          {onboarding.requestedRole === "seller" && (
            <p className="text-[11px] text-white/30 mt-4">
              Your store details are saved — finish the steps above to open your seller panel.
            </p>
          )}

          {error && <p className="text-sm text-red-400 mt-4">{error}</p>}

          <button
            onClick={handleComplete}
            disabled={!allMet || submitting}
            className="mt-6 w-full py-3 rounded-xl bg-nx-violet hover:bg-nx-violet/80 text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
            ) : allMet ? (
              <>Finish verification <ArrowRight className="w-4 h-4" /></>
            ) : (
              "Complete the steps above to continue"
            )}
          </button>

          <button
            onClick={() => { window.location.href = "/"; }}
            className="mt-3 w-full text-center text-xs text-white/30 hover:text-white/50 transition-colors"
          >
            Back to home
          </button>
        </div>
      </main>
    );
  }

  if (allowedRoles && !allowedRoles.includes(role as string)) {
    // Redirect to the correct panel for this role
    const roleRedirects: Record<string, string> = {
      admin: "/admin",
      seller: "/seller",
      buyer: "/buyer",
      freelancer: "/freelance/dashboard",
      employer: "/employer",
      creator: "/creator",
    };
    const target = roleRedirects[role as string];
    if (target) {
      return <Navigate to={target} replace />;
    }
    // Unknown role — do not default to buyer
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05050A]">
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
    case "creator":
      return "/creator";
    default:
      return "/auth?returnTo=/";
  }
}

export function getDefaultRedirect(role?: string | null): string {
  return getDashboardPath(role);
}
