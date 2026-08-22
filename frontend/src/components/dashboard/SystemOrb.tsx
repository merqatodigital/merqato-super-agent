import { useEffect, useRef } from "react";
import orbSrc from "../../assets/system-orb.png";
import waveSrc from "../../assets/wave-field.png";

export function SystemOrb({ sync = 100 }: { sync?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const particles = Array.from({ length: 420 }, (_, i) => {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      return {
        theta,
        phi,
        r: 0.78 + Math.random() * 0.22,
        size: i % 17 === 0 ? 1.6 : 0.7 + Math.random() * 0.8,
        speed: 0.0012 + Math.random() * 0.0018,
      };
    });

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = (t: number) => {
      if (!running) return;
      const { width, height } = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height / 2 + 4;
      const radius = Math.min(width, height) * 0.28;

      ctx.save();
      ctx.globalAlpha = 0.55;
      const halo = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 2.2);
      halo.addColorStop(0, "rgba(46,230,214,0.18)");
      halo.addColorStop(0.45, "rgba(20,120,130,0.08)");
      halo.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      const rot = t * 0.00022;
      for (const p of particles) {
        const theta = p.theta + rot * (0.6 + p.speed * 80);
        const phi = p.phi;
        const x3 = Math.sin(phi) * Math.cos(theta) * p.r;
        const y3 = Math.cos(phi) * p.r;
        const z3 = Math.sin(phi) * Math.sin(theta) * p.r;
        const depth = (z3 + 1) / 2;
        const x = cx + x3 * radius * 1.15;
        const y = cy + y3 * radius * 1.15;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${160 + depth * 80}, ${230}, ${220}, ${0.15 + depth * 0.75})`;
        ctx.arc(x, y, p.size * (0.5 + depth), 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="relative flex h-full min-h-[220px] w-full items-center justify-center overflow-hidden">
      <img
        src={waveSrc}
        alt=""
        className="pointer-events-none absolute inset-x-[-8%] top-1/2 h-[70%] w-[116%] -translate-y-1/2 object-cover opacity-70 mix-blend-screen animate-wave"
      />
      <div className="pointer-events-none absolute inset-0">
        <svg className="h-full w-full" viewBox="0 0 800 280" preserveAspectRatio="none">
          <path
            d="M0 140 C 80 90, 140 190, 220 140 S 360 70, 400 140 S 520 210, 580 140 S 700 80, 800 140"
            fill="none"
            stroke="rgba(46,230,214,0.28)"
            strokeWidth="1.2"
            style={{ strokeDasharray: "8 10", animation: "dash-move 8s linear infinite" }}
          />
          <path
            d="M0 150 C 90 200, 150 110, 240 150 S 370 210, 410 150 S 530 90, 600 150 S 710 200, 800 150"
            fill="none"
            stroke="rgba(126,246,234,0.18)"
            strokeWidth="1"
            style={{ strokeDasharray: "5 12", animation: "dash-move 11s linear infinite reverse" }}
          />
        </svg>
      </div>

      <div className="relative h-[210px] w-[210px] sm:h-[240px] sm:w-[240px]">
        <div className="absolute inset-[-18%] rounded-full bg-cyan/10 blur-3xl animate-orb-pulse" />
        <div className="animate-orb-spin-slow absolute inset-[-6%] rounded-full border border-cyan/20" />
        <div className="animate-orb-spin-rev absolute inset-[4%] rounded-full border border-dashed border-cyan/25" />
        <div className="animate-orb-spin absolute inset-[14%] rounded-full border border-cyan/15" />
        <img
          src={orbSrc}
          alt="System orb"
          className="animate-core absolute inset-[8%] h-[84%] w-[84%] rounded-full object-cover mix-blend-screen"
        />
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
        <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan shadow-[0_0_18px_#2ee6d6]" />
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
          <div
            className="absolute left-0 right-0 h-10 bg-gradient-to-b from-transparent via-cyan/20 to-transparent"
            style={{ animation: "scanline 5.5s linear infinite" }}
          />
        </div>
      </div>

      <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-3 text-[10px] tracking-[0.28em] text-muted">
        <span>SYSTEM SYNC</span>
        <span className="text-cyan text-cyan-glow">{sync}%</span>
      </div>
    </div>
  );
}
