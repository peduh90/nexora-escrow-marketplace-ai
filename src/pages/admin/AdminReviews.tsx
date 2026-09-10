import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import AdminLayout from "./AdminLayout";
import { Star, Trash2, MessageSquareReply } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function AdminReviews() {
  // REAL data: the reviews table + users/listings for names. (Previously this
  // page always showed "0 reviews / no reviews yet" because nothing was wired.)
  const allReviews = useQuery(api.admin.getAllReviews);
  const allUsers = useQuery(api.admin.getAllUsers);
  const allListings = useQuery(api.admin.getAllListings);
  const deleteReview = useMutation(api.reviews.deleteReview);

  const reviews = allReviews ?? [];
  const users = allUsers ?? [];
  const listings = allListings ?? [];
  const getUser = (id: string) => users.find((u: any) => u._id === id);
  const getListing = (id: string) => listings.find((l: any) => l._id === id);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const total = reviews.length;
  const avg = total > 0 ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / total : 0;
  const replied = reviews.filter((r: any) => r.sellerReply).length;
  const low = reviews.filter((r: any) => r.rating <= 2).length;

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteReview({ reviewId: id });
      toast.success("Review removed");
    } catch (err: any) {
      toast.error(err?.message || "Could not remove review");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Review Management</h1>
        <p className="text-sm text-white/40 mt-1">Monitor and moderate marketplace reviews</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Reviews", value: total.toString() },
          { label: "Average Rating", value: total > 0 ? `${avg.toFixed(1)} ★` : "—" },
          { label: "Sellers Replied", value: `${replied}/${total}` },
          { label: "Low (≤2★)", value: low.toString() },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-xl border border-white/5 bg-[#0A0A12]">
            <p className="text-[10px] text-white/30 uppercase">{s.label}</p>
            <p className="text-xl font-bold text-white mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {total === 0 ? (
        <div className="rounded-xl border border-white/5 bg-[#0A0A12] py-16 flex flex-col items-center">
          <Star className="w-8 h-8 text-white/10 mb-3" />
          <p className="text-sm text-white/30">No reviews yet</p>
          <p className="text-[11px] text-white/15 mt-1">Reviews will appear here after completed transactions</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/5 bg-[#0A0A12]">
          <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
            <Star className="w-4 h-4 text-nx-gold" />
            <h3 className="text-sm font-semibold text-white">All Reviews</h3>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {reviews.map((r: any) => {
              const buyer = getUser(r.buyerId);
              const seller = getUser(r.sellerId);
              const listing = getListing(r.listingId);
              return (
                <div key={r._id} className="px-5 py-4 hover:bg-white/[0.01] transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-nx-gold/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-nx-gold">
                        {(buyer?.name || buyer?.email || "?")[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${i <= r.rating ? "text-nx-gold fill-nx-gold" : "text-white/15"}`}
                            />
                          ))}
                        </span>
                        <span className="text-xs text-white/70">{buyer?.name || buyer?.email || "Buyer"}</span>
                        <span className="text-[10px] text-white/25">on</span>
                        <span className="text-[10px] text-white/50 truncate max-w-[220px]">
                          {listing?.title || "a listing"}
                        </span>
                        <span className="text-[10px] text-white/20">
                          · {seller?.name || seller?.businessName || "Seller"}
                        </span>
                      </div>
                      {r.comment && <p className="text-xs text-white/50">{r.comment}</p>}
                      {r.sellerReply && (
                        <p className="text-[11px] text-white/35 mt-1 flex items-center gap-1.5">
                          <MessageSquareReply className="w-3 h-3 shrink-0" /> Seller replied: “{r.sellerReply}”
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end gap-2">
                      <span className="text-[10px] text-white/20">{new Date(r.createdAt).toLocaleDateString()}</span>
                      <button
                        onClick={() => handleDelete(r._id)}
                        disabled={deletingId === r._id}
                        className="p-1.5 rounded text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40"
                        title="Remove review"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
