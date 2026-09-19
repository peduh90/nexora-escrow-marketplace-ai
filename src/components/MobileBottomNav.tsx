import { useLocation } from "react-router";

/**
 * RETIRED — the legacy page-level mobile bottom nav has been superseded by the
 * global MobileShell tab bar (Home / Explore / Work / Messages / Account),
 * which already contains every destination this bar offered, plus unread
 * badges and the role-aware Account sheet.
 *
 * Every phone (<md) route renders exactly ONE bottom bar — this one now
 * returns null everywhere. Pages may keep importing it safely; the component
 * is kept so existing imports stay valid.
 */
export default function MobileBottomNav() {
  useLocation();
  return null;
}
