import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import SellerLayout from "./SellerLayout";
import { CATEGORIES } from "@/lib/categories";
import { ChevronRight, ChevronLeft, Upload, Check, Package, X, ImagePlus } from "lucide-react";

const steps = ["Category", "Details", "Specifications", "Images", "Location", "Pricing", "Preview"];

function ImageUploadStep({ form, update }: { form: any; update: (key: string, val: any) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const newImages: { file: File; preview: string }[] = [];
    for (let i = 0; i < files.length && form.images.length + newImages.length < 6; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 5 * 1024 * 1024) continue;
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

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Product Images</h3>

      {/* Upload area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative aspect-[2/1] rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
          dragOver ? "border-nx-violet bg-nx-violet/5" : "border-white/10 hover:border-nx-violet/30 hover:bg-white/[0.01]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <ImagePlus className="w-10 h-10 text-white/15 mb-2" />
        <p className="text-sm text-white/40 font-medium">Click to upload or drag and drop</p>
        <p className="text-[11px] text-white/20 mt-1">JPG, PNG, WebP — Max 5MB each — Up to 6 images</p>
      </div>

      {/* Image previews */}
      {form.images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {form.images.map((img: { file: File; preview: string }, i: number) => (
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

      <p className="text-[11px] text-white/25">First image is the primary product photo. You can reorder by removing and re-uploading.</p>
    </div>
  );
}

export default function SellerAddProduct() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    category: "", subcategory: "", title: "", description: "", condition: "Brand New",
    brand: "", model: "", quantity: "1", sku: "", negotiable: false,
    county: "", town: "",
    price: "", originalPrice: "",
    specs: {} as Record<string, string>,
    images: [] as { file: File; preview: string }[],
  });

  const update = (key: string, value: string | boolean | Record<string, string>) => setForm({ ...form, [key]: value });

  return (
    <SellerLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Add Product</h1>
          <p className="text-sm text-white/40 mt-1">List a new product on Nexora Market</p>
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
          {/* Step 0: Category */}
          {step === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Select Category</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CATEGORIES.map(cat => (
                  <button key={cat.slug} onClick={() => { update("category", cat.slug); setStep(1); }}
                    className={`p-4 rounded-xl border text-left transition-all ${form.category === cat.slug ? "border-nx-violet/30 bg-nx-violet/5" : "border-white/5 bg-white/[0.02] hover:border-white/10"}`}>
                    <span className="text-xl mb-2 block">{cat.icon}</span>
                    <p className="text-sm font-medium text-white">{cat.name}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">{cat.subcategories.length} subcategories</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Details */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Product Details</h3>
              <div><label className="text-xs text-white/40 mb-1.5 block">Product Title *</label>
                <input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="e.g. HP EliteBook 840 G3"
                  className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/50 focus:outline-none" /></div>
              <div><label className="text-xs text-white/40 mb-1.5 block">Description *</label>
                <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={4} placeholder="Describe your product..."
                  className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/50 focus:outline-none resize-none" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-white/40 mb-1.5 block">Condition *</label>
                  <select value={form.condition} onChange={(e) => update("condition", e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white focus:border-nx-violet/50 focus:outline-none">
                    {["Brand New", "Used - Like New", "Used - Good", "Used - Fair", "Refurbished"].map(c => <option key={c}>{c}</option>)}
                  </select></div>
                <div><label className="text-xs text-white/40 mb-1.5 block">Quantity</label>
                  <input type="number" value={form.quantity} onChange={(e) => update("quantity", e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white focus:border-nx-violet/50 focus:outline-none" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-white/40 mb-1.5 block">Brand</label>
                  <input value={form.brand} onChange={(e) => update("brand", e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/50 focus:outline-none" /></div>
                <div><label className="text-xs text-white/40 mb-1.5 block">Model</label>
                  <input value={form.model} onChange={(e) => update("model", e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/50 focus:outline-none" /></div>
              </div>
            </div>
          )}

          {/* Step 2: Specifications */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Specifications</h3>
              <p className="text-xs text-white/30">Add relevant specifications for your product category</p>
              {["Processor", "RAM", "Storage", "Screen Size", "Operating System", "GPU", "Battery"].map(key => (
                <div key={key}><label className="text-xs text-white/40 mb-1.5 block">{key}</label>
                  <input value={form.specs[key] || ""} onChange={(e) => update("specs", { ...form.specs, [key]: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/50 focus:outline-none" />
                </div>
              ))}
            </div>
          )}

          {/* Step 3: Images */}
          {step === 3 && (
            <ImageUploadStep form={form} update={update} />
          )}

          {/* Step 4: Location */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Product Location</h3>
              <p className="text-xs text-white/30">Where is this product physically located? This is used for delivery calculation.</p>
              <div><label className="text-xs text-white/40 mb-1.5 block">County *</label>
                <input value={form.county} onChange={(e) => update("county", e.target.value)} placeholder="e.g. Nairobi" className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/50 focus:outline-none" /></div>
              <div><label className="text-xs text-white/40 mb-1.5 block">Town / Area *</label>
                <input value={form.town} onChange={(e) => update("town", e.target.value)} placeholder="e.g. Westlands" className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/50 focus:outline-none" /></div>
              <div className="p-3 rounded-lg bg-nx-violet/5 border border-nx-violet/10">
                <p className="text-xs text-white/40">🚚 <span className="text-nx-violet font-medium">Delivery is handled by Nexora Market.</span> You only need to provide the product location. Nexora Market will calculate delivery fees and handle logistics.</p>
              </div>
            </div>
          )}

          {/* Step 5: Pricing */}
          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Pricing</h3>
              <div><label className="text-xs text-white/40 mb-1.5 block">Price (KSh) *</label>
                <input type="number" value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="0" className="w-full px-3 py-3 rounded-lg bg-white/[0.03] border border-white/10 text-xl text-white font-bold placeholder:text-white/20 focus:border-nx-violet/50 focus:outline-none" /></div>
              <div><label className="text-xs text-white/40 mb-1.5 block">Original Price (KSh) — for discount display</label>
                <input type="number" value={form.originalPrice} onChange={(e) => update("originalPrice", e.target.value)} placeholder="Optional" className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/50 focus:outline-none" /></div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.negotiable} onChange={(e) => update("negotiable", e.target.checked)} className="w-4 h-4 rounded border-white/10 bg-white/[0.03] text-nx-violet" />
                <span className="text-sm text-white/60">Price is negotiable</span>
              </label>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-1.5">
                <div className="flex justify-between text-xs"><span className="text-white/40">Platform Fee (5%)</span><span className="text-white/60">KSh {Math.round(Number(form.price || 0) * 0.05).toLocaleString()}</span></div>
                <div className="flex justify-between text-xs"><span className="text-white/40">Your Earnings</span><span className="text-emerald-400 font-bold">KSh {Math.round(Number(form.price || 0) * 0.95).toLocaleString()}</span></div>
              </div>
            </div>
          )}

          {/* Step 6: Preview */}
          {step === 6 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Preview</h3>
              <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-start gap-4">
                  <div className="w-24 h-24 rounded-lg bg-white/[0.03] flex items-center justify-center shrink-0"><Package className="w-8 h-8 text-white/10" /></div>
                  <div>
                    <h4 className="text-lg font-semibold text-white">{form.title || "Product Title"}</h4>
                    <p className="text-xl font-bold text-white mt-1">KSh {Number(form.price || 0).toLocaleString()}</p>
                    <p className="text-xs text-white/30 mt-2">{form.description || "No description"}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-400/10 text-emerald-400">{form.condition}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/40">{form.category || "No category"}</span>
                      {form.negotiable && <span className="text-[10px] px-2 py-0.5 rounded bg-amber-400/10 text-amber-400">Negotiable</span>}
                    </div>
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
            <button onClick={() => navigate("/seller/products")}
              className="px-6 py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-500/80 transition-colors flex items-center gap-2">
              <Check className="w-4 h-4" /> Publish Product
            </button>
          )}
        </div>
      </div>
    </SellerLayout>
  );
}
