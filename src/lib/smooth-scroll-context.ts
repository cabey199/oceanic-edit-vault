import { createContext } from "react";
import type Lenis from "lenis";

export const SmoothScrollContext = createContext<Lenis | null>(null);
