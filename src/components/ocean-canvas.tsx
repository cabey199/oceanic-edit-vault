import { motion, useReducedMotion, useTransform, type MotionValue } from "framer-motion";

import tidalStudy from "@/assets/tidal-study.jpg";

export function OceanCanvas({
  theme,
  scrollY,
}: {
  theme: "calm" | "night";
  scrollY: MotionValue<number>;
}) {
  const reduceMotion = useReducedMotion();
  const parallaxY = useTransform(scrollY, [0, 3000], [0, -90]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.img
        src={tidalStudy}
        alt=""
        aria-hidden="true"
        className="absolute inset-[-8%] h-[116%] w-[116%] object-cover"
        style={{
          y: parallaxY,
          filter: theme === "calm"
            ? "brightness(1.18) saturate(.82)"
            : "brightness(.56) contrast(1.18) saturate(1.16)",
        }}
        animate={reduceMotion ? false : {
          scale: theme === "night" ? [1.04, 1.14, 1.04] : [1.02, 1.07, 1.02],
          x: theme === "night" ? [0, -18, 14, 0] : [0, -7, 6, 0],
        }}
        transition={{
          duration: theme === "night" ? 10 : 30,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      />
      <div className={`absolute inset-0 ${theme === "night" ? "bg-slate-950/50" : "bg-cyan-950/15"}`} />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,18,.18)_0%,rgba(3,7,18,.12)_42%,rgba(3,7,18,.64)_100%)]" />
    </div>
  );
}
