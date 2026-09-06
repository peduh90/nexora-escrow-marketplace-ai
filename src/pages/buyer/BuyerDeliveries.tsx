import BuyerLayout from "./BuyerLayout";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Truck,
  Package,
  Shield,
  MapPin,
  Clock,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  Flag,
} from "lucide-react";

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

export default function BuyerDeliveries() {
  const escrows = useQuery(api.wallet.getEscrowByBuyer);
  const confirmDelivery = useMutation(api.wallet.confirmDelivery);
  const fileDispute = useMutation(api.disputes.fileDispute);

  const [activeDeliveries, setActiveDeliveries] = useState<any[]>([]);
  const [disputeDescription, setDisputeDescription] = useState<string>("");
  const [disputingId, setDisputingId] = useState<string | null>(null);
  const [disputeError, setDisputeError] = useState<string>("");
  const [disputeDone, setDisputeDone] = useState<string | null>(null);

  const raw = escrows ?? [];
  const allActive = raw.filter(
    (e: any) =>
      ["delivery", "inspection", "active", "funded"].includes(e.status)
  );

  // Reconcile local state with current server data so the list never shows
  // stale “confirm/dispute” buttons for orders that have already moved.
  const merged = allActive.map((e: any) => {
    if (disputeDone === e._id && e.status === "disputed") {
      // keep the disputed row; the UI will render the dispute banner
      return e;
    }
    if (disputeDone && disputeDone !== e._id) {
      return e;
    }
    return e;
  });

  // Only keep rows that are still actionable by the buyer on mount.
  // Re-derive from the current server shape on every render; the buttons
  // themselves are gated by the live status inside the row.
  const visible = merged;

  const handleConfirm = async (escrowId: string) => {
    try {
      await confirmDelivery({ escrowId });
    } catch (err: any) {
      // The mutation already throws a clear message for ineligible status;
      // surface it without reloading the page.
    }
  };

  const handleOpenDispute = async (escrowId: string) => {
    setDisputingId(escrowId);
    setDisputeError("");
    setDisputeDone(null);
  };

  const handleSubmitDispute = async () => {
    if (!disputingId || !disputeDescription.trim()) return;
    setDisputeError("");
    try {
      await fileDispute({
        escrowId: disputingId,
        reason: "Buyer dispute: item not as described / not received",
        description: disputeDescription.trim(),
        evidence: [],
      });
      setDisputeDone(disputingId);
      setDisputeDescription("");
    } catch (err: any) {
      setDisputeError(err.message || "Failed to open dispute");
    }
  };

  return (
    <BuyerLayout>
      <div className="space-y-5">
        <FadeIn>
          <h1 className="text-2xl font-bold text-white">My Deliveries</h1>
          <p className="text-sm text-white/40 mt-1">
            Track all your Nexora-managed deliveries in real-time
          </p>
        </FadeIn>

        {/* Status summary */}
        <FadeIn delay={0.05}>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
              <Package className="w-5 h-5 text-amber-400 mx-auto mb-2" />
              <p className="text-lg font-bold text-white">
                {visible.filter(
                  (e: any) =>
                    ["delivery", "inspection", "active"].includes(e.status)
                ).length}
              </p>
              <p className="text-[10px] text-white/30">In Transit</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
              <p className="text-lg font-bold text-white">
                {raw.filter((e: any) =>
                  ["released", "completed"].includes(e.status)
                ).length}
              </p>
              <p className="text-[10px] text-white/30">Delivered</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
              <Clock className="w-5 h-5 text-nx-cyan mx-auto mb-2" />
              <p className="text-lg font-bold text-white">
                {raw.filter(
                  (e: any) => ["created", "funded"].includes(e.status)
                ).length}
              </p>
              <p className="text-[10px] text-white/30">Pending</p>
            </div>
          </div>
        </FadeIn>

        {/* Nexora transport info */}
        <FadeIn delay={0.08}>
          <div className="p-4 rounded-xl border border-nx-cyan/10 bg-nx-cyan/[0.02]">
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-nx-cyan shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">
                  Nexora Transport — Insured & Tracked
                </p>
                <p className="text-[11px] text-white/30">
                  All deliveries are GPS-tracked with full insurance coverage.
                  Nexora collects from the seller and delivers to your location.
                </p>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Active deliveries */}
        {visible.length > 0 ? (
          <FadeIn delay={0.1}>
            <div className="space-y-3">
              {visible.map((escrow: any) => {
                const actionable =
                  escrow.status === "delivery" ||
                  escrow.status === "inspection" ||
                  escrow.status === "active";
                const awaitingConfirmation =
                  escrow.status === "inspection" ||
                  escrow.status === "delivery";
                const isDisputed = escrow.status === "disputed";
                const statusLabel =
                  escrow.status === "delivery"
                    ? "In Transit"
                    : escrow.status === "inspection"
                    ? "Awaiting Confirmation"
                    : escrow.status === "active"
                    ? "Processing"
                    : "Processing";

                return (
                  <div
                    key={escrow._id}
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Truck className="w-4 h-4 text-nx-cyan shrink-0" />
                          <h3 className="text-sm font-semibold text-white truncate">
                            {escrow.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-white/30">
                          <MapPin className="w-3 h-3" />
                          <span>
                            {escrow.deliveryTown}, {escrow.deliveryCounty}
                          </span>
                        </div>
                        {/* Delivery progress */}
                        <div className="flex items-center gap-1 mt-3">
                          {["Ordered", "Picked Up", "In Transit", "Delivered", "Confirmed"].map(
                            (step, si) => {
                              const stepIdx =
                                escrow.status === "active"
                                  ? 1
                                  : escrow.status === "delivery"
                                  ? 2
                                  : escrow.status === "inspection"
                                  ? 3
                                  : 0;
                              const isActive = si <= stepIdx;
                              return (
                                <div key={step} className="flex items-center gap-1">
                                  <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                      isActive
                                        ? si === stepIdx
                                          ? "bg-nx-cyan text-black"
                                          : "bg-nx-cyan/20 text-nx-cyan"
                                        : "bg-white/5 text-white/20"
                                    }`}
                                  >
                                    {si < stepIdx ? (
                                      <CheckCircle2 className="w-3 h-3" />
                                    ) : (
                                      si + 1
                                    )}
                                  </div>
                                  {si < 4 && (
                                    <div
                                      className={`w-6 h-px ${
                                        isActive ? "bg-nx-cyan/40" : "bg-white/5"
                                      }`}
                                    />
                                  )}
                                </div>
                              );
                            }
                          )}
                        </div>
                        <div className="flex gap-4 mt-2 text-[10px] text-white/20">
                          <span>Seller: {escrow.sellerName}</span>
                          <span>
                            KES {escrow.amount?.toLocaleString()}
                          </span>
                        </div>

                        {/* Status badge + buyer actions */}
                        <div className="mt-3 flex items-center gap-3 flex-wrap">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-medium shrink-0 ${
                              escrow.status === "delivery"
                                ? "bg-nx-cyan/10 text-nx-cyan"
                                : escrow.status === "inspection"
                                ? "bg-amber-400/10 text-amber-400"
                                : escrow.status === "active"
                                ? "bg-white/5 text-white/40"
                                : "bg-white/5 text-white/40"
                            }`}
                          >
                            {statusLabel}
                          </span>

                          {isDisputed && (
                            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-medium bg-red-400/10 text-red-400 shrink-0">
                              <AlertTriangle className="w-3 h-3" />
                              Disputed
                            </span>
                          )}

                          {actionable && !isDisputed && (
                            <div className="flex items-center gap-2 ml-auto">
                              {awaitingConfirmation && (
                                <button
                                  onClick={() => handleConfirm(escrow._id)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-nx-emerald/10 text-nx-emerald text-xs font-medium hover:bg-nx-emerald/20 transition-colors"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Confirm Receipt
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenDispute(escrow._id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-white/40 text-xs font-medium hover:bg-white/10 hover:text-white/60 transition-colors"
                              >
                                <Flag className="w-3.5 h-3.5" />
                                Report Issue
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Buyer-reported dispute form */}
                        {disputingId === escrow._id && (
                          <div className="mt-3 pt-3 border-t border-white/5 space-y-3">
                            <div className="flex items-center gap-2 text-xs text-red-400">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span className="font-medium">Open a dispute</span>
                            </div>
                            <textarea
                              value={disputeDescription}
                              onChange={(e) =>
                                setDisputeDescription(e.target.value)
                              }
                              rows={3}
                              placeholder="Describe the issue (what was wrong, missing, or not as described)..."
                              className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-red-400/30 resize-none"
                            />
                            {disputeError && (
                              <p className="text-xs text-red-400">{disputeError}</p>
                            )}
                            <div className="flex gap-2">
                              <button
                                onClick={() => setDisputingId(null)}
                                className="px-3 py-1.5 rounded-lg bg-white/5 text-white/40 text-xs font-medium hover:bg-white/10 transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleSubmitDispute}
                                disabled={!disputeDescription.trim()}
                                className="px-3 py-1.5 rounded-lg bg-red-400/10 text-red-400 text-xs font-medium hover:bg-red-400/20 transition-colors disabled:opacity-50"
                              >
                                Submit Dispute
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Dispute success banner */}
                        {disputeDone === escrow._id && (
                          <div className="mt-3 pt-3 border-t border-red-400/20 flex items-center gap-2 text-xs text-red-400">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>
                              Dispute opened successfully. Funds are now locked
                              pending review.
                            </span>
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
              <p className="text-sm text-white/40 font-medium">
                No active deliveries
              </p>
              <p className="text-[11px] text-white/20 mt-1 mb-4">
                Shipments will appear here once you place an order
              </p>
              <a
                href="/marketplace"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-nx-violet text-white text-sm font-medium hover:bg-nx-violet/80 transition-colors"
              >
                Browse Marketplace <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </FadeIn>
        )}
      </div>
    </BuyerLayout>
  );
}
