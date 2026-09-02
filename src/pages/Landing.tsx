import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import {
  Shield, Brain, Eye, Scale, CheckCircle2, Globe, ArrowRight, Zap,
  Lock, Users, TrendingUp, ChevronRight, ShieldCheck, Fingerprint,
  AlertTriangle, CreditCard, Search, Star, MapPin, Heart,
  Truck, Briefcase, Store, Package, ShoppingCart, ChevronLeft,
} from "lucide-react";
import ParticleCanvas from "@/components/canvas/ParticleCanvas";
import EscrowCore from "@/components/canvas/EscrowCore";
import NavigationBar from "@/components/layout/NavigationBar";
import { TrustBanner } from "@/components/layout/TrustBadges";
import SocialLinks from "@/components/layout/SocialLinks";
import { CATEGORIES } from "@/lib/categories";

/* ───── Reusable ───── */
function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay, ease: "easeOut" }} className={className}>
      {children}
    </motion.div>
  );
}

/* ───── Product Card (reused on homepage + marketplace) ───── */
function ProductCard({ listing }: { listing: any }) {
  const navigate = useNavigate();
  const img = listing.images?.[0] || null;

  return (
    <button
      onClick={() => navigate(`/product/${listing._id}`)}
      className="group rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden text-left transition-all hover:border-white/10 hover:bg-white/[0.04] hover:scale-[1.01]"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-white/[0.03] overflow-hidden">
        {img ? (
          <img src={img} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-8 h-8 text-white/10" />
          </div>
        )}
        {/* Wishlist */}
        <button onClick={(e) => e.stopPropagation()} className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/40 backdrop-blur-sm text-white/50 hover:text-red-400 transition-colors">
          <Heart className="w-3.5 h-3.5" />
        </button>
        {/* Condition badge */}
        {listing.condition && (
          <span className="absolute top-2 left-2 text-[9px] px-1.5 py-0.5 rounded bg-black/50 backdrop-blur-sm text-white/70 font-medium">
            {listing.condition}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-1.5">
        <h3 className="text-sm font-semibold text-white truncate group-hover:text-nx-cyan transition-colors">{listing.title}</h3>
        <p className="text-base font-bold text-white">KES {(listing.price || 0).toLocaleString()}</p>
        <div className="flex items-center gap-1.5 text-[10px] text-white/30">
          <MapPin className="w-3 h-3" />
          <span>{listing.originTown || ""} {listing.originCounty || ""}</span>
        </div>
        {/* Seller info */}
        <div className="flex items-center justify-between pt-1.5 border-t border-white/5">
          <span className="text-[10px] text-white/40 truncate">{listing.sellerName || "Seller"}</span>
          <div className="flex items-center gap-2">
            {listing.sellerVerified && (
              <span className="text-[8px] px-1 py-0.5 rounded bg-emerald-400/10 text-emerald-400 font-medium">✓ Verified</span>
            )}
            {listing.escrowProtection && (
              <span className="text-[8px] px-1 py-0.5 rounded bg-nx-violet/10 text-nx-violet font-medium">🛡 Escrow</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

/* ═══════════════════ HOMEPAGE ═══════════════════ */
export default function Landing() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [catScrollRef, setCatScrollRef] = useState<HTMLDivElement | null>(null);

  // Real products from database
  const latestListings = useQuery(api.listings.getActiveListings, { limit: 8 });
  const featuredListings = useQuery(api.listings.getActiveListings, { limit: 4 });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/marketplace?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/marketplace");
    }
  };

  const scrollCategories = (dir: "left" | "right") => {
    if (catScrollRef) {
      catScrollRef.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <ParticleCanvas />
      <NavigationBar />
      <div className="relative z-10"><TrustBanner /></div>

      {/* ══════ HERO ══════ */}
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center px-6 pt-24 pb-12 z-10">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.2, delay: 0.3 }} className="mb-2">
          <EscrowCore size={280} />
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }}
          className="text-4xl sm:text-5xl md:text-7xl font-bold text-center max-w-4xl leading-tight tracking-tight">
          <span className="text-white">Buy. Sell. </span>
          <span className="nx-gradient-text">Securely.</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.9 }}
          className="text-base sm:text-lg text-white/50 text-center max-w-2xl mt-2 leading-relaxed">
          AI-powered marketplace with protected transactions. Every trade backed by escrow.
        </motion.p>

        {/* Search Bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 1.1 }}
          className="w-full max-w-2xl mt-8">
          <div className="flex items-center rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden hover:border-white/20 transition-colors">
            <div className="pl-4"><Search className="w-5 h-5 text-white/30" /></div>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search products, vehicles, fashion, electronics..."
              className="flex-1 px-4 py-4 bg-transparent text-sm text-white placeholder:text-white/25 focus:outline-none"
            />
            <button onClick={handleSearch}
              className="px-6 py-4 bg-nx-cyan text-black text-sm font-semibold hover:bg-nx-cyan/80 transition-colors">
              Search
            </button>
          </div>
        </motion.div>

        {/* Trust badges */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1.5 }}
          className="flex flex-wrap justify-center gap-6 mt-8">
          {[
            { icon: Shield, label: "Escrow Protected" },
            { icon: Brain, label: "AI-Powered Security" },
            { icon: Globe, label: "Built for Africa" },
            { icon: Truck, label: "Platform Delivery" },
          ].map((badge, i) => (
            <motion.div key={badge.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6 + i * 0.1 }}
              className="flex items-center gap-2 text-xs text-white/40">
              <badge.icon className="w-3.5 h-3.5" />
              {badge.label}
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ══════ POPULAR CATEGORIES ══════ */}
      <section className="relative z-10 py-10 px-6 border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-white">Popular Categories</h2>
            <button onClick={() => navigate("/marketplace")} className="text-xs text-nx-cyan hover:text-nx-cyan/80 transition-colors flex items-center gap-1">
              View All <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="relative">
            <button onClick={() => scrollCategories("left")} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-black/60 text-white/40 hover:text-white transition-colors hidden md:block">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div ref={setCatScrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 px-1">
              {CATEGORIES.map((cat) => (
                <button key={cat.slug} onClick={() => navigate(`/marketplace?category=${cat.slug}`)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04] transition-all shrink-0 group min-w-[160px]">
                  <span className="text-xl">{cat.icon}</span>
                  <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">{cat.name}</span>
                </button>
              ))}
            </div>
            <button onClick={() => scrollCategories("right")} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-black/60 text-white/40 hover:text-white transition-colors hidden md:block">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ══════ FEATURED / LATEST PRODUCTS ══════ */}
      <section className="relative z-10 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-10">
            <div className="inline-flex items-center gap-2 text-nx-cyan text-xs font-medium tracking-widest uppercase mb-3">
              <Package className="w-3.5 h-3.5" />
              Live Marketplace
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Latest <span className="nx-gradient-text">Products</span>
            </h2>
            <p className="text-white/40 max-w-lg mx-auto text-sm">
              Real products from verified sellers. Every listing protected by Nexora escrow.
            </p>
          </FadeIn>

          {(!latestListings || latestListings.length === 0) ? (
            <FadeIn>
              <div className="py-20 text-center rounded-2xl border border-white/5 bg-white/[0.01]">
                <ShoppingCart className="w-12 h-12 text-white/10 mx-auto mb-3" />
                <p className="text-sm text-white/40 font-medium">Products coming soon</p>
                <p className="text-[11px] text-white/20 mt-1">Be the first to list on Nexora Market</p>
                <button onClick={() => navigate("/auth?returnTo=/seller")}
                  className="mt-4 px-6 py-2.5 rounded-xl bg-nx-violet text-white text-sm font-medium hover:bg-nx-violet/80 transition-colors">
                  Start Selling
                </button>
              </div>
            </FadeIn>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {latestListings.map((listing, i) => (
                <FadeIn key={listing._id} delay={i * 0.06}>
                  <ProductCard listing={listing} />
                </FadeIn>
              ))}
            </div>
          )}

          {latestListings && latestListings.length > 0 && (
            <FadeIn delay={0.3}>
              <div className="text-center mt-8">
                <button onClick={() => navigate("/marketplace")}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-white/60 text-sm font-medium hover:border-nx-cyan/30 hover:text-white transition-all">
                  Browse All Products <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </FadeIn>
          )}
        </div>
      </section>

      {/* ══════ HOW ESCROW WORKS (simplified) ══════ */}
      <section className="relative z-10 py-16 px-6 border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-nx-violet text-xs font-medium tracking-widest uppercase mb-3">
              <Shield className="w-3.5 h-3.5" />
              How It Works
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Safe Commerce in <span className="nx-gradient-text">4 Steps</span>
            </h2>
          </FadeIn>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { num: "01", title: "Browse & Order", desc: "Find what you want. Place your order securely.", icon: Search, color: "#06B6D4" },
              { num: "02", title: "Funds Secured", desc: "Payment locked in escrow. AI monitors for fraud.", icon: Shield, color: "#8B5CF6" },
              { num: "03", title: "Delivery", desc: "Nexora manages delivery to your door.", icon: Truck, color: "#F59E0B" },
              { num: "04", title: "Confirm & Pay", desc: "Inspect, confirm, and funds release instantly.", icon: CheckCircle2, color: "#10B981" },
            ].map((step, i) => (
              <FadeIn key={step.num} delay={i * 0.08}>
                <div className="relative p-5 rounded-xl border border-white/5 bg-white/[0.01] hover:border-white/10 transition-all text-center h-full">
                  <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center" style={{ background: `${step.color}12` }}>
                    <step.icon className="w-6 h-6" style={{ color: step.color }} />
                  </div>
                  <span className="text-[10px] font-mono font-bold tracking-widest" style={{ color: step.color }}>{step.num}</span>
                  <h3 className="text-sm font-semibold text-white mt-1 mb-2">{step.title}</h3>
                  <p className="text-xs text-white/35 leading-relaxed">{step.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ TRUST SECTION ══════ */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-nx-emerald text-xs font-medium tracking-widest uppercase mb-3">
              <Lock className="w-3.5 h-3.5" />
              Trust Architecture
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Every Transaction, <span className="nx-gradient-text">Protected</span>
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: Lock, title: "Protected Payments", desc: "Funds secured in escrow until conditions are met.", color: "#8B5CF6" },
              { icon: Fingerprint, title: "Verified Sellers", desc: "KYC-backed identity verification for every seller.", color: "#06B6D4" },
              { icon: Brain, title: "AI Risk Intelligence", desc: "Real-time ML fraud detection on every transaction.", color: "#F59E0B" },
            ].map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.08}>
                <div className="p-6 rounded-xl border border-white/5 bg-white/[0.01] hover:border-white/10 transition-all h-full text-center">
                  <div className="w-10 h-10 rounded-lg mx-auto mb-4 flex items-center justify-center" style={{ background: `${f.color}12` }}>
                    <f.icon className="w-5 h-5" style={{ color: f.color }} />
                  </div>
                  <h3 className="text-white font-semibold text-sm mb-1.5">{f.title}</h3>
                  <p className="text-white/35 text-xs leading-relaxed">{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ SELLER CTA ══════ */}
      <section className="relative z-10 py-20 px-6">
        <FadeIn>
          <div className="max-w-4xl mx-auto text-center">
            <div className="relative p-12 md:p-16 rounded-2xl border border-white/5 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-nx-violet/5 via-transparent to-nx-cyan/5" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-nx-violet/10 rounded-full blur-3xl" />
              <div className="relative z-10">
                <Store className="w-10 h-10 text-nx-violet mx-auto mb-4" />
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                  Have Something to <span className="nx-gradient-text">Sell</span>?
                </h2>
                <p className="text-white/40 max-w-lg mx-auto text-sm mb-8">
                  List it in minutes. KYC verification builds trust. Escrow protects every sale. Withdraw earnings via M-Pesa.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button onClick={() => navigate("/auth?returnTo=/seller")}
                    className="group px-8 py-3.5 rounded-xl text-white font-medium text-sm relative overflow-hidden transition-all hover:scale-[1.02]"
                    style={{ background: "linear-gradient(135deg, #8B5CF6, #6D28D9)" }}>
                    <span className="relative z-10 flex items-center gap-2">
                      Start Selling <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </button>
                  <button onClick={() => navigate("/marketplace")}
                    className="px-8 py-3.5 rounded-xl text-white/60 font-medium text-sm border border-white/10 hover:border-nx-cyan/30 hover:text-white transition-all">
                    Browse Marketplace
                  </button>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ══════ BUYER vs SELLER ══════ */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                Choose Your <span className="nx-gradient-text">Experience</span>
              </h2>
              <p className="text-white/40 max-w-lg mx-auto">
                Each path optimized for security, speed, and trust.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FadeIn delay={0.1}>
              <div className="group relative p-8 rounded-2xl border border-nx-cyan/10 bg-gradient-to-br from-nx-cyan/5 to-transparent hover:border-nx-cyan/20 transition-all">
                <div className="w-14 h-14 rounded-xl bg-nx-cyan/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Package className="w-7 h-7 text-nx-cyan" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">I'm a Buyer</h3>
                <p className="text-sm text-white/40 mb-6 leading-relaxed">
                  Browse verified products. Escrow protects every purchase until delivery confirmed.
                </p>
                <div className="space-y-2.5">
                  {["Browse & search marketplace", "Escrow protection on every order", "Track deliveries in real-time", "AI fraud detection", "Dispute resolution"].map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm text-white/50">
                      <CheckCircle2 className="w-4 h-4 text-nx-cyan/60 shrink-0" />{f}
                    </div>
                  ))}
                </div>
                <button onClick={() => navigate("/marketplace")}
                  className="w-full mt-6 py-3 rounded-xl bg-nx-cyan/10 text-nx-cyan font-medium text-sm hover:bg-nx-cyan/20 transition-colors border border-nx-cyan/20">
                  Browse Marketplace →
                </button>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="group relative p-8 rounded-2xl border border-nx-violet/10 bg-gradient-to-br from-nx-violet/5 to-transparent hover:border-nx-violet/20 transition-all">
                <div className="w-14 h-14 rounded-xl bg-nx-violet/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Store className="w-7 h-7 text-nx-violet" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">I'm a Seller</h3>
                <p className="text-sm text-white/40 mb-6 leading-relaxed">
                  List products, manage orders, withdraw earnings via M-Pesa.
                </p>
                <div className="space-y-2.5">
                  {["KYC business verification", "Upload & manage products", "Real-time order management", "Direct buyer messaging", "Withdraw to M-Pesa"].map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm text-white/50">
                      <CheckCircle2 className="w-4 h-4 text-nx-violet/60 shrink-0" />{f}
                    </div>
                  ))}
                </div>
                <button onClick={() => navigate("/auth?returnTo=/seller")}
                  className="w-full mt-6 py-3 rounded-xl bg-nx-violet/10 text-nx-violet font-medium text-sm hover:bg-nx-violet/20 transition-colors border border-nx-violet/20">
                  Start Selling →
                </button>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ══════ STATS ══════ */}
      <section className="relative z-10 border-y border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: "47", label: "Counties Covered" },
            { value: "500M+", label: "Internet Users in Africa" },
            { value: "99.9%", label: "Uptime SLA" },
            { value: "< 3s", label: "Escrow Release Time" },
          ].map((stat, i) => (
            <FadeIn key={stat.label} delay={i * 0.1} className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-xs text-white/35">{stat.label}</div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ══════ FOOTER ══════ */}
      <footer className="relative z-10 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-nx-violet" />
                <span className="text-base font-bold text-white">NEXORA<span className="text-nx-violet">.</span></span>
              </div>
              <p className="text-xs text-white/30 leading-relaxed max-w-xs">
                Africa's first AI-powered escrow marketplace. Secure, transparent, built for the continent.
              </p>
              <div className="mt-3"><SocialLinks size="sm" /></div>
            </div>
            {[
              { title: "Platform", links: ["Marketplace", "Escrow", "Wallet", "Seller Hub"] },
              { title: "Company", links: ["About", "Blog", "Careers", "Press"] },
              { title: "Support", links: ["Help Center", "API Docs", "Status", "Contact"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-white font-semibold text-xs mb-3">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}><a href="#" className="text-xs text-white/25 hover:text-white/50 transition-colors">{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[11px] text-white/15">&copy; 2025 Nexora Market. All rights reserved. HQ: Nairobi, Kenya.</p>
            <div className="flex items-center gap-4 text-[11px] text-white/15">
              <a href="/privacy" className="hover:text-white/30 transition-colors">Privacy</a>
              <a href="/terms" className="hover:text-white/30 transition-colors">Terms</a>
              <a href="/privacy" className="hover:text-white/30 transition-colors">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
