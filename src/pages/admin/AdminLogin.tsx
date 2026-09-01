import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Shield,
  ArrowRight,
  Loader2,
  ArrowLeft,
  Mail,
  KeyRound,
  Lock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

type Step = "email" | "password" | "otp" | "2fa" | "setPassword" | "done";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { user, signIn, isAuthenticated, isLoading: authLoading } = useAuth();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);

  // Convex mutations
  const verifyAdminPassword = useMutation(api.adminAuth.verifyAdminPassword);
  const setAdminPassword = useMutation(api.adminAuth.setAdminPassword);
  const setupAdmin2FA = useMutation(api.adminAuth.setupAdmin2FA);
  const confirmAdmin2FA = useMutation(api.adminAuth.confirmAdmin2FA);
  const validateAdmin2FA = useMutation(api.adminAuth.validateAdmin2FA);
  const checkAndPromoteAdmin = useMutation(api.users.checkAndPromoteAdmin);

  // Queries
  const admin2FAStatus = useQuery(
    api.adminAuth.isAdmin2FAEnabled,
    isAuthenticated ? {} : "skip"
  );

  // Redirect if already verified admin
  useEffect(() => {
    if (
      !authLoading &&
      isAuthenticated &&
      admin2FAStatus?.isAdmin &&
      admin2FAStatus?.enabled
    ) {
      const verified = sessionStorage.getItem("admin2fa_verified");
      if (verified === "true") {
        navigate("/admin");
      }
    }
  }, [authLoading, isAuthenticated, admin2FAStatus, navigate]);

  // Auto-promote when authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated && user && user.role !== "admin") {
      checkAndPromoteAdmin()
        .then((result) => {
          if (result?.promoted) {
            window.location.reload();
          }
        })
        .catch(() => {});
    }
  }, [authLoading, isAuthenticated, user, checkAndPromoteAdmin]);

  // Step 1: Email → send OTP
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    setError(null);
    try {
      // Send OTP
      const formData = new FormData();
      formData.set("email", email);
      await signIn("email-otp", formData);
      setStep("otp");
    } catch (err: any) {
      setError(err.message || "Failed to send verification code.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: OTP → verify, then check if password exists
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("code", otp);
      await signIn("email-otp", formData);
      // Wait for auth to propagate
      await new Promise((r) => setTimeout(r, 1000));
      // After OTP verified, check password status
      setStep("password");
    } catch (err: any) {
      setError("Invalid verification code. Please try again.");
      setOtp("");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Password → verify against stored hash
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setIsLoading(true);
    setError(null);
    try {
      await verifyAdminPassword({ email, password });
      // Password valid — proceed to 2FA
      setStep("2fa");
    } catch (err: any) {
      const msg = err.message || "Invalid password.";
      if (msg.includes("No admin password set")) {
        // First time — show password setup
        setHasPassword(false);
        setPassword("");
        setError(null);
      } else {
        setError(msg);
        setPassword("");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3b: First-time password setup
  const handleSetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password !== confirmPassword) return;
    setIsLoading(true);
    setError(null);
    try {
      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }
      await setAdminPassword({ password });
      setStep("2fa");
    } catch (err: any) {
      setError(err.message || "Failed to set password.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 4: 2FA → verify TOTP
  const handleTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totpCode.length !== 6) return;
    setIsLoading(true);
    setError(null);
    try {
      if (!admin2FAStatus?.isAdmin) {
        throw new Error("Access denied. This account does not have admin privileges.");
      }

      if (!admin2FAStatus.hasSecret) {
        // First time — generate secret then confirm
        const setupResult = await setupAdmin2FA();
        if (setupResult?.secret) {
          const confirmResult = await confirmAdmin2FA({ code: totpCode });
          if (confirmResult?.success) {
            sessionStorage.setItem("admin2fa_verified", "true");
            setStep("done");
            setTimeout(() => navigate("/admin"), 1500);
          }
        }
        return;
      }

      if (!admin2FAStatus.enabled && admin2FAStatus.hasSecret) {
        // Secret generated but not confirmed yet
        const confirmResult = await confirmAdmin2FA({ code: totpCode });
        if (confirmResult?.success) {
          sessionStorage.setItem("admin2fa_verified", "true");
          setStep("done");
          setTimeout(() => navigate("/admin"), 1500);
        }
        return;
      }

      // 2FA is enabled — validate the code
      const result = await validateAdmin2FA({ code: totpCode });
      if (result?.success) {
        sessionStorage.setItem("admin2fa_verified", "true");
        setStep("done");
        setTimeout(() => navigate("/admin"), 1500);
      }
    } catch (err: any) {
      setError(err.message || "Invalid 2FA code.");
      setTotpCode("");
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { id: "email", label: "Email" },
    { id: "otp", label: "Verify" },
    { id: "password", label: "Password" },
    { id: "2fa", label: "2FA" },
  ];

  const currentStepIndex = steps.findIndex(
    (s) =>
      s.id === step ||
      (step === "setPassword" && s.id === "password") ||
      (step === "done" && s.id === "2fa")
  );

  return (
    <div className="min-h-screen bg-[#05050A] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-nx-gold/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-red-500/3 rounded-full blur-[100px]" />
      </div>

      <div className="flex-1 flex items-center justify-center w-full px-4 relative z-10">
        <div className="flex items-center justify-center h-full flex-col w-full max-w-[520px]">
          {/* Logo */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 mb-6 group"
          >
            <Shield className="w-8 h-8 text-nx-gold group-hover:text-nx-cyan transition-colors" />
            <span className="text-xl font-bold tracking-tight text-white">
              NEXORA<span className="text-nx-gold">.</span>
            </span>
          </button>

          {/* Admin badge */}
          <div className="mb-4 px-3 py-1.5 rounded-lg bg-nx-gold/10 text-nx-gold text-[10px] font-bold tracking-widest uppercase">
            ADMIN CONTROL CENTER
          </div>

          {/* Progress steps */}
          {step !== "done" && (
            <div className="flex items-center gap-2 mb-6">
              {steps.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                      i < currentStepIndex
                        ? "bg-nx-gold text-black"
                        : i === currentStepIndex
                          ? "bg-nx-gold/20 text-nx-gold border border-nx-gold/40"
                          : "bg-white/5 text-white/20 border border-white/10"
                    }`}
                  >
                    {i < currentStepIndex ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      i + 1
                    )}
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className={`w-8 h-px ${
                        i < currentStepIndex ? "bg-nx-gold" : "bg-white/10"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <p className="text-white/30 text-xs mb-6 text-center max-w-sm">
            {step === "done"
              ? "Welcome to the Admin Control Center."
              : "Secured area. Admin access requires email, password, and two-factor authentication."}
          </p>

          {/* STEP 1: Email */}
          {step === "email" && (
            <Card className="w-full border border-white/5 bg-nx-surface/80 backdrop-blur-xl">
              <CardHeader className="text-center pt-6">
                <div className="w-12 h-12 rounded-full bg-nx-gold/10 flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-6 h-6 text-nx-gold" />
                </div>
                <CardTitle className="text-xl text-white">
                  Admin Login
                </CardTitle>
                <CardDescription className="text-white/40">
                  Enter your registered admin email address
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleEmailSubmit}>
                <CardContent className="space-y-4 pb-6">
                  <Input
                    type="email"
                    placeholder="admin@nexora.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/[0.03] border-white/10 text-white placeholder:text-white/20 focus:border-nx-gold/50"
                    required
                    autoFocus
                  />
                  {error && (
                    <div className="flex items-center gap-2 text-sm text-red-400 bg-red-400/5 border border-red-400/10 rounded-lg p-3">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {error}
                    </div>
                  )}
                  <Button
                    type="submit"
                    className="w-full bg-nx-gold hover:bg-nx-gold/80 text-black font-semibold"
                    disabled={isLoading || !email}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Send Verification Code
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </form>
            </Card>
          )}

          {/* STEP 2: OTP */}
          {step === "otp" && (
            <Card className="w-full border border-white/5 bg-nx-surface/80 backdrop-blur-xl">
              <CardHeader className="text-center pt-6">
                <button
                  onClick={() => {
                    setStep("email");
                    setError(null);
                    setOtp("");
                  }}
                  className="text-white/30 hover:text-white/60 text-xs transition-colors flex items-center gap-1 mb-2 mx-auto"
                >
                  <ArrowLeft className="w-3 h-3" /> Back
                </button>
                <div className="w-12 h-12 rounded-full bg-nx-gold/10 flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-6 h-6 text-nx-gold" />
                </div>
                <CardTitle className="text-xl text-white">
                  Check your email
                </CardTitle>
                <CardDescription className="text-white/40">
                  We sent a 6-digit code to
                  <br />
                  <span className="text-white/60 font-medium">{email}</span>
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleOtpSubmit}>
                <CardContent className="space-y-4 pb-6">
                  <div className="flex justify-center">
                    <InputOTP
                      value={otp}
                      onChange={setOtp}
                      maxLength={6}
                      disabled={isLoading}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          otp.length === 6 &&
                          !isLoading
                        ) {
                          const form = (e.target as HTMLElement).closest(
                            "form"
                          );
                          if (form) form.requestSubmit();
                        }
                      }}
                    >
                      <InputOTPGroup>
                        {Array.from({ length: 6 }).map((_, i) => (
                          <InputOTPSlot
                            key={i}
                            index={i}
                            className="bg-white/[0.03] border-white/10 text-white"
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  {error && (
                    <div className="flex items-center gap-2 text-sm text-red-400 bg-red-400/5 border border-red-400/10 rounded-lg p-3">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {error}
                    </div>
                  )}
                  <Button
                    type="submit"
                    className="w-full bg-nx-gold hover:bg-nx-gold/80 text-black font-semibold"
                    disabled={isLoading || otp.length !== 6}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Verify Code
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </form>
            </Card>
          )}

          {/* STEP 3: Password (login or setup) */}
          {step === "password" && (
            <Card className="w-full border border-white/5 bg-nx-surface/80 backdrop-blur-xl">
              <CardHeader className="text-center pt-6">
                <button
                  onClick={() => {
                    setStep("otp");
                    setError(null);
                    setPassword("");
                    setHasPassword(null);
                  }}
                  className="text-white/30 hover:text-white/60 text-xs transition-colors flex items-center gap-1 mb-2 mx-auto"
                >
                  <ArrowLeft className="w-3 h-3" /> Back
                </button>
                <div className="w-12 h-12 rounded-full bg-nx-gold/10 flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-6 h-6 text-nx-gold" />
                </div>
                <CardTitle className="text-xl text-white">
                  {hasPassword === false ? "Set Admin Password" : "Admin Password"}
                </CardTitle>
                <CardDescription className="text-white/40">
                  {hasPassword === false
                    ? "No password set yet. Create one to secure your admin account."
                    : "Enter your admin password"}
                </CardDescription>
              </CardHeader>

              {/* Login form */}
              {hasPassword !== false && (
                <form onSubmit={handlePasswordSubmit}>
                  <CardContent className="space-y-4 pb-6">
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-white/30" />
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-9 bg-white/[0.03] border-white/10 text-white placeholder:text-white/20 focus:border-nx-gold/50"
                        required
                        autoFocus
                      />
                    </div>
                    {error && (
                      <div className="flex items-center gap-2 text-sm text-red-400 bg-red-400/5 border border-red-400/10 rounded-lg p-3">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {error}
                      </div>
                    )}
                    <Button
                      type="submit"
                      className="w-full bg-nx-gold hover:bg-nx-gold/80 text-black font-semibold"
                      disabled={isLoading || !password}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Verify Password
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </form>
              )}

              {/* Setup form */}
              {hasPassword === false && (
                <form onSubmit={handleSetPasswordSubmit}>
                  <CardContent className="space-y-4 pb-6">
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-white/30" />
                      <Input
                        type="password"
                        placeholder="Create a password (min 8 characters)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-9 bg-white/[0.03] border-white/10 text-white placeholder:text-white/20 focus:border-nx-gold/50"
                        required
                        autoFocus
                        minLength={8}
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-white/30" />
                      <Input
                        type="password"
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-9 bg-white/[0.03] border-white/10 text-white placeholder:text-white/20 focus:border-nx-gold/50"
                        required
                        minLength={8}
                      />
                    </div>
                    {password && confirmPassword && password !== confirmPassword && (
                      <p className="text-xs text-red-400">Passwords do not match</p>
                    )}
                    {error && (
                      <div className="flex items-center gap-2 text-sm text-red-400 bg-red-400/5 border border-red-400/10 rounded-lg p-3">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {error}
                      </div>
                    )}
                    <Button
                      type="submit"
                      className="w-full bg-nx-gold hover:bg-nx-gold/80 text-black font-semibold"
                      disabled={isLoading || !password || !confirmPassword || password !== confirmPassword}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Set Password & Continue
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </form>
              )}
            </Card>
          )}

          {/* STEP 4: 2FA */}
          {step === "2fa" && (
            <Card className="w-full border border-white/5 bg-nx-surface/80 backdrop-blur-xl">
              <CardHeader className="text-center pt-6">
                <button
                  onClick={() => {
                    setStep("password");
                    setError(null);
                    setTotpCode("");
                  }}
                  className="text-white/30 hover:text-white/60 text-xs transition-colors flex items-center gap-1 mb-2 mx-auto"
                >
                  <ArrowLeft className="w-3 h-3" /> Back
                </button>
                <div className="w-12 h-12 rounded-full bg-nx-gold/10 flex items-center justify-center mx-auto mb-3">
                  <KeyRound className="w-6 h-6 text-nx-gold" />
                </div>
                <CardTitle className="text-xl text-white">
                  Two-Factor Authentication
                </CardTitle>
                <CardDescription className="text-white/40">
                  {!admin2FAStatus
                    ? "Checking 2FA status..."
                    : !admin2FAStatus.isAdmin
                      ? "This account does not have admin privileges."
                      : admin2FAStatus.hasSecret
                        ? "Enter the 6-digit code from your authenticator app"
                        : "First time — scan the QR code in your authenticator app, then enter the code"}
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleTotpSubmit}>
                <CardContent className="space-y-4 pb-6">
                  <div className="flex justify-center">
                    <InputOTP
                      value={totpCode}
                      onChange={setTotpCode}
                      maxLength={6}
                      disabled={isLoading || !admin2FAStatus}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          totpCode.length === 6 &&
                          !isLoading
                        ) {
                          const form = (e.target as HTMLElement).closest(
                            "form"
                          );
                          if (form) form.requestSubmit();
                        }
                      }}
                    >
                      <InputOTPGroup>
                        {Array.from({ length: 6 }).map((_, i) => (
                          <InputOTPSlot
                            key={i}
                            index={i}
                            className="bg-white/[0.03] border-white/10 text-white"
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  {error && (
                    <div className="flex items-center gap-2 text-sm text-red-400 bg-red-400/5 border border-red-400/10 rounded-lg p-3">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {error}
                    </div>
                  )}
                  <Button
                    type="submit"
                    className="w-full bg-nx-gold hover:bg-nx-gold/80 text-black font-semibold"
                    disabled={isLoading || totpCode.length !== 6 || !admin2FAStatus?.isAdmin}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Verify & Enter Admin Panel
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </form>
            </Card>
          )}

          {/* Done screen */}
          {step === "done" && (
            <Card className="w-full border border-white/5 bg-nx-surface/80 backdrop-blur-xl">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Access Granted
                </h2>
                <p className="text-white/40 text-sm">
                  Redirecting to Admin Control Center...
                </p>
                <Loader2 className="w-5 h-5 animate-spin text-nx-gold mx-auto mt-4" />
              </CardContent>
            </Card>
          )}

          {/* Back to regular login */}
          <div className="mt-4 text-center">
            <button
              onClick={() => navigate("/auth")}
              className="text-xs text-white/20 hover:text-white/40 transition-colors"
            >
              ← Back to regular login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
