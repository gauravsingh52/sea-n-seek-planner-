import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

interface ScrollToTopProps {
  scrollRef: React.RefObject<HTMLDivElement>;
}

export function ScrollToTop({ scrollRef }: ScrollToTopProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const viewport = el.querySelector("[data-radix-scroll-area-viewport]") as HTMLElement;
    if (!viewport) return;

    const handleScroll = () => {
      setVisible(viewport.scrollTop > 300);
    };

    viewport.addEventListener("scroll", handleScroll);
    return () => viewport.removeEventListener("scroll", handleScroll);
  }, [scrollRef]);

  const scrollToTop = () => {
    const el = scrollRef.current;
    if (!el) return;
    const viewport = el.querySelector("[data-radix-scroll-area-viewport]") as HTMLElement;
    viewport?.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="absolute bottom-20 right-4 z-20 w-10 h-10 rounded-full glass-strong flex items-center justify-center text-foreground hover:scale-110 transition-all duration-300 shadow-lg animate-slide-up-fade"
    >
      <ArrowUp className="w-4 h-4" />
    </button>
  );
}
