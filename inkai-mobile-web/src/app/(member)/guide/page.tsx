"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import BottomNav from "@/components/BottomNav/BottomNav";
import guideData from "@guide/member-welcome.json";
import type { MemberWelcomeGuideJson } from "@/components/MemberWelcomeGuide/MemberWelcomeGuide";
import styles from "./Guide.module.css";

const guide = guideData as MemberWelcomeGuideJson;

export default function GuidePage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading, isAdmin } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || isAuthLoading) return;
    if (!user) router.replace("/");
    else if (isAdmin) router.replace("/admin");
  }, [mounted, isAuthLoading, user, isAdmin, router]);

  if (!mounted || isAuthLoading || !user || isAdmin) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={40} />
      </div>
    );
  }

  if (guide.enabled === false) {
    return (
      <div className={styles.container}>
        <div className={styles.inner}>
          <header className={styles.header}>
            <button
              type="button"
              onClick={() => router.back()}
              className={styles.backBtn}
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className={styles.title}>Panduan</h1>
          </header>
          <div className={styles.content}>
            <p className={styles.lead}>Panduan sementara tidak tersedia.</p>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <button
            type="button"
            onClick={() => router.back()}
            className={styles.backBtn}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className={styles.title}>Panduan</h1>
        </header>

        <div className={styles.content}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <BookOpen size={22} color="var(--primary-gold)" aria-hidden />
            <span style={{ fontWeight: 800, fontSize: "1.125rem", color: "var(--text-light)" }}>
              {guide.title}
            </span>
          </div>
          {guide.subtitle ? <p className={styles.lead}>{guide.subtitle}</p> : null}

          {guide.items.map((item, i) => (
            <div key={`${item.heading}-${i}`} className={styles.item}>
              <div className={styles.itemHeading}>{item.heading}</div>
              <p className={styles.itemText}>{item.text}</p>
            </div>
          ))}

          {guide.footer ? <p className={styles.footer}>{guide.footer}</p> : null}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
