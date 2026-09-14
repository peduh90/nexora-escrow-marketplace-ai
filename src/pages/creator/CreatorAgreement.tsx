import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import NavigationBar from "@/components/layout/NavigationBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import {
  ArrowLeft, CheckCircle2, Loader2, PenLine, ShieldCheck, Circle,
} from "lucide-react";

/**
 * Embedded Nexora Creator Referral Declaration & Agreement.
 * Rendered inline (no external DOCX): the creator reads the terms, fills the
 * declaration, types their signature and ticks the agree box. Submission goes
 * to the admin panel for review — the program activates on approval.
 */

const COMMISSION_ROWS = [
  { label: "Verified user signup", placeholder: "KSh", kind: "money" },
  { label: "Seller activation (fully active)", placeholder: "KSh", kind: "money" },
  { label: "Freelancer activation", placeholder: "KSh", kind: "money" },
  { label: "Employer activation (fully active)", placeholder: "KSh", kind: "money" },
  { label: "First completed transaction", placeholder: "KSh", kind: "money" },
  { label: "Transaction revenue share", placeholder: "%", kind: "percent" },
  { label: "Maximum revenue share per transaction", placeholder: "KSh", kind: "money" },
];

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h3 className="text-sm font-bold text-white">
        <span className="text-nx-violet mr-2">{n}.</span>{title}
      </h3>
      <div className="mt-2 space-y-2 text-xs text-white/55 leading-relaxed">{children}</div>
    </div>
  );
}

export default function CreatorAgreement() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const my = useQuery(api.referralAgreement.getMyAgreement, isAuthenticated ? {} : "skip");
  const submit = useMutation(api.referralAgreement.submitAgreement);

  const [fullName, setFullName] = useState((user as any)?.name || "");
  const [phone, setPhone] = useState((user as any)?.phone || "");
  const [email, setEmail] = useState((user as any)?.email || "");
  const [creatorCode, setCreatorCode] = useState("");
  const [schedule, setSchedule] = useState<Record<string, string>>({});
  const [agreed, setAgreed] = useState(false);
  const [signature, setSignature] = useState("");
  const [busy, setBusy] = useState(false);

  const status = (my as any)?.status;
  const allRowsFilled = useMemo(
    () => COMMISSION_ROWS.every((r) => (schedule[r.label] || "").trim().length > 0),
    [schedule],
  );

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      navigate("/auth?returnTo=" + encodeURIComponent("/creator/agreement"));
      return;
    }
    if (!agreed) {
      toast.error("Tick the agreement checkbox to continue");
      return;
    }
    if (!allRowsFilled) {
      toast.error("Fill in every commission row (or write 0 / TBC)");
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
        commissionScheduleJson: JSON.stringify(schedule),
      });
      toast.success("Agreement submitted — the Nexora team will review it");
    } catch (err: any) {
      toast.error(err?.message || "Could not submit the agreement");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05050A] text-white pb-32 md:pb-16">
      <NavigationBar />

      <div className="max-w-3xl mx-auto px-4 pt-24 pb-10">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg bg-white/[0.04] border border-white/8 text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Document header */}
        <div className="mt-4 rounded-2xl border border-white/8 bg-white p-6 md:p-10 text-[#0A0A12] shadow-2xl">
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

          {status === "pending" ? (
            <div className="mt-8 rounded-xl border border-amber-400/30 bg-amber-50 p-5 text-sm text-amber-800 flex items-start gap-2">
              <Loader2 className="w-4 h-4 mt-0.5 animate-spin" />
              <span>
                You signed the agreement on{" "}
                {my ? new Date((my as any).createdAt).toLocaleDateString() : "—"} and it is now with
                the Nexora team for review. You will get a notification the moment it is approved.
              </span>
            </div>
          ) : status === "approved" ? (
            <div className="mt-8 rounded-xl border border-emerald-400/30 bg-emerald-50 p-5 text-sm text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5" />
              <span>Your agreement is approved — your creator account is active. Visit the Creator Program dashboard.</span>
            </div>
          ) : (
            <>
              <p className="mt-8 text-sm">
                I, <span className="border-b border-black/40 px-6">{fullName || "____________________"}</span>, hereby
                confirm that I wish to participate as a Nexora Creator / Referral Partner and to promote Nexora
                Marketplace and its services. By signing this agreement, I confirm that the information I provide is
                accurate, and that I understand and agree to the following terms.
              </p>

              <Section n={1} title="Creator Referral Earnings">
                <p>I understand that I may earn commissions for genuine users referred through my unique referral
                  link or code, according to the schedule below:</p>
                <div className="mt-3 overflow-hidden rounded-lg border border-black/15">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#0A0A12] text-white">
                        <th className="text-left px-3 py-2 font-semibold">Referral / Milestone</th>
                        <th className="text-left px-3 py-2 font-semibold w-48">Commission</th>
                      </tr>
                    </thead>
                    <tbody>
                      {COMMISSION_ROWS.map((r, i) => (
                        <tr key={r.label} className={i % 2 ? "bg-black/[0.03]" : ""}>
                          <td className="px-3 py-2">{r.label}</td>
                          <td className="px-3 py-1.5">
                            <div className="flex items-center gap-1">
                              <span className="text-black/40 italic">{r.placeholder}</span>
                              <input
                                value={schedule[r.label] || ""}
                                onChange={(e) => setSchedule((s) => ({ ...s, [r.label]: e.target.value }))}
                                className="w-24 border-b border-black/30 bg-transparent px-1 py-0.5 outline-none focus:border-violet-500"
                                placeholder=""
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
              <div className="mt-8 rounded-xl border border-black/15 bg-black/[0.02] p-5 space-y-4">
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
              </div>

              <p className="text-center text-[10px] text-black/40 mt-6">
                Nexora Creator Referral Declaration &amp; Agreement • submitted digitally for admin review
              </p>
            </>
          )}
        </div>

        {/* Sticky submit */}
        {status !== "approved" && status !== "pending" && (
          <div className="fixed bottom-0 inset-x-0 md:left-0 border-t border-white/8 bg-[#0A0A12]/95 backdrop-blur-xl p-4 z-40">
            <div className="max-w-3xl mx-auto flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2 text-xs text-white/50">
                {agreed ? <CheckCircle2 className="w-4 h-4 text-nx-emerald" /> : <Circle className="w-4 h-4 text-white/25" />}
                {agreed ? "Agreed — ready to submit" : "Tick the box above to submit"}
              </div>
              <button
                onClick={handleSubmit}
                disabled={busy || !agreed}
                className="px-6 py-3 rounded-xl bg-nx-violet text-white text-sm font-semibold hover:bg-nx-violet/85 transition-colors disabled:opacity-40 flex items-center gap-2"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Submit for admin review
              </button>
            </div>
          </div>
        )}
      </div>

      <MobileBottomNav />
    </div>
  );
}
