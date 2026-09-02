import { useState, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { useNavigate, useSearchParams } from "react-router";
import { api } from "../convex/_generated/api";
import { Search, Filter, Grid3x3, List, Package, MapPin, Shield, Truck, Heart, ArrowLeft, X } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import { CATEGORIES } from "@/lib/categories";

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000000]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [conditionFilter, setConditionFilter] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Read category from URL
  useEffect(() => {
    const cat = searchParams.get("category");
    const q = searchParams.get("q");
    if (cat) setSelectedCategory(cat);
    if (q) setSearchQuery(q);
  }, [searchParams]);

  const listings = useQuery(
    api.listings.searchListings,
    selectedCategory === "All"
      ? { query: searchQuery }
      : { query: searchQuery, category: selectedCategory }
  );

  const results = listings ?? [];

  const activeCategory = CATEGORIES.find((c) => c.slug === selectedCategory);

  return (
    <div className="min-h-screen bg-nx-bg">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 h-14 bg-nx-card/80 backdrop-blur-xl border-b border-nx-border flex items-center px-4 md:px-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors mr-3">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="text-sm font-semibold text-white">Marketplace</h2>
        <div className="ml-auto text-xs text-white/30">
          {results.length > 0 && `${results.length} product${results.length !== 1 ? "s" : ""}`}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Page header */}
        <ScrollReveal>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Marketplace</h1>
            <p className="text-sm text-white/40 mt-1">Discover products from verified sellers across Kenya</p>
          </div>
        </ScrollReveal>

        {/* Search and filters */}
        <ScrollReveal delay={100}>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1" ref={searchRef}>
              <Search className="w-4 h-4 text-white/20 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowAutocomplete(e.target.value.length > 1); }}
                onFocus={() => searchQuery.length > 1 && setShowAutocomplete(true)}
                onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
                placeholder="Search products, brands, categories..."
                className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-white/70 placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(""); setShowAutocomplete(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50">
                  <X className="w-4 h-4" />
                </button>
              )}
              {/* Autocomplete dropdown */}
              {showAutocomplete && searchQuery.length > 1 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-nx-card border border-nx-border rounded-xl shadow-xl z-50 overflow-hidden">
                  {CATEGORIES.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5).map((cat) => (
                    <button key={cat.slug} onClick={() => { setSelectedCategory(cat.slug); setSearchQuery(""); setShowAutocomplete(false); }} className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/[0.03] transition-colors text-left">
                      <span>{cat.icon}</span>
                      <span className="text-sm text-white/60">{cat.name}</span>
                    </button>
                  ))}
                  {(results ?? []).slice(0, 5).map((l: any) => (
                    <button key={l._id} onClick={() => { navigate(`/product/${l._id}`); setShowAutocomplete(false); }} className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/[0.03] transition-colors text-left">
                      <Package className="w-4 h-4 text-white/20" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-white/60 truncate block">{l.title}</span>
                        <span className="text-[10px] text-white/30">KES {(l.price || 0).toLocaleString()}</span>
                      </div>
                    </button>
                  ))}
                  {CATEGORIES.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (!results || results.length === 0) && (
                    <div className="px-4 py-3 text-xs text-white/30 text-center">No results for "{searchQuery}"</div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-white/40 hover:text-white/60 transition-colors">
                <Filter className="w-3.5 h-3.5" />
                Filters
              </button>
              <button
                onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-white/30 hover:text-white/50 transition-colors"
              >
                {viewMode === "grid" ? <List className="w-4 h-4" /> : <Grid3x3 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </ScrollReveal>

        {/* Filter panel */}
        {showFilters && (
          <ScrollReveal>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-white/40 font-medium mb-2 block">Condition</label>
                  <div className="flex flex-wrap gap-2">
                    {["All", "Brand New", "Used", "Refurbished"].map((c) => (
                      <button key={c} onClick={() => setConditionFilter(c === "All" ? null : c)}
                        className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${(!conditionFilter && c === "All") || conditionFilter === c ? "bg-nx-violet/10 text-nx-violet border border-nx-violet/20" : "text-white/30 bg-white/[0.02] border border-white/5 hover:text-white/50"}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-white/40 font-medium mb-2 block">Price Range (KES)</label>
                  <div className="flex items-center gap-2">
                    <input type="number" value={priceRange[0]} onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                      className="w-full px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-xs text-white/60 focus:outline-none" placeholder="Min" />
                    <span className="text-white/20">—</span>
                    <input type="number" value={priceRange[1]} onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                      className="w-full px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-xs text-white/60 focus:outline-none" placeholder="Max" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-white/40 font-medium mb-2 block">Category</label>
                  <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setSelectedSubcategory(null); }}
                    className="w-full px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-xs text-white/60 focus:outline-none">
                    <option value="All">All Categories</option>
                    {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={() => { setConditionFilter(null); setPriceRange([0, 10000000]); setSelectedCategory("All"); setSelectedSubcategory(null); }}
                  className="text-xs text-white/30 hover:text-white/50 transition-colors">
                  Clear all filters
                </button>
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Popular searches */}
        <ScrollReveal delay={150}>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-[10px] text-white/20 shrink-0">Popular:</span>
            {["Laptops", "iPhone", "Samsung", "Cars", "Furniture", "Fashion", "TVs", "Cameras"].map((term) => (
              <button key={term} onClick={() => { setSearchQuery(term); setShowAutocomplete(false); }} className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-white/30 bg-white/[0.02] border border-white/5 hover:text-white/50 hover:border-white/10 transition-colors shrink-0">
                {term}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* Categories grid */}
        <ScrollReveal delay={200}>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-2">
            <button
              onClick={() => { setSelectedCategory("All"); setSelectedSubcategory(null); }}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-center transition-all ${selectedCategory === "All" ? "bg-nx-violet/10 border border-nx-violet/20 text-nx-violet" : "bg-white/[0.02] border border-white/5 text-white/40 hover:text-white/60 hover:border-white/10"}`}
            >
              <span className="text-lg">🏪</span>
              <span className="text-[10px] font-medium">All</span>
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => { setSelectedCategory(cat.slug); setSelectedSubcategory(null); }}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-center transition-all group ${selectedCategory === cat.slug ? "bg-nx-violet/10 border border-nx-violet/20 text-nx-violet" : "bg-white/[0.02] border border-white/5 text-white/40 hover:text-white/60 hover:border-white/10"}`}
              >
                <span className="text-lg group-hover:scale-110 transition-transform">{cat.icon}</span>
                <span className="text-[10px] font-medium leading-tight">{cat.name}</span>
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* Active subcategory chips */}
        {activeCategory && (
          <ScrollReveal delay={250}>
            <div className="flex flex-wrap gap-2">
              {activeCategory.subcategories.map((sub: { name: string; slug: string }) => (
                <button
                  key={sub.slug}
                  onClick={() => setSelectedSubcategory(selectedSubcategory === sub.name ? null : sub.name)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedSubcategory === sub.name ? "bg-nx-cyan/10 text-nx-cyan border border-nx-cyan/20" : "text-white/30 bg-white/[0.02] border border-white/5 hover:text-white/50"}`}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          </ScrollReveal>
        )}

        {/* Results header */}
        {results.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/30">
              {results.length} product{results.length !== 1 ? "s" : ""} found
              {selectedCategory !== "All" && ` in ${activeCategory?.name || selectedCategory}`}
              {selectedSubcategory && ` > ${selectedSubcategory}`}
            </p>
          </div>
        )}

        {/* Products */}
        {results.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-white/10" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {searchQuery ? "No results found" : "No products yet"}
            </h3>
            <p className="text-sm text-white/30 max-w-md mx-auto mb-6">
              {searchQuery
                ? `No products match "${searchQuery}". Try different keywords or browse categories.`
                : "Products will appear here once sellers start listing items on Nexora Market."
              }
            </p>
            <button onClick={() => navigate("/auth?returnTo=/seller")}
              className="px-6 py-2.5 rounded-xl bg-nx-violet text-white text-sm font-medium hover:bg-nx-violet/80 transition-colors">
              Start Selling
            </button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {results.map((listing: any, i: number) => (
              <ScrollReveal key={listing._id} delay={Math.min(i * 40, 300)}>
                <div
                  onClick={() => navigate(`/product/${listing._id}`)}
                  className="group rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden hover:border-white/10 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-nx-violet/5 hover:-translate-y-0.5"
                >
                  <div className="aspect-[4/3] bg-white/[0.03] flex items-center justify-center overflow-hidden relative">
                    {listing.images && listing.images.length > 0 ? (
                      <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <Package className="w-8 h-8 text-white/10" />
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
                      {listing.deliveryAvailable && (
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
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {results.map((listing: any) => (
              <div
                key={listing._id}
                onClick={() => navigate(`/product/${listing._id}`)}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all cursor-pointer"
              >
                <div className="w-20 h-20 rounded-lg bg-white/[0.03] flex items-center justify-center overflow-hidden shrink-0">
                  {listing.images && listing.images.length > 0 ? (
                    <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-6 h-6 text-white/10" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm text-white/70 font-medium truncate">{listing.title}</h3>
                  <p className="text-sm font-bold text-white mt-0.5">KSh {(listing.price || 0).toLocaleString()}</p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-white/30">
                    {listing.originCounty && <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{listing.originCounty}</span>}
                    <span>{listing.condition}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {listing.escrowProtection && (
                    <span className="flex items-center gap-0.5 text-[9px] text-nx-emerald bg-nx-emerald/10 px-1.5 py-0.5 rounded">
                      <Shield className="w-2 h-2" /> Escrow
                    </span>
                  )}
                  {listing.sellerVerified && (
                    <span className="text-[9px] text-nx-emerald bg-nx-emerald/10 px-1.5 py-0.5 rounded">✓</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
