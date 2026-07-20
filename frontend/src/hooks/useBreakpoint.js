import { useState, useEffect } from "react";
import { BP } from "../styles/breakpoints";
function classify(w) {
  return { isMobile: w <= BP.mobile, isTablet: w > BP.mobile && w <= BP.tablet, isDesktop: w > BP.tablet };
}
function useBreakpoint() {
  const [bp, setBp] = useState(() => classify(typeof window !== "undefined" ? window.innerWidth : 1280));
  useEffect(() => {
    const handler = () => setBp(classify(window.innerWidth));
    window.addEventListener("resize", handler, { passive: true });
    return () => window.removeEventListener("resize", handler);
  }, []);
  return bp;
}
export {
  useBreakpoint
};
