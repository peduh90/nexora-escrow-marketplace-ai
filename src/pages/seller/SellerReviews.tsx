import SellerLayout from "./SellerLayout";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { Star, MessageSquare } from "lucide-react";

export default function SellerReviews() {
  const myReviews = useQuery(api.reviews.getSellerReviews, { sellerId: "me" });
  const rating = useQuery(api.reviews.getSellerRating, { sellerId: "me" });
  const replyMutation = useMutation(api.reviews.replyToReview);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [busy, setBusy] = useState(false);

  const reviews = myReviews ?? [];
  const avg = rating?.average ?? 0;
  const count = rating?.count ?? 0;

  const breakdown = [5, 4, 3, 2, 1].map((r) => ({
    stars: r,
    count: reviews.filter((rev: any) => rev.rating === r).length,
  }));

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    setBusy(true);
    try {
      await replyMutation({ reviewId, reply: replyText.trim() });
      toast.success("Reply posted");
      setReplyingTo(null);
      setReplyText("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to post reply");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SellerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Reviews</h1>
          <p className="text-sm text-white/40 mt-1">Customer feedback and ratings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Overall rating */}
          <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5 text-center">
            <p className={`text-5xl font-bold ${count > 0 ? "text-white" : "text-white/20"}`}>
              {count > 0 ? avg.toFixed(1) : "—"}
            </p>
            <div className="flex items-center justify-center gap-1 mt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-5 h-5 ${i < Math.round(avg) ? "text-amber-400 fill-amber-400" : "text-white/10"}`} />
              ))}
            </div>
            <p className="text-xs text-white/30 mt-2">
              {count > 0 ? `${count} review${count === 1 ? "" : "s"}` : "No reviews yet"}
            </p>
          </div>

          {/* Rating breakdown */}
          <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5 md:col-span-2">
            <h3 className="text-sm font-semibold text-white mb-3">Rating Breakdown</h3>
            <div className="space-y-2">
              {breakdown.map(({ stars, count: c }) => (
                <div key={stars} className="flex items-center gap-3">
                  <span className="text-xs text-white/40 w-6">{stars}★</span>
                  <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-400/70 transition-all"
                      style={{ width: count > 0 ? `${(c / count) * 100}%` : "0%" }}
                    />
                  </div>
                  <span className="text-xs text-white/30 w-6 text-right">{c}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews list */}
        {reviews.length === 0 ? (
          <div className="py-20 text-center rounded-xl bg-white/[0.02] border border-white/5">
            <MessageSquare className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/40 font-medium">No reviews yet</p>
            <p className="text-[11px] text-white/20 mt-1">Customer reviews will appear here after completed transactions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((rev: any) => (
              <div key={rev._id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? "text-amber-400 fill-amber-400" : "text-white/10"}`} />
                      ))}
                      <span className="text-[10px] text-white/20">{new Date(rev.createdAt).toLocaleDateString()}</span>
                    </div>
                    {rev.comment && <p className="text-sm text-white/60">{rev.comment}</p>}
                    {rev.sellerReply && (
                      <div className="mt-2 pl-3 border-l-2 border-nx-violet/30">
                        <p className="text-[10px] text-nx-violet font-medium mb-0.5">Your reply</p>
                        <p className="text-xs text-white/40">{rev.sellerReply}</p>
                      </div>
                    )}
                    {!rev.sellerReply && rev.comment && (
                      <button
                        onClick={() => { setReplyingTo(replyingTo === rev._id ? null : rev._id); setReplyText(""); }}
                        className="mt-2 text-[11px] text-nx-violet hover:text-nx-violet/80 transition-colors"
                      >
                        {replyingTo === rev._id ? "Cancel" : "Reply"}
                      </button>
                    )}
                    {replyingTo === rev._id && (
                      <div className="mt-2 flex gap-2">
                        <input
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write a public reply…"
                          className="flex-1 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-xs text-white placeholder:text-white/20 focus:border-nx-violet/50 focus:outline-none"
                        />
                        <button
                          onClick={() => handleReply(rev._id)}
                          disabled={busy || !replyText.trim()}
                          className="px-3 py-2 rounded-lg bg-nx-violet text-white text-xs font-medium hover:bg-nx-violet/80 disabled:opacity-40 transition-colors"
                        >
                          Post
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SellerLayout>
  );
}
