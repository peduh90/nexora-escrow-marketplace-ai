import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useNavigate } from "react-router";
import AdminLayout from "./AdminLayout";
import {
  Users, ShoppingCart, Shield, TrendingUp, AlertTriangle,
  Activity, BarChart3, FileCheck, Zap, Eye, ArrowUpRight,
  ArrowDownLeft, Wallet, CreditCard, Package, Truck, Brain,
  Scale, Globe, Clock, CheckCircle2, XCircle, MessageSquare,
} from "lucide-react";

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay }} className={className}>{children}</motion.div>
  );
}

const platformStats = [
  { label: "Total Users", value: "52,847", change: "+1,247 this month", icon: Users, color: "#8B5CF6", trend: "+8.2%" },
  { label: "Active Escrows", value: "1,893", change: "KES 2.4B secured", icon: Shield, color: "#06B6D4", trend: "+12.5%" },
  { label: "Monthly Revenue", value: "KES 18.5M", change: "+23% vs last month", icon: TrendingUp, color: "#10B981", trend: "+23%" },
  { label: "Fraud Attempts", value: "3", change: "99.8% blocked", icon: AlertTriangle, color: "#F59E0B", trend: "-40%" },
];

const financialStats = [
  { label: "Total Revenue", value: "KES 142.8M", sub: "Since launch", icon: TrendingUp, color: "#10B981" },
  { label: "Platform Fees", value: "KES 7.14M", sub: "5% avg commission", icon: CreditCard, color: "#8B5CF6" },
  { label: "Escrow Balance", value: "KES 48.3M", sub: "Currently secured", icon: Shield, color: "#06B6D4" },
  { label: "Pending Withdrawals", value: "KES 12.7M", sub: "8 requests pending", icon: Wallet, color: "#F59E0B" },
];

const marketplaceStats = [
  { label: "Active Products", value: "8,432", icon: Package, color: "#8B5CF6" },
  { label: "Pending Moderation", value: "47", icon: Eye, color: "#F59E0B" },
  { label: "Active Orders", value: "2,156", icon: ShoppingCart, color: "#06B6D4" },
  { label: "Deliveries Today", value: "342", icon: Truck, color: "#10B981" },
];

const recentActivity = [
  { type: "user", event: "New seller registered — TechHub Electronics", time: "2 min ago", color: "#8B5CF6" },
  { type: "kyc", event: "KYC application submitted — Sarah Wanjiku", time: "5 min ago", color: "#06B6D4" },
  { type: "escrow", event: "Escrow TXN-4829 created — KES 85,000", time: "8 min ago", color: "#10B981" },
  { type: "fraud", event: "Suspicious pattern detected — flagged for review", time: "12 min ago", color: "#EF4444" },
  { type: "dispute", event: "Dispute DSP-182 — AI recommendation sent", time: "18 min ago", color: "#F59E0B" },
  { type: "payment", event: "KES 195,000 released — TXN-4825", time: "22 min ago", color: "#10B981" },
  { type: "user", event: "New buyer registered — Peter Mwangi", time: "30 min ago", color: "#8B5CF6" },
  { type: "delivery", event: "Shipment confirmed — ORD-290", time: "35 min ago", color: "#06B6D4" },
  { type: "order", event: "New order placed — KES 34,500", time: "42 min ago", color: "#8B5CF6" },
  { type: "review", event: "5-star review left for TechZone Kenya", time: "1 hour ago", color: "#F59E0B" },
];

const kycPending = [
  { name: "Sarah Wanjiku", business: "Wanjiku Traders", type: "Sole Proprietor", county: "Nairobi", submitted: "2 hours ago", docs: 4 },
  { name: "James Odhiambo", business: "Odhiambo Farm Supplies", type: "Partnership", county: "Kisumu", submitted: "5 hours ago", docs: 3 },
  { name: "Grace Njeri", business: "Grace Fashion House", type: "Individual", county: "Nakuru", submitted: "1 day ago", docs: 5 },
  { name: "Peter Kimani", business: "Kimani Electronics", type: "Limited Company", county: "Kiambu", submitted: "1 day ago", docs: 6 },
];

