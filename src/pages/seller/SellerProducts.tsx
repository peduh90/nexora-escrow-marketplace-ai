import SellerLayout from "./SellerLayout";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNavigate } from "react-router";
import {
  Plus, Search, Package, Edit3, Trash2, Eye, MapPin, Truck,
  Grid3X3, List, Loader2,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "bg-emerald-400/10 text-emerald-400" },
  sold: { label: "Sold Out", color: "bg-white/5 text-white/40" },
  paused: { label: "Paused", color: "bg-amber-400/10 text-amber-400" },
  removed: { label: "Removed", color: "bg-red-400/10 text-red-400" },
};

export default function SellerProducts() {
  const navigate = useNavigate();
  const listings = useQuery(api.listings.getSellerListings);
  const deleteListing = useMutation(api.listings.deleteListing);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [deleting, setDeleting] = useState<string | null>(null);

  const filtered = (listings ?? []).filter((p) => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === "All" || p.category === filterCategory;
    const matchStatus = filterStatus === "All" || p.status === filterStatus;
    return matchSearch && matchCategory && matchStatus;
  });

  const categories = [...new Set((listings ?? []).map((p) => p.category))];

  const handleDelete = async (listingId: string) => {
    if (!confirm("Are you sure you want to remove this product?")) return;
    setDeleting(listingId);
    try {
      await deleteListing({ listingId: listingId as any });
    } catch (err) {
      console.error("Failed to delete:", err);
    } finally {
      setDeleting(null);
    }
  };

  if (listings === undefined) {
    return (
      <SellerLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-nx-violet animate-spin" />
        </div>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-white">My Products</h2>
          <p className="text-xs text-white/30 mt-0.5">{filtered.length} products</p>
        </div>
        <button onClick={() => navigate("/seller/add-product")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-nx-violet hover:bg-nx-violet/80 text-white text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search your products..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-nx-violet/30 transition-colors" />
        </div>
        <div className="flex items-center gap-2">
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white/60 focus:outline-none focus:border-nx-violet/30">
            <option value="All">All Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white/60 focus:outline-none focus:border-nx-violet/30">
            <option value="All">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="sold">Sold</option>
          </select>
          <div className="hidden sm:flex items-center gap-1 border border-white/5 rounded-lg p-0.5">
            <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded ${viewMode === "grid" ? "bg-white/5 text-white" : "text-white/30"}`}>
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode("list")} className={`p-1.5 rounded ${viewMode === "list" ? "bg-white/5 text-white" : "text-white/30"}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/30">
            {listings.length === 0 ? "You haven't listed any products yet." : "No products match your filters."}
          </p>
          {listings.length === 0 && (
            <button onClick={() => navigate("/seller/add-product")} className="mt-4 px-5 py-2.5 rounded-lg bg-nx-violet text-white text-sm font-medium hover:bg-nx-violet/80 transition-colors">
              Add Your First Product
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((product) => (
            <div key={product._id} className="group rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 overflow-hidden transition-all">
              <div className="h-44 bg-gradient-to-br from-white/[0.02] to-white/[0.04] relative flex items-center justify-center">
                {product.images && product.images.length > 0 ? (
                  <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-12 h-12 text-white/10" />
                )}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusConfig[product.status]?.color || "bg-white/5 text-white/40"}`}>
                    {statusConfig[product.status]?.label || product.status}
                  </span>
                </div>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <button onClick={() => handleDelete(product._id)} disabled={deleting === product._id}
                    className="p-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white/60 hover:text-red-400 hover:bg-black/70 transition-colors">
                    {deleting === product._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="p-4">
                <span className="text-[10px] text-nx-violet/60">{product.category}</span>
                <h3 className="text-sm font-medium text-white truncate mt-0.5">{product.title}</h3>
                <p className="text-xs text-white/30 truncate mt-0.5">{product.description}</p>
                <div className="flex items-end justify-between mt-3">
                  <span className="text-lg font-bold text-white">KES {product.price.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-white/25 mt-2">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{product.originTown}, {product.originCounty}</span>
                  {product.transportAvailable && <span className="flex items-center gap-1"><Truck className="w-3 h-3" />Transport</span>}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-3">
                  <span className="text-[11px] text-white/30">{product.views} views</span>
                  {product.escrowProtection && <span className="text-[10px] text-emerald-400/60">✓ Escrow</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((product) => (
            <div key={product._id} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
              <div className="w-14 h-14 rounded-lg bg-white/[0.03] flex items-center justify-center shrink-0 overflow-hidden">
                {product.images && product.images.length > 0 ? (
                  <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-6 h-6 text-white/10" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-sm font-medium text-white truncate">{product.title}</h3>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusConfig[product.status]?.color || "bg-white/5 text-white/40"}`}>
                    {statusConfig[product.status]?.label || product.status}
                  </span>
                </div>
                <p className="text-xs text-white/30 truncate">{product.description}</p>
              </div>
              <div className="text-right shrink-0 hidden sm:block">
                <p className="text-sm font-bold text-white">KES {product.price.toLocaleString()}</p>
                <p className="text-[11px] text-white/30">{product.originTown}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => handleDelete(product._id)} disabled={deleting === product._id}
                  className="p-2 rounded-lg hover:bg-white/5 text-white/30 hover:text-red-400 transition-colors">
                  {deleting === product._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </SellerLayout>
  );
}
