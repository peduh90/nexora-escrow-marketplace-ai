import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import AIChat from "@/components/AIChat";
import {
  Shield, LayoutDashboard, Users, ShoppingCart, FileCheck, Scale,
  Brain, BarChart3, Settings, LogOut, ChevronLeft, ChevronRight,
  User, Truck, Briefcase, Activity, Globe, Wallet, Bell,
  Search, Package, CreditCard, MessageSquare, AlertTriangle,
  MapPin, Receipt, TrendingUp, X, Menu, Eye,
} from "lucide-react";

const navSections = [
  {
    label: "OVERVIEW",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
    ],
  },
  {
    label: "USERS",
    items: [
      { icon: Users, label: "All Users", path: "/admin/users" },
      { icon: User, label: "Buyers", path: "/admin/buyers" },
      { icon: Briefcase, label: "Sellers", path: "/admin/sellers" },
      { icon: FileCheck, label: "Verification", path: "/admin/kyc" },
    ],
  },
  {
    label: "MARKETPLACE",
    items: [
      { icon: Package, label: "Products", path: "/admin/products" },
      { icon: ShoppingCart, label: "Orders", path: "/admin/orders" },
      { icon: MessageSquare, label: "Messages", path: "/admin/messages" },
      { icon: Scale, label: "Reviews", path: "/admin/reviews" },
    ],
  },
  {
    label: "FINANCES",
    items: [
      { icon: CreditCard, label: "Payments", path: "/admin/payments" },
      { icon: Shield, label: "Escrow", path: "/admin/escrow" },
      { icon: Wallet, label: "Wallets", path: "/admin/wallets" },
      { icon: Receipt, label: "Withdrawals", path: "/admin/withdrawals" },
      { icon: TrendingUp, label: "Revenue", path: "/admin/revenue" },
    ],
  },
  {
    label: "DELIVERY",
    items: [
      { icon: Truck, label: "Deliveries", path: "/admin/deliveries" },
      { icon: MapPin, label: "Zones & Fees", path: "/admin/zones" },
    ],
  },
  {
    label: "SECURITY",
    items: [
      { icon: Brain, label: "AI & Fraud", path: "/admin/fraud" },
      { icon: Scale, label: "Disputes", path: "/admin/disputes" },
      { icon: AlertTriangle, label: "Reports", path: "/admin/reports" },
    ],
  },
  {
    label: "PLATFORM",
    items: [
      { icon: Briefcase, label: "Job Board", path: "/admin/jobs" },
      { icon: BarChart3, label: "Analytics", path: "/admin/analytics" },
      { icon: Activity, label: "System Health", path: "/admin/system" },
      { icon: Bell, label: "Notifications", path: "/admin/notifications" },
      { icon: Settings, label: "Settings", path: "/admin/settings" },
      { icon: Eye, label: "Audit Logs", path: "/admin/audit-logs" },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#050508]">
      {/* Desktop Sidebar */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={`hidden lg:flex flex-col h-screen sticky top-0 border-r border-white/5 bg-[#08080F] transition-all duration-300 ${collapsed ? "w-[72px]" : "w-[256px]"}`}
      >
        {/* Logo */}
        <div className={`flex items-center h-14 px-4 border-b border-white/5 ${collapsed ? "justify-center" : "gap-2.5"}`}>
          <Shield className="w-6 h-6 text-nx-violet shrink-0" />
          {!collapsed && <span className="text-base font-bold text-white">NEXORA<span className="text-nx-violet">.</span></span>}
        </div>

        {/* Admin badge */}
        <div className={`mx-3 mt-3 mb-1 px-3 py-1.5 rounded-lg bg-nx-gold/10 text-nx-gold text-[10px] font-medium tracking-wider uppercase ${collapsed ? "text-center" : ""}`}>
          {collapsed ? "A" : "ADMIN CONTROL CENTER"}
        </div>

        {/* Nav sections */}
        <nav className="flex-1 py-2 px-2 space-y-3 overflow-y-auto scrollbar-thin">
          {navSections.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <p className="px-3 mb-1 text-[9px] font-bold text-white/15 tracking-widest uppercase">
                  {section.label}
                </p>
              )}
              {section.items.map((item) => {
                const isActive = location.pathname === item.path || (item.path !== "/admin" && location.pathname.startsWith(item.path));
                return (
                  <button
                    key={item.path}
                    onClick={() => { navigate(item.path); setMobileOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all group ${isActive ? "bg-nx-gold/10 text-nx-gold" : "text-white/35 hover:text-white/70 hover:bg-white/[0.03]"} ${collapsed ? "justify-center" : ""}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-nx-gold" : "group-hover:text-white/50"}`} />
                    {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}

                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Collapse toggle */}
        <div className="border-t border-white/5 p-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/[0.03] text-xs transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
          </button>
        </div>

        {/* Logout */}
        <div className="border-t border-white/5 p-2">
          <button
            onClick={() => signOut()}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-white/25 hover:text-red-400 hover:bg-red-400/5 transition-colors ${collapsed ? "justify-center" : ""}`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-[280px] bg-[#08080F] border-r border-white/5 lg:hidden overflow-y-auto"
            >
              <div className="flex items-center justify-between h-14 px-4 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <Shield className="w-6 h-6 text-nx-violet" />
                  <span className="text-base font-bold text-white">NEXORA<span className="text-nx-violet">.</span></span>
                </div>
                <button onClick={() => setMobileOpen(false)} className="text-white/30 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mx-3 mt-3 mb-1 px-3 py-1.5 rounded-lg bg-nx-gold/10 text-nx-gold text-[10px] font-medium tracking-wider uppercase text-center">
                ADMIN CONTROL CENTER
              </div>
              <nav className="py-3 px-2 space-y-3">
                {navSections.map((section) => (
                  <div key={section.label}>
                    <p className="px-3 mb-1 text-[9px] font-bold text-white/15 tracking-widest uppercase">{section.label}</p>
                    {section.items.map((item) => {
                      const isActive = location.pathname === item.path || (item.path !== "/admin" && location.pathname.startsWith(item.path));
                      return (
                        <button
                          key={item.path}
                          onClick={() => { navigate(item.path); setMobileOpen(false); }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all ${isActive ? "bg-nx-gold/10 text-nx-gold" : "text-white/35 hover:text-white/70 hover:bg-white/[0.03]"}`}
                        >
                          <item.icon className="w-4 h-4 shrink-0" />
                          <span className="whitespace-nowrap">{item.label}</span>

                        </button>
                      );
                    })}
                  </div>
                ))}
              </nav>
              <div className="border-t border-white/5 p-2 mt-2">
                <button onClick={() => signOut()} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-white/25 hover:text-red-400 hover:bg-red-400/5 transition-colors">
                  <LogOut className="w-4 h-4" /><span>Logout</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        {/* Top Bar */}
        <div className="sticky top-0 z-30 h-14 bg-[#08080F]/80 backdrop-blur-xl border-b border-white/5 flex items-center px-4 md:px-6 justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden text-white/30 hover:text-white">
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-sm font-semibold text-white hidden sm:block">Admin Control Center</h2>
          </div>

          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
              <input
                placeholder="Search users, products, orders..."
                className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-xs text-white placeholder-white/20 focus:border-nx-violet/30 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-nx-emerald bg-nx-emerald/10 px-2 py-0.5 rounded-full font-medium hidden sm:inline">● System Healthy</span>

            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.03] transition-colors"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
              </button>
            </div>

            <div className="flex items-center gap-2 pl-2 border-l border-white/5">
              <div className="w-7 h-7 rounded-full bg-nx-gold/15 flex items-center justify-center">
                <span className="text-[10px] font-bold text-nx-gold">{(user?.name || user?.email || "A").slice(0, 2).toUpperCase()}</span>
              </div>
              <div className="hidden md:block">
                <p className="text-[11px] font-medium text-white/70">{user?.name || "Admin"}</p>
                <p className="text-[9px] text-white/25">{user?.email || ""}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
      <AIChat panel="admin" />
    </div>
  );
}
