import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import BuyerLayout from "./BuyerLayout";
import {
  User, Mail, Phone, MapPin, Shield, Save, Loader2, CheckCircle2, Eye, EyeOff, Star,
} from "lucide-react";

export default function BuyerProfile() {
  const { user } = useAuth();
  const updateUser = useMutation(api.users.updateProfile);

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [whatsapp, setWhatsapp] = useState((user as any)?.whatsapp || "");
  const [county, setCounty] = useState(user?.county || "");
  const [town, setTown] = useState(user?.town || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await updateUser({ name, phone, whatsapp, county, town });
      setSaved(true);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <BuyerLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">My Account</h1>
          <p className="text-sm text-white/40 mt-1">Edit your details — name, phone, WhatsApp and location</p>
        </div>

        {/* Profile Header */}
        <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-nx-cyan/10 flex items-center justify-center text-nx-cyan text-xl font-bold">
              {name ? name.charAt(0).toUpperCase() : "B"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-white">{name || "Buyer"}</h2>
                {user?.kycStatus === "verified" && (
                  <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              <p className="text-sm text-white/40">{user?.email || ""}</p>
              <p className="text-xs text-white/25 mt-0.5">
                Member since {user?.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <User className="w-4 h-4 text-nx-cyan" /> Account Details
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-cyan/30 focus:outline-none"
                placeholder="Enter your full name" />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Email</label>
              <input type="email" value={user?.email || ""} disabled
                className="w-full px-3 py-2.5 rounded-lg bg-white/[0.01] border border-white/5 text-sm text-white/40 cursor-not-allowed" />
              <p className="text-[10px] text-white/20 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Phone Number</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-cyan/30 focus:outline-none"
                placeholder="0712 345 678" />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">WhatsApp Number</label>
              <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-cyan/30 focus:outline-none"
                placeholder="Same as phone? Just repeat it" />
              <p className="text-[10px] text-white/20 mt-1">Customers and providers can reach you on WhatsApp directly.</p>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-nx-cyan" /> Location
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">County</label>
              <input type="text" value={county} onChange={(e) => setCounty(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-cyan/30 focus:outline-none"
                placeholder="e.g. Nairobi" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Town / Area</label>
              <input type="text" value={town} onChange={(e) => setTown(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-cyan/30 focus:outline-none"
                placeholder="e.g. Westlands" />
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-nx-cyan" /> Account Status
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-white/[0.01]">
              <p className="text-[10px] text-white/30 uppercase">Role</p>
              <p className="text-sm font-medium text-white capitalize">{user?.role || "Buyer"}</p>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.01]">
              <p className="text-[10px] text-white/30 uppercase">Verification</p>
              <p className="text-sm font-medium text-white">{user?.kycStatus === "verified" ? "✓ Verified" : "Not Verified"}</p>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.01]">
              <p className="text-[10px] text-white/30 uppercase">Currency</p>
              <p className="text-sm font-medium text-white">KES</p>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.01]">
              <p className="text-[10px] text-white/30 uppercase">Country</p>
              <p className="text-sm font-medium text-white">Kenya</p>
            </div>
          </div>
        </div>

        {/* Save */}
        {error && <p className="text-sm text-red-400 text-center">{error}</p>}
        {saved && (
          <div className="p-3 rounded-lg bg-emerald-400/5 border border-emerald-400/10 text-center">
            <p className="text-sm text-emerald-400 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Profile updated successfully
            </p>
          </div>
        )}

        <button onClick={handleSave} disabled={saving}
          className="w-full py-3 rounded-xl bg-nx-cyan text-black font-semibold text-sm hover:bg-nx-cyan/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </BuyerLayout>
  );
}
