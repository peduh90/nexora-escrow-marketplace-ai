import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import {
  Shield, Brain, Eye, Scale, CheckCircle2, Globe, ArrowRight, Zap,
  Lock, Users, TrendingUp, ChevronRight, ShieldCheck, Fingerprint,
  AlertTriangle, CreditCard, Search, Star, MapPin, Heart,
  Truck, Briefcase, Store, Package, ShoppingCart,
} from "lucide-react";
import ParticleCanvas from "@/components/canvas/ParticleCanvas";
import GalacticCore from "@/components/canvas/GalacticCore";
import NavigationBar from "@/components/layout/NavigationBar";
import { TrustBanner } from "@/components/layout/TrustBadges";
import SocialLinks from "@/components/layout/SocialLinks";
import { CATEGORIES } from "@/lib/categories";
import { CATEGORY_DEFAULTS, PRODUCT_PLACEHOLDER } from "@/lib/category-images";

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
          <img src={PRODUCT_PLACEHOLDER[listing.category] || PRODUCT_PLACEHOLDER["mobile-phones"]} alt="" className="w-full h-full object-cover opacity-40" />
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

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <ParticleCanvas />
      <NavigationBar />
      <div className="relative z-10"><TrustBanner /></div>

      {/* ══════ HERO ══════ */}
      <section id="platform" className="relative flex flex-col items-center justify-center px-6 pt-20 md:pt-24 pb-6 z-10">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.5, delay: 0.2 }} className="mb-0">
          <GalacticCore size={160} />
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.8 }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-center max-w-4xl leading-tight tracking-tight mt-2">
          <span className="text-white">Buy. Sell. Work. </span>
          <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-cyan-200 bg-clip-text text-transparent">Securely.</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 1.0 }}
          className="text-xs sm:text-sm md:text-base text-white/40 text-center max-w-2xl mt-2 leading-relaxed">
          AI-powered escrow marketplace for buyers & sellers. Plus a freelance marketplace for writers & employers. Every transaction protected.
        </motion.p>

        {/* Two Marketplace CTAs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 1.2 }}
          className="flex flex-col sm:flex-row gap-4 mt-6">
          <button onClick={() => navigate("/marketplace")}
            className="px-8 py-3.5 rounded-xl bg-nx-cyan text-black font-semibold text-sm hover:bg-nx-cyan/80 transition-all hover:scale-[1.02] flex items-center gap-2 justify-center">
            <ShoppingCart className="w-4 h-4" /> Explore Marketplace
          </button>
          <button onClick={() => navigate("/freelance")}
            className="px-8 py-3.5 rounded-xl bg-nx-violet text-white font-semibold text-sm hover:bg-nx-violet/80 transition-all hover:scale-[1.02] flex items-center gap-2 justify-center">
            <Briefcase className="w-4 h-4" /> Explore Freelance
          </button>
        </motion.div>

        {/* Search Bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 1.1 }}
          className="w-full max-w-2xl mt-4">
          <div className="flex items-center rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden hover:border-white/20 transition-colors">
            <div className="pl-4"><Search className="w-5 h-5 text-white/30" /></div>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search products, vehicles, fashion, electronics..."
              className="flex-1 px-4 py-3 md:py-4 bg-transparent text-sm text-white placeholder:text-white/25 focus:outline-none"
            />
            <button onClick={handleSearch}
              className="px-5 md:px-6 py-3 md:py-4 bg-nx-cyan text-black text-sm font-semibold hover:bg-nx-cyan/80 transition-colors">
              Search
            </button>
          </div>
        </motion.div>

        {/* Trust badges */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1.5 }}
          className="flex flex-wrap justify-center gap-4 mt-4">
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

      {/* ══════ CATEGORIES (same grid as Marketplace) ══════ */}
      <section className="relative z-10 py-6 px-6 border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Browse <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-cyan-200 bg-clip-text text-transparent">Categories</span>
            </h2>
            <p className="text-sm text-white/40">Find exactly what you need across our marketplace</p>
          </FadeIn>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-2 justify-items-center">
            {CATEGORIES.map((cat, i) => (
              <FadeIn key={cat.slug} delay={i * 0.03}>
                <button
                  onClick={() => navigate(`/marketplace?category=${cat.slug}`)}
                  className="relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl text-center transition-all overflow-hidden h-24 md:h-28 w-full group hover:ring-1 hover:ring-white/20"
                >
                  <img
                    src={CATEGORY_DEFAULTS[cat.slug] || CATEGORY_DEFAULTS["mobile-phones"]}
                    alt={cat.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <span className="relative z-10 text-xl group-hover:scale-110 transition-transform drop-shadow-lg">{cat.icon}</span>
                  <span className="relative z-10 text-[10px] md:text-xs font-bold text-white leading-tight drop-shadow-lg">{cat.name}</span>
                </button>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={0.3}>
            <div className="text-center mt-6">
              <button onClick={() => navigate("/marketplace")}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-white/10 text-white/60 text-sm font-medium hover:border-cyan-300/30 hover:text-white transition-all">
                Browse All Products <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══════ FEATURED / LATEST PRODUCTS ══════ */}
      <section className="relative z-10 py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-6">
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[
                { img: "https://images.pexels.com/photos/18105/pexels-photo.jpg?w=600&h=400&fit=crop", title: "MacBook Pro 14\" M3", price: "KSh 185,000", loc: "Westlands, Nairobi", seller: "TechZone KE", verified: true, cond: "Brand New" },
                { img: "https://images.pexels.com/photos/1092671/pexels-photo-1092671.jpeg?w=600&h=400&fit=crop", title: "iPhone 15 Pro Max 256GB", price: "KSh 142,000", loc: "CBD, Nairobi", seller: "AppleStore KE", verified: true, cond: "Brand New" },
                { img: "https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg?w=600&h=400&fit=crop", title: "Toyota Axio 2019 Low Milleage", price: "KSh 1,450,000", loc: "Kiambu Road", seller: "AutoHub KE", verified: true, cond: "Used" },
                { img: "https://images.pexels.com/photos/1648776/pexels-photo-1648776.jpeg?w=600&h=400&fit=crop", title: "Modern 3-Seater Leather Sofa", price: "KSh 35,000", loc: "Karen, Nairobi", seller: "HomeStyle KE", verified: false, cond: "Brand New" },
                { img: "https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?w=600&h=400&fit=crop", title: "Nike Air Max 270 Triple Black", price: "KSh 12,500", loc: "CBD, Nairobi", seller: "SneakerBox KE", verified: true, cond: "Brand New" },
                { img: "https://images.pexels.com/photos/2294361/pexels-photo-2294361.jpeg?w=600&h=400&fit=crop", title: "Commercial Blender Pro 2000W", price: "KSh 8,900", loc: "Industrial Area", seller: "ChefPro KE", verified: false, cond: "Brand New" },
                { img: "https://images.pexels.com/photos/1229861/pexels-photo-1229861.jpeg?w=600&h=400&fit=crop", title: "Samsung 55\" 4K Smart TV 2024", price: "KSh 62,000", loc: "Mombasa Road", seller: "ElectroHub KE", verified: true, cond: "Brand New" },
                { img: "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?w=600&h=400&fit=crop", title: "Golden Retriever Puppy Male", price: "KSh 25,000", loc: "Runda, Nairobi", seller: "PetZone KE", verified: true, cond: "Brand New" },
              ].map((item, i) => (
                <FadeIn key={i} delay={i * 0.06}>
                  <div onClick={() => navigate("/marketplace")} className="group cursor-pointer rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden hover:border-white/15 hover:bg-white/[0.04] transition-all duration-300">
                    <div className="relative h-44 overflow-hidden">
                      <img src={item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute top-2 left-2 flex gap-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-nx-emerald/90 text-white">Escrow</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/20 text-white backdrop-blur-sm">{item.cond}</span>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-white font-bold text-lg drop-shadow-lg">{item.price}</p>
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="text-white text-sm font-semibold truncate">{item.title}</h3>
                      <div className="flex items-center justify-between mt-1.5">
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-white/15">{item.seller}</span>
                          {item.verified && <span className="text-nx-emerald text-[10px]">✓</span>}
                        </div>
                        <span className="text-[10px] text-white/10 flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{item.loc.split(",")[0]}</span>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {latestListings.map((listing, i) => (
                <FadeIn key={listing._id} delay={i * 0.06}>
                  <ProductCard listing={listing} />
                </FadeIn>
              ))}
            </div>
          )}

          <FadeIn delay={0.3}>
            <div className="text-center mt-8">
              <button onClick={() => navigate("/marketplace")}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-white/60 text-sm font-medium hover:border-nx-cyan/30 hover:text-white transition-all">
                Browse All Products <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══════ HOW ESCROW WORKS (simplified) ══════ */}
      <section id="how-it-works" className="relative z-10 py-8 px-6 border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-8">
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
      <section id="trust" className="relative z-10 py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-8">
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
      <section id="pricing" className="relative z-10 py-8 px-6">
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

      {/* ══════ FOUR PANELS ══════ */}
      <section className="relative z-10 py-10 px-6 border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 text-nx-violet text-xs font-medium tracking-widest uppercase mb-3">
                <Users className="w-3.5 h-3.5" />
                Join Nexora
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                Choose Your <span className="nx-gradient-text">Experience</span>
              </h2>
              <p className="text-white/40 max-w-lg mx-auto">
                One account. Four roles. Full flexibility.
              </p>
            </div>
          </FadeIn>

          {/* Marketplace Row */}
          <FadeIn delay={0.05}>
            <p className="text-xs text-white/30 font-medium tracking-wider uppercase mb-4 text-center">Marketplace — Buy & Sell</p>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            <FadeIn delay={0.1}>
              <div className="group relative p-6 rounded-2xl border border-nx-cyan/10 bg-gradient-to-br from-nx-cyan/5 to-transparent hover:border-nx-cyan/20 transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-nx-cyan/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Package className="w-6 h-6 text-nx-cyan" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Buyer</h3>
                    <p className="text-xs text-white/40">Browse & purchase products</p>
                  </div>
                </div>
                <div className="space-y-1.5 mb-4">
                  {['Browse & search marketplace', 'Escrow protection on every order', 'Track deliveries in real-time', 'AI fraud detection'].map((f) => (
                    <div key={f} className="flex items-center gap-2 text-xs text-white/40">
                      <CheckCircle2 className="w-3.5 h-3.5 text-nx-cyan/50 shrink-0" />{f}
                    </div>
                  ))}
                </div>
                <button onClick={() => navigate('/marketplace')}
                  className="w-full py-2.5 rounded-xl bg-nx-cyan/10 text-nx-cyan font-medium text-xs hover:bg-nx-cyan/20 transition-colors border border-nx-cyan/20">
                  Browse Marketplace →
                </button>
              </div>
            </FadeIn>

            <FadeIn delay={0.15}>
              <div className="group relative p-6 rounded-2xl border border-nx-violet/10 bg-gradient-to-br from-nx-violet/5 to-transparent hover:border-nx-violet/20 transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-nx-violet/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Store className="w-6 h-6 text-nx-violet" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Seller</h3>
                    <p className="text-xs text-white/40">List products & earn</p>
                  </div>
                </div>
                <div className="space-y-1.5 mb-4">
                  {['KYC business verification', 'Upload & manage products', 'Real-time order management', 'Withdraw to M-Pesa'].map((f) => (
                    <div key={f} className="flex items-center gap-2 text-xs text-white/40">
                      <CheckCircle2 className="w-3.5 h-3.5 text-nx-violet/50 shrink-0" />{f}
                    </div>
                  ))}
                </div>
                <button onClick={() => navigate('/auth?returnTo=/seller')}
                  className="w-full py-2.5 rounded-xl bg-nx-violet/10 text-nx-violet font-medium text-xs hover:bg-nx-violet/20 transition-colors border border-nx-violet/20">
                  Start Selling →
                </button>
              </div>
            </FadeIn>
          </div>

          {/* Freelance Row */}
          <FadeIn delay={0.2}>
            <p className="text-xs text-white/30 font-medium tracking-wider uppercase mb-4 text-center">Freelance Marketplace — Work & Hire</p>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FadeIn delay={0.25}>
              <div className="group relative p-6 rounded-2xl border border-emerald-500/10 bg-gradient-to-br from-emerald-500/5 to-transparent hover:border-emerald-500/20 transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-lg">✍️</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Writer / Freelancer</h3>
                    <p className="text-xs text-white/40">Find work & get paid</p>
                  </div>
                </div>
                <div className="space-y-1.5 mb-4">
                  {['Browse available jobs', 'Submit proposals', 'Work with escrow protection', 'Withdraw earnings via M-Pesa'].map((f) => (
                    <div key={f} className="flex items-center gap-2 text-xs text-white/40">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/50 shrink-0" />{f}
                    </div>
                  ))}
                </div>
                <button onClick={() => navigate('/auth?returnTo=/freelance/dashboard')}
                  className="w-full py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 font-medium text-xs hover:bg-emerald-500/20 transition-colors border border-emerald-500/20">
                  Find Work →
                </button>
              </div>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div className="group relative p-6 rounded-2xl border border-amber-500/10 bg-gradient-to-br from-amber-500/5 to-transparent hover:border-amber-500/20 transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-lg">💼</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Employer</h3>
                    <p className="text-xs text-white/40">Post jobs & hire talent</p>
                  </div>
                </div>
                <div className="space-y-1.5 mb-4">
                  {['Post jobs & tasks', 'Review proposals', 'Hire with escrow protection', 'Manage projects & milestones'].map((f) => (
                    <div key={f} className="flex items-center gap-2 text-xs text-white/40">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-500/50 shrink-0" />{f}
                    </div>
                  ))}
                </div>
                <button onClick={() => navigate('/auth?returnTo=/freelance/dashboard')}
                  className="w-full py-2.5 rounded-xl bg-amber-500/10 text-amber-400 font-medium text-xs hover:bg-amber-500/20 transition-colors border border-amber-500/20">
                  Post a Job →
                </button>
              </div>
            </FadeIn>
          </div>

          <FadeIn delay={0.35}>
            <p className="text-center text-[11px] text-white/25 mt-6">
              One Nexora account — switch between Buyer, Seller, Writer, and Employer roles anytime.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ══════ TRUST BADGES ══════ */}
      <section className="relative z-10 border-y border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { icon: Shield, label: "Escrow Protected", desc: "Every transaction" },
            { icon: Brain, label: "AI-Powered Security", desc: "Real-time fraud detection" },
            { icon: Globe, label: "Built for Africa", desc: "M-Pesa native" },
            { icon: Truck, label: "Platform Delivery", desc: "Managed logistics" },
          ].map((stat, i) => (
            <FadeIn key={stat.label} delay={i * 0.1} className="text-center">
              <stat.icon className="w-6 h-6 text-nx-violet mx-auto mb-2" />
              <div className="text-sm font-semibold text-white mb-1">{stat.label}</div>
              <div className="text-xs text-white/35">{stat.desc}</div>
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
              { title: "Platform", links: ["Marketplace", "Freelance", "Escrow", "Wallet", "Seller Hub"] },
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
          <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">              <p className="text-[11px] text-white/15">&copy; 2025 Nexora Market. All rights reserved. HQ: Nairobi, Kenya. | <a href="/freelance" className="hover:text-white/30 transition-colors">Freelance Marketplace</a></p>
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
