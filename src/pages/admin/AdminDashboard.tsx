import AdminLayout from "./AdminLayout";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Users, Package, ShoppingCart, DollarSign, Shield, Truck,
  TrendingUp, AlertTriangle, MessageSquare, Loader2, Briefcase, Phone,
} from "lucide-react";

export default function AdminDashboard() {
  const stats = useQuery(api.admin.getDashboardStats);
  const escrows = useQuery(api.admin.getAllEscrows);

  if (!stats) return (
    <AdminLayout>
      <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-nx-violet animate-spin" /></div>
    </AdminLayout>
  );

  const statCards = [
    { label: "Total Users", value: stats.users.total, sub: `${stats.users.buyers} buyers · ${stats.users.sellers} sellers · ${stats.users.freelancers || 0} freelancers`, icon: Users, bgClass: "bg-nx-violet/10", textClass: "text-nx-violet" },
    { label: "Products", value: stats.products.total, sub: `${stats.products.active} active · ${stats.products.pending} pending`, icon: Package, bgClass: "bg-emerald-400/10", textClass: "text-emerald-400" },
    { label: "GMV", value: `KES ${stats.finance.totalGMV.toLocaleString()}`, sub: `Revenue: KES ${stats.finance.platformRevenue.toLocaleString()}`, icon: DollarSign, bgClass: "bg-nx-cyan/10", textClass: "text-nx-cyan" },
    { label: "In Escrow", value: `KES ${stats.finance.heldInEscrow.toLocaleString()}`, sub: `${stats.orders.active} active orders`, icon: Shield, bgClass: "bg-amber-400/10", textClass: "text-amber-400" },
  ];

  const secondaryCards = [
    { label: "Total Orders", value: stats.orders.total, sub: `${stats.orders.newToday} new today` },
    { label: "Completed", value: stats.orders.completed, sub: `${stats.orders.disputed} disputed` },
    { label: "Open Disputes", value: stats.disputes.open + stats.disputes.underReview, sub: `${stats.disputes.resolved} resolved` },
    { label: "Active Deliveries", value: stats.delivery.inTransit, sub: `${stats.delivery.delivered} delivered` },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-sm text-white/40 mt-1">Real-time overview of Nexora Market</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <div key={s.label} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-lg ${s.bgClass} flex items-center justify-center`}>
                  <s.icon className={`w-4 h-4 ${s.textClass}`} />
                </div>
                <span className="text-xs text-white/40">{s.label}</span>
              </div>
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-[11px] text-white/30 mt-1">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {secondaryCards.map((s) => (
            <div key={s.label} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <p className="text-[11px] text-white/30 mb-1">{s.label}</p>
              <p className="text-lg font-bold text-white">{s.value}</p>
              <p className="text-[11px] text-white/30 mt-1">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
          <h2 className="text-sm font-semibold text-white mb-4">Recent Orders</h2>
          {!escrows ? (
            <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 text-white/20 animate-spin" /></div>
          ) : escrows.length === 0 ? (
            <div className="text-center py-8"><ShoppingCart className="w-8 h-8 text-white/10 mx-auto mb-2" /><p className="text-sm text-white/30">No orders yet</p></div>
          ) : (
            <div className="space-y-2">
              {escrows.sort((a, b) => b.createdAt - a.createdAt).slice(0, 10).map((e) => (
                <div key={e._id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.01] border border-white/[0.03]">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.03] flex items-center justify-center"><ShoppingCart className="w-4 h-4 text-white/20" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{e.title}</p>
                    <p className="text-[11px] text-white/30 capitalize">{e.status.replace(/_/g, " ")}</p>
                  </div>
                  <span className="text-sm font-medium text-white shrink-0">KES {e.amount.toLocaleString()}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    ["released", "completed"].includes(e.status) ? "text-emerald-400 bg-emerald-400/10" :
                    e.status === "disputed" ? "text-red-400 bg-red-400/10" :
                    e.status === "refunded" ? "text-amber-400 bg-amber-400/10" :
                    "text-nx-cyan bg-nx-cyan/10"
                  }`}>{e.status.replace(/_/g, " ")}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Freelance Marketplace Stats */}
        {stats.freelance && (
          <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="w-4 h-4 text-nx-violet" />
              <h2 className="text-sm font-semibold text-white">Freelance Marketplace</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-[11px] text-white/30">Freelancers</p>
                <p className="text-lg font-bold text-white">{stats.freelance.profiles}</p>
              </div>
              <div>
                <p className="text-[11px] text-white/30">Open Jobs</p>
                <p className="text-lg font-bold text-white">{stats.freelance.openTasks}</p>
              </div>
              <div>
                <p className="text-[11px] text-white/30">Active Projects</p>
                <p className="text-lg font-bold text-white">{stats.freelance.activeProjects}</p>
              </div>
              <div>
                <p className="text-[11px] text-white/30">Applications</p>
                <p className="text-lg font-bold text-white">{stats.freelance.applications}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-nx-violet" /><span className="text-xs font-medium text-white/50">User Activity</span></div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px]"><span className="text-white/30">New today</span><span className="text-white/60">{stats.users.newToday}</span></div>
              <div className="flex justify-between text-[11px]"><span className="text-white/30">Verified</span><span className="text-white/60">{stats.users.verified}</span></div>
              <div className="flex justify-between text-[11px]"><span className="text-white/30">Pending KYC</span><span className="text-white/60">{stats.users.pendingKyc}</span></div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-2 mb-2"><Package className="w-4 h-4 text-emerald-400" /><span className="text-xs font-medium text-white/50">Marketplace</span></div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px]"><span className="text-white/30">New today</span><span className="text-white/60">{stats.products.newToday}</span></div>
              <div className="flex justify-between text-[11px]"><span className="text-white/30">Total views</span><span className="text-white/60">{stats.engagement.totalViews.toLocaleString()}</span></div>
              <div className="flex justify-between text-[11px]"><span className="text-white/30">Sold</span><span className="text-white/60">{stats.products.sold}</span></div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-2 mb-2"><MessageSquare className="w-4 h-4 text-nx-cyan" /><span className="text-xs font-medium text-white/50">Engagement</span></div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px]"><span className="text-white/30">Conversations</span><span className="text-white/60">{stats.engagement.conversations}</span></div>
              <div className="flex justify-between text-[11px]"><span className="text-white/30">Reviews</span><span className="text-white/60">{stats.engagement.reviews}</span></div>
              <div className="flex justify-between text-[11px]"><span className="text-white/30">Platform fee</span><span className="text-white/60">3%</span></div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-nx-gold/10 bg-nx-gold/[0.02]">
            <div className="flex items-center gap-2 mb-2"><Phone className="w-4 h-4 text-nx-gold" /><span className="text-xs font-medium text-white/50">Admin Contact</span></div>
            <div className="space-y-2">
              <button
                onClick={() => window.open(`https://wa.me/254769739216?text=Hello%20Nexora%20Admin`, '_blank')}
                className="w-full flex items-center gap-2 p-2 rounded-lg bg-nx-gold/5 border border-nx-gold/10 hover:bg-nx-gold/10 transition-colors text-left"
              >
                <Phone className="w-3.5 h-3.5 text-nx-gold" />
                <div>
                  <p className="text-xs text-nx-gold font-medium">WhatsApp Admin</p>
                  <p className="text-[10px] text-white/30">+254 769 739 216</p>
                </div>
              </button>
              <p className="text-[10px] text-white/20 text-center">Admin AI is active and monitoring the platform</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
