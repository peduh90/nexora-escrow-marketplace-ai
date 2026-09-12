/**
 * Stable anonymous visitor key shared by the /join click tracker and the
 * registration attribution call. Random device identifier — no personal data.
 * Stored in localStorage so a visitor who registers later is still matched to
 * the click they made earlier.
 */
export function getVisitorKey(): string {
  try {
    let key = localStorage.getItem("nx_visitor_key");
    if (!key) {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      key = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      localStorage.setItem("nx_visitor_key", key);
    }
    return key;
  } catch {
    // Storage unavailable (private mode) — ephemeral key, still unique.
    return `eph-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  }
}
