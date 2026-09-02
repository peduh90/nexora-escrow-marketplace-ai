import React from "react";
import { Shield, AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  showReload?: boolean;
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
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[300px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {this.props.fallbackTitle || "Something went wrong"}
            </h3>
            <p className="text-sm text-white/40 mb-4">
              {this.props.fallbackMessage || "An unexpected error occurred. Please try again."}
            </p>
            {this.props.showReload !== false && (
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-nx-violet/10 text-nx-violet text-sm font-medium hover:bg-nx-violet/20 transition-colors border border-nx-violet/20"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
            )}
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
