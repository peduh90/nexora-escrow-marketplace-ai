import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router";
import { Shield, Menu, X } from "lucide-react";
import NexoraMark from "@/components/NexoraMark";
import InstallButton from "@/components/pwa/InstallButton";
import { useNavigate } from "react-router";
import { MOBILE_SHELL_HIDDEN_ON, isImmersiveRoute } from "@/lib/mobile-nav";
import { useLowData } from "@/hooks/use-low-data";
import { SignalLow } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getDashboardPath as sharedGetDashboardPath } from "@/components/RoleRouter";

/** Routes where the global mobile shell does NOT render — this navbar is the
 *  only navigation there, so it stays visible on phones too. */
function isShellImmersivePath(pathname: string): boolean {
  return (
    MOBILE_SHELL_HIDDEN_ON.includes(pathname) ||
    pathname === "/" ||
    pathname.startsWith("/auth") ||
    isImmersiveRoute(pathname)
  );
}

function scrollToSection(hash: string) {
  const id = hash.replace("#", "");
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    window.location.hash = hash;
  }
}

export default function NavigationBar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // One shared role→panel map (see RoleRouter.getDashboardPath): every role
  // lands on its own dashboard — buyers /buyer, sellers /seller, freelancers
  // /freelance/dashboard, employers /employer, creators /creator. Never
  // default an authenticated user to /buyer.
  const getDashboardPath = () => {
    if (!user) return "/auth";
    return sharedGetDashboardPath((user as any)?.role);
  };

  const location = useLocation();
  // Phones (<md) on shell-covered routes are owned by the global MobileShell —
  // its contextual header (brand, page title, search, notifications) covers
  // those pages, and rendering this marketing navbar underneath double-stacked
  // two fixed headers. Standalone pages WITHOUT the shell (landing, /join)
  // keep this bar on phones as their only navigation.
  const shellImmersive = isShellImmersivePath(location.pathname);
  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className={`nx-desktop-nav fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          shellImmersive ? "" : "max-md:hidden"
        } ${
          scrolled ? "nx-glass py-3" : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 group shrink-0">
            <NexoraMark className="w-8 h-8 transition-transform group-hover:scale-105" />
            <span className="text-lg font-bold tracking-tight text-white">
              NEXORA<span className="text-nx-violet">.</span>
            </span>
          </a>

          {/* Center navigation - the key fix */}
          <div className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => { window.location.pathname === "/" ? scrollToSection("#platform") : navigate("/"); }}
              className="px-3 py-1.5 text-sm text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            >
              Home
            </button>
            <button
              onClick={() => navigate("/marketplace")}
              className="px-3 py-1.5 text-sm text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            >
              Marketplace
            </button>
            <button
              onClick={() => navigate("/freelance")}
              className="px-3 py-1.5 text-sm text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            >
              Freelance
            </button>
            <button
              onClick={() => navigate("/services")}
              className="px-3 py-1.5 text-sm text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            >
              Services
            </button>
            <button
              onClick={() => navigate(user ? "/creator" : "/join")}
              className="px-3 py-1.5 text-sm text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            >
              Creator Program
            </button>
            <button
              onClick={() => { window.location.pathname === "/" ? scrollToSection("#how-it-works") : navigate("/"); }}
              className="px-3 py-1.5 text-sm text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            >
              How It Works
            </button>
            <button
              onClick={() => { window.location.pathname === "/" ? scrollToSection("#trust") : navigate("/"); }}
              className="px-3 py-1.5 text-sm text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            >
              Trust
            </button>
          </div>

          {/* Right side - Auth / Dashboard. Get Started intentionally lives on
              the Marketplace page (below the nav links) where buyers — the
              default audience — land, not in the global menu. */}
          <div className="hidden md:flex items-center gap-3">
            <InstallButton variant="inline" className="hidden lg:flex" />
            <LowDataToggle compact />
            {user ? (
              <button
                onClick={() => navigate(getDashboardPath())}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-nx-violet/10 border border-nx-violet/20 text-nx-violet text-sm font-medium hover:bg-nx-violet/20 transition-colors"
              >
                <div className="w-5 h-5 rounded-full bg-nx-violet/20 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-nx-violet">{(user.name || "U")[0].toUpperCase()}</span>
                </div>
                Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate("/auth")}
                  className="text-sm text-white/70 hover:text-white px-4 py-2 transition-colors"
                >
                  Sign In
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden text-white/70 hover:text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu — phones now use the dedicated MobileShell (contextual
          header + bottom tabs + Explore panel); this legacy dropdown remains
          only for the in-between tablet band (md–lg). */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-x-0 top-[60px] z-40 nx-glass p-6 lg:hidden"
          >
            <div className="flex flex-col gap-2">
              <LowDataToggle />
              <InstallButton variant="inline" className="justify-center" />
              <div className="border-t border-white/5 my-2" />
              <button
                onClick={() => { navigate("/"); setMobileOpen(false); }}
                className="text-white/70 hover:text-white text-sm py-2 text-left"
              >
                Home
              </button>
              <button
                onClick={() => { navigate("/marketplace"); setMobileOpen(false); }}
                className="text-white/70 hover:text-white text-sm py-2 text-left"
              >
                Marketplace
              </button>
              <button
                onClick={() => { navigate("/freelance"); setMobileOpen(false); }}
                className="text-white/70 hover:text-white text-sm py-2 text-left"
              >
                Freelance Marketplace
              </button>
              <button
                onClick={() => { navigate("/services"); setMobileOpen(false); }}
                className="text-white/70 hover:text-white text-sm py-2 text-left"
              >
                Services & Transport
              </button>
              <button
                onClick={() => { navigate(user ? "/creator" : "/join"); setMobileOpen(false); }}
                className="text-white/70 hover:text-white text-sm py-2 text-left"
              >
                Creator Program
              </button>
              {!user && (
                <button
                  onClick={() => { navigate("/auth"); setMobileOpen(false); }}
                  className="mt-2 w-full py-3 rounded-xl bg-nx-violet text-white text-sm font-semibold text-center hover:bg-nx-violet/85 transition-colors"
                >
                  Get Started — Create Free Account
                </button>
              )}
              {user && (
                <button
                  onClick={() => { navigate(getDashboardPath()); setMobileOpen(false); }}
                  className="text-nx-violet hover:text-nx-violet text-sm py-2 text-left font-medium"
                >
                  Dashboard
                </button>
              )}
              <div className="border-t border-white/5 my-2" />
              {user ? (
                <button
                  onClick={() => { navigate("/"); setMobileOpen(false); }}
                  className="text-white/40 hover:text-white text-sm py-2 text-left"
                >
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={() => { navigate("/auth"); setMobileOpen(false); }}
                  className="text-sm text-white/70 hover:text-white py-2 text-left"
                >
                  Sign In
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** Low-data mode switch (#56) — visible everywhere so users on poor
 *  connectivity can lighten the app from any page. */
function LowDataToggle({ compact = false }: { compact?: boolean }) {
  const { lowData, toggleLowData } = useLowData();
  if (compact) {
    return (
      <button
        onClick={toggleLowData}
        title={lowData ? "Low-data mode: ON — click to disable" : "Enable low-data mode"}
        aria-pressed={lowData}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
          lowData
            ? "bg-nx-emerald/10 border-nx-emerald/30 text-nx-emerald"
            : "bg-white/[0.03] border-white/10 text-white/50 hover:text-white/80"
        }`}
      >
        <SignalLow className="w-3.5 h-3.5" />
        <span className="hidden lg:inline">{lowData ? "Data Saver" : "Low Data"}</span>
      </button>
    );
  }
  return (
    <button
      onClick={toggleLowData}
      aria-pressed={lowData}
      className="flex items-center justify-between gap-3 text-sm py-2 text-left"
    >
      <span className="flex items-center gap-2 text-white/70">
        <SignalLow className="w-4 h-4" /> Low-data mode
      </span>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${lowData ? "bg-nx-emerald/15 text-nx-emerald" : "bg-white/10 text-white/40"}`}>
        {lowData ? "ON" : "OFF"}
      </span>
    </button>
  );
}
