import { useEffect, useRef, useState } from "react";

interface OrbitalRing {
  rx: number;
  ry: number;
  tiltX: number;
  tiltY: number;
  tiltZ: number;
  speed: number;
  color: string;
  nodeCount: number;
  nodeSize: number;
}

interface OrbitingNode {
  ringIdx: number;
  angle: number;
  speed: number;
}

const RINGS: OrbitalRing[] = [
  { rx: 140, ry: 50, tiltX: 25, tiltY: 0, tiltZ: 10, speed: 0.012, color: "#67E8F9", nodeCount: 3, nodeSize: 3.5 },
  { rx: 115, ry: 42, tiltX: -20, tiltY: 40, tiltZ: -5, speed: -0.009, color: "#93C5FD", nodeCount: 2, nodeSize: 3 },
  { rx: 90, ry: 34, tiltX: 50, tiltY: 20, tiltZ: 30, speed: 0.015, color: "#C4B5FD", nodeCount: 2, nodeSize: 2.5 },
  { rx: 160, ry: 55, tiltX: -35, tiltY: -30, tiltZ: 15, speed: -0.007, color: "#34D399", nodeCount: 3, nodeSize: 2 },
  { rx: 70, ry: 26, tiltX: 70, tiltY: 10, tiltZ: -40, speed: 0.018, color: "#F9A8D4", nodeCount: 2, nodeSize: 2 },
];

const TOTAL_NODES = RINGS.reduce((s, r) => s + r.nodeCount, 0);

