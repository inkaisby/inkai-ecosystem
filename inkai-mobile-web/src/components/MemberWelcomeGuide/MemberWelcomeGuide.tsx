"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import {
  fetchMemberGuideResolved,
  guideIsActive,
  type MemberWelcomeGuideJson,
} from "@/lib/memberGuide";
import styles from "./MemberWelcomeGuide.module.css";

const STORAGE_KEY = "inkai_member_welcome_seen_version";

function isMemberAppPath(pathname: string): boolean {
  if (pathname === "/" || pathname.startsWith("/register")) return false;
  if (pathname.startsWith("/admin")) return false;
  if (pathname.startsWith("/v/")) return false;
  return true;
}

export type { MemberWelcomeGuideJson };

export default function MemberWelcomeGuide() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [guide, setGuide] = useState<MemberWelcomeGuideJson | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchMemberGuideResolved().then((g) => {
      if (!cancelled) setGuide(g);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const guideActive = guide ? guideIsActive(guide) : false;

  useEffect(() => {
    if (!mounted || isLoading || !guide || !guideActive) return;
    if (!isAuthenticated || isAdmin) return;
    if (!isMemberAppPath(pathname)) return;

    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (seen === guide.version) return;
    } catch {
      return;
    }

    setOpen(true);
  }, [mounted, isLoading, isAuthenticated, isAdmin, pathname, guide, guideActive]);

  const dismiss = useCallback(() => {
    if (!guide) return;
    try {
      localStorage.setItem(STORAGE_KEY, guide.version);
    } catch {
      /* ignore */
    }
    setOpen(false);
  }, [guide]);

  const goFullGuide = useCallback(() => {
    if (!guide) return;
    const path = guide.fullGuidePath || "/guide";
    dismiss();
    router.push(path);
  }, [dismiss, router, guide]);

  if (!mounted || !guide || !guideActive) return null;

  const primaryLabel = guide.primaryCtaLabel ?? "Mengerti";
  const secondaryLabel = guide.fullGuideLinkLabel ?? "Buka halaman panduan";
  const showSecondary = Boolean(guide.fullGuidePath);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            role="presentation"
            aria-hidden
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismiss}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="member-welcome-title"
            className={styles.sheet}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            <div className={styles.handle} aria-hidden />
            <div className={styles.header}>
              <h2 id="member-welcome-title" className={styles.title}>
                {guide.title}
              </h2>
              {guide.subtitle ? (
                <p className={styles.subtitle}>{guide.subtitle}</p>
              ) : null}
            </div>
            <div className={styles.scroll}>
              {guide.items.map((item, i) => (
                <div key={`${item.heading}-${i}`} className={styles.item}>
                  <div className={styles.itemHeading}>{item.heading}</div>
                  <p className={styles.itemText}>{item.text}</p>
                </div>
              ))}
              {guide.footer ? (
                <p className={styles.footerNote}>{guide.footer}</p>
              ) : null}
            </div>
            <div className={styles.actions}>
              <button type="button" className={styles.primaryBtn} onClick={dismiss}>
                {primaryLabel}
              </button>
              {showSecondary ? (
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={goFullGuide}
                >
                  {secondaryLabel}
                </button>
              ) : null}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
