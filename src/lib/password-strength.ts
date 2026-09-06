const COMMON_PASSWORDS = new Set([
  "password", "12345678", "123456789", "1234567890", "qwerty", "qwerty123",
  "abc123", "letmein", "welcome", "admin123", "nexora", "market", "seller",
  "buyer", "escrow", "mpesa", "junior", "senior", "test123", "test1234",
]);

export function validatePasswordRules(password: string): {
  ok: boolean;
  minLength: boolean;
  uppercase: boolean;
  lowercase: boolean;
  digit: boolean;
  symbol: boolean;
  common: boolean;
} {
  return {
    ok: false,
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    digit: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
    common: COMMON_PASSWORDS.has(password.toLowerCase()),
  };
}

export type PasswordRequirement =
  | { label: "At least 8 characters"; met: boolean }
  | { label: "One uppercase letter"; met: boolean }
  | { label: "One lowercase letter"; met: boolean }
  | { label: "One number"; met: boolean }
  | { label: "One symbol (e.g. ! @ # $)"; met: boolean }
  | { label: "Not a common password"; met: boolean };

export function passwordRequirements(p: string): PasswordRequirement[] {
  const r = validatePasswordRules(p);
  return [
    { label: "At least 8 characters", met: r.minLength },
    { label: "One uppercase letter", met: r.uppercase },
    { label: "One lowercase letter", met: r.lowercase },
    { label: "One number", met: r.digit },
    { label: "One symbol (e.g. ! @ # $)", met: r.symbol },
    { label: "Not a common password", met: !r.common },
  ];
}

export type PasswordStrength =
  | { level: "too-short" }
  | { level: "weak"; score: number; text: string; color: string }
  | { level: "fair"; score: number; text: string; color: string }
  | { level: "strong"; score: number; text: string; color: string }
  | { level: "very-strong"; score: number; text: string; color: string };

export function passwordStrength(password: string): PasswordStrength {
  if (password.length === 0) {
    return { level: "too-short" };
  }
  if (password.length < 8) {
    return { level: "weak", score: Math.max(1, Math.floor((password.length / 8) * 20)), text: "Too short", color: "text-red-400" };
  }

  const r = validatePasswordRules(password);
  let score = 0;

  if (r.minLength) score += 15;
  if (r.lowercase) score += 15;
  if (r.uppercase) score += 20;
  if (r.digit) score += 20;
  if (r.symbol) score += 20;
  if (!r.common) score += 10;

  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;

  if (score <= 40) {
    return { level: "weak", score, text: "Weak — add more variety", color: "text-red-400" };
  }
  if (score <= 65) {
    return { level: "fair", score, text: "Fair — almost there", color: "text-amber-400" };
  }
  if (score <= 85) {
    return { level: "strong", score, text: "Strong password", color: "text-emerald-400" };
  }
  return { level: "very-strong", score, text: "Very strong", color: "text-emerald-300" };
}

export function isPasswordValid(password: string): boolean {
  if (password.length === 0) return false;
  const r = validatePasswordRules(password);
  return r.minLength && r.uppercase && r.lowercase && r.digit && r.symbol && !r.common;
}

export const PASSWORD_HINT =
  "Use 8+ characters with uppercase, lowercase, a number, and a symbol. Avoid common words.";
