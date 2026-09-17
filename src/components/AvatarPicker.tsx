import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import {
  Camera, Loader2, Trash2, User,
} from "lucide-react";

const SIZES: Record<string, string> = {
  sm: "w-12 h-12",
  md: "w-16 h-16",
  lg: "w-20 h-20",
  xl: "w-24 h-24",
};

/**
 * Profile icon uploader — works for EVERY account type (buyer, seller,
 * freelancer, employer, AI tasker, creator, admin). Uploads any image to
 * Convex storage and attaches it to the account, replacing Google photos or
 * the initial-letter placeholder. Replaces and removes clean up storage.
 */
export default function AvatarPicker({
  image,
  name,
  size = "md",
}: {
  image?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const generateUploadUrl = useMutation(api.users.generateAvatarUploadUrl);
  const setAvatar = useMutation(api.users.setAvatarFromUpload);
  const removeAvatar = useMutation(api.users.removeAvatar);

  const [busy, setBusy] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const boxSize = SIZES[size] || SIZES.md;

  const pick = async (file: File | undefined | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Pick an image file (JPG, PNG, WebP…)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large — keep it under 5 MB");
      return;
    }
    setBusy(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!res.ok) throw new Error("Upload failed");
      const out = (await res.json()) as { storageId?: string; storageKey?: string; key?: string };
      const key = out.storageId || out.storageKey || out.key;
      if (!key) throw new Error("No storage key returned");
      await setAvatar({ storageId: key });
      toast.success("Profile icon updated!");
      setLocalPreview(null);
    } catch (err: any) {
      toast.error(err?.message || "Could not upload the image");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    setBusy(true);
    try {
      await removeAvatar({});
      toast.success("Profile icon removed");
    } catch (err: any) {
      toast.error(err?.message || "Could not remove the image");
    } finally {
      setBusy(false);
    }
  };

  const shown = localPreview || image;

  return (
    <div className="flex items-center gap-3">
      <div className={`relative ${boxSize} shrink-0 group`}>
        {shown ? (
          <img src={shown} alt={name || "Profile"} className="w-full h-full rounded-full object-cover border-2 border-nx-violet/30" />
        ) : (
          <div className="w-full h-full rounded-full bg-nx-violet/15 border-2 border-nx-violet/25 flex items-center justify-center">
            <User className="w-1/2 h-1/2 text-nx-violet/60" />
          </div>
        )}
        {/* Upload overlay button */}
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={busy}
          title="Upload profile icon"
          className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center disabled:cursor-wait"
        >
          {busy ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
        </button>
        {/* Mobile: the camera strip below is the affordance; keep a tap target too */}
        <button
          type="button"
          aria-label="Upload profile icon"
          onClick={() => fileInput.current?.click()}
          disabled={busy}
          className="absolute inset-0 rounded-full md:hidden"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-nx-violet/10 border border-nx-violet/25 text-nx-violet text-xs font-semibold hover:bg-nx-violet/20 transition-colors disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
          {shown ? "Change icon" : "Upload icon"}
        </button>
        {shown && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-white/40 text-xs hover:text-red-400 hover:border-red-400/20 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" /> Remove
          </button>
        )}
        <p className="text-[10px] text-white/25">JPG, PNG or WebP · up to 5 MB</p>
      </div>

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          void pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
