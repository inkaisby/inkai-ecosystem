"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  LogOut,
  MessageCircle,
  QrCode,
  Wallet,
  BookOpen,
  ShoppingBag,
  Award,
  Scroll,
  GraduationCap,
  ArrowRightLeft,
  FileText,
  CalendarCheck,
  ChevronRight,
  Trophy,
  Loader2,
  Lock,
  ScrollText,
} from "lucide-react";
import styles from "./Dashboard.module.css";
import MemberCard from "@/components/MemberCard/MemberCard";
import BottomNav from "@/components/BottomNav/BottomNav";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { eventApi, getAssetUrl, api } from "@/lib/api";

export default function Dashboard() {
  const router = useRouter();
  const {
    user,
    logout,
    isLoading: isAuthLoading,
    isAdmin,
    isProfileComplete,
    isDocumentComplete,
  } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [isEventsLoading, setIsEventsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/");
    } else if (user) {
      fetchEvents();
      fetchUnreadCount();
    }
  }, [user, isAuthLoading, router]);

  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const res = await api.notifications.getMy();
      if (res.status === "success") {
        const count = (res.data || []).filter((n: any) => !n.isRead).length;
        setUnreadCount(count);
      }
    } catch (error: any) {
      if (error.response?.status !== 401) {
        console.error("Fetch unread count error:", error);
      }
    }
  };

  const fetchEvents = async () => {
    try {
      const [upcomingRes, myEventsRes] = await Promise.all([
        eventApi.getEvents(),
        eventApi.getMyEvents(),
      ]);

      if (upcomingRes.data.status === "success") {
        setUpcomingEvents(upcomingRes.data.data.slice(0, 3));
      }
      if (myEventsRes.data.status === "success") {
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
    {
      icon: <GraduationCap />,
      label: "Pelatihan",
      path: "/achievement?tab=Pelatihan",
    },
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
    const isUKT =
      event.title?.toUpperCase().includes("UKT") ||
      event.title?.toUpperCase().includes("UJIAN");
    return (
      <div
        key={event.id}
        className={styles.eventItem}
        onClick={() => router.push(`/events/${event.id}`)}
      >
        <div
          className={`${styles.eventIcon} ${isUKT ? styles.ukt : styles.tourney}`}
        >
          {isUKT ? <Award size={20} /> : <Trophy size={20} />}
        </div>
        <div className={styles.eventInfo}>
          <h3 className={styles.eventTitle}>{event.title}</h3>
          <p className={styles.eventMeta}>
            {new Date(event.startDate).toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "short",
            })}{" "}
            | {event.location || "Indonesia"}
          </p>
          {isHistory && event.registrationStatus && (
            <span
              className={`${styles.statusBadge} ${event.registrationStatus === "PAID" ? styles.paid : styles.pending}`}
            >
              {event.registrationStatus === "PAID" ? "LUNAS" : "PENDING"}
            </span>
          )}
        </div>
        <ChevronRight size={16} className={styles.chevron} />
      </div>
    );
  };

  const highestBelt = (() => {
    if (isAdmin) return "—";
    const fromCurrent =
      typeof user.currentRank === "string" ? user.currentRank.trim() : "";
    if (fromCurrent) return fromCurrent;
    const firstRank =
      Array.isArray(user.ranks) && user.ranks.length > 0
        ? String(user.ranks[0]?.rank ?? "").trim()
        : "";
    if (firstRank) return firstRank;
    return "Belum tercatat";
  })();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.userProfile}>
          <div className={styles.avatarWrapper}>
            {user?.photoUrl ? (
              <img
                key={user.photoUrl}
                src={getAssetUrl(user.photoUrl)}
                alt={user?.fullName || "Member"}
                width={40}
                height={40}
                className={styles.avatar}
                style={{
                  width: "40px",
                  height: "40px",
                  objectFit: "cover",
                  borderRadius: "50%",
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = "/logo.png";
                }}
              />
            ) : (
              <Image
                src="/logo.png"
                alt="Member"
                width={40}
                height={40}
                className={styles.avatar}
              />
            )}
          </div>
          <div className={styles.userInfo}>
            <h1 className={styles.greeting}>
              Oss,{" "}
              {user.fullName
                ? user.fullName.split(" ")[0]
                : user.email
                  ? user.email.split("@")[0]
                  : "Member"}
              !
            </h1>
            <p className={styles.role}>
              {user.roles?.includes("ADMINISTRATOR") ||
              (Array.isArray(user.roles) &&
                user.roles.some(
                  (r: any) =>
                    r === "ADMINISTRATOR" || r.name === "ADMINISTRATOR",
                ))
                ? "Administrator"
                : user.status === "PENDING"
                  ? "Anggota Pending"
                  : "Anggota Aktif"}
            </p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => router.push("/guide")}
            aria-label="Panduan"
          >
            <ScrollText size={20} />
          </button>
          <button
            className={styles.iconBtn}
            onClick={() => router.push("/messages")}
          >
            <MessageCircle size={20} />
          </button>
          <button
            className={styles.iconBtn}
            onClick={() => router.push("/notifications")}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className={styles.badge}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          <button
            className={`${styles.iconBtn} ${styles.logout}`}
            onClick={() => {
              logout();
              router.push("/");
            }}
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {user.status === "PENDING" && !isAdmin && (
        <section className={styles.section}>
          <div className={styles.pendingNotice}>
            <Bell size={24} className={styles.pulse} />
            <div>
              <p>
                <b>Akun Sedang Diverifikasi</b>
              </p>
              <p>
                Pemberitahuan telah dikirimkan ke <b>Ketua Ranting</b> Anda
                untuk proses aktivasi NIA.
              </p>
            </div>
          </div>
        </section>
      )}

      <section className={styles.section}>
        <MemberCard
          nia={user.nia || (isAdmin ? "ADMINISTRATOR" : "MEMPROSES NIA...")}
          name={user.fullName || "Anggota"}
          highestBelt={highestBelt}
          dojo={
            user.dojo
              ? `${user.dojo.name} - ${user.dojo.branch?.province?.name || "Pusat"}`
              : "Dojo INKAI - Pusat"
          }
          qrValue={
            typeof window !== "undefined"
              ? `${window.location.origin}/v/${user.nia || user.id}`
              : user.id
          }
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
            {myEvents.map((event) => renderEventItem(event, true))}
          </div>
        </section>
      )}

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Event Terdekat</h2>
          <button
            className={styles.seeAll}
            onClick={() => router.push("/events")}
          >
            Lihat Semua
          </button>
        </div>
        <div className={styles.eventList}>
          {!user.nia && !isAdmin ? (
            <div className={styles.lockedState}>
              <Lock size={32} className={styles.lockedIcon} />
              <p className={styles.lockedText}>
                Event terdekat belum dapat diakses.
                <br />
                Tunggu sampai <b>NIA</b> Anda aktif untuk dapat mendaftar.
              </p>
            </div>
          ) : isEventsLoading ? (
            <div className={styles.loaderSmall}>
              <Loader2 className={styles.spinner} size={24} />
            </div>
          ) : upcomingEvents.length > 0 ? (
            upcomingEvents.map((event) => renderEventItem(event))
          ) : (
            <div className={styles.emptyState}>Belum ada event terdekat.</div>
          )}
        </div>
      </section>

      <div style={{ height: "100px" }} />
      <BottomNav />

      {(!isProfileComplete || !isDocumentComplete) && (
        <div className={styles.profileLockOverlay}>
          <div className={styles.profileLockContent}>
            <Award size={48} color="#ffc107" style={{ marginBottom: "16px" }} />
            <h2
              style={{
                fontSize: "20px",
                marginBottom: "8px",
                fontWeight: "600",
              }}
            >
              {!isProfileComplete
                ? "Profil Belum Lengkap"
                : "Dokumen Belum Lengkap"}
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "#ccc",
                marginBottom: "24px",
                lineHeight: "1.5",
              }}
            >
              {!isProfileComplete
                ? "Silakan lengkapi data diri Anda (Foto, No WA, Tempat & Tanggal Lahir, Alamat, serta Dojo/Ranting) untuk dapat menggunakan fitur INKAI Mobile."
                : "Data diri Anda sudah lengkap. Sekarang silakan lengkapi Dokumen Keanggotaan Anda (Akte Kelahiran & BPJS) untuk menggunakan fitur sepenuhnya."}
            </p>
            <button
              className={styles.primaryBtn}
              onClick={() =>
                router.push(!isProfileComplete ? "/profile/edit" : "/documents")
              }
            >
              {!isProfileComplete
                ? "Lengkapi Profil Anda Sekarang"
                : "Lengkapi Dokumen Keanggotaan"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
