import { useState } from "react";
import SellerLayout from "./SellerLayout";
import { Truck, Package, MapPin, Clock, CheckCircle2, AlertTriangle, Shield } from "lucide-react";

const deliveries = [
  { id: "DLV-042", orderId: "NX-20485", product: "HP EliteBook 840 G3", buyer: "John Kamau", from: "Westlands, Nairobi", to: "Kisumu Town", status: "in_transit", driver: "John Kamau", tracking: "NX-4829-KE", eta: "Tomorrow 2PM", insurance: true, km: 340, pickupReady: true },
  { id: "DLV-040", orderId: "NX-20482", product: "iPhone 15 Pro Max", buyer: "Sarah Wanjiku", from: "CBD, Nairobi", to: "Nyali, Mombasa", status: "awaiting_pickup", driver: "Pending", tracking: "NX-4827-KE", eta: "3-4 days", insurance: true, km: 485, pickupReady: true },
  { id: "DLV-038", orderId: "NX-20479", product: "Samsung Galaxy S24", buyer: "Peter Otieno", from: "Karen, Nairobi", to: "CBD, Nairobi", status: "delivered", driver: "Peter Ochieng", tracking: "NX-4826-KE", eta: "Completed", insurance: true, km: 25, pickupReady: true },
];

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  awaiting_pickup: { label: "Awaiting Pickup", color: "text-amber-400", bg: "bg-amber-400/10" },
  in_transit: { label: "In Transit", color: "text-blue-400", bg: "bg-blue-400/10" },
  delivered: { label: "Delivered", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  issue: { label: "Issue", color: "text-red-400", bg: "bg-red-400/10" },
};

export default function SellerDelivery() {
  return (
    <SellerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Delivery</h1>
          <p className="text-sm text-white/40 mt-1">Track Nexora Market-managed deliveries</p>
        </div>

        <div className="p-4 rounded-xl bg-nx-violet/5 border border-nx-violet/10">
          <p className="text-xs text-white/40">
            <span className="text-nx-violet font-medium">Delivery is handled by Nexora Market.</span> Once you mark a product as "Ready for Collection", Nexora Market will collect and deliver it. You do not need to arrange delivery.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-amber-400/5 border border-amber-400/10">
            <p className="text-2xl font-bold text-amber-400">1</p>
            <p className="text-[11px] text-white/30">Awaiting Pickup</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-2xl font-bold text-blue-400">1</p>
            <p className="text-[11px] text-white/30">In Transit</p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-400/5 border border-emerald-400/10">
            <p className="text-2xl font-bold text-emerald-400">1</p>
            <p className="text-[11px] text-white/30">Delivered</p>
          </div>
        </div>

        <div className="space-y-3">
          {deliveries.map(d => {
            const st = statusConfig[d.status];
            const steps = ["Ready", "Picked Up", "In Transit", "Delivered"];
            const activeStep = d.status === "delivered" ? 3 : d.status === "in_transit" ? 2 : 0;
            return (
              <div key={d.id} className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/[0.03] flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-white/20" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-white">{d.product}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.color} ${st.bg}`}>{st.label}</span>
                      {d.insurance && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-400/10 text-emerald-400">Insured</span>}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-white/30">
                      <span>{d.buyer}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {d.from} → {d.to}</span>
                      <span>•</span>
                      <span>{d.km} km</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-mono text-white/40">{d.tracking}</p>
                    <p className="text-[10px] text-white/25 mt-0.5">ETA: {d.eta}</p>
                    <p className="text-[10px] text-white/20 mt-0.5">Driver: {d.driver}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1">
                  {steps.map((step, i) => (
                    <div key={step} className="flex-1 flex items-center gap-1">
                      <div className={`w-full h-1.5 rounded-full ${i <= activeStep ? "bg-nx-cyan" : "bg-white/[0.05]"}`} />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[9px] text-white/20 mt-1">
                  {steps.map(s => <span key={s}>{s}</span>)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SellerLayout>
  );
}
