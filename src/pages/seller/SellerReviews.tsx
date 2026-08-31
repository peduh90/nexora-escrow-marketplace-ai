import { useState } from "react";
import SellerLayout from "./SellerLayout";
import { Star, MessageSquare, BadgeCheck, ThumbsUp } from "lucide-react";

const reviews = [
  { id: "r1", buyer: "James Kamau", product: "HP EliteBook 840 G3", rating: 5, text: "Excellent laptop! Exactly as described. Fast delivery through Nexora. Very trustworthy seller.", date: "2 days ago", verified: true, response: null },
  { id: "r2", buyer: "Sarah Wanjiku", product: "iPhone 15 Pro Max", rating: 5, text: "Brand new as promised. Great communication. Will buy again!", date: "5 days ago", verified: true, response: "Thank you Sarah! Enjoy your new iPhone." },
  { id: "r3", buyer: "Peter Otieno", product: "Nike Air Max 90", rating: 4, text: "Good shoes, authentic Nike. Delivery took a bit longer than expected but product is great.", date: "1 week ago", verified: true, response: null },
  { id: "r4", buyer: "Grace Muthoni", product: "Sony WH-1000XM5", rating: 5, text: "Perfect noise cancelling headphones. Best price I found. Nexora escrow gave me confidence to buy.", date: "2 weeks ago", verified: true, response: null },
];

export default function SellerReviews() {
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const ratings = [5, 4, 3, 2, 1];
  const ratingCounts = ratings.map(r => reviews.filter(rev => rev.rating === r).length);

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
            <p className="text-5xl font-bold text-white">{avgRating.toFixed(1)}</p>
            <div className="flex items-center justify-center gap-1 mt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-5 h-5 ${i < Math.round(avgRating) ? "text-amber-400 fill-amber-400" : "text-white/10"}`} />
              ))}
            </div>
            <p className="text-xs text-white/30 mt-2">{reviews.length} reviews</p>
          </div>

          {/* Rating breakdown */}
          <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5 md:col-span-2">
            <h3 className="text-sm font-semibold text-white mb-3">Rating Breakdown</h3>
            <div className="space-y-2">
              {ratings.map((r, i) => (
                <div key={r} className="flex items-center gap-3">
                  <span className="text-xs text-white/40 w-6">{r}★</span>
                  <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full bg-amber-400/60" style={{ width: `${(ratingCounts[i] / reviews.length) * 100}%` }} />
                  </div>
                  <span className="text-xs text-white/30 w-6 text-right">{ratingCounts[i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews list */}
        <div className="space-y-3">
          {reviews.map(review => (
            <div key={review.id} className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-nx-violet/10 flex items-center justify-center text-nx-violet text-xs font-bold">{review.buyer.charAt(0)}</div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-white">{review.buyer}</span>
                      {review.verified && <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <p className="text-[10px] text-white/25">{review.product} • {review.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < review.rating ? "text-amber-400 fill-amber-400" : "text-white/10"}`} />
                  ))}
                </div>
              </div>
              <p className="text-sm text-white/60 leading-relaxed">{review.text}</p>
              {review.response && (
                <div className="mt-3 p-3 rounded-lg bg-nx-violet/5 border border-nx-violet/10">
                  <p className="text-[10px] text-nx-violet font-medium mb-1">Seller Response</p>
                  <p className="text-xs text-white/50">{review.response}</p>
                </div>
              )}
              {!review.response && (
                <button onClick={() => setReplyTo(review.id)} className="mt-2 text-xs text-nx-violet hover:text-nx-violet/80 transition-colors flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" /> Reply
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </SellerLayout>
  );
}
