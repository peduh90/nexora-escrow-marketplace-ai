import { useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  ArrowLeft, FileText, Clock, CheckCircle2, XCircle, Loader2,
} from "lucide-react";

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  pending: { color: "text-nx-gold", bg: "bg-nx-gold/10", label: "Pending" },
  shortlisted: { color: "text-nx-cyan", bg: "bg-nx-cyan/10", label: "Shortlisted" },
  accepted: { color: "text-nx-emerald", bg: "bg-nx-emerald/10", label: "Accepted" },
  rejected: { color: "text-red-400", bg: "bg-red-400/10", label: "Rejected" },
  withdrawn: { color: "text-white/40", bg: "bg-white/5", label: "Withdrawn" },
};

export default function FreelanceApplications() {
  const navigate = useNavigate();
  const applications = useQuery(api.freelance.getMyApplications);

  const apps = applications ?? [];

  return (
    <div className="flex min-h-screen bg-[#05050A]">
      <div className="flex-1 min-w-0">
        <div className="sticky top-0 z-30 h-14 bg-[#08080F]/80 backdrop-blur-xl border-b border-white/5 flex items-center px-4 md:px-6">
          <button onClick={() => navigate("/freelance/dashboard")} className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-white/40 hover:text-white/70 transition-colors mr-3">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-sm font-semibold text-white">My Applications</h1>
        </div>

        <div className="p-4 md:p-6">
          {apps.length === 0 ? (
            <div className="text-center py-16 rounded-xl bg-white/[0.02] border border-white/5">
              <FileText className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/40 font-medium">No applications yet</p>
              <p className="text-[11px] text-white/20 mt-1">Browse tasks and submit your first proposal</p>
              <button onClick={() => navigate("/freelance/find-work")}
                className="mt-4 px-5 py-2 rounded-xl bg-nx-violet text-white text-xs font-semibold hover:bg-nx-violet/80 transition-colors">
                Find Work
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {apps.map((app: any) => {
                const cfg = statusConfig[app.status] || statusConfig.pending;
                return (
                  <div key={app._id} className="p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-nx-violet/15 transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${cfg.color} ${cfg.bg}`}>
                            {cfg.label}
                          </span>
                          <span className="text-[10px] text-white/20">{new Date(app.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h3 className="text-sm font-semibold text-white mb-1">{app.taskTitle}</h3>
                        <p className="text-xs text-white/30 mb-2 line-clamp-2">{app.proposal}</p>
                        <div className="flex items-center gap-3 text-[10px] text-white/25">
                          <span>Your bid: KES {app.proposedBudget.toLocaleString()}</span>
                          {app.estimatedDuration && <span>Duration: {app.estimatedDuration}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
