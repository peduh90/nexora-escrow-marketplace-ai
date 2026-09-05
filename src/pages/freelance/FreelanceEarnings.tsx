import { useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  ArrowLeft, Wallet, TrendingUp, DollarSign, Clock,
  ArrowUpRight, ArrowDownRight,
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
        </div>
      </div>
    </div>
  );
}
