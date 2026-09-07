import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import {
  FREELANCE_CATEGORIES,
  FREELANCE_CATEGORY_GRADIENTS,
  getFreelanceCategory,
} from "@/lib/freelance-marketplace";
import FreelanceNav from "./FreelanceNav";
import {
  Search, ArrowRight, Shield, Globe, Zap, Star, Clock, Briefcase,
  PenTool, FileText, Calculator, Receipt, CheckSquare, Sparkles, Wrench,
} from "lucide-react";

export default function FreelanceLanding() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [subcategory, setSubcategory] = useState<string>("all");

  const services = useQuery(api.listings.searchFreelanceListings, {
    query: search.trim(),
    category: category === "all" ? undefined : category,
    subcategory: subcategory === "all" ? undefined : subcategory,
    limit: 48,
  });

  const display = services ?? [];
  const activeCategory = category !== "all" ? getFreelanceCategory(category) : null;

  const resetBrowse = () => {
    setCategory("all");
    setSubcategory("all");
  };

  const pickCategory = (slug: string) => {
    setCategory((prev) => (prev === slug ? "all" : slug));
    setSubcategory("all");
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <FreelanceNav active="services" showBack={false} />

      {/* ═══════ HERO ═══════ */}
      <section className="relative px-4 md:px-6 pt-14 pb-8">
        <div className="absolute inset-0 bg-gradient-to-b from-nx-violet/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-nx-violet/10 border border-nx-violet/20 text-nx-violet text-[11px] font-semibold tracking-wide mb-5">
            <Sparkles className="w-3.5 h-3.5" /> FREELANCE MARKETPLACE · SERVICES & DIGITAL TOOLS
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-tight">
            Hire <span className="bg-gradient-to-r from-nx-violet via-nx-cyan to-nx-violet bg-clip-text text-transparent">freelance services</span>
            <br />
            <span className="text-white">& digital tools — escrow protected</span>
          </h1>
          <p className="text-sm md:text-base text-white/40 max-w-2xl mx-auto mt-4 leading-relaxed">
            AI accounts, writing, design, development, marketing, bots and more.
            Pay only when the work is delivered — every transaction is secured by Nexora escrow.
          </p>

          {/* Search */}
          <div className="w-full max-w-2xl mx-auto mt-7">
            <div className="flex items-center rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden hover:border-white/20 transition-colors">
              <div className="pl-4"><Search className="w-5 h-5 text-white/30" /></div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search AI tools, writers, developers, designers..."
                className="flex-1 px-4 py-3.5 bg-transparent text-sm text-white placeholder:text-white/25 focus:outline-none"
              />
              {search && (
                <button onClick={() => setSearch("")} className="pr-3 text-white/25 hover:text-white/60 text-xs">
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Quick CTAs */}
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <button
              onClick={() => navigate("/auth?returnTo=/seller/add-product")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-nx-violet text-white text-sm font-semibold hover:bg-nx-violet/80 transition-colors"
            >
              <Wrench className="w-4 h-4" />
              {isAuthenticated && user?.role === "seller" ? "Offer a Service" : user ? "Register a Seller Store" : "Become a Seller & Offer Services"}
            </button>
            <button
              onClick={() => navigate("/freelance/jobs")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white/60 text-sm font-medium hover:border-nx-violet/30 hover:text-white transition-colors"
            >
              <Briefcase className="w-4 h-4" /> Post a Job / Find Jobs
            </button>
            <button
              onClick={() => navigate("/freelance/tools")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white/60 text-sm font-medium hover:border-nx-cyan/30 hover:text-white transition-colors"
            >
              <PenTool className="w-4 h-4" /> Freelancer Tools
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-6 mt-8">
            {[
              { label: "Escrow Protected", icon: Shield },
              { label: "AI-Assisted Disputes", icon: Zap },
              { label: "Built for Africa", icon: Globe },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-2 text-xs text-white/35">
                <b.icon className="w-3.5 h-3.5 text-nx-emerald/70" /> {b.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ MARKETPLACE BROWSER ═══════ */}
      <section className="px-4 md:px-6 py-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          {/* Category chips */}
          <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 -mx-1 px-1">
            <button
              onClick={resetBrowse}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors border ${
                category === "all"
                  ? "bg-nx-violet/15 text-nx-violet border-nx-violet/25"
                  : "bg-white/[0.03] text-white/40 border-white/5 hover:border-white/15 hover:text-white/70"
              }`}
            >
              All Services
            </button>
            {FREELANCE_CATEGORIES.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => pickCategory(cat.slug)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors border ${
                  category === cat.slug
                    ? "bg-nx-violet/15 text-nx-violet border-nx-violet/25"
                    : "bg-white/[0.03] text-white/40 border-white/5 hover:border-white/15 hover:text-white/70"
                }`}
              >
                <span>{cat.icon}</span> {cat.name}
              </button>
            ))}
          </div>

          {/* Subcategory chips */}
          {activeCategory && (
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
              <button
                onClick={() => setSubcategory("all")}
                className={`px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
                  subcategory === "all" ? "bg-nx-cyan text-black" : "bg-white/[0.04] text-white/40 border border-white/5 hover:text-white/70"
                }`}
              >
                All {activeCategory.name}
              </button>
              {activeCategory.subcategories.map((sub) => (
                <button
                  key={sub.slug}
                  onClick={() => setSubcategory(subcategory === sub.slug ? "all" : sub.slug)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
                    subcategory === sub.slug ? "bg-nx-cyan text-black" : "bg-white/[0.04] text-white/40 border border-white/5 hover:text-white/70"
                  }`}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          )}

          {/* Results header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white">
                {category === "all" ? "Latest services & digital tools" : activeCategory?.name}
                {search.trim() && <span className="text-white/40"> for “{search.trim()}”</span>}
              </h2>
              <p className="text-xs text-white/30 mt-1">{display.length} freelance listing{display.length === 1 ? "" : "s"} · posted by verified providers</p>
            </div>
            {(category !== "all" || search.trim()) && (
              <button onClick={resetBrowse} className="text-xs text-white/35 hover:text-white/70 whitespace-nowrap transition-colors">
                Reset filters
              </button>
            )}
          </div>

          {/* Grid */}
          {display.length === 0 ? (
            <div className="text-center py-20 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="w-16 h-16 rounded-2xl bg-nx-violet/10 flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-white/15" />
              </div>
              <p className="text-sm text-white/50 font-medium">No freelance services found</p>
              <p className="text-xs text-white/25 mt-1.5 max-w-sm mx-auto">
                {search.trim() || category !== "all"
                  ? "Try a different keyword or category."
                  : "Be the first to offer a freelance service in this category."}
              </p>
              <button
                onClick={() => navigate("/auth?returnTo=/seller/add-product")}
                className="mt-5 px-5 py-2.5 rounded-xl bg-nx-violet text-white text-sm font-semibold hover:bg-nx-violet/80 transition-colors"
              >
                {isAuthenticated && user?.role === "seller" ? "Offer a Service" : "Register a Seller Store"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {display.map((svc: any) => {
                const cat = getFreelanceCategory(svc.category);
                const deliveryTime = svc.attributes?.["Delivery Time"] || svc.attributes?.["Delivery"];
                return (
                  <button
                    key={svc._id}
                    onClick={() => navigate(`/freelance/service/${svc._id}`)}
                    className="text-left rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden hover:border-nx-violet/25 hover:bg-white/[0.035] hover:-translate-y-0.5 transition-all group flex flex-col"
                  >
                    <div className={`aspect-[16/10] bg-gradient-to-br ${FREELANCE_CATEGORY_GRADIENTS[svc.category] || FREELANCE_CATEGORY_GRADIENTS["other-services"]} overflow-hidden relative flex items-center justify-center`}>
                      {svc.images?.[0] ? (
                        <img src={svc.images[0]} alt={svc.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <span className="text-6xl drop-shadow-lg">{cat?.icon || "💼"}</span>
                      )}
                      <span className="absolute top-2 left-2 text-[10px] px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white/90">
                        {cat?.icon} {cat?.name || svc.category}
                      </span>
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-nx-emerald/10 text-nx-emerald font-medium flex items-center gap-1">
                          <Shield className="w-2.5 h-2.5" /> Escrow
                        </span>
                        {deliveryTime && (
                          <span className="flex items-center gap-1 text-[10px] text-white/30">
                            <Clock className="w-2.5 h-2.5" /> {deliveryTime}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-white leading-snug group-hover:text-nx-violet transition-colors line-clamp-2 mb-2">
                        {svc.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-auto pt-3 border-t border-white/5">
                        <div className="w-6 h-6 rounded-full bg-nx-violet/15 flex items-center justify-center text-nx-violet text-[10px] font-bold">
                          {(svc.sellerName || "S").charAt(0)}
                        </div>
                        <span className="text-[10px] text-white/40 truncate">{svc.sellerName}</span>
                        {svc.sellerVerified && (
                          <span className="text-[10px] text-nx-cyan ml-auto">✓ Verified</span>
                        )}
                      </div>
                      <div className="flex items-baseline justify-between mt-2">
                        <span className="text-[10px] text-white/30">from</span>
                        <span className="text-base font-bold text-white">KES {svc.price.toLocaleString()}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ═══════ JOBS STRIP ═══════ */}
      <section className="px-4 md:px-6 py-10 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl border border-white/5 p-8 md:p-10">
            <div className="absolute inset-0 bg-gradient-to-br from-nx-violet/8 via-transparent to-nx-cyan/5 pointer-events-none" />
            <div className="relative flex flex-col md:flex-row md:items-center gap-6 justify-between">
              <div className="max-w-xl">
                <div className="flex items-center gap-2 text-nx-violet text-xs font-semibold tracking-widest uppercase mb-2">
                  <Briefcase className="w-3.5 h-3.5" /> Jobs Board
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Need work done? Post a job.<br className="hidden md:block" />
                  <span className="bg-gradient-to-r from-nx-violet to-nx-cyan bg-clip-text text-transparent">Freelancers apply in minutes.</span>
                </h2>
                <p className="text-sm text-white/40 leading-relaxed">
                  Post projects with a budget, review proposals from verified freelancers,
                  hire securely and pay through escrow when milestones are delivered.
                </p>
                <div className="flex flex-wrap gap-3 mt-6">
                  <button
                    onClick={() => navigate("/freelance/jobs")}
                    className="px-5 py-2.5 rounded-xl bg-nx-violet text-white text-sm font-semibold hover:bg-nx-violet/80 transition-colors flex items-center gap-2"
                  >
                    Browse Jobs <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigate(isAuthenticated ? "/freelance/jobs?post=1" : "/auth?returnTo=%2Ffreelance%2Fjobs%3Fpost%3D1")}
                    className="px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white/60 text-sm font-medium hover:border-nx-violet/30 hover:text-white transition-colors"
                  >
                    Post a Job
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 md:w-72 shrink-0">
                {[
                  { icon: Search, t: "Find work", d: "Browse & apply to open jobs" },
                  { icon: Star, t: "Hire talent", d: "Pick the best proposals" },
                  { icon: Shield, t: "Secure pay", d: "Escrow on every hire" },
                  { icon: Globe, t: "Remote OK", d: "Work from anywhere" },
                ].map((c) => (
                  <div key={c.t} className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                    <c.icon className="w-4 h-4 text-nx-violet mb-2" />
                    <p className="text-xs font-semibold text-white">{c.t}</p>
                    <p className="text-[10px] text-white/30 mt-0.5 leading-relaxed">{c.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ TOOLS STRIP ═══════ */}
      <section className="px-4 md:px-6 py-10 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 text-nx-cyan text-xs font-semibold tracking-widest uppercase mb-2">
                <PenTool className="w-3.5 h-3.5" /> Freelancer Tools
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                Everything you need to <span className="bg-gradient-to-r from-nx-cyan to-nx-violet bg-clip-text text-transparent">win & get paid</span>
              </h2>
            </div>
            <button
              onClick={() => navigate("/freelance/tools")}
              className="hidden sm:flex items-center gap-1.5 text-xs text-white/45 hover:text-white/80 transition-colors"
            >
              Open all tools <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { icon: FileText, t: "Proposal Writer", d: "Turn job posts into winning proposals", grad: "from-nx-violet/15 to-nx-violet/0", border: "hover:border-nx-violet/30" },
              { icon: PenTool, t: "CV Builder", d: "Professional resumes in minutes", grad: "from-emerald-500/15 to-emerald-500/0", border: "hover:border-emerald-500/25" },
              { icon: Sparkles, t: "Writing Studio", d: "Word count, tone & headline helpers", grad: "from-nx-cyan/15 to-nx-cyan/0", border: "hover:border-nx-cyan/25" },
              { icon: Calculator, t: "Pricing Calculator", d: "Rate your work after platform fees", grad: "from-amber-500/15 to-amber-500/0", border: "hover:border-amber-500/25" },
              { icon: Receipt, t: "Invoice Generator", d: "Professional invoices in one click", grad: "from-rose-500/15 to-rose-500/0", border: "hover:border-rose-500/25" },
            ].map((tool, i) => (
              <button
                key={tool.t}
                onClick={() => navigate("/freelance/tools")}
                className={`p-5 rounded-2xl bg-gradient-to-b ${tool.grad} bg-white/[0.02] border border-white/5 ${tool.border} transition-all text-left group`}
              >
                <tool.icon className="w-6 h-6 text-white/70 mb-3 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-semibold text-white">{tool.t}</p>
                <p className="text-[11px] text-white/35 mt-1 leading-relaxed">{tool.d}</p>
              </button>
            ))}
          </div>
          <div className="sm:hidden text-center mt-4">
            <button onClick={() => navigate("/freelance/tools")} className="text-xs text-nx-cyan hover:text-nx-cyan/80">
              Open all tools →
            </button>
          </div>
        </div>
      </section>

      {/* ═══════ CATEGORIES META ═══════ */}
      <section className="px-4 md:px-6 py-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center text-xs uppercase tracking-widest text-white/25 mb-4">Explore by category</h2>
          <div className="flex flex-wrap justify-center gap-2">
            {FREELANCE_CATEGORIES.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => { pickCategory(cat.slug); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/[0.02] border border-white/5 text-xs text-white/45 hover:border-nx-violet/25 hover:text-white transition-colors"
              >
                <span>{cat.icon}</span> {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="py-7 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-nx-violet" />
            <span className="text-xs font-bold text-white">NEXORA<span className="text-nx-violet">.</span> FREELANCE</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-white/25">
            <button onClick={() => navigate("/marketplace")} className="hover:text-white/50 transition-colors">Main Marketplace</button>
            <button onClick={() => navigate("/privacy")} className="hover:text-white/50 transition-colors">Privacy</button>
            <button onClick={() => navigate("/terms")} className="hover:text-white/50 transition-colors">Terms</button>
          </div>
          <p className="text-[10px] text-white/15">© 2025 Nexora Market. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
