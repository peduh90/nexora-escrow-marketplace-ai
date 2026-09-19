import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import AdminLayout from "./AdminLayout";
import {
  Users, Search, CheckCircle2, Ban, RotateCcw, Loader2, ShieldAlert, MapPin,
} from "lucide-react";

const OWNER_EMAIL = "murimiedwin227@gmail.com";

/**
 * ─── SINGLE SOURCE OF TRUTH ─────────────────────────────────────────────────
 * Every statistic on this page is computed from the SAME array of user rows
 * that the All Users table renders — api.admin.getAllUsers. No separate
 * counts endpoint, no hardcoded numbers, no phantom fields.
 *
 * Definitions (mutually exclusive vs overlapping, kept strictly apart):
 *   • PRIMARY ROLE  — users.role, exactly one per account. Roles are
 *     mutually exclusive: Total Users = sum of all role buckets + "No role
 *     yet" (pending accounts). Nothing is forced to add up beyond that.
 *   • ATTRIBUTES    — overlapping layers on top of any role: a seller can
 *     also publish digital/freelance services, a freelancer can do AI
 *     tasking (a FIELD under freelancing, not a role), service/transport
 *     provider profiles attach to any account.
 *   • PROGRAM/STATUS— Creator is a program (referralCreators), Suspended is
 *     an accountStatus — neither is a user type.
 * The filter tabs below the cards use the EXACT same predicate functions,
 * so a card's number always equals the rows shown when clicked.
 */

type UserRow = any;

/** Primary role resolution — mirrors what the Role column displays. */
function primaryRole(u: UserRow): string {
  if (u.role === "admin") return "admin";
  if (u.role) return u.role;
  // No role field yet — fall back to profile evidence only. Never assume
  // "buyer": an account without a role is exactly that, pending/role-less.
  if (u.businessName || u.pendingRole === "seller") return "seller";
  if (u.freelanceTitle) return "freelancer";
  if (u.pendingRole) return u.pendingRole;
  return "—";
}

/**
 * An account is "stuck" when it never completed registration: no role AND
 * no requested role. These are real people who stopped (or were stubbed by
 * the old admin-gate bug) mid-signup — they are counted honestly, never
 * forced into a role bucket.
 */
const isStuckRegistration = (u: UserRow) => !u.role && !u.pendingRole;

/** Attribute predicates — these OVERLAP by design (a seller can be a
 *  digital seller too; a freelancer can do AI tasking too). */
const isDigitalSeller = (u: UserRow) =>
  primaryRole(u) === "seller" && (u.freelanceListings ?? 0) > 0;
const doesAiTasking = (u: UserRow) =>
  (u.freelanceCategories ?? []).includes("ai-tasking") ||
  primaryRole(u) === "ai_tasker" ||
  (u.aiTasksPosted ?? 0) > 0 ||
  (u.aiTasksWorked ?? 0) > 0;
const isServiceProvider = (u: UserRow) => !!u.serviceType;
const isTransportProvider = (u: UserRow) => !!u.transportType;
const isCreatorProgram = (u: UserRow) => !!u.creatorStatus;
const isSuspended = (u: UserRow) => u.accountStatus === "suspended";

/** Filter tabs — each maps to the SAME predicate its stat card uses. */
type FilterKey =
  | "all" | "buyer" | "seller" | "freelancer" | "employer"
  | "service_provider" | "driver" | "digital_seller" | "ai_tasking"
  | "creator" | "suspended" | "admin" | "no_role" | "stuck";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "buyer", label: "Buyers" },
  { key: "seller", label: "Product Sellers" },
  { key: "digital_seller", label: "Digital Sellers" },
  { key: "freelancer", label: "Freelancers" },
  { key: "employer", label: "Employers" },
  { key: "service_provider", label: "Service Providers" },
  { key: "driver", label: "Transport Providers" },
  { key: "ai_tasking", label: "AI Tasking" },
  { key: "creator", label: "Creators" },
  { key: "suspended", label: "Suspended" },
  { key: "admin", label: "Admins" },
  { key: "no_role", label: "No role yet" },
  { key: "stuck", label: "Not completed" },
];

function matchesFilter(u: UserRow, f: FilterKey): boolean {
  const role = primaryRole(u);
  switch (f) {
    case "all": return true;
    case "buyer": return role === "buyer";
    case "seller": return role === "seller";
    case "digital_seller": return isDigitalSeller(u);
    case "freelancer": return role === "freelancer" || role === "ai_tasker";
    case "employer": return role === "employer";
    case "service_provider": return isServiceProvider(u);
    case "driver": return isTransportProvider(u) || role === "driver";
    case "ai_tasking": return doesAiTasking(u);
    case "creator": return isCreatorProgram(u);
    case "suspended": return isSuspended(u);
    case "admin": return role === "admin";
    case "no_role": return role === "—";
    case "stuck": return isStuckRegistration(u);
  }
}

