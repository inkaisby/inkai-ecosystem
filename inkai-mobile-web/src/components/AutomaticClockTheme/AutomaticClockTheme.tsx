"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Jam 12:00 siang sampai jam 23:59:59 → malam (gelap). AM → siang untuk area selain admin. */
export function computeClockPhaseForPath(pathname: string): "day" | "night" {
  if (pathname.startsWith("/admin")) return "night";
  const h = new Date().getHours();
  return h >= 12 ? "night" : "day";
}

export function applyClockPhaseToDocument(pathname: string) {
  const phase = computeClockPhaseForPath(pathname);
  document.documentElement.setAttribute("data-clock-phase", phase);
  document.documentElement.style.colorScheme =
    phase === "day" ? "light" : "dark";

  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", phase === "day" ? "#f4f6f8" : "#0a0a0c");
}

export function msUntilNextClockBoundary(now: Date = new Date()): number {
  const h = now.getHours();
  const boundary = new Date(now.getTime());
  if (h < 12) {
    boundary.setHours(12, 0, 0, 0);
  } else {
    boundary.setDate(boundary.getDate() + 1);
    boundary.setHours(0, 0, 0, 0);
  }
  return Math.max(boundary.getTime() - now.getTime(), 1000);
}

export default function AutomaticClockTheme() {
  const pathname = usePathname() ?? "";

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const tick = () => {
      applyClockPhaseToDocument(pathname);
      if (cancelled) return;
      timeoutId = setTimeout(tick, msUntilNextClockBoundary());
    };

    tick();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [pathname]);

  return null;
}
