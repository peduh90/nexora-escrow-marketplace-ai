import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import SellerLayout from "./SellerLayout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { KENYA_COUNTIES } from "@/lib/kenya-locations";
import { Upload, CheckCircle2, Clock, AlertTriangle, Building2, ChevronRight, FileCheck, Loader2 } from "lucide-react";

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay }} className={className}>{children}</motion.div>;
}

export default function SellerKYC() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "",
    businessType: "",
    registrationNumber: "",
    taxPin: "",
    county: "",
    town: "",
    phone: "",
  });
  const [idDoc, setIdDoc] = useState<File | null>(null);
  const [businessDoc, setBusinessDoc] = useState<File | null>(null);

  const myApplications = useQuery(api.admin.getMyKYCApplications);
  const submitKYC = useMutation(api.admin.submitKYC);
  const generateUploadUrl = useMutation(api.listings.generateUploadUrl);

  const activeApplication = myApplications?.find(
    (a: any) => a.status === "pending"
  ) ?? myApplications?.[0];

  // The application's status is the source of truth once one exists —
  // it updates instantly on submit and again when admin reviews it.
  const kycStatus = activeApplication
    ? activeApplication.status === "approved"
      ? "verified"
      : activeApplication.status === "rejected"
      ? "rejected"
      : "pending"
    : (user as any)?.kycStatus === "verified"
    ? "verified"
    : "not_started";

  const uploadDoc = async (file: File): Promise<string> => {
    const uploadUrl = await generateUploadUrl();
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });
    const data = (await response.json()) as { storageKey?: string; storageId?: string; key?: string };
    const key = data.storageKey || data.storageId || data.key;
    if (!key) throw new Error("Document upload failed — please try again");
    return key;
  };

  const handleSubmit = async () => {
    if (!formData.businessName.trim() || !formData.businessType || !formData.county || !formData.town.trim() || !formData.phone.trim()) {
      toast.error("Please complete all required business fields");
      setStep(1);
      return;
    }
    if (!idDoc) {
      toast.error("Upload your National ID or Passport in step 2");
      setStep(2);
      return;
    }
    setSubmitting(true);
    try {
      const idDocumentUrl = await uploadDoc(idDoc);
      const businessDocumentUrl = businessDoc ? await uploadDoc(businessDoc) : undefined;
      await submitKYC({
        businessName: formData.businessName.trim(),
        businessType: formData.businessType,
        registrationNumber: formData.registrationNumber.trim() || undefined,
        taxPin: formData.taxPin.trim() || undefined,
        county: formData.county,
        town: formData.town.trim(),
        phone: formData.phone.trim(),
        idDocumentUrl,
        businessDocumentUrl,
      });
      toast.success("Verification submitted — the Nexora team will review it shortly");
      setStep(1);
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit verification");
    } finally {
      setSubmitting(false);
    }
  };

  const docInput = (
    label: string,
    hint: string,
    file: File | null,
    setFile: (f: File | null) => void,
    inputRef: React.RefObject<HTMLInputElement | null>
  ) => (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`w-full p-4 rounded-lg border border-dashed text-center transition-colors ${
          file ? "border-nx-violet/40 bg-nx-violet/[0.04]" : "border-white/10 hover:border-nx-violet/30"
        }`}
      >
        {file ? <FileCheck className="w-8 h-8 text-nx-violet mx-auto mb-2" /> : <Upload className="w-8 h-8 text-white/20 mx-auto mb-2" />}
        <p className="text-sm text-white/50">{file ? file.name : label}</p>
        <p className="text-[10px] text-white/25 mt-1">{file ? "Tap to replace" : hint}</p>
      </button>
    </div>
  );

  const idDocRef = useRef<HTMLInputElement>(null);
  const bizDocRef = useRef<HTMLInputElement>(null);

  return (
    <SellerLayout>
      <div className="space-y-6 max-w-3xl">
        <FadeIn>
          <h1 className="text-2xl font-bold text-white">Business Verification</h1>
          <p className="text-sm text-white/40 mt-1">Required for selling physical products in the Normal Marketplace — freelance services & digital tools don't need it</p>
        </FadeIn>

        {/* Status Card */}
        <FadeIn delay={0.05}>
          <div className={`p-5 rounded-xl border ${
            kycStatus === "verified" ? "border-emerald-400/15 bg-emerald-400/[0.03]" :
            kycStatus === "pending" ? "border-amber-400/15 bg-amber-400/[0.03]" :
            kycStatus === "rejected" ? "border-red-400/15 bg-red-400/[0.03]" :
            "border-white/5 bg-white/5"
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                kycStatus === "verified" ? "bg-emerald-400/10" :
                kycStatus === "pending" ? "bg-amber-400/10" :
                "bg-white/5"
              }`}>
                {kycStatus === "verified" ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> :
                 kycStatus === "pending" ? <Clock className="w-6 h-6 text-amber-400" /> :
                 kycStatus === "rejected" ? <AlertTriangle className="w-6 h-6 text-red-400" /> :
                 <Upload className="w-6 h-6 text-white/30" />}
              </div>
              <div>
                <h3 className={`text-base font-semibold ${
                  kycStatus === "verified" ? "text-emerald-400" :
                  kycStatus === "pending" ? "text-amber-400" :
                  kycStatus === "rejected" ? "text-red-400" :
                  "text-white"
                }`}>
                  {kycStatus === "verified" ? "Business Verified ✓" :
                   kycStatus === "pending" ? "Verification In Progress" :
                   kycStatus === "rejected" ? "Verification Rejected" :
                   "Not Yet Verified"}
                </h3>
                <p className="text-sm text-white/40">
                  {kycStatus === "verified" ? "Your business has been verified. Full access unlocked." :
                   kycStatus === "pending" ? "Your application is with the Nexora team for review. You'll be notified on the decision." :
                   kycStatus === "rejected" ? "Your application was rejected. Please re-submit with correct details below." :
                   "Complete verification to build buyer trust and unlock the verified badge."}
                </p>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Benefits */}
        <FadeIn delay={0.08}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { title: "Verified Badge", desc: "Trust signal displayed on your store", icon: CheckCircle2, color: "#10B981" },
              { title: "Lower Fees", desc: "Reduce commission as you grow", icon: CheckCircle2, color: "#06B6D4" },
              { title: "Full Seller Features", desc: "Unlock every seller tool", icon: Building2, color: "#8B5CF6" },
            ].map((b) => (
              <div key={b.title} className="p-4 rounded-xl border border-white/5 bg-white/5">
                <b.icon className="w-5 h-5 mb-2" style={{ color: b.color }} />
                <h4 className="text-sm font-semibold text-white">{b.title}</h4>
                <p className="text-[11px] text-white/30 mt-0.5">{b.desc}</p>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* KYC Form — hidden while a pending application is under review */}
        {kycStatus !== "verified" && kycStatus !== "pending" && (
          <FadeIn delay={0.1}>
            <div className="p-6 rounded-xl border border-white/5 bg-white/5">
              <div className="flex items-center gap-2 mb-6">
                <Building2 className="w-5 h-5 text-nx-violet" />
                <h3 className="text-base font-semibold text-white">Business Information</h3>
              </div>

              {/* Steps */}
              <div className="flex items-center gap-2 mb-8">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      step >= s ? "bg-nx-violet text-white" : "bg-white/5 text-white/30"
                    }`}>{s}</div>
                    {s < 3 && <div className={`w-12 h-0.5 ${step > s ? "bg-nx-violet" : "bg-white/5"}`} />}
                  </div>
                ))}
              </div>
              <div className="flex gap-4 text-xs text-white/30 mb-6">
                <span className={step === 1 ? "text-nx-violet" : ""}>Business Info</span>
                <span className={step === 2 ? "text-nx-violet" : ""}>Documents</span>
                <span className={step === 3 ? "text-nx-violet" : ""}>Review</span>
              </div>

              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Business Name *</label>
                    <input value={formData.businessName} onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      placeholder="e.g. TechHub Electronics Ltd"
                      className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/50 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Business Type *</label>
                    <select value={formData.businessType} onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white focus:border-nx-violet/50 focus:outline-none">
                      <option value="">Select type</option>
                      <option value="sole_proprietor">Sole Proprietor</option>
                      <option value="limited_company">Limited Company</option>
                      <option value="partnership">Partnership</option>
                      <option value="cooperative">Cooperative</option>
                      <option value="individual">Individual Seller</option>
                    </select>
                  </div>
                  {formData.businessType === "individual" ? (
                    <div className="p-3 rounded-lg bg-nx-emerald/[0.04] border border-nx-emerald/15">
                      <p className="text-xs text-white/50 leading-relaxed">
                        <span className="text-nx-emerald font-medium">Selling as an individual?</span> No business registration or KRA PIN is needed —
                        small-scale sellers are welcome. Your National ID is all the verification required.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-white/40 mb-1.5 block">Registration Number <span className="text-white/25">(optional)</span></label>
                        <input value={formData.registrationNumber} onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                          placeholder="PVT-XXXXXXX — leave blank if not registered"
                          className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/50 focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-xs text-white/40 mb-1.5 block">KRA PIN <span className="text-white/25">(optional)</span></label>
                        <input value={formData.taxPin} onChange={(e) => setFormData({ ...formData, taxPin: e.target.value })}
                          placeholder="A123456789B — leave blank if you don't have one"
                          className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/50 focus:outline-none" />
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-white/40 mb-1.5 block">County *</label>
                      <select value={formData.county} onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white focus:border-nx-violet/50 focus:outline-none">
                        <option value="">Select county</option>
                        {KENYA_COUNTIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-white/40 mb-1.5 block">Town *</label>
                      <input value={formData.town} onChange={(e) => setFormData({ ...formData, town: e.target.value })}
                        placeholder="e.g. Westlands"
                        className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/50 focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Phone Number *</label>
                    <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+254 7XX XXX XXX"
                      className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/50 focus:outline-none" />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  {docInput("Upload National ID / Passport", "PDF, JPG, PNG (max 5MB) — required", idDoc, setIdDoc, idDocRef)}
                  {docInput("Upload Business Registration Certificate", "PDF, JPG, PNG — optional but recommended", businessDoc, setBusinessDoc, bizDocRef)}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-white/[0.02] space-y-2">
                    {[
                      { label: "Business Name", value: formData.businessName || "Not provided" },
                      { label: "Business Type", value: formData.businessType || "Not provided" },
                      { label: "Registration No.", value: formData.businessType === "individual" ? "— not required for individual sellers" : formData.registrationNumber || "Not provided (optional)" },
                      { label: "KRA PIN", value: formData.businessType === "individual" ? "— not required for individual sellers" : formData.taxPin || "Not provided (optional)" },
                      { label: "Location", value: `${formData.town || "?"}, ${formData.county || "?"}` },
                      { label: "Phone", value: formData.phone || "Not provided" },
                      { label: "ID Document", value: idDoc ? idDoc.name : "Missing — required" },
                      { label: "Business Document", value: businessDoc ? businessDoc.name : "Not provided" },
                    ].map((f) => (
                      <div key={f.label} className="flex items-center justify-between">
                        <span className="text-xs text-white/30">{f.label}</span>
                        <span className={`text-xs ${f.value.startsWith("Missing") ? "text-red-400" : "text-white/70"}`}>{f.value}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-white/30 text-center">
                    By submitting, you agree to Nexora's Terms of Service and Privacy Policy.
                  </p>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8">
                <button onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1 || submitting}
                  className="px-4 py-2 rounded-lg text-sm text-white/40 hover:text-white/60 disabled:opacity-30 transition-colors">
                  Back
                </button>
                {step < 3 ? (
                  <button onClick={() => setStep(step + 1)}
                    className="px-5 py-2 rounded-lg bg-nx-violet text-white text-sm font-medium hover:bg-nx-violet/80 transition-colors flex items-center gap-1">
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={submitting}
                    className="px-5 py-2 rounded-lg bg-emerald-400 text-white text-sm font-medium hover:bg-emerald-400/80 transition-colors flex items-center gap-2 disabled:opacity-50">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {submitting ? "Submitting…" : "Submit for Review"}
                  </button>
                )}
              </div>
            </div>
          </FadeIn>
        )}

        {/* Submission history */}
        {myApplications && myApplications.length > 0 && (
          <FadeIn delay={0.12}>
            <div>
              <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-2 px-1">Submission History</h3>
              <div className="rounded-xl border border-white/5 bg-white/[0.02] divide-y divide-white/[0.03]">
                {myApplications.map((app: any) => (
                  <div key={app._id} className="flex items-center gap-3 px-4 py-3">
                    <FileCheck className={`w-4 h-4 shrink-0 ${app.status === "approved" ? "text-emerald-400" : app.status === "rejected" ? "text-red-400" : "text-amber-400"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/80 truncate">{app.businessName}</p>
                      <p className="text-[11px] text-white/30">
                        Submitted {new Date(app.submittedAt).toLocaleDateString()}
                        {app.reviewedAt ? ` · Reviewed ${new Date(app.reviewedAt).toLocaleDateString()}` : ""}
                        {app.status === "rejected" && app.reviewNotes ? ` · ${app.reviewNotes}` : ""}
                      </p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium shrink-0 ${
                      app.status === "approved" ? "bg-emerald-400/10 text-emerald-400" :
                      app.status === "rejected" ? "bg-red-400/10 text-red-400" :
                      "bg-amber-400/10 text-amber-400"
                    }`}>{app.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        )}
      </div>
    </SellerLayout>
  );
}
