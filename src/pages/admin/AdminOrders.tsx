import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { ShoppingCart, Search, Eye, Package, Truck, CheckCircle2, XCircle } from "lucide-react";

const sampleOrders = [
  { id: "ORD-2901", product: "HP EliteBook 840 G3", buyer: "Edwin Kamau", seller: "TechZone Kenya", amount: "KES 22,000", escrow: "KES 22,000", delivery: "In Transit", payment: "Paid", date: "Apr 5, 2025" },
  { id: "ORD-2900", product: "Samsung Galaxy S23", buyer: "Peter Mwangi", seller: "PhoneWorld", amount: "KES 45,000", escrow: "KES 45,000", delivery: "Picked Up", payment: "Paid", date: "Apr 5, 2025" },
  { id: "ORD-2899", product: "Nike Air Max 90", buyer: "Lucy Wambui", seller: "FashionHub KE", amount: "KES 8,500", escrow: "KES 8,500", delivery: "Delivered", payment: "Paid", date: "Apr 4, 2025" },
  { id: "ORD-2898", product: "MacBook Pro M3", buyer: "Michael Chen", seller: "TechZone Kenya", amount: "KES 185,000", escrow: "KES 185,000", delivery: "Preparing", payment: "Paid", date: "Apr 4, 2025" },
  { id: "ORD-2897", product: "Toyota Vitz 2019", buyer: "James Odhiambo", seller: "AutoHub Kenya", amount: "KES 1,450,000", escrow: "KES 1,450,000", delivery: "Pending", payment: "Paid", date: "Apr 3, 2025" },
  { id: "ORD-2896", product: "2BR Apartment Westlands", buyer: "Grace Njeri", seller: "PropertyLink KE", amount: "KES 45,000", escrow: "KES 45,000", delivery: "N/A", payment: "Paid", date: "Apr 3, 2025" },
];

export default function AdminOrders() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Order Management</h1>
        <p className="text-sm text-white/40 mt-1">Monitor and manage all marketplace orders</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Total Orders", value: "12,847", color: "#8B5CF6" },
          { label: "Active", value: "2,156", color: "#06B6D4" },
          { label: "In Escrow", value: "1,893", color: "#F59E0B" },
          { label: "Delivered Today", value: "342", color: "#10B981" },
          { label: "Disputed", value: "23", color: "#EF4444" },
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#0A0A12] border border-white/5 text-sm text-white placeholder-white/20 focus:border-nx-violet/30 focus:outline-none" />
        </div>
        <div className="flex gap-1">
          {["All", "Active", "Delivered", "Disputed"].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${filter === f ? "bg-nx-violet/10 text-nx-violet" : "text-white/30 hover:text-white/50 bg-[#0A0A12] border border-white/5"}`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/5 bg-[#0A0A12] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase tracking-wider">Order</th>
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase tracking-wider hidden md:table-cell">Buyer</th>
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase tracking-wider hidden lg:table-cell">Seller</th>
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase tracking-wider">Amount</th>
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase tracking-wider hidden lg:table-cell">Escrow</th>
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase tracking-wider">Delivery</th>
                <th className="text-right px-4 py-3 text-[10px] font-medium text-white/30 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {sampleOrders.map(order => (
                <tr key={order.id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="px-4 py-3.5">
                    <div>
                      <p className="text-sm text-white/70 font-medium">{order.id}</p>
                      <p className="text-[10px] text-white/25 truncate max-w-[180px]">{order.product}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <p className="text-xs text-white/50">{order.buyer}</p>
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <p className="text-xs text-white/50">{order.seller}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-xs text-white/60 font-medium">{order.amount}</p>
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-nx-gold/10 text-nx-gold font-medium">{order.escrow}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${order.delivery === "Delivered" ? "bg-nx-emerald/10 text-nx-emerald" : order.delivery === "In Transit" ? "bg-nx-cyan/10 text-nx-cyan" : order.delivery === "Pending" ? "bg-nx-gold/10 text-nx-gold" : order.delivery === "Preparing" ? "bg-nx-violet/10 text-nx-violet" : "bg-white/5 text-white/30"}`}>
                      {order.delivery}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button className="p-1.5 rounded text-white/20 hover:text-white/50 hover:bg-white/[0.03] transition-colors"><Eye className="w-3.5 h-3.5" /></button>
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
