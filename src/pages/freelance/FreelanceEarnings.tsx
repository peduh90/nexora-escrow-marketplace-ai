import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  ArrowLeft, Wallet, TrendingUp, DollarSign, Clock,
  ArrowUpRight, Phone, Loader2, CheckCircle2, Shield, AlertCircle, X, Plus,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

type DepositStep = "idle" | "sending" | "waiting" | "done" | "error";

export default function FreelanceEarnings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEmployer = user?.role === "employer";

  const projectsResult = useQuery(
    isEmployer ? api.freelance.getEmployerProjects : api.freelance.getMyProjects,
  );
  const allProjects = (projectsResult ?? []) as unknown as Array<{
    _id: string;
    title: string;
    status: string;
    budget: number;
    totalPaid: number;
    employerFunded?: boolean;
    escrowReleased?: boolean;
    freelancerName?: string;
    createdAt: number;
  }>;

  const walletBalance = useQuery(api.wallet.getWalletBalance);
  const initiateStkPush = useAction(api.mpesa.initiateStkPush as any);
  const checkTransactionStatus = useAction(api.mpesa.checkTransactionStatus as any);
  const initiateDeposit = useMutation(api.wallet.initiateDeposit);
  const attachCheckoutRequest = useMutation(api.wallet.attachCheckoutRequest);
  const requestWithdrawal = useMutation(api.wallet.requestWithdrawal);

  // ── Deposit (employer escrow funding) state ──
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositPhone, setDepositPhone] = useState(user?.phone || "");
  const [depositStep, setDepositStep] = useState<DepositStep>("idle");
  const [depositError, setDepositError] = useState("");

  // ── Withdrawal (writer payout) state ──
  const [withdrawPhone, setWithdrawPhone] = useState(user?.phone || "");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawBusy, setWithdrawBusy] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState("");
  const [withdrawErr, setWithdrawErr] = useState("");

  const totalEarned = allProjects
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + (p.totalPaid || 0), 0);

  const handleDeposit = async () => {
    if (!depositAmount || !depositPhone || Number(depositAmount) < 10) return;
    setDepositStep("sending");
    setDepositError("");
    try {
      // 1. Record pending deposit in Convex.
      const dep = await initiateDeposit({ amount: Number(depositAmount), phoneNumber: depositPhone });
      // 2. Send STK Push via Safaricom.
      const stk = await initiateStkPush({
        phoneNumber: depositPhone,
        amount: Number(depositAmount),
        accountReference: dep.reference,
        description: `Nexora wallet deposit of KES ${Number(depositAmount).toLocaleString()}`,
      });
      // 3. Link the Safaricom CheckoutRequestID so the callback resolves this deposit.
      await attachCheckoutRequest({ reference: dep.reference, checkoutRequestId: stk.checkoutRequestId });
      // 4. Poll REAL Safaricom status — never fake success.
      setDepositStep("waiting");
      let attempts = 0;
      const poll = async () => {
        attempts++;
        if (attempts > 24) {
          setDepositStep("error");
          setDepositError("Payment timed out. If you entered your PIN, check your wallet balance in a minute.");
          return;
        }
        try {
          const status = await checkTransactionStatus({ checkoutRequestId: stk.checkoutRequestId });
          if (status.resultCode === "0") {
            setDepositStep("done");
            setTimeout(() => {
              setShowDeposit(false);
              setDepositStep("idle");
              setDepositAmount("");
            }, 2000);
            return;
          }
          if (status.resultCode && status.resultCode !== "1032" && status.resultCode !== "1037") {
            setDepositStep("error");
            setDepositError(status.resultDesc || "M-Pesa payment failed. Please try again.");
            return;
          }
          setTimeout(poll, 5000);
        } catch {
          setTimeout(poll, 5000);
        }
      };
      setTimeout(poll, 5000);
    } catch (err: any) {
      setDepositStep("error");
      setDepositError(err?.message || "M-Pesa payment failed. Please try again.");
    }
  };

  const handleWithdraw = async () => {
    setWithdrawErr("");
    setWithdrawMsg("");
    const amount = Number(withdrawAmount);
    if (!amount || amount < 50) {
      setWithdrawErr("Minimum withdrawal is KES 50.");
      return;
    }
    if (!withdrawPhone.trim()) {
      setWithdrawErr("Enter your M-Pesa number.");
      return;
    }
    setWithdrawBusy(true);
    try {
      await requestWithdrawal({ amount, phoneNumber: withdrawPhone });
      setWithdrawMsg(`Withdrawal of KES ${amount.toLocaleString()} requested. It will be processed within 24 hours.`);
      setWithdrawAmount("");
    } catch (err: any) {
      setWithdrawErr(err.message || "Failed to request withdrawal.");
    } finally {
      setWithdrawBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#05050A]">
      <div className="flex-1 min-w-0">
        <div className="sticky top-0 z-30 h-14 bg-[#08080F]/80 backdrop-blur-xl border-b border-white/5 flex items-center px-4 md:px-6">
          <button onClick={() => navigate(isEmployer ? "/employer" : "/freelance/dashboard")} className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-white/40 hover:text-white/70 transition-colors mr-3">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-sm font-semibold text-white">{isEmployer ? "Wallet & Escrow" : "Earnings"}</h1>
        </div>

        <div className="p-4 md:p-6 space-y-6 pb-20">
          {/* Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Wallet Balance", value: `KES ${(walletBalance?.walletBalance || 0).toLocaleString()}`, icon: Wallet, color: "#10B981" },
              isEmployer
                ? { label: "Held in Escrow", value: `KES ${(walletBalance?.escrowBalance || 0).toLocaleString()}`, icon: Shield, color: "#06B6D4" }
                : { label: "Total Earned", value: `KES ${totalEarned.toLocaleString()}`, icon: TrendingUp, color: "#8B5CF6" },
              { label: isEmployer ? "Projects Funded" : "In Escrow", value: isEmployer ? allProjects.filter((p) => p.employerFunded).length.toString() : `KES ${(walletBalance?.escrowBalance || 0).toLocaleString()}`, icon: DollarSign, color: "#06B6D4" },
              { label: "Completed", value: allProjects.filter((p) => p.status === "completed").length.toString(), icon: Clock, color: "#F59E0B" },
            ].map((card: any, i) => (
              <div key={i} className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: `${card.color}12` }}>
                  <card.icon className="w-4 h-4" style={{ color: card.color }} />
                </div>
                <p className="text-[11px] text-white/30 mb-1">{card.label}</p>
                <p className="text-lg font-bold text-white">{card.value}</p>
              </div>
            ))}
          </div>

          {/* EMPLOYER: deposit for escrow */}
          {isEmployer && (
            <div className="p-5 rounded-xl border border-nx-cyan/10 bg-nx-cyan/[0.02]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-nx-cyan" />
                  <h3 className="text-sm font-semibold text-white">Fund your wallet to pay for projects</h3>
                </div>
                <button onClick={() => { setShowDeposit(true); setDepositStep("idle"); setDepositError(""); }}
                  className="px-4 py-2 rounded-xl bg-nx-cyan text-white text-xs font-semibold hover:bg-nx-cyan/80 transition-colors flex items-center gap-1.5">
                  <Plus /> Deposit via M-Pesa
                </button>
              </div>
              <p className="text-xs text-white/40">
                When you hire a writer, the project amount + a protection fee is held in escrow and only released when you approve the delivered work.
              </p>
            </div>
          )}

          {/* Project list */}
          <div className="p-5 rounded-xl border border-white/5 bg-white/[0.02]">
            <h3 className="text-sm font-semibold text-white mb-4">{isEmployer ? "Project Payments" : "Project Earnings"}</h3>
            {allProjects.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-8 h-8 text-white/10 mx-auto mb-2" />
                <p className="text-sm text-white/30">{isEmployer ? "No project payments yet" : "No earnings yet"}</p>
                <p className="text-[11px] text-white/15 mt-1">{isEmployer ? "Hire a writer to start a project" : "Complete projects to start earning"}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {allProjects.map((proj) => (
                  <div key={proj._id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.01]">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${proj.status === "completed" ? "bg-nx-emerald/10" : proj.employerFunded ? "bg-nx-cyan/10" : "bg-nx-violet/10"}`}>
                      {proj.status === "completed" ? <CheckCircle2 className="w-4 h-4 text-nx-emerald" /> : proj.employerFunded ? <Shield className="w-4 h-4 text-nx-cyan" /> : <Clock className="w-4 h-4 text-nx-violet" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{proj.title}</p>
                      <p className="text-[11px] text-white/30">
                        {proj.status.replace(/_/g, " ")}
                        {isEmployer && proj.freelancerName ? ` • ${proj.freelancerName}` : ""}
                        {!isEmployer && proj.escrowReleased ? " • paid out" : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-medium ${proj.status === "completed" ? "text-nx-emerald" : "text-white"}`}>
                        KES {(proj.status === "completed" && !isEmployer ? proj.totalPaid || proj.budget : proj.budget).toLocaleString()}
                      </p>
                      <p className="text-[10px] text-white/20">{new Date(proj.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* WRITER: withdrawal to M-Pesa */}
          {!isEmployer && (
            <div className="p-5 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.02]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-white">Withdraw to M-Pesa</h3>
                </div>
                <span className="text-[11px] text-white/30">Minimum: KES 50 • no Nexora percentage fee</span>
              </div>
              {withdrawMsg && (
                <div className="p-3 rounded-lg bg-nx-emerald/10 border border-nx-emerald/20 text-xs text-nx-emerald mb-3 flex items-start justify-between gap-2">
                  <span>{withdrawMsg}</span>
                  <button onClick={() => setWithdrawMsg("")}><X className="w-3.5 h-3.5" /></button>
                </div>
              )}
              {withdrawErr && (
                <div className="p-3 rounded-lg bg-red-400/10 border border-red-400/20 text-xs text-red-400 mb-3 flex items-start justify-between gap-2">
                  <span>{withdrawErr}</span>
                  <button onClick={() => setWithdrawErr("")}><X className="w-3.5 h-3.5" /></button>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label className="text-xs text-white/30 mb-1 block">M-Pesa Number</label>
                  <input
                    type="tel"
                    value={withdrawPhone}
                    onChange={(e) => setWithdrawPhone(e.target.value)}
                    placeholder="254712345678"
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-emerald-400/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/30 mb-1 block">Amount (KES)</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="50"
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-emerald-400/30 transition-colors"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={handleWithdraw} disabled={withdrawBusy}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {withdrawBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}
                  {withdrawBusy ? "Requesting..." : "Request Withdrawal"}
                </button>
                <button
                  onClick={() => window.open(`https://wa.me/254769739216?text=Hello%20Nexora%20Admin%2C%20I%20need%20help%20with%20my%20withdrawal`, "_blank")}
                  className="px-4 py-2.5 rounded-xl border border-emerald-400/20 text-emerald-400 text-sm font-medium hover:bg-emerald-400/5 transition-colors flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" /> Contact Admin
                </button>
              </div>
              <p className="text-[10px] text-white/20 mt-3 text-center">
                No Nexora fee applies to withdrawals. Only an actual configured external provider cost, if any, applies and is shown before you confirm.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── M-Pesa deposit modal (employer escrow funding) ── */}
      {showDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => depositStep !== "waiting" && setShowDeposit(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-[#0E0E18] border border-white/5 shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Deposit via M-Pesa</h3>
              {depositStep !== "waiting" && (
                <button onClick={() => setShowDeposit(false)} className="p-1 text-white/30 hover:text-white"><X className="w-5 h-5" /></button>
              )}
            </div>

            {depositStep === "idle" || depositStep === "error" ? (
              <>
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">Amount (KES) — min 10</label>
                    <input type="number" value={depositAmount} min="10"
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="e.g. 5000"
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-nx-cyan/30" />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">M-Pesa Phone Number</label>
                    <input type="tel" value={depositPhone}
                      onChange={(e) => setDepositPhone(e.target.value)}
                      placeholder="254712345678"
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-nx-cyan/30" />
                  </div>
                </div>
                {depositError && (
                  <div className="p-3 rounded-lg bg-red-400/10 border border-red-400/20 text-xs text-red-400 mb-3 flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {depositError}
                  </div>
                )}
                <button
                  disabled={!depositAmount || !depositPhone || Number(depositAmount) < 10}
                  onClick={handleDeposit}
                  className="w-full py-3 rounded-xl bg-nx-cyan text-white text-sm font-semibold hover:bg-nx-cyan/80 transition-colors disabled:opacity-40"
                >
                  Send STK Push to your phone
                </button>
                <p className="text-[11px] text-white/20 text-center mt-3">You'll receive an M-Pesa prompt — enter your PIN to complete the deposit.</p>
              </>
            ) : depositStep === "sending" ? (
              <div className="py-10 text-center">
                <Loader2 className="w-8 h-8 text-nx-cyan animate-spin mx-auto mb-3" />
                <p className="text-sm text-white/60">Sending STK Push…</p>
              </div>
            ) : depositStep === "waiting" ? (
              <div className="py-10 text-center">
                <div className="w-14 h-14 rounded-full bg-nx-cyan/10 flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-6 h-6 text-nx-cyan animate-pulse" />
                </div>
                <p className="text-sm text-white/70 font-medium">Check your phone</p>
                <p className="text-xs text-white/30 mt-1">Enter your M-Pesa PIN to complete the deposit. This page updates automatically.</p>
                <Loader2 className="w-5 h-5 text-nx-cyan animate-spin mx-auto mt-4" />
              </div>
            ) : (
              <div className="py-10 text-center">
                <CheckCircle2 className="w-12 h-12 text-nx-emerald mx-auto mb-3" />
                <p className="text-sm font-semibold text-white">Deposit successful!</p>
                <p className="text-xs text-white/30 mt-1">Your wallet is ready for escrow funding.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
