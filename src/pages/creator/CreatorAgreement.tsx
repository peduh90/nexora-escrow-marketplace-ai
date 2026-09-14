import { useState } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import NavigationBar from "@/components/layout/NavigationBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Circle, Clock, Loader2, PenLine, ShieldCheck,
} from "lucide-react";

/**
 * Embedded Nexora Creator Referral Declaration & Agreement.
 *
 * The creator reads the terms, fills the declaration, types their signature
 * and ticks the agree box. Submission goes to the admin panel for review —
 * the program (and the referral link) activates only after an admin approves.
 *
 * `CreatorAgreementFlow` is exported so the same document can be embedded
 * directly inside the Creator Dashboard as a hard gate: no dashboard and no
 * shareable referral link until this document is signed and approved.
 */

const COMMISSION_ROWS = [
  { milestone: "Verified user signup", payout: "KSh 10" },
  { milestone: "Seller fully activated", payout: "KSh 20" },
  { milestone: "Freelancer fully activated", payout: "KSh 20" },
  { milestone: "Employer fully activated", payout: "KSh 25" },
  { milestone: "First completed transaction", payout: "KSh 30" },
  { milestone: "Referral commission on subsequent transactions", payout: "5%" },
  { milestone: "Maximum referral commission per transaction", payout: "KSh 50" },
];

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <h3 className="text-sm font-bold text-[#0A0A12]">
        <span className="text-violet-600 mr-2">{n}.</span>{title}
      </h3>
      <div className="mt-1.5 space-y-1.5 text-[13px] text-black/65 leading-relaxed">{children}</div>
    </div>
  );
}

