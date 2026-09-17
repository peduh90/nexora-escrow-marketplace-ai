import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import AIChat from "@/components/AIChat";
import {
  Shield, LayoutDashboard, Users, ShoppingCart, Scale,
  Brain, BarChart3, Settings, LogOut, ChevronLeft, ChevronRight, ChevronDown,
  Truck, Briefcase, Activity, Wallet, Bell,
  Search, Package, CreditCard, MessageSquare, AlertTriangle,
  Receipt, TrendingUp, X, Menu, Crown, Home, Share2, MapPin,
  Percent, Database, ClipboardCheck, Send, UserCheck, Banknote,
} from "lucide-react";

/**
 * ─── NEXORA ADMIN CONTROL CENTER ───────────────────────────────────────────
 * SaaS-style shell: the sidebar and topbar are fixed; ONLY the main content
 * area scrolls. Every menu item is an independent route — content replaces,
 * it never stacks. Groups are collapsible and persist during the session.
 */

type NavItem = { icon: any; label: string; path: string; desc?: string; countKey?: "sellers" };
type NavGroup = { id: string; label: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    id: "overview",
    label: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/admin", desc: "Live platform overview" },
      { icon: BarChart3, label: "Analytics", path: "/admin/analytics", desc: "Trends & insights" },
      { icon: Home, label: "Home", path: "/", desc: "Go to the public marketplace" },
    ],
  },
  {
    id: "people",
    label: "People",
    items: [
      { icon: Users, label: "All Users", path: "/admin/users", desc: "Every account" },
      { icon: ClipboardCheck, label: "Verification (KYC)", path: "/admin/kyc", desc: "Identity reviews" },
      { icon: UserCheck, label: "Sellers", path: "/admin/sellers", desc: "Marketplace merchants", countKey: "sellers" },
      { icon: Share2, label: "Creator Program", path: "/admin/referrals", desc: "Referrals & agreements" },
    ],
  },
  {
    id: "marketplace",
    label: "Marketplace",
    items: [
      { icon: Package, label: "Products", path: "/admin/products", desc: "Listings & moderation" },
      { icon: ShoppingCart, label: "Orders", path: "/admin/orders", desc: "Buyer–seller orders" },
      { icon: MessageSquare, label: "Messages", path: "/admin/messages", desc: "Chat oversight" },
      { icon: Scale, label: "Reviews", path: "/admin/reviews", desc: "Ratings & trust" },
    ],
  },
  {
    id: "freelance",
    label: "Freelance",
    items: [
      { icon: Briefcase, label: "Freelancers", path: "/admin/freelancers", desc: "Talent profiles" },
      { icon: Briefcase, label: "Jobs & Projects", path: "/admin/jobs", desc: "Job board & escrow" },
    ],
  },
  {
    id: "transport",
    label: "Transport & Delivery",
    items: [
      { icon: Truck, label: "Deliveries", path: "/admin/deliveries", desc: "Parcel logistics" },
      { icon: MapPin, label: "Local Services", path: "/admin/services", desc: "Fundis & providers" },
    ],
  },
  {
    id: "money",
    label: "Money",
    items: [
      { icon: Percent, label: "Fees & Commissions", path: "/admin/fees", desc: "Fee engine control" },
      { icon: Banknote, label: "Owner Payouts", path: "/admin/fees?tab=payouts", desc: "Withdraw system earnings" },
      { icon: CreditCard, label: "Payments", path: "/admin/payments", desc: "M-Pesa & wallet flows" },
      { icon: Shield, label: "Escrow", path: "/admin/escrow", desc: "Held funds" },
      { icon: Wallet, label: "Wallets", path: "/admin/wallets", desc: "User balances" },
      { icon: Receipt, label: "Withdrawals", path: "/admin/withdrawals", desc: "Payout requests" },
      { icon: TrendingUp, label: "Revenue", path: "/admin/revenue", desc: "Income & accruals" },
    ],
  },
  {
    id: "trust",
    label: "Trust & Security",
    items: [
      { icon: Brain, label: "AI & Fraud", path: "/admin/ai", desc: "Risk engine" },
      { icon: Scale, label: "Disputes", path: "/admin/disputes", desc: "Case handling" },
      { icon: AlertTriangle, label: "Reports", path: "/admin/reports", desc: "Abuse & flags" },
      { icon: Database, label: "Audit Logs", path: "/admin/audit-logs", desc: "Every admin action" },
    ],
  },
  {
    id: "platform",
    label: "Platform",
    items: [
      { icon: Activity, label: "System Health", path: "/admin/system", desc: "Engines & jobs" },
      { icon: Send, label: "Notifications", path: "/admin/notifications", desc: "Comms console" },
      { icon: Settings, label: "Settings", path: "/admin/settings", desc: "Platform config" },
      { icon: Crown, label: "Owner Control", path: "/admin/owner", desc: "Owner-only levers" },
    ],
  },
];

