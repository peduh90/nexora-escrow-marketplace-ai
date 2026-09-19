import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { useNavigate, useSearchParams } from "react-router";
import { api } from "../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";

import { Search, ArrowLeft, X, MapPin, Shield, Truck, Heart, ChevronRight, Wrench, ArrowUpRight, ShoppingBag, BedDouble, KeyRound, Laptop } from "lucide-react";
import SupportDock from "@/components/SupportDock";
import { CATEGORIES } from "@/lib/categories";
import { CATEGORY_DEFAULTS, PRODUCT_PLACEHOLDER } from "@/lib/category-images";
import { MARKET_SECTIONS, getSection } from "@/lib/market-sections";

/** Lucide icon per market section (kept static so Tailwind sees full classes). */
const SECTION_ICONS: Record<string, any> = {
  products: ShoppingBag,
  services: Wrench,
  stays: BedDouble,
  rentals: KeyRound,
  freelance: Laptop,
};

/** Per-section accent styling — literal class strings for Tailwind JIT. */
const SECTION_ACCENT: Record<string, { text: string; border: string; glow: string; chip: string }> = {
  products: { text: "text-nx-violet", border: "hover:border-nx-violet/50", glow: "hover:shadow-nx-violet/20", chip: "bg-nx-violet/15 text-nx-violet border-nx-violet/30" },
  services: { text: "text-nx-cyan", border: "hover:border-nx-cyan/50", glow: "hover:shadow-nx-cyan/20", chip: "bg-nx-cyan/15 text-nx-cyan border-nx-cyan/30" },
  stays: { text: "text-nx-emerald", border: "hover:border-nx-emerald/50", glow: "hover:shadow-nx-emerald/20", chip: "bg-nx-emerald/15 text-nx-emerald border-nx-emerald/30" },
  rentals: { text: "text-amber-400", border: "hover:border-amber-400/50", glow: "hover:shadow-amber-400/20", chip: "bg-amber-400/15 text-amber-400 border-amber-400/30" },
  freelance: { text: "text-nx-gold", border: "hover:border-nx-gold/50", glow: "hover:shadow-nx-gold/20", chip: "bg-nx-gold/15 text-nx-gold border-nx-gold/30" },
};

const KENYA_COUNTIES = [
  "Baringo","Bomet","Bungoma","Busia","Elgeyo-Marakwet","Embu","Garissa","Homa Bay","Isiolo","Kajiado",
  "Kakamega","Kericho","Kiambu","Kilifi","Kirinyaga","Kisii","Kisumu","Kitui","Kwale","Laikipia",
  "Lamu","Machakos","Makueni","Mandera","Marsabit","Meru","Migori","Mombasa","Muranga","Nairobi",
  "Nakuru","Nandi","Narok","Nyamira","Nyandarua","Nyeri","Samburu","Siaya","Taita-Taveta","Tana River",
  "Tharaka-Nithi","Trans Nzoia","Turkana","Uasin Gishu","Vihiga","Wajir","West Pokot",
];