/** The fillable document itself (only rendered when nothing is pending). */
function CreatorAgreementDocument({ reviewNote }: { reviewNote?: string }) {
  const { user } = useAuth();
  const submit = useMutation(api.referralAgreement.submitAgreement);

  const [fullName, setFullName] = useState((user as any)?.name || "");
  const [phone, setPhone] = useState((user as any)?.phone || "");
  const [email, setEmail] = useState((user as any)?.email || "");
  const [creatorCode, setCreatorCode] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [signature, setSignature] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    if (!agreed) {
      toast.error("Tick the agreement checkbox to continue");
      return;
    }
    setBusy(true);
    try {
      await submit({
        fullName,
        phone,
        email,
        creatorCode: creatorCode || undefined,
        signature,
        agreedTerms: true,
        // The commission structure is fixed by Nexora — record the official
        // schedule in effect at signing time for the admin's copy.
        commissionScheduleJson: JSON.stringify(
          Object.fromEntries(COMMISSION_ROWS.map((r) => [r.milestone, r.payout])),
        ),
      });
      toast.success("Agreement signed — sent to the Nexora team for review");
    } catch (err: any) {
      toast.error(err?.message || "Could not submit the agreement");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/8 bg-white p-6 md:p-10 text-[#0A0A12] shadow-2xl">
      {reviewNote && (
        <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          Your previous submission was not approved{reviewNote ? ` — ${reviewNote}` : ""}. Update
          your details below and resubmit.
        </div>
      )}

      {/* Document header */}
      <div className="flex items-center gap-3 border-b-2 border-[#0A0A12] pb-3">
        <div className="w-9 h-9 rounded bg-[#0A0A12] text-white flex items-center justify-center font-black">N</div>
        <p className="font-bold tracking-wide">NEXORA MARKET</p>
        <span className="text-xs text-black/40">| Creator Referral Program</span>
      </div>
      <h1 className="text-center text-2xl md:text-3xl font-black mt-6 leading-tight">
        NEXORA CREATOR REFERRAL
        <br />
        <span className="text-violet-600">DECLARATION &amp; AGREEMENT</span>
      </h1>
      <p className="text-center text-xs italic text-black/50 mt-3 max-w-lg mx-auto">
        This document sets out the terms under which a Creator / Referral Partner
        promotes Nexora Marketplace and earns referral commissions.
      </p>

      <p className="mt-6 text-sm">
        I, <span className="border-b border-black/40 px-6">{fullName || "____________________"}</span>, hereby
        confirm that I wish to participate as a Nexora Creator / Referral Partner and to promote Nexora
        Marketplace and its services. By signing this agreement, I confirm that the information I provide is
        accurate, and that I understand and agree to the following terms.
      </p>

      <Section n={1} title="Creator Referral Earnings">
        <p>I understand that I may earn commissions for genuine users referred through my unique referral
          link or code, according to the official Nexora commission structure below — fixed by Nexora
          and non-negotiable:</p>
        <div className="mt-2.5 overflow-hidden rounded-lg border border-black/15">
          <table className="w-full text-xs text-[#0A0A12]">
            <thead>
              <tr className="bg-[#0A0A12] text-white">
                <th className="text-left px-3 py-2 font-semibold">Milestone</th>
                <th className="text-right px-3 py-2 font-semibold w-40">Payout</th>
              </tr>
            </thead>
            <tbody>
              {COMMISSION_ROWS.map((r, i) => (
                <tr key={r.milestone} className={i % 2 ? "bg-black/[0.03]" : ""}>
                  <td className="px-3 py-1.5 font-medium text-black/85">{r.milestone}</td>
                  <td className="px-3 py-1.5 text-right font-bold text-black/90">{r.payout}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] italic text-black/45">
          Commission amounts are set solely by Nexora and may be reviewed for future referrals; they are
          not negotiated with creators. The structure above was in effect when this agreement was signed.
        </p>
      </Section>

      <Section n={2} title="Genuine Referrals">
        <p>I agree that I will only refer genuine users. I will not create fake accounts, duplicate accounts,
          use bots, automated registrations, or otherwise manipulate the referral system.</p>
        <p>Nexora may review, reject, or reverse commissions associated with fraudulent, duplicate,
          misleading, or invalid referrals.</p>
      </Section>

      <Section n={3} title="Creator Responsibilities">
        <p>I agree to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Promote Nexora honestly and professionally.</li>
          <li>Provide accurate information when registering as a creator.</li>
          <li>Use only my assigned referral link / code.</li>
          <li>Avoid misleading customers or making false promises.</li>
          <li>Respect Nexora's brand, users, and platform rules.</li>
          <li>Notify Nexora if I identify suspicious referral activity.</li>
        </ul>
      </Section>

      <Section n={4} title="Verification &amp; Payment">
        <p>I understand that commissions may only become payable after the required verification or
          activation conditions have been completed.</p>
        <p>I agree to provide the necessary information for creator verification and payment processing,
          including: full legal name, phone number, email address, creator / social media profile,
          referral link / code information and preferred payment details.</p>
        <p className="font-bold text-black/80">
          I understand that Nexora will never require me to provide passwords, OTP codes, PINs, or other
          private account credentials.
        </p>
      </Section>

      <Section n={5} title="Commission Review">
        <p>Nexora reserves the right to review referral activity before releasing commissions. Invalid,
          fraudulent, duplicated, or manipulated referrals may be excluded from commission calculations.</p>
        <p>Commission rules may be updated for future referrals, while already-approved earnings will be
          handled according to the applicable terms at the time they were approved.</p>
      </Section>

      <Section n={6} title="Declaration">
        <blockquote className="border-l-4 border-violet-500 pl-3 italic text-black/60">
          "I have read, understood, and voluntarily agree to the Nexora Creator Referral Terms. I confirm
          that the information I have provided is accurate, and I agree to promote Nexora honestly and
          follow the referral rules."
        </blockquote>
      </Section>

      {/* Creator declaration form */}
      <div className="mt-6 rounded-xl border border-black/15 bg-black/[0.02] p-5 space-y-4">
        <p className="text-sm font-bold text-violet-700">Creator Declaration</p>
        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          <label className="space-y-1">
            <span className="font-semibold">Creator Full Name</span>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="w-full border-b border-black/40 bg-transparent px-1 py-1.5 outline-none focus:border-violet-500" />
          </label>
          <label className="space-y-1">
            <span className="font-semibold">Phone Number</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel"
              className="w-full border-b border-black/40 bg-transparent px-1 py-1.5 outline-none focus:border-violet-500" />
          </label>
          <label className="space-y-1">
            <span className="font-semibold">Email</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email"
              className="w-full border-b border-black/40 bg-transparent px-1 py-1.5 outline-none focus:border-violet-500" />
          </label>
          <label className="space-y-1">
            <span className="font-semibold">Creator / Referral Code</span>
            <input value={creatorCode} onChange={(e) => setCreatorCode(e.target.value)}
              className="w-full border-b border-black/40 bg-transparent px-1 py-1.5 outline-none focus:border-violet-500"
              placeholder="e.g. NX-AMINA" />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="font-semibold flex items-center gap-1.5"><PenLine className="w-3.5 h-3.5" /> Signature (type your full name)</span>
            <input value={signature} onChange={(e) => setSignature(e.target.value)}
              className="w-full border-b-2 border-black/60 bg-transparent px-1 py-1.5 outline-none focus:border-violet-500 text-sm italic" />
          </label>
        </div>
        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-violet-600" />
          <span className="text-sm font-semibold">
            I agree to the Nexora Creator Referral Declaration &amp; Agreement.
          </span>
        </label>
        <button
          onClick={handleSubmit}
          disabled={busy || !agreed}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-white text-sm font-semibold hover:bg-violet-500 transition-colors disabled:opacity-40"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          {busy ? "Submitting…" : "Submit for admin review"}
        </button>
        {!agreed && (
          <p className="text-xs text-black/40">Tick the agreement box above to enable submission.</p>
        )}
      </div>

      <p className="text-center text-[10px] text-black/40 mt-5">
        Nexora Creator Referral Declaration &amp; Agreement • submitted digitally for admin review
      </p>
    </div>
  );
}

/**
 * The full agreement flow: status cards for pending/approved submissions,
 * the fillable document otherwise. Embedded in the Creator Dashboard as the
 * gate and rendered standalone on /creator/agreement.
 */
export function CreatorAgreementFlow() {
  const navigate = useNavigate();
  const { isLoading, isAuthenticated } = useAuth();
  const my = useQuery(api.referralAgreement.getMyAgreement, isAuthenticated ? {} : "skip");

  if (isLoading || (isAuthenticated && my === undefined)) {
    return (
      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-10 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-violet-500/15 border border-violet-400/25 flex items-center justify-center mx-auto">
          <PenLine className="w-5 h-5 text-violet-300" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-white">Sign the Creator Agreement</h2>
        <p className="mt-2 text-sm text-white/55 max-w-md mx-auto">
          The agreement is filled and signed inside your account. Sign in or create a free account
          first — it takes two minutes.
        </p>
        <button
          onClick={() => navigate("/auth?returnTo=" + encodeURIComponent("/creator/agreement"))}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-500 hover:bg-violet-400 px-6 py-3 text-sm font-semibold text-white transition-colors"
        >
          Sign in to continue <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const status = (my as any)?.status;

  if (status === "pending") {
    return (
      <div className="rounded-2xl border border-amber-400/20 bg-amber-500/[0.06] p-6 md:p-8">
        <div className="flex items-center gap-3">
          <Clock className="w-6 h-6 text-amber-300" />
          <h2 className="text-xl md:text-2xl font-bold text-white">Agreement signed — under review</h2>
        </div>
        <p className="mt-3 text-white/55 max-w-2xl">
          You signed the Creator Referral Agreement on{" "}
          {my ? new Date((my as any).createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" }) : "—"}{" "}
          and it is now with the Nexora team for review. Your referral link activates the moment it is
          approved — you'll get a notification with the decision.
        </p>
        <button
          onClick={() => {
            // The dashboard is gated above this document — scroll the signed
            // state's context into view instead of re-rendering the same page.
            navigate("/creator");
            setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 80);
          }}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white/[0.06] border border-white/10 px-5 py-2.5 text-sm font-semibold text-white/80 hover:text-white transition-colors"
        >
          Back to top <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (status === "approved") {
    return (
      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.06] p-6 md:p-8">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-300" />
          <h2 className="text-xl md:text-2xl font-bold text-white">Agreement approved</h2>
        </div>
        <p className="mt-3 text-white/55 max-w-2xl">
          Your Creator Referral Agreement is approved and on file with Nexora.
        </p>
        <button
          onClick={() => navigate("/creator")}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black px-5 py-2.5 text-sm font-bold transition-colors"
        >
          Open Creator dashboard <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return <CreatorAgreementDocument reviewNote={status === "rejected" ? (my as any)?.reviewNote : undefined} />;
}

/** Standalone page: /creator/agreement (linked from the join page). */
export default function CreatorAgreement() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#05050A] text-white pb-32 md:pb-16">
      <NavigationBar />

      <div className="max-w-3xl mx-auto px-4 pt-24 pb-10">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg bg-white/[0.04] border border-white/8 text-white/50 hover:text-white transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="mt-4">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Creator Referral Agreement</h1>
          <p className="mt-2 text-sm text-white/55 max-w-2xl">
            Fill in the declaration, sign and tick "I agree" — the document is submitted straight to the
            Nexora admin team for review. Your referral link and dashboard unlock after approval.
          </p>
        </div>

        <div className="mt-6">
          <CreatorAgreementFlow />
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
}