const ROLE_COLORS: Record<string, string> = {
  seller: "bg-nx-violet/10 text-nx-violet",
  admin: "bg-nx-gold/10 text-nx-gold",
  freelancer: "bg-emerald-500/10 text-emerald-400",
  ai_tasker: "bg-indigo-500/10 text-indigo-300",
  employer: "bg-amber-500/10 text-amber-400",
  service_provider: "bg-nx-cyan/10 text-nx-cyan",
  driver: "bg-orange-500/10 text-orange-400",
  creator: "bg-fuchsia-500/10 text-fuchsia-300",
  buyer: "bg-white/5 text-white/50",
};

export default function AdminUsers() {
  const navigate = useNavigate();
  const allUsers = useQuery(api.admin.getAllUsers);
  const setUserSuspended = useMutation(api.admin.setUserSuspended);
  // ?q= deep-link support — the AdminLayout topbar search navigates here.
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [suspending, setSuspending] = useState<{ id: string; name: string } | null>(null);
  const [reason, setReason] = useState("");

  // Guest/anonymous accounts are already excluded server-side — these rows
  // ARE the database truth the stats and table both render from.
  const users: UserRow[] = allUsers ?? [];

  // ── Statistics: computed once from the same rows the table shows ──
  const stats = useMemo(() => {
    const byRole = (r: string) => users.filter((u) => primaryRole(u) === r).length;
    return {
      total: users.length,
      // Primary roles (mutually exclusive — one per account)
      buyers: byRole("buyer"),
      productSellers: byRole("seller"),
      freelancers: byRole("freelancer") + byRole("ai_tasker"), // ai_tasker ⊂ freelance
      employers: byRole("employer"),
      serviceProviders: users.filter(isServiceProvider).length,
      transportProviders: users.filter((u) => isTransportProvider(u) || primaryRole(u) === "driver").length,
      admins: byRole("admin"),
      noRole: byRole("—"),
      stuck: users.filter(isStuckRegistration).length,
      // Attributes (overlap roles — NOT added into the role total)
      digitalSellers: users.filter(isDigitalSeller).length,
      aiTasking: users.filter(doesAiTasking).length,
      // Program / status (neither is a user type)
      creators: users.filter(isCreatorProgram).length,
      suspended: users.filter(isSuspended).length,
    };
  }, [users]);

  const filtered = users.filter((u: UserRow) => {
    if (!matchesFilter(u, filter)) return false;
    if (search) {
      const q = search.toLowerCase();
      const hay = `${(u.name || "").toLowerCase()} ${(u.email || "").toLowerCase()}`;
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const handleSuspend = async () => {
    if (!suspending) return;
    setBusyId(suspending.id);
    try {
      await setUserSuspended({ userId: suspending.id, suspended: true, reason: reason.trim() || undefined });
      toast.success(`${suspending.name} has been suspended`);
    } catch (err: any) {
      toast.error(err?.message || "Could not suspend user");
    } finally {
      setBusyId(null);
      setSuspending(null);
      setReason("");
    }
  };

  const handleReinstate = async (u: any) => {
    setBusyId(u._id);
    try {
      await setUserSuspended({ userId: u._id, suspended: false });
      toast.success(`${u.name || u.email} has been reinstated`);
    } catch (err: any) {
      toast.error(err?.message || "Could not reinstate user");
    } finally {
      setBusyId(null);
    }
  };

  const roleCards: { label: string; value: number; color: string; key: FilterKey }[] = [
    { label: "Total Users", value: stats.total, color: "#8B5CF6", key: "all" },
    { label: "Buyers", value: stats.buyers, color: "#06B6D4", key: "buyer" },
    { label: "Product Sellers", value: stats.productSellers, color: "#10B981", key: "seller" },
    { label: "Freelancers", value: stats.freelancers, color: "#34D399", key: "freelancer" },
    { label: "Employers", value: stats.employers, color: "#F59E0B", key: "employer" },
    { label: "Service Providers", value: stats.serviceProviders, color: "#22D3EE", key: "service_provider" },
    { label: "Transport Providers", value: stats.transportProviders, color: "#38BDF8", key: "driver" },
    { label: "Admins", value: stats.admins, color: "#FBBF24", key: "admin" },
    { label: "Not completed", value: stats.stuck, color: "#94A3B8", key: "stuck" },
  ];
  const attrCards: { label: string; value: number; color: string; key: FilterKey }[] = [
    { label: "Digital Sellers", value: stats.digitalSellers, color: "#A78BFA", key: "digital_seller" },
    { label: "AI Tasking", value: stats.aiTasking, color: "#818CF8", key: "ai_tasking" },
    { label: "Creators (program)", value: stats.creators, color: "#E879F9", key: "creator" },
    { label: "Suspended (status)", value: stats.suspended, color: "#EF4444", key: "suspended" },
  ];

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <p className="text-sm text-white/40 mt-1">
          Manage all platform users — {stats.total} total · counted live from the users database
        </p>
      </div>

      {/* ── Primary roles: mutually exclusive, one per account ── */}
      <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2">Primary roles — one per account</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-5">
        {roleCards.map((s) => (
          <button
            key={s.label}
            onClick={() => setFilter(s.key)}
            title={`Show ${s.label} in the table below`}
            className={`p-4 rounded-xl border text-left transition-all ${filter === s.key ? "border-nx-violet/40 bg-nx-violet/[0.06]" : "border-white/5 bg-[#0A0A12] hover:border-white/15"}`}
          >
            <p className="text-[10px] text-white/30 uppercase leading-tight">{s.label}</p>
            <p className="text-xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
          </button>
        ))}
      </div>

      {/* ── Attributes & statuses: overlapping layers, not user types ── */}
      <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2">
        Attributes &amp; status — overlap with roles (not added into totals)
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {attrCards.map((s) => (
          <button
            key={s.label}
            onClick={() => setFilter(s.key)}
            title={`Show ${s.label} in the table below`}
            className={`p-4 rounded-xl border text-left transition-all ${filter === s.key ? "border-nx-violet/40 bg-nx-violet/[0.06]" : "border-white/5 bg-[#0A0A12] hover:border-white/15"}`}
          >
            <p className="text-[10px] text-white/30 uppercase leading-tight">{s.label}</p>
            <p className="text-xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input value={search} onChange={e => { setSearch(e.target.value); setSearchParams(e.target.value ? { q: e.target.value } : {}); }} placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#0A0A12] border border-white/5 text-sm text-white placeholder-white/20 focus:border-nx-violet/30 focus:outline-none" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)} className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${filter === f.key ? "bg-nx-violet/10 text-nx-violet" : "text-white/30 hover:text-white/50 bg-[#0A0A12] border border-white/5"}`}>{f.label}</button>
          ))}
        </div>
      </div>

      {users.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-[#0A0A12] py-16 flex flex-col items-center">
          <Users className="w-8 h-8 text-white/10 mb-3" />
          <p className="text-sm text-white/30">No users yet</p>
          <p className="text-[11px] text-white/15 mt-1">Users will appear here once they register</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/5 bg-[#0A0A12] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">User</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase hidden md:table-cell">Role</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase hidden lg:table-cell">Phone</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase hidden lg:table-cell">Location</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase hidden lg:table-cell">Freelance</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase hidden xl:table-cell">Service</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">KYC</th>
                  <th className="text-right px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {filtered.map((user: any) => {
                  const suspended = user.accountStatus === "suspended";
                  const isOwnerAccount = user.email === OWNER_EMAIL || primaryRole(user) === "admin";
                  return (
                  <tr key={user._id} className={`hover:bg-white/[0.01] transition-colors ${suspended ? "opacity-60" : ""}`}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-nx-violet/15 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-nx-violet">{(user.name || user.email?.split("@")[0] || "U").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm text-white/70 font-medium">{user.name || user.email?.split("@")[0] || "Unknown"}</p>
                            {user.kycStatus === "verified" && <CheckCircle2 className="w-3 h-3 text-nx-emerald" />}
                            {suspended && <Ban className="w-3 h-3 text-red-400" />}
                          </div>
                          <p className="text-[10px] text-white/25">{user.email || ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      {(() => {
                        const status = (user as any).accountStatus || ((user as any).role ? "active" : "pending");
                        const requested = (user as any).pendingRole;
                        if (suspended) {
                          return (
                            <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-red-400/10 text-red-400" title={user.suspensionReason || "Suspended"}>
                              ⛔ suspended
                            </span>
                          );
                        }
                        if (status === "pending") {
                          // Honest labeling: distinguish an account that ASKED
                          // for a role but never finished verification from one
                          // that never even picked a role (legacy stub rows).
                          if (requested) {
                            return (
                              <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-amber-400/10 text-amber-400" title={`Requested ${requested} — registration not finished (name/phone/verification incomplete)`}>
                                ⏳ wants {requested} · not verified
                              </span>
                            );
                          }
                          return (
                            <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-white/5 text-white/40" title="This account never completed registration — no role was ever chosen. The owner can sign in and pick an account type on the onboarding screen.">
                              ✳ registration not completed
                            </span>
                          );
                        }
                        const r = primaryRole(user);
                        return (<span className={`text-[10px] px-2 py-0.5 rounded font-medium ${ROLE_COLORS[r] ?? "bg-white/5 text-white/30"}`}>{r === "—" ? "no role" : r}</span>);
                      })()}
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      {user.phone ? (
                        <a
                          href={`tel:${user.phone}`}
                          className="text-[10px] text-white/60 hover:text-nx-cyan transition-colors tabular-nums"
                          title="Call the registered number"
                        >
                          {user.phone}
                        </a>
                      ) : (
                        <span className="text-[10px] text-white/20">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <p className="text-[10px] text-white/25">{[user.county, user.town].filter(Boolean).join(", ") || "—"}</p>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      {user.freelanceTitle ? (
                        <button
                          onClick={() => navigate("/admin/freelancers")}
                          title={`Freelance profile — ${user.freelanceTitle} · ${(user.freelanceSkills || []).slice(0, 3).join(", ")}${(user.freelanceCategories ?? []).length ? ` · fields: ${user.freelanceCategories.join(", ")}` : ""}`}
                          className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-medium bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20 transition-colors"
                        >
                          {user.freelanceTitle}{user.freelanceVerified ? " ✓" : ""}
                        </button>
                      ) : (user.freelanceCategories ?? []).includes("ai-tasking") ? (
                        <button
                          onClick={() => setFilter("ai_tasking")}
                          title="Registered AI tasker — AI tasking is a field under freelancing"
                          className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-medium bg-indigo-400/10 text-indigo-300 hover:bg-indigo-400/20 transition-colors"
                        >
                          AI tasking
                        </button>
                      ) : (
                        <span className="text-[10px] text-white/15">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 hidden xl:table-cell">
                      {user.aiTasksPosted > 0 || user.aiTasksWorked > 0 ? (
                        <button
                          onClick={() => setFilter("ai_tasking")}
                          title={`${user.aiTasksPosted || 0} posted · ${user.aiTasksWorked || 0} worked`}
                          className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-medium bg-indigo-400/10 text-indigo-300 hover:bg-indigo-400/20 transition-colors"
                        >
                          AI · {user.aiTasksPosted || 0}p/{user.aiTasksWorked || 0}w
                        </button>
                      ) : user.serviceType || user.transportType ? (
                        <button
                          onClick={() => navigate("/admin/services")}
                          title="Open Services & Transport management"
                          className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-medium bg-cyan-400/10 text-cyan-300 hover:bg-cyan-400/20 transition-colors"
                        >
                          <MapPin className="w-3 h-3" />
                          {user.serviceType ? `${user.serviceType}${user.serviceVerified ? " ✓" : " ·"}` : `${user.transportType}${user.transportVerified ? " ✓" : " ·"}`}
                        </button>
                      ) : (
                        <span className="text-[10px] text-white/20">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${user.kycStatus === "verified" ? "bg-nx-emerald/10 text-nx-emerald" : user.kycStatus === "pending" ? "bg-nx-gold/10 text-nx-gold" : "bg-white/5 text-white/30"}`}>
                        {user.kycStatus === "verified" ? "Verified" : user.kycStatus === "pending" ? "Pending" : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {suspended ? (
                          <button
                            onClick={() => handleReinstate(user)}
                            disabled={busyId === user._id}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-nx-emerald/10 text-nx-emerald text-[11px] font-medium hover:bg-nx-emerald/20 transition-colors disabled:opacity-50"
                            title="Reinstate account"
                          >
                            {busyId === user._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                            Reinstate
                          </button>
                        ) : isOwnerAccount ? (
                          <span className="text-[10px] text-nx-gold/60 px-2 py-1 flex items-center gap-1" title="Admin accounts cannot be suspended">
                            <ShieldAlert className="w-3 h-3" /> Protected
                          </span>
                        ) : (
                          <button
                            onClick={() => { setSuspending({ id: user._id, name: user.name || user.email }); setReason(""); }}
                            disabled={busyId === user._id}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-400/10 text-red-400 text-[11px] font-medium hover:bg-red-400/20 transition-colors disabled:opacity-50"
                            title="Suspend account"
                          >
                            <Ban className="w-3 h-3" /> Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-10 text-center">
              <p className="text-sm text-white/30">No users match this filter</p>
              <p className="text-[11px] text-white/15 mt-1">Try another card or clear the search</p>
            </div>
          )}
        </div>
      )}

      {/* Suspend confirmation dialog */}
      {suspending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={() => !busyId && setSuspending(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-red-400/15 bg-[#0A0A12] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-400/10 flex items-center justify-center">
                <Ban className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Suspend {suspending.name}?</h3>
                <p className="text-[11px] text-white/35">They will be locked out of all panels and unable to place orders.</p>
              </div>
            </div>
            <label className="block text-xs text-white/40 mb-1.5">Reason (shown to the user)</label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Repeated fraudulent listings"
              autoFocus
              className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-red-400/40 mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setSuspending(null)}
                disabled={!!busyId}
                className="flex-1 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-white/50 text-sm font-medium hover:bg-white/[0.06] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspend}
                disabled={!!busyId}
                className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {busyId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                Suspend
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
