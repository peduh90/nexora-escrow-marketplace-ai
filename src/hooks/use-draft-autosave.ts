import { useCallback, useEffect, useRef, useState } from "react";

// ─── Offline-aware seller mode (#57) ─────────────────────────────────────────
//
// A seller who loses connectivity mid-listing must never lose their work.
// Drafts are written to localStorage (debounced) and restored on return.
// File objects (photos/documents) cannot be serialized, so the draft keeps
// everything else and records how many files were attached — the UI tells the
// seller plainly that images must be re-picked after a restore. Statuses are
// explicit: "saving" → "saved locally" | "failed", plus a live online/offline
// indicator so nothing is ever silently dropped.

export type DraftStatus = "idle" | "saving" | "saved" | "failed";

interface DraftEnvelope<T> {
  data: T;
  savedAt: number;
  /** Non-serializable attachments (Files) are stripped; count kept for UX. */
  imageCount: number;
  documentCount: number;
}

function stripUnserializable<T>(data: T): { safe: T; imageCount: number; documentCount: number } {
  let imageCount = 0;
  let documentCount = 0;
  const walk = (value: any): any => {
    if (value instanceof File) return undefined;
    if (Array.isArray(value)) {
      return value
        .map(walk)
        .filter((v) => v !== undefined);
    }
    if (value && typeof value === "object") {
      const out: Record<string, any> = {};
      for (const [k, v] of Object.entries(value)) {
        // Count attachments before stripping them.
        if (k === "images" && Array.isArray(v)) imageCount = v.filter((i: any) => i?.file instanceof File).length;
        if (k === "documents" && Array.isArray(v)) documentCount = v.filter((d: any) => d?.file instanceof File).length;
        const cleaned = walk(v);
        if (cleaned !== undefined) out[k] = cleaned;
      }
      return out;
    }
    return value;
  };
  return { safe: walk(data) as T, imageCount, documentCount };
}

export function useDraftAutosave<T>(key: string) {
  const [status, setStatus] = useState<DraftStatus>("idle");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [imageCount, setImageCount] = useState(0);
  const [documentCount, setDocumentCount] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track connectivity so the UI can show "saved on this phone — will publish
  // when you're back online" instead of a generic error.
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  const loadDraft = useCallback((): (DraftEnvelope<T> & { restored: boolean }) | null => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as DraftEnvelope<T>;
      return { ...parsed, restored: true };
    } catch {
      return null;
    }
  }, [key]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setStatus("idle");
      setSavedAt(null);
      setImageCount(0);
      setDocumentCount(0);
    } catch {
      // Storage unavailable — nothing to clean.
    }
  }, [key]);

  const saveDraft = useCallback(
    (data: T, opts?: { immediate?: boolean }) => {
      if (timer.current) clearTimeout(timer.current);
      const write = () => {
        setStatus("saving");
        try {
          const { safe, imageCount: ic, documentCount: dc } = stripUnserializable(data);
          const envelope: DraftEnvelope<T> = {
            data: safe,
            savedAt: Date.now(),
            imageCount: ic,
            documentCount: dc,
          };
          localStorage.setItem(key, JSON.stringify(envelope));
          setStatus("saved");
          setSavedAt(envelope.savedAt);
          setImageCount(ic);
          setDocumentCount(dc);
        } catch {
          // Quota exceeded or storage blocked — never silent.
          setStatus("failed");
        }
      };
      if (opts?.immediate) {
        write();
        return;
      }
      timer.current = setTimeout(write, 900);
    },
    [key]
  );

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return { saveDraft, loadDraft, clearDraft, status, savedAt, online, imageCount, documentCount };
}
