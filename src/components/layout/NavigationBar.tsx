import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Menu, X } from "lucide-react";
import { useNavigate } from "react-router";

const navLinks = [
  { label: "Platform", href: "#platform" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Trust", href: "#trust" },
  { label: "Pricing", href: "#pricing" },
];

export default function NavigationBar() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "nx-glass py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <Shield className="w-7 h-7 text-nx-violet transition-colors group-hover:text-nx-cyan" />
              <div className="absolute inset-0 bg-nx-violet/20 rounded-full blur-lg group-hover:bg-nx-cyan/20 transition-colors" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              NEXORA<span className="text-nx-violet">.</span>
            </span>
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => { if (link.href.startsWith("/")) { e.preventDefault(); navigate(link.href); } }}
                className="text-sm text-white/60 hover:text-white transition-colors duration-300"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => navigate("/auth")}
              className="text-sm text-white/70 hover:text-white px-4 py-2 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate("/auth")}
              className="relative text-sm font-medium text-white px-5 py-2.5 rounded-lg overflow-hidden group"
              style={{
                background: "linear-gradient(135deg, #8B5CF6, #6D28D9)",
              }}
            >
              <span className="relative z-10">Get Started</span>
              <div className="absolute inset-0 bg-gradient-to-r from-nx-violet to-nx-cyan opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-white/70 hover:text-white"
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
            className="fixed inset-x-0 top-[60px] z-40 nx-glass p-6 md:hidden"
          >
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-white/70 hover:text-white text-sm py-2"
                  onClick={(e) => { if (link.href.startsWith("/")) { e.preventDefault(); navigate(link.href); } setMobileOpen(false); }}
                >
                  {link.label}
                </a>
              ))}
              <button
                onClick={() => { navigate("/auth"); setMobileOpen(false); }}
                className="text-sm font-medium text-white px-5 py-2.5 rounded-lg mt-2"
                style={{ background: "linear-gradient(135deg, #8B5CF6, #6D28D9)" }}
              >
                Get Started
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
