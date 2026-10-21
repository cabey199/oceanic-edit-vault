import Lenis from "lenis";
import { useEffect, useState, type ReactNode } from "react";

import { SmoothScrollContext } from "@/lib/smooth-scroll-context";

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    const instance = new Lenis({
      autoRaf: true,
      smoothWheel: true,
      syncTouch: false,
      anchors: true,
      respectReducedMotion: true,
      prevent: (node) =>
        Boolean(
          node.closest(
            'input, textarea, select, [contenteditable="true"], .ios-login-page, [role="dialog"], [data-native-scroll]',
          ),
        ),
    });

    setLenis(instance);
    return () => instance.destroy();
  }, []);

  return <SmoothScrollContext.Provider value={lenis}>{children}</SmoothScrollContext.Provider>;
}
