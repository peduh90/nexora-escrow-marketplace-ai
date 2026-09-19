import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useSignOutConfirm } from "@/components/SignOutConfirm";
import {
  LayoutDashboard, Package, Plus, ShoppingCart, Shield, MessageSquare,
  TrendingUp, Users, Wallet, Download, Truck, BarChart3, Star,
  Megaphone, BadgeCheck, Store, Bell, Settings, HelpCircle, LogOut,
  ChevronLeft, ChevronRight,
} from "lucide-react";

export default function SellerSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const confirmSignOut = useSignOutConfirm();
  const [collapsed, setCollapsed] = useState(false);

  // Real data from Convex
  const sellerListings = useQuery(api.listings.getSellerListings);

  const listingCount = sellerListings?.length ?? 0;

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/seller" },
    { icon: Package, label: "My Products", path: "/seller/products", badge: listingCount },
    { icon: Plus, label: "Add Product", path: "/seller/add-product" },
    { icon: ShoppingCart, label: "Orders", path: "/seller/orders" },
    { icon: Shield, label: "Escrow", path: "/seller/escrow" },
    { icon: MessageSquare, label: "Messages", path: "/seller/messages" },
    { icon: TrendingUp, label: "Offers", path: "/seller/offers" },
    { icon: Users, label: "Customers", path: "/seller/customers" },
    { icon: Wallet, label: "Wallet", path: "/seller/earnings" },
    { icon: Download, label: "Withdrawals", path: "/seller/withdrawals" },
    { icon: Truck, label: "Delivery", path: "/seller/delivery" },
    { icon: BarChart3, label: "Analytics", path: "/seller/analytics" },
    { icon: Star, label: "Reviews", path: "/seller/reviews" },
    { icon: Megaphone, label: "Promotions", path: "/seller/promotions" },
    { icon: BadgeCheck, label: "Verification", path: "/seller/kyc" },
    { icon: Store, label: "Store Profile", path: "/seller/store" },
    { icon: Bell, label: "Notifications", path: "/seller/notifications" },
    { icon: Settings, label: "Settings", path: "/seller/settings" },
    { icon: HelpCircle, label: "Help & Support", path: "/seller/help" },
  ];

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col h-screen sticky top-0 border-r border-white/5 bg-[#0A0A12] transition-all duration-300 ${collapsed ? "w-[68px]" : "w-[220px]"}`}>
        {/* Logo */}
        <div className={`h-16 flex items-center px-4 border-b border-white/5 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-lg bg-nx-violet/20 flex items-center justify-center shrink-0">
            <Store className="w-4 h-4 text-nx-violet" />
          </div>
          {!collapsed && <span className="ml-2 text-sm font-bold text-white">NEXORA<span className="text-nx-violet">.</span></span>}
          <button onClick={() => setCollapsed(!collapsed)} className={`p-1 rounded hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors ${collapsed ? "mt-2 mx-auto" : "ml-auto"}`}>
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Seller badge */}
        {!collapsed && (
          <div className="px-3 py-2 border-b border-white/5">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-nx-violet/5 border border-nx-violet/10">
              {user?.image ? (
                <img src={user.image} alt="" className="w-6 h-6 rounded-full object-cover shrink-0 border border-nx-violet/20" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-nx-violet/15 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-nx-violet">{(user?.name || "S").charAt(0).toUpperCase()}</span>
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-nx-violet truncate">{user?.businessName || user?.name || "Seller"}</p>
                <p className="text-[9px] text-white/30 truncate">{user?.kycStatus === "verified" ? "✓ Verified" : "Seller"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-2 px-1.5 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = item.path === "/seller" ? location.pathname === item.path : location.pathname.startsWith(item.path);
            return (
              <button key={item.path} onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all group ${isActive ? "bg-nx-violet/10 text-nx-violet" : "text-white/35 hover:text-white/60 hover:bg-white/[0.03]"} ${collapsed ? "justify-center" : ""}`}
                title={collapsed ? item.label : undefined}>
                <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-nx-violet" : "text-white/25 group-hover:text-white/40"}`} />
                {!collapsed && <span className="truncate flex-1 text-left">{item.label}</span>}
                {!collapsed && "badge" in item && item.badge != null && item.badge > 0 && (
                  <span className="w-5 h-5 rounded-full bg-nx-violet/20 text-nx-violet text-[9px] font-bold flex items-center justify-center shrink-0">{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-2 border-t border-white/5 space-y-0.5">
          <button onClick={confirmSignOut} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-white/25 hover:text-white/50 hover:bg-white/[0.03] transition-colors">
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Tablet bottom nav (md–lg). Phones (<md) use the global mobile
          shell's tab bar + Account sheet, which contains every panel page —
          a second bar here overlapped it and double-owned navigation. */}
      <div className="hidden md:flex lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0A0A12]/95 backdrop-blur-xl border-t border-white/5">
        <nav className="flex items-center justify-around py-1.5 px-1 w-full">
          {[
            { icon: LayoutDashboard, label: "Dashboard", path: "/seller" },
            { icon: ShoppingCart, label: "Orders", path: "/seller/orders" },
            { icon: Plus, label: "Add", path: "/seller/add-product", special: true },
            { icon: MessageSquare, label: "Messages", path: "/seller/messages" },
            { icon: Wallet, label: "Wallet", path: "/seller/earnings" },
          ].map((item) => {
            const isActive = item.path === "/seller" ? location.pathname === item.path : location.pathname.startsWith(item.path);
            return (
              <button key={item.path} onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${item.special ? "-mt-4" : ""} ${isActive ? "text-nx-violet" : "text-white/30"}`}>
                {item.special ? (
                  <div className="w-10 h-10 rounded-full bg-nx-violet flex items-center justify-center -mb-1">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                ) : (
                  <item.icon className="w-5 h-5" />
                )}
                <span className="text-[9px]">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
