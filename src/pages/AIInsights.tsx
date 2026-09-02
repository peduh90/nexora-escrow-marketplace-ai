import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Brain,
  Shield,
  AlertTriangle,
  TrendingUp,
  Eye,
  Lock,
  Activity,
  CheckCircle2,
  Fingerprint,
  Loader2,
  Zap,
} from "lucide-react";

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay }} className={className}>
      {children}
    </motion.div>
  );
}

export default function AIInsights() {
  const escrows = useQuery(api.users.getAllEscrows);
  const disputes = useQuery(api.admin.getAllDisputes);
  const users = useQuery(api.users.getAllUsers);
  const listings = useQuery(api.admin.getAllListings);
  const stats = useQuery(api.admin.getDashboardStats);

  const isLoading = escrows === undefined || disputes === undefined || users === undefined || listings === undefined || stats === undefined;

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-nx-violet animate-spin" />
        </main>
      </div>
    );
  }

  // Build real metrics from actual platform data
  const allEscrows = escrows ?? [];
  const allDisputes = disputes ?? [];
  const allUsers = users ?? [];
  const allListings = listings ?? [];

  const totalTransactions = allEscrows.length;
  const disputedCount = allDisputes.filter((d: any) => ["open", "under_review", "escalated"].includes(d.status)).length;
  const completedCount = allEscrows.filter((e: any) => ["released", "completed"].includes(e.status)).length;
  const totalListings = allListings.length;
  const verifiedUsers = allUsers.filter((u: any) => u.kycStatus === "verified").length;

  // Risk score: higher dispute ratio = lower score
  const disputeRate = totalTransactions > 0 ? disputedCount / totalTransactions : 0;
  const riskScore = totalTransactions === 0 ? 100 : Math.round((1 - disputeRate) * 100);
  const anomalyCount = disputedCount;
  const confidence = totalTransactions > 0 ? Math.min(100, Math.round(70 + (completedCount / totalTransactions) * 30)) : 100;
  const paymentVerified = allEscrows.filter((e: any) => ["funded", "active", "delivery", "inspection", "released", "completed"].includes(e.status)).length;
  const reputation = verifiedUsers > 0 ? Math.min(100, Math.round(50 + (verifiedUsers / Math.max(allUsers.length, 1)) * 50)) : 50;

  const riskMetrics = [
    { label: "Transaction Risk Score", value: riskScore, max: 100, color: riskScore > 80 ? "#10B981" : riskScore > 50 ? "#F59E0B" : "#EF4444", icon: Shield, status: riskScore > 80 ? "LOW" : riskScore > 50 ? "MEDIUM" : "HIGH" },
    { label: "Active Anomalies", value: anomalyCount, max: Math.max(anomalyCount + 5, 10), color: anomalyCount === 0 ? "#10B981" : anomalyCount < 3 ? "#F59E0B" : "#EF4444", icon: Eye, status: anomalyCount === 0 ? "NONE" : `${anomalyCount} FOUND` },
    { label: "Pattern Confidence", value: confidence, max: 100, color: "#8B5CF6", icon: Brain, status: confidence > 80 ? "HIGH" : "MODERATE" },
    { label: "Payment Verification", value: paymentVerified, max: Math.max(totalTransactions, 1), color: "#06B6D4", icon: Lock, status: `${paymentVerified}/${totalTransactions}` },
    { label: "Account Reputation", value: reputation, max: 100, color: "#F59E0B", icon: Fingerprint, status: reputation > 80 ? "EXCELLENT" : reputation > 50 ? "GOOD" : "LOW" },
    { label: "Dispute Rate", value: disputedCount, max: Math.max(disputedCount + 5, 10), color: disputedCount === 0 ? "#10B981" : "#EF4444", icon: AlertTriangle, status: disputedCount === 0 ? "CLEAR" : `${disputedCount} OPEN` },
  ];

  // Build real activity feed from escrow + dispute events
  const activityItems: Array<{ time: string; event: string; risk: string; color: string }> = [];

  // Recent escrow events
  const recentEscrows = [...allEscrows]
    .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 5);
  recentEscrows.forEach((e: any) => {
    const minsAgo = Math.max(1, Math.round((Date.now() - e.createdAt) / 60000));
    const timeLabel = minsAgo < 60 ? `${minsAgo} min ago` : minsAgo < 1440 ? `${Math.round(minsAgo / 60)} hr ago` : `${Math.round(minsAgo / 1440)} days ago`;
    activityItems.push({
      time: timeLabel,
      event: `Escrow ${e.status} for "${e.title}" — KES ${e.amount.toLocaleString()}`,
      risk: e.status === "disputed" ? "Review" : e.status === "completed" ? "Safe" : "Active",
      color: e.status === "disputed" ? "text-nx-gold" : e.status === "completed" ? "text-nx-emerald" : "text-nx-cyan",
    });
  });

  // Recent dispute events
  const recentDisputes = [...allDisputes]
    .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 3);
  recentDisputes.forEach((d: any) => {
    const minsAgo = Math.max(1, Math.round((Date.now() - d.createdAt) / 60000));
    const timeLabel = minsAgo < 60 ? `${minsAgo} min ago` : minsAgo < 1440 ? `${Math.round(minsAgo / 60)} hr ago` : `${Math.round(minsAgo / 1440)} days ago`;
    activityItems.push({
      time: timeLabel,
      event: `Dispute ${d.status}: "${d.reason}" — ${d.filedBy ? "User filed" : "System detected"}`,
      risk: d.status === "resolved" ? "Resolved" : "Review",
      color: d.status === "resolved" ? "text-nx-emerald" : d.status === "escalated" ? "text-red-400" : "text-nx-gold",
    });
  });

  // Sort by recency
  activityItems.sort((a, b) => {
    const parseTime = (t: string) => {
      if (t.includes("min")) return parseInt(t) * 60000;
      if (t.includes("hr")) return parseInt(t) * 3600000;
      return parseInt(t) * 86400000;
    };
    return parseTime(a.time) - parseTime(b.time);
  });

  const systemStatus = disputedCount === 0 ? "All Clear" : disputedCount < 3 ? "Monitoring" : "Attention Needed";
  const statusColor = disputedCount === 0 ? "text-nx-emerald" : disputedCount < 3 ? "text-nx-gold" : "text-red-400";

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        <div className="sticky top-0 z-30 h-14 bg-[#08080F]/80 backdrop-blur-xl border-b border-white/5 flex items-center px-4 md:px-6">
          <h2 className="text-sm font-semibold text-white">AI Insights</h2>
        </div>

        <div className="p-4 md:p-6 space-y-6">
          <FadeIn>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-nx-violet/10 flex items-center justify-center">
                <Brain className="w-5 h-5 text-nx-violet" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">AI Transaction Intelligence</h1>
                <p className="text-sm text-white/40">Real-time monitoring and risk assessment from platform data</p>
              </div>
            </div>
          </FadeIn>

          {/* Overall status */}
          <FadeIn delay={0.05}>
            <div className={`p-5 rounded-xl border ${disputedCount === 0 ? "border-nx-emerald/10 bg-nx-emerald/[0.02]" : "border-nx-gold/10 bg-nx-gold/[0.02]"}`}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl ${disputedCount === 0 ? "bg-nx-emerald/10" : "bg-nx-gold/10"} flex items-center justify-center`}>
                  {disputedCount === 0 ? <CheckCircle2 className="w-6 h-6 text-nx-emerald" /> : <AlertTriangle className="w-6 h-6 text-nx-gold" />}
                </div>
                <div>
                  <h3 className={`text-base font-semibold ${statusColor}`}>System Status: {systemStatus}</h3>
                  <p className="text-sm text-white/40">
                    {totalTransactions === 0
                      ? "No transactions yet. AI monitoring will activate once activity begins."
                      : `${totalTransactions} transactions actively monitored. ${disputedCount === 0 ? "No threats detected." : `${disputedCount} dispute(s) under review.`}`}
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Risk metrics grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {riskMetrics.map((metric, i) => (
              <FadeIn key={metric.label} delay={i * 0.06}>
                <div className="p-4 rounded-xl border border-white/5 bg-nx-surface/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <metric.icon className="w-4 h-4" style={{ color: metric.color }} />
                      <span className="text-xs text-white/40">{metric.label}</span>
                    </div>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ color: metric.color, background: `${metric.color}10` }}>
                      {metric.status}
                    </span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold text-white">{metric.value}</span>
                    <span className="text-xs text-white/20 mb-1">/ {metric.max}</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-white/[0.03] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((metric.value / metric.max) * 100, 100)}%` }}
                      transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
                      className="h-full rounded-full"
                      style={{ background: metric.color }}
                    />
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* AI Activity feed */}
          <FadeIn delay={0.2}>
            <div className="rounded-xl border border-white/5 bg-nx-surface/50">
              <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-nx-cyan" />
                  <h3 className="text-sm font-semibold text-white">AI Activity Feed</h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-nx-emerald animate-pulse" />
                  <span className="text-[10px] text-white/20">Live</span>
                </div>
              </div>
              {activityItems.length === 0 ? (
                <div className="py-12 flex flex-col items-center">
                  <Zap className="w-8 h-8 text-white/10 mb-3" />
                  <p className="text-sm text-white/30">No activity yet</p>
                  <p className="text-[11px] text-white/15 mt-1">AI monitoring activates once transactions begin</p>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.03]">
                  {activityItems.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                      className="flex items-center gap-3 px-5 py-3"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-nx-cyan animate-nx-pulse shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/60 truncate">{item.event}</p>
                      </div>
                      <span className={`text-[10px] font-medium ${item.color}`}>{item.risk}</span>
                      <span className="text-[10px] text-white/20 shrink-0">{item.time}</span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </FadeIn>
        </div>
      </main>
    </div>
  );
}
