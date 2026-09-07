import AdminLayout from "./AdminLayout";
import { useQuery } from "convex/react";
import { useNavigate } from "react-router";
import { api } from "../../convex/_generated/api";
import {
  Users, Package, ShoppingCart, DollarSign, Shield,
  TrendingUp, AlertTriangle, MessageSquare, Loader2, Briefcase,
  Phone, Activity, Zap, Target, CheckCircle2,
} from "lucide-react";

export default function AdminDashboard() {
  const stats = useQuery(api.admin.getDashboardStats);
  const escrows = useQuery(api.admin.getAllEscrows);
  const navigate = useNavigate();

  if (!stats) return (
    <AdminLayout>
      <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-nx-violet animate-spin" /></div>
    </AdminLayout>
  );

  const userCount = stats.users?.total ?? 0;
  const buyerCount = stats.users?.buyers ?? 0;
  const sellerCount = stats.users?.sellers ?? 0;
  const freelancerCount = stats.users?.freelancers ?? 0;

  const totalGMV = stats.finance?.totalGMV ?? 0;
  const platformRevenue = stats.finance?.platformRevenue ?? 0;
  const heldInEscrow = stats.finance?.heldInEscrow ?? 0;
  const activeOrders = stats.orders?.active ?? 0;
  const totalOrders = stats.orders?.total ?? 0;
  const newToday = stats.orders?.newToday ?? 0;
  const completed = stats.orders?.completed ?? 0;
  const disputed = stats.orders?.disputed ?? 0;
  const openDisputes = stats.disputes?.open ?? 0;
  const resolved = stats.disputes?.resolved ?? 0;
  const inTransit = stats.delivery?.inTransit ?? 0;
  const delivered = stats.delivery?.delivered ?? 0;

  const freelanceProfiles = stats.freelance?.profiles ?? 0;
  const openTasks = stats.freelance?.openTasks ?? 0;
  const activeProjects = stats.freelance?.activeProjects ?? 0;
  const applications = stats.freelance?.applications ?? 0;

  const newTodayUsers = stats.users?.newToday ?? 0;
  const verified = stats.users?.verified ?? 0;
  const pendingKyc = stats.users?.pendingKyc ?? 0;
  const pendingSellers = stats.users?.pendingSellers ?? 0;
  const newTodayListings = stats.products?.newToday ?? 0;
  const productViews = stats.engagement?.totalViews ?? 0;
  const sold = stats.products?.sold ?? 0;
  const conversations = stats.engagement?.conversations ?? 0;
  const reviews = stats.engagement?.reviews ?? 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-sm text-white/40 mt-1">Real-time overview of Nexora Market</p>
        </div>

        {/* Status banner */}
        <div className="p-4 rounded-xl bg-emerald-400/5 border border-emerald-400/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-400/10 flex items-center justify-center">
            <Activity className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-400">All Systems Operational</p>
            <p className="text-xs text-white/30">AI monitoring active • Real-time data from database</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-nx-gold/10 border border-nx-gold/20">
              <p className="text-[10px] text-nx-gold font-medium">Admin AI Active</p>
              <p className="text-[9px] text-white/30">Monitoring platform</p>
            </div>
            <a
              href="https://wa.me/254769739216?text=Hello%20Nexora%20Admin"
              target="_blank"
              className="px-3 py-1.5 rounded-lg bg-nx-gold/10 border border-nx-gold/20 text-nx-gold hover:bg-nx-gold/20 transition-colors text-xs font-medium flex items-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5" /> WhatsApp
            </a>
          </div>
        </div>

        {/* Seller approval queue alert */}
        {pendingSellers > 0 && (
          <div className="p-4 rounded-xl bg-nx-gold/10 border border-nx-gold/25 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-nx-gold shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-nx-gold">
                {pendingSellers} seller{pendingSellers === 1 ? "" : "s"} awaiting approval
              </p>
              <p className="text-xs text-white/40">Approved sellers can publish products to the marketplace.</p>
            </div>
            <button
              onClick={() => navigate("/admin/kyc")}
              className="px-4 py-2 rounded-lg bg-nx-gold text-black text-xs font-semibold hover:bg-nx-gold/80 transition-colors shrink-0"
            >
              Review Now
            </button>
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Users", value: userCount, sub: `${buyerCount} buyers · ${sellerCount} sellers · ${freelancerCount} freelancers`, icon: Users, color: "nx-violet", bg: "bg-nx-violet/10", text: "text-nx-violet" },
            { label: "Products", value: stats.products?.total ?? 0, sub: `${stats.products?.active ?? 0} active · ${stats.products?.pending ?? 0} pending`, icon: Package, color: "emerald-400", bg: "bg-emerald-400/10", text: "text-emerald-400" },
            { label: "GMV", value: `KES ${totalGMV.toLocaleString()}`, sub: `Revenue: KES ${platformRevenue.toLocaleString()}`, icon: DollarSign, color: "nx-cyan", bg: "bg-nx-cyan/10", text: "text-nx-cyan" },
            { label: "In Escrow", value: `KES ${heldInEscrow.toLocaleString()}`, sub: `${activeOrders} active orders`, icon: Shield, color: "amber-400", bg: "bg-amber-400/10", text: "text-amber-400" },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`w-4 h-4 ${s.text}`} />
                </div>
                <span className="text-xs text-white/40">{s.label}</span>
              </div>
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-[11px] text-white/30 mt-1">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Secondary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Orders", value: totalOrders, sub: `${newToday} new today` },
            { label: "Completed", value: completed, sub: `${disputed} disputed` },
            { label: "Open Disputes", value: openDisputes, sub: `${resolved} resolved` },
            { label: "Active Deliveries", value: inTransit, sub: `${delivered} delivered` },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <p className="text-[11px] text-white/30 mb-1">{s.label}</p>
              <p className="text-lg font-bold text-white">{s.value}</p>
              <p className="text-[11px] text-white/30 mt-1">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Recent Orders */}
        <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
          <h2 className="text-sm font-semibold text-white mb-4">Recent Orders</h2>
          {escrows && escrows.length > 0 ? (
            <div className="space-y-2">
              {escrows.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 10).map((e: any) => (
                <div key={e._id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.01] border border-white/[0.03]">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.03] flex items-center justify-center"><ShoppingCart className="w-4 h-4 text-white/20" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{e.title || "Order"}</p>
                    <p className="text-[11px] text-white/30 capitalize">{e.status?.replace(/_/g, " ") || "unknown"}</p>
                  </div>
                  <span className="text-sm font-medium text-white shrink-0">KES {(e.amount || 0).toLocaleString()}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    ["released", "completed"].includes(e.status) ? "text-emerald-400 bg-emerald-400/10" :
                    e.status === "disputed" ? "text-red-400 bg-red-400/10" :
                    e.status === "refunded" ? "text-amber-400 bg-amber-400/10" :
                    "text-nx-cyan bg-nx-cyan/10"
                  }`}>{e.status?.replace(/_/g, " ") || ""}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8"><ShoppingCart className="w-8 h-8 text-white/10 mx-auto mb-2" /><p className="text-sm text-white/30">No orders yet</p></div>
          )}
        </div>

        {/* Freelance Marketplace */}
        {(freelanceProfiles > 0 || openTasks > 0 || activeProjects > 0 || applications > 0) && (
          <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="w-4 h-4 text-nx-violet" />
              <h2 className="text-sm font-semibold text-white">Freelance Marketplace</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Freelancers", value: freelanceProfiles },
                { label: "Open Jobs", value: openTasks },
                { label: "Active Projects", value: activeProjects },
                { label: "Applications", value: applications },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-[11px] text-white/30">{s.label}</p>
                  <p className="text-lg font-bold text-white mt-1">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* User Activity */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-nx-violet" />
              <span className="text-xs font-medium text-white/50">User Activity</span>
            </div>
            <div className="space-y-1.5">
              {[
                { label: "New today", value: newTodayUsers },
                { label: "Verified", value: verified },
                { label: "Pending KYC", value: pendingKyc },
              ].map((s) => (
                <div key={s.label} className="flex justify-between text-[11px]">
                  <span className="text-white/30">{s.label}</span>
                  <span className="text-white/60">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Marketplace */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-medium text-white/50">Marketplace</span>
            </div>
            <div className="space-y-1.5">
              {[
                { label: "New today", value: newTodayListings },
                { label: "Total views", value: productViews.toLocaleString() },
                { label: "Sold", value: sold },
              ].map((s) => (
                <div key={s.label} className="flex justify-between text-[11px]">
                  <span className="text-white/30">{s.label}</span>
                  <span className="text-white/60">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Engagement */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-nx-cyan" />
              <span className="text-xs font-medium text-white/50">Engagement</span>
            </div>
            <div className="space-y-1.5">
              {[
                { label: "Conversations", value: conversations },
                { label: "Reviews", value: reviews },
                { label: "Platform fee", value: "3%" },
              ].map((s) => (
                <div key={s.label} className="flex justify-between text-[11px]">
                  <span className="text-white/30">{s.label}</span>
                  <span className="text-white/60">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
