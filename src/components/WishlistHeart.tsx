import { useState } from "react";
import { Heart } from "lucide-react";

interface WishlistHeartProps {
  className?: string;
  size?: "sm" | "md";
  initialActive?: boolean;
  onToggle?: (active: boolean) => void;
}

export default function WishlistHeart({ className = "", size = "sm", initialActive = false, onToggle }: WishlistHeartProps) {
  const [active, setActive] = useState(initialActive);
  const [justToggled, setJustToggled] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !active;
    setActive(next);
    setJustToggled(true);
    setTimeout(() => setJustToggled(false), 400);
    onToggle?.(next);
  };

  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-5 h-5";
  const btnSize = size === "sm" ? "p-1.5" : "p-2.5";

  return (
    <button
      onClick={handleClick}
      className={`relative ${btnSize} rounded-lg bg-black/40 backdrop-blur-sm transition-all hover:scale-110 ${className}`}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart
        className={`${iconSize} transition-all duration-300 ${
          active ? "text-red-400 fill-red-400 scale-110" : "text-white/50 hover:text-red-300"
        }`}
      />
      {/* Pulse ring animation */}
      {justToggled && active && (
        <span className="absolute inset-0 rounded-lg border-2 border-red-400 animate-ping opacity-40" />
      )}
    </button>
  );
}
