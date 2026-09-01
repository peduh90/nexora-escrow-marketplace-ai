import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { CATEGORIES } from "@/lib/categories";
import { getCounties } from "@/lib/delivery-config";
import {
  Search, SlidersHorizontal, Grid3X3, List, X, Package,
  ArrowUpDown, Shield, Truck, MapPin, Star, CheckCircle2, Heart, Loader2,
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
  const listings = useQuery(api.listings.getActiveListings, {});
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

  // Filter and sort listings
  const filtered = (listings ?? []).filter((item) => {
    // Text search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!item.title.toLowerCase().includes(q) && !item.description.toLowerCase().includes(q) && !item.category.toLowerCase().includes(q)) {
        return false;
      }
    }
    // Category
    if (selectedCategory !== "all" && item.category !== selectedCategory) return false;
    // County
    if (selectedCounty !== "all" && item.originCounty !== selectedCounty) return false;
    // Condition
    if (selectedCondition !== "all" && item.condition !== selectedCondition) return false;
    // Price
    if (priceMin && item.price < Number(priceMin)) return false;
    if (priceMax && item.price > Number(priceMax)) return false;
    // Toggles
    if (onlyVerified && !item.sellerVerified) return false;
    if (onlyEscrow && !item.escrowProtection) return false;
    if (onlyDelivery && !item.transportAvailable) return false;
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case "newest": return b.createdAt - a.createdAt;
      case "price_low": return a.price - b.price;
      case "price_high": return b.price - a.price;
      case "popular": return b.views - a.views;
      default: return b.createdAt - a.createdAt;
    }
  });

  return (
    <div className="min-h-screen bg-[#05050A]">
      {/* Search header */}
      <div className="sticky top-0 z-40 bg-[#0A0A12]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What are you looking for?"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-nx-violet/30" />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm transition-colors ${
                showFilters || activeFilterCount > 0
                  ? "bg-nx-violet/10 border-nx-violet/20 text-nx-violet"
                  : "bg-white/[0.03] border-white/5 text-white/40 hover:text-white/60"
              }`}>
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-nx-violet text-white text-[10px] flex items-center justify-center">{activeFilterCount}</span>
              )}
            </button>
          </div>

          {/* Category pills */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 -mx-1 px-1">
            <button onClick={() => setSelectedCategory("all")}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === "all" ? "bg-nx-violet text-white" : "bg-white/[0.03] text-white/40 hover:text-white/60"
              }`}>All</button>
            {CATEGORIES.map((cat) => (
              <button key={cat.slug} onClick={() => setSelectedCategory(selectedCategory === cat.slug ? "all" : cat.slug)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                  selectedCategory === cat.slug ? "bg-nx-violet text-white" : "bg-white/[0.03] text-white/40 hover:text-white/60"
                }`}>
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
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-white/40">
                {listings === undefined ? "Loading..." : `${filtered.length} product${filtered.length !== 1 ? "s" : ""} found`}
              </p>
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

            {/* Loading state */}
            {listings === undefined && (
              <div className="text-center py-20">
                <Loader2 className="w-8 h-8 text-nx-violet animate-spin mx-auto mb-3" />
                <p className="text-sm text-white/30">Loading products...</p>
              </div>
            )}

            {/* Empty state */}
            {listings !== undefined && filtered.length === 0 && (
              <div className="text-center py-20">
                <div className="w-20 h-20 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-5">
                  <Package className="w-10 h-10 text-white/10" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No products yet</h3>
                <p className="text-sm text-white/30 max-w-md mx-auto">
                  Products will appear here once sellers start listing items on Nexora Market.
                </p>
              </div>
            )}

            {/* Product Grid */}
            {listings !== undefined && filtered.length > 0 && viewMode === "grid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((item) => (
                  <div key={item._id} className="group rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 overflow-hidden transition-all cursor-pointer"
                    onClick={() => navigate(`/product/${item._id}`)}>
                    <div className="aspect-[4/3] bg-gradient-to-br from-white/[0.02] to-white/[0.04] relative flex items-center justify-center overflow-hidden">
                      {item.images && item.images.length > 0 ? (
                        <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <Package className="w-12 h-12 text-white/10" />
                      )}
                      <button className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 backdrop-blur-sm text-white/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                        <Heart className="w-4 h-4" />
                      </button>
                      {item.sellerVerified && (
                        <span className="absolute top-3 left-3 text-[10px] px-2 py-0.5 rounded-full bg-nx-cyan/20 text-nx-cyan font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-medium text-white truncate group-hover:text-nx-violet transition-colors">{item.title}</h3>
                      <p className="text-lg font-bold text-white mt-1">KSh {item.price.toLocaleString()}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-white/20" />
                        <span className="text-[11px] text-white/30">{item.originTown}, {item.originCounty}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[11px] text-white/40">{item.sellerName}</span>
                        {item.sellerReputation > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px] text-amber-400">
                            <Star className="w-3 h-3 fill-amber-400" /> {item.sellerReputation.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {item.escrowProtection && (
                          <span className="flex items-center gap-0.5 text-[10px] text-emerald-400/70">
                            <Shield className="w-3 h-3" /> Escrow
                          </span>
                        )}
                        {item.transportAvailable && (
                          <span className="flex items-center gap-0.5 text-[10px] text-nx-cyan/70">
                            <Truck className="w-3 h-3" /> Delivery
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Product List */}
            {listings !== undefined && filtered.length > 0 && viewMode === "list" && (
              <div className="space-y-3">
                {filtered.map((item) => (
                  <div key={item._id} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all cursor-pointer"
                    onClick={() => navigate(`/product/${item._id}`)}>
                    <div className="w-20 h-20 rounded-lg bg-white/[0.03] flex items-center justify-center shrink-0 overflow-hidden">
                      {item.images && item.images.length > 0 ? (
                        <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-8 h-8 text-white/10" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-white truncate">{item.title}</h3>
                      <p className="text-xs text-white/30 mt-0.5 line-clamp-1">{item.description}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[11px] text-white/30 flex items-center gap-1"><MapPin className="w-3 h-3" />{item.originTown}, {item.originCounty}</span>
                        {item.sellerVerified && <span className="text-[10px] text-nx-cyan flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3" />Verified</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-white">KSh {item.price.toLocaleString()}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {item.escrowProtection && <Shield className="w-3 h-3 text-emerald-400/60" />}
                        {item.transportAvailable && <Truck className="w-3 h-3 text-nx-cyan/60" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
