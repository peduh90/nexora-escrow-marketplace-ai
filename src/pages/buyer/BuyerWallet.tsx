import BuyerLayout from "./BuyerLayout";
import { useState } from "react";
import { Wallet, ArrowUpRight, ArrowDownRight, Send, Download, Copy, CheckCircle2, Clock, Shield, Phone } from "lucide-react";

const mockWallet = {
  balance: 67500,
  inEscrow: 439500,
  pending: 0,
};

const mockTransactions = [
  { id: "W-301", type: "deposit" as const, description: "M-Pesa Deposit", amount: 50000, status: "completed" as const, date: "Jan 28, 2025" },
  { id: "W-298", type: "escrow_fund" as const, description: "Escrow - MacBook Pro 14\"", amount: -285000, status: "completed" as const, date: "Jan 27, 2025" },
  { id: "W-295", type: "escrow_fund" as const, description: "Escrow - iPhone 15 Pro Max", amount: -142000, status: "completed" as const, date: "Jan 25, 2025" },
  { id: "W-290", type: "deposit" as const, description: "M-Pesa Deposit", amount: 200000, status: "completed" as const, date: "Jan 22, 2025" },
  { id: "W-285", type: "escrow_fund" as const, description: "Escrow - Nike Air Max 90", amount: -12500, status: "completed" as const, date: "Jan 20, 2025" },
  { id: "W-280", type: "refund" as const, description: "Refund - Dell Monitor", amount: 45000, status: "completed" as const, date: "Jan 15, 2025" },
];

const txConfig: Record<string, { icon: typeof Wallet; color: string }> = {
  deposit: { icon: ArrowDownRight, color: "text-emerald-400 bg-emerald-400/10" },
  escrow_fund: { icon: Shield, color: "text-nx-cyan bg-nx-cyan/10" },
  refund: { icon: ArrowDownRight, color: "text-emerald-400 bg-emerald-400/10" },
  withdrawal: { icon: ArrowUpRight, color: "text-white/40 bg-white/5" },
};

export default function BuyerWallet() {
  const [showDeposit, setShowDeposit] = useState(false);

  return (
    <BuyerLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-white">Market Wallet</h2>
          <p className="text-xs text-white/30 mt-0.5">Your Nexora wallet for secure transactions</p>
        </div>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-5 rounded-xl bg-gradient-to-br from-nx-cyan/10 to-nx-cyan/5 border border-nx-cyan/10">
          <Wallet className="w-8 h-8 text-nx-cyan mb-3" />
          <p className="text-3xl font-bold text-white tracking-tight">KES {mockWallet.balance.toLocaleString()}</p>
          <p className="text-xs text-white/30 mt-1">Available Balance</p>
        </div>
        <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
          <Shield className="w-8 h-8 text-amber-400 mb-3" />
          <p className="text-3xl font-bold text-white tracking-tight">KES {mockWallet.inEscrow.toLocaleString()}</p>
          <p className="text-xs text-white/30 mt-1">Protected in Escrow</p>
        </div>
        <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
          <Clock className="w-8 h-8 text-nx-violet mb-3" />
          <p className="text-3xl font-bold text-white tracking-tight">KES {mockWallet.pending.toLocaleString()}</p>
          <p className="text-xs text-white/30 mt-1">Pending Releases</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <button onClick={() => setShowDeposit(true)} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-nx-cyan/20 hover:bg-nx-cyan/5 transition-all">
          <div className="w-10 h-10 rounded-lg bg-emerald-400/10 flex items-center justify-center">
            <Download className="w-5 h-5 text-emerald-400" />
          </div>
          <span className="text-xs text-white/60">Deposit</span>
        </button>
        <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-nx-cyan/20 transition-all">
          <div className="w-10 h-10 rounded-lg bg-nx-cyan/10 flex items-center justify-center">
            <Send className="w-5 h-5 text-nx-cyan" />
          </div>
          <span className="text-xs text-white/60">Send</span>
        </button>
        <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-nx-cyan/20 transition-all">
          <div className="w-10 h-10 rounded-lg bg-nx-violet/10 flex items-center justify-center">
            <Copy className="w-5 h-5 text-nx-violet" />
          </div>
          <span className="text-xs text-white/60">Receive</span>
        </button>
        <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-nx-cyan/20 transition-all">
          <div className="w-10 h-10 rounded-lg bg-amber-400/10 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5 text-amber-400" />
          </div>
          <span className="text-xs text-white/60">Withdraw</span>
        </button>
      </div>

      {/* Transaction history */}
      <div className="rounded-xl bg-white/[0.02] border border-white/5">
        <div className="px-5 py-4 border-b border-white/5">
          <h3 className="text-sm font-semibold text-white">Transaction History</h3>
        </div>
        <div className="divide-y divide-white/[0.03]">
          {mockTransactions.map((tx) => {
            const config = txConfig[tx.type] || txConfig.deposit;
            const Icon = config.icon;
            return (
              <div key={tx.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-white/[0.01] transition-colors">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.color.split(" ").slice(1).join(" ")}`}>
                  <Icon className={`w-5 h-5 ${config.color.split(" ")[0]}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{tx.description}</p>
                  <p className="text-xs text-white/30 mt-0.5">{tx.date}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${tx.amount > 0 ? "text-emerald-400" : "text-white/60"}`}>
                    {tx.amount > 0 ? "+" : ""}KES {Math.abs(tx.amount).toLocaleString()}
                  </p>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    {tx.status === "completed" ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400/60" />
                    ) : (
                      <Clock className="w-3 h-3 text-amber-400/60" />
                    )}
                    <span className="text-[10px] text-white/30 capitalize">{tx.status}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deposit Modal */}
      {showDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeposit(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-[#0E0E18] border border-white/5 shadow-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-1">Deposit Funds</h3>
            <p className="text-xs text-white/30 mb-6">Add funds via M-Pesa</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">Amount (KES)</label>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full px-4 py-3 rounded-lg bg-white/[0.03] border border-white/5 text-xl text-white placeholder:text-white/20 focus:outline-none focus:border-nx-cyan/30 font-bold"
                />
                <div className="flex items-center gap-2 mt-2">
                  {[1000, 5000, 10000, 50000].map((amt) => (
                    <button key={amt} className="px-2.5 py-1 rounded bg-white/[0.03] text-[11px] text-white/40 hover:text-white/60 hover:bg-white/[0.05] transition-colors">
                      {amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">M-Pesa Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input
                    type="tel"
                    placeholder="0712 345 678"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-nx-cyan/30"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowDeposit(false)} className="flex-1 px-4 py-2.5 rounded-lg text-sm text-white/40 hover:text-white/60 transition-colors">
                Cancel
              </button>
              <button className="flex-1 px-4 py-2.5 rounded-lg bg-nx-cyan hover:bg-nx-cyan/80 text-white text-sm font-medium transition-colors">
                Deposit via M-Pesa
              </button>
            </div>
          </div>
        </div>
      )}
    </BuyerLayout>
  );
}
