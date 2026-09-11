import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import SellerLayout from "./SellerLayout";
import { CATEGORIES as FALLBACK_CATEGORIES, SPECS_TEMPLATES } from "@/lib/categories";
import { CATEGORY_BANNERS } from "@/lib/category-images";
import { FREELANCE_CATEGORIES, getFreelanceCategory } from "@/lib/freelance-marketplace";
import { ChevronRight, ChevronLeft, Check, Package, X, ImagePlus, Loader2, ArrowLeft, AlertCircle } from "lucide-react";

const KENYA_COUNTIES: Record<string, string[]> = {
  "Nairobi": ["Westlands", "Kilimani", "Karen", "CBD", "Industrial Area", "South B", "South C", "Langata", "Ruiru", "Roysambu", "Kasarani", "Embakasi", "Mathare", "Gigiri", "Kahawa", "Juja", "Thika"],
  "Coast": ["Mombasa", "Likoni", "Nyali", "Kilifi", "Malindi", "Watamu", "Diani", "Kwale", "Lamu", "Takaungu"],
  "Central": ["Nyeri", "Murang'a", "Kiambu", "Kirinyaga", "Embu", "Makuyu", "Limuru", "Kahiga", "Othaya", "Mwea"],
  "Eastern": ["Meru", "Embu", "Isiolo", "Marsabit", "Meru Town", "Mbooni", "Chuka", "Tigoni", "Kibwezi", "Mackinnon"],
  "Rift Valley": ["Eldoret", "Nakuru", "Kericho", "Kapsabet", "Iten", "Kitale", "Bomet", "Nandi", "Uasin Gishu", "Trans Nzoia", "Laikipia"],
  "Western": ["Kakamega", "Busia", "Bungoma", "Kwale", "Bondo", "Siaya", "Migori", "Nyatike"],
  "Nyanza": ["Kisumu", "Siaya", "Kisii", "Nyamira", "Homa Bay", "Migori", "Rongo", "Awendo", "Uriri"],
  "North Eastern": ["Garissa", "Wajir", "Mandera", "Masalani", "Dadaab", "Wajir Town", "Fafi"],
};

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
        className={`relative aspect-[2/1] rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${dragOver ? "border-nx-cyan bg-nx-cyan/5" : "border-white/10 hover:border-nx-cyan/30 hover:bg-white/[0.01]"}`}
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

const TOTAL_STEPS = 5;

/** Minimal top bar for the standalone freelance publish flow (no seller shell). */
function FreelancePublishHeader({ onBack, step }: { onBack: () => void; step: number }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack}
          className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-nx-violet/10 flex items-center justify-center">
            <Package className="w-4 h-4 text-nx-violet" />
          </div>
          <span className="text-sm font-bold text-white">NEXORA<span className="text-nx-violet">.</span></span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-nx-violet/10 text-nx-violet font-medium hidden sm:inline">FREELANCE</span>
        </div>
      </div>
      <span className="text-xs text-white/40">Step {step + 1} of {TOTAL_STEPS}</span>
    </div>
  );
}

