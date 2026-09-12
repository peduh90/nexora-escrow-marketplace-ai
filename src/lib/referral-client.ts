/**
 * Client half of referral attribution.
 *
 * The /join landing page records the click server-side; right after
 * registration the Auth flow sends the remembered code + visitor key to the
 * backend, which re-verifies the click and binds the account to the creator —
 * permanently, server-side. The backend refuses attribution without a matching
 * tracked click, so the client cannot fabricate or move referrals.
 *
 * The code is remembered briefly (7 days) so a visitor who clicked a link but
 * registered in a different tab or later visit is still attributed, matching
 * the server's own 30-day click-proof window.
 */

const CODE_KEY = "nx_ref_code";
const AT_KEY = "nx_ref_at";
const WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export function rememberReferralCode(code: string) {
  const clean = (code || "").trim().toUpperCase();
  if (!clean) return;
  try {
    localStorage.setItem(CODE_KEY, clean);
    localStorage.setItem(AT_KEY, String(Date.now()));
  } catch {
    /* non-fatal */
  }
}

export function getRememberedReferralCode(): string | null {
  try {
    const code = localStorage.getItem(CODE_KEY);
    const at = Number(localStorage.getItem(AT_KEY) || 0);
    if (!code) return null;
    if (!at || Date.now() - at > WINDOW_MS) {
      localStorage.removeItem(CODE_KEY);
      localStorage.removeItem(AT_KEY);
      return null;
    }
    return code;
  } catch {
    return null;
  }
}

/** Cleared after successful attribution so the same device can't re-claim. */
export function clearRememberedReferralCode() {
  try {
    localStorage.removeItem(CODE_KEY);
    localStorage.removeItem(AT_KEY);
  } catch {
    /* non-fatal */
  }
}
