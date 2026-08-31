import SellerLayout from "./SellerLayout";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { TrendingUp } from "lucide-react";

export default function SellerOffers() {
  const { user } = useAuth();
  const escrowTxns = useQuery(api.wallet.getWalletTransactions);
  const offers = escrowTxns?.filter(t => t.type === "escrow_fund" && t.reference.startsWith("offer-")) ?? [];

  return (
    <SellerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Offers</h1>
          <p className="text-sm text-white/40 mt-1">Manage price negotiations from buyers</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-amber-400/5 border border-amber-400/10">
            <p className="text-2xl font-bold text-amber-400">0</p>
            <p className="text-[11px] text-white/30 mt-1">Pending Offers</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-2xl font-bold text-nx-cyan">0</p>
            <p className="text-[11px] text-white/30 mt-1">Countered</p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-400/5 border border-emerald-400/10">
            <p className="text-2xl font-bold text-emerald-400">0</p>
            <p className="text-[11px] text-white/30 mt-1">Accepted</p>
          </div>
        </div>

        {/* Empty state */}
        <div className="py-20 text-center rounded-xl bg-white/[0.02] border border-white/5">
          <TrendingUp className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/40 font-medium">No offers yet</p>
          <p className="text-[11px] text-white/20 mt-1">Buyer offers will appear here when they negotiate on your listings</p>
        </div>
      </div>
    </SellerLayout>
  );
}
