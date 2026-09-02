import { useEffect, useRef, useState } from "react";

export default function GalacticCore({ size = 320 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const animRef = useRef<number>(0);
  const prefersReduced = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReduced.current = mq.matches;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const speed = isHovered ? 0.003 : 0.001;

    // Stars
    const stars = Array.from({ length: 120 }, () => ({
      angle: Math.random() * Math.PI * 2,
      dist: Math.random() * size * 0.48 + size * 0.05,
      size: Math.random() * 1.5 + 0.3,
      speed: (Math.random() * 0.4 + 0.1) * (Math.random() > 0.5 ? 1 : -1),
      brightness: Math.random() * 0.6 + 0.2,
      hue: Math.random() * 60 + 180, // blue-cyan range
    }));

    // Spiral arm particles
    const spiralParticles = Array.from({ length: 80 }, () => {
      const arm = Math.floor(Math.random() * 3);
      const armAngle = (arm / 3) * Math.PI * 2;
      const t = Math.random();
      return {
        t,
        armAngle,
        size: Math.random() * 2 + 0.5,
        speed: (Math.random() * 0.3 + 0.2),
        brightness: Math.random() * 0.5 + 0.1,
        hue: Math.random() > 0.5 ? 200 : (Math.random() > 0.5 ? 260 : 170),
      };
    });

    // Orbiting rings (subtle ellipses)
    const rings = [
      { rx: size * 0.42, ry: size * 0.12, tilt: 0, speed: 0.0008, color: "rgba(100, 200, 255, 0.08)" },
      { rx: size * 0.35, ry: size * 0.10, tilt: 0.5, speed: -0.0006, color: "rgba(139, 92, 246, 0.06)" },
      { rx: size * 0.28, ry: size * 0.08, tilt: -0.3, speed: 0.001, color: "rgba(6, 182, 212, 0.07)" },
    ];

    let time = 0;

    const animate = () => {
      if (prefersReduced.current) {
        // Draw static
        ctx.clearRect(0, 0, size, size);
        drawGalaxy(ctx, cx, cy, size, 0, stars, spiralParticles, rings, false);
        return;
      }

      time += speed;
      ctx.clearRect(0, 0, size, size);
      drawGalaxy(ctx, cx, cy, size, time, stars, spiralParticles, rings, isHovered);
      animRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animRef.current);
  }, [size, isHovered]);

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="img"
      aria-label="Galactic escrow protection"
    >
      {/* Ambient nebula glow */}
      <div
        className="absolute rounded-full"
        style={{
          width: size * 2,
          height: size * 2,
          background: `radial-gradient(circle at 40% 40%, rgba(6, 182, 212, 0.06) 0%, transparent 50%),
                       radial-gradient(circle at 60% 60%, rgba(139, 92, 246, 0.04) 0%, transparent 50%),
                       radial-gradient(circle, rgba(100, 200, 255, 0.03) 0%, transparent 60%)`,
          animation: prefersReduced.current ? "none" : "nx-breathe 20s ease-in-out infinite",
        }}
      />

      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="relative z-10"
      />

      {/* Label */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20">
        <span className="text-[10px] font-mono font-semibold tracking-[4px] text-cyan-300/40">
          ESCROW PROTECTED
        </span>
      </div>
    </div>
  );
}

