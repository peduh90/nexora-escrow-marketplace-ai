import SellerLayout from "./SellerLayout";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Loader2, Users, UserPlus, Package, Briefcase, CheckCircle2,
  XCircle, MessageSquare, Rocket, Trash2, Send, AlertCircle,
  ShieldCheck, Clock,
} from "lucide-react";

const PERMISSIONS = [
  { key: "PRODUCT_CREATE", label: "Create products" },
  { key: "PRODUCT_EDIT", label: "Edit products" },
  { key: "PRODUCT_IMAGE_UPLOAD", label: "Upload images" },
  { key: "PRODUCT_VIEW", label: "View products" },
  { key: "PRODUCT_SUBMIT", label: "Submit for review" },
  { key: "PRODUCT_DELETE_DRAFT", label: "Delete drafts" },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-white/10 text-white/60" },
  pending_seller_review: { label: "Awaiting your review", color: "bg-amber-400/10 text-amber-400" },
  approved: { label: "Approved", color: "bg-emerald-400/10 text-emerald-400" },
  rejected: { label: "Rejected", color: "bg-red-400/10 text-red-400" },
  changes_requested: { label: "Changes requested", color: "bg-orange-400/10 text-orange-400" },
  published: { label: "Published", color: "bg-nx-cyan/10 text-nx-cyan" },
};

type Tab = "review" | "team" | "invites" | "jobs";

