import { useEffect, useRef } from "react";
import type { MotionValue } from "framer-motion";

export function OceanCanvas({
  theme,
  scrollY,
}: {
  theme: "calm" | "night";
  scrollY: MotionValue<number>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const storm = theme === "night";
    let frame = 0;
    let width = 0;
    let height = 0;
    let pixelRatio = 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const draw = (time = 0) => {
      context.clearRect(0, 0, width, height);
      const background = context.createLinearGradient(0, 0, 0, height);
      if (storm) {
        background.addColorStop(0, "rgba(30, 41, 59, 0.5)");
        background.addColorStop(0.48, "rgba(3, 7, 18, 0.48)");
        background.addColorStop(1, "rgba(3, 7, 18, 0.52)");
      } else {
        background.addColorStop(0, "rgba(6, 182, 212, 0.2)");
        background.addColorStop(0.48, "rgba(15, 23, 42, 0.14)");
        background.addColorStop(1, "rgba(15, 23, 42, 0.32)");
      }
      context.fillStyle = background;
      context.fillRect(0, 0, width, height);

      const travel = scrollY.get() * (storm ? 0.006 : 0.002);
      const speed = storm ? 0.00046 : 0.00014;
      const timePhase = time * speed + travel;
      const waveCount = storm ? 21 : 14;
      const waveHeight = storm ? 1.9 : 1;
      for (let band = 0; band < waveCount; band += 1) {
        const baseY = height * (0.08 + band * (storm ? 0.046 : 0.068));
        const amplitude = (storm ? 30 + band * 3.2 : 11 + band * 2) * waveHeight;
        const gradient = context.createLinearGradient(0, baseY - amplitude, 0, baseY + amplitude * 2);
        gradient.addColorStop(0, `rgba(72, 202, 228, ${storm ? 0.13 - band * 0.003 : 0.08 - band * 0.002})`);
        gradient.addColorStop(0.45, `rgba(0, 119, 182, ${storm ? 0.09 - band * 0.002 : 0.045 - band * 0.001})`);
        gradient.addColorStop(1, "rgba(6, 10, 23, 0)");
        context.beginPath();
        context.moveTo(-40, height);
        context.lineTo(-40, baseY);
        for (let x = -40; x <= width + 40; x += storm ? 12 : 20) {
          const swell = Math.sin(x * (storm ? 0.011 : 0.006) + timePhase * (1.1 + band * 0.07) + band * 0.65) * amplitude;
          const chop = Math.sin(x * (storm ? 0.033 : 0.012) - timePhase * 1.6 + band * 1.7) * amplitude * (storm ? 0.72 : 0.24);
          const crossCurrent = storm ? Math.sin(x * 0.019 + timePhase * 2.2 + band) * amplitude * 0.4 : 0;
          const y = baseY + swell + chop + crossCurrent;
          context.lineTo(x, y);
        }
        context.lineTo(width + 40, height);
        context.closePath();
        context.fillStyle = gradient;
        context.fill();
      }

      const glow = context.createRadialGradient(width * 0.64, height * 0.18, 0, width * 0.64, height * 0.18, width * 0.52);
      glow.addColorStop(0, storm ? "rgba(34, 211, 238, 0.18)" : "rgba(72, 202, 228, 0.16)");
      glow.addColorStop(0.38, storm ? "rgba(14, 116, 144, 0.1)" : "rgba(0, 119, 182, 0.06)");
      glow.addColorStop(1, "rgba(6, 10, 23, 0)");
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);

      if (!reduceMotion) frame = window.requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(frame);
    };
  }, [scrollY, theme]);

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />;
}
