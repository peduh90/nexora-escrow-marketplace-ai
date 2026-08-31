import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useNavigate } from "react-router";
import AdminLayout from "./AdminLayout";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Users, ShoppingCart, Shield, Package, Truck,
  Scale, FileCheck, Zap, Activity, CreditCard, Eye, AlertTriangle,
} from "lucide-react";

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay }} className={className}>{children}</motion.div>
  );
}

const systemHealth = [
  { label: "API Response Time", value: "—" },
  { label: "Database", value: "—" },
  { label: "M-Pesa Gateway", value: "—" },
  { label: "AI Fraud Detection", value: "—" },
  { label: "CDN", value: "—" },
  { label: "Email Service", value: "—" },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const users = useQuery(api.users.getAllUsers);
  const listings = useQuery(api.users.getAllListings);
  const escrows = useQuery(api.users.getAllEscrows);

  const totalUsers = users?.length ?? 0;
  const buyers = users?.filter(u => u.role === "buyer")?.length ?? 0;
  const sellers = users?.filter(u => u.role === "seller")?.length ?? 0;
  const totalListings = listings?.length ?? 0;
  const activeListings = listings?.filter(l => l.status === "active")?.length ?? 0;
  const activeEscrows = escrows?.filter(e => e.status === "funded" || e.status === "active")?.length ?? 0;
  const totalEscrowValue = escrows?.filter(e => e.status === "funded" || e.status === "active")?.reduce((sum, e) => sum + e.amount, 0) ?? 0;
  const completedEscrows = escrows?.filter(e => e.status === "released" || e.status === "completed")?.length ?? 0;

  const statCards = [
    { label: "Total Users", value: totalUsers.toLocaleString(), sub: `${buyers} buyers · ${sellers} sellers`, icon: Users, color: "#8B5CF6" },
    { label: "Active Escrows", value: activeEscrows.toLocaleString(), sub: `KES ${totalEscrowValue.toLocaleString()} secured`, icon: Shield, color: "#06B6D4" },
    { label: "Total Listings", value: totalListings.toLocaleString(), sub: `${activeListings} active`, icon: Package, color: "#10B981" },
    { label: "Completed", value: completedEscrows.toLocaleString(), sub: "transactions completed", icon: CheckCircle2Icon, color: "#10B981" },
  ];

  return (
    <AdminLayout>
      <FadeIn>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
          <p className="text-sm text-white/40 mt-1">Real-time system monitoring and management</p>
        </div>
      </FadeIn>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statCards.map((stat, i) => (
          <FadeIn key={stat.label} delay={i * 0.05}>
            <div className="p-4 rounded-xl border border-white/5 bg-[#0A0A12] hover:border-white/10 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}12` }}>
                  <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
              </div>
              <p className="text-[10px] text-white/30 uppercase tracking-wider">{stat.label}</p>
              <p className="text-xl font-bold text-white mt-0.5">{stat.value}</p>
              {stat.sub && <p className="text-[10px] text-white/25 mt-1">{stat.sub}</p>}
            </div>
          </FadeIn>
        ))}
      </div>

      {/* Quick action buttons */}
      <FadeIn delay={0.1}>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
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
              <link.icon className="w-5 h-5 mb-2" style={{ color: link.color }} />
              <p className="text-xs font-medium text-white/60 group-hover:text-white transition-colors">{link.label}</p>
            </button>
          ))}
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* System Health */}
        <FadeIn delay={0.15}>
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
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                    <span className="text-[11px] text-white/30">{m.value}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-white/20 mt-3">Connect services to populate health data.</p>
          </div>
        </FadeIn>

        {/* Activity */}
        <FadeIn delay={0.2}>
          <div className="p-5 rounded-xl border border-white/5 bg-[#0A0A12] h-full">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-nx-gold" />
              <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
            </div>
            {activeEscrows === 0 && totalUsers <= 1 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-xl bg-white/[0.03] flex items-center justify-center mb-3">
                  <Activity className="w-5 h-5 text-white/15" />
                </div>
                <p className="text-sm text-white/30">No activity yet</p>
                <p className="text-[11px] text-white/15 mt-1">Activity will appear as users interact with the platform</p>
              </div>
            ) : (
              <div className="space-y-1">
                {users && users.length > 1 && (
                  <div className="flex items-center gap-3 p-2 rounded-lg">
                    <div className="w-1.5 h-1.5 rounded-full bg-nx-violet shrink-0" />
                    <p className="text-xs text-white/60">{users.length} registered users</p>
                  </div>
                )}
                {activeEscrows > 0 && (
                  <div className="flex items-center gap-3 p-2 rounded-lg">
                    <div className="w-1.5 h-1.5 rounded-full bg-nx-emerald shrink-0" />
                    <p className="text-xs text-white/60">{activeEscrows} active escrow transactions</p>
                  </div>
                )}
                {completedEscrows > 0 && (
                  <div className="flex items-center gap-3 p-2 rounded-lg">
                    <div className="w-1.5 h-1.5 rounded-full bg-nx-cyan shrink-0" />
                    <p className="text-xs text-white/60">{completedEscrows} completed transactions</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </FadeIn>
      </div>

      {/* KYC Pending */}
      <FadeIn delay={0.25}>
        <div className="rounded-xl border border-white/5 bg-[#0A0A12]">
          <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-nx-cyan" />
              <h3 className="text-sm font-semibold text-white">Pending KYC Reviews</h3>
            </div>
            <button onClick={() => navigate("/admin/kyc")} className="text-[11px] text-nx-cyan hover:text-nx-cyan/80 transition-colors">Review All →</button>
          </div>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-white/[0.03] flex items-center justify-center mb-3">
              <FileCheck className="w-5 h-5 text-white/15" />
            </div>
            <p className="text-sm text-white/30">No pending KYC applications</p>
            <p className="text-[11px] text-white/15 mt-1">Seller verification requests will appear here</p>
          </div>
        </div>
      </FadeIn>
    </AdminLayout>
  );
}

function CheckCircle2Icon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
