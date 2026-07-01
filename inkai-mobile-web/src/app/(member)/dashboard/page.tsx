"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Bell,
  LogOut,
  MessageCircle,
  QrCode,
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
  X,
  Wallet,
  History,
} from "lucide-react";
import styles from "./Dashboard.module.css";
import MemberCard from "@/components/MemberCard/MemberCard";
import BottomNav from "@/components/BottomNav/BottomNav";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { eventApi, getAssetUrl, api, billingApi } from "@/lib/api";
import { formatEventPelaksanaan } from "@/lib/formatEventPelaksanaan";

function roleNames(userRoles: unknown): string[] {
  if (!Array.isArray(userRoles)) return [];
  return userRoles
    .map((r: any) => (typeof r === "string" ? r : r?.name))
    .filter((n): n is string => typeof n === "string" && !!n);
}

/** Label baris atas / oranye pada kartu untuk akun admin (bukan NIA sungguhan). */
function adminMembershipCardHeadline(roleList: string[]): {
  headline: string;
  scopeBadge: string;
} {
  const has = (...keys: string[]) => keys.some((k) => roleList.includes(k));
  let scopeBadge = "CABANG";
  if (has("ADMINISTRATOR", "ADMIN_PUSAT")) scopeBadge = "PUSAT";
  else if (has("ADMIN_DOJO")) scopeBadge = "DOJO/RANTING";
  else if (has("ADMIN_BRANCH")) scopeBadge = "CABANG";
  return { headline: "ADMIN", scopeBadge };
}

type RegistrationBadgeVariant = "paid" | "approved" | "pending" | "rejected";

/** Kegiatan saya: sembunyikan jika tanggal event sudah lewat (pakai endDate bila ada). */
function isMyEventStillVisible(event: {
  startDate?: string;
  endDate?: string;
}): boolean {
  const now = Date.now();
  if (event.endDate) {
    return new Date(event.endDate).getTime() >= now;
  }
  if (event.startDate) {
    const start = new Date(event.startDate);
    const today = new Date();
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const eventDayStart = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate(),
    );
    return eventDayStart.getTime() >= todayStart.getTime();
  }
  return true;
}

