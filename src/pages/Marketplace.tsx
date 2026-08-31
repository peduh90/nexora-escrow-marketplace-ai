import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import {
  Search,
  Shield,
  Star,
  Eye,
  TrendingUp,
  Filter,
  Grid3x3,
  List,
  Brain,
  MapPin,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay }} className={className}>
      {children}
    </motion.div>
  );
}

const categories = ["All", "Electronics", "Agriculture", "Fashion", "Real Estate", "Services", "Digital Goods", "B2B"];

const listings = [
  { title: "Samsung Galaxy S24 Ultra", price: 145000, currency: "KES", seller: "TechHub Nairobi", category: "Electronics", verified: true, reputation: 4.8, escrowProtected: true, aiRisk: 98.2, views: 342, image: "📱" },
  { title: "Organic Coffee Beans (50kg)", price: 85000, currency: "KES", seller: "Highlands Farm", category: "Agriculture", verified: true, reputation: 4.9, escrowProtected: true, aiRisk: 99.5, views: 187, image: "☕" },
  { title: "Web Development Services", price: 250000, currency: "KES", seller: "DevStudio KE", category: "Services", verified: true, reputation: 4.7, escrowProtected: true, aiRisk: 96.8, views: 523, image: "💻" },
  { title: "Commercial Land Kitengela", price: 4500000, currency: "KES", seller: "Prime Properties", category: "Real Estate", verified: true, reputation: 4.6, escrowProtected: true, aiRisk: 94.1, views: 891, image: "🏗" },
  { title: "Nike Air Max 2025 Collection", price: 18500, currency: "KES", seller: "Urban Fashion KE", category: "Fashion", verified: true, reputation: 4.5, escrowProtected: true, aiRisk: 97.3, views: 1205, image: "👟" },
  { title: "E-Commerce Platform License", price: 75000, currency: "KES", seller: "SoftTech Africa", category: "Digital Goods", verified: true, reputation: 4.8, escrowProtected: true, aiRisk: 99.1, views: 456, image: "📦" },
  { title: "Bulk Maize (5 Tons)", price: 320000, currency: "KES", seller: "Western Kenya Mills", category: "Agriculture", verified: true, reputation: 4.7, escrowProtected: true, aiRisk: 98.7, views: 234, image: "🌽" },
  { title: "iPhone 15 Pro Max 256GB", price: 168000, currency: "KES", seller: "GadgetZone", category: "Electronics", verified: false, reputation: 4.3, escrowProtected: true, aiRisk: 91.4, views: 892, image: "📱" },
  { title: "B2B Logistics Partnership", price: 500000, currency: "KES", seller: "MoveIt KE", category: "B2B", verified: true, reputation: 4.9, escrowProtected: true, aiRisk: 97.8, views: 167, image: "🚛" },
];

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filtered = listings.filter((l) => {
    const matchesSearch = l.title.toLowerCase().includes(searchQuery.toLowerCase()) || l.seller.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || l.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        <div className="sticky top-0 z-30 h-14 bg-[#08080F]/80 backdrop-blur-xl border-b border-white/5 flex items-center px-4 md:px-6">
          <h2 className="text-sm font-semibold text-white">Marketplace</h2>
        </div>

        <div className="p-4 md:p-6 space-y-5">
          <FadeIn>
            <h1 className="text-2xl font-bold text-white">Marketplace</h1>
            <p className="text-sm text-white/40 mt-1">Discover protected listings from verified sellers</p>
          </FadeIn>

          {/* Search and filters */}
          <FadeIn delay={0.05}>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-white/20 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products, services, sellers..."
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
          </FadeIn>

          {/* Categories */}
          <FadeIn delay={0.08}>
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
          </FadeIn>

          {/* Listings grid */}
          <div className={`grid gap-3 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
            {filtered.map((listing, i) => (
              <FadeIn key={listing.title} delay={i * 0.04}>
                <div className={`group p-4 rounded-xl border border-white/5 bg-nx-surface/50 hover:border-white/10 transition-all duration-300 cursor-pointer ${viewMode === "list" ? "flex items-center gap-4" : ""}`}>
                  {viewMode === "grid" && (
                    <div className="w-full h-32 rounded-lg bg-white/[0.02] flex items-center justify-center text-4xl mb-3 group-hover:bg-white/[0.03] transition-colors">
                      {listing.image}
                    </div>
                  )}
                  {viewMode === "list" && (
                    <div className="w-14 h-14 rounded-lg bg-white/[0.02] flex items-center justify-center text-2xl shrink-0">
                      {listing.image}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-sm font-medium text-white truncate">{listing.title}</h3>
                      {listing.escrowProtected && (
                        <Shield className="w-3.5 h-3.5 text-nx-violet shrink-0 mt-0.5" />
                      )}
                    </div>
                    <p className="text-xs text-white/30 mb-2">{listing.seller}</p>
                    <div className="flex items-center gap-2 mb-2">
                      {listing.verified && (
                        <span className="inline-flex items-center gap-1 text-[9px] text-nx-cyan bg-nx-cyan/10 px-1.5 py-0.5 rounded">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-[9px] text-nx-violet bg-nx-violet/10 px-1.5 py-0.5 rounded">
                        <Brain className="w-2.5 h-2.5" /> {listing.aiRisk}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-white">{listing.currency} {listing.price.toLocaleString()}</span>
                      <div className="flex items-center gap-2 text-[10px] text-white/25">
                        <span className="flex items-center gap-1"><Star className="w-3 h-3 text-nx-gold" /> {listing.reputation}</span>
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {listing.views}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
