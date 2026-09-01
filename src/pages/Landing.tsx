import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useNavigate } from "react-router";
import {
  Shield,
  Brain,
  Eye,
  Scale,
  CheckCircle2,
  Globe,
  ArrowRight,
  Zap,
  Lock,
  Users,
  TrendingUp,
  ChevronRight,
  ShieldCheck,
  Fingerprint,
  AlertTriangle,
  CreditCard,
} from "lucide-react";
import ParticleCanvas from "@/components/canvas/ParticleCanvas";
import EscrowCore from "@/components/canvas/EscrowCore";
import NavigationBar from "@/components/layout/NavigationBar";
import { TrustBanner, TrustStats } from "@/components/layout/TrustBadges";
import SocialLinks from "@/components/layout/SocialLinks";
import { Truck, Briefcase, Store, Package } from "lucide-react";

// Animated counter component
function AnimatedNumber({ target, prefix = "", suffix = "" }: { target: number; prefix?: string; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setVal(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target]);

  return (
    <span ref={ref}>
      {prefix}{val.toLocaleString()}{suffix}
    </span>
  );
}

// Section wrapper with scroll-triggered animation
function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Trust feature data
const trustFeatures = [
  {
    icon: Lock,
    title: "Protected Payments",
    description: "Funds remain secured in escrow until agreed conditions are fully satisfied. No release without verification.",
    color: "#8B5CF6",
  },
  {
    icon: Fingerprint,
    title: "Verified Participants",
    description: "KYC-backed identity and transaction verification ensures you trade with authenticated, reputable parties.",
    color: "#06B6D4",
  },
  {
    icon: Brain,
    title: "AI Risk Intelligence",
    description: "Real-time ML analysis of transaction patterns identifies suspicious behavior before it becomes a problem.",
    color: "#F59E0B",
  },
  {
    icon: Scale,
    title: "Dispute Protection",
    description: "Structured dispute workflows with AI-assisted evidence review ensure fair outcomes for both parties.",
    color: "#10B981",
  },
  {
    icon: Eye,
    title: "Transparent Transactions",
    description: "Every transaction state is visible in real-time. Complete visibility from initiation to completion.",
    color: "#EC4899",
  },
  {
    icon: Globe,
    title: "Africa-First Design",
    description: "Built for M-Pesa, mobile money, and the realities of African digital commerce from day one.",
    color: "#8B5CF6",
  },
];

// How it works steps
const steps = [
  { num: "01", title: "List", desc: "Seller creates an offering with clear terms, pricing, and delivery expectations.", icon: CreditCard },
  { num: "02", title: "Order", desc: "Buyer places an order. Payment is locked in the escrow system — not sent to seller yet.", icon: ShieldCheck },
  { num: "03", title: "Hold", desc: "Funds are secured. AI monitors for fraud indicators and suspicious patterns.", icon: Brain },
  { num: "04", title: "Deliver", desc: "Seller completes delivery of goods or services as agreed.", icon: TrendingUp },
  { num: "05", title: "Verify", desc: "Buyer inspects and confirms delivery meets the agreed conditions.", icon: CheckCircle2 },
  { num: "06", title: "Release", desc: "Payment is automatically released to the seller. Instant and transparent.", icon: Zap },
  { num: "07", title: "Complete", desc: "Platform commission is deducted transparently. Both parties rate each other.", icon: Shield },
];

