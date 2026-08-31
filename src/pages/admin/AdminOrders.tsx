import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import AdminLayout from "./AdminLayout";
import { ShoppingCart, Search, Eye } from "lucide-react";

export default function AdminOrders() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const escrows = useQuery(api.users.getAllEscrows);

  const orders = escrows ?? [];
  const filtered = orders.filter(e => {
    if (filter === "Active" && e.status !== "funded" && e.status !== "active") return false;
    if (filter === "Delivered" && e.status !== "released" && e.status !== "completed") return false;
    if (filter === "Disputed" && e.status !== "disputed") return false;
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Order Management</h1>
        <p className="text-sm text-white/40 mt-1">Monitor and manage all marketplace orders</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Total Orders", value: orders.length.toLocaleString() },
          { label: "Active", value: orders.filter(e => e.status === "funded" || e.status === "active").length.toLocaleString() },
          { label: "In Escrow", value: orders.filter(e => e.status === "funded").length.toLocaleString() },
          { label: "Delivered", value: orders.filter(e => e.status === "released" || e.status === "completed").length.toLocaleString() },
          { label: "Disputed", value: orders.filter(e => e.status === "disputed").length.toLocaleString() },
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

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-[#0A0A12] py-16 flex flex-col items-center">
          <ShoppingCart className="w-8 h-8 text-white/10 mb-3" />
          <p className="text-sm text-white/30">{search ? "No orders match your search" : "No orders yet"}</p>
          <p className="text-[11px] text-white/15 mt-1">Orders will appear here once buyers start purchasing</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/5 bg-[#0A0A12] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase tracking-wider">Order</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase tracking-wider">Amount</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase tracking-wider">Commission</th>
                  <th className="text-right px-4 py-3 text-[10px] font-medium text-white/30 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {filtered.map(order => (
                  <tr key={order._id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-white/70 font-medium">{order.title}</p>
                      <p className="text-[10px] text-white/25">{order.currency} {order.amount.toLocaleString()}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-xs text-white/60 font-medium">{order.currency} {order.amount.toLocaleString()}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                        order.status === "completed" || order.status === "released" ? "bg-nx-emerald/10 text-nx-emerald" :
                        order.status === "disputed" ? "bg-red-400/10 text-red-400" :
                        order.status === "refunded" ? "bg-nx-gold/10 text-nx-gold" :
                        "bg-nx-cyan/10 text-nx-cyan"
                      }`}>{order.status}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-[10px] text-white/30">{order.commissionRate}%</span>
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
      )}
    </AdminLayout>
  );
}
