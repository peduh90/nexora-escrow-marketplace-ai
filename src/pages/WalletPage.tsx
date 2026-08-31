import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Send,
  Download,
  Shield,
  CreditCard,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
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

const walletHistory = [
  { type: "deposit", desc: "M-Pesa Deposit", amount: 250000, status: "completed", time: "Today, 09:15", icon: ArrowDownLeft, color: "#10B981" },
  { type: "escrow_fund", desc: "Escrow TXN-4829", amount: -85000, status: "pending", time: "Today, 08:42", icon: Shield, color: "#8B5CF6" },
  { type: "escrow_release", desc: "TXN-4828 Released", amount: 42500, status: "completed", time: "Yesterday, 16:30", icon: CheckCircle2, color: "#06B6D4" },
  { type: "commission", desc: "Platform Fee TXN-4825", amount: -4875, status: "completed", time: "Yesterday, 14:12", icon: CreditCard, color: "#F59E0B" },
  { type: "withdrawal", desc: "Bank Withdrawal", amount: -100000, status: "processing", time: "Yesterday, 10:00", icon: ArrowUpRight, color: "#EC4899" },
  { type: "deposit", desc: "PesaLink Transfer", amount: 500000, status: "completed", time: "Dec 28, 11:20", icon: ArrowDownLeft, color: "#10B981" },
  { type: "escrow_fund", desc: "Escrow TXN-4824", amount: -67000, status: "completed", time: "Dec 27, 09:15", icon: Shield, color: "#8B5CF6" },
];

export default function WalletPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        <div className="sticky top-0 z-30 h-14 bg-[#08080F]/80 backdrop-blur-xl border-b border-white/5 flex items-center px-4 md:px-6">
          <h2 className="text-sm font-semibold text-white">Wallet</h2>
        </div>

        <div className="p-4 md:p-6 space-y-6">
          <FadeIn>
            <h1 className="text-2xl font-bold text-white">Your Wallet</h1>
            <p className="text-sm text-white/40 mt-1">Manage your funds and transaction history</p>
          </FadeIn>

          {/* Balance cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Total Balance", value: "KES 2,485,000", icon: Wallet, color: "#8B5CF6" },
              { label: "Available", value: "KES 1,650,000", icon: CheckCircle2, color: "#10B981" },
              { label: "In Escrow", value: "KES 680,000", icon: Shield, color: "#06B6D4" },
              { label: "Pending", value: "KES 155,000", icon: Clock, color: "#F59E0B" },
            ].map((card, i) => (
              <FadeIn key={card.label} delay={i * 0.06}>
                <div className="p-5 rounded-xl border border-white/5 bg-nx-surface/50">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${card.color}12` }}>
                      <card.icon className="w-4 h-4" style={{ color: card.color }} />
                    </div>
                  </div>
                  <p className="text-[11px] text-white/30 mb-1">{card.label}</p>
                  <p className="text-xl font-bold text-white">{card.value}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* Quick actions */}
          <FadeIn delay={0.1}>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Deposit", icon: Plus, color: "#8B5CF6" },
                { label: "Withdraw", icon: Download, color: "#10B981" },
                { label: "Send", icon: Send, color: "#06B6D4" },
              ].map((action) => (
                <button
                  key={action.label}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/5 bg-white/[0.02] text-sm text-white/60 hover:text-white hover:border-white/10 transition-all"
                >
                  <action.icon className="w-4 h-4" style={{ color: action.color }} />
                  {action.label}
                </button>
              ))}
            </div>
          </FadeIn>

          {/* Transaction history */}
          <FadeIn delay={0.15}>
            <div className="rounded-xl border border-white/5 bg-nx-surface/50">
              <div className="px-5 py-3 border-b border-white/5">
                <h3 className="text-sm font-semibold text-white">Transaction History</h3>
              </div>
              <div className="divide-y divide-white/[0.03]">
                {walletHistory.map((tx, i) => {
                  const st = tx.status === "completed" ? "text-nx-emerald" : tx.status === "pending" ? "text-nx-gold" : "text-nx-cyan";
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 + i * 0.03 }}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.01] transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${tx.color}10` }}>
                        <tx.icon className="w-4 h-4" style={{ color: tx.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/70">{tx.desc}</p>
                        <p className="text-[11px] text-white/25">{tx.time}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-semibold ${tx.amount > 0 ? "text-nx-emerald" : "text-white/70"}`}>
                          {tx.amount > 0 ? "+" : ""}KES {Math.abs(tx.amount).toLocaleString()}
                        </p>
                        <p className={`text-[10px] capitalize ${st}`}>{tx.status}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </FadeIn>
        </div>
      </main>
    </div>
  );
}
