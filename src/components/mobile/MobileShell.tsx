import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Compass, Package, Briefcase, MessageSquare, User, X, ChevronRight,
  LayoutDashboard, LogOut, Bell, Sparkles, Search, ShoppingBag, Wrench,
  Laptop, ArrowLeft, Share2, Shield, LifeBuoy, Truck, Wallet, Settings,
  Star, Users, Tag, Megaphone, BarChart3, BadgeCheck, Store, PlusCircle,
  FileText, TrendingUp, LogIn, Mic, History,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  EXPLORE_MARKETS, SEARCH_SUGGESTIONS, accountSections, isImmersiveRoute,
  isFocusedFlow, messagesPath, roleHome, roleOrdersPath, roleWorkLabel,
  notificationsPath,
} from "@/lib/mobile-nav";

/* ─── Icon registry (string → component, keeps the lib serialisable) ─── */
const ICONS: Record<string, any> = {
  package: Package, "message-square": MessageSquare, wallet: Wallet, bell: Bell,
  user: User, settings: Settings, "life-buoy": LifeBuoy, "log-in": LogIn,
  sparkles: Sparkles, truck: Truck, shield: Shield, search: Search,
  "layout-dashboard": LayoutDashboard, "plus-circle": PlusCircle,
  banknote: Wallet, store: Store, "badge-check": BadgeCheck,
  "bar-chart-3": BarChart3, megaphone: Megaphone, star: Star, users: Users,
  tag: Tag, briefcase: Briefcase, "file-text": FileText,
  "trending-up": TrendingUp, "share-2": Share2,
};

/* ─── Contextual header config per route pattern ─── */
function headerContext(pathname: string): {
  title?: string; back?: boolean; actions?: Array<"share" | "search" | "none">;
} {
  if (pathname.startsWith("/product/")) return { back: true, actions: ["share", "search"] };
  if (pathname.startsWith("/chat")) return { title: "Messages", back: true, actions: ["none"] };
  if (pathname.startsWith("/services")) return { title: "Local Services", back: !pathname.match(/^\/services\/?$/), actions: ["search"] };
  if (pathname.startsWith("/freelance/jobs")) return { title: "Freelance Jobs", back: pathname !== "/freelance/jobs", actions: ["search"] };
  if (pathname.startsWith("/freelance")) return { title: "Freelance", back: !pathname.match(/^\/freelance\/?$/), actions: ["search"] };
  if (pathname.startsWith("/seller/add-product") || pathname.startsWith("/freelance/publish")) return { title: "Create listing", back: true, actions: ["none"] };
  if (pathname.startsWith("/seller")) return { title: "Seller Studio", actions: ["search"] };
  if (pathname.startsWith("/employer")) return { title: "Employer Hub", actions: ["search"] };
  if (pathname.startsWith("/buyer/orders")) return { title: "My Orders", back: true, actions: ["search"] };
  if (pathname.startsWith("/buyer/wallet")) return { title: "Wallet", back: true, actions: ["none"] };
  if (pathname.startsWith("/buyer")) return { title: "My Nexora", actions: ["search"] };
  if (pathname.startsWith("/marketplace")) return { actions: ["search"] };
  if (pathname.startsWith("/transport")) return { title: "Transport", back: true, actions: ["none"] };
  if (pathname.startsWith("/community")) return { title: "Community", back: true, actions: ["none"] };
  if (pathname.startsWith("/creator")) return { title: "Creator Program", actions: ["none"] };
  return { title: "Nexora", actions: ["search"] };
}

