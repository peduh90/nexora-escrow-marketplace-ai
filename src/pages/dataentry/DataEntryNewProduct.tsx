import DataEntryLayout from "./DataEntryLayout";
import { useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { CATEGORIES as FALLBACK_CATEGORIES } from "@/lib/categories";
import { KENYA_COUNTIES } from "@/lib/kenya-locations";
import {
  Loader2, Store, Upload, X, CheckCircle2, ArrowRight,
  ImagePlus, Send, AlertCircle,
} from "lucide-react";

const CONDITIONS = ["Brand New", "Second Hand", "Refurbished"];

export default function DataEntryNewProduct() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const sellers = useQuery(api.dataEntry.mySellers);
  const dbCategories = useQuery(api.adminCategories.getActiveCategories);
  const generateUploadUrl = useMutation(api.listings.generateUploadUrl);
  const createDelegatedProduct = useMutation(api.dataEntry.createDelegatedProduct);
  const submitForReview = useMutation(api.dataEntry.submitForReview);

  const categories =
    dbCategories && dbCategories.length > 0 ? dbCategories : FALLBACK_CATEGORIES;

  const [sellerId, setSellerId] = useState<string>(searchParams.get("seller") || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState(CONDITIONS[0]);
  const [negotiable, setNegotiable] = useState(false);
  const [originalPrice, setOriginalPrice] = useState("");
  const [county, setCounty] = useState("");
  const [town, setTown] = useState("");
  const [transportAvailable, setTransportAvailable] = useState(false);
  const [transportFee, setTransportFee] = useState("");

  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ entryId: string; sellerId: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedCategory = categories.find((c: any) => c.slug === category);
  const countyTowns = county ? KENYA_COUNTIES.find((c) => c.name === county)?.towns ?? [] : [];

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const uploadUrl = await generateUploadUrl();
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!response.ok) throw new Error(`Upload failed for ${file.name}`);
        const data = (await response.json()) as { storageKey?: string; storageId?: string; key?: string };
        const key = data.storageKey || data.storageId || data.key;
        if (!key) throw new Error("No storage key returned");
        setImages((prev) => [...prev, key]);
      }
    } catch (err: any) {
      setError(err?.message || "Could not upload images.");
    } finally {
      setUploading(false);
    }
  };

  const valid =
    sellerId && title.trim().length >= 3 && description.trim().length >= 10 &&
    Number(price) > 0 && category && county && town;

  const handleCreate = async (thenSubmit: boolean) => {
    if (!valid || saving) return;
    setSaving(true);
    setError(null);
    try {
      const result = await createDelegatedProduct({
        sellerId,
        listingArgs: {
          title: title.trim(),
          description: description.trim(),
          price: Number(price),
          currency: "KES",
          category,
          subcategory: subcategory || undefined,
          images,
          transportAvailable,
          transportFee: transportFee ? Number(transportFee) : undefined,
          originCounty: county,
          originTown: town,
          condition,
          negotiable: negotiable || undefined,
          originalPrice: originalPrice ? Number(originalPrice) : undefined,
        },
      });
      if (thenSubmit) {
        await submitForReview({ sellerId, productEntryId: result.productEntryId });
        navigate("/data-entry/products");
      } else {
        setCreated({ entryId: result.productEntryId, sellerId });
      }
    } catch (err: any) {
      setError(err?.message || "Could not create the product.");
    } finally {
      setSaving(false);
    }
  };

  if (created) {
    return (
      <DataEntryLayout>
        <div className="max-w-md mx-auto mt-10 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-400/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7 text-emerald-400" />
          </div>
          <h2 className="text-lg font-bold text-white">Draft created</h2>
          <p className="text-xs text-white/40 mt-1.5">
            “{title}” is saved as a draft for this store. Send it for the seller's review now, or keep working on it.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={async () => {
                if (!created || submitting) return;
                setSubmitting(true);
                setError(null);
                try {
                  await submitForReview({ sellerId: created.sellerId, productEntryId: created.entryId as any });
                  navigate("/data-entry/products");
                } catch (err: any) {
                  setError(err?.message || "Could not submit for review.");
                } finally {
                  setSubmitting(false);
                }
              }}
              disabled={submitting || saving}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-nx-violet hover:bg-nx-violet/80 text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit for review
            </button>
            <button
              onClick={() => navigate("/data-entry/products")}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 text-white/70 text-sm hover:bg-white/15 transition-colors"
            >
              My products <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </DataEntryLayout>
    );
  }

  const inputCls =
    "w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-nx-violet/40 transition-colors";

  return (
    <DataEntryLayout>
      <div className="max-w-3xl">
        <h2 className="text-lg font-bold text-white">Product Entry Workspace</h2>
        <p className="text-xs text-white/30 mt-0.5">
          Enter a product for a store you work with. The seller reviews every draft before it goes live.
        </p>

        {error && (
          <div className="mt-4 flex items-start gap-2 px-4 py-3 rounded-lg bg-red-400/10 border border-red-400/20 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-px" /> {error}
          </div>
        )}

        <div className="mt-5 space-y-5 rounded-2xl border border-white/5 bg-white/[0.02] p-5">
          {/* Store */}
          <div>
            <label className="text-xs font-medium text-white/50 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5" /> Store
            </label>
            <select
              value={sellerId}
              onChange={(e) => setSellerId(e.target.value)}
              className={`mt-1.5 ${inputCls}`}
            >
              <option value="">Choose a store…</option>
              {(sellers ?? []).map((s: any) => (
                <option key={s.sellerId} value={s.sellerId} className="bg-[#0A0A12]">
                  {s.businessName}
                </option>
              ))}
            </select>
            {sellers && sellers.length === 0 && (
              <p className="mt-1.5 text-[11px] text-amber-300/80">
                No store access yet — ask the seller to invite you to their team first.
              </p>
            )}
          </div>

          {/* Title + description */}
          <div>
            <label className="text-xs font-medium text-white/50">Product title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Safety Helmet — Full Body Harness Kit"
              maxLength={120}
              className={`mt-1.5 ${inputCls}`}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-white/50">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Describe the product: features, condition, what's included, ideal buyer…"
              className={`mt-1.5 ${inputCls}`}
            />
            <p className="mt-1 text-[10px] text-white/25">{description.trim().length}/10 minimum characters</p>
          </div>

          {/* Category */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-white/50">Category</label>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setSubcategory(""); }}
                className={`mt-1.5 ${inputCls}`}
              >
                <option value="">Choose category…</option>
                {categories.map((c: any) => (
                  <option key={c.slug} value={c.slug} className="bg-[#0A0A12]">{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-white/50">Subcategory</label>
              <select
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                disabled={!selectedCategory}
                className={`mt-1.5 ${inputCls} disabled:opacity-40`}
              >
                <option value="">Choose subcategory…</option>
                {(selectedCategory?.subcategories ?? []).map((s: any) => (
                  <option key={s.slug} value={s.slug} className="bg-[#0A0A12]">{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Price */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-white/50">Price (KSh)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="2500"
                min={0}
                className={`mt-1.5 ${inputCls}`}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-white/50">Condition</label>
              <select value={condition} onChange={(e) => setCondition(e.target.value)} className={`mt-1.5 ${inputCls}`}>
                {CONDITIONS.map((c) => <option key={c} value={c} className="bg-[#0A0A12]">{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-white/50">Original price (optional)</label>
              <input
                type="number"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="3000"
                min={0}
                className={`mt-1.5 ${inputCls}`}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-white/50 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={negotiable}
              onChange={(e) => setNegotiable(e.target.checked)}
              className="accent-nx-violet"
            />
            Price is negotiable
          </label>

          {/* Location */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-white/50">County</label>
              <select
                value={county}
                onChange={(e) => { setCounty(e.target.value); setTown(""); }}
                className={`mt-1.5 ${inputCls}`}
              >
                <option value="">Choose county…</option>
                {KENYA_COUNTIES.map((c) => (
                  <option key={c.name} value={c.name} className="bg-[#0A0A12]">{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-white/50">Town</label>
              <select
                value={town}
                onChange={(e) => setTown(e.target.value)}
                disabled={!county}
                className={`mt-1.5 ${inputCls} disabled:opacity-40`}
              >
                <option value="">Choose town…</option>
                {countyTowns.map((t) => (
                  <option key={t.name} value={t.name} className="bg-[#0A0A12]">{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Transport */}
          <div className="grid sm:grid-cols-2 gap-4 items-end">
            <label className="flex items-center gap-2 text-xs text-white/50 cursor-pointer select-none pb-2.5">
              <input
                type="checkbox"
                checked={transportAvailable}
                onChange={(e) => setTransportAvailable(e.target.checked)}
                className="accent-nx-violet"
              />
              Transport / delivery available
            </label>
            {transportAvailable && (
              <div>
                <label className="text-xs font-medium text-white/50">Transport fee (KSh)</label>
                <input
                  type="number"
                  value={transportFee}
                  onChange={(e) => setTransportFee(e.target.value)}
                  placeholder="300"
                  min={0}
                  className={`mt-1.5 ${inputCls}`}
                />
              </div>
            )}
          </div>

          {/* Images */}
          <div>
            <label className="text-xs font-medium text-white/50">Photos</label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-white/10 bg-white/[0.03]">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 p-0.5 rounded bg-black/70 text-white/70 hover:text-red-400"
                    aria-label="Remove image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-20 h-20 rounded-lg border border-dashed border-white/15 bg-white/[0.02] flex flex-col items-center justify-center gap-1 text-white/30 hover:border-nx-violet/50 hover:text-nx-violet transition-colors disabled:opacity-50"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                <span className="text-[9px]">{uploading ? "Uploading" : "Add"}</span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
              />
            </div>
            <p className="mt-1.5 text-[10px] text-white/25">
              <Upload className="w-3 h-3 inline mr-1" />
              Up to 8 photos. The first photo is the cover.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => handleCreate(false)}
            disabled={!valid || saving || uploading}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/[0.06] border border-white/10 text-white text-sm font-semibold hover:bg-white/[0.1] transition-colors disabled:opacity-40"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Save draft
          </button>
          <button
            onClick={() => handleCreate(true)}
            disabled={!valid || saving || uploading}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-nx-violet hover:bg-nx-violet/80 text-white text-sm font-semibold transition-colors disabled:opacity-40"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Save & submit for review
          </button>
        </div>
      </div>
    </DataEntryLayout>
  );
}
