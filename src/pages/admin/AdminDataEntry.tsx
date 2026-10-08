import AdminLayout from "./AdminLayout";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Loader2, Users, UserPlus, Briefcase, Package, Scale,
  Coins, Database, Search, Crosshair, ArrowRight, Store,
} from "lucide-react";

type Tab = "staff" | "invites" | "jobs" | "products" | "disputes" | "payments" | "audit" | "trace";

const TABS: Array<{ key: Tab; label: string; icon: any }> = [
  { key: "trace", label: "Seller Trace", icon: Crosshair },
  { key: "staff", label: "Staff", icon: Users },
  { key: "invites", label: "Invitations", icon: UserPlus },
  { key: "jobs", label: "Jobs", icon: Briefcase },
  { key: "products", label: "Products", icon: Package },
  { key: "disputes", label: "Disputes", icon: Scale },
  { key: "payments", label: "Payments", icon: Coins },
  { key: "audit", label: "Audit Log", icon: Database },
];

function Empty({ text }: { text: string }) {
  return (
    <div className="text-center py-12 rounded-2xl border border-dashed border-white/10">
      <p className="text-xs text-white/35">{text}</p>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex justify-center py-12">
      <Loader2 className="w-5 h-5 text-nx-violet animate-spin" />
    </div>
  );
}

