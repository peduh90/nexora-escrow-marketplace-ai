import { useState } from "react";
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
  Bot, Users,
} from "lucide-react";

const TOOL_TILES = [
  { icon: FileText, label: "Proposal Writer", desc: "Turn job posts into winning proposals", grad: "from-nx-violet/20 to-transparent", ring: "hover:ring-nx-violet/40" },
  { icon: PenTool, label: "CV Builder", desc: "Professional resumes in minutes", grad: "from-emerald-500/20 to-transparent", ring: "hover:ring-emerald-500/40" },
  { icon: Sparkles, label: "Writing Studio", desc: "Word counts & headline ideas", grad: "from-nx-cyan/20 to-transparent", ring: "hover:ring-nx-cyan/40" },
  { icon: Calculator, label: "Pricing Calculator", desc: "Know your take-home after fees", grad: "from-amber-500/20 to-transparent", ring: "hover:ring-amber-500/40" },
  { icon: Receipt, label: "Invoice Generator", desc: "Clean invoices that get you paid", grad: "from-rose-500/20 to-transparent", ring: "hover:ring-rose-500/40" },
  { icon: CheckSquare, label: "Task Planner", desc: "Stay productive across clients", grad: "from-nx-violet/20 to-transparent", ring: "hover:ring-nx-violet/40" },
];

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
    limit: 60,
  });

  const display = services ?? [];
  const activeCategory = category !== "all" ? getFreelanceCategory(category) : null;
  const isSeller = isAuthenticated && user?.role === "seller";

  const scrollToListings = () => {
    document.getElementById("freelance-listings")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const pickCategory = (slug: string) => {
    setCategory((prev) => (prev === slug ? "all" : slug));
    setSubcategory("all");
    scrollToListings();
  };

  const clearFilters = () => {
    setCategory("all");
    setSubcategory("all");
    setSearch("");
  };

  // Existing sellers go straight to publishing; everyone else lands on the
  // dedicated seller panel (register/sign in) and continues from /seller.
  const publishCta = () => {
    if (isSeller) {
      navigate("/seller/add-product");
    } else {
      navigate("/auth/seller?returnTo=%2Fseller%2Fadd-product");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <FreelanceNav active="services" showBack={false} />

      {/* ───────── HERO ───────── */}
      <section className="px-4 md:px-6 pt-12 pb-8 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-nx-violet/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-nx-violet/10 border border-nx-violet/20 text-nx-violet text-[11px] font-semibold mb-4">
            <Bot className="w-3.5 h-3.5" /> FREELANCE MARKETPLACE · SERVICES, ACCOUNTS & DIGITAL TOOLS
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-tight">
            Buy & sell <span className="bg-gradient-to-r from-nx-violet via-nx-cyan to-nx-violet bg-clip-text text-transparent">freelance services</span>,
            <br />
            <span className="text-white">accounts & digital tools</span>
          </h1>
          <p className="text-sm md:text-base text-white/40 max-w-2xl mx-auto mt-4 leading-relaxed">
            AI accounts & tools, writing accounts, Grammarly-style bots, design, development, marketing and more —
            escrow protected until the work is delivered.
          </p>

          <div className="w-full max-w-2xl mx-auto mt-7">
            <div className="flex items-center rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden hover:border-white/20 transition-colors">
              <div className="pl-4"><Search className="w-5 h-5 text-white/30" /></div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search accounts, AI tools, writers, developers, bots..."
                className="flex-1 px-4 py-3.5 bg-transparent text-sm text-white placeholder:text-white/25 focus:outline-none"
              />
              {search && (
                <button onClick={() => setSearch("")} className="pr-3 text-white/25 hover:text-white/60 text-xs">Clear</button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <button
              onClick={publishCta}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-nx-violet text-white text-sm font-semibold hover:bg-nx-violet/80 transition-colors"
            >
              <Wrench className="w-4 h-4" /> {isSeller ? "Offer a Service" : user ? "Register a Seller Store" : "Become a Seller & Offer Services"}
            </button>
            <button
              onClick={() => navigate("/freelance/jobs")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white/60 text-sm font-medium hover:border-nx-violet/30 hover:text-white transition-colors"
            >
              <Briefcase className="w-4 h-4" /> Post / Find Jobs
            </button>
            <button
              onClick={() => navigate("/freelance/tools")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white/60 text-sm font-medium hover:border-nx-cyan/30 hover:text-white transition-colors"
            >
              <PenTool className="w-4 h-4" /> Freelancer Tools
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-5 mt-7 text-xs text-white/35">
            <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-nx-emerald/80" /> Escrow protected</span>
            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-nx-gold/80" /> AI-assisted disputes</span>
            <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-nx-cyan/80" /> M-Pesa & wallet payments</span>
          </div>
        </div>
      </section>

      {/* ───────── ACCOUNT CATEGORIES ───────── */}
      <section className="px-4 md:px-6 py-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-7">
            <h2 className="text-xl md:text-3xl font-bold text-white">
              Browse <span className="bg-gradient-to-r from-nx-violet to-nx-cyan bg-clip-text text-transparent">account categories</span>
            </h2>
            <p className="text-xs md:text-sm text-white/35 mt-2 max-w-xl mx-auto">
              AI accounts, writing accounts, bots (Grammarly-style tools), design, development, marketing & other freelance services —
              pick a category to see what providers offer.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {FREELANCE_CATEGORIES.map((cat) => {
              const active = category === cat.slug;
              return (
                <button
                  key={cat.slug}
                  onClick={() => pickCategory(cat.slug)}
                  className={`relative overflow-hidden rounded-2xl border p-4 md:p-5 text-left transition-all bg-gradient-to-b ${FREELANCE_CATEGORY_GRADIENTS[cat.slug] || ""} ${
                    active
                      ? "border-nx-violet/50 ring-1 ring-nx-violet/30 bg-white/[0.04]"
                      : "border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-3xl">{cat.icon}</span>
                    {active && (
                      <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-white bg-nx-violet/30 px-2 py-0.5 rounded-full">
                        <Search className="w-2.5 h-2.5" /> Viewing
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-white leading-snug">{cat.name}</h3>
                  <p className="text-[11px] text-white/40 leading-relaxed mt-1 line-clamp-2">{cat.description}</p>
                </button>
              );
            })}

            {/* Jobs category tile */}
            <button
              onClick={() => navigate("/freelance/jobs")}
              className="relative overflow-hidden rounded-2xl border border-white/5 p-4 md:p-5 text-left transition-all bg-gradient-to-b from-nx-gold/15 to-transparent hover:border-nx-gold/30 hover:bg-white/[0.03]"
            >
              <div className="flex items-start justify-between mb-3">
                <Briefcase className="w-7 h-7 text-nx-gold" />
                <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-nx-gold px-2 py-0.5 rounded-full bg-nx-gold/10">
                  <Users className="w-2.5 h-2.5" /> Open jobs
                </span>
              </div>
              <h3 className="text-sm font-bold text-white leading-snug">Jobs</h3>
              <p className="text-[11px] text-white/40 leading-relaxed mt-1 line-clamp-2">
                Post a job as a client, or apply as a freelancer — paid securely in escrow.
              </p>
            </button>
          </div>
        </div>
      </section>

      {/* ───────── SERVICES GRID (freelance only) ───────── */}
      <section id="freelance-listings" className="px-4 md:px-6 py-8 border-t border-white/5 scroll-mt-14">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg md:text-2xl font-bold text-white">
                {category === "all" ? "Freelance services & digital tools" : `${activeCategory?.icon || ""} ${activeCategory?.name}`}
                {search.trim() && <span className="text-white/40"> · “{search.trim()}”</span>}
              </h2>
              <p className="text-xs text-white/30 mt-1">
                {display.length} freelance listing{display.length === 1 ? "" : "s"} · only listings published to the Freelance Marketplace appear here
              </p>
            </div>
            {(category !== "all" || search.trim()) && (
              <button onClick={clearFilters} className="text-xs text-white/35 hover:text-white/70 transition-colors">
                Clear filters
              </button>
            )}
          </div>

          {activeCategory && (
            <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
              <button
                onClick={() => setSubcategory("all")}
                className={`px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${subcategory === "all" ? "bg-nx-cyan text-black" : "bg-white/[0.04] text-white/40 border border-white/5 hover:text-white/70"}`}
              >
                All {activeCategory.name}
              </button>
              {activeCategory.subcategories.map((sub) => (
                <button
                  key={sub.slug}
                  onClick={() => setSubcategory(subcategory === sub.slug ? "all" : sub.slug)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${subcategory === sub.slug ? "bg-nx-cyan text-black" : "bg-white/[0.04] text-white/40 border border-white/5 hover:text-white/70"}`}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          )}

          {display.length === 0 ? (
            <div className="text-center py-20 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="w-16 h-16 rounded-2xl bg-nx-violet/10 flex items-center justify-center mx-auto mb-4">
                {activeCategory ? <span className="text-3xl">{activeCategory.icon}</span> : <Search className="w-8 h-8 text-white/15" />}
              </div>
              <p className="text-sm text-white/50 font-medium">
                {activeCategory ? `No ${activeCategory.name.toLowerCase()} offered yet` : "No freelance services found"}
              </p>
              <p className="text-xs text-white/25 mt-1.5 max-w-sm mx-auto">
                {search.trim() || category !== "all"
                  ? "Try a different keyword or category."
                  : "When a seller publishes with a freelance category, the listing appears here — and only here."}
              </p>
              <button
                onClick={publishCta}
                className="mt-5 px-5 py-2.5 rounded-xl bg-nx-violet text-white text-sm font-semibold hover:bg-nx-violet/80 transition-colors"
              >
                {isSeller ? "Offer the first service" : "Register a Seller Store to Offer Services"}
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
                        {svc.sellerReputation > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px] text-amber-400 ml-auto">
                            <Star className="w-2.5 h-2.5 fill-amber-400" /> {svc.sellerReputation.toFixed(1)}
                          </span>
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

      {/* ───────── JOBS + TOOLS ───────── */}
      <section className="px-4 md:px-6 py-10 border-t border-white/5">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Jobs band */}
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="relative overflow-hidden rounded-2xl border border-white/5 p-6 md:p-8 bg-gradient-to-br from-nx-violet/10 via-transparent to-transparent">
              <div className="flex items-center gap-2 text-nx-violet text-[11px] font-semibold tracking-widest uppercase mb-2">
                <Briefcase className="w-4 h-4" /> Jobs Board
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
                Post a job — or apply to one
              </h2>
              <p className="text-sm text-white/40 leading-relaxed">
                Clients post projects with a budget. Freelancers apply in minutes.
                Accept a proposal and the funds are held in escrow until delivery.
              </p>
              <div className="flex flex-wrap gap-3 mt-5">
                <button onClick={() => navigate("/freelance/jobs")}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-nx-violet text-white text-xs font-semibold hover:bg-nx-violet/80 transition-colors">
                  Browse Jobs <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => navigate(isAuthenticated ? "/freelance/jobs?post=1" : "/auth?returnTo=%2Ffreelance%2Fjobs%3Fpost%3D1")}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-white/60 text-xs font-medium hover:border-nx-violet/30 hover:text-white transition-colors">
                  Post a Job
                </button>
              </div>
            </div>

            {/* Tools band */}
            <div className="relative overflow-hidden rounded-2xl border border-white/5 p-6 md:p-8 bg-gradient-to-br from-nx-cyan/10 via-transparent to-transparent">
              <div className="flex items-center gap-2 text-nx-cyan text-[11px] font-semibold tracking-widest uppercase mb-2">
                <PenTool className="w-4 h-4" /> Freelancer Tools
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
                Win work, price it & get paid
              </h2>
              <p className="text-sm text-white/40 leading-relaxed">
                Proposal writer, CV builder, writing studio, pricing calculator, invoice generator and task planner — free in your browser.
              </p>
              <button onClick={() => navigate("/freelance/tools")}
                className="mt-5 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-nx-cyan text-black text-xs font-semibold hover:bg-nx-cyan/80 transition-colors">
                Open Freelancer Tools <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Compact tools icons */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {TOOL_TILES.map((tool) => (
              <button key={tool.label} onClick={() => navigate("/freelance/tools")}
                className={`rounded-xl bg-gradient-to-b ${tool.grad} border border-white/5 p-4 text-left hover:border-white/15 transition-colors ${tool.ring} group`}>
                <tool.icon className="w-5 h-5 text-white/70 mb-2" />
                <p className="text-xs font-semibold text-white leading-tight">{tool.label}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── FOOTER ───────── */}
      <footer className="py-6 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
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