/* ═══ MOBILE HEADER ═══ */
function MobileHeader({ onSearch }: { onSearch: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const ctx = headerContext(location.pathname);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const unread = useQuery(api.messages.getUnreadCount) ?? 0;
  const notifCount = (useQuery(api.reviews.getNotifications) ?? []).filter((n: any) => !n.read).length;

  // Product pages render their own rich header; chat renders its own too.
  if (
    location.pathname.startsWith("/product/") ||
    location.pathname.startsWith("/chat") // conversation + inbox pages own their chrome
  ) return null;

  return (
    <header
      className={`md:hidden fixed top-0 left-0 right-0 z-40 transition-colors duration-300 ${
        scrolled ? "bg-nx-bg/90 backdrop-blur-xl border-b border-nx-border" : "bg-nx-bg"
      }`}
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="h-14 flex items-center gap-1.5 px-3">
        {ctx.back && (
          <button
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/marketplace"))}
            className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-white/60 active:bg-white/10 transition-colors shrink-0"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {/* Brand — contextual pages show title instead */}
        {ctx.title ? (
          <h1 className="flex-1 text-[15px] font-semibold text-white truncate pl-0.5">{ctx.title}</h1>
        ) : (
          <button onClick={() => navigate("/marketplace")} className="flex items-center gap-2 flex-1 min-w-0">
            <Shield className="w-5 h-5 text-nx-violet shrink-0" />
            <span className="text-[17px] font-bold tracking-tight text-white">
              NEXORA<span className="text-nx-violet">.</span>
            </span>
          </button>
        )}

        <div className="flex items-center gap-0.5 shrink-0">
          {ctx.actions?.includes("search") && (
            <button
              onClick={onSearch}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white/60 active:bg-white/10 transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
          )}
          {ctx.actions?.includes("share") && (
            <button
              onClick={() => {
                const url = window.location.href;
                if (navigator.share) navigator.share({ title: document.title, url }).catch(() => {});
                else navigator.clipboard?.writeText(url).catch(() => {});
              }}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white/60 active:bg-white/10 transition-colors"
              aria-label="Share"
            >
              <Share2 className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => navigate(notificationsPath(user?.role))}
            className="relative w-9 h-9 rounded-full flex items-center justify-center text-white/60 active:bg-white/10 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {notifCount + unread > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[15px] h-[15px] px-0.5 rounded-full bg-nx-violet text-[9px] font-bold text-white flex items-center justify-center">
                {notifCount + unread > 9 ? "9+" : notifCount + unread}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate(roleHome(user?.role))}
            className="w-9 h-9 rounded-full flex items-center justify-center active:bg-white/10 transition-colors shrink-0"
            aria-label="Account"
          >
            {user ? (
              <span className="w-7 h-7 rounded-full bg-nx-violet/15 border border-nx-violet/25 text-nx-violet text-[11px] font-bold flex items-center justify-center">
                {(user.name || "U")[0].toUpperCase()}
              </span>
            ) : (
              <span className="px-3 h-7 rounded-full bg-nx-violet text-white text-[11px] font-bold flex items-center">
                Sign in
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

/* ═══ UNIVERSAL SEARCH OVERLAY ═══ */
function MobileSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [market, setMarket] = useState<"products" | "services" | "freelance">("products");
  const [recent, setRecent] = useState<string[]>([]);
  const [listening, setListening] = useState(false);

  // Recent searches — safe, non-sensitive browsing context ("continue where
  // you left off"), stored locally, capped, user-clearable.
  useEffect(() => {
    if (!open) return;
    try { setRecent(JSON.parse(localStorage.getItem("nx_recent_searches") || "[]")); } catch { setRecent([]); }
  }, [open]);

  const rememberSearch = (term: string) => {
    try {
      const list = [term, ...recent.filter((r) => r !== term)].slice(0, 6);
      localStorage.setItem("nx_recent_searches", JSON.stringify(list));
      setRecent(list);
    } catch { /* private mode */ }
  };

  // Voice search — Web Speech API where supported; graceful no-op elsewhere.
  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = "en-KE";
    rec.interimResults = false;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.onresult = (e: any) => {
      const said = e.results?.[0]?.[0]?.transcript;
      if (said) {
        setQ(said);
        go(said);
      }
    };
    rec.start();
  };
  const voiceSupported = typeof window !== "undefined" &&
    Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  useEffect(() => {
    if (open) setQ("");
  }, [open]);

  const go = (term: string) => {
    const t = term.trim();
    if (!t) return;
    rememberSearch(t);
    if (market === "products") navigate(`/marketplace?q=${encodeURIComponent(t)}`);
    else if (market === "services") navigate(`/services?q=${encodeURIComponent(t)}`);
    else navigate(`/freelance/jobs?q=${encodeURIComponent(t)}`);
    onClose();
  };

  const markets = [
    { id: "products" as const, label: "Products", icon: ShoppingBag },
    { id: "services" as const, label: "Services", icon: Wrench },
    { id: "freelance" as const, label: "Freelance", icon: Laptop },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="md:hidden fixed inset-0 z-[70] bg-nx-bg"
        >
          <div style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
            <div className="h-14 flex items-center gap-2 px-3 border-b border-nx-border">
              <button onClick={onClose} className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-white/60 active:bg-white/10" aria-label="Close search">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && go(q)}
                placeholder={listening ? "Listening…" : `Search ${market}…`}
                className="flex-1 bg-transparent text-white text-[16px] placeholder:text-white/25 focus:outline-none"
              />
              {!q && voiceSupported && (
                <button
                  onClick={startVoice}
                  className={`w-9 h-9 rounded-full flex items-center justify-center ${listening ? "text-nx-violet animate-pulse" : "text-white/40"}`}
                  aria-label="Search by voice"
                >
                  <Mic className="w-5 h-5" />
                </button>
              )}
              {q && (
                <button onClick={() => setQ("")} className="w-9 h-9 rounded-full flex items-center justify-center text-white/40">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Market switcher */}
            <div className="flex gap-2 px-4 py-3">
              {markets.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMarket(m.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border transition-colors ${
                    market === m.id
                      ? "bg-nx-violet/15 border-nx-violet/30 text-nx-violet"
                      : "bg-white/[0.03] border-nx-border text-white/45"
                  }`}
                >
                  <m.icon className="w-3.5 h-3.5" /> {m.label}
                </button>
              ))}
            </div>

            <div className="px-4 pb-8 overflow-y-auto nx-sheet-panel" style={{ maxHeight: "calc(100dvh - 120px)" }}>
              {recent.length > 0 && !q && (
                <>
                  <div className="flex items-center justify-between mb-2.5">
                    <p className="text-[11px] uppercase tracking-wider text-white/25 font-semibold">Recent</p>
                    <button onClick={() => { localStorage.removeItem("nx_recent_searches"); setRecent([]); }} className="text-[11px] text-white/30 active:text-white/60">
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-7">
                    {recent.map((r) => (
                      <button key={r} onClick={() => go(r)} className="px-3.5 py-2 rounded-full text-[13px] text-white/55 bg-white/[0.03] border border-nx-border active:bg-white/10 transition-colors flex items-center gap-1.5">
                        <History className="w-3 h-3 text-white/25" /> {r}
                      </button>
                    ))}
                  </div>
                </>
              )}
              <p className="text-[11px] uppercase tracking-wider text-white/25 font-semibold mb-2.5">
                {q ? "Try searching" : "Popular right now"}
              </p>
              <div className="flex flex-wrap gap-2 mb-7">
                {(SEARCH_SUGGESTIONS[market] ?? []).map((s) => (
                  <button
                    key={s}
                    onClick={() => (q ? go(q) : go(s))}
                    className="px-3.5 py-2 rounded-full text-[13px] text-white/60 bg-white/[0.04] border border-nx-border active:bg-white/10 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>

              <p className="text-[11px] uppercase tracking-wider text-white/25 font-semibold mb-2.5">Browse by category</p>
              <div className="grid grid-cols-2 gap-2">
                {EXPLORE_MARKETS.find((m) => m.id === market)!.categories.slice(0, 12).map((c) => (
                  <button
                    key={c.slug}
                    onClick={() => {
                      if (market === "products") navigate(`/marketplace?category=${c.slug}`);
                      else if (market === "services") navigate(`/services/category/${c.slug}`);
                      else navigate(`/freelance/jobs?category=${c.slug}`);
                      onClose();
                    }}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-nx-border active:bg-white/[0.07] transition-colors text-left"
                  >
                    <span className="text-lg leading-none">{(c as any).emoji ?? "📁"}</span>
                    <span className="text-[12.5px] text-white/75 leading-tight">{c.name}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => go(q || " ")}
                className="w-full mt-7 py-3.5 rounded-xl bg-nx-violet text-white text-sm font-semibold active:bg-nx-violet/80 transition-colors"
              >
                Search {market === "products" ? "products" : market === "services" ? "services" : "jobs"}{q ? ` for "${q}"` : ""}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══ EXPLORE FULL-SCREEN PANEL ═══ */
function ExplorePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const open_ = (path: string) => { navigate(path); onClose(); };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="md:hidden fixed inset-0 z-[65] bg-nx-bg flex flex-col"
          style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
        >
          {/* Header */}
          <div className="h-14 px-3 flex items-center justify-between border-b border-nx-border shrink-0">
            <h2 className="text-[17px] font-bold text-white pl-1">Explore Nexora</h2>
            <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-white/50 active:bg-white/10" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto nx-sheet-panel px-4 pb-6">
            <p className="text-[13px] text-white/40 leading-relaxed pt-4 pb-4">
              Three marketplaces, one trusted platform — every payment escrow-protected.
            </p>

            {EXPLORE_MARKETS.map((m) => (
              <ExploreMarketSection key={m.id} market={m} onOpen={open_} />
            ))}

            {/* More Nexora */}
            <div className="mt-6 pt-5 border-t border-nx-border">
              <p className="text-[11px] uppercase tracking-wider text-white/25 font-semibold mb-3">More on Nexora</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => open_("/services/bookings")} className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-nx-border text-[12.5px] text-white/70 active:bg-white/[0.07]">
                  <Package className="w-4 h-4 text-nx-cyan" /> My bookings
                </button>
                <button onClick={() => open_("/community")} className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-nx-border text-[12.5px] text-white/70 active:bg-white/[0.07]">
                  <Users className="w-4 h-4 text-nx-emerald" /> Community
                </button>
                <button onClick={() => open_("/transport")} className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-nx-border text-[12.5px] text-white/70 active:bg-white/[0.07]">
                  <Truck className="w-4 h-4 text-nx-gold" /> Transport
                </button>
                <button onClick={() => open_(user ? "/creator" : "/join")} className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-nx-border text-[12.5px] text-white/70 active:bg-white/[0.07]">
                  <Sparkles className="w-4 h-4 text-nx-violet" /> Creator Program
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ExploreMarketSection({
  market, onOpen,
}: {
  market: (typeof EXPLORE_MARKETS)[number];
  onOpen: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const accentText = { violet: "text-nx-violet", cyan: "text-nx-cyan", gold: "text-nx-gold" }[market.accent];
  const accentBg = {
    violet: "bg-nx-violet/10 border-nx-violet/20",
    cyan: "bg-nx-cyan/10 border-nx-cyan/20",
    gold: "bg-nx-gold/10 border-nx-gold/20",
  }[market.accent];
  const MarketIcon = market.id === "products" ? ShoppingBag : market.id === "services" ? Wrench : Laptop;

  const catPath = (slug: string) =>
    market.id === "products" ? `/marketplace?category=${slug}`
    : market.id === "services" ? `/services/category/${slug}`
    : `/freelance/jobs?category=${slug}`;

  const shown = expanded ? market.categories : market.categories.slice(0, 8);

  return (
    <section className="mb-5">
      <button
        onClick={() => onOpen(market.basePath)}
        className={`w-full p-4 rounded-2xl border ${accentBg} text-left active:scale-[0.99] transition-transform`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0">
            <MarketIcon className={`w-5 h-5 ${accentText}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-bold text-white">{market.name}</h3>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.07] ${accentText}`}>
                {market.tagline}
              </span>
            </div>
            <p className="text-[12px] text-white/45 mt-0.5 leading-snug">{market.desc}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-white/25 shrink-0" />
        </div>
      </button>

      <div className="grid grid-cols-2 gap-2 mt-2">
        {shown.map((c) => (
          <button
            key={c.slug}
            onClick={() => onOpen(catPath(c.slug))}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-nx-border text-left active:bg-white/[0.06] transition-colors"
          >
            {(c as any).emoji && <span className="text-[15px] leading-none">{(c as any).emoji}</span>}
            <span className="text-[12px] text-white/70 leading-tight">{c.name}</span>
          </button>
        ))}
      </div>
      {market.categories.length > 8 && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="w-full mt-2 py-2 text-[12px] font-semibold text-white/40 active:text-white/70"
        >
          {expanded ? "Show less" : `Show all ${market.categories.length} ${market.name.toLowerCase()} categories`}
        </button>
      )}
    </section>
  );
}

/* ═══ ACCOUNT SHEET (role-aware control centre) ═══ */
function AccountSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { user, role, signOut } = useAuth();
  const sections = useMemo(() => accountSections(role), [role]);

  const go = (path: string) => { navigate(path); onClose(); };

  const doSignOut = async () => {
    await signOut();
    onClose();
    navigate("/");
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="md:hidden fixed inset-0 z-[65] bg-black/60 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="md:hidden fixed bottom-0 left-0 right-0 z-[66] bg-nx-surface-elevated rounded-t-3xl border-t border-nx-border max-h-[86dvh] flex flex-col"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <div className="pt-2.5 pb-1 flex justify-center shrink-0">
              <div className="w-10 h-1 rounded-full bg-white/15" />
            </div>

            {/* Identity */}
            <div className="px-4 pb-4 border-b border-nx-border shrink-0">
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="w-12 h-12 rounded-full bg-nx-violet/15 border border-nx-violet/25 text-nx-violet text-lg font-bold flex items-center justify-center">
                    {(user.name || "U")[0].toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-white truncate">{user.name || "My account"}</p>
                    <p className="text-[11.5px] text-white/40 capitalize">
                      {role ?? "member"} {user.phone ? `· ${user.phone}` : ""}
                    </p>
                  </div>
                  <button onClick={() => go("/buyer/profile")} className="text-[12px] font-semibold text-nx-violet px-3 py-1.5 rounded-lg bg-nx-violet/10 active:bg-nx-violet/20">
                    Edit
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="w-12 h-12 rounded-full bg-white/[0.06] border border-nx-border flex items-center justify-center">
                    <User className="w-5 h-5 text-white/40" />
                  </span>
                  <div className="flex-1">
                    <p className="text-[15px] font-semibold text-white">Welcome to Nexora</p>
                    <p className="text-[11.5px] text-white/40">Sign in to buy, sell & work safely</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto nx-sheet-panel px-4 py-3">
              {sections.map((section) => (
                <div key={section.title} className="mb-4">
                  <p className="text-[10.5px] uppercase tracking-wider text-white/25 font-semibold mb-1.5 px-1">{section.title}</p>
                  <div className="rounded-2xl border border-nx-border overflow-hidden">
                    {section.links.map((link, i) => {
                      const Icon = ICONS[link.icon] ?? Package;
                      return (
                        <button
                          key={link.label}
                          onClick={() => go(link.path)}
                          className={`w-full flex items-center gap-3 px-3.5 py-3 bg-white/[0.02] active:bg-white/[0.07] transition-colors text-left ${
                            i > 0 ? "border-t border-nx-border" : ""
                          }`}
                        >
                          <Icon className="w-[17px] h-[17px] text-white/45 shrink-0" />
                          <span className="flex-1 min-w-0">
                            <span className="block text-[13.5px] text-white/85">{link.label}</span>
                            {link.desc && <span className="block text-[11px] text-white/35 truncate">{link.desc}</span>}
                          </span>
                          <ChevronRight className="w-4 h-4 text-white/20 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {user && (
                <button
                  onClick={doSignOut}
                  className="w-full flex items-center gap-3 px-3.5 py-3.5 rounded-2xl border border-red-400/15 bg-red-400/[0.04] text-red-400 active:bg-red-400/10 transition-colors mb-2"
                >
                  <LogOut className="w-[17px] h-[17px]" />
                  <span className="text-[13.5px] font-semibold">Sign out</span>
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ═══ BOTTOM TAB BAR ═══ */
export function MobileBottomNav({ onExplore, onAccount }: { onExplore: () => void; onAccount: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const unread = useQuery(api.messages.getUnreadCount) ?? 0;

  const workPath = roleOrdersPath(role);
  const msgPath = user ? messagesPath(role) : "/auth";

  const tabs = [
    { key: "home", icon: Home, label: "Home", path: "/marketplace", match: (p: string) => p === "/marketplace" || p.startsWith("/product/") },
    { key: "explore", icon: Compass, label: "Explore", path: null as string | null, match: () => false },
    { key: "work", icon: role === "freelancer" || role === "employer" ? Briefcase : Package, label: roleWorkLabel(role), path: workPath, match: (p: string) => workPath !== "#" && (p.startsWith(workPath) || (role === "seller" && p.startsWith("/seller/orders"))) },
    { key: "messages", icon: MessageSquare, label: "Messages", path: msgPath, match: (p: string) => p.startsWith("/chat") || p === msgPath, badge: unread },
    { key: "account", icon: User, label: "Account", path: null as string | null, match: (p: string) =>
      p.startsWith("/buyer") || p.startsWith("/seller") && !p.startsWith("/seller/orders") ||
      p.startsWith("/freelance/dashboard") || p.startsWith("/employer") || p.startsWith("/creator") || p.startsWith("/transport/dashboard"),
    },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-nx-card/95 backdrop-blur-xl border-t border-nx-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-stretch h-[58px]">
        {tabs.map((tab) => {
          const active = tab.match(location.pathname);
          return (
            <button
              key={tab.key}
              onClick={() => {
                if (tab.key === "explore") onExplore();
                else if (tab.key === "account") onAccount();
                else if (tab.path) navigate(tab.path);
              }}
              className="flex-1 flex flex-col items-center justify-center gap-[3px] relative active:bg-white/[0.04] transition-colors"
            >
              <span className="relative">
                <tab.icon
                  className={`w-[22px] h-[22px] transition-colors ${active ? "text-nx-violet" : "text-white/35"}`}
                  strokeWidth={active ? 2.4 : 1.9}
                />
                {!!(tab as any).badge && (tab as any).badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-nx-violet text-[9.5px] font-bold text-white flex items-center justify-center border-2 border-nx-card">
                    {(tab as any).badge > 9 ? "9+" : (tab as any).badge}
                  </span>
                )}
              </span>
              <span className={`text-[10px] font-medium leading-none transition-colors ${active ? "text-nx-violet" : "text-white/35"}`}>
                {tab.label}
              </span>
              {active && (
                <motion.span
                  layoutId="nx-tab-dot"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2.5px] rounded-full bg-nx-violet"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* ═══ THE SHELL ═══ */
export default function MobileShell() {
  const location = useLocation();
  const [exploreOpen, setExploreOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const immersive = isImmersiveRoute(location.pathname) || isFocusedFlow(location.pathname);

  // Lock background scroll while any panel is open.
  useEffect(() => {
    document.body.classList.toggle("nx-sheet-open", exploreOpen || accountOpen || searchOpen);
    return () => document.body.classList.remove("nx-sheet-open");
  }, [exploreOpen, accountOpen, searchOpen]);

  // Close panels on route change.
  useEffect(() => {
    setExploreOpen(false);
    setAccountOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  if (immersive) return null;

  // Pages that own their chrome (product detail, chat) skip the shell header —
  // and must also skip its spacer, or they get 56px of dead space.
  const ownChrome =
    location.pathname.startsWith("/product/") || location.pathname.startsWith("/chat");

  return (
    <>
      {!ownChrome && <MobileHeader onSearch={() => setSearchOpen(true)} />}
      {!ownChrome && (
        <div className="h-14 md:hidden" style={{ marginTop: "env(safe-area-inset-top, 0px)" }} />
      )}
      <MobileBottomNav onExplore={() => setExploreOpen(true)} onAccount={() => setAccountOpen(true)} />
      <ExplorePanel open={exploreOpen} onClose={() => setExploreOpen(false)} />
      <AccountSheet open={accountOpen} onClose={() => setAccountOpen(false)} />
      <MobileSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
