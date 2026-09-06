import BuyerLayout from "./BuyerLayout";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { AlertTriangle, Clock, CheckCircle2, ArrowRight } from "lucide-react";

function FadeIn({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const statusMeta: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  open: { label: "Open", color: "text-red-400", bg: "bg-red-400/10" },
  under_review: {
    label: "Under Review",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
  },
  escalated: {
    label: "Escalated",
    color: "text-red-400",
    bg: "bg-red-400/10",
  },
  resolved: {
    label: "Resolved",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
  closed: {
    label: "Closed",
    color: "text-white/40",
    bg: "bg-white/5",
  },
};

export default function BuyerDisputes() {
  const disputes = useQuery(api.disputes.getMyDisputes);

  const list = disputes ?? [];

  return (
    <BuyerLayout>
      <div className="space-y-5">
        <FadeIn>
          <h1 className="text-2xl font-bold text-white">My Disputes</h1>
          <p className="text-sm text-white/40 mt-1">
            View and track your open dispute cases
          </p>
        </FadeIn>

        <FadeIn delay={0.05}>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
              <AlertTriangle className="w-5 h-5 text-red-400 mx-auto mb-2" />
              <p className="text-lg font-bold text-white">
                {list.filter((d: any) =>
                  ["open", "under_review", "escalated"].includes(d.status)
                ).length}
              </p>
              <p className="text-[10px] text-white/30">Open</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
              <Clock className="w-5 h-5 text-amber-400 mx-auto mb-2" />
              <p className="text-lg font-bold text-white">
                {list.filter((d: any) => d.status === "under_review").length}
              </p>
              <p className="text-[10px] text-white/30">Under Review</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
              <p className="text-lg font-bold text-white">
                {list.filter((d: any) =>
                  ["resolved", "closed"].includes(d.status)
                ).length}
              </p>
              <p className="text-[10px] text-white/30">Resolved</p>
            </div>
          </div>
        </FadeIn>

        {list.length === 0 ? (
          <FadeIn delay={0.1}>
            <div className="text-center py-16 rounded-xl bg-white/[0.02] border border-white/5">
              <AlertTriangle className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/40 font-medium">
                No disputes yet
              </p>
              <p className="text-[11px] text-white/20 mt-1 mb-4">
                If something goes wrong with an order, you can open a dispute
                from your deliveries page.
              </p>
              <a
                href="/buyer/deliveries"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-nx-violet text-white text-sm font-medium hover:bg-nx-violet/80 transition-colors"
              >
                Go to Deliveries{" "}
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </FadeIn>
        ) : (
          <FadeIn delay={0.1}>
            <div className="space-y-3">
              {list.map((dispute: any) => {
                const meta = statusMeta[dispute.status] ?? {
                  label: dispute.status,
                  color: "text-white/40",
                  bg: "bg-white/5",
                };
                return (
                  <div
                    key={dispute._id}
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                          <h3 className="text-sm font-semibold text-white truncate">
                            Dispute for {dispute.reason || "Order"}
                          </h3>
                        </div>
                        <p className="text-xs text-white/40 mt-1">
                          {dispute.description ||
                            "No additional details provided."}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-white/20">
                          {dispute.escrowId && (
                            <span>
                              Escrow: {dispute.escrowId.slice(0, 12)}…
                            </span>
                          )}
                          {dispute.resolution && (
                            <span className="text-emerald-400">
                              Resolved: {dispute.resolution}
                            </span>
                          )}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-medium shrink-0 ${meta.color} ${meta.bg}`}
                      >
                        {meta.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </FadeIn>
        )}
      </div>
    </BuyerLayout>
  );
}
