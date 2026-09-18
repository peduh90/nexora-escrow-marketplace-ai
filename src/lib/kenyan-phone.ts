/**
 * ─── KENYAN PHONE VALIDATION (M-PESA GRADE) ────────────────────────────────
 *
 * One strict validator shared by BOTH the client (instant feedback) and the
 * Convex server (authoritative gate). Registration cannot be completed with a
 * fake, malformed, or non-Kenyan number — Nexora is Kenya-first and every
 * account's phone is its M-Pesa / delivery lifeline.
 *
 * Accepts ONLY real Kenyan mobile formats:
 *   07XXXXXXXX / 01XXXXXXXX             (local, 10 digits)
 *   +2547XXXXXXXX / 2541XXXXXXXX        (international)
 *   2547XXXXXXXX / 2541XXXXXXXX         (raw international, no +)
 *   00254...                            (international dial-out prefix)
 *
 * Rejects: repeated digits (1111111111), sequential runs (1234567890), the
 * obvious placeholders, and any number whose length or prefix doesn't match a
 * genuine Kenyan mobile network.
 *
 * Framework-agnostic: no React, no Convex imports — safe in both worlds.
 */

export const KE_PHONE_MIN_DIGITS = 9;

/** Digit-only form of any phone input (strips +, spaces, dashes, parens). */
export function digitsOnly(phone: string): string {
  return (phone || "").replace(/[^0-9]/g, "");
}

/**
 * Normalize ANY accepted Kenyan format to the canonical 2547XXXXXXXX form
 * used across Nexora (M-Pesa, wallet, delivery). Returns null when the
 * number can't be normalized (invalid format).
 */
export function normalizeKenyanPhone(input: string): string | null {
  const raw = (input || "").trim();
  if (!raw) return null;

  let d = digitsOnly(raw);

  // "00254..." → strip the international dial-out prefix.
  if (d.startsWith("00254")) d = d.slice(2);

  // Leading single 0 (local format): drop it, then expect subscriber next.
  if (d.startsWith("0")) d = d.slice(1);

  // Canonical international form: 254 + 9-digit subscriber.
  if (d.startsWith("254")) {
    d = d.slice(3);
  } else if (!(d.length === 9 && (d.startsWith("7") || d.startsWith("1")))) {
    return null;
  }

  if (d.length !== 9) return null;
  if (!/^7[0-9]{8}$|^1[0-9]{8}$/.test(d)) return null;

  return `254${d}`;
}

/** Strong structural Kenyan mobile check (format + plausibility). */
export function isValidKenyanPhone(input: string): boolean {
  const normalized = normalizeKenyanPhone(input);
  if (!normalized) return false;
  return isPlausibleKenyanSubscriber(normalized.slice(3));
}

/** Same check plus a human-readable reason for UI error messages. */
export function kenyanPhoneError(input: string): string | null {
  const raw = (input || "").trim();
  if (!raw) return "Phone number is required.";

  const d = digitsOnly(raw);
  if (d.length < 9) return "Phone number is too short — enter a real Kenyan number.";

  const normalized = normalizeKenyanPhone(raw);
  if (!normalized) {
    return "Enter a valid Kenyan mobile number — e.g. 0712 345 678 or +254712345678.";
  }

  const subscriber = normalized.slice(3);
  if (!isPlausibleKenyanSubscriber(subscriber)) {
    return "That number looks fake. Enter the real mobile number you use for M-Pesa.";
  }

  return null;
}

/**
 * Plausibility gate on the 9-digit subscriber part: rejects all-same digits,
 * simple sequences (ascending/descending runs), and the obvious placeholders.
 * Keeps real numbers flowing while cutting the "111111111"-class junk that
 * fake registrations used.
 */
export function isPlausibleKenyanSubscriber(sub: string): boolean {
  if (!/^[0-9]{9}$/.test(sub)) return false;

  // All identical digits: 111111111, 777777777 …
  if (/^(\d)\1{8}$/.test(sub)) return false;

  // Pure ascending or descending runs: 123456789 / 987654321.
  let ascending = true;
  let descending = true;
  for (let i = 1; i < sub.length; i++) {
    if (sub.charCodeAt(i) - sub.charCodeAt(i - 1) !== 1) ascending = false;
    if (sub.charCodeAt(i - 1) - sub.charCodeAt(i) !== 1) descending = false;
  }
  if (ascending || descending) return false;

  // Well-known fake patterns.
  if (sub === "000000000" || sub === "123456789" || sub === "987654321") return false;

  return true;
}
