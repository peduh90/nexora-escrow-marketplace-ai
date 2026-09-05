import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import AIChat from "@/components/AIChat";
import {
  Shield, LayoutDashboard, Search, Briefcase, FolderOpen, Users,
  Wallet, Settings, LogOut, ChevronLeft, ChevronRight, PenTool,
  MessageSquare, Star, FileText, TrendingUp, Bell, Home,
  ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, Loader2, Phone,
} from "lucide-react";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/freelance/dashboard" },
  { icon: Search, label: "Find Work", path: "/freelance/find-work" },
  { icon: Users, label: "Find Freelancers", path: "/freelance/find-freelancers" },
  { icon: Briefcase, label: "Post a Task", path: "/freelance/post-task" },
  { icon: FolderOpen, label: "My Projects", path: "/freelance/projects" },
  { icon: FileText, label: "My Applications", path: "/freelance/applications" },
  { icon: PenTool, label: "My Services", path: "/freelance/services" },
  { icon: MessageSquare, label: "Messages", path: "/freelance/messages" },
  { icon: Wallet, label: "Earnings", path: "/freelance/earnings" },
  { icon: Settings, label: "Settings", path: "/freelance/settings" },
];

export default function FreelanceDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [roleMode, setRoleMode] = useState<"freelancer" | "employer">("freelancer");

  const profile = useQuery(api.freelance.getMyProfile);
  const stats = useQuery(api.freelance.getFreelanceStats);
  const projects = useQuery(api.freelance.getMyProjects);
  const walletBalance = useQuery(api.wallet.getWalletBalance);

  const allProjects = projects ?? [];
  const activeProjects = allProjects.filter((p: any) => p.status === "active");

  return (
    <div className="flex min-h-screen bg-[#05050A]">
      {/* Sidebar */}
      <motion.aside
        className={`hidden lg:flex flex-col h-screen sticky top-0 border-r border-white/5 bg-[#08080F] transition-all duration-300 ${collapsed ? "w-[72px]" : "w-[240px]"}`}
      >
        <div className={`flex items-center h-16 px-4 border-b border-white/5 ${collapsed ? "justify-center" : "gap-2.5"}`}>
          <Shield className="w-6 h-6 text-nx-violet shrink-0" />
          {!collapsed && <span className="text-base font-bold text-white">NEXORA<span className="text-nx-violet">.</span></span>}
        </div>

        {/* Role Switcher */}
        <div className={`mx-3 mt-3 mb-1 ${collapsed ? "px-1" : "px-3"} py-1.5`}>
          {collapsed ? (
            <button onClick={() => setRoleMode(roleMode === "freelancer" ? "employer" : "freelancer")}
              className="w-full p-2 rounded-lg bg-nx-violet/10 text-nx-violet text-center text-sm">
              {roleMode === "freelancer" ? "✍️" : "💼"}
            </button>
          ) : (
            <div className="rounded-lg bg-nx-violet/10 border border-nx-violet/20 p-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-nx-violet/60 uppercase tracking-wider font-medium">Current Mode</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">{roleMode === "freelancer" ? "✍️" : "💼"}</span>
                <span className="text-xs font-semibold text-nx-violet">
                  {roleMode === "freelancer" ? "Writer / Freelancer" : "Employer"}
                </span>
              </div>
              <button onClick={() => navigate("/employer")} className="mt-1.5 text-[10px] text-nx-amber-400 hover:text-nx-amber-400 transition-colors">
                Switch to Employer →
              </button>
            </div>
          )}
        </div>

        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {sidebarItems.map((item) => {
            if ((item as any).action === "whatsapp") {
              return (
                <button
                  key={item.label}
                  onClick={() => window.open(`https://wa.me/254769739216?text=Hello%20Nexora%20Admin`, '_blank')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group ${collapsed ? "justify-center" : ""}`}
                >
                  <Phone className="w-4 h-4 shrink-0 text-emerald-400" />
                  {!collapsed && <span className="whitespace-nowrap text-emerald-400">{item.label}</span>}
                </button>
              );
            }
            const isActive = location.pathname === item.path || (item.path !== "/freelance/dashboard" && location.pathname.startsWith(item.path));
            // Show/hide based on role mode
            if (roleMode === "freelancer" && ["/freelance/post-task", "/freelance/find-freelancers"].includes(item.path)) return null;
            if (roleMode === "employer" && ["/freelance/find-work", "/freelance/applications"].includes(item.path)) return null;

            return (
              <button key={item.path} onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group ${isActive ? "bg-nx-violet/10 text-nx-violet" : "text-white/40 hover:text-white/70 hover:bg-white/[0.03]"} ${collapsed ? "justify-center" : ""}`}>
                <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-nx-violet" : ""}`} />
                {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className={`border-t border-white/5 p-3 ${collapsed ? "flex flex-col items-center" : ""}`}>
          <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
            {user?.image ? (
              <img src={user.image} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 border border-nx-violet/20" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-nx-violet/15 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-nx-violet">{(user?.name || "U").charAt(0).toUpperCase()}</span>
              </div>
            )}
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{user?.name || "User"}</p>
                <p className="text-[10px] text-white/30 truncate">{roleMode === "freelancer" ? "Writer" : "Employer"}</p>
              </div>
            )}
          </div>
          <button onClick={async () => { await signOut(); navigate("/"); }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/30 hover:text-white/60 hover:bg-white/[0.03] transition-colors mt-2 ${collapsed ? "justify-center w-full" : ""}`}>
            <LogOut className="w-3.5 h-3.5" /> {!collapsed && "Sign Out"}
          </button>
        </div>

        <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-nx-surface border border-white/10 items-center justify-center text-white/30 hover:text-white/60 transition-colors z-10">
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="sticky top-0 z-30 h-14 bg-[#08080F]/80 backdrop-blur-xl border-b border-white/5 flex items-center px-4 md:px-6 justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/freelance")} className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors">
              <Home className="w-4 h-4" />
            </button>
            <h1 className="text-sm font-semibold text-white hidden sm:block">Freelance Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-lg hover:bg-white/[0.03] transition-colors">
              <Bell className="w-4 h-4 text-white/40" />
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-400/5 border border-emerald-400/10">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">KES {(walletBalance?.walletBalance || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-4 md:p-6 space-y-6">
          {/* Welcome */}
          <div>
            <h1 className="text-2xl font-bold text-white">
              {roleMode === "freelancer" ? "✍️ Writer Dashboard" : "💼 Employer Dashboard"}
            </h1>
            <p className="text-sm text-white/40 mt-1">
              Welcome back, {user?.name || "there"}. Here's your freelance overview.
            </p>
          </div>

          {/* Profile completion */}
          {(!profile || !profile.title) && (
            <div className="p-4 rounded-xl bg-nx-violet/5 border border-nx-violet/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Complete your profile</p>
                  <p className="text-xs text-white/40 mt-0.5">A complete profile gets 3x more project invitations.</p>
                </div>
                <button onClick={() => navigate("/freelance/settings")}
                  className="px-4 py-2 rounded-lg bg-nx-violet text-white text-xs font-semibold hover:bg-nx-violet/80 transition-colors">
                  Complete Profile
                </button>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[                { label: "Active Projects", value: activeProjects.length, icon: FolderOpen, color: "#8B5CF6" },
              { label: "Total Projects", value: allProjects.length, icon: Briefcase, color: "#06B6D4" },
              { label: "Applications", value: stats?.totalApplications || 0, icon: FileText, color: "#F59E0B" },
              { label: "Tasks Posted", value: stats?.totalTasks || 0, icon: PenTool, color: "#10B981" },
            ].map((card, i) => (
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {roleMode === "freelancer" ? (
              <>
                <button onClick={() => navigate("/freelance/find-work")}
                  className="p-4 rounded-xl bg-nx-violet/10 border border-nx-violet/10 hover:bg-nx-violet/15 transition-colors text-left">
                  <Search className="w-5 h-5 text-nx-violet mb-2" />
                  <p className="text-sm font-medium text-white">Find Work</p>
                  <p className="text-[11px] text-white/30">Browse available tasks</p>
                </button>
                <button onClick={() => navigate("/freelance/projects")}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors text-left">
                  <FolderOpen className="w-5 h-5 text-white/40 mb-2" />
                  <p className="text-sm font-medium text-white">Projects</p>
                  <p className="text-[11px] text-white/30">View active projects</p>
                </button>
                <button onClick={() => navigate("/freelance/services")}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors text-left">
                  <PenTool className="w-5 h-5 text-white/40 mb-2" />
                  <p className="text-sm font-medium text-white">My Services</p>
                  <p className="text-[11px] text-white/30">Manage service listings</p>
                </button>
                <button onClick={() => navigate("/freelance/earnings")}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors text-left">
                  <Wallet className="w-5 h-5 text-white/40 mb-2" />
                  <p className="text-sm font-medium text-white">Earnings</p>
                  <p className="text-[11px] text-white/30">Track your income</p>
                </button>
              </>
            ) : (
              <>
                <button onClick={() => navigate("/freelance/post-task")}
                  className="p-4 rounded-xl bg-nx-violet/10 border border-nx-violet/10 hover:bg-nx-violet/15 transition-colors text-left">
                  <Briefcase className="w-5 h-5 text-nx-violet mb-2" />
                  <p className="text-sm font-medium text-white">Post a Task</p>
                  <p className="text-[11px] text-white/30">Hire a freelancer</p>
                </button>
                <button onClick={() => navigate("/freelance/find-freelancers")}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors text-left">
                  <Users className="w-5 h-5 text-white/40 mb-2" />
                  <p className="text-sm font-medium text-white">Find Talent</p>
                  <p className="text-[11px] text-white/30">Browse freelancers</p>
                </button>
                <button onClick={() => navigate("/freelance/projects")}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors text-left">
                  <FolderOpen className="w-5 h-5 text-white/40 mb-2" />
                  <p className="text-sm font-medium text-white">Projects</p>
                  <p className="text-[11px] text-white/30">Manage your projects</p>
                </button>
                <button onClick={() => navigate("/freelance/services")}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors text-left">
                  <PenTool className="w-5 h-5 text-white/40 mb-2" />
                  <p className="text-sm font-medium text-white">Browse Services</p>
                  <p className="text-[11px] text-white/30">Find services to buy</p>
                </button>
              </>
            )}
          </div>

          {/* Recent Projects */}
          <div className="p-5 rounded-xl border border-white/5 bg-white/[0.02]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Recent Projects</h3>
              <button onClick={() => navigate("/freelance/projects")} className="text-xs text-nx-violet hover:text-nx-violet/80 flex items-center gap-1">
                View All <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            {allProjects.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="w-8 h-8 text-white/10 mx-auto mb-2" />
                <p className="text-sm text-white/30">No projects yet</p>
                <p className="text-[11px] text-white/15 mt-1">
                  {roleMode === "freelancer" ? "Apply to tasks to start your first project" : "Post a task to find freelancers"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {allProjects.slice(0, 5).map((proj: any) => (
                  <div key={proj._id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => navigate("/freelance/projects")}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${proj.status === "active" ? "bg-nx-violet/10" : proj.status === "completed" ? "bg-nx-emerald/10" : "bg-white/5"}`}>
                      {proj.status === "active" ? <Clock className="w-4 h-4 text-nx-violet" /> : <CheckCircle2 className="w-4 h-4 text-nx-emerald" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{proj.title}</p>
                      <p className="text-[11px] text-white/30">
                        {proj.isFreelancer ? `Employer: ${proj.employerName}` : `Freelancer: ${proj.freelancerName}`} • {proj.progress}% complete
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium text-white">KES {proj.budget.toLocaleString()}</p>
                      <p className="text-[10px] text-white/20 capitalize">{proj.status.replace("_", " ")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <AIChat panel="freelance" />
    </div>
  );
}
