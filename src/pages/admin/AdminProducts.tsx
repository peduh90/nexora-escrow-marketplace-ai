import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import AdminLayout from "./AdminLayout";
import { Package, Search, CheckCircle2, XCircle, Trash2, Shield, Loader2, Eye, ChevronUp, ExternalLink as ExternalLinkIcon } from "lucide-react";

export default function AdminProducts() {
  const allListings = useQuery(api.admin.getAllListings);
  const allUsers = useQuery(api.admin.getAllUsers);
  const updateListingStatus = useMutation(api.admin.updateListingStatus);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [acting, setActing] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const listings = allListings ?? [];
  const users = allUsers ?? [];
  const getUser = (id: string) => users.find((u: any) => u._id === id);

  const products = listings.map((l: any) => ({
    ...l,
    sellerName: getUser(l.sellerId)?.name || getUser(l.sellerId)?.businessName || "Unknown",
  }));

  const filtered = products.filter((p: any) => {
    if (filter === "Published" && p.status !== "active") return false;
    if (filter === "Paused" && p.status !== "paused") return false;
    if (filter === "Sold" && p.status !== "sold") return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.sellerName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const setStatus = async (listingId: string, status: "active" | "paused" | "sold" | "removed") => {
    setActing(listingId);
    try {
      await updateListingStatus({ listingId, status });
    } catch (err: any) {
      console.error("Failed to update listing status:", err);
    } finally {
      setActing(null);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Product Moderation</h1>
        <p className="text-sm text-white/40 mt-1">Review, approve, pause, and remove marketplace listings</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Products", value: products.length.toString() },
          { label: "Active", value: products.filter((p: any) => p.status === "active").length.toString() },
          { label: "Paused", value: products.filter((p: any) => p.status === "paused").length.toString() },
          { label: "Sold", value: products.filter((p: any) => p.status === "sold").length.toString() },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-xl border border-white/5 bg-[#0A0A12]">
            <p className="text-[10px] text-white/30 uppercase">{s.label}</p>
            <p className="text-xl font-bold text-white mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products or sellers..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#0A0A12] border border-white/5 text-sm text-white placeholder-white/20 focus:border-nx-violet/30 focus:outline-none"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {["All", "Published", "Paused", "Sold"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${filter === f ? "bg-nx-violet/10 text-nx-violet" : "text-white/30 hover:text-white/50 bg-[#0A0A12] border border-white/5"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {products.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-[#0A0A12] py-16 flex flex-col items-center">
          <Package className="w-8 h-8 text-white/10 mb-3" />
          <p className="text-sm text-white/30">No products yet</p>
          <p className="text-[11px] text-white/15 mt-1">Products will appear here once sellers list items</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/5 bg-[#0A0A12] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Product</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase hidden md:table-cell">Seller</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase hidden lg:table-cell">Category</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Price</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase hidden lg:table-cell">Views</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Status</th>
                  <th className="text-right px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {filtered.map((product: any) => (
                  <tr key={product._id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/[0.03] flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4 text-white/20" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm text-white/70 font-medium">{product.title}</p>
                            {product.sellerVerified && <Shield className="w-3 h-3 text-nx-emerald" />}
                          </div>
                          <p className="text-[10px] text-white/25">{product.category}</p>
                        </div>
                      </div>
                      {expandedId === product._id && (
                        <div className="mt-3 ml-13 p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-1.5 text-[11px]">
                          <p className="text-white/40">Description: <span className="text-white/70">{product.description || "—"}</span></p>
                          <p className="text-white/40">Condition: <span className="text-white/70">{product.condition || "Not specified"}</span></p>
                          <p className="text-white/40">Escrow protection: <span className="text-white/70">{product.escrowProtection ? "Yes" : "No"}</span></p>
                          <p className="text-white/40">Transport: <span className="text-white/70">{product.transportAvailable ? `Available — KES ${(product.transportFee ?? 0).toLocaleString()} from ${product.originCounty}/${product.originTown}` : "Buyer pickup"}</span></p>
                          <p className="text-white/40">Favorites: <span className="text-white/70">{product.favorites ?? 0}</span></p>
                          <p className="text-white/40">Listed: <span className="text-white/70">{new Date(product.createdAt).toLocaleDateString()}</span></p>
                          <a href={`/product/${product._id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-nx-cyan hover:text-nx-cyan/80 mt-1">
                            Open public product page <ExternalLinkIcon className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <p className="text-xs text-white/50">{product.sellerName}</p>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <span className="text-[10px] text-white/30 px-2 py-0.5 rounded bg-white/[0.03]">{product.category}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-xs text-white/60 font-medium">KES {(product.price || 0).toLocaleString()}</p>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <p className="text-xs text-white/40">{product.views || 0}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${product.status === "active" ? "bg-nx-emerald/10 text-nx-emerald" : product.status === "paused" ? "bg-nx-gold/10 text-nx-gold" : product.status === "sold" ? "bg-white/5 text-white/30" : "bg-red-400/10 text-red-400"}`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setExpandedId(expandedId === product._id ? null : product._id)}
                          className="p-1.5 rounded text-white/20 hover:text-white/50 hover:bg-white/[0.03] transition-colors"
                          title={expandedId === product._id ? "Hide product details" : "View product details"}
                        >
                          {expandedId === product._id ? <ChevronUp className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        {product.status !== "sold" && product.status !== "removed" && (
                          <>
                            {product.status !== "active" && (
                              <button
                                disabled={acting === product._id}
                                className="p-1.5 rounded text-white/20 hover:text-nx-emerald hover:bg-nx-emerald/10 transition-colors disabled:opacity-40"
                                title="Approve / activate"
                                onClick={() => setStatus(product._id, "active")}
                              >
                                {acting === product._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                              </button>
                            )}
                            {product.status !== "paused" && (
                              <button
                                disabled={acting === product._id}
                                className="p-1.5 rounded text-white/20 hover:text-nx-gold hover:bg-nx-gold/10 transition-colors disabled:opacity-40"
                                title="Pause listing"
                                onClick={() => setStatus(product._id, "paused")}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {product.status !== "removed" && (
                              <button
                                disabled={acting === product._id}
                                className="p-1.5 rounded text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40"
                                title="Remove listing"
                                onClick={() => setStatus(product._id, "removed")}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
