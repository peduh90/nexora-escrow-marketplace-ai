/**
 * The Nexora brand mark — the app-tile N monogram from the brand logo
 * (gradient blue→purple strokes with node dots on the dark rounded tile).
 * Inline SVG so it renders crisply at any size with no extra request.
 */
export default function NexoraMark({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} role="img" aria-label="Nexora">
      <defs>
        <linearGradient id="nxMarkG" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="45%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>
      </defs>
      <rect x="16" y="16" width="480" height="480" rx="112" ry="112" fill="#12101D" />
      <rect x="20" y="20" width="472" height="472" rx="108" ry="108" fill="none" stroke="#8B5CF6" strokeOpacity="0.3" strokeWidth="6" />
      <g stroke="url(#nxMarkG)" fill="none" strokeLinecap="round">
        <line x1="146" y1="352" x2="146" y2="168" strokeWidth="56" />
        <line x1="146" y1="168" x2="366" y2="352" strokeWidth="56" />
        <line x1="366" y1="168" x2="366" y2="352" strokeWidth="56" />
      </g>
      <circle cx="146" cy="168" r="24" fill="#FFFFFF" />
      <circle cx="366" cy="352" r="24" fill="#FFFFFF" />
      <circle cx="256" cy="258" r="12" fill="#FFFFFF" fillOpacity="0.92" />
    </svg>
  );
}