/** Flat map path → { group, item } for breadcrumbs + active states. Paths
 * with a query string (e.g. /admin/fees?tab=payouts) are indexed by pathname
 * so the active state still resolves. */
const pathIndex = (() => {
  const map = new Map<string, { group: NavGroup; item: NavItem }>();
  for (const g of navGroups) for (const it of g.items) {
    const [pathname] = it.path.split("?");
    map.set(pathname, { group: g, item: it });
  }
  return map;
})();

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [adminSearch, setAdminSearch] = useState("");
  // Collapsible groups: open by default; the group holding the active route
  // can never be closed, so the user always sees where they are.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(navGroups.map((g) => [g.id, true])),
  );
  const profileRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  // REAL unread platform notifications for the admin — powers the bell badge.
  const unreadNotifications = useQuery(api.reviews.getUnreadCount);
  // Live seller count — shown as a badge on the sidebar "Sellers" nav item.
  const userCounts = useQuery(api.admin.getUserCounts);

  // The active group auto-opens on navigation (collapsible but never lost).
  const active = useMemo(() => {
    if (pathIndex.has(location.pathname)) return pathIndex.get(location.pathname)!;
    // Prefix match for sub-routes (e.g. /admin/users/123).
    const hit = [...pathIndex.entries()]
      .filter(([p]) => p !== "/admin" && location.pathname.startsWith(p))
      .sort((a, b) => b[0].length - a[0].length)[0];
    return hit ? hit[1] : null;
  }, [location.pathname]);

  useEffect(() => {
    if (active) setOpenGroups((o) => ({ ...o, [active.group.id]: true }));
  }, [active?.group.id]);

  // Replace-content navigation: each route change resets the scroll position
  // of the main area, like a real SaaS panel.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [location.pathname]);

  // Close the profile dropdown on outside click / Escape.
  useEffect(() => {
    if (!profileOpen) return;
    const onDown = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setProfileOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [profileOpen]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = adminSearch.trim();
    navigate(q ? `/admin/users?q=${encodeURIComponent(q)}` : "/admin/users");
    setAdminSearch("");
  };

  const toggleGroup = (id: string) =>
    setOpenGroups((o) => ({ ...o, [id]: !o[id] }));

  const go = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const crumbs = [
    { label: "Admin", path: "/admin" },
    ...(active && active.group.id !== "overview" ? [{ label: active.group.label, path: undefined as string | undefined }] : []),
    ...(active && active.item.path !== "/admin" ? [{ label: active.item.label, path: active.item.path }] : []),
  ];

  // ── Sidebar body (shared by desktop + mobile drawer) ──
  const sidebarBody = (isMobile: boolean) => (
    <>
      <div className={`flex items-center h-14 px-4 border-b border-white/5 shrink-0 ${collapsed && !isMobile ? "justify-center" : "gap-2.5"}`}>
        <button
          onClick={() => go("/")}
          className="flex items-center gap-2.5 min-w-0 group"
          title="Nexora Market — go to Home"
        >
          <Shield className="w-6 h-6 text-nx-violet shrink-0 group-hover:scale-110 transition-transform" />
          {!(collapsed && !isMobile) && (
            <span className="text-base font-bold text-white flex-1 group-hover:text-nx-violet transition-colors">
              NEXORA<span className="text-nx-violet">.</span>
            </span>
          )}
        </button>
        {isMobile && (
          <button onClick={() => setMobileOpen(false)} className="text-white/30 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      <div className={`mx-3 mt-3 mb-1 px-3 py-1.5 rounded-lg bg-nx-gold/10 text-nx-gold text-[10px] font-medium tracking-wider uppercase shrink-0 ${collapsed && !isMobile ? "text-center" : ""}`}>
        {collapsed && !isMobile ? "A" : "ADMIN CONTROL CENTER"}
      </div>
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-1 min-h-0">
        {navGroups.map((group) => {
          const isOpen = openGroups[group.id] ?? true;
          const hasActive = group.items.some((i) => i.path === active?.item.path);
          return (
            <div key={group.id} className="mb-1">
              <button
                onClick={() => toggleGroup(group.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-colors ${
                  hasActive ? "text-nx-gold/80" : "text-white/25 hover:text-white/50"
                } ${collapsed && !isMobile ? "justify-center" : ""}`}
                title={collapsed && !isMobile ? group.label : undefined}
              >
                {!(collapsed && !isMobile) && (
                  <>
                    <span className="flex-1 text-left">{group.label}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "" : "-rotate-90"}`} />
                  </>
                )}
                {(collapsed && !isMobile) && <span className="w-px h-4 bg-white/15" />}
              </button>
              {isOpen &&
                group.items.map((item) => {
                  // "Owner Payouts" lives at /admin/fees?tab=payouts — compare
                  // by pathname plus query so it doesn't double-light with
                  // "Fees & Commissions".
                  const [itemPathname, itemQuery] = item.path.split("?");
                  const matchesQuery = itemQuery
                    ? location.search.includes(itemQuery)
                    : !location.search.includes("tab=payouts");
                  const isActive = item.path === "/"
                    ? location.pathname === "/"
                    : item.path === "/admin"
                      ? location.pathname === "/admin"
                      : location.pathname.startsWith(itemPathname) && matchesQuery;
                  return (
                    <button
                      key={item.path}
                      onClick={() => go(item.path)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all group ${
                        isActive
                          ? "bg-nx-gold/10 text-nx-gold font-medium"
                          : "text-white/35 hover:text-white/70 hover:bg-white/[0.03]"
                      } ${collapsed && !isMobile ? "justify-center" : ""}`}
                      title={item.desc || item.label}
                    >
                      <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-nx-gold" : "group-hover:text-white/50"}`} />
                      {!(collapsed && !isMobile) && <span className="whitespace-nowrap text-left">{item.label}</span>}
                      {!(collapsed && !isMobile) && item.countKey && (
                        <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/50 tabular-nums">
                          {(userCounts as any)?.[item.countKey] ?? "·"}
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          );
        })}
      </nav>
      <div className="border-t border-white/5 p-2 shrink-0">
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/[0.03] text-xs transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
          </button>
        )}
        <button
          onClick={async () => { await signOut(); navigate("/"); }}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-white/25 hover:text-red-400 hover:bg-red-400/5 transition-colors ${collapsed && !isMobile ? "justify-center" : ""}`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!(collapsed && !isMobile) && <span>Sign Out</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#050508]">
      {/* Desktop sidebar — fixed, its own scroll area for nav overflow */}
      <aside className={`hidden lg:flex flex-col h-screen sticky top-0 border-r border-white/5 bg-[#08080F] transition-all duration-300 ${collapsed ? "w-[72px]" : "w-[256px]"}`}>
        {sidebarBody(false)}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-[280px] bg-[#08080F] border-r border-white/5 lg:hidden flex flex-col"
            >
              {sidebarBody(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main column: fixed topbar + independently scrolling content */}
      <main className="flex-1 min-w-0 flex flex-col h-screen">
        <div className="sticky top-0 z-30 h-14 shrink-0 bg-[#08080F]/95 backdrop-blur-xl border-b border-white/5 flex items-center px-4 md:px-6 justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden text-white/30 hover:text-white shrink-0">
              <Menu className="w-5 h-5" />
            </button>
            {/* Breadcrumbs */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs min-w-0 overflow-hidden">
              <button onClick={() => go("/")} className="text-white/35 hover:text-white/70 transition-colors shrink-0" title="Home">
                <Home className="w-3.5 h-3.5" />
              </button>
              {crumbs.map((c, i) => (
                <span key={`${c.label}-${i}`} className="flex items-center gap-1.5 min-w-0">
                  <span className="text-white/15">/</span>
                  {c.path && i < crumbs.length - 1 ? (
                    <button onClick={() => go(c.path!)} className="text-white/35 hover:text-white/70 transition-colors truncate">
                      {c.label}
                    </button>
                  ) : (
                    <span className={i === crumbs.length - 1 ? "text-white font-medium truncate" : "text-white/40 truncate"}>
                      {c.label}
                    </span>
                  )}
                </span>
              ))}
            </nav>
          </div>
          <form onSubmit={submitSearch} className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
              <input
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                placeholder="Search users, products, orders..."
                className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-xs text-white placeholder-white/20 focus:border-nx-violet/30 focus:outline-none transition-colors"
              />
            </div>
          </form>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-nx-emerald bg-nx-emerald/10 px-2 py-0.5 rounded-full font-medium hidden sm:inline">● System Healthy</span>
            {/* Home — quick jump back to the public marketplace */}
            <button
              onClick={() => go("/")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.04] text-xs font-medium transition-colors"
              title="Back to Home (public marketplace)"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </button>
            <button
              onClick={() => go("/admin/notifications")}
              className="relative p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.03] transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {!!unreadNotifications && unreadNotifications > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 rounded-full bg-red-500 flex items-center justify-center">
                  <span className="text-[8px] font-bold text-white">{unreadNotifications > 9 ? "9+" : unreadNotifications}</span>
                </span>
              )}
            </button>
            <div className="relative pl-2 border-l border-white/5" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                title="Account"
                className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-white/[0.04] transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-nx-gold/15 flex items-center justify-center overflow-hidden">
                  {(user as any)?.image ? (
                    <img src={(user as any).image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold text-nx-gold">{(user?.name || user?.email || "A").slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-[11px] font-medium text-white/70">{user?.name || "Admin"}</p>
                  <p className="text-[9px] text-white/25">{user?.email || ""}</p>
                </div>
                <ChevronDown className={`w-3 h-3 text-white/20 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    role="menu"
                    className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-white/10 bg-[#0C0C14] shadow-2xl shadow-black/50 p-1.5 z-50"
                  >
                    <div className="px-3 py-2 border-b border-white/5 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-nx-gold/15 overflow-hidden flex items-center justify-center shrink-0">
                        {(user as any)?.image ? (
                          <img src={(user as any).image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-bold text-nx-gold">{(user?.name || user?.email || "A").slice(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{user?.name || "Admin"}</p>
                        <p className="text-[10px] text-white/35 truncate">{user?.email || ""}</p>
                      </div>
                    </div>
                    <button onClick={() => { setProfileOpen(false); go("/"); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors">
                      <Home className="w-3.5 h-3.5" /> Visit Marketplace (Home)
                    </button>
                    <button onClick={() => { setProfileOpen(false); go("/admin/users"); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors">
                      <Users className="w-3.5 h-3.5" /> My Account
                    </button>
                    <button onClick={() => { setProfileOpen(false); go("/admin/fees"); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors">
                      <Percent className="w-3.5 h-3.5" /> Fees & Commissions
                    </button>
                    <button onClick={() => { setProfileOpen(false); go("/admin/settings"); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors">
                      <Settings className="w-3.5 h-3.5" /> Settings
                    </button>
                    <button onClick={async () => { setProfileOpen(false); await signOut(); navigate("/"); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-white/60 hover:text-red-400 hover:bg-red-400/5 transition-colors">
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* THE ONLY SCROLLING REGION — content replaces per route, never stacks */}
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-4 md:p-6 pb-24 lg:pb-10">{children}</div>
        </div>
      </main>

      {/* WhatsApp floating button */}
      <a
        href="https://wa.me/254769739216?text=Hello%20Nexora%20Admin%20Support%20%F0%9F%91%8B"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-22 right-6 z-50 w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center shadow-2xl hover:scale-110 transition-all duration-300 hover:shadow-[0_0_20px_rgba(37,211,102,0.4)]"
        title="Contact Admin Support via WhatsApp"
      >
        <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </a>
      <AIChat panel="admin" />
    </div>
  );
}
