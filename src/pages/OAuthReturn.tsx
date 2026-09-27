import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { getDashboardPath } from "../components/RoleRouter";
import {
  clearRememberedReferralCode,
  getRememberedReferralCode,
} from "../lib/referral-client";
import { getVisitorKey } from "../lib/visitor-key";
import { GOOGLE_OAUTH_PENDING_KEY } from "./Auth";

/**
 * OAuth return target (`/oauth/return`): Google redirects here with the
 * one-time Convex sign-in code (?code=...).
 *
 * IMPORTANT: this page must NOT consume the code itself. The
 * ConvexAuthProvider consumes it in its own mount effect, which always runs
 * before this lazily-loaded chunk mounts — when both replayed the code, the
 * second call had already had the PKCE verifier removed from storage and was
 * rejected, leaving the user on a dead spinner or a bogus error card.
 * This page only OBSERVES the session coming live, then:
 *   1. creates/syncs the Nexora profile (a brand-new Google account has no
 *      `users` row yet — previously it spun forever waiting for currentUser),
 *   2. attributes any parked referral code,
 *   3. routes to the dashboard for the resolved role (falling back to /buyer,
 *      whose RoleRouter onboarding gate collects what's still missing).
 * If the session never comes live within 20s (stuck replay, cancelled popup,
 * network hang), an actionable error card replaces the infinite spinner.
 */

// Same key/shape Auth.tsx parks before redirecting to Google. We READ it for
// role/name/referral but do NOT consume it: if the profile ends up pending,
// the /auth page's own effect consumes it to continue registration.
const GOOGLE_INTENT_KEY = "nx_google_intent";
// Key lives in Auth.tsx (set right before the Google redirect; same tab, so
// it survives the round-trip). `?code=` can NOT be used as the handback
// signal: the ConvexAuthProvider strips it from the URL in its mount effect,
// which runs before this lazily-loaded page mounts.
const GOOGLE_PENDING_KEY = GOOGLE_OAUTH_PENDING_KEY;
const GOOGLE_INTENT_TTL = 30 * 60 * 1000;

// Captured once per page load (module scope, NOT a per-mount ref): in StrictMode
// dev the component remounts, and a per-mount read would consume the pending
// marker on the first mount only to lose it on the second.
let oauthHandback = false;
function takeOauthHandback(): boolean {
  if (oauthHandback) return true;
  try {
    if (sessionStorage.getItem(GOOGLE_PENDING_KEY) !== null) {
      sessionStorage.removeItem(GOOGLE_PENDING_KEY);
      oauthHandback = true;
      return true;
    }
  } catch {
    /* non-fatal */
  }
  if (new URLSearchParams(window.location.search).get("code") !== null) {
    oauthHandback = true;
  }
  return oauthHandback;
}

function peekGoogleIntent(): { role?: string; name?: string; refCode?: string } | null {
  try {
    const raw = sessionStorage.getItem(GOOGLE_INTENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.at || Date.now() - parsed.at > GOOGLE_INTENT_TTL) return null;
    return {
      role: typeof parsed.role === "string" && parsed.role ? parsed.role : undefined,
      name: typeof parsed.name === "string" && parsed.name ? parsed.name : undefined,
      refCode:
        typeof parsed.refCode === "string" && parsed.refCode ? parsed.refCode : undefined,
    };
  } catch {
    return null;
  }
}

