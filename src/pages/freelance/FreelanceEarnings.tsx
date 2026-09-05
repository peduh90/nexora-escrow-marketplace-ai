import { useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  ArrowLeft, Wallet, TrendingUp, DollarSign, Clock,
  ArrowUpRight, ArrowDownRight, Phone, Loader2,
} from "lucide-react";

export default function FreelanceEarnings() {
  const navigate = useNavigate();
  const projects = useQuery(api.freelance.getMyProjects);
  const walletBalance = useQuery(api.wallet.getWalletBalance);

  const allProjects = projects ?? [];
  const totalEarned = allProjects
    .filter((p: any) => p.status === "completed")
    .reduce((sum: number, p: any) => sum + p.totalPaid, 0);

  return (
    <div className="flex min-h-screen bg-[#05050A]">
      <div className="flex-1 min-w-0">
        <div className="sticky top-0 z-30 h-14 bg-[#08080F]/80 backdrop-blur-xl border-b border-white/5 flex items-center px-4 md:px-6">
          <button onClick={() => navigate("/freelance/dashboard")} className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-white/40 hover:text-white/70 transition-colors mr-3">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-sm font-semibold text-white">Earnings</h1>
        </div>

        <div className="p-4 md:p-6 space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Wallet Balance", value: `KES ${(walletBalance?.walletBalance || 0).toLocaleString()}`, icon: Wallet, color: "#10B981" },
              { label: "Total Earned", value: `KES ${totalEarned.toLocaleString()}`, icon: TrendingUp, color: "#8B5CF6" },
              { label: "In Escrow", value: `KES ${(walletBalance?.escrowBalance || 0).toLocaleString()}`, icon: DollarSign, color: "#06B6D4" },
              { label: "Completed", value: allProjects.filter((p: any) => p.status === "completed").length.toString(), icon: Clock, color: "#F59E0B" },
            ].map((card) => (
              <div key={card.label} className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: `${card.color}12` }}>
                  <card.icon className="w-4 h-4" style={{ color: card.color }} />
                </div>
                <p className="text-[11px] text-white/30 mb-1">{card.label}</p>
                <p className="text-lg font-bold text-white">{card.value}</p>
              </div>
            ))}
          </div>

          {/* Project Earnings */}
          <div className="p-5 rounded-xl border border-white/5 bg-white/[0.02]">
            <h3 className="text-sm font-semibold text-white mb-4">Project Earnings</h3>
            {allProjects.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-8 h-8 text-white/10 mx-auto mb-2" />
                <p className="text-sm text-white/30">No earnings yet</p>
                <p className="text-[11px] text-white/15 mt-1">Complete projects to start earning</p>
              </div>
            ) : (
              <div className="space-y-2">
                {allProjects.map((proj: any) => (
                  <div key={proj._id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.01]">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${proj.status === "completed" ? "bg-nx-emerald/10" : "bg-nx-violet/10"}`}>
                      {proj.status === "completed" ? <ArrowUpRight className="w-4 h-4 text-nx-emerald" /> : <Clock className="w-4 h-4 text-nx-violet" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{proj.title}</p>
                      <p className="text-[11px] text-white/30 capitalize">{proj.status.replace("_", " ")}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium text-nx-emerald">KES {proj.budget.toLocaleString()}</p>
                      <p className="text-[10px] text-white/20">{new Date(proj.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Withdrawal Section */}
          <div className="p-5 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.02]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Withdraw to M-Pesa</h3>
              </div>
              <span className="text-[11px] text-white/30">Minimum: KES 500</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="md:col-span-2">
                <label className="text-xs text-white/30 mb-1 block">M-Pesa Number</label>
                <input
                  type="tel"
                  placeholder="254712345678"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-emerald-400/30 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-white/30 mb-1 block">Amount (KES)</label>
                <input
                  type="number"
                  placeholder="Enter amount"
                  min="500"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-emerald-400/30 transition-colors"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-400 transition-colors">
                Request Withdrawal
              </button>
              <button
                onClick={() => window.open(`https://wa.me/254769739216?text=Hello%20Nexora%20Admin%2C%20I%20need%20help%20with%20my%20withdrawal`, '_blank')}
                className="px-4 py-2.5 rounded-xl border border-emerald-400/20 text-emerald-400 text-sm font-medium hover:bg-emerald-400/5 transition-colors flex items-center gap-2"
              >
                <Phone className="w-4 h-4" /> Contact Admin
              </button>
            </div>
            <p className="text-[10px] text-white/20 mt-3 text-center">Withdrawals are processed within 24 hours. M-Pesa charges may apply.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
