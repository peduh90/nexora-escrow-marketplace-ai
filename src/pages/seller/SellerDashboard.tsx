import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import SellerSidebar from "./SellerSidebar";
import {
  TrendingUp,
  Package,
  ShoppingCart,
  Wallet,
  Shield,
  Star,
  Eye,
  Plus,
  ChevronRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Brain,
  Truck,
} from "lucide-react";

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay }} className={className}>{children}</motion.div>
  );
}

const recentOrders = [
  { id: "ORD-291", buyer: "James Odhiambo", product: "Samsung Galaxy S24", amount: 145000, status: "pending", time: "5 min ago" },
  { id: "ORD-290", buyer: "Sarah Wanjiku", product: "Organic Coffee 50kg", amount: 85000, status: "shipped", time: "1 hr ago" },
  { id: "ORD-289", buyer: "Michael Kipchoge", product: "Web Dev Service", amount: 250000, status: "completed", time: "3 hr ago" },
  { id: "ORD-288", buyer: "Grace Njeri", product: "Nike Air Max 2025", amount: 18500, status: "delivered", time: "5 hr ago" },
  { id: "ORD-287", buyer: "Peter Mwangi", product: "Bulk Maize 5T", amount: 320000, status: "in_escrow", time: "1 day ago" },
];

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending", color: "text-nx-gold", bg: "bg-nx-gold/10" },
  shipped: { label: "Shipped", color: "text-nx-cyan", bg: "bg-nx-cyan/10" },
  delivered: { label: "Delivered", color: "text-nx-violet", bg: "bg-nx-violet/10" },
  completed: { label: "Completed", color: "text-nx-emerald", bg: "bg-nx-emerald/10" },
  in_escrow: { label: "In Escrow", color: "text-nx-cyan", bg: "bg-nx-cyan/10" },
  disputed: { label: "Disputed", color: "text-red-400", bg: "bg-red-400/10" },
};

export default function SellerDashboard() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-background">
      <SellerSidebar />
      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        <div className="sticky top-0 z-30 h-14 bg-[#08080F]/80 backdrop-blur-xl border-b border-white/5 flex items-center px-4 md:px-6 justify-between">
          <h2 className="text-sm font-semibold text-white">Seller Dashboard</h2>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-nx-emerald bg-nx-emerald/10 px-2 py-0.5 rounded-full font-medium">● Online</span>
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-6">
          <FadeIn>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-white/40 mb-1">Welcome back</p>
                <h1 className="text-2xl font-bold text-white">{user?.businessName || user?.name || "Seller"}</h1>
                <p className="text-xs text-white/30 mt-1">Here's your store overview</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-nx-violet text-white text-sm font-medium hover:bg-nx-violet/80 transition-colors self-start">
                <Plus className="w-4 h-4" /> Add Product
              </button>
            </div>
          </FadeIn>

          {/* KYC Banner */}
          <FadeIn delay={0.03}>
            <div className="p-4 rounded-xl border border-nx-emerald/15 bg-nx-emerald/[0.03] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-nx-emerald/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-nx-emerald" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-nx-emerald">Business Verified</p>
                  <p className="text-[11px] text-white/30">Your KYC verification is approved. You have full access.</p>
                </div>
              </div>
              <button className="text-[11px] text-nx-violet hover:text-nx-violet/80 flex items-center gap-1 transition-colors">
                View Details <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </FadeIn>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: "Total Revenue", value: "KES 2.4M", icon: TrendingUp, color: "#8B5CF6", change: "+18%" },
              { label: "Active Orders", value: "12", icon: ShoppingCart, color: "#06B6D4", change: "+3" },
              { label: "Products", value: "48", icon: Package, color: "#10B981", change: "+5" },
              { label: "Available Balance", value: "KES 680K", icon: Wallet, color: "#F59E0B", change: "Ready" },
              { label: "Reputation", value: "4.8★", icon: Star, color: "#EC4899", change: "Excellent" },
            ].map((s, i) => (
              <FadeIn key={s.label} delay={i * 0.04}>
                <div className="p-4 rounded-xl border border-white/5 bg-nx-surface/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${s.color}12` }}>
                      <s.icon className="w-4 h-4" style={{ color: s.color }} />
                    </div>
                    <span className="text-[9px] text-nx-emerald bg-nx-emerald/10 px-1.5 py-0.5 rounded">{s.change}</span>
                  </div>
                  <p className="text-[10px] text-white/30">{s.label}</p>
                  <p className="text-lg font-bold text-white">{s.value}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* AI Risk Panel */}
            <FadeIn delay={0.1}>
              <div className="p-5 rounded-xl border border-white/5 bg-nx-surface/50 h-full">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-4 h-4 text-nx-violet" />
                  <h3 className="text-sm font-semibold text-white">Store Intelligence</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Order Success Rate", value: "98.5%", color: "#10B981" },
                    { label: "Avg Delivery Time", value: "2.3 days", color: "#06B6D4" },
                    { label: "Buyer Satisfaction", value: "97.2%", color: "#8B5CF6" },
                    { label: "Dispute Rate", value: "0.3%", color: "#F59E0B" },
                    { label: "AI Fraud Risk", value: "Low", color: "#10B981" },
                  ].map((m) => (
                    <div key={m.label} className="flex items-center justify-between">
                      <span className="text-xs text-white/40">{m.label}</span>
                      <span className="text-xs font-semibold" style={{ color: m.color }}>{m.value}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-nx-emerald/60 mt-4 text-center">Store health is excellent</p>
              </div>
            </FadeIn>

            {/* Recent Orders */}
            <FadeIn delay={0.15} className="lg:col-span-2">
              <div className="p-5 rounded-xl border border-white/5 bg-nx-surface/50 h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white">Recent Orders</h3>
                  <button className="text-[11px] text-nx-violet flex items-center gap-1 hover:text-nx-violet/80 transition-colors">View All <ChevronRight className="w-3 h-3" /></button>
                </div>
                <div className="space-y-1">
                  {recentOrders.map((order, i) => {
                    const st = statusMap[order.status];
                    return (
                      <motion.div key={order.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.04 }}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.02] transition-colors cursor-pointer">
                        <div className="w-8 h-8 rounded-lg bg-white/[0.03] flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4 text-white/30" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-white truncate">{order.product}</span>
                            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${st.color} ${st.bg}`}>{st.label}</span>
                          </div>
                          <p className="text-[11px] text-white/30">{order.buyer} · {order.id}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-semibold text-white">KES {order.amount.toLocaleString()}</p>
                          <p className="text-[10px] text-white/20">{order.time}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </FadeIn>
          </div>

          {/* Quick Actions */}
          <FadeIn delay={0.2}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Add Product", desc: "List new item", icon: Plus, color: "#8B5CF6" },
                { label: "Manage Orders", desc: "View & update", icon: ShoppingCart, color: "#06B6D4" },
                { label: "Withdraw Funds", desc: "Transfer to M-Pesa", icon: Wallet, color: "#10B981" },
                { label: "Delivery Status", desc: "Track shipments", icon: Truck, color: "#F59E0B" },
              ].map((a) => (
                <button key={a.label} className="group p-4 rounded-xl border border-white/5 bg-nx-surface/50 hover:border-white/10 transition-all text-left">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: `${a.color}12` }}>
                    <a.icon className="w-4.5 h-4.5" style={{ color: a.color }} />
                  </div>
                  <p className="text-sm font-medium text-white">{a.label}</p>
                  <p className="text-[11px] text-white/30">{a.desc}</p>
                </button>
              ))}
            </div>
          </FadeIn>
        </div>
      </main>
    </div>
  );
}
