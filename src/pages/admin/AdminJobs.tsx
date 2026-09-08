import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import AdminLayout from "./AdminLayout";
import { Briefcase, Eye, Users, FolderOpen, FileText } from "lucide-react";

const statusStyles: Record<string, string> = {
  open: "bg-nx-emerald/10 text-nx-emerald",
  in_progress: "bg-nx-cyan/10 text-nx-cyan",
  completed: "bg-white/5 text-white/30",
  cancelled: "bg-red-400/10 text-red-400",
  closed: "bg-white/5 text-white/30",
};

export default function AdminJobs() {
  // REAL freelance marketplace data — freelanceTasks (job posts),
  // freelanceProjects (hires), and freelanceApplications. The legacy
  // jobPosts table is unrelated to the live Freelance workflow.
  const allTasks = useQuery(api.admin.getAllFreelanceTasks);
  const allProjects = useQuery(api.admin.getAllFreelanceProjects);
  const allApps = useQuery(api.admin.getAllFreelanceApplications);

  const tasks = allTasks ?? [];
  const projects = allProjects ?? [];
  const apps = allApps ?? [];

  const open = tasks.filter((j: any) => j.status === "open").length;
  const inProgress = tasks.filter((j: any) => j.status === "in_progress").length;
  const completed = tasks.filter((j: any) => j.status === "completed").length;
  const totalBudget = tasks.reduce((s: number, j: any) => s + (j.budget || 0), 0);

  const employerName = (id: string) => {
    const app = apps.find((a: any) => a.freelancerId === id);
    return app?.freelancerName;
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Freelance Marketplace</h1>
        <p className="text-sm text-white/40 mt-1">Live jobs, projects, and proposals across the Nexora Freelance system</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Total Jobs", value: tasks.length.toString() },
          { label: "Open", value: open.toString() },
          { label: "In Progress", value: inProgress.toString() },
          { label: "Completed", value: completed.toString() },
          { label: "Proposals", value: apps.length.toString() },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-xl border border-white/5 bg-[#0A0A12]">
            <p className="text-[10px] text-white/30 uppercase">{s.label}</p>
            <p className="text-xl font-bold text-white mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Projects (hires) */}
      <div className="rounded-xl border border-white/5 bg-[#0A0A12] p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FolderOpen className="w-4 h-4 text-nx-violet" />
          <h2 className="text-sm font-semibold text-white">Projects ({projects.length})</h2>
        </div>
        {projects.length === 0 ? (
          <p className="text-xs text-white/25 py-6 text-center">No freelance projects yet — they appear when an employer hires a writer.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-3 py-2.5 text-[10px] font-medium text-white/30 uppercase">Project</th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-medium text-white/30 uppercase">Budget</th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-medium text-white/30 uppercase hidden md:table-cell">Escrow</th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-medium text-white/30 uppercase">Status</th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-medium text-white/30 uppercase hidden md:table-cell">Paid Out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {projects.map((p: any) => (
                  <tr key={p._id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-3 py-3">
                      <p className="text-sm text-white/70 truncate max-w-[240px]">{p.title}</p>
                      <p className="text-[10px] text-white/25">Task {String(p.taskId).slice(-6)}</p>
                    </td>
                    <td className="px-3 py-3 text-xs text-white/60">KES {(p.budget || 0).toLocaleString()}</td>
                    <td className="px-3 py-3 hidden md:table-cell">
                      <span className={`text-[10px] px-2 py-0.5 rounded ${p.employerFunded ? "bg-nx-cyan/10 text-nx-cyan" : "bg-red-400/10 text-red-400"}`}>
                        {p.escrowReleased ? "released" : p.employerFunded ? "funded" : "not funded"}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/40 capitalize">
                        {String(p.status || "").replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell text-xs text-nx-emerald">
                      {p.totalPaid ? `KES ${p.totalPaid.toLocaleString()}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Job posts */}
      <div className="rounded-xl border border-white/5 bg-[#0A0A12] overflow-hidden">
        <div className="p-4 flex items-center gap-2 border-b border-white/5">
          <Briefcase className="w-4 h-4 text-nx-violet" />
          <h2 className="text-sm font-semibold text-white">Job Posts ({tasks.length})</h2>
        </div>
        {tasks.length === 0 ? (
          <div className="py-16 flex flex-col items-center">
            <Briefcase className="w-8 h-8 text-white/10 mb-3" />
            <p className="text-sm text-white/30">No job posts yet</p>
            <p className="text-[11px] text-white/15 mt-1">Jobs appear here once employers post them</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Job</th>
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Budget</th>
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase hidden md:table-cell">Applicants</th>
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Total Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {tasks.map((j: any) => (
                <tr key={j._id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="px-4 py-3.5">
                    <p className="text-sm text-white/70">{j.title}</p>
                    <p className="text-[10px] text-white/25">Posted by {j.employerName || "Employer"}</p>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/30">{j.category}</span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-white/60 font-medium">
                    {j.budget ? `KES ${j.budget.toLocaleString()}` : "—"}
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell text-xs text-white/40">{j.applicants || 0}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${statusStyles[j.status] || "bg-white/5 text-white/30"}`}>
                      {String(j.status || "").replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right text-xs text-white/40">
                    KES {totalBudget > 0 ? Math.round(totalBudget / tasks.length).toLocaleString() : 0} avg
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