const badge = (status?: string) => {
  const s = (status || "").toLowerCase();
  const cls =
    s.includes("active") || s.includes("open") || s.includes("approved") || s.includes("paid") || s.includes("resolved")
      ? "bg-emerald-400/10 text-emerald-400"
      : s.includes("pending") || s.includes("review") || s.includes("draft") || s.includes("invited")
      ? "bg-amber-400/10 text-amber-400"
      : s.includes("cancel") || s.includes("reject") || s.includes("revoked") || s.includes("open")
      ? "bg-red-400/10 text-red-400"
      : "bg-white/10 text-white/50";
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cls}`}>{status || "—"}</span>;
};

export default function AdminDataEntry() {
  const [tab, setTab] = useState<Tab>("trace");
  const [search, setSearch] = useState("");

  // Seller trace (product-market channel audit)
  const [traceForm, setTraceForm] = useState({ email: "", phone: "", storeName: "" });
  const [traceArgs, setTraceArgs] = useState<
    { email?: string; phone?: string; storeName?: string } | null
  >(null);
  const [moving, setMoving] = useState<string | null>(null);
  const [traceError, setTraceError] = useState<string | null>(null);

  const staff = useQuery(api.dataEntry.adminGetAllStaffRelationships, tab === "staff" ? undefined : "skip");
  const invites = useQuery(api.dataEntry.adminGetAllInvitations, tab === "invites" ? undefined : "skip");
  const jobs = useQuery(api.dataEntry.adminGetAllJobs, tab === "jobs" ? undefined : "skip");
  const products = useQuery(api.dataEntry.adminGetAllWorkerProducts, tab === "products" ? undefined : "skip");
  const disputes = useQuery(api.dataEntry.adminGetAllDataEntryDisputes, tab === "disputes" ? undefined : "skip");
  const payments = useQuery(api.dataEntry.adminGetAllDataEntryPayments, tab === "payments" ? undefined : "skip");
  const audit = useQuery(api.dataEntry.adminAuditLogs, tab === "audit" ? undefined : "skip");
  const trace = useQuery(
    api.dataEntry.adminTraceSellerProducts,
    tab === "trace" && traceArgs ? traceArgs : "skip",
  );
  const setMarketplace = useMutation(api.dataEntry.adminSetListingMarketplace);

  const matches = (haystack: string | undefined) =>
    !search || (haystack || "").toLowerCase().includes(search.toLowerCase());

  const card = "rounded-xl border border-white/5 bg-white/[0.02] p-4";

  return (
    <AdminLayout>
      <div className="mb-5">
        <h2 className="text-lg font-bold text-white">Data Entry Management</h2>
        <p className="text-xs text-white/30 mt-0.5">
          Seller↔worker staff relationships, entry jobs, worker product submissions, disputes and payments.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 p-1 rounded-xl border border-white/5 bg-white/[0.03] w-full sm:w-fit overflow-x-auto mb-5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setSearch(""); }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              tab === t.key ? "bg-nx-violet text-white" : "text-white/50 hover:text-white"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="relative max-w-sm mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by name, email, title…"
          className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-nx-violet/30"
        />
      </div>

      {/* ── SELLER TRACE ── */}
      {tab === "trace" && (
        <div>
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 mb-5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
              <Crosshair className="w-4 h-4 text-nx-violet" /> Trace a seller's products
            </h3>
            <p className="text-[11px] text-white/35 mb-4">
              Look up a store by email, phone or name to see every listing it owns and which market each product is
              channelled to — then move strays into the product market.
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              <input
                type="email"
                value={traceForm.email}
                onChange={(e) => setTraceForm({ ...traceForm, email: e.target.value })}
                placeholder="Seller email"
                className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-nx-violet/40"
              />
              <input
                type="tel"
                value={traceForm.phone}
                onChange={(e) => setTraceForm({ ...traceForm, phone: e.target.value })}
                placeholder="Phone number"
                className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-nx-violet/40"
              />
              <input
                type="text"
                value={traceForm.storeName}
                onChange={(e) => setTraceForm({ ...traceForm, storeName: e.target.value })}
                placeholder="Store name, e.g. Scarface Safety"
                className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-nx-violet/40"
              />
            </div>
            <button
              onClick={() => {
                setTraceError(null);
                if (!traceForm.email.trim() && !traceForm.phone.trim() && !traceForm.storeName.trim()) {
                  setTraceError("Enter at least an email, phone or store name.");
                  return;
                }
                setTraceArgs({
                  email: traceForm.email.trim() || undefined,
                  phone: traceForm.phone.trim() || undefined,
                  storeName: traceForm.storeName.trim() || undefined,
                });
              }}
              className="mt-3 flex items-center gap-2 px-5 py-2.5 rounded-lg bg-nx-violet hover:bg-nx-violet/80 text-white text-sm font-semibold transition-colors"
            >
              <Search className="w-4 h-4" /> Trace products
            </button>
            {traceError && <p className="mt-2 text-xs text-red-300">{traceError}</p>}
          </div>

          {traceArgs && (
            trace === undefined ? <Loading /> : (
              <div className="space-y-5">
                {/* Accounts */}
                <section>
                  <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wide mb-2">
                    Matching accounts ({trace.accounts.length})
                  </h4>
                  {trace.accounts.length === 0 ? (
                    <p className="text-xs text-white/35 px-3 py-3 rounded-lg bg-white/[0.02] border border-white/5">
                      No account matched — check the spelling or try the phone number.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {trace.accounts.map((a: any) => (
                        <div key={a._id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                          <div className="min-w-0">
                            <p className="text-sm text-white truncate">
                              {a.businessName || a.name || "Unnamed"}
                            </p>
                            <p className="text-[11px] text-white/30 truncate">
                              {a.email || "no email"} · {a.phone || "no phone"}
                              {a.county ? ` · ${a.county}${a.town ? `, ${a.town}` : ""}` : ""}
                            </p>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-nx-violet/15 text-nx-violet shrink-0">
                            {a.role || "no role"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Listings */}
                <section>
                  <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wide mb-2">
                    Products ({trace.listings.length})
                  </h4>
                  {trace.listings.length === 0 ? (
                    <p className="text-xs text-white/35 px-3 py-3 rounded-lg bg-white/[0.02] border border-white/5">
                      This seller has no listings yet in any market.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {trace.listings.map((l: any) => {
                        const inProduct = l.marketplace === "product";
                        return (
                          <div key={l._id} className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${inProduct ? "bg-emerald-400/10 text-emerald-400" : "bg-fuchsia-400/10 text-fuchsia-300"}`}>
                              <Store className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-white truncate">{l.title}</p>
                              <p className="text-[11px] text-white/30 truncate">
                                {l.category} · {l.status} · KSh {(l.price ?? 0).toLocaleString()} · {l.sellerName || "—"}
                              </p>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${inProduct ? "bg-emerald-400/10 text-emerald-400" : "bg-fuchsia-400/10 text-fuchsia-300"}`}>
                              {inProduct ? "Product market" : "Digital / freelance"}
                            </span>
                            <button
                              onClick={async () => {
                                setMoving(l._id);
                                setTraceError(null);
                                try {
                                  await setMarketplace({
                                    listingId: l._id,
                                    marketplace: inProduct ? "freelance" : "product",
                                  });
                                } catch (err: any) {
                                  setTraceError(err?.message || "Could not move the listing.");
                                } finally {
                                  setMoving(null);
                                }
                              }}
                              disabled={moving === l._id}
                              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-nx-violet/15 border border-nx-violet/30 text-nx-violet text-xs font-medium hover:bg-nx-violet/25 transition-colors disabled:opacity-50"
                              title={inProduct ? "Move to the digital/freelance market" : "Move to the product market"}
                            >
                              {moving === l._id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <ArrowRight className="w-3.5 h-3.5" />
                              )}
                              {inProduct ? "To digital" : "To product market"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>
            )
          )}
        </div>
      )}

      {/* ── STAFF ── */}
      {tab === "staff" && (
        staff === undefined ? <Loading /> : (staff ?? []).filter((r: any) => matches(`${r.sellerName} ${r.sellerEmail} ${r.workerName} ${r.workerEmail} ${r.workerPhone}`)).length === 0 ? (
          <Empty text="No staff relationships recorded." />
        ) : (
          <div className="space-y-2">
            {(staff ?? []).filter((r: any) => matches(`${r.sellerName} ${r.sellerEmail} ${r.workerName} ${r.workerEmail} ${r.workerPhone}`)).map((r: any) => (
              <div key={r._id} className={card}>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-sm text-white">
                      <span className="text-nx-cyan">{r.workerName}</span>
                      <span className="text-white/30"> → </span>
                      <span className="text-nx-violet">{r.sellerName}</span>
                    </p>
                    <p className="text-[11px] text-white/30 truncate">
                      {r.workerEmail || r.workerPhone || "no contact"} · seller: {r.sellerEmail || "—"}
                      {r.workerEmail ? ` · worker: ${r.workerEmail}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-white/30">{(r.permissions ?? []).length} perms</span>
                    {badge(r.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── INVITATIONS ── */}
      {tab === "invites" && (
        invites === undefined ? <Loading /> : (invites ?? []).filter((r: any) => matches(`${r.sellerName} ${r.sellerEmail} ${r.inviteeName} ${r.inviteeEmail} ${r.inviteePhone}`)).length === 0 ? (
          <Empty text="No invitations recorded." />
        ) : (
          <div className="space-y-2">
            {(invites ?? []).filter((r: any) => matches(`${r.sellerName} ${r.sellerEmail} ${r.inviteeName} ${r.inviteeEmail} ${r.inviteePhone}`)).map((r: any) => (
              <div key={r._id} className={card}>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-sm text-white">{r.inviteeName || r.inviteeEmail || r.inviteePhone || "—"}</p>
                    <p className="text-[11px] text-white/30 truncate">
                      from {r.sellerName} · {r.inviteeEmail || r.inviteePhone || "no contact"}
                      {r.expiresAt ? ` · expires ${new Date(r.expiresAt).toLocaleDateString()}` : ""}
                    </p>
                  </div>
                  {badge(r.status)}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── JOBS ── */}
      {tab === "jobs" && (
        jobs === undefined ? <Loading /> : (jobs ?? []).filter((r: any) => matches(`${r.title} ${r.sellerName} ${r.sellerEmail} ${r.workerName}`)).length === 0 ? (
          <Empty text="No data entry jobs posted." />
        ) : (
          <div className="space-y-2">
            {(jobs ?? []).filter((r: any) => matches(`${r.title} ${r.sellerName} ${r.sellerEmail} ${r.workerName}`)).map((r: any) => (
              <div key={r._id} className={card}>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-sm text-white">{r.title}</p>
                    <p className="text-[11px] text-white/30 truncate">
                      {r.sellerName} · {r.productCount} products · KSh {(r.pricePerProduct ?? 0).toLocaleString()} each
                      {r.workerName ? ` · worker: ${r.workerName}` : " · unassigned"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {r.totalBudget && <span className="text-[11px] text-white/40">KSh {r.totalBudget.toLocaleString()}</span>}
                    {badge(r.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── PRODUCTS ── */}
      {tab === "products" && (
        products === undefined ? <Loading /> : (products ?? []).filter((r: any) => matches(`${r.listing?.title} ${r.sellerName} ${r.workerName}`)).length === 0 ? (
          <Empty text="No worker-entered products yet." />
        ) : (
          <div className="space-y-2">
            {(products ?? []).filter((r: any) => matches(`${r.listing?.title} ${r.sellerName} ${r.workerName}`)).map((r: any) => (
              <div key={r._id} className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                <div className="w-10 h-10 rounded-lg bg-white/[0.04] overflow-hidden flex items-center justify-center shrink-0">
                  {r.listing?.images?.[0] ? (
                    <img src={r.listing.images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-4 h-4 text-white/15" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white truncate">{r.listing?.title || "Untitled"}</p>
                  <p className="text-[11px] text-white/30 truncate">
                    {r.workerName} → {r.sellerName}
                    {r.listing?.price != null ? ` · KSh ${r.listing.price.toLocaleString()}` : ""}
                  </p>
                </div>
                {badge(r.status)}
              </div>
            ))}
          </div>
        )
      )}

      {/* ── DISPUTES ── */}
      {tab === "disputes" && (
        disputes === undefined ? <Loading /> : (disputes ?? []).filter((r: any) => matches(`${r.title} ${r.sellerName} ${r.workerName} ${r.jobTitle}`)).length === 0 ? (
          <Empty text="No data entry disputes." />
        ) : (
          <div className="space-y-2">
            {(disputes ?? []).filter((r: any) => matches(`${r.title} ${r.sellerName} ${r.workerName} ${r.jobTitle}`)).map((r: any) => (
              <div key={r._id} className={card}>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-sm text-white">{r.title}</p>
                    <p className="text-[11px] text-white/30 truncate">
                      {r.sellerName} vs {r.workerName}{r.jobTitle ? ` · job: ${r.jobTitle}` : ""}
                    </p>
                    {r.description && <p className="text-[11px] text-white/40 mt-1 line-clamp-2">{r.description}</p>}
                    {r.resolution && <p className="text-[11px] text-emerald-300/80 mt-1">Resolution: {r.resolution}</p>}
                  </div>
                  {badge(r.status)}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── PAYMENTS ── */}
      {tab === "payments" && (
        payments === undefined ? <Loading /> : (payments ?? []).filter((r: any) => matches(`${r.sellerName} ${r.workerName} ${r.jobTitle}`)).length === 0 ? (
          <Empty text="No data entry payments." />
        ) : (
          <div className="space-y-2">
            {(payments ?? []).filter((r: any) => matches(`${r.sellerName} ${r.workerName} ${r.jobTitle}`)).map((r: any) => (
              <div key={r._id} className={card}>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-sm text-white">KSh {(r.amount ?? 0).toLocaleString()} — {r.workerName}</p>
                    <p className="text-[11px] text-white/30 truncate">
                      from {r.sellerName}{r.jobTitle ? ` · job: ${r.jobTitle}` : ""}
                      {r.createdAt ? ` · ${new Date(r.createdAt).toLocaleDateString()}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-white/40">{r.currency || "KES"}</span>
                    {badge(r.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── AUDIT ── */}
      {tab === "audit" && (
        audit === undefined ? <Loading /> : (audit ?? []).filter((a: any) => matches(`${a.action} ${a.adminName} ${a.details}`)).length === 0 ? (
          <Empty text="No data entry audit events yet." />
        ) : (
          <div className="space-y-1.5">
            {(audit ?? []).filter((a: any) => matches(`${a.action} ${a.adminName} ${a.details}`)).map((a: any) => (
              <div key={a._id} className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="text-[10px] font-mono text-nx-violet shrink-0 mt-0.5">{a.action}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-white/50 truncate">{a.details || "—"}</p>
                  <p className="text-[10px] text-white/25">
                    {a.adminName || "—"} ({a.adminRole || "—"})
                    {a.createdAt ? ` · ${new Date(a.createdAt).toLocaleString()}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </AdminLayout>
  );
}
