import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { ArrowLeft, Briefcase, MapPin, Loader2, CheckCircle2, XCircle, Clock, Phone } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";

const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  temporary: "Temporary",
  internship: "Internship",
  casual: "Casual",
  commission: "Commission",
  other: "Other",
};

const FREQUENCY_LABELS: Record<string, string> = {
  per_hour: "per hour",
  per_day: "per day",
  per_week: "per week",
  per_month: "per month",
  per_project: "per project",
  negotiable: "negotiable",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In progress",
  completed: "Completed",
  closed: "Closed",
};

export default function EmploymentJobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [message, setMessage] = useState("");
  const [proposedPay, setProposedPay] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const jobId = id as any;
  const job = useQuery(api.employment.getJob, jobId ? { jobId } : "skip");
  const myApplications = useQuery(api.employment.getMyApplications, isAuthenticated ? {} : "skip");
  // The employer who posted it reads its applicants; anyone else gets an
  // authorization error from the backend rather than a hidden panel.
  const isPoster = !!user && !!job && String((job as any).posterId) === String((user as any)?._id);
  const applications = useQuery(
    api.employment.getJobApplications,
    jobId && isPoster ? { jobId } : "skip",
  );
  const applyToJob = useMutation(api.employment.applyToJob);
  const updateStatus = useMutation(api.employment.updateApplicationStatus);
  const setJobStatus = useMutation(api.employment.setJobStatus);

  if (!id) return null;
  if (job === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05050A] text-white/50 text-sm">
        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading…
      </div>
    );
  }
  if (job === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#05050A] text-white px-4">
        <p className="text-sm text-white/50">This job is no longer available.</p>
        <button onClick={() => navigate("/employment/jobs")} className="mt-4 text-xs text-nx-violet hover:underline">
          Back to Browse Jobs
        </button>
      </div>
    );
  }

  const j = job as any;
  const alreadyApplied = (myApplications ?? []).some((a: any) => a.jobId === String(j._id));
  const closed = j.status !== "open";
  const salary =
    j.salaryMin && j.salaryMax
      ? `KES ${j.salaryMin.toLocaleString()} – ${j.salaryMax.toLocaleString()} ${FREQUENCY_LABELS[j.paymentFrequency ?? ""] ?? ""}`
      : j.salaryMin
      ? `From KES ${j.salaryMin.toLocaleString()} ${FREQUENCY_LABELS[j.paymentFrequency ?? ""] ?? ""}`
      : j.salaryMax
      ? `Up to KES ${j.salaryMax.toLocaleString()} ${FREQUENCY_LABELS[j.paymentFrequency ?? ""] ?? ""}`
      : "Pay negotiable";

  const apply = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await applyToJob({
        jobId,
        message,
        proposedPay: proposedPay ? Number(proposedPay) : undefined,
        phone: phone || undefined,
      });
      toast.success("Application sent", {
        description: `${j.posterName} can now review it. Track the status from your dashboard.`,
      });
      setMessage("");
    } catch (err: any) {
      setError(err?.message || "Could not send your application.");
    } finally {
      setSubmitting(false);
    }
  };

  const setApp = async (applicationId: any, status: any) => {
    try {
      await updateStatus({ applicationId, status });
      toast.success("Application updated");
    } catch (err: any) {
      toast.error(err?.message || "Could not update the application");
    }
  };

  const closeJob = async () => {
    try {
      await setJobStatus({ jobId, status: closed ? "open" : "closed" });
      toast.success(closed ? "Job reopened" : "Job closed");
    } catch (err: any) {
      toast.error(err?.message || "Could not change the job status");
    }
  };

  return (
    <div className="min-h-screen bg-[#05050A] text-white pb-28 md:pb-16">
      <header className="border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 py-5">
          <button onClick={() => navigate("/employment/jobs")} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Browse Jobs
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div>
          <div className="flex flex-wrap items-start gap-3">
            <h1 className="text-2xl font-black tracking-tight flex-1 min-w-0">{j.title}</h1>
            <span className="px-3 py-1 rounded-full text-[11px] border border-white/10 bg-white/[0.04] text-white/60">
              {STATUS_LABELS[j.status] ?? j.status}
            </span>
          </div>
          {/* "Posted by Jane" — an individual employer is shown as a person. */}
          <p className="text-sm text-white/50 mt-2">{j.byline}</p>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-white/45">
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {j.location}, {j.county}{j.town ? ` · ${j.town}` : ""}</span>
            <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> {EMPLOYMENT_LABELS[j.employmentType ?? ""] ?? "Open"}</span>
            <span className="font-semibold text-emerald-400">{salary}</span>
          </div>
        </div>

        <section className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
          <h2 className="text-sm font-bold mb-2">About this job</h2>
          <p className="text-sm text-white/60 whitespace-pre-wrap leading-relaxed">{j.description}</p>
          {j.responsibilities?.length > 0 && (
            <>
              <h3 className="text-xs font-bold text-white/70 mt-4 mb-1.5">Responsibilities</h3>
              <ul className="space-y-1.5">
                {j.responsibilities.map((r: string, i: number) => (
                  <li key={i} className="text-sm text-white/55 flex gap-2">
                    <span className="text-nx-cyan">•</span>{r}
                  </li>
                ))}
              </ul>
            </>
          )}
          {j.requiredSkills?.length > 0 && (
            <>
              <h3 className="text-xs font-bold text-white/70 mt-4 mb-2">Required skills</h3>
              <div className="flex flex-wrap gap-1.5">
                {j.requiredSkills.map((s: string) => (
                  <span key={s} className="px-2.5 py-1 rounded-full text-[11px] border border-white/10 bg-white/[0.04] text-white/60">{s}</span>
                ))}
              </div>
            </>
          )}
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 mt-4 text-xs text-white/45">
            {j.experienceRequired && <p>Experience: {j.experienceRequired}</p>}
            {j.workingHours && <p>Working hours: {j.workingHours}</p>}
            {j.positions && <p>Positions: {j.positions}</p>}
            {j.startDate && <p>Starts: {new Date(j.startDate).toLocaleDateString()}</p>}
            {j.deadline && <p>Apply before: {new Date(j.deadline).toLocaleDateString()}</p>}
            {j.applicationMethod && <p>How to apply: {j.applicationMethod}</p>}
          </div>
        </section>

        {/* ── Applicant view ── */}
        {!isPoster && (
          <section className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
            <h2 className="text-sm font-bold">Apply for this job</h2>
            {alreadyApplied ? (
              <p className="mt-3 text-sm text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> You have applied. The employer will review it.
              </p>
            ) : closed ? (
              <p className="mt-3 text-sm text-white/40">This job is closed to new applications.</p>
            ) : !isAuthenticated ? (
              <div className="mt-3 space-y-3">
                <p className="text-sm text-white/50">Sign in to apply — your application goes straight to the employer.</p>
                <button
                  onClick={() => navigate(`/auth?returnTo=${encodeURIComponent(`/employment/jobs/${j._id}`)}`)}
                  className="px-6 py-2.5 rounded-xl bg-nx-violet hover:bg-nx-violet/85 text-white text-sm font-semibold transition-colors"
                >
                  Sign in to apply
                </button>
              </div>
            ) : isLoading ? null : (
              <form onSubmit={apply} className="mt-3 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-white/60 mb-1.5">Why are you a good fit?</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    placeholder="Tell the employer about your experience, where you are based and when you can start."
                    className="w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-nx-violet/50"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-white/60 mb-1.5">Expected pay (KES, optional)</label>
                    <input value={proposedPay} onChange={(e) => setProposedPay(e.target.value)} inputMode="numeric" className="w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-nx-violet/50" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/60 mb-1.5">Contact number (optional)</label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07xx xxx xxx" className="w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-nx-violet/50" />
                  </div>
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
                <button
                  type="submit"
                  disabled={submitting || message.trim().length < 10}
                  className="px-7 py-3 rounded-xl bg-nx-violet hover:bg-nx-violet/85 text-white text-sm font-semibold transition-colors disabled:opacity-40 flex items-center gap-2"
                >
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : "Send application"}
                </button>
              </form>
            )}
          </section>
        )}

        {/* ── Employer view: real applicants, real status changes ── */}
        {isPoster && (
          <section className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-bold">Applicants ({applications?.length ?? 0})</h2>
              <button
                onClick={closeJob}
                className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-[11px] text-white/60 hover:text-white transition-colors"
              >
                {closed ? "Reopen job" : "Close job"}
              </button>
            </div>
            {applications === undefined ? (
              <p className="text-sm text-white/40 mt-3 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading applicants…</p>
            ) : applications.length === 0 ? (
              <p className="text-sm text-white/40 mt-3">No applications yet.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {applications.map((a: any) => (
                  <div key={a._id} className="rounded-xl border border-white/8 bg-white/[0.02] p-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">{a.applicantName}</span>
                      <span className="text-[11px] text-white/35">{a.applicantRole}</span>
                      <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] border border-white/10 bg-white/[0.04] text-white/60 capitalize">
                        {a.status}
                      </span>
                    </div>
                    <p className="text-sm text-white/60 mt-2">{a.message}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2.5 text-[11px] text-white/40">
                      {a.proposedBudget ? <span>Asked: KES {a.proposedBudget.toLocaleString()}</span> : null}
                      {a.applicantPhone ? <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {a.applicantPhone}</span> : null}
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(a.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <button onClick={() => setApp(a._id, "shortlisted")} className="px-3 py-1.5 rounded-lg border border-nx-cyan/30 bg-nx-cyan/10 text-[11px] text-nx-cyan hover:bg-nx-cyan/20 transition-colors">Shortlist</button>
                      <button onClick={() => setApp(a._id, "accepted")} className="px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-[11px] text-emerald-400 hover:bg-emerald-500/20 transition-colors flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Accept</button>
                      <button onClick={() => setApp(a._id, "rejected")} className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-[11px] text-white/50 hover:text-white transition-colors flex items-center gap-1"><XCircle className="w-3 h-3" /> Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}