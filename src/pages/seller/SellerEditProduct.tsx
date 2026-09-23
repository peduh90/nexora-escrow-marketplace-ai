import { useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import SellerLayout from "./SellerLayout";
import { CATEGORIES, SPECS_TEMPLATES } from "@/lib/categories";
import { ChevronRight, ChevronLeft, Check, Package, X, ImagePlus, Loader2, ArrowLeft } from "lucide-react";
import { MIN_DESCRIPTION_CHARS } from "../../convex/verification";

const steps = ["Category", "Details", "Specifications", "Images", "Location", "Pricing", "Preview"];

function ImageUploadStep({ images, setImages }: { images: { file: File; preview: string }[]; setImages: (imgs: { file: File; preview: string }[]) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const newImages: { file: File; preview: string }[] = [];
    for (let i = 0; i < files.length && images.length + newImages.length < 6; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 5 * 1024 * 1024) continue;
      newImages.push({ file, preview: URL.createObjectURL(file) });
    }
    if (newImages.length > 0) setImages([...images, ...newImages]);
  }, [images, setImages]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const removeImage = (index: number) => {
    const updated = [...images];
    URL.revokeObjectURL(updated[index].preview);
    updated.splice(index, 1);
    setImages(updated);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Product Images</h3>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative aspect-[2/1] rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
          dragOver ? "border-nx-violet bg-nx-violet/5" : "border-white/10 hover:border-nx-violet/30 hover:bg-white/[0.01]"
        }`}
      >
        <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        <ImagePlus className="w-10 h-10 text-white/15 mb-2" />
        <p className="text-sm text-white/40 font-medium">Click to upload or drag and drop</p>
        <p className="text-[11px] text-white/20 mt-1">JPG, PNG, WebP — Max 5MB each — Up to 6 images</p>
      </div>
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {images.map((img: { file: File; preview: string }, i: number) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
              <img src={img.preview} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button onClick={(e) => { e.stopPropagation(); removeImage(i); }} className="p-1.5 rounded-full bg-red-500/80 text-white hover:bg-red-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {i === 0 && (
                <span className="absolute bottom-1 left-1 text-[9px] px-1.5 py-0.5 rounded bg-nx-violet/80 text-white font-medium">Primary</span>
              )}
            </div>
          ))}
        </div>
      )}
      <p className="text-[11px] text-white/25">First image is the primary product photo.</p>
    </div>
  );
}

export default function SellerEditProduct({ freelanceMode = false }: { freelanceMode?: boolean }) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const listing = useQuery(api.listings.getListing, id ? { listingId: id as any } : "skip");
  const updateListing = useMutation(api.listings.updateListing);
  // Saving a listing can also complete the seller's business-location
  // registration step when the profile doesn't have one yet.
  const updateProfile = useMutation(api.users.updateProfile);
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Freelance services are edited in the standalone freelance shell (no seller
  // store chrome) and navigate back to the freelance services page.
  const isFreelance = freelanceMode === true;
  const backTarget = isFreelance ? "/freelance/services" : "/seller/products";

  const [form, setForm] = useState({
    category: "",
    subcategory: "",
    title: "",
    description: "",
    condition: "Brand New",
    brand: "",
    model: "",
    quantity: "1",
    sku: "",
    negotiable: false,
    county: "",
    town: "",
    price: "",
    originalPrice: "",
    attributes: {} as Record<string, string>,
    images: [] as { file: File; preview: string }[],
    existingImages: [] as string[],
  });

  // Initialize form from listing data
  if (listing && !initialized) {
    setInitialized(true);
    setForm({
      category: listing.category || "",
      subcategory: listing.subcategory || "",
      title: listing.title || "",
      description: listing.description || "",
      condition: listing.condition || "Brand New",
      brand: "",
      model: "",
      quantity: "1",
      sku: "",
      negotiable: listing.negotiable || false,
      county: listing.originCounty || "",
      town: listing.originTown || "",
      price: String(listing.price || ""),
      originalPrice: "",
      attributes: listing.attributes || {},
      images: [],
      existingImages: listing.images || [],
    });
  }

  const update = (key: string, value: any) => setForm({ ...form, [key]: value });

  const selectedCategory = CATEGORIES.find(c => c.slug === form.category);
  const selectedSubcategory = selectedCategory?.subcategories.find(s => s.slug === form.subcategory);
  const specTemplate = SPECS_TEMPLATES[form.subcategory] || [];

  const handleSave = async () => {
    if (!form.title || !form.price || !form.category || !form.county || !form.town || !id) return;
    // Same light anti-spam bar as publishing (non-empty description).
    const descLen = (form.description || "").replace(/\s+/g, " ").trim().length;
    if (descLen < MIN_DESCRIPTION_CHARS) {
      toast.error(`Please add a short description (at least ${MIN_DESCRIPTION_CHARS} characters).`);
      setStep(1);
      return;
    }
    setSaving(true);
    try {
      await updateListing({
        listingId: id as any,
        title: form.title,
        description: form.description,
        price: Number(form.price),
        condition: form.condition,
        attributes: Object.keys(form.attributes).length > 0 ? form.attributes : undefined,
      });
      // Best-effort: if the seller profile is missing either half of its
      // business location, this listing's location completes that step too
      // (a county-only profile used to stay stuck).
      if ((!(user as any)?.county || !(user as any)?.town) && form.county && form.town) {
        try {
          await updateProfile({ county: form.county, town: form.town });
        } catch (err) {
          console.error("[profile] business location sync failed:", err);
        }
      }
      navigate(backTarget);
    } catch (err) {
      console.error("Failed to update:", err);
      toast.error("Failed to update product. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const getPreviewSpecs = () => {
    const specs: string[] = [];
    for (const [, val] of Object.entries(form.attributes)) {
      if (val) specs.push(val);
    }
    return specs;
  };

  if (listing === undefined) {
    return (
      <SellerLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-nx-violet animate-spin" />
        </div>
      </SellerLayout>
    );
  }

  if (!listing) {
    return (
      <SellerLayout>
        <div className="text-center py-20">
          <Package className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/30">Product not found.</p>
          <button onClick={() => navigate(backTarget)} className="mt-4 px-5 py-2.5 rounded-lg bg-nx-violet text-white text-sm font-medium">
            Back to {isFreelance ? "Services" : "Products"}
          </button>
        </div>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(backTarget)} className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-white/40 hover:text-white/70 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{isFreelance ? "Edit Service" : "Edit Product"}</h1>
            <p className="text-sm text-white/40 mt-0.5">Update your listing details</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
              <button onClick={() => setStep(i)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${i === step ? "bg-nx-violet/10 text-nx-violet font-medium" : i < step ? "text-emerald-400" : "text-white/25"}`}>
                {i < step ? <Check className="w-3 h-3" /> : <span className="w-4 h-4 rounded-full bg-white/5 flex items-center justify-center text-[9px]">{i + 1}</span>}
                {s}
              </button>
              {i < steps.length - 1 && <ChevronRight className="w-3 h-3 text-white/10 mx-1 shrink-0" />}
            </div>
          ))}
        </div>

        <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5">
          {/* STEP 0: Category Selection */}
          {step === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Product Category</h3>
              <p className="text-xs text-white/30">Current: {selectedCategory?.name || "Not set"}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CATEGORIES.map(cat => (
                  <button key={cat.slug} onClick={() => { update("category", cat.slug); update("subcategory", ""); update("attributes", {}); }}
                    className={`p-4 rounded-xl border text-left transition-all ${form.category === cat.slug ? "border-nx-violet/30 bg-nx-violet/5" : "border-white/5 bg-white/[0.02] hover:border-white/10"}`}>
                    <p className="text-2xl mb-1">{cat.icon}</p>
                    <p className="text-sm font-medium text-white">{cat.name}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Subcategory selection */}
          {step === 1 && selectedCategory && !form.subcategory && selectedCategory.subcategories.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Select Subcategory</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {selectedCategory.subcategories.map(sub => (
                  <button key={sub.slug} onClick={() => update("subcategory", sub.slug)}
                    className="p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:border-white/10 text-left transition-all">
                    <p className="text-sm font-medium text-white">{sub.name}</p>
                  </button>
                ))}
              </div>
              <button onClick={() => { update("subcategory", "general"); setStep(2); }}
                className="text-xs text-nx-violet hover:text-nx-violet/80">Skip — treat as general {selectedCategory.name}</button>
            </div>
          )}

          {/* STEP 1/2: Product Details */}
          {step === 1 || (step === 2 && form.subcategory) ? (
            step === 1 && form.subcategory ? null : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Product Details</h3>
                <div><label className="text-xs text-white/40 mb-1.5 block">Product Title *</label>
                  <input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="e.g. Toyota Harrier 2021 Automatic"
                    className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/50 focus:outline-none" /></div>
                <div><label className="text-xs text-white/40 mb-1.5 block">Description *</label>
                  <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={5} placeholder="Describe your product..."
                    className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/50 focus:outline-none resize-none" />
                  {(() => {
                    const len = (form.description || "").replace(/\s+/g, " ").trim().length;
                    return len < MIN_DESCRIPTION_CHARS ? (
                      <p className={`mt-1.5 text-[11px] ${len > 0 ? "text-amber-400" : "text-white/25"}`}>Optional — add a few words so buyers know what they get</p>
                    ) : (
                      <p className="mt-1.5 text-[11px] text-emerald-400">✓ Looks good</p>
                    );
                  })()}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-white/40 mb-1.5 block">Condition *</label>
                    <select value={form.condition} onChange={(e) => update("condition", e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white focus:border-nx-violet/50 focus:outline-none">
                      {["Brand New", "Used - Like New", "Used - Good", "Used - Fair", "Refurbished"].map(c => <option key={c}>{c}</option>)}
                    </select></div>
                  <div><label className="text-xs text-white/40 mb-1.5 block">Quantity</label>
                    <input type="number" value={form.quantity} onChange={(e) => update("quantity", e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white focus:border-nx-violet/50 focus:outline-none" /></div>
                </div>
              </div>
            )
          ) : null}

          {/* STEP 2: Category-Specific Specifications */}
          {step === 2 && form.subcategory && specTemplate.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Specifications</h3>
              <p className="text-xs text-white/30">
                {selectedSubcategory ? `${selectedSubcategory.name}` : "Category"} — add relevant details
              </p>
              {specTemplate.map(spec => (
                <div key={spec.label}>
                  <label className="text-xs text-white/40 mb-1.5 block">{spec.label}</label>
                  {spec.type === "select" && spec.options ? (
                    <select
                      value={form.attributes[spec.label] || ""}
                      onChange={(e) => update("attributes", { ...form.attributes, [spec.label]: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white focus:border-nx-violet/50 focus:outline-none"
                    >
                      <option value="">Select {spec.label}</option>
                      {spec.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <input
                      value={form.attributes[spec.label] || ""}
                      onChange={(e) => update("attributes", { ...form.attributes, [spec.label]: e.target.value })}
                      placeholder={`Enter ${spec.label}`}
                      className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/50 focus:outline-none"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {step === 2 && form.subcategory && specTemplate.length === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Specifications</h3>
              <p className="text-xs text-white/30">No specific fields required for this category. Add details in the description.</p>
            </div>
          )}

          {/* STEP 3: Images */}
          {step === 3 && (
            <div className="space-y-4">
              {form.existingImages.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-white/60 mb-2">Current Images</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
                    {form.existingImages.map((url, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                        <img src={url} alt={`Existing ${i + 1}`} className="w-full h-full object-cover" />
                        {i === 0 && <span className="absolute bottom-1 left-1 text-[9px] px-1.5 py-0.5 rounded bg-nx-violet/80 text-white font-medium">Primary</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <ImageUploadStep images={form.images} setImages={(imgs) => update("images", imgs)} />
            </div>
          )}

          {/* STEP 4: Location */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Product Location</h3>
              <p className="text-xs text-white/30">Where is this product physically located? This is used for delivery calculation.</p>
              <div><label className="text-xs text-white/40 mb-1.5 block">County *</label>
                <input value={form.county} onChange={(e) => update("county", e.target.value)} placeholder="e.g. Nairobi" className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/50 focus:outline-none" /></div>
              <div><label className="text-xs text-white/40 mb-1.5 block">Town / Area *</label>
                <input value={form.town} onChange={(e) => update("town", e.target.value)} placeholder="e.g. Westlands" className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/50 focus:outline-none" /></div>
              <div className="p-3 rounded-lg bg-nx-violet/5 border border-nx-violet/10">
                <p className="text-xs text-white/40">🚚 <span className="text-nx-violet font-medium">Delivery is handled by Nexora Market.</span> You only need to provide the product location.</p>
              </div>
            </div>
          )}

          {/* STEP 5: Pricing */}
          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Pricing</h3>
              <div><label className="text-xs text-white/40 mb-1.5 block">Price (KES) *</label>
                <input type="number" value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="0" className="w-full px-3 py-3 rounded-lg bg-white/[0.03] border border-white/10 text-xl text-white font-bold placeholder:text-white/20 focus:border-nx-violet/50 focus:outline-none" /></div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.negotiable} onChange={(e) => update("negotiable", e.target.checked)} className="w-4 h-4 rounded border-white/10 bg-white/[0.03] text-nx-violet" />
                <span className="text-sm text-white/60">Price is negotiable</span>
              </label>
            </div>
          )}

          {/* STEP 6: Preview */}
          {step === 6 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Preview & Save</h3>
              <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-start gap-4">
                  <div className="w-24 h-24 rounded-lg bg-white/[0.03] flex items-center justify-center shrink-0">
                    {form.existingImages.length > 0 ? (
                      <img src={form.existingImages[0]} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                    ) : form.images.length > 0 ? (
                      <img src={form.images[0].preview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <Package className="w-8 h-8 text-white/10" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white">{form.title || "Product Title"}</h4>
                    <p className="text-xl font-bold text-white mt-1">KES {Number(form.price || 0).toLocaleString()}</p>
                    <p className="text-xs text-white/30 mt-2">{form.description || "No description"}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-400/10 text-emerald-400">{form.condition}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/40">{selectedCategory?.name || "No category"}</span>
                      {form.subcategory && <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/40">{selectedSubcategory?.name || form.subcategory}</span>}
                      {form.negotiable && <span className="text-[10px] px-2 py-0.5 rounded bg-amber-400/10 text-amber-400">Negotiable</span>}
                    </div>
                    {getPreviewSpecs().length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {getPreviewSpecs().map((spec, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-nx-violet/10 text-nx-violet">{spec}</span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-white/30 mt-2">📍 {form.county}, {form.town}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}
            className="px-4 py-2 rounded-lg text-sm text-white/40 hover:text-white/60 disabled:opacity-30 transition-colors flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          {step < steps.length - 1 ? (
            <button onClick={() => setStep(step + 1)}
              className="px-6 py-2.5 rounded-lg bg-nx-violet text-white text-sm font-medium hover:bg-nx-violet/80 transition-colors flex items-center gap-1">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSave} disabled={saving}
              className="px-6 py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-500/80 transition-colors flex items-center gap-2 disabled:opacity-50">
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : (
                <><Check className="w-4 h-4" /> Save Changes</>
              )}
            </button>
          )}
        </div>
      </div>
    </SellerLayout>
  );
}
