"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Check, Info, FolderOpen, Loader2 } from "lucide-react";
import styles from "./Achievement.module.css";
import BottomNav from "@/components/BottomNav/BottomNav";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Suspense } from "react";

type TabType = 'Sabuk' | 'Piagam' | 'Pelatihan';

function AchievementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') as TabType;
  
  const { user, isLoading: isAuthLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>(initialTab || 'Sabuk');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isAuthLoading || !user) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={40} />
      </div>
    );
  }

  const ranks = user.ranks || [];
  const eventRegs = user.eventRegistrations || [];
  
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

  const renderSabukTab = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className={styles.tabContent}>
      <p className={styles.sectionLabel}>RIWAYAT KENAIKAN TINGKAT:</p>
      <div className={styles.list}>
        {uktRegs.length === 0 && ranks.length === 0 ? (
          renderEmptyState('Belum ada riwayat kenaikan tingkat.')
        ) : (
          <>
            {uktRegs.map((reg: any) => renderHistoryCard({
              title: reg.event?.title || 'Ujian UKT',
              date: reg.event?.startDate ? new Date(reg.event.startDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-',
              location: reg.event?.location || 'Lokasi Ujian',
              isValidated: false,
              customStatus: 'Menunggu Hasil Ujian'
            }))}
            {ranks.map((rank: any) => renderHistoryCard({
              title: rank.rank,
              date: rank.date ? new Date(rank.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-',
              location: rank.location || 'N/A',
              isValidated: rank.isVerified
            }))}
          </>
        )}
      </div>
      
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

      <button className={styles.addBtn} onClick={() => router.push('/achievement/add')}>
        <Plus size={18} />
        TAMBAH DATA KENAIKAN MANUAL
      </button>
    </motion.div>
  );

  const renderPiagamTab = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className={styles.tabContent}>
      <p className={styles.sectionLabel}>RIWAYAT PIAGAM & PERTANDINGAN:</p>
      <div className={styles.list}>
        {eventRegs.length === 0 ? (
          renderEmptyState('Belum ada riwayat pertandingan.')
        ) : (
          eventRegs.map((e: any) => renderHistoryCard({
            title: e.event?.title || 'Pertandingan',
            date: e.createdAt ? new Date(e.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-',
            location: e.event?.location || 'Lokasi Terdaftar',
            isValidated: e.status === 'APPROVED'
          }))
        )}
      </div>
      <button className={styles.addBtn} onClick={() => router.push('/achievement/add')}>
        <Plus size={18} />
        TAMBAH PIAGAM / PERTANDINGAN
      </button>
    </motion.div>
  );

  const renderPelatihanTab = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className={styles.tabContent}>
      <p className={styles.sectionLabel}>RIWAYAT PELATIHAN & TEKNIS:</p>
      <div className={styles.list}>
        {renderEmptyState('Belum ada riwayat pelatihan.')}
      </div>
      <button className={styles.addBtn} onClick={() => router.push('/achievement/add')}>
        <Plus size={18} />
        TAMBAH RIWAYAT PELATIHAN
      </button>
    </motion.div>
  );

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
