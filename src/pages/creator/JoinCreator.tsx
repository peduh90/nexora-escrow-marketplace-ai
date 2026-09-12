import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from "framer-motion";
import {
  Shield, Users, TrendingUp, Check, Copy, ArrowRight, Sparkles,
  Instagram, Youtube, Facebook, Twitter, MessageCircle, Globe2, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { getVisitorKey } from "@/lib/visitor-key";
import { rememberReferralCode } from "@/lib/referral-client";

/** Stable anonymous visitor key — lives in @/lib/visitor-key so the click ──
 *  and the later registration attribution always match. */

export default function JoinCreator() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const trackClick = useMutation(api.referral.trackClick);

  const code = (searchParams.get("ref") || "").trim().toUpperCase();
  const stats = useQuery(api.referral.getProgramStats);
  const clickTracked = useRef(false);
  const [copied, setCopied] = useState(false);

  // Register the click server-side (once) and remember the code briefly so a
  // visitor who registers from another tab/visit is still attributed. The
  // server validates the code and dedupes per visitor — no client fabrication.
  useEffect(() => {
    if (!code || clickTracked.current) return;
    clickTracked.current = true;
    rememberReferralCode(code);
    trackClick({
      code,
      visitorKey: getVisitorKey(),
      referrerDomain: document.referrer ? new URL(document.referrer, window.location.origin).hostname : undefined,
    }).catch(() => {
      /* best-effort: registration attribution still checks the server record */
    });
  }, [code, trackClick]);

  // Carry the referral code into whichever registration panel the user picks.
  const registerUrl = (path: string) => `${path}?ref=${encodeURIComponent(code)}&returnTo=/creator`;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Referral code copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy — please note it down: " + code);
    }
  };

  return (
    <div className="min-h-screen bg-[#07070c] text-white">
      {/* Nav */}
      <nav className="border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-400/25 flex items-center justify-center">
              <Shield className="w-5 h-5 text-violet-300" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              NEXORA<span className="text-violet-400">.</span>
              <span className="ml-2 text-[11px] font-semibold tracking-[0.22em] text-white/40 align-middle">CREATOR PROGRAM</span>
            </span>
          </a>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(registerUrl("/auth"))}
              className="hidden sm:inline-flex px-4 py-2 text-sm text-white/70 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              Sign in
            </button>
            <button
              onClick={() => navigate(registerUrl("/auth"))}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-violet-500 hover:bg-violet-400 transition-colors"
            >
              Become a creator <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[420px] bg-violet-600/20 blur-[140px] rounded-full" />
          <div className="absolute top-40 -right-32 w-[420px] h-[320px] bg-cyan-500/10 blur-[120px] rounded-full" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 md:px-6 pt-16 pb-20 md:pt-24 md:pb-28">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-400/25 bg-violet-500/10 text-violet-200 text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              NEXORA CREATOR PROGRAM — EARN FROM EVERY VERIFIED REFERRAL
            </div>
            <h1 className="mt-6 text-4xl md:text-6xl font-extrabold leading-[1.05] tracking-tight">
              Your audience.
              <br />
              <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                Your commissions.
              </span>
            </h1>
            <p className="mt-6 text-base md:text-lg text-white/60 leading-relaxed max-w-2xl">
              TikTokers, WhatsApp promoters and influencers across Africa: share Nexora — the AI-powered
              escrow marketplace — with your unique link. You earn when the people you bring{" "}
              <span className="text-white font-medium">verify</span>, open{" "}
              <span className="text-white font-medium">businesses</span> and{" "}
              <span className="text-white font-medium">trade</span> — not for empty clicks.
            </p>

            {/* Referral code chip */}
            {code ? (
              <div className="mt-8 inline-flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <div className="text-sm text-white/50">Invited by code</div>
                <button
                  onClick={copyCode}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-500/15 border border-violet-400/30 text-violet-200 font-mono font-bold tracking-[0.2em] hover:bg-violet-500/25 transition-colors"
                  title="Copy code"
                >
                  {code}
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                <span className="text-xs text-white/40">Your code is applied automatically at registration.</span>
              </div>
            ) : (
              <div className="mt-8 text-sm text-white/40">
                No referral code? You can still join —{" "}
                <a href="/auth" className="text-violet-300 underline underline-offset-4 hover:text-violet-200">create a free account</a>{" "}
                and apply from your dashboard.
              </div>
            )}

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate(registerUrl("/auth"))}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-violet-500 hover:bg-violet-400 font-semibold text-white transition-colors shadow-lg shadow-violet-500/25"
              >
                Apply as a creator <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate("/marketplace")}
                className="px-6 py-3.5 rounded-xl border border-white/12 text-white/80 hover:bg-white/5 font-medium transition-colors"
              >
                Explore the marketplace first
              </button>
            </div>
          </motion.div>

          {/* Live program stats — real numbers from the referral ledger */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            {[
              { label: "Active creators", value: stats?.activeCreators ?? null, icon: Users },
              { label: "Qualified referrals", value: stats?.qualifiedReferrals ?? null, icon: Check },
              { label: "Transactions generated", value: stats?.transactionsGenerated ?? null, icon: TrendingUp },
              { label: "Paid to creators (KES)", value: stats ? Math.round(stats.totalPaidOut).toLocaleString() : null, icon: Sparkles },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 md:p-5">
                <s.icon className="w-4 h-4 text-violet-300" />
                <div className="mt-3 text-2xl md:text-3xl font-bold tabular-nums">
                  {s.value === null ? <Loader2 className="w-5 h-5 animate-spin text-white/30" /> : s.value}
                </div>
                <div className="mt-1 text-xs text-white/45">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-20">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">How creators earn</h2>
          <p className="mt-2 text-white/50 max-w-2xl">
            Real milestones only — clicks and signups alone pay nothing. Nexora pays when a referred
            person genuinely verifies, fully activates as a verified seller or employer, and actually
            trades. Admins review every payout; fraud is filtered out automatically.
          </p>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                step: "1",
                title: "Share your link",
                body: "Get your unique nexoramarketplace.freebuff.app/join?ref=YOURCODE link after admin approval.",
              },
              {
                step: "2",
                title: "They register & verify",
                body: "A verified account qualifies the referral — this is the first payout. Fake accounts never qualify.",
              },
              {
                step: "3",
                title: "They fully activate",
                body: "The big bonus: a referred seller passes full business verification (KYC + a genuine listing), or an employer completes their profile and posts 5 distinct legitimate jobs. Choosing a role at signup pays nothing — real verification does.",
              },
              {
                step: "4",
                title: "They trade",
                body: "Bonus on their first escrow transaction, plus a small share of every completed trade.",
              },
            ].map((c) => (
              <motion.div
                key={c.step}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
                className="rounded-2xl border border-white/8 bg-white/[0.03] p-5"
              >
                <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-400/25 text-violet-200 font-bold text-sm flex items-center justify-center">
                  {c.step}
                </div>
                <h3 className="mt-4 font-semibold">{c.title}</h3>
                <p className="mt-2 text-sm text-white/50 leading-relaxed">{c.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Where creators come from */}
      <section className="border-t border-white/5 bg-white/[0.015]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-14">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">Built for every kind of promoter</h2>
              <p className="mt-2 text-sm text-white/50 max-w-xl">
                Apply with the platform you already create on. Track everything from one dashboard.
              </p>
            </div>
            <div className="flex items-center gap-3 text-white/35">
              {[Instagram, Youtube, Facebook, Twitter, MessageCircle, Globe2].map((Icon, i) => (
                <div key={i} className="w-11 h-11 rounded-xl border border-white/8 bg-white/[0.03] flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Ready to turn your audience into income?
          </h2>
          <p className="mt-4 text-white/55 max-w-xl mx-auto">
            Apply in two minutes. Once Nexora approves your profile, your referral link goes live and
            every verified signup starts earning for you.
          </p>
          <button
            onClick={() => navigate(registerUrl("/auth"))}
            className="mt-8 inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-violet-500 hover:bg-violet-400 font-semibold transition-colors shadow-lg shadow-violet-500/25"
          >
            Join the Creator Program <ArrowRight className="w-4 h-4" />
          </button>
          <p className="mt-6 text-xs text-white/35 max-w-md mx-auto">
            Creator accounts are separate from buyer, seller, employer and freelancer accounts — joining
            the program never changes your marketplace role. Clicks are tracked anonymously for fraud
            prevention only.
          </p>
        </div>
      </section>

      <footer className="border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/35">
          <span>© {new Date().getFullYear()} Nexora Market — AI-powered escrow marketplace, Nairobi, Kenya.</span>
          <div className="flex items-center gap-4">
            <a href="/terms" className="hover:text-white/60">Terms</a>
            <a href="/privacy" className="hover:text-white/60">Privacy</a>
            <a href="/" className="hover:text-white/60">Home</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
