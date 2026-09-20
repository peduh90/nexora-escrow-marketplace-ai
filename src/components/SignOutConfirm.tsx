import { createContext, useContext, useState, type ReactNode } from "react";
import { LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { absoluteSignOut } from "@/lib/sign-out";
import { useAuth } from "@/hooks/use-auth";

/**
 * ─── SIGN-OUT CONFIRMATION ──────────────────────────────────────────────────
 *
 * Every "Sign out" button in the app routes through here. Instead of
 * immediately ending the session, a confirmation panel appears: the user
 * sees exactly which account is signing out (name, email, current role)
 * and what happens next — they land on the landing page with everything
 * cleared, ready to register or sign in as anyone else.
 *
 * The confirm action performs an ABSOLUTE sign-out (src/lib/sign-out.ts):
 * auth session revoked, all user-scoped browser storage wiped, hard reload.
 * The next registration — same or different email — starts from zero and
 * can never be affected by the previous session's client state.
 */

type ConfirmFn = () => void;

const SignOutContext = createContext<ConfirmFn>(() => {});

/** Call anywhere: const confirmSignOut = useSignOutConfirm(); confirmSignOut(); */
export function useSignOutConfirm(): ConfirmFn {
  return useContext(SignOutContext);
}

export function SignOutProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { user, role, signOut } = useAuth();

  const request = () => setOpen(true);

  const confirm = async () => {
    setBusy(true);
    await absoluteSignOut(signOut);
    // Navigation happens via hard reload inside absoluteSignOut — this line
    // only runs if the reload was blocked (rare), so just close the panel.
    setBusy(false);
    setOpen(false);
  };

  return (
    <SignOutContext.Provider value={request}>
      {children}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm px-4 flex items-center justify-center"
              onClick={() => !busy && setOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 12 }}
                transition={{ type: "spring", damping: 26, stiffness: 340 }}
                className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0A0A12] p-6 shadow-2xl shadow-black/60"
                onClick={(e) => e.stopPropagation()}
                role="alertdialog"
                aria-modal="true"
                aria-label="Confirm sign out"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-2xl bg-red-400/10 border border-red-400/20 flex items-center justify-center shrink-0">
                    <LogOut className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-[15px] font-bold text-white leading-tight">Sign out of Nexora?</h2>
                    <p className="text-[11px] text-white/35 mt-0.5">You'll be signed out on this device.</p>
                  </div>
                </div>

                {/* Which account is signing out — unambiguous */}
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 mb-4">
                  <span className="w-10 h-10 rounded-full bg-nx-violet/15 border border-nx-violet/25 text-nx-violet text-sm font-bold flex items-center justify-center shrink-0">
                    {(user?.name || user?.email?.split("@")[0] || "U")[0].toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-white truncate">{user?.name || user?.email || "Your account"}</p>
                    <p className="text-[11px] text-white/35 truncate">
                      {role ? <span className="capitalize">{role}</span> : "member"}
                      {user?.email ? ` · ${user.email}` : ""}
                    </p>
                  </div>
                </div>

                <p className="text-[12px] text-white/45 leading-relaxed mb-5">
                  Only this device is cleared — <span className="text-white/70 font-medium">nothing is deleted from your account</span>.
                  Your profile, store, listings, orders and wallet balance all stay safe, and the same
                  email + password signs you right back in whenever you return. You can also register a
                  different account with a different email — one email holds one Nexora account with one role.
                </p>

                <div className="flex gap-2.5">
                  <button
                    onClick={() => setOpen(false)}
                    disabled={busy}
                    className="flex-1 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white/60 text-sm font-medium hover:bg-white/[0.07] transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirm}
                    disabled={busy}
                    className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {busy && (
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    )}
                    Sign out
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </SignOutContext.Provider>
  );
}
