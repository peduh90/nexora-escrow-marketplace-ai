import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import FreelanceNav from "./FreelanceNav";
import {
  getFreelanceCategoryIcon,
  normalizeFreelanceCategory,
  freelanceCategoryName,
} from "@/lib/freelance-marketplace";
import {
  Briefcase, Globe, Clock, Users, Shield, CheckCircle2, X, Loader2,
  Star, ArrowLeft, BadgeCheck, MapPin, FileText,
} from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-white/5 text-white/40",
  shortlisted: "bg-nx-cyan/10 text-nx-cyan",
  accepted: "bg-nx-emerald/10 text-nx-emerald",
  rejected: "bg-red-400/10 text-red-400",
};

export default function FreelanceJobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();

  const task = useQuery(api.freelance.getTask, id ? ({ taskId: id as any } as const) : "skip");
  const myApps = useQuery(api.freelance.getMyApplications);

  const applyToTask = useMutation(api.freelance.applyToTask);
  const acceptApplication = useMutation(api.freelance.acceptApplication);

  const [showApply, setShowApply] = useState(false);
  const [proposal, setProposal] = useState("");
  const [proposedBudget, setProposedBudget] = useState("");
  const [duration, setDuration] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [applied, setApplied] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const isOwner = !!user && !!task && (task as any).employerId === user._id;
  const alreadyApplied = (myApps ?? []).some((a: any) => a.taskId === id);

  const apps = useQuery(
    api.freelance.getTaskApplications,
    isOwner && id ? ({ taskId: id as any } as const) : "skip",
  );

  useEffect(() => {
    setApplied(false);
  }, [id]);

  if (!task && !authLoading) {
    return (
      <div className="min-h-screen bg-[#05050A]">
        <FreelanceNav active="jobs" />
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
          <Briefcase className="w-16 h-16 text-white/10 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Job not found</h2>
          <p className="text-white/40 text-sm mb-6">This job may be closed or removed.</p>
          <button onClick={() => navigate("/freelance/jobs")} className="px-6 py-2.5 rounded-lg bg-nx-violet text-white text-sm">
            Browse Jobs
          </button>
        </div>
      </div>
    );
  }

  const t: any = task;

  const handleApply = async () => {
    setError("");
    if (!isAuthenticated) {
      navigate("/auth?returnTo=" + encodeURIComponent(window.location.pathname));
      return;
    }
    if (!proposal.trim() || proposal.trim().length < 40) {
      setError("Write a proposal of at least 40 characters so the client can evaluate you.");
      return;
    }
    if (!proposedBudget || Number(proposedBudget) <= 0) {
      setError("Set your proposed budget.");
      return;
    }
    setSubmitting(true);
    try {
      await applyToTask({
        taskId: id as any,
        proposal: proposal.trim(),
        proposedBudget: Number(proposedBudget),
        estimatedDuration: duration.trim() || undefined,
      });
      setApplied(true);
      setShowApply(false);
    } catch (err: any) {
      setError(err.message || "Failed to apply. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = async (applicationId: string) => {
    if (!window.confirm("Accept this proposal? The job will be assigned and all other applicants will be notified they weren't selected.")) return;
    setAcceptingId(applicationId);
    try {
      await acceptApplication({ applicationId: applicationId as any });
    } catch (err: any) {
      toast.error(err.message || "Failed to accept application.");
    } finally {
      setAcceptingId(null);
    }
  };

  if (!t) {
    return (
      <div className="min-h-screen bg-[#05050A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-nx-violet animate-spin" />
      </div>
    );
  }

  const CatIcon = getFreelanceCategoryIcon(normalizeFreelanceCategory(t.category));
  const deadlineLabel = t.deadline ? new Date(t.deadline).toLocaleDateString() : "Flexible";

  return (
    <div className="min-h-screen bg-background">
      <FreelanceNav active="jobs" />

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-7 space-y-6">
        <button onClick={() => navigate("/freelance/jobs")} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Jobs
        </button>

        {/* Job card */}
        <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-[11px] px-2.5 py-1 rounded bg-nx-violet/10 text-nx-violet font-medium flex items-center gap-1"><CatIcon className="w-3.5 h-3.5" /> {freelanceCategoryName(t.category)}</span>
            <span className="text-[11px] px-2.5 py-1 rounded bg-nx-emerald/10 text-nx-emerald font-medium flex items-center gap-1">
              <Shield className="w-3 h-3" /> Escrow protected
            </span>
            {t.remote && (
              <span className="text-[11px] px-2.5 py-1 rounded bg-nx-cyan/10 text-nx-cyan font-medium flex items-center gap-1">
                <Globe className="w-3 h-3" /> Remote
              </span>
            )}
          </div>
          <h1 className="text-xl md:text-3xl font-bold text-white mb-3">{t.title}</h1>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/35 mb-5">
            <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{t.applicants} applicant{t.applicants === 1 ? "" : "s"}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Deadline: {deadlineLabel}</span>
            {t.location && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{t.location}</span>}
            <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" />Posted by {t.employerName}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-5">
            {(t.skills || []).map((s: string) => (
              <span key={s} className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 text-white/50">{s}</span>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <p className="text-[10px] uppercase tracking-wider text-white/25 mb-1">Budget</p>
              <p className="text-lg font-bold text-nx-emerald">KES {t.budget.toLocaleString()}</p>
              <p className="text-[11px] text-white/30 capitalize">{t.budgetType}</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <p className="text-[10px] uppercase tracking-wider text-white/25 mb-1">Experience</p>
              <p className="text-sm font-medium text-white capitalize">{t.experienceLevel || "Intermediate"}</p>
              <p className="text-[11px] text-white/30">{t.freelancerCount || 1} freelancer{(t.freelancerCount || 1) > 1 ? "s" : ""} needed</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <p className="text-[10px] uppercase tracking-wider text-white/25 mb-1">Priority</p>
              <p className="text-sm font-medium text-white capitalize">{t.priority || "medium"}</p>
              <p className="text-[11px] text-white/30">{t.views} views</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-white mb-2">Project details</h3>
            <p className="text-sm text-white/50 leading-relaxed whitespace-pre-wrap">{t.description}</p>
          </div>

          {/* Brief attachments uploaded by the employer */}
          {Array.isArray(t.attachments) && t.attachments.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-white mb-2">Attachments ({t.attachments.length})</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {t.attachments.map((url: string, i: number) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-white/5 bg-white/[0.02] hover:border-nx-violet/30 transition-colors"
                  >
                    {/\.(pdf|docx?|xlsx?|txt|csv)(\?|$)/i.test(url) ? (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1.5">
                        <FileText className="w-6 h-6 text-nx-violet/50" />
                        <span className="text-[10px] text-white/40">Document {i + 1}</span>
                      </div>
                    ) : (
                      <img src={url} alt={`Attachment ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    )}
                  </a>
                ))}
              </div>
              <p className="text-[11px] text-white/25 mt-2">Click an attachment to open it in a new tab.</p>
            </div>
          )}

          {isOwner ? (
            <div className="p-4 rounded-xl bg-nx-violet/5 border border-nx-violet/15">
              <p className="text-sm font-medium text-white">This is your job post</p>
              <p className="text-xs text-white/40 mt-1">Review proposals below and accept the best freelancer.</p>
            </div>
          ) : (
            <button
              onClick={() => {
                if (t.status !== "open") {
                  setError("This job is no longer accepting applications.");
                  return;
                }
                setShowApply(true);
              }}
              disabled={alreadyApplied || t.status !== "open"}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-nx-violet hover:bg-nx-violet/80 text-white font-semibold text-sm transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {alreadyApplied ? (
                <><CheckCircle2 className="w-4 h-4" /> Applied — pending review</>
              ) : t.status !== "open" ? (
                "This job is closed"
              ) : (
                <><Briefcase className="w-4 h-4" /> Apply for this job</>
              )}
            </button>
          )}
        </div>

        {/* Owner panel: applications */}
        {isOwner && (
          <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Proposals ({apps?.length || 0})</h3>
                <p className="text-xs text-white/30 mt-0.5">Accept one — the job moves into an escrow-protected project.</p>
              </div>
            </div>
            {!apps || apps.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-10 h-10 text-white/10 mx-auto mb-3" />
                <p className="text-sm text-white/40">No proposals yet</p>
                <p className="text-[11px] text-white/25 mt-1">Share this job with freelancers — or wait, they'll find it.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {apps.map((app: any) => (
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
                          {app.freelancerCompletedProjects} projects · proposed KES {app.proposedBudget.toLocaleString()}
                          {app.estimatedDuration ? ` · ${app.estimatedDuration}` : ""}
                        </p>
                        <p className="text-xs text-white/50 mt-2 leading-relaxed">{app.proposal}</p>
                      </div>
                      {app.status === "pending" && (
                        <button
                          onClick={() => handleAccept(app._id)}
                          disabled={acceptingId === app._id}
                          className="shrink-0 px-4 py-2 rounded-lg bg-nx-emerald text-white text-xs font-semibold hover:bg-nx-emerald/80 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {acceptingId === app._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          Accept & Hire
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Applied banner for freelancer */}
        {alreadyApplied && !isOwner && (
          <div className="p-4 rounded-xl bg-nx-cyan/5 border border-nx-cyan/10 flex items-center gap-3">
            <BadgeCheck className="w-5 h-5 text-nx-cyan shrink-0" />
            <div>
              <p className="text-sm font-medium text-white">You've applied to this job</p>
              <p className="text-xs text-white/40">The client will review proposals. Track your applications on your freelancer dashboard.</p>
            </div>
            <button onClick={() => navigate("/freelance/applications")} className="ml-auto text-xs text-nx-cyan hover:text-nx-cyan/80 shrink-0">
              View applications
            </button>
          </div>
        )}
      </div>

      {/* Apply modal */}
      {showApply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowApply(false)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-[#0E0E18] border border-white/5 shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Apply for this job</h3>
              <button onClick={() => setShowApply(false)} className="p-1 text-white/30 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 mb-4">
              <p className="text-sm font-medium text-white">{t.title}</p>
              <p className="text-xs text-white/35 mt-0.5">Budget: <span className="text-nx-emerald font-medium">KES {t.budget.toLocaleString()}</span> · {freelanceCategoryName(t.category)}</p>
            </div>

            <label className="block text-xs font-medium text-white/60 mb-1.5">Your proposal *</label>
            <textarea
              value={proposal}
              onChange={(e) => setProposal(e.target.value)}
              rows={6}
              placeholder="Why are you the right fit? Relevant experience, approach, and how you'll deliver..."
              className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none resize-none mb-4"
            />

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Proposed budget (KES) *</label>
                <input type="number" value={proposedBudget} onChange={(e) => setProposedBudget(e.target.value)} placeholder={String(t.budget)}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Estimated duration</label>
                <input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 2 weeks"
                  className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
              </div>
            </div>

            {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

            <button
              onClick={handleApply}
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-nx-violet text-white font-semibold text-sm hover:bg-nx-violet/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Briefcase className="w-4 h-4" />}
              {submitting ? "Submitting application..." : "Submit Application"}
            </button>
            <p className="text-[11px] text-white/20 text-center mt-2">If hired, your payment milestones are protected by escrow.</p>
          </div>
        </div>
      )}
    </div>
  );
}
