"use client";

import { useEffect, useState, use } from "react";
import { ArrowLeft, Calendar, MapPin, Award, Trophy, ChevronRight, Loader2, CircleCheck } from "lucide-react";
import styles from "./EventDetail.module.css";
import { useRouter } from "next/navigation";
import { eventApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import CustomToast from "@/components/CustomToast/CustomToast";

export default function EventDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [userRegistration, setUserRegistration] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as const });

  useEffect(() => {
    setMounted(true);
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const response = await eventApi.getEvent(id);
      if (response.data.status === 'success') {
        const eventData = response.data.data;
        setEvent(eventData);
        
        // Check if user is already registered
        if (user && eventData.registrations) {
          const reg = eventData.registrations.find((r: any) => r.memberId === user.member?.id || r.memberId === user.id);
          if (reg) {
            setUserRegistration(reg);
            setSelectedCategoryId(reg.categoryId);
          }
        }
      }
    } catch (error) {
      console.error("Fetch event error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!user) return;
    if (!selectedCategoryId && event.categories?.length > 0) {
      setToast({ show: true, message: "Silakan pilih kategori terlebih dahulu.", type: 'error' });
      return;
    }

    setIsRegistering(true);
    try {
      const response = await eventApi.registerEvent({
        eventId: id,
        memberId: user.member?.id || user.id,
        categoryId: selectedCategoryId || undefined
      });
      
      if (response.data.status === 'success') {
        setToast({ show: true, message: "Pendaftaran Berhasil!", type: 'success' });
        fetchEvent(); // Refresh data
      }
    } catch (error: any) {
      setToast({ show: true, message: error.response?.data?.message || "Gagal mendaftar.", type: 'error' });
    } finally {
      setIsRegistering(false);
    }
  };

  if (!mounted || isAuthLoading || isLoading || !event) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={40} />
      </div>
    );
  }

  const isUKT = event.title?.toUpperCase().includes('UKT') || event.title?.toUpperCase().includes('UJIAN');
  const isPaid = userRegistration?.status === 'PAID';
  const isRegistered = !!userRegistration;

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <button onClick={() => router.back()} className={styles.backBtn}>
          <ArrowLeft size={20} />
        </button>
        <div className={styles.heroContent}>
          <div className={styles.heroIconWrapper}>
            {isUKT ? <Award size={64} className={styles.heroIcon} /> : <Trophy size={64} className={styles.heroIcon} />}
          </div>
          <h1 className={styles.title}>{event.title}</h1>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.infoGrid}>
          <div className={styles.infoRow}>
            <Calendar size={18} className={styles.infoIcon} />
            <div>
              <p className={styles.infoLabel}>Tanggal</p>
              <p className={styles.infoValue}>
                {new Date(event.startDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className={styles.infoRow}>
            <MapPin size={18} className={styles.infoIcon} />
            <div>
              <p className={styles.infoLabel}>Lokasi</p>
              <p className={styles.infoValue}>{event.location || 'Indonesia'}</p>
            </div>
          </div>
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Deskripsi Kegiatan</h2>
          <p className={styles.description}>
            {event.description || 'Tidak ada deskripsi tersedia untuk kegiatan ini.'}
          </p>
        </section>

        {event.categories && event.categories.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{isUKT ? 'Ujian Kenaikan Sabuk' : 'Kategori Lomba'}</h2>
            <div className={styles.categoryList}>
              {event.categories
                .filter((cat: any) => {
                  if (isRegistered) {
                    return cat.id === userRegistration.categoryId;
                  }
                  return true;
                })
                .map((cat: any) => {
                  const isSelected = selectedCategoryId === cat.id;
                  return (
                    <div 
                      key={cat.id} 
                      className={`${styles.categoryItem} ${isSelected ? styles.selected : ''} ${isRegistered ? styles.disabled : ''}`}
                      onClick={() => !isRegistered && setSelectedCategoryId(cat.id)}
                    >
                      <span className={styles.catName}>{cat.name}</span>
                      <span className={styles.catFee}>
                        Rp {new Intl.NumberFormat('id-ID').format(cat.fee)}
                      </span>
                    </div>
                  );
                })}
            </div>
          </section>
        )}
      </div>

      <footer className={styles.footer}>
        <button 
          className={`${styles.registerBtn} ${isRegistered ? styles.registered : ''}`}
          disabled={isRegistering || isPaid || (isRegistered && !isPaid)}
          onClick={handleRegister}
        >
          {isRegistering ? <Loader2 className={styles.spinner} size={20} /> : 
           isPaid ? <><CircleCheck size={20} /> SUDAH TERDAFTAR (LUNAS)</> :
           isRegistered ? "SUDAH TERDAFTAR (PENDING)" : "DAFTAR SEKARANG"}
        </button>
      </footer>

      <CustomToast 
        isVisible={toast.show} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ ...toast, show: false })} 
      />
    </div>
  );
}
