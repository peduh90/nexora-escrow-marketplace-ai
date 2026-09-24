import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import {
  FREELANCE_CATEGORIES,
  FREELANCE_CATEGORY_GRADIENTS,
  AI_TOOL_TILES,
  AI_TOOL_ICONS,
  getFreelanceCategory,
  getFreelanceCategoryIcon,
  normalizeFreelanceCategory,
  freelanceCategoryName,
} from "@/lib/freelance-marketplace";
import { shortKES } from "@/lib/fees";
import FreelanceNav from "./FreelanceNav";
import {
  Search, ArrowRight, Shield, Zap, Star, Briefcase, Users, Wrench,
  Sparkles, Bot, BadgeCheck, Code2, PenLine,
} from "lucide-react";

const TOOL_TILES = [
  { icon: PenLine, label: "Proposal Writer", grad: "from-nx-violet/20 to-transparent" },
  { icon: Code2, label: "Pricing Calculator", grad: "from-nx-cyan/20 to-transparent" },
  { icon: Bot, label: "AI Writing Studio", grad: "from-emerald-500/20 to-transparent" },
  { icon: Wrench, label: "Invoice Generator", grad: "from-amber-500/20 to-transparent" },
];

export default function FreelanceLanding() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [subcategory, setSubcategory] = useState<string>("all");

  const role = user?.role as string | undefined;
  const services = useQuery(api.listings.searchFreelanceListings, {
    query: search.trim(),
    category: category === "all" ? undefined : category,
    subcategory: subcategory === "all" ? undefined : subcategory,
    limit: 60,
  });

  const display = services ?? [];
  const activeCategory = category !== "all" ? getFreelanceCategory(category) : null;

  // Digital Services Marketplace showcase (horizontal rail above the category
  // grid). Newest freelance listings first; academic-shortcut, shared-login
  // and account-resale categories are never surfaced here — only legitimate
  // freelance work (writing, design, video, AI/business setup, etc.).
  const showcase = display
    .filter((s: any) => normalizeFreelanceCategory(s.category) !== "ai-accounts-tools")
    .slice(0, 10);

  // Freelancers and sellers can publish services. Freelancers use the
  // standalone freelance publish flow (no store required); sellers use their
  // store's publish wizard.
  const canPublish = isAuthenticated && (role === "freelancer" || role === "seller");

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

  /** Join flow — a fresh visitor chooses Freelancer, Employer or Provider. */
  const joinFreelance = (returnTo = "/freelance") => {
    navigate(`/freelance/join?returnTo=${encodeURIComponent(returnTo)}`);
  };

  const publishCta = () => {
    if (canPublish) {
      navigate(role === "seller" ? "/seller/add-product" : "/freelance/publish");
    } else if (isAuthenticated) {
      // Signed in as buyer/employer/admin — publishing needs a freelancer or
      // provider account, so route through the freelance join flow.
      joinFreelance("/freelance/publish");
    } else {
      joinFreelance("/freelance/publish");
    }
  };

  /** The four big homepage actions. */
  const goGetStarted = () => {
    if (role === "freelancer") navigate("/freelance/dashboard");
    else if (role === "employer") navigate("/employer");
    else if (role === "seller") navigate("/seller");
    else if (isAuthenticated) joinFreelance("/freelance");
    else joinFreelance("/freelance");
  };

  const goFindWork = () => {
    if (role === "freelancer") navigate("/freelance/find-work");
    else navigate("/freelance/jobs");
  };

  const goHire = () => {
    // Hiring starts with browsing the people, not a form — take the employer
    // straight to the freelancer directory with profiles and specialties.
    navigate("/freelance/find-freelancers");
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <FreelanceNav active="services" showBack={false} />

      {/* ───────── HERO ───────── */}
      <section className="px-4 md:px-6 pt-12 pb-8 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-nx-violet/8 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-nx-violet/10 border border-nx-violet/20 text-nx-violet text-[11px] font-semibold mb-4">
            <BadgeCheck className="w-3.5 h-3.5" /> NEXORA FREELANCE · KENYA'S DIGITAL-WORK MARKETPLACE
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-tight">
            Work. Hire. Create.{" "}
            <span className="bg-gradient-to-r from-nx-violet via-nx-cyan to-nx-violet bg-clip-text text-transparent">
              Grow.
            </span>
          </h1>
          <p className="text-sm md:text-base text-white/45 max-w-2xl mx-auto mt-4 leading-relaxed">
            One trusted marketplace connecting Kenyan freelancers, creators and digital
            professionals with employers and customers — escrow-protected payments,
            AI-assisted disputes and M-Pesa withdrawals.
          </p>

          <div className="w-full max-w-2xl mx-auto mt-7">
            <div className="flex items-center rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden hover:border-white/20 transition-colors">
              <div className="pl-4"><Search className="w-5 h-5 text-white/30" /></div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && scrollToListings()}
                placeholder="Search writers, designers, developers, video editors, AI setup..."
                className="flex-1 px-4 py-3.5 bg-transparent text-sm text-white placeholder:text-white/25 focus:outline-none"
              />
              {search && (
                <button onClick={() => setSearch("")} className="pr-3 text-white/25 hover:text-white/60 text-xs">Clear</button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-5 mt-6 text-xs text-white/35">
            <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-nx-emerald/80" /> Escrow protected</span>
            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-nx-gold/80" /> AI-assisted disputes</span>
            <span className="flex items-center gap-1.5"><BadgeCheck className="w-3.5 h-3.5 text-nx-cyan/80" /> Verified freelancers</span>
          </div>
        </div>
      </section>

      {/* ───────── BIG ACTIONS — the primary navigation ───────── */}
      <section className="px-4 md:px-6 pb-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Get Started Free — the main onboarding CTA */}
          <button
            onClick={goGetStarted}
            className="group relative overflow-hidden rounded-2xl border border-nx-violet/40 bg-gradient-to-br from-nx-violet/25 via-nx-violet/10 to-transparent p-6 text-left hover:border-nx-violet/70 hover:-translate-y-1 transition-all duration-300 sm:col-span-2 lg:col-span-1"
          >
            <Sparkles className="w-9 h-9 text-nx-violet mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-bold text-white leading-tight">GET STARTED FREE</h3>
            <p className="text-xs text-white/50 mt-1.5 leading-relaxed">
              Create your account — Freelancer, Employer or Digital Provider.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-nx-violet">
              Join Nexora <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>

          {/* Find Work */}
          <button
            onClick={goFindWork}
            className="group rounded-2xl border border-white/8 bg-white/[0.03] p-6 text-left hover:border-nx-emerald/40 hover:bg-nx-emerald/[0.06] hover:-translate-y-1 transition-all duration-300"
          >
            <Briefcase className="w-9 h-9 text-nx-emerald mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-bold text-white leading-tight">FIND WORK</h3>
            <p className="text-xs text-white/50 mt-1.5 leading-relaxed">
              Browse jobs & apply — get paid in escrow, withdraw to M-Pesa.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-nx-emerald">
              Browse jobs <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>

          {/* Hire a Freelancer */}
          <button
            onClick={goHire}
            className="group rounded-2xl border border-white/8 bg-white/[0.03] p-6 text-left hover:border-nx-gold/40 hover:bg-nx-gold/[0.06] hover:-translate-y-1 transition-all duration-300"
          >
            <Users className="w-9 h-9 text-nx-gold mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-bold text-white leading-tight">HIRE A FREELANCER</h3>
            <p className="text-xs text-white/50 mt-1.5 leading-relaxed">
              Browse verified writers, designers & developers — open a profile, hire in escrow.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-nx-gold">
              Meet the freelancers <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>

          {/* Find Digital Services */}
          <button
            onClick={scrollToListings}
            className="group rounded-2xl border border-white/8 bg-white/[0.03] p-6 text-left hover:border-nx-cyan/40 hover:bg-nx-cyan/[0.06] hover:-translate-y-1 transition-all duration-300"
          >
            <Wrench className="w-9 h-9 text-nx-cyan mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-bold text-white leading-tight">FIND DIGITAL SERVICES</h3>
            <p className="text-xs text-white/50 mt-1.5 leading-relaxed">
              Ready-made services with clear prices — buy with escrow protection.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-nx-cyan">
              See services <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </div>
      </section>

      {/* ───────── DIGITAL SERVICES MARKETPLACE (horizontal rail) ───────── */}
      <section className="px-4 md:px-6 py-10 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
            <div>
              <h2 className="text-xl md:text-3xl font-bold text-white tracking-tight">
                Digital services <span className="bg-gradient-to-r from-nx-violet to-nx-cyan bg-clip-text text-transparent">marketplace</span>
              </h2>
              <p className="text-xs md:text-sm text-white/35 mt-1.5 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-nx-emerald animate-pulse" />
                {showcase.length} service{showcase.length === 1 ? "" : "s"} · only listings published to Nexora Freelance appear here
              </p>
            </div>
            <button
              onClick={() => navigate("/freelance/services")}
              className="text-xs text-white/40 hover:text-nx-violet transition-colors flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {showcase.length === 0 ? (
            <div className="rounded-2xl bg-white/[0.02] border border-white/5 px-6 py-10 text-center">
              <p className="text-sm text-white/50 font-medium">No services published yet</p>
              <p className="text-xs text-white/25 mt-1.5">When a freelancer publishes a service, it appears here instantly.</p>
              <button
                onClick={publishCta}
                className="mt-4 px-5 py-2.5 rounded-xl bg-nx-violet text-white text-sm font-semibold hover:bg-nx-violet/85 transition-colors"
              >
                {canPublish ? "Publish the first service" : "Sell Digital Products"}
              </button>
            </div>
          ) : (
            <div className="-mx-4 md:-mx-6 px-4 md:px-6 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin">
              <div className="flex gap-4 w-max">
                {showcase.map((svc: any) => {
                  const catSlug = normalizeFreelanceCategory(svc.category);
                  const CatIcon = getFreelanceCategoryIcon(catSlug);
                  const catName = freelanceCategoryName(svc.category);
                  return (
                    <button
                      key={svc._id}
                      onClick={() => navigate(`/freelance/service/${svc._id}`)}
                      className="snap-start shrink-0 w-[260px] sm:w-[280px] text-left rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden hover:border-nx-violet/40 hover:bg-white/[0.04] hover:shadow-lg hover:shadow-nx-violet/10 hover:-translate-y-1 transition-all duration-300 group flex flex-col"
                    >
                      <div className={`aspect-[16/10] bg-gradient-to-br ${FREELANCE_CATEGORY_GRADIENTS[catSlug] || FREELANCE_CATEGORY_GRADIENTS["other-services"]} overflow-hidden relative flex items-center justify-center`}>
                        {svc.images?.[0] ? (
                          <img src={svc.images[0]} alt={svc.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <CatIcon className="w-12 h-12 text-white/30" />
                        )}
                        <span className="absolute top-2 left-2 text-[9px] font-medium px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white/90">
                          {catName}
                        </span>
                        <span className="absolute top-2 right-2 flex items-center gap-1 text-[9px] font-medium px-2 py-1 rounded-full bg-nx-emerald/15 backdrop-blur-sm border border-nx-emerald/25 text-nx-emerald">
                          <Shield className="w-2.5 h-2.5" /> Escrow
                        </span>
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <h3 className="text-sm font-bold text-white leading-snug group-hover:text-nx-violet transition-colors line-clamp-2">
                          {svc.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-3">
                          <div className="w-5 h-5 rounded-full bg-nx-violet/15 flex items-center justify-center text-nx-violet text-[9px] font-bold shrink-0">
                            {(svc.sellerName || "S").charAt(0)}
                          </div>
                          <span className="text-[10px] text-white/40 truncate">{svc.sellerName}</span>
                          {svc.sellerReputation > 0 && (
                            <span className="flex items-center gap-0.5 text-[10px] text-amber-400 ml-auto shrink-0">
                              <Star className="w-2.5 h-2.5 fill-amber-400" /> {svc.sellerReputation.toFixed(1)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-baseline justify-end gap-1 mt-3 pt-3 border-t border-white/5">
                          <span className="text-[10px] text-white/30">from</span>
                          <span className="text-sm font-bold text-white">KES {Number(svc.price).toLocaleString()}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ───────── SERVICE CATEGORIES ───────── */}
      <section className="px-4 md:px-6 py-10 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-xl md:text-3xl font-bold text-white">
              What do you need{" "}
              <span className="bg-gradient-to-r from-nx-violet to-nx-cyan bg-clip-text text-transparent">done today?</span>
            </h2>
            <p className="text-xs md:text-sm text-white/35 mt-2 max-w-xl mx-auto">
              Tap a category to see real services offered by verified providers —
              from writing and design to AI setup and business support.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {FREELANCE_CATEGORIES.map((cat) => {
              const Icon = getFreelanceCategoryIcon(cat.slug);
              const active = category === cat.slug;
              return (
                <button
                  key={cat.slug}
                  onClick={() => pickCategory(cat.slug)}
                  className={`relative overflow-hidden rounded-2xl border p-4 md:p-5 text-left transition-all duration-300 bg-gradient-to-b ${FREELANCE_CATEGORY_GRADIENTS[cat.slug] || ""} ${
                    active
                      ? "border-nx-violet/50 ring-1 ring-nx-violet/30 bg-white/[0.04]"
                      : "border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04] hover:-translate-y-0.5"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-white/80" />
                    </span>
                    {active && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-white bg-nx-violet/30 px-2 py-0.5 rounded-full">
                        Viewing
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-white leading-snug">{cat.name}</h3>
                  <p className="text-[11px] text-white/40 leading-relaxed mt-1 line-clamp-2">{cat.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────── AI & DIGITAL TOOLS ───────── */}
      <section className="px-4 md:px-6 py-10 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-3xl border border-nx-violet/20 bg-gradient-to-br from-nx-violet/[0.10] via-transparent to-nx-cyan/[0.06] p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 text-nx-violet text-[11px] font-semibold tracking-widest uppercase mb-2">
                  <Bot className="w-4 h-4" /> AI & Digital Tools
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white">
                  Authorized tools Kenyans already use
                </h2>
                <p className="text-sm text-white/45 mt-1.5 max-w-xl leading-relaxed">
                  Buy legitimate AI &amp; productivity subscriptions and expert setup help —
                  ChatGPT, Claude, Canva, Grammarly, Microsoft 365 and more. Only authorized
                  accounts and official licenses are sold here.
                </p>
              </div>
              <button
                onClick={() => pickCategory("ai-accounts-tools")}
                className="shrink-0 px-4 py-2.5 rounded-xl bg-nx-violet text-white text-xs font-semibold hover:bg-nx-violet/85 transition-colors"
              >
                Explore AI &amp; Tools
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2.5">
              {AI_TOOL_TILES.map((tool) => {
                const Icon = AI_TOOL_ICONS[tool.icon] ?? Bot;
                return (
                  <button
                    key={tool.name}
                    onClick={() => pickCategory("ai-accounts-tools")}
                    className="rounded-xl bg-white/[0.04] border border-white/8 p-3 text-center hover:border-nx-violet/40 hover:bg-nx-violet/[0.08] transition-all group"
                  >
                    <Icon className="w-5 h-5 text-white/70 mx-auto mb-1.5 group-hover:text-nx-violet transition-colors" />
                    <p className="text-[10px] font-medium text-white/60 leading-tight">{tool.name}</p>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-white/25 mt-4 leading-relaxed">
              Tool names are examples of supported software — Nexora is not affiliated with
              these brands. Stolen accounts, cracked software, shared credentials and
              unauthorized reselling are banned and removed on sight.
            </p>
          </div>
        </div>
      </section>

      {/* ───────── SERVICES GRID (freelance only) ───────── */}
      <section id="freelance-listings" className="px-4 md:px-6 py-8 border-t border-white/5 scroll-mt-14">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg md:text-2xl font-bold text-white">
                {category === "all" ? "Digital services marketplace" : activeCategory?.name}
                {search.trim() && <span className="text-white/40"> · "{search.trim()}"</span>}
              </h2>
              <p className="text-xs text-white/30 mt-1">
                {display.length} service{display.length === 1 ? "" : "s"} · only listings published to Nexora Freelance appear here
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
                {activeCategory
                  ? (() => { const I = getFreelanceCategoryIcon(activeCategory.slug); return <I className="w-8 h-8 text-white/40" />; })()
                  : <Search className="w-8 h-8 text-white/15" />}
              </div>
              <p className="text-sm text-white/50 font-medium">
                {activeCategory ? `No ${activeCategory.name.toLowerCase()} offered yet` : "No freelance services found"}
              </p>
              <p className="text-xs text-white/25 mt-1.5 max-w-sm mx-auto">
                {search.trim() || category !== "all"
                  ? "Try a different keyword or category."
                  : "When a freelancer publishes a service, it appears here instantly."}
              </p>
              <button
                onClick={publishCta}
                className="mt-5 px-5 py-2.5 rounded-xl bg-nx-violet text-white text-sm font-semibold hover:bg-nx-violet/85 transition-colors"
              >
                {canPublish ? "Offer the first service" : "Sell Digital Products"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {display.map((svc: any) => {
                const catSlug = normalizeFreelanceCategory(svc.category);
                const CatIcon = getFreelanceCategoryIcon(catSlug);
                const catName = freelanceCategoryName(svc.category);
                return (
                  <button
                    key={svc._id}
                    onClick={() => navigate(`/freelance/service/${svc._id}`)}
                    className="text-left rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden hover:border-nx-violet/25 hover:bg-white/[0.035] hover:-translate-y-0.5 transition-all group flex flex-col"
                  >
                    <div className={`aspect-[16/10] bg-gradient-to-br ${FREELANCE_CATEGORY_GRADIENTS[catSlug] || FREELANCE_CATEGORY_GRADIENTS["other-services"]} overflow-hidden relative flex items-center justify-center`}>
                      {svc.images?.[0] ? (
                        <img src={svc.images[0]} alt={svc.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <CatIcon className="w-14 h-14 text-white/30" />
                      )}
                      <span className="absolute top-2 left-2 flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white/90">
                        <CatIcon className="w-3 h-3" /> {catName}
                      </span>
                      <span className="absolute top-2 right-2 flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-nx-emerald/15 backdrop-blur-sm border border-nx-emerald/25 text-nx-emerald">
                        <Shield className="w-2.5 h-2.5" /> Escrow
                      </span>
                    </div>
                    <div className="p-4 flex flex-col flex-1">
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
                        <span className="text-base font-bold text-white">{shortKES(svc.price)}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ───────── JOBS + PROVIDER CTA ───────── */}
      <section className="px-4 md:px-6 py-10 border-t border-white/5">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Jobs band */}
            <div className="relative overflow-hidden rounded-2xl border border-white/5 p-6 md:p-8 bg-gradient-to-br from-nx-violet/10 via-transparent to-transparent">
              <div className="flex items-center gap-2 text-nx-violet text-[11px] font-semibold tracking-widest uppercase mb-2">
                <Briefcase className="w-4 h-4" /> Jobs Board
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
                Post a job — or apply to one
              </h2>
              <p className="text-sm text-white/40 leading-relaxed">
                Employers post projects with a budget. Freelancers apply in minutes.
                Accept a proposal and the funds are held in escrow until delivery.
              </p>
              <div className="flex flex-wrap gap-3 mt-5">
                <button onClick={() => navigate("/freelance/jobs")}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-nx-violet text-white text-xs font-semibold hover:bg-nx-violet/85 transition-colors">
                  Browse Jobs <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button onClick={goHire}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-white/60 text-xs font-medium hover:border-nx-violet/30 hover:text-white transition-colors">
                  Post a Job
                </button>
              </div>
            </div>

            {/* Become a provider band */}
            <div className="relative overflow-hidden rounded-2xl border border-white/5 p-6 md:p-8 bg-gradient-to-br from-nx-cyan/10 via-transparent to-transparent">
              <div className="flex items-center gap-2 text-nx-cyan text-[11px] font-semibold tracking-widest uppercase mb-2">
                <Sparkles className="w-4 h-4" /> Sell Digital Products
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
                Sell your skills on Nexora
              </h2>
              <p className="text-sm text-white/40 leading-relaxed">
                Writers, designers, developers, video editors, tutors and AI-setup experts:
                publish services or digital products, set your prices, and get paid through escrow on delivery.
              </p>
              <div className="flex flex-wrap gap-3 mt-5">
                <button onClick={() => (canPublish ? navigate("/freelance/publish") : joinFreelance("/freelance/publish"))}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-nx-cyan text-black text-xs font-semibold hover:bg-nx-cyan/85 transition-colors">
                  {canPublish ? "Publish a Service" : "Start Selling"} <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => navigate("/freelance/tools")}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-white/60 text-xs font-medium hover:border-nx-cyan/30 hover:text-white transition-colors">
                  Freelancer Tools
                </button>
              </div>
            </div>
          </div>

          {/* Freelancer tools strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TOOL_TILES.map((tool) => (
              <button key={tool.label} onClick={() => navigate("/freelance/tools")}
                className={`rounded-xl bg-gradient-to-b ${tool.grad} border border-white/5 p-4 text-left hover:border-white/15 transition-colors group`}>
                <tool.icon className="w-5 h-5 text-white/70 mb-2 group-hover:text-white transition-colors" />
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
            <button onClick={() => navigate("/services")} className="hover:text-white/50 transition-colors">Local Services</button>
            <button onClick={() => navigate("/privacy")} className="hover:text-white/50 transition-colors">Privacy</button>
            <button onClick={() => navigate("/terms")} className="hover:text-white/50 transition-colors">Terms</button>
          </div>
          <p className="text-[10px] text-white/15">© 2026 Nexora Market. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
