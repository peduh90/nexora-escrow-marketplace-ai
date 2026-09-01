import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Shield, ArrowRight, Loader2, ArrowLeft, Mail, KeyRound,
} from "lucide-react";

type Step = "email" | "otp" | "2fa";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { user, signIn, isAuthenticated, isLoading: authLoading } = useAuth();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  // Convex mutations
  const setupAdmin2FA = useMutation(api.adminAuth.setupAdmin2FA);
  const confirmAdmin2FA = useMutation(api.adminAuth.confirmAdmin2FA);
  const validateAdmin2FA = useMutation(api.adminAuth.validateAdmin2FA);
  const checkAndPromoteAdmin = useMutation(api.users.checkAndPromoteAdmin);

  // Convex queries — only fetch after auth
  const admin2FAStatus = useQuery(
    api.adminAuth.isAdmin2FAEnabled,
    hasMounted && isAuthenticated ? {} : "skip"
  );

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Redirect if already authenticated as admin with 2FA verified
  useEffect(() => {
    if (!authLoading && isAuthenticated && admin2FAStatus?.isAdmin && admin2FAStatus?.enabled) {
      // Check if we've already validated 2FA this session
      const verified = sessionStorage.getItem("admin2fa_verified");
      if (verified === "true") {
        navigate("/admin");
      }
    }
  }, [authLoading, isAuthenticated, admin2FAStatus, navigate]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    setError(null);
    try {
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
      await new Promise((r) => setTimeout(r, 800));
      setStep("2fa");
    } catch (err: any) {
      setError("Invalid verification code. Please try again.");
      setOtp("");
    } finally {
      setIsLoading(false);
    }
  };

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
          // Show the secret/QR, then verify
          const confirmResult = await confirmAdmin2FA({ code: totpCode });
          if (confirmResult?.success) {
            sessionStorage.setItem("admin2fa_verified", "true");
            navigate("/admin");
          }
        }
        return;
      }

      if (!admin2FAStatus.enabled && admin2FAStatus.hasSecret) {
        // Secret generated but not confirmed yet
        const confirmResult = await confirmAdmin2FA({ code: totpCode });
        if (confirmResult?.success) {
          sessionStorage.setItem("admin2fa_verified", "true");
          navigate("/admin");
        }
        return;
      }

      // 2FA is enabled — validate the code
      const result = await validateAdmin2FA({ code: totpCode });
      if (result?.success) {
        sessionStorage.setItem("admin2fa_verified", "true");
        navigate("/admin");
      }
    } catch (err: any) {
      setError(err.message || "Invalid 2FA code.");
      setTotpCode("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05050A] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-nx-gold/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-red-500/3 rounded-full blur-[100px]" />
      </div>

      <div className="flex-1 flex items-center justify-center w-full px-4 relative z-10">
        <div className="flex items-center justify-center h-full flex-col w-full max-w-[520px]">
          {/* Logo */}
          <button onClick={() => navigate("/")} className="flex items-center gap-2 mb-6 group">
            <Shield className="w-8 h-8 text-nx-gold group-hover:text-nx-cyan transition-colors" />
            <span className="text-xl font-bold tracking-tight text-white">
              NEXORA<span className="text-nx-gold">.</span>
            </span>
          </button>

          {/* Admin badge */}
          <div className="mb-4 px-3 py-1.5 rounded-lg bg-nx-gold/10 text-nx-gold text-[10px] font-bold tracking-widest uppercase">
            ADMIN CONTROL CENTER
          </div>

          <p className="text-white/30 text-xs mb-6 text-center max-w-sm">
            Secured area. Admin access requires email verification and two-factor authentication.
          </p>

          {/* STEP 1: Email */}
          {step === "email" && (
            <Card className="w-full border border-white/5 bg-nx-surface/80 backdrop-blur-xl">
              <CardHeader className="text-center pt-6">
                <div className="w-12 h-12 rounded-full bg-nx-gold/10 flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-6 h-6 text-nx-gold" />
                </div>
                <CardTitle className="text-xl text-white">Admin Login</CardTitle>
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
                  {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                  <Button
                    type="submit"
                    className="w-full bg-nx-gold hover:bg-nx-gold/80 text-black font-semibold"
                    disabled={isLoading || !email}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>Send Verification Code <ArrowRight className="ml-2 h-4 w-4" /></>
                    )}
                  </Button>
                </CardContent>
              </form>
            </Card>
          )}

          {/* STEP 2: Email OTP */}
          {step === "otp" && (
            <Card className="w-full border border-white/5 bg-nx-surface/80 backdrop-blur-xl">
              <CardHeader className="text-center pt-6">
                <button
                  onClick={() => { setStep("email"); setError(null); setOtp(""); }}
                  className="text-white/30 hover:text-white/60 text-xs transition-colors flex items-center gap-1 mb-2"
                >
                  <ArrowLeft className="w-3 h-3" /> Back
                </button>
                <div className="w-12 h-12 rounded-full bg-nx-gold/10 flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-6 h-6 text-nx-gold" />
                </div>
                <CardTitle className="text-xl text-white">Check your email</CardTitle>
                <CardDescription className="text-white/40">
                  We sent a 6-digit code to<br />
                  <span className="text-white/60 font-medium">{email}</span>
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleOtpSubmit}>
                <CardContent className="space-y-4 pb-6">
                  <div className="flex justify-center">
                    <InputOTP value={otp} onChange={setOtp} maxLength={6} disabled={isLoading}>
                      <InputOTPGroup>
                        {Array.from({ length: 6 }).map((_, i) => (
                          <InputOTPSlot key={i} index={i} className="bg-white/[0.03] border-white/10 text-white" />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                  <Button
                    type="submit"
                    className="w-full bg-nx-gold hover:bg-nx-gold/80 text-black font-semibold"
                    disabled={isLoading || otp.length !== 6}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>Verify Code <ArrowRight className="ml-2 h-4 w-4" /></>
                    )}
                  </Button>
                </CardContent>
              </form>
            </Card>
          )}

          {/* STEP 3: 2FA Code */}
          {step === "2fa" && (
            <Card className="w-full border border-white/5 bg-nx-surface/80 backdrop-blur-xl">
              <CardHeader className="text-center pt-6">
                <button
                  onClick={() => { setStep("otp"); setError(null); setTotpCode(""); }}
                  className="text-white/30 hover:text-white/60 text-xs transition-colors flex items-center gap-1 mb-2"
                >
                  <ArrowLeft className="w-3 h-3" /> Back
                </button>
                <div className="w-12 h-12 rounded-full bg-nx-gold/10 flex items-center justify-center mx-auto mb-3">
                  <KeyRound className="w-6 h-6 text-nx-gold" />
                </div>
                <CardTitle className="text-xl text-white">Two-Factor Authentication</CardTitle>
                <CardDescription className="text-white/40">
                  {!admin2FAStatus
                    ? "Checking 2FA status..."
                    : !admin2FAStatus.isAdmin
                      ? "This account does not have admin privileges."
                      : admin2FAStatus.hasSecret
                        ? "Enter the 6-digit code from your authenticator app"
                        : admin2FAStatus.enabled
                          ? "Enter your 2FA code to continue"
                          : "First time setup — enter the code from your authenticator app after scanning the secret"}
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleTotpSubmit}>
                <CardContent className="space-y-4 pb-6">
                  <div className="flex justify-center">
                    <InputOTP value={totpCode} onChange={setTotpCode} maxLength={6} disabled={isLoading || !admin2FAStatus}>
                      <InputOTPGroup>
                        {Array.from({ length: 6 }).map((_, i) => (
                          <InputOTPSlot key={i} index={i} className="bg-white/[0.03] border-white/10 text-white" />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                  <Button
                    type="submit"
                    className="w-full bg-nx-gold hover:bg-nx-gold/80 text-black font-semibold"
                    disabled={isLoading || totpCode.length !== 6 || !admin2FAStatus?.isAdmin}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>Verify & Enter Admin Panel <ArrowRight className="ml-2 h-4 w-4" /></>
                    )}
                  </Button>
                </CardContent>
              </form>
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
