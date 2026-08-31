import SellerLayout from "./SellerLayout";
import { useState } from "react";
import {
  Plus,
  Search,
  Package,
  Edit3,
  Trash2,
  Eye,
  MapPin,
  Truck,
  MoreVertical,
  ImagePlus,
  X,
  Tag,
  BarChart3,
  Filter,
  Grid3X3,
  List,
} from "lucide-react";

const CATEGORIES = [
  "Electronics", "Fashion & Clothing", "Home & Garden", "Automotive",
  "Health & Beauty", "Sports & Outdoors", "Books & Stationery", "Food & Groceries",
  "Agriculture", "Building Materials", "Furniture", "Other",
];

const CONDITIONS = ["New", "Used - Like New", "Used - Good", "Used - Fair", "Refurbished"];

// Mock seller's own products
const mockProducts = [
  {
    id: "p1", title: "MacBook Pro 14\" M3 Max", description: "Brand new, sealed. Warranty included.",
    price: 285000, originalPrice: 320000, category: "Electronics", condition: "New",
    stock: 3, views: 1247, orders: 8, county: "Nairobi", town: "Westlands",
    transport: true, insurance: true, status: "active" as const, images: 3,
    rating: 4.9, reviews: 12, createdAt: "2025-01-15",
  },
  {
    id: "p2", title: "iPhone 15 Pro Max 256GB", description: "Natural titanium, unlocked. 100% battery health.",
    price: 142000, originalPrice: 155000, category: "Electronics", condition: "New",
    stock: 7, views: 2341, orders: 23, county: "Nairobi", town: "CBD",
    transport: true, insurance: true, status: "active" as const, images: 4,
    rating: 4.8, reviews: 31, createdAt: "2025-01-10",
  },
  {
    id: "p3", title: "Samsung Galaxy S24 Ultra 512GB", description: "Titanium Black. S Pen included. Factory unlocked.",
    price: 165000, originalPrice: 180000, category: "Electronics", condition: "New",
    stock: 5, views: 983, orders: 6, county: "Mombasa", town: "Nyali",
    transport: true, insurance: false, status: "active" as const, images: 2,
    rating: 4.7, reviews: 8, createdAt: "2025-01-20",
  },
  {
    id: "p4", title: "Nike Air Max 90 - White/Black", description: "Authentic Nike. Size 42 EU. Brand new in box.",
    price: 12500, originalPrice: 15000, category: "Fashion & Clothing", condition: "New",
    stock: 15, views: 654, orders: 18, county: "Nairobi", town: "Karen",
    transport: true, insurance: false, status: "active" as const, images: 5,
    rating: 4.6, reviews: 22, createdAt: "2025-01-22",
  },
  {
    id: "p5", title: "Sony WH-1000XM5 Headphones", description: "Industry-leading noise cancelling. Silver color.",
    price: 38000, originalPrice: 42000, category: "Electronics", condition: "New",
    stock: 0, views: 445, orders: 5, county: "Kisumu", town: "Milimani",
    transport: false, insurance: false, status: "sold" as const, images: 2,
    rating: 5.0, reviews: 5, createdAt: "2025-01-08",
  },
  {
    id: "p6", title: "Italian Leather Sofa Set", description: "3-seater + 2-seater + single. Dark brown genuine leather.",
    price: 85000, originalPrice: 95000, category: "Furniture", condition: "New",
    stock: 2, views: 312, orders: 1, county: "Nakuru", town: "CBD",
    transport: true, insurance: true, status: "paused" as const, images: 6,
    rating: 4.5, reviews: 3, createdAt: "2025-01-25",
  },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "bg-emerald-400/10 text-emerald-400" },
  sold: { label: "Sold Out", color: "bg-white/5 text-white/40" },
  paused: { label: "Paused", color: "bg-amber-400/10 text-amber-400" },
  removed: { label: "Removed", color: "bg-red-400/10 text-red-400" },
};

