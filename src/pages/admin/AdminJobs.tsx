import AdminLayout from "./AdminLayout";
import { Briefcase, Eye, CheckCircle2, XCircle } from "lucide-react";

const jobs = [
  { id: "JOB-234", title: "Web Developer Needed", poster: "TechHub Kenya", category: "IT Services", budget: "KES 50,000", applicants: 12, status: "Active", date: "Apr 5, 2025" },
  { id: "JOB-233", title: "Transport to Mombasa", poster: "Edwin Kamau", category: "Transport", budget: "KES 8,000", applicants: 3, status: "Active", date: "Apr 4, 2025" },
  { id: "JOB-232", title: "Photographer for Wedding", poster: "Grace Njeri", category: "Photography", budget: "KES 25,000", applicants: 8, status: "Active", date: "Apr 3, 2025" },
  { id: "JOB-231", title: "House Cleaning Service", poster: "Peter Mwangi", category: "Cleaning", budget: "KES 3,000", applicants: 5, status: "Completed", date: "Apr 1, 2025" },
];

export default function AdminJobs() {
  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Job Board Management</h1>
        <p className="text-sm text-white/40 mt-1">Monitor and moderate marketplace job listings</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Jobs", value: "1,245" },
          { label: "Active", value: "892" },
          { label: "Completed", value: "353" },
          { label: "Pending Review", value: "12" },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-xl border border-white/5 bg-[#0A0A12]">
            <p className="text-[10px] text-white/30 uppercase">{s.label}</p>
            <p className="text-xl font-bold text-white mt-1">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-white/5 bg-[#0A0A12] overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-white/5">
            <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Job</th>
            <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase hidden md:table-cell">Category</th>
            <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Budget</th>
            <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase hidden md:table-cell">Applicants</th>
            <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Status</th>
            <th className="text-right px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-white/[0.03]">
            {jobs.map(j => (
              <tr key={j.id} className="hover:bg-white/[0.01] transition-colors">
                <td className="px-4 py-3.5">
                  <p className="text-sm text-white/70">{j.title}</p>
                  <p className="text-[10px] text-white/25">Posted by {j.poster}</p>
                </td>
                <td className="px-4 py-3.5 hidden md:table-cell"><span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/30">{j.category}</span></td>
                <td className="px-4 py-3.5 text-xs text-white/60 font-medium">{j.budget}</td>
                <td className="px-4 py-3.5 hidden md:table-cell text-xs text-white/40">{j.applicants}</td>
                <td className="px-4 py-3.5"><span className={`text-[10px] px-2 py-0.5 rounded font-medium ${j.status === "Active" ? "bg-nx-emerald/10 text-nx-emerald" : "bg-white/5 text-white/30"}`}>{j.status}</span></td>
                <td className="px-4 py-3.5 text-right"><button className="p-1.5 rounded text-white/20 hover:text-white/50 hover:bg-white/[0.03]"><Eye className="w-3.5 h-3.5" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
