"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);
  const visibilityTriggerHeight = 300 // in px

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > visibilityTriggerHeight);
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Button
      onClick={scrollToTop}
      size="icon"
      variant="default"
      className={`fixed bottom-4 right-4 z-50 transition-opacity rounded-full shadow-lg ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      aria-label="Scroll to top"
    >
      <ArrowUp />
    </Button>
  );
}
