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
} from "lucide-react";
import { api, eventApi } from "@/lib/api";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import BottomNav from "@/components/BottomNav/BottomNav";
import dashStyles from "../dashboard/Dashboard.module.css";

function registrationAllowsAttendance(status: string | undefined): boolean {
  return status === "APPROVED" || status === "SUCCESS" || status === "PAID";
}

function eventWindowActive(ev: { startDate: string; endDate: string }): boolean {
  const t = Date.now();
  return (
    t >= new Date(ev.startDate).getTime() && t <= new Date(ev.endDate).getTime()
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

  const scannerRef = useRef<Html5Qrcode | null>(null);

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
      <div className={dashStyles.header} style={{ marginBottom: 8 }}>
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
            Agenda yang diikuti & presensi QR dojo
          </p>
        </div>
      </div>

      <section className={dashStyles.section} style={{ marginBottom: 0 }}>
        <div className={dashStyles.sectionHeader}>
          <h2 className={dashStyles.sectionTitle}>Absensi agenda</h2>
          <Calendar size={16} style={{ opacity: 0.6 }} aria-hidden />
        </div>
        <p style={{ fontSize: 12, color: "#888", marginBottom: 12, lineHeight: 1.5 }}>
          Tap absen untuk agenda yang Anda ikuti dengan status disetujui/lunas,
          pada jadwal event berlangsung (maksimal sekali per hari per agenda).
        </p>
        {loadingLists ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
            <Loader2 className="animate-spin text-amber-500" size={28} />
          </div>
        ) : !user?.nia ? (
          <div
            style={{
              padding: 16,
              borderRadius: 16,
              background: "rgba(245, 158, 11, 0.08)",
              border: "1px solid rgba(245, 158, 11, 0.25)",
              fontSize: 12,
              color: "var(--text-light)",
            }}
          >
            Setelah NIA aktif, Anda dapat melakukan absensi kegiatan agenda dari
            sini.
          </div>
        ) : eligibleEvents.length === 0 ? (
          <div
            style={{
              padding: 16,
              borderRadius: 16,
              background: "rgba(255,255,255,0.04)",
              fontSize: 12,
              color: "#888",
            }}
          >
            Tidak ada agenda yang sedang berjalan dengan pendaftaran disetujui.
            Daftar agenda di menu Event.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {eligibleEvents.map((ev) => {
              const done = attendedTodayForEvent(ev.id);
              const busy = eventSubmittingId === ev.id;
              return (
                <div
                  key={ev.id}
                  style={{
                    borderRadius: 16,
                    padding: 14,
                    background: "var(--card-dark)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: 14,
                          fontWeight: 800,
                          color: "var(--text-light)",
                        }}
                      >
                        {ev.title}
                      </h3>
                      <p style={{ margin: "6px 0 0", fontSize: 11, color: "#888" }}>
                        {new Date(ev.startDate).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })}
                        {" · "}
                        {ev.branch?.name ||
                          ev.branch?.city ||
                          ev.location ||
                          "Lokasi agenda"}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={done || busy}
                      onClick={() => void handleEventCheckIn(ev.id)}
                      style={{
                        alignSelf: "center",
                        padding: "10px 16px",
                        borderRadius: 12,
                        border: "none",
                        fontWeight: 800,
                        fontSize: 11,
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
                        <Loader2 className="animate-spin" size={16} />
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

      <section id="riwayat-absensi" className={dashStyles.section} style={{ marginBottom: 0 }}>
        <div className={dashStyles.sectionHeader}>
          <h2 className={dashStyles.sectionTitle}>Riwayat kehadiran</h2>
          <History size={16} style={{ opacity: 0.6 }} aria-hidden />
        </div>
        {loadingLists ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 20 }}>
            <Loader2 className="animate-spin text-amber-500" size={24} />
          </div>
        ) : history.length === 0 ? (
          <p style={{ fontSize: 12, color: "#888" }}>Belum ada riwayat absensi.</p>
        ) : (
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {history.map((h) => (
              <li
                key={h.id}
                style={{
                  padding: 12,
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  fontSize: 12,
                }}
              >
                <div style={{ fontWeight: 700, color: "var(--text-light)" }}>
                  {h.event?.title || `Latihan — ${h.dojo?.name || "dojo"}`}
                </div>
                <div
                  style={{
                    marginTop: 6,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    color: "#888",
                    fontSize: 11,
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Clock size={12} aria-hidden />
                    {new Date(h.checkInAt).toLocaleString("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                  {h.dojo?.name ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <MapPin size={12} aria-hidden />
                      {h.dojo.name}
                    </span>
                  ) : null}
                  {h.method ? (
                    <span style={{ opacity: 0.85 }}>{h.method}</span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
        <p style={{ fontSize: 11, color: "#666", marginTop: 12, lineHeight: 1.5 }}>
          Pengurus dapat mengoreksi atau menghapus catatan dari panel admin jika
          terjadi kesalahan.
        </p>
      </section>

      <section className={dashStyles.section} style={{ marginBottom: 0 }}>
        <button
          type="button"
          onClick={() => setShowQrSection((v) => !v)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.04)",
            color: "var(--text-light)",
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          Absensi QR di dojo (latihan rutin)
          {showQrSection ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        <AnimatePresence>
          {showQrSection ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: "hidden" }}
            >
              <div style={{ paddingTop: 16 }}>
                {!scanning && !result && !loading && (
                  <div
                    style={{
                      padding: 24,
                      borderRadius: 20,
                      textAlign: "center",
                      background: "var(--card-dark)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div
                      style={{
                        width: 72,
                        height: 72,
                        margin: "0 auto 16px",
                        borderRadius: 20,
                        background: "linear-gradient(135deg,#f59e0b,#d97706)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Camera size={36} color="#111" />
                    </div>
                    <p style={{ fontSize: 13, color: "#aaa", marginBottom: 16 }}>
                      Pindai QR dojo; lokasi digunakan untuk validasi jarak.
                    </p>
                    <button
                      type="button"
                      onClick={startScanner}
                      style={{
                        width: "100%",
                        padding: 14,
                        borderRadius: 14,
                        border: "none",
                        fontWeight: 800,
                        background: "var(--primary-gold)",
                        color: "#111",
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
                        padding: 12,
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "transparent",
                        color: "#888",
                      }}
                    >
                      Batalkan
                    </button>
                  </div>
                )}

                {loading && (
                  <div style={{ padding: 40, textAlign: "center" }}>
                    <Loader2 className="animate-spin text-amber-500" size={40} />
                  </div>
                )}

                {result && (
                  <div
                    style={{
                      padding: 24,
                      borderRadius: 20,
                      textAlign: "center",
                      border: result.success
                        ? "1px solid rgba(34,197,94,0.3)"
                        : "1px solid rgba(239,68,68,0.3)",
                      background: result.success
                        ? "rgba(34,197,94,0.06)"
                        : "rgba(239,68,68,0.06)",
                    }}
                  >
                    <div style={{ marginBottom: 12 }}>
                      {result.success ? (
                        <CheckCircle2 size={40} color="#22c55e" />
                      ) : (
                        <XCircle size={40} color="#ef4444" />
                      )}
                    </div>
                    <p style={{ fontWeight: 800, marginBottom: 8 }}>
                      {result.success ? "Berhasil" : "Gagal"}
                    </p>
                    <p style={{ fontSize: 12, color: "#888" }}>{result.message}</p>
                    {result.success && result.dojoName ? (
                      <p style={{ marginTop: 12, fontSize: 13 }}>
                        <MapPin size={14} style={{ verticalAlign: "middle" }} />{" "}
                        {result.dojoName} · {result.time}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setResult(null)}
                      style={{
                        marginTop: 16,
                        width: "100%",
                        padding: 12,
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "transparent",
                        color: "var(--text-light)",
                      }}
                    >
                      Tutup
                    </button>
                  </div>
                )}

                <div
                  style={{
                    marginTop: 16,
                    padding: 14,
                    borderRadius: 14,
                    display: "flex",
                    gap: 12,
                    background: "rgba(245,158,11,0.08)",
                    border: "1px solid rgba(245,158,11,0.2)",
                  }}
                >
                  <AlertCircle size={22} color="#f59e0b" style={{ flexShrink: 0 }} />
                  <p style={{ margin: 0, fontSize: 11, color: "#aaa", lineHeight: 1.5 }}>
                    Satu kali absensi QR per hari untuk latihan rutin di dojo.
                    Agenda terpisah dicatat di atas.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </section>

      <BottomNav />
    </div>
  );
}