function registrationStatusPresentation(
  status: string | undefined,
): { label: string; variant: RegistrationBadgeVariant } | null {
  if (!status) return null;
  switch (status) {
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
  const [pastEvents, setPastEvents] = useState<any[]>([]);
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [isEventsLoading, setIsEventsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [billings, setBillings] = useState<any[]>([]);
  const [showIuranLock, setShowIuranLock] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const rawRegDate = user?.createdAt || user?.member?.createdAt || user?.member?.joinedAt;
  const regDate = rawRegDate ? new Date(rawRegDate) : new Date();

  const monthlyIurans = billings.filter((b: any) => {
    if (b.type !== "MONTHLY_IURAN") return false;
    const billDate = new Date(b.dueDate);
    const startOfBillMonth = new Date(billDate.getFullYear(), billDate.getMonth(), 1);
    const startOfRegMonth = new Date(regDate.getFullYear(), regDate.getMonth(), 1);
    return startOfBillMonth.getTime() >= startOfRegMonth.getTime();
  });
  const hasNoPaidIuran = !isAdmin && !user?.member?.allowEventWithoutDues && monthlyIurans.length > 0 && !monthlyIurans.some((b: any) => b.status === "PAID");

  const fetchEvents = useCallback(async () => {
    try {
      const [upcomingRes, myEventsRes, billingsRes, attendanceRes] = await Promise.all([
        eventApi.getEvents(),
        eventApi.getMyEvents(),
        billingApi.getMyBillings().catch(() => ({ data: { status: "error", data: [] } })),
        api.attendance.getMy({ limit: 100 }).catch(() => ({ status: "error", data: [] })),
      ]);

      if (upcomingRes.data.status === "success") {
        const raw = upcomingRes.data.data || [];
        const now = Date.now();
        const upcomingFiltered = [...raw].filter((e: { endDate?: string }) =>
          e.endDate ? new Date(e.endDate).getTime() >= now : true,
        );
        const nearest = upcomingFiltered
          .sort(
            (a: { startDate: string }, b: { startDate: string }) =>
              new Date(a.startDate).getTime() -
              new Date(b.startDate).getTime(),
          )
          .slice(0, 3);
        setUpcomingEvents(nearest);

        const pastFiltered = [...raw]
          .filter((e: { endDate?: string }) =>
            e.endDate ? new Date(e.endDate).getTime() < now : false,
          )
          .sort(
            (a: { endDate?: string }, b: { endDate?: string }) =>
              new Date(b.endDate || "").getTime() -
              new Date(a.endDate || "").getTime(),
          )
          .slice(0, 5);
        setPastEvents(pastFiltered);
      }
      if (myEventsRes.data.status === "success") {
        setMyEvents(myEventsRes.data.data || []);
      }
      if (billingsRes?.data?.status === "success") {
        setBillings(billingsRes.data.data || []);
      }
      if (attendanceRes?.status === "success" && Array.isArray(attendanceRes.data)) {
        setAttendanceHistory(attendanceRes.data);
      }
    } catch (error) {
      console.error("Fetch events error:", error);
    } finally {
      setIsEventsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user || isAuthLoading) return;
    void fetchEvents();
    void fetchUnreadCount();
  }, [user, isAuthLoading, fetchEvents]);

  useEffect(() => {
    if (!user || isAuthLoading) return;
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void fetchEvents();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [user, isAuthLoading, fetchEvents]);

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
    { icon: <History />, label: "Riwayat", path: "/absensi#riwayat" },
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
    const regBadge =
      isHistory && event.registrationStatus
        ? registrationStatusPresentation(event.registrationStatus)
        : null;
    return (
      <div
        key={event.id}
        className={styles.eventItem}
        onClick={() => {
          if (!isHistory && hasNoPaidIuran) {
            setShowIuranLock(true);
            return;
          }
          router.push(`/events/${event.id}`);
        }}
      >
        <div
          className={`${styles.eventIcon} ${isUKT ? styles.ukt : styles.tourney}`}
        >
          {isUKT ? <Award size={20} /> : <Trophy size={20} />}
        </div>
        <div className={styles.eventInfo}>
          <h3 className={styles.eventTitle}>{event.title}</h3>
          <p className={styles.eventMeta}>
            {formatEventPelaksanaan(event.startDate, event.endDate)}{" "}
            |{" "}
            {event.branch?.name ||
              event.branch?.city ||
              event.location ||
              "Indonesia"}
          </p>
          {regBadge ? (
            <span
              className={`${styles.statusBadge} ${styles[regBadge.variant]}`}
            >
              {regBadge.label}
            </span>
          ) : null}
        </div>
        <ChevronRight size={16} className={styles.chevron} />
      </div>
    );
  };

  const roles = roleNames(user.roles);
  const adminCardLabels = isAdmin ? adminMembershipCardHeadline(roles) : null;

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

  const visibleMyEvents = myEvents.filter(isMyEventStillVisible);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const namaBulanIni = now.toLocaleString("id-ID", { month: "long" }).replace(/^\w/, (c) => c.toUpperCase());

  const currentMonthAttendances = attendanceHistory.filter((h: any) => {
    if (!h.checkInAt) return false;
    const checkInDate = new Date(h.checkInAt);
    return (
      checkInDate.getMonth() === currentMonth &&
      checkInDate.getFullYear() === currentYear
    );
  });

  const attendanceCount = currentMonthAttendances.length;
  const totalSessions = 8; // Standar 8 kali latihan sebulan (2x seminggu)
  const attendancePct =
    totalSessions > 0
      ? Math.min(100, Math.round((attendanceCount / totalSessions) * 1000) / 10)
      : 0;

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
          nia={
            adminCardLabels
              ? adminCardLabels.scopeBadge
              : user.nia || "MEMPROSES NIA..."
          }
          name={adminCardLabels ? adminCardLabels.headline : user.fullName || "Anggota"}
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

      {!isAdmin && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Kehadiran Latihan Bulan {namaBulanIni}</h2>
          </div>
          <div
            className={styles.eventItem}
            style={{
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "26px",
                  fontWeight: 900,
                  color: attendancePct >= 75 ? "#10b981" : "#f59e0b",
                  fontFamily: "var(--font-outfit), sans-serif",
                  lineHeight: 1.1,
                }}
              >
                {attendancePct}%
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                {attendanceCount} dari {totalSessions} Latihan Bulan Ini
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <span
                style={{
                  display: "inline-block",
                  fontSize: "10px",
                  fontWeight: "bold",
                  padding: "4px 10px",
                  borderRadius: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  background: attendancePct >= 75 ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)",
                  color: attendancePct >= 75 ? "#10b981" : "#f59e0b",
                }}
              >
                {attendancePct >= 75 ? "LAYAK UJIAN" : "TETAP SEMANGAT"}
              </span>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "6px" }}>
                Min. Kehadiran 75%
              </div>
            </div>
          </div>
        </section>
      )}

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
              onClick={() => {
                if (action.label === "Event" && hasNoPaidIuran) {
                  setShowIuranLock(true);
                  return;
                }
                router.push(action.path);
              }}
            >
              <div className={styles.actionIcon}>{action.icon}</div>
              <span className={styles.actionLabel}>{action.label}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Kegiatan Saya / Riwayat UKT (Only if exists) */}
      {visibleMyEvents.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Kegiatan Saya</h2>
          </div>
          <div className={styles.eventList}>
            {visibleMyEvents.map((event) => renderEventItem(event, true))}
          </div>
        </section>
      )}

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Event Terdekat</h2>
          <button
            className={styles.seeAll}
            onClick={() => {
              if (hasNoPaidIuran) {
                setShowIuranLock(true);
                return;
              }
              router.push("/events");
            }}
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
          ) : hasNoPaidIuran ? (
            <div
              className={styles.lockedState}
              style={{ cursor: "pointer" }}
              onClick={() => setShowIuranLock(true)}
            >
              <Lock size={32} className={styles.lockedIcon} />
              <p className={styles.lockedText}>
                Event terdekat belum dapat diakses.
                <br />
                Silakan lakukan <b>pembayaran iuran bulanan</b> Anda terlebih dahulu.
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

      {showIuranLock && (
        <div className={styles.profileLockOverlay}>
          <div className={styles.profileLockContent}>
            <div
              style={{
                alignSelf: "flex-end",
                cursor: "pointer",
                color: "#ccc",
                marginBottom: "8px",
              }}
              onClick={() => setShowIuranLock(false)}
            >
              <X size={20} />
            </div>
            <Lock size={48} color="#ffc107" style={{ marginBottom: "16px" }} />
            <h2
              style={{
                fontSize: "20px",
                marginBottom: "8px",
                fontWeight: "600",
              }}
            >
              Iuran Bulanan Belum Lunas
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "#ccc",
                marginBottom: "24px",
                lineHeight: "1.5",
              }}
            >
              Anda memiliki tagihan iuran bulanan yang wajib diselesaikan. Silakan lakukan pembayaran iuran bulanan Anda terlebih dahulu untuk dapat mengakses fitur event.
            </p>
            <button
              className={styles.primaryBtn}
              onClick={() => router.push("/billing")}
            >
              Bayar Iuran Sekarang
            </button>
          </div>
        </div>
      )}

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
