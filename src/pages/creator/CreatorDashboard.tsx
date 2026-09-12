import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import {
  Shield, Copy, Check, Loader2, Users, UserCheck, Store, PenLine,
  TrendingUp, Wallet, Clock, Sparkles, ArrowLeft, ExternalLink, Share2,
  AlertTriangle, Ban, Send, Link2,
} from "lucide-react";

const PLATFORMS = [
  { value: "tiktok", label: "TikTok" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "x", label: "X (Twitter)" },
  { value: "facebook", label: "Facebook" },
  { value: "other", label: "Other" },
] as const;

const STAGE_LABELS: Record<string, string> = {
  registered: "Registered",
  verified: "Verified",
  active: "Active",
  seller: "Seller activated",
  freelancer: "Freelancer activated",
  transaction: "First transaction done",
};

const STAGE_STYLES: Record<string, string> = {
  registered: "bg-white/8 text-white/60",
  verified: "bg-emerald-500/15 text-emerald-300",
  active: "bg-cyan-500/15 text-cyan-300",
  seller: "bg-violet-500/15 text-violet-300",
  freelancer: "bg-fuchsia-500/15 text-fuchsia-300",
  transaction: "bg-amber-500/15 text-amber-300",
};

function fmtKES(n: number | undefined) {
  return `KES ${(n || 0).toLocaleString()}`;
}
function fmtDate(n: number | undefined) {
  if (!n) return "—";
  return new Date(n).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}
