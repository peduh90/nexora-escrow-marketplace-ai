import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import FreelanceNav from "./FreelanceNav";
import { shortKES } from "@/lib/fees";
import { getWhatsAppChatUrl, normalizeKenyanPhone } from "@/lib/whatsapp";
import {
  ArrowLeft, Search, Star, MapPin, Briefcase, Filter, ChevronDown,
  Globe, CheckCircle2, Users, ArrowRight, MessageSquare,
} from "lucide-react";

const CATEGORIES = [
  { slug: "all", label: "All" },
  { slug: "writing", label: "Writing & Editing" },
  { slug: "design", label: "Design & Branding" },
  { slug: "video", label: "Video & Photography" },
  { slug: "marketing", label: "Social Media & Marketing" },
  { slug: "web-development", label: "Web & Software" },
  { slug: "business", label: "Business & Professional" },
  { slug: "education", label: "Education & Tutoring" },
  { slug: "ai-tech", label: "AI & Digital Tools" },
];

const CATEGORY_COLORS: Record<string, string> = {
  writing: "bg-nx-emerald/10 text-nx-emerald",
  design: "bg-fuchsia-500/10 text-fuchsia-300",
  video: "bg-rose-500/10 text-rose-300",
  marketing: "bg-nx-gold/10 text-nx-gold",
  "web-development": "bg-nx-cyan/10 text-nx-cyan",
  business: "bg-violet-500/10 text-violet-300",
  education: "bg-sky-500/10 text-sky-300",
  "ai-tech": "bg-indigo-500/10 text-indigo-300",
};

function categoryLabel(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug)?.label || slug;
}

