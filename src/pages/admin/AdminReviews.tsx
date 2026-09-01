import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import AdminLayout from "./AdminLayout";
import { Star, Eye, Flag, Trash2 } from "lucide-react";

export default function AdminReviews() {
  const allUsers = useQuery(api.users.getAllUsers);
  const allEscrows = useQuery(api.users.getAllEscrows);

  const users = allUsers ?? [];
  const escrows = allEscrows ?? [];
  const completedEscrows = escrows.filter((e: any) => e.status === "completed" || e.status === "released");

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Review Management</h1>
        <p className="text-sm text-white/40 mt-1">Monitor and moderate marketplace reviews</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Reviews", value: "0" },
          { label: "Average Rating", value: "—" },
          { label: "Flagged", value: "0" },
          { label: "Completed Orders", value: completedEscrows.length.toString() },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-xl border border-white/5 bg-[#0A0A12]">
            <p className="text-[10px] text-white/30 uppercase">{s.label}</p>
            <p className="text-xl font-bold text-white mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/5 bg-[#0A0A12] py-16 flex flex-col items-center">
        <Star className="w-8 h-8 text-white/10 mb-3" />
        <p className="text-sm text-white/30">No reviews yet</p>
        <p className="text-[11px] text-white/15 mt-1">Reviews will appear here after completed transactions</p>
      </div>
    </AdminLayout>
  );
}
