import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import AdminLayout from "./AdminLayout";
import { Briefcase, Eye } from "lucide-react";

export default function AdminJobs() {
  const allJobs = useQuery(api.admin.getAllJobPosts);

  const jobs = allJobs ?? [];
  const active = jobs.filter((j: any) => j.status === "open").length;
  const completed = jobs.filter((j: any) => j.status === "completed").length;

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Job Board Management</h1>
        <p className="text-sm text-white/40 mt-1">Monitor and moderate marketplace job listings</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Jobs", value: jobs.length.toString() },
          { label: "Active", value: active.toString() },
          { label: "Completed", value: completed.toString() },
          { label: "Total Applicants", value: jobs.reduce((s: number, j: any) => s + (j.applicants || 0), 0).toString() },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-xl border border-white/5 bg-[#0A0A12]">
            <p className="text-[10px] text-white/30 uppercase">{s.label}</p>
            <p className="text-xl font-bold text-white mt-1">{s.value}</p>
          </div>
        ))}
      </div>
      {jobs.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-[#0A0A12] py-16 flex flex-col items-center">
          <Briefcase className="w-8 h-8 text-white/10 mb-3" />
          <p className="text-sm text-white/30">No job posts yet</p>
          <p className="text-[11px] text-white/15 mt-1">Job listings will appear here once users post them</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/5 bg-[#0A0A12] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Job</th>
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Budget</th>
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase hidden md:table-cell">Applicants</th>
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {jobs.map((j: any) => (
                <tr key={j._id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="px-4 py-3.5">
                    <p className="text-sm text-white/70">{j.title}</p>
                    <p className="text-[10px] text-white/25">Posted by {j.posterName}</p>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/30">{j.category}</span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-white/60 font-medium">
                    {j.budget ? `KES ${j.budget.toLocaleString()}` : "—"}
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell text-xs text-white/40">{j.applicants || 0}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${j.status === "open" ? "bg-nx-emerald/10 text-nx-emerald" : j.status === "completed" ? "bg-white/5 text-white/30" : "bg-nx-cyan/10 text-nx-cyan"}`}>
                      {j.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button className="p-1.5 rounded text-white/20 hover:text-white/50 hover:bg-white/[0.03]">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
