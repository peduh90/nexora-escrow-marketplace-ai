import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAuth } from "@/hooks/use-auth";
import {
  ArrowRight,
  Loader2,
  Mail,
  Shield,
  ShoppingBag,
  Store,
  ChevronRight,
  Check,
  Lock,
  Globe,
  Zap,
  Phone,
  User,
  ArrowLeft,
} from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(returnTo: string | null, fallback = "/buyer") {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

type AuthStep = "roleSelect" | "signIn" | { email: string } | "adminEmail" | "adminOtp" | "adminPassword" | "admin2fa" | "adminSetPassword";

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(searchParams.get("returnTo"), redirectAfterAuth);
  const isAdminLogin = redirect === "/admin";

  const [step, setStep] = useState<AuthStep>(isAdminLogin ? "adminEmail" : "roleSelect");
  const [selectedRole, setSelectedRole] = useState<"buyer" | "seller" | null>(null);
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Account creation fields
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Admin login state
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminConfirmPassword, setAdminConfirmPassword] = useState("");
  const [adminHasPassword, setAdminHasPassword] = useState<boolean | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);

  const checkAndPromoteAdmin = useMutation(api.users.checkAndPromoteAdmin);
  const verifyAdminPassword = useMutation(api.adminAuth.verifyAdminPassword);
  const setAdminPasswordMutation = useMutation(api.adminAuth.setAdminPassword);
  const setupAdmin2FA = useMutation(api.adminAuth.setupAdmin2FA);
  const confirmAdmin2FA = useMutation(api.adminAuth.confirmAdmin2FA);
  const validateAdmin2FA = useMutation(api.adminAuth.validateAdmin2FA);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      // Auto-promote to admin if redirecting to admin panel
      if (redirect === "/admin") {
        checkAndPromoteAdmin().catch(() => {});
      }
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);

  const handleRoleSelect = (role: "buyer" | "seller") => {
    setSelectedRole(role);
    setStep("signIn");
  };

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      // Store name and phone for later use after OTP verification
      await signIn("email-otp", formData);
      setStep({ email: formData.get("email") as string });
      setIsLoading(false);
    } catch (error) {
      console.error("Email sign-in error:", error);
      setError(error instanceof Error ? error.message : "Failed to send verification code.");
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      // After successful sign-in, redirect based on role
      navigate(selectedRole === "seller" ? "/seller" : "/buyer");
    } catch (error) {
      console.error("OTP verification error:", error);
      setError("The verification code you entered is incorrect.");
      setIsLoading(false);
      setOtp("");
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("google");
      navigate(selectedRole === "seller" ? "/seller" : "/buyer");
    } catch (error) {
      console.error("Google sign-in error:", error);
      setError("Google sign-in is not configured yet. Please use email.");
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("anonymous");
      navigate("/buyer");
    } catch (error) {
      console.error("Guest login error:", error);
      setError(`Failed to sign in as guest: ${error instanceof Error ? error.message : "Unknown error"}`);
      setIsLoading(false);
    }
  };

  // --- Admin login handlers ---
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
      setAdminError(err.message || "Failed to send verification code.");
    } finally {
      setIsLoading(false);
    }
  };

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
      await new Promise((r) => setTimeout(r, 1000));
      setStep("adminPassword");
    } catch (err: any) {
      setAdminError("Invalid verification code.");
      setOtp("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassword) return;
    setIsLoading(true);
    setAdminError(null);
    try {
      await verifyAdminPassword({ email: adminEmail, password: adminPassword });
      setStep("admin2fa");
    } catch (err: any) {
      const msg = err.message || "Invalid password.";
      if (msg.includes("No admin password set")) {
        setAdminHasPassword(false);
        setAdminPassword("");
        setAdminError(null);
      } else {
        setAdminError(msg);
        setAdminPassword("");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminSetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassword || adminPassword !== adminConfirmPassword) return;
    setIsLoading(true);
    setAdminError(null);
    try {
      if (adminPassword.length < 8) throw new Error("Password must be at least 8 characters");
      await setAdminPasswordMutation({ password: adminPassword });
      setStep("admin2fa");
    } catch (err: any) {
      setAdminError(err.message || "Failed to set password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    setIsLoading(true);
    setAdminError(null);
    try {
      // Auto-promote first
      await checkAndPromoteAdmin();
      const status = { isAdmin: true, hasSecret: false, enabled: false };
      if (!status.hasSecret) {
        const r = await setupAdmin2FA();
        if (r?.secret) {
          const cr = await confirmAdmin2FA({ code: otp });
          if (cr?.success) {
            sessionStorage.setItem("admin2fa_verified", "true");
            navigate("/admin");
          }
        }
      } else if (!status.enabled) {
        const cr = await confirmAdmin2FA({ code: otp });
        if (cr?.success) {
          sessionStorage.setItem("admin2fa_verified", "true");
          navigate("/admin");
        }
      } else {
        const r = await validateAdmin2FA({ code: otp });
        if (r?.success) {
          sessionStorage.setItem("admin2fa_verified", "true");
          navigate("/admin");
        }
      }
    } catch (err: any) {
      setAdminError(err.message || "Invalid 2FA code.");
      setOtp("");
    } finally {
      setIsLoading(false);
    }
  };

  const adminSteps = [
    { id: "adminEmail", num: 1, label: "Email" },
    { id: "adminOtp", num: 2, label: "Verify" },
    { id: "adminPassword", num: 3, label: "Password" },
    { id: "admin2fa", num: 4, label: "2FA" },
  ];

  const currentAdminStep = adminSteps.findIndex((s) =>
    s.id === step || (step === "adminSetPassword" && s.id === "adminPassword")
  );

  // --- Admin login UI ---
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
            {/* Progress */}
            {step !== "adminSetPassword" && (
              <div className="flex items-center gap-2 mb-6">
                {adminSteps.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${i < currentAdminStep ? "bg-nx-gold text-black" : i === currentAdminStep ? "bg-nx-gold/20 text-nx-gold border border-nx-gold/40" : "bg-white/5 text-white/20 border border-white/10"}`}>
                      {i < currentAdminStep ? <Check className="w-3.5 h-3.5" /> : i + 1}
                    </div>
                    {i < adminSteps.length - 1 && <div className={`w-8 h-px ${i < currentAdminStep ? "bg-nx-gold" : "bg-white/10"}`} />}
                  </div>
                ))}
              </div>
            )}

            {/* Step 1: Email */}
            {step === "adminEmail" && (
              <Card className="w-full border border-white/5 bg-nx-surface/80 backdrop-blur-xl">
                <CardHeader className="text-center pt-6">
                  <div className="w-12 h-12 rounded-full bg-nx-gold/10 flex items-center justify-center mx-auto mb-3"><Mail className="w-6 h-6 text-nx-gold" /></div>
                  <CardTitle className="text-xl text-white">Admin Login</CardTitle>
                  <CardDescription className="text-white/40">Enter your registered admin email</CardDescription>
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

            {/* Step 2: OTP */}
            {step === "adminOtp" && (
              <Card className="w-full border border-white/5 bg-nx-surface/80 backdrop-blur-xl">
                <CardHeader className="text-center pt-6">
                  <button onClick={() => { setStep("adminEmail"); setAdminError(null); setOtp(""); }} className="text-white/30 hover:text-white/60 text-xs transition-colors flex items-center gap-1 mb-2 mx-auto"><ArrowLeft className="w-3 h-3" /> Back</button>
                  <div className="w-12 h-12 rounded-full bg-nx-gold/10 flex items-center justify-center mx-auto mb-3"><Mail className="w-6 h-6 text-nx-gold" /></div>
                  <CardTitle className="text-xl text-white">Check your email</CardTitle>
                  <CardDescription className="text-white/40">Code sent to<br /><span className="text-white/60 font-medium">{adminEmail}</span></CardDescription>
                </CardHeader>
                <form onSubmit={handleAdminOtpSubmit}>
                  <CardContent className="space-y-4 pb-6">
                    <div className="flex justify-center"><InputOTP value={otp} onChange={setOtp} maxLength={6} disabled={isLoading}><InputOTPGroup>{Array.from({ length: 6 }).map((_, i) => <InputOTPSlot key={i} index={i} className="bg-white/[0.03] border-white/10 text-white" />)}</InputOTPGroup></InputOTP></div>
                    {adminError && <p className="text-sm text-red-400 text-center">{adminError}</p>}
                    <Button type="submit" className="w-full bg-nx-gold hover:bg-nx-gold/80 text-black font-semibold" disabled={isLoading || otp.length !== 6}>
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Verify Code <ArrowRight className="ml-2 h-4 w-4" /></>}
                    </Button>
                  </CardContent>
                </form>
              </Card>
            )}

            {/* Step 3: Password */}
            {step === "adminPassword" && (
              <Card className="w-full border border-white/5 bg-nx-surface/80 backdrop-blur-xl">
                <CardHeader className="text-center pt-6">
                  <button onClick={() => { setStep("adminOtp"); setAdminError(null); setAdminPassword(""); }} className="text-white/30 hover:text-white/60 text-xs transition-colors flex items-center gap-1 mb-2 mx-auto"><ArrowLeft className="w-3 h-3" /> Back</button>
                  <div className="w-12 h-12 rounded-full bg-nx-gold/10 flex items-center justify-center mx-auto mb-3"><Lock className="w-6 h-6 text-nx-gold" /></div>
                  <CardTitle className="text-xl text-white">{adminHasPassword === false ? "Set Admin Password" : "Admin Password"}</CardTitle>
                  <CardDescription className="text-white/40">{adminHasPassword === false ? "No password set yet. Create one." : "Enter your admin password"}</CardDescription>
                </CardHeader>
                {adminHasPassword !== false ? (
                  <form onSubmit={handleAdminPasswordSubmit}>
                    <CardContent className="space-y-4 pb-6">
                      <div className="relative"><Lock className="absolute left-3 top-3 h-4 w-4 text-white/30" /><Input type="password" placeholder="Enter your password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="pl-9 bg-white/[0.03] border-white/10 text-white placeholder:text-white/20 focus:border-nx-gold/50" required autoFocus /></div>
                      {adminError && <p className="text-sm text-red-400 text-center">{adminError}</p>}
                      <Button type="submit" className="w-full bg-nx-gold hover:bg-nx-gold/80 text-black font-semibold" disabled={isLoading || !adminPassword}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Verify Password <ArrowRight className="ml-2 h-4 w-4" /></>}
                      </Button>
                    </CardContent>
                  </form>
                ) : (
                  <form onSubmit={handleAdminSetPasswordSubmit}>
                    <CardContent className="space-y-4 pb-6">
                      <div className="relative"><Lock className="absolute left-3 top-3 h-4 w-4 text-white/30" /><Input type="password" placeholder="Create password (min 8 chars)" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="pl-9 bg-white/[0.03] border-white/10 text-white placeholder:text-white/20 focus:border-nx-gold/50" required autoFocus minLength={8} /></div>
                      <div className="relative"><Lock className="absolute left-3 top-3 h-4 w-4 text-white/30" /><Input type="password" placeholder="Confirm password" value={adminConfirmPassword} onChange={(e) => setAdminConfirmPassword(e.target.value)} className="pl-9 bg-white/[0.03] border-white/10 text-white placeholder:text-white/20 focus:border-nx-gold/50" required minLength={8} /></div>
                      {adminPassword && adminConfirmPassword && adminPassword !== adminConfirmPassword && <p className="text-xs text-red-400">Passwords do not match</p>}
                      {adminError && <p className="text-sm text-red-400 text-center">{adminError}</p>}
                      <Button type="submit" className="w-full bg-nx-gold hover:bg-nx-gold/80 text-black font-semibold" disabled={isLoading || !adminPassword || !adminConfirmPassword || adminPassword !== adminConfirmPassword}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Set Password & Continue <ArrowRight className="ml-2 h-4 w-4" /></>}
                      </Button>
                    </CardContent>
                  </form>
                )}
              </Card>
            )}

            {/* Step 4: 2FA */}
            {step === "admin2fa" && (
              <Card className="w-full border border-white/5 bg-nx-surface/80 backdrop-blur-xl">
                <CardHeader className="text-center pt-6">
                  <button onClick={() => { setStep("adminPassword"); setAdminError(null); setOtp(""); }} className="text-white/30 hover:text-white/60 text-xs transition-colors flex items-center gap-1 mb-2 mx-auto"><ArrowLeft className="w-3 h-3" /> Back</button>
                  <div className="w-12 h-12 rounded-full bg-nx-gold/10 flex items-center justify-center mx-auto mb-3"><Lock className="w-6 h-6 text-nx-gold" /></div>
                  <CardTitle className="text-xl text-white">Two-Factor Authentication</CardTitle>
                  <CardDescription className="text-white/40">Enter the 6-digit code from your authenticator app</CardDescription>
                </CardHeader>
                <form onSubmit={handleAdminTotpSubmit}>
                  <CardContent className="space-y-4 pb-6">
                    <div className="flex justify-center"><InputOTP value={otp} onChange={setOtp} maxLength={6} disabled={isLoading}><InputOTPGroup>{Array.from({ length: 6 }).map((_, i) => <InputOTPSlot key={i} index={i} className="bg-white/[0.03] border-white/10 text-white" />)}</InputOTPGroup></InputOTP></div>
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

  return (
    <div className="min-h-screen bg-[#05050A] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background ambient effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-nx-violet/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-nx-cyan/3 rounded-full blur-[100px]" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.03)_0%,transparent_70%)]" />
      </div>

      <div className="flex-1 flex items-center justify-center w-full px-4 relative z-10">
        <div className="flex items-center justify-center h-full flex-col w-full max-w-[900px]">
          {/* Logo */}
          <button onClick={() => navigate("/")} className="flex items-center gap-2 mb-6 group">
            <Shield className="w-8 h-8 text-nx-violet group-hover:text-nx-cyan transition-colors" />
            <span className="text-xl font-bold tracking-tight text-white">
              NEXORA<span className="text-nx-violet">.</span>
            </span>
          </button>

          {/* ===== STEP 1: Role Selection ===== */}
          {step === "roleSelect" && (
            <div className="w-full max-w-[640px]">
              <div className="text-center mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Choose Your Path</h1>
                <p className="text-white/40 text-sm">
                  How will you use Nexora Market?
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Buyer Card */}
                <button
                  onClick={() => handleRoleSelect("buyer")}
                  className="group relative p-6 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm hover:border-nx-cyan/30 hover:bg-nx-cyan/5 transition-all duration-300 text-left"
                >
                  <div className="w-14 h-14 rounded-xl bg-nx-cyan/10 flex items-center justify-center mb-4 group-hover:bg-nx-cyan/20 transition-colors">
                    <ShoppingBag className="w-7 h-7 text-nx-cyan" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">I'm a Buyer</h3>
                  <p className="text-white/40 text-sm leading-relaxed mb-4">
                    Browse products, make secure purchases with escrow protection, track deliveries.
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {["Escrow-protected purchases", "AI fraud detection", "Insured delivery tracking"].map((f) => (
                      <div key={f} className="flex items-center gap-2 text-xs text-white/30">
                        <Check className="w-3 h-3 text-nx-cyan/60" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/10 group-hover:text-nx-cyan/50 transition-colors" />
                </button>

                {/* Seller Card */}
                <button
                  onClick={() => handleRoleSelect("seller")}
                  className="group relative p-6 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm hover:border-nx-violet/30 hover:bg-nx-violet/5 transition-all duration-300 text-left"
                >
                  <div className="w-14 h-14 rounded-xl bg-nx-violet/10 flex items-center justify-center mb-4 group-hover:bg-nx-violet/20 transition-colors">
                    <Store className="w-7 h-7 text-nx-violet" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">I'm a Seller</h3>
                  <p className="text-white/40 text-sm leading-relaxed mb-4">
                    List products, manage orders, withdraw earnings. KYC verification required.
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {["KYC business verification", "Product management", "Analytics & earnings"].map((f) => (
                      <div key={f} className="flex items-center gap-2 text-xs text-white/30">
                        <Check className="w-3 h-3 text-nx-violet/60" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/10 group-hover:text-nx-violet/50 transition-colors" />
                </button>
              </div>

              {/* Trust signals */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-[11px] text-white/20">
                <div className="flex items-center gap-1.5"><Lock className="w-3 h-3" /> Bank-Level Encryption</div>
                <div className="flex items-center gap-1.5"><Shield className="w-3 h-3" /> CBK Compliant</div>
                <div className="flex items-center gap-1.5"><Globe className="w-3 h-3" /> 47 Counties Covered</div>
                <div className="flex items-center gap-1.5"><Zap className="w-3 h-3" /> Instant Escrow</div>
              </div>

              <div className="mt-6 text-center">
                <button onClick={handleGuestLogin} className="text-xs text-white/20 hover:text-white/40 transition-colors">
                  Continue as Guest →
                </button>
              </div>
            </div>
          )}

          {/* ===== STEP 2: Sign In / Create Account ===== */}
          {step === "signIn" && (
            <Card className="w-full max-w-[440px] border border-white/5 bg-nx-surface/80 backdrop-blur-xl shadow-2xl shadow-nx-violet/5">
              <CardHeader className="text-center pt-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <button onClick={() => setStep("roleSelect")} className="text-white/30 hover:text-white/60 text-xs transition-colors flex items-center gap-1">
                    <ArrowLeft className="w-3 h-3" /> Change
                  </button>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${selectedRole === "seller" ? "bg-nx-violet/10 text-nx-violet" : "bg-nx-cyan/10 text-nx-cyan"}`}>
                    {selectedRole === "seller" ? "🏪 Seller" : "🛒 Buyer"}
                  </span>
                </div>
                <CardTitle className="text-xl text-white">
                  {selectedRole === "seller" ? "Create Seller Account" : "Create Buyer Account"}
                </CardTitle>
                <CardDescription className="text-white/40">
                  {selectedRole === "seller"
                    ? "Set up your seller account to start listing products"
                    : "Create your account to start shopping securely"}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Google Login */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-white/[0.03] border-white/10 text-white hover:bg-white/[0.06] hover:border-white/20 h-11"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </Button>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/5" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-nx-surface px-2 text-white/20 tracking-wider">or create with email</span>
                  </div>
                </div>

                {/* Registration Form */}
                <form onSubmit={handleEmailSubmit} className="space-y-3">
                  {/* Full Name */}
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-white/30" />
                    <Input
                      name="name"
                      placeholder="Full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-9 bg-white/[0.03] border-white/10 text-white placeholder:text-white/20 focus:border-nx-violet/50 focus:ring-nx-violet/20"
                      disabled={isLoading}
                      required
                    />
                  </div>

                  {/* Email */}
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-white/30" />
                    <Input
                      name="email"
                      placeholder="Email address"
                      type="email"
                      className="pl-9 bg-white/[0.03] border-white/10 text-white placeholder:text-white/20 focus:border-nx-violet/50 focus:ring-nx-violet/20"
                      disabled={isLoading}
                      required
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-white/30" />
                    <Input
                      name="phone"
                      placeholder="Phone number (e.g. 0712 345 678)"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="pl-9 bg-white/[0.03] border-white/10 text-white placeholder:text-white/20 focus:border-nx-violet/50 focus:ring-nx-violet/20"
                      disabled={isLoading}
                      required
                    />
                  </div>

                  {/* Role field (hidden, sent with form) */}
                  <input type="hidden" name="role" value={selectedRole || "buyer"} />

                  {error && <p className="text-sm text-red-400">{error}</p>}

                  <Button
                    type="submit"
                    className="w-full bg-nx-violet hover:bg-nx-violet/80 text-white h-11"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>Send Verification Code <ArrowRight className="ml-2 h-4 w-4" /></>
                    )}
                  </Button>
                </form>

                <p className="text-[11px] text-white/20 text-center">
                  {selectedRole === "seller"
                    ? "Sellers must complete KYC verification before listing products"
                    : "By creating an account, you agree to Nexora's Terms & Privacy Policy"}
                </p>
              </CardContent>

              <div className="py-3 px-6 text-xs text-center text-white/20 bg-white/[0.02] border-t border-white/5 rounded-b-lg flex items-center justify-center gap-1.5">
                <Shield className="w-3 h-3" /> Protected by Nexora Escrow Security
              </div>
            </Card>
          )}

          {/* ===== STEP 3: OTP Verification ===== */}
          {typeof step === "object" && (
            <Card className="w-full max-w-[420px] border border-white/5 bg-nx-surface/80 backdrop-blur-xl shadow-2xl shadow-nx-violet/5">
              <CardHeader className="text-center pt-6">
                <div className="w-12 h-12 rounded-full bg-nx-violet/10 flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-6 h-6 text-nx-violet" />
                </div>
                <CardTitle className="text-xl text-white">Check your email</CardTitle>
                <CardDescription className="text-white/40">
                  We've sent a 6-digit code to<br />
                  <span className="text-white/60 font-medium">{step.email}</span>
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleOtpSubmit}>
                <CardContent className="pb-4 space-y-4">
                  <input type="hidden" name="email" value={step.email} />
                  <input type="hidden" name="code" value={otp} />

                  <div className="flex justify-center">
                    <InputOTP
                      value={otp}
                      onChange={setOtp}
                      maxLength={6}
                      disabled={isLoading}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && otp.length === 6 && !isLoading) {
                          const form = (e.target as HTMLElement).closest("form");
                          if (form) form.requestSubmit();
                        }
                      }}
                    >
                      <InputOTPGroup>
                        {Array.from({ length: 6 }).map((_, index) => (
                          <InputOTPSlot key={index} index={index} className="bg-white/[0.03] border-white/10 text-white" />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  {error && <p className="text-sm text-red-400 text-center">{error}</p>}

                  <p className="text-sm text-white/30 text-center">
                    Didn't receive a code?{" "}
                    <Button variant="link" className="p-0 h-auto text-nx-violet hover:text-nx-violet/80" onClick={() => setStep("signIn")}>
                      Try again
                    </Button>
                  </p>
                </CardContent>
                <CardFooter className="flex-col gap-2 pb-6">
                  <Button
                    type="submit"
                    className="w-full bg-nx-violet hover:bg-nx-violet/80 text-white"
                    disabled={isLoading || otp.length !== 6}
                  >
                    {isLoading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</>
                    ) : (
                      <>Verify & Continue <ArrowRight className="ml-2 h-4 w-4" /></>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep("signIn")}
                    disabled={isLoading}
                    className="w-full text-white/40 hover:text-white hover:bg-white/[0.02]"
                  >
                    Use different email
                  </Button>
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
