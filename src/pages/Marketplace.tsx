import { useState, useEffect, useMemo } from "react";
import { useQuery } from "convex/react";
import { useNavigate, useSearchParams } from "react-router";
import { api } from "../convex/_generated/api";
import {
  Search, ArrowLeft, X, ChevronRight, ChevronDown,
  MapPin, Shield, Truck, Heart, SlidersHorizontal,
  DollarSign, RotateCcw,
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

const CONDITIONS = ["Brand New", "Used", "Refurbished"];

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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const cat = searchParams.get("category");
    const q = searchParams.get("q");
    if (cat) setSelectedCategory(cat);
    if (q) setSearchQuery(q);
  }, [searchParams]);

  // Validate price range
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

  const listings = useQuery(api.listings.searchListings, queryArgs as any);
  const results = listings ?? [];

  const activeCategoryObj = CATEGORIES.find((c) => c.slug === selectedCategory);

  const filteredCounties = useMemo(() => {
    if (!countySearch) return KENYA_COUNTIES;
    const q = countySearch.toLowerCase();
    return KENYA_COUNTIES.filter((c) => c.toLowerCase().includes(q));
  }, [countySearch]);

  const hasActiveFilters = selectedCategory !== "All" || selectedSubcategory || selectedCounty !== "All Counties" || minPrice || maxPrice || conditionFilter;

  const clearAllFilters = () => {
    setSelectedCategory("All");
    setSelectedSubcategory(null);
    setSelectedCounty("All Counties");
    setMinPrice("");
    setMaxPrice("");
    setConditionFilter(null);
    setSearchQuery("");
    setCountySearch("");
  };

  const activeFilterCount = [
    selectedCategory !== "All",
    !!selectedSubcategory,
    selectedCounty !== "All Counties",
    !!minPrice || !!maxPrice,
    !!conditionFilter,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-nx-bg">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 h-14 bg-nx-card/80 backdrop-blur-xl border-b border-nx-border flex items-center px-4 md:px-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors mr-3">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, brands, categories..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/[0.05] border border-white/5 text-sm text-white/70 placeholder:text-white/25 focus:border-nx-violet/30 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        <div className="ml-4 flex items-center gap-3">
          {activeFilterCount > 0 && (
            <span className="text-[10px] font-semibold text-nx-violet bg-nx-violet/10 px-2 py-0.5 rounded-full">
              {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
            </span>
          )}
          <span className="text-xs text-white/30 hidden md:block">
            {results.length} product{results.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="flex max-w-[1600px] mx-auto">
        {/* ═══════════════ LEFT SIDEBAR ═══════════════ */}
        <aside className="hidden md:block w-64 lg:w-72 shrink-0 border-r border-nx-border/50 bg-nx-card/20 min-h-[calc(100vh-56px)] sticky top-14 overflow-y-auto">
          <div className="p-5 space-y-6">
            {/* ─── Filters Header ─── */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-nx-violet" />
                <h3 className="text-sm font-bold text-white/80">Filters</h3>
              </div>
              {hasActiveFilters && (
                <button onClick={clearAllFilters} className="text-[10px] text-nx-violet hover:text-nx-violet/80 transition-colors flex items-center gap-1">
                  <RotateCcw className="w-2.5 h-2.5" />
                  Clear all
                </button>
              )}
            </div>

            {/* ─── CATEGORY FILTER ─── */}
            <div>
              <h4 className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2">Category</h4>
              <div className="space-y-0.5">
                <button
                  onClick={() => { setSelectedCategory("All"); setSelectedSubcategory(null); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${
                    selectedCategory === "All"
                      ? "bg-nx-violet/15 text-nx-violet border border-nx-violet/20"
                      : "text-white/50 hover:bg-white/[0.03] hover:text-white/70"
                  }`}
                >
                  <div className="w-6 h-6 rounded-md bg-gradient-to-br from-nx-violet/20 to-nx-cyan/20 flex items-center justify-center text-[10px]">🏪</div>
                  <span className="text-[11px] font-medium">All Categories</span>
                </button>

                {CATEGORIES.map((cat) => (
                  <div key={cat.slug}>
                    <button
                      onClick={() => { setSelectedCategory(cat.slug); setSelectedSubcategory(null); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${
                        selectedCategory === cat.slug
                          ? "bg-nx-violet/15 text-nx-violet border border-nx-violet/20"
                          : "text-white/50 hover:bg-white/[0.03] hover:text-white/70"
                      }`}
                    >
                      <div className="w-6 h-6 rounded-md overflow-hidden shrink-0">
                        <img
                          src={CATEGORY_DEFAULTS[cat.slug]}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <span className="text-[11px] font-medium truncate flex-1">{cat.name}</span>
                      <ChevronRight className="w-3 h-3 opacity-30 shrink-0" />
                    </button>
                    {selectedCategory === cat.slug && (
                      <div className="ml-8 mt-0.5 mb-1 space-y-0.5 border-l border-white/5 pl-2">
                        {cat.subcategories.map((sub) => (
                          <button
                            key={sub.slug}
                            onClick={() => setSelectedSubcategory(selectedSubcategory === sub.name ? null : sub.name)}
                            className={`w-full text-left px-2 py-1.5 rounded text-[10px] transition-colors ${
                              selectedSubcategory === sub.name
                                ? "text-nx-cyan bg-nx-cyan/10 font-medium"
                                : "text-white/35 hover:text-white/55"
                            }`}
                          >
                            {sub.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ─── LOCATION FILTER ─── */}
            <div>
              <h4 className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2">Location</h4>
              <div className="relative">
                <button
                  onClick={() => setShowCountyDropdown(!showCountyDropdown)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-[11px] text-white/50 hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-white/30" />
                    <span>{selectedCounty}</span>
                  </div>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showCountyDropdown ? "rotate-180" : ""}`} />
                </button>
                {showCountyDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-nx-card border border-nx-border rounded-xl shadow-2xl z-50 overflow-hidden">
                    {/* Search inside dropdown */}
                    <div className="p-2 border-b border-nx-border/50">
                      <div className="relative">
                        <Search className="w-3 h-3 text-white/20 absolute left-2 top-1/2 -translate-y-1/2" />
                        <input
                          value={countySearch}
                          onChange={(e) => setCountySearch(e.target.value)}
                          placeholder="Search county..."
                          className="w-full pl-7 pr-2 py-1.5 rounded-md bg-white/[0.03] border border-white/5 text-[10px] text-white/60 placeholder:text-white/20 focus:outline-none"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                      <button
                        onClick={() => { setSelectedCounty("All Counties"); setShowCountyDropdown(false); setCountySearch(""); }}
                        className={`w-full px-3 py-2 text-left text-[11px] transition-colors ${
                          selectedCounty === "All Counties" ? "text-nx-violet bg-nx-violet/10" : "text-white/40 hover:bg-white/[0.03] hover:text-white/60"
                        }`}
                      >
                        All Counties
                      </button>
                      {filteredCounties.map((county) => (
                        <button
                          key={county}
                          onClick={() => { setSelectedCounty(county); setShowCountyDropdown(false); setCountySearch(""); }}
                          className={`w-full px-3 py-2 text-left text-[11px] transition-colors ${
                            selectedCounty === county ? "text-nx-violet bg-nx-violet/10" : "text-white/40 hover:bg-white/[0.03] hover:text-white/60"
                          }`}
                        >
                          {county}
                        </button>
                      ))}
                      {filteredCounties.length === 0 && (
                        <div className="px-3 py-3 text-[10px] text-white/20 text-center">No counties match "{countySearch}"</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ─── PRICE RANGE FILTER ─── */}
            <div>
              <h4 className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2">Price Range</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-white/25">KES</span>
                    <input
                      type="number"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="Min"
                      min="0"
                      className="w-full pl-9 pr-2 py-2 rounded-lg bg-white/[0.03] border border-white/5 text-[11px] text-white/60 placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none transition-colors"
                    />
                  </div>
                  <span className="text-white/15 text-[10px]">—</span>
                  <div className="flex-1 relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-white/25">KES</span>
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="Max"
                      min="0"
                      className="w-full pl-9 pr-2 py-2 rounded-lg bg-white/[0.03] border border-white/5 text-[11px] text-white/60 placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
                {priceError && (
                  <p className="text-[10px] text-red-400 flex items-center gap-1">
                    <DollarSign className="w-2.5 h-2.5" />
                    {priceError}
                  </p>
                )}
                {/* Quick price presets */}
                <div className="flex flex-wrap gap-1">
                  {[
                    { label: "< 5K", min: "", max: "5000" },
                    { label: "5K–20K", min: "5000", max: "20000" },
                    { label: "20K–100K", min: "20000", max: "100000" },
                    { label: "100K+", min: "100000", max: "" },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => { setMinPrice(preset.min); setMaxPrice(preset.max); }}
                      className="px-2 py-1 rounded text-[9px] text-white/30 bg-white/[0.02] border border-white/5 hover:text-white/50 hover:border-white/10 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ─── CONDITION FILTER ─── */}
            <div>
              <h4 className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2">Condition</h4>
              <div className="space-y-0.5">
                <button
                  onClick={() => setConditionFilter(null)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[11px] transition-colors ${
                    !conditionFilter ? "bg-white/[0.05] text-white/70 font-medium" : "text-white/35 hover:text-white/50 hover:bg-white/[0.02]"
                  }`}
                >
                  All Conditions
                </button>
                {CONDITIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setConditionFilter(conditionFilter === c ? null : c)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-[11px] transition-colors ${
                      conditionFilter === c ? "bg-nx-cyan/10 text-nx-cyan font-medium" : "text-white/35 hover:text-white/50 hover:bg-white/[0.02]"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* ═══════════════ MAIN CONTENT ═══════════════ */}
        <main className="flex-1 min-w-0">
          {/* Mobile filter bar */}
          <div className="md:hidden px-4 py-2 border-b border-nx-border/30 overflow-x-auto">
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setSelectedCategory("All"); setSelectedSubcategory(null); }}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-medium transition-colors ${
                  selectedCategory === "All" ? "bg-nx-violet text-white" : "bg-white/[0.04] text-white/40 border border-white/5"
                }`}
              >
                All
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => { setSelectedCategory(cat.slug); setSelectedSubcategory(null); }}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-medium transition-colors flex items-center gap-1 ${
                    selectedCategory === cat.slug ? "bg-nx-violet text-white" : "bg-white/[0.04] text-white/40 border border-white/5"
                  }`}
                >
                  <img src={CATEGORY_DEFAULTS[cat.slug]} alt="" className="w-3.5 h-3.5 rounded-sm object-cover" loading="lazy" />
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile filter panel (price + condition) */}
          <div className="md:hidden px-4 py-3 border-b border-nx-border/30 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-white/25">KES</span>
                <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Min price" min="0"
                  className="w-full pl-7 pr-2 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-[10px] text-white/60 placeholder:text-white/20 focus:outline-none" />
              </div>
              <span className="text-white/10 text-[10px]">—</span>
              <div className="flex-1 relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-white/25">KES</span>
                <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Max price" min="0"
                  className="w-full pl-7 pr-2 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-[10px] text-white/60 placeholder:text-white/20 focus:outline-none" />
              </div>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto">
              <button onClick={() => setConditionFilter(null)}
                className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] transition-colors ${!conditionFilter ? "bg-nx-cyan/10 text-nx-cyan" : "text-white/30 bg-white/[0.02] border border-white/5"}`}>
                All
              </button>
              {CONDITIONS.map((c) => (
                <button key={c} onClick={() => setConditionFilter(conditionFilter === c ? null : c)}
                  className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] transition-colors ${conditionFilter === c ? "bg-nx-cyan/10 text-nx-cyan" : "text-white/30 bg-white/[0.02] border border-white/5"}`}>
                  {c}
                </button>
              ))}
            </div>
            {/* Mobile county selector */}
            <div className="relative">
              <select
                value={selectedCounty}
                onChange={(e) => setSelectedCounty(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5 text-[11px] text-white/50 appearance-none focus:outline-none"
              >
                <option value="All Counties">All Counties</option>
                {KENYA_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="w-3 h-3 text-white/20 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="p-4 md:p-6 lg:p-8">
            {/* Active filter chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-[10px] text-white/20">Active:</span>
                {selectedCategory !== "All" && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium text-nx-violet bg-nx-violet/10 border border-nx-violet/20">
                    {activeCategoryObj?.name || selectedCategory}
                    <button onClick={() => { setSelectedCategory("All"); setSelectedSubcategory(null); }} className="hover:text-white/70"><X className="w-2.5 h-2.5" /></button>
                  </span>
                )}
                {selectedSubcategory && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium text-nx-cyan bg-nx-cyan/10 border border-nx-cyan/20">
                    {selectedSubcategory}
                    <button onClick={() => setSelectedSubcategory(null)} className="hover:text-white/70"><X className="w-2.5 h-2.5" /></button>
                  </span>
                )}
                {selectedCounty !== "All Counties" && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium text-white/60 bg-white/[0.04] border border-white/5">
                    <MapPin className="w-2.5 h-2.5" /> {selectedCounty}
                    <button onClick={() => setSelectedCounty("All Counties")} className="hover:text-white/70"><X className="w-2.5 h-2.5" /></button>
                  </span>
                )}
                {minPrice && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium text-white/60 bg-white/[0.04] border border-white/5">
                    Min: KES {Number(minPrice).toLocaleString()}
                    <button onClick={() => setMinPrice("")} className="hover:text-white/70"><X className="w-2.5 h-2.5" /></button>
                  </span>
                )}
                {maxPrice && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium text-white/60 bg-white/[0.04] border border-white/5">
                    Max: KES {Number(maxPrice).toLocaleString()}
                    <button onClick={() => setMaxPrice("")} className="hover:text-white/70"><X className="w-2.5 h-2.5" /></button>
                  </span>
                )}
                {conditionFilter && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium text-white/60 bg-white/[0.04] border border-white/5">
                    {conditionFilter}
                    <button onClick={() => setConditionFilter(null)} className="hover:text-white/70"><X className="w-2.5 h-2.5" /></button>
                  </span>
                )}
                <button onClick={clearAllFilters} className="text-[10px] text-nx-violet hover:text-nx-violet/80 transition-colors ml-1">
                  Clear all
                </button>
              </div>
            )}

            {/* ─── CATEGORY IMAGE GRID (shown when viewing "All" with no search) ─── */}
            {selectedCategory === "All" && !searchQuery && !hasActiveFilters && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 mb-8">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className="group relative rounded-2xl overflow-hidden aspect-[4/3] hover:shadow-xl hover:shadow-nx-violet/10 transition-all duration-300 hover:-translate-y-0.5 focus:ring-2 focus:ring-nx-violet/30"
                  >
                    <img
                      src={CATEGORY_DEFAULTS[cat.slug] || CATEGORY_DEFAULTS["mobile-phones"]}
                      alt={cat.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).src = PRODUCT_PLACEHOLDER["mobile-phones"]; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
                      <h3 className="text-xs md:text-sm font-bold text-white leading-tight drop-shadow-lg">{cat.name}</h3>
                      <span className="text-[10px] text-white/40 group-hover:text-white/60 transition-colors flex items-center gap-1 mt-0.5">
                        Explore <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* ─── RESULTS ─── */}
            {results.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-white/30">
                    {results.length} product{results.length !== 1 ? "s" : ""}
                    {selectedCategory !== "All" && ` in ${activeCategoryObj?.name || selectedCategory}`}
                    {selectedCounty !== "All Counties" && ` in ${selectedCounty}`}
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                  {results.map((listing: any) => (
                    <div
                      key={listing._id}
                      onClick={() => navigate(`/product/${listing._id}`)}
                      className="group rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden hover:border-white/10 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-nx-violet/5 hover:-translate-y-0.5"
                    >
                      <div className="aspect-[4/3] bg-white/[0.03] flex items-center justify-center overflow-hidden relative">
                        {listing.images && listing.images.length > 0 ? (
                          <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <img src={PRODUCT_PLACEHOLDER[listing.category] || PRODUCT_PLACEHOLDER["mobile-phones"]} alt="" className="w-full h-full object-cover opacity-40" />
                        )}
                        <button onClick={(e) => e.stopPropagation()} className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/40 backdrop-blur-sm text-white/50 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                          <Heart className="w-3.5 h-3.5" />
                        </button>
                        {listing.condition && (
                          <span className="absolute top-2 left-2 text-[9px] px-1.5 py-0.5 rounded bg-black/50 backdrop-blur-sm text-white/70 font-medium">
                            {listing.condition}
                          </span>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="text-sm text-white/70 font-medium truncate group-hover:text-white transition-colors">{listing.title}</h3>
                        <p className="text-sm font-bold text-white mt-1">KSh {(listing.price || 0).toLocaleString()}</p>
                        <div className="flex items-center gap-2 mt-2 text-[10px] text-white/30">
                          {listing.originCounty && (
                            <span className="flex items-center gap-0.5">
                              <MapPin className="w-2.5 h-2.5" />
                              {listing.originTown || ""} {listing.originCounty}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-2">
                          {listing.escrowProtection && (
                            <span className="flex items-center gap-0.5 text-[9px] text-nx-emerald bg-nx-emerald/10 px-1.5 py-0.5 rounded">
                              <Shield className="w-2 h-2" /> Escrow
                            </span>
                          )}
                          {listing.transportAvailable && (
                            <span className="flex items-center gap-0.5 text-[9px] text-nx-blue bg-nx-blue/10 px-1.5 py-0.5 rounded">
                              <Truck className="w-2 h-2" /> Delivery
                            </span>
                          )}
                          {listing.sellerVerified && (
                            <span className="text-[9px] text-nx-emerald bg-nx-emerald/10 px-1.5 py-0.5 rounded">
                              ✓ Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ─── EMPTY STATE ─── */}
            {results.length === 0 && (
              <div className="text-center py-20">
                <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-4 opacity-30">
                  <img src={PRODUCT_PLACEHOLDER[selectedCategory] || PRODUCT_PLACEHOLDER["mobile-phones"]} alt="" className="w-full h-full object-cover" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {searchQuery ? "No results found" : hasActiveFilters ? "No products match your filters" : "No products yet"}
                </h3>
                <p className="text-sm text-white/30 max-w-md mx-auto mb-6">
                  {searchQuery
                    ? `No products match "${searchQuery}". Try different keywords or browse categories.`
                    : hasActiveFilters
                    ? "Try adjusting your filters to see more products."
                    : "Products will appear here once sellers start listing items on Nexora Market."
                  }
                </p>
                <button
                  onClick={hasActiveFilters ? clearAllFilters : () => navigate("/auth?returnTo=/seller")}
                  className="px-6 py-2.5 rounded-xl bg-nx-violet text-white text-sm font-medium hover:bg-nx-violet/80 transition-colors"
                >
                  {hasActiveFilters ? "Clear Filters" : "Start Selling"}
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
