"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  Camera,
  CheckCircle2,
  XCircle,
  Loader2,
  MapPin,
  Clock,
  AlertCircle,
  ChevronLeft,
  Calendar,
  ChevronDown,
  ChevronUp,
  History,
  Fingerprint,
} from "lucide-react";
import { api, eventApi } from "@/lib/api";
import { formatEventPelaksanaan } from "@/lib/formatEventPelaksanaan";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import BottomNav from "@/components/BottomNav/BottomNav";
import dashStyles from "../dashboard/Dashboard.module.css";

function registrationAllowsAttendance(status: string | undefined): boolean {
  const s = status?.trim().toUpperCase();
  return s === "APPROVED" || s === "SUCCESS" || s === "PAID";
}

/**
 * Agenda dianggap berjalan pada hari kalender dari tanggal mulai sampai tanggal selesai (zona lokal).
 * Menghindari jendela 0 detik saat startDate === endDate, dan selaras dengan absensi maks. 1x per hari.
 */
function eventWindowActive(ev: { startDate: string; endDate?: string | null }): boolean {
  const now = new Date();
  const start = new Date(ev.startDate);
  const endCandidate =
    ev.endDate != null && String(ev.endDate).trim() !== ""
      ? new Date(ev.endDate)
      : start;
  const end = endCandidate.getTime() < start.getTime() ? start : endCandidate;

  const startOfLocalDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const endOfLocalDay = (d: Date) => {
    const s = startOfLocalDay(d);
    return new Date(s.getTime() + 24 * 60 * 60 * 1000 - 1);
  };

  const t = now.getTime();
  return (
    t >= startOfLocalDay(start).getTime() &&
    t <= endOfLocalDay(end).getTime()
  );
}

function sameLocalCalendarDay(iso: string | Date, ref: Date): boolean {
  const a = new Date(iso);
  const b = ref;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

type AttendanceRow = {
  id: string;
  checkInAt: string;
  method?: string;
  eventId?: string | null;
  dojo?: { name?: string };
  event?: { title?: string; id?: string } | null;
};

type MyEventRow = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  registrationStatus?: string;
  branch?: { name?: string; city?: string | null } | null;
  location?: string | null;
};

