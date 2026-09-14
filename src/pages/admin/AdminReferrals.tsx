import React, { useMemo, useState } from "react";
import AdminLayout from "./AdminLayout";
import { useMutation, useQuery, useConvex } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import {
  Loader2, Users, Search, Check, X, Ban, ShieldCheck, Download,
  ChevronDown, ChevronUp, Settings2, Wallet, AlertTriangle, Share2,
  Eye, EyeOff, Save,
} from "lucide-react";

function fmtKES(n: number | undefined | null) {
  return `KES ${(n || 0).toLocaleString()}`;
}
function fmtDate(n: number | string | undefined | null) {
  if (!n) return "—";
  const d = typeof n === "number" ? new Date(n) : new Date(Number(n));
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}
function downloadCsv(filename: string, rows: Record<string, any>[]) {
  if (!rows.length) {
    toast.info("Nothing to export yet.");
    return;
  }
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  toast.success(`Exported ${rows.length} rows`);
}

/**
 * Page-level error boundary. Convex useQuery throws server errors during
 * render — without this, one unavailable referral query (e.g. functions not
 * yet pushed to the deployment the site points at) blanks the whole admin
 * panel with "Preview runtime error". Instead we show a clear, calm message
 * and keep the rest of the admin app alive.
 */
class ReferralErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  state = { hasError: false, message: "" };
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message || "Unknown error" };
  }
  componentDidCatch(err: Error) {
    console.error("[AdminReferrals] query error caught:", err.message);
  }
  render() {
    if (this.state.hasError) {
      return (
        <AdminLayout>
          <div className="rounded-xl border border-amber-400/25 bg-amber-500/[0.06] p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
              <div>
                <h2 className="font-semibold text-white">Creator & Referral data is unavailable right now</h2>
                <p className="mt-1.5 text-sm text-white/55 max-w-2xl leading-relaxed">
                  The referral backend didn't answer this request. If the site was just updated, give it
                  a moment and refresh — the referral functions may still be syncing to this deployment.
                  Nothing was lost: creators, referrals and commissions are stored safely in the database.
                </p>
                <p className="mt-2 text-xs text-white/35 font-mono break-all">{this.state.message}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-500/15 border border-amber-400/30 px-4 py-2 text-sm font-medium text-amber-200 hover:bg-amber-500/25"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </AdminLayout>
      );
    }
    return this.props.children;
  }
}

