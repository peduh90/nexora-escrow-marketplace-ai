import { NavLink, useLocation } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  ShoppingBag,
  ShoppingCart,
  Wallet,
  Shield,
  LogOut,
  Bell,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react";
import { useState } from "react";
import AIChat from "@/components/AIChat";

const navItems = [
  { to: "/buyer", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/marketplace", icon: ShoppingBag, label: "Marketplace" },
  { to: "/buyer/orders", icon: ShoppingCart, label: "My Orders" },
  { to: "/buyer/wallet", icon: Wallet, label: "Wallet" },
  { to: "/buyer/disputes", icon: Shield, label: "Disputes" },
  { to: "/buyer/profile", icon: User, label: "My Profile" },
];

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#05050A] flex">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full z-40 flex flex-col border-r border-white/5 bg-[#0A0A12] transition-all duration-300 ${
          collapsed ? "w-[68px]" : "w-[220px]"
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-white/5">
          <Shield className="w-6 h-6 text-nx-cyan shrink-0" />
          {!collapsed && (
            <span className="ml-2 text-sm font-bold tracking-tight text-white">
              NEXORA<span className="text-nx-cyan">.</span>
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto p-1 rounded hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors hidden md:block"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Buyer badge */}
        {!collapsed && (
          <div className="px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              {user?.image ? (
                <img src={user.image} alt="" className="w-8 h-8 rounded-lg object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-nx-cyan/10 flex items-center justify-center text-nx-cyan text-xs font-bold">
                  {(user?.name || user?.email || "B")[0]?.toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-medium text-white truncate">{user?.name || user?.email?.split("@")[0] || "Buyer"}</p>
                <p className="text-[10px] text-white/30 truncate">{user?.kycStatus === "verified" ? "✓ Verified" : "Shop securely"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-0.5">
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
                    ? "bg-nx-cyan/10 text-nx-cyan"
                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.03]"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? "text-nx-cyan" : "text-white/30 group-hover:text-white/50"}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-2 border-t border-white/5">
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
      <main className={`flex-1 transition-all duration-300 ${collapsed ? "ml-[68px]" : "ml-[220px]"}`}>
        {/* Top bar */}
        <header className="h-16 border-b border-white/5 bg-[#0A0A12]/80 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between px-6">
          <div>
            <h1 className="text-sm font-semibold text-white">
              {navItems.find((n) =>
                n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)
              )?.label || "Buyer"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/70 transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-nx-cyan" />
            </button>
            <div className="flex items-center gap-2">
              {user?.image ? (
                <img src={user.image} alt="" className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-nx-cyan/10 flex items-center justify-center text-nx-cyan text-xs font-bold">
                  {(user?.name || user?.email || "B")[0]?.toUpperCase()}
                </div>
              )}
              <div className="hidden md:block">
                <p className="text-xs font-medium text-white">{user?.name || user?.email?.split("@")[0] || "Buyer"}</p>
                <p className="text-[9px] text-white/30">{user?.kycStatus === "verified" ? "✓ Verified" : "Buyer"}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-6">{children}</div>
      </main>
      {/* AI Assistant */}
      <AIChat panel="buyer" />
    </div>
  );
}
