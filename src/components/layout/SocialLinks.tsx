import { MessageCircle, Facebook, Instagram, Music2 } from "lucide-react";

interface SocialLinksProps {
  whatsapp?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  size?: "sm" | "md" | "lg";
  showLabels?: boolean;
}

export default function SocialLinks({
  whatsapp,
  facebook,
  instagram,
  tiktok,
  size = "md",
  showLabels = false,
}: SocialLinksProps) {
  const iconSize = size === "sm" ? "w-3.5 h-3.5" : size === "md" ? "w-4 h-4" : "w-5 h-5";
  const btnSize = size === "sm" ? "w-7 h-7" : size === "md" ? "w-9 h-9" : "w-11 h-11";

  const links = [
    {
      url: whatsapp,
      icon: MessageCircle,
      label: "WhatsApp",
      color: "#25D366",
      hoverBg: "hover:bg-[#25D366]/10 hover:border-[#25D366]/30",
    },
    {
      url: facebook,
      icon: Facebook,
      label: "Facebook",
      color: "#1877F2",
      hoverBg: "hover:bg-[#1877F2]/10 hover:border-[#1877F2]/30",
    },
    {
      url: instagram,
      icon: Instagram,
      label: "Instagram",
      color: "#E4405F",
      hoverBg: "hover:bg-[#E4405F]/10 hover:border-[#E4405F]/30",
    },
    {
      url: tiktok,
      icon: Music2,
      label: "TikTok",
      color: "#00F2EA",
      hoverBg: "hover:bg-[#00F2EA]/10 hover:border-[#00F2EA]/30",
    },
  ].filter((l) => l.url);

  if (links.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {links.map((link) => (
        <a
          key={link.label}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1.5 ${btnSize} rounded-lg border border-white/5 bg-white/[0.02] items-center justify-center transition-all duration-200 ${link.hoverBg} group`}
          title={`Contact on ${link.label}`}
          aria-label={`Contact on ${link.label}`}
        >
          <link.icon
            className={iconSize}
            style={{ color: link.color }}
          />
          {showLabels && (
            <span className="text-xs text-white/50 group-hover:text-white/70">{link.label}</span>
          )}
        </a>
      ))}
    </div>
  );
}

// Quick share component for listings
export function ShareListing({
  title,
  price,
  url,
  whatsapp,
}: {
  title: string;
  price: string;
  url: string;
  whatsapp?: string;
}) {
  const shareText = encodeURIComponent(`Check out "${title}" for ${price} on Nexora Market!\n${url}`);
  
  return (
    <div className="flex items-center gap-2">
      <a
        href={`https://wa.me/?text=${shareText}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#25D366]/20 text-xs text-[#25D366] hover:bg-[#25D366]/10 transition-colors"
      >
        <MessageCircle className="w-3.5 h-3.5" />
        Share on WhatsApp
      </a>
    </div>
  );
}
