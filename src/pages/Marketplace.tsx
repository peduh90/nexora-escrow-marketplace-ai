import { useState, useEffect, useMemo } from "react";
import { useQuery } from "convex/react";
import { useNavigate, useSearchParams } from "react-router";
import { api } from "../convex/_generated/api";
import {
  Search, ArrowLeft, X, ChevronRight, ChevronDown,
  MapPin, Shield, Truck, Heart, Eye, Check,
} from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import { CATEGORY_DEFAULTS, PRODUCT_PLACEHOLDER } from "@/lib/category-images";

const KENYA_COUNTIES = [
  "Baringo","Bomet","Bungoma","Busia","Elgeyo-Marakwet","Embu","Garissa","Homa Bay","Isiolo","Kajiado",
  "Kakamega","Kericho","Kiambu","Kilifi","Kirinyaga","Kisii","Kisumu","Kitui","Kwale","Laikipia",
  "Lamu","Machakos","Makueni","Mandera","Marsabit","Meru","Migori","Mombasa","Muranga","Nairobi",
  "Nakuru","Nandi","Narok","Nyamira","Nyandarua","Nyeri","Samburu","Siaya","Taita-Taveta","Tana River",
  "Tharaka-Nithi","Trans Nzoia","Turkana","Uasin Gishu","Vihiga","Wajir","West Pokot",
];

