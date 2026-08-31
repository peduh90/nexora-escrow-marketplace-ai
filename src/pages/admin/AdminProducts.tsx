import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { Package, Search, Eye, CheckCircle2, XCircle, Trash2, Star, Flag, Shield } from "lucide-react";

const sampleProducts = [
  { id: "PRD-001", title: "HP EliteBook 840 G3", seller: "TechZone Kenya", price: "KES 22,000", category: "Electronics", status: "Published", views: 2450, orders: 8, reported: false, verified: true },
  { id: "PRD-002", title: "Toyota Vitz 2019", seller: "AutoHub Kenya", price: "KES 1,450,000", category: "Vehicles", status: "Published", views: 5600, orders: 1, reported: false, verified: true },
  { id: "PRD-003", title: "Samsung Galaxy S23", seller: "PhoneWorld", price: "KES 45,000", category: "Phones & Tablets", status: "Pending Review", views: 0, orders: 0, reported: false, verified: true },
  { id: "PRD-004", title: "Nike Air Max 90", seller: "FashionHub KE", price: "KES 8,500", category: "Fashion", status: "Published", views: 1200, orders: 15, reported: true, verified: true },
  { id: "PRD-005", title: "Counterfeit iPhone Charger", seller: "CheapDeals254", price: "KES 500", category: "Electronics", status: "Suspended", views: 340, orders: 0, reported: true, verified: false },
  { id: "PRD-006", title: "MacBook Pro M3", seller: "TechZone Kenya", price: "KES 185,000", category: "Electronics", status: "Published", views: 8900, orders: 3, reported: false, verified: true },
  { id: "PRD-007", title: "2BR Apartment Westlands", seller: "PropertyLink KE", price: "KES 45,000/mo", category: "Property", status: "Published", views: 3200, orders: 0, reported: false, verified: true },
  { id: "PRD-008", title: "Fake designer bags", seller: "LuxForLess", price: "KES 2,000", category: "Fashion", status: "Rejected", views: 89, orders: 0, reported: true, verified: false },
];

export default function AdminProducts() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = sampleProducts.filter(p => {
    if (filter === "Published" && p.status !== "Published") return false;
    if (filter === "Pending" && p.status !== "Pending Review") return false;
    if (filter === "Suspended" && p.status !== "Suspended" && p.status !== "Rejected") return false;
    if (filter === "Reported" && !p.reported) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.seller.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Product Moderation</h1>
        <p className="text-sm text-white/40 mt-1">Review, approve, and manage all marketplace listings</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Products", value: "8,432" },
          { label: "Pending Review", value: "47" },
          { label: "Reported", value: "12" },
          { label: "Suspended", value: "8" },
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products or sellers..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#0A0A12] border border-white/5 text-sm text-white placeholder-white/20 focus:border-nx-violet/30 focus:outline-none" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {["All", "Published", "Pending", "Reported", "Suspended"].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${filter === f ? "bg-nx-violet/10 text-nx-violet" : "text-white/30 hover:text-white/50 bg-[#0A0A12] border border-white/5"}`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/5 bg-[#0A0A12] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase tracking-wider">Product</th>
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase tracking-wider hidden md:table-cell">Seller</th>
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase tracking-wider hidden lg:table-cell">Category</th>
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase tracking-wider">Price</th>
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase tracking-wider hidden lg:table-cell">Views</th>
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-[10px] font-medium text-white/30 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {filtered.map(product => (
                <tr key={product.id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/[0.03] flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4 text-white/20" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm text-white/70 font-medium">{product.title}</p>
                          {product.reported && <Flag className="w-3 h-3 text-red-400" />}
                          {product.verified && <Shield className="w-3 h-3 text-nx-emerald" />}
                        </div>
                        <p className="text-[10px] text-white/25">{product.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <p className="text-xs text-white/50">{product.seller}</p>
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <span className="text-[10px] text-white/30 px-2 py-0.5 rounded bg-white/[0.03]">{product.category}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-xs text-white/60 font-medium">{product.price}</p>
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <p className="text-xs text-white/40">{product.views.toLocaleString()}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${product.status === "Published" ? "bg-nx-emerald/10 text-nx-emerald" : product.status === "Pending Review" ? "bg-nx-gold/10 text-nx-gold" : product.status === "Suspended" ? "bg-red-400/10 text-red-400" : "bg-white/5 text-white/30"}`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 rounded text-white/20 hover:text-white/50 hover:bg-white/[0.03] transition-colors" title="View"><Eye className="w-3.5 h-3.5" /></button>
                      {product.status === "Pending Review" && (
                        <>
                          <button className="p-1.5 rounded text-white/20 hover:text-nx-emerald hover:bg-nx-emerald/5 transition-colors" title="Approve"><CheckCircle2 className="w-3.5 h-3.5" /></button>
                          <button className="p-1.5 rounded text-white/20 hover:text-red-400 hover:bg-red-400/5 transition-colors" title="Reject"><XCircle className="w-3.5 h-3.5" /></button>
                        </>
                      )}
                      <button className="p-1.5 rounded text-white/20 hover:text-red-400 hover:bg-red-400/5 transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
