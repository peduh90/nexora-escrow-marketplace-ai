import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  ArrowLeft, Briefcase, Users, Loader2, CheckCircle2, Star,
  MessageSquare, FileText, ChevronDown,
} from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-white/5 text-white/40",
  shortlisted: "bg-nx-cyan/10 text-nx-cyan",
  accepted: "bg-nx-emerald/10 text-nx-emerald",
  rejected: "bg-red-400/10 text-red-400",
  withdrawn: "bg-white/5 text-white/40",
};

interface ApplicationRow {
  _id: string;
  taskId: string;
  freelancerId: string;
  freelancerName: string;
  freelancerRating: number;
  freelancerCompletedProjects: number;
  proposal: string;
  proposedBudget: number;
  estimatedDuration?: string;
  status: string;
  createdAt: number;
}

export default function EmployerJobs() {
  const navigate = useNavigate();
  const myTasks = useQuery(api.freelance.getMyTasks);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const acceptApplication = useMutation(api.freelance.acceptApplication);

  const tasks = myTasks ?? [];

  // Load applications for the expanded task (the query is skipped for others).
  const appsForExpanded = useQuery(
    api.freelance.getTaskApplications,
    expandedTask ? ({ taskId: expandedTask as any } as const) : "skip",
  );

  const handleAccept = async (applicationId: string, taskTitle: string) => {
    if (!window.confirm(`Accept this proposal for "${taskTitle}"? The job will be assigned and other applicants will be notified they weren't selected.`)) return;
    setAcceptingId(applicationId);
    setError("");
    try {
      await acceptApplication({ applicationId: applicationId as any });
      setExpandedTask(null);
    } catch (err: any) {
      setError(err.message || "Failed to accept application.");
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#05050A]">
      <div className="flex-1 min-w-0">
        <div className="hidden md:flex sticky top-0 z-30 h-14 bg-[#08080F]/80 backdrop-blur-xl border-b border-white/5 items-center px-4 md:px-6">
          <button onClick={() => navigate("/employer")} className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-white/40 hover:text-white/70 transition-colors mr-3">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-sm font-semibold text-white">My Jobs & Applicants</h1>
        </div>

        <div className="p-4 md:p-6 space-y-5 pb-28 md:pb-6">
          {tasks.length === 0 ? (
            <div className="text-center py-16 rounded-xl bg-white/[0.02] border border-white/5">
              <Briefcase className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/40 font-medium">You haven't posted any jobs yet</p>
              <p className="text-[11px] text-white/20 mt-1">Post your first job to start receiving proposals from writers.</p>
              <button onClick={() => navigate("/employer/post-job")}
                className="mt-4 px-5 py-2 rounded-xl bg-nx-violet text-white text-xs font-semibold hover:bg-nx-violet/80 transition-colors">
                Post a Job
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((t: any) => {
                const isExpanded = expandedTask === t._id;
                return (
                  <div key={t._id} className="rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden">
                    <div className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white/[0.01] transition-colors"
                      onClick={() => setExpandedTask(isExpanded ? null : t._id)}>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${t.status === "open" ? "bg-nx-emerald/10" : t.status === "completed" ? "bg-nx-emerald/10" : "bg-nx-violet/10"}`}>
                        {t.status === "open" ? <FileText className="w-5 h-5 text-nx-emerald" /> : <Briefcase className="w-5 h-5 text-nx-violet" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{t.title}</p>
                        <p className="text-[11px] text-white/30 mt-0.5">
                          KES {t.budget?.toLocaleString()} • {t.applicants} applicant{t.applicants === 1 ? "" : "s"} • posted {new Date(t.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded shrink-0 ${t.status === "open" ? "bg-nx-emerald/10 text-nx-emerald" : t.status === "completed" ? "bg-white/5 text-white/40" : "bg-nx-violet/10 text-nx-violet"}`}>
                        {String(t.status).replace("_", " ")}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-white/20 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-white/5 pt-4 space-y-3">
                        <p className="text-xs text-white/40 line-clamp-2">{t.description}</p>
                        {error && <p className="text-xs text-red-400">{error}</p>}
                        <ApplicantList
                          apps={(appsForExpanded ?? []) as unknown as ApplicationRow[]}
                          loading={appsForExpanded === undefined}
                          taskStatus={t.status}
                          acceptingId={acceptingId}
                          onAccept={(appId) => handleAccept(appId, t.title)}
                        />
                      </div>
                    )}
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

function ApplicantList({
  apps,
  loading,
  taskStatus,
  acceptingId,
  onAccept,
}: {
  apps: ApplicationRow[];
  loading: boolean;
  taskStatus: string;
  acceptingId: string | null;
  onAccept: (applicationId: string) => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 text-nx-violet animate-spin" />
      </div>
    );
  }

  if (apps.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="w-8 h-8 text-white/10 mx-auto mb-2" />
        <p className="text-sm text-white/30">No proposals yet</p>
        <p className="text-[11px] text-white/20 mt-0.5">Writers will find your job on the jobs board.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {apps.map((app) => (
        <div key={app._id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-nx-violet/15 flex items-center justify-center text-nx-violet font-bold shrink-0">
              {(app.freelancerName || "F").charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-white">{app.freelancerName}</p>
                {app.freelancerRating > 0 && (
                  <span className="flex items-center gap-0.5 text-xs text-amber-400">
                    <Star className="w-3 h-3 fill-amber-400" /> {app.freelancerRating.toFixed(1)}
                  </span>
                )}
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[app.status] || statusColors.pending}`}>
                  {app.status}
                </span>
              </div>
              <p className="text-[11px] text-white/30 mt-0.5">
                {app.freelancerCompletedProjects} projects • bid KES {app.proposedBudget?.toLocaleString()}
                {app.estimatedDuration ? ` • ${app.estimatedDuration}` : ""}
              </p>
              <p className="text-xs text-white/50 mt-2 leading-relaxed">{app.proposal}</p>
            </div>
            <div className="shrink-0 flex flex-col gap-2">
              {app.status === "pending" && taskStatus === "open" && (
                <button
                  onClick={() => onAccept(app._id)}
                  disabled={acceptingId === app._id}
                  className="px-4 py-2 rounded-lg bg-nx-emerald text-white text-xs font-semibold hover:bg-nx-emerald/80 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {acceptingId === app._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Accept & Hire
                </button>
              )}
              <button
                onClick={() => window.location.href = "/employer/messages"}
                className="px-4 py-2 rounded-lg bg-white/[0.03] text-white/40 text-xs font-medium hover:text-white/60 hover:bg-white/[0.05] transition-colors flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Message
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