const systemHealth = [
  { label: "API Response Time", value: "45ms", status: "good" },
  { label: "Database", value: "99.99% uptime", status: "good" },
  { label: "AI Models", value: "All operational", status: "good" },
  { label: "Payment Gateway", value: "M-Pesa: Active", status: "good" },
  { label: "Stripe", value: "Active", status: "good" },
  { label: "CDN", value: "CloudFront: Active", status: "good" },
  { label: "Fraud Detection", value: "v2.4.1", status: "good" },
  { label: "Email Service", value: "SendGrid: Active", status: "good" },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [chartPeriod, setChartPeriod] = useState("30D");

  return (
    <AdminLayout>
      <FadeIn>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
          <p className="text-sm text-white/40 mt-1">Real-time system monitoring and management</p>
        </div>
      </FadeIn>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {platformStats.map((stat, i) => (
          <FadeIn key={stat.label} delay={i * 0.05}>
            <div className="p-4 rounded-xl border border-white/5 bg-[#0A0A12] hover:border-white/10 transition-all cursor-pointer group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}12` }}>
                  <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${stat.trend?.startsWith("+") && stat.label !== "Fraud Attempts" ? "bg-nx-emerald/10 text-nx-emerald" : stat.trend?.startsWith("-") ? "bg-nx-emerald/10 text-nx-emerald" : "bg-white/5 text-white/30"}`}>
                  {stat.trend}
                </span>
              </div>
              <p className="text-[10px] text-white/30 uppercase tracking-wider">{stat.label}</p>
              <p className="text-xl font-bold text-white mt-0.5">{stat.value}</p>
              <p className="text-[10px] text-white/25 mt-1">{stat.change}</p>
            </div>
          </FadeIn>
        ))}
      </div>

      {/* Financial Summary */}
      <FadeIn delay={0.06}>
        <div className="mb-6 p-5 rounded-xl border border-white/5 bg-[#0A0A12]">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4 text-nx-violet" />
            <h3 className="text-sm font-semibold text-white">Financial Overview</h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {financialStats.map((stat) => (
              <div key={stat.label} className="p-3 rounded-lg bg-white/[0.02]">
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
                  <span className="text-[10px] text-white/30 uppercase">{stat.label}</span>
                </div>
                <p className="text-lg font-bold text-white">{stat.value}</p>
                <p className="text-[10px] text-white/25 mt-0.5">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* Marketplace Stats */}
      <FadeIn delay={0.08}>
        <div className="mb-6 p-5 rounded-xl border border-white/5 bg-[#0A0A12]">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-4 h-4 text-nx-cyan" />
            <h3 className="text-sm font-semibold text-white">Marketplace Activity</h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {marketplaceStats.map((stat) => (
              <div key={stat.label} className="p-3 rounded-lg bg-white/[0.02] flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}12` }}>
                  <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
                <div>
                  <p className="text-base font-bold text-white">{stat.value}</p>
                  <p className="text-[10px] text-white/30">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* System Health */}
        <FadeIn delay={0.1}>
          <div className="p-5 rounded-xl border border-white/5 bg-[#0A0A12] h-full">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-nx-emerald" />
              <h3 className="text-sm font-semibold text-white">System Health</h3>
            </div>
            <div className="space-y-2.5">
              {systemHealth.map((m) => (
                <div key={m.label} className="flex items-center justify-between py-1.5 border-b border-white/[0.02] last:border-0">
                  <span className="text-xs text-white/40">{m.label}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-nx-emerald" />
                    <span className="text-[11px] text-white/50">{m.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Activity Feed */}
        <FadeIn delay={0.12} className="lg:col-span-2">
          <div className="p-5 rounded-xl border border-white/5 bg-[#0A0A12] h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-nx-gold" />
                <h3 className="text-sm font-semibold text-white">Live Activity Feed</h3>
              </div>
              <span className="text-[10px] text-white/20">Real-time</span>
            </div>
            <div className="space-y-0.5 max-h-[360px] overflow-y-auto scrollbar-thin">
              {recentActivity.map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.03 }}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.015] transition-colors cursor-pointer">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: item.color }} />
                  <p className="text-xs text-white/60 flex-1 truncate">{item.event}</p>
                  <span className="text-[10px] text-white/20 shrink-0">{item.time}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>

      {/* KYC Pending Reviews */}
      <FadeIn delay={0.15}>
        <div className="rounded-xl border border-white/5 bg-[#0A0A12] mb-6">
          <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-nx-cyan" />
              <h3 className="text-sm font-semibold text-white">Pending KYC Reviews</h3>
              <span className="text-[10px] text-nx-gold bg-nx-gold/10 px-1.5 py-0.5 rounded font-medium">{kycPending.length}</span>
            </div>
            <button onClick={() => navigate("/admin/kyc")} className="text-[11px] text-nx-cyan hover:text-nx-cyan/80 transition-colors">Review All →</button>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {kycPending.map((app, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 + i * 0.05 }}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.01] transition-colors cursor-pointer">
                <div className="w-9 h-9 rounded-full bg-nx-violet/15 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-nx-violet">{app.name.split(" ").map(n => n[0]).join("")}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/70 font-medium">{app.name}</p>
                  <p className="text-[11px] text-white/30">{app.business} · {app.type} · {app.county}</p>
                </div>
                <div className="text-right shrink-0 hidden sm:block">
                  <span className="text-[10px] text-white/20">{app.submitted}</span>
                  <p className="text-[10px] text-white/15">{app.docs} documents</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button className="px-3 py-1.5 rounded text-[10px] font-medium bg-nx-emerald/10 text-nx-emerald hover:bg-nx-emerald/20 transition-colors">Approve</button>
                  <button className="px-3 py-1.5 rounded text-[10px] font-medium bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors">Reject</button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* Revenue Chart */}
      <FadeIn delay={0.2}>
        <div className="p-5 rounded-xl border border-white/5 bg-[#0A0A12] mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-nx-violet" />
              <h3 className="text-sm font-semibold text-white">Revenue Overview</h3>
            </div>
            <div className="flex gap-1 text-[11px]">
              {["7D", "30D", "90D", "1Y"].map((p) => (
                <button key={p} onClick={() => setChartPeriod(p)} className={`px-2.5 py-1 rounded ${chartPeriod === p ? "bg-nx-violet/10 text-nx-violet" : "text-white/20 hover:text-white/40"}`}>{p}</button>
              ))}
            </div>
          </div>
          <div className="flex items-end gap-1 h-44">
            {[35, 42, 28, 55, 48, 62, 71, 58, 83, 76, 90, 85, 92, 78, 95, 88, 97, 82, 91, 100, 87, 93, 89, 96].map((h, i) => (
              <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ duration: 0.4, delay: 0.3 + i * 0.015 }}
                className="flex-1 rounded-t-sm min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
                style={{ background: h > 85 ? "linear-gradient(to top, rgba(139,92,246,0.3), rgba(139,92,246,0.6))" : h > 60 ? "linear-gradient(to top, rgba(6,182,212,0.2), rgba(6,182,212,0.4))" : "linear-gradient(to top, rgba(255,255,255,0.03), rgba(255,255,255,0.08))" }}
                title={`Day ${i + 1}: KES ${Math.round(h * 185)}K`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between mt-3 text-[10px] text-white/20">
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </div>
      </FadeIn>

      {/* Quick Links */}
      <FadeIn delay={0.25}>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: "Manage Users", path: "/admin/users", icon: Users, color: "#8B5CF6" },
            { label: "Products", path: "/admin/products", icon: Package, color: "#06B6D4" },
            { label: "Orders", path: "/admin/orders", icon: ShoppingCart, color: "#10B981" },
            { label: "Escrow", path: "/admin/escrow", icon: Shield, color: "#F59E0B" },
            { label: "Deliveries", path: "/admin/deliveries", icon: Truck, color: "#EC4899" },
            { label: "Disputes", path: "/admin/disputes", icon: Scale, color: "#EF4444" },
          ].map((link) => (
            <button key={link.label} onClick={() => navigate(link.path)}
              className="p-4 rounded-xl border border-white/5 bg-[#0A0A12] hover:border-white/10 transition-all text-left group">
              <link.icon className="w-5 h-5 mb-2 transition-colors" style={{ color: link.color }} />
              <p className="text-xs font-medium text-white/60 group-hover:text-white transition-colors">{link.label}</p>
            </button>
          ))}
        </div>
      </FadeIn>
    </AdminLayout>
  );
}
