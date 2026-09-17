import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import FreelanceNav from "./FreelanceNav";
import AvatarPicker from "@/components/AvatarPicker";
import { FREELANCE_CATEGORIES } from "@/lib/freelance-marketplace";
import {
  ArrowLeft, ArrowRight, CheckCircle2, FileText, Image as ImageIcon,
  Loader2, Paperclip, Plus, Star, Trash2, Upload, X,
} from "lucide-react";

const ALL_SKILLS = [
  "Content Writing", "Copywriting", "SEO Writing", "Proofreading",
  "Logo Design", "Graphic Design", "UI/UX", "Canva",
  "Video Editing", "Photography", "Voice Over",
  "Social Media Management", "Digital Marketing", "Google Ads",
  "React", "WordPress", "Python", "Data Entry", "Data Analysis",
  "Virtual Assistant", "Customer Support", "Tutoring",
  "Bookkeeping", "Translation", "AI Tools", "Prompt Engineering",
];

type Picked = { file: File; preview?: string };

/**
 * Freelance profile setup wizard — the "finish registration" step for a newly
 * registered freelancer or AI Tasker. One flow: identity & what they do
 * (categories), proof of work (images, PDFs, docs — any file), then live.
 */
export default function FreelancerSetup() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const data = useQuery(api.freelance.getFreelancerPublic, { userId: userId as string });
  const upsertProfile = useMutation(api.freelance.upsertProfile);
  const generateUploadUrl = useMutation(api.freelance.generateFileUploadUrl);
  const addProof = useMutation(api.freelance.addProofOfWork);

  const isOwner = isAuthenticated && user && (user as any)._id === userId;

  // ── Form state (prefilled from the account) ──
  const [displayName, setDisplayName] = useState("");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [location, setLocation] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [files, setFiles] = useState<Picked[]>([]);
  const [profileSaved, setProfileSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const seeded = useRef(false);
  if (data && !seeded.current) {
    seeded.current = true;
    setDisplayName(data.account?.name || "");
    if (data.profile) {
      setTitle(data.profile.title || "");
      setBio(data.profile.bio || "");
      setHourlyRate(data.profile.hourlyRate?.toString() || "");
      setLocation(data.profile.location || "");
      setCategories(data.profile.categories || []);
      setSkills(data.profile.skills || []);
    }
  }

  if (data === undefined) {
    return (
      <div className="min-h-screen bg-[#05050A]">
        <FreelanceNav active="services" />
        <div className="py-24 text-center text-sm text-white/30">Loading…</div>
      </div>
    );
  }

  if (!data || !isOwner) {
    return (
      <div className="min-h-screen bg-[#05050A]">
        <FreelanceNav active="services" />
        <div className="max-w-md mx-auto px-4 py-24 text-center">
          <p className="text-sm text-white/50 font-medium">
            {!data ? "Freelancer not found" : "You can only complete your own profile."}
          </p>
          <button onClick={() => navigate("/freelance/find-freelancers")}
            className="mt-4 px-5 py-2 rounded-xl bg-nx-violet text-white text-sm font-medium hover:bg-nx-violet/80 transition-colors">
            Back to freelancers
          </button>
        </div>
      </div>
    );
  }

  const toggleCategory = (slug: string) =>
    setCategories((c) => (c.includes(slug) ? c.filter((x) => x !== slug) : [...c, slug]));

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) setSkills((prev) => [...prev, s]);
    setSkillInput("");
  };

  const pickFiles = (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list).map((file) => ({
      file,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
    }));
    setFiles((prev) => [...prev, ...incoming].slice(0, 10));
  };

  const removeFile = (idx: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== idx));

  const canSaveProfile = displayName.trim().length > 1 && categories.length > 0;

  // Step 1 — save the profile itself so the freelancer exists in the directory.
  const saveProfile = async (): Promise<boolean> => {
    if (!canSaveProfile) return false;
    setSaving(true);
    try {
      await upsertProfile({
        displayName: displayName.trim(),
        title: title.trim() || undefined,
        bio: bio.trim() || undefined,
        hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
        location: location.trim() || undefined,
        skills,
        categories,
        roleMode: "freelancer",
      });
      setProfileSaved(true);
      return true;
    } catch (err: any) {
      toast.error(err?.message || "Could not save the profile");
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Step 2 — upload every picked proof file to Convex storage and attach it.
  const uploadProofs = async () => {
    if (files.length === 0) return true;
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const picked = files[i];
        const uploadUrl = await generateUploadUrl();
        const res = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": picked.file.type || "application/octet-stream" },
          body: picked.file,
        });
        if (!res.ok) throw new Error(`Upload failed for "${picked.file.name}"`);
        const out = (await res.json()) as { storageId?: string; storageKey?: string; key?: string };
        const key = out.storageId || out.storageKey || out.key;
        if (!key) throw new Error(`No storage key returned for "${picked.file.name}"`);
        await addProof({ storageId: key, title: picked.file.name });
      }
      return true;
    } catch (err: any) {
      toast.error(err?.message || "Some files failed to upload");
      return false;
    } finally {
      setUploading(false);
    }
  };

  const finish = async () => {
    const okProfile = await saveProfile();
    if (!okProfile) return;
    const okFiles = await uploadProofs();
    if (!okFiles) {
      // Profile is live; just warn about the files.
      navigate(`/freelancer/${userId}`);
      return;
    }
    toast.success("Profile complete! Employers can now see your work. 🎉");
    navigate(`/freelancer/${userId}`);
  };

  return (
    <div className="min-h-screen bg-[#05050A]">
      <FreelanceNav active="services" />

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <button onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors mb-3">
            <ArrowLeft className="w-3 h-3" /> Back
          </button>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-nx-violet/10 border border-nx-violet/20 text-nx-violet text-[11px] font-semibold mb-3">
            <Star className="w-3.5 h-3.5" /> FINISH YOUR FREELANCE REGISTRATION
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Complete your freelancer profile</h1>
          <p className="text-sm text-white/45 mt-2 max-w-xl leading-relaxed">
            Choose what you do, add your skills, and upload proof of your work — images, PDFs,
            documents, anything that shows what you can deliver. Employers see this before they hire.
          </p>
        </div>

        {/* ── What they do ── */}
        <section className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 mb-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-nx-violet/15 text-nx-violet text-xs font-bold flex items-center justify-center">1</span>
            What do you do?
          </h2>

          {/* Profile icon */}
          <div className="mb-5 pb-5 border-b border-white/5">
            <p className="text-xs font-medium text-white/60 mb-2">Profile icon</p>
            <AvatarPicker image={(user as any)?.image} name={displayName} size="lg" />
          </div>

          <label className="text-xs font-medium text-white/60 mb-1.5 block">Display name *</label>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Jane Wanjiku"
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/25 focus:border-nx-violet/40 focus:outline-none mb-4" />

          <label className="text-xs font-medium text-white/60 mb-1.5 block">Professional title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Content Writer & SEO Specialist"
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/25 focus:border-nx-violet/40 focus:outline-none mb-4" />

          <label className="text-xs font-medium text-white/60 mb-1.5 block">Categories — pick everything you offer *</label>
          <div className="flex flex-wrap gap-2 mb-4">
            {FREELANCE_CATEGORIES.map((c) => {
              const on = categories.includes(c.slug);
              return (
                <button key={c.slug} type="button" onClick={() => toggleCategory(c.slug)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${on ? "bg-nx-violet/20 text-nx-violet border-nx-violet/30" : "bg-white/[0.03] text-white/40 border-white/5 hover:border-white/15 hover:text-white/70"}`}>
                  {on && <CheckCircle2 className="w-3 h-3 inline mr-1 -mt-0.5" />}{c.name}
                </button>
              );
            })}
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-medium text-white/60 mb-1.5 block">Hourly rate (KES)</label>
              <input value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="e.g. 500" inputMode="numeric"
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/25 focus:border-nx-violet/40 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-white/60 mb-1.5 block">Location</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Nairobi"
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/25 focus:border-nx-violet/40 focus:outline-none" />
            </div>
          </div>

          <label className="text-xs font-medium text-white/60 mb-1.5 block">About you</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
            placeholder="Tell employers what you deliver, your experience, and how you work…"
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/25 focus:border-nx-violet/40 focus:outline-none resize-none mb-4" />

          <label className="text-xs font-medium text-white/60 mb-1.5 block">Skills</label>
          <div className="flex gap-2 mb-2">
            <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
              placeholder="Type a skill and press Enter"
              className="flex-1 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/25 focus:border-nx-violet/40 focus:outline-none" />
            <button type="button" onClick={addSkill}
              className="px-3 rounded-xl bg-nx-violet/15 border border-nx-violet/25 text-nx-violet hover:bg-nx-violet/25 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {skills.map((s) => (
              <span key={s} className="text-[11px] px-2 py-1 rounded-lg bg-nx-violet/10 border border-nx-violet/15 text-nx-violet/80 flex items-center gap-1">
                {s}
                <button type="button" onClick={() => setSkills((prev) => prev.filter((x) => x !== s))}>
                  <X className="w-3 h-3 hover:text-red-400" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ALL_SKILLS.filter((s) => !skills.includes(s)).slice(0, 10).map((s) => (
              <button key={s} type="button" onClick={() => setSkills((prev) => [...prev, s])}
                className="text-[10px] px-2 py-1 rounded-md bg-white/[0.03] border border-white/5 text-white/35 hover:text-white/60 hover:border-white/15 transition-colors">
                + {s}
              </button>
            ))}
          </div>
        </section>

        {/* ── Proof of work ── */}
        <section className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 mb-6">
          <h2 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-nx-gold/15 text-nx-gold text-xs font-bold flex items-center justify-center">2</span>
            Proof of work <span className="text-[10px] font-normal text-white/30">(up to 10 files)</span>
          </h2>
          <p className="text-xs text-white/35 mb-4 ml-8">
            Upload samples: images of your designs, PDF reports, Word documents, certificates — anything that proves what you can do.
          </p>

          <button type="button" onClick={() => fileInput.current?.click()}
            className="w-full py-8 rounded-xl border-2 border-dashed border-white/10 hover:border-nx-gold/30 hover:bg-white/[0.02] transition-all flex flex-col items-center justify-center gap-2 text-white/40 hover:text-nx-gold/70">
            <Upload className="w-6 h-6" />
            <span className="text-sm font-medium">Tap to upload files</span>
            <span className="text-[11px] text-white/25">Images, PDF, DOC, spreadsheets — any file type</span>
          </button>
          <input ref={fileInput} type="file" multiple accept="*/*" className="hidden"
            onChange={(e) => { pickFiles(e.target.files); e.target.value = ""; }} />

          {files.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
              {files.map((f, idx) => (
                <div key={idx} className="relative group rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
                  <div className="h-24 flex items-center justify-center">
                    {f.preview ? (
                      <img src={f.preview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <FileText className="w-8 h-8 text-nx-cyan/50" />
                    )}
                  </div>
                  <div className="px-2 py-1.5">
                    <p className="text-[10px] text-white/50 truncate flex items-center gap-1">
                      {f.preview ? <ImageIcon className="w-2.5 h-2.5 shrink-0" /> : <Paperclip className="w-2.5 h-2.5 shrink-0" />}
                      {f.file.name}
                    </p>
                    <p className="text-[9px] text-white/25">{(f.file.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button type="button" onClick={() => removeFile(idx)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/60 text-white/60 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Finish ── */}
        <button onClick={finish} disabled={!canSaveProfile || saving || uploading}
          className="w-full py-3.5 rounded-xl bg-nx-gold text-black text-sm font-bold hover:bg-nx-gold/85 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {saving || uploading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> {saving ? "Saving profile…" : "Uploading work samples…"}</>
          ) : (
            <>Finish & publish my profile <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
        {!canSaveProfile && (
          <p className="text-[11px] text-white/25 text-center mt-2">
            Add your display name and pick at least one category to continue.
          </p>
        )}
        {profileSaved && !files.length && (
          <p className="text-[11px] text-nx-emerald text-center mt-2">Profile saved — it's already live in the directory.</p>
        )}
      </div>
    </div>
  );
}
