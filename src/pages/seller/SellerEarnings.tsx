import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import SellerSidebar from "./SellerSidebar";
import {
  Wallet, ArrowUpRight, ArrowDownLeft, Download, TrendingUp,
  CreditCard, Clock, CheckCircle2, Shield, Phone,
} from "lucide-react";

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay }} className={className}>{children}</motion.div>
  );
}

const earningsHistory = [
  { type: "sale", desc: "Samsung Galaxy S24 — ORD-291", amount: 138750, commission: 6250, status: "completed", time: "Today, 09:15" },
  { type: "sale", desc: "Organic Coffee 50kg — ORD-290", amount: 80750, commission: 4250, status: "completed", time: "Today, 08:42" },
  { type: "withdrawal", desc: "M-Pesa Withdrawal — 0712***456", amount: -100000, commission: 0, status: "processing", time: "Yesterday, 16:30" },
  { type: "sale", desc: "Nike Air Max 2025 — ORD-289", amount: 17575, commission: 925, status: "completed", time: "Yesterday, 14:12" },
  { type: "subscription", desc: "Professional Plan (Monthly)", amount: -999, commission: 0, status: "completed", time: "Dec 1, 00:00" },
  { type: "sale", desc: "E-Commerce License — ORD-288", amount: 71250, commission: 3750, status: "completed", time: "Nov 28, 11:20" },
];

export default function SellerEarnings() {
  const [showWithdraw, setShowWithdraw] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <SellerSidebar />
      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        <div className="sticky top-0 z-30 h-14 bg-[#08080F]/80 backdrop-blur-xl border-b border-white/5 flex items-center px-4 md:px-6 justify-between">
          <h2 className="text-sm font-semibold text-white">Earnings</h2>
          <button onClick={() => setShowWithdraw(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-nx-emerald text-white text-xs font-medium hover:bg-nx-emerald/80 transition-colors">
            <Download className="w-3.5 h-3.5" /> Withdraw
          </button>
        </div>

        <div className="p-4 md:p-6 space-y-6">
          <FadeIn>
            <h1 className="text-2xl font-bold text-white">Earnings & Withdrawals</h1>
            <p className="text-sm text-white/40 mt-1">Track your revenue and withdraw to M-Pesa</p>
          </FadeIn>

          {/* Balance Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Available Balance", value: "KES 680,000", icon: Wallet, color: "#10B981", desc: "Ready to withdraw" },
              { label: "Pending Clearance", value: "KES 155,000", icon: Clock, color: "#F59E0B", desc: "In escrow protection" },
              { label: "Total Earnings", value: "KES 2,485,000", icon: TrendingUp, color: "#8B5CF6", desc: "All time" },
              { label: "Commission Paid", value: "KES 124,250", icon: CreditCard, color: "#06B6D4", desc: "2.5% per transaction" },
            ].map((card, i) => (
              <FadeIn key={card.label} delay={i * 0.06}>
                <div className="p-4 rounded-xl border border-white/5 bg-nx-surface/50">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: `${card.color}12` }}>
                    <card.icon className="w-4 h-4" style={{ color: card.color }} />
                  </div>
                  <p className="text-[10px] text-white/30">{card.label}</p>
                  <p className="text-lg font-bold text-white">{card.value}</p>
                  <p className="text-[10px] text-white/20 mt-0.5">{card.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* Commission Info */}
          <FadeIn delay={0.1}>
            <div className="p-4 rounded-xl border border-nx-violet/10 bg-nx-violet/[0.02]">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-nx-violet" />
                <div>
                  <p className="text-sm font-medium text-white">Your Commission Rate: <span className="text-nx-violet">2.5%</span></p>
                  <p className="text-[11px] text-white/30 mt-0.5">Professional Plan — Upgrade to Enterprise (0.5%) for KES 4,999/month</p>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Earnings History */}
          <FadeIn delay={0.15}>
            <div className="rounded-xl border border-white/5 bg-nx-surface/50">
              <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Earnings History</h3>
                <span className="text-[10px] text-white/20">Last 30 days</span>
              </div>
              <div className="divide-y divide-white/[0.03]">
                {earningsHistory.map((tx, i) => (
                  <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 + i * 0.03 }}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.01] transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      tx.type === "sale" ? "bg-nx-emerald/10" : tx.type === "withdrawal" ? "bg-nx-cyan/10" : "bg-nx-violet/10"
                    }`}>
                      {tx.type === "sale" ? <ArrowUpRight className="w-4 h-4 text-nx-emerald" /> :
                       tx.type === "withdrawal" ? <ArrowDownLeft className="w-4 h-4 text-nx-cyan" /> :
                       <CreditCard className="w-4 h-4 text-nx-violet" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/70 truncate">{tx.desc}</p>
                      <p className="text-[11px] text-white/25">{tx.time}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-semibold ${tx.amount > 0 ? "text-nx-emerald" : "text-white/70"}`}>
                        {tx.amount > 0 ? "+" : ""}KES {Math.abs(tx.amount).toLocaleString()}
                      </p>
                      {tx.commission > 0 && (
                        <p className="text-[10px] text-white/20">Fee: KES {tx.commission.toLocaleString()}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Withdraw Modal */}
        {showWithdraw && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowWithdraw(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md p-6 rounded-2xl border border-white/10 bg-nx-surface shadow-2xl">
              <h3 className="text-lg font-semibold text-white mb-4">Withdraw to M-Pesa</h3>
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-white/[0.02]">
                  <p className="text-[10px] text-white/30 mb-1">Available Balance</p>
                  <p className="text-xl font-bold text-white">KES 680,000</p>
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Amount (KES)</label>
                  <input type="number" placeholder="0" className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-emerald/50 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">M-Pesa Number</label>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-white/20" />
                    <input placeholder="+254 712 345 678" className="flex-1 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-emerald/50 focus:outline-none" />
                  </div>
                </div>
                <p className="text-[10px] text-white/20">Withdrawal fee: KES 25 flat · Processing: Instant to 24 hours</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowWithdraw(false)} className="flex-1 py-2.5 rounded-lg border border-white/10 text-sm text-white/50">Cancel</button>
                  <button className="flex-1 py-2.5 rounded-lg bg-nx-emerald text-white text-sm font-medium hover:bg-nx-emerald/80 transition-colors">Withdraw</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
