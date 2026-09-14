import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import AdminLayout from "./AdminLayout";
import {
  Users, Package, DollarSign, Shield, ShoppingCart, Briefcase, Activity,
  AlertTriangle, Info, ArrowRight, Loader2, TrendingUp, Wallet, Ban,
  MapPin, Scale, Eye, CheckCircle2, Truck,
} from "lucide-react";

/**
 * Nexora Command Center — the upgraded admin dashboard.
 * Real-time KPIs, an actionable alert queue (every alert deep-links to the
 * panel that resolves it), 7-day revenue trend from real daily buckets,
 * money-movement reconciliation, and one-tap withdrawal approvals.
 * Zero fake data: every number comes from the getCommandCenter query.
 */

const shortKES = (n: number) =>
  n >= 1_000_000 ? `KES ${(n / 1_000_000).toFixed(1)}M` :
  n >= 1_000 ? `KES ${(n / 1_000).toFixed(0)}K` :
  `KES ${n}`;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const cc = useQuery(api.admin.getCommandCenter);
  const [activeAlert, setActiveAlert] = useState<string | null>(null);
  const reviewWithdrawal = useMutation(api.admin.reviewWithdrawal);
  const [actingWd, setActingWd] = useState<string | null>(null);

  if (!cc) return (
    <AdminLayout>
      <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-nx-violet animate-spin" /></div>
    </AdminLayout>
  );

  const maxTrend = Math.max(1, ...cc.trend.map((t) => t.orders));
  const maxRevenue = Math.max(1, ...cc.trend.map((t) => t.revenue));
  const criticalCount = cc.alerts.filter((a) => a.severity === "critical").length;

  const actOnWithdrawal = async (txId: string, approve: boolean) => {
    setActingWd(txId);
    try {
      await reviewWithdrawal({ transactionId: txId, approve });
      toast.success(approve ? "Marked as paid — user notified" : "Rejected — wallet auto-refunded");
      setActiveAlert(null);
    } catch (e: any) {
      toast.error(e?.message || "Action failed");
    } finally {
      setActingWd(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Command Center</h1>
            <p className="text-sm text-white/40 mt-1">
              Live operations across Marketplace, Freelance and Services — {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {criticalCount > 0 ? (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-400/10 border border-red-400/25 text-red-300 text-xs font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" /> {criticalCount} critical
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-400/10 border border-emerald-400/25 text-emerald-300 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> No critical alerts
              </span>
            )}
          </div>
        </div>

        {/* KPI row 1 — the business */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "GMV (all time)", value: shortKES(cc.finance.gmv), sub: `${cc.counts.orders} escrow orders`, icon: DollarSign, cls: "text-nx-cyan bg-nx-cyan/10", link: "/admin/orders" },
            { label: "Platform Revenue", value: shortKES(cc.finance.revenue), sub: `+ ${shortKES(cc.finance.buyerFees)} buyer fees`, icon: TrendingUp, cls: "text-emerald-400 bg-emerald-400/10", link: "/admin/revenue" },
            { label: "Held in Escrow", value: shortKES(cc.finance.heldInEscrow), sub: `${cc.counts.activeOrders} orders in flight`, icon: Shield, cls: "text-amber-400 bg-amber-400/10", link: "/admin/escrow" },
            { label: "Users", value: cc.counts.users, sub: `${cc.counts.buyers}b · ${cc.counts.sellers}s · ${cc.counts.freelancers}f · ${cc.counts.employers}e`, icon: Users, cls: "text-nx-violet bg-nx-violet/10", link: "/admin/users" },
          ].map((s) => (
            <button key={s.label} onClick={() => navigate(s.link)}
              className="text-left p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 hover:bg-white/[0.035] transition-all group">
              <div className="flex items-center gap-2.5 mb-3">
                <div className={`w-8 h-8 rounded-lg ${s.cls} flex items-center justify-center`}>
                  <s.icon className="w-4 h-4" />
                </div>
                <span className="text-[11px] text-white/40">{s.label}</span>
                <ArrowRight className="w-3 h-3 text-white/0 group-hover:text-white/30 ml-auto transition-colors" />
              </div>
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-[10px] text-white/30 mt-1">{s.sub}</p>
            </button>
          ))}
        </div>

        {/* KPI row 2 — the three worlds + ops */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          {[
            { label: "Products", value: cc.counts.activeListings, sub: `of ${cc.counts.listings} listed`, icon: Package, link: "/admin/products" },
            { label: "Freelancers", value: cc.counts.freelancers, sub: "workforce", icon: Briefcase, link: "/admin/freelancers" },
            { label: "Providers", value: cc.counts.providers, sub: "services & transport", icon: MapPin, link: "/admin/services" },
            { label: "Open Disputes", value: cc.counts.disputes, sub: "need resolution", icon: Scale, link: "/admin/disputes" },
            { label: "In Transit", value: cc.counts.inTransit, sub: "deliveries", icon: Truck, link: "/admin/deliveries" },
            { label: "Suspended", value: cc.counts.suspended, sub: "accounts", icon: Ban, link: "/admin/users" },
          ].map((s) => (
            <button key={s.label} onClick={() => navigate(s.link)}
              className="text-left p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition-all">
              <div className="flex items-center gap-1.5 text-white/35">
                <s.icon className="w-3.5 h-3.5" />
                <span className="text-[10px]">{s.label}</span>
              </div>
              <p className="text-lg font-bold text-white mt-1.5">{s.value}</p>
              <p className="text-[9px] text-white/25">{s.sub}</p>
            </button>
          ))}
        </div>

        {/* Alert queue — actionable, every card deep-links + can act inline */}
        <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-nx-gold" />
              <h2 className="text-sm font-semibold text-white">Action Queue</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40">{cc.alerts.length} items</span>
            </div>
            <span className="text-[10px] text-white/25">oldest & most severe first</span>
          </div>
          {cc.alerts.length === 0 ? (
            <div className="py-6 text-center">
              <CheckCircle2 className="w-8 h-8 text-nx-emerald/40 mx-auto mb-2" />
              <p className="text-sm text-white/40">Everything is clear — no aging disputes, unpaid withdrawals or stuck orders.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cc.alerts.slice(0, 8).map((a, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  a.severity === "critical" ? "border-red-400/20 bg-red-400/[0.04] hover:bg-red-400/[0.07]"
                  : a.severity === "warning" ? "border-amber-400/20 bg-amber-400/[0.04] hover:bg-amber-400/[0.07]"
                  : "border-white/8 bg-white/[0.02] hover:bg-white/[0.04]"
                }`} onClick={() => setActiveAlert(activeAlert === `a${i}` ? null : `a${i}`)}>
                  {a.severity === "critical" ? <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    : a.severity === "warning" ? <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    : <Info className="w-4 h-4 text-nx-cyan shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/85 font-medium truncate">{a.title}</p>
                    <p className="text-[11px] text-white/35 truncate">{a.detail}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(a.link); }}
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-[11px] text-white/60 hover:text-white hover:border-white/25 transition-colors"
                  >
                    Open →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Money movement — reconciliation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="w-4 h-4 text-nx-emerald" />
              <h2 className="text-sm font-semibold text-white">Money Movement (all time)</h2>
            </div>
            <div className="space-y-2.5">
              {[
                { label: "M-Pesa deposits in", value: cc.finance.deposits, cls: "text-emerald-300" },
                { label: "Held in escrow now", value: cc.finance.heldInEscrow, cls: "text-amber-300" },
                { label: "Withdrawals paid out", value: cc.finance.withdrawalsPaid, cls: "text-white/70" },
                { label: "Withdrawals pending", value: cc.finance.withdrawalsPending, cls: "text-amber-300" },
                { label: "Refunded to wallets", value: cc.finance.refunded, cls: "text-nx-cyan" },
              ].map((r) => (
                <div key={r.label} className="flex items-center justify-between text-xs">
                  <span className="text-white/40">{r.label}</span>
                  <span className={`font-semibold ${r.cls}`}>{shortKES(r.value)}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-white/50 font-medium">Net platform position</span>
                <span className="font-bold text-white">{shortKES(cc.finance.deposits - cc.finance.withdrawalsPaid - cc.finance.heldInEscrow)}</span>
              </div>
            </div>
          </div>

          {/* 7-day trend */}
          <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-nx-violet" />
              <h2 className="text-sm font-semibold text-white">Last 7 days</h2>
            </div>
            <div className="flex items-end gap-2 h-28 mb-2">
              {cc.trend.map((t) => (
                <div key={t.day} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="w-full flex items-end justify-center gap-0.5 h-20">
                    <div className="w-1/2 rounded-t bg-nx-violet/60 group-hover:bg-nx-violet transition-colors" style={{ height: `${(t.orders / maxTrend) * 100}%`, minHeight: t.orders ? 4 : 1 }} />
                    <div className="w-1/2 rounded-t bg-nx-emerald/50 group-hover:bg-nx-emerald transition-colors" style={{ height: `${(t.revenue / maxRevenue) * 100}%`, minHeight: t.revenue ? 4 : 1 }} />
                  </div>
                  <span className="text-[9px] text-white/30">{t.day}</span>
                  <div className="absolute bottom-full mb-1 hidden group-hover:block z-10 px-2 py-1 rounded bg-black/90 border border-white/10 text-[9px] text-white whitespace-nowrap">
                    {t.orders} orders · {shortKES(t.revenue)} fees · +{t.users} users
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 text-[10px] text-white/30">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-nx-violet/60" /> orders</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-nx-emerald/50" /> platform fees</span>
            </div>
          </div>
        </div>

        {/* Two-column: recent orders + pending withdrawals quick-approve */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-white/40" />
                <h2 className="text-sm font-semibold text-white">Latest Orders</h2>
              </div>
              <button onClick={() => navigate("/admin/orders")} className="text-[11px] text-white/35 hover:text-white transition-colors">All orders →</button>
            </div>
            {cc.recentOrders.length === 0 ? (
              <p className="text-xs text-white/30 py-6 text-center">No orders yet</p>
            ) : (
              <div className="space-y-1.5">
                {cc.recentOrders.map((o) => (
                  <button key={o.id} onClick={() => navigate("/admin/orders")}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.01] border border-white/[0.03] hover:bg-white/[0.04] transition-colors text-left">
                    <span className={`w-1.5 h-8 rounded-full shrink-0 ${
                      ["released", "completed"].includes(o.status) ? "bg-emerald-400" :
                      o.status === "disputed" ? "bg-red-400" :
                      o.status === "refunded" ? "bg-amber-400" : "bg-nx-cyan"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/80 truncate">{o.title}</p>
                      <p className="text-[10px] text-white/30">{o.marketplace === "freelance" ? "💼 freelance" : "🛒 marketplace"} · {new Date(o.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className="text-xs font-semibold text-white shrink-0">{shortKES(o.amount)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-semibold text-white">Withdrawals awaiting payout</h2>
              </div>
              <button onClick={() => navigate("/admin/withdrawals")} className="text-[11px] text-white/35 hover:text-white transition-colors">Manage →</button>
            </div>
            <PendingWithdrawalList onAct={actOnWithdrawal} acting={actingWd} />
          </div>
        </div>

        {/* Providers pending verification — one-tap into verification */}
        {cc.pendingProviders.length > 0 && (
          <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-nx-cyan" />
                <h2 className="text-sm font-semibold text-white">Providers waiting for verification</h2>
              </div>
              <button onClick={() => navigate("/admin/services")} className="text-[11px] text-white/35 hover:text-white transition-colors">Verify →</button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {cc.pendingProviders.map((p) => (
                <button key={p.id} onClick={() => navigate("/admin/services")}
                  className="text-left p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:border-nx-cyan/30 transition-colors">
                  <p className="text-xs font-medium text-white/80 truncate">{p.name}</p>
                  <p className="text-[10px] text-white/35 capitalize">{String(p.kind).replace(/_/g, " ")} · since {new Date(p.createdAt).toLocaleDateString()}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

/** Pending withdrawals with inline approve/reject (real reviewWithdrawal). */
function PendingWithdrawalList({ onAct, acting }: { onAct: (id: string, approve: boolean) => void; acting: string | null }) {
  const txs = useQuery(api.admin.getAllWalletTransactions);
  const users = useQuery(api.admin.getAllUsers);
  const [expanded, setExpanded] = useState<string | null>(null);

  const pending = (txs ?? []).filter((t: any) => t.type === "withdrawal" && t.status === "pending").slice(0, 6);
  if (pending.length === 0) {
    return <p className="text-xs text-white/30 py-6 text-center">No pending withdrawals — all payouts settled.</p>;
  }
  return (
    <div className="space-y-1.5">
      {pending.map((w: any) => {
        const u = (users ?? []).find((x: any) => x._id === w.userId);
        const isExpanded = expanded === w._id;
        return (
          <div key={w._id} className="p-2.5 rounded-lg bg-white/[0.01] border border-white/[0.03]">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : w._id)}>
                <p className="text-xs text-white/80 truncate">{u?.name || u?.email || "User"} · {shortKES(w.amount)}</p>
                <p className="text-[10px] text-white/30 truncate">{w.reference} · {new Date(w.createdAt).toLocaleDateString()}</p>
              </div>
              <button
                onClick={() => onAct(w._id, true)}
                disabled={acting === w._id}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-500 text-black text-[10px] font-bold hover:bg-emerald-400 disabled:opacity-40 shrink-0"
              >
                {acting === w._id ? "…" : "Mark paid"}
              </button>
              <button
                onClick={() => onAct(w._id, false)}
                disabled={acting === w._id}
                className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-red-400/20 text-red-300 text-[10px] font-medium hover:bg-red-400/10 disabled:opacity-40 shrink-0"
                title="Reject — amount auto-refunds to the user's wallet"
              >
                Reject
              </button>
            </div>
            {isExpanded && (
              <p className="mt-2 text-[10px] text-white/35">{w.description} · contact: {u?.email} {u?.phone ? `· ${u.phone}` : ""}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
