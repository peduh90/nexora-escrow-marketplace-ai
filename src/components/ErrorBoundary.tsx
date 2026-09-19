import React from "react";
import { Shield, AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  showReload?: boolean;
  /** When any of these values change, a caught error is cleared and children
   *  re-render. Lets a route boundary auto-recover when the user navigates. */
  resetKeys?: unknown[];
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
    this.autoRecoverFromStaleChunk(error);
  }

  /**
   * Deploy resilience: after a redeploy, an already-open tab can hold HTML
   * that references pruned hashed chunks — the lazy import fails and the
   * screen "hits a snag". Detect that case and recover once per session:
   * purge the service-worker caches (which hold the stale shell) and reload.
   */
  private autoRecoverFromStaleChunk(error: Error) {
    const msg = error.message || "";
    const isChunkFailure =
      /Failed to fetch dynamically imported module/i.test(msg) ||
      /Importing a module script failed/i.test(msg) ||
      /error loading dynamically imported module/i.test(msg) ||
      /Loading chunk \S+ failed/i.test(msg);
    if (!isChunkFailure) return;
    const key = "nx-chunk-recovery";
    if (sessionStorage.getItem(key)) return; // recover only once per session
    sessionStorage.setItem(key, "1");
    const cacheStorage = (window as unknown as { caches?: CacheStorage }).caches;
    if (cacheStorage) {
      cacheStorage.keys()
        .then((keys) => Promise.all(keys.map((k) => cacheStorage.delete(k))))
        .catch(() => undefined)
        .finally(() => window.location.reload());
    } else {
      window.location.reload();
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (
      this.state.hasError &&
      this.props.resetKeys &&
      prevProps.resetKeys &&
      this.props.resetKeys.some((k, i) => k !== prevProps.resetKeys?.[i])
    ) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-8 bg-transparent">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {this.props.fallbackTitle || "Something went wrong"}
            </h3>
            <p className="text-sm text-white/40 mb-5">
              {this.props.fallbackMessage || "An unexpected error occurred. Please try again."}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-nx-violet/10 text-nx-violet text-sm font-medium hover:bg-nx-violet/20 transition-colors border border-nx-violet/20"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              <a
                href="/marketplace"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.03] text-white/60 text-sm font-medium hover:text-white hover:bg-white/[0.06] transition-colors border border-white/10"
              >
                <Shield className="w-4 h-4" />
                Go Home
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/** Lightweight fallback card for individual components */
export function ComponentFallback({ name }: { name: string }) {
  return (
    <div className="p-6 rounded-xl border border-white/5 bg-white/[0.01] text-center">
      <Shield className="w-6 h-6 text-white/10 mx-auto mb-2" />
      <p className="text-xs text-white/30">{name} could not load</p>
    </div>
  );
}

/** Loading skeleton for cards */
export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-white/[0.03]" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-white/[0.05] rounded w-3/4" />
        <div className="h-4 bg-white/[0.08] rounded w-1/2" />
        <div className="h-2 bg-white/[0.04] rounded w-2/3" />
      </div>
    </div>
  );
}

/** Loading skeleton for list items */
export function SkeletonListItem() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02] animate-pulse">
      <div className="w-16 h-16 rounded-lg bg-white/[0.04]" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-white/[0.05] rounded w-3/4" />
        <div className="h-4 bg-white/[0.08] rounded w-1/3" />
        <div className="h-2 bg-white/[0.04] rounded w-1/2" />
      </div>
    </div>
  );
}

/** Loading skeleton for stat cards */
export function SkeletonStat() {
  return (
    <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] animate-pulse">
      <div className="h-3 bg-white/[0.04] rounded w-1/2 mb-2" />
      <div className="h-6 bg-white/[0.08] rounded w-2/3" />
    </div>
  );
}
