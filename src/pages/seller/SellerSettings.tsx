import { useState } from "react";
import { useQuery } from "convex/react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import SellerLayout from "./SellerLayout";
import { api } from "../../convex/_generated/api";
import { Settings, Shield, Bell, CreditCard, User, Lock, Globe, Palette, Phone } from "lucide-react";

const sections = [
  { icon: User, label: "Account", description: "Personal information and preferences" },
  { icon: Lock, label: "Security", description: "Password, two-factor authentication" },
  { icon: Bell, label: "Notifications", description: "Email and push notification preferences" },
  { icon: CreditCard, label: "Payment Methods", description: "M-Pesa and bank account settings" },
  { icon: Shield, label: "Verification", description: "Identity and business verification" },
  { icon: Globe, label: "Language", description: "English (default)" },
  { icon: Palette, label: "Theme", description: "Dark mode (active)" },
];

function AccountSection({ user }: { user: any }) {
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || user?.whatsapp || "");
  const [businessName, setBusinessName] = useState(user?.businessName || "");
  const updateProfile = useMutation(api.users.updateProfile);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ name, phone });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {user?.role === "seller" && (
        <div>
          <label className="text-xs text-white/40 mb-1.5 block">Business Name</label>
          <input value={businessName} onChange={e => setBusinessName(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/50 focus:outline-none" />
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-white/40 mb-1.5 block">Display Name</label>
          <input value={name} onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/50 focus:outline-none" />
        </div>
        <div>
          <label className="text-xs text-white/40 mb-1.5 block">Email</label>
          <input value={email} disabled className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white/40 cursor-not-allowed focus:outline-none" />
        </div>
      </div>
      <div>
        <label className="text-xs text-white/40 mb-1.5 block">Phone</label>
        <input value={phone} onChange={e => setPhone(e.target.value)}
          placeholder="+254 7XX XXX XXX"
          className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/50 focus:outline-none" />
      </div>
      <button onClick={handleSave} disabled={saving || !name.trim()}
        className="px-4 py-2 rounded-lg bg-nx-violet text-white text-sm font-medium hover:bg-nx-violet/80 transition-colors disabled:opacity-50 flex items-center gap-2">
        <span className={saved ? "text-emerald-400" : ""}>{saved ? "✓ Saved" : "Save Changes"}</span>
      </button>
      {user?.role === "seller" && user?.kycStatus !== "verified" && (
        <div className="p-4 rounded-lg bg-amber-400/5 border border-amber-400/10">
          <p className="text-sm text-white/40">Complete <a href="/seller/kyc" className="text-nx-violet hover:underline">business verification</a> to unlock full seller features.</p>
        </div>
      )}
    </div>
  );
}

function SecuritySection({ email }: { email?: string }) {
  const updatePassword = useMutation(api.users.updatePassword);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleChange = async () => {
    setError(null);
    if (next !== confirm) {
      setError("New passwords do not match.");
      return;
    }
    if (next.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    setSaving(true);
    try {
      await updatePassword({
        currentPassword: current || undefined,
        newPassword: next,
        confirmPassword: confirm,
      });
      setDone(true);
      setCurrent("");
      setNext("");
      setConfirm("");
      setTimeout(() => setDone(false), 2500);
    } catch (err: any) {
      setError(err?.message || "Could not change password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 space-y-3">
        <p className="text-sm text-white">Change Password</p>
        <div>
          <label className="text-xs text-white/40 mb-1 block">Current password</label>
          <input type="password" value={current} onChange={e => setCurrent(e.target.value)} autoComplete="current-password"
            className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/50 focus:outline-none" />
          {email && <p className="text-[10px] text-white/20 mt-1">Signing in with {email}</p>}
        </div>
        <div>
          <label className="text-xs text-white/40 mb-1 block">New password</label>
          <input type="password" value={next} onChange={e => setNext(e.target.value)} autoComplete="new-password"
            className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/50 focus:outline-none" />
        </div>
        <div>
          <label className="text-xs text-white/40 mb-1 block">Confirm new password</label>
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password"
            className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/50 focus:outline-none" />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        {done && <p className="text-xs text-emerald-400">Password updated successfully.</p>}
        <button onClick={handleChange} disabled={saving || next.length < 8 || next !== confirm}
          className="px-4 py-2 rounded-lg bg-nx-violet text-white text-xs font-medium hover:bg-nx-violet/80 transition-colors disabled:opacity-40">
          {saving ? "Updating..." : "Update Password"}
        </button>
      </div>
      <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
        <p className="text-sm text-white">Two-Factor Authentication</p>
        <p className="text-xs text-white/30 mt-0.5">Additional 2FA methods are coming with the East Africa expansion. Your account is protected by escrow-verified sign-in.</p>
      </div>
    </div>
  );
}

export default function SellerSettings() {
  const user = useQuery(api.users.currentUser);
  const [activeSection, setActiveSection] = useState("Account");

  if (!user) return (
    <SellerLayout>
      <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-nx-violet/30 border-t-nx-violet rounded-full animate-spin" /></div>
    </SellerLayout>
  );

  return (
    <SellerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-sm text-white/40 mt-1">Manage your account and preferences</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="space-y-1">
            {sections.map(s => (
              <button key={s.label} onClick={() => setActiveSection(s.label)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeSection === s.label ? "bg-nx-violet/10 text-nx-violet" : "text-white/40 hover:text-white/60 hover:bg-white/[0.03]"}`}>
                <s.icon className="w-4 h-4 shrink-0" />
                <span className="text-left">{s.label}</span>
              </button>
            ))}
          </div>
          <div className="lg:col-span-3 p-6 rounded-xl bg-white/[0.02] border border-white/5">
            <h3 className="text-lg font-semibold text-white mb-4">{activeSection}</h3>
            {activeSection === "Account" && <AccountSection user={user} />}
            {activeSection === "Security" && <SecuritySection email={user?.email} />}
            {activeSection === "Notifications" && (
              <div className="space-y-3">
                {["New order", "New message", "New offer", "Payment update", "Escrow release", "Dispute alert", "Product approval", "Review received"].map(n => (
                  <div key={n} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                    <span className="text-sm text-white">{n}</span>
                    <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" defaultChecked className="sr-only peer" /><div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white/30 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-nx-violet peer-checked:after:bg-white"></div></label>
                  </div>
                ))}
              </div>
            )}
            {activeSection === "Payment Methods" && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-emerald-400/5 border border-emerald-400/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-400/10 flex items-center justify-center text-emerald-400 text-lg font-bold">M</div>
                    <div><p className="text-sm text-white">M-Pesa Business</p><p className="text-xs text-white/30">{user?.phone ? `+254 7${user.phone.slice(-7)} ***${user.phone.slice(-3)}` : "Not set"}</p></div>
                  </div>
                  <span className="text-[10px] text-emerald-400">Active</span>
                </div>
                <a
                  href={`https://wa.me/254769739216?text=${encodeURIComponent("Hello Nexora Admin, I would like to add a bank account for payouts to my seller account.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full p-3 rounded-lg border border-dashed border-white/10 text-sm text-white/40 hover:text-white/60 hover:border-white/20 transition-colors inline-block text-center"
                >
                  + Add Bank Account (verified with Nexora via WhatsApp)
                </a>
                <div className="pt-4 border-t border-white/5 mt-4">
                  <button
                    onClick={() => window.open(`https://wa.me/254769739216?text=Hello%20Nexora%20Admin%2C%20I%20need%20help%20with%20my%20seller%20account`, '_blank')}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-nx-gold/5 border border-nx-gold/10 text-nx-gold hover:bg-nx-gold/10 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    <div><p className="text-sm font-medium">Contact Admin via WhatsApp</p><p className="text-[11px] text-white/30">For account issues, verification help, or support</p></div>
                  </button>
                </div>
              </div>
            )}
            {activeSection === "Verification" && (
              <div className="space-y-4">
                <div className={`p-5 rounded-xl border ${
                  user?.kycStatus === "verified" ? "border-emerald-400/15 bg-emerald-400/[0.03]" :
                  user?.kycStatus === "pending" ? "border-amber-400/15 bg-amber-400/[0.03]" :
                  "border-white/5 bg-white/5"
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      user?.kycStatus === "verified" ? "bg-emerald-400/10" :
                      user?.kycStatus === "pending" ? "bg-amber-400/10" : "bg-white/5"
                    }`}>
                      {user?.kycStatus === "verified" ? <Shield className="w-6 h-6 text-emerald-400" /> :
                       user?.kycStatus === "pending" ? <div className="w-6 h-6 rounded-full border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" /> :
                       <Shield className="w-6 h-6 text-white/30" />}
                    </div>
                    <div>
                      <h3 className={`text-base font-semibold ${
                        user?.kycStatus === "verified" ? "text-emerald-400" :
                        user?.kycStatus === "pending" ? "text-amber-400" : "text-white"
                      }`}>
                        {user?.kycStatus === "verified" ? "Business Verified ✓" :
                         user?.kycStatus === "pending" ? "Verification In Progress" :
                         "Not Yet Verified"}
                      </h3>
                      <p className="text-sm text-white/40 mt-1">
                        {user?.kycStatus === "verified" ? "Your business is verified. You can list products and receive payments." :
                         user?.kycStatus === "pending" ? "We are reviewing your documents. This takes 24-48 hours." :
                         "Complete verification to unlock all seller features."}
                      </p>
                    </div>
                  </div>
                </div>
                {user?.kycStatus !== "verified" && (
                  <a href="/seller/kyc" className="w-full p-4 rounded-lg bg-nx-violet/5 border border-nx-violet/10 text-center text-sm text-nx-violet hover:bg-nx-violet/10 transition-colors font-medium">
                    Start Business Verification
                  </a>
                )}
              </div>
            )}
            {activeSection === "Language" && (
              <div className="space-y-4">
                <p className="text-sm text-white/40 mb-3">Choose your preferred language.</p>
                <div className="flex flex-wrap gap-2">
                  {["English (default)", "Swahili", "French", "Arabic"].map(lang => (
                    <button
                      key={lang}
                      onClick={() => {
                        localStorage.setItem("nx_language", lang);
                        toast.success(`Language set to ${lang}`);
                      }}
                      className={`px-4 py-2.5 rounded-lg border text-sm transition-colors ${localStorage.getItem("nx_language") === lang || (!localStorage.getItem("nx_language") && lang === "English (default)") ? "bg-nx-violet/15 border-nx-violet/40 text-white" : "bg-white/[0.03] border-white/10 text-white hover:bg-white/[0.06] hover:border-white/20"}`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {activeSection === "Theme" && (
              <div className="space-y-4">
                <p className="text-sm text-white/40 mb-3">Theme preferences.</p>
                <div className="flex flex-wrap gap-2">
                  {["Dark (active)", "Light", "System"].map(theme => (
                    <button
                      key={theme}
                      onClick={() => {
                        localStorage.setItem("nx_theme", theme);
                        toast.success(`${theme} theme selected`);
                      }}
                      className={`px-4 py-2.5 rounded-lg border text-sm transition-colors ${localStorage.getItem("nx_theme") === theme || (!localStorage.getItem("nx_theme") && theme === "Dark (active)") ? "bg-nx-violet/15 border-nx-violet/40 text-white" : "bg-white/[0.03] border-white/10 text-white hover:bg-white/[0.06] hover:border-white/20"}`}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </SellerLayout>
  );
}