const CONDITIONS = ["Brand New", "Used - Like New", "Used - Good", "Used - Fair", "Refurbished"];

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedCounty, setSelectedCounty] = useState("All Counties");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [conditionFilter, setConditionFilter] = useState<string | null>(null);
  const [countySearch, setCountySearch] = useState("");
  const [showCountyDropdown, setShowCountyDropdown] = useState(false);
  const [priceError, setPriceError] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [escrowOnly, setEscrowOnly] = useState(false);
  const [deliveryOnly, setDeliveryOnly] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const cat = searchParams.get("category");
    const q = searchParams.get("q");
    if (cat) setSelectedCategory(cat);
    if (q) setSearchQuery(q);
  }, [searchParams]);

  useEffect(() => {
    if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
      setPriceError("Min price cannot exceed max price");
    } else {
      setPriceError("");
    }
  }, [minPrice, maxPrice]);

  const queryArgs = useMemo(() => {
    const args: Record<string, string | number> = { query: searchQuery };
    if (selectedCategory !== "All") args.category = selectedCategory;
    if (selectedCounty !== "All Counties") args.county = selectedCounty;
    if (minPrice && !priceError) args.minPrice = Number(minPrice);
    if (maxPrice && !priceError) args.maxPrice = Number(maxPrice);
    if (conditionFilter) args.condition = conditionFilter;
    return args;
  }, [searchQuery, selectedCategory, selectedCounty, minPrice, maxPrice, conditionFilter, priceError]);

  const rawListings = useQuery(api.listings.searchListings, queryArgs as any);

  const results = useMemo(() => {
    let list = rawListings ?? [];
    if (verifiedOnly) list = list.filter((l: any) => l.sellerVerified);
    if (escrowOnly) list = list.filter((l: any) => l.escrowProtection);
    if (deliveryOnly) list = list.filter((l: any) => l.transportAvailable);
    return list;
  }, [rawListings, verifiedOnly, escrowOnly, deliveryOnly]);

  const activeCategoryObj = CATEGORIES.find((c) => c.slug === selectedCategory);

  const filteredCounties = useMemo(() => {
    if (!countySearch) return KENYA_COUNTIES;
    const q = countySearch.toLowerCase();
    return KENYA_COUNTIES.filter((c) => c.toLowerCase().includes(q));
  }, [countySearch]);

  const hasActiveFilters = selectedCategory !== "All" || selectedSubcategory || selectedCounty !== "All Counties" || minPrice || maxPrice || conditionFilter || verifiedOnly || escrowOnly || deliveryOnly;

  const clearAllFilters = () => {
    setSelectedCategory("All");
    setSelectedSubcategory(null);
    setSelectedCounty("All Counties");
    setMinPrice("");
    setMaxPrice("");
    setConditionFilter(null);
    setSearchQuery("");
    setCountySearch("");
    setVerifiedOnly(false);
    setEscrowOnly(false);
    setDeliveryOnly(false);
  };

  return (
    <div className="min-h-screen bg-nx-bg">
      {/* ═══════════════ HEADER ═══════════════ */}
      <div className="sticky top-0 z-30 h-14 bg-nx-card/80 backdrop-blur-xl border-b border-nx-border flex items-center px-4 md:px-6 gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 max-w-xl relative">
          <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="What are you looking for?"
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/[0.05] border border-white/5 text-sm text-white/70 placeholder:text-white/25 focus:border-nx-violet/30 focus:outline-none transition-colors" />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <span className="text-[10px] text-white/25 shrink-0">{results.length} products</span>
      </div>

      <div className="flex max-w-[1600px] mx-auto">
        {/* ═══════════════ SIDEBAR — EVERYTHING VISIBLE ═══════════════ */}
        <aside className="w-60 lg:w-64 shrink-0 border-r border-nx-border/50 bg-nx-card/20 min-h-[calc(100vh-56px)] sticky top-14 overflow-y-auto">
          <div className="p-4">

            {/* ─── CATEGORY ─── */}
            <div className="mb-5">
              <h4 className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">Category</h4>
              <div className="space-y-0.5 max-h-[28vh] overflow-y-auto pr-1">
                <button onClick={() => { setSelectedCategory("All"); setSelectedSubcategory(null); }}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all ${selectedCategory === "All" ? "bg-nx-violet/15 text-nx-violet border border-nx-violet/20" : "text-white/50 hover:bg-white/[0.03] hover:text-white/70"}`}>
                  <div className="w-5 h-5 rounded bg-gradient-to-br from-nx-violet/20 to-nx-cyan/20 flex items-center justify-center text-[9px]">🏪</div>
                  <span className="text-[10px] font-medium">All Categories</span>
                </button>
                {CATEGORIES.map((cat) => (
                  <button key={cat.slug} onClick={() => { setSelectedCategory(cat.slug); setSelectedSubcategory(null); }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all ${selectedCategory === cat.slug ? "bg-nx-violet/15 text-nx-violet border border-nx-violet/20" : "text-white/50 hover:bg-white/[0.03] hover:text-white/70"}`}>
                    <div className="w-5 h-5 rounded overflow-hidden shrink-0"><img src={CATEGORY_DEFAULTS[cat.slug]} alt="" className="w-full h-full object-cover" loading="lazy" /></div>
                    <span className="text-[10px] font-medium truncate">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ─── LOCATION ─── */}
            <div className="mb-5">
              <h4 className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">Location</h4>
              <div className="relative">
                <button onClick={() => setShowCountyDropdown(!showCountyDropdown)}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg bg-white/[0.03] border border-white/5 text-[10px] text-white/50 hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-white/30" /><span>{selectedCounty}</span></div>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showCountyDropdown ? "rotate-180" : ""}`} />
                </button>
                {showCountyDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-nx-card border border-nx-border rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-2 border-b border-nx-border/50">
                      <div className="relative">
                        <Search className="w-3 h-3 text-white/20 absolute left-2 top-1/2 -translate-y-1/2" />
                        <input value={countySearch} onChange={(e) => setCountySearch(e.target.value)} placeholder="Search county..."
                          className="w-full pl-7 pr-2 py-1.5 rounded-md bg-white/[0.03] border border-white/5 text-[10px] text-white/60 placeholder:text-white/20 focus:outline-none" autoFocus />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      <button onClick={() => { setSelectedCounty("All Counties"); setShowCountyDropdown(false); setCountySearch(""); }}
                        className={`w-full px-3 py-2 text-left text-[10px] ${selectedCounty === "All Counties" ? "text-nx-violet bg-nx-violet/10" : "text-white/40 hover:bg-white/[0.03]"}`}>
                        All Counties
                      </button>
                      {filteredCounties.map((county) => (
                        <button key={county} onClick={() => { setSelectedCounty(county); setShowCountyDropdown(false); setCountySearch(""); }}
                          className={`w-full px-3 py-2 text-left text-[10px] ${selectedCounty === county ? "text-nx-violet bg-nx-violet/10" : "text-white/40 hover:bg-white/[0.03]"}`}>
                          {county}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ─── PRICE RANGE ─── */}
            <div className="mb-5">
              <h4 className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">Price Range (KES)</h4>
              <div className="flex items-center gap-1.5 mb-2">
                <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Min" min="0"
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-[10px] text-white/60 placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none transition-colors" />
                <span className="text-white/15 text-[10px]">—</span>
                <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Max" min="0"
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-[10px] text-white/60 placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none transition-colors" />
              </div>
              {priceError && <p className="text-[9px] text-red-400 mb-1">{priceError}</p>}
              <div className="flex flex-wrap gap-1">
                {[{ l: "< 5K", mn: "", mx: "5000" }, { l: "5K–20K", mn: "5000", mx: "20000" }, { l: "20K–100K", mn: "20000", mx: "100000" }, { l: "100K+", mn: "100000", mx: "" }].map((p) => (
                  <button key={p.l} onClick={() => { setMinPrice(p.mn); setMaxPrice(p.mx); }}
                    className="px-2 py-0.5 rounded text-[8px] text-white/30 bg-white/[0.02] border border-white/5 hover:text-white/50 hover:border-white/10 transition-colors">{p.l}</button>
                ))}
              </div>
            </div>

            {/* ─── CONDITION ─── */}
            <div className="mb-5">
              <h4 className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">Condition</h4>
              <div className="space-y-0.5">
                <button onClick={() => setConditionFilter(null)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] transition-colors ${!conditionFilter ? "bg-white/[0.05] text-white/70 font-medium" : "text-white/30 hover:text-white/50 hover:bg-white/[0.02]"}`}>
                  All Conditions
                </button>
                {CONDITIONS.map((c) => (
                  <button key={c} onClick={() => setConditionFilter(conditionFilter === c ? null : c)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] transition-colors ${conditionFilter === c ? "bg-nx-cyan/10 text-nx-cyan font-medium" : "text-white/30 hover:text-white/50 hover:bg-white/[0.02]"}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* ─── TRUST & SAFETY ─── */}
            <div className="mb-5 border-t border-white/5 pt-4">
              <h4 className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">Trust & Safety</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div onClick={() => setVerifiedOnly(!verifiedOnly)}
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${verifiedOnly ? "bg-nx-violet border-nx-violet" : "border-white/20 group-hover:border-white/30"}`}>
                    {verifiedOnly && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <span onClick={() => setVerifiedOnly(!verifiedOnly)} className="text-[10px] text-white/50 group-hover:text-white/70 transition-colors">Verified Sellers Only</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div onClick={() => setEscrowOnly(!escrowOnly)}
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${escrowOnly ? "bg-nx-emerald border-nx-emerald" : "border-white/20 group-hover:border-white/30"}`}>
                    {escrowOnly && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <span onClick={() => setEscrowOnly(!escrowOnly)} className="text-[10px] text-white/50 group-hover:text-white/70 transition-colors">Escrow Protected</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div onClick={() => setDeliveryOnly(!deliveryOnly)}
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${deliveryOnly ? "bg-nx-blue border-nx-blue" : "border-white/20 group-hover:border-white/30"}`}>
                    {deliveryOnly && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <span onClick={() => setDeliveryOnly(!deliveryOnly)} className="text-[10px] text-white/50 group-hover:text-white/70 transition-colors">Delivery Available</span>
                </label>
              </div>
            </div>

            {/* ─── CLEAR ─── */}
            {hasActiveFilters && (
              <button onClick={clearAllFilters}
                className="w-full py-2 rounded-lg text-[10px] font-medium text-nx-violet bg-nx-violet/10 border border-nx-violet/20 hover:bg-nx-violet/20 transition-colors">
                Clear All Filters
              </button>
            )}
          </div>
        </aside>

        {/* ═══════════════ MAIN ═══════════════ */}
        <main className="flex-1 min-w-0">
          {/* Mobile category scroll */}
          <div className="lg:hidden px-3 py-2 border-b border-nx-border/30 overflow-x-auto">
            <div className="flex items-center gap-1.5">
              <button onClick={() => { setSelectedCategory("All"); setSelectedSubcategory(null); }}
                className={`shrink-0 px-2.5 py-1.5 rounded-full text-[10px] font-medium ${selectedCategory === "All" ? "bg-nx-violet text-white" : "bg-white/[0.04] text-white/40 border border-white/5"}`}>All</button>
              {CATEGORIES.map((cat) => (
                <button key={cat.slug} onClick={() => { setSelectedCategory(cat.slug); setSelectedSubcategory(null); }}
                  className={`shrink-0 px-2.5 py-1.5 rounded-full text-[10px] font-medium flex items-center gap-1 ${selectedCategory === cat.slug ? "bg-nx-violet text-white" : "bg-white/[0.04] text-white/40 border border-white/5"}`}>
                  <img src={CATEGORY_DEFAULTS[cat.slug]} alt="" className="w-3 h-3 rounded-sm object-cover" loading="lazy" />{cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile compact filters */}
          <div className="lg:hidden px-3 py-2 border-b border-nx-border/30 flex items-center gap-2">
            <select value={selectedCounty} onChange={(e) => setSelectedCounty(e.target.value)}
              className="shrink-0 px-2 py-1 rounded bg-white/[0.03] border border-white/5 text-[9px] text-white/50 focus:outline-none">
              <option value="All Counties">All Counties</option>
              {KENYA_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={conditionFilter || ""} onChange={(e) => setConditionFilter(e.target.value || null)}
              className="shrink-0 px-2 py-1 rounded bg-white/[0.03] border border-white/5 text-[9px] text-white/50 focus:outline-none">
              <option value="">All Conditions</option>
              {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Active chips */}
          {hasActiveFilters && (
            <div className="px-4 md:px-6 lg:px-8 pt-3 flex flex-wrap items-center gap-1.5">
              {selectedCategory !== "All" && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium text-nx-violet bg-nx-violet/10 border border-nx-violet/20">{activeCategoryObj?.name}<button onClick={() => { setSelectedCategory("All"); setSelectedSubcategory(null); }}><X className="w-2.5 h-2.5" /></button></span>}
              {selectedSubcategory && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium text-nx-cyan bg-nx-cyan/10 border border-nx-cyan/20">{selectedSubcategory}<button onClick={() => setSelectedSubcategory(null)}><X className="w-2.5 h-2.5" /></button></span>}
              {selectedCounty !== "All Counties" && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium text-white/60 bg-white/[0.04] border border-white/5"><MapPin className="w-2 h-2" />{selectedCounty}<button onClick={() => setSelectedCounty("All Counties")}><X className="w-2.5 h-2.5" /></button></span>}
              {(minPrice || maxPrice) && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium text-white/60 bg-white/[0.04] border border-white/5">KES {minPrice ? Number(minPrice).toLocaleString() : "0"} – {maxPrice ? Number(maxPrice).toLocaleString() : "∞"}<button onClick={() => { setMinPrice(""); setMaxPrice(""); }}><X className="w-2.5 h-2.5" /></button></span>}
              {conditionFilter && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium text-white/60 bg-white/[0.04] border border-white/5">{conditionFilter}<button onClick={() => setConditionFilter(null)}><X className="w-2.5 h-2.5" /></button></span>}
              {verifiedOnly && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium text-nx-violet bg-nx-violet/10 border border-nx-violet/20">Verified<button onClick={() => setVerifiedOnly(false)}><X className="w-2.5 h-2.5" /></button></span>}
              {escrowOnly && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium text-nx-emerald bg-nx-emerald/10 border border-nx-emerald/20">Escrow<button onClick={() => setEscrowOnly(false)}><X className="w-2.5 h-2.5" /></button></span>}
              {deliveryOnly && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium text-nx-blue bg-nx-blue/10 border border-nx-blue/20">Delivery<button onClick={() => setDeliveryOnly(false)}><X className="w-2.5 h-2.5" /></button></span>}
              <button onClick={clearAllFilters} className="text-[9px] text-nx-violet hover:text-nx-violet/80 ml-1">Clear all</button>
            </div>
          )}

          <div className="p-4 md:p-6 lg:p-8">
            {/* ═══ CATEGORY GRID ═══ */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-white">{selectedCategory === "All" ? "Browse Categories" : activeCategoryObj?.name || "Marketplace"}</h2>
                  <p className="text-[11px] text-white/30 mt-0.5">{selectedCategory === "All" ? "Explore products across all categories in Kenya" : activeCategoryObj?.description || ""}</p>
                </div>
              </div>

              {selectedCategory !== "All" && activeCategoryObj && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <button onClick={() => setSelectedSubcategory(null)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${!selectedSubcategory ? "bg-nx-violet text-white" : "bg-white/[0.04] text-white/40 border border-white/5"}`}>
                    All {activeCategoryObj.name}
                  </button>
                  {activeCategoryObj.subcategories.map((sub) => (
                    <button key={sub.slug} onClick={() => setSelectedSubcategory(selectedSubcategory === sub.name ? null : sub.name)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${selectedSubcategory === sub.name ? "bg-nx-violet text-white" : "bg-white/[0.04] text-white/40 border border-white/5"}`}>
                      {sub.name}
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 md:gap-3">
                {selectedCategory !== "All" && (
                  <button onClick={() => { setSelectedCategory("All"); setSelectedSubcategory(null); }}
                    className="group relative rounded-xl overflow-hidden aspect-[4/3] bg-gradient-to-br from-nx-violet/20 to-nx-cyan/10 border border-white/5 hover:border-nx-violet/30 transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center">
                    <div className="text-center"><span className="text-xl block mb-1">🏪</span><span className="text-[10px] font-bold text-white/60">All Categories</span></div>
                  </button>
                )}
                {CATEGORIES.map((cat) => (
                  <button key={cat.slug} onClick={() => { setSelectedCategory(cat.slug); setSelectedSubcategory(null); }}
                    className={`group relative rounded-xl overflow-hidden aspect-[4/3] transition-all duration-300 hover:-translate-y-0.5 ${selectedCategory === cat.slug ? "ring-2 ring-nx-violet shadow-lg shadow-nx-violet/20" : "hover:shadow-lg hover:shadow-nx-violet/10"}`}>
                    <img src={CATEGORY_DEFAULTS[cat.slug]} alt={cat.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute top-2 right-2"><span className="text-[8px] px-1.5 py-0.5 rounded-full bg-black/40 backdrop-blur-sm text-white/50">{cat.subcategories.length} sub</span></div>
                    <div className="absolute bottom-0 left-0 right-0 p-2.5 md:p-3">
                      <h3 className="text-[11px] md:text-xs font-bold text-white leading-tight drop-shadow-lg">{cat.name}</h3>
                      <span className="text-[9px] text-white/40 group-hover:text-white/60 transition-colors flex items-center gap-0.5 mt-0.5">Explore <ChevronRight className="w-2.5 h-2.5" /></span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* ═══ PRODUCTS ═══ */}
            {results.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-sm font-bold text-white/70">{selectedCategory !== "All" ? `${activeCategoryObj?.name} Products` : "All Products"}</h2>
                  <span className="text-[10px] text-white/25 bg-white/[0.03] px-2 py-0.5 rounded-full">{results.length}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 md:gap-3">
                  {results.map((listing: any) => (
                    <div key={listing._id} onClick={() => navigate(`/product/${listing._id}`)}
                      className="group rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden hover:border-white/10 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-nx-violet/5 hover:-translate-y-0.5">
                      <div className="aspect-[4/3] bg-white/[0.03] flex items-center justify-center overflow-hidden relative">
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
                          {listing.originCounty && <span className="text-[8px] text-white/25 flex items-center gap-0.5"><MapPin className="w-2 h-2" />{listing.originTown || ""} {listing.originCounty}</span>}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          {listing.escrowProtection && <span className="flex items-center gap-0.5 text-[8px] text-nx-emerald bg-nx-emerald/10 px-1 py-0.5 rounded"><Shield className="w-1.5 h-1.5" /> Escrow</span>}
                          {listing.transportAvailable && <span className="flex items-center gap-0.5 text-[8px] text-nx-blue bg-nx-blue/10 px-1 py-0.5 rounded"><Truck className="w-1.5 h-1.5" /> Delivery</span>}
                          {listing.sellerVerified && <span className="text-[8px] text-nx-emerald bg-nx-emerald/10 px-1 py-0.5 rounded">✓</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ EMPTY ═══ */}
            {results.length === 0 && hasActiveFilters && (
              <div className="text-center py-16 border-t border-white/5 mt-6">
                <h3 className="text-base font-semibold text-white mb-1">No products found</h3>
                <p className="text-[11px] text-white/30 max-w-sm mx-auto mb-4">No products match your current filters. Try adjusting your criteria.</p>
                <button onClick={clearAllFilters} className="px-5 py-2 rounded-xl bg-nx-violet text-white text-xs font-medium hover:bg-nx-violet/80 transition-colors">Clear All Filters</button>
              </div>
            )}
            {results.length === 0 && selectedCategory !== "All" && !hasActiveFilters && (
              <div className="text-center py-12 border-t border-white/5 mt-4">
                <Eye className="w-8 h-8 text-white/10 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-white/60 mb-1">No products in this category yet</h3>
                <p className="text-[10px] text-white/25 mb-4">Be the first to list in {activeCategoryObj?.name}</p>
                <button onClick={() => navigate("/auth?returnTo=/seller")} className="px-5 py-2 rounded-xl bg-nx-violet text-white text-xs font-medium hover:bg-nx-violet/80 transition-colors">Start Selling</button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
