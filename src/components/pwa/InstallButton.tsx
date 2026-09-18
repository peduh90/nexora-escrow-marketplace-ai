import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Share, Plus, MonitorSmartphone, X } from "lucide-react";
import {
  installAvailable,
  isIos,
  isStandalone,
  markDismissed,
  triggerInstall,
  onInstallAvailabilityChange,
} from "@/lib/pwa";

/**
 * ─── INSTALL NEXORA BUTTON ────────────────────────────────────────────────
 *
 * A small, non-intrusive entry point into the existing install system:
 *  • Renders nothing once the app is installed (standalone) — never nags an
 *    installed session, even after re-open.
 *  • On browsers that fire `beforeinstallprompt` it calls the NATIVE prompt
 *    through triggerInstall() (shared with the PwaLayer nudge, so dismissal
 *    memory and the installed marker stay consistent).
 *  • Where the native prompt is unavailable (iOS Safari, some Android
 *    browsers) it opens a compact sheet with the correct browser-menu steps
 *    for that platform.
 *
 * Variants:
 *  - "icon":  icon-only button for app headers (next to search/bell).
 *  - "inline": labelled button for page surfaces (landing hero, menus).
 */

interface InstallButtonProps {
  variant?: "icon" | "inline";
  className?: string;
}

export default function InstallButton({ variant = "inline", className = "" }: InstallButtonProps) {
  const [nativeAvailable, setNativeAvailable] = useState(false);
  const [installed, setInstalled] = useState(isStandalone());
  const [showHelp, setShowHelp] = useState(false);

  // Track real capability. The listener fires when `beforeinstallprompt` is
  // captured by initPwa() and again after it is consumed or cleared.
  useEffect(() => onInstallAvailabilityChange((available) => setNativeAvailable(available)), []);

  // Hide the moment the app transitions to installed (display-mode change,
  // appinstalled). Re-check on visibility so iOS standalone restores hide it.
  useEffect(() => {
    const check = () => setInstalled(isStandalone());
    check();
    const mq = window.matchMedia?.("(display-mode: standalone)");
    mq?.addEventListener?.("change", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      mq?.removeEventListener?.("change", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);

  // Installed sessions see nothing — the app is already on the home screen.
  if (installed) return null;

  const openInstall = async () => {
    if (nativeAvailable) {
      await triggerInstall(); // native browser install sheet
      return;
    }
    setShowHelp(true); // guided browser-menu instructions
  };

  if (variant === "icon") {
    return (
      <>
        <button
          onClick={openInstall}
          title="Install Nexora"
          aria-label="Install Nexora app"
          className={`w-9 h-9 rounded-full flex items-center justify-center text-white/60 active:bg-white/10 transition-colors ${className}`}
        >
          <MonitorSmartphone className="w-5 h-5" />
        </button>
        <InstallHelpSheet open={showHelp && !nativeAvailable} onClose={() => setShowHelp(false)} />
      </>
    );
  }

  return (
    <>
      <button
        onClick={openInstall}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl bg-nx-violet/10 border border-nx-violet/25 text-nx-violet text-[12.5px] font-semibold hover:bg-nx-violet/20 active:bg-nx-violet/25 transition-colors ${className}`}
        aria-label="Install Nexora app"
      >
        <Download className="w-3.5 h-3.5" />
        Install Nexora
      </button>
      <InstallHelpSheet open={showHelp && !nativeAvailable} onClose={() => setShowHelp(false)} />
    </>
  );
}

/* ═══ BROWSER-MENU INSTRUCTIONS (no native prompt available) ═══ */

function InstallHelpSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ios = isIos();

  // Respect a dismissal so the help sheet does not loop on the user.
  const close = () => {
    markDismissed();
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[85] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="How to install Nexora"
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="w-full sm:max-w-md bg-nx-surface-elevated border border-white/10 rounded-t-2xl sm:rounded-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-[15px] font-bold text-white leading-tight">Install Nexora</h3>
                <p className="text-[11.5px] text-white/45 mt-0.5">Use your browser's menu — takes a few seconds.</p>
              </div>
              <button onClick={close} className="p-1 -m-1 text-white/30 active:text-white/60" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            {ios ? (
              <ol className="space-y-2.5 text-[12.5px] text-white/65">
                <li className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0"><Share className="w-3.5 h-3.5 text-nx-cyan" /></span>
                  <span>Tap <b className="text-white">Share</b> in Safari's toolbar</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0"><Plus className="w-3.5 h-3.5 text-nx-gold" /></span>
                  <span>Scroll to <b className="text-white">Add to Home Screen</b></span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0"><Download className="w-3.5 h-3.5 text-nx-emerald" /></span>
                  <span>Tap <b className="text-white">Add</b> — Nexora opens like an app</span>
                </li>
              </ol>
            ) : (
              <ol className="space-y-2.5 text-[12.5px] text-white/65">
                <li className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0"><MonitorSmartphone className="w-3.5 h-3.5 text-nx-cyan" /></span>
                  <span>Open your browser's <b className="text-white">⋮ menu</b> (top right)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0"><Download className="w-3.5 h-3.5 text-nx-gold" /></span>
                  <span>Tap <b className="text-white">"Install app"</b> or <b className="text-white">"Add to Home screen"</b></span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0"><Plus className="w-3.5 h-3.5 text-nx-emerald" /></span>
                  <span>Confirm — Nexora gets its own icon on your device</span>
                </li>
              </ol>
            )}

            <button
              onClick={close}
              className="mt-5 w-full py-3 rounded-xl bg-nx-violet text-white text-[13px] font-semibold active:bg-nx-violet/80 transition-colors"
            >
              Got it
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
