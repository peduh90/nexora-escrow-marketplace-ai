import { useLocation, useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Home, Search, PlusCircle, MessageSquare, User } from "lucide-react";

export default function MobileBottomNav() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const unreadCount = useQuery(
    api.messages.getUnreadCount
  );

  // Hide on landing, auth, admin pages
  const hideOn = ["/", "/auth", "/privacy", "/terms"];
  const isAdminRoute = location.pathname.startsWith("/admin");
  if (hideOn.includes(location.pathname) || isAdminRoute) return null;

  const tabs = [
    { icon: Home, label: "Home", path: "/marketplace" },
    { icon: Search, label: "Search", path: "/marketplace" },
    { icon: PlusCircle, label: "Sell", path: user?.role === "seller" ? "/seller/add-product" : "/auth?returnTo=/seller" },
    { icon: MessageSquare, label: "Messages", path: "/chat" },
    { icon: User, label: "Profile", path: user?.role === "seller" ? "/seller" : user?.role === "admin" ? "/admin" : "/buyer" },
  ];

  const isActive = (path: string) => {
    if (path === "/marketplace" && location.pathname.startsWith("/marketplace")) return true;
    if (path === "/chat" && location.pathname.startsWith("/chat")) return true;
    if (path === "/seller" && location.pathname.startsWith("/seller")) return true;
    if (path === "/buyer" && location.pathname.startsWith("/buyer")) return true;
    if (path === "/admin" && location.pathname.startsWith("/admin")) return true;
    return location.pathname === path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-nx-card/95 backdrop-blur-xl border-t border-nx-border safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-1">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          return (
            <button
              key={tab.label}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-lg transition-colors relative"
            >
              <tab.icon
                className={`w-5 h-5 transition-colors ${
                  active ? "text-nx-violet" : "text-white/30"
                }`}
              />
              <span
                className={`text-[9px] font-medium transition-colors ${
                  active ? "text-nx-violet" : "text-white/30"
                }`}
              >
                {tab.label}
              </span>
              {/* Notification badge */}
              {tab.label === "Messages" && unreadCount && unreadCount > 0 && (
                <span className="absolute -top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                  <span className="text-[8px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
