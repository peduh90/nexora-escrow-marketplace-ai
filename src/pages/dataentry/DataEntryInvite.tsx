import DataEntryLayout from "./DataEntryLayout";
import { useState } from "react";
import { useParams } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Loader2, UserPlus, CheckCircle2, XCircle, Store, ShieldCheck } from "lucide-react";

export default function DataEntryInvite() {
  const { id } = useParams<{ id: string }>();
  const invitation = useQuery(api.dataEntry.getInvitation, id ? { invitationId: id as any } : "skip");
  const acceptInvitation = useMutation(api.dataEntry.acceptInvitation);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = async () => {
    if (!id) return;
    setBusy(true);
    setError(null);
    try {
      await acceptInvitation({ invitationId: id as any });
      // Full reload so the auth hook re-reads the freshly granted
      // data_entry role before the panel guard checks it.
      window.location.assign("/data-entry");
    } catch (err: any) {
      setError(err?.message || "Could not accept the invitation.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <DataEntryLayout>
      <div className="max-w-md mx-auto mt-6">
        {invitation === undefined ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-nx-violet animate-spin" /></div>
        ) : invitation === null ? (
          <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.04] p-8 text-center">
            <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h2 className="font-bold text-white">Invitation not found</h2>
            <p className="text-xs text-white/40 mt-1">This link is invalid or the invitation was removed.</p>
          </div>
        ) : (invitation as any).status !== "pending" ? (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] p-8 text-center">
            <XCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <h2 className="font-bold text-white">Invitation {invitation.status}</h2>
            <p className="text-xs text-white/40 mt-1">
              This invitation can no longer be accepted. Ask the seller to send a new one.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-nx-violet/25 bg-gradient-to-br from-nx-violet/[0.12] to-transparent p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-nx-violet/20 border border-nx-violet/30 flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-7 h-7 text-nx-violet" />
            </div>
            <h2 className="text-lg font-bold text-white">Join a seller's data entry team</h2>
            <p className="text-xs text-white/40 mt-1.5">
              {(invitation as any).inviteeName ? `Hi ${(invitation as any).inviteeName} — ` : ""}
              a store invited you to enter and manage products on their behalf.
            </p>

            {(invitation as any).description && (
              <p className="mt-4 text-xs text-white/55 italic">“{(invitation as any).description}”</p>
            )}

            <div className="mt-5 space-y-2 text-left">
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                <Store className="w-4 h-4 text-nx-cyan shrink-0" />
                <span className="text-xs text-white/60">Create product drafts for this store</span>
              </div>
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs text-white/60">
                  {((invitation as any).permissions ?? []).length} permissions granted · seller approves everything before it goes live
                </span>
              </div>
            </div>

            {error && (
              <p className="mt-4 text-xs text-red-300">{error}</p>
            )}

            <button
              onClick={accept}
              disabled={busy}
              className="mt-6 w-full py-3 rounded-xl bg-nx-violet hover:bg-nx-violet/80 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Accept invitation
            </button>
            <p className="mt-3 text-[10px] text-white/25">
              Accepting links this store to your account — you'll see it in your dashboard.
            </p>
          </div>
        )}
      </div>
    </DataEntryLayout>
  );
}
