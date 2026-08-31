import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Shield,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Brain,
  Eye,
  ArrowRight,
  Bell,
  Search,
  Plus,
  BarChart3,
  Zap,
  ChevronRight,
} from "lucide-react";

// Animated number with in-view trigger
function AnimNum({ target, prefix = "", suffix = "" }: { target: number; prefix?: string; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [started, setStarted] = useState(false);

  if (inView && !started) {
    setStarted(true);
    let start = 0;
    const duration = 1500;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setVal(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  return (
    <span ref={ref}>
      {prefix}{val.toLocaleString()}{suffix}
    </span>
  );
}

// Fade in wrapper
function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Mock transaction data
const recentTransactions = [
  { id: "TXN-4829", type: "Escrow Created", amount: "KES 85,000", counterparty: "Tech Supplies Ltd", status: "active", time: "2 min ago" },
  { id: "TXN-4828", type: "Payment Released", amount: "KES 42,500", counterparty: "Sarah Wanjiku", status: "completed", time: "18 min ago" },
  { id: "TXN-4827", type: "Escrow Funded", amount: "KES 156,000", counterparty: "James Odhiambo", status: "funded", time: "1 hr ago" },
  { id: "TXN-4826", type: "Dispute Filed", amount: "KES 28,000", counterparty: "M-Pesa Store", status: "disputed", time: "3 hr ago" },
  { id: "TXN-4825", type: "Payment Released", amount: "KES 195,000", counterparty: "Agri-Trade KE", status: "completed", time: "5 hr ago" },
];

// AI risk data
const aiRiskData = {
  score: 97.4,
  level: "LOW",
  anomalies: 0,
  transactionsMonitored: 1247,
  fraudAttempts: 3,
  lastScan: "12 seconds ago",
};

const statusColors: Record<string, string> = {
  active: "text-nx-violet bg-nx-violet/10",
  completed: "text-nx-emerald bg-nx-emerald/10",
  funded: "text-nx-cyan bg-nx-cyan/10",
  disputed: "text-nx-gold bg-nx-gold/10",
};

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />

      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        {/* Top bar */}
        <div className="sticky top-0 z-30 h-14 bg-[#08080F]/80 backdrop-blur-xl border-b border-white/5 flex items-center px-4 md:px-6 justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-white/20 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                placeholder="Search transactions, users..."
                className="pl-8 pr-4 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white/70 placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none w-48 md:w-64"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-white/[0.03] transition-colors">
              <Bell className="w-4.5 h-4.5 text-white/40" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-nx-violet animate-nx-pulse" />
            </button>
            <div className="w-8 h-8 rounded-full bg-nx-violet/15 flex items-center justify-center">
              <span className="text-xs font-semibold text-nx-violet">
                {(user?.name || "U")[0].toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-6">
          {/* Header */}
          <FadeIn>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm text-white/40 mb-1">Financial Overview</p>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {user?.name?.split(" ")[0] || "there"}
                </h1>
              </div>
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-nx-violet text-white text-sm font-medium hover:bg-nx-violet/80 transition-colors self-start">
                <Plus className="w-4 h-4" />
                New Escrow
              </button>
            </div>
          </FadeIn>

          {/* Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {[
              {
                label: "Total Balance",
                value: "KES 2,485,000",
                animTarget: 2485000,
                prefix: "KES ",
                icon: Wallet,
                color: "#8B5CF6",
                change: "+12.5%",
                changeUp: true,
              },
              {
                label: "In Escrow",
                value: "KES 680,000",
                animTarget: 680000,
                prefix: "KES ",
                icon: Shield,
                color: "#06B6D4",
                change: "3 active",
                changeUp: true,
              },
              {
                label: "Available Balance",
                value: "KES 1,650,000",
                animTarget: 1650000,
                prefix: "KES ",
                icon: TrendingUp,
                color: "#10B981",
                change: "+8.2%",
                changeUp: true,
              },
              {
                label: "Pending Releases",
                value: "KES 155,000",
                animTarget: 155000,
                prefix: "KES ",
                icon: Clock,
                color: "#F59E0B",
                change: "2 pending",
                changeUp: false,
              },
            ].map((card, i) => (
              <FadeIn key={card.label} delay={i * 0.06}>
                <div className="group p-4 md:p-5 rounded-xl border border-white/5 bg-nx-surface/50 hover:border-white/10 transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: `${card.color}12` }}
                    >
                      <card.icon className="w-4 h-4" style={{ color: card.color }} />
                    </div>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${card.changeUp ? "text-nx-emerald bg-nx-emerald/10" : "text-nx-gold bg-nx-gold/10"}`}>
                      {card.change}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/30 mb-1">{card.label}</p>
                  <p className="text-lg md:text-xl font-bold text-white">
                    <AnimNum target={card.animTarget} prefix={card.prefix} />
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* AI Risk Panel */}
            <FadeIn delay={0.1} className="lg:col-span-1">
              <div className="p-5 rounded-xl border border-white/5 bg-nx-surface/50 h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-nx-violet" />
                    <h3 className="text-sm font-semibold text-white">AI Risk Assessment</h3>
                  </div>
                  <span className="text-[10px] text-white/20">{aiRiskData.lastScan}</span>
                </div>

                {/* Risk gauge */}
                <div className="flex items-center justify-center py-4">
                  <div className="relative w-28 h-28">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="6" />
                      <circle
                        cx="50" cy="50" r="42" fill="none"
                        stroke="#10B981"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={`${aiRiskData.score * 2.64} ${264 - aiRiskData.score * 2.64}`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-nx-emerald">{aiRiskData.score}%</span>
                      <span className="text-[9px] text-white/30 uppercase tracking-wider">{aiRiskData.level} RISK</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-2">
                  {[
                    { label: "Monitored", value: aiRiskData.transactionsMonitored.toLocaleString(), icon: Eye },
                    { label: "Anomalies", value: aiRiskData.anomalies.toString(), icon: AlertTriangle },
                    { label: "Fraud Blocked", value: aiRiskData.fraudAttempts.toString(), icon: Shield },
                    { label: "Confidence", value: "97.4%", icon: Zap },
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

                <p className="text-[11px] text-nx-emerald/70 mt-4 text-center">
                  No significant behavioral anomalies detected
                </p>
              </div>
            </FadeIn>

            {/* Recent Transactions */}
            <FadeIn delay={0.15} className="lg:col-span-2">
              <div className="p-5 rounded-xl border border-white/5 bg-nx-surface/50 h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white">Recent Transactions</h3>
                  <button className="text-[11px] text-nx-violet hover:text-nx-violet/80 flex items-center gap-1 transition-colors">
                    View All <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-1">
                  {recentTransactions.map((tx, i) => (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.02] transition-colors group cursor-pointer"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        tx.status === "completed" ? "bg-nx-emerald/10" :
                        tx.status === "active" ? "bg-nx-violet/10" :
                        tx.status === "funded" ? "bg-nx-cyan/10" :
                        "bg-nx-gold/10"
                      }`}>
                        {tx.status === "completed" ? <CheckCircle2 className="w-4 h-4 text-nx-emerald" /> :
                         tx.status === "active" ? <ArrowUpRight className="w-4 h-4 text-nx-violet" /> :
                         tx.status === "funded" ? <ArrowDownLeft className="w-4 h-4 text-nx-cyan" /> :
                         <AlertTriangle className="w-4 h-4 text-nx-gold" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-white truncate">{tx.type}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${statusColors[tx.status]}`}>
                            {tx.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[11px] text-white/30 truncate">{tx.counterparty}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-semibold text-white">{tx.amount}</p>
                        <p className="text-[10px] text-white/20">{tx.time}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>

          {/* Chart area */}
          <FadeIn delay={0.2}>
            <div className="p-5 rounded-xl border border-white/5 bg-nx-surface/50">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-nx-cyan" />
                  <h3 className="text-sm font-semibold text-white">Transaction Volume</h3>
                </div>
                <div className="flex items-center gap-1 text-[11px]">
                  {["7D", "30D", "90D", "1Y"].map((period) => (
                    <button
                      key={period}
                      className={`px-2.5 py-1 rounded transition-colors ${
                        period === "30D"
                          ? "bg-nx-violet/10 text-nx-violet"
                          : "text-white/20 hover:text-white/40"
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>

              {/* Simplified chart visualization */}
              <div className="flex items-end gap-1.5 h-40 md:h-48">
                {[35, 42, 28, 55, 48, 62, 71, 58, 83, 76, 90, 85, 92, 78, 95, 88, 97, 82, 91, 100, 87, 93, 89, 96].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 0.5, delay: 0.4 + i * 0.02 }}
                    className="flex-1 rounded-t-sm min-w-0 relative group cursor-pointer"
                    style={{
                      background: h > 85
                        ? "linear-gradient(to top, rgba(139, 92, 246, 0.3), rgba(139, 92, 246, 0.6))"
                        : h > 60
                        ? "linear-gradient(to top, rgba(6, 182, 212, 0.2), rgba(6, 182, 212, 0.4))"
                        : "linear-gradient(to top, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.08))",
                    }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block">
                      <div className="bg-nx-surface-elevated border border-white/10 px-2 py-1 rounded text-[10px] text-white whitespace-nowrap">
                        KES {(h * 25000).toLocaleString()}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-[10px] text-white/20">Jan</span>
                <span className="text-[10px] text-white/20">Mar</span>
                <span className="text-[10px] text-white/20">Jun</span>
                <span className="text-[10px] text-white/20">Sep</span>
                <span className="text-[10px] text-white/20">Dec</span>
              </div>
            </div>
          </FadeIn>

          {/* Quick Actions */}
          <FadeIn delay={0.25}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Create Escrow", icon: Shield, color: "#8B5CF6", desc: "Start a new transaction" },
                { label: "Deposit Funds", icon: ArrowDownLeft, color: "#06B6D4", desc: "Add to wallet" },
                { label: "Send Money", icon: ArrowUpRight, color: "#10B981", desc: "Transfer funds" },
                { label: "View Analytics", icon: BarChart3, color: "#F59E0B", desc: "Transaction insights" },
              ].map((action, i) => (
                <button
                  key={action.label}
                  className="group p-4 rounded-xl border border-white/5 bg-nx-surface/50 hover:border-white/10 transition-all duration-300 text-left"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 group-hover:scale-105 transition-transform"
                    style={{ background: `${action.color}12` }}
                  >
                    <action.icon className="w-4.5 h-4.5" style={{ color: action.color }} />
                  </div>
                  <p className="text-sm font-medium text-white mb-0.5">{action.label}</p>
                  <p className="text-[11px] text-white/30">{action.desc}</p>
                </button>
              ))}
            </div>
          </FadeIn>
        </div>
      </main>
    </div>
  );
}
