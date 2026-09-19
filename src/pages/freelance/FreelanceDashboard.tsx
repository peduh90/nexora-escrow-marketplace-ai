import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useSignOutConfirm } from "@/components/SignOutConfirm";
import AIChat from "@/components/AIChat";
import { getWhatsAppSupportUrl, openWhatsApp } from "@/lib/whatsapp";
import {
  Shield, LayoutDashboard, Search, Briefcase, FolderOpen, Users,
  Wallet, Settings, LogOut, ChevronLeft, ChevronRight, PenTool,
  MessageSquare, Star, FileText, TrendingUp, Bell, Home,
  ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, Loader2, Phone,
} from "lucide-react";

// Writer/Freelancer navigation — deliberately NO "Post a Task" item. Posting
// jobs is an Employer privilege and lives only in the Employer panel.
const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/freelance/dashboard" },
  { icon: Search, label: "Find Work", path: "/freelance/find-work" },
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
  const { user } = useAuth();
  const confirmSignOut = useSignOutConfirm();
  const [collapsed, setCollapsed] = useState(false);

  // Legacy repair: some accounts created by the old signup flow carry the
  // wrong account role (e.g. employers saved as freelancers). The verified
  // freelance profile roleMode is authoritative — align once per mount.
  const syncProfileRole = useMutation(api.freelance.syncProfileRole);
  const repairFired = useRef(false);
  useEffect(() => {
    if (!repairFired.current) {
      repairFired.current = true;
      void syncProfileRole().catch(() => {});
    }
  }, [syncProfileRole]);

  const profile = useQuery(api.freelance.getMyProfile);
  const stats = useQuery(api.freelance.getFreelanceStats);
  const projects = useQuery(api.freelance.getMyProjects);
  const walletBalance = useQuery(api.wallet.getWalletBalance);
  // Real unread notifications for the bell badge.
  const unreadNotifications = useQuery(api.reviews.getUnreadCount);

  const allProjects = projects ?? [];
  const activeProjects = allProjects.filter((p: any) =>
    ["active", "revision_requested"].includes(p.status)
  );
  const awaitingReview = allProjects.filter((p: any) => p.status === "submitted").length;

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

        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {sidebarItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== "/freelance/dashboard" && location.pathname.startsWith(item.path));
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
                <p className="text-[10px] text-white/30 truncate">Writer / Freelancer</p>
              </div>
            )}
          </div>
          <button onClick={confirmSignOut}
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
        {/* Header — phones (<md) get their contextual header from the global
            mobile shell, so this panel header only shows md and up. */}
        <div className="hidden md:flex sticky top-0 z-30 h-14 bg-[#08080F]/80 backdrop-blur-xl border-b border-white/5 items-center px-4 md:px-6 justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/marketplace")} className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors" title="Back to Marketplace">
              <Home className="w-4 h-4" />
            </button>
            <h1 className="text-sm font-semibold text-white">Freelance Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/freelance/notifications")}
              className="relative p-2 rounded-lg hover:bg-white/[0.03] transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4 text-white/40" />
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
          {/* Welcome — this is the WRITER dashboard. Employers have their own
              dashboard at /employer and never land here. */}
          <div>
            <h1 className="text-2xl font-bold text-white">✍️ Writer Dashboard</h1>
            <p className="text-sm text-white/40 mt-1">
              Welcome back, {user?.name || "there"}. Here's your freelance overview.
            </p>
          </div>

          {/* Role mismatch notice: an employer account opening the writer
              dashboard gets pointed to their own panel. */}
          {user?.role === "employer" && (
            <div className="p-4 rounded-xl bg-amber-400/5 border border-amber-400/10 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white">You're signed in as an Employer</p>
                <p className="text-xs text-white/40 mt-0.5">Job posting, hiring, and reviews live in your Employer Dashboard.</p>
              </div>
              <button onClick={() => navigate("/employer")}
                className="shrink-0 px-4 py-2 rounded-lg bg-amber-400/10 text-amber-400 text-xs font-semibold hover:bg-amber-400/20 transition-colors">
                Go to Employer Dashboard →
              </button>
            </div>
          )}

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
            {[
              { label: "Active Projects", value: activeProjects.length, icon: FolderOpen, color: "#8B5CF6" },
              { label: "Awaiting Review", value: awaitingReview, icon: Clock, color: "#F59E0B" },
              { label: "Applications", value: stats?.totalApplications || 0, icon: FileText, color: "#06B6D4" },
              { label: "Total Earned", value: `KES ${(profile?.totalEarnings || 0).toLocaleString()}`, icon: Wallet, color: "#10B981" },
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                <p className="text-[11px] text-white/15 mt-1">Apply to tasks to start your first project</p>
              </div>
            ) : (
              <div className="space-y-2">
                {allProjects.slice(0, 5).map((proj: any) => (
                  <div key={proj._id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => navigate("/freelance/projects")}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${proj.status === "submitted" ? "bg-nx-gold/10" : ["active", "revision_requested"].includes(proj.status) ? "bg-nx-violet/10" : proj.status === "completed" ? "bg-nx-emerald/10" : "bg-white/5"}`}>
                      {proj.status === "submitted" ? <Clock className="w-4 h-4 text-nx-gold" /> : ["active", "revision_requested"].includes(proj.status) ? <Clock className="w-4 h-4 text-nx-violet" /> : <CheckCircle2 className="w-4 h-4 text-nx-emerald" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{proj.title}</p>
                      <p className="text-[11px] text-white/30">
                        {proj.isFreelancer ? `Employer: ${proj.employerName}` : `Freelancer: ${proj.freelancerName}`} • {proj.progress}% complete
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium text-white">KES {proj.budget.toLocaleString()}</p>
                      <p className="text-[10px] text-white/20 capitalize">{String(proj.status).replace(/_/g, " ")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* WhatsApp human support — pairs with the AI dock above it */}
      <a
        href={getWhatsAppSupportUrl("Hello Nexora Support 👋 I am a freelancer and need help.")}
        onClick={(e) => {
          e.preventDefault();
          openWhatsApp(getWhatsAppSupportUrl("Hello Nexora Support 👋 I am a freelancer and need help."));
        }}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center shadow-2xl hover:scale-110 transition-all duration-300 hover:shadow-[0_0_20px_rgba(37,211,102,0.4)]"
        title="Contact Nexora Support via WhatsApp"
        aria-label="WhatsApp support"
      >
        <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </a>
      <AIChat panel="freelance" />
    </div>
  );
}
