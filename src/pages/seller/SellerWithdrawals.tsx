import { useState } from "react";
import SellerLayout from "./SellerLayout";
import { Download, Clock, CheckCircle2, XCircle, CreditCard, Phone, Building2 } from "lucide-react";

const withdrawals = [
  { id: "WD-001", amount: 20000, method: "M-Pesa", destination: "+254 712 ***678", status: "completed", date: "Jan 28, 2025", fee: 0 },
  { id: "WD-002", amount: 50000, method: "Bank", destination: "KCB ••••4567", status: "completed", date: "Jan 22, 2025", fee: 100 },
  { id: "WD-003", amount: 15000, method: "M-Pesa", destination: "+254 712 ***678", status: "processing", date: "Jan 20, 2025", fee: 0 },
  { id: "WD-004", amount: 30000, method: "M-Pesa", destination: "+254 712 ***678", status: "failed", date: "Jan 15, 2025", fee: 0 },
];

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "Pending", color: "text-amber-400", icon: Clock },
  processing: { label: "Processing", color: "text-nx-cyan", icon: Clock },
  completed: { label: "Completed", color: "text-emerald-400", icon: CheckCircle2 },
  failed: { label: "Failed", color: "text-red-400", icon: XCircle },
};

export default function SellerWithdrawals() {
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("mpesa");
  const availableBalance = 125400;

  return (
    <SellerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Withdrawals</h1>
            <p className="text-sm text-white/40 mt-1">Withdraw your available earnings</p>
          </div>
          <button onClick={() => setShowModal(true)} className="px-4 py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-500/80 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" /> Withdraw
          </button>
        </div>

        {/* Balance */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-400/10 to-emerald-400/5 border border-emerald-400/10">
            <p className="text-xs text-white/30 mb-1">Available for Withdrawal</p>
            <p className="text-3xl font-bold text-white">KSh {availableBalance.toLocaleString()}</p>
            <p className="text-[10px] text-emerald-400/60 mt-2">✓ Ready to withdraw</p>
          </div>
          <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-xs text-white/30 mb-1">In Escrow</p>
            <p className="text-3xl font-bold text-white">KSh 78,500</p>
            <p className="text-[10px] text-amber-400/60 mt-2">🔒 Protected</p>
          </div>
          <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-xs text-white/30 mb-1">Total Withdrawn</p>
            <p className="text-3xl font-bold text-white">KSh 185,000</p>
          </div>
        </div>

        {/* Withdrawal history */}
        <div className="rounded-xl bg-white/[0.02] border border-white/5">
          <div className="px-5 py-4 border-b border-white/5">
            <h3 className="text-sm font-semibold text-white">Withdrawal History</h3>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {withdrawals.map(w => {
              const st = statusConfig[w.status];
              return (
                <div key={w.id} className="px-5 py-3.5 flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${w.method === "M-Pesa" ? "bg-emerald-400/10" : "bg-nx-cyan/10"}`}>
                    {w.method === "M-Pesa" ? <Phone className="w-4 h-4 text-emerald-400" /> : <Building2 className="w-4 h-4 text-nx-cyan" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white">KSh {w.amount.toLocaleString()}</span>
                      <span className={`text-[10px] flex items-center gap-1 ${st.color}`}><st.icon className="w-3 h-3" /> {st.label}</span>
                    </div>
                    <p className="text-[11px] text-white/30">{w.method} • {w.destination} • {w.date}</p>
                  </div>
                  {w.fee > 0 && <span className="text-[10px] text-white/20">Fee: KSh {w.fee}</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Withdraw modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <div className="relative w-full max-w-md rounded-2xl bg-[#0E0E18] border border-white/5 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Withdraw Funds</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Amount (KSh)</label>
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0"
                    className="w-full px-4 py-3 rounded-lg bg-white/[0.03] border border-white/5 text-xl text-white font-bold focus:outline-none focus:border-emerald-400/30" />
                  <button onClick={() => setAmount(String(availableBalance))} className="text-xs text-emerald-400 mt-1">Max: KSh {availableBalance.toLocaleString()}</button>
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Method</label>
                  <div className="flex gap-2">
                    <button onClick={() => setMethod("mpesa")} className={`flex-1 p-3 rounded-lg border text-sm flex items-center gap-2 ${method === "mpesa" ? "border-emerald-400/30 bg-emerald-400/5 text-emerald-400" : "border-white/5 bg-white/[0.02] text-white/40"}`}>
                      <Phone className="w-4 h-4" /> M-Pesa
                    </button>
                    <button onClick={() => setMethod("bank")} className={`flex-1 p-3 rounded-lg border text-sm flex items-center gap-2 ${method === "bank" ? "border-nx-cyan/30 bg-nx-cyan/5 text-nx-cyan" : "border-white/5 bg-white/[0.02] text-white/40"}`}>
                      <Building2 className="w-4 h-4" /> Bank
                    </button>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-1.5">
                  <div className="flex justify-between text-xs"><span className="text-white/40">Amount</span><span className="text-white/60">KSh {Number(amount || 0).toLocaleString()}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-white/40">Fee</span><span className="text-white/60">{method === "bank" ? "KSh 100" : "Free"}</span></div>
                  <div className="flex justify-between text-xs pt-1.5 border-t border-white/5"><span className="text-white/60 font-medium">You receive</span><span className="text-emerald-400 font-bold">KSh {Math.max(0, Number(amount || 0) - (method === "bank" ? 100 : 0)).toLocaleString()}</span></div>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-lg text-sm text-white/40 hover:bg-white/[0.03]">Cancel</button>
                <button disabled={!amount || Number(amount) > availableBalance} onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-medium disabled:opacity-40">Withdraw</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SellerLayout>
  );
}
