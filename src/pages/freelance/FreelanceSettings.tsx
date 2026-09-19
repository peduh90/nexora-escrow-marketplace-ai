import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import AvatarPicker from "@/components/AvatarPicker";
import { FREELANCE_CATEGORIES } from "@/lib/freelance-marketplace";
import {
  ArrowLeft, Save, Loader2, CheckCircle2, X, Plus, Phone,
} from "lucide-react";

const ALL_SKILLS = [
  "React", "Node.js", "TypeScript", "Python", "Java", "Flutter", "React Native",
  "Figma", "UI/UX Design", "Graphic Design", "Logo Design", "Branding",
  "SEO", "Content Writing", "Copywriting", "Blog Writing", "Technical Writing",
  "Social Media Marketing", "Google Ads", "Facebook Ads", "Email Marketing",
  "Video Editing", "Animation", "Photography",
  "Data Analysis", "Machine Learning", "AI", "Blockchain",
  "Project Management", "Business Consulting", "Financial Analysis",
  "Translation", "Voice Over", "Audio Editing",
];

const ALL_CATEGORIES = FREELANCE_CATEGORIES.map((c) => c.slug);

export default function FreelanceSettings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const profile = useQuery(api.freelance.getMyProfile);
  const upsertProfile = useMutation(api.freelance.upsertProfile);

  const [displayName, setDisplayName] = useState("");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [roleMode, setRoleMode] = useState<"freelancer" | "employer" | "both">("freelancer");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || "");
      setTitle(profile.title || "");
      setBio(profile.bio || "");
      setHourlyRate(profile.hourlyRate?.toString() || "");
      setLocation(profile.location || "");
      setSkills(profile.skills || []);
      setCategories(profile.categories || []);
      setRoleMode(profile.roleMode || "freelancer");
    } else if (user) {
      // Default to the profile name (registration name) until the freelancer
      // picks their public display name.
      setDisplayName(user.name || "");
    }
  }, [profile, user]);

  const handleSave = async () => {
    if (!displayName) return;
    setSaving(true);
    try {
      await upsertProfile({
        displayName,
        title: title || undefined,
        bio: bio || undefined,
        hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
        location: location || undefined,
        skills,
        categories,
        roleMode,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#05050A]">
      <div className="flex-1 min-w-0">
        <div className="hidden md:flex sticky top-0 z-30 h-14 bg-[#08080F]/80 backdrop-blur-xl border-b border-white/5 items-center px-4 md:px-6 justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/freelance/dashboard")} className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-white/40 hover:text-white/70 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-sm font-semibold text-white">Profile Settings</h1>
          </div>
          <button onClick={handleSave} disabled={saving || !displayName}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-nx-violet text-white text-xs font-semibold hover:bg-nx-violet/80 transition-colors disabled:opacity-40">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? "Saving..." : saved ? "Saved!" : "Save Profile"}
          </button>
        </div>

        <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6 pb-28 md:pb-6">
          {/* Avatar — upload/change your profile icon */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-xs font-medium text-white/60 mb-3">Profile Icon</p>
            <AvatarPicker image={user?.image} name={user?.name} size="lg" />
          </div>

          {/* Role Mode */}
          <div>
            <label className="text-xs font-medium text-white/60 mb-1.5 block">How do you want to use Nexora Freelance?</label>
            <div className="grid grid-cols-3 gap-2">
              {(["freelancer", "employer", "both"] as const).map((mode) => (
                <button key={mode} onClick={() => setRoleMode(mode)}
                  className={`p-3 rounded-xl text-center transition-colors ${roleMode === mode ? "bg-nx-violet/20 text-nx-violet border border-nx-violet/30" : "bg-white/[0.03] text-white/40 border border-white/5 hover:border-white/10"}`}>
                  <span className="text-lg block mb-1">{mode === "freelancer" ? "✍️" : mode === "employer" ? "💼" : "🔄"}</span>
                  <span className="text-xs font-medium capitalize">{mode === "both" ? "Both" : mode === "freelancer" ? "I want to work" : "I want to hire"}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Profile / Display Name */}
          <div>
            <label className="text-xs font-medium text-white/60 mb-1.5 block">Profile Name</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. Jane Wanjiku"
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
            <p className="text-[10px] text-white/25 mt-1">Shown to employers and clients — defaults to your registration name.</p>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-medium text-white/60 mb-1.5 block">Professional Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Full-Stack Developer"
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
          </div>

          {/* Bio */}
          <div>
            <label className="text-xs font-medium text-white/60 mb-1.5 block">Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4}
              placeholder="Tell clients about your experience, skills, and what you can deliver..."
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none resize-none" />
          </div>

          {/* Hourly Rate & Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-white/60 mb-1.5 block">Hourly Rate (KES)</label>
              <input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="2000"
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-white/60 mb-1.5 block">Location</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Nairobi"
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
            </div>
          </div>

          {/* Categories */}
          <div>
            <label className="text-xs font-medium text-white/60 mb-1.5 block">Categories</label>
            <div className="flex flex-wrap gap-2">
              {ALL_CATEGORIES.map((c) => {
                const selected = categories.includes(c);
                return (
                  <button key={c} onClick={() => setCategories(selected ? categories.filter((x) => x !== c) : [...categories, c])}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selected ? "bg-nx-violet/20 text-nx-violet border border-nx-violet/30" : "bg-white/[0.03] text-white/40 border border-white/5 hover:border-white/10"}`}>
                    {c.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contact Admin */}
          <div className="p-5 rounded-xl border border-nx-gold/10 bg-nx-gold/[0.02]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-nx-gold" />
                <h3 className="text-sm font-semibold text-white">Contact Admin/Support</h3>
              </div>
            </div>
            <p className="text-xs text-white/40 mb-3">Need help with your account, profile verification, payment issues, or any other support? Reach out to the Nexora admin team directly via WhatsApp.</p>
            <button
              onClick={() => window.open(`https://wa.me/254769739216?text=Hello%20Nexora%20Admin%2C%20I%20need%20help%20with%20my%20${roleMode === "employer" ? "employer" : "freelancer"}%20account`, '_blank')}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-nx-gold/10 border border-nx-gold/20 text-nx-gold hover:bg-nx-gold/20 transition-colors"
            >
              <Phone className="w-5 h-5" />
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">Chat on WhatsApp</p>
                <p className="text-[11px] text-white/30">+254 769 739 216 — Fast response</p>
              </div>
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm3.24 13.44c-.25.25-.66.25-.91 0l-2.04-2.04c-.25-.25-.25-.66 0-.91l.4-.4c.76-.26 1.6-.56 2.37-.88-.93-.39-1.93-.63-2.96-.63-1.08 0-2.12.26-2.99.72l2.04-2.04C5.19 9.61 4.32 8.46 4.02 7.15l-.4.4c-.25.25-.25.66 0 .91l2.04 2.04c.3.3.68.38 1.05.26.75-.21 1.54-.54 2.26-.99.24-.14.52-.07.66.17l.49.49c.15.14.2.35.14.54-.05.15-.16.26-.3.29l-2.04-2.04c.43-.23.89-.43 1.37-.59.36-.12.73-.19 1.1-.19 1.05 0 2.02.3 2.82.87.34.24.5.66.41 1.05l-.49.49c-.08.08-.13.19-.13.3s.05.22.13.3c.21.14.42.28.64.38.07.03.14.05.21.05.32 0 .64-.1 .92-.29.28-.18.5-.44.66-.76.15-.3.21-.62.16-.95-.05-.28-.17-.5-.36-.67l-.4-.4z"/></svg>
            </button>
          </div>

          {/* Skills */}
          <div>
            <label className="text-xs font-medium text-white/60 mb-1.5 block">Skills</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {ALL_SKILLS.map((s) => {
                const selected = skills.includes(s);
                return (
                  <button key={s} onClick={() => setSkills(selected ? skills.filter((x) => x !== s) : [...skills, s])}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${selected ? "bg-nx-violet/20 text-nx-violet border border-nx-violet/30" : "bg-white/[0.03] text-white/40 border border-white/5 hover:border-white/10"}`}>
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
