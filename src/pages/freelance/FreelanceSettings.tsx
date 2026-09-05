import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import {
  ArrowLeft, Save, Loader2, CheckCircle2, X, Plus, User,
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

const ALL_CATEGORIES = [
  "web-development", "writing", "design", "marketing", "business", "video", "education", "ai-tech",
];

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
        <div className="sticky top-0 z-30 h-14 bg-[#08080F]/80 backdrop-blur-xl border-b border-white/5 flex items-center px-4 md:px-6 justify-between">
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

        <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            {user?.image ? (
              <img src={user.image} alt="" className="w-16 h-16 rounded-full object-cover border border-nx-violet/20" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-nx-violet/15 flex items-center justify-center">
                <User className="w-8 h-8 text-nx-violet/50" />
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-white">{user?.name || "User"}</p>
              <p className="text-xs text-white/40">{user?.email}</p>
            </div>
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

          {/* Display Name */}
          <div>
            <label className="text-xs font-medium text-white/60 mb-1.5 block">Display Name</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your display name"
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
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
