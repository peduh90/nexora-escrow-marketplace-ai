import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import VerificationCard from "@/components/VerificationCard";
import { ArrowLeft, Briefcase, Plus, FolderOpen, FileText, MessageSquare, Wallet, LogOut, Settings, Phone, Search, Users, Clock, CheckCircle2, Bell } from "lucide-react";

export default function EmployerDashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const myTasks = useQuery(api.freelance.getMyTasks);
  // Employer-scoped projects (only where employerId === current user).
  const projects = useQuery(api.freelance.getEmployerProjects);
  const stats = useQuery(api.freelance.getFreelanceStats);
  const walletBalance = useQuery(api.wallet.getWalletBalance);
  // Real unread notifications for the bell badge (hire confirmations, revision
  // requests, escrow releases, etc. all land in the notifications table).
  const unreadNotifications = useQuery(api.reviews.getUnreadCount);

  const [collapsed, setCollapsed] = useState(false);

  const myJobs = (myTasks ?? []).length;
  const openJobs = (myTasks ?? []).filter((t: any) => t.status === "open").length;
  const allProjects = projects ?? [];
  const awaitingReview = allProjects.filter((p: any) => p.status === "submitted").length;
  const activeProjects = allProjects.filter((p: any) =>
    ["active", "revision_requested"].includes(p.status)
  ).length;
  const completedProjects = allProjects.filter((p: any) => p.status === "completed").length;

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
            </div>
          )}
        </div>

        {/* Navigation — every target is an employer-authorised route. */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {[
            { icon: Briefcase, label: "Dashboard", path: "/employer" },
            { icon: Plus, label: "Post a Job", path: "/employer/post-job" },
            { icon: Search, label: "Find Freelancers", path: "/freelance/find-freelancers" },
            { icon: Users, label: "Job Applicants", path: "/employer/jobs" },
            { icon: FolderOpen, label: "Projects & Review", path: "/employer/projects" },
            { icon: MessageSquare, label: "Messages", path: "/employer/messages" },
            { icon: Wallet, label: "Wallet & Escrow", path: "/employer/earnings" },
            { icon: Settings, label: "Settings", path: "/employer/settings" },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group ${collapsed ? "justify-center" : ""}`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </button>
          ))}
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
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Tablet bottom nav (md–lg); phones use the global shell's tab bar. */}
      <div className="hidden md:flex lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#08080F]/95 backdrop-blur-xl border-t border-white/5">
        <nav className="flex items-center justify-around py-2 px-2 overflow-x-auto w-full">
          {[
            { icon: Briefcase, label: "Home", path: "/employer" },
            { icon: Plus, label: "Post Job", path: "/employer/post-job" },
            { icon: Users, label: "Applicants", path: "/employer/jobs" },
            { icon: FolderOpen, label: "Projects", path: "/employer/projects" },
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
        {/* Header — phones (<md) get their contextual header from the global
            mobile shell, so this panel header only shows md and up. */}
        <div className="hidden md:flex sticky top-0 z-30 h-14 bg-[#08080F]/80 backdrop-blur-xl border-b border-white/5 items-center px-4 md:px-6 justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/marketplace")} className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors" title="Back to Marketplace">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-sm font-semibold text-white">Employer Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/employer/notifications")}
              className="relative p-2 rounded-lg hover:bg-white/[0.03] text-white/40 hover:text-white/70 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {!!unreadNotifications && unreadNotifications > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 rounded-full bg-red-500 flex items-center justify-center">
                  <span className="text-[8px] font-bold text-white">
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                </span>
              )}
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-400/5 border border-emerald-400/10">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">KES {(walletBalance?.walletBalance || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-4 md:p-6 space-y-6 pb-28 md:pb-24 lg:pb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">💼 Employer Dashboard</h1>
            <p className="text-sm text-white/40 mt-1">Post jobs, hire writers, review work, release escrow payments</p>
          </div>

          {/* Progressive verification — profile + 5 distinct jobs gate */}
          <VerificationCard />

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Jobs Posted", value: myJobs, icon: Briefcase, color: "#8B5CF6" },
              { label: "Open Jobs", value: openJobs, icon: Search, color: "#06B6D4" },
              { label: "Awaiting Your Review", value: awaitingReview, icon: Clock, color: "#F59E0B" },
              { label: "Active Projects", value: activeProjects, icon: FolderOpen, color: "#10B981" },
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

          {/* Review queue — the employer's most important action item */}
          {awaitingReview > 0 && (
            <div className="p-5 rounded-xl bg-amber-400/5 border border-amber-400/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-semibold text-white">{awaitingReview} submission{awaitingReview === 1 ? "" : "s"} waiting for your review</h3>
                </div>
                <button onClick={() => navigate("/employer/projects")} className="text-xs text-amber-400 hover:text-amber-400/80">
                  Review now →
                </button>
              </div>
              <p className="text-xs text-white/40">Freelancers submitted completed work. Approve to release escrow, or request revisions.</p>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <button onClick={() => navigate("/employer/post-job")} className="p-4 rounded-xl bg-nx-violet/10 border border-nx-violet/10 hover:bg-nx-violet/15 transition-colors text-left">
              <Plus className="w-5 h-5 text-nx-violet mb-2" />
              <p className="text-sm font-medium text-white">Post a Job</p>
              <p className="text-[11px] text-white/30">Hire a freelancer</p>
            </button>
            <button onClick={() => navigate("/employer/jobs")} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors text-left">
              <Users className="w-5 h-5 text-white/40 mb-2" />
              <p className="text-sm font-medium text-white">Review Applicants</p>
              <p className="text-[11px] text-white/30">{(stats?.totalTasks || 0) > 0 ? "Manage proposals" : "No jobs yet"}</p>
            </button>
            <button onClick={() => navigate("/employer/projects")} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors text-left">
              <FolderOpen className="w-5 h-5 text-white/40 mb-2" />
              <p className="text-sm font-medium text-white">Projects & Review</p>
              <p className="text-[11px] text-white/30">{completedProjects} completed</p>
            </button>
          </div>

          {/* My Projects */}
          <div className="p-5 rounded-xl border border-white/5 bg-white/[0.02]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">My Projects</h3>
              <button onClick={() => navigate("/employer/projects")} className="text-xs text-nx-violet hover:text-nx-violet/80">
                View all →
              </button>
            </div>
            {allProjects.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="w-8 h-8 text-white/10 mx-auto mb-2" />
                <p className="text-sm text-white/30">No projects yet</p>
                <p className="text-[11px] text-white/15 mt-1">Post a job and hire a writer to start</p>
              </div>
            ) : (
              <div className="space-y-2">
                {allProjects.slice(0, 5).map((proj: any) => (
                  <div key={proj._id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => navigate("/employer/projects")}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${proj.status === "submitted" ? "bg-amber-400/10" : ["active", "revision_requested"].includes(proj.status) ? "bg-nx-violet/10" : proj.status === "completed" ? "bg-nx-emerald/10" : "bg-white/5"}`}>
                      {proj.status === "submitted" ? <Clock className="w-4 h-4 text-amber-400" /> : ["active", "revision_requested"].includes(proj.status) ? <FolderOpen className="w-4 h-4 text-nx-violet" /> : <CheckCircle2 className="w-4 h-4 text-nx-emerald" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{proj.title}</p>
                      <p className="text-[11px] text-white/30">Writer: {proj.freelancerName} • KES {proj.budget?.toLocaleString()}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/40 capitalize shrink-0">{String(proj.status).replace(/_/g, " ")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Job Posts summary */}
          {(myTasks ?? []).length > 0 && (
            <div className="p-5 rounded-xl border border-white/5 bg-white/[0.02]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">My Job Posts</h3>
                <button onClick={() => navigate("/employer/jobs")} className="text-xs text-nx-violet hover:text-nx-violet/80">
                  Manage applicants →
                </button>
              </div>
              <div className="space-y-2">
                {(myTasks ?? []).slice(0, 4).map((t: any) => (
                  <div key={t._id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.02] transition-colors">
                    <FileText className="w-4 h-4 text-white/20 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{t.title}</p>
                      <p className="text-[11px] text-white/30">{t.applicants} applicant{t.applicants === 1 ? "" : "s"} • KES {t.budget?.toLocaleString()}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded shrink-0 ${t.status === "open" ? "bg-nx-emerald/10 text-nx-emerald" : "bg-white/5 text-white/40"}`}>{t.status.replace("_", " ")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