export default function SellerAddProduct({ freelanceMode: freelanceModeProp = false }: { freelanceMode?: boolean }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  // When mounted under /freelance/publish the marketplace is LOCKED to
  // "freelance" — a Writer/Freelancer never publishes physical products and
  // never needs a store.
  const forcedFreelance = freelanceModeProp === true;
  const createListing = useMutation(api.listings.createListing);
  const generateUploadUrl = useMutation(api.listings.generateUploadUrl);
  const [step, setStep] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    // Which marketplace the listing is published to. Decided automatically by
    // the chosen category — Freelance Marketplace categories (AI tools,
    // writing, design, development, marketing, bots, other services) place the
    // listing in the Freelance Marketplace; every other category publishes to
    // the Normal Marketplace. In freelance mode this is locked to "freelance".
    marketplace: (forcedFreelance ? "freelance" : "") as "" | "product" | "freelance",
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
  const productCategories = dbCategories && dbCategories.length > 0
    ? dbCategories.map(c => ({
        name: c.name,
        slug: c.slug,
        icon: c.icon,
        image: c.image,
        description: c.description,
        subcategories: c.subcategories.map(s => ({ name: s, slug: s.toLowerCase().replace(/[^a-z0-9]+/g, "-") })),
      }))
    : FALLBACK_CATEGORIES;

  const isFreelanceMode = forcedFreelance || form.marketplace === "freelance";
  // Freelance Marketplace categories (digital services & tools) or the Normal
  // Marketplace product categories.
  const categories = isFreelanceMode ? FREELANCE_CATEGORIES : productCategories;
  const FREELANCE_SLUGS = new Set(FREELANCE_CATEGORIES.map(c => c.slug));

  const update = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (error) setError("");
  };

  // Choosing a category decides the marketplace automatically — the two
  // marketplaces can never mix.
  const pickCategory = (catSlug: string) => {
    const nextMarketplace = forcedFreelance
      ? "freelance"
      : FREELANCE_SLUGS.has(catSlug)
      ? "freelance"
      : "product";
    update("marketplace", nextMarketplace);
    update("category", catSlug);
    update("subcategory", "");
    update("attributes", {});
    setStep(1);
  };

  const selectMarketplace = (mp: "product" | "freelance") => {
    if (form.marketplace === mp) return;
    update("marketplace", mp);
    update("category", "");
    update("subcategory", "");
    update("attributes", {});
    setStep(0);
  };

  const selectedCategory = categories.find(c => c.slug === form.category);
  const selectedSubcategory = selectedCategory?.subcategories.find(s => s.slug === form.subcategory);
  const specTemplate = isFreelanceMode ? [] : (SPECS_TEMPLATES[form.subcategory] || []);
  const countyTowns = form.county ? KENYA_COUNTIES[form.county] : [];

  const handlePublish = async () => {
    setError("");
    if (!form.title.trim()) { setError("Please enter a listing title"); return; }
    if (!form.price || Number(form.price) <= 0) { setError("Please enter a valid price"); return; }
    if (!form.category) { setError("Please select a category"); return; }
    if (!isFreelanceMode) {
      if (!form.county.trim()) { setError("Please select a county"); return; }
      if (!form.town.trim()) { setError("Please select a town"); return; }
    }

    setPublishing(true);
    try {
      // Upload each image to Convex storage and collect storage keys
      const imageKeys: string[] = [];
      for (let i = 0; i < form.images.length; i++) {
        const img = form.images[i];
        const uploadUrl = await generateUploadUrl();
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": img.file.type },
          body: img.file,
        });
        if (!response.ok) {
          throw new Error(`Image upload failed for image ${i + 1}`);
        }
        // Convex's generateUploadUrl + POST returns the storage key in the response body
        const data = (await response.json()) as { storageKey?: string; storageId?: string; key?: string; url?: string };
        const key = data.storageKey || data.storageId || data.key;
        if (!key) throw new Error(`No storage key returned for image ${i + 1}`);
        imageKeys.push(key);
      }

      // Physical products ship from a county/town; digital freelance services
      // are delivered online, so their location is normalized.
      const attributes = { ...form.attributes };
      if (isFreelanceMode) {
        attributes["Marketplace"] = "Freelance";
      }

      await createListing({
        marketplace: isFreelanceMode ? "freelance" : "product",
        title: form.title,
        description: form.description || `${form.title} — ${isFreelanceMode ? "Freelance service" : form.condition}`,
        price: Number(form.price),
        currency: "KES",
        category: form.category,
        subcategory: form.subcategory || undefined,
        images: imageKeys,
        transportAvailable: !isFreelanceMode,
        originCounty: isFreelanceMode ? "Online" : form.county,
        originTown: isFreelanceMode ? "Digital" : form.town,
        escrowProtection: true,
        condition: isFreelanceMode ? "Service" : form.condition,
        attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
        negotiable: form.negotiable,
        verified: user?.kycStatus === "verified",
        sellerName: user?.businessName || user?.name || "Seller",
        sellerReputation: user?.reputation || 0,
        sellerVerified: user?.kycStatus === "verified",
      });

      // Return to the panel that owns the listing.
      navigate(forcedFreelance ? "/freelance/services" : "/seller");
    } catch (err: any) {
      setError(err.message || "Failed to publish. Please try again.");
    } finally {
      setPublishing(false);
    }
  };

  // Freelance providers are NOT Marketplace Sellers and never see the seller
  // shell — the publish flow renders standalone with its own header.
  if (forcedFreelance) {
    return (
      <div className="min-h-screen bg-[#05050A] px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <FreelancePublishHeader onBack={() => (step > 0 ? setStep(step - 1) : navigate("/freelance/services"))} step={step} />
          <PublishWizard
            step={step}
            setStep={setStep}
            form={form}
            update={update}
            pickCategory={pickCategory}
            selectMarketplace={selectMarketplace}
            isFreelanceMode={isFreelanceMode}
            selectedCategory={selectedCategory}
            selectedSubcategory={selectedSubcategory}
            specTemplate={specTemplate}
            countyTowns={countyTowns}
            publishing={publishing}
            error={error}
            onPublish={handlePublish}
            onBack={() => (step > 0 ? setStep(step - 1) : navigate("/freelance/services"))}
          />
        </div>
      </div>
    );
  }

  return (
    <SellerLayout>
      <div className="max-w-4xl mx-auto">
        <PublishWizard
          step={step}
          setStep={setStep}
          form={form}
          update={update}
          pickCategory={pickCategory}
          selectMarketplace={selectMarketplace}
          isFreelanceMode={isFreelanceMode}
          selectedCategory={selectedCategory}
          selectedSubcategory={selectedSubcategory}
          specTemplate={specTemplate}
          countyTowns={countyTowns}
          publishing={publishing}
          error={error}
          onPublish={handlePublish}
          onBack={() => (step > 0 ? setStep(step - 1) : navigate("/seller"))}
        />
      </div>
    </SellerLayout>
  );
}

