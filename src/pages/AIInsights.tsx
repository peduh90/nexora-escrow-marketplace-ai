import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import {
  Brain,
  Shield,
  AlertTriangle,
  TrendingUp,
  Eye,
  Zap,
  Activity,
  CheckCircle2,
  Lock,
  Fingerprint,
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

const riskMetrics = [
  { label: "Transaction Risk Score", value: 97.4, max: 100, color: "#10B981", icon: Shield, status: "LOW" },
  { label: "Behavioral Anomalies", value: 0, max: 10, color: "#10B981", icon: Eye, status: "NONE" },
  { label: "Pattern Confidence", value: 97.4, max: 100, color: "#8B5CF6", icon: Brain, status: "HIGH" },
  { label: "Payment Verification", value: 100, max: 100, color: "#06B6D4", icon: Lock, status: "VERIFIED" },
  { label: "Account Reputation", value: 98, max: 100, color: "#F59E0B", icon: Fingerprint, status: "EXCELLENT" },
  { label: "Fraud Indicators", value: 0, max: 5, color: "#10B981", icon: AlertTriangle, status: "CLEAR" },
];

const aiActivity = [
  { time: "2 min ago", event: "Transaction TXN-4829 risk assessment completed", risk: "Low", color: "text-nx-emerald" },
  { time: "8 min ago", event: "Behavioral pattern analysis updated for seller TechHub", risk: "None", color: "text-nx-emerald" },
  { time: "15 min ago", event: "Payment verification passed for TXN-4828", risk: "Passed", color: "text-nx-cyan" },
  { time: "22 min ago", event: "Fraud model update: v2.4.1 deployed", risk: "System", color: "text-nx-violet" },
  { time: "1 hr ago", event: "TXN-4827 AI monitoring activated", risk: "Watching", color: "text-nx-gold" },
  { time: "3 hr ago", event: "Dispute DSP-182 evidence analysis initiated", risk: "Review", color: "text-nx-cyan" },
  { time: "5 hr ago", event: "Weekly fraud pattern report generated", risk: "Report", color: "text-nx-violet" },
];

export default function AIInsights() {
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
                <p className="text-sm text-white/40">Real-time monitoring and risk assessment powered by machine learning</p>
              </div>
            </div>
          </FadeIn>

          {/* Overall status */}
          <FadeIn delay={0.05}>
            <div className="p-5 rounded-xl border border-nx-emerald/10 bg-nx-emerald/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-nx-emerald/10 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-nx-emerald" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-nx-emerald">System Status: All Clear</h3>
                  <p className="text-sm text-white/40">No significant threats detected. 1,247 transactions actively monitored.</p>
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
                      animate={{ width: `${(metric.value / metric.max) * 100}%` }}
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
                <span className="text-[10px] text-white/20">Live</span>
              </div>
              <div className="divide-y divide-white/[0.03]">
                {aiActivity.map((item, i) => (
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
            </div>
          </FadeIn>
        </div>
      </main>
    </div>
  );
}
