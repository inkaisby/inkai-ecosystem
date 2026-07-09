"use client";

import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Plus, Check, Info, FolderOpen, Loader2, XCircle } from "lucide-react";
import styles from "./Achievement.module.css";
import BottomNav from "@/components/BottomNav/BottomNav";
import CustomToast from "@/components/CustomToast/CustomToast";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { Suspense } from "react";
import api from "@/lib/api";
import { parseRankPromotionPayload, parseAchievementPayload } from "@/lib/verificationDisplay";

type TabType = 'Sabuk' | 'Piagam' | 'Pelatihan';

function formatIdDate(iso?: string | null) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function sortByCreatedDesc(a: { createdAt?: string }, b: { createdAt?: string }) {
  return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
}

function AchievementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') as TabType;
  
  const { user, isLoading: isAuthLoading, isAdmin, isDocumentComplete } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>(initialTab || 'Sabuk');
  const [mounted, setMounted] = useState(false);
  const [myVerifications, setMyVerifications] = useState<any[]>([]);
  const [addGateToast, setAddGateToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "error" });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.verifications.getMy();
        const list = Array.isArray(res?.data) ? res.data : [];
        if (!cancelled) setMyVerifications(list);
      } catch {
        if (!cancelled) setMyVerifications([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const pendingClaims = useMemo(() => {
    return myVerifications.filter((v) => v.status === 'PENDING');
  }, [myVerifications]);

  const pendingRankPromotions = useMemo(() => {
    return pendingClaims.filter((v) => v.type === 'RANK_PROMOTION').sort(sortByCreatedDesc);
  }, [pendingClaims]);

  const canSubmitAchievement = useMemo(() => {
    if (isAdmin) return true;
    if (!user) return false;
    const nia = typeof user.nia === "string" ? user.nia.trim() : "";
    if (!nia) return false;
    return isDocumentComplete;
  }, [user, isAdmin, isDocumentComplete]);

  const pendingAchievementByCategory = useMemo(() => {
    const piagam: any[] = [];
    const pelatihan: any[] = [];
    for (const v of pendingClaims) {
      if (v.type !== 'ACHIEVEMENT') continue;
      const o = parseAchievementPayload(v.data || '');
      if (o.category === 'PIAGAM') piagam.push(v);
      else if (o.category === 'PELATIHAN') pelatihan.push(v);
    }
    piagam.sort(sortByCreatedDesc);
    pelatihan.sort(sortByCreatedDesc);
    return { piagam, pelatihan };
  }, [pendingClaims]);

  const rejectedClaims = useMemo(
    () =>
      myVerifications.filter(
        (v) =>
          v.status === "REJECTED" && (v.type === "RANK_PROMOTION" || v.type === "ACHIEVEMENT")
      ),
    [myVerifications]
  );

  const rejectedRankPromotions = useMemo(() => {
    return rejectedClaims.filter((v) => v.type === "RANK_PROMOTION").sort(sortByCreatedDesc);
  }, [rejectedClaims]);

  const rejectedAchievementByCategory = useMemo(() => {
    const piagam: any[] = [];
    const pelatihan: any[] = [];
    for (const v of rejectedClaims) {
      if (v.type !== "ACHIEVEMENT") continue;
      const o = parseAchievementPayload(v.data || "");
      if (o.category === "PIAGAM") piagam.push(v);
      else if (o.category === "PELATIHAN") pelatihan.push(v);
      else piagam.push(v);
    }
    piagam.sort(sortByCreatedDesc);
    pelatihan.sort(sortByCreatedDesc);
    return { piagam, pelatihan };
  }, [rejectedClaims]);

  const verificationLegend = (
    <div className={styles.legend}>
      <p className={styles.legendLabel}>STATUS VERIFIKASI:</p>
      <div className={styles.legendItem}>
        <Check size={14} className={styles.statusValid} />
        <span>Data sudah divalidasi Pusat</span>
      </div>
      <div className={styles.legendItem}>
        <Info size={14} className={styles.statusPending} />
        <span>Menunggu Validasi</span>
      </div>
      <div className={styles.legendItem}>
        <XCircle size={14} className={styles.statusRejected} />
        <span>Ditolak — perbaiki data lalu ajukan ulang</span>
      </div>
    </div>
  );

  if (!mounted || isAuthLoading || !user) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={40} />
      </div>
    );
  }

  const ranks = user.ranks || [];
  const eventRegs = user.eventRegistrations || [];

  /**
   * Lokasi di riwayat sabuk harus sama dengan yang diisi di "Tambah Prestasi".
   * Tanpa fallback ke nama dojo/ranting — agar tidak menyesatkan ("GADING" dari nama dojo).
   */
  const formatSabukStoredLocation = (stored?: string | null) => {
    const s = typeof stored === "string" ? stored.trim() : "";
    return s || "—";
  };

  // Filter UKT registrations that are PAID
  const uktRegs = eventRegs.filter((reg: any) => {
    const title = reg.event?.title?.toUpperCase() || '';
    const isUKT = title.includes('UKT') || title.includes('UJIAN');
    return isUKT && reg.status === 'PAID';
  });

  const renderEmptyState = (message: string) => (
    <div className={styles.emptyState}>
      <FolderOpen size={40} className={styles.emptyIcon} />
      <p className={styles.emptyText}>{message}</p>
    </div>
  );

  function handleAddPrestasiClick() {
    if (!canSubmitAchievement && user) {
      const missingNia = !isAdmin && !(typeof user.nia === "string" && user.nia.trim());
      const missingDocs = !isAdmin && !isDocumentComplete;
      const parts: string[] = [];
      if (missingNia) parts.push("NIA Anda belum aktif");
      if (missingDocs) parts.push("dokumen Akte/KK dan BPJS belum lengkap");
      setAddGateToast({
        show: true,
        message: `Tambah prestasi memerlukan NIA aktif dan dokumen lengkap.${parts.length ? ` (${parts.join(" · ")})` : ""}`,
        type: "error",
      });
      return;
    }
    router.push(`/achievement/add?type=${activeTab.toUpperCase()}`);
  }

  function renderAddFooter(ctaLabel: string) {
    return (
      <>
        <button
          type="button"
          className={`${styles.addBtn} ${!canSubmitAchievement ? styles.addBtnDisabled : ""}`}
          onClick={handleAddPrestasiClick}
        >
          <Plus size={18} />
          {ctaLabel}
        </button>
        {!canSubmitAchievement && !isAdmin && (
          <p className={styles.addRequirementHint}>
            NIA aktif dan dokumen wajib (Akte/KK, BPJS) harus sudah ada. Unggah lewat Profil → Dokumen.
          </p>
        )}
      </>
    );
  }

  type HistoryRow = {
    id: string;
    title: string;
    date: string;
    location: string;
    isValidated: boolean;
    customStatus?: string;
    variant?: "pending" | "rejected" | "valid";
    rejectAdminNotes?: string | null;
    resubmitClaimId?: string;
  };

  const renderHistoryCard = (item: HistoryRow) => {
    const variant = item.variant ?? (item.isValidated ? "valid" : "pending");
    const isRejected = variant === "rejected";

    const statusBlock = item.isValidated ? (
      <Check size={20} className={styles.statusValid} />
    ) : isRejected ? (
      <div className={styles.statusPendingWrapper}>
        <XCircle size={20} className={styles.statusRejected} />
        {item.customStatus && <span className={styles.customStatusRejected}>{item.customStatus}</span>}
      </div>
    ) : (
      <div className={styles.statusPendingWrapper}>
        <Info size={20} className={styles.statusPending} />
        {item.customStatus && <span className={styles.customStatusText}>{item.customStatus}</span>}
      </div>
    );

    const mainRow = (
      <>
        <div className={styles.cardInfo}>
          <h3 className={styles.cardTitle}>{item.title}</h3>
          <p className={styles.cardMeta}>Tanggal: {item.date}</p>
          <p className={styles.cardMeta}>Lokasi : {item.location}</p>
        </div>
        <div className={styles.cardStatus}>{statusBlock}</div>
      </>
    );

    if (isRejected) {
      const showBtn = !!(item.resubmitClaimId && canSubmitAchievement);
      return (
        <div key={item.id} className={styles.historyRejectWrap}>
          <div className={styles.historyCard}>{mainRow}</div>
          {item.rejectAdminNotes?.trim() ? (
            <p className={styles.rejectAdminNote}>
              <strong>Catatan admin:</strong> {item.rejectAdminNotes.trim()}
            </p>
          ) : null}
          {showBtn ? (
            <button
              type="button"
              className={styles.resubmitBtn}
              onClick={() => router.push(`/achievement/add?resubmit=${item.resubmitClaimId}`)}
            >
              Ajukan ulang
            </button>
          ) : null}
          {!showBtn && !isAdmin && item.resubmitClaimId ? (
            <p className={styles.resubmitBlockedHint}>
              Lengkapi NIA dan dokumen wajib untuk mengajukan ulang.
            </p>
          ) : null}
        </div>
      );
    }

    return (
      <div key={item.id} className={styles.historyCard}>
        {mainRow}
      </div>
    );
  };

  const renderSabukTab = () => {
    const hasList =
      uktRegs.length > 0 ||
      ranks.length > 0 ||
      pendingRankPromotions.length > 0 ||
      rejectedRankPromotions.length > 0;

    return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className={styles.tabContent}>
      <p className={styles.sectionLabel}>RIWAYAT KENAIKAN TINGKAT:</p>
      <div className={styles.list}>
        {!hasList ? (
          renderEmptyState('Belum ada riwayat kenaikan tingkat.')
        ) : (
          <>
            {pendingRankPromotions.map((claim: any) => {
              const p = parseRankPromotionPayload(claim.data || "");
              return renderHistoryCard({
                id: claim.id,
                title: p.title,
                date: p.date ? formatIdDate(p.date) : formatIdDate(claim.createdAt),
                location: formatSabukStoredLocation(p.location ?? null),
                isValidated: false,
                customStatus: "Menunggu Validasi",
                variant: "pending",
              });
            })}
            {rejectedRankPromotions.map((claim: any) => {
              const p = parseRankPromotionPayload(claim.data || "");
              return renderHistoryCard({
                id: claim.id,
                title: p.title,
                date: p.date ? formatIdDate(p.date) : formatIdDate(claim.createdAt),
                location: formatSabukStoredLocation(p.location ?? null),
                isValidated: false,
                customStatus: "Ditolak",
                variant: "rejected",
                rejectAdminNotes: claim.adminNotes,
                resubmitClaimId: claim.id,
              });
            })}
            {uktRegs.map((reg: any) => renderHistoryCard({
              id: reg.id,
              title: reg.event?.title || 'Ujian UKT',
              date: reg.event?.startDate ? new Date(reg.event.startDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-',
              location: reg.event?.location || 'Lokasi Ujian',
              isValidated: false,
              customStatus: 'Menunggu Hasil Ujian',
              variant: "pending",
            }))}
            {ranks.map((rank: any) => renderHistoryCard({
              id: rank.id,
              title: rank.rank,
              date: rank.date ? new Date(rank.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-',
              location: formatSabukStoredLocation(rank.location),
              isValidated: rank.isVerified,
              variant: rank.isVerified ? "valid" : "pending",
            }))}
          </>
        )}
      </div>
      
      {verificationLegend}

      {renderAddFooter("TAMBAH DATA KENAIKAN MANUAL")}
    </motion.div>
  );
  };

  const renderPiagamTab = () => {
    const hasList =
      eventRegs.length > 0 ||
      pendingAchievementByCategory.piagam.length > 0 ||
      rejectedAchievementByCategory.piagam.length > 0;

    return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className={styles.tabContent}>
      <p className={styles.sectionLabel}>RIWAYAT PIAGAM & PERTANDINGAN:</p>
      <div className={styles.list}>
        {!hasList ? (
          renderEmptyState('Belum ada riwayat pertandingan.')
        ) : (
          <>
            {pendingAchievementByCategory.piagam.map((claim: any) => {
              const o = parseAchievementPayload(claim.data || '');
              return renderHistoryCard({
                id: claim.id,
                title: o.title || 'Pengajuan piagam / pertandingan',
                date: o.date ? formatIdDate(o.date) : formatIdDate(claim.createdAt),
                location: o.location || '—',
                isValidated: false,
                customStatus: 'Menunggu Validasi',
                variant: "pending",
              });
            })}
            {rejectedAchievementByCategory.piagam.map((claim: any) => {
              const o = parseAchievementPayload(claim.data || '');
              return renderHistoryCard({
                id: claim.id,
                title: o.title || 'Pengajuan piagam / pertandingan',
                date: o.date ? formatIdDate(o.date) : formatIdDate(claim.createdAt),
                location: o.location || '—',
                isValidated: false,
                customStatus: 'Ditolak',
                variant: "rejected",
                rejectAdminNotes: claim.adminNotes,
                resubmitClaimId: claim.id,
              });
            })}
            {eventRegs.map((e: any) => renderHistoryCard({
              id: e.id,
              title: e.event?.title || 'Pertandingan',
              date: e.createdAt ? new Date(e.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-',
              location: e.event?.location || 'Lokasi Terdaftar',
              isValidated: e.status === 'APPROVED',
              variant: e.status === 'APPROVED' ? "valid" : "pending",
            }))}
          </>
        )}
      </div>
      {verificationLegend}
      {renderAddFooter("TAMBAH PIAGAM / PERTANDINGAN")}
    </motion.div>
  );
  };

  const renderPelatihanTab = () => {
    const pending = pendingAchievementByCategory.pelatihan;
    const rejectedPel = rejectedAchievementByCategory.pelatihan;
    const hasList = pending.length > 0 || rejectedPel.length > 0;

    return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className={styles.tabContent}>
      <p className={styles.sectionLabel}>RIWAYAT PELATIHAN & TEKNIS:</p>
      <div className={styles.list}>
        {!hasList ? (
          renderEmptyState('Belum ada riwayat pelatihan.')
        ) : (
          <>
            {pending.map((claim: any) => {
              const o = parseAchievementPayload(claim.data || '');
              return renderHistoryCard({
                id: claim.id,
                title: o.title || 'Pengajuan pelatihan / sertifikasi',
                date: o.date ? formatIdDate(o.date) : formatIdDate(claim.createdAt),
                location: o.location || '—',
                isValidated: false,
                customStatus: 'Menunggu Validasi',
                variant: "pending",
              });
            })}
            {rejectedPel.map((claim: any) => {
              const o = parseAchievementPayload(claim.data || '');
              return renderHistoryCard({
                id: claim.id,
                title: o.title || 'Pengajuan pelatihan / sertifikasi',
                date: o.date ? formatIdDate(o.date) : formatIdDate(claim.createdAt),
                location: o.location || '—',
                isValidated: false,
                customStatus: 'Ditolak',
                variant: "rejected",
                rejectAdminNotes: claim.adminNotes,
                resubmitClaimId: claim.id,
              });
            })}
          </>
        )}
      </div>
      {verificationLegend}
      {renderAddFooter("TAMBAH RIWAYAT PELATIHAN")}
    </motion.div>
  );
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.backBtn}>
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.title}>RIWAYAT & PRESTASI</h1>
      </header>

      <div className={styles.tabs}>
        {(['Sabuk', 'Piagam', 'Pelatihan'] as TabType[]).map(tab => (
          <button 
            key={tab} 
            className={`${styles.tab} ${activeTab === tab ? styles.active : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
            {activeTab === tab && <motion.div layoutId="tab-indicator" className={styles.indicator} />}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {activeTab === 'Sabuk' && renderSabukTab()}
        {activeTab === 'Piagam' && renderPiagamTab()}
        {activeTab === 'Pelatihan' && renderPelatihanTab()}
      </div>

      <CustomToast
        isVisible={addGateToast.show}
        message={addGateToast.message}
        type={addGateToast.type}
        onClose={() => setAddGateToast((t) => ({ ...t, show: false }))}
      />

      <div style={{ height: '100px' }} />
      <BottomNav />
    </div>
  );
}

export default function Achievement() {
  return (
    <Suspense fallback={
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={40} />
      </div>
    }>
      <AchievementContent />
    </Suspense>
  );
}
