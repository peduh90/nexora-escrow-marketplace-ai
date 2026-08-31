import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import SellerLayout from "./SellerLayout";
import { useAuth } from "@/hooks/use-auth";
import { KENYA_COUNTIES } from "@/lib/kenya-locations";
import {
  FileCheck,
  Upload,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  User,
  Phone,
  MapPin,
  Shield,
  ChevronRight,
} from "lucide-react";

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay }} className={className}>{children}</motion.div>;
}

export default function SellerKYC() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    businessName: "",
    businessType: "",
    registrationNumber: "",
    taxPin: "",
    county: "",
    town: "",
    phone: "",
  });

  const kycStatus = user?.kycStatus || "not_started";

  return (
    <SellerLayout>
      <div className="space-y-6 max-w-3xl">
        <FadeIn>
          <h1 className="text-2xl font-bold text-white">Business Verification</h1>
          <p className="text-sm text-white/40 mt-1">Verify your business to unlock full seller features</p>
        </FadeIn>

        {/* Status Card */}
        <FadeIn delay={0.05}>
          <div className={`p-5 rounded-xl border ${
            kycStatus === "verified" ? "border-nx-emerald/15 bg-nx-emerald/[0.03]" :
            kycStatus === "pending" ? "border-nx-gold/15 bg-nx-gold/[0.03]" :
            kycStatus === "rejected" ? "border-red-400/15 bg-red-400/[0.03]" :
            "border-white/5 bg-nx-surface/50"
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                kycStatus === "verified" ? "bg-nx-emerald/10" :
                kycStatus === "pending" ? "bg-nx-gold/10" :
                "bg-white/5"
              }`}>
                {kycStatus === "verified" ? <CheckCircle2 className="w-6 h-6 text-nx-emerald" /> :
                 kycStatus === "pending" ? <Clock className="w-6 h-6 text-nx-gold" /> :
                 <FileCheck className="w-6 h-6 text-white/30" />}
              </div>
              <div>
                <h3 className={`text-base font-semibold ${
                  kycStatus === "verified" ? "text-nx-emerald" :
                  kycStatus === "pending" ? "text-nx-gold" :
                  "text-white"
                }`}>
                  {kycStatus === "verified" ? "Business Verified ✓" :
                   kycStatus === "pending" ? "Verification In Progress" :
                   kycStatus === "rejected" ? "Verification Rejected" :
                   "Not Yet Verified"}
                </h3>
                <p className="text-sm text-white/40">
                  {kycStatus === "verified" ? "Your business has been verified. Full access unlocked." :
                   kycStatus === "pending" ? "We're reviewing your documents. This takes 24-48 hours." :
                   kycStatus === "rejected" ? "Your application was rejected. Please re-submit with correct documents." :
                   "Complete verification to list products and receive payments."}
                </p>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Benefits */}
        <FadeIn delay={0.08}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { title: "List Products", desc: "Post up to unlimited items", icon: Shield, color: "#8B5CF6" },
              { title: "Lower Fees", desc: "5% instead of 10% commission", icon: CheckCircle2, color: "#06B6D4" },
              { title: "Verified Badge", desc: "Trust signal for buyers", icon: Shield, color: "#10B981" },
            ].map((b) => (
              <div key={b.title} className="p-4 rounded-xl border border-white/5 bg-nx-surface/50">
                <b.icon className="w-5 h-5 mb-2" style={{ color: b.color }} />
                <h4 className="text-sm font-semibold text-white">{b.title}</h4>
                <p className="text-[11px] text-white/30 mt-0.5">{b.desc}</p>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* KYC Form */}
        {kycStatus !== "verified" && (
          <FadeIn delay={0.1}>
            <div className="p-6 rounded-xl border border-white/5 bg-nx-surface/50">
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
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-white/40 mb-1.5 block">Registration Number</label>
                      <input value={formData.registrationNumber} onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                        placeholder="PVT-XXXXXXX"
                        className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/50 focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 mb-1.5 block">KRA PIN</label>
                      <input value={formData.taxPin} onChange={(e) => setFormData({ ...formData, taxPin: e.target.value })}
                        placeholder="A123456789B"
                        className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/50 focus:outline-none" />
                    </div>
                  </div>
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
                  <div className="p-4 rounded-lg border border-dashed border-white/10 text-center hover:border-nx-violet/30 transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 text-white/20 mx-auto mb-2" />
                    <p className="text-sm text-white/50">Upload National ID / Passport</p>
                    <p className="text-[10px] text-white/25 mt-1">PDF, JPG, PNG (max 5MB)</p>
                  </div>
                  <div className="p-4 rounded-lg border border-dashed border-white/10 text-center hover:border-nx-violet/30 transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 text-white/20 mx-auto mb-2" />
                    <p className="text-sm text-white/50">Upload Business Registration Certificate</p>
                    <p className="text-[10px] text-white/25 mt-1">Optional but recommended</p>
                  </div>
                  <div className="p-4 rounded-lg border border-dashed border-white/10 text-center hover:border-nx-violet/30 transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 text-white/20 mx-auto mb-2" />
                    <p className="text-sm text-white/50">Upload KRA PIN Certificate</p>
                    <p className="text-[10px] text-white/25 mt-1">Optional but recommended</p>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-white/[0.02] space-y-2">
                    {[
                      { label: "Business Name", value: formData.businessName || "Not provided" },
                      { label: "Business Type", value: formData.businessType || "Not provided" },
                      { label: "Registration No.", value: formData.registrationNumber || "Not provided" },
                      { label: "KRA PIN", value: formData.taxPin || "Not provided" },
                      { label: "Location", value: `${formData.town || "?"}, ${formData.county || "?"}` },
                      { label: "Phone", value: formData.phone || "Not provided" },
                    ].map((f) => (
                      <div key={f.label} className="flex items-center justify-between">
                        <span className="text-xs text-white/30">{f.label}</span>
                        <span className="text-xs text-white/70">{f.value}</span>
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
                <button onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}
                  className="px-4 py-2 rounded-lg text-sm text-white/40 hover:text-white/60 disabled:opacity-30 transition-colors">
                  Back
                </button>
                {step < 3 ? (
                  <button onClick={() => setStep(step + 1)}
                    className="px-5 py-2 rounded-lg bg-nx-violet text-white text-sm font-medium hover:bg-nx-violet/80 transition-colors flex items-center gap-1">
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button className="px-5 py-2 rounded-lg bg-nx-emerald text-white text-sm font-medium hover:bg-nx-emerald/80 transition-colors">
                    Submit for Review
                  </button>
                )}
              </div>
            </div>
          </FadeIn>
        )}
      </div>
    </SellerLayout>
  );
}
