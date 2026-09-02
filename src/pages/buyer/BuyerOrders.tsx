import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import BuyerLayout from "./BuyerLayout";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  ShoppingCart, Package, Truck, CheckCircle2, Clock, Shield,
  MessageSquare, AlertTriangle, Star, X, Send,
} from "lucide-react";

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay }} className={className}>{children}</motion.div>
  );
}

const statusMap: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  created: { label: "Order Created", color: "text-nx-gold", bg: "bg-nx-gold/10", icon: Clock },
  funded: { label: "Funds Secured", color: "text-nx-cyan", bg: "bg-nx-cyan/10", icon: Shield },
  active: { label: "Processing", color: "text-nx-cyan", bg: "bg-nx-cyan/10", icon: Package },
  delivery: { label: "In Transit", color: "text-nx-cyan", bg: "bg-nx-cyan/10", icon: Truck },
  inspection: { label: "Awaiting Confirmation", color: "text-nx-gold", bg: "bg-nx-gold/10", icon: Shield },
  released: { label: "Completed", color: "text-nx-emerald", bg: "bg-nx-emerald/10", icon: CheckCircle2 },
  completed: { label: "Completed", color: "text-nx-emerald", bg: "bg-nx-emerald/10", icon: CheckCircle2 },
  disputed: { label: "Disputed", color: "text-red-400", bg: "bg-red-400/10", icon: AlertTriangle },
  refunded: { label: "Refunded", color: "text-white/40", bg: "bg-white/5", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "text-white/40", bg: "bg-white/5", icon: CheckCircle2 },
};

function RatingModal({ open, onClose, sellerId, sellerName, listingId }: {
  open: boolean;
  onClose: () => void;
  sellerId: string;
  sellerName: string;
  listingId: string;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const createReview = useMutation(api.reviews.createReview);

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) return;
    setSubmitting(true);
    setError("");
    try {
      await createReview({
        orderId: listingId + "-" + Date.now(),
        listingId,
        sellerId,
        rating,
        comment: comment || undefined,
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl bg-[#0A0A14] border border-white/10 p-6 space-y-5"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Rate Seller</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-nx-emerald mx-auto" />
            <p className="text-sm font-medium text-white">Review Submitted!</p>
            <p className="text-xs text-white/40">Thank you for rating {sellerName}</p>
            <button onClick={onClose} className="mt-4 px-6 py-2.5 rounded-xl bg-nx-cyan text-black text-sm font-semibold hover:bg-nx-cyan/80 transition-colors">
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="text-center space-y-2">
              <p className="text-sm text-white/60">How was your experience with</p>
              <p className="text-base font-semibold text-white">{sellerName}</p>
            </div>

            {/* Star rating */}
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoveredStar || rating)
                        ? "text-nx-gold fill-nx-gold"
                        : "text-white/10"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-white/30">
              {rating === 1 ? "Poor" : rating === 2 ? "Fair" : rating === 3 ? "Good" : rating === 4 ? "Very Good" : "Excellent"}
            </p>

            {/* Comment */}
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Leave a comment (optional)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Share your experience with this seller..."
                className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-cyan/30 focus:outline-none resize-none"
              />
            </div>

            {error && <p className="text-xs text-red-400 text-center">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-nx-cyan text-black font-semibold text-sm hover:bg-nx-cyan/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <span className="animate-spin w-4 h-4 border-2 border-black/30 border-t-black rounded-full" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function BuyerOrders() {
  const escrows = useQuery(api.wallet.getEscrowByBuyer);
  const orders = escrows ?? [];

  const [ratingModal, setRatingModal] = useState<{ sellerId: string; sellerName: string; listingId: string } | null>(null);

  const statusCounts = {
    total: orders.length,
    inTransit: orders.filter(o => ["delivery", "inspection"].includes(o.status)).length,
    pending: orders.filter(o => ["created", "funded", "active"].includes(o.status)).length,
    completed: orders.filter(o => ["released", "completed"].includes(o.status)).length,
  };

  return (
    <BuyerLayout>
      <div className="space-y-5">
        <FadeIn>
          <h1 className="text-2xl font-bold text-white">My Orders</h1>
          <p className="text-sm text-white/40 mt-1">Track and manage all your purchases</p>
        </FadeIn>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Orders", value: String(statusCounts.total), color: "#8B5CF6" },
            { label: "In Transit", value: String(statusCounts.inTransit), color: "#06B6D4" },
            { label: "Awaiting Confirm", value: String(statusCounts.pending), color: "#F59E0B" },
            { label: "Completed", value: String(statusCounts.completed), color: "#10B981" },
          ].map((s, i) => (
            <FadeIn key={i} delay={i * 0.05}>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[11px] text-white/30 mt-1">{s.label}</p>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Orders list */}
        {orders.length === 0 ? (
          <FadeIn>
            <div className="py-20 text-center rounded-xl bg-white/[0.02] border border-white/5">
              <ShoppingCart className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/40 font-medium">No orders yet</p>
              <p className="text-[11px] text-white/20 mt-1">Your purchases will appear here after checkout</p>
            </div>
          </FadeIn>
        ) : (
          <div className="space-y-3">
            {orders.map((order, i) => {
              const st = statusMap[order.status] ?? statusMap.created;
              const Icon = st.icon;
              const canRate = ["released", "completed"].includes(order.status);
              return (
                <FadeIn key={order._id} delay={i * 0.04}>
                  <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:border-white/10 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-white/[0.03] flex items-center justify-center shrink-0">
                        <Icon className={`w-5 h-5 ${st.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-white truncate">{order.title}</span>
                          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${st.color} ${st.bg}`}>{st.label}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-white/30">
                          <span>Seller: {order.sellerName || "Unknown"}</span>
                          {order.deliveryCounty && <span>{order.deliveryTown || ""} {order.deliveryCounty}</span>}
                          <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 space-y-1">
                        <p className="text-sm font-bold text-white">KES {order.amount.toLocaleString()}</p>
                        {canRate && (
                          <button
                            onClick={() => setRatingModal({
                              sellerId: order.sellerId,
                              sellerName: order.sellerName || "Seller",
                              listingId: order._id,
                            })}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-nx-gold/10 text-nx-gold text-[10px] font-medium hover:bg-nx-gold/20 transition-colors"
                          >
                            <Star className="w-3 h-3" /> Rate Seller
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        )}
      </div>

      {/* Rating Modal */}
      <RatingModal
        open={!!ratingModal}
        onClose={() => setRatingModal(null)}
        sellerId={ratingModal?.sellerId || ""}
        sellerName={ratingModal?.sellerName || ""}
        listingId={ratingModal?.listingId || ""}
      />
    </BuyerLayout>
  );
}