/** The 5-step publish wizard body, shared by the seller shell and the standalone freelance flow. */
function PublishWizard({
  step,
  setStep,
  form,
  update,
  pickCategory,
  selectMarketplace,
  isFreelanceMode,
  selectedCategory,
  selectedSubcategory,
  specTemplate,
  countyTowns,
  publishing,
  error,
  onPublish,
  onBack,
}: {
  step: number;
  setStep: (s: number) => void;
  form: {
    marketplace: "" | "product" | "freelance";
    category: string;
    subcategory: string;
    title: string;
    description: string;
    condition: string;
    price: string;
    originalPrice: string;
    negotiable: boolean;
    county: string;
    town: string;
    attributes: Record<string, string>;
    images: { file: File; preview: string }[];
  };
  update: (key: string, value: any) => void;
  pickCategory: (slug: string) => void;
  selectMarketplace: (mp: "product" | "freelance") => void;
  isFreelanceMode: boolean;
  selectedCategory?: { name: string; slug: string; icon: string; image?: string; description: string; subcategories: { name: string; slug: string }[] };
  selectedSubcategory?: { name: string; slug: string };
  specTemplate: { label: string; type: string; options?: string[] }[];
  countyTowns: string[];
  publishing: boolean;
  error: string;
  onPublish: () => void;
  onBack: () => void;
}) {
  return (
    <div className="max-w-4xl mx-auto">

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {step === 0 && (
          <div className="space-y-4">
            {/* Marketplace selector — decides where the listing will appear */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
              <button onClick={() => selectMarketplace("product")}
                className={`relative rounded-xl border p-4 text-left transition-all ${!isFreelanceMode ? "border-nx-cyan/40 bg-nx-cyan/5 shadow-[0_0_20px_rgba(6,182,212,0.08)]" : "border-white/[0.06] bg-white/[0.02] hover:border-white/10"}`}>
                <p className="text-base font-bold text-white">🛍️ Normal Marketplace</p>
                <p className="text-[11px] text-white/40 leading-relaxed mt-1">Physical products — phones, fashion, home goods, vehicles, farm produce & everything tangible.</p>
                {!isFreelanceMode && (
                  <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider text-nx-cyan px-2 py-0.5 rounded-full bg-nx-cyan/10">Selected</span>
                )}
              </button>
              <button onClick={() => selectMarketplace("freelance")}
                className={`relative rounded-xl border p-4 text-left transition-all ${isFreelanceMode ? "border-nx-violet/40 bg-nx-violet/5 shadow-[0_0_20px_rgba(139,92,246,0.1)]" : "border-white/[0.06] bg-white/[0.02] hover:border-white/10"}`}>
                <p className="text-base font-bold text-white">💼 Freelance Marketplace</p>
                <p className="text-[11px] text-white/40 leading-relaxed mt-1">Digital services & tools — AI accounts, writing, design, development, marketing, bots & more. Shown only on /freelance.</p>
                {isFreelanceMode && (
                  <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider text-nx-violet px-2 py-0.5 rounded-full bg-nx-violet/10">Selected</span>
                )}
              </button>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-white mb-1">{isFreelanceMode ? "What service are you offering?" : "What are you selling?"}</h2>
              <p className="text-sm text-white/30">
                {isFreelanceMode
                  ? "Choose the freelance category that fits your service — it publishes straight to the Freelance Marketplace"
                  : "Choose the category that best fits your product — it publishes to the Normal Marketplace"}
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map(cat => (
                <button key={cat.slug}
                  onClick={() => pickCategory(cat.slug)}
                  className={`relative overflow-hidden rounded-xl border text-left transition-all hover:scale-[1.02] ${form.category === cat.slug ? "border-nx-cyan/40 shadow-[0_0_20px_rgba(6,182,212,0.1)]" : "border-white/[0.06] hover:border-white/10"}`}
                >
                  {CATEGORY_BANNERS[cat.slug] ? (
                    <div className="h-28 overflow-hidden relative">
                      <img src={CATEGORY_BANNERS[cat.slug]} alt={cat.name} className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-sm font-bold text-white drop-shadow-sm">{cat.name}</p>
                        <p className="text-[10px] text-white/60 leading-relaxed">{cat.description}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4">
                      <p className="text-2xl mb-2">{cat.icon}</p>
                      <p className="text-sm font-semibold text-white mb-0.5">{cat.name}</p>
                      <p className="text-[11px] text-white/30 leading-relaxed">{cat.description}</p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

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
                  className={`p-4 rounded-xl border text-left transition-all hover:scale-[1.02] ${form.subcategory === sub.slug ? "border-nx-cyan/40 bg-nx-cyan/5" : "border-white/[0.06] bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"}`}
                >
                  <p className="text-sm font-medium text-white">{sub.name}</p>
                </button>
              ))}
            </div>
            <button onClick={() => { update("subcategory", "general"); setStep(2); }}
              className="w-full text-center text-xs text-white/30 hover:text-white/50 py-2 transition-colors">
              Skip — treat as general {selectedCategory.name} {isFreelanceMode ? "service" : "product"}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-white mb-1">{isFreelanceMode ? "Service Details" : "Product Details"}</h2>
              <p className="text-sm text-white/30">
                {selectedSubcategory ? `${selectedCategory?.name} → ${selectedSubcategory.name}` : "Add details about your listing"}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/40 mb-1.5 block font-medium">{isFreelanceMode ? "Service Title *" : "Product Title *"}</label>
                <input value={form.title} onChange={(e) => update("title", e.target.value)}
                  placeholder={isFreelanceMode
                    ? "e.g. I will write 5 SEO blog articles, Telegram bot setup, Logo design package"
                    : "e.g. Toyota Harrier 2021 Automatic, Samsung Galaxy S24 Ultra"}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-cyan/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block font-medium">Description *</label>
                <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={4}
                  placeholder={isFreelanceMode
                    ? "Describe the service — what the buyer gets, deliverables, your experience..."
                    : "Describe your product in detail — condition, features, what's included..."}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-cyan/50 focus:outline-none resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {!isFreelanceMode && (
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block font-medium">Condition *</label>
                    <select value={form.condition} onChange={(e) => update("condition", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white focus:border-nx-cyan/50 focus:outline-none">
                      {["Brand New", "Used - Like New", "Used - Good", "Used - Fair", "Refurbished"].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                )}
                <div className={isFreelanceMode ? "col-span-2" : ""}>
                  <label className="text-xs text-white/40 mb-1.5 block font-medium">Negotiable</label>
                  <button onClick={() => update("negotiable", !form.negotiable)}
                    className={`w-full px-3 py-2.5 rounded-lg border text-sm text-left transition-colors ${form.negotiable ? "border-nx-cyan/30 bg-nx-cyan/5 text-nx-cyan" : "border-white/10 bg-white/[0.03] text-white/40"}`}>
                    {form.negotiable ? "Yes — Price negotiable" : "No — Fixed price"}
                  </button>
                </div>
              </div>
            </div>

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

        {step === 3 && <ImageUploadStep form={form} update={update} />}

        {step === 4 && !isFreelanceMode && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-white mb-1">Location & Pricing</h2>
              <p className="text-sm text-white/30">Where is the product and how much?</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white">📍 Product Location</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block font-medium">County *</label>
                  <select value={form.county} onChange={(e) => { update("county", e.target.value); update("town", ""); }} required
                    className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white focus:border-nx-cyan/50 focus:outline-none">
                    <option value="">Select county</option>
                    {Object.keys(KENYA_COUNTIES).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block font-medium">Town / Area *</label>
                  {countyTowns.length > 0 ? (
                    <select value={form.town} onChange={(e) => update("town", e.target.value)} required
                      className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white focus:border-nx-cyan/50 focus:outline-none">
                      <option value="">Select town</option>
                      {countyTowns.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  ) : (
                    <input value={form.town} onChange={(e) => update("town", e.target.value)} placeholder="e.g. Westlands"
                      className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-cyan/50 focus:outline-none" />
                  )}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-nx-cyan/5 border border-nx-cyan/10">
                <p className="text-xs text-white/50">🚚 <span className="text-nx-cyan font-medium">Delivery is handled by Nexora Market.</span> You only need to provide the product location.</p>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <h3 className="text-sm font-semibold text-white">💰 Pricing</h3>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block font-medium">Price (KES) *</label>
                <input type="number" value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="0"
                  className="w-full px-3 py-3 rounded-lg bg-white/[0.03] border border-white/10 text-xl text-white font-bold placeholder:text-white/20 focus:border-nx-cyan/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block font-medium">Original Price (KES) — optional, for discount display</label>
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

        {step === 4 && isFreelanceMode && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-white mb-1">Pricing & Delivery</h2>
              <p className="text-sm text-white/30">How much, how fast, and what you deliver.</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block font-medium">Price (KES) *</label>
                  <input type="number" value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="0"
                    className="w-full px-3 py-3 rounded-lg bg-white/[0.03] border border-white/10 text-xl text-white font-bold placeholder:text-white/20 focus:border-nx-cyan/50 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block font-medium">Delivery time *</label>
                  <input value={form.attributes["Delivery Time"] || ""}
                    onChange={(e) => update("attributes", { ...form.attributes, "Delivery Time": e.target.value })}
                    placeholder="e.g. 3 days, 1 week, 24 hours"
                    className="w-full px-3 py-3 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-cyan/50 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block font-medium">Revisions included</label>
                <select value={form.attributes["Revisions"] || "2"}
                  onChange={(e) => update("attributes", { ...form.attributes, Revisions: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white focus:border-nx-cyan/50 focus:outline-none">
                  {["0", "1", "2", "3", "Unlimited"].map(r => <option key={r} value={r}>{r === "Unlimited" ? "Unlimited revisions" : `${r} ${Number(r) === 1 ? "revision" : "revisions"}`}</option>)}
                </select>
              </div>
              <div className="p-3 rounded-lg bg-nx-violet/5 border border-nx-violet/10">
                <p className="text-xs text-white/50">💼 <span className="text-nx-violet font-medium">Digital delivery.</span> Work is delivered online and the fee stays in escrow until the buyer confirms delivery.</p>
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

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
          <button onClick={onBack}
            className="px-4 py-2.5 rounded-xl text-sm text-white/40 hover:text-white/60 transition-colors flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          {step < TOTAL_STEPS - 1 ? (
            <button onClick={() => setStep(step + 1)}
              className="px-6 py-2.5 rounded-xl bg-nx-cyan text-black text-sm font-semibold hover:bg-nx-cyan/80 transition-colors flex items-center gap-1">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={onPublish} disabled={publishing}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-500/80 transition-colors flex items-center gap-2 disabled:opacity-50">
              {publishing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Publishing...</>
              ) : (
                <><Check className="w-4 h-4" /> Publish {isFreelanceMode ? "Service" : "Product"}</>
              )}
            </button>
          )}
        </div>
      </div>
  );
}