export default function Marketplace() {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get("category"),
  );
  const [activeSection, setActiveSection] = useState<string | null>(
    searchParams.get("section"),
  );
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedCounty, setSelectedCounty] = useState("All Counties");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showHero, setShowHero] = useState(
    !searchParams.get("q") && !searchParams.get("category") && !searchParams.get("section"),
  );
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Offering a local service (salon, plumber, boda…) is a provider path, NOT a
  // seller path: signed-out users register through the general flow and land
  // straight in the provider dashboard; signed-in users go there directly.
  const offerServicePath = isAuthenticated
    ? "/services/dashboard?register=1"
    : "/auth?returnTo=%2Fservices%2Fdashboard%3Fregister%3D1";

  const queryArgs = useMemo(() => {
    const args: Record<string, string | number> = { query: searchQuery };
    if (selectedCategory) args.category = selectedCategory;
    // Section browsing (Products / Services / Stays / Rentals) — only when no
    // specific category is chosen, so a leaf category always wins.
    else if (activeSection) args.section = activeSection;
    if (selectedCounty !== "All Counties") args.county = selectedCounty;
    if (minPrice) args.minPrice = Number(minPrice);
    if (maxPrice) args.maxPrice = Number(maxPrice);
    return args;
  }, [searchQuery, selectedCategory, activeSection, selectedCounty, minPrice, maxPrice]);

  const listings = useQuery(api.listings.searchListings, queryArgs as any);
  const results = listings ?? [];

  const activeCat = CATEGORIES.find((c) => c.slug === selectedCategory);
  const activeSectionObj = getSection(activeSection);

  const handleCategoryClick = (slug: string) => {
    setSelectedCategory(slug);
    setSelectedSubcategory(null);
    setShowHero(false);
  };

  const handleSectionClick = (id: string) => {
    setActiveSection(id);
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setShowHero(false);
  };

  const handleBackToSections = () => {
    setActiveSection(null);
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setShowHero(true);
  };

  const handleClearAll = () => {
    setSelectedCategory(null);
    setActiveSection(null);
    setSelectedSubcategory(null);
    setSelectedCounty("All Counties");
    setMinPrice("");
    setMaxPrice("");
    setSearchQuery("");
    setShowHero(true);
  };

  return (
    <div className="min-h-screen bg-nx-bg">
      {/* ═══ HEADER ═══ */}
      <div className="hidden md:flex sticky top-0 z-30 h-14 bg-nx-card/80 backdrop-blur-xl border-b border-nx-border flex items-center px-4 md:px-6 gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-white/40 hover:text-white/70 transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 max-w-xl relative">
          <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setShowHero(false); }}
            placeholder="Search for anything..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/[0.05] border border-white/5 text-sm text-white/70 placeholder:text-white/25 focus:border-nx-violet/30 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <span className="text-[10px] text-white/25 shrink-0">{results.length} ads</span>
      </div>

      {/* ═══ HERO — only when no category selected ═══ */}
      {showHero && !selectedCategory && !searchQuery && (
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-nx-violet/5 via-transparent to-transparent" />
          <div className="max-w-5xl mx-auto px-4 pt-12 pb-10 text-center relative">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">
              Find Anything. <span className="bg-gradient-to-r from-nx-violet to-nx-cyan bg-clip-text text-transparent">Trust Everything.</span>
            </h1>
            <p className="text-sm md:text-base text-white/40 max-w-lg mx-auto mb-8">
              Africa's most intelligent marketplace — every transaction protected by escrow, powered by AI.
            </p>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-nx-emerald/10 border border-nx-emerald/20 text-[11px] text-nx-emerald font-medium">
                <Shield className="w-3 h-3" /> Escrow Protected
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-nx-violet/10 border border-nx-violet/20 text-[11px] text-nx-violet font-medium">
                ✓ Verified Sellers
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-nx-blue/10 border border-nx-blue/20 text-[11px] text-nx-blue font-medium">
                🤖 AI Powered
              </span>
            </div>

            {/* Popular searches */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-[10px] text-white/20">Popular:</span>
              {["iPhone 15", "Toyota Prado", "MacBook", "Apartments", "Fashion"].map((term) => (
                <button key={term} onClick={() => { setSearchQuery(term); setShowHero(false); }}
                  className="px-3 py-1 rounded-full text-[10px] text-white/40 bg-white/[0.03] border border-white/5 hover:text-white/60 hover:border-white/10 transition-colors">
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ FREELANCE BANNER — always visible at the top of the marketplace ═══ */}
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 pt-4">
        <button
          onClick={() => navigate("/freelance")}
          className="group relative w-full overflow-hidden rounded-2xl border border-nx-violet/25 bg-gradient-to-r from-nx-violet/20 via-nx-violet/8 to-nx-cyan/10 p-4 md:p-5 text-left transition-all hover:border-nx-violet/50 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-nx-violet/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-nx-violet/20 border border-nx-violet/30 flex items-center justify-center shrink-0">
              <Wrench className="w-6 h-6 text-nx-violet" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm md:text-base font-bold text-white">Freelance Services & Digital Tools</h3>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-nx-violet/15 text-nx-violet font-bold uppercase tracking-wider">Nexora Freelance</span>
              </div>
              <p className="text-[11px] md:text-xs text-white/45 mt-0.5 leading-relaxed">
                AI accounts & tools, writing, design, development, marketing, bots — escrow protected until delivery.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-nx-violet text-white text-xs font-semibold shrink-0 group-hover:bg-nx-violet/85 transition-colors">
              Open <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
            <ChevronRight className="w-5 h-5 text-nx-violet sm:hidden shrink-0" />
          </div>
        </button>
      </div>

      {/* ═══ LOCAL SERVICES BANNER — providers register here, NOT as sellers ═══ */}
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 pt-3">
        <button
          onClick={() => navigate(offerServicePath)}
          className="group relative w-full overflow-hidden rounded-2xl border border-nx-cyan/25 bg-gradient-to-r from-nx-cyan/15 via-nx-cyan/6 to-amber-400/10 p-4 md:p-5 text-left transition-all hover:border-nx-cyan/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.12)]"
        >
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-nx-cyan/15 border border-nx-cyan/30 flex items-center justify-center shrink-0">
              <Wrench className="w-6 h-6 text-nx-cyan" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm md:text-base font-bold text-white">Offer a Local Service — Salon, Plumber, Boda, Fundi</h3>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-nx-cyan/15 text-nx-cyan font-bold uppercase tracking-wider">No KYC</span>
              </div>
              <p className="text-[11px] md:text-xs text-white/45 mt-0.5 leading-relaxed">
                Register as a service provider in 2 minutes — set your prices, go "Available Now", get paid to your wallet.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-nx-cyan text-black text-xs font-semibold shrink-0 group-hover:bg-nx-cyan/85 transition-colors">
              Register as Provider <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
            <ChevronRight className="w-5 h-5 text-nx-cyan sm:hidden shrink-0" />
          </div>
        </button>
        <div className="flex items-center justify-center gap-2 mt-2 text-[11px] text-white/30">
          <span>Looking for a provider instead?</span>
          <button onClick={() => navigate("/services")} className="text-nx-cyan hover:text-white font-medium transition-colors">Find Services Near You →</button>
        </div>
      </div>

      <div className="flex max-w-[1600px] mx-auto">
        {/* ═══ SIDEBAR ═══ */}
        <aside className="hidden md:block w-56 lg:w-60 shrink-0 border-r border-nx-border/50 bg-nx-card/20 min-h-[calc(100vh-56px)] sticky top-14 overflow-y-auto">
          <div className="p-4 space-y-5">
            {/* Category — grouped by market section */}
            <div>
              <h4 className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">Category</h4>
              <div className="space-y-0.5 max-h-[60vh] overflow-y-auto pr-1">
                <button onClick={handleClearAll}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all ${!selectedCategory && !activeSection ? "bg-nx-violet/15 text-nx-violet border border-nx-violet/20" : "text-white/50 hover:bg-white/[0.03] hover:text-white/70"}`}>
                  <div className="w-5 h-5 rounded bg-gradient-to-br from-nx-violet/20 to-nx-cyan/20 flex items-center justify-center text-[9px]">🏪</div>
                  <span className="text-[10px] font-medium">All Categories</span>
                </button>
                {MARKET_SECTIONS.map((section) => (
                  <div key={section.id}>
                    <button onClick={() => handleSectionClick(section.id)}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all ${activeSection === section.id && !selectedCategory ? "bg-nx-violet/15 text-nx-violet border border-nx-violet/20" : "text-white/60 hover:bg-white/[0.03] hover:text-white/80"}`}>
                      <span className="text-[10px] font-bold uppercase tracking-wide">{section.name}</span>
                    </button>
                    {section.categories.map((cat) => (
                      <button key={cat.slug} onClick={() => handleCategoryClick(cat.slug)}
                        className={`w-full flex items-center gap-2 pl-5 pr-2.5 py-1.5 rounded-lg text-left transition-all ${selectedCategory === cat.slug ? "bg-nx-violet/15 text-nx-violet border border-nx-violet/20" : "text-white/50 hover:bg-white/[0.03] hover:text-white/70"}`}>
                        <div className="w-5 h-5 rounded overflow-hidden shrink-0"><img src={CATEGORY_DEFAULTS[cat.slug]} alt="" className="w-full h-full object-cover" loading="lazy" /></div>
                        <span className="text-[10px] font-medium truncate">{cat.name}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Location */}
            <div>
              <h4 className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">Location</h4>
              <select value={selectedCounty} onChange={(e) => setSelectedCounty(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg bg-white/[0.03] border border-white/5 text-[10px] text-white/50 appearance-none focus:outline-none">
                <option value="All Counties">All Counties</option>
                {KENYA_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Price */}
            <div>
              <h4 className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">Price Range (KES)</h4>
              <div className="flex items-center gap-1.5">
                <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Min" min="0"
                  className="flex-1 px-2 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-[10px] text-white/60 placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
                <span className="text-white/15 text-[10px]">—</span>
                <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Max" min="0"
                  className="flex-1 px-2 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-[10px] text-white/60 placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {[{ l: "<5K", mn: "", mx: "5000" }, { l: "5K-20K", mn: "5000", mx: "20000" }, { l: "20K-100K", mn: "20000", mx: "100000" }, { l: "100K+", mn: "100000", mx: "" }].map((p) => (
                  <button key={p.l} onClick={() => { setMinPrice(p.mn); setMaxPrice(p.mx); }}
                    className="px-2 py-0.5 rounded text-[8px] text-white/30 bg-white/[0.02] border border-white/5 hover:text-white/50 transition-colors">{p.l}</button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* ═══ MAIN ═══ */}
        <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8">
          {/* Section browse bar (drill-down) — back + section name */}
          {activeSection && !selectedCategory && (
            <div className="mb-4">
              <button onClick={handleBackToSections} className="flex items-center gap-1 text-[11px] text-white/35 hover:text-white/70 mb-2 transition-colors">
                <ArrowLeft className="w-3 h-3" /> All market sections
              </button>
              <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                {(() => { const Icon = SECTION_ICONS[activeSection]; return Icon ? <Icon className={`w-4 h-4 ${SECTION_ACCENT[activeSection]?.text ?? "text-nx-violet"}`} /> : null; })()}
                {activeSectionObj?.name}
                <span className="text-[10px] font-normal text-white/30">{activeSectionObj?.tagline}</span>
              </h2>
              {activeSectionObj?.helperPath && (
                <button onClick={() => navigate(activeSectionObj.helperPath!)} className="text-[10px] text-nx-cyan hover:text-white/80 mt-1 transition-colors">
                  {activeSectionObj.helperLabel}
                </button>
              )}
            </div>
          )}

          {/* Drill-down category cards — ~25–30% smaller than the old grid:
              ~6 per row on desktop, 2 per row on mobile */}
          {activeSection && !selectedCategory && !searchQuery && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-2.5 mb-8">
              {(activeSectionObj?.categories ?? []).map((cat) => (
                <button key={cat.slug} onClick={() => handleCategoryClick(cat.slug)}
                  className="group relative rounded-lg overflow-hidden aspect-[4/3] hover:shadow-lg hover:shadow-nx-violet/10 transition-all duration-300 hover:-translate-y-0.5">
                  <img src={CATEGORY_DEFAULTS[cat.slug]} alt={cat.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-1.5 md:p-2">
                    <h3 className="text-[10px] md:text-[11px] font-bold text-white leading-tight drop-shadow">{cat.name}</h3>
                    <span className="text-[8px] md:text-[9px] text-white/45 group-hover:text-white/70 transition-colors flex items-center gap-0.5 mt-0.5">
                      Explore <ChevronRight className="w-2.5 h-2.5" />
                    </span>
                    <p className="hidden md:block text-[8px] text-white/30 truncate mt-0.5">{cat.subcategories.slice(0, 3).map((s) => s.name).join(" · ")}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Subcategory chips (leaf category selected) */}
          {activeCat && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              <button onClick={() => setSelectedSubcategory(null)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${!selectedSubcategory ? "bg-nx-violet text-white" : "bg-white/[0.04] text-white/40 border border-white/5"}`}>
                All {activeCat.name}
              </button>
              {activeCat.subcategories.map((sub) => (
                <button key={sub.slug} onClick={() => setSelectedSubcategory(selectedSubcategory === sub.name ? null : sub.name)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${selectedSubcategory === sub.name ? "bg-nx-violet text-white" : "bg-white/[0.04] text-white/40 border border-white/5"}`}>
                  {sub.name}
                </button>
              ))}
            </div>
          )}

          {/* MARKET SECTIONS — the top-level hierarchy. 5 cards per row desktop,
              2 per row mobile; ~28% smaller than the old category cards. */}
          {!activeSection && !selectedCategory && !searchQuery && (
            <div className="mb-8">
              <div className="mb-3">
                <h2 className="text-base md:text-lg font-bold text-white">Browse by section</h2>
                <p className="text-[11px] text-white/30">Five markets, one escrow-protected experience</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-2.5">
                {MARKET_SECTIONS.map((section) => {
                  const Icon = SECTION_ICONS[section.id];
                  const accent = SECTION_ACCENT[section.id];
                  return (
                    <button key={section.id} onClick={() => handleSectionClick(section.id)}
                      className={`group relative rounded-xl overflow-hidden aspect-[4/5] hover:shadow-lg ${accent.border} ${accent.glow} transition-all duration-300 hover:-translate-y-0.5`}>
                      <img src={section.image} alt={section.name}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
                      <div className="absolute top-2 left-2 p-1.5 rounded-lg bg-black/45 backdrop-blur-sm border border-white/10">
                        <Icon className={`w-3.5 h-3.5 ${accent.text}`} />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2 md:p-2.5">
                        <h3 className="text-xs md:text-sm font-bold text-white leading-tight drop-shadow">{section.name}</h3>
                        <p className="text-[9px] md:text-[10px] text-white/45 group-hover:text-white/70 transition-colors">{section.tagline}</p>
                        <span className="text-[8px] md:text-[9px] text-white/35 flex items-center gap-0.5 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          Explore <ChevronRight className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick access — all categories, grouped by section (compact pills) */}
          {!activeSection && !selectedCategory && !searchQuery && (
            <div className="space-y-3 mb-8">
              {MARKET_SECTIONS.filter((s) => s.categories.length > 0).map((section) => (
                <div key={section.id} className="flex items-center gap-2 flex-wrap">
                  {(() => { const Icon = SECTION_ICONS[section.id]; return <Icon className={`w-3 h-3 ${SECTION_ACCENT[section.id]?.text} shrink-0`} />; })()}
                  <span className="text-[10px] font-bold uppercase tracking-wide text-white/40 shrink-0 w-28">{section.name}</span>
                  <div className="flex flex-wrap gap-1">
                    {section.categories.slice(0, 8).map((cat) => (
                      <button key={cat.slug} onClick={() => handleCategoryClick(cat.slug)}
                        className="px-2 py-0.5 rounded-full text-[9px] text-white/45 bg-white/[0.03] border border-white/5 hover:text-white/80 hover:border-white/15 transition-colors">
                        {cat.name}
                      </button>
                    ))}
                    {section.categories.length > 8 && (
                      <button onClick={() => handleSectionClick(section.id)} className="px-2 py-0.5 rounded-full text-[9px] text-nx-violet hover:text-white transition-colors">
                        +{section.categories.length - 8} more
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Products */}
          {results.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-bold text-white/70">
                  {activeCat ? `${activeCat.name} ${activeSectionObj ? `· ${activeSectionObj.name}` : ""}` : activeSectionObj ? activeSectionObj.name : "All Products"}
                </h2>
                <span className="text-[10px] text-white/25 bg-white/[0.03] px-2 py-0.5 rounded-full">{results.length}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 md:gap-3">
                {results.map((listing: any) => (
                  <div key={listing._id} onClick={() => navigate(`/product/${listing._id}`)}
                    className="group rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden hover:border-white/10 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-nx-violet/5 hover:-translate-y-0.5">
                    <div className="aspect-[4/3] bg-white/[0.03] overflow-hidden relative">
                      {listing.images?.length > 0 ? (
                        <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <img src={PRODUCT_PLACEHOLDER[listing.category] || PRODUCT_PLACEHOLDER["mobile-phones"]} alt="" className="w-full h-full object-cover opacity-40" />
                      )}
                      <button onClick={(e) => e.stopPropagation()} className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/40 backdrop-blur-sm text-white/50 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"><Heart className="w-3 h-3" /></button>
                      {listing.condition && <span className="absolute top-2 left-2 text-[8px] px-1.5 py-0.5 rounded bg-black/50 backdrop-blur-sm text-white/70">{listing.condition}</span>}
                    </div>
                    <div className="p-2.5">
                      <h3 className="text-[11px] text-white/70 font-medium truncate group-hover:text-white transition-colors">{listing.title}</h3>
                      <p className="text-xs font-bold text-white mt-0.5">KSh {(listing.price || 0).toLocaleString()}</p>
                      <div className="flex items-center gap-1 mt-1.5">
                        {listing.originCounty && <span className="text-[8px] text-white/10 flex items-center gap-0.5"><MapPin className="w-2 h-2" />{listing.originTown || ""} {listing.originCounty}</span>}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {listing.escrowProtection && <span className="flex items-center gap-0.5 text-[8px] text-nx-emerald bg-nx-emerald/10 px-1 py-0.5 rounded"><Shield className="w-1.5 h-1.5" />Escrow</span>}
                        {listing.transportAvailable && <span className="flex items-center gap-0.5 text-[8px] text-nx-blue bg-nx-blue/10 px-1 py-0.5 rounded"><Truck className="w-1.5 h-1.5" />Delivery</span>}
                        {listing.sellerVerified && <span className="text-[8px] text-nx-emerald bg-nx-emerald/10 px-1 py-0.5 rounded">✓</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty */}
          {results.length === 0 && (selectedCategory || activeSection || searchQuery) && (
            <div className="text-center py-16">
              <h3 className="text-base font-semibold text-white mb-1">No products found</h3>
              <p className="text-[11px] text-white/30 mb-4">Try adjusting your filters or browse other categories.</p>
              <button onClick={handleClearAll} className="px-5 py-2 rounded-xl bg-nx-violet text-white text-xs font-medium hover:bg-nx-violet/80 transition-colors">Clear Filters</button>
            </div>
          )}
        </main>
      </div>
      {/* Help icons on every surface: WhatsApp + NexoraAI */}
      <SupportDock panel="market" message="Hello Nexora Support 👋 I need help with the marketplace." />
    </div>
  );
}
