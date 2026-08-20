import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const scrollPositions = new Map<string, number>();

export function useScrollRestoration() {
  const location = useLocation();
  const navType = useNavigationType(); // "POP", "PUSH", "REPLACE"
  const prevPathRef = useRef<string>(location.pathname);

  // Save scroll position before leaving current route
  useEffect(() => {
    const handleScroll = () => {
      scrollPositions.set(location.pathname, window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [location.pathname]);

  // Restore scroll position or scroll to top
  useEffect(() => {
    if (navType === "POP") {
      // User clicked Back / Forward
      const savedPos = scrollPositions.get(location.pathname) || 0;
      // Delay slightly for DOM render
      const timer = setTimeout(() => {
        window.scrollTo({
          top: savedPos,
          behavior: "instant" as ScrollBehavior,
        });
      }, 50);
      return () => clearTimeout(timer);
    } else {
      // User navigated forward
      window.scrollTo({
        top: 0,
        behavior: "instant" as ScrollBehavior,
      });
    }
    prevPathRef.current = location.pathname;
  }, [location.pathname, navType]);
}
