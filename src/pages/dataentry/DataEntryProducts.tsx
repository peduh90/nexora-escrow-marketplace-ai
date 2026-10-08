import DataEntryLayout from "./DataEntryLayout";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Loader2, Package, Send, Edit3, Search, Filter,
  CheckCircle2, XCircle, RefreshCw, Rocket, MessageSquare,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-white/10 text-white/60" },
  pending_seller_review: { label: "In review", color: "bg-amber-400/10 text-amber-400" },
  approved: { label: "Approved", color: "bg-emerald-400/10 text-emerald-400" },
  rejected: { label: "Rejected", color: "bg-red-400/10 text-red-400" },
  changes_requested: { label: "Changes requested", color: "bg-orange-400/10 text-orange-400" },
  published: { label: "Published", color: "bg-nx-cyan/10 text-nx-cyan" },
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "draft", label: "Drafts" },
  { key: "changes_requested", label: "Changes" },
  { key: "pending_seller_review", label: "In review" },
  { key: "approved", label: "Approved" },
  { key: "published", label: "Published" },
];

export default function DataEntryProducts() {
  const products = useQuery(api.dataEntry.myProducts);
  const submitForReview = useMutation(api.dataEntry.submitForReview);
  const updateMyDraft = useMutation(api.dataEntry.updateMyDraft);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: "", description: "", price: "" });
  const [saving, setSaving] = useState(false);

  const filtered = (products ?? []).filter((p: any) => {
    const title = p.listing?.title?.toLowerCase() ?? "";
    const matchSearch = !search || title.includes(search.toLowerCase());
    const matchFilter = filter === "all" || p.status === filter;
    return matchSearch && matchFilter;
  });

  const handleSubmit = async (p: any) => {
    setBusy(p._id);
    setError(null);
    try {
      await submitForReview({ sellerId: p.sellerId, productEntryId: p._id });
    } catch (err: any) {
      setError(err?.message || "Could not submit for review.");
    } finally {
      setBusy(null);
    }
  };

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      title: p.listing?.title || "",
      description: p.listing?.description || "",
      price: p.listing?.price != null ? String(p.listing.price) : "",
    });
  };

  const saveEdit = async () => {
    if (!editing || !form.title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await updateMyDraft({
        productEntryId: editing._id,
        listingArgs: {
          title: form.title.trim(),
          description: form.description.trim(),
          price: Number(form.price) || 0,
        },
      });
      setEditing(null);
    } catch (err: any) {
      setError(err?.message || "Could not save changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DataEntryLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-white">My Products</h2>
          <p className="text-xs text-white/30 mt-0.5">
            {products === undefined ? "Loading…" : `${products.length} products entered`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-nx-violet/30 transition-colors"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <Filter className="w-3.5 h-3.5 text-white/20 shrink-0" />
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filter === f.key
                  ? "bg-nx-violet/20 text-white border border-nx-violet/40"
                  : "bg-white/[0.03] text-white/45 border border-white/5 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-400/10 border border-red-400/20 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* List */}
      {products === undefined ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-nx-violet animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-white/10">
          <Package className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/35">No products match this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p: any) => (
            <div key={p._id} className="rounded-xl border border-white/5 bg-white/[0.02] p-4 hover:border-white/10 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-lg bg-white/[0.04] overflow-hidden flex items-center justify-center shrink-0">
                  {p.listing?.images?.[0] ? (
                    <img src={p.listing.images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-5 h-5 text-white/15" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-medium text-white truncate">{p.listing?.title || "Untitled product"}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusConfig[p.status]?.color || "bg-white/5 text-white/40"}`}>
                      {statusConfig[p.status]?.label || p.status}
                    </span>
                  </div>
                  <p className="text-xs text-white/35 mt-0.5 truncate">
                    {p.sellerName}
                    {p.listing?.category ? ` · ${p.listing.category}` : ""}
                    {p.listing?.price != null ? ` · KSh ${p.listing.price.toLocaleString()}` : ""}
                  </p>
                  {p.status === "changes_requested" && p.reviewNote && (
                    <p className="mt-2 flex items-start gap-1.5 text-[11px] text-orange-300/90">
                      <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-px" />
                      {p.reviewNote}
                    </p>
                  )}
                  {p.status === "rejected" && p.reviewNote && (
                    <p className="mt-2 flex items-start gap-1.5 text-[11px] text-red-300/90">
                      <XCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
                      {p.reviewNote}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {(p.status === "draft" || p.status === "changes_requested") && (
                    <>
                      <button
                        onClick={() => openEdit(p)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-white/60 text-xs hover:bg-white/[0.07] transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleSubmit(p)}
                        disabled={busy === p._id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-nx-violet hover:bg-nx-violet/80 text-white text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        {busy === p._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        Submit
                      </button>
                    </>
                  )}
                  {p.status === "pending_seller_review" && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400/10 text-amber-400 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Waiting on seller
                    </span>
                  )}
                  {p.status === "approved" && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-400/10 text-emerald-400 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                    </span>
                  )}
                  {p.status === "published" && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-nx-cyan/10 text-nx-cyan text-xs">
                      <Rocket className="w-3.5 h-3.5" /> Live
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 p-0 md:p-4" onClick={() => setEditing(null)}>
          <div
            className="w-full md:max-w-lg rounded-t-2xl md:rounded-2xl border border-white/10 bg-[#0B0B14] p-5 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-white">Revise product draft</h3>
            <div>
              <label className="text-xs text-white/40">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1 w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/10 text-sm text-white focus:outline-none focus:border-nx-violet/40"
              />
            </div>
            <div>
              <label className="text-xs text-white/40">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                className="mt-1 w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/10 text-sm text-white focus:outline-none focus:border-nx-violet/40"
              />
            </div>
            <div>
              <label className="text-xs text-white/40">Price (KSh)</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="mt-1 w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/10 text-sm text-white focus:outline-none focus:border-nx-violet/40"
              />
            </div>
            {editing.reviewNote && (
              <p className="text-xs text-orange-300/90">Seller note: {editing.reviewNote}</p>
            )}
            <div className="flex gap-2 pt-1">
              <button
                onClick={saveEdit}
                disabled={saving || !form.title.trim()}
                className="flex-1 py-2.5 rounded-xl bg-nx-violet hover:bg-nx-violet/80 text-white text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save changes
              </button>
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2.5 rounded-xl bg-white/10 text-white/60 text-sm hover:bg-white/15 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DataEntryLayout>
  );
}
