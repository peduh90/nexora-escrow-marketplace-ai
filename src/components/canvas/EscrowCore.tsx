import { useEffect, useRef, useState } from "react";

export default function EscrowCore({ size = 280 }: { size?: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReducedMotion.current = mq.matches;
  }, []);

  const breatheSpeed = prefersReducedMotion.current ? 0 : isHovered ? 8 : 12;
  const ringCount = 3;
  const outerRingRadius = size * 0.45;
  const midRingRadius = size * 0.38;
  const innerRingRadius = size * 0.3;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="img"
      aria-label="Escrow Core — securing your transaction"
    >
      {/* Outer glow */}
      <div
        className="absolute rounded-full"
        style={{
          width: size * 1.3,
          height: size * 1.3,
          background: `radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.05) 50%, transparent 70%)`,
          animation: prefersReducedMotion.current ? "none" : `nx-breathe ${breatheSpeed}s ease-in-out infinite`,
        }}
      />

      {/* Data streams radiating outward */}
      {!prefersReducedMotion.current && Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const len = size * 0.6;
        const x1 = size / 2 + Math.cos(angle) * size * 0.22;
        const y1 = size / 2 + Math.sin(angle) * size * 0.22;
        const x2 = size / 2 + Math.cos(angle) * len;
        const y2 = size / 2 + Math.sin(angle) * len;
        return (
          <svg key={i} className="absolute inset-0 pointer-events-none" width={size} height={size}>
            <defs>
              <linearGradient id={`stream-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
              </linearGradient>
            </defs>
            <line
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={`url(#stream-${i})`}
              strokeWidth="1"
              strokeDasharray="4 6"
              opacity={isHovered ? 0.6 : 0.3}
            />
          </svg>
        );
      })}

      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="relative z-10"
      >
        <defs>
          <radialGradient id="core-gradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#C4B5FD" stopOpacity="0.8" />
            <stop offset="40%" stopColor="#8B5CF6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#6D28D9" stopOpacity="0.3" />
          </radialGradient>
          <radialGradient id="core-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="ring-gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="ring-gradient-2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id="ring-gradient-3" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.15" />
          </linearGradient>
          <filter id="core-blur">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>

        {/* Ambient glow */}
        <circle cx={size / 2} cy={size / 2} r={size * 0.25} fill="url(#core-glow)" />

        {/* Orbital rings */}
        {[
          { r: outerRingRadius, grad: "ring-gradient-1", tilt: "rotateX(70deg) rotateY(0deg)", dur: breatheSpeed * 1.5 },
          { r: midRingRadius, grad: "ring-gradient-2", tilt: "rotateX(70deg) rotateZ(30deg)", dur: breatheSpeed * 1.2 },
          { r: innerRingRadius, grad: "ring-gradient-3", tilt: "rotateX(70deg) rotateZ(-15deg)", dur: breatheSpeed },
        ].map((ring, i) => (
          <g key={i} transform={`translate(${size / 2}, ${size / 2})`}>
            <ellipse
              cx={0}
              cy={0}
              rx={ring.r}
              ry={ring.r * 0.35}
              fill="none"
              stroke={`url(#${ring.grad})`}
              strokeWidth={isHovered ? 1.5 : 1}
              opacity={isHovered ? 0.8 : 0.5}
              style={{
                transformOrigin: "center",
                animation: prefersReducedMotion.current ? "none" : `nx-core-spin ${ring.dur}s linear infinite`,
                animationDirection: i % 2 === 0 ? "normal" : "reverse",
              }}
            />
          </g>
        ))}

        {/* Orbiting nodes on rings */}
        {[
          { r: outerRingRadius, count: 6, color: "#8B5CF6", speed: breatheSpeed * 2 },
          { r: midRingRadius, count: 4, color: "#06B6D4", speed: breatheSpeed * 1.6 },
          { r: innerRingRadius, count: 3, color: "#10B981", speed: breatheSpeed * 1.2 },
        ].map((layer, li) =>
          Array.from({ length: layer.count }).map((_, ni) => {
            const baseAngle = (ni / layer.count) * 360;
            const nodeSize = li === 0 ? 3 : li === 1 ? 2.5 : 2;
            return (
              <circle
                key={`${li}-${ni}`}
                cx={size / 2}
                cy={size / 2}
                r={nodeSize}
                fill={layer.color}
                opacity={0.8}
                filter="url(#core-blur)"
                style={{
                  transformOrigin: `${size / 2}px ${size / 2}px`,
                  animation: prefersReducedMotion.current
                    ? "none"
                    : `nx-core-spin ${layer.speed}s linear infinite`,
                }}
              />
            );
          })
        )}

        {/* Core sphere */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size * 0.14}
          fill="url(#core-gradient)"
          stroke="#8B5CF6"
          strokeWidth="1.5"
          opacity={0.9}
          style={{
            transformOrigin: `${size / 2}px ${size / 2}px`,
            animation: prefersReducedMotion.current ? "none" : `nx-breathe ${breatheSpeed}s ease-in-out infinite`,
          }}
        />

        {/* Inner bright core */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size * 0.06}
          fill="#E0D4FF"
          opacity={0.7}
          filter="url(#core-blur)"
          style={{
            transformOrigin: `${size / 2}px ${size / 2}px`,
            animation: prefersReducedMotion.current ? "none" : `nx-breathe ${breatheSpeed * 0.8}s ease-in-out infinite`,
          }}
        />

        {/* SECURED text label */}
        <text
          x={size / 2}
          y={size / 2 + size * 0.14 + 20}
          textAnchor="middle"
          fill="#8B5CF6"
          fontSize="10"
          fontFamily="system-ui, sans-serif"
          fontWeight="600"
          letterSpacing="3"
          opacity={0.6}
        >
          ESCROW PROTECTED
        </text>
      </svg>
    </div>
  );
}
