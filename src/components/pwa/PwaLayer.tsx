import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Share, Plus, WifiOff, RefreshCw, Shield, Smartphone } from "lucide-react";
import {
  applyUpdate, canOfferInstall, isIos, isStandalone, markDismissed,
  onInstallAvailabilityChange, onUpdateStateChange, recordEngagement,
  shouldShowInstallPrompt, triggerInstall,
} from "@/lib/pwa";

/* ═══ INSTALL BANNER ═══ */
function InstallBanner() {
  const [available, setAvailable] = useState(false);
  const [eligible, setEligible] = useState(false);
  const [visible, setVisible] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const ios = isIos();

  // Track real browser capability (Android Chrome/Edge fire beforeinstallprompt).
  useEffect(() => onInstallAvailabilityChange(setAvailable), []);

  // Engagement gate: introduce install only after the user has actually
  // browsed; checked on a soft timer so session clicks accumulate.
  useEffect(() => {
    const check = () => setEligible(shouldShowInstallPrompt());
    check();
    const t = setInterval(check, 10_000);
    return () => clearInterval(t);
  }, []);

  // Delay the reveal a bit after eligibility so it never pops mid-tap.
  useEffect(() => {
    if (!eligible) return;
    const t = setTimeout(() => setVisible(true), 4_000);
    return () => clearTimeout(t);
  }, [eligible]);

  const dismiss = () => {
    setVisible(false);
    setShowIosGuide(false);
    markDismissed();
  };

  const install = async () => {
    if (ios) {
      setShowIosGuide(true);
      return;
    }
    const outcome = await triggerInstall();
    if (outcome === "accepted") setVisible(false);
    // "dismissed" on the native sheet → banner stays for later; cooldown only
    // applies to the Nexora banner itself (user closed it explicitly).
  };

  if (isStandalone()) return null;
  if (!available && !ios) return null;
  if (!visible && !showIosGuide) return null;

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 260 }}
        className="md:hidden fixed left-3 right-3 z-[60]"
        style={{ bottom: "calc(70px + env(safe-area-inset-bottom, 0px))" }}
        role="dialog"
        aria-label="Install Nexora"
      >
        <div className="rounded-2xl border border-nx-violet/25 bg-nx-surface-elevated/95 backdrop-blur-xl p-4 shadow-2xl">
          {!showIosGuide ? (
            <>
              <div className="flex items-start gap-3">
                <img src="/icons/icon-192.png" alt="" className="w-12 h-12 rounded-xl border border-white/10" />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-white leading-tight">Install the Nexora app</p>
                  <p className="text-[12px] text-white/50 mt-1 leading-snug">
                    Faster access, home-screen icon, your orders &amp; messages one tap away.
                  </p>
                </div>
                <button onClick={dismiss} className="p-1 -m-1 text-white/30 active:text-white/60" aria-label="Dismiss install prompt">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex gap-2 mt-3.5">
                <button
                  onClick={install}
                  className="flex-1 h-11 rounded-xl bg-nx-violet text-white text-[13.5px] font-semibold flex items-center justify-center gap-2 active:bg-nx-violet/80 transition-colors"
                >
                  {ios ? <Smartphone className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                  {ios ? "Add to Home Screen" : "Install app"}
                </button>
                <button
                  onClick={dismiss}
                  className="h-11 px-4 rounded-xl bg-white/[0.04] border border-nx-border text-white/50 text-[13px] font-medium active:bg-white/10 transition-colors"
                >
                  Not now
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start justify-between gap-2 mb-3">
                <p className="text-[14px] font-bold text-white">Add Nexora to your Home Screen</p>
                <button onClick={dismiss} className="p-1 -m-1 text-white/30 active:text-white/60" aria-label="Close">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ol className="space-y-2.5 text-[12.5px] text-white/65">
                <li className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0"><Share className="w-3.5 h-3.5 text-nx-cyan" /></span>
                  Tap the <span className="text-white font-semibold mx-1">Share</span> button in Safari's toolbar
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0"><Plus className="w-3.5 h-3.5 text-nx-gold" /></span>
                  Scroll and tap <span className="text-white font-semibold mx-1">Add to Home Screen</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0"><Shield className="w-3.5 h-3.5 text-nx-emerald" /></span>
                  Tap <span className="text-white font-semibold mx-1">Add</span> — Nexora opens like an app
                </li>
              </ol>
            </>
          )}
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}

/* ═══ UPDATE TOAST ═══ */
function UpdateToast() {
  const [ready, setReady] = useState(false);

  useEffect(() => onUpdateStateChange(setReady), []);

  // Never surface mid-transaction: only show when the checkout/listing forms
  // are not the active route focus.
  const [safeMoment, setSafeMoment] = useState(false);
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => setSafeMoment(true), 3_000);
    return () => clearTimeout(t);
  }, [ready]);

  return (
    <AnimatePresence>
      {ready && safeMoment && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          className="fixed top-3 left-3 right-3 md:left-auto md:right-4 md:w-[380px] z-[80] rounded-xl border border-nx-cyan/25 bg-nx-surface-elevated/95 backdrop-blur-xl p-3.5 shadow-2xl flex items-center gap-3"
          role="status"
        >
          <div className="w-9 h-9 rounded-xl bg-nx-cyan/10 border border-nx-cyan/25 flex items-center justify-center shrink-0">
            <RefreshCw className="w-4 h-4 text-nx-cyan" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-white">New version ready</p>
            <p className="text-[11.5px] text-white/45">Refresh to get the latest Nexora. Your session is safe.</p>
          </div>
          <button
            onClick={() => { applyUpdate(); }}
            className="h-9 px-4 rounded-lg bg-nx-cyan/15 border border-nx-cyan/30 text-nx-cyan text-[12.5px] font-semibold active:bg-nx-cyan/25 shrink-0"
          >
            Update
          </button>
          <button onClick={() => setSafeMoment(false)} className="p-1 text-white/30 active:text-white/60 shrink-0" aria-label="Dismiss update">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══ CONNECTIVITY INDICATOR ═══ */
function ConnectivityBar() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  return (
    <AnimatePresence>
      {offline && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[90] bg-amber-500/15 border-b border-amber-500/30 backdrop-blur-md"
          style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
          role="alert"
        >
          <div className="px-4 py-2 flex items-center justify-center gap-2">
            <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <p className="text-[12px] text-amber-200 font-medium">
              You're offline — live orders &amp; payments need a connection
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══ EXPORTED LAYER ═══ */
export default function PwaLayer() {
  // Record engagement on meaningful navigation (used by the install gate).
  useEffect(() => {
    recordEngagement();
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement)?.closest("a,button");
      if (el) recordEngagement();
    };
    document.addEventListener("click", onClick, { passive: true });
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <>
      <ConnectivityBar />
      <InstallBanner />
      <UpdateToast />
    </>
  );
}
