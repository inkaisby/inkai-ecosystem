"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import styles from "./ScrollButtons.module.css";

export default function ScrollButtons({ compact = false }: { compact?: boolean }) {
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  useEffect(() => {
    const update = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      setCanScrollUp(scrollY > 80);
      setCanScrollDown(scrollY < maxScroll - 80);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const scrollByViewport = (direction: "up" | "down") => {
    const amount = window.innerHeight * 0.75 * (direction === "up" ? -1 : 1);
    window.scrollBy({ top: amount, behavior: "smooth" });
  };

  return (
    <div
      className={`${styles.wrap} ${compact ? styles.wrapCompact : ""}`}
      aria-label="Navigasi scroll"
    >
      <button
        type="button"
        className={`${styles.btn} ${!canScrollUp ? styles.btnHidden : ""}`}
        onClick={() => scrollByViewport("up")}
        aria-label="Scroll ke atas"
        tabIndex={canScrollUp ? 0 : -1}
      >
        <ChevronUp size={18} strokeWidth={2.5} />
      </button>
      <button
        type="button"
        className={`${styles.btn} ${!canScrollDown ? styles.btnHidden : ""}`}
        onClick={() => scrollByViewport("down")}
        aria-label="Scroll ke bawah"
        tabIndex={canScrollDown ? 0 : -1}
      >
        <ChevronDown size={18} strokeWidth={2.5} />
      </button>
    </div>
  );
}