function timeAgo(n: number) {
  const s = Math.floor((Date.now() - n) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

/**
 * Page-level error boundary — if the referral backend is briefly unreachable
 * (e.g. right after an update while functions sync), show a clear message
 * instead of a blank page.
 */
class CreatorErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  state = { hasError: false, message: "" };
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message || "Unknown error" };
  }
  componentDidCatch(err: Error) {
    console.error("[CreatorDashboard] error caught:", err.message);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#07070c] text-white flex items-center justify-center px-4">
          <div className="max-w-md text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-400/25 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 text-amber-300" />
            </div>
            <h1 className="mt-4 text-xl font-bold">Creator data is loading up</h1>
            <p className="mt-2 text-sm text-white/55 leading-relaxed">
              The referral backend didn't answer just now — if the site was recently updated,
              give it a moment and refresh. Your application, referrals and earnings are safe.
            </p>
            <p className="mt-2 text-xs text-white/30 font-mono break-all">{this.state.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-500 hover:bg-violet-400 px-5 py-2.5 text-sm font-semibold"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function CreatorDashboardInner() {
  const navigate = useNavigate();
  const data = useQuery(api.referral.getMyDashboard);
  const applyToBeCreator = useMutation(api.referral.applyToBeCreator);

  const [form, setForm] = useState({
    displayName: "",
    platform: "tiktok" as (typeof PLATFORMS)[number]["value"],
    platformHandle: "",
    audienceSize: "",
    promoPlan: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const creator = data?.creator ?? null;
  const referrals = data?.referrals ?? [];
  const earningsRows = data?.earnings ?? [];
  // Approved = ready for payout; pending = still awaiting admin review.
  const approvedCommission = earningsRows
    .filter((e: any) => e.status === "approved")
    .reduce((s: number, e: any) => s + (e.amount || 0), 0);

  const shareLinks = useMemo(() => {
    if (!creator) return null;
    const text = encodeURIComponent(
      "Buy and sell safely on Nexora — every payment is held in escrow until delivery. Join here:",
    );
    return {
      whatsapp: `https://wa.me/?text=${text}%20${encodeURIComponent(creator.referralLink)}`,
      x: `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(creator.referralLink)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(creator.referralLink)}`,
    };
  }, [creator]);

  const copy = async (text: string, which: "link" | "code") => {
    try {
      await navigator.clipboard.writeText(text);
      if (which === "link") {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 1500);
      } else {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 1500);
      }
      toast.success("Copied");
    } catch {
      toast.error("Copy failed — long-press the text to copy manually.");
    }
  };

  const submitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await applyToBeCreator({
        displayName: form.displayName,
        platform: form.platform as any,
        platformHandle: form.platformHandle,
        audienceSize: form.audienceSize || undefined,
        promoPlan: form.promoPlan,
      });
      toast.success("Application submitted — Nexora reviews new creators shortly.");
    } catch (err: any) {
      toast.error(err?.message || "Could not submit application.");
    } finally {
      setSubmitting(false);
    }
  };

  if (data === undefined) {
    return (
      <div className="min-h-screen bg-[#07070c] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
      </div>
    );
  }

  // ─── Not applied yet: the application flow ───
  if (!creator) {
    return (
      <div className="min-h-screen bg-[#07070c] text-white">
        <nav className="border-b border-white/5">
          <div className="max-w-3xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
            <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-white/60 hover:text-white">
              <ArrowLeft className="w-4 h-4" /> Back to Nexora
            </button>
            <div className="flex items-center gap-2 text-sm font-semibold tracking-wide text-white/50">
              <Sparkles className="w-4 h-4 text-violet-400" /> CREATOR PROGRAM
            </div>
          </div>
        </nav>

        <div className="max-w-3xl mx-auto px-4 md:px-6 py-12">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Join the Nexora Creator Program</h1>
          <p className="mt-3 text-white/55 leading-relaxed">
            Promote Nexora to your audience and earn real commissions when they verify, open businesses
            and trade. Admin approval is required before your referral link goes live. Applying never
            changes your marketplace role.
          </p>

          <form onSubmit={submitApplication} className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-7 space-y-5">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">Creator / brand name *</label>
              <input
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                placeholder="e.g. Mbugua Deals KE"
                className="w-full rounded-lg bg-black/40 border border-white/10 px-3.5 py-2.5 text-sm outline-none focus:border-violet-400/60"
                required
                minLength={2}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">Main platform *</label>
                <select
                  value={form.platform}
                  onChange={(e) => setForm({ ...form, platform: e.target.value as any })}
                  className="w-full rounded-lg bg-black/40 border border-white/10 px-3.5 py-2.5 text-sm outline-none focus:border-violet-400/60"
                >
                  {PLATFORMS.map((p) => (
                    <option key={p.value} value={p.value} className="bg-[#12121a]">{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">Handle *</label>
                <input
                  value={form.platformHandle}
                  onChange={(e) => setForm({ ...form, platformHandle: e.target.value })}
                  placeholder="@yourhandle"
                  className="w-full rounded-lg bg-black/40 border border-white/10 px-3.5 py-2.5 text-sm outline-none focus:border-violet-400/60"
                  required
                  minLength={2}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">Audience size (optional)</label>
              <input
                value={form.audienceSize}
                onChange={(e) => setForm({ ...form, audienceSize: e.target.value })}
                placeholder="e.g. 10k–50k followers"
                className="w-full rounded-lg bg-black/40 border border-white/10 px-3.5 py-2.5 text-sm outline-none focus:border-violet-400/60"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                How will you promote Nexora? *
              </label>
              <textarea
                value={form.promoPlan}
                onChange={(e) => setForm({ ...form, promoPlan: e.target.value })}
                rows={4}
                placeholder="Describe your content style, posting plan and the audience you'll reach…"
                className="w-full rounded-lg bg-black/40 border border-white/10 px-3.5 py-2.5 text-sm outline-none focus:border-violet-400/60 resize-y"
                required
                minLength={20}
              />
              <p className="mt-1.5 text-xs text-white/35">Minimum 20 characters — helps admins approve faster.</p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500 hover:bg-violet-400 disabled:opacity-50 px-6 py-3.5 font-semibold transition-colors"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {submitting ? "Submitting…" : "Submit application"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const linkCopied = copiedLink;
  const codeCopied = copiedCode;

  // ─── Applied: status card or full dashboard ───
  return (
    <div className="min-h-screen bg-[#07070c] text-white">
      <nav className="border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-white/60 hover:text-white">
            <ArrowLeft className="w-4 h-4" /> Back to Nexora
          </button>
          <div className="flex items-center gap-2 text-sm font-semibold tracking-wide text-white/50">
            <Sparkles className="w-4 h-4 text-violet-400" /> CREATOR DASHBOARD
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-10 space-y-8">
        {/* Pending / suspended / rejected state */}
        {creator.status !== "approved" ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
            {creator.status === "pending" && (
              <>
                <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6 text-amber-300" />
                  <h1 className="text-2xl font-bold">Application under review</h1>
                </div>
                <p className="mt-3 text-white/55 max-w-2xl">
                  Nexora is reviewing your creator application. Once approved, your unique referral link
                  and code activate right here and you can start earning. You'll get a notification the
                  moment a decision is made.
                </p>
              </>
            )}
            {creator.status === "suspended" && (
              <>
                <div className="flex items-center gap-3">
                  <Ban className="w-6 h-6 text-red-300" />
                  <h1 className="text-2xl font-bold">Creator account suspended</h1>
                </div>
                <p className="mt-3 text-white/55 max-w-2xl">
                  {creator.reviewNotes || "Your referral link is paused while Nexora reviews your account."}
                </p>
              </>
            )}
            {creator.status === "rejected" && (
              <>
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-300" />
                  <h1 className="text-2xl font-bold">Application declined</h1>
                </div>
                <p className="mt-3 text-white/55 max-w-2xl">
                  {creator.reviewNotes || "Your application did not meet the program requirements."} You can
                  re-apply 24 hours after the review.
                </p>
              </>
            )}
            <div className="mt-6 grid sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-white/8 bg-black/30 p-4">
                <div className="text-white/40 text-xs">Applied</div>
                <div className="mt-1 font-medium">{fmtDate(creator.appliedAt)}</div>
              </div>
              <div className="rounded-xl border border-white/8 bg-black/30 p-4">
                <div className="text-white/40 text-xs">Platform</div>
                <div className="mt-1 font-medium capitalize">
                  {creator.platform} · {creator.platformHandle}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Link + code card */}
            <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/10 via-transparent to-transparent p-5 md:p-7">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-xs tracking-[0.2em] text-violet-300 font-semibold">YOUR REFERRAL LINK</div>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <code className="text-sm md:text-base bg-black/40 border border-white/10 rounded-lg px-3 py-2 font-mono text-violet-100 break-all">
                      {creator.referralLink}
                    </code>
                    <button
                      onClick={() => copy(creator.referralLink, "link")}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500 hover:bg-violet-400 px-3 py-2 text-sm font-semibold transition-colors"
                    >
                      {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {linkCopied ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {shareLinks && (
                    <>
                      <a
                        href={shareLinks.whatsapp}
                        target="_blank"
                        rel="noreferrer"
                        title="Share on WhatsApp"
                        className="w-10 h-10 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/10 flex items-center justify-center transition-colors"
                      >
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-emerald-400">
                          <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.5 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.4-.7-2.9-1.1-4.7-4-4.9-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5s.8 1.9.8 2c.1.1.1.3 0 .5l-.4.6c-.1.2-.3.4-.1.7.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.7-.1l1-1.2c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.6.4 0 .1 0 .8-.2 1.3Z" />
                        </svg>
                      </a>
                      <a
                        href={shareLinks.x}
                        target="_blank"
                        rel="noreferrer"
                        title="Share on X"
                        className="w-10 h-10 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/10 flex items-center justify-center transition-colors"
                      >
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white/80">
                          <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-4.9-6.4L6.4 22H3.3l7.3-8.3L1.2 2h6.4l4.4 5.9L18.9 2Zm-1.1 18h1.7L7.1 3.9H5.3L17.8 20Z" />
                        </svg>
                      </a>
                      <a
                        href={shareLinks.facebook}
                        target="_blank"
                        rel="noreferrer"
                        title="Share on Facebook"
                        className="w-10 h-10 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/10 flex items-center justify-center transition-colors"
                      >
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-blue-400">
                          <path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.3V4.9c-.2 0-1-.1-1.9-.1-1.9 0-3.2 1.2-3.2 3.3V11H9v3h2.3v7h2.2Z" />
                        </svg>
                      </a>
                    </>
                  )}
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 flex-wrap text-sm">
                <span className="text-white/40">Referral code</span>
                <button
                  onClick={() => copy(creator.referralCode, "code")}
                  className="inline-flex items-center gap-2 rounded-lg bg-white/[0.05] border border-white/10 px-3 py-1.5 font-mono font-bold tracking-[0.2em] hover:bg-white/10 transition-colors"
                >
                  {creator.referralCode}
                  {codeCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <span className="text-white/35 text-xs">
                  Anyone registering with this link is permanently attributed to you — automatically.
                </span>
              </div>
            </div>

            {/* Live counters — recomputed from the ledger on every read */}
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-violet-300" /> Referral performance
              </h2>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Total clicks", value: creator.clicks, icon: Link2 },
                  { label: "Registrations", value: creator.registrations, icon: Users },
                  { label: "Verified users", value: creator.verified, icon: UserCheck },
                  { label: "Active users", value: creator.activeUsers, icon: Shield },
                  { label: "Sellers referred", value: creator.sellersReferred, icon: Store },
                  { label: "Freelancers referred", value: creator.freelancersReferred, icon: PenLine },
                  { label: "Transactions", value: creator.transactionsGenerated, icon: TrendingUp },
                  { label: "Total earned", value: fmtKES(creator.totalEarned), icon: Wallet },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                    <s.icon className="w-4 h-4 text-violet-300/80" />
                    <div className="mt-2.5 text-xl md:text-2xl font-bold tabular-nums">{s.value}</div>
                    <div className="mt-0.5 text-xs text-white/45">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Commission summary */}
            <div className="grid md:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-emerald-400/15 bg-emerald-500/[0.06] p-5">
                <div className="flex items-center gap-2 text-emerald-300 text-sm font-medium">
                  <Wallet className="w-4 h-4" /> Approved — awaiting payout
                </div>
                <div className="mt-2 text-3xl font-extrabold tabular-nums">{fmtKES(approvedCommission)}</div>
                <div className="mt-1 text-xs text-white/40">Cleared by admin, paid out on schedule</div>
              </div>
              <div className="rounded-2xl border border-cyan-400/15 bg-cyan-500/[0.06] p-5">
                <div className="flex items-center gap-2 text-cyan-300 text-sm font-medium">
                  <Clock className="w-4 h-4" /> Pending review
                </div>
                <div className="mt-2 text-3xl font-extrabold tabular-nums">
                  {fmtKES(Math.max(0, (creator.pendingCommission || 0) - approvedCommission))}
                </div>
                <div className="mt-1 text-xs text-white/40">Awaiting admin approval</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
                <div className="flex items-center gap-2 text-white/60 text-sm font-medium">
                  <Check className="w-4 h-4" /> Total paid to you
                </div>
                <div className="mt-2 text-3xl font-extrabold tabular-nums">{fmtKES(creator.paidCommission)}</div>
                <div className="mt-1 text-xs text-white/40">Lifetime payouts</div>
              </div>
            </div>

            {/* Referral history */}
            <div>
              <h2 className="text-lg font-semibold">Referral history</h2>
              <p className="mt-1 text-sm text-white/45">
                Every person who registered through your link, with where they are on their journey.
                Contact details stay private.
              </p>
              <div className="mt-4 rounded-2xl border border-white/8 overflow-hidden">
                {referrals.length === 0 ? (
                  <div className="p-8 text-center text-sm text-white/40">
                    No referrals yet — share your link above to get started.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-white/[0.03] text-white/45 text-xs uppercase tracking-wider">
                        <tr>
                          <th className="text-left px-4 py-3">Registered</th>
                          <th className="text-left px-4 py-3">Journey stage</th>
                          <th className="text-left px-4 py-3">Status</th>
                          <th className="text-right px-4 py-3">First transaction</th>
                        </tr>
                      </thead>
                      <tbody>
                        {referrals.map((r: any) => (
                          <tr key={r._id} className="border-t border-white/5 hover:bg-white/[0.02]">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="font-medium">{fmtDate(r.registeredAt)}</div>
                              <div className="text-xs text-white/35">{timeAgo(r.registeredAt)}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STAGE_STYLES[r.stage] || "bg-white/8 text-white/60"}`}>
                                {STAGE_LABELS[r.stage] || r.stage}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {r.status === "qualified" && (
                                <span className="text-emerald-300 text-xs font-medium">Qualified ✓</span>
                              )}
                              {r.status === "pending" && (
                                <span className="text-amber-300 text-xs font-medium">
                                  In review{r.verifiedAt ? "" : " — awaiting verification"}
                                </span>
                              )}
                              {r.status === "rejected" && (
                                <span className="text-red-300 text-xs font-medium">Rejected</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                              {r.firstTransactionAt ? (
                                <span className="text-amber-300">{fmtKES(r.firstTransactionAmount)}</span>
                              ) : (
                                <span className="text-white/30">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Earnings history */}
            <div>
              <h2 className="text-lg font-semibold">Earnings breakdown</h2>
              <p className="mt-1 text-sm text-white/45">Exactly what you earned and why.</p>
              <div className="mt-4 rounded-2xl border border-white/8 overflow-hidden">
                {earningsRows.length === 0 ? (
                  <div className="p-8 text-center text-sm text-white/40">
                    No earnings yet — they appear here the moment a referral completes verification.
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {earningsRows.map((e: any) => (
                      <div key={e._id} className="p-4 flex items-start justify-between gap-4 hover:bg-white/[0.02]">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${
                              e.type === "verified_user" ? "bg-emerald-500/15 text-emerald-300"
                              : e.type === "seller_bonus" ? "bg-violet-500/15 text-violet-300"
                              : e.type === "freelancer_bonus" ? "bg-fuchsia-500/15 text-fuchsia-300"
                              : e.type === "employer_bonus" ? "bg-sky-500/15 text-sky-300"
                              : e.type === "first_transaction" ? "bg-amber-500/15 text-amber-300"
                              : "bg-cyan-500/15 text-cyan-300"
                            }`}>
                              {e.type.replace(/_/g, " ")}
                            </span>
                            <span className={`text-xs font-medium ${
                              e.status === "paid" ? "text-emerald-300"
                              : e.status === "approved" ? "text-cyan-300"
                              : e.status === "pending" ? "text-amber-300"
                              : "text-red-300"
                            }`}>
                              {e.status}
                            </span>
                            {e.payoutReference && (
                              <span className="text-[11px] text-white/30 font-mono">{e.payoutReference}</span>
                            )}
                          </div>
                          <p className="mt-1.5 text-sm text-white/60">{e.reason}</p>
                          {e.adjustNote && (
                            <p className="mt-1 text-xs text-amber-300/80">Admin adjustment: {e.adjustNote}</p>
                          )}
                          {e.rejectionReason && (
                            <p className="mt-1 text-xs text-red-300/80">Rejected: {e.rejectionReason}</p>
                          )}
                          <div className="mt-1 text-xs text-white/30">{fmtDate(e.createdAt)}</div>
                        </div>
                        <div className={`text-base font-bold tabular-nums whitespace-nowrap ${
                          e.status === "rejected" ? "text-white/25 line-through" : "text-white"
                        }`}>
                          {fmtKES(e.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** Exported page wrapped in the fail-soft boundary. */
export default function CreatorDashboard() {
  return (
    <CreatorErrorBoundary>
      <CreatorDashboardInner />
    </CreatorErrorBoundary>
  );
}
