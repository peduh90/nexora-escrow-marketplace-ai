import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  ArrowLeft, FolderOpen, Clock, CheckCircle2, AlertCircle,
  MessageSquare, DollarSign,
} from "lucide-react";

type Tab = "active" | "completed" | "all";

export default function FreelanceProjects() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("active");
  const projects = useQuery(api.freelance.getMyProjects);

  const allProjects = projects ?? [];
  const filtered = tab === "active" ? allProjects.filter((p: any) => ["active", "on_hold"].includes(p.status))
    : tab === "completed" ? allProjects.filter((p: any) => p.status === "completed")
    : allProjects;

  const statusConfig: Record<string, { icon: any; color: string; bg: string }> = {
    active: { icon: Clock, color: "text-nx-violet", bg: "bg-nx-violet/10" },
    on_hold: { icon: AlertCircle, color: "text-nx-gold", bg: "bg-nx-gold/10" },
    completed: { icon: CheckCircle2, color: "text-nx-emerald", bg: "bg-nx-emerald/10" },
    cancelled: { icon: AlertCircle, color: "text-white/40", bg: "bg-white/5" },
    disputed: { icon: AlertCircle, color: "text-red-400", bg: "bg-red-400/10" },
  };

  return (
    <div className="flex min-h-screen bg-[#05050A]">
      <div className="flex-1 min-w-0">
        <div className="sticky top-0 z-30 h-14 bg-[#08080F]/80 backdrop-blur-xl border-b border-white/5 flex items-center px-4 md:px-6">
          <button onClick={() => navigate("/freelance/dashboard")} className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-white/40 hover:text-white/70 transition-colors mr-3">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-sm font-semibold text-white">My Projects</h1>
        </div>

        <div className="p-4 md:p-6 space-y-5">
          {/* Tabs */}
          <div className="flex gap-2">
            {(["active", "completed", "all"] as Tab[]).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors capitalize ${tab === t ? "bg-nx-violet/20 text-nx-violet border border-nx-violet/30" : "bg-white/[0.03] text-white/40 border border-white/5 hover:border-white/10"}`}>
                {t} ({t === "active" ? allProjects.filter((p: any) => ["active", "on_hold"].includes(p.status)).length
                  : t === "completed" ? allProjects.filter((p: any) => p.status === "completed").length
                  : allProjects.length})
              </button>
            ))}
          </div>

          {/* Projects */}
          {filtered.length === 0 ? (
            <div className="text-center py-16 rounded-xl bg-white/[0.02] border border-white/5">
              <FolderOpen className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/40 font-medium">No projects found</p>
              <p className="text-[11px] text-white/20 mt-1">Start by applying to tasks or posting a project</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((proj: any) => {
                const cfg = statusConfig[proj.status] || statusConfig.active;
                const StatusIcon = cfg.icon;
                return (
                  <div key={proj._id} className="p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-nx-violet/15 transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${cfg.bg}`}>
                            <StatusIcon className={`w-3.5 h-3.5 ${cfg.color}`} />
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${cfg.color} ${cfg.bg}`}>
                            {proj.status.replace("_", " ").toUpperCase()}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-white mb-1">{proj.title}</h3>
                        <p className="text-xs text-white/30 mb-2">
                          {proj.isFreelancer ? `Employer: ${proj.employerName}` : `Freelancer: ${proj.freelancerName}`}
                        </p>

                        {/* Progress bar */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <div className="h-full rounded-full bg-nx-violet transition-all" style={{ width: `${proj.progress}%` }} />
                          </div>
                          <span className="text-[10px] text-white/40 font-medium">{proj.progress}%</span>
                        </div>

                        {/* Milestones */}
                        {proj.milestones && proj.milestones.length > 0 && (
                          <div className="space-y-1 mb-3">
                            {proj.milestones.map((m: any) => (
                              <div key={m.id} className="flex items-center gap-2 text-[10px]">
                                <div className={`w-1.5 h-1.5 rounded-full ${m.status === "approved" ? "bg-nx-emerald" : m.status === "submitted" ? "bg-nx-gold" : "bg-white/20"}`} />
                                <span className="text-white/40">{m.title}</span>
                                <span className="text-white/20">•</span>
                                <span className="text-nx-emerald">KES {m.amount.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-3 text-[10px] text-white/25">
                          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />KES {proj.budget.toLocaleString()}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(proj.createdAt).toLocaleDateString()}</span>
                          {proj.deadline && <span>Due: {new Date(proj.deadline).toLocaleDateString()}</span>}
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
