import { useState, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { useNavigate, useSearchParams } from "react-router";
import { api } from "../convex/_generated/api";
import { Search, Filter, Grid3x3, List, Package, MapPin, Shield, Truck, Heart, ArrowLeft, X, ChevronRight, ChevronDown } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import { CATEGORY_DEFAULTS, PRODUCT_PLACEHOLDER } from "@/lib/category-images";

const KENYA_COUNTIES = [
  "Baringo","Bomet","Bungoma","Busia","Elgeyo-Marakwet","Embu","Garissa","Homa Bay","Isiolo","Kajiado",
  "Kakamega","Kericho","Kiambu","Kilifi","Kirinyaga","Kisii","Kisumu","Kitui","Kwale","Laikipia",
  "Lamu","Machakos","Makueni","Mandera","Marsabit","Meru","Migori","Mombasa","Muranga","Nairobi",
  "Nakuru","Nandi","Narok","Nyamira","Nyandarua","Nyeri","Samburu","Siaya","Taita-Taveta","Tana River",
  "Tharaka-Nithi","Trans Nzoia","Turkana","Uasin Gishu","Vihiga","Wajir","West Pokot",
];

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedCounty, setSelectedCounty] = useState("All Counties");
  const [sidebarCategory, setSidebarCategory] = useState("all");
  const [showCountyDropdown, setShowCountyDropdown] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const cat = searchParams.get("category");
    const q = searchParams.get("q");
    if (cat) {
      setSelectedCategory(cat);
      setSidebarCategory(cat);
    }
    if (q) setSearchQuery(q);
  }, [searchParams]);

  const listings = useQuery(
    api.listings.searchListings,
    selectedCategory === "All"
      ? { query: searchQuery }
      : { query: searchQuery, category: selectedCategory }
  );

  const results = listings ?? [];

  return (
    <div className="min-h-screen bg-nx-bg">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 h-14 bg-nx-card/80 backdrop-blur-xl border-b border-nx-border flex items-center px-4 md:px-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors mr-3">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-4 flex-1">
          {/* Search bar in header */}
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="What are you looking for?"
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/[0.05] border border-white/5 text-sm text-white/70 placeholder:text-white/25 focus:border-nx-violet/30 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        <div className="ml-4 text-xs text-white/30 hidden md:block">
          {results.length > 0 ? `${results.length} products` : "Browse categories"}
        </div>
      </div>

      <div className="flex max-w-[1600px] mx-auto">
        {/* Left Sidebar */}
        <aside className="hidden md:block w-64 lg:w-72 shrink-0 border-r border-nx-border/50 bg-nx-card/30 min-h-[calc(100vh-56px)] sticky top-14 overflow-y-auto">
          <div className="p-5">
            {/* Filters header */}
            <h3 className="text-sm font-bold text-white/80 mb-4">Filters</h3>

            {/* Category section */}
            <div className="mb-6">
              <h4 className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-3">Category</h4>
              <div className="space-y-0.5">
                {/* All Categories */}
                <button
                  onClick={() => { setSelectedCategory("All"); setSidebarCategory("all"); setSelectedSubcategory(null); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                    sidebarCategory === "all"
                      ? "bg-nx-violet/15 text-nx-violet border border-nx-violet/20"
                      : "text-white/50 hover:bg-white/[0.03] hover:text-white/70"
                  }`}
                >
                  <span className="text-sm">🏪</span>
                  <span className="text-xs font-medium">All Categories</span>
                </button>

                {CATEGORIES.map((cat) => (
                  <div key={cat.slug}>
                    <button
                      onClick={() => {
                        setSelectedCategory(cat.slug);
                        setSidebarCategory(cat.slug);
                        setSelectedSubcategory(null);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                        sidebarCategory === cat.slug
                          ? "bg-nx-violet/15 text-nx-violet border border-nx-violet/20"
                          : "text-white/50 hover:bg-white/[0.03] hover:text-white/70"
                      }`}
                    >
                      <span className="text-sm">{cat.icon}</span>
                      <span className="text-xs font-medium truncate">{cat.name}</span>
                      <ChevronRight className="w-3 h-3 ml-auto opacity-30" />
                    </button>

                    {/* Subcategories when selected */}
                    {sidebarCategory === cat.slug && (
                      <div className="ml-8 mt-1 space-y-0.5 border-l border-white/5 pl-2">
                        {cat.subcategories.map((sub) => (
                          <button
                            key={sub.slug}
                            onClick={() => setSelectedSubcategory(selectedSubcategory === sub.name ? null : sub.name)}
                            className={`w-full text-left px-2 py-1.5 rounded text-[11px] transition-colors ${
                              selectedSubcategory === sub.name
                                ? "text-nx-cyan bg-nx-cyan/10"
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

            {/* Location section */}
            <div className="mb-6">
              <h4 className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-3">Location</h4>
              <div className="relative">
                <button
                  onClick={() => setShowCountyDropdown(!showCountyDropdown)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-xs text-white/50 hover:border-white/10 transition-colors"
                >
                  <span>{selectedCounty}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showCountyDropdown ? "rotate-180" : ""}`} />
                </button>
                {showCountyDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-nx-card border border-nx-border rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                    <button
                      onClick={() => { setSelectedCounty("All Counties"); setShowCountyDropdown(false); }}
                      className="w-full px-3 py-2 text-left text-xs text-white/50 hover:bg-white/[0.03] transition-colors"
                    >
                      All Counties
                    </button>
                    {KENYA_COUNTIES.map((county) => (
                      <button
                        key={county}
                        onClick={() => { setSelectedCounty(county); setShowCountyDropdown(false); }}
                        className={`w-full px-3 py-2 text-left text-xs transition-colors ${
                          selectedCounty === county ? "text-nx-violet bg-nx-violet/10" : "text-white/40 hover:bg-white/[0.03] hover:text-white/60"
                        }`}
                      >
                        {county}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Condition filter */}
            <div className="mb-6">
              <h4 className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-3">Condition</h4>
              <div className="space-y-1">
                {["All", "Brand New", "Used", "Refurbished"].map((c) => (
                  <button key={c} className="w-full text-left px-3 py-2 rounded-lg text-xs text-white/40 hover:text-white/60 hover:bg-white/[0.03] transition-colors">
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear filters */}
            {(selectedCategory !== "All" || selectedSubcategory || selectedCounty !== "All Counties") && (
              <button
                onClick={() => {
                  setSelectedCategory("All");
                  setSidebarCategory("all");
                  setSelectedSubcategory(null);
                  setSelectedCounty("All Counties");
                }}
                className="w-full py-2.5 rounded-lg text-xs font-medium text-white/40 hover:text-white/60 border border-white/5 hover:border-white/10 transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* Mobile category filter bar */}
          <div className="md:hidden px-4 py-3 border-b border-nx-border/30 overflow-x-auto">
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setSelectedCategory("All"); setSidebarCategory("all"); }}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors ${
                  sidebarCategory === "all" ? "bg-nx-violet text-white" : "bg-white/[0.04] text-white/40 border border-white/5"
                }`}
              >
                All
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => { setSelectedCategory(cat.slug); setSidebarCategory(cat.slug); setSelectedSubcategory(null); }}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors ${
                    sidebarCategory === cat.slug ? "bg-nx-violet text-white" : "bg-white/[0.04] text-white/40 border border-white/5"
                  }`}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 md:p-6 lg:p-8">
            {/* Page title */}
            <div className="mb-6">
              <h1 className="text-xl md:text-2xl font-bold text-white">
                {sidebarCategory === "all" ? "Marketplace" : CATEGORIES.find(c => c.slug === sidebarCategory)?.name || "Marketplace"}
              </h1>
              <p className="text-xs text-white/30 mt-1">
                {selectedCategory === "All"
                  ? "Browse all categories across Kenya"
                  : `${results.length} product${results.length !== 1 ? "s" : ""} in this category`
                }
              </p>
            </div>

            {/* Active subcategory chips */}
            {selectedSubcategory && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] text-white/20">Filtered by:</span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-medium text-nx-cyan bg-nx-cyan/10 border border-nx-cyan/20 flex items-center gap-1.5">
                  {selectedSubcategory}
                  <button onClick={() => setSelectedSubcategory(null)} className="hover:text-white/70">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              </div>
            )}

            {/* Show category image grid when no search, or when viewing "All" */}
            {selectedCategory === "All" && !searchQuery && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 mb-8">
                {CATEGORIES.map((cat, i) => (
                  <button
                    key={cat.slug}
                    onClick={() => { setSelectedCategory(cat.slug); setSidebarCategory(cat.slug); }}
                    className="group relative rounded-2xl overflow-hidden aspect-[4/3] hover:shadow-xl hover:shadow-nx-violet/10 transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <img
                      src={CATEGORY_DEFAULTS[cat.slug] || CATEGORY_DEFAULTS["mobile-phones"]}
                      alt={cat.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base md:text-lg">{cat.icon}</span>
                        <h3 className="text-xs md:text-sm font-bold text-white leading-tight">{cat.name}</h3>
                      </div>
                      <span className="text-[10px] text-white/40 group-hover:text-white/60 transition-colors flex items-center gap-1">
                        Explore <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Product listings */}
            {results.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-white/30">
                    {results.length} product{results.length !== 1 ? "s" : ""} found
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                  {results.map((listing: any, i: number) => (
                    <div
                      key={listing._id}
                      onClick={() => navigate(`/product/${listing._id}`)}
                      className="group rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden hover:border-white/10 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-nx-violet/5 hover:-translate-y-0.5"
                    >
                      <div className="aspect-[4/3] bg-white/[0.03] flex items-center justify-center overflow-hidden relative">
                        {listing.images && listing.images.length > 0 ? (
                          <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <img
                            src={PRODUCT_PLACEHOLDER[listing.category] || PRODUCT_PLACEHOLDER["mobile-phones"]}
                            alt=""
                            className="w-full h-full object-cover opacity-40"
                          />
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
                  ))}
                </div>
              </>
            )}

            {/* Empty state */}
            {results.length === 0 && (selectedCategory !== "All" || searchQuery) && (
              <div className="text-center py-20">
                <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-4 opacity-30">
                  <img
                    src={PRODUCT_PLACEHOLDER[selectedCategory] || PRODUCT_PLACEHOLDER["mobile-phones"]}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {searchQuery ? "No results found" : "No products in this category"}
                </h3>
                <p className="text-sm text-white/30 max-w-md mx-auto mb-6">
                  {searchQuery
                    ? `No products match "${searchQuery}". Try different keywords or browse categories.`
                    : "Products will appear here once sellers list items in this category."
                  }
                </p>
                <button
                  onClick={() => { setSelectedCategory("All"); setSidebarCategory("all"); setSearchQuery(""); }}
                  className="px-6 py-2.5 rounded-xl bg-nx-violet text-white text-sm font-medium hover:bg-nx-violet/80 transition-colors"
                >
                  Browse All Categories
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
