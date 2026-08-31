import { useState } from "react";
import { useNavigate } from "react-router";
import { CATEGORIES } from "@/lib/categories";
import { getCounties } from "@/lib/delivery-config";
import {
  Search, SlidersHorizontal, Grid3X3, List, X, Package,
  ArrowUpDown, Shield, Truck, MapPin, Star, CheckCircle2, Heart,
} from "lucide-react";

const SORT_OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "newest", label: "Newest" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "popular", label: "Most Viewed" },
];

const CONDITIONS = ["Brand New", "Used - Like New", "Used - Good", "Used - Fair", "Refurbished"];

export default function MarketplaceFull() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCounty, setSelectedCounty] = useState("all");
  const [selectedCondition, setSelectedCondition] = useState("all");
  const [sortBy, setSortBy] = useState("recommended");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [onlyEscrow, setOnlyEscrow] = useState(false);
  const [onlyDelivery, setOnlyDelivery] = useState(false);
  const [onlyNegotiable, setOnlyNegotiable] = useState(false);

  const counties = getCounties();

  const activeFilterCount = [selectedCategory !== "all", selectedCounty !== "all", selectedCondition !== "all", !!priceMin, !!priceMax, onlyVerified, onlyEscrow, onlyDelivery, onlyNegotiable].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedCategory("all");
    setSelectedCounty("all");
    setSelectedCondition("all");
    setPriceMin("");
    setPriceMax("");
    setOnlyVerified(false);
    setOnlyEscrow(false);
    setOnlyDelivery(false);
    setOnlyNegotiable(false);
  };

  return (
    <div className="min-h-screen bg-[#05050A]">
      {/* Search header */}
      <div className="sticky top-0 z-40 bg-[#0A0A12]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What are you looking for?"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-nx-violet/30"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm transition-colors ${
                showFilters || activeFilterCount > 0
                  ? "bg-nx-violet/10 border-nx-violet/20 text-nx-violet"
                  : "bg-white/[0.03] border-white/5 text-white/40 hover:text-white/60"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-nx-violet text-white text-[10px] flex items-center justify-center">{activeFilterCount}</span>
              )}
            </button>
          </div>

          {/* Category pills */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 -mx-1 px-1">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === "all" ? "bg-nx-violet text-white" : "bg-white/[0.03] text-white/40 hover:text-white/60"
              }`}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setSelectedCategory(selectedCategory === cat.slug ? "all" : cat.slug)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                  selectedCategory === cat.slug ? "bg-nx-violet text-white" : "bg-white/[0.03] text-white/40 hover:text-white/60"
                }`}
              >
                <span>{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-6">
          {/* Filters sidebar */}
          {showFilters && (
            <div className="w-64 shrink-0 hidden lg:block">
              <div className="sticky top-32 space-y-5">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-2">Location</label>
                  <select value={selectedCounty} onChange={(e) => setSelectedCounty(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white/60 focus:outline-none focus:border-nx-violet/30">
                    <option value="all">All Locations</option>
                    {counties.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/50 mb-2">Price Range (KSh)</label>
                  <div className="flex gap-2">
                    <input type="number" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} placeholder="Min" className="flex-1 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-nx-violet/30" />
                    <input type="number" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} placeholder="Max" className="flex-1 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-nx-violet/30" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/50 mb-2">Condition</label>
                  <div className="space-y-1.5">
                    <button onClick={() => setSelectedCondition("all")} className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${selectedCondition === "all" ? "bg-nx-violet/10 text-nx-violet" : "text-white/40 hover:text-white/60"}`}>All Conditions</button>
                    {CONDITIONS.map((c) => (
                      <button key={c} onClick={() => setSelectedCondition(selectedCondition === c ? "all" : c)} className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${selectedCondition === c ? "bg-nx-violet/10 text-nx-violet" : "text-white/40 hover:text-white/60"}`}>{c}</button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={onlyVerified} onChange={(e) => setOnlyVerified(e.target.checked)} className="w-4 h-4 rounded border-white/10 bg-white/[0.03] text-nx-violet" />
                    <span className="text-xs text-white/50">Verified Sellers Only</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={onlyEscrow} onChange={(e) => setOnlyEscrow(e.target.checked)} className="w-4 h-4 rounded border-white/10 bg-white/[0.03] text-nx-violet" />
                    <span className="text-xs text-white/50">Escrow Protected</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={onlyDelivery} onChange={(e) => setOnlyDelivery(e.target.checked)} className="w-4 h-4 rounded border-white/10 bg-white/[0.03] text-nx-violet" />
                    <span className="text-xs text-white/50">Delivery Available</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={onlyNegotiable} onChange={(e) => setOnlyNegotiable(e.target.checked)} className="w-4 h-4 rounded border-white/10 bg-white/[0.03] text-nx-violet" />
                    <span className="text-xs text-white/50">Negotiable Price</span>
                  </label>
                </div>

                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="w-full py-2 rounded-lg text-xs text-nx-violet hover:text-nx-violet/80 transition-colors">
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Products area */}
          <div className="flex-1 min-w-0">
            {/* Results header */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-white/40">0 products found</p>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="appearance-none pl-3 pr-8 py-2 rounded-lg bg-white/[0.03] border border-white/5 text-xs text-white/60 focus:outline-none focus:border-nx-violet/30">
                    {SORT_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                  <ArrowUpDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/20 pointer-events-none" />
                </div>
                <div className="flex items-center gap-1 border border-white/5 rounded-lg p-0.5">
                  <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded ${viewMode === "grid" ? "bg-white/5 text-white" : "text-white/30"}`}><Grid3X3 className="w-4 h-4" /></button>
                  <button onClick={() => setViewMode("list")} className={`p-1.5 rounded ${viewMode === "list" ? "bg-white/5 text-white" : "text-white/30"}`}><List className="w-4 h-4" /></button>
                </div>
              </div>
            </div>

            {/* Active filter chips */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedCategory !== "all" && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-nx-violet/10 text-nx-violet text-[11px]">
                    {CATEGORIES.find(c => c.slug === selectedCategory)?.name}
                    <button onClick={() => setSelectedCategory("all")}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {selectedCounty !== "all" && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-nx-cyan/10 text-nx-cyan text-[11px]">
                    {selectedCounty}
                    <button onClick={() => setSelectedCounty("all")}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {selectedCondition !== "all" && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-400/10 text-emerald-400 text-[11px]">
                    {selectedCondition}
                    <button onClick={() => setSelectedCondition("all")}><X className="w-3 h-3" /></button>
                  </span>
                )}
              </div>
            )}

            {/* Empty state */}
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-5">
                <Package className="w-10 h-10 text-white/10" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No products yet</h3>
              <p className="text-sm text-white/30 max-w-md mx-auto">
                Products will appear here once sellers start listing items on Nexora Market.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
