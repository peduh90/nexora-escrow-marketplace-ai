import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import BuyerLayout from "./buyer/BuyerLayout";
import {
  Scale, AlertTriangle, Clock, CheckCircle2, Brain, Shield, Package,
} from "lucide-react";

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay }} className={className}>{children}</motion.div>;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  open: { label: "Open", color: "text-nx-gold", bg: "bg-nx-gold/10", icon: AlertTriangle },
  under_review: { label: "Under Review", color: "text-nx-cyan", bg: "bg-nx-cyan/10", icon: Brain },
  resolved: { label: "Resolved", color: "text-nx-emerald", bg: "bg-nx-emerald/10", icon: CheckCircle2 },
  escalated: { label: "Escalated", color: "text-nx-violet", bg: "bg-nx-violet/10", icon: Shield },
  closed: { label: "Closed", color: "text-white/40", bg: "bg-white/5", icon: CheckCircle2 },
};

export default function Disputes() {
  const disputes = useQuery(api.disputes.getMyDisputes);
  const allDisputes = disputes ?? [];

  return (
    <BuyerLayout>
      <div className="space-y-6">
        <FadeIn>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Dispute Center</h1>
              <p className="text-sm text-white/40 mt-1">AI-assisted resolution for fair outcomes</p>
            </div>
          </div>
        </FadeIn>

        {/* Stats */}
        <FadeIn delay={0.05}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
              <Scale className="w-5 h-5 text-nx-violet mx-auto mb-2" />
              <p className="text-lg font-bold text-white">{allDisputes.length}</p>
              <p className="text-[10px] text-white/30">Total</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
              <AlertTriangle className="w-5 h-5 text-amber-400 mx-auto mb-2" />
              <p className="text-lg font-bold text-white">{allDisputes.filter((d: any) => d.status === "open").length}</p>
              <p className="text-[10px] text-white/30">Open</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
              <Brain className="w-5 h-5 text-nx-cyan mx-auto mb-2" />
              <p className="text-lg font-bold text-white">{allDisputes.filter((d: any) => d.status === "under_review").length}</p>
              <p className="text-[10px] text-white/30">Under Review</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
              <p className="text-lg font-bold text-white">{allDisputes.filter((d: any) => d.status === "resolved").length}</p>
              <p className="text-[10px] text-white/30">Resolved</p>
            </div>
          </div>
        </FadeIn>

        {/* Disputes list */}
        {allDisputes.length > 0 ? (
          <FadeIn delay={0.1}>
            <div className="space-y-3">
              {allDisputes.map((dispute: any, i: number) => {
                const st = statusConfig[dispute.status] || statusConfig.open;
                const Icon = st.icon;
                return (
                  <div key={dispute._id} className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-mono text-white/30">DSP-{dispute._id.slice(-4)}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${st.bg} ${st.color}`}>
                            {st.label}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-white mb-1">{dispute.reason}</h3>
                        {dispute.description && (
                          <p className="text-[11px] text-white/30 mb-2">{dispute.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-[10px] text-white/20">
                          <span>Filed: {new Date(dispute.createdAt).toLocaleDateString()}</span>
                          {dispute.resolution && <span>Resolution: {dispute.resolution}</span>}
                        </div>
                        {dispute.aiRecommendation && (
                          <div className="mt-3 p-3 rounded-lg bg-nx-cyan/5 border border-nx-cyan/10">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Brain className="w-3 h-3 text-nx-cyan" />
                              <span className="text-[10px] text-nx-cyan font-medium">AI Recommendation</span>
                            </div>
                            <p className="text-[11px] text-white/50">{dispute.aiRecommendation}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </FadeIn>
        ) : (
          <FadeIn delay={0.1}>
            <div className="text-center py-16 rounded-xl bg-white/[0.02] border border-white/5">
              <Package className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/40 font-medium">No disputes yet</p>
              <p className="text-[11px] text-white/20 mt-1">If an issue arises with a transaction, you can file a dispute from your orders</p>
            </div>
          </FadeIn>
        )}
      </div>
    </BuyerLayout>
  );
}