export default function SellerMyTeam() {
  const [tab, setTab] = useState<Tab>("review");

  // Review queue
  const products = useQuery(api.dataEntry.myWorkerProducts, { sellerId: "" });
  const reviewProduct = useMutation(api.dataEntry.reviewProduct);
  const publishProduct = useMutation(api.dataEntry.publishApprovedProduct);

  // Team
  const staff = useQuery(api.dataEntry.myStaffActivity);
  const revokeAccess = useMutation(api.dataEntry.revokeAccess);
  const updatePermissions = useMutation(api.dataEntry.updateStaffPermissions);

  // Invitations
  const invitations = useQuery(api.dataEntry.myPendingInvitations);
  const createInvitation = useMutation(api.dataEntry.createInvitation);
  const cancelInvitation = useMutation(api.dataEntry.cancelInvitation);

  // Jobs
  const jobs = useQuery(api.dataEntry.myJobs);
  const createJob = useMutation(api.dataEntry.createJob);
  const publishJob = useMutation(api.dataEntry.publishJob);
  const cancelJob = useMutation(api.dataEntry.cancelJob);

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [note, setNote] = useState("");

  // Invite form
  const [inviteForm, setInviteForm] = useState({ name: "", email: "", phone: "", description: "" });
  const [inviteSent, setInviteSent] = useState(false);

  // Permissions editor
  const [permWorker, setPermWorker] = useState<any>(null);
  const [permSelected, setPermSelected] = useState<string[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  // Job form
  const [jobForm, setJobForm] = useState({
    title: "", description: "", productCount: "10", category: "", pricePerProduct: "", publishMode: "manual" as "manual" | "auto",
  });

  const pending = (products ?? []).filter((p: any) => p.status === "pending_seller_review");
  const approved = (products ?? []).filter((p: any) => p.status === "approved");

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key);
    setError(null);
    try {
      await fn();
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setBusy(null);
    }
  };

  const onReview = (p: any, action: "approve" | "reject" | "changes_requested") =>
    run(`review-${p._id}`, async () => {
      await reviewProduct({
        sellerId: p.sellerId,
        productEntryId: p._id,
        action,
        note: note || undefined,
      });
      setNoteFor(null);
      setNote("");
    });

  const sendInvite = () =>
    run("invite", async () => {
      if (!inviteForm.email.trim() && !inviteForm.phone.trim()) {
        throw new Error("Enter the worker's email or phone.");
      }
      await createInvitation({
        inviteeName: inviteForm.name.trim() || undefined,
        inviteeEmail: inviteForm.email.trim() || undefined,
        inviteePhone: inviteForm.phone.trim() || undefined,
        description: inviteForm.description.trim() || undefined,
      });
      setInviteForm({ name: "", email: "", phone: "", description: "" });
      setInviteSent(true);
      setTimeout(() => setInviteSent(false), 4000);
    });

  const submitJob = () =>
    run("job", async () => {
      if (!jobForm.title.trim() || !jobForm.description.trim()) {
        throw new Error("Give the job a title and description.");
      }
      if (Number(jobForm.productCount) < 1 || Number(jobForm.pricePerProduct) <= 0) {
        throw new Error("Set a product count and a price per product.");
      }
      await createJob({
        title: jobForm.title.trim(),
        description: jobForm.description.trim(),
        productCount: Number(jobForm.productCount),
        category: jobForm.category.trim() || "General",
        pricePerProduct: Number(jobForm.pricePerProduct),
        publishMode: jobForm.publishMode,
      });
      setJobForm({ title: "", description: "", productCount: "10", category: "", pricePerProduct: "", publishMode: "manual" });
    });

  const tabs: Array<{ key: Tab; label: string; icon: any; badge?: number }> = [
    { key: "review", label: "Review queue", icon: Package, badge: pending.length },
    { key: "team", label: "My Team", icon: Users },
    { key: "invites", label: "Invitations", icon: UserPlus, badge: invitations?.length ?? 0 },
    { key: "jobs", label: "Jobs", icon: Briefcase, badge: jobs?.length ?? 0 },
  ];

  const inputCls =
    "w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-nx-violet/40 transition-colors";

  return (
    <SellerLayout>
      <div className="mb-5">
        <h2 className="text-lg font-bold text-white">My Data Entry Team</h2>
        <p className="text-xs text-white/30 mt-0.5">
          Invite workers to enter products for your store, review their drafts before they go live, and post entry jobs.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 p-1 rounded-xl border border-white/5 bg-white/[0.03] w-full sm:w-fit overflow-x-auto mb-5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              tab === t.key ? "bg-nx-violet text-white" : "text-white/50 hover:text-white"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
            {!!t.badge && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                tab === t.key ? "bg-white/20 text-white" : "bg-nx-violet/20 text-nx-violet"
              }`}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 px-4 py-3 rounded-lg bg-red-400/10 border border-red-400/20 text-xs text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-px" /> {error}
        </div>
      )}

      {/* ── REVIEW QUEUE ── */}
      {tab === "review" && (
        <div className="space-y-5">
          <section>
            <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">
              Awaiting your review ({pending.length})
            </h3>
            {products === undefined ? (
              <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 text-nx-violet animate-spin" /></div>
            ) : pending.length === 0 ? (
              <div className="text-center py-10 rounded-2xl border border-dashed border-white/10">
                <CheckCircle2 className="w-8 h-8 text-white/10 mx-auto mb-2" />
                <p className="text-xs text-white/35">No products waiting for review. Worker drafts land here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pending.map((p: any) => (
                  <div key={p._id} className="rounded-xl border border-amber-400/15 bg-amber-400/[0.03] p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-lg bg-white/[0.05] overflow-hidden flex items-center justify-center shrink-0">
                        {p.listing?.images?.[0] ? (
                          <img src={p.listing.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-5 h-5 text-white/15" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-medium text-white truncate">{p.listing?.title || "Untitled"}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusConfig[p.status]?.color}`}>
                            {statusConfig[p.status]?.label}
                          </span>
                        </div>
                        <p className="text-xs text-white/35 mt-0.5 truncate">
                          by {p.workerName}
                          {p.listing?.price != null ? ` · KSh ${p.listing.price.toLocaleString()}` : ""}
                          {p.listing?.category ? ` · ${p.listing.category}` : ""}
                        </p>
                        <p className="text-[11px] text-white/40 mt-1 line-clamp-2">{p.listing?.description}</p>
                      </div>
                    </div>

                    {noteFor === p._id ? (
                      <div className="mt-3 flex flex-col sm:flex-row gap-2">
                        <input
                          autoFocus
                          type="text"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="Note for the worker (what should change?)"
                          className={`flex-1 ${inputCls}`}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => onReview(p, "changes_requested")}
                            disabled={busy === `review-${p._id}`}
                            className="flex-1 px-4 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                          >
                            Send changes
                          </button>
                          <button
                            onClick={() => { setNoteFor(null); setNote(""); }}
                            className="px-3 py-2.5 rounded-lg bg-white/10 text-white/50 text-xs hover:bg-white/15"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={() => onReview(p, "approve")}
                          disabled={busy === `review-${p._id}`}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          {busy === `review-${p._id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          Approve
                        </button>
                        <button
                          onClick={() => { setNoteFor(p._id); setNote(""); }}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white/60 text-xs hover:bg-white/[0.09] transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> Request changes
                        </button>
                        <button
                          onClick={() => onReview(p, "reject")}
                          disabled={busy === `review-${p._id}`}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-400/10 text-red-400 text-xs hover:bg-red-400/20 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Approved, awaiting publish */}
          {approved.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">
                Approved — ready to publish ({approved.length})
              </h3>
              <div className="space-y-2">
                {approved.map((p: any) => (
                  <div key={p._id} className="flex items-center gap-3 p-3 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.03]">
                    <div className="w-10 h-10 rounded-lg bg-white/[0.05] overflow-hidden flex items-center justify-center shrink-0">
                      {p.listing?.images?.[0] ? (
                        <img src={p.listing.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-4 h-4 text-white/15" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white truncate">{p.listing?.title || "Untitled"}</p>
                      <p className="text-[10px] text-white/30">by {p.workerName}</p>
                    </div>
                    <button
                      onClick={() => run(`pub-${p._id}`, () => publishProduct({ sellerId: p.sellerId, productEntryId: p._id }))}
                      disabled={busy === `pub-${p._id}`}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-nx-violet hover:bg-nx-violet/80 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      {busy === `pub-${p._id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
                      Publish
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ── TEAM ── */}
      {tab === "team" && (
        <div>
          {staff === undefined ? (
            <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 text-nx-violet animate-spin" /></div>
          ) : staff.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border border-dashed border-white/10">
              <Users className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/35">No team members yet.</p>
              <p className="text-xs text-white/25 mt-1">Invite a worker from the Invitations tab to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {staff.map((m: any) => (
                <div key={m._id} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white">{m.workerName}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          m.status === "active" ? "bg-emerald-400/10 text-emerald-400" : "bg-white/10 text-white/40"
                        }`}>
                          {m.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-white/35">
                        <span>{m.totalProducts ?? 0} products</span>
                        <span className="text-emerald-400/70">{m.approved ?? 0} approved</span>
                        <span className="text-amber-400/70">{m.submitted ?? 0} in review</span>
                        <span className="text-orange-400/70">{m.changesRequested ?? 0} changes</span>
                        <span className="text-red-400/70">{m.rejected ?? 0} rejected</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setPermWorker(m); setPermSelected(m.permissions ?? []); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-white/60 text-xs hover:bg-white/[0.07] transition-colors"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" /> Permissions
                      </button>
                      <button
                        onClick={() => run(`revoke-${m._id}`, () => revokeAccess({ workerId: m.workerId, reason: "Removed by seller" }))}
                        disabled={busy === `revoke-${m._id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-400/10 text-red-400 text-xs hover:bg-red-400/20 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Revoke
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── INVITATIONS ── */}
      {tab === "invites" && (
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
              <UserPlus className="w-4 h-4 text-nx-violet" /> Invite a data entry worker
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                value={inviteForm.name}
                onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                placeholder="Worker's name (optional)"
                className={inputCls}
              />
              <input
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                placeholder="Worker's email"
                className={inputCls}
              />
              <input
                type="tel"
                value={inviteForm.phone}
                onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
                placeholder="…or phone number (07XX XXX XXX)"
                className={inputCls}
              />
              <textarea
                value={inviteForm.description}
                onChange={(e) => setInviteForm({ ...inviteForm, description: e.target.value })}
                rows={3}
                placeholder="Message: what should they enter for you?"
                className={inputCls}
              />
              <button
                onClick={sendInvite}
                disabled={busy === "invite"}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-nx-violet hover:bg-nx-violet/80 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {busy === "invite" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send invitation
              </button>
              {inviteSent && (
                <p className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Invitation created — share the invite link from your notifications or let them accept by email.
                </p>
              )}
              <p className="text-[11px] text-white/30">
                The worker signs in with that email/phone, opens their invitation, and joins your team. They can only create drafts — you approve everything.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-amber-400" /> Pending invitations
            </h3>
            {invitations === undefined ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-nx-violet animate-spin" /></div>
            ) : invitations.length === 0 ? (
              <p className="text-xs text-white/35 py-6 text-center">No pending invitations.</p>
            ) : (
              <div className="space-y-2">
                {invitations.map((inv: any) => (
                  <div key={inv._id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5">
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{inv.inviteeName || inv.inviteeEmail || inv.inviteePhone}</p>
                      <p className="text-[10px] text-white/30 truncate">
                        {inv.inviteeEmail || inv.inviteePhone} · expires {new Date(inv.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          const link = `${window.location.origin}/data-entry/invite/${inv._id}`;
                          navigator.clipboard?.writeText(link).then(
                            () => { setCopied(inv._id); setTimeout(() => setCopied(null), 2000); },
                            () => setError("Could not copy the link."),
                          );
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-nx-violet/15 border border-nx-violet/30 text-nx-violet text-xs hover:bg-nx-violet/25 transition-colors"
                        title="Copy invitation link"
                      >
                        {copied === inv._id ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                        {copied === inv._id ? "Copied" : "Copy link"}
                      </button>
                      <button
                        onClick={() => run(`cancel-${inv._id}`, () => cancelInvitation({ invitationId: inv._id }))}
                        disabled={busy === `cancel-${inv._id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-400/10 text-red-400 text-xs hover:bg-red-400/20 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── JOBS ── */}
      {tab === "jobs" && (
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
              <Briefcase className="w-4 h-4 text-nx-violet" /> Post a data entry job
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                value={jobForm.title}
                onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                placeholder="Job title, e.g. Enter 50 safety gear products"
                className={inputCls}
              />
              <textarea
                value={jobForm.description}
                onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                rows={3}
                placeholder="Describe the products, data sources, quality expectations…"
                className={inputCls}
              />
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-white/40">Products</label>
                  <input
                    type="number"
                    min={1}
                    value={jobForm.productCount}
                    onChange={(e) => setJobForm({ ...jobForm, productCount: e.target.value })}
                    className={`mt-1 ${inputCls}`}
                  />
                </div>
                <div>
                  <label className="text-[11px] text-white/40">KSh / product</label>
                  <input
                    type="number"
                    min={1}
                    value={jobForm.pricePerProduct}
                    onChange={(e) => setJobForm({ ...jobForm, pricePerProduct: e.target.value })}
                    className={`mt-1 ${inputCls}`}
                  />
                </div>
                <div>
                  <label className="text-[11px] text-white/40">Publish</label>
                  <select
                    value={jobForm.publishMode}
                    onChange={(e) => setJobForm({ ...jobForm, publishMode: e.target.value as "manual" | "auto" })}
                    className={`mt-1 ${inputCls}`}
                  >
                    <option value="manual" className="bg-[#0A0A12]">Manual review</option>
                    <option value="auto" className="bg-[#0A0A12]">Auto-publish</option>
                  </select>
                </div>
              </div>
              <input
                type="text"
                value={jobForm.category}
                onChange={(e) => setJobForm({ ...jobForm, category: e.target.value })}
                placeholder="Category, e.g. Safety & Industrial"
                className={inputCls}
              />
              <button
                onClick={submitJob}
                disabled={busy === "job"}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-nx-violet hover:bg-nx-violet/80 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {busy === "job" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Create job
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Your jobs</h3>
            {jobs === undefined ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-nx-violet animate-spin" /></div>
            ) : jobs.length === 0 ? (
              <p className="text-xs text-white/35 py-6 text-center">No jobs yet.</p>
            ) : (
              <div className="space-y-2">
                {jobs.map((job: any) => (
                  <div key={job._id} className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-white truncate">{job.title}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                            job.status === "open" ? "bg-emerald-400/10 text-emerald-400" :
                            job.status === "draft" ? "bg-white/10 text-white/50" :
                            job.status === "cancelled" ? "bg-red-400/10 text-red-400" :
                            "bg-nx-cyan/10 text-nx-cyan"
                          }`}>
                            {job.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-white/35 mt-0.5">
                          {job.productCount} products · KSh {(job.pricePerProduct ?? 0).toLocaleString()} each
                          {job.totalBudget ? ` · budget KSh ${job.totalBudget.toLocaleString()}` : ""}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {job.status === "draft" && (
                          <button
                            onClick={() => run(`pubjob-${job._id}`, () => publishJob({ jobId: job._id }))}
                            disabled={busy === `pubjob-${job._id}`}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                          >
                            Publish
                          </button>
                        )}
                        {(job.status === "draft" || job.status === "open") && (
                          <button
                            onClick={() => run(`canceljob-${job._id}`, () => cancelJob({ jobId: job._id }))}
                            disabled={busy === `canceljob-${job._id}`}
                            className="px-3 py-1.5 rounded-lg bg-red-400/10 text-red-400 text-xs hover:bg-red-400/20 transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Permissions modal */}
      {permWorker && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 p-0 md:p-4" onClick={() => setPermWorker(null)}>
          <div
            className="w-full md:max-w-md rounded-t-2xl md:rounded-2xl border border-white/10 bg-[#0B0B14] p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-white">Permissions — {permWorker.workerName}</h3>
            <div className="space-y-2">
              {PERMISSIONS.map((p) => (
                <label key={p.key} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.03] border border-white/5 cursor-pointer hover:border-white/15 transition-colors">
                  <input
                    type="checkbox"
                    checked={permSelected.includes(p.key)}
                    onChange={(e) =>
                      setPermSelected((prev) =>
                        e.target.checked ? [...prev, p.key] : prev.filter((k) => k !== p.key)
                      )
                    }
                    className="accent-nx-violet"
                  />
                  <span className="text-sm text-white/70">{p.label}</span>
                  <span className="ml-auto text-[10px] text-white/25">{p.key}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  run(`perm-${permWorker._id}`, async () => {
                    await updatePermissions({ workerId: permWorker.workerId, permissions: permSelected });
                    setPermWorker(null);
                  })
                }
                disabled={busy === `perm-${permWorker._id}`}
                className="flex-1 py-2.5 rounded-xl bg-nx-violet hover:bg-nx-violet/80 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {busy === `perm-${permWorker._id}` && <Loader2 className="w-4 h-4 animate-spin" />}
                Save permissions
              </button>
              <button
                onClick={() => setPermWorker(null)}
                className="px-4 py-2.5 rounded-xl bg-white/10 text-white/60 text-sm hover:bg-white/15"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </SellerLayout>
  );
}