export default function SellerProducts() {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const filtered = mockProducts.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === "All" || p.category === filterCategory;
    const matchStatus = filterStatus === "All" || p.status === filterStatus;
    return matchSearch && matchCategory && matchStatus;
  });

  return (
    <SellerLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-white">My Products</h2>
          <p className="text-xs text-white/30 mt-0.5">{mockProducts.length} products • {mockProducts.filter(p => p.status === "active").length} active</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-nx-violet hover:bg-nx-violet/80 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your products..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-nx-violet/30 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white/60 focus:outline-none focus:border-nx-violet/30"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white/60 focus:outline-none focus:border-nx-violet/30"
          >
            <option value="All">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="sold">Sold Out</option>
          </select>
          <div className="hidden sm:flex items-center gap-1 border border-white/5 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded ${viewMode === "grid" ? "bg-white/5 text-white" : "text-white/30"}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded ${viewMode === "list" ? "bg-white/5 text-white" : "text-white/30"}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((product) => (
            <div key={product.id} className="group rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 overflow-hidden transition-all">
              {/* Image placeholder */}
              <div className="h-44 bg-gradient-to-br from-white/[0.02] to-white/[0.04] relative flex items-center justify-center">
                <Package className="w-12 h-12 text-white/10" />
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusConfig[product.status]?.color}`}>
                    {statusConfig[product.status]?.label}
                  </span>
                  {product.insurance && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-400/10 text-blue-400 font-medium">Insured</span>
                  )}
                </div>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <button
                    onClick={() => setEditingProduct(product.id)}
                    className="p-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white/60 hover:text-white hover:bg-black/70 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white/60 hover:text-white hover:bg-black/70 transition-colors">
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="absolute bottom-3 right-3 text-[10px] text-white/20 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded">
                  {product.images} photos
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] text-nx-violet/60">{product.category}</span>
                  <span className="text-white/10">•</span>
                  <span className="text-[10px] text-white/20">{product.condition}</span>
                </div>
                <h3 className="text-sm font-medium text-white truncate mb-1">{product.title}</h3>
                <p className="text-xs text-white/30 truncate mb-3">{product.description}</p>

                <div className="flex items-end justify-between mb-3">
                  <div>
                    <span className="text-lg font-bold text-white">KES {product.price.toLocaleString()}</span>
                    {product.originalPrice > product.price && (
                      <span className="text-xs text-white/20 line-through ml-2">KES {product.originalPrice.toLocaleString()}</span>
                    )}
                  </div>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 text-[11px] text-white/25 mb-3">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{product.town}, {product.county}</span>
                  {product.transport && <span className="flex items-center gap-1"><Truck className="w-3 h-3" />Transport</span>}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <div className="flex items-center gap-3 text-[11px] text-white/30">
                    <span>{product.views} views</span>
                    <span>{product.orders} orders</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-white/30">Stock:</span>
                    <span className={`text-[11px] font-medium ${product.stock === 0 ? "text-red-400" : product.stock < 5 ? "text-amber-400" : "text-emerald-400"}`}>
                      {product.stock}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="space-y-2">
          {filtered.map((product) => (
            <div key={product.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
              <div className="w-14 h-14 rounded-lg bg-white/[0.03] flex items-center justify-center shrink-0">
                <Package className="w-6 h-6 text-white/10" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-sm font-medium text-white truncate">{product.title}</h3>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusConfig[product.status]?.color}`}>
                    {statusConfig[product.status]?.label}
                  </span>
                </div>
                <p className="text-xs text-white/30 truncate">{product.description}</p>
              </div>
              <div className="text-right shrink-0 hidden sm:block">
                <p className="text-sm font-bold text-white">KES {product.price.toLocaleString()}</p>
                <p className="text-[11px] text-white/30">{product.stock} in stock</p>
              </div>
              <div className="text-right shrink-0 hidden md:block">
                <p className="text-[11px] text-white/30">{product.views} views</p>
                <p className="text-[11px] text-white/30">{product.orders} orders</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setEditingProduct(product.id)}
                  className="p-2 rounded-lg hover:bg-white/5 text-white/30 hover:text-white transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg hover:bg-white/5 text-white/30 hover:text-white transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {(showAddModal || editingProduct) && (
        <ProductModal
          onClose={() => { setShowAddModal(false); setEditingProduct(null); }}
          editProduct={editingProduct ? mockProducts.find(p => p.id === editingProduct) ?? null : null}
        />
      )}
    </SellerLayout>
  );
}

function ProductModal({ onClose, editProduct }: { onClose: () => void; editProduct: typeof mockProducts[0] | null }) {
  const [form, setForm] = useState({
    title: editProduct?.title || "",
    description: editProduct?.description || "",
    price: editProduct?.price?.toString() || "",
    originalPrice: editProduct?.originalPrice?.toString() || "",
    category: editProduct?.category || "",
    condition: editProduct?.condition || "New",
    stock: editProduct?.stock?.toString() || "1",
    county: editProduct?.county || "",
    town: editProduct?.town || "",
    transport: editProduct?.transport || false,
    insurance: editProduct?.insurance || false,
  });

  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0E0E18] border border-white/5 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0E0E18]">
          <h3 className="text-lg font-semibold text-white">
            {editProduct ? "Edit Product" : "Add New Product"}
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Images */}
          <div>
            <label className="block text-xs font-medium text-white/60 mb-2">Product Images</label>
            <div className="flex gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-20 h-20 rounded-lg border border-dashed border-white/10 flex items-center justify-center hover:border-nx-violet/30 cursor-pointer transition-colors">
                  {i === 1 ? (
                    <ImagePlus className="w-6 h-6 text-white/15" />
                  ) : (
                    <Plus className="w-5 h-5 text-white/10" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Product Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. MacBook Pro 14 M3 Max"
                className="w-full px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-nx-violet/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Description *</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe your product in detail..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-nx-violet/30 resize-none"
              />
            </div>
          </div>

          {/* Price & Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Price (KES) *</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-nx-violet/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Original Price (KES)</label>
              <input
                type="number"
                value={form.originalPrice}
                onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                placeholder="For discount display"
                className="w-full px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-nx-violet/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Stock *</label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-nx-violet/30"
              />
            </div>
          </div>

          {/* Category & Condition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white/60 focus:outline-none focus:border-nx-violet/30"
              >
                <option value="">Select category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Condition *</label>
              <select
                value={form.condition}
                onChange={(e) => setForm({ ...form, condition: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white/60 focus:outline-none focus:border-nx-violet/30"
              >
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">County *</label>
              <input
                type="text"
                value={form.county}
                onChange={(e) => setForm({ ...form, county: e.target.value })}
                placeholder="e.g. Nairobi"
                className="w-full px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-nx-violet/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Town *</label>
              <input
                type="text"
                value={form.town}
                onChange={(e) => setForm({ ...form, town: e.target.value })}
                placeholder="e.g. Westlands"
                className="w-full px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-nx-violet/30"
              />
            </div>
          </div>

          {/* Transport & Insurance */}
          <div className="flex flex-col sm:flex-row gap-4">
            <label className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5 cursor-pointer hover:border-white/10 transition-colors flex-1">
              <input
                type="checkbox"
                checked={form.transport}
                onChange={(e) => setForm({ ...form, transport: e.target.checked })}
                className="w-4 h-4 rounded border-white/10 bg-white/[0.03] text-nx-violet focus:ring-nx-violet/30"
              />
              <div>
                <p className="text-sm text-white/70">Platform Transport</p>
                <p className="text-[11px] text-white/30">Company handles delivery with insurance</p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5 cursor-pointer hover:border-white/10 transition-colors flex-1">
              <input
                type="checkbox"
                checked={form.insurance}
                onChange={(e) => setForm({ ...form, insurance: e.target.checked })}
                className="w-4 h-4 rounded border-white/10 bg-white/[0.03] text-nx-violet focus:ring-nx-violet/30"
              />
              <div>
                <p className="text-sm text-white/70">Item Insurance</p>
                <p className="text-[11px] text-white/30">2% of item value coverage</p>
              </div>
            </label>
          </div>

          {/* Commission info */}
          <div className="p-3 rounded-lg bg-nx-violet/5 border border-nx-violet/10">
            <p className="text-xs text-white/40">
              <span className="text-nx-violet font-medium">Commission:</span> 5% per transaction (Free tier) • Platform transport fee: 5%
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5 bg-[#0E0E18]">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg text-sm text-white/40 hover:text-white/60 hover:bg-white/[0.03] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!form.title || !form.price || !form.category || saving}
            className="px-6 py-2.5 rounded-lg bg-nx-violet hover:bg-nx-violet/80 text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
            ) : (
              editProduct ? "Update Product" : "Add Product"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
