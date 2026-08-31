import { NavLink, useLocation } from "react-router";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  MessageSquare,
  Wallet,
  ShieldCheck,
  Settings,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bell,
  Store,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/seller", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/seller/products", icon: Package, label: "My Products" },
  { to: "/seller/orders", icon: ShoppingCart, label: "Orders" },
  { to: "/seller/messages", icon: MessageSquare, label: "Messages" },
  { to: "/seller/earnings", icon: Wallet, label: "Earnings" },
  { to: "/seller/kyc", icon: ShieldCheck, label: "KYC Verification" },
  { to: "/seller/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/seller/settings", icon: Settings, label: "Settings" },
];

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#05050A] flex">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full z-40 flex flex-col border-r border-white/5 bg-[#0A0A12] transition-all duration-300 ${
          collapsed ? "w-[68px]" : "w-[240px]"
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-white/5">
          <Store className="w-6 h-6 text-nx-violet shrink-0" />
          {!collapsed && (
            <span className="ml-2 text-sm font-bold tracking-tight text-white">
              NEXORA<span className="text-nx-violet">.</span>
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto p-1 rounded hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors hidden md:block"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Seller badge */}
        {!collapsed && (
          <div className="px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-nx-violet/10 flex items-center justify-center text-nx-violet text-xs font-bold">
                S
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-white truncate">Seller Panel</p>
                <p className="text-[10px] text-white/30 truncate">Manage your store</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group ${
                  isActive
                    ? "bg-nx-violet/10 text-nx-violet"
                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.03]"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? "text-nx-violet" : "text-white/30 group-hover:text-white/50"}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-2 border-t border-white/5">
          {!collapsed && (
            <div className="px-3 py-2 mb-2 rounded-lg bg-nx-violet/5 border border-nx-violet/10">
              <p className="text-[10px] text-nx-violet/70 font-medium">SELLER TIER</p>
              <p className="text-xs text-white/60 mt-0.5">Free • 5% commission</p>
            </div>
          )}
          <NavLink
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/30 hover:text-white/60 hover:bg-white/[0.03] transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Back to Home</span>}
          </NavLink>
        </div>
      </aside>

      {/* Main content */}
      <main className={`flex-1 transition-all duration-300 ${collapsed ? "ml-[68px]" : "ml-[240px]"}`}>
        {/* Top bar */}
        <header className="h-16 border-b border-white/5 bg-[#0A0A12]/80 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between px-6">
          <div>
            <h1 className="text-sm font-semibold text-white">
              {navItems.find((n) =>
                n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)
              )?.label || "Seller Panel"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/70 transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-nx-violet" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-nx-violet/10 flex items-center justify-center text-nx-violet text-xs font-bold">
              S
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
