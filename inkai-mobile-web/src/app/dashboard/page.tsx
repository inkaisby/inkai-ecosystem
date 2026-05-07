"use client";

import { useEffect, useState } from "react";
import { Bell, LogOut, MessageCircle, QrCode, Wallet, BookOpen, ShoppingBag, Award, Scroll, GraduationCap, ArrowRightLeft, FileText, CalendarCheck, ChevronRight, Trophy, Loader2 } from "lucide-react";
import styles from "./Dashboard.module.css";
import MemberCard from "@/components/MemberCard/MemberCard";
import BottomNav from "@/components/BottomNav/BottomNav";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { eventApi } from "@/lib/api";

export default function Dashboard() {
  const router = useRouter();
  const { user, logout, isLoading: isAuthLoading } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [isEventsLoading, setIsEventsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/");
    } else if (user) {
      fetchEvents();
    }
  }, [user, isAuthLoading, router]);

  const fetchEvents = async () => {
    try {
      const [upcomingRes, myEventsRes] = await Promise.all([
        eventApi.getEvents(),
        eventApi.getMyEvents()
      ]);
      
      if (upcomingRes.data.status === 'success') {
        setUpcomingEvents(upcomingRes.data.data.slice(0, 3));
      }
      if (myEventsRes.data.status === 'success') {
        setMyEvents(myEventsRes.data.data || []);
      }
    } catch (error) {
      console.error("Fetch events error:", error);
    } finally {
      setIsEventsLoading(false);
    }
  };

  const quickActions = [
    { icon: <QrCode />, label: "Absensi", path: "/absensi" },
    { icon: <Wallet />, label: "Iuran", path: "/billing" },
    { icon: <BookOpen />, label: "Materi", path: "/library" },
    { icon: <ShoppingBag />, label: "Store", path: "/store" },
    { icon: <Award />, label: "Sabuk", path: "/achievement?tab=Sabuk" },
    { icon: <Scroll />, label: "Piagam", path: "/achievement?tab=Piagam" },
    { icon: <GraduationCap />, label: "Pelatihan", path: "/achievement?tab=Pelatihan" },
    { icon: <ArrowRightLeft />, label: "Pindah", path: "/transfer" },
    { icon: <FileText />, label: "Dokumen", path: "/documents" },
    { icon: <CalendarCheck />, label: "Event", path: "/events" },
  ];

  if (!mounted || isAuthLoading || !user) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={40} />
      </div>
    );
  }

  const renderEventItem = (event: any, isHistory = false) => {
    const isUKT = event.title?.toUpperCase().includes('UKT') || event.title?.toUpperCase().includes('UJIAN');
    return (
      <div key={event.id} className={styles.eventItem} onClick={() => router.push(`/events/${event.id}`)}>
        <div className={`${styles.eventIcon} ${isUKT ? styles.ukt : styles.tourney}`}>
          {isUKT ? <Award size={20} /> : <Trophy size={20} />}
        </div>
        <div className={styles.eventInfo}>
          <h3 className={styles.eventTitle}>{event.title}</h3>
          <p className={styles.eventMeta}>
            {new Date(event.startDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} | {event.location || 'Indonesia'}
          </p>
          {isHistory && event.registrationStatus && (
             <span className={`${styles.statusBadge} ${event.registrationStatus === 'PAID' ? styles.paid : styles.pending}`}>
                {event.registrationStatus === 'PAID' ? 'LUNAS' : 'PENDING'}
             </span>
          )}
        </div>
        <ChevronRight size={16} className={styles.chevron} />
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.userProfile}>
          <div className={styles.avatarWrapper}>
            <Image src="/logo.png" alt="Inkai Logo" width={40} height={40} className={styles.avatar} />
          </div>
          <div className={styles.userInfo}>
            <h1 className={styles.greeting}>Oss, {user.fullName?.split(' ')[0]}!</h1>
            <p className={styles.role}>{user.roles?.map((r: any) => r.name).includes('ADMINISTRATOR') ? 'Administrator' : 'Anggota Aktif'}</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.iconBtn} onClick={() => router.push("/messages")}><MessageCircle size={20} /></button>
          <button className={styles.iconBtn} onClick={() => router.push("/notifications")}><Bell size={20} /></button>
          <button 
            className={`${styles.iconBtn} ${styles.logout}`}
            onClick={() => { logout(); router.push("/"); }}
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <section className={styles.section}>
        <MemberCard 
          nia={user.nia || "N/A"} 
          name={user.fullName || "Anggota"} 
          dojo={user.dojo ? `${user.dojo.name} - ${user.dojo.branch?.province?.name || 'Pusat'}` : 'Dojo INKAI - Pusat'} 
        />
      </section>

      <section className={styles.section}>
        <div className={styles.grid}>
          {quickActions.map((action, i) => (
            <motion.div 
              key={action.label}
              whileTap={{ scale: 0.95 }}
              className={styles.actionItem}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => router.push(action.path)}
            >
              <div className={styles.actionIcon}>{action.icon}</div>
              <span className={styles.actionLabel}>{action.label}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Kegiatan Saya / Riwayat UKT (Only if exists) */}
      {myEvents.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Kegiatan Saya</h2>
          </div>
          <div className={styles.eventList}>
            {myEvents.map(event => renderEventItem(event, true))}
          </div>
        </section>
      )}

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Event Terdekat</h2>
          <button className={styles.seeAll} onClick={() => router.push("/events")}>Lihat Semua</button>
        </div>
        <div className={styles.eventList}>
          {isEventsLoading ? (
             <div className={styles.loaderSmall}><Loader2 className={styles.spinner} size={24} /></div>
          ) : upcomingEvents.length > 0 ? (
            upcomingEvents.map((event) => renderEventItem(event))
          ) : (
            <div className={styles.emptyState}>Belum ada event terdekat.</div>
          )}
        </div>
      </section>

      <div style={{ height: '100px' }} />
      <BottomNav />
    </div>
  );
}
