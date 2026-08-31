import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import {
  Shield,
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Store,
  Scale,
  Brain,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: ArrowLeftRight, label: "Transactions", path: "/dashboard/transactions" },
  { icon: Wallet, label: "Wallet", path: "/dashboard/wallet" },
  { icon: Store, label: "Marketplace", path: "/dashboard/marketplace" },
  { icon: Scale, label: "Disputes", path: "/dashboard/disputes" },
  { icon: Brain, label: "AI Insights", path: "/dashboard/ai-insights" },
  { icon: Settings, label: "Settings", path: "/dashboard/settings" },
];

export default function DashboardSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className={`hidden lg:flex flex-col h-screen sticky top-0 border-r border-white/5 bg-[#08080F] transition-all duration-300 ${
          collapsed ? "w-[72px]" : "w-[240px]"
        }`}
      >
        {/* Logo */}
        <div className={`flex items-center h-16 px-4 border-b border-white/5 ${collapsed ? "justify-center" : "gap-2.5"}`}>
          <Shield className="w-6 h-6 text-nx-violet shrink-0" />
          {!collapsed && (
            <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
              NEXORA<span className="text-nx-violet">.</span>
            </span>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== "/dashboard" && location.pathname.startsWith(item.path));
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group ${
                  isActive
                    ? "bg-nx-violet/10 text-nx-violet"
                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.03]"
                } ${collapsed ? "justify-center" : ""}`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? "text-nx-violet" : "group-hover:text-white/60"}`} />
                {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User section */}
        <div className={`border-t border-white/5 p-3 ${collapsed ? "flex flex-col items-center gap-2" : ""}`}>
          <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
            <div className="w-8 h-8 rounded-full bg-nx-violet/15 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-nx-violet" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{user?.name || "User"}</p>
                <p className="text-[10px] text-white/30 truncate">{user?.email || "guest@nexora.com"}</p>
              </div>
            )}
          </div>

          <button
            onClick={handleSignOut}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/30 hover:text-white/60 hover:bg-white/[0.03] transition-colors mt-2 ${
              collapsed ? "justify-center w-full" : ""
            }`}
          >
            <LogOut className="w-3.5 h-3.5" />
            {!collapsed && "Sign Out"}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-nx-surface border border-white/10 items-center justify-center text-white/30 hover:text-white/60 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </motion.aside>

      {/* Mobile bottom nav */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-[#08080F]/95 backdrop-blur-xl border-t border-white/5">
        <nav className="flex items-center justify-around py-2 px-2">
          {navItems.slice(0, 5).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                  isActive ? "text-nx-violet" : "text-white/30"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px]">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
