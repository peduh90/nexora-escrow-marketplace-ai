import { useState } from "react";
import SellerLayout from "./SellerLayout";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Download, CreditCard } from "lucide-react";

export default function SellerWithdrawals() {
  const { user } = useAuth();
  const walletBalance = useQuery(api.wallet.getWalletBalance);
  const transactions = useQuery(api.wallet.getWalletTransactions);

  const availableBalance = walletBalance?.walletBalance ?? 0;
  const escrowBalance = walletBalance?.escrowBalance ?? 0;
  const withdrawals = transactions?.filter(t => t.type === "withdrawal") ?? [];
  const totalWithdrawn = withdrawals.filter(t => t.status === "completed").reduce((s, t) => s + t.amount, 0);

  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("mpesa");

  return (
    <SellerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Withdrawals</h1>
            <p className="text-sm text-white/40 mt-1">Withdraw your available earnings</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            disabled={availableBalance <= 0}
            className="px-4 py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-500/80 transition-colors flex items-center gap-2 disabled:opacity-40"
          >
            <Download className="w-4 h-4" /> Withdraw
          </button>
        </div>

        {/* Balance */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-400/10 to-emerald-400/5 border border-emerald-400/10">
            <p className="text-xs text-white/30 mb-1">Available for Withdrawal</p>
            <p className="text-3xl font-bold text-white">KES {availableBalance.toLocaleString()}</p>
            {availableBalance > 0 && <p className="text-[10px] text-emerald-400/60 mt-2">✓ Ready to withdraw</p>}
          </div>
          <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-xs text-white/30 mb-1">In Escrow</p>
            <p className="text-3xl font-bold text-white">KES {escrowBalance.toLocaleString()}</p>
            {escrowBalance > 0 && <p className="text-[10px] text-amber-400/60 mt-2">🔒 Protected</p>}
          </div>
          <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-xs text-white/30 mb-1">Total Withdrawn</p>
            <p className="text-3xl font-bold text-white">KES {totalWithdrawn.toLocaleString()}</p>
            {totalWithdrawn > 0 && <p className="text-[10px] text-nx-cyan/60 mt-2">Lifetime withdrawals</p>}
          </div>
        </div>

        {/* Withdrawal History */}
        <div className="rounded-xl bg-white/[0.02] border border-white/5">
          <div className="px-5 py-4 border-b border-white/5">
            <h3 className="text-sm font-semibold text-white">Withdrawal History</h3>
          </div>
          {withdrawals.length === 0 ? (
            <div className="py-16 text-center">
              <CreditCard className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/30">No withdrawals yet</p>
              <p className="text-[11px] text-white/15 mt-1">Withdraw your earnings via M-Pesa or bank transfer</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.03]">
              {withdrawals.map((w) => (
                <div key={w._id} className="px-5 py-3.5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/[0.03] flex items-center justify-center shrink-0">
                    <Download className="w-5 h-5 text-white/20" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{w.description}</p>
                    <p className="text-xs text-white/30 mt-0.5">{w.reference}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium text-white/60">-KES {w.amount.toLocaleString()}</p>
                    <p className={`text-[10px] mt-0.5 capitalize ${
                      w.status === "completed" ? "text-emerald-400" :
                      w.status === "pending" ? "text-amber-400" :
                      "text-white/30"
                    }`}>{w.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Withdraw Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <div className="relative w-full max-w-md rounded-2xl bg-[#0E0E18] border border-white/5 shadow-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-1">Withdraw Funds</h3>
              <p className="text-xs text-white/30 mb-5">Available: KES {availableBalance.toLocaleString()}</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">Amount (KES)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    max={availableBalance}
                    className="w-full px-4 py-3 rounded-lg bg-white/[0.03] border border-white/5 text-xl text-white placeholder:text-white/20 focus:outline-none focus:border-nx-cyan/30 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">Method</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setMethod("mpesa")}
                      className={`p-3 rounded-lg border text-sm text-center transition-colors ${method === "mpesa" ? "border-emerald-400/40 bg-emerald-400/5 text-emerald-400" : "border-white/5 bg-white/[0.02] text-white/40"}`}
                    >
                      M-Pesa
                    </button>
                    <button
                      onClick={() => setMethod("bank")}
                      className={`p-3 rounded-lg border text-sm text-center transition-colors ${method === "bank" ? "border-nx-cyan/40 bg-nx-cyan/5 text-nx-cyan" : "border-white/5 bg-white/[0.02] text-white/40"}`}
                    >
                      Bank Transfer
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-lg text-sm text-white/40 hover:text-white/60 transition-colors">Cancel</button>
                <button
                  disabled={!amount || Number(amount) <= 0 || Number(amount) > availableBalance}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-500/80 text-white text-sm font-medium transition-colors disabled:opacity-40"
                >
                  Withdraw
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SellerLayout>
  );
}
