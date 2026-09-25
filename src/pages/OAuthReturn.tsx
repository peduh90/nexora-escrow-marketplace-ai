import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { useConvexAuth, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../convex/_generated/api";

/**
 * OAuth return target (`/oauth/return`): Google redirects here with the
 * one-time Convex sign-in code (?code=...). The ConvexAuthProvider normally
 * consumes that code only on the page where sign-in started — if the browser
 * lands on a different origin/path (or the app remounted), this page replays
 * the code via signIn(undefined, { code }) which completes the session.
 */
export default function OAuthReturn() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signIn } = useAuthActions();
  const replayRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const user = useQuery(api.users.currentUser) as any;
  const role = user?.role as string | undefined;

  // 1) Consume the one-time code exactly once per mount.
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    if (!code || replayRef.current) return;
    replayRef.current = true;
    // Strip the code from the address bar, then hand it to Convex Auth.
    const url = new URL(window.location.href);
    url.searchParams.delete("code");
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    void (async () => {
      try {
        // Server contract: auth:signIn with NO provider + params.code runs the
        // one-time-code path (see @convex-dev/auth signInImpl). The TS type only
        // allows a string provider, hence the cast.
        await (signIn as unknown as (
          provider: undefined,
          args: { code: string },
        ) => Promise<unknown>)(undefined, { code });
      } catch (err) {
        console.error("OAuth code replay failed:", err);
        setError("Google sign-in could not be completed. Please try again.");
      }
    })();
  }, [signIn]);

  // 2) Route by role once the session is live.
  useEffect(() => {
    if (isLoading || !isAuthenticated || error) return;
    if (!user) return; // profile row not loaded yet
    const target =
      role === "admin"
        ? "/admin"
        : role === "seller" || role === "driver"
        ? "/seller"
        : role === "service_provider"
        ? "/services/dashboard"
        : role === "freelancer" || role === "ai_tasker"
        ? "/freelance/dashboard"
        : role === "employer"
        ? "/employer"
        : role === "creator"
        ? "/creator"
        : "/buyer";
    navigate(target, { replace: true });
  }, [isLoading, isAuthenticated, user, role, error, navigate]);

  // 3) No code present and not signing in — not an OAuth return at all.
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    if (!code && !isAuthenticated && !isLoading) {
      navigate("/auth", { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-nx-surface flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-xl border border-white/10 bg-white/5 p-6 text-center">
          <h1 className="text-lg font-semibold text-white mb-2">Sign-in problem</h1>
          <p className="text-sm text-white/60 mb-4">{error}</p>
          <button
            onClick={() => navigate("/auth", { replace: true })}
            className="rounded-lg bg-nx-violet px-4 py-2 text-sm font-medium text-white hover:bg-nx-violet/80"
          >
            Back to sign-in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nx-surface flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-nx-violet border-t-transparent" />
        <p className="text-sm text-white/50">
          {isLoading || !isAuthenticated ? "Completing Google sign-in…" : "Opening your dashboard…"}
        </p>
      </div>
    </div>
  );
}
