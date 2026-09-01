import AdminLayout from "./AdminLayout";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Users, Package, ShoppingCart, DollarSign, Shield, Truck,
  TrendingUp, Eye, Loader2, AlertTriangle, MessageSquare, Scale,
} from "lucide-react";

export default function AdminDashboard() {
  const stats = useQuery(api.admin.getDashboardStats);
  const escrows = useQuery(api.admin.getAllEscrows);

  if (stats === undefined) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-nx-violet animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-sm text-white/40 mt-1">Real-time overview of Nexora Market operations</p>
        </div>

        {/* Primary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-nx-violet/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-nx-violet" />
              </div>
              <span className="text-xs text-white/40">Total Users</span>
            </div>
            <p className="text-xl font-bold text-white">{stats.users.total}</p>
            <p className="text-[11px] text-white/30 mt-1">
              {stats.users.buyers} buyers · {stats.users.sellers} sellers
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-400/10 flex items-center justify-center">
                <Package className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-xs text-white/40">Products</span>
            </div>
            <p className="text-xl font-bold text-white">{stats.products.total}</p>
            <p className="text-[11px] text-white/30 mt-1">
              {stats.products.active} active · {stats.products.pending} pending
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-nx-cyan/10 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-nx-cyan" />
              </div>
              <span className="text-xs text-white/40">GMV</span>
            </div>
            <p className="text-xl font-bold text-white">
              KES {stats.finance.totalGMV.toLocaleString()}
            </p>
            <p className="text-[11px] text-white/30 mt-1">
              Revenue: KES {stats.finance.platformRevenue.toLocaleString()}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-amber-400/10 flex items-center justify-center">
                <Shield className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-xs text-white/40">In Escrow</span>
            </div>
            <p className="text-xl font-bold text-white">
              KES {stats.finance.heldInEscrow.toLocaleString()}
            </p>
            <p className="text-[11px] text-white/30 mt-1">
              {stats.orders.active} active orders
            </p>
          </div>
        </div>

        {/* Secondary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-[11px] text-white/30 mb-1">Total Orders</p>
            <p className="text-lg font-bold text-white">{stats.orders.total}</p>
            <p className="text-[11px] text-white/30 mt-1">
              {stats.orders.newToday} new today
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-[11px] text-white/30 mb-1">Completed Orders</p>
            <p className="text-lg font-bold text-white">{stats.orders.completed}</p>
            <p className="text-[11px] text-white/30 mt-1">
              {stats.orders.disputed} disputed
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-[11px] text-white/30 mb-1">Open Disputes</p>
            <p className="text-lg font-bold text-white">{stats.disputes.open + stats.disputes.underReview}</p>
            <p className="text-[11px] text-white/30 mt-1">
              {stats.disputes.resolved} resolved
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-[11px] text-white/30 mb-1">Active Deliveries</p>
            <p className="text-lg font-bold text-white">{stats.delivery.inTransit}</p>
            <p className="text-[11px] text-white/30 mt-1">
              {stats.delivery.delivered} delivered
            </p>
          </div>
        </div>

        {/* Recent orders */}
        <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
          <h2 className="text-sm font-semibold text-white mb-4">Recent Orders</h2>
          {escrows === undefined ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-4 h-4 text-white/20 animate-spin" />
            </div>
          ) : escrows.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-8 h-8 text-white/10 mx-auto mb-2" />
              <p className="text-sm text-white/30">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {escrows.slice(0, 10).sort((a, b) => b.createdAt - a.createdAt).map((escrow) => (
                <div key={escrow._id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.01] border border-white/[0.03]">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.03] flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 text-white/20" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{escrow.title}</p>
                    <p className="text-[11px] text-white/30 capitalize">{escrow.status.replace(/_/g, " ")}</p>
                  </div>
                  <span className="text-sm font-medium text-white shrink-0">
                    KES {escrow.amount.toLocaleString()}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    escrow.status === "completed" || escrow.status === "released"
                      ? "text-emerald-400 bg-emerald-400/10"
                      : escrow.status === "disputed"
                      ? "text-red-400 bg-red-400/10"
                      : escrow.status === "refunded"
                      ? "text-amber-400 bg-amber-400/10"
                      : "text-nx-cyan bg-nx-cyan/10"
                  }`}>
                    {escrow.status.replace(/_/g, " ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Platform summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-nx-violet" />
              <span className="text-xs font-medium text-white/50">User Activity</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-white/30">New users today</span>
                <span className="text-white/60">{stats.users.newToday}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-white/30">Verified users</span>
                <span className="text-white/60">{stats.users.verified}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-white/30">Pending KYC</span>
                <span className="text-white/60">{stats.users.pendingKyc}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-medium text-white/50">Marketplace</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-white/30">New listings today</span>
                <span className="text-white/60">{stats.products.newToday}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-white/30">Total views</span>
                <span className="text-white/60">{stats.engagement.totalViews.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-white/30">Sold listings</span>
                <span className="text-white/60">{stats.products.sold}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-nx-cyan" />
              <span className="text-xs font-medium text-white/50">Engagement</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-white/30">Conversations</span>
                <span className="text-white/60">{stats.engagement.conversations}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-white/30">Reviews</span>
                <span className="text-white/60">{stats.engagement.reviews}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-white/30">Platform fee</span>
                <span className="text-white/60">3%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
