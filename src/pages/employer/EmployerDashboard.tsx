import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, Briefcase, Plus, FolderOpen, FileText, MessageSquare, Wallet, Settings, Phone, Search, Users, Loader2, Eye } from "lucide-react";

export default function EmployerDashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const profile = useQuery(api.freelance.getMyProfile);
  const stats = useQuery(api.freelance.getFreelanceStats);
  const myTasks = useQuery(api.freelance.getMyTasks);
  const projects = useQuery(api.freelance.getMyProjects);

  const [collapsed, setCollapsed] = useState(false);

  const userId = user?._id || profile?._id;
  const myJobs = (myTasks ?? []).length;
  const myActiveProjects = (projects ?? []).filter((p: any) =>
    p.employerId === userId && (p.status === "active" || p.status === "submitted" || p.status === "under_review")
  ).length;

  const handleWhatsApp = () => {
    window.open(`https://wa.me/254769739216?text=Hello%20Nexora%20Admin%2C%20I%20need%20help%20with%20my%20employer%20account`, "_blank");
  };

  return (
    <div className="flex min-h-screen bg-[#05050A]">
      {/* Sidebar */}
      <aside className={`hidden lg:flex flex-col h-screen sticky top-0 border-r border-white/5 bg-[#08080F] transition-all duration-300 ${collapsed ? "w-[72px]" : "w-[240px]"}`}>
        <div className="flex items-center h-16 px-4 border-b border-white/5">
          <Briefcase className="w-6 h-6 text-nx-violet shrink-0" />
          {!collapsed && <span className="text-base font-bold text-white">NEXORA<span className="text-nx-violet">.</span></span>}
        </div>

        <div className="mx-3 mt-3 px-3 py-1.5 rounded-lg bg-nx-amber-400/10 border border-nx-amber-400/20">
          {!collapsed && (
            <div className="text-center">
              <p className="text-[10px] text-nx-amber-400/60 uppercase tracking-wider font-medium">Current Mode</p>
              <span className="text-2xl block mt-0.5">💼</span>
              <p className="text-xs font-semibold text-nx-amber-400 mt-0.5">Employer</p>
              <button onClick={() => navigate("/freelance/dashboard")} className="mt-1 text-[10px] text-nx-amber-400/50 hover:text-nx-amber-400">
                Switch to Writer →
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {[
            { icon: Briefcase, label: "Dashboard", path: "/employer" },
            { icon: Plus, label: "Post a Job", path: "/freelance/post-task" },
            { icon: Search, label: "Find Freelancers", path: "/freelance/find-freelancers" },
            { icon: FolderOpen, label: "My Projects", path: "/freelance/projects" },
            { icon: FileText, label: "My Jobs", path: "/freelance/applications" },
            { icon: MessageSquare, label: "Messages", path: "/freelance/messages" },
            { icon: Wallet, label: "Earnings", path: "/freelance/earnings" },
            { icon: Settings, label: "Settings", path: "/freelance/settings" },
          ].map((item) => {
            const isActive = item.path === "/employer" ? (typeof window !== "undefined" && window.location.pathname === "/employer") : item.path !== "/employer";
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group ${collapsed ? "justify-center" : ""}`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
              </button>
            );
          })}
          <button onClick={handleWhatsApp} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group justify-center">
            <Phone className="w-4 h-4 shrink-0 text-nx-gold" />
            {!collapsed && <span className="whitespace-nowrap text-nx-gold">Contact Admin</span>}
          </button>
        </nav>

        <div className="border-t border-white/5 p-3">
          <div className="flex items-center gap-3">
            {user?.image ? (
              <img src={user.image} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 border border-nx-violet/20" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-nx-violet/15 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-nx-violet">{(user?.name || "U").charAt(0).toUpperCase()}</span>
              </div>
            )}
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{user?.name || "Employer"}</p>
                <p className="text-[10px] text-white/30 truncate">Employer</p>
              </div>
            )}
          </div>
          <button onClick={async () => { await signOut(); navigate("/"); }} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/30 hover:text-white/60 hover:bg-white/[0.03] transition-colors mt-2 w-full justify-center">
            <Settings className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-[#08080F]/95 backdrop-blur-xl border-t border-white/5">
        <nav className="flex items-center justify-around py-2 px-2 overflow-x-auto">
          {[
            { icon: Briefcase, label: "Home", path: "/employer" },
            { icon: Plus, label: "Post Job", path: "/freelance/post-task" },
            { icon: FolderOpen, label: "Projects", path: "/freelance/projects" },
            { icon: Wallet, label: "Earnings", path: "/freelance/earnings" },
          ].map((item) => (
            <button key={item.path} onClick={() => navigate(item.path)} className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-colors">
              <item.icon className="w-5 h-5" />
              <span className="text-[9px]">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="sticky top-0 z-30 h-14 bg-[#08080F]/80 backdrop-blur-xl border-b border-white/5 flex items-center px-4 md:px-6 justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/freelance")} className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-sm font-semibold text-white hidden sm:block">Employer Dashboard</h1>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-4 md:p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white">💼 Employer Dashboard</h1>
            <p className="text-sm text-white/40 mt-1">Post jobs, hire freelancers, manage projects</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Jobs Posted", value: myJobs, icon: Briefcase, color: "#8B5CF6" },
              { label: "Active Projects", value: myActiveProjects, icon: FolderOpen, color: "#06B6D4" },
              { label: "Total Projects", value: (projects ?? []).length, icon: FileText, color: "#F59E0B" },
              { label: "Proposals Received", value: stats?.totalApplications || 0, icon: Users, color: "#10B981" },
            ].map((card) => (
              <div key={card.label} className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${card.color}12` }}>
                    <card.icon className="w-4 h-4" style={{ color: card.color }} />
                  </div>
                </div>
                <p className="text-[11px] text-white/30 mb-1">{card.label}</p>
                <p className="text-lg font-bold text-white">{card.value}</p>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <button onClick={() => navigate("/freelance/post-task")} className="p-4 rounded-xl bg-nx-violet/10 border border-nx-violet/10 hover:bg-nx-violet/15 transition-colors text-left">
              <Plus className="w-5 h-5 text-nx-violet mb-2" />
              <p className="text-sm font-medium text-white">Post a Job</p>
              <p className="text-[11px] text-white/30">Hire a freelancer</p>
            </button>
            <button onClick={() => navigate("/freelance/find-freelancers")} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors text-left">
              <Users className="w-5 h-5 text-white/40 mb-2" />
              <p className="text-sm font-medium text-white">Find Talent</p>
              <p className="text-[11px] text-white/30">Browse freelancers</p>
            </button>
            <button onClick={() => navigate("/freelance/projects")} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors text-left">
              <FolderOpen className="w-5 h-5 text-white/40 mb-2" />
              <p className="text-sm font-medium text-white">Projects</p>
              <p className="text-[11px] text-white/30">Manage your projects</p>
            </button>
          </div>

          {/* My Projects */}
          <div className="p-5 rounded-xl border border-white/5 bg-white/[0.02]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">My Projects</h3>
              <button onClick={() => navigate("/freelance/post-task")} className="text-xs text-nx-violet hover:text-nx-violet/80 flex items-center gap-1">
                Post New <ArrowLeft className="w-3 h-3" style={{ transform: "rotate(180deg)" }} />
              </button>
            </div>
            {myActiveProjects === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="w-8 h-8 text-white/10 mx-auto mb-2" />
                <p className="text-sm text-white/30">No projects yet</p>
                <p className="text-[11px] text-white/15 mt-1">Post a job to start hiring</p>
              </div>
            ) : (
              <div className="space-y-2">
                {((projects ?? []).filter((p: any) => p.employerId === userId)).slice(0, 5).map((proj: any) => (
                  <div key={proj._id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => navigate("/freelance/projects")}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${proj.status === "active" ? "bg-nx-violet/10" : proj.status === "completed" ? "bg-nx-emerald/10" : "bg-white/5"}`}>
                      {proj.status === "active" ? <FolderOpen className="w-4 h-4 text-nx-violet" /> : <FileText className="w-4 h-4 text-nx-emerald" />}
                    </div>
                    <Eye className="w-3 h-3 text-white/20 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{proj.title}</p>
                      <p className="text-[11px] text-white/30">KES {proj.budget?.toLocaleString()} • {proj.status}</p>
                    </div>
                    <span className="text-[10px] text-white/20">{new Date(proj.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