function AdminReferralsInner() {
  // Live queries. An error on any of these (e.g. a deployment that hasn't
  // received the referral functions yet) surfaces through the page-level
  // error boundary instead of crashing the whole admin panel.
  const overview = useQuery(api.referral.adminOverview);
  const settingsRow = useQuery(api.referral.getProgramSettings);
  const convexClient = useConvex();
  const agreements = useQuery(api.referralAgreement.adminListAgreements);
  const reviewAgreement = useMutation(api.referralAgreement.adminReviewAgreement);
  const [openAgreement, setOpenAgreement] = useState<any>(null);
  const reviewCreator = useMutation(api.referral.reviewCreator);
  const reviewReferral = useMutation(api.referral.reviewReferral);
  const reviewEarning = useMutation(api.referral.reviewEarning);
  const adjustEarning = useMutation(api.referral.adjustEarning);
  const payoutCreator = useMutation(api.referral.payoutCreator);
  const updateProgramSettings = useMutation(api.referral.updateProgramSettings);

  const [tab, setTab] = useState<"creators" | "fraud" | "earnings" | "agreements" | "settings">("creators");
  const [search, setSearch] = useState("");
  const [expandedCreator, setExpandedCreator] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Settings form state
  const [sForm, setSForm] = useState<{ fixedPerVerifiedUser: string; sellerActivationBonus: string; freelancerActivationBonus: string; employerActivationBonus: string; firstTransactionBonus: string; revenueSharePercent: string; revenueShareCap: string; maxReferralsPerHour: string } | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const detail = useQuery(
    api.referral.creatorDetail,
    expandedCreator ? { creatorId: expandedCreator } : "skip",
  );

  const filteredCreators = useMemo(() => {
    if (!overview) return [];
    const q = search.trim().toLowerCase();
    if (!q) return overview.creators;
    return overview.creators.filter(
      (c: any) =>
        c.displayName.toLowerCase().includes(q) ||
        c.referralCode.toLowerCase().includes(q) ||
        c.platformHandle.toLowerCase().includes(q) ||
        c.platform.toLowerCase().includes(q),
    );
  }, [overview, search]);

  const act = async (key: string, fn: () => Promise<any>, okMsg?: string) => {
    setBusy(key);
    try {
      await fn();
      if (okMsg) toast.success(okMsg);
    } catch (err: any) {
      toast.error(err?.message || "Action failed.");
    } finally {
      setBusy(null);
    }
  };

  const openSettings = () => {
    if (settingsRow) {
      setSForm({
        fixedPerVerifiedUser: String(settingsRow.fixedPerVerifiedUser),
        sellerActivationBonus: String(settingsRow.sellerActivationBonus),
        freelancerActivationBonus: String(settingsRow.freelancerActivationBonus),
        employerActivationBonus: String(settingsRow.employerActivationBonus ?? 150),
        firstTransactionBonus: String(settingsRow.firstTransactionBonus),
        revenueSharePercent: String(settingsRow.revenueSharePercent),
        revenueShareCap: String(settingsRow.revenueShareCap),
        maxReferralsPerHour: String(settingsRow.maxReferralsPerHour),
      });
    }
    setShowSettings(true);
  };

  const saveSettings = async () => {
    if (!sForm) return;
    setSavingSettings(true);
    try {
      await updateProgramSettings({
        fixedPerVerifiedUser: Number(sForm.fixedPerVerifiedUser) || 0,
        sellerActivationBonus: Number(sForm.sellerActivationBonus) || 0,
        freelancerActivationBonus: Number(sForm.freelancerActivationBonus) || 0,
        employerActivationBonus: Number(sForm.employerActivationBonus) || 0,
        firstTransactionBonus: Number(sForm.firstTransactionBonus) || 0,
        revenueSharePercent: Number(sForm.revenueSharePercent) || 0,
        revenueShareCap: Number(sForm.revenueShareCap) || 0,
        maxReferralsPerHour: Number(sForm.maxReferralsPerHour) || 1,
      });
      toast.success("Commission rules updated — new earnings use them immediately.");
      setShowSettings(false);
    } catch (err: any) {
      toast.error(err?.message || "Could not save settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  if (overview === undefined) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-6 h-6 animate-spin text-white/40" />
        </div>
      </AdminLayout>
    );
  }

  const t = overview.totals;

  const fetchExport = async (kind: "referrals" | "earnings") => {
    try {
      const rep: any = await convexClient.query(api.referral.generateExport, {});
      downloadCsv(
        kind === "referrals" ? "nexora-referral-referrals.csv" : "nexora-referral-earnings.csv",
        kind === "referrals" ? rep?.referrals || [] : rep?.earnings || [],
      );
    } catch (err: any) {
      toast.error(err?.message || "Export failed.");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
              <Share2 className="w-6 h-6 text-violet-400" /> Creator & Referral Program
            </h1>
            <p className="mt-1 text-sm text-white/45">
              Approve creators, police fraud, control commission rules and pay out earnings.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openSettings}
              className="inline-flex items-center gap-2 rounded-lg border border-white/12 px-3.5 py-2 text-sm text-white/75 hover:bg-white/5 transition-colors"
            >
              <Settings2 className="w-4 h-4" /> Commission rules
            </button>
            <button
              onClick={() => fetchExport("referrals")}
              className="inline-flex items-center gap-2 rounded-lg border border-white/12 px-3.5 py-2 text-sm text-white/75 hover:bg-white/5 transition-colors"
            >
              <Download className="w-4 h-4" /> Referrals CSV
            </button>
            <button
              onClick={() => fetchExport("earnings")}
              className="inline-flex items-center gap-2 rounded-lg border border-white/12 px-3.5 py-2 text-sm text-white/75 hover:bg-white/5 transition-colors"
            >
              <Download className="w-4 h-4" /> Earnings CSV
            </button>
          </div>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
          {[
            { label: "Creators", value: t.creators, sub: `${t.approvedCreators} approved · ${t.pendingApplications} pending` },
            { label: "Suspended", value: t.suspendedCreators, sub: "links paused" },
            { label: "Referrals", value: t.totalReferrals, sub: `${t.qualifiedReferrals} qualified` },
            { label: "Flagged", value: t.flaggedReferrals, sub: "need review" },
            { label: "Pending commission", value: fmtKES(t.pendingCommission), sub: "not yet paid" },
            { label: "Paid commission", value: fmtKES(t.paidCommission), sub: "lifetime" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
              <div className="text-xs text-white/40">{s.label}</div>
              <div className="mt-1.5 text-xl font-bold text-white tabular-nums">{s.value}</div>
              <div className="mt-0.5 text-[11px] text-white/35">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-white/8">
          {([
            ["creators", `Creators (${overview.creators.length})`],
            ["agreements", `Agreements (${(agreements ?? []).filter((a: any) => a.status === "pending").length})`],
            ["fraud", `Fraud queue (${overview.flagged.length})`],
            ["earnings", `Pending earnings (${overview.pendingEarnings.length})`],
            ["settings", "Commission rules"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key as any)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === key ? "border-violet-400 text-white" : "border-transparent text-white/45 hover:text-white/75"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ─── CREATORS TAB ─── */}
        {tab === "creators" && (
          <div className="space-y-3">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search creators by name, code, handle…"
                className="w-full rounded-lg bg-black/40 border border-white/10 pl-9 pr-3 py-2.5 text-sm text-white outline-none focus:border-violet-400/60 placeholder:text-white/25"
              />
            </div>

            {filteredCreators.length === 0 ? (
              <div className="rounded-xl border border-white/8 bg-white/[0.02] p-10 text-center text-sm text-white/40">
                No creators yet. Applications from the /join page appear here for review.
              </div>
            ) : (
              filteredCreators.map((c: any) => (
                <div key={c._id} className="rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden">
                  <div className="p-4 flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white">{c.displayName}</span>
                        <span className="font-mono text-xs bg-violet-500/10 border border-violet-400/25 text-violet-200 px-2 py-0.5 rounded tracking-widest">
                          {c.referralCode}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            c.status === "approved" ? "bg-emerald-500/15 text-emerald-300"
                            : c.status === "pending" ? "bg-amber-500/15 text-amber-300"
                            : c.status === "suspended" ? "bg-red-500/15 text-red-300"
                            : "bg-white/10 text-white/50"
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-white/40 capitalize">
                        {c.platform} · {c.platformHandle}
                        {c.audienceSize ? ` · ${c.audienceSize}` : ""} · applied {fmtDate(c.appliedAt)}
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/50 tabular-nums">
                        <span>{c.clicks} clicks</span>
                        <span>{c.registrations} registrations</span>
                        <span className="text-emerald-300/80">{c.verified} verified</span>
                        <span>{c.activeUsers} active</span>
                        <span className="text-violet-300/80">{c.sellersReferred} sellers</span>
                        <span className="text-fuchsia-300/80">{c.freelancersReferred} freelancers</span>
                        <span className="text-amber-300/80">{c.transactionsGenerated} transactions</span>
                        <span>{fmtKES(c.pendingCommission)} pending</span>
                        <span className="text-emerald-300/80">{fmtKES(c.paidCommission)} paid</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <button
                        onClick={() => setExpandedCreator(expandedCreator === c._id ? null : c._id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 px-3 py-2 text-xs text-white/75 hover:bg-white/5"
                      >
                        {expandedCreator === c._id ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {expandedCreator === c._id ? "Hide" : "Referrals"}
                        {expandedCreator === c._id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                      {c.status !== "approved" ? (
                        <>
                          <button
                            onClick={() => act(`a-${c._id}`, () => reviewCreator({ creatorId: c._id, decision: "approve" }), "Creator approved — link is live")}
                            disabled={busy === `a-${c._id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 border border-emerald-400/30 px-3 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-50"
                          >
                            {busy === `a-${c._id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            Approve
                          </button>
                          {c.status !== "rejected" && (
                            <button
                              onClick={() => act(`r-${c._id}`, () => reviewCreator({ creatorId: c._id, decision: "reject" }), "Application rejected")}
                              disabled={busy === `r-${c._id}`}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/10 border border-red-400/25 px-3 py-2 text-xs font-medium text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" /> Reject
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => act(`p-${c._id}`, async () => {
                              const res = await payoutCreator({ creatorId: c._id });
                              toast.success(`Paid ${fmtKES(res.total)} across ${res.paidCount} earnings (${res.reference})`);
                            })}
                            disabled={busy === `p-${c._id}` || c.pendingCommission <= 0}
                            title={c.pendingCommission <= 0 ? "Nothing approved to pay — approve earnings first" : "Pay all approved earnings"}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/15 border border-cyan-400/30 px-3 py-2 text-xs font-medium text-cyan-300 hover:bg-cyan-500/25 disabled:opacity-40"
                          >
                            {busy === `p-${c._id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wallet className="w-3.5 h-3.5" />}
                            Payout approved
                          </button>
                          <button
                            onClick={() => act(`s-${c._id}`, () => reviewCreator({ creatorId: c._id, decision: "suspend" }), "Creator suspended — link paused")}
                            disabled={busy === `s-${c._id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/10 border border-red-400/25 px-3 py-2 text-xs font-medium text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                          >
                            <Ban className="w-3.5 h-3.5" /> Suspend
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Expanded: every referral of this creator */}
                  {expandedCreator === c._id && (
                    <div className="border-t border-white/8 bg-black/25 p-4">
                      {detail === undefined ? (
                        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-white/30" /></div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead className="text-white/35 uppercase tracking-wider">
                              <tr>
                                <th className="text-left py-2 pr-3">User</th>
                                <th className="text-left py-2 pr-3">Email</th>
                                <th className="text-left py-2 pr-3">Phone</th>
                                <th className="text-left py-2 pr-3">Registered</th>
                                <th className="text-left py-2 pr-3">Stage</th>
                                <th className="text-left py-2 pr-3">Status</th>
                                <th className="text-left py-2 pr-3">Flags</th>
                                <th className="text-right py-2">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(detail?.referrals || []).map((r: any) => (
                                <tr key={r._id} className="border-t border-white/5">
                                  <td className="py-2.5 pr-3 text-white/85">{r.userName}</td>
                                  <td className="py-2.5 pr-3 text-white/45">{r.userEmail}</td>
                                  <td className="py-2.5 pr-3 text-white/45">{r.userPhone || "—"}</td>
                                  <td className="py-2.5 pr-3 text-white/60 whitespace-nowrap">{fmtDate(r.registeredAt)}</td>
                                  <td className="py-2.5 pr-3 text-white/70 capitalize">{String(r.stage).replace(/_/g, " ")}</td>
                                  <td className="py-2.5 pr-3">
                                    <span className={r.status === "qualified" ? "text-emerald-300" : r.status === "rejected" ? "text-red-300" : "text-amber-300"}>
                                      {r.status}
                                    </span>
                                  </td>
                                  <td className="py-2.5 pr-3">
                                    {r.flags?.length ? (
                                      <span className="text-red-300">{r.flags.join(", ")}</span>
                                    ) : (
                                      <span className="text-white/25">—</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 text-right">
                                    {r.status === "pending" && (
                                      <div className="inline-flex gap-1.5">
                                        <button
                                          onClick={() => act(`ra-${r._id}`, () => reviewReferral({ referralId: r._id, decision: "approve" }), "Referral qualified")}
                                          disabled={busy === `ra-${r._id}`}
                                          title={r.verifiedAt ? "Approve & qualify" : "Needs verification first"}
                                          className="rounded bg-emerald-500/15 border border-emerald-400/25 px-2 py-1 text-[11px] text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-40"
                                        >
                                          Approve
                                        </button>
                                        <button
                                          onClick={() => act(`rr-${r._id}`, () => reviewReferral({ referralId: r._id, decision: "reject" }), "Referral rejected")}
                                          disabled={busy === `rr-${r._id}`}
                                          className="rounded bg-red-500/10 border border-red-400/25 px-2 py-1 text-[11px] text-red-300 hover:bg-red-500/20 disabled:opacity-40"
                                        >
                                          Reject
                                        </button>
                                      </div>
                                    )}
                                    {r.status !== "pending" && <span className="text-white/20">—</span>}
                                  </td>
                                </tr>
                              ))}
                              {(detail?.referrals || []).length === 0 && (
                                <tr><td colSpan={8} className="py-6 text-center text-white/35">No referrals yet for this creator.</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ─── AGREEMENTS TAB — signed creator referral agreements ─── */}
        {tab === "agreements" && (
          <div className="space-y-3">
            {(agreements ?? []).length === 0 ? (
              <div className="rounded-xl border border-white/8 bg-white/[0.02] p-10 text-center text-sm text-white/40">
                No signed agreements yet. Creators sign the embedded agreement at /creator/agreement.
              </div>
            ) : (
              (agreements ?? []).map((a: any) => (
                <div key={a._id} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">
                        {a.fullName}
                        <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full ${
                          a.status === "pending" ? "bg-amber-400/10 text-amber-300" :
                          a.status === "approved" ? "bg-emerald-400/10 text-emerald-300" :
                          "bg-red-400/10 text-red-300"}`}>
                          {a.status}
                        </span>
                      </p>
                      <p className="text-[11px] text-white/35 mt-0.5">
                        {a.email} · {a.phone}{a.creatorCode ? ` · code ${a.creatorCode}` : ""} ·{" "}
                        signed {new Date(a.createdAt).toLocaleDateString()} as "{a.signature}"
                      </p>
                      <button
                        onClick={() => setOpenAgreement(a)}
                        className="mt-2 inline-flex items-center gap-1 text-[11px] text-nx-violet hover:text-nx-violet/80 font-medium"
                      >
                        📄 View full signed agreement
                      </button>
                      {a.reviewNote && <p className="text-[10px] text-white/40 mt-1">Note: {a.reviewNote}{a.reviewedBy ? ` — ${a.reviewedBy}` : ""}</p>}
                    </div>
                    {a.status === "pending" && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            setBusy(`agree-${a._id}`);
                            try { await reviewAgreement({ id: a._id, approve: true }); toast.success("Agreement approved"); }
                            catch (e: any) { toast.error(e?.message || "Failed"); }
                            finally { setBusy(null); }
                          }}
                          disabled={busy === `agree-${a._id}`}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black text-xs font-semibold hover:bg-emerald-400 disabled:opacity-50"
                        >Approve</button>
                        <button
                          onClick={async () => {
                            setBusy(`agree-${a._id}`);
                            try { await reviewAgreement({ id: a._id, approve: false, note: "Rejected by admin" }); toast.success("Agreement rejected"); }
                            catch (e: any) { toast.error(e?.message || "Failed"); }
                            finally { setBusy(null); }
                          }}
                          disabled={busy === `agree-${a._id}`}
                          className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-red-400/25 text-red-300 text-xs font-medium hover:bg-red-400/10 disabled:opacity-50"
                        >Reject</button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ─── FRAUD QUEUE TAB ─── */}
        {tab === "fraud" && (
          <div className="space-y-3">
            {overview.flagged.length === 0 ? (
              <div className="rounded-xl border border-white/8 bg-white/[0.02] p-10 text-center text-sm text-white/40 flex flex-col items-center gap-2">
                <ShieldCheck className="w-8 h-8 text-emerald-400/60" />
                No suspicious referrals right now. Anti-fraud checks run automatically on every registration.
              </div>
            ) : (
              overview.flagged.map((f: any) => (
                <div key={f._id} className="rounded-xl border border-red-400/20 bg-red-500/[0.04] p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <AlertTriangle className="w-4 h-4 text-red-300" />
                        <span className="font-semibold text-white">{f.userName}</span>
                        <span className="text-xs text-white/45">{f.userEmail} · {f.userPhone || "no phone"}</span>
                      </div>
                      <div className="mt-1.5 text-xs text-white/50">
                        Via <span className="text-violet-300 font-medium">{f.creatorName}</span> ({f.creatorCode}) ·
                        registered {fmtDate(f.registeredAt)} · stage: {String(f.stage).replace(/_/g, " ")}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {f.flags.map((fl: string) => (
                          <span key={fl} className="rounded-full bg-red-500/15 border border-red-400/25 px-2.5 py-0.5 text-[11px] font-medium text-red-300">
                            {fl === "no_tracked_click" ? "No tracked click — link never visited"
                              : fl === "duplicate_identity" ? "Duplicate email/phone vs another referral"
                              : fl === "rate_limit_exceeded" ? "Registration spike (hourly cap exceeded)"
                              : fl}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => act(`fa-${f._id}`, () => reviewReferral({ referralId: f._id, decision: "approve" }), "Referral approved & qualified")}
                        disabled={busy === `fa-${f._id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 border border-emerald-400/30 px-3 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" /> Legit — qualify
                      </button>
                      <button
                        onClick={() => act(`fr-${f._id}`, () => reviewReferral({ referralId: f._id, decision: "reject", notes: "Rejected in fraud review" }), "Referral rejected — any pending commission removed")}
                        disabled={busy === `fr-${f._id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/15 border border-red-400/30 px-3 py-2 text-xs font-medium text-red-300 hover:bg-red-500/25 disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" /> Fraud — reject
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ─── PENDING EARNINGS TAB ─── */}
        {tab === "earnings" && (
          <div className="space-y-3">
            {overview.pendingEarnings.length === 0 ? (
              <div className="rounded-xl border border-white/8 bg-white/[0.02] p-10 text-center text-sm text-white/40">
                No pending earnings. Commissions appear here as referrals qualify.
              </div>
            ) : (
              overview.pendingEarnings.map((e: any) => (
                <div key={e._id} className="rounded-xl border border-white/8 bg-white/[0.02] p-4 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white">{e.creatorName}</span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        e.type === "verified_user" ? "bg-emerald-500/15 text-emerald-300"
                        : e.type === "seller_bonus" ? "bg-violet-500/15 text-violet-300"
                        : e.type === "freelancer_bonus" ? "bg-fuchsia-500/15 text-fuchsia-300"
                        : e.type === "employer_bonus" ? "bg-sky-500/15 text-sky-300"
                        : e.type === "first_transaction" ? "bg-amber-500/15 text-amber-300"
                        : "bg-cyan-500/15 text-cyan-300"
                      }`}>
                        {e.type.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-white/35">{fmtDate(e.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-sm text-white/55">{e.reason}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white tabular-nums">{fmtKES(e.amount)}</span>
                    <button
                      onClick={() => {
                        const v = window.prompt(`Adjust amount for ${e.creatorName} (KES):`, String(e.amount));
                        if (v === null) return;
                        const n = Number(v);
                        if (!isFinite(n) || n < 0) { toast.error("Enter a valid amount."); return; }
                        if (n !== e.amount) {
                          const note = window.prompt("Reason for the adjustment (required):") || "";
                          if (!note.trim()) { toast.error("A reason is required to adjust a commission."); return; }
                          act(`adj-${e._id}`, () => adjustEarning({ earningId: e._id, newAmount: n, note }), "Commission adjusted");
                        }
                      }}
                      className="rounded-lg border border-white/12 px-2.5 py-2 text-xs text-white/60 hover:bg-white/5"
                      title="Adjust amount"
                    >
                      <Save className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => act(`ea-${e._id}`, () => reviewEarning({ earningId: e._id, decision: "approve" }), "Commission approved — ready for payout")}
                      disabled={busy === `ea-${e._id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 border border-emerald-400/30 px-3 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => {
                        const reason = window.prompt("Reason for rejecting this commission (required):") || "";
                        if (!reason.trim()) { toast.error("A reason is required."); return; }
                        act(`er-${e._id}`, () => reviewEarning({ earningId: e._id, decision: "reject", reason }), "Commission rejected");
                      }}
                      disabled={busy === `er-${e._id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/10 border border-red-400/25 px-3 py-2 text-xs font-medium text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ─── SETTINGS TAB ─── */}
        {tab === "settings" && (
          <div className="max-w-2xl">
            {!sForm ? (
              <button
                onClick={openSettings}
                className="rounded-xl border border-white/12 px-4 py-3 text-sm text-white/70 hover:bg-white/5"
              >
                <Settings2 className="inline w-4 h-4 mr-2" /> Load commission rules to edit
              </button>
            ) : (
              <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5 md:p-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-white">Commission rules</h3>
                  <p className="mt-1 text-xs text-white/40">
                    Applied to new earnings immediately. Existing records keep their original amount unless
                    you adjust them individually.
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {([
                    ["fixedPerVerifiedUser", "Per verified user (KES)", "Paid when a referral completes registration & verification"],
                    ["sellerActivationBonus", "Seller activation bonus (KES)", "Paid ONLY when a referred seller is FULLY verified: a genuine listing live (plus KYC if they sell products — freelance sellers don't need KYC)"],
                    ["freelancerActivationBonus", "Freelancer activation bonus (KES)", "Paid when a referral activates as a freelancer"],
                    ["employerActivationBonus", "Employer activation bonus (KES)", "Paid ONLY when a referred employer is FULLY verified: complete profile + 5 distinct legitimate jobs"],
                    ["firstTransactionBonus", "First transaction bonus (KES)", "Paid on a referral's first completed escrow"],
                    ["revenueSharePercent", "Revenue share (%)", "Share of every completed transaction — 0 to disable"],
                    ["revenueShareCap", "Revenue share cap per transaction (KES)", "Maximum share earned from a single transaction"],
                    ["maxReferralsPerHour", "Fraud cap: registrations per hour", "More than this from one creator in an hour gets flagged"],
                  ] as const).map(([key, label, help]) => (
                    <div key={key} className={key === "maxReferralsPerHour" ? "sm:col-span-2" : ""}>
                      <label className="block text-sm font-medium text-white/80 mb-1">{label}</label>
                      <input
                        type="number"
                        min={0}
                        step={key === "revenueSharePercent" ? "0.5" : "1"}
                        value={sForm[key]}
                        onChange={(e) => setSForm({ ...sForm, [key]: e.target.value })}
                        className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400/60"
                      />
                      <p className="mt-1 text-[11px] text-white/35">{help}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={saveSettings}
                    disabled={savingSettings}
                    className="inline-flex items-center gap-2 rounded-lg bg-violet-500 hover:bg-violet-400 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Save rules
                  </button>
                  <button onClick={() => setShowSettings(false)} className="text-sm text-white/45 hover:text-white/80">
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── FULL SIGNED AGREEMENT VIEWER — the exact document the creator filled ─── */}
      {openAgreement && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4 md:p-10" onClick={() => setOpenAgreement(null)}>
          <div
            className="max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Document body — rendered like the original agreement (white paper) */}
            <div className="bg-white text-[#0A0A12] p-6 md:p-10">
              <div className="flex items-center gap-3 border-b-2 border-[#0A0A12] pb-3">
                <div className="w-9 h-9 rounded bg-[#0A0A12] text-white flex items-center justify-center font-black">N</div>
                <p className="font-bold tracking-wide">NEXORA MARKET</p>
                <span className="text-xs text-black/40">| Creator Referral Program</span>
              </div>
              <h2 className="text-center text-xl md:text-2xl font-black mt-5 leading-tight">
                NEXORA CREATOR REFERRAL<br />
                <span className="text-violet-600">DECLARATION &amp; AGREEMENT</span>
              </h2>
              <p className="text-center text-[11px] text-black/40 mt-2">
                Signed copy — submitted {new Date(openAgreement.createdAt).toLocaleString()}
              </p>

              <p className="mt-6 text-sm">
                I, <span className="font-semibold border-b border-black/40 px-2">{openAgreement.fullName}</span>, hereby
                confirm that I wish to participate as a Nexora Creator / Referral Partner and to promote Nexora
                Marketplace and its services. By signing this agreement, I confirm that the information I provide is
                accurate, and that I understand and agree to the following terms.
              </p>

              {/* 1 — the commission schedule as the creator filled it */}
              <h3 className="text-sm font-bold mt-6"><span className="text-violet-600 mr-2">1.</span>Creator Referral Earnings</h3>
              <div className="mt-2 overflow-hidden rounded-lg border border-black/15">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#0A0A12] text-white">
                      <th className="text-left px-3 py-2 font-semibold">Referral / Milestone</th>
                      <th className="text-left px-3 py-2 font-semibold w-40">Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      let schedule: Record<string, string> = {};
                      try { schedule = openAgreement.commissionScheduleJson ? JSON.parse(openAgreement.commissionScheduleJson) : {}; } catch {}
                      const rows = [
                        "Verified user signup", "Seller activation (fully active)", "Freelancer activation",
                        "Employer activation (fully active)", "First completed transaction",
                        "Transaction revenue share", "Maximum revenue share per transaction",
                      ];
                      return rows.map((r, i) => (
                        <tr key={r} className={i % 2 ? "bg-black/[0.03]" : ""}>
                          <td className="px-3 py-2">{r}</td>
                          <td className="px-3 py-2 font-medium">{schedule[r] || "—"}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>

              <h3 className="text-sm font-bold mt-6"><span className="text-violet-600 mr-2">2.</span>Genuine Referrals</h3>
              <p className="mt-2 text-xs text-black/60 leading-relaxed">I agree that I will only refer genuine users. I will not create fake accounts, duplicate accounts, use bots, automated registrations, or otherwise manipulate the referral system. Nexora may review, reject, or reverse commissions associated with fraudulent, duplicate, misleading, or invalid referrals.</p>

              <h3 className="text-sm font-bold mt-6"><span className="text-violet-600 mr-2">3.</span>Creator Responsibilities</h3>
              <ul className="mt-2 list-disc pl-5 text-xs text-black/60 space-y-1">
                <li>Promote Nexora honestly and professionally.</li>
                <li>Provide accurate information when registering as a creator.</li>
                <li>Use only my assigned referral link / code.</li>
                <li>Avoid misleading customers or making false promises.</li>
                <li>Respect Nexora's brand, users, and platform rules.</li>
                <li>Notify Nexora if I identify suspicious referral activity.</li>
              </ul>

              <h3 className="text-sm font-bold mt-6"><span className="text-violet-600 mr-2">4.</span>Verification &amp; Payment</h3>
              <p className="mt-2 text-xs text-black/60 leading-relaxed">I understand that commissions may only become payable after the required verification or activation conditions have been completed. I agree to provide the necessary information for creator verification and payment processing.</p>
              <p className="mt-1 text-xs font-bold">I understand that Nexora will never require me to provide passwords, OTP codes, PINs, or other private account credentials.</p>

              <h3 className="text-sm font-bold mt-6"><span className="text-violet-600 mr-2">5.</span>Commission Review</h3>
              <p className="mt-2 text-xs text-black/60 leading-relaxed">Nexora reserves the right to review referral activity before releasing commissions. Invalid, fraudulent, duplicated, or manipulated referrals may be excluded from commission calculations. Commission rules may be updated for future referrals, while already-approved earnings will be handled according to the applicable terms at the time they were approved.</p>

              <h3 className="text-sm font-bold mt-6"><span className="text-violet-600 mr-2">6.</span>Declaration</h3>
              <blockquote className="mt-2 border-l-4 border-violet-500 pl-3 italic text-xs text-black/60">
                "I have read, understood, and voluntarily agree to the Nexora Creator Referral Terms. I confirm that the information I have provided is accurate, and I agree to promote Nexora honestly and follow the referral rules."
              </blockquote>

              {/* Creator declaration — the filled form */}
              <div className="mt-6 rounded-xl border border-black/15 bg-black/[0.02] p-5 text-sm space-y-2">
                <p className="text-violet-700 font-bold">Creator Declaration — as filled &amp; signed</p>
                <p><span className="font-semibold">Creator Full Name:</span> {openAgreement.fullName}</p>
                <p><span className="font-semibold">Phone Number:</span> {openAgreement.phone}</p>
                <p><span className="font-semibold">Email:</span> {openAgreement.email}</p>
                <p><span className="font-semibold">Creator / Referral Code:</span> {openAgreement.creatorCode || "—"}</p>
                <p><span className="font-semibold">Agreed to terms:</span> {openAgreement.agreedTerms ? "☑ Yes — checkbox ticked at signing" : "No"}</p>
                <p><span className="font-semibold">Signature:</span> <span className="italic border-b-2 border-black/60 px-3">{openAgreement.signature}</span></p>
                <p><span className="font-semibold">Date:</span> {new Date(openAgreement.createdAt).toLocaleDateString()}</p>
              </div>

              <p className="text-center text-[10px] text-black/40 mt-6">
                Nexora Creator Referral Declaration &amp; Agreement • digitally signed copy for admin review
              </p>
            </div>

            {/* Footer actions */}
            <div className="bg-[#0A0A12] border-t border-white/10 p-4 flex flex-wrap items-center justify-between gap-3">
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${
                openAgreement.status === "pending" ? "bg-amber-400/10 text-amber-300" :
                openAgreement.status === "approved" ? "bg-emerald-400/10 text-emerald-300" :
                "bg-red-400/10 text-red-300"}`}>
                Status: {openAgreement.status}
              </span>
              <div className="flex items-center gap-2">
                {openAgreement.status === "pending" && (
                  <>
                    <button
                      onClick={async () => {
                        setBusy(`agree-${openAgreement._id}`);
                        try { await reviewAgreement({ id: openAgreement._id, approve: true }); toast.success("Agreement approved"); setOpenAgreement(null); }
                        catch (e: any) { toast.error(e?.message || "Failed"); }
                        finally { setBusy(null); }
                      }}
                      disabled={busy === `agree-${openAgreement._id}`}
                      className="px-4 py-2 rounded-lg bg-emerald-500 text-black text-xs font-semibold hover:bg-emerald-400 disabled:opacity-50"
                    >Approve agreement</button>
                    <button
                      onClick={async () => {
                        setBusy(`agree-${openAgreement._id}`);
                        try { await reviewAgreement({ id: openAgreement._id, approve: false, note: "Rejected after document review" }); toast.success("Agreement rejected"); setOpenAgreement(null); }
                        catch (e: any) { toast.error(e?.message || "Failed"); }
                        finally { setBusy(null); }
                      }}
                      disabled={busy === `agree-${openAgreement._id}`}
                      className="px-4 py-2 rounded-lg bg-white/[0.04] border border-red-400/25 text-red-300 text-xs font-medium hover:bg-red-400/10 disabled:opacity-50"
                    >Reject</button>
                  </>
                )}
                <button onClick={() => setOpenAgreement(null)} className="px-4 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-white/60 text-xs hover:text-white transition-colors">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

/** Exported page wrapped in the fail-soft boundary. */
export default function AdminReferrals() {
  return (
    <ReferralErrorBoundary>
      <AdminReferralsInner />
    </ReferralErrorBoundary>
  );
}
