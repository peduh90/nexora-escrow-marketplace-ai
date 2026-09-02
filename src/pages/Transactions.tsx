import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import {
  ArrowUpRight, ArrowDownLeft, Shield, AlertTriangle,
  CheckCircle2, Clock, Search, Filter, ChevronDown, Eye,
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

const statusConfig: Record<string, { color: string; bg: string }> = {
  created: { color: "text-nx-gold", bg: "bg-nx-gold/10" },
  funded: { color: "text-nx-cyan", bg: "bg-nx-cyan/10" },
  active: { color: "text-nx-violet", bg: "bg-nx-violet/10" },
  delivery: { color: "text-nx-cyan", bg: "bg-nx-cyan/10" },
  inspection: { color: "text-nx-gold", bg: "bg-nx-gold/10" },
  released: { color: "text-nx-emerald", bg: "bg-nx-emerald/10" },
  completed: { color: "text-nx-emerald", bg: "bg-nx-emerald/10" },
  disputed: { color: "text-red-400", bg: "bg-red-400/10" },
  refunded: { color: "text-white/50", bg: "bg-white/5" },
  cancelled: { color: "text-white/50", bg: "bg-white/5" },
};

export default function Transactions() {
  const [filter, setFilter] = useState("all");
  const escrows = useQuery(api.users.getAllEscrows);
  const transactions = escrows ?? [];

  const filtered = filter === "all" ? transactions : transactions.filter((tx: any) => tx.status === filter);

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        <div className="sticky top-0 z-30 h-14 bg-[#08080F]/80 backdrop-blur-xl border-b border-white/5 flex items-center px-4 md:px-6">
          <h2 className="text-sm font-semibold text-white">Transactions</h2>
        </div>
        <div className="p-4 md:p-6 space-y-6">
          <FadeIn>
            <div>
              <h1 className="text-2xl font-bold text-white">Transaction History</h1>
              <p className="text-sm text-white/40 mt-1">All your escrow transactions in one place</p>
            </div>
          </FadeIn>

          <FadeIn delay={0.05}>
            <div className="flex gap-1 overflow-x-auto">
              {["all", "created", "funded", "active", "released", "completed", "disputed"].map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-colors ${filter === f ? "bg-nx-violet/10 text-nx-violet" : "text-white/30 hover:text-white/50"}`}>
                  {f}
                </button>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            {filtered.length === 0 ? (
              <div className="py-20 text-center rounded-xl border border-white/5 bg-white/[0.01]">
                <Shield className="w-10 h-10 text-white/10 mx-auto mb-3" />
                <p className="text-sm text-white/40 font-medium">No transactions yet</p>
                <p className="text-[11px] text-white/20 mt-1">Your escrow transactions will appear here</p>
              </div>
            ) : (
              <div className="rounded-xl border border-white/5 bg-nx-surface/50 overflow-hidden">
                <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 text-[11px] text-white/30 uppercase tracking-wider border-b border-white/5">
                  <span className="col-span-3">Title</span>
                  <span className="col-span-2">Amount</span>
                  <span className="col-span-2">Status</span>
                  <span className="col-span-2">Commission</span>
                  <span className="col-span-2">Date</span>
                  <span className="col-span-1"></span>
                </div>
                {filtered.map((tx: any, i: number) => {
                  const st = statusConfig[tx.status] || { color: "text-white/30", bg: "bg-white/5" };
                  return (
                    <motion.div key={tx._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 + i * 0.03 }}
                      className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-5 py-3.5 border-b border-white/[0.03] hover:bg-white/[0.015] transition-colors cursor-pointer items-center">
                      <span className="col-span-3 flex items-center gap-2">
                        <span className="text-sm text-white/70 truncate">{tx.title}</span>
                      </span>
                      <span className="col-span-2 text-sm font-semibold text-white">KES {tx.amount.toLocaleString()}</span>
                      <span className="col-span-2">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${st.color} ${st.bg}`}>{tx.status.toUpperCase()}</span>
                      </span>
                      <span className="col-span-2 text-xs text-white/30">KES {(tx.platformFee || 0).toLocaleString()}</span>
                      <span className="col-span-2 text-xs text-white/30">{new Date(tx.createdAt).toLocaleDateString()}</span>
                      <span className="col-span-1 flex justify-end">
                        <button className="p-1.5 rounded-lg hover:bg-white/[0.05] text-white/20 hover:text-white/50 transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </FadeIn>
        </div>
      </main>
    </div>
  );
}
