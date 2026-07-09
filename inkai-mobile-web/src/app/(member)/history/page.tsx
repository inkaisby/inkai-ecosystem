"use client";

import { useAuth } from "@/context/AuthContext";
import { Award, Trophy, ChevronRight, ArrowLeft, Loader2, Calendar } from "lucide-react";
import styles from "./HistoryPage.module.css";
import BottomNav from "@/components/BottomNav/BottomNav";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { eventApi } from "@/lib/api";
import { formatEventPelaksanaan } from "@/lib/formatEventPelaksanaan";

type RegistrationBadgeVariant = "paid" | "approved" | "pending" | "rejected";

function registrationStatusPresentation(
  status: string | undefined,
): { label: string; variant: RegistrationBadgeVariant } | null {
  if (!status) return null;
  switch (status.trim().toUpperCase()) {
    case "PAID":
      return { label: "LUNAS", variant: "paid" };
    case "SUCCESS":
    case "APPROVED":
      return { label: "DISETUJUI", variant: "approved" };
    case "PENDING":
      return { label: "PENDING", variant: "pending" };
    case "REJECTED":
      return { label: "DITOLAK", variant: "rejected" };
    default:
      return { label: status, variant: "pending" };
  }
}

export default function HistoryPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  useEffect(() => {
    setMounted(true);
    if (user) {
      fetchMyEvents();
    }
  }, [user]);

  const fetchMyEvents = async () => {
    setIsLoadingEvents(true);
    try {
      const response = await eventApi.getMyEvents();
      if (response.data.status === "success") {
        setMyEvents(response.data.data ?? []);
      }
    } catch (error) {
      console.error("Fetch my events error:", error);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const renderEventCard = (event: any) => {
    const isUKT =
      event.title?.toUpperCase().includes("UKT") ||
      event.title?.toUpperCase().includes("UJIAN");
    const locality =
      event.branch?.name ||
      event.branch?.city ||
      event.location ||
      "Indonesia";

    const regBadge = registrationStatusPresentation(event.registrationStatus);

    return (
      <div
        key={event.id}
        className={styles.eventCard}
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
            {formatEventPelaksanaan(event.startDate, event.endDate)} • {locality}
          </p>
          {regBadge && (
            <span className={`${styles.statusBadge} ${styles[regBadge.variant]}`}>
              {regBadge.label}
            </span>
          )}
        </div>
        <ChevronRight size={16} className={styles.chevron} />
      </div>
    );
  };

  if (!mounted || isLoading || !user) {
    return (
      <div className={styles.loadingWrapper}>
        <Loader2 className={styles.spinner} size={40} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => router.push("/dashboard")} className={styles.backBtn}>
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.title}>Riwayat Kegiatan Saya</h1>
      </header>

      <section className={styles.listSection}>
        {isLoadingEvents ? (
          <div className={styles.loadingWrapper}>
            <Loader2 className={styles.spinner} size={32} />
          </div>
        ) : myEvents.length > 0 ? (
          myEvents.map((ev) => renderEventCard(ev))
        ) : (
          <div className={styles.emptyState}>
            <Calendar size={48} className={styles.emptyIcon} />
            <span>Belum ada riwayat pendaftaran kegiatan.</span>
          </div>
        )}
      </section>

      <div style={{ height: "100px" }} />
      <BottomNav />
    </div>
  );
}
