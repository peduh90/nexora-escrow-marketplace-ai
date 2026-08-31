import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { SAMPLE_PRODUCTS, formatPrice, getConditionColor, type SampleProduct } from "@/lib/sample-products";
import { CATEGORIES } from "@/lib/categories";
import { getCounties } from "@/lib/delivery-config";
import {
  Search, SlidersHorizontal, Grid3X3, List, MapPin, Star, Shield, Truck, Heart,
  ChevronDown, X, Package, CheckCircle2, Filter, ArrowUpDown,
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
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const counties = getCounties();

  const filtered = useMemo(() => {
    let results = [...SAMPLE_PRODUCTS];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.seller.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.location.town.toLowerCase().includes(q) ||
          p.location.county.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      results = results.filter((p) => p.category === selectedCategory);
    }

    // County filter
    if (selectedCounty !== "all") {
      results = results.filter((p) => p.location.county === selectedCounty);
    }

    // Condition filter
    if (selectedCondition !== "all") {
      results = results.filter((p) => p.condition === selectedCondition);
    }

    // Price filter
    if (priceMin) results = results.filter((p) => p.price >= Number(priceMin));
    if (priceMax) results = results.filter((p) => p.price <= Number(priceMax));

    // Special filters
    if (onlyVerified) results = results.filter((p) => p.seller.verified);
    if (onlyEscrow) results = results.filter((p) => p.escrowProtected);
    if (onlyDelivery) results = results.filter((p) => p.deliveryAvailable);
    if (onlyNegotiable) results = results.filter((p) => p.negotiable);

    // Sort
    switch (sortBy) {
      case "newest":
        // Simple: keep original order (newest first in sample)
        break;
      case "price_low":
        results.sort((a, b) => a.price - b.price);
        break;
      case "price_high":
        results.sort((a, b) => b.price - a.price);
        break;
      case "popular":
        results.sort((a, b) => b.views - a.views);
        break;
      default:
        // recommended: keep original order
        break;
    }

    return results;
  }, [searchQuery, selectedCategory, selectedCounty, selectedCondition, sortBy, priceMin, priceMax, onlyVerified, onlyEscrow, onlyDelivery, onlyNegotiable]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const activeFilterCount = [selectedCategory !== "all", selectedCounty !== "all", selectedCondition !== "all", !!priceMin, !!priceMax, onlyVerified, onlyEscrow, onlyDelivery, onlyNegotiable].filter(Boolean).length;

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
                {/* Location */}
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-2">Location</label>
                  <select value={selectedCounty} onChange={(e) => setSelectedCounty(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white/60 focus:outline-none focus:border-nx-violet/30">
                    <option value="all">All Locations</option>
                    {counties.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-2">Price Range (KSh)</label>
                  <div className="flex gap-2">
                    <input type="number" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} placeholder="Min" className="flex-1 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-nx-violet/30" />
                    <input type="number" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} placeholder="Max" className="flex-1 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-nx-violet/30" />
                  </div>
                </div>

                {/* Condition */}
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-2">Condition</label>
                  <div className="space-y-1.5">
                    <button onClick={() => setSelectedCondition("all")} className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${selectedCondition === "all" ? "bg-nx-violet/10 text-nx-violet" : "text-white/40 hover:text-white/60"}`}>All Conditions</button>
                    {CONDITIONS.map((c) => (
                      <button key={c} onClick={() => setSelectedCondition(selectedCondition === c ? "all" : c)} className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${selectedCondition === c ? "bg-nx-violet/10 text-nx-violet" : "text-white/40 hover:text-white/60"}`}>{c}</button>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
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

                {/* Clear */}
                {activeFilterCount > 0 && (
                  <button
                    onClick={() => { setSelectedCategory("all"); setSelectedCounty("all"); setSelectedCondition("all"); setPriceMin(""); setPriceMax(""); setOnlyVerified(false); setOnlyEscrow(false); setOnlyDelivery(false); setOnlyNegotiable(false); }}
                    className="w-full py-2 rounded-lg text-xs text-nx-violet hover:text-nx-violet/80 transition-colors"
                  >
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
              <p className="text-sm text-white/40">{filtered.length} products found</p>
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

            {/* Product Grid */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product} viewMode="grid" navigate={navigate} saved={favorites.has(product.id)} onSave={() => toggleFavorite(product.id)} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product} viewMode="list" navigate={navigate} saved={favorites.has(product.id)} onSave={() => toggleFavorite(product.id)} />
                ))}
              </div>
            )}

            {filtered.length === 0 && (
              <div className="text-center py-16">
                <Package className="w-16 h-16 text-white/10 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No products found</h3>
                <p className="text-sm text-white/30">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, viewMode, navigate, saved, onSave }: { product: SampleProduct; viewMode: "grid" | "list"; navigate: any; saved: boolean; onSave: () => void }) {
  if (viewMode === "list") {
    return (
      <div onClick={() => navigate(`/product/${product.id}`)} className="flex gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 cursor-pointer transition-all">
        <div className="w-32 h-32 rounded-lg bg-white/[0.03] flex items-center justify-center shrink-0 relative">
          <Package className="w-10 h-10 text-white/10" />
          <span className={`absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full font-medium ${getConditionColor(product.condition)}`}>{product.condition}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-white truncate">{product.title}</h3>
          <p className="text-lg font-bold text-white mt-1">{formatPrice(product.price)}</p>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-white/30">
            <MapPin className="w-3 h-3" /> {product.location.town}, {product.location.county}
            <span>•</span>
            <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {product.seller.rating}</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            {product.seller.verified && <span className="flex items-center gap-1 text-[10px] text-nx-cyan"><CheckCircle2 className="w-3 h-3" /> Verified</span>}
            {product.escrowProtected && <span className="flex items-center gap-1 text-[10px] text-emerald-400"><Shield className="w-3 h-3" /> Escrow</span>}
            {product.deliveryAvailable && <span className="flex items-center gap-1 text-[10px] text-blue-400"><Truck className="w-3 h-3" /> Delivery</span>}
          </div>
        </div>
        <div className="flex flex-col items-end justify-between shrink-0">
          <button onClick={(e) => { e.stopPropagation(); onSave(); }} className={`p-2 rounded-lg ${saved ? "text-red-400" : "text-white/20 hover:text-white/40"}`}><Heart className={`w-4 h-4 ${saved ? "fill-red-400" : ""}`} /></button>
          <span className="text-[10px] text-white/20">{product.seller.name}</span>
        </div>
      </div>
    );
  }

  return (
    <div onClick={() => navigate(`/product/${product.id}`)} className="group rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 overflow-hidden cursor-pointer transition-all">
      <div className="h-48 bg-gradient-to-br from-white/[0.02] to-white/[0.04] relative flex items-center justify-center">
        <Package className="w-14 h-14 text-white/5" />
        <span className={`absolute top-3 left-3 text-[10px] px-2 py-0.5 rounded-full font-medium ${getConditionColor(product.condition)}`}>{product.condition}</span>
        <button onClick={(e) => { e.stopPropagation(); onSave(); }} className={`absolute top-3 right-3 p-1.5 rounded-full bg-black/30 backdrop-blur-sm ${saved ? "text-red-400" : "text-white/30 hover:text-white/60"}`}>
          <Heart className={`w-4 h-4 ${saved ? "fill-red-400" : ""}`} />
        </button>
      </div>
      <div className="p-4">
        <h3 className="text-sm font-medium text-white truncate mb-1">{product.title}</h3>
        <p className="text-lg font-bold text-white mb-2">{formatPrice(product.price)}</p>
        <div className="flex items-center gap-2 text-[11px] text-white/30 mb-2">
          <MapPin className="w-3 h-3" /> {product.location.town}, {product.location.county}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-white/30 mb-3">
          <span className="flex items-center gap-0.5">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {product.seller.rating}
          </span>
          <span className="text-white/10">•</span>
          <span className="truncate">{product.seller.name}</span>
          {product.seller.verified && <CheckCircle2 className="w-3 h-3 text-nx-cyan shrink-0" />}
        </div>
        <div className="flex items-center gap-2 pt-3 border-t border-white/5">
          {product.escrowProtected && <span className="flex items-center gap-1 text-[10px] text-emerald-400/60"><Shield className="w-3 h-3" /> Escrow</span>}
          {product.deliveryAvailable && <span className="flex items-center gap-1 text-[10px] text-blue-400/60"><Truck className="w-3 h-3" /> Delivery</span>}
        </div>
      </div>
    </div>
  );
}
