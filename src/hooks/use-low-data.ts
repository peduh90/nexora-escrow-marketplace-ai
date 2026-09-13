import { useCallback, useEffect, useState } from "react";

// ─── Low-data mode (#56) ─────────────────────────────────────────────────────
//
// A genuine low-bandwidth experience, not a token toggle: when enabled the app
// drops heavy imagery and animations and prioritises text so the marketplace
// stays usable on inexpensive Android phones and unstable connections.
//
// The preference persists in localStorage. Default ON when the browser reports
// a slow connection or a data-saver preference, so the people who need it get
// it automatically — and can still turn it off.

const STORAGE_KEY = "nexora_low_data_mode";
const BODY_CLASS = "nx-low-data";

function detectSlowConnection(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as any;
  const conn = nav.connection ?? nav.mozConnection ?? nav.webkitConnection;
  if (!conn) return false;
  // saveData=true or an effective type of 2g/slow-2g ⇒ start in low-data mode.
  if (conn.saveData === true) return true;
  const et = String(conn.effectiveType || "").toLowerCase();
  return et === "2g" || et === "slow-2g";
}

function readStored(): boolean | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "1") return true;
    if (raw === "0") return false;
  } catch {
    /* private mode */
  }
  return null;
}

export function useLowData() {
  const [lowData, setLowData] = useState<boolean>(() => {
    const stored = readStored();
    if (stored !== null) return stored;
    return detectSlowConnection();
  });

  useEffect(() => {
    const root = document.documentElement;
    if (lowData) root.classList.add(BODY_CLASS);
    else root.classList.remove(BODY_CLASS);
    return () => root.classList.remove(BODY_CLASS);
  }, [lowData]);

  const toggle = useCallback(() => {
    setLowData((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* private mode */
      }
      return next;
    });
  }, []);

  const set = useCallback((value: boolean) => {
    setLowData(value);
    try {
      localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
    } catch {
      /* private mode */
    }
  }, []);

  return { lowData, toggleLowData: toggle, setLowData: set };
}
