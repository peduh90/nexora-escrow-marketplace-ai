import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import BuyerLayout from "./buyer/BuyerLayout";
import {
  Scale,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Brain,
  MessageSquare,
  FileText,
  Shield,
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

const disputes = [
  {
    id: "DSP-182",
    escrowId: "TXN-4826",
    title: "Product not as described",
    counterparty: "M-Pesa Store",
    amount: "KES 28,000",
    status: "under_review",
    filedAt: "3 hours ago",
    aiRecommendation: "Partial refund of 60% recommended based on evidence review.",
    evidenceCount: 4,
    messagesCount: 8,
  },
  {
    id: "DSP-179",
    escrowId: "TXN-4810",
    title: "Late delivery exceeded inspection period",
    counterparty: "QuickTraders KE",
    amount: "KES 52,000",
    status: "open",
    filedAt: "1 day ago",
    aiRecommendation: null,
    evidenceCount: 2,
    messagesCount: 3,
  },
  {
    id: "DSP-175",
    escrowId: "TXN-4798",
    title: "Payment not released after delivery confirmation",
    counterparty: "Nairobi Electronics",
    amount: "KES 35,000",
    status: "resolved",
    filedAt: "5 days ago",
    aiRecommendation: "Full release recommended. Buyer confirmed delivery satisfaction.",
    evidenceCount: 6,
    messagesCount: 12,
  },
];

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  open: { label: "Open", color: "text-nx-gold", bg: "bg-nx-gold/10", icon: AlertTriangle },
  under_review: { label: "Under Review", color: "text-nx-cyan", bg: "bg-nx-cyan/10", icon: Brain },
  resolved: { label: "Resolved", color: "text-nx-emerald", bg: "bg-nx-emerald/10", icon: CheckCircle2 },
  escalated: { label: "Escalated", color: "text-nx-violet", bg: "bg-nx-violet/10", icon: Shield },
};

export default function Disputes() {
  return (
    <BuyerLayout>
      <div className="space-y-6">
        <FadeIn>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Dispute Center</h1>
              <p className="text-sm text-white/40 mt-1">AI-assisted resolution for fair outcomes</p>
            </div>
            <div className="flex items-center gap-2">
              {[
                { label: "Open", count: 1, color: "text-nx-gold" },
                { label: "Review", count: 1, color: "text-nx-cyan" },
                { label: "Resolved", count: 1, color: "text-nx-emerald" },
              ].map((s) => (
                <div key={s.label} className="text-center px-3">
                  <p className={`text-lg font-bold ${s.color}`}>{s.count}</p>
                  <p className="text-[10px] text-white/25">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Dispute cards */}
        <div className="space-y-3">
          {disputes.map((d, i) => {
            const st = statusConfig[d.status];
            return (
              <FadeIn key={d.id} delay={i * 0.08}>
                <div className="p-5 rounded-xl border border-white/5 bg-nx-surface/50 hover:border-white/10 transition-all cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${st.bg}`}>
                        <st.icon className={`w-4.5 h-4.5 ${st.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-white">{d.title}</h3>
                          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${st.color} ${st.bg}`}>
                            {st.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-white/30 mt-0.5">
                          {d.id} · {d.escrowId} · {d.counterparty} · {d.amount}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] text-white/20">{d.filedAt}</span>
                  </div>

                  {d.aiRecommendation && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-nx-violet/[0.04] border border-nx-violet/10 mt-3">
                      <Brain className="w-4 h-4 text-nx-violet shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] text-nx-violet font-medium mb-0.5">AI RECOMMENDATION</p>
                        <p className="text-xs text-white/50">{d.aiRecommendation}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-3 text-[11px] text-white/25">
                    <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {d.evidenceCount} evidence</span>
                    <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {d.messagesCount} messages</span>
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </BuyerLayout>
  );
}
