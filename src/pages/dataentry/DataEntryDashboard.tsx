import DataEntryLayout from "./DataEntryLayout";
import { useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Loader2, PenLine, Package, Send, CheckCircle2, XCircle,
  RefreshCw, Rocket, TrendingUp, Store, ArrowRight, Briefcase,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-white/10 text-white/60" },
  pending_seller_review: { label: "In review", color: "bg-amber-400/10 text-amber-400" },
  approved: { label: "Approved", color: "bg-emerald-400/10 text-emerald-400" },
  rejected: { label: "Rejected", color: "bg-red-400/10 text-red-400" },
  changes_requested: { label: "Changes requested", color: "bg-orange-400/10 text-orange-400" },
  published: { label: "Published", color: "bg-nx-cyan/10 text-nx-cyan" },
};

export default function DataEntryDashboard() {
  const navigate = useNavigate();
  const stats = useQuery(api.dataEntry.myStats);
  const sellers = useQuery(api.dataEntry.mySellers);
  const products = useQuery(api.dataEntry.myProducts);

  const recent = (products ?? [])
    .slice()
    .sort((a: any, b: any) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
    .slice(0, 6);

  const cards = [
    { label: "Total products", value: stats?.total ?? 0, icon: Package, tint: "text-white bg-white/5" },
    { label: "Awaiting review", value: stats?.submitted ?? 0, icon: Send, tint: "text-amber-400 bg-amber-400/10" },
    { label: "Approved", value: stats?.approved ?? 0, icon: CheckCircle2, tint: "text-emerald-400 bg-emerald-400/10" },
    { label: "Published", value: stats?.published ?? 0, icon: Rocket, tint: "text-nx-cyan bg-nx-cyan/10" },
    { label: "Changes requested", value: stats?.changesRequested ?? 0, icon: RefreshCw, tint: "text-orange-400 bg-orange-400/10" },
    { label: "Rejected", value: stats?.rejected ?? 0, icon: XCircle, tint: "text-red-400 bg-red-400/10" },
  ];

  return (
    <DataEntryLayout>
      {/* Hero */}
      <div className="rounded-2xl border border-nx-violet/20 bg-gradient-to-br from-nx-violet/[0.12] via-transparent to-transparent p-5 md:p-6 mb-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">Data Entry Dashboard</h2>
            <p className="text-xs text-white/40 mt-1">
              Enter products for the stores you work with — every draft goes to the seller for review before it hits the market.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/data-entry/jobs")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/10 text-white/70 text-sm font-medium hover:bg-white/[0.07] transition-colors"
            >
              <Briefcase className="w-4 h-4" /> Jobs
            </button>
            <button
              onClick={() => navigate("/data-entry/new")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-nx-violet hover:bg-nx-violet/80 text-white text-sm font-medium transition-colors"
            >
              <PenLine className="w-4 h-4" /> New Product
            </button>
          </div>
        </div>
        {/* Completion meter */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-[11px] text-white/40 mb-1.5">
            <span>Completion rate</span>
            <span className="text-white/70 font-semibold">{stats?.completionPercent ?? 0}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-nx-violet to-nx-cyan transition-all duration-700"
              style={{ width: `${stats?.completionPercent ?? 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-5">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-white/5 bg-white/[0.02] p-4 hover:border-white/10 transition-colors">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${c.tint}`}>
              <c.icon className="w-4 h-4" />
            </div>
            <p className="text-xl font-bold text-white">{stats === undefined ? "—" : c.value}</p>
            <p className="text-[11px] text-white/35 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* My sellers */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Stores I work with</h3>
            <Store className="w-4 h-4 text-white/20" />
          </div>
          {sellers === undefined ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-nx-violet animate-spin" /></div>
          ) : sellers.length === 0 ? (
            <div className="text-center py-6">
              <Store className="w-8 h-8 text-white/10 mx-auto mb-2" />
              <p className="text-xs text-white/35">
                No store access yet. Ask a seller to invite you — accept the invitation and your stores appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sellers.map((s: any) => (
                <div key={s.sellerId} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5">
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{s.businessName}</p>
                    <p className="text-[10px] text-white/30">{s.permissions?.length ?? 0} permissions</p>
                  </div>
                  <button
                    onClick={() => navigate(`/data-entry/new?seller=${s.sellerId}`)}
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-nx-violet/15 border border-nx-violet/30 text-nx-violet text-xs font-medium hover:bg-nx-violet/25 transition-colors"
                  >
                    Add product
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent products */}
        <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-white/[0.02] p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Recent products</h3>
            <button
              onClick={() => navigate("/data-entry/products")}
              className="flex items-center gap-1 text-[11px] text-nx-violet hover:text-white transition-colors"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {products === undefined ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-nx-violet animate-spin" /></div>
          ) : recent.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="w-8 h-8 text-white/10 mx-auto mb-2" />
              <p className="text-xs text-white/35">No products yet — enter your first product for a store.</p>
              <button
                onClick={() => navigate("/data-entry/new")}
                className="mt-3 px-4 py-2 rounded-lg bg-nx-violet text-white text-xs font-medium hover:bg-nx-violet/80 transition-colors"
              >
                Start entering
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((p: any) => (
                <div key={p._id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5">
                  <div className="w-10 h-10 rounded-lg bg-white/[0.04] overflow-hidden flex items-center justify-center shrink-0">
                    {p.listing?.images?.[0] ? (
                      <img src={p.listing.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-4 h-4 text-white/20" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white truncate">{p.listing?.title || "Untitled product"}</p>
                    <p className="text-[10px] text-white/30 truncate">
                      {p.sellerName}
                      {p.listing?.price != null ? ` · KSh ${p.listing.price.toLocaleString()}` : ""}
                    </p>
                  </div>
                  <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium ${statusConfig[p.status]?.color || "bg-white/5 text-white/40"}`}>
                    {statusConfig[p.status]?.label || p.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DataEntryLayout>
  );
}
