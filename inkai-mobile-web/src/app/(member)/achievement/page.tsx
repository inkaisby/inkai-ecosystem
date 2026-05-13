"use client";

import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Plus, Check, Info, FolderOpen, Loader2 } from "lucide-react";
import styles from "./Achievement.module.css";
import BottomNav from "@/components/BottomNav/BottomNav";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { Suspense } from "react";
import api from "@/lib/api";
import { parseRankPromotionPayload } from "@/lib/verificationDisplay";

type TabType = 'Sabuk' | 'Piagam' | 'Pelatihan';

function formatIdDate(iso?: string | null) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function parseAchievementData(raw: string): {
  category?: string;
  title?: string;
  date?: string;
  location?: string;
} {
  try {
    return JSON.parse(raw) as {
      category?: string;
      title?: string;
      date?: string;
      location?: string;
    };
  } catch {
    return {};
  }
}

function sortByCreatedDesc(a: { createdAt?: string }, b: { createdAt?: string }) {
  return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
}

function AchievementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') as TabType;
  
  const { user, isLoading: isAuthLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>(initialTab || 'Sabuk');
  const [mounted, setMounted] = useState(false);
  const [myVerifications, setMyVerifications] = useState<any[]>([]);

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

  const pendingAchievementByCategory = useMemo(() => {
    const piagam: any[] = [];
    const pelatihan: any[] = [];
    for (const v of pendingClaims) {
      if (v.type !== 'ACHIEVEMENT') continue;
      const o = parseAchievementData(v.data || '');
      if (o.category === 'PIAGAM') piagam.push(v);
      else if (o.category === 'PELATIHAN') pelatihan.push(v);
    }
    piagam.sort(sortByCreatedDesc);
    pelatihan.sort(sortByCreatedDesc);
    return { piagam, pelatihan };
  }, [pendingClaims]);

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
  const dojoFallback =
    (user?.dojo?.name || user?.member?.dojo?.name || "").trim() || null;

  /** Lokasi kartu: data tersimpan dulu, lalu nama dojo — tanpa teks "N/A" */
  const formatLocation = (stored?: string | null) => {
    const s = typeof stored === "string" ? stored.trim() : "";
    if (s) return s;
    if (dojoFallback) return dojoFallback;
    return "—";
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

  const renderHistoryCard = (item: any) => (
    <div key={item.id || item.title} className={styles.historyCard}>
      <div className={styles.cardInfo}>
        <h3 className={styles.cardTitle}>{item.title}</h3>
        <p className={styles.cardMeta}>Tanggal: {item.date}</p>
        <p className={styles.cardMeta}>Lokasi : {item.location}</p>
      </div>
      <div className={styles.cardStatus}>
        {item.isValidated ? (
          <Check size={20} className={styles.statusValid} />
        ) : (
          <div className={styles.statusPendingWrapper}>
            <Info size={20} className={styles.statusPending} />
            {item.customStatus && <span className={styles.customStatusText}>{item.customStatus}</span>}
          </div>
        )}
      </div>
    </div>
  );

  const renderSabukTab = () => {
    const hasList =
      uktRegs.length > 0 || ranks.length > 0 || pendingRankPromotions.length > 0;

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
                location: formatLocation(p.location ?? null),
                isValidated: false,
                customStatus: "Menunggu Validasi",
              });
            })}
            {uktRegs.map((reg: any) => renderHistoryCard({
              id: reg.id,
              title: reg.event?.title || 'Ujian UKT',
              date: reg.event?.startDate ? new Date(reg.event.startDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-',
              location: reg.event?.location || 'Lokasi Ujian',
              isValidated: false,
              customStatus: 'Menunggu Hasil Ujian',
            }))}
            {ranks.map((rank: any) => renderHistoryCard({
              id: rank.id,
              title: rank.rank,
              date: rank.date ? new Date(rank.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-',
              location: formatLocation(rank.location),
              isValidated: rank.isVerified,
            }))}
          </>
        )}
      </div>
      
      {verificationLegend}

      <button className={styles.addBtn} onClick={() => router.push('/achievement/add')}>
        <Plus size={18} />
        TAMBAH DATA KENAIKAN MANUAL
      </button>
    </motion.div>
  );
  };

  const renderPiagamTab = () => {
    const hasList =
      eventRegs.length > 0 || pendingAchievementByCategory.piagam.length > 0;

    return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className={styles.tabContent}>
      <p className={styles.sectionLabel}>RIWAYAT PIAGAM & PERTANDINGAN:</p>
      <div className={styles.list}>
        {!hasList ? (
          renderEmptyState('Belum ada riwayat pertandingan.')
        ) : (
          <>
            {pendingAchievementByCategory.piagam.map((claim: any) => {
              const o = parseAchievementData(claim.data || '');
              return renderHistoryCard({
                id: claim.id,
                title: o.title || 'Pengajuan piagam / pertandingan',
                date: o.date ? formatIdDate(o.date) : formatIdDate(claim.createdAt),
                location: o.location || '—',
                isValidated: false,
                customStatus: 'Menunggu Validasi',
              });
            })}
            {eventRegs.map((e: any) => renderHistoryCard({
              id: e.id,
              title: e.event?.title || 'Pertandingan',
              date: e.createdAt ? new Date(e.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-',
              location: e.event?.location || 'Lokasi Terdaftar',
              isValidated: e.status === 'APPROVED',
            }))}
          </>
        )}
      </div>
      {verificationLegend}
      <button className={styles.addBtn} onClick={() => router.push('/achievement/add')}>
        <Plus size={18} />
        TAMBAH PIAGAM / PERTANDINGAN
      </button>
    </motion.div>
  );
  };

  const renderPelatihanTab = () => {
    const pending = pendingAchievementByCategory.pelatihan;
    const hasList = pending.length > 0;

    return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className={styles.tabContent}>
      <p className={styles.sectionLabel}>RIWAYAT PELATIHAN & TEKNIS:</p>
      <div className={styles.list}>
        {!hasList ? (
          renderEmptyState('Belum ada riwayat pelatihan.')
        ) : (
          pending.map((claim: any) => {
            const o = parseAchievementData(claim.data || '');
            return renderHistoryCard({
              id: claim.id,
              title: o.title || 'Pengajuan pelatihan / sertifikasi',
              date: o.date ? formatIdDate(o.date) : formatIdDate(claim.createdAt),
              location: o.location || '—',
              isValidated: false,
              customStatus: 'Menunggu Validasi',
            });
          })
        )}
      </div>
      {verificationLegend}
      <button className={styles.addBtn} onClick={() => router.push('/achievement/add')}>
        <Plus size={18} />
        TAMBAH RIWAYAT PELATIHAN
      </button>
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
