import SellerLayout from "./SellerLayout";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { TrendingUp, Clock } from "lucide-react";

/**
 * Offers / price negotiation.
 *
 * There is no offers feature in the platform yet — no table, no backend. The
 * old version showed fake "0 pending / 0 countered / 0 accepted" summary cards
 * and a dead filter over wallet references that can never match, which looked
 * broken. This is now an honest placeholder until the negotiation feature
 * ships.
 */
export default function SellerOffers() {
  const escrowTxns = useQuery(api.wallet.getWalletTransactions);
  const hasActivity = (escrowTxns?.length ?? 0) > 0;

  return (
    <SellerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Offers</h1>
          <p className="text-sm text-white/40 mt-1">Price negotiations from buyers</p>
        </div>

        <div className="py-20 text-center rounded-xl bg-white/[0.02] border border-white/5">
          <TrendingUp className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/40 font-medium">Offer negotiations are coming soon</p>
          <p className="text-[11px] text-white/20 mt-1 max-w-sm mx-auto">
            Buyers will be able to propose a price on your listings and you'll counter or
            accept — with the agreed amount protected by Nexora escrow.
          </p>
        </div>

        {hasActivity && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-nx-cyan/[0.04] border border-nx-cyan/10">
            <Clock className="w-4 h-4 text-nx-cyan shrink-0" />
            <p className="text-[11px] text-white/40">
              Your orders and escrow activity keep working normally in the meantime —
              see <span className="text-white/60">Orders</span> for live transactions.
            </p>
          </div>
        )}
      </div>
    </SellerLayout>
  );
}
