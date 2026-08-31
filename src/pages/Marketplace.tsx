import { useState } from "react";
import { motion } from "framer-motion";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Search, Filter, Grid3x3, List, Package } from "lucide-react";

const categories = ["All", "Electronics", "Agriculture", "Fashion", "Real Estate", "Services", "Digital Goods", "B2B"];

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        <div className="sticky top-0 z-30 h-14 bg-[#08080F]/80 backdrop-blur-xl border-b border-white/5 flex items-center px-4 md:px-6">
          <h2 className="text-sm font-semibold text-white">Marketplace</h2>
        </div>

        <div className="p-4 md:p-6 space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-white">Marketplace</h1>
            <p className="text-sm text-white/40 mt-1">Discover protected listings from verified sellers</p>
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

          {/* Empty state */}
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-white/10" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No products yet</h3>
            <p className="text-sm text-white/30 max-w-md mx-auto">
              Products will appear here once sellers start listing items on Nexora Market.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
