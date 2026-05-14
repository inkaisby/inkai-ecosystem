"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, BookOpen, SquarePen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import BottomNav from "@/components/BottomNav/BottomNav";
import {
  fetchMemberGuideResolved,
  guideIsActive,
  type MemberWelcomeGuideJson,
} from "@/lib/memberGuide";
import styles from "./Guide.module.css";

export default function GuidePage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading, isAdmin } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [guide, setGuide] = useState<MemberWelcomeGuideJson | null>(null);

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

  useEffect(() => {
    if (!mounted || isAuthLoading) return;
    if (!user) router.replace("/");
  }, [mounted, isAuthLoading, user, router]);

  const displayName =
    user?.fullName ||
    (user?.email ? String(user.email).split("@")[0] : null) ||
    "Pengguna";

  const sessionPanel = user ? (
    <div className={styles.sessionBar}>
      <div className={styles.sessionRow}>
        <div>
          <div className={styles.sessionLabel}>Sedang login</div>
          <div className={styles.sessionName}>{displayName}</div>
          {user.email ? (
            <div className={styles.sessionEmail}>{user.email}</div>
          ) : null}
          {user.nia ? (
            <div className={styles.sessionEmail}>NIA: {user.nia}</div>
          ) : null}
          <span
            className={
              isAdmin
                ? styles.sessionRole
                : `${styles.sessionRole} ${styles.sessionRoleMember}`
            }
          >
            {isAdmin ? "Administrator" : "Anggota"}
          </span>
        </div>
        {isAdmin ? (
          <button
            type="button"
            className={styles.editGuideBtn}
            onClick={() => router.push("/admin/guide")}
          >
            <SquarePen size={16} aria-hidden />
            Edit panduan
          </button>
        ) : null}
      </div>
      {!isAdmin ? (
        <p className={styles.editHint}>
          Pengeditan teks panduan hanya untuk administrator (menu Admin → Panduan
          Anggota).
        </p>
      ) : null}
    </div>
  ) : null;

  if (!mounted || isAuthLoading || !user) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={40} />
      </div>
    );
  }

  if (!guide) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={40} />
      </div>
    );
  }

  if (!guideIsActive(guide)) {
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
            {sessionPanel}
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
          {sessionPanel}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 8,
            }}
          >
            <BookOpen size={22} color="var(--primary-gold)" aria-hidden />
            <span
              style={{
                fontWeight: 800,
                fontSize: "1.125rem",
                color: "var(--text-light)",
              }}
            >
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
