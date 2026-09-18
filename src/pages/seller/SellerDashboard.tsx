import SellerLayout from "./SellerLayout";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router";
import VerificationCard from "@/components/VerificationCard";
import StoreQrCard from "@/components/seller/StoreQrCard";
import {
  Package, ShoppingCart, DollarSign, TrendingUp, Plus,
  ArrowRight, Wallet, Shield, Loader2, Rocket, CheckCircle2, Circle,
} from "lucide-react";
import { useQuery as useConvexQuery } from "convex/react";

interface EscrowRow {
  _id: string;
  sellerId: string;
  amount: number;
  status: string;
  title: string;
}

export default function SellerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const listings = useQuery(api.listings.getSellerListings);
  const walletBalance = useQuery(api.wallet.getWalletBalance);
  // Scoped to this seller's account — returns only their escrow orders.
  const escrows = useQuery(api.wallet.getEscrowBySeller);
  // Registration checklist — its hasPublishedListing flag is the FINAL step
  // of seller registration: publish a product, then the dashboard opens.
  const verification = useConvexQuery(api.verification.getMyVerificationStatus);

  // ─── FINISH-REGISTRATION GATE ───
  // A seller who has not published ANY product/service yet sees only this
  // screen — the dashboard itself unlocks with the first genuine listing.
  // The flag is computed server-side from real listings (60+ char
  // descriptions), so an empty or draft store never passes.
  const hasPublished =
    verification === undefined ? undefined : (verification as any)?.hasPublishedListing === true;
  if (hasPublished === false) {
    const reqs = ((verification as any)?.requirements ?? []) as Array<any>;
    const reqDone = (key: string) => !!reqs.find((r) => r.key === key)?.done;
    return (
      <SellerLayout>
        <div className="max-w-2xl mx-auto py-10 md:py-16 px-4">
          <div className="rounded-2xl border border-nx-violet/25 bg-gradient-to-br from-nx-violet/[0.08] via-transparent to-transparent p-6 md:p-8">
            <div className="w-12 h-12 rounded-2xl bg-nx-violet/15 border border-nx-violet/25 flex items-center justify-center">
              <Rocket className="w-6 h-6 text-nx-violet" />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-white">One last step to finish registration</h1>
            <p className="mt-2 text-sm text-white/50 leading-relaxed">
              Your account is active, {user?.businessName || user?.name || "seller"} — publish your
              first product or service and your seller dashboard opens instantly. This is what
              customers (and escrow) need to see.
            </p>

            {/* Registration progress — the publish step is the only one left */}
            <div className="mt-6 space-y-2">
              {[
                { label: "Account created & verified", done: reqDone("email") && reqDone("name") && reqDone("phone") },
                { label: "Business location set", done: reqDone("profile") },
                { label: "First product or service published", done: reqDone("listing") },
              ].map((r) => (
                <div key={r.label} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  {r.done ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-white/25 shrink-0" />
                  )}
                  <span className={`text-sm ${r.done ? "text-white/45 line-through" : "text-white font-medium"}`}>{r.label}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate("/seller/add-product")}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-nx-violet hover:bg-nx-violet/85 px-6 py-3.5 font-semibold text-white transition-colors"
            >
              <Plus className="w-4 h-4" /> Publish your first product
            </button>
            <p className="mt-3 text-[11px] text-white/30 text-center">
              Takes ~2 minutes — title, price, description, photo. Your dashboard unlocks the moment it's live.
            </p>
            {listings && listings.length > 0 && (
              <div className="mt-4 p-3 rounded-xl bg-amber-400/[0.04] border border-amber-300/15">
                <p className="text-xs text-amber-200/80 leading-relaxed">
                  You have {listings.length} published listing{listings.length > 1 ? "s" : ""}, but {listings.filter((l) => l.status === "active").some((l) => !l.description || l.description.replace(/\s+/g, " ").trim().length < 60) ? "their descriptions are too short to count" : "none are active"}.{" "}
                  <button onClick={() => navigate("/seller/products")} className="text-amber-300 underline underline-offset-2 hover:text-amber-200">
                    Add a full description (60+ characters) to any of them
                  </button>{" "}
                  and your dashboard opens instantly.
                </p>
              </div>
            )}
          </div>
        </div>
      </SellerLayout>
    );
  }

  const myEscrows = (escrows ?? []) as unknown as EscrowRow[];
  const activeProducts = (listings ?? []).filter((l) => l.status === "active");
  const totalViews = (listings ?? []).reduce((sum: number, l: any) => sum + (l.views || 0), 0);
  const inEscrow = myEscrows
    .filter((e) => ["funded", "active", "delivery", "inspection"].includes(e.status))
    .reduce((sum: number, e) => sum + (e.amount || 0), 0);
  const totalRevenue = myEscrows
    .filter((e) => ["released", "completed"].includes(e.status))
    .reduce((sum: number, e) => sum + (e.amount || 0), 0);
  const recentOrders = myEscrows.slice(0, 5);

  const isLoading =
    listings === undefined ||
    walletBalance === undefined ||
    escrows === undefined ||
    verification === undefined;

  if (isLoading) {
    return (
      <SellerLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-nx-violet animate-spin" />
        </div>
      </SellerLayout>
    );
  }

  const isNewSeller = !listings?.length;

  return (
    <SellerLayout>
      <div className="space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {user?.businessName || user?.name || "Seller"}
          </h1>
          <p className="text-sm text-white/40 mt-1">Here's what's happening with your store today.</p>
          {user?.kycStatus === "verified" && (
            <span className="inline-flex items-center gap-1 mt-2 text-[11px] px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400">
              <Shield className="w-3 h-3" /> Verified Seller
            </span>
          )}
        </div>

        {/* Progressive verification — KYC + genuine listing gate */}
        <VerificationCard />

        {/* Store QR — permanent link customers scan to reach this store */}
        <StoreQrCard />

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-400/10 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-xs text-white/40">Available Balance</span>
            </div>
            <p className="text-xl font-bold text-white">KES {(walletBalance?.walletBalance || 0).toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-nx-cyan/10 flex items-center justify-center">
                <Shield className="w-4 h-4 text-nx-cyan" />
              </div>
              <span className="text-xs text-white/40">In Escrow</span>
            </div>
            <p className="text-xl font-bold text-white">KES {inEscrow.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-nx-violet/10 flex items-center justify-center">
                <Package className="w-4 h-4 text-nx-violet" />
              </div>
              <span className="text-xs text-white/40">Active Products</span>
            </div>
            <p className="text-xl font-bold text-white">{activeProducts.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-amber-400/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-xs text-white/40">Total Revenue</span>
            </div>
            <p className="text-xl font-bold text-white">KES {totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button onClick={() => navigate("/seller/add-product")}
            className="flex items-center gap-3 p-4 rounded-xl bg-nx-violet/10 border border-nx-violet/10 hover:bg-nx-violet/15 transition-colors text-left">
            <Plus className="w-5 h-5 text-nx-violet" />
            <div>
              <p className="text-sm font-medium text-white">Add Product</p>
              <p className="text-[11px] text-white/30">List a new item</p>
            </div>
          </button>
          <button onClick={() => navigate("/seller/orders")}
            className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors text-left">
            <ShoppingCart className="w-5 h-5 text-white/40" />
            <div>
              <p className="text-sm font-medium text-white">View Orders</p>
              <p className="text-[11px] text-white/30">{myEscrows.length} total orders</p>
            </div>
          </button>
          <button onClick={() => navigate("/seller/messages")}
            className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors text-left">
            <DollarSign className="w-5 h-5 text-white/40" />
            <div>
              <p className="text-sm font-medium text-white">Messages</p>
              <p className="text-[11px] text-white/30">Chat with buyers</p>
            </div>
          </button>
        </div>

        {/* New seller prompt */}
        {isNewSeller && (
          <div className="p-6 rounded-xl bg-nx-violet/5 border border-nx-violet/10 text-center">
            <Package className="w-10 h-10 text-nx-violet/30 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Start Selling on Nexora</h3>
            <p className="text-sm text-white/40 mb-4 max-w-md mx-auto">List your first product and reach thousands of buyers across Kenya.</p>
            <button onClick={() => navigate("/seller/add-product")} className="px-5 py-2.5 rounded-lg bg-nx-violet text-white text-sm font-medium hover:bg-nx-violet/80 transition-colors">
              Add Your First Product
            </button>
          </div>
        )}

        {/* Recent Orders */}
        {recentOrders.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white">Recent Orders</h2>
              <button onClick={() => navigate("/seller/orders")} className="text-xs text-nx-violet hover:text-nx-violet/80 flex items-center gap-1">
                View All <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-2">
              {recentOrders.map((order) => (
                <div key={order._id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.03] flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 text-white/20" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{order.title}</p>
                    <p className="text-[11px] text-white/30 capitalize">{order.status}</p>
                  </div>
                  <span className="text-sm font-medium text-white shrink-0">KES {order.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats overview */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <h2 className="text-sm font-semibold text-white mb-3">Store Overview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-[11px] text-white/30">Total Products</p>
              <p className="text-lg font-bold text-white">{listings?.length || 0}</p>
            </div>
            <div>
              <p className="text-[11px] text-white/30">Total Views</p>
              <p className="text-lg font-bold text-white">{totalViews.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[11px] text-white/30">Total Orders</p>
              <p className="text-lg font-bold text-white">{myEscrows.length}</p>
            </div>
            <div>
              <p className="text-[11px] text-white/30">Completed Sales</p>
              <p className="text-lg font-bold text-white">
                {myEscrows.filter((e) => ["released", "completed"].includes(e.status)).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </SellerLayout>
  );
}
