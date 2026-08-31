import SellerLayout from "./SellerLayout";
import { useState } from "react";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  CreditCard,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";

const mockEarnings = {
  availableBalance: 524750,
  pendingBalance: 142000,
  totalEarned: 847500,
  totalCommission: 42375,
  thisMonth: 187500,
  lastMonth: 165000,
};

const mockTransactions = [
  { id: "T-1201", type: "sale", product: "MacBook Pro 14\"", amount: 270750, commission: 14250, status: "completed", date: "Jan 28, 2025" },
  { id: "T-1198", type: "sale", product: "iPhone 15 Pro Max", amount: 134900, commission: 7100, status: "completed", date: "Jan 25, 2025" },
  { id: "T-1195", type: "withdrawal", product: "M-Pesa Withdrawal", amount: -300000, commission: 0, status: "completed", date: "Jan 22, 2025" },
  { id: "T-1190", type: "sale", product: "Samsung Galaxy S24", amount: 156750, commission: 8250, status: "completed", date: "Jan 20, 2025" },
  { id: "T-1188", type: "sale", product: "Nike Air Max 90 (x2)", amount: 23750, commission: 1250, status: "completed", date: "Jan 18, 2025" },
  { id: "T-1185", type: "refund", product: "Italian Leather Sofa (Refund)", amount: -80750, commission: -4250, status: "completed", date: "Jan 15, 2025" },
  { id: "T-1180", type: "sale", product: "Sony WH-1000XM5", amount: 36100, commission: 1900, status: "pending", date: "Jan 12, 2025" },
];

