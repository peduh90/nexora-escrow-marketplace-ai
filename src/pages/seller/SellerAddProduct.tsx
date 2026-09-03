import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import SellerLayout from "./SellerLayout";
import { CATEGORIES as FALLBACK_CATEGORIES, SPECS_TEMPLATES } from "@/lib/categories";
import { ChevronRight, ChevronLeft, Check, Package, X, ImagePlus, Loader2, ArrowLeft } from "lucide-react";

const TOTAL_STEPS = 5;

function ImageUploadStep({ form, update }: { form: any; update: (key: string, val: any) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const newImages: { file: File; preview: string }[] = [];
    for (let i = 0; i < files.length && form.images.length + newImages.length < 6; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 10 * 1024 * 1024) continue;
      newImages.push({ file, preview: URL.createObjectURL(file) });
    }
    if (newImages.length > 0) {
      update("images", [...form.images, ...newImages]);
    }
  }, [form.images, update]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const removeImage = (index: number) => {
    const updated = [...form.images];
    URL.revokeObjectURL(updated[index].preview);
    updated.splice(index, 1);
    update("images", updated);
  };

  const reorderImage = (fromIdx: number, toIdx: number) => {
    const updated = [...form.images];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    update("images", updated);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Product Images</h3>
      <p className="text-xs text-white/30">Upload 1-6 images. First image will be the cover photo.</p>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative aspect-[2/1] rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
          dragOver ? "border-nx-cyan bg-nx-cyan/5" : "border-white/10 hover:border-nx-cyan/30 hover:bg-white/[0.01]"
        }`}
      >
        <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        <ImagePlus className="w-10 h-10 text-white/15 mb-2" />
        <p className="text-sm text-white/40 font-medium">Click to upload or drag and drop</p>
        <p className="text-[11px] text-white/20 mt-1">JPG, PNG, WebP — Max 10MB each — Up to 6 images</p>
      </div>
      {form.images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {form.images.map((img: { file: File; preview: string }, i: number) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
              <img src={img.preview} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {i > 0 && (
                  <button onClick={(e) => { e.stopPropagation(); reorderImage(i, i - 1); }}
                    className="p-1 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors text-[10px]">◀</button>
                )}
                <button onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                  className="p-1.5 rounded-full bg-red-500/80 text-white hover:bg-red-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
                {i < form.images.length - 1 && (
                  <button onClick={(e) => { e.stopPropagation(); reorderImage(i, i + 1); }}
                    className="p-1 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors text-[10px]">▶</button>
                )}
              </div>
              {i === 0 && (
                <span className="absolute bottom-1 left-1 text-[9px] px-1.5 py-0.5 rounded bg-nx-cyan/80 text-black font-medium">Cover</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SellerAddProduct() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createListing = useMutation(api.listings.createListing);
  const generateUploadUrl = useMutation(api.listings.generateUploadUrl);
  const [step, setStep] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [form, setForm] = useState({
    category: "",
    subcategory: "",
    title: "",
    description: "",
    condition: "Brand New",
    price: "",
    originalPrice: "",
    negotiable: false,
    county: "",
    town: "",
    attributes: {} as Record<string, string>,
    images: [] as { file: File; preview: string }[],
  });

  const dbCategories = useQuery(api.adminCategories.getActiveCategories);

  // Use database categories if available, fall back to hardcoded
  const categories = dbCategories && dbCategories.length > 0
    ? dbCategories.map(c => ({
        name: c.name,
        slug: c.slug,
        icon: c.icon,
        image: c.image,
        description: c.description,
        subcategories: c.subcategories.map(s => ({ name: s, slug: s.toLowerCase().replace(/[^a-z0-9]+/g, "-") })),
      }))
    : FALLBACK_CATEGORIES;

  const update = (key: string, value: any) => setForm({ ...form, [key]: value });

  const selectedCategory = categories.find(c => c.slug === form.category);
  const selectedSubcategory = selectedCategory?.subcategories.find(s => s.slug === form.subcategory);
  const specTemplate = SPECS_TEMPLATES[form.subcategory] || [];

  const handlePublish = async () => {
    if (!form.title || !form.price || !form.category || !form.county || !form.town) return;
    setPublishing(true);
    try {
      // Upload images to Convex storage
      const imageUrls: string[] = [];
      for (const img of form.images) {
        const uploadUrl = await generateUploadUrl();
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": img.file.type },
          body: img.file,
        });
        const { storageId } = await response.json();
        imageUrls.push(storageId);
      }

      await createListing({
        title: form.title,
        description: form.description || `${form.title} - ${form.condition}`,
        price: Number(form.price),
        currency: "KES",
        category: form.category,
        subcategory: form.subcategory || undefined,
        images: imageUrls,
        transportAvailable: true,
        originCounty: form.county,
        originTown: form.town,
        escrowProtection: true,
        condition: form.condition,
        attributes: Object.keys(form.attributes).length > 0 ? form.attributes : undefined,
        negotiable: form.negotiable,
        verified: user?.kycStatus === "verified",
        sellerName: user?.businessName || user?.name || "Seller",
        sellerReputation: user?.reputation || 0,
        sellerVerified: user?.kycStatus === "verified",
      });
      navigate("/seller/products");
    } catch (err) {
      console.error("Failed to publish:", err);
      alert("Failed to publish product. Please try again.");
    } finally {
      setPublishing(false);
    }
  };

  const getPreviewSpecs = () => {
    const specs: string[] = [];
    for (const [, val] of Object.entries(form.attributes)) {
      if (val) specs.push(val);
    }
    return specs;
  };

  // Determine current logical step name
  const stepLabel = step === 0 ? "Category" : step === 1 ? "Details" : step === 2 ? "Specifications" : step === 3 ? "Images" : step === 4 ? "Location & Pricing" : "Preview";

  return (
    <SellerLayout>
      <div className="max-w-4xl mx-auto">
        {/* Top bar with back, logo, step indicator */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => step > 0 ? setStep(step - 1) : navigate(-1)}
              className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-nx-cyan/10 flex items-center justify-center">
                <Package className="w-4 h-4 text-nx-cyan" />
              </div>
              <span className="text-sm font-bold text-white">NEXORA<span className="text-nx-cyan">.</span></span>
            </div>
          </div>
          <span className="text-xs text-white/40">Step {step + 1} of {TOTAL_STEPS}</span>
        </div>

        {/* Step 0: Category Grid — matching screenshot layout */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-white mb-1">What are you selling?</h2>
              <p className="text-sm text-white/30">Choose the category that best fits your product</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map(cat => (
                <button key={cat.slug}
                  onClick={() => { update("category", cat.slug); update("subcategory", ""); update("attributes", {}); setStep(1); }}
                  className={`p-4 rounded-xl border text-left transition-all hover:scale-[1.02] ${
                    form.category === cat.slug
                      ? "border-nx-cyan/40 bg-nx-cyan/5 shadow-[0_0_20px_rgba(6,182,212,0.1)]"
                      : "border-white/[0.06] bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
                  }`}
                >
                  <p className="text-2xl mb-2">{cat.icon}</p>
                  <p className="text-sm font-semibold text-white mb-0.5">{cat.name}</p>
                  <p className="text-[11px] text-white/30 leading-relaxed">{cat.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Subcategory Selection */}
        {step === 1 && selectedCategory && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-white mb-1">Select Subcategory</h2>
              <p className="text-sm text-white/30">Choose the specific type of {selectedCategory.name}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {selectedCategory.subcategories.map(sub => (
                <button key={sub.slug}
                  onClick={() => { update("subcategory", sub.slug); setStep(2); }}
                  className={`p-4 rounded-xl border text-left transition-all hover:scale-[1.02] ${
                    form.subcategory === sub.slug
                      ? "border-nx-cyan/40 bg-nx-cyan/5"
                      : "border-white/[0.06] bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
                  }`}
                >
                  <p className="text-sm font-medium text-white">{sub.name}</p>
                </button>
              ))}
            </div>
            <button onClick={() => { update("subcategory", "general"); setStep(2); }}
              className="w-full text-center text-xs text-white/30 hover:text-white/50 py-2 transition-colors">
              Skip — treat as general {selectedCategory.name} product
            </button>
          </div>
        )}

        {/* Step 2: Product Details + Specs */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-white mb-1">Product Details</h2>
              <p className="text-sm text-white/30">
                {selectedSubcategory ? `${selectedCategory?.name} → ${selectedSubcategory.name}` : "Add details about your product"}
              </p>
            </div>

            {/* Core fields */}
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/40 mb-1.5 block font-medium">Product Title *</label>
                <input value={form.title} onChange={(e) => update("title", e.target.value)}
                  placeholder="e.g. Toyota Harrier 2021 Automatic, Samsung Galaxy S24 Ultra"
                  className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-cyan/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block font-medium">Description *</label>
                <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={4}
                  placeholder="Describe your product in detail — condition, features, what's included..."
                  className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-cyan/50 focus:outline-none resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block font-medium">Condition *</label>
                  <select value={form.condition} onChange={(e) => update("condition", e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white focus:border-nx-cyan/50 focus:outline-none">
                    {["Brand New", "Used - Like New", "Used - Good", "Used - Fair", "Refurbished"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block font-medium">Negotiable</label>
                  <button onClick={() => update("negotiable", !form.negotiable)}
                    className={`w-full px-3 py-2.5 rounded-lg border text-sm text-left transition-colors ${
                      form.negotiable ? "border-nx-cyan/30 bg-nx-cyan/5 text-nx-cyan" : "border-white/10 bg-white/[0.03] text-white/40"
                    }`}>
                    {form.negotiable ? "Yes — Price negotiable" : "No — Fixed price"}
                  </button>
                </div>
              </div>
            </div>

            {/* Category-specific specs */}
            {specTemplate.length > 0 && (
              <div className="pt-4 border-t border-white/5 space-y-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-nx-cyan/10 flex items-center justify-center text-nx-cyan text-[10px] font-bold">S</span>
                  {selectedSubcategory?.name || "Category"} Specifications
                </h3>
                {specTemplate.map(spec => (
                  <div key={spec.label}>
                    <label className="text-xs text-white/40 mb-1.5 block">{spec.label}</label>
                    {spec.type === "select" && spec.options ? (
                      <select
                        value={form.attributes[spec.label] || ""}
                        onChange={(e) => update("attributes", { ...form.attributes, [spec.label]: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white focus:border-nx-cyan/50 focus:outline-none"
                      >
                        <option value="">Select {spec.label}</option>
                        {spec.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      <input
                        value={form.attributes[spec.label] || ""}
                        onChange={(e) => update("attributes", { ...form.attributes, [spec.label]: e.target.value })}
                        placeholder={`Enter ${spec.label}`}
                        className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-cyan/50 focus:outline-none"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Images */}
        {step === 3 && <ImageUploadStep form={form} update={update} />}

        {/* Step 4: Location & Pricing */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-white mb-1">Location & Pricing</h2>
              <p className="text-sm text-white/30">Where is the product and how much?</p>
            </div>

            {/* Location */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white">📍 Product Location</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">County *</label>
                  <input value={form.county} onChange={(e) => update("county", e.target.value)} placeholder="e.g. Nairobi"
                    className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-cyan/50 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Town / Area *</label>
                  <input value={form.town} onChange={(e) => update("town", e.target.value)} placeholder="e.g. Westlands"
                    className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-cyan/50 focus:outline-none" />
                </div>
              </div>
              <div className="p-3 rounded-lg bg-nx-cyan/5 border border-nx-cyan/10">
                <p className="text-xs text-white/50">🚚 <span className="text-nx-cyan font-medium">Delivery is handled by Nexora Market.</span> You only need to provide the product location.</p>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <h3 className="text-sm font-semibold text-white">💰 Pricing</h3>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Price (KES) *</label>
                <input type="number" value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="0"
                  className="w-full px-3 py-3 rounded-lg bg-white/[0.03] border border-white/10 text-xl text-white font-bold placeholder:text-white/20 focus:border-nx-cyan/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Original Price (KES) — optional, for discount display</label>
                <input type="number" value={form.originalPrice} onChange={(e) => update("originalPrice", e.target.value)} placeholder="Optional"
                  className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-cyan/50 focus:outline-none" />
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Platform Fee (5%)</span>
                  <span className="text-white/60">KES {Math.round(Number(form.price || 0) * 0.05).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Your Earnings</span>
                  <span className="text-emerald-400 font-bold">KES {Math.round(Number(form.price || 0) * 0.95).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
          <button onClick={() => step > 0 ? setStep(step - 1) : navigate(-1)}
            className="px-4 py-2.5 rounded-xl text-sm text-white/40 hover:text-white/60 transition-colors flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          {step < TOTAL_STEPS - 1 ? (
            <button onClick={() => setStep(step + 1)}
              className="px-6 py-2.5 rounded-xl bg-nx-cyan text-black text-sm font-semibold hover:bg-nx-cyan/80 transition-colors flex items-center gap-1">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handlePublish} disabled={publishing || !form.title || !form.price}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-500/80 transition-colors flex items-center gap-2 disabled:opacity-50">
              {publishing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Publishing...</>
              ) : (
                <><Check className="w-4 h-4" /> Publish Product</>
              )}
            </button>
          )}
        </div>
      </div>
    </SellerLayout>
  );
}