export default function GalacticCore({ size = 360 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const animRef = useRef<number>(0);
  const prefersReduced = useRef(false);
  const nodesRef = useRef<OrbitingNode[]>([]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReduced.current = mq.matches;
  }, []);

  // Init nodes
  useEffect(() => {
    const nodes: OrbitingNode[] = [];
    let idx = 0;
    for (let ri = 0; ri < RINGS.length; ri++) {
      for (let ni = 0; ni < RINGS[ri].nodeCount; ni++) {
        nodes.push({
          ringIdx: ri,
          angle: (ni / RINGS[ri].nodeCount) * Math.PI * 2,
          speed: RINGS[ri].speed * (1 + (idx % 3) * 0.15),
        });
        idx++;
      }
    }
    nodesRef.current = nodes;
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

    // Precompute trails for each node (ring buffer of past positions)
    const trails: { x: number; y: number }[][] = Array.from({ length: TOTAL_NODES }, () => []);

    const animate = () => {
      ctx.clearRect(0, 0, size, size);
      const speedMult = isHovered ? 1.8 : 1;

      // ── Ambient glow ──
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.45);
      glow.addColorStop(0, "rgba(103, 232, 249, 0.04)");
      glow.addColorStop(0.4, "rgba(147, 197, 253, 0.02)");
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, size, size);

      // ── Draw orbital paths (visible lines) ──
      for (const ring of RINGS) {
        ctx.save();
        ctx.translate(cx, cy);
        // 3D rotation simulation via elliptical projection
        ctx.rotate((ring.tiltZ * Math.PI) / 180);

        // Draw the full ellipse path
        ctx.beginPath();
        ctx.ellipse(0, 0, ring.rx, ring.ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle = ring.color + "15";
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Dashed version for depth feel
        ctx.beginPath();
        ctx.ellipse(0, 0, ring.rx, ring.ry, 0, 0, Math.PI * 2);
        ctx.setLineDash([2, 6]);
        ctx.strokeStyle = ring.color + "0A";
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.restore();
      }

      // ── Update and draw nodes ──
      let nodeIdx = 0;
      for (let ri = 0; ri < RINGS.length; ri++) {
        const ring = RINGS[ri];
        for (let ni = 0; ni < ring.nodeCount; ni++) {
          const node = nodesRef.current[nodeIdx];
          node.angle += node.speed * speedMult;

          // Project 3D position onto 2D
          const rawX = Math.cos(node.angle) * ring.rx;
          const rawY = Math.sin(node.angle) * ring.ry;

          // Apply tilt rotations
          const tiltRadZ = (ring.tiltZ * Math.PI) / 180;
          const tiltRadX = (ring.tiltX * Math.PI) / 180;
          const tiltRadY = (ring.tiltY * Math.PI) / 180;

          // Z-rotation
          let x = rawX * Math.cos(tiltRadZ) - rawY * Math.sin(tiltRadZ);
          let y = rawX * Math.sin(tiltRadZ) + rawY * Math.cos(tiltRadZ);
          let z = 0;

          // X-rotation
          const y2 = y * Math.cos(tiltRadX) - z * Math.sin(tiltRadX);
          const z2 = y * Math.sin(tiltRadX) + z * Math.cos(tiltRadX);
          y = y2;
          z = z2;

          // Y-rotation
          const x2 = x * Math.cos(tiltRadY) + z * Math.sin(tiltRadY);
          const z3 = -x * Math.sin(tiltRadY) + z * Math.cos(tiltRadY);
          x = x2;

          const screenX = cx + x;
          const screenY = cy + y;
          // z for depth: affects size and opacity
          const depthScale = 0.7 + 0.3 * ((z2 + ring.rx) / (ring.rx * 2));
          const nodeAlpha = 0.4 + 0.6 * depthScale;

          // Store trail
          trails[nodeIdx].push({ x: screenX, y: screenY });
          if (trails[nodeIdx].length > 20) trails[nodeIdx].shift();

          // Draw trail
          if (trails[nodeIdx].length > 2) {
            ctx.beginPath();
            ctx.moveTo(trails[nodeIdx][0].x, trails[nodeIdx][0].y);
            for (let ti = 1; ti < trails[nodeIdx].length; ti++) {
              ctx.lineTo(trails[nodeIdx][ti].x, trails[nodeIdx][ti].y);
            }
            ctx.strokeStyle = ring.color + "18";
            ctx.lineWidth = ring.nodeSize * 0.5;
            ctx.lineCap = "round";
            ctx.stroke();
          }

          // Draw energy line from core to node
          const lineGrad = ctx.createLinearGradient(cx, cy, screenX, screenY);
          lineGrad.addColorStop(0, "transparent");
          lineGrad.addColorStop(0.3, ring.color + "06");
          lineGrad.addColorStop(0.7, ring.color + Math.round(nodeAlpha * 12).toString(16).padStart(2, "0"));
          lineGrad.addColorStop(1, ring.color + Math.round(nodeAlpha * 20).toString(16).padStart(2, "0"));
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(screenX, screenY);
          ctx.strokeStyle = lineGrad;
          ctx.lineWidth = 0.6;
          ctx.stroke();

          // Glow around node
          const glowGrad = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, ring.nodeSize * 4 * depthScale);
          glowGrad.addColorStop(0, ring.color + "30");
          glowGrad.addColorStop(1, "transparent");
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(screenX, screenY, ring.nodeSize * 4 * depthScale, 0, Math.PI * 2);
          ctx.fill();

          // Node sphere
          const ns = ring.nodeSize * depthScale;
          const sphereGrad = ctx.createRadialGradient(screenX - ns * 0.3, screenY - ns * 0.3, 0, screenX, screenY, ns);
          sphereGrad.addColorStop(0, "#FFFFFF");
          sphereGrad.addColorStop(0.3, ring.color);
          sphereGrad.addColorStop(1, ring.color + "40");
          ctx.beginPath();
          ctx.arc(screenX, screenY, ns, 0, Math.PI * 2);
          ctx.fillStyle = sphereGrad;
          ctx.globalAlpha = nodeAlpha;
          ctx.fill();
          ctx.globalAlpha = 1;

          nodeIdx++;
        }
      }

      // ── Core nucleus ──
      const pulse = 1 + Math.sin(Date.now() * 0.003) * 0.08;
      const coreR = 12 * pulse;

      // Outer corona
      const corona = ctx.createRadialGradient(cx, cy, coreR, cx, cy, coreR * 6);
      corona.addColorStop(0, "rgba(103, 232, 249, 0.08)");
      corona.addColorStop(0.5, "rgba(147, 197, 253, 0.03)");
      corona.addColorStop(1, "transparent");
      ctx.fillStyle = corona;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR * 6, 0, Math.PI * 2);
      ctx.fill();

      // Core glow
      const coreGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 2);
      coreGlow.addColorStop(0, "rgba(200, 230, 255, 0.12)");
      coreGlow.addColorStop(0.4, "rgba(103, 232, 249, 0.06)");
      coreGlow.addColorStop(1, "transparent");
      ctx.fillStyle = coreGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR * 2, 0, Math.PI * 2);
      ctx.fill();

      // Core sphere
      const coreGrad = ctx.createRadialGradient(cx - 3, cy - 3, 0, cx, cy, coreR);
      coreGrad.addColorStop(0, "rgba(220, 245, 255, 0.5)");
      coreGrad.addColorStop(0.5, "rgba(103, 232, 249, 0.3)");
      coreGrad.addColorStop(1, "rgba(103, 232, 249, 0.05)");
      ctx.beginPath();
      ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();

      // Core bright center
      const center = ctx.createRadialGradient(cx, cy, 0, cx, cy, 4);
      center.addColorStop(0, "rgba(255, 255, 255, 0.5)");
      center.addColorStop(1, "transparent");
      ctx.fillStyle = center;
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();

      if (!prefersReduced.current) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    if (prefersReduced.current) {
      animate();
    } else {
      animRef.current = requestAnimationFrame(animate);
    }

    return () => cancelAnimationFrame(animRef.current);
  }, [size, isHovered]);

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="img"
      aria-label="Atomic orbital escrow protection"
    >
      {/* Ambient nebula backdrop */}
      <div
        className="absolute rounded-full"
        style={{
          width: size * 1.8,
          height: size * 1.8,
          background: `radial-gradient(ellipse at 35% 35%, rgba(103, 232, 249, 0.03) 0%, transparent 50%),
                       radial-gradient(ellipse at 65% 65%, rgba(196, 181, 253, 0.02) 0%, transparent 50%)`,
        }}
      />

      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="relative z-10"
      />

      {/* Label */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20">
        <span className="text-[9px] font-mono font-semibold tracking-[5px] text-cyan-300/30">
          ESCROW PROTECTED
        </span>
      </div>
    </div>
  );
}