export default function FreelanceFindFreelancers() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(searchParams.get("category") || "all");
  const [showFilters, setShowFilters] = useState(false);

  const freelancers = useQuery(api.freelance.searchFreelancers, {
    query: search || undefined,
    category: category === "all" ? undefined : category,
  });
  // In-system chat: opens (or creates) a conversation with the freelancer
  // through the same messaging engine the product pages use.
  const startConversation = useMutation(api.messages.startConversation);

  const display = freelancers ?? [];

  // Hiring itself is escrow-backed and requires an account (buyer/seller/
  // employer all pass); opening and browsing profiles is free for everyone.
  const openProfile = (userId: string) => {
    navigate(`/freelancer/${userId}`);
  };

  const startHire = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate(`/auth?returnTo=${encodeURIComponent(`/freelancer/${userId}`)}`);
      return;
    }
    openProfile(userId);
  };

  // Start an in-system conversation with this freelancer. The conversation is
  // attached to the freelancer's profile so the Messages page shows context.
  const startChat = async (e: React.MouseEvent, fl: any) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate(`/auth?returnTo=${encodeURIComponent(`/freelance/find-freelancers`)}`);
      return;
    }
    try {
      const result = await startConversation({
        sellerId: fl.userId,
        listingId: fl._id,
        firstMessage: `Hi ${fl.displayName}! I found your profile on Nexora Freelance and I'd like to work with you.`,
      });
      toast.success("Chat started");
      navigate(`/chat/${result.conversationId}`);
    } catch (err: any) {
      toast.error(err?.message || "Could not start the chat");
    }
  };

  return (
    <div className="min-h-screen bg-[#05050A]">
      <FreelanceNav active="services" />

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-nx-gold/10 border border-nx-gold/20 text-nx-gold text-[11px] font-semibold mb-3">
            <Users className="w-3.5 h-3.5" /> HIRE A FREELANCER
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Meet the freelancers
          </h1>
          <p className="text-sm text-white/45 mt-2 max-w-2xl leading-relaxed">
            Real registered professionals with verified track records. Open any profile to see
            exactly what they do — then hire with escrow-protected milestone payments. You only
            pay when the work is delivered.
          </p>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-white/20 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, skill, or specialty — e.g. writer, logo, SEO..."
              className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-white/80 placeholder:text-white/25 focus:border-nx-violet/30 focus:outline-none" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-white/60 hover:border-nx-violet/20 transition-colors">
            <Filter className="w-4 h-4" /> Filters
            <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Category chips — always visible on desktop */}
        <div className="hidden md:flex flex-wrap gap-2 mb-5">
          {CATEGORIES.map((c) => (
            <button key={c.slug} onClick={() => setCategory(c.slug)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors border ${category === c.slug ? "bg-nx-violet/20 text-nx-violet border-nx-violet/30" : "bg-white/[0.03] text-white/40 border-white/5 hover:border-white/15 hover:text-white/70"}`}>
              {c.label}
            </button>
          ))}
        </div>

        {/* Filters (mobile) */}
        {showFilters && (
          <div className="md:hidden p-4 rounded-xl bg-white/[0.02] border border-white/5 mb-4">
            <p className="text-xs text-white/40 mb-2 font-medium">Category</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button key={c.slug} onClick={() => setCategory(c.slug)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${category === c.slug ? "bg-nx-violet/20 text-nx-violet border border-nx-violet/30" : "bg-white/[0.03] text-white/40 border border-white/5"}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Result count */}
        <p className="text-xs text-white/30 mb-3">
          {display.length} freelancer{display.length === 1 ? "" : "s"} available
        </p>

        {/* Freelancer cards */}
        {display.length === 0 ? (
          <div className="text-center py-20 rounded-2xl bg-white/[0.02] border border-white/5">
            <Users className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/40 font-medium">No freelancers in this category yet</p>
            <p className="text-[11px] text-white/25 mt-1 max-w-sm mx-auto">
              Freelancers appear here the moment they register and complete their profile — try
              another category or clear your search.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {display.map((fl: any) => (
              <div key={fl._id || fl.userId}
                onClick={() => openProfile(fl.userId)}
                className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-nx-gold/25 hover:bg-white/[0.04] transition-all cursor-pointer group flex flex-col">
                {/* Top: photo + identity */}
                <div className="flex items-start gap-3 mb-3">
                  {fl.photo ? (
                    <img src={fl.photo} alt={fl.displayName}
                      className="w-14 h-14 rounded-2xl object-cover border border-white/10 shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-nx-violet/15 border border-nx-violet/25 flex items-center justify-center text-nx-violet font-bold text-xl shrink-0">
                      {(fl.displayName || "U")[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-sm font-semibold text-white truncate group-hover:text-nx-gold transition-colors">{fl.displayName}</h3>
                      {fl.isVerified && (
                        <span title="Verified freelancer">
                          <CheckCircle2 className="w-3.5 h-3.5 text-nx-cyan shrink-0" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/45 mt-0.5 line-clamp-1">{fl.title || "Freelancer"}</p>
                    <div className="flex items-center gap-2.5 mt-1.5">
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-nx-gold fill-nx-gold" />
                        <span className="text-xs font-medium text-white">{fl.avgRating?.toFixed(1) || "5.0"}</span>
                      </span>
                      <span className="text-[10px] text-white/30">{fl.completedProjects || 0} jobs done</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${fl.availability === "available" ? "text-nx-emerald bg-nx-emerald/10" : "text-white/40 bg-white/5"}`}>
                        {fl.availability || "available"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* What they do — bio + specialties */}
                <p className="text-xs text-white/40 leading-relaxed line-clamp-2 mb-3">
                  {fl.bio || `${fl.title || "Freelancer"} — available for new work on Nexora Freelance.`}
                </p>

                {/* What they do — category badges */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {(fl.categories || []).slice(0, 3).map((c: string) => (
                    <span key={c} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[c] || "bg-white/5 text-white/50"}`}>
                      {categoryLabel(c)}
                    </span>
                  ))}
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {(fl.skills || []).slice(0, 4).map((s: string) => (
                    <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-white/[0.04] border border-white/5 text-white/45">{s}</span>
                  ))}
                </div>

                {/* Footer: rate + contact actions — WhatsApp direct or in-system chat,
                    mirroring the product-card contact pattern */}
                <div className="mt-auto pt-3 border-t border-white/5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-sm font-bold text-nx-emerald">{shortKES(fl.hourlyRate || 0)}</span>
                      <span className="text-[10px] text-white/30">/hr</span>
                      {fl.location && (
                        <p className="text-[10px] text-white/25 flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="w-2.5 h-2.5" />{fl.location}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => startHire(e, fl.userId)}
                      className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-nx-gold/15 border border-nx-gold/25 text-nx-gold text-xs font-semibold hover:bg-nx-gold/25 transition-colors"
                    >
                      Hire <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2.5">
                    {(() => {
                      const waNumber = normalizeKenyanPhone(fl.phone);
                      return (
                        <>
                          <a
                            href={getWhatsAppChatUrl(
                              waNumber || undefined,
                              `Hi ${fl.displayName}! I found your profile on Nexora Freelance and I'd like to discuss a project.`,
                            )}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-medium hover:bg-emerald-500/20 transition-colors"
                          >
                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.5 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.4-.7-2.9-1.1-4.7-4-4.9-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5s.8 1.9.8 2c.1.1.1.3 0 .5l-.4.6c-.1.2-.3.4-.1.7.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.7-.1l1-1.2c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.6.4 0 .1 0 .8-.2 1.3Z" /></svg>
                            WhatsApp
                          </a>
                          <button
                            onClick={(e) => startChat(e, fl)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-nx-violet/10 border border-nx-violet/25 text-nx-violet text-xs font-medium hover:bg-nx-violet/20 transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" /> Chat
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
