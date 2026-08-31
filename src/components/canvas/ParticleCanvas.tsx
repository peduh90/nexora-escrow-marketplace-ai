import { useEffect, useRef, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  opacityDir: number;
  hue: number;
}

interface Constellation {
  a: number;
  b: number;
  opacity: number;
}

const PARTICLE_COUNT = 600;
const CONSTELLATION_DISTANCE = 120;
const COLORS = [
  { r: 139, g: 92, b: 246 },  // violet
  { r: 6, g: 182, b: 212 },   // cyan
  { r: 255, g: 255, b: 255 }, // white
  { r: 245, g: 158, b: 11 },  // gold (rare)
];

export default function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const constellations = useRef<Constellation[]>([]);
  const mousePos = useRef({ x: 0, y: 0 });
  const animFrame = useRef<number>(0);
  const prefersReducedMotion = useRef(false);

  const initParticles = useCallback((width: number, height: number) => {
    particles.current = Array.from({ length: PARTICLE_COUNT }, () => {
      const colorIdx = Math.random() < 0.5 ? 2 : Math.random() < 0.7 ? 0 : Math.random() < 0.9 ? 1 : 3;
      const color = COLORS[colorIdx];
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.4 + 0.1,
        opacityDir: Math.random() > 0.5 ? 1 : -1,
        hue: colorIdx,
      };
    });
  }, []);

  const buildConstellations = useCallback(() => {
    const conns: Constellation[] = [];
    for (let i = 0; i < particles.current.length; i++) {
      for (let j = i + 1; j < particles.current.length; j++) {
        if (conns.length > 150) break;
        const a = particles.current[i];
        const b = particles.current[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        if (dx * dx + dy * dy < CONSTELLATION_DISTANCE * CONSTELLATION_DISTANCE) {
          conns.push({ a: i, b: j, opacity: 0.08 });
        }
      }
    }
    constellations.current = conns;
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReducedMotion.current = mq.matches;
    const handler = (e: MediaQueryListEvent) => { prefersReducedMotion.current = e.matches; };
    mq.addEventListener("change", handler);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      if (particles.current.length === 0) initParticles(width, height);
    };
    resize();
    window.addEventListener("resize", resize);

    const handleMouse = (e: MouseEvent) => {
      mousePos.current.x = e.clientX;
      mousePos.current.y = e.clientY;
    };
    window.addEventListener("mousemove", handleMouse);

    let lastFrame = 0;
    const animate = (time: number) => {
      const dt = Math.min((time - lastFrame) / 16, 3);
      lastFrame = time;

      ctx.clearRect(0, 0, width, height);

      // Draw nebula gradients
      const grad1 = ctx.createRadialGradient(width * 0.3, height * 0.4, 0, width * 0.3, height * 0.4, width * 0.5);
      grad1.addColorStop(0, "rgba(26, 10, 46, 0.12)");
      grad1.addColorStop(1, "transparent");
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      const grad2 = ctx.createRadialGradient(width * 0.7, height * 0.6, 0, width * 0.7, height * 0.6, width * 0.4);
      grad2.addColorStop(0, "rgba(10, 26, 46, 0.1)");
      grad2.addColorStop(1, "transparent");
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);

      // Constellation lines
      if (!prefersReducedMotion.current && time % 30000 < 100) {
        buildConstellations();
      }
      for (const c of constellations.current) {
        const pa = particles.current[c.a];
        const pb = particles.current[c.b];
        const dx = pa.x - pb.x;
        const dy = pa.y - pb.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONSTELLATION_DISTANCE) {
          const alpha = (1 - dist / CONSTELLATION_DISTANCE) * 0.06;
          const col = COLORS[pa.hue];
          ctx.beginPath();
          ctx.moveTo(pa.x, pa.y);
          ctx.lineTo(pb.x, pb.y);
          ctx.strokeStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }

      // Particles
      const mp = mousePos.current;
      for (const p of particles.current) {
        if (!prefersReducedMotion.current) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;

          // Subtle mouse repulsion
          const mdx = p.x - mp.x;
          const mdy = p.y - mp.y;
          const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mDist < 150 && mDist > 0) {
            const force = (150 - mDist) / 150 * 0.15;
            p.x += (mdx / mDist) * force;
            p.y += (mdy / mDist) * force;
          }

          // Pulsing opacity
          p.opacity += p.opacityDir * 0.002 * dt;
          if (p.opacity > 0.5) { p.opacity = 0.5; p.opacityDir = -1; }
          if (p.opacity < 0.05) { p.opacity = 0.05; p.opacityDir = 1; }
        }

        // Wrap
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const col = COLORS[p.hue];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${p.opacity})`;
        ctx.fill();
      }

      animFrame.current = requestAnimationFrame(animate);
    };

    if (prefersReducedMotion.current) {
      // Draw once, no animation
      ctx.clearRect(0, 0, width, height);
      for (const p of particles.current) {
        const col = COLORS[p.hue];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${p.opacity})`;
        ctx.fill();
      }
    } else {
      animFrame.current = requestAnimationFrame(animate);
    }

    return () => {
      cancelAnimationFrame(animFrame.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouse);
      mq.removeEventListener("change", handler);
    };
  }, [initParticles, buildConstellations]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ background: "#05050A" }}
      aria-hidden="true"
    />
  );
}
