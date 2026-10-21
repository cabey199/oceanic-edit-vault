import { useContext } from "react";

import { SmoothScrollContext } from "@/lib/smooth-scroll-context";

export function useSmoothScroll() {
  return useContext(SmoothScrollContext);
}
