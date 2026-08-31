import SellerLayout from "./SellerLayout";
import { Star, MessageSquare } from "lucide-react";

export default function SellerReviews() {
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
            <p className="text-5xl font-bold text-white/20">—</p>
            <div className="flex items-center justify-center gap-1 mt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-5 h-5 text-white/10" />
              ))}
            </div>
            <p className="text-xs text-white/30 mt-2">No reviews yet</p>
          </div>

          {/* Rating breakdown */}
          <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5 md:col-span-2">
            <h3 className="text-sm font-semibold text-white mb-3">Rating Breakdown</h3>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((r) => (
                <div key={r} className="flex items-center gap-3">
                  <span className="text-xs text-white/40 w-6">{r}★</span>
                  <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full bg-amber-400/0" style={{ width: "0%" }} />
                  </div>
                  <span className="text-xs text-white/30 w-6 text-right">0</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews list */}
        <div className="py-20 text-center rounded-xl bg-white/[0.02] border border-white/5">
          <MessageSquare className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/40 font-medium">No reviews yet</p>
          <p className="text-[11px] text-white/20 mt-1">Customer reviews will appear here after completed transactions</p>
        </div>
      </div>
    </SellerLayout>
  );
}
