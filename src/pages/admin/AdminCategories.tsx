import AdminLayout from "./AdminLayout";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import {
  Plus, Edit3, Trash2, GripVertical, Eye, EyeOff, Loader2,
  Tag, ChevronDown, ChevronUp, Save, X, Image, Brain,
} from "lucide-react";

export default function AdminCategories() {
  const categories = useQuery(api.adminCategories.getAllCategories);
  const createCategory = useMutation(api.adminCategories.createCategory);
  const updateCategory = useMutation(api.adminCategories.updateCategory);
  const toggleCategoryActive = useMutation(api.adminCategories.toggleCategoryActive);
  const deleteCategory = useMutation(api.adminCategories.deleteCategory);
  const seedDefaults = useMutation(api.adminCategories.seedDefaultCategories);

  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formIcon, setFormIcon] = useState("📦");
  const [formImage, setFormImage] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formSubcategories, setFormSubcategories] = useState("");
  const [formActive, setFormActive] = useState(true);

  const resetForm = () => {
    setFormName(""); setFormSlug(""); setFormIcon("📦"); setFormImage("");
    setFormDescription(""); setFormSubcategories(""); setFormActive(true);
    setShowAdd(false); setEditingId(null); setError("");
  };

  const startEdit = (cat: any) => {
    setEditingId(cat._id);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormIcon(cat.icon);
    setFormImage(cat.image || "");
    setFormDescription(cat.description);
    setFormSubcategories(cat.subcategories.join(", "));
    setFormActive(cat.active);
    setShowAdd(true);
  };

  const handleSubmit = async () => {
    if (!formName.trim() || !formSlug.trim()) {
      setError("Name and slug are required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const subs = formSubcategories.split(",").map(s => s.trim()).filter(Boolean);
      if (editingId) {
        await updateCategory({
          categoryId: editingId as any,
          name: formName.trim(),
          slug: formSlug.trim(),
          icon: formIcon,
          image: formImage || undefined,
          description: formDescription.trim(),
          subcategories: subs,
        });
        // Toggle active separately since updateCategory doesn't accept it
        const existing = categories?.find(c => c._id === editingId);
        if (existing && existing.active !== formActive) {
          await toggleCategoryActive({ categoryId: editingId as any, active: formActive });
        }
      } else {
        await createCategory({
          name: formName.trim(),
          slug: formSlug.trim(),
          icon: formIcon,
          image: formImage || undefined,
          description: formDescription.trim(),
          subcategories: subs,
        });
      }
      resetForm();
    } catch (err: any) {
      setError(err.message || "Failed to save category");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string, active: boolean) => {
    try {
      await toggleCategoryActive({ categoryId: id as any, active: !active });
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteCategory({ categoryId: id as any });
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSeed = async () => {
    setLoading(true);
    try {
      const result = await seedDefaults();
      toast.success(result.message || "Done");
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (categories === undefined) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-nx-gold animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Category Management</h1>
            <p className="text-sm text-white/40 mt-1">
              Manage marketplace categories that sellers see when adding products
            </p>
          </div>
          <div className="flex gap-2">
            {categories.length === 0 && (
              <button onClick={handleSeed} disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-nx-violet/10 border border-nx-violet/20 text-nx-violet text-sm font-medium hover:bg-nx-violet/20 transition-colors disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                Seed Default Categories
              </button>
            )}
            <button onClick={() => { resetForm(); setShowAdd(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-nx-gold/10 border border-nx-gold/20 text-nx-gold text-sm font-medium hover:bg-nx-gold/20 transition-colors">
              <Plus className="w-4 h-4" /> Add Category
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Categories", value: categories.length, color: "text-white" },
            { label: "Active", value: categories.filter(c => c.active).length, color: "text-emerald-400" },
            { label: "Inactive", value: categories.filter(c => !c.active).length, color: "text-red-400" },
            { label: "Total Subcategories", value: categories.reduce((acc, c) => acc + c.subcategories.length, 0), color: "text-nx-cyan" },
          ].map((stat) => (
            <div key={stat.label} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <p className="text-[11px] text-white/30 uppercase tracking-wider">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Add/Edit Form */}
        {showAdd && (
          <div className="p-6 rounded-xl bg-[#0E0E18] border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                {editingId ? "Edit Category" : "Add New Category"}
              </h3>
              <button onClick={resetForm} className="p-1 text-white/30 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-400/5 border border-red-400/10 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Category Name *</label>
                <input type="text" value={formName} onChange={(e) => {
                  setFormName(e.target.value);
                  if (!editingId) setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
                }}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-gold/30 focus:outline-none"
                  placeholder="e.g. Mobile Phones" />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Slug *</label>
                <input type="text" value={formSlug} onChange={(e) => setFormSlug(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-gold/30 focus:outline-none"
                  placeholder="e.g. mobile-phones" />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Icon (emoji)</label>
                <input type="text" value={formIcon} onChange={(e) => setFormIcon(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-gold/30 focus:outline-none"
                  placeholder="📱" />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Image URL</label>
                <input type="text" value={formImage} onChange={(e) => setFormImage(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-gold/30 focus:outline-none"
                  placeholder="https://..." />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-white/50 mb-1.5">Description</label>
                <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={2}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-gold/30 focus:outline-none resize-none"
                  placeholder="Describe this category..." />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-white/50 mb-1.5">Subcategories (comma-separated)</label>
                <input type="text" value={formSubcategories} onChange={(e) => setFormSubcategories(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-gold/30 focus:outline-none"
                  placeholder="iPhone, Samsung, Google Pixel, Tecno..." />
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formActive} onChange={(e) => setFormActive(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/[0.03] text-nx-gold focus:ring-nx-gold/30" />
                  <span className="text-sm text-white/60">Active (visible to sellers)</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button onClick={resetForm} className="px-4 py-2 rounded-lg text-sm text-white/40 hover:bg-white/[0.03]">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={loading || !formName.trim()}
                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-nx-gold text-black text-sm font-semibold hover:bg-nx-gold/80 transition-colors disabled:opacity-30">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editingId ? "Update Category" : "Create Category"}
              </button>
            </div>
          </div>
        )}

        {/* Categories List */}
        <div className="space-y-2">
          {categories.length === 0 ? (
            <div className="text-center py-16 rounded-xl bg-white/[0.02] border border-white/5">
              <Tag className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/30">No categories yet</p>
              <p className="text-xs text-white/15 mt-1">Create categories or seed defaults to get started</p>
            </div>
          ) : (
            categories.map((cat) => (
              <div key={cat._id} className={`rounded-xl border transition-colors ${
                cat.active ? "bg-white/[0.02] border-white/5" : "bg-white/[0.01] border-white/3 opacity-60"
              }`}>
                <div className="flex items-center gap-4 p-4">
                  <div className="text-2xl">{cat.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-sm">{cat.name}</span>
                      <span className="text-[10px] text-white/20 px-2 py-0.5 rounded bg-white/[0.03]">{cat.slug}</span>
                      {!cat.active && (
                        <span className="text-[10px] text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">Inactive</span>
                      )}
                    </div>
                    <p className="text-xs text-white/30 mt-0.5">{cat.description}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-white/20">{cat.subcategories.length} subcategories</span>
                      {cat.subcategories.length > 0 && (
                        <span className="text-[10px] text-white/15 truncate max-w-md">
                          {cat.subcategories.slice(0, 4).join(", ")}{cat.subcategories.length > 4 ? "..." : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => handleToggle(cat._id, cat.active)}
                      className={`p-2 rounded-lg transition-colors ${cat.active ? "text-emerald-400 hover:bg-emerald-400/10" : "text-red-400 hover:bg-red-400/10"}`}
                      title={cat.active ? "Deactivate" : "Activate"}>
                      {cat.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button onClick={() => startEdit(cat)}
                      className="p-2 rounded-lg text-nx-gold/60 hover:text-nx-gold hover:bg-nx-gold/10 transition-colors"
                      title="Edit">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(cat._id, cat.name)}
                      className="p-2 rounded-lg text-red-400/40 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded subcategories */}
                {expandedId === cat._id && cat.subcategories.length > 0 && (
                  <div className="px-4 pb-4 pt-0">
                    <div className="flex flex-wrap gap-2">
                      {cat.subcategories.map((sub, i) => (
                        <span key={i} className="px-3 py-1 rounded-full bg-white/[0.03] border border-white/5 text-xs text-white/40">
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