// Pricing tiers
const pricingTiers = [
  {
    name: "Starter",
    price: "Free",
    period: "per transaction",
    fee: "5% transaction fee",
    features: ["Basic escrow protection", "Standard verification", "Community support", "Up to KES 50,000/month"],
    highlight: false,
  },
  {
    name: "Professional",
    price: "KES 999",
    period: "/month",
    fee: "2.5% transaction fee",
    features: ["Advanced AI fraud detection", "Priority listing", "Priority support", "Analytics dashboard", "Up to KES 500,000/month"],
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "KES 4,999",
    period: "/month",
    fee: "0.5% transaction fee",
    features: ["Full AI suite", "Custom escrow conditions", "Dedicated account manager", "API access", "Unlimited volume"],
    highlight: false,
  },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Living Background */}
      <ParticleCanvas />

      {/* Navigation */}
      <NavigationBar />

      {/* Trust Banner */}
      <div className="relative z-10">
        <TrustBanner />
      </div>

      {/* =================== HERO =================== */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 z-10">
        {/* Escrow Core */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
          className="mb-8"
        >
          <EscrowCore size={220} />
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-4xl sm:text-5xl md:text-7xl font-bold text-center max-w-4xl leading-tight tracking-tight"
        >
          <span className="text-white">Trade Without </span>
          <span className="nx-gradient-text">Trusting</span>
          <span className="text-white"> the Unknown</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="text-base sm:text-lg text-white/50 text-center max-w-2xl mt-6 leading-relaxed"
        >
          Africa's first AI-powered escrow marketplace. Every transaction protected.
          Every participant verified. Every outcome guaranteed.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="flex flex-col sm:flex-row gap-4 mt-10"
        >
          <button
            onClick={() => navigate("/auth")}
            className="group relative px-8 py-3.5 rounded-xl text-white font-medium text-base overflow-hidden transition-all duration-300 hover:scale-[1.02]"
            style={{
              background: "linear-gradient(135deg, #8B5CF6, #6D28D9)",
            }}
          >
            <span className="relative z-10 flex items-center gap-2">
              Create an Escrow
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-nx-violet via-nx-cyan to-nx-violet opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-nx-gradient-shift" />
          </button>
          <button
            onClick={() => navigate("/marketplace")}
            className="px-8 py-3.5 rounded-xl text-white/70 font-medium text-base border border-white/10 hover:border-nx-violet/40 hover:text-white transition-all duration-300"
          >
            Browse Marketplace
          </button>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.8 }}
          className="flex flex-wrap justify-center gap-6 mt-14"
        >
          {[
            { icon: Shield, label: "Escrow Protected" },
            { icon: Brain, label: "AI-Powered Security" },
            { icon: Globe, label: "Built for Africa" },
            { icon: Users, label: "10,000+ Users" },
          ].map((badge, i) => (
            <motion.div
              key={badge.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2 + i * 0.1 }}
              className="flex items-center gap-2 text-xs text-white/40"
            >
              <badge.icon className="w-3.5 h-3.5" />
              {badge.label}
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* =================== NEW FEATURES =================== */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              More Than Just <span className="nx-gradient-text">Escrow</span>
            </h2>
            <p className="text-white/40 max-w-xl mx-auto text-base">
              A complete ecosystem for African commerce — from marketplace to delivery to jobs.
            </p>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Store, title: "Smart Marketplace", desc: "AI-powered product discovery across 47 counties. Every listing verified and escrow-protected.", color: "#8B5CF6" },
              { icon: Truck, title: "Insured Transport", desc: "GPS-tracked deliveries with full insurance. Platform-negotiated rates across all counties.", color: "#06B6D4" },
              { icon: Briefcase, title: "Job & Services Board", desc: "Find work, hire talent, or offer services. Escrow-protected gigs from KES 3,000 to millions.", color: "#F59E0B" },
              { icon: Package, title: "Seller Command Center", desc: "Full business dashboard with KYC verification, analytics, refunds, and M-Pesa withdrawals.", color: "#10B981" },
            ].map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.08}>
                <div className="p-5 rounded-xl border border-white/5 bg-nx-surface/50 hover:border-white/10 transition-all h-full">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: `${f.color}12` }}>
                    <f.icon className="w-5 h-5" style={{ color: f.color }} />
                  </div>
                  <h3 className="text-white font-semibold text-sm mb-1.5">{f.title}</h3>
                  <p className="text-white/40 text-xs leading-relaxed">{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* =================== STATS BAR =================== */}
      <section className="relative z-10 border-y border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: 500, suffix: "M+", label: "Internet Users in Africa" },
            { value: 85, suffix: "B", label: "Transacted Through Escrow" },
            { value: 40, suffix: "%", label: "Fraud Reduction" },
            { value: 99, suffix: ".9%", label: "Uptime SLA" },
          ].map((stat, i) => (
            <FadeIn key={stat.label} delay={i * 0.1} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                <AnimatedNumber target={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-sm text-white/40">{stat.label}</div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* =================== TRUST SECTION =================== */}
      <section id="trust" className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-nx-violet text-xs font-medium tracking-widest uppercase mb-4">
              <Shield className="w-3.5 h-3.5" />
              Trust Architecture
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Every Transaction, <span className="nx-gradient-text">Protected</span>
            </h2>
            <p className="text-white/40 max-w-xl mx-auto text-base">
              A multi-layered security system designed to make every exchange safe,
              transparent, and verifiable.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trustFeatures.map((feature, i) => (
              <FadeIn key={feature.title} delay={i * 0.08}>
                <div className="group relative p-6 rounded-xl border border-white/5 bg-nx-surface/50 hover:border-white/10 transition-all duration-500 h-full">
                  {/* Hover glow */}
                  <div
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `radial-gradient(400px circle at 50% 0%, ${feature.color}08, transparent)`,
                    }}
                  />
                  <div className="relative z-10">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                      style={{ background: `${feature.color}12` }}
                    >
                      <feature.icon className="w-5 h-5" style={{ color: feature.color }} />
                    </div>
                    <h3 className="text-white font-semibold text-base mb-2">{feature.title}</h3>
                    <p className="text-white/40 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* =================== HOW IT WORKS =================== */}
      <section id="how-it-works" className="relative z-10 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-nx-cyan text-xs font-medium tracking-widest uppercase mb-4">
              <Zap className="w-3.5 h-3.5" />
              How It Works
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Seven Steps to <span className="nx-gradient-text">Safe Commerce</span>
            </h2>
            <p className="text-white/40 max-w-xl mx-auto text-base">
              From listing to completion, every step is monitored and protected
              by AI-powered intelligence.
            </p>
          </FadeIn>

          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-5 md:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-nx-violet/30 via-nx-cyan/20 to-transparent hidden md:block" />

            <div className="space-y-3">
              {steps.map((step, i) => (
                <FadeIn key={step.num} delay={i * 0.06}>
                  <div className="group flex items-start gap-4 md:gap-6 p-4 md:p-5 rounded-xl hover:bg-white/[0.02] transition-all duration-300">
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-nx-surface border border-white/5 flex items-center justify-center group-hover:border-nx-violet/30 transition-colors">
                        <span className="text-nx-violet font-mono text-xs md:text-sm font-bold">{step.num}</span>
                      </div>
                      {/* Pulse dot */}
                      <div className="absolute -right-1 -top-1 w-2.5 h-2.5 rounded-full bg-nx-violet/60 animate-nx-pulse hidden md:block" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-white font-semibold text-base md:text-lg">{step.title}</h3>
                        <step.icon className="w-4 h-4 text-white/20 group-hover:text-nx-violet transition-colors" />
                      </div>
                      <p className="text-white/40 text-sm leading-relaxed">{step.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-nx-violet transition-colors mt-3 shrink-0 hidden md:block" />
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =================== PLATFORM FEATURES =================== */}
      <section id="platform" className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-nx-gold text-xs font-medium tracking-widest uppercase mb-4">
              <AlertTriangle className="w-3.5 h-3.5" />
              Platform Intelligence
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              AI at the <span className="nx-gradient-text">Core</span>
            </h2>
            <p className="text-white/40 max-w-xl mx-auto text-base">
              Not a bolt-on feature — artificial intelligence is the infrastructure
              that powers every transaction on Nexora.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                title: "Real-Time Fraud Detection",
                description: "TensorFlow-powered models analyze every transaction in milliseconds. Suspicious patterns trigger automatic holds.",
                stat: "97.4%",
                statLabel: "Detection Accuracy",
                color: "#8B5CF6",
              },
              {
                title: "AI Dispute Resolution",
                description: "GPT-4 and Claude analyze evidence, review conversations, and recommend fair outcomes — reducing resolution time by 60%.",
                stat: "60%",
                statLabel: "Faster Resolution",
                color: "#06B6D4",
              },
              {
                title: "Behavioral Analysis",
                description: "Continuous monitoring of transaction patterns, account reputation, and payment verification across the ecosystem.",
                stat: "24/7",
                statLabel: "Monitoring",
                color: "#F59E0B",
              },
              {
                title: "Smart Escrow Automation",
                description: "Automated workflows handle payment release, confirmations, and commission routing — no manual intervention needed.",
                stat: "< 3s",
                statLabel: "Release Time",
                color: "#10B981",
              },
            ].map((feature, i) => (
              <FadeIn key={feature.title} delay={i * 0.1}>
                <div className="group relative p-6 md:p-8 rounded-xl border border-white/5 bg-nx-surface/50 hover:border-white/10 transition-all duration-500 h-full">
                  <div className="flex flex-col h-full">
                    <h3 className="text-white font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-white/40 text-sm leading-relaxed mb-6 flex-1">{feature.description}</p>
                    <div className="flex items-end gap-2">
                      <span
                        className="text-3xl font-bold"
                        style={{ color: feature.color }}
                      >
                        {feature.stat}
                      </span>
                      <span className="text-xs text-white/30 pb-1">{feature.statLabel}</span>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* =================== PRICING =================== */}
      <section id="pricing" className="relative z-10 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-nx-emerald text-xs font-medium tracking-widest uppercase mb-4">
              <TrendingUp className="w-3.5 h-3.5" />
              Transparent Pricing
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Simple, <span className="nx-gradient-text">Fair</span> Fees
            </h2>
            <p className="text-white/40 max-w-xl mx-auto text-base">
              No hidden charges. No surprise deductions. Know exactly what you pay
              before every transaction.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pricingTiers.map((tier, i) => (
              <FadeIn key={tier.name} delay={i * 0.1}>
                <div
                  className={`relative p-6 rounded-xl border h-full flex flex-col ${
                    tier.highlight
                      ? "border-nx-violet/30 bg-nx-violet/[0.04]"
                      : "border-white/5 bg-nx-surface/50"
                  }`}
                >
                  {tier.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-widest uppercase text-nx-violet bg-nx-violet/10 px-3 py-1 rounded-full border border-nx-violet/20">
                      Most Popular
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-white font-semibold text-lg mb-1">{tier.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-white">{tier.price}</span>
                      {tier.period !== "per transaction" && (
                        <span className="text-sm text-white/40">{tier.period}</span>
                      )}
                    </div>
                    <p className="text-xs text-nx-violet mt-2 font-medium">{tier.fee}</p>
                  </div>
                  <ul className="space-y-2.5 flex-1">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-white/50">
                        <CheckCircle2 className="w-4 h-4 text-nx-emerald shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => navigate("/auth")}
                    className={`w-full mt-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                      tier.highlight
                        ? "bg-nx-violet text-white hover:bg-nx-violet/80"
                        : "border border-white/10 text-white/70 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    Get Started
                  </button>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* =================== CTA SECTION =================== */}
      <section className="relative z-10 py-24 px-6">
        <FadeIn>
          <div className="max-w-4xl mx-auto text-center">
            <div className="relative p-12 md:p-16 rounded-2xl border border-white/5 overflow-hidden">
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-nx-violet/5 via-transparent to-nx-cyan/5" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-nx-violet/10 rounded-full blur-3xl" />

              <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                  Ready to Trade with <span className="nx-gradient-text">Confidence</span>?
                </h2>
                <p className="text-white/40 max-w-lg mx-auto text-base mb-8">
                  Join thousands of buyers and sellers across Africa who trust Nexora
                  to protect every transaction.
                </p>
                <button
                  onClick={() => navigate("/auth")}
                  className="group px-10 py-4 rounded-xl text-white font-medium text-base relative overflow-hidden transition-all duration-300 hover:scale-[1.02]"
                  style={{
                    background: "linear-gradient(135deg, #8B5CF6, #6D28D9)",
                  }}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Start Your First Escrow
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-nx-violet via-nx-cyan to-nx-violet opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-nx-gradient-shift" />
                </button>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* =================== BUYER vs SELLER =================== */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                Choose Your <span className="nx-gradient-text">Experience</span>
              </h2>
              <p className="text-white/40 max-w-lg mx-auto">
                Nexora serves buyers and sellers differently — each path optimized for security, speed, and trust.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Buyer Path */}
            <FadeIn delay={0.1}>
              <div className="group relative p-8 rounded-2xl border border-nx-cyan/10 bg-gradient-to-br from-nx-cyan/5 to-transparent hover:border-nx-cyan/20 transition-all duration-500">
                <div className="w-14 h-14 rounded-xl bg-nx-cyan/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Package className="w-7 h-7 text-nx-cyan" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">I'm a Buyer</h3>
                <p className="text-sm text-white/40 mb-6 leading-relaxed">
                  Browse thousands of verified products. Every purchase is protected by escrow — your money is safe until you confirm delivery.
                </p>
                <div className="space-y-3">
                  {[
                    "Browse & search marketplace", "Escrow protection on every order", "Track deliveries in real-time",
                    "AI fraud detection & risk alerts", "Dispute resolution with AI assistance", "Market wallet with M-Pesa deposit",
                  ].map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm text-white/50">
                      <CheckCircle2 className="w-4 h-4 text-nx-cyan/60 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => navigate("/marketplace")}
                  className="w-full mt-6 py-3 rounded-xl bg-nx-cyan/10 text-nx-cyan font-medium text-sm hover:bg-nx-cyan/20 transition-colors border border-nx-cyan/20"
                >
                  Browse Marketplace →
                </button>
              </div>
            </FadeIn>

            {/* Seller Path */}
            <FadeIn delay={0.2}>
              <div className="group relative p-8 rounded-2xl border border-nx-violet/10 bg-gradient-to-br from-nx-violet/5 to-transparent hover:border-nx-violet/20 transition-all duration-500">
                <div className="w-14 h-14 rounded-xl bg-nx-violet/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Store className="w-7 h-7 text-nx-violet" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">I'm a Seller</h3>
                <p className="text-sm text-white/40 mb-6 leading-relaxed">
                  List products, manage orders, communicate with buyers. KYC verification builds trust. Withdraw earnings via M-Pesa.
                </p>
                <div className="space-y-3">
                  {[
                    "KYC business verification", "Upload & manage products", "Real-time order management",
                    "Direct buyer messaging", "Analytics & earnings dashboard", "Withdraw to M-Pesa instantly",
                  ].map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm text-white/50">
                      <CheckCircle2 className="w-4 h-4 text-nx-violet/60 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => navigate("/auth?returnTo=/seller")}
                  className="w-full mt-6 py-3 rounded-xl bg-nx-violet/10 text-nx-violet font-medium text-sm hover:bg-nx-violet/20 transition-colors border border-nx-violet/20"
                >
                  Start Selling →
                </button>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* =================== WHY NEXORA =================== */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Why Africa Prefers <span className="nx-gradient-text">Nexora</span>
                </h2>
                <div className="space-y-4">
                  {[
                    { title: "M-Pesa Native", desc: "Direct integration with Kenya's #1 payment system. No third-party bridges." },
                    { title: "County-Level Coverage", desc: "All 47 counties mapped. Towns, stages, and marketplaces in our delivery network." },
                    { title: "Commission That Makes Sense", desc: "5% free tier, 2.5% professional, 0.5% enterprise. Transport covered by platform." },
                    { title: "Social Selling", desc: "Share listings on WhatsApp, Facebook, Instagram, TikTok — one tap." },
                  ].map((item, i) => (
                    <div key={item.title} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-nx-emerald shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-white">{item.title}</p>
                        <p className="text-xs text-white/40 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <TrustStats />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* =================== FOOTER =================== */}
      <footer className="relative z-10 border-t border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-6 h-6 text-nx-violet" />
                <span className="text-lg font-bold text-white">
                  NEXORA<span className="text-nx-violet">.</span>
                </span>
              </div>
              <p className="text-sm text-white/30 leading-relaxed max-w-xs">
                Africa's first AI-powered escrow marketplace. Secure, transparent,
                and built for the continent.
              </p>
              <div className="mt-4">
                <SocialLinks size="sm" />
              </div>
            </div>
            {[
              {
                title: "Platform",
                links: ["Marketplace", "Escrow", "Wallet", "Seller Hub"],
              },
              {
                title: "Company",
                links: ["About", "Blog", "Careers", "Press"],
              },
              {
                title: "Support",
                links: ["Help Center", "API Docs", "Status", "Contact"],
              },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-white font-semibold text-sm mb-3">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-white/30 hover:text-white/60 transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">              <p className="text-xs text-white/20">
                &copy; 2025 Nexora Market. All rights reserved. HQ: Nairobi, Kenya. CBK Licensed.
              </p>
            <div className="flex items-center gap-4 text-xs text-white/20">
              <a href="#" className="hover:text-white/40 transition-colors">Privacy</a>
              <a href="#" className="hover:text-white/40 transition-colors">Terms</a>
              <a href="#" className="hover:text-white/40 transition-colors">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
