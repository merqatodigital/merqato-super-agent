import { useEffect, useState } from "react";

export function useBreakpoint() {
  const [width, setWidth] = useState(() => (typeof window === "undefined" ? 1440 : window.innerWidth));

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return {
    width,
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1280,
    isLaptop: width >= 1280 && width < 1600,
    isDesktop: width >= 1280,
  };
}
