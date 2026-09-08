/**
 * Stable per-browser anonymous viewer id used for deduplicating real view
 * counts. Never sent anywhere except the view counter. Signed-in users are
 * deduped server-side by their account id instead.
 */
export function getViewerKey(): string {
  if (typeof window === "undefined") return "";
  const KEY = "nx_viewer_id";
  try {
    let id = window.localStorage.getItem(KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `v${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      window.localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}
