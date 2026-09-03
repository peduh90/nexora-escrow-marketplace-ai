import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useNavigate } from "react-router";
import SellerLayout from "./SellerLayout";
import { Truck, Package, Shield, ArrowLeft, Clock, CheckCircle2 } from "lucide-react";

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay }} className={className}>{children}</motion.div>;
}

export default function SellerDelivery() {
  const navigate = useNavigate();

  return (
    <SellerLayout>
      <div className="space-y-5">
        {/* Back button */}
        <FadeIn>
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => navigate("/seller")}
              className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Delivery Management</h1>
              <p className="text-sm text-white/40 mt-1">Track Nexora Market-managed deliveries</p>
            </div>
          </div>
        </FadeIn>

        {/* Transport info */}
        <FadeIn delay={0.05}>
          <div className="p-4 rounded-xl border border-nx-cyan/10 bg-nx-cyan/[0.02]">
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-nx-cyan shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">Delivery is handled by Nexora Market</p>
                <p className="text-[11px] text-white/30">Once you mark a product as "Ready for Collection", Nexora Market will collect and deliver it. You do not need to arrange delivery.</p>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Status summary */}
        <FadeIn delay={0.08}>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
              <Package className="w-5 h-5 text-amber-400 mx-auto mb-2" />
              <p className="text-lg font-bold text-white">0</p>
              <p className="text-[10px] text-white/30">Awaiting Pickup</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
              <Truck className="w-5 h-5 text-nx-cyan mx-auto mb-2" />
              <p className="text-lg font-bold text-white">0</p>
              <p className="text-[10px] text-white/30">In Transit</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
              <p className="text-lg font-bold text-white">0</p>
              <p className="text-[10px] text-white/30">Delivered</p>
            </div>
          </div>
        </FadeIn>

        {/* Empty state */}
        <FadeIn delay={0.1}>
          <div className="text-center py-16 rounded-xl bg-white/[0.02] border border-white/5">
            <Package className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/40 font-medium">No active deliveries</p>
            <p className="text-[11px] text-white/20 mt-1 mb-4">Deliveries will appear here once buyers place orders with Nexora Transport</p>
          </div>
        </FadeIn>
      </div>
    </SellerLayout>
  );
}
