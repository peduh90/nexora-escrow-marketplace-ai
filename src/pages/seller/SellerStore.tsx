import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import SellerLayout from "./SellerLayout";
import { Store, Camera, MapPin, Globe, Phone, Mail, Clock, Save, CheckCircle2 } from "lucide-react";

export default function SellerStore() {
  const { user } = useAuth();
  const updateProfile = useMutation(api.users.updateProfile);
  const [form, setForm] = useState({
    storeName: user?.businessName || "", description: "", phone: user?.phone || "", email: user?.email || "", website: "", county: user?.county || "", town: user?.town || "", hours: "",
  });
  const [saved, setSaved] = useState(false);
  return (
    <SellerLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold text-white">Store Profile</h1>
          <p className="text-sm text-white/40 mt-1">Customize your store appearance and information</p>
        </div>

        {/* Banner */}
        <div className="relative h-40 rounded-xl bg-gradient-to-r from-nx-violet/20 to-nx-cyan/20 border border-white/5 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <Camera className="w-8 h-8 text-white/20" />
            <span className="text-xs text-white/30 ml-2">Upload Banner</span>
          </div>
        </div>

        {/* Logo */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl bg-nx-violet/10 border border-white/5 flex items-center justify-center">
            <Store className="w-8 h-8 text-nx-violet" />
          </div>
          <div>
            <button className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-xs text-white/40 hover:text-white/60 transition-colors">Change Logo</button>
            <p className="text-[10px] text-white/20 mt-1">Recommended: 200x200px</p>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { label: "Store Name", key: "storeName", placeholder: "Your store name" },
            { label: "Description", key: "description", placeholder: "Describe your store...", textarea: true },
            { label: "Phone", key: "phone", placeholder: "+254 7XX XXX XXX", icon: Phone },
            { label: "Email", key: "email", placeholder: "email@store.com", icon: Mail },
            { label: "Website", key: "website", placeholder: "https://", icon: Globe },
            { label: "County", key: "county", placeholder: "Nairobi", icon: MapPin },
            { label: "Town", key: "town", placeholder: "Westlands" },
            { label: "Opening Hours", key: "hours", placeholder: "Mon-Sat 8AM-6PM", icon: Clock },
          ].map(field => (
            <div key={field.key}>
              <label className="block text-xs text-white/40 mb-1.5">{field.label}</label>
              {field.textarea ? (
                <textarea value={form[field.key as keyof typeof form]} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} rows={3}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/50 focus:outline-none resize-none" />
              ) : (
                <input value={form[field.key as keyof typeof form]} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/50 focus:outline-none" />
              )}
            </div>
          ))}
        </div>

        <button onClick={() => setSaved(true)} className="px-6 py-2.5 rounded-lg bg-nx-violet text-white text-sm font-medium hover:bg-nx-violet/80 transition-colors flex items-center gap-2">
          <Save className="w-4 h-4" /> {saved ? "Saved ✓" : "Save Changes"}
        </button>
      </div>
    </SellerLayout>
  );
}
