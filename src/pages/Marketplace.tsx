import { useState } from "react";
import { useQuery } from "convex/react";
import { useNavigate } from "react-router";
import { api } from "../convex/_generated/api";
import { Search, Filter, Grid3x3, List, Package, MapPin, Shield, Truck, Eye, MessageSquare, Heart } from "lucide-react";

const categories = ["All", "Electronics", "Phones & Tablets", "Vehicles", "Fashion", "Property", "Home & Furniture", "Services", "Agriculture", "Jobs"];

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const navigate = useNavigate();

  const listings = useQuery(
    api.listings.searchListings,
    selectedCategory === "All"
      ? { query: searchQuery }
      : { query: searchQuery, category: selectedCategory }
  );

  const results = listings ?? [];

  return (
    <div className="min-h-screen bg-[#05050A]">
      <div className="sticky top-0 z-30 h-14 bg-[#08080F]/80 backdrop-blur-xl border-b border-white/5 flex items-center px-4 md:px-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors mr-3">
          ←
        </button>
        <h2 className="text-sm font-semibold text-white">Marketplace</h2>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-white">Marketplace</h1>
          <p className="text-sm text-white/40 mt-1">Discover products from verified sellers</p>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-white/20 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="What are you looking for?"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-white/70 placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-white/40 hover:text-white/60 transition-colors">
              <Filter className="w-3.5 h-3.5" />
              Filters
            </button>
            <button
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-white/30 hover:text-white/50 transition-colors"
            >
              {viewMode === "grid" ? <List className="w-4 h-4" /> : <Grid3x3 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat ? "bg-nx-violet/10 text-nx-violet" : "text-white/30 hover:text-white/50 bg-white/[0.02]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results count */}
        {results.length > 0 && (
          <p className="text-xs text-white/30">{results.length} product{results.length !== 1 ? "s" : ""} found</p>
        )}

        {/* Products grid */}
        {results.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-white/10" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No products yet</h3>
            <p className="text-sm text-white/30 max-w-md mx-auto">
              Products will appear here once sellers start listing items on Nexora Market.
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {results.map((listing: any) => (
              <div
                key={listing._id}
                onClick={() => navigate(`/product/${listing._id}`)}
                className="group rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden hover:border-white/10 transition-all cursor-pointer"
              >
                <div className="aspect-square bg-white/[0.03] flex items-center justify-center overflow-hidden">
                  {listing.images && listing.images.length > 0 ? (
                    <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <Package className="w-8 h-8 text-white/10" />
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-sm text-white/70 font-medium truncate group-hover:text-white transition-colors">{listing.title}</h3>
                  <p className="text-sm font-bold text-white mt-1">KSh {listing.price.toLocaleString()}</p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-white/30">
                    {listing.originCounty && (
                      <span className="flex items-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5" />
                        {listing.originCounty}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    {listing.escrowProtection && (
                      <span className="flex items-center gap-0.5 text-[9px] text-nx-emerald bg-nx-emerald/10 px-1.5 py-0.5 rounded">
                        <Shield className="w-2 h-2" /> Escrow
                      </span>
                    )}
                    <span className="text-[9px] text-white/20 bg-white/5 px-1.5 py-0.5 rounded">{listing.condition}</span>
                  </div>
                </div>
              </div>
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
                  <p className="text-sm font-bold text-white mt-0.5">KSh {listing.price.toLocaleString()}</p>
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
                  <button className="p-2 rounded-lg hover:bg-white/5 text-white/20 hover:text-white/50 transition-colors">
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
