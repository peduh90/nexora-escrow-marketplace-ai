import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Menu, X } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";

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

  const getDashboardPath = () => {
    if (!user) return "/auth";
    switch (user.role) {
      case "admin": return "/admin";
      case "seller": return "/seller";
      default: return "/buyer";
    }
  };

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? "nx-glass py-3" : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="relative">
              <Shield className="w-7 h-7 text-nx-violet transition-colors group-hover:text-nx-cyan" />
              <div className="absolute inset-0 bg-nx-violet/20 rounded-full blur-lg group-hover:bg-nx-cyan/20 transition-colors" />
            </div>
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

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-x-0 top-[60px] z-40 nx-glass p-6 lg:hidden"
          >
            <div className="flex flex-col gap-2">
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
