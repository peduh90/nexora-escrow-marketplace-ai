import { useQuery } from "convex/react";
import { useNavigate, useParams } from "react-router";
import { api } from "../../convex/_generated/api";
import { MARKETPLACES } from "@/lib/freelance-marketplace";
import ScrollReveal from "@/components/ScrollReveal";
import {
  ArrowLeft, Star, MapPin, Globe, Briefcase, CheckCircle2, Clock,
  MessageSquare, Wrench, UserX,
} from "lucide-react";

/**
 * Public freelancer profile — the freelance counterpart of the seller store
 * page. A Writer/Freelancer account never owns a store; this page shows their
 * freelance profile (skills, rate, rating) and their published services from
 * the Nexora Freelance marketplace only.
 */
export default function FreelancerProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const profile = useQuery(api.freelance.getProfile, { userId: userId as string });
  const listings = useQuery(api.listings.getActiveListings, { limit: 100 });

  // Published freelance services owned by this freelancer (listings.sellerId
  // is the creator's userId; freelance listings never belong to store sellers).
  const services = (listings ?? []).filter(
    (l: any) => l.sellerId === userId && l.marketplace === MARKETPLACES.FREELANCE,
  );

  const loading = profile === undefined || listings === undefined;

  const name = profile?.displayName || "Freelancer";
  const verified = (profile?.completedProjects || 0) > 0;

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
        {loading ? (
          <div className="py-24 text-center text-sm text-white/30">Loading profile…</div>
        ) : !profile ? (
          <div className="py-24 text-center">
            <UserX className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/40 font-medium">No freelancer profile found</p>
            <p className="text-xs text-white/25 mt-1">This person hasn't set up a Nexora Freelance profile yet.</p>
            <button onClick={() => navigate("/freelance")} className="mt-4 px-5 py-2 rounded-lg bg-nx-violet text-white text-sm font-medium hover:bg-nx-violet/80 transition-colors">
              Explore Freelance
            </button>
          </div>
        ) : (
          <>
            {/* Profile Card */}
            <ScrollReveal>
              <div className="relative p-6 md:p-8 rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-nx-violet/10 to-nx-cyan/5" />
                <div className="relative z-10 flex flex-col md:flex-row items-start gap-6">
                  {(profile as any).photo ? (
                    <img
                      src={(profile as any).photo}
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
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${profile.availability === "available" ? "text-nx-emerald bg-nx-emerald/10" : "text-white/40 bg-white/5"}`}>
                        {profile.availability || "available"}
                      </span>
                    </div>
                    <p className="text-sm text-white/50">{profile.title || "Freelancer"}</p>
                    <div className="flex items-center gap-4 text-xs text-white/40 mt-2 flex-wrap">
                      {profile.location && (
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{profile.location}</span>
                      )}
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />
                        Member since {new Date(profile._creationTime).getFullYear()}
                      </span>
                      {profile.languages && profile.languages.length > 0 && (
                        <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{profile.languages.join(", ")}</span>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 mt-4">
                      <div className="text-center">
                        <p className="text-lg font-bold text-white flex items-center gap-1">
                          <Star className="w-4 h-4 text-nx-gold fill-nx-gold" />
                          {profile.avgRating ? profile.avgRating.toFixed(1) : "—"}
                        </p>
                        <p className="text-[10px] text-white/30">Rating</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-white">{profile.completedProjects || 0}</p>
                        <p className="text-[10px] text-white/30">Projects Done</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-nx-emerald">
                          {profile.hourlyRate ? `KES ${profile.hourlyRate.toLocaleString()}` : "—"}
                        </p>
                        <p className="text-[10px] text-white/30">Per Hour</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-white">{services.length}</p>
                        <p className="text-[10px] text-white/30">Services</p>
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

            {/* Bio */}
            {profile.bio && (
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
            {profile.skills && profile.skills.length > 0 && (
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

            {/* Published Services */}
            <ScrollReveal delay={150}>
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-white mb-4">
                  Published Services ({services.length})
                </h3>
                {services.length === 0 ? (
                  <div className="py-12 text-center rounded-xl border border-white/5">
                    <Wrench className="w-10 h-10 text-white/10 mx-auto mb-2" />
                    <p className="text-sm text-white/30">No services published yet</p>
                    <p className="text-[11px] text-white/20 mt-1">Published freelance services will appear here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {services.map((s: any) => (
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
          </>
        )}
      </div>
    </div>
  );
}
