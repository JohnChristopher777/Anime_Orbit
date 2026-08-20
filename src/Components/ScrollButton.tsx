import React, { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";

export const ScrollButton: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const toggleVisible = () => {
      const scrolled = document.documentElement.scrollTop || window.scrollY;
      setVisible(scrolled > 300);
    };

    window.addEventListener("scroll", toggleVisible, { passive: true });
    return () => window.removeEventListener("scroll", toggleVisible);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-[#ffd700] hover:bg-[#ffea00] text-black shadow-[0_4px_20px_rgba(255,215,0,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200"
    >
      <ChevronUp size={24} strokeWidth={3} />
    </button>
  );
};

export default ScrollButton;