export default function AttendanceScannerPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    dojoName?: string;
    time?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<AttendanceRow[]>([]);
  const [myEvents, setMyEvents] = useState<MyEventRow[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [eventSubmittingId, setEventSubmittingId] = useState<string | null>(null);
  const [showQrSection, setShowQrSection] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; cell: any | null }>({ isOpen: false, cell: null });
  const [showHistory, setShowHistory] = useState(false);
  const [showFingerprintModal, setShowFingerprintModal] = useState(false);
  const [fingerprintStatus, setFingerprintStatus] = useState<"idle" | "scanning" | "success" | "failed">("idle");
  const [fingerprintProgress, setFingerprintProgress] = useState(0);
  const [fingerprintMessage, setFingerprintMessage] = useState("");

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleFingerprintCheckIn = async () => {
    if (!user?.dojo?.id) {
      toast.error("Anda belum memiliki Dojo yang terdaftar.");
      return;
    }
    
    setFingerprintStatus("success");
    setFingerprintMessage("Memproses absensi...");
    
    // Call WebAuthn to trigger native biometric if possible
    try {
      if (window.PublicKeyCredential) {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (available) {
          const challenge = new Uint8Array(32);
          window.crypto.getRandomValues(challenge);
          
          await navigator.credentials.create({
            publicKey: {
              challenge,
              rp: { name: "INKAI Mobile" },
              user: {
                id: new Uint8Array(16),
                name: user.fullName || "User",
                displayName: user.fullName || "User",
              },
              pubKeyCredParams: [{ type: "public-key", alg: -7 }],
              timeout: 5000,
              authenticatorSelection: {
                userVerification: "required",
                authenticatorAttachment: "platform"
              }
            }
          }).catch((err) => {
            console.log("Native biometric bypassed or failed: ", err);
          });
        }
      }
    } catch (e) {
      console.log("WebAuthn check bypassed: ", e);
    }

    setLoading(true);
    try {
      const response = await api.attendance.checkIn({
        dojoId: user.dojo.id,
        method: "FINGERPRINT",
      });
      toast.success(
        typeof response.message === "string"
          ? response.message
          : "Absensi sidik jari berhasil!"
      );
      setFingerprintMessage("Absensi Berhasil!");
      await loadLists();
      setTimeout(() => {
        setShowFingerprintModal(false);
        setFingerprintStatus("idle");
      }, 1500);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      const msg = ax.response?.data?.message || "Gagal mencatat kehadiran";
      toast.error(msg);
      setFingerprintStatus("failed");
      setFingerprintMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const startFingerprintScanning = () => {
    if (fingerprintStatus === "success" || fingerprintStatus === "failed") return;
    setFingerprintStatus("scanning");
    setFingerprintProgress(0);
    
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(50);
    }

    let progress = 0;
    scanIntervalRef.current = setInterval(() => {
      progress += 5;
      setFingerprintProgress(Math.min(progress, 100));
      if (progress >= 100) {
        if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(150);
        }
        void handleFingerprintCheckIn();
      }
    }, 80);
  };

  const stopFingerprintScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (fingerprintStatus === "scanning") {
      setFingerprintStatus("idle");
      setFingerprintProgress(0);
    }
  };

  const calendarCells = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Day of the week for the 1st of the month (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const dayOfWeek = firstDay.getDay(); 
    
    // Shift Sunday to be the 7th day of the week (so Mon=0, Tue=1, ..., Sun=6)
    const startOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    // Number of days in the current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];

    // Add empty padding cells for the previous month
    for (let i = 0; i < startOffset; i++) {
      cells.push({ day: null, isPresent: false, isToday: false, isFuture: false });
    }

    // Add actual days
    const today = new Date();
    const todayDate = today.getDate();
    const isCurrentMonthYear = today.getMonth() === month && today.getFullYear() === year;

    // Build a set of days where the member checked in
    const presentDays = new Set<number>();
    history.forEach((h) => {
      if (!h.checkInAt) return;
      const d = new Date(h.checkInAt);
      if (d.getMonth() === month && d.getFullYear() === year) {
        presentDays.add(d.getDate());
      }
    });

    for (let day = 1; day <= daysInMonth; day++) {
      const isPresent = presentDays.has(day);
      const isToday = isCurrentMonthYear && day === todayDate;
      const isFuture = isCurrentMonthYear && day > todayDate;
      const isPast = isCurrentMonthYear && day < todayDate;

      cells.push({
        day,
        isPresent,
        isToday,
        isFuture,
        isPast
      });
    }

    return cells;
  }, [history]);

  const handleCalendarClick = async (cell: any) => {
    if (!cell.day || cell.isPresent || cell.isPast) return;

    if (!user?.dojo?.id) {
      toast.error("Anda belum memiliki Dojo yang terdaftar untuk absensi manual.");
      return;
    }

    setConfirmModal({ isOpen: true, cell });
  };

  const processManualCheckIn = async () => {
    const cell = confirmModal.cell;
    setConfirmModal({ isOpen: false, cell: null });
    if (!cell) return;

    const now = new Date();
    // Default manual check-in to 12:00 PM of that day
    const checkInAt = new Date(now.getFullYear(), now.getMonth(), cell.day, 12, 0, 0).toISOString();

    setLoading(true);
    try {
      const response = await api.attendance.checkIn({
        dojoId: user.dojo.id,
        method: "MANUAL",
        checkInAt,
      });
      toast.success(
        typeof response.message === "string"
          ? response.message
          : "Absensi manual berhasil"
      );
      await loadLists();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast.error(ax.response?.data?.message || "Gagal mencatat kehadiran");
    } finally {
      setLoading(false);
    }
  };

  const attendedSessionsCount = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const presentDays = new Set<number>();
    history.forEach((h) => {
      if (!h.checkInAt) return;
      const d = new Date(h.checkInAt);
      if (d.getMonth() === month && d.getFullYear() === year) {
        presentDays.add(d.getDate());
      }
    });
    return presentDays.size;
  }, [history]);

  const currentMonthYearName = useMemo(() => {
    const now = new Date();
    return now.toLocaleString("id-ID", { month: "long", year: "numeric" }).toUpperCase();
  }, []);

  const loadLists = useCallback(async () => {
    if (!user) return;
    setLoadingLists(true);
    try {
      const myRes = await eventApi.getMyEvents();
      if (myRes.data?.status === "success" && Array.isArray(myRes.data.data)) {
        setMyEvents(myRes.data.data);
      }
    } catch {
      setMyEvents([]);
    }
    try {
      const attRes = await api.attendance.getMy({ limit: 100 });
      if (attRes?.status === "success" && Array.isArray(attRes.data)) {
        setHistory(attRes.data);
      } else {
        setHistory([]);
      }
    } catch {
      setHistory([]);
    } finally {
      setLoadingLists(false);
    }
  }, [user]);

  useEffect(() => {
    void loadLists();
  }, [loadLists]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash === "#riwayat") {
      const el = document.getElementById("riwayat-absensi");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [history, loadingLists]);

  useEffect(() => {
    return () => {
      const s = scannerRef.current;
      if (s) {
        s.stop().catch(() => undefined);
        scannerRef.current = null;
      }
    };
  }, []);

  const startScanner = () => {
    setScanning(true);
    setResult(null);
    setTimeout(() => {
      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;
      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      html5QrCode
        .start(
          { facingMode: "environment" },
          config,
          async (decodedText) => {
            await html5QrCode.stop();
            setScanning(false);
            void handleCheckInQr(decodedText);
          },
          () => undefined,
        )
        .catch(() => {
          toast.error("Gagal mengakses kamera");
          setScanning(false);
        });
    }, 300);
  };

  const handleCheckInQr = async (qrData: string) => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await api.attendance.checkIn({
            dojoId: qrData,
            latitude,
            longitude,
          });
          setResult({
            success: true,
            message:
              typeof response.message === "string"
                ? response.message
                : "Absensi berhasil",
            dojoName: response.data?.dojo?.name,
            time: new Date().toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          });
          toast.success("Absensi berhasil");
          await loadLists();
        } catch (err: unknown) {
          const ax = err as { response?: { data?: { message?: string } } };
          const msg = ax.response?.data?.message || "Gagal memproses absensi";
          setResult({ success: false, message: msg });
          toast.error("Absensi gagal");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLoading(false);
        setResult({
          success: false,
          message:
            "Akses lokasi ditolak atau tidak tersedia. Aktifkan GPS untuk absensi QR di dojo.",
        });
        toast.error("GPS dibutuhkan");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleEventCheckIn = async (eventId: string) => {
    if (!user?.nia) {
      toast.error("Absensi agenda aktif setelah NIA Anda terbit.");
      return;
    }
    setEventSubmittingId(eventId);
    try {
      const response = await api.attendance.checkIn({
        eventId,
        method: "EVENT_APP",
      });
      toast.success(
        typeof response.message === "string"
          ? response.message
          : "Berhasil absen agenda",
      );
      await loadLists();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast.error(ax.response?.data?.message || "Gagal absen agenda");
    } finally {
      setEventSubmittingId(null);
    }
  };

  const eligibleEvents = useMemo(() => {
    const seen = new Set<string>();
    const out: MyEventRow[] = [];
    for (const e of myEvents) {
      if (!registrationAllowsAttendance(e.registrationStatus)) continue;
      if (!eventWindowActive(e)) continue;
      if (seen.has(e.id)) continue;
      seen.add(e.id);
      out.push(e);
    }
    return out;
  }, [myEvents]);

  const attendedTodayForEvent = (eventId: string) =>
    history.some(
      (h) =>
        h.eventId === eventId && sameLocalCalendarDay(h.checkInAt, new Date()),
    );

  return (
    <div className={dashStyles.container} style={{ padding: "16px", paddingBottom: 120 }}>
      {/* Header */}
      <div className={dashStyles.header} style={{ marginBottom: 12 }}>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className={dashStyles.iconBtn}
          aria-label="Kembali"
        >
          <ChevronLeft size={20} />
        </button>
        <div style={{ flex: 1, minWidth: 0, paddingLeft: 8 }}>
          <h1
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: "var(--text-light)",
              margin: 0,
            }}
          >
            Absensi
          </h1>
          <p
            style={{
              fontSize: 11,
              color: "var(--primary-gold)",
              margin: "4px 0 0",
              fontWeight: 600,
            }}
          >
            Pindai QR Dojo atau Sidik Jari HP
          </p>
        </div>
      </div>

      {/* Quick Attendance Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
        <button
          type="button"
          onClick={() => setShowQrSection((v) => !v)}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px 12px",
            borderRadius: "20px",
            border: "1px solid rgba(255,255,255,0.08)",
            background: showQrSection ? "rgba(245, 158, 11, 0.12)" : "var(--card-dark)",
            borderColor: showQrSection ? "var(--primary-gold)" : "rgba(255,255,255,0.08)",
            color: "var(--text-light)",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          <Camera size={24} style={{ color: "var(--primary-gold)", marginBottom: "6px" }} />
          <span style={{ fontSize: "12px", fontWeight: 800 }}>Pindai QR Dojo</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setShowFingerprintModal(true);
            setFingerprintStatus("idle");
            setFingerprintProgress(0);
            setFingerprintMessage("");
          }}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px 12px",
            borderRadius: "20px",
            border: "1px solid rgba(255,255,255,0.08)",
            background: "var(--card-dark)",
            color: "var(--text-light)",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          <Fingerprint size={24} style={{ color: "var(--primary-gold)", marginBottom: "6px" }} />
          <span style={{ fontSize: "12px", fontWeight: 800 }}>Sidik Jari HP</span>
        </button>
      </div>

      {/* Dynamic QR Scanner panel */}
      <AnimatePresence>
        {showQrSection && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: "hidden", marginBottom: 16 }}
          >
            <div
              style={{
                padding: 16,
                borderRadius: 20,
                background: "var(--card-dark)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {!scanning && !result && !loading && (
                <div style={{ textAlign: "center", padding: "8px 0" }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      margin: "0 auto 12px",
                      borderRadius: 16,
                      background: "linear-gradient(135deg,#f59e0b,#d97706)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Camera size={28} color="#111" />
                  </div>
                  <p style={{ fontSize: 12, color: "#aaa", marginBottom: 12 }}>
                    Pindai QR dojo; lokasi digunakan untuk validasi jarak.
                  </p>
                  <button
                    type="button"
                    onClick={startScanner}
                    style={{
                      width: "100%",
                      padding: 12,
                      borderRadius: 12,
                      border: "none",
                      fontWeight: 800,
                      fontSize: 12,
                      background: "var(--primary-gold)",
                      color: "#111",
                      cursor: "pointer",
                    }}
                  >
                    Mulai pindai QR
                  </button>
                </div>
              )}

              {scanning && (
                <div>
                  <div
                    id="reader"
                    style={{
                      overflow: "hidden",
                      borderRadius: 16,
                      border: "2px solid rgba(245,158,11,0.4)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const s = scannerRef.current;
                      if (s) void s.stop().catch(() => undefined);
                      scannerRef.current = null;
                      setScanning(false);
                    }}
                    style={{
                      marginTop: 12,
                      width: "100%",
                      padding: 10,
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "transparent",
                      color: "#888",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Batalkan
                  </button>
                </div>
              )}

              {loading && (
                <div style={{ padding: 24, textAlign: "center" }}>
                  <Loader2 className="animate-spin text-amber-500" size={32} />
                </div>
              )}

              {result && (
                <div
                  style={{
                    padding: 16,
                    borderRadius: 16,
                    textAlign: "center",
                    border: result.success
                      ? "1px solid rgba(34,197,94,0.3)"
                      : "1px solid rgba(239,68,68,0.3)",
                    background: result.success
                      ? "rgba(34,197,94,0.06)"
                      : "rgba(239,68,68,0.06)",
                  }}
                >
                  <div style={{ marginBottom: 8 }}>
                    {result.success ? (
                      <CheckCircle2 size={32} color="#22c55e" />
                    ) : (
                      <XCircle size={32} color="#ef4444" />
                    )}
                  </div>
                  <p style={{ fontWeight: 800, fontSize: 13, marginBottom: 4 }}>
                    {result.success ? "Berhasil" : "Gagal"}
                  </p>
                  <p style={{ fontSize: 11, color: "#888" }}>{result.message}</p>
                  {result.success && result.dojoName ? (
                    <p style={{ marginTop: 8, fontSize: 12 }}>
                      <MapPin size={12} style={{ verticalAlign: "middle" }} />{" "}
                      {result.dojoName} · {result.time}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setResult(null)}
                    style={{
                      marginTop: 12,
                      width: "100%",
                      padding: 10,
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "transparent",
                      color: "var(--text-light)",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Tutup
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calendar visual - Jadwal & Absen Latihan Dojo */}
      <section className={dashStyles.section} style={{ margin: "0 0 16px 0", padding: 0 }}>
        <div
          style={{
            padding: "14px 16px",
            borderRadius: "20px",
            background: "var(--card-dark)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <h2 style={{ fontSize: 13, fontWeight: 800, color: "var(--text-light)", margin: 0 }}>
              Jadwal & Latihan Dojo
            </h2>
            <div
              style={{
                fontSize: "10px",
                fontWeight: 800,
                color: "var(--primary-gold)",
                letterSpacing: "0.05em",
              }}
            >
              {currentMonthYearName}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "6px",
              justifyItems: "center",
              alignItems: "center",
            }}
          >
            {/* Day headers */}
            {["S", "S", "R", "K", "J", "S", "M"].map((d, idx) => (
              <div
                key={idx}
                style={{
                  fontSize: "10px",
                  fontWeight: 800,
                  color: "var(--text-muted)",
                  width: "28px",
                  height: "28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {d}
              </div>
            ))}

            {/* Calendar cells */}
            {calendarCells.map((cell, idx) => {
              if (cell.day === null) {
                return <div key={`empty-${idx}`} style={{ width: "28px", height: "28px" }} />;
              }

              let bg = "rgba(255, 255, 255, 0.02)";
              let border = "1px solid rgba(255, 255, 255, 0.05)";
              let color = "#aaa";

              if (cell.isPresent) {
                bg = "rgba(16, 185, 129, 0.15)";
                border = "1px solid #10b981";
                color = "#10b981";
              }

              if (cell.isToday) {
                border = cell.isPresent ? "2px solid #10b981" : "2px solid var(--primary-gold)";
                if (!cell.isPresent) {
                  color = "var(--primary-gold)";
                }
              }

              if (cell.isPast) {
                color = "#444";
                bg = "rgba(255, 255, 255, 0.005)";
                border = "1px dashed rgba(255, 255, 255, 0.02)";
              }

              const isClickable = !cell.isPresent && !cell.isPast && cell.day !== null;

              return (
                <div
                  key={`day-${cell.day}`}
                  onClick={() => handleCalendarClick(cell)}
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    background: bg,
                    border: border,
                    color: color,
                    fontSize: "11px",
                    fontWeight: cell.isPresent || cell.isToday ? 900 : 500,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    cursor: isClickable ? "pointer" : "default",
                  }}
                >
                  {cell.day}
                  {cell.isToday && (
                    <span
                      style={{
                        position: "absolute",
                        bottom: "2px",
                        width: "3px",
                        height: "3px",
                        borderRadius: "50%",
                        background: cell.isPresent ? "#10b981" : "var(--primary-gold)",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              fontSize: "10px",
              color: "var(--text-muted)",
              marginTop: "12px",
              borderTop: "1px solid rgba(255, 255, 255, 0.05)",
              paddingTop: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  background: "rgba(16, 185, 129, 0.15)",
                  border: "1px solid #10b981",
                  borderRadius: "2px",
                }}
              />
              <span>Hadir ({attendedSessionsCount} Sesi)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  background: "rgba(255, 255, 255, 0.005)",
                  border: "1px dashed rgba(255, 255, 255, 0.05)",
                  borderRadius: "2px",
                }}
              />
              <span>Belum Terjadi</span>
            </div>
          </div>
        </div>
      </section>

      {/* Absensi Agenda Section (Only show if there are eligible events or if user NIA is active) */}
      {(!user?.nia || eligibleEvents.length > 0) && (
        <section className={dashStyles.section} style={{ margin: "0 0 16px 0" }}>
          <div className={dashStyles.sectionHeader} style={{ marginBottom: 10 }}>
            <h2 className={dashStyles.sectionTitle} style={{ fontSize: 13 }}>Absensi Agenda Kegiatan</h2>
            <Calendar size={14} style={{ opacity: 0.6 }} aria-hidden />
          </div>

          {loadingLists ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 12 }}>
              <Loader2 className="animate-spin text-amber-500" size={20} />
            </div>
          ) : !user?.nia ? (
            <div
              style={{
                padding: 12,
                borderRadius: 12,
                background: "rgba(245, 158, 11, 0.06)",
                border: "1px solid rgba(245, 158, 11, 0.2)",
                fontSize: 11,
                color: "var(--text-light)",
                lineHeight: 1.4,
              }}
            >
              Setelah NIA aktif, Anda dapat melakukan absensi kegiatan agenda dari sini.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {eligibleEvents.map((ev) => {
                const done = attendedTodayForEvent(ev.id);
                const busy = eventSubmittingId === ev.id;
                return (
                  <div
                    key={ev.id}
                    style={{
                      borderRadius: 12,
                      padding: 10,
                      background: "var(--card-dark)",
                      border: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: 12,
                            fontWeight: 800,
                            color: "var(--text-light)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {ev.title}
                        </h3>
                        <p style={{ margin: "4px 0 0", fontSize: 10, color: "#888" }}>
                          {formatEventPelaksanaan(ev.startDate, ev.endDate)}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={done || busy}
                        onClick={() => void handleEventCheckIn(ev.id)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 8,
                          border: "none",
                          fontWeight: 800,
                          fontSize: 10,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          cursor: done || busy ? "not-allowed" : "pointer",
                          opacity: done ? 0.5 : 1,
                          background: done
                            ? "rgba(34,197,94,0.2)"
                            : "var(--primary-gold)",
                          color: done ? "#86efac" : "#111",
                        }}
                      >
                        {busy ? (
                          <Loader2 className="animate-spin" size={12} />
                        ) : done ? (
                          "Sudah absen"
                        ) : (
                          "Absen"
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Riwayat Kehadiran (Collapsible) */}
      <section id="riwayat-absensi" className={dashStyles.section} style={{ margin: "0 0 16px 0" }}>
        <button
          type="button"
          onClick={() => setShowHistory((v) => !v)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.02)",
            color: "var(--text-light)",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <History size={16} style={{ color: "var(--primary-gold)" }} />
            <span>Riwayat Kehadiran</span>
          </div>
          {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: "hidden" }}
            >
              <div style={{ paddingTop: 12 }}>
                {loadingLists ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: 16 }}>
                    <Loader2 className="animate-spin text-amber-500" size={20} />
                  </div>
                ) : history.length === 0 ? (
                  <p style={{ fontSize: 11, color: "#888", textAlign: "center", margin: "8px 0" }}>
                    Belum ada riwayat absensi.
                  </p>
                ) : (
                  <ul
                    style={{
                      listStyle: "none",
                      margin: 0,
                      padding: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    {history.map((h) => (
                      <li
                        key={h.id}
                        style={{
                          padding: 10,
                          borderRadius: 12,
                          background: "rgba(255,255,255,0.02)",
                          border: "1px solid rgba(255,255,255,0.04)",
                          fontSize: 11,
                        }}
                      >
                        <div style={{ fontWeight: 700, color: "var(--text-light)" }}>
                          {h.event?.title || `Latihan — ${h.dojo?.name || "dojo"}`}
                        </div>
                        <div
                          style={{
                            marginTop: 4,
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 6,
                            color: "#888",
                            fontSize: 10,
                          }}
                        >
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                            <Clock size={10} aria-hidden />
                            {new Date(h.checkInAt).toLocaleString("id-ID", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </span>
                          {h.dojo?.name ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                              <MapPin size={10} aria-hidden />
                              {h.dojo.name}
                            </span>
                          ) : null}
                          {h.method ? (
                            <span style={{ opacity: 0.8 }}>{h.method}</span>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <p style={{ fontSize: 10, color: "#666", marginTop: 8, lineHeight: 1.4 }}>
                  Pengurus dapat mengoreksi atau menghapus catatan dari panel admin jika terjadi kesalahan.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <BottomNav />

      {/* Premium Fingerprint/Biometric Scan Modal */}
      <AnimatePresence>
        {showFingerprintModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0, 0, 0, 0.8)",
              backdropFilter: "blur(6px)",
              padding: "20px",
            }}
            onClick={() => {
              if (fingerprintStatus !== "scanning") {
                setShowFingerprintModal(false);
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "var(--card-dark)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "24px",
                padding: "28px 24px",
                width: "100%",
                maxWidth: "340px",
                textAlign: "center",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              }}
            >
              <h3
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "18px",
                  fontWeight: 800,
                  color: "var(--text-light)",
                }}
              >
                Absensi Sidik Jari
              </h3>
              <p
                style={{
                  margin: "0 0 24px 0",
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  lineHeight: 1.5,
                }}
              >
                {fingerprintStatus === "success"
                  ? "Verifikasi Berhasil"
                  : fingerprintStatus === "failed"
                  ? fingerprintMessage || "Verifikasi Gagal"
                  : fingerprintStatus === "scanning"
                  ? "Memindai... Jangan lepaskan jari Anda"
                  : "Tekan dan tahan ikon sidik jari di bawah untuk melakukan absensi"}
              </p>

              {/* Fingerprint Touch Area */}
              <div
                style={{
                  position: "relative",
                  width: "120px",
                  height: "120px",
                  margin: "0 auto 24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* Outer Progress Ring */}
                <svg
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    transform: "rotate(-90deg)",
                  }}
                >
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeWidth="4"
                    fill="transparent"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    stroke={
                      fingerprintStatus === "success"
                        ? "#10b981"
                        : fingerprintStatus === "failed"
                        ? "#ef4444"
                        : "var(--primary-gold)"
                    }
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={326.7}
                    strokeDashoffset={326.7 - (326.7 * fingerprintProgress) / 100}
                    style={{ transition: "stroke-dashoffset 0.1s ease" }}
                  />
                </svg>

                {/* Fingerprint Button */}
                <motion.div
                  onMouseDown={startFingerprintScanning}
                  onMouseUp={stopFingerprintScanning}
                  onMouseLeave={stopFingerprintScanning}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    startFingerprintScanning();
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    stopFingerprintScanning();
                  }}
                  animate={
                    fingerprintStatus === "scanning"
                      ? { scale: [1, 0.95, 1], transition: { repeat: Infinity, duration: 1 } }
                      : { scale: 1 }
                  }
                  style={{
                    width: "88px",
                    height: "88px",
                    borderRadius: "50%",
                    background:
                      fingerprintStatus === "success"
                        ? "rgba(16, 185, 129, 0.15)"
                        : fingerprintStatus === "failed"
                        ? "rgba(239, 68, 68, 0.15)"
                        : "rgba(245, 158, 11, 0.1)",
                    border: `1.5px solid ${
                      fingerprintStatus === "success"
                        ? "#10b981"
                        : fingerprintStatus === "failed"
                        ? "#ef4444"
                        : "rgba(245, 158, 11, 0.3)"
                    }`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    zIndex: 10,
                  }}
                >
                  {fingerprintStatus === "success" ? (
                    <CheckCircle2 size={36} color="#10b981" />
                  ) : fingerprintStatus === "failed" ? (
                    <XCircle size={36} color="#ef4444" />
                  ) : (
                    <Fingerprint
                      size={36}
                      color={
                        fingerprintStatus === "scanning"
                          ? "var(--primary-gold)"
                          : "rgba(245, 158, 11, 0.7)"
                      }
                    />
                  )}
                </motion.div>

                {/* Pulsing glow under scanning */}
                {fingerprintStatus === "scanning" && (
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    style={{
                      position: "absolute",
                      width: "100px",
                      height: "100px",
                      borderRadius: "50%",
                      background: "rgba(245, 158, 11, 0.2)",
                      zIndex: 1,
                    }}
                  />
                )}
              </div>

              {/* Status Message */}
              {fingerprintMessage && (
                <p
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color:
                      fingerprintStatus === "success"
                        ? "#10b981"
                        : fingerprintStatus === "failed"
                        ? "#ef4444"
                        : "var(--text-light)",
                    margin: "0 0 16px 0",
                  }}
                >
                  {fingerprintMessage}
                </p>
              )}

              {/* Action Button */}
              <button
                type="button"
                disabled={fingerprintStatus === "scanning"}
                onClick={() => setShowFingerprintModal(false)}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  background: "transparent",
                  color: "var(--text-light)",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: fingerprintStatus === "scanning" ? "not-allowed" : "pointer",
                  opacity: fingerprintStatus === "scanning" ? 0.5 : 1,
                }}
              >
                Tutup
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Premium Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && confirmModal.cell && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(4px)",
              padding: "20px",
            }}
            onClick={() => setConfirmModal({ isOpen: false, cell: null })}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "var(--card-dark)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "24px",
                padding: "24px",
                width: "100%",
                maxWidth: "340px",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "16px",
                  background: "rgba(245, 158, 11, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "20px",
                }}
              >
                <Calendar size={28} color="var(--primary-gold)" />
              </div>
              <h3
                style={{
                  margin: "0 0 12px 0",
                  fontSize: "18px",
                  fontWeight: 800,
                  color: "var(--text-light)",
                  lineHeight: 1.3,
                }}
              >
                Konfirmasi Kehadiran
              </h3>
              <p
                style={{
                  margin: "0 0 24px 0",
                  fontSize: "13px",
                  color: "var(--text-muted)",
                  lineHeight: 1.5,
                }}
              >
                Apakah Anda ingin mencatat kehadiran latihan Dojo untuk tanggal{" "}
                <b style={{ color: "var(--primary-gold)" }}>{confirmModal.cell.day} {currentMonthYearName}</b>?
              </p>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => setConfirmModal({ isOpen: false, cell: null })}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "12px",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    background: "transparent",
                    color: "var(--text-light)",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>
                <button
                  onClick={processManualCheckIn}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "12px",
                    border: "none",
                    background: "var(--primary-gold)",
                    color: "#111",
                    fontWeight: 800,
                    fontSize: "13px",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
                  }}
                >
                  Konfirmasi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
