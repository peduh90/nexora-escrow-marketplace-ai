import AdminLayout from "./AdminLayout";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Users, Package, ShoppingCart, DollarSign, Shield, AlertTriangle,
  TrendingUp, Eye, Loader2,
} from "lucide-react";

export default function AdminDashboard() {
  const users = useQuery(api.users.getAllUsers);
  const listings = useQuery(api.users.getAllListings);
  const escrows = useQuery(api.users.getAllEscrows);

  if (users === undefined || listings === undefined || escrows === undefined) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-nx-violet animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  const buyers = users.filter((u) => u.role === "buyer");
  const sellers = users.filter((u) => u.role === "seller");
  const activeListings = listings.filter((l) => l.status === "active");
  const totalGMV = escrows.reduce((sum, e) => sum + e.amount, 0);
  const platformRevenue = escrows
    .filter((e) => ["released", "completed"].includes(e.status))
    .reduce((sum, e) => sum + (e.platformFee || 0), 0);
  const pendingEscrow = escrows
    .filter((e) => ["funded", "active", "delivery", "inspection"].includes(e.status))
    .reduce((sum, e) => sum + e.amount, 0);
  const disputes = escrows.filter((e) => e.status === "disputed");
  const totalViews = listings.reduce((sum, l) => sum + l.views, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-sm text-white/40 mt-1">Overview of Nexora Market operations</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-nx-violet/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-nx-violet" />
              </div>
              <span className="text-xs text-white/40">Total Users</span>
            </div>
            <p className="text-xl font-bold text-white">{users.length}</p>
            <p className="text-[11px] text-white/30 mt-1">{buyers.length} buyers · {sellers.length} sellers</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-400/10 flex items-center justify-center">
                <Package className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-xs text-white/40">Products</span>
            </div>
            <p className="text-xl font-bold text-white">{listings.length}</p>
            <p className="text-[11px] text-white/30 mt-1">{activeListings.length} active</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-nx-cyan/10 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-nx-cyan" />
              </div>
              <span className="text-xs text-white/40">GMV</span>
            </div>
            <p className="text-xl font-bold text-white">KES {totalGMV.toLocaleString()}</p>
            <p className="text-[11px] text-white/30 mt-1">Revenue: KES {platformRevenue.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-amber-400/10 flex items-center justify-center">
                <Shield className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-xs text-white/40">In Escrow</span>
            </div>
            <p className="text-xl font-bold text-white">KES {pendingEscrow.toLocaleString()}</p>
            <p className="text-[11px] text-white/30 mt-1">{disputes.length} disputes</p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-[11px] text-white/30 mb-1">Total Orders</p>
            <p className="text-lg font-bold text-white">{escrows.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-[11px] text-white/30 mb-1">Completed Orders</p>
            <p className="text-lg font-bold text-white">
              {escrows.filter((e) => ["released", "completed"].includes(e.status)).length}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-[11px] text-white/30 mb-1">Total Views</p>
            <p className="text-lg font-bold text-white">{totalViews.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-[11px] text-white/30 mb-1">Platform Fee Rate</p>
            <p className="text-lg font-bold text-white">3%</p>
          </div>
        </div>

        {/* Recent activity */}
        <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
          <h2 className="text-sm font-semibold text-white mb-4">Recent Orders</h2>
          {escrows.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-8 h-8 text-white/10 mx-auto mb-2" />
              <p className="text-sm text-white/30">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {escrows.slice(0, 5).map((escrow) => (
                <div key={escrow._id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.01] border border-white/[0.03]">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.03] flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 text-white/20" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{escrow.title}</p>
                    <p className="text-[11px] text-white/30 capitalize">{escrow.status}</p>
                  </div>
                  <span className="text-sm font-medium text-white shrink-0">KES {escrow.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
