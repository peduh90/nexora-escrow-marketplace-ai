import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import {
  Wallet, ArrowUpRight, ArrowDownLeft, Shield, TrendingUp,
  AlertTriangle, Clock, CheckCircle2, Brain, Eye,
  Bell, Search, Plus, BarChart3, Zap, ChevronRight,
} from "lucide-react";

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay, ease: "easeOut" }} className={className}>
      {children}
    </motion.div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const wallet = useQuery(api.wallet.getWalletBalance);
  const escrows = useQuery(api.users.getAllEscrows);

  const allEscrows = escrows ?? [];
  const walletBalance = wallet?.walletBalance ?? 0;
  const escrowBalance = wallet?.escrowBalance ?? 0;

  const activeEscrows = allEscrows.filter((e: any) => ["funded", "active", "delivery", "inspection"].includes(e.status));
  const completedEscrows = allEscrows.filter((e: any) => ["released", "completed"].includes(e.status));
  const pendingEscrows = allEscrows.filter((e: any) => ["created"].includes(e.status));
  const totalGMV = allEscrows.reduce((sum: number, e: any) => sum + e.amount, 0);
  const recentEscrows = allEscrows.slice(0, 5);

  const statusColors: Record<string, string> = {
    created: "text-nx-gold bg-nx-gold/10",
    funded: "text-nx-cyan bg-nx-cyan/10",
    active: "text-nx-violet bg-nx-violet/10",
    delivery: "text-nx-cyan bg-nx-cyan/10",
    inspection: "text-nx-gold bg-nx-gold/10",
    released: "text-nx-emerald bg-nx-emerald/10",
    completed: "text-nx-emerald bg-nx-emerald/10",
    disputed: "text-red-400 bg-red-400/10",
    refunded: "text-white/50 bg-white/5",
    cancelled: "text-white/50 bg-white/5",
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        <div className="sticky top-0 z-30 h-14 bg-[#08080F]/80 backdrop-blur-xl border-b border-white/5 flex items-center px-4 md:px-6 justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-white/20 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input placeholder="Search transactions..." className="pl-8 pr-4 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white/70 placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none w-48 md:w-64" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-white/[0.03] transition-colors">
              <Bell className="w-4 h-4 text-white/40" />
            </button>
            <div className="w-8 h-8 rounded-full bg-nx-violet/15 flex items-center justify-center">
              <span className="text-xs font-semibold text-nx-violet">{(user?.name || "U")[0].toUpperCase()}</span>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-6">
          <FadeIn>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm text-white/40 mb-1">Financial Overview</p>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {user?.name?.split(" ")[0] || "there"}
                </h1>
              </div>
            </div>
          </FadeIn>

          {/* Overview Cards — Real Data */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {[
              { label: "Wallet Balance", value: `KES ${walletBalance.toLocaleString()}`, icon: Wallet, color: "#8B5CF6" },
              { label: "In Escrow", value: `KES ${escrowBalance.toLocaleString()}`, icon: Shield, color: "#06B6D4" },
              { label: "Total Transactions", value: allEscrows.length.toString(), icon: TrendingUp, color: "#10B981" },
              { label: "Pending", value: pendingEscrows.length.toString(), icon: Clock, color: "#F59E0B" },
            ].map((card, i) => (
              <FadeIn key={card.label} delay={i * 0.06}>
                <div className="p-4 md:p-5 rounded-xl border border-white/5 bg-nx-surface/50 hover:border-white/10 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${card.color}12` }}>
                      <card.icon className="w-4 h-4" style={{ color: card.color }} />
                    </div>
                  </div>
                  <p className="text-[11px] text-white/30 mb-1">{card.label}</p>
                  <p className="text-lg md:text-xl font-bold text-white">{card.value}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* AI Risk Panel */}
            <FadeIn delay={0.1} className="lg:col-span-1">
              <div className="p-5 rounded-xl border border-white/5 bg-nx-surface/50 h-full">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-4 h-4 text-nx-violet" />
                  <h3 className="text-sm font-semibold text-white">AI Risk Assessment</h3>
                </div>
                <div className="flex items-center justify-center py-4">
                  <div className="relative w-28 h-28">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="6" />
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#10B981" strokeWidth="6" strokeLinecap="round" strokeDasharray="250 14" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-nx-emerald">98%</span>
                      <span className="text-[9px] text-white/30 uppercase tracking-wider">LOW RISK</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {[
                    { label: "Monitored", value: allEscrows.length.toString(), icon: Eye },
                    { label: "Active", value: activeEscrows.length.toString(), icon: AlertTriangle },
                    { label: "Completed", value: completedEscrows.length.toString(), icon: Shield },
                    { label: "Confidence", value: "98%", icon: Zap },
                  ].map((stat) => (
                    <div key={stat.label} className="p-2.5 rounded-lg bg-white/[0.02]">
                      <div className="flex items-center gap-1.5 mb-1">
                        <stat.icon className="w-3 h-3 text-white/20" />
                        <span className="text-[10px] text-white/30">{stat.label}</span>
                      </div>
                      <span className="text-sm font-semibold text-white">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>

            {/* Recent Transactions — Real Data */}
            <FadeIn delay={0.15} className="lg:col-span-2">
              <div className="p-5 rounded-xl border border-white/5 bg-nx-surface/50 h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white">Recent Transactions</h3>
                </div>
                {recentEscrows.length === 0 ? (
                  <div className="py-12 text-center">
                    <Shield className="w-8 h-8 text-white/10 mx-auto mb-2" />
                    <p className="text-sm text-white/30">No transactions yet</p>
                    <p className="text-[11px] text-white/15 mt-1">Your escrow transactions will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {recentEscrows.map((tx: any, i: number) => (
                      <motion.div key={tx._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.05 }}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.02] transition-colors">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tx.status === "completed" || tx.status === "released" ? "bg-nx-emerald/10" : tx.status === "disputed" ? "bg-nx-gold/10" : "bg-nx-cyan/10"}`}>
                          {tx.status === "completed" || tx.status === "released" ? <CheckCircle2 className="w-4 h-4 text-nx-emerald" /> : tx.status === "disputed" ? <AlertTriangle className="w-4 h-4 text-nx-gold" /> : <ArrowUpRight className="w-4 h-4 text-nx-cyan" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-white truncate">{tx.title}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${statusColors[tx.status] || "text-white/30 bg-white/5"}`}>{tx.status.toUpperCase()}</span>
                          </div>
                          <p className="text-[11px] text-white/30 truncate">KES {tx.amount.toLocaleString()}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[10px] text-white/20">{new Date(tx.createdAt).toLocaleDateString()}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </FadeIn>
          </div>

          {/* Quick Actions */}
          <FadeIn delay={0.25}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Browse Marketplace", icon: Search, color: "#8B5CF6", desc: "Find products", href: "/marketplace" },
                { label: "My Orders", icon: Shield, color: "#06B6D4", desc: "View purchases", href: "/buyer/orders" },
                { label: "My Wallet", icon: Wallet, color: "#10B981", desc: "Manage funds", href: "/buyer/wallet" },
                { label: "Disputes", icon: AlertTriangle, color: "#F59E0B", desc: "Open cases", href: "/buyer/disputes" },
              ].map((action) => (
                <a key={action.label} href={action.href} className="group p-4 rounded-xl border border-white/5 bg-nx-surface/50 hover:border-white/10 transition-all duration-300 text-left">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 group-hover:scale-105 transition-transform" style={{ background: `${action.color}12` }}>
                    <action.icon className="w-4 h-4" style={{ color: action.color }} />
                  </div>
                  <p className="text-sm font-medium text-white mb-0.5">{action.label}</p>
                  <p className="text-[11px] text-white/30">{action.desc}</p>
                </a>
              ))}
            </div>
          </FadeIn>
        </div>
      </main>
    </div>
  );
}
