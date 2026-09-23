import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { Compass, ArrowLeft, Store, Wrench, Briefcase, LifeBuoy, ChevronRight } from "lucide-react";
import NexoraMark from "@/components/NexoraMark";

/**
 * 404 — never a dead end. Whatever link broke, this screen always offers a
 * way forward: back into the marketplaces, or home / support.
 */
export default function NotFound() {
  const navigate = useNavigate();

  const go = (path: string) => navigate(path);

  const destinations = [
    { label: "Marketplace", desc: "Products, escrow-protected", icon: Store, path: "/marketplace", tint: "text-nx-violet bg-nx-violet/10 border-nx-violet/20" },
    { label: "Local Services", desc: "Boda, plumbers, fundis", icon: Wrench, path: "/services", tint: "text-nx-cyan bg-nx-cyan/10 border-nx-cyan/20" },
    { label: "Freelance", desc: "Digital work & hiring", icon: Briefcase, path: "/freelance", tint: "text-nx-gold bg-nx-gold/10 border-nx-gold/20" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-[#05050A] text-white flex flex-col items-center justify-center px-4 relative overflow-hidden"
    >
      {/* Ambient brand glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[520px] h-[520px] bg-nx-violet/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-md w-full text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <NexoraMark className="w-9 h-9" />
          <span className="text-lg font-bold tracking-tight">
            NEXORA<span className="text-nx-violet">.</span>
          </span>
        </div>

        <div className="w-16 h-16 rounded-2xl bg-nx-violet/10 border border-nx-violet/20 flex items-center justify-center mx-auto mb-5">
          <Compass className="w-8 h-8 text-nx-violet" />
        </div>

        <h1 className="text-5xl font-black tracking-tight mb-2">404</h1>
        <p className="text-sm text-white/50 leading-relaxed">
          This page doesn't exist — the link may be old or mistyped.
          <br />
          Everything else is one tap away.
        </p>

        {/* Real destinations — the three marketplaces */}
        <div className="mt-8 space-y-2">
          {destinations.map((d) => (
            <button
              key={d.path}
              onClick={() => go(d.path)}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15 active:scale-[0.99] transition-all text-left"
            >
              <span className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${d.tint}`}>
                <d.icon className="w-5 h-5" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-white">{d.label}</span>
                <span className="block text-[11px] text-white/35">{d.desc}</span>
              </span>
              <ChevronRight className="w-4 h-4 text-white/25 shrink-0" />
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-center gap-4 text-xs">
          <button
            onClick={() => (window.history.length > 1 ? navigate(-1) : go("/"))}
            className="inline-flex items-center gap-1.5 text-white/45 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Go back
          </button>
          <span className="text-white/10">|</span>
          <button
            onClick={() => go("/")}
            className="text-white/45 hover:text-white transition-colors"
          >
            Home
          </button>
          <span className="text-white/10">|</span>
          <a
            href="https://wa.me/254706116043"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-white/45 hover:text-white transition-colors"
          >
            <LifeBuoy className="w-3.5 h-3.5" /> Support
          </a>
        </div>
      </div>
    </motion.div>
  );
}