export default function SellerEarnings() {
  const [showBalance, setShowBalance] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  return (
    <SellerLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-white">Earnings & Withdrawals</h2>
          <p className="text-xs text-white/30 mt-0.5">Manage your balance and withdraw via M-Pesa</p>
        </div>
        <button
          onClick={() => setShowWithdrawModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-500/80 text-white text-sm font-medium transition-colors"
        >
          <Download className="w-4 h-4" /> Withdraw
        </button>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
            {showBalance ? `KES ${mockEarnings.availableBalance.toLocaleString()}` : "••••••"}
          </p>
          <p className="text-xs text-white/30 mt-1">Available Balance</p>
        </div>

        <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center mb-3">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">KES {mockEarnings.pendingBalance.toLocaleString()}</p>
          <p className="text-xs text-white/30 mt-1">In Escrow (Pending)</p>
        </div>

        <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="w-10 h-10 rounded-xl bg-nx-violet/10 flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5 text-nx-violet" />
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">KES {mockEarnings.thisMonth.toLocaleString()}</p>
          <p className="text-xs text-white/30 mt-1">This Month</p>
        </div>

        <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="w-10 h-10 rounded-xl bg-nx-cyan/10 flex items-center justify-center mb-3">
            <RefreshCw className="w-5 h-5 text-nx-cyan" />
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">KES {mockEarnings.totalCommission.toLocaleString()}</p>
          <p className="text-xs text-white/30 mt-1">Total Commission Paid</p>
        </div>
      </div>

      {/* Commission breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 p-5 rounded-xl bg-white/[0.02] border border-white/5">
          <h3 className="text-sm font-semibold text-white mb-4">Commission Structure</h3>
          <div className="space-y-3">
            {[
              { tier: "Free Tier", rate: "5%", range: "0 - 50 orders", current: true },
              { tier: "Professional", rate: "2.5%", range: "KES 999/month", current: false },
              { tier: "Enterprise", rate: "0.5%", range: "KES 4,999/month", current: false },
            ].map((t) => (
              <div key={t.tier} className={`flex items-center gap-4 p-3 rounded-lg ${t.current ? "bg-nx-violet/5 border border-nx-violet/10" : "bg-white/[0.01]"}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.current ? "bg-nx-violet/10" : "bg-white/5"}`}>
                  <span className={`text-xs font-bold ${t.current ? "text-nx-violet" : "text-white/30"}`}>{t.rate}</span>
                </div>
                <div className="flex-1">
                  <p className={`text-sm ${t.current ? "text-white" : "text-white/40"}`}>{t.tier}</p>
                  <p className="text-[11px] text-white/30">{t.range}</p>
                </div>
                {t.current && <span className="text-[10px] px-2 py-0.5 rounded-full bg-nx-violet/10 text-nx-violet">Current</span>}
                {!t.current && <button className="text-[11px] text-nx-violet hover:text-nx-violet/80">Upgrade</button>}
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
          <h3 className="text-sm font-semibold text-white mb-4">Monthly Summary</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-white/40">This Month</span>
                <span className="text-white/60">KES {mockEarnings.thisMonth.toLocaleString()}</span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full w-[80%] rounded-full bg-nx-violet/60" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-white/40">Last Month</span>
                <span className="text-white/60">KES {mockEarnings.lastMonth.toLocaleString()}</span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full w-[70%] rounded-full bg-white/20" />
              </div>
            </div>
            <div className="pt-3 border-t border-white/5">
              <div className="flex items-center gap-2 text-xs text-emerald-400">
                <ArrowUpRight className="w-3 h-3" />
                <span>+13.6% from last month</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction history */}
      <div className="rounded-xl bg-white/[0.02] border border-white/5">
        <div className="px-5 py-4 border-b border-white/5">
          <h3 className="text-sm font-semibold text-white">Transaction History</h3>
        </div>
        <div className="divide-y divide-white/[0.03]">
          {mockTransactions.map((tx) => (
            <div key={tx.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-white/[0.01] transition-colors">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                tx.type === "sale" ? "bg-emerald-400/10" : tx.type === "withdrawal" ? "bg-blue-400/10" : "bg-red-400/10"
              }`}>
                {tx.type === "sale" ? (
                  <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                ) : tx.type === "withdrawal" ? (
                  <Download className="w-5 h-5 text-blue-400" />
                ) : (
                  <ArrowDownRight className="w-5 h-5 text-red-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{tx.product}</p>
                <p className="text-xs text-white/30 mt-0.5">{tx.id} • {tx.date}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${tx.amount > 0 ? "text-emerald-400" : "text-white/60"}`}>
                  {tx.amount > 0 ? "+" : ""}KES {Math.abs(tx.amount).toLocaleString()}
                </p>
                {tx.commission > 0 && (
                  <p className="text-[11px] text-red-400/60">-{tx.commission.toLocaleString()} fee</p>
                )}
              </div>
              <div className={`flex items-center gap-1 text-[10px] ${
                tx.status === "completed" ? "text-emerald-400/60" : "text-amber-400/60"
              }`}>
                {tx.status === "completed" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                {tx.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <WithdrawModal onClose={() => setShowWithdrawModal(false)} balance={mockEarnings.availableBalance} />
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
    setTimeout(() => {
      setProcessing(false);
      onClose();
    }, 1500);
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
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-3 rounded-lg bg-white/[0.03] border border-white/5 text-xl text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-400/30 font-bold"
            />
            <div className="flex items-center gap-2 mt-2">
              <button onClick={() => setAmount(String(balance))} className="text-[11px] text-nx-violet hover:text-nx-violet/80">Max: KES {balance.toLocaleString()}</button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">M-Pesa Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0712 345 678"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-400/30"
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Withdrawal amount</span>
              <span className="text-white/60">KES {Number(amount || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Processing fee</span>
              <span className="text-white/60">Free</span>
            </div>
            <div className="flex justify-between text-xs pt-1 border-t border-white/5">
              <span className="text-white/60 font-medium">You receive</span>
              <span className="text-emerald-400 font-medium">KES {Number(amount || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg text-sm text-white/40 hover:text-white/60 hover:bg-white/[0.03] transition-colors">
            Cancel
          </button>
          <button
            onClick={handleWithdraw}
            disabled={!amount || !phone || processing || Number(amount) > balance}
            className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-500/80 text-white text-sm font-medium transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {processing ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
            ) : (
              <>Withdraw to M-Pesa</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
