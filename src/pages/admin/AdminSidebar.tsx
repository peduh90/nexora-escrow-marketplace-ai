import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import {
  Shield, LayoutDashboard, Users, ShoppingCart, Scale,
  Brain, BarChart3, Settings, LogOut, ChevronLeft, ChevronRight,
  User, Truck, Briefcase, Activity, Wallet, Bell,
  Package, CreditCard, MessageSquare, AlertTriangle,
  MapPin, Receipt, TrendingUp, Eye, Globe, FileText,
  Megaphone, Hash, Store, RefreshCw, Cpu,
  MessageCircle, Crown, Zap, FileCheck, AlertOctagon,
} from "lucide-react";

const navSections = [
  { label: "OWNER CONTROL", items: [
    { icon: Crown, label: "Owner Command Center", path: "/admin/owner" },
    { icon: Zap, label: "AI Automation", path: "/admin/ai" },
    { icon: AlertOctagon, label: "Emergency AI", path: "/admin/owner" },
  ]},
  { label: "OVERVIEW", items: [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  ]},
  { label: "USERS", items: [
    { icon: Users, label: "All Users", path: "/admin/users" },
    { icon: User, label: "Buyers", path: "/admin/buyers" },
    { icon: Briefcase, label: "Sellers", path: "/admin/sellers" },
    { icon: Eye, label: "Verification", path: "/admin/kyc" },
  ]},
  { label: "MARKETPLACE", items: [
    { icon: Package, label: "Products", path: "/admin/products" },
    { icon: Hash, label: "Categories", path: "/admin/categories" },
    { icon: MessageSquare, label: "Messages", path: "/admin/messages" },
    { icon: Scale, label: "Reviews", path: "/admin/reviews" },
  ]},
  { label: "ORDERS & PAYMENTS", items: [
    { icon: ShoppingCart, label: "Orders", path: "/admin/orders" },
    { icon: CreditCard, label: "Payments", path: "/admin/payments" },
    { icon: Wallet, label: "Wallets", path: "/admin/wallets" },
    { icon: Receipt, label: "Withdrawals", path: "/admin/withdrawals" },
    { icon: TrendingUp, label: "Revenue", path: "/admin/revenue" },
  ]},
  { label: "ESCROW", items: [
    { icon: Shield, label: "Active Escrows", path: "/admin/escrow" },
    { icon: Scale, label: "Disputes", path: "/admin/disputes" },
  ]},
  { label: "DELIVERY", items: [
    { icon: Truck, label: "Deliveries", path: "/admin/deliveries" },
  ]},
  { label: "AI OPERATIONS", items: [
    { icon: Brain, label: "AI Control Center", path: "/admin/ai-operations" },
    { icon: Cpu, label: "AI Fraud Detection", path: "/admin/fraud" },
    { icon: FileCheck, label: "AI Audit Log", path: "/admin/audit-logs" },
  ]},
  { label: "COMMUNICATION", items: [
    { icon: MessageCircle, label: "WhatsApp", path: "/admin/whatsapp" },
    { icon: Bell, label: "Notifications", path: "/admin/notifications" },
  ]},
  { label: "SYSTEM", items: [
    { icon: Activity, label: "System Health", path: "/admin/system" },
    { icon: RefreshCw, label: "Audit Logs", path: "/admin/audit-logs" },
    { icon: Settings, label: "Settings", path: "/admin/settings" },
  ]},
];

export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const adminRole = (user as any)?.adminRole || "super_admin";
  const roleLabel = adminRole === "super_admin" ? "Super Admin"
    : adminRole === "marketplace_admin" ? "Marketplace Admin"
    : adminRole === "finance_admin" ? "Finance Admin"
    : "Admin";

  return (
    <>
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={`hidden lg:flex flex-col h-screen sticky top-0 border-r border-white/5 bg-[#08080F] transition-all duration-300 ${collapsed ? "w-[72px]" : "w-[240px]"}`}
      >
        <div className={`flex items-center h-16 px-4 border-b border-white/5 ${collapsed ? "justify-center" : "gap-2.5"}`}>
          <Shield className="w-6 h-6 text-nx-violet shrink-0" />
          {!collapsed && <span className="text-base font-bold text-white">NEXORA<span className="text-nx-violet">.</span></span>}
        </div>

        <div className={`mx-3 mt-3 mb-1 px-3 py-1.5 rounded-lg bg-nx-gold/10 text-nx-gold text-[10px] font-medium tracking-wider uppercase ${collapsed ? "text-center" : ""}`}>
          {collapsed ? "A" : roleLabel.toUpperCase()}
        </div>

        <nav className="flex-1 py-2 px-1.5 space-y-2.5 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <p className="px-3 mb-1 text-[9px] font-bold text-white/15 tracking-widest uppercase">
                  {section.label}
                </p>
              )}
              {section.items.map((item) => {
                const isActive = item.path === "/admin"
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-all group ${
                      isActive
                        ? "bg-nx-gold/10 text-nx-gold"
                        : "text-white/35 hover:text-white/70 hover:bg-white/[0.03]"
                    } ${collapsed ? "justify-center" : ""}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-nx-gold" : "text-white/25 group-hover:text-white/40"}`} />
                    {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className={`border-t border-white/5 p-3 ${collapsed ? "flex flex-col items-center" : ""}`}>
          <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
            <div className="w-8 h-8 rounded-full bg-nx-gold/15 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-nx-gold" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{user?.name || "Admin"}</p>
                <p className="text-[10px] text-white/30 truncate">{roleLabel}</p>
              </div>
            )}
          </div>
          <button onClick={async () => { await signOut(); navigate("/"); }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/30 hover:text-white/60 hover:bg-white/[0.03] transition-colors mt-2 ${collapsed ? "justify-center w-full" : ""}`}>
            <LogOut className="w-3.5 h-3.5" /> {!collapsed && "Sign Out"}
          </button>
        </div>

        <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-nx-surface border border-white/10 items-center justify-center text-white/30 hover:text-white/60 transition-colors">
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </motion.aside>

      <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-[#08080F]/95 backdrop-blur-xl border-t border-white/5">
        <nav className="flex items-center justify-around py-2 px-2 overflow-x-auto">
          {[
            { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
            { icon: Package, label: "Products", path: "/admin/products" },
            { icon: ShoppingCart, label: "Orders", path: "/admin/orders" },
            { icon: Users, label: "Users", path: "/admin/users" },
            { icon: Settings, label: "Settings", path: "/admin/settings" },
          ].map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button key={item.path} onClick={() => navigate(item.path)} className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-colors ${isActive ? "text-nx-gold" : "text-white/30"}`}>
                <item.icon className="w-5 h-5" />
                <span className="text-[9px]">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
