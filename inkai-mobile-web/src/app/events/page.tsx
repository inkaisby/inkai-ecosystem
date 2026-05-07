"use client";

import { Award, Trophy, ChevronRight, ArrowLeft, Loader2 } from "lucide-react";
import styles from "./Events.module.css";
import BottomNav from "@/components/BottomNav/BottomNav";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { eventApi } from "@/lib/api";

export default function Events() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await eventApi.getEvents();
      if (response.data.status === 'success') {
        setEvents(response.data.data);
      }
    } catch (error) {
      console.error("Fetch events error:", error);
    } finally {
      setIsLoading(false);
    }
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
        {isLoading ? (
          <div className={styles.loadingWrapper}><Loader2 className={styles.spinner} size={32} /></div>
        ) : events.length > 0 ? (
          events.map((event, i) => {
            const isUKT = event.title?.toUpperCase().includes('UKT') || event.title?.toUpperCase().includes('UJIAN');
            return (
              <div 
                key={event.id} 
                className={styles.eventCard} 
                onClick={() => router.push(`/events/${event.id}`)}
              >
                <div className={`${styles.iconWrapper} ${isUKT ? styles.ukt : styles.tourney}`}>
                  {isUKT ? <Award size={24} /> : <Trophy size={24} />}
                </div>
                <div className={styles.info}>
                  <h3 className={styles.eventTitle}>{event.title}</h3>
                  <p className={styles.meta}>
                    {event.location || 'Indonesia'} • {new Date(event.startDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <ChevronRight size={16} className={styles.chevron} />
              </div>
            );
          })
        ) : (
          <div className={styles.emptyState}>Belum ada agenda kegiatan saat ini.</div>
        )}
      </section>

      <div style={{ height: '100px' }} />
      <BottomNav />
    </div>
  );
}
