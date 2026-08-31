import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  ChevronDown,
  Eye,
} from "lucide-react";

const transactions = [
  { id: "TXN-4829", type: "Escrow Created", amount: 85000, currency: "KES", counterparty: "Tech Supplies Ltd", status: "active", time: "2 min ago", riskScore: 98.2 },
  { id: "TXN-4828", type: "Payment Released", amount: 42500, currency: "KES", counterparty: "Sarah Wanjiku", status: "completed", time: "18 min ago", riskScore: 99.1 },
  { id: "TXN-4827", type: "Escrow Funded", amount: 156000, currency: "KES", counterparty: "James Odhiambo", status: "funded", time: "1 hr ago", riskScore: 95.8 },
  { id: "TXN-4826", type: "Dispute Filed", amount: 28000, currency: "KES", counterparty: "M-Pesa Store", status: "disputed", time: "3 hr ago", riskScore: 72.4 },
  { id: "TXN-4825", type: "Payment Released", amount: 195000, currency: "KES", counterparty: "Agri-Trade KE", status: "completed", time: "5 hr ago", riskScore: 99.7 },
  { id: "TXN-4824", type: "Escrow Created", amount: 67000, currency: "KES", counterparty: "Digital Kenya Ltd", status: "active", time: "6 hr ago", riskScore: 96.3 },
  { id: "TXN-4823", type: "Refund Issued", amount: 35000, currency: "KES", counterparty: "Nairobi Electronics", status: "refunded", time: "1 day ago", riskScore: 88.5 },
  { id: "TXN-4822", type: "Payment Released", amount: 280000, currency: "KES", counterparty: "Kwame Imports", status: "completed", time: "1 day ago", riskScore: 99.9 },
];

const statusConfig: Record<string, { color: string; bg: string; icon: typeof CheckCircle2 }> = {
  active: { color: "text-nx-violet", bg: "bg-nx-violet/10", icon: Clock },
  completed: { color: "text-nx-emerald", bg: "bg-nx-emerald/10", icon: CheckCircle2 },
  funded: { color: "text-nx-cyan", bg: "bg-nx-cyan/10", icon: Shield },
  disputed: { color: "text-nx-gold", bg: "bg-nx-gold/10", icon: AlertTriangle },
  refunded: { color: "text-white/50", bg: "bg-white/5", icon: ArrowDownLeft },
};

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay }} className={className}>
      {children}
    </motion.div>
  );
}

export default function Transactions() {
  const [filter, setFilter] = useState("all");

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        <div className="sticky top-0 z-30 h-14 bg-[#08080F]/80 backdrop-blur-xl border-b border-white/5 flex items-center px-4 md:px-6">
          <h2 className="text-sm font-semibold text-white">Transactions</h2>
        </div>

        <div className="p-4 md:p-6 space-y-6">
          <FadeIn>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">Transaction History</h1>
                <p className="text-sm text-white/40 mt-1">All your escrow transactions in one place</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-white/20 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input placeholder="Search..." className="pl-8 pr-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white/70 placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
                </div>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-xs text-white/50 hover:text-white/70 transition-colors">
                  <Filter className="w-3.5 h-3.5" />
                  Filter
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
            </div>
          </FadeIn>

          {/* Filter tabs */}
          <FadeIn delay={0.05}>
            <div className="flex gap-1 overflow-x-auto">
              {["all", "active", "completed", "funded", "disputed"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-colors ${
                    filter === f ? "bg-nx-violet/10 text-nx-violet" : "text-white/30 hover:text-white/50"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </FadeIn>

          {/* Transaction list */}
          <FadeIn delay={0.1}>
            <div className="rounded-xl border border-white/5 bg-nx-surface/50 overflow-hidden">
              <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 text-[11px] text-white/30 uppercase tracking-wider border-b border-white/5">
                <span className="col-span-1">ID</span>
                <span className="col-span-3">Type</span>
                <span className="col-span-2">Amount</span>
                <span className="col-span-2">Counterparty</span>
                <span className="col-span-1">Status</span>
                <span className="col-span-1">Risk</span>
                <span className="col-span-1">Time</span>
                <span className="col-span-1"></span>
              </div>

              {transactions
                .filter((tx) => filter === "all" || tx.status === filter)
                .map((tx, i) => {
                  const st = statusConfig[tx.status];
                  return (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.15 + i * 0.03 }}
                      className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-5 py-3.5 border-b border-white/[0.03] hover:bg-white/[0.015] transition-colors cursor-pointer items-center"
                    >
                      <span className="col-span-1 text-xs font-mono text-white/40">{tx.id}</span>
                      <span className="col-span-3 flex items-center gap-2">
                        {tx.status === "completed" ? <ArrowUpRight className="w-3.5 h-3.5 text-nx-emerald" /> :
                         tx.status === "disputed" ? <AlertTriangle className="w-3.5 h-3.5 text-nx-gold" /> :
                         <ArrowDownLeft className="w-3.5 h-3.5 text-nx-cyan" />}
                        <span className="text-sm text-white/70">{tx.type}</span>
                      </span>
                      <span className="col-span-2 text-sm font-semibold text-white">
                        {tx.currency} {tx.amount.toLocaleString()}
                      </span>
                      <span className="col-span-2 text-sm text-white/50 truncate">{tx.counterparty}</span>
                      <span className="col-span-1">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${st.color} ${st.bg}`}>
                          {tx.status.toUpperCase()}
                        </span>
                      </span>
                      <span className="col-span-1 text-xs text-white/30">{tx.riskScore}%</span>
                      <span className="col-span-1 text-xs text-white/30">{tx.time}</span>
                      <span className="col-span-1 flex justify-end">
                        <button className="p-1.5 rounded-lg hover:bg-white/[0.05] text-white/20 hover:text-white/50 transition-colors">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    </motion.div>
                  );
                })}
            </div>
          </FadeIn>
        </div>
      </main>
    </div>
  );
}
