import { useState, useRef, useCallback } from "react";
import { X, Paperclip, File as FileIcon } from "lucide-react";

export interface PickedFile {
  file: File;
  /** Object URL for image previews; empty string for non-image documents. */
  preview: string;
}

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Reusable drag-and-drop uploader for job/listing attachments. Accepts images
 * AND documents (PDF, Word, Excel, plain text). Images preview inline; other
 * documents show as file chips. Files are held locally until publish, then
 * uploaded to Convex Storage in one pass.
 */
export default function DocumentUpload({
  files,
  onChange,
  max = 5,
  maxSizeMb = 10,
  label = "Supporting files (optional)",
  hint = "PDF, DOC/DOCX, XLS/XLSX, TXT, CSV, JPG, PNG, WebP — Max 10MB each",
  accept = ".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,image/jpeg,image/png,image/webp",
}: {
  files: PickedFile[];
  onChange: (files: PickedFile[]) => void;
  max?: number;
  maxSizeMb?: number;
  label?: string;
  hint?: string;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback((list: FileList | null) => {
    if (!list) return;
    const next: PickedFile[] = [];
    for (let i = 0; i < list.length && files.length + next.length < max; i++) {
      const file = list[i];
      const ok =
        file.type.startsWith("image/") ||
        /\.(pdf|docx?|xlsx?|txt|csv)$/i.test(file.name);
      if (!ok) continue;
      if (file.size > maxSizeMb * 1024 * 1024) continue;
      next.push({
        file,
        preview: IMAGE_TYPES.includes(file.type) ? URL.createObjectURL(file) : "",
      });
    }
    if (next.length > 0) onChange([...files, ...next]);
  }, [files, onChange, max, maxSizeMb]);

  const removeAt = (idx: number) => {
    const updated = [...files];
    const [removed] = updated.splice(idx, 1);
    if (removed?.preview) URL.revokeObjectURL(removed.preview);
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-white/60 block">{label}</label>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`rounded-xl border-2 border-dashed p-5 flex flex-col items-center justify-center cursor-pointer transition-all ${
          dragOver ? "border-nx-violet bg-nx-violet/5" : "border-white/10 hover:border-nx-violet/30 hover:bg-white/[0.02]"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          className="hidden"
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
        />
        <Paperclip className="w-6 h-6 text-white/20 mb-2" />
        <p className="text-sm text-white/50 font-medium">Click to upload or drag and drop</p>
        <p className="text-[11px] text-white/25 mt-1">{hint}</p>
      </div>

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {files.map((f, i) => (
            <div
              key={i}
              className="relative group w-16 h-16 rounded-lg overflow-hidden border border-white/10 bg-white/[0.03] flex items-center justify-center"
              title={f.file.name}
            >
              {f.preview ? (
                <img src={f.preview} alt={f.file.name} className="w-full h-full object-cover" />
              ) : (
                <FileIcon className="w-5 h-5 text-nx-violet/60" />
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeAt(i); }}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              <p className="absolute bottom-0 left-0 right-0 text-[8px] px-1 py-0.5 bg-black/70 text-white/70 truncate">
                {f.file.name}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
