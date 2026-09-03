import { useLocation, useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import SellerSidebar from "./SellerSidebar";
import { Bell, Search, Wallet, ChevronDown, Home } from "lucide-react";
import AIChat from "@/components/AIChat";

const navLabels: Record<string, string> = {
  "/seller": "Dashboard",
  "/seller/products": "My Products",
  "/seller/add-product": "Add Product",
  "/seller/orders": "Orders",
  "/seller/escrow": "Escrow",
  "/seller/messages": "Messages",
  "/seller/offers": "Offers",
  "/seller/customers": "Customers",
  "/seller/earnings": "Wallet",
  "/seller/withdrawals": "Withdrawals",
  "/seller/delivery": "Delivery",
  "/seller/analytics": "Analytics",
  "/seller/reviews": "Reviews",
  "/seller/promotions": "Promotions",
  "/seller/kyc": "Verification",
  "/seller/store": "Store Profile",
  "/seller/notifications": "Notifications",
  "/seller/settings": "Settings",
  "/seller/help": "Help & Support",
};

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user } = useAuth();
  const walletData = useQuery(api.wallet.getWalletBalance);
  const balance = walletData?.walletBalance ?? 0;

  const getPageLabel = () => {
    for (const [path, label] of Object.entries(navLabels)) {
      if (path === "/seller" ? location.pathname === path : location.pathname.startsWith(path)) {
        return label;
      }
    }
    return "Seller Panel";
  };

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#05050A] flex">
      <SellerSidebar />

      <div className="flex-1 min-w-0 lg:ml-0">
        {/* Top bar */}
        <header className="h-14 border-b border-white/5 bg-[#0A0A12]/80 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/")} className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors shrink-0" title="Back to Home">
              <Home className="w-4 h-4" />
            </button>
            <h1 className="text-sm font-semibold text-white hidden sm:block">{getPageLabel()}</h1>
            {/* Search */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 w-64">
              <Search className="w-3.5 h-3.5 text-white/20" />
              <input type="text" placeholder="Search..." className="bg-transparent text-xs text-white placeholder:text-white/20 focus:outline-none flex-1" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Wallet balance */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-400/5 border border-emerald-400/10">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">KSh {balance.toLocaleString()}</span>
            </div>
            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/70 transition-colors">
              <Bell className="w-4 h-4" />
            </button>
            {/* Profile */}
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
              {user?.image ? (
                <img src={user.image} alt="" className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-nx-violet/20 flex items-center justify-center text-nx-violet text-xs font-bold">
                  {(user?.businessName || user?.name || user?.email || "S")[0]?.toUpperCase()}
                </div>
              )}
              <div className="hidden md:block">
                <p className="text-xs font-medium text-white">{user?.businessName || user?.name || user?.email?.split("@")[0] || "Seller"}</p>
                <p className="text-[9px] text-white/30">{user?.kycStatus === "verified" ? "✓ Verified Seller" : "Seller"}</p>
              </div>
              <ChevronDown className="w-3 h-3 text-white/20 hidden md:block" />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6 pb-20 lg:pb-6">{children}        </main>
      </div>
      <AIChat panel="seller" />
    </div>
  );
}
