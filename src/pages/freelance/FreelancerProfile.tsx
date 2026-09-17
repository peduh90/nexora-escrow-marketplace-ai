import { useQuery } from "convex/react";
import { useNavigate, useParams } from "react-router";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { MARKETPLACES } from "@/lib/freelance-marketplace";
import ScrollReveal from "@/components/ScrollReveal";
import {
  ArrowLeft, Star, MapPin, Globe, Briefcase, CheckCircle2, Clock,
  MessageSquare, Wrench, UserX, FileText, Download, ExternalLink,
  Image as ImageIcon, Sparkles, Bot, BadgeCheck,
} from "lucide-react";

/**
 * Public freelancer profile — the freelance counterpart of the seller store
 * page. Works even for freelancers who haven't completed their profile yet:
 * it falls back to the raw account (name, photo, role), lets the owner jump
 * into the setup wizard, and shows resolved proof-of-work files to employers.
 */
export default function FreelancerProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const data = useQuery(api.freelance.getFreelancerPublic, { userId: userId as string });
  // This freelancer's own published services — scoped to their user ID so the
  // query can't leak other sellers' listings and always reflects this person.
  const services = useQuery(api.listings.getUserListings, {
    userId: userId as string,
    marketplace: MARKETPLACES.FREELANCE,
  });

  const loading = data === undefined || services === undefined;

  if (loading) {
    return (
      <div className="min-h-screen bg-nx-bg">
        <div className="sticky top-0 z-30 h-14 bg-nx-card/80 backdrop-blur-xl border-b border-nx-border flex items-center px-4 md:px-6">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors mr-3">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h2 className="text-sm font-semibold text-white">Freelancer Profile</h2>
        </div>
        <div className="py-24 text-center text-sm text-white/30">Loading profile…</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-nx-bg">
        <div className="sticky top-0 z-30 h-14 bg-nx-card/80 backdrop-blur-xl border-b border-nx-border flex items-center px-4 md:px-6">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors mr-3">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h2 className="text-sm font-semibold text-white">Freelancer Profile</h2>
        </div>
        <div className="py-24 text-center">
          <UserX className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/40 font-medium">Freelancer not found</p>
          <button onClick={() => navigate("/freelance/find-freelancers")} className="mt-4 px-5 py-2 rounded-lg bg-nx-violet text-white text-sm font-medium hover:bg-nx-violet/80 transition-colors">
            Browse freelancers
          </button>
        </div>
      </div>
    );
  }

  const account = data.account;
  const profile = data.profile;
  const isOwner = isAuthenticated && user && (user as any)._id === userId;
  const isAiTasker = account?.role === "ai_tasker";

  const name = profile?.displayName || account?.name || "Freelancer";
  const photo = profile?.photo || account?.image;
  const verified = (profile?.completedProjects || 0) > 0 || profile?.isVerified;
  const proofs = profile?.proofs ?? [];
  const images = proofs.filter((p: any) => p.kind === "image");
  const documents = proofs.filter((p: any) => p.kind !== "image");

  const serviceList = services ?? [];

  return (
    <div className="min-h-screen bg-nx-bg">
      {/* Header */}
      <div className="sticky top-0 z-30 h-14 bg-nx-card/80 backdrop-blur-xl border-b border-nx-border flex items-center px-4 md:px-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors mr-3">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="text-sm font-semibold text-white">Freelancer Profile</h2>
        <span className="ml-auto text-[10px] font-mono tracking-widest text-nx-violet/60 uppercase">Nexora Freelance</span>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        {/* Owner nudge — the profile is incomplete until it has 2+ proofs of work */}
        {isOwner && !data.profileComplete && (
          <button
            onClick={() => navigate(`/freelancer/${userId}/setup`)}
            className="w-full mb-6 p-5 rounded-2xl border border-nx-gold/30 bg-nx-gold/[0.06] hover:bg-nx-gold/10 transition-colors text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-nx-gold/15 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-nx-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-nx-gold">
                  {!data.hasProfile ? "Finish your freelance registration" : "Your profile needs more proof of work"}
                </p>
                <p className="text-xs text-white/45 mt-0.5">
                  {!data.hasProfile
                    ? "Choose your categories and upload at least 2 work samples — employers are waiting to see what you can do."
                    : `Upload ${Math.max(0, (data.minProofRequired ?? 2) - (proofs.length))} more sample${(data.minProofRequired ?? 2) - proofs.length === 1 ? "" : "s"} to complete your profile — employers hire what they can see.`}
                </p>
              </div>
              <span className="shrink-0 px-3.5 py-2 rounded-xl bg-nx-gold text-black text-xs font-bold group-hover:bg-nx-gold/85 transition-colors">
                Complete profile →
              </span>
            </div>
          </button>
        )}

        {/* Profile Card */}
        <ScrollReveal>
          <div className="relative p-6 md:p-8 rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-nx-violet/10 to-nx-cyan/5" />
            <div className="relative z-10 flex flex-col md:flex-row items-start gap-6">
              {photo ? (
                <img
                  src={photo}
                  alt={name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-nx-violet/30 shrink-0"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-nx-violet/20 border-2 border-nx-violet/30 flex items-center justify-center text-2xl font-bold text-nx-violet shrink-0">
                  {name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h1 className="text-xl font-bold text-white">{name}</h1>
                  {verified && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-nx-emerald/10 text-nx-emerald text-[10px] font-semibold border border-nx-emerald/20">
                      <CheckCircle2 className="w-3 h-3" /> Proven Track Record
                    </span>
                  )}
                  {isAiTasker && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 text-[10px] font-semibold border border-indigo-400/20">
                      <Bot className="w-3 h-3" /> AI Tasker
                    </span>
                  )}
                  {profile && (
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${profile.availability === "available" ? "text-nx-emerald bg-nx-emerald/10" : "text-white/40 bg-white/5"}`}>
                      {profile.availability || "available"}
                    </span>
                  )}
                </div>
                <p className="text-sm text-white/50">
                  {profile?.title || (isAiTasker ? "AI Tasker" : data.hasProfile ? "Freelancer" : "New freelancer — completing profile")}
                </p>

                {!data.hasProfile && !isOwner && (
                  <p className="text-xs text-white/35 italic mt-2">
                    This freelancer just joined — their full profile is coming soon. Message them directly to discuss your project.
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-white/40 mt-2 flex-wrap">
                  {profile?.location && (
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{profile.location}</span>
                  )}
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />
                    Member since {new Date(account?._creationTime || Date.now()).getFullYear()}
                  </span>
                  {profile?.languages && profile.languages.length > 0 && (
                    <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{profile.languages.join(", ")}</span>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 mt-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-white flex items-center gap-1">
                      <Star className="w-4 h-4 text-nx-gold fill-nx-gold" />
                      {profile?.avgRating ? profile.avgRating.toFixed(1) : "—"}
                    </p>
                    <p className="text-[10px] text-white/30">Rating</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">{profile?.completedProjects || 0}</p>
                    <p className="text-[10px] text-white/30">Projects Done</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-nx-emerald">
                      {profile?.hourlyRate ? `KES ${profile.hourlyRate.toLocaleString()}` : "—"}
                    </p>
                    <p className="text-[10px] text-white/30">Per Hour</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">{proofs.length}</p>
                    <p className="text-[10px] text-white/30">Work Samples</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => navigate("/chat")}
                  className="px-4 py-2 rounded-lg bg-nx-violet/10 text-nx-violet text-sm font-medium hover:bg-nx-violet/20 transition-colors border border-nx-violet/20 flex items-center gap-1.5"
                >
                  <MessageSquare className="w-4 h-4" /> Message
                </button>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Categories */}
        {profile?.categories && profile.categories.length > 0 && (
          <ScrollReveal delay={60}>
            <div className="mt-6 p-5 rounded-xl border border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-3 mb-3">
                <BadgeCheck className="w-4 h-4 text-nx-violet" />
                <h3 className="text-sm font-semibold text-white">What they do</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.categories.map((c: string) => (
                  <span key={c} className="text-xs px-3 py-1 rounded-lg bg-nx-violet/10 text-nx-violet/80 border border-nx-violet/15">{c}</span>
                ))}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Bio */}
        {profile?.bio && (
          <ScrollReveal delay={80}>
            <div className="mt-6 p-5 rounded-xl border border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-3 mb-2">
                <Briefcase className="w-4 h-4 text-nx-cyan" />
                <h3 className="text-sm font-semibold text-white">About</h3>
              </div>
              <p className="text-xs text-white/50 whitespace-pre-wrap">{profile.bio}</p>
            </div>
          </ScrollReveal>
        )}

        {/* Skills */}
        {profile?.skills && profile.skills.length > 0 && (
          <ScrollReveal delay={100}>
            <div className="mt-6 p-5 rounded-xl border border-white/5 bg-white/[0.02]">
              <h3 className="text-sm font-semibold text-white mb-3">Skills & Expertise</h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((s: string) => (
                  <span key={s} className="text-xs px-3 py-1 rounded-lg bg-nx-violet/10 text-nx-violet/80 border border-nx-violet/15">{s}</span>
                ))}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* ── Proof of Work ── */}
        <ScrollReveal delay={120}>
          <div className="mt-6 p-5 rounded-xl border border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-3 mb-1">
              <Sparkles className="w-4 h-4 text-nx-gold" />
              <h3 className="text-sm font-semibold text-white">Proof of Work</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40 font-medium">{proofs.length} file{proofs.length === 1 ? "" : "s"}</span>
            </div>
            <p className="text-[11px] text-white/30 mb-4">Real samples this freelancer has uploaded — the proof behind the profile.</p>

            {proofs.length === 0 ? (
              <div className="py-8 text-center rounded-xl border border-dashed border-white/10">
                <FileText className="w-8 h-8 text-white/10 mx-auto mb-2" />
                <p className="text-xs text-white/30">
                  {isOwner
                    ? "You haven't uploaded any work samples yet — add them in profile setup."
                    : "No work samples uploaded yet."}
                </p>
                {isOwner && (
                  <button onClick={() => navigate(`/freelancer/${userId}/setup`)}
                    className="mt-3 px-4 py-1.5 rounded-lg bg-nx-gold/15 border border-nx-gold/25 text-nx-gold text-xs font-semibold hover:bg-nx-gold/25 transition-colors">
                    Upload proof of work
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Images */}
                {images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                    {images.map((p: any) => (
                      <a key={p.key} href={p.url} target="_blank" rel="noreferrer"
                        className="group relative rounded-xl overflow-hidden border border-white/10 hover:border-nx-gold/30 transition-colors">
                        <img src={p.url} alt="Work sample" className="w-full h-28 object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                          <ExternalLink className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </a>
                    ))}
                  </div>
                )}
                {/* Documents */}
                {documents.length > 0 && (
                  <div className="space-y-2">
                    {documents.map((p: any) => (
                      <a key={p.key} href={p.url} target="_blank" rel="noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:border-nx-gold/25 hover:bg-white/[0.04] transition-colors group">
                        <div className="w-9 h-9 rounded-lg bg-nx-cyan/10 border border-nx-cyan/20 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-nx-cyan" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white/70 group-hover:text-white truncate transition-colors">Work document</p>
                          <p className="text-[10px] text-white/25">Tap to view / download</p>
                        </div>
                        <Download className="w-4 h-4 text-white/25 group-hover:text-nx-gold transition-colors shrink-0" />
                      </a>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollReveal>

        {/* Published Services */}
        <ScrollReveal delay={150}>
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-white mb-4">
              Published Services ({serviceList.length})
            </h3>
            {serviceList.length === 0 ? (
              <div className="py-12 text-center rounded-xl border border-white/5">
                <Wrench className="w-10 h-10 text-white/10 mx-auto mb-2" />
                <p className="text-sm text-white/30">No services published yet</p>
                <p className="text-[11px] text-white/20 mt-1">Published freelance services will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {serviceList.map((s: any) => (
                  <button
                    key={s._id}
                    onClick={() => navigate(`/freelance/service/${s._id}`)}
                    className="text-left p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:border-nx-violet/25 hover:bg-white/[0.04] transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg bg-white/[0.03] border border-white/5 overflow-hidden shrink-0 flex items-center justify-center">
                        {s.images?.[0] ? (
                          <img src={s.images[0]} alt={s.title} className="w-full h-full object-cover" />
                        ) : (
                          <Wrench className="w-5 h-5 text-white/10" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm text-white/80 font-medium truncate group-hover:text-white transition-colors">{s.title}</h4>
                        <p className="text-[11px] text-white/30 mt-0.5 line-clamp-2">{s.description}</p>
                        <p className="text-sm font-bold text-nx-emerald mt-1.5">KES {(s.price || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
