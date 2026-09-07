import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAuth } from "@/hooks/use-auth";
import {
  ArrowRight, Loader2, Shield, ShoppingBag, Store, ChevronRight, Check,
  Lock, Globe, Zap, Phone, User, ArrowLeft, KeyRound, Mail,
} from "lucide-react";
import { Suspense, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { isPasswordValid } from "@/lib/password-strength";
import { PasswordField } from "@/components/ui/password-field";

interface AuthProps {
  redirectAfterAuth?: string;
  /** Dedicated seller registration panel — skips "Choose Your Path" entirely. */
  sellerFirst?: boolean;
}

function resolveRedirectAfterAuth(returnTo: string | null, fallback = "/buyer") {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

type AuthStep = "roleSelect" | "signIn" | { email: string } | "adminEmail" | "adminOtp";

function Auth({ redirectAfterAuth, sellerFirst }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // After authentication settles, route to the dashboard that matches the
  // persistent user role. Do NOT default authenticated users to /buyer.
  const redirect = resolveRedirectAfterAuth(searchParams.get("returnTo"), "/auth");
  const isAdminLogin = redirect === "/admin";
  const isSellerRegister = sellerFirst === true;

  // Dedicated seller panel: the role is fixed to seller, so we start straight
  // at the seller sign-up form instead of the "Choose Your Path" role cards.
  const [step, setStep] = useState<AuthStep>(
    isAdminLogin ? "adminEmail" : isSellerRegister ? "signIn" : "roleSelect",
  );
  const [selectedRole, setSelectedRole] = useState<"buyer" | "seller" | "freelancer" | null>(
    isSellerRegister ? "seller" : null,
  );
  // On the dedicated seller panel, toggle between creating an account and
  // signing in to an existing one.
  const [sellerMode, setSellerMode] = useState<"register" | "login">("register");
  // The dedicated seller panel renders the sign-in form (instead of account
  // creation) whenever it is switched to login mode.
  const sellerPanelLogin = sellerFirst === true && !isAdminLogin && sellerMode === "login";
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // ---- Strong password auth fields (shared across all panels) ----
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordValid, setPasswordValid] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  const [adminEmail, setAdminEmail] = useState("");
  const [adminError, setAdminError] = useState<string | null>(null);

  const checkAndPromoteAdmin = useMutation(api.users.checkAndPromoteAdmin);
  const ensureUserProfile = useMutation(api.users.ensureUserProfile);

  // Mirrors the auth state so async handlers can wait for the Convex client to
  // attach the token after sign-in (client.setAuth runs in a React effect).
  const isAuthenticatedRef = useRef(isAuthenticated);
  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  // Guards the auto profile-sync so it runs at most once per sign-in.
  const profileSyncRef = useRef(false);

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      profileSyncRef.current = false;
      return;
    }

    const role = user?.role ?? null;

    // For admin, the OTP handler manages promotion + navigation.
    if (redirect === "/admin") {
      if (role === "admin") {
        navigate("/admin");
      }
      return;
    }

    // Session exists but the Nexora profile is missing or has no role yet (the
    // OTP profile sync can race the auth token attach or fail on a backend
    // error, leaving the user stuck on /auth or a role-missing spinner with a
    // valid session). Repair it from the signup form state. Only sync when real
    // signup data is present — never fabricate a role after a refresh wiped the
    // form.
    const needsProfileRepair = !user || (!!user && !user.role);
    if (needsProfileRepair && !profileSyncRef.current && (selectedRole || fullName || password)) {
      profileSyncRef.current = true;
      void ensureUserProfile({
        name: fullName || undefined,
        phone: phoneNumber || undefined,
        role: selectedRole || undefined,
        businessName: selectedRole === "seller" ? fullName || undefined : undefined,
        password: password.trim() || undefined,
      })
        .then(() => {
          profileSyncRef.current = false;
        })
        .catch((err) => {
          console.error("Profile sync failed:", err);
          profileSyncRef.current = false;
        });
      return;
    }

    // Use the persistent role to decide where an authenticated user belongs.
    // Do NOT assume /buyer while the profile is still loading: if the role is
    // not known yet we stay here until the Convex profile query resolves.
    const roleTarget =
      role === "admin"
        ? "/admin"
        : role === "seller" || role === "driver"
        ? "/seller"
        : role === "freelancer"
        ? "/freelance/dashboard"
        : role === "employer"
        ? "/employer"
        : role === "buyer"
        ? "/buyer"
        : null;

    if (roleTarget) {
      navigate(roleTarget);
      return;
    }

    // Only use a caller-supplied redirect when the role is known and the
    // target looks like an internal path. Never fall back to /buyer blindly.
    if (role && typeof redirect === "string" && redirect.startsWith("/") && !redirect.startsWith("//")) {
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, user, navigate, redirect, fullName, phoneNumber, selectedRole, password, ensureUserProfile]);

  // Guarded check: reject only when the password actually contains the email
  // (full address or local part) or a meaningful name. An empty field must
  // never trigger "includes('')" which is always true and falsely errors a
  // perfectly valid password.
  const passwordContainsPersonalInfo = (
    passwordRaw: string,
    emailRaw: string | null,
    nameRaw: string,
  ): boolean => {
    const p = passwordRaw.trim().toLowerCase();
    const email = (emailRaw || "").trim().toLowerCase();
    const localPart = email.split("@")[0]?.trim();
    const name = (nameRaw || "").trim().toLowerCase();
    if (email.length >= 3 && p.includes(email)) return true;
    if (localPart && localPart.length >= 3 && p.includes(localPart)) return true;
    if (name.length >= 3 && p.includes(name)) return true;
    return false;
  };

  const isPasswordAuthBlocked = (
    passwordRaw: string,
    emailRaw: string | null,
  ): string | null => {
    const passwordTrimmed = passwordRaw.trim();
    if (passwordTrimmed.length === 0) return "Password is required.";
    if (!isPasswordValid(passwordTrimmed)) {
      return "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a symbol.";
    }
    if (confirmPassword !== passwordRaw) return "Passwords do not match.";
    if (passwordContainsPersonalInfo(passwordRaw, emailRaw, fullName)) {
      return "Password should not contain your email or name.";
    }
    return null;
  };

  const isFreelanceRoute = redirect.startsWith("/freelance");

  const handleRoleSelect = (role: "buyer" | "seller" | "freelancer") => {
    setSelectedRole(role);
    setStep("signIn");
  };

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setPasswordError(null);
    setConfirmPasswordError(null);

    // ---- Strong password validation (same policy for every panel) ----
    if (usePasswordAuth) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const currentForm = (event as any)?.currentTarget as HTMLFormElement | null;
      const emailFromForm = currentForm ? new FormData(currentForm).get("email") as string : "";
      const blockReason = isPasswordAuthBlocked(password, emailFromForm);
      if (blockReason) {
        if (blockReason === "Passwords do not match.") {
          setConfirmPasswordError(blockReason);
        } else {
          setPasswordError(blockReason);
        }
        setIsLoading(false);
        return;
      }
    }

    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      setStep({ email: formData.get("email") as string });
      setIsLoading(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to send verification code.");
      setIsLoading(false);
    }
  };

  function formDataGet(form: FormData, name: string): string | null {
    return form.get(name) as string | null;
  }

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    if (usePasswordAuth) {
      const emailFromForm = new FormData(event.currentTarget).get("email") as string | null;
      const blockReason = isPasswordAuthBlocked(password, emailFromForm);
      if (blockReason) {
        if (blockReason === "Passwords do not match.") {
          setConfirmPasswordError(blockReason);
        } else {
          setPasswordError(blockReason);
        }
        setIsLoading(false);
        return;
      }
    }

    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);

      const email = formDataGet(formData, "email") || "";
      setStep({ email });

      // Wait for the Convex client to attach the auth token before syncing the
      // profile. client.setAuth() runs in a React effect AFTER the auth state
      // flips, so an immediate ensureUserProfile goes out unauthenticated and
      // fails with "Not authenticated" (observed in the Convex logs).
      let waited = 0;
      while (!isAuthenticatedRef.current && waited < 50) {
        await new Promise((r) => setTimeout(r, 100));
        waited += 1;
      }

      // Create/sync the persistent profile, retrying briefly in case the token
      // attach is still settling. Any non-auth error is not retried.
      let syncError: unknown = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await ensureUserProfile({
            name: fullName || undefined,
            phone: phoneNumber || undefined,
            role: selectedRole || undefined,
            businessName: selectedRole === "seller" ? fullName || undefined : undefined,
            password: password.trim(),
          });
          syncError = null;
          break;
        } catch (err: any) {
          syncError = err;
          if (!(err?.message ?? "").includes("Not authenticated")) break;
          await new Promise((r) => setTimeout(r, 500));
        }
      }
      if (syncError) {
        console.error("Account profile sync failed:", syncError);
      }

      // After creating/syncing the persistent profile, navigate to the panel
      // that matches the role the user chose during signup. This is the direct
      // fix for the seller -> buyer regression on the OTP path.
      if (selectedRole) {
        const target =
          selectedRole === "seller"
            ? "/seller"
            : selectedRole === "freelancer"
            ? "/freelance/dashboard"
            : "/buyer";
        try { navigate(target); } catch {}
      }

      setIsLoading(false);
    } catch (error: any) {
      const msg = error?.message ?? "";
      if (msg.includes("Could not verify code") || msg.includes("Invalid verification code")) {
        setError("That code is invalid or has expired. Please request a new one.");
      } else {
        setError(error instanceof Error ? error.message : "Failed to send verification code.");
      }
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("google");
      // Navigation handled by useEffect after auth state updates
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      setError(error?.message?.includes("not configured")
        ? "Google sign-in is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in API Keys."
        : "Google sign-in failed. " + (error?.message || "Please try again or use email sign-in."));
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("anonymous");
      navigate(isFreelanceRoute ? redirect : "/buyer");
    } catch (error) {
      setError(`Failed to sign in as guest: ${error instanceof Error ? error.message : "Unknown error"}`);
      setIsLoading(false);
    }
  };

  // ---- PASSWORD LOGIN ----
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const verifyLogin = useMutation(api.users.verifyLogin);


  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // ---- Client-side pre-check (login only validates, never enforces the
    // signup strength policy — the server decides via the stored hash). ----
    if (loginPassword.trim().length === 0) {
      setError("Password is required.");
      setIsLoading(false);
      return;
    }

    try {
      const result = await verifyLogin({ email: loginEmail, password: loginPassword });
      if (result?.success && (result as any).tokens?.token) {
        const tokens = (result as any).tokens as { token: string; refreshToken: string };
        // Persist the auth session exactly like the Convex auth client does
        // (tokens are namespaced by the Convex client address), then hard
        // reload so ConvexAuthProvider picks the token up from storage and
        // this becomes a REAL session — protected routes work because a
        // session now exists, not just a verified credential.
        const ns = (import.meta.env.VITE_CONVEX_URL as string).replace(/[^a-zA-Z0-9]/g, "");
        localStorage.setItem(`__convexAuthJWT_${ns}`, tokens.token);
        localStorage.setItem(`__convexAuthRefreshToken_${ns}`, tokens.refreshToken);

        // Navigate using the role returned from the backend, which is read from
        // the persistent DB record. Do NOT fallback to /buyer when the role is
        // missing — instead route to the auth page so the profile can be repaired.
        const r = result.role;
        let target: string | null = null;
        if (r === "admin") target = "/admin";
        else if (r === "seller" || r === "driver") target = "/seller";
        else if (r === "freelancer") target = "/freelance";
        else if (r === "buyer") target = "/buyer";
        else if (r === "employer") target = "/employer";
        else {
          setError("Your account role is not recognised. Please contact support.");
          setLoginPassword("");
          setIsLoading(false);
          return;
        }
        window.location.href = target;
        return;
      }
      setError("Invalid email or password. Please check your details.");
      setLoginPassword("");
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Admin: Email → sends OTP ---
  const handleAdminEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail) return;
    setIsLoading(true);
    setAdminError(null);
    try {
      const formData = new FormData();
      formData.set("email", adminEmail);
      await signIn("email-otp", formData);
      setStep("adminOtp");
    } catch (err: any) {
      setAdminError(err.message || "Failed to send code.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Admin: OTP verify → auto-promote + redirect ---
  const handleAdminOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    setIsLoading(true);
    setAdminError(null);
    try {
      const formData = new FormData();
      formData.set("email", adminEmail);
      formData.set("code", otp);
      await signIn("email-otp", formData);
      // Wait for auth state to update
      await new Promise((r) => setTimeout(r, 1000));
      try { await checkAndPromoteAdmin({}); } catch {}
      // Wait for promotion to propagate
      await new Promise((r) => setTimeout(r, 500));
      sessionStorage.setItem("admin2fa_verified", "true");
      // Force full reload to ensure Convex auth state is fresh
      window.location.href = "/admin";
    } catch (err: any) {
      setAdminError("Invalid code. Please check and try again.");
      setOtp("");
    } finally {
      setIsLoading(false);
    }
  };

  // ===== ADMIN LOGIN — EMAIL + OTP (2FA) =====
  if (isAdminLogin) {
    return (
      <div className="min-h-screen bg-[#05050A] flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-nx-gold/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-red-500/3 rounded-full blur-[100px]" />
        </div>
        <div className="flex-1 flex items-center justify-center w-full px-4 relative z-10">
          <div className="flex items-center justify-center h-full flex-col w-full max-w-[520px]">
            <button onClick={() => navigate("/")} className="flex items-center gap-2 mb-6 group">
              <Shield className="w-8 h-8 text-nx-gold group-hover:text-nx-cyan transition-colors" />
              <span className="text-xl font-bold tracking-tight text-white">NEXORA<span className="text-nx-gold">.</span></span>
            </button>
            <div className="mb-4 px-3 py-1.5 rounded-lg bg-nx-gold/10 text-nx-gold text-[10px] font-bold tracking-widest uppercase">ADMIN CONTROL CENTER</div>

            {/* Step 1: Email */}
            {step === "adminEmail" && (
              <Card className="w-full border border-white/5 bg-nx-surface/80 backdrop-blur-xl">
                <CardHeader className="text-center pt-6">
                  <div className="w-12 h-12 rounded-full bg-nx-gold/10 flex items-center justify-center mx-auto mb-3"><Mail className="w-6 h-6 text-nx-gold" /></div>
                  <CardTitle className="text-xl text-white">Admin Login</CardTitle>
                  <CardDescription className="text-white/40">Enter your admin email address</CardDescription>
                </CardHeader>
                <form onSubmit={handleAdminEmailSubmit}>
                  <CardContent className="space-y-4 pb-6">
                    <Input type="email" placeholder="admin@nexora.com" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="bg-white/[0.03] border-white/10 text-white placeholder:text-white/20 focus:border-nx-gold/50" required autoFocus />
                    {adminError && <p className="text-sm text-red-400 text-center">{adminError}</p>}
                    <Button type="submit" className="w-full bg-nx-gold hover:bg-nx-gold/80 text-black font-semibold" disabled={isLoading || !adminEmail}>
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Send Verification Code <ArrowRight className="ml-2 h-4 w-4" /></>}
                    </Button>
                  </CardContent>
                </form>
              </Card>
            )}

            {/* Step 2: OTP (2FA) */}
            {step === "adminOtp" && (
              <Card className="w-full border border-white/5 bg-nx-surface/80 backdrop-blur-xl">
                <CardHeader className="text-center pt-6">
                  <button onClick={() => { setStep("adminEmail"); setAdminError(null); setOtp(""); }} className="text-white/30 hover:text-white/60 text-xs transition-colors flex items-center gap-1 mb-2 mx-auto"><ArrowLeft className="w-3 h-3" /> Back</button>
                  <div className="w-12 h-12 rounded-full bg-nx-gold/10 flex items-center justify-center mx-auto mb-3"><KeyRound className="w-6 h-6 text-nx-gold" /></div>
                  <CardTitle className="text-xl text-white">Two-Factor Verification</CardTitle>
                  <CardDescription className="text-white/40">Code sent to<br /><span className="text-white/60 font-medium">{adminEmail}</span></CardDescription>
                </CardHeader>
                <form onSubmit={handleAdminOtpSubmit}>
                  <CardContent className="space-y-4 pb-6">
                    <div className="flex justify-center">
                      <InputOTP value={otp} onChange={setOtp} maxLength={6} disabled={isLoading} onKeyDown={(e) => { if (e.key === "Enter" && otp.length === 6 && !isLoading) { const form = (e.target as HTMLElement).closest("form"); if (form) form.requestSubmit(); } }}>
                        <InputOTPGroup>{Array.from({ length: 6 }).map((_, i) => <InputOTPSlot key={i} index={i} className="bg-white/[0.03] border-white/10 text-white" />)}</InputOTPGroup>
                      </InputOTP>
                    </div>
                    {adminError && <p className="text-sm text-red-400 text-center">{adminError}</p>}
                    <Button type="submit" className="w-full bg-nx-gold hover:bg-nx-gold/80 text-black font-semibold" disabled={isLoading || otp.length !== 6}>
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Verify & Enter Admin Panel <ArrowRight className="ml-2 h-4 w-4" /></>}
                    </Button>
                  </CardContent>
                </form>
              </Card>
            )}

            <div className="mt-4 text-center">
              <button onClick={() => navigate("/")} className="text-xs text-white/20 hover:text-white/40 transition-colors">← Back to home</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== REGULAR BUYER/SELLER AUTH =====
  // Toggle password-auth step on/off per panel. Enabled for all panels that
  // create an account (buyer / seller / freelancer). The policy is the same one
  // defined in src/lib/password-strength.ts and enforced server-side in
  // src/convex/users.ts (verifyLogin + updatePassword).
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const usePasswordAuth = true;

  return (
    <div className="min-h-screen bg-[#05050A] flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-nx-violet/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-nx-cyan/3 rounded-full blur-[100px]" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.03)_0%,transparent_70%)]" />
      </div>

      {/* Page-level back navigation (top-left, always visible) */}
      <button
        onClick={() => {
          if (window.history.length > 1) {
            navigate(-1);
          } else {
            navigate("/");
          }
        }}
        className="absolute left-3 sm:left-5 top-3 sm:top-5 z-30 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-medium text-white/60 hover:text-white hover:bg-white/[0.08] hover:border-white/20 backdrop-blur-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Dedicated seller-panel intro (no role cards) */}
      {isSellerRegister && !isAdminLogin && (
        <div className="relative z-10 w-full max-w-[440px] text-center mb-5">
          <div className="inline-flex items-center gap-1.5 mb-3 px-3 py-1.5 rounded-lg bg-nx-violet/10 border border-nx-violet/20 text-nx-violet text-[10px] font-bold tracking-widest uppercase">
            <Store className="w-3.5 h-3.5" /> Seller Panel
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {sellerMode === "register" ? "Open Your Seller Store" : "Seller Sign In"}
          </h1>
          <p className="text-sm text-white/40 leading-relaxed">
            {sellerMode === "register"
              ? "Register your store directly — an admin reviews and approves it before you can publish products."
              : "Sign in to manage products, orders and earnings."}
          </p>
          {sellerMode === "register" && (
            <p className="text-[11px] text-white/25 mt-2 leading-relaxed">
              <Shield className="inline w-3 h-3 mr-1 text-nx-gold" />
              New stores appear under <span className="text-white/50">Admin → Verification → Seller Store Approvals</span> until approved.
            </p>
          )}
          {/* Register / Sign-in switch */}
          <div className="inline-flex items-center gap-1 mt-5 p-1 rounded-xl border border-white/10 bg-white/[0.03]">
            <button
              type="button"
              onClick={() => { setSellerMode("register"); setError(null); setPasswordError(null); setLoginPassword(""); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${sellerMode === "register" ? "bg-nx-violet text-white" : "text-white/40 hover:text-white"}`}
            >
              Register Store
            </button>
            <button
              type="button"
              onClick={() => { setSellerMode("login"); setError(null); setPasswordError(null); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${sellerMode === "login" ? "bg-nx-violet text-white" : "text-white/40 hover:text-white"}`}
            >
              I have a store
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center w-full px-4 relative z-10">
        <div className="flex items-center justify-center h-full flex-col w-full max-w-[900px]">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 mb-6 group">
            <Shield className="w-8 h-8 text-nx-violet group-hover:text-nx-cyan transition-colors" />
            <span className="text-xl font-bold tracking-tight text-white">
              NEXORA<span className="text-nx-violet">.</span>
            </span>
          </button>

          {step === "roleSelect" && (
            <div className="w-full max-w-[640px]">
              <div className="text-center mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{isFreelanceRoute ? "Join Nexora Freelance" : "Choose Your Path"}</h1>
                <p className="text-white/40 text-sm">{isFreelanceRoute ? "How will you use Nexora Freelance?" : "How will you use Nexora Market?"}</p>
              </div>
              <div className={`grid grid-cols-1 ${isFreelanceRoute ? "md:grid-cols-2" : "md:grid-cols-2"} gap-4`}>
                <button onClick={() => handleRoleSelect("buyer")} className="group relative p-6 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm hover:border-nx-cyan/30 hover:bg-nx-cyan/5 transition-all duration-300 text-left">
                  <div className="w-14 h-14 rounded-xl bg-nx-cyan/10 flex items-center justify-center mb-4 group-hover:bg-nx-cyan/20 transition-colors">
                    <ShoppingBag className="w-7 h-7 text-nx-cyan" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">I'm a Buyer</h3>
                  <p className="text-white/40 text-sm leading-relaxed mb-4">Browse products, make secure purchases with escrow protection, track deliveries.</p>
                  <div className="flex flex-col gap-1.5">
                    {["Escrow-protected purchases", "AI fraud detection", "Insured delivery tracking"].map((f) => (
                      <div key={f} className="flex items-center gap-2 text-xs text-white/30">
                        <Check className="w-3 h-3 text-nx-cyan/60" /><span>{f}</span>
                      </div>
                    ))}
                  </div>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/10 group-hover:text-nx-cyan/50 transition-colors" />
                </button>

                <button onClick={() => handleRoleSelect("seller")} className="group relative p-6 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm hover:border-nx-violet/30 hover:bg-nx-violet/5 transition-all duration-300 text-left">
                  <div className="w-14 h-14 rounded-xl bg-nx-violet/10 flex items-center justify-center mb-4 group-hover:bg-nx-violet/20 transition-colors">
                    <Store className="w-7 h-7 text-nx-violet" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">I'm a Seller</h3>
                  <p className="text-white/40 text-sm leading-relaxed mb-4">List products, manage orders, withdraw earnings. KYC verification required.</p>
                  <div className="flex flex-col gap-1.5">
                    {["KYC business verification", "Product management", "Analytics & earnings"].map((f) => (
                      <div key={f} className="flex items-center gap-2 text-xs text-white/30">
                        <Check className="w-3 h-3 text-nx-violet/60" /><span>{f}</span>
                      </div>
                    ))}
                  </div>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/10 group-hover:text-nx-violet/50 transition-colors" />
                </button>
              </div>

              {/* Freelance role options when coming from /freelance */}
              {isFreelanceRoute && (
                <>
                  <p className="text-xs text-white/30 text-center mt-6 mb-2">Or choose a freelance role:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button onClick={() => handleRoleSelect("freelancer")} className="group relative p-6 rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.02] backdrop-blur-sm hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-300 text-left">
                      <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
                        <span className="text-2xl">✍️</span>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-1">Writer / Freelancer</h3>
                      <p className="text-white/40 text-sm leading-relaxed mb-4">Find work, submit proposals, get paid securely.</p>
                      <div className="flex flex-col gap-1.5">
                        {["Browse & apply to jobs", "Escrow-protected earnings", "M-Pesa withdrawals"].map((f) => (
                          <div key={f} className="flex items-center gap-2 text-xs text-white/30">
                            <Check className="w-3 h-3 text-emerald-500/60" /><span>{f}</span>
                          </div>
                        ))}
                      </div>
                    </button>

                    <button onClick={() => handleRoleSelect("freelancer")} className="group relative p-6 rounded-2xl border border-amber-500/10 bg-amber-500/[0.02] backdrop-blur-sm hover:border-amber-500/30 hover:bg-amber-500/5 transition-all duration-300 text-left">
                      <div className="w-14 h-14 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4 group-hover:bg-amber-500/20 transition-colors">
                        <span className="text-2xl">💼</span>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-1">Employer</h3>
                      <p className="text-white/40 text-sm leading-relaxed mb-4">Post jobs, hire freelancers, manage projects.</p>
                      <div className="flex flex-col gap-1.5">
                        {["Post jobs & tasks", "Review proposals", "Escrow-protected payments"].map((f) => (
                          <div key={f} className="flex items-center gap-2 text-xs text-white/30">
                            <Check className="w-3 h-3 text-amber-500/60" /><span>{f}</span>
                          </div>
                        ))}
                      </div>
                    </button>
                  </div>
                </>
              )}

              <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-[11px] text-white/20">
                <div className="flex items-center gap-1.5"><Lock className="w-3 h-3" /> Bank-Level Encryption</div>
                <div className="flex items-center gap-1.5"><Shield className="w-3 h-3" /> CBK Compliant</div>
                <div className="flex items-center gap-1.5"><Globe className="w-3 h-3" /> 47 Counties Covered</div>
                <div className="flex items-center gap-1.5"><Zap className="w-3 h-3" /> Instant Escrow</div>
              </div>
              <div className="mt-6 text-center">
                <button onClick={handleGuestLogin} className="text-xs text-white/20 hover:text-white/40 transition-colors">Continue as Guest →</button>
              </div>
              <div className="mt-4 text-center">
                <button onClick={() => setShowLogin(!showLogin)} className="text-xs text-nx-cyan hover:text-nx-cyan/80 transition-colors flex items-center gap-1 mx-auto">
                  {showLogin ? "← Back to sign up" : "Already have an account? Sign in"}
                </button>
              </div>
              {showLogin && (
                <div className="mt-4 w-full max-w-[440px] mx-auto">
                  <Card className="border border-white/5 bg-nx-surface/80 backdrop-blur-xl shadow-2xl shadow-nx-violet/5">
                    <CardHeader className="text-center pt-6">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-nx-violet/10 text-nx-violet font-medium">Sign In</span>
                      </div>
                      <CardTitle className="text-xl text-white">Sign in to your account</CardTitle>
                      <CardDescription className="text-white/40">Enter your email and password to access your account</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <form onSubmit={handlePasswordLogin} className="space-y-3">
                        <div className="relative"><Mail className="absolute left-3 top-3 h-4 w-4 text-white/30" /><Input name="email" placeholder="Email address" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="pl-9 bg-white/[0.03] border-white/10 text-white placeholder:text-white/20 focus:border-nx-violet/50" required autoFocus /></div>
                        <div className="relative"><Lock className="absolute left-3 top-3 h-4 w-4 text-white/30" /><Input name="password" placeholder="Password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="pl-9 bg-white/[0.03] border-white/10 text-white placeholder:text-white/20 focus:border-nx-violet/50" required /></div>
                        {error && <p className="text-sm text-red-400">{error}</p>}
                        <Button type="submit" className="w-full bg-nx-violet hover:bg-nx-violet/80 text-white h-11" disabled={isLoading}>
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign In <ArrowRight className="ml-2 h-4 w-4" /></>}
                        </Button>
                      </form>
                      <p className="text-[11px] text-white/20 text-center">Don't have an account? Use the options above to sign up.</p>
                    </CardContent>
                    <div className="py-3 px-6 text-xs text-center text-white/20 bg-white/[0.02] border-t border-white/5 rounded-b-lg flex items-center justify-center gap-1.5">
                      <Shield className="w-3 h-3" /> Protected by Nexora Escrow Security
                    </div>
                  </Card>
                </div>
              )}
            </div>
          )}

          {step === "signIn" && !sellerPanelLogin && (
            <Card className="w-full max-w-[440px] border border-white/5 bg-nx-surface/80 backdrop-blur-xl shadow-2xl shadow-nx-violet/5">
              <CardHeader className="text-center pt-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {!isSellerRegister && (
                    <button onClick={() => setStep("roleSelect")} className="text-white/30 hover:text-white/60 text-xs transition-colors flex items-center gap-1"><ArrowLeft className="w-3 h-3" /> Change</button>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${selectedRole === "seller" ? "bg-nx-violet/10 text-nx-violet" : selectedRole === "freelancer" ? "bg-emerald-500/10 text-emerald-400" : "bg-nx-cyan/10 text-nx-cyan"}`}>{selectedRole === "seller" ? "🏪 Seller" : selectedRole === "freelancer" ? "✍️ Freelancer" : "🛒 Buyer"}</span>
                </div>
                <CardTitle className="text-xl text-white">{selectedRole === "seller" ? "Create Seller Account" : selectedRole === "freelancer" ? "Create Freelancer Account" : "Create Buyer Account"}</CardTitle>
                <CardDescription className="text-white/40">{selectedRole === "seller" ? "Set up your seller account to start listing products" : selectedRole === "freelancer" ? "Set up your account to start freelancing" : "Create your account to start shopping securely"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/5" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-nx-surface px-2 text-white/20 tracking-wider">or sign in with email</span></div></div>

                {/* ---- PASSWORD STEP (strong policy, same across all panels) ---- */}
                {usePasswordAuth && (
                  <>
                    <PasswordField
                      label="Create a secure password"
                      value={password}
                      onChange={(v) => {
                        setPassword(v);
                        setPasswordError(null);
                        setConfirmPasswordError(null);
                      }}
                      placeholder="Choose a strong password"
                      error={passwordError}
                      disabled={isLoading}
                      onValidChange={(valid) => setPasswordValid(valid)}
                    />
                    <PasswordField
                      label="Confirm password"
                      value={confirmPassword}
                      onChange={(v) => {
                        setConfirmPassword(v);
                        setConfirmPasswordError(null);
                      }}
                      placeholder="Re-enter your password"
                      error={confirmPasswordError}
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                    <p className="text-[11px] text-white/20 text-center leading-relaxed">
                      Your password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a symbol.
                    </p>
                  </>
                )}

                <form onSubmit={handleEmailSubmit} className="space-y-3">
                  {usePasswordAuth && (
                    <input type="hidden" name="password" value={password} />
                  )}
                  <input type="hidden" name="role" value={selectedRole || "buyer"} />
                  <input type="hidden" name="businessName" value={selectedRole === "seller" ? fullName || undefined : undefined} />
                  {selectedRole === "seller" && (
                    <div className="relative"><User className="absolute left-3 top-3 h-4 w-4 text-white/30" /><Input name="businessName" placeholder="Business / Store Name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-9 bg-white/[0.03] border-white/10 text-white placeholder:text-white/20 focus:border-nx-violet/50" disabled={isLoading} required /></div>
                  )}
                  {selectedRole !== "seller" && (
                    <div className="relative"><User className="absolute left-3 top-3 h-4 w-4 text-white/30" /><Input name="name" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-9 bg-white/[0.03] border-white/10 text-white placeholder:text-white/20 focus:border-nx-violet/50" disabled={isLoading} required /></div>
                  )}
                  <div className="relative"><Mail className="absolute left-3 top-3 h-4 w-4 text-white/30" /><Input name="email" placeholder="Email address" type="email" className="pl-9 bg-white/[0.03] border-white/10 text-white placeholder:text-white/20 focus:border-nx-violet/50" disabled={isLoading} required /></div>
                  <div className="relative"><Phone className="absolute left-3 top-3 h-4 w-4 text-white/30" /><Input name="phone" placeholder="Phone number (e.g. 0712 345 678)" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="pl-9 bg-white/[0.03] border-white/10 text-white placeholder:text-white/20 focus:border-nx-violet/50" disabled={isLoading} required /></div>
                  {error && <p className="text-sm text-red-400">{error}</p>}
                  <Button type="submit" className="w-full bg-nx-violet hover:bg-nx-violet/80 text-white h-11" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Send Verification Code <ArrowRight className="ml-2 h-4 w-4" /></>}
                  </Button>
                </form>
                <p className="text-[11px] text-white/20 text-center">{selectedRole === "seller" ? "Sellers must complete KYC verification before listing products" : selectedRole === "freelancer" ? "Freelancers can set up their profile after account creation" : "By creating an account, you agree to Nexora's Terms & Privacy Policy"}</p>
              </CardContent>
              <div className="py-3 px-6 text-xs text-center text-white/20 bg-white/[0.02] border-t border-white/5 rounded-b-lg flex items-center justify-center gap-1.5">
                <Shield className="w-3 h-3" /> Protected by Nexora Escrow Security
              </div>
            </Card>
          )}

          {/* Dedicated seller panel — login mode */}
          {sellerPanelLogin && (
            <Card className="w-full max-w-[440px] border border-white/5 bg-nx-surface/80 backdrop-blur-xl shadow-2xl shadow-nx-violet/5">
              <CardHeader className="text-center pt-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-nx-violet/10 text-nx-violet">🏪 Seller Sign In</span>
                </div>
                <CardTitle className="text-xl text-white">Welcome back, Seller</CardTitle>
                <CardDescription className="text-white/40">Enter your email and password to access your store</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handlePasswordLogin} className="space-y-3">
                  <div className="relative"><Mail className="absolute left-3 top-3 h-4 w-4 text-white/30" /><Input name="email" placeholder="Email address" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="pl-9 bg-white/[0.03] border-white/10 text-white placeholder:text-white/20 focus:border-nx-violet/50" required autoFocus /></div>
                  <div className="relative"><Lock className="absolute left-3 top-3 h-4 w-4 text-white/30" /><Input name="password" placeholder="Password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="pl-9 bg-white/[0.03] border-white/10 text-white placeholder:text-white/20 focus:border-nx-violet/50" required /></div>
                  {error && <p className="text-sm text-red-400">{error}</p>}
                  <Button type="submit" className="w-full bg-nx-violet hover:bg-nx-violet/80 text-white h-11" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign In to Seller Panel <ArrowRight className="ml-2 h-4 w-4" /></>}
                  </Button>
                </form>
                <p className="text-[11px] text-white/20 text-center">
                  Don't have a store yet?{" "}
                  <button type="button" onClick={() => setSellerMode("register")} className="text-nx-violet hover:text-nx-violet/80 font-medium">Register your store</button>
                </p>
              </CardContent>
              <div className="py-3 px-6 text-xs text-center text-white/20 bg-white/[0.02] border-t border-white/5 rounded-b-lg flex items-center justify-center gap-1.5">
                <Shield className="w-3 h-3" /> Protected by Nexora Escrow Security
              </div>
            </Card>
          )}

          {typeof step === "object" && (
            <Card className="w-full max-w-[420px] border border-white/5 bg-nx-surface/80 backdrop-blur-xl shadow-2xl shadow-nx-violet/5">
              <CardHeader className="text-center pt-6">
                <div className="w-12 h-12 rounded-full bg-nx-violet/10 flex items-center justify-center mx-auto mb-3"><Mail className="w-6 h-6 text-nx-violet" /></div>
                <CardTitle className="text-xl text-white">Check your email</CardTitle>
                <CardDescription className="text-white/40">We've sent a 6-digit code to<br /><span className="text-white/60 font-medium">{step.email}</span></CardDescription>
              </CardHeader>
              <form onSubmit={handleOtpSubmit}>
                <CardContent className="pb-4 space-y-4">
                  <input type="hidden" name="email" value={step.email} />
                  <input type="hidden" name="code" value={otp} />
                  <div className="flex justify-center">
                    <InputOTP value={otp} onChange={setOtp} maxLength={6} disabled={isLoading} onKeyDown={(e) => { if (e.key === "Enter" && otp.length === 6 && !isLoading) { const form = (e.target as HTMLElement).closest("form"); if (form) form.requestSubmit(); } }}>
                      <InputOTPGroup>{Array.from({ length: 6 }).map((_, index) => <InputOTPSlot key={index} index={index} className="bg-white/[0.03] border-white/10 text-white" />)}</InputOTPGroup>
                    </InputOTP>
                  </div>
                  {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                  <p className="text-sm text-white/30 text-center">Didn't receive a code?{" "}<Button variant="link" className="p-0 h-auto text-nx-violet hover:text-nx-violet/80" onClick={() => setStep("signIn")}>Try again</Button></p>
                </CardContent>
                <CardFooter className="flex-col gap-2 pb-6">
                  <Button type="submit" className="w-full bg-nx-violet hover:bg-nx-violet/80 text-white" disabled={isLoading || otp.length !== 6}>
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</> : <>Verify & Continue <ArrowRight className="ml-2 h-4 w-4" /></>}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setStep("signIn")} disabled={isLoading} className="w-full text-white/40 hover:text-white hover:bg-white/[0.02]">Use different email</Button>
                </CardFooter>
              </form>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}
