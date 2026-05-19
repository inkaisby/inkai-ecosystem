"use client";
import { useAuth } from "@/context/AuthContext";

import { Award, Trophy, ChevronRight, ArrowLeft, Loader2, Lock } from "lucide-react";
import styles from "./Events.module.css";
import BottomNav from "@/components/BottomNav/BottomNav";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { eventApi, billingApi } from "@/lib/api";
import toast from "react-hot-toast";

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
  const [hasUnpaidDues, setHasUnpaidDues] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchEventsAndDues();
  }, []);

  const fetchEventsAndDues = async () => {
    setIsLoading(true);
    try {
      const [eventsRes, billingsRes] = await Promise.all([
        eventApi.getEvents(),
        billingApi.getMyBillings().catch(() => ({ data: { status: "error", data: [] } }))
      ]);

      if (eventsRes.data.status === "success") {
        setEvents(eventsRes.data.data ?? []);
      }

      // Check if user has unpaid monthly dues for the current month or earlier
      if (billingsRes.data?.status === "success" && !isAdmin) {
        const list = billingsRes.data.data || [];
        const now = new Date();
        const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const unpaid = list.some((b: any) => {
          if (b.type !== "MONTHLY_IURAN") return false;
          if (b.status === "PAID") return false;
          
          const dueDate = new Date(b.dueDate);
          const startOfBillMonth = new Date(dueDate.getFullYear(), dueDate.getMonth(), 1);
          
          // Must be current month or earlier
          return startOfBillMonth.getTime() <= startOfCurrentMonth.getTime();
        });

        // Check if member has allowEventWithoutDues exemption
        const hasExemption = user?.member?.allowEventWithoutDues;
        setHasUnpaidDues(unpaid && !hasExemption);
      }
    } catch (error) {
      console.error("Fetch events & dues error:", error);
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
        onClick={() => {
          if (hasUnpaidDues) {
            toast.error("Pendaftaran diblokir. Silakan lunasi iuran bulanan terlebih dahulu.");
            router.push("/billing");
            return;
          }
          router.push(`/events/${event.id}`);
        }}
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
        {hasUnpaidDues && (
          <div 
            className="p-4 rounded-2xl border border-red-500/20 bg-red-500/[0.03] space-y-3 mb-6 animate-in fade-in slide-in-from-top-4 duration-500 cursor-pointer"
            onClick={() => router.push("/billing")}
            role="button"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                <Lock size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-black text-white uppercase tracking-wide">
                  AKSES KEGIATAN TERKUNCI
                </h4>
                <p className="text-[10px] text-red-300/80 mt-0.5 leading-snug">
                  Anda memiliki tunggakan iuran bulanan yang belum dilunasi untuk bulan ini.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="w-full py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all"
            >
              Bayar Iuran Bulanan Sekarang
            </button>
          </div>
        )}

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
