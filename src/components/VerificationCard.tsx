import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useNavigate } from "react-router";
import {
  ShieldCheck, ShieldAlert, Check, Circle, ChevronRight, Loader2,
} from "lucide-react";

/**
 * Progressive verification card. Shows the user exactly where they stand:
 *  • Basic verification (everyone) — email, name, phone.
 *  • Business verification (sellers/employers) — the role's full gate.
 * Everything is read live from the server checklist — no client-computed state.
 */
export default function VerificationCard({ variant = "dark" }: { variant?: "dark" | "panel" }) {
  const navigate = useNavigate();
  const status = useQuery(api.verification.getMyVerificationStatus);

  if (status === undefined) {
    return (
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 flex items-center gap-3">
        <Loader2 className="w-4 h-4 animate-spin text-white/30" />
        <span className="text-sm text-white/40">Checking verification status…</span>
      </div>
    );
  }
  if (!status) return null;

  const isBusiness = status.role === "seller" || status.role === "employer";
  if (!isBusiness) {
    // Buyers: light-touch — basic verification only.
    const done = status.basicDone;
    // Fully registered users don't need to see verification chrome — the
    // card only exists to drive unfinished steps.
    if (done) return null;
    return (
      <div className={`rounded-xl border p-5 ${done ? "border-emerald-400/20 bg-emerald-500/[0.05]" : "border-amber-400/20 bg-amber-500/[0.05]"}`}>
        <div className="flex items-start gap-3">
          {done ? (
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">
              {done ? "Your account is verified" : "Finish basic verification"}
            </p>
            <p className="mt-1 text-xs text-white/50 leading-relaxed">
              {done
                ? "Email and phone confirmed. Every purchase you make is escrow-protected."
                : "Confirm your name and phone number so escrow payouts and delivery updates reach you."}
            </p>
            {!done && (
              <button
                onClick={() => {
                  const target = status.requirements.find((r: any) => !r.done);
                  if (target?.action) navigate(target.action);
                }}
                className="mt-3 inline-flex items-center gap-1 rounded-lg bg-amber-400/15 border border-amber-400/30 px-3 py-1.5 text-xs font-medium text-amber-200 hover:bg-amber-400/25"
              >
                Complete now <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const fullyDone = status.businessVerified;
  const pendingReqs = status.requirements.filter((r: any) => !r.done);

  // All checks passed (or a non-business account with nothing left to do):
  // hide the card — a completed checklist is redundant on the dashboard.
  if (fullyDone) return null;

  return (
    <div className={`rounded-xl border p-5 ${fullyDone ? "border-emerald-400/20 bg-emerald-500/[0.05]" : "border-nx-violet/25 bg-nx-violet/[0.06]"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {fullyDone ? (
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-nx-violet shrink-0 mt-0.5" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">
              {fullyDone
                ? status.role === "seller"
                  ? "Fully verified seller"
                  : "Fully verified employer"
                : "Business verification in progress"}
            </p>
            <p className="mt-1 text-xs text-white/50 leading-relaxed">
              {fullyDone
                ? "All business checks passed. You have every platform privilege unlocked."
                : status.role === "seller"
                  ? "Complete these steps to unlock your full seller privileges."
                  : "Complete these steps to unlock your full hiring privileges."}
            </p>
          </div>
        </div>
        <span
          className={`shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full ${
            fullyDone
              ? "bg-emerald-400/15 text-emerald-300"
              : status.level === "basic"
                ? "bg-white/10 text-white/60"
                : "bg-nx-violet/20 text-nx-violet"
          }`}
        >
          {fullyDone ? "Business verified" : "Basic verified"}
        </span>
      </div>

      <ul className="mt-4 space-y-2">
        {status.requirements.map((r: any) => (
          <li
            key={r.key}
            className={`flex items-start gap-2.5 rounded-lg px-3 py-2 ${
              r.done ? "bg-emerald-500/[0.06]" : "bg-white/[0.03]"
            }`}
          >
            {r.done ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <Circle className="w-4 h-4 text-white/25 shrink-0 mt-0.5" />
            )}
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-medium ${r.done ? "text-white/70" : "text-white"}`}>
                {r.label}
              </p>
              {!r.done && r.detail && (
                <p className="mt-0.5 text-[11px] text-white/40 leading-relaxed">{r.detail}</p>
              )}
            </div>
            {!r.done && r.action && (
              <button
                onClick={() => navigate(r.action!)}
                className="shrink-0 inline-flex items-center gap-0.5 text-[11px] font-medium text-nx-violet hover:text-white transition-colors"
              >
                Go <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </li>
        ))}
      </ul>

      {!fullyDone && pendingReqs.length > 0 && (
        <p className="mt-3 text-[10px] text-white/30 leading-relaxed">
          Nexora verifies business accounts progressively — your data is used only for
          verification and fraud prevention, and is reviewed server-side.
        </p>
      )}
    </div>
  );
}