function drawGalaxy(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  time: number,
  stars: any[],
  spiralParticles: any[],
  rings: any[],
  hovered: boolean
) {
  // ── Outer nebula haze ──
  const nebulaGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.5);
  nebulaGrad.addColorStop(0, "rgba(6, 182, 212, 0.04)");
  nebulaGrad.addColorStop(0.3, "rgba(139, 92, 246, 0.03)");
  nebulaGrad.addColorStop(0.6, "rgba(100, 200, 255, 0.01)");
  nebulaGrad.addColorStop(1, "transparent");
  ctx.fillStyle = nebulaGrad;
  ctx.fillRect(0, 0, size, size);

  // ── Spiral arms ──
  for (const p of spiralParticles) {
    const angle = p.armAngle + time * p.speed * 3;
    const dist = (p.t * size * 0.4 + size * 0.06);
    // Tighten spiral as distance increases
    const spiralOffset = p.t * Math.PI * 1.5;
    const x = cx + Math.cos(angle + spiralOffset + time * 0.2) * dist;
    const y = cy + Math.sin(angle + spiralOffset + time * 0.2) * dist * 0.35;

    const alpha = p.brightness * (1 - p.t * 0.5) * (hovered ? 1.3 : 1);
    ctx.beginPath();
    ctx.arc(x, y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${alpha})`;
    ctx.fill();
  }

  // ── Orbital rings ──
  for (const ring of rings) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ring.tilt);
    ctx.beginPath();
    ctx.ellipse(0, 0, ring.rx, ring.ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = ring.color;
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.restore();
  }

  // ── Orbiting dots on rings ──
  const ringDots = [
    { rx: size * 0.42, ry: size * 0.12, tilt: 0, speed: 0.5, color: "#64C8FF", count: 4 },
    { rx: size * 0.35, ry: size * 0.10, tilt: 0.5, speed: -0.3, color: "#8B5CF6", count: 3 },
    { rx: size * 0.28, ry: size * 0.08, tilt: -0.3, speed: 0.7, color: "#06B6D4", count: 3 },
  ];
  for (const rd of ringDots) {
    for (let i = 0; i < rd.count; i++) {
      const angle = time * rd.speed + (i / rd.count) * Math.PI * 2;
      const x = cx + Math.cos(angle) * rd.rx * Math.cos(rd.tilt) - Math.sin(angle) * rd.ry * Math.sin(rd.tilt);
      const y = cy + Math.cos(angle) * rd.rx * Math.sin(rd.tilt) + Math.sin(angle) * rd.ry * Math.cos(rd.tilt);

      // Glow
      const glowGrad = ctx.createRadialGradient(x, y, 0, x, y, 6);
      glowGrad.addColorStop(0, rd.color + "60");
      glowGrad.addColorStop(1, "transparent");
      ctx.fillStyle = glowGrad;
      ctx.fillRect(x - 6, y - 6, 12, 12);

      // Dot
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = rd.color;
      ctx.fill();
    }
  }

  // ── Background stars ──
  for (const star of stars) {
    const x = cx + Math.cos(star.angle + time * star.speed) * star.dist;
    const y = cy + Math.sin(star.angle + time * star.speed) * star.dist * 0.4;

    ctx.beginPath();
    ctx.arc(x, y, star.size, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${star.hue}, 60%, 80%, ${star.brightness})`;
    ctx.fill();
  }

  // ── Core glow (subtle, not bright) ──
  const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.15);
  coreGrad.addColorStop(0, "rgba(200, 230, 255, 0.15)");
  coreGrad.addColorStop(0.3, "rgba(100, 200, 255, 0.06)");
  coreGrad.addColorStop(0.6, "rgba(139, 92, 246, 0.03)");
  coreGrad.addColorStop(1, "transparent");
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.15, 0, Math.PI * 2);
  ctx.fill();

  // ── Central bright point ──
  const pointGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 4);
  pointGrad.addColorStop(0, "rgba(220, 240, 255, 0.6)");
  pointGrad.addColorStop(1, "transparent");
  ctx.fillStyle = pointGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fill();

  // ── Occasional shooting star ──
  const shootTime = (time * 100) % 300;
  if (shootTime < 15) {
    const sx = cx + Math.cos(time * 2) * size * 0.3;
    const sy = cy - size * 0.3 + shootTime * 8;
    const len = 20;
    const alpha = 1 - shootTime / 15;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx - len * 0.7, sy + len);
    ctx.strokeStyle = `rgba(180, 220, 255, ${alpha * 0.3})`;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
}
