"use client";

import { useEffect } from "react";

/** Tema siang: 06:00–17:59 (jam lokal perangkat). Malam: 18:00–05:59 — anggota & admin. */
export function computeClockPhase(): "day" | "night" {
  const h = new Date().getHours();
  return h >= 6 && h < 18 ? "day" : "night";
}

export function applyClockPhaseToDocument() {
  const phase = computeClockPhase();
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
  if (h < 6) {
    boundary.setHours(6, 0, 0, 0);
  } else if (h < 18) {
    boundary.setHours(18, 0, 0, 0);
  } else {
    boundary.setDate(boundary.getDate() + 1);
    boundary.setHours(6, 0, 0, 0);
  }
  return Math.max(boundary.getTime() - now.getTime(), 1000);
}

export default function AutomaticClockTheme() {
  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const tick = () => {
      applyClockPhaseToDocument();
      if (cancelled) return;
      timeoutId = setTimeout(tick, msUntilNextClockBoundary());
    };

    tick();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  return null;
}
