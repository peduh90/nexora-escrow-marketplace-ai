import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import SellerSidebar from "./SellerSidebar";
import { KENYA_COUNTIES, PRODUCT_CATEGORIES } from "@/lib/kenya-locations";
import {
  Package, Plus, Search, Edit3, Trash2, Eye, Pause, Play,
  Shield, Star, TrendingUp, ChevronDown, Upload, X, MapPin,
} from "lucide-react";

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay }} className={className}>{children}</motion.div>
  );
}

const myProducts = [
  { id: "P001", title: "Samsung Galaxy S24 Ultra", price: 145000, category: "Electronics", status: "active", views: 342, sales: 8, rating: 4.8, stock: 12, county: "Nairobi", town: "Westlands", transport: true, image: "📱" },
  { id: "P002", title: "Organic Coffee Beans (50kg)", price: 85000, category: "Agriculture", status: "active", views: 187, sales: 15, rating: 4.9, stock: 45, county: "Nyeri", town: "Karatina", transport: true, image: "☕" },
  { id: "P003", title: "Nike Air Max 2025", price: 18500, category: "Fashion", status: "active", views: 1205, sales: 32, rating: 4.5, stock: 28, county: "Nairobi", town: "CBD", transport: true, image: "👟" },
  { id: "P004", title: "Bulk Maize 5 Tons", price: 320000, category: "Agriculture", status: "paused", views: 234, sales: 3, rating: 4.7, stock: 10, county: "Uasin Gishu", town: "Eldoret", transport: true, image: "🌽" },
  { id: "P005", title: "E-Commerce Platform License", price: 75000, category: "Digital", status: "active", views: 456, sales: 12, rating: 4.8, stock: 999, county: "Nairobi", town: "Westlands", transport: false, image: "📦" },
];

const statusConfig: Record<string, { color: string; bg: string }> = {
  active: { color: "text-nx-emerald", bg: "bg-nx-emerald/10" },
  paused: { color: "text-nx-gold", bg: "bg-nx-gold/10" },
  sold: { color: "text-nx-cyan", bg: "bg-nx-cyan/10" },
};

export default function SellerProducts() {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = myProducts.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex min-h-screen bg-background">
      <SellerSidebar />
      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        <div className="sticky top-0 z-30 h-14 bg-[#08080F]/80 backdrop-blur-xl border-b border-white/5 flex items-center px-4 md:px-6 justify-between">
          <h2 className="text-sm font-semibold text-white">My Products</h2>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-nx-violet text-white text-xs font-medium hover:bg-nx-violet/80 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Product
          </button>
        </div>

        <div className="p-4 md:p-6 space-y-5">
          <FadeIn>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">Product Management</h1>
                <p className="text-sm text-white/40 mt-1">{myProducts.length} products listed</p>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 text-white/20 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..."
                  className="pl-8 pr-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white/70 placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none w-48" />
              </div>
            </div>
          </FadeIn>

          {/* Product list */}
          <div className="space-y-2">
            {filtered.map((product, i) => {
              const st = statusConfig[product.status];
              return (
                <FadeIn key={product.id} delay={i * 0.04}>
                  <div className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-nx-surface/50 hover:border-white/10 transition-all group">
                    <div className="w-14 h-14 rounded-lg bg-white/[0.03] flex items-center justify-center text-2xl shrink-0">{product.image}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-medium text-white truncate">{product.title}</h3>
                        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${st.color} ${st.bg}`}>{product.status.toUpperCase()}</span>
                        {product.transport && <span className="text-[9px] text-nx-cyan bg-nx-cyan/10 px-1.5 py-0.5 rounded flex items-center gap-0.5"><MapPin className="w-2 h-2" /> Transport</span>}
                      </div>
                      <p className="text-[11px] text-white/30">{product.category} · {product.town}, {product.county}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-white/25">
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {product.views} views</span>
                        <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {product.sales} sales</span>
                        <span className="flex items-center gap-1"><Star className="w-3 h-3 text-nx-gold" /> {product.rating}</span>
                        <span>Stock: {product.stock}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-white">KES {product.price.toLocaleString()}</p>
                      <div className="flex items-center gap-1 mt-2 justify-end">
                        <button className="p-1.5 rounded-lg hover:bg-white/[0.05] text-white/20 hover:text-nx-violet transition-colors" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>
                        <button className="p-1.5 rounded-lg hover:bg-white/[0.05] text-white/20 hover:text-nx-gold transition-colors" title="Pause/Resume">
                          {product.status === "active" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-white/[0.05] text-white/20 hover:text-red-400 transition-colors" title="Remove"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>

        {/* Add Product Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowForm(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl border border-white/10 bg-nx-surface shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Add New Product</h3>
                <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-white/[0.05] text-white/30"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Product Title *</label>
                  <input placeholder="e.g. Samsung Galaxy S24 Ultra 256GB"
                    className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/50 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Description *</label>
                  <textarea rows={3} placeholder="Describe your product in detail..."
                    className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/50 focus:outline-none resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Price (KES) *</label>
                    <input type="number" placeholder="0"
                      className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/50 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Category *</label>
                    <select className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white focus:border-nx-violet/50 focus:outline-none">
                      <option value="">Select</option>
                      {PRODUCT_CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.icon} {c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">County *</label>
                    <select className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white focus:border-nx-violet/50 focus:outline-none">
                      <option value="">Select</option>
                      {KENYA_COUNTIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Town *</label>
                    <input placeholder="e.g. Westlands"
                      className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/50 focus:outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Stock Quantity</label>
                    <input type="number" placeholder="1"
                      className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/50 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Condition</label>
                    <select className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white focus:border-nx-violet/50 focus:outline-none">
                      <option value="new">New</option>
                      <option value="used">Used</option>
                      <option value="refurbished">Refurbished</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="transport" className="rounded border-white/20 bg-white/[0.03]" defaultChecked />
                  <label htmlFor="transport" className="text-sm text-white/60">Enable transport/delivery for this product</label>
                </div>
                <div className="p-4 rounded-lg border border-dashed border-white/10 text-center hover:border-nx-violet/30 transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 text-white/20 mx-auto mb-2" />
                  <p className="text-sm text-white/50">Upload Product Images</p>
                  <p className="text-[10px] text-white/25 mt-1">Up to 5 images (JPG, PNG, max 2MB each)</p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-lg border border-white/10 text-sm text-white/50 hover:text-white transition-colors">Cancel</button>
                  <button className="flex-1 py-2.5 rounded-lg bg-nx-violet text-white text-sm font-medium hover:bg-nx-violet/80 transition-colors">Publish Product</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
