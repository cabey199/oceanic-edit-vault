import { useEffect, useRef } from "react";

export function OceanCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
      background.addColorStop(0, "#071528");
      background.addColorStop(0.48, "#06101f");
      background.addColorStop(1, "#060a17");
      context.fillStyle = background;
      context.fillRect(0, 0, width, height);

      const seconds = time * 0.00018;
      for (let band = 0; band < 13; band += 1) {
        const baseY = height * (0.12 + band * 0.062);
        const amplitude = 14 + band * 2.8;
        const gradient = context.createLinearGradient(0, baseY - amplitude, 0, baseY + amplitude * 2);
        gradient.addColorStop(0, `rgba(72, 202, 228, ${0.09 - band * 0.003})`);
        gradient.addColorStop(0.45, `rgba(0, 119, 182, ${0.055 - band * 0.002})`);
        gradient.addColorStop(1, "rgba(6, 10, 23, 0)");
        context.beginPath();
        context.moveTo(-40, height);
        context.lineTo(-40, baseY);
        for (let x = -40; x <= width + 40; x += 18) {
          const y = baseY
            + Math.sin(x * 0.008 + seconds * (1.25 + band * 0.05) + band * 0.65) * amplitude
            + Math.sin(x * 0.017 - seconds * 0.8 + band) * amplitude * 0.38;
          context.lineTo(x, y);
        }
        context.lineTo(width + 40, height);
        context.closePath();
        context.fillStyle = gradient;
        context.fill();
      }

      const glow = context.createRadialGradient(width * 0.64, height * 0.18, 0, width * 0.64, height * 0.18, width * 0.52);
      glow.addColorStop(0, "rgba(72, 202, 228, 0.13)");
      glow.addColorStop(0.38, "rgba(0, 119, 182, 0.05)");
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
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />;
}