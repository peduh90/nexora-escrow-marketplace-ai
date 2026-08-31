import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import BuyerLayout from "./BuyerLayout";
import { Truck, Shield } from "lucide-react";

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay }} className={className}>{children}</motion.div>;
}

export default function BuyerDeliveries() {
  return (
    <BuyerLayout>
      <div className="space-y-5">
        <FadeIn>
          <h1 className="text-2xl font-bold text-white">Delivery Tracking</h1>
          <p className="text-sm text-white/40 mt-1">All shipments are insured and GPS-tracked</p>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="py-20 text-center rounded-xl bg-white/[0.02] border border-white/5">
            <Truck className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/40 font-medium">No active deliveries</p>
            <p className="text-[11px] text-white/20 mt-1">Your delivery tracking will appear here after placing an order</p>
            <div className="flex items-center justify-center gap-2 mt-4 text-[10px] text-white/15">
              <Shield className="w-3 h-3" />
              <span>All Nexora deliveries are fully insured</span>
            </div>
          </div>
        </FadeIn>
      </div>
    </BuyerLayout>
  );
}
