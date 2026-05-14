"use client";
import { useAuth } from "@/context/AuthContext";

import { Award, Trophy, ChevronRight, ArrowLeft, Loader2, Lock } from "lucide-react";
import styles from "./Events.module.css";
import BottomNav from "@/components/BottomNav/BottomNav";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { eventApi } from "@/lib/api";

export default function Events() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [events, setEvents] = useState<
    Array<{
      id: string;
      title: string;
      startDate: string;
      endDate?: string;
      location?: string;
      branch?: { id: string; name: string; city?: string | null } | null;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await eventApi.getEvents();
      if (response.data.status === "success") {
        setEvents(response.data.data ?? []);
      }
    } catch (error) {
      console.error("Fetch events error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    const upcomingList: typeof events = [];
    const pastList: typeof events = [];
    for (const e of events) {
      const end = e.endDate ? new Date(e.endDate).getTime() : 0;
      if (!e.endDate || end >= now) upcomingList.push(e);
      else pastList.push(e);
    }
    upcomingList.sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );
    pastList.sort(
      (a, b) =>
        new Date(b.endDate || b.startDate).getTime() -
        new Date(a.endDate || a.startDate).getTime(),
    );
    return { upcoming: upcomingList, past: pastList };
  }, [events]);

  const renderEventCard = (
    event: (typeof events)[0],
    options?: { subdued?: boolean },
  ) => {
    const isUKT =
      event.title?.toUpperCase().includes("UKT") ||
      event.title?.toUpperCase().includes("UJIAN");
    const locality =
      event.branch?.name ||
      event.branch?.city ||
      event.location ||
      "Indonesia";
    return (
      <div
        key={event.id}
        className={`${styles.eventCard} ${options?.subdued ? styles.eventCardPast : ""}`}
        onClick={() => router.push(`/events/${event.id}`)}
      >
        <div
          className={`${styles.iconWrapper} ${isUKT ? styles.ukt : styles.tourney}`}
        >
          {isUKT ? <Award size={24} /> : <Trophy size={24} />}
        </div>
        <div className={styles.info}>
          <h3 className={styles.eventTitle}>{event.title}</h3>
          <p className={styles.meta}>
            {locality} •{" "}
            {new Date(event.startDate).toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        <ChevronRight size={16} className={styles.chevron} />
      </div>
    );
  };

  if (!mounted) return null;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.backBtn}>
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.title}>Agenda Kegiatan</h1>
      </header>

      <section className={styles.listSection}>
        {!user?.nia && !isAdmin ? (
          <div className={styles.lockedState}>
            <Lock size={48} className={styles.lockedIcon} />
            <p className={styles.lockedText}>
              Agenda kegiatan belum dapat diakses.
              <br />
              Tunggu sampai <b>NIA</b> Anda aktif untuk dapat mengikuti kegiatan
              INKAI.
            </p>
          </div>
        ) : isLoading ? (
          <div className={styles.loadingWrapper}>
            <Loader2 className={styles.spinner} size={32} />
          </div>
        ) : (
          <>
            <div className={styles.subsection}>
              <h2 className={styles.subsectionTitle}>Akan datang</h2>
              {upcoming.length > 0 ? (
                upcoming.map((ev) => renderEventCard(ev))
              ) : (
                <div className={styles.emptySub}>
                  Tidak ada agenda mendatang untuk wilayah Anda.
                </div>
              )}
            </div>

            <div className={styles.subsection}>
              <h2 className={styles.subsectionTitle}>Riwayat acara</h2>
              {past.length > 0 ? (
                past.map((ev) => renderEventCard(ev, { subdued: true }))
              ) : (
                <div className={styles.emptySub}>
                  Belum ada acara yang selesai di daftar wilayah Anda.
                </div>
              )}
            </div>
          </>
        )}
      </section>

      <div style={{ height: "100px" }} />
      <BottomNav />
    </div>
  );
}
