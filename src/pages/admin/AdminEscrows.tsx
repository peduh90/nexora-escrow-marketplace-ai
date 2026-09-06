import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import AdminLayout from "./AdminLayout";
import {
  Shield,
  Search,
  CheckCircle2,
  XCircle,
  Trash2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Eye,
  Loader2,
} from "lucide-react";

const statusMeta: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  created: { label: "Created", color: "text-white/40", bg: "bg-white/5" },
  funded: { label: "Funded", color: "text-nx-cyan", bg: "bg-nx-cyan/10" },
  active: { label: "Active", color: "text-nx-violet", bg: "bg-nx-violet/10" },
  delivery: { label: "In Transit", color: "text-blue-400", bg: "bg-blue-400/10" },
  inspection: {
    label: "Awaiting Confirmation",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
  },
  released: {
    label: "Released",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
  completed: {
    label: "Completed",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
  disputed: { label: "Disputed", color: "text-red-400", bg: "bg-red-400/10" },
  refunded: { label: "Refunded", color: "text-red-400", bg: "bg-red-400/10" },
  cancelled: { label: "Cancelled", color: "text-white/40", bg: "bg-white/5" },
};

export default function AdminEscrows() {
  const allEscrows = useQuery(api.admin.getAllEscrows);
  const allUsers = useQuery(api.users.getAllUsers);
  const updateListingStatus = useMutation(api.admin.updateListingStatus);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [acting, setActing] = useState<string | null>(null);

  const escrows = allEscrows ?? [];
  const users = allUsers ?? [];

  const getUser = (id: string) =>
    users.find((u: any) => u._id === id)?.name ||
    users.find((u: any) => u._id === id)?.businessName ||
    "Unknown";

  const enriched = escrows.map((e: any) => ({
    ...e,
    buyerName: getUser(e.buyerId) || "Unknown",
    sellerName: getUser(e.sellerId) || "Unknown",
  }));

  const filtered = enriched.filter((e: any) => {
    if (filter !== "All" && e.status !== filter) return false;
    if (
      search &&
      !e.title.toLowerCase().includes(search.toLowerCase()) &&
      !e.buyerName.toLowerCase().includes(search.toLowerCase()) &&
      !e.sellerName.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Escrow Management</h1>
        <p className="text-sm text-white/40 mt-1">
          Review and manage all escrow-protected transactions
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: "Total Escrow",
            value: escrows.length.toString(),
          },
          {
            label: "Funded",
            value: escrows.filter((e: any) => e.status === "funded").length.toString(),
          },
          {
            label: "In Transit",
            value: escrows.filter(
              (e: any) => ["active", "delivery", "inspection"].includes(e.status)
            ).length.toString(),
          },
          {
            label: "Disputed",
            value: escrows.filter((e: any) => e.status === "disputed").length.toString(),
          },
        ].map((s) => (
          <div
            key={s.label}
            className="p-4 rounded-xl border border-white/5 bg-[#0A0A12]"
          >
            <p className="text-[10px] text-white/30 uppercase">{s.label}</p>
            <p className="text-xl font-bold text-white mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order, buyer, or seller..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#0A0A12] border border-white/5 text-sm text-white placeholder-white/20 focus:border-nx-violet/30 focus:outline-none"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {["All", "funded", "active", "delivery", "inspection", "disputed", "released", "completed", "refunded", "cancelled"].map(
            (f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  filter === f
                    ? "bg-nx-violet/10 text-nx-violet"
                    : "text-white/30 hover:text-white/50 bg-[#0A0A12] border border-white/5"
                }`}
              >
                {f === "All" ? "All" : statusMeta[f]?.label || f}
              </button>
            )
          )}
        </div>
      </div>

      {escrows.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-[#0A0A12] py-16 flex flex-col items-center">
          <Shield className="w-8 h-8 text-white/10 mb-3" />
          <p className="text-sm text-white/30">No escrow transactions yet</p>
          <p className="text-[11px] text-white/15 mt-1">
            Escrow transactions will appear once buyers place orders
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/5 bg-[#0A0A12] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">
                    Order
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase hidden md:table-cell">
                    Buyer
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase hidden lg:table-cell">
                    Seller
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">
                    Amount
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase hidden lg:table-cell">
                    Fee
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase hidden md:table-cell">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {filtered.map((escrow: any) => {
                  const meta = statusMeta[escrow.status] ?? {
                    label: escrow.status,
                    color: "text-white/40",
                    bg: "bg-white/5",
                  };
                  const commission =
                    Math.round(escrow.amount * ((escrow.commissionRate || 3) / 100)) ||
                    escrow.platformFee ||
                    0;
                  return (
                    <tr
                      key={escrow._id}
                      className="hover:bg-white/[0.01] transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white/[0.03] flex items-center justify-center shrink-0">
                            <Shield className="w-4 h-4 text-white/20" />
                          </div>
                          <div>
                            <p className="text-sm text-white/70 font-medium truncate max-w-[180px]">
                              {escrow.title}
                            </p>
                            <p className="text-[10px] text-white/25">
                              {escrow.currency || "KES"} • {escrow.status}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <p className="text-xs text-white/50 truncate max-w-[140px]">
                          {escrow.buyerName}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <p className="text-xs text-white/50 truncate max-w-[140px]">
                          {escrow.sellerName}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs text-white/60 font-medium">
                          {escrow.currency ||
                            "KES"}{" "}
                          {(escrow.amount || 0).toLocaleString()}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <p className="text-xs text-white/40">KES {commission.toLocaleString()}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-medium ${meta.color} ${meta.bg}`}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <p className="text-xs text-white/40">
                          {escrow.createdAt
                            ? new Date(escrow.createdAt).toLocaleDateString()
                            : "—"}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Shield className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/30">
            {search ? "No escrow transactions match your search" : "No escrow transactions yet"}
          </p>
          <p className="text-[11px] text-white/15 mt-1">
            Escrow transactions will appear once buyers place orders
          </p>
        </div>
      )}
    </AdminLayout>
  );
}
