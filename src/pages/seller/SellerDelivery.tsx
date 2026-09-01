import { useState } from "react";
import SellerLayout from "./SellerLayout";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Truck, Package, MapPin, Shield } from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Awaiting Pickup", color: "text-amber-400", bg: "bg-amber-400/10" },
  assigned: { label: "Assigned", color: "text-nx-violet", bg: "bg-nx-violet/10" },
  picked_up: { label: "Picked Up", color: "text-blue-400", bg: "bg-blue-400/10" },
  in_transit: { label: "In Transit", color: "text-blue-400", bg: "bg-blue-400/10" },
  delivered: { label: "Delivered", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  failed: { label: "Failed", color: "text-red-400", bg: "bg-red-400/10" },
  cancelled: { label: "Cancelled", color: "text-white/40", bg: "bg-white/5" },
};

export default function SellerDelivery() {
  const { user } = useAuth();
  const deliveries = useQuery(api.wallet.getWalletTransactions) ?? [];
  // For now, show empty state since deliveries table isn't linked to seller view yet
  // In production, this would query deliveries tied to this seller's orders

  const activeDeliveries = 0;
  const inTransit = 0;
  const completed = 0;

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
            <p className="text-2xl font-bold text-amber-400">{activeDeliveries}</p>
            <p className="text-[11px] text-white/30">Awaiting Pickup</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-2xl font-bold text-blue-400">{inTransit}</p>
            <p className="text-[11px] text-white/30">In Transit</p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-400/5 border border-emerald-400/10">
            <p className="text-2xl font-bold text-emerald-400">{completed}</p>
            <p className="text-[11px] text-white/30">Delivered</p>
          </div>
        </div>

        {/* Empty state — real deliveries will appear here once orders with transport are placed */}
        <div className="text-center py-16 rounded-xl bg-white/[0.02] border border-white/5">
          <Truck className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/40 font-medium">No active deliveries</p>
          <p className="text-[11px] text-white/20 mt-1">Deliveries will appear here once buyers place orders with Nexora Transport</p>
        </div>
      </div>
    </SellerLayout>
  );
}