export default function OAuthReturn() {
  const navigate = useNavigate();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const ensureUserProfile = useMutation(api.users.ensureUserProfile);
  const attributeReferral = useMutation(api.referral.onUserRegistered);

  const user = useQuery(api.users.currentUser) as any;

  // Snapshot the return context ONCE per page load: whether this is a genuine
  // OAuth handback (pending marker parked at sign-in time, or a ?code= still
  // in the URL) and the parked registration intent. StrictMode-safe via refs.
  const hadCodeRef = useRef<boolean>(takeOauthHandback());
  const intentRef = useRef<{ role?: string; name?: string; refCode?: string } | null>(
    peekGoogleIntent(),
  );

  const [stuck, setStuck] = useState(false);

  // Recovery: if the sign-in never settles, stop spinning. Covers the
  // unhandled-rejection path inside ConvexAuthProvider where isLoading stays
  // true forever after a failed one-time-code replay.
  useEffect(() => {
    if (isAuthenticated) return;
    const timer = setTimeout(() => setStuck(true), 20_000);
    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  // A finished-but-failed handback: loading settled, no session, and a code
  // was present on arrival (so this is not just a stray page visit).
  const replayFailed = !isLoading && !isAuthenticated && hadCodeRef.current;

  // 1) Create/sync the Nexora profile once the session is live. This is the
  //    only chance a Google-only signup gets — /oauth/return is the sole
  //    entrypoint for them, so the profile must be ensured HERE.
  const profileSyncRef = useRef(false);
  useEffect(() => {
    if (!isAuthenticated || profileSyncRef.current) return;
    profileSyncRef.current = true;
    const intent = intentRef.current;
    const needsRole = !!user && !user.role;
    // New accounts (no row yet) need name + role from the parked intent;
    // existing accounts only need the role repair when missing.
    if (!user || needsRole) {
      const syncRole = intent?.role;
      const syncName = intent?.name;
      void ensureUserProfile({
        name: syncName,
        role: syncRole,
        businessName: syncRole === "seller" ? syncName || undefined : undefined,
      }).catch((err) => {
        // Non-fatal: the /auth self-heal (use-auth) retries the sync.
        console.error("OAuth profile sync failed:", err);
        profileSyncRef.current = false;
      });
    }
    // Referral attribution from the parked intent (best-effort, mirrors /auth).
    const refCode = intent?.refCode || getRememberedReferralCode() || "";
    if (refCode) {
      void attributeReferral({ code: refCode, visitorKey: getVisitorKey() })
        .then((result: any) => {
          if (result?.attributed) clearRememberedReferralCode();
        })
        .catch((err) => console.error("OAuth referral attribution failed:", err));
    }
  }, [isAuthenticated, user, ensureUserProfile, attributeReferral]);

  // 2) Route by role once the session is live and the profile row exists.
  useEffect(() => {
    if (stuck || replayFailed) return;
    if (isLoading || !isAuthenticated) return;
    if (user === undefined) return; // profile row not loaded yet
    if (!user) {
      // Authenticated but still no profile row (sync failed) — /auth's
      // self-heal retries the sync and routes from there.
      navigate("/auth", { replace: true });
      return;
    }
    const role = (user.role as string | undefined) ?? intentRef.current?.role;
    // Pending / role-less accounts go to a protected panel: RoleRouter's
    // verification gate collects name/phone/role inline before rendering it.
    // A stored pendingRole is the registration the user already started —
    // route there so the gate collects THAT role's steps (seller store
    // details, provider service area, …) instead of defaulting to buyer.
    // (getDashboardPath returns an /auth path for null/unknown roles — /auth
    // cannot onboard a signed-in pending account, so fall back to /buyer.)
    const pendingRole =
      typeof (user as any).pendingRole === "string" && (user as any).pendingRole
        ? ((user as any).pendingRole as string)
        : null;
    const target = getDashboardPath(role ?? pendingRole ?? null);
    navigate(target.startsWith("/auth") ? "/buyer" : target, { replace: true });
  }, [isLoading, isAuthenticated, user, stuck, replayFailed, navigate]);

  // 3) No code on arrival and no session — not an OAuth handback at all.
  useEffect(() => {
    if (!hadCodeRef.current && !isAuthenticated && !isLoading && !stuck) {
      navigate("/auth", { replace: true });
    }
  }, [isLoading, isAuthenticated, stuck, navigate]);

  if (replayFailed || stuck) {
    const timedOut = stuck && !replayFailed;
    return (
      <div className="min-h-screen bg-nx-surface flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-xl border border-white/10 bg-white/5 p-6 text-center">
          <h1 className="text-lg font-semibold text-white mb-2">Sign-in problem</h1>
          <p className="text-sm text-white/60 mb-4">
            {timedOut
              ? "Google sign-in is taking too long. It may have been interrupted — please try again."
              : "Google sign-in could not be completed. Please try again."}
          </p>
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
