import SellerLayout from "./SellerLayout";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import {
  Wallet, ArrowUpRight, ArrowDownRight, TrendingUp,
  Clock, CheckCircle2, Download, RefreshCw, Eye, EyeOff, Phone,
} from "lucide-react";

export default function SellerEarnings() {
  const { user } = useAuth();
  const walletTxs = useQuery(api.wallet.getWalletBalance);
  const allTransactions = useQuery(api.wallet.getWalletTransactions);
  const [showBalance, setShowBalance] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const balance = walletTxs?.walletBalance ?? 0;
  const escrowBalance = walletTxs?.escrowBalance ?? 0;
  const transactions = allTransactions ?? [];
  const totalCompleted = transactions.filter(t => t.status === "completed" && t.type !== "withdrawal").reduce((s, t) => s + t.amount, 0);
  const totalWithdrawn = transactions.filter(t => t.type === "withdrawal" && t.status === "completed").reduce((s, t) => s + t.amount, 0);

  return (
    <SellerLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-white">Earnings & Wallet</h2>
          <p className="text-xs text-white/30 mt-0.5">Manage your balance and withdraw via M-Pesa</p>
        </div>
        <button onClick={() => setShowWithdrawModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-500/80 text-white text-sm font-medium transition-colors">
          <Download className="w-4 h-4" /> Withdraw
        </button>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/10">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-emerald-400" />
            </div>
            <button onClick={() => setShowBalance(!showBalance)} className="text-white/30 hover:text-white/60">
              {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">
            {showBalance ? `KES ${balance.toLocaleString()}` : "••••••"}
          </p>
          <p className="text-xs text-white/30 mt-1">Available Balance</p>
        </div>

        <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center mb-3">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">KES {escrowBalance.toLocaleString()}</p>
          <p className="text-xs text-white/30 mt-1">In Escrow (Pending)</p>
        </div>

        <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="w-10 h-10 rounded-xl bg-nx-violet/10 flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5 text-nx-violet" />
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">KES {totalCompleted.toLocaleString()}</p>
          <p className="text-xs text-white/30 mt-1">Total Deposits</p>
        </div>
      </div>

      {/* Commission info */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 mb-6">
        <h3 className="text-sm font-semibold text-white mb-3">Commission Structure</h3>
        <div className="space-y-2">
          {[
            { tier: "Standard", rate: "3%", desc: "Applied to all transactions", current: true },
            { tier: "Professional", rate: "2.5%", desc: "KES 999/month subscription" },
            { tier: "Enterprise", rate: "0.5%", desc: "KES 4,999/month subscription" },
          ].map((t) => (
            <div key={t.tier} className={`flex items-center gap-4 p-3 rounded-lg ${t.current ? "bg-nx-violet/5 border border-nx-violet/10" : "bg-white/[0.01]"}`}>
              <span className={`text-sm font-bold ${t.current ? "text-nx-violet" : "text-white/30"}`}>{t.rate}</span>
              <div className="flex-1">
                <p className={`text-sm ${t.current ? "text-white" : "text-white/40"}`}>{t.tier}</p>
                <p className="text-[11px] text-white/30">{t.desc}</p>
              </div>
              {t.current && <span className="text-[10px] px-2 py-0.5 rounded-full bg-nx-violet/10 text-nx-violet">Current</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Transaction history */}
      <div className="rounded-xl bg-white/[0.02] border border-white/5">
        <div className="px-5 py-4 border-b border-white/5">
          <h3 className="text-sm font-semibold text-white">Transaction History</h3>
        </div>
        {transactions.length === 0 ? (
          <div className="py-12 text-center">
            <Wallet className="w-8 h-8 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/30">No transactions yet</p>
            <p className="text-[11px] text-white/15 mt-1">Transactions will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.03]">
            {transactions.slice(0, 20).map((tx) => (
              <div key={tx._id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-white/[0.01] transition-colors">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  tx.type === "deposit" || tx.type === "escrow_release" ? "bg-emerald-400/10" :
                  tx.type === "withdrawal" ? "bg-blue-400/10" : "bg-white/5"
                }`}>
                  {tx.type === "withdrawal" ? (
                    <ArrowDownRight className="w-5 h-5 text-blue-400" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{tx.description}</p>
                  <p className="text-xs text-white/30 mt-0.5">{tx.reference}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${tx.type !== "withdrawal" ? "text-emerald-400" : "text-white/60"}`}>
                    KES {tx.amount.toLocaleString()}
                  </p>
                  <p className={`text-[10px] ${tx.status === "completed" ? "text-emerald-400/60" : "text-amber-400/60"}`}>
                    {tx.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showWithdrawModal && (
        <WithdrawModal onClose={() => setShowWithdrawModal(false)} balance={balance} />
      )}
    </SellerLayout>
  );
}

function WithdrawModal({ onClose, balance }: { onClose: () => void; balance: number }) {
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleWithdraw = () => {
    setProcessing(true);
    setTimeout(() => { setProcessing(false); onClose(); }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-[#0E0E18] border border-white/5 shadow-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-1">Withdraw Funds</h3>
        <p className="text-xs text-white/30 mb-6">Funds will be sent to your M-Pesa account</p>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">Amount (KES)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0"
              className="w-full px-4 py-3 rounded-lg bg-white/[0.03] border border-white/5 text-xl text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-400/30 font-bold" />
            <button onClick={() => setAmount(String(balance))} className="text-[11px] text-nx-violet hover:text-nx-violet/80 mt-2">Max: KES {balance.toLocaleString()}</button>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">M-Pesa Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712 345 678"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-400/30" />
            </div>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-white/40">You receive</span>
              <span className="text-emerald-400 font-medium">KES {Number(amount || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg text-sm text-white/40 hover:text-white/60 hover:bg-white/[0.03] transition-colors">Cancel</button>
          <button onClick={handleWithdraw} disabled={!amount || !phone || processing || Number(amount) > balance}
            className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-500/80 text-white text-sm font-medium transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
            {processing ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</> : "Withdraw to M-Pesa"}
          </button>
        </div>
      </div>
    </div>
  );
}
