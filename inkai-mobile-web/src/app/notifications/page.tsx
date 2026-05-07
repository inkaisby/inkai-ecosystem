"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Bell, Loader2, Info, CheckCircle2, AlertTriangle } from "lucide-react";
import styles from "./Notifications.module.css";
import BottomNav from "@/components/BottomNav/BottomNav";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";

export default function Notifications() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
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

  const notifications = [
    {
      id: "1",
      title: "Pendaftaran Berhasil",
      content: "Pendaftaran Anda untuk UKT Sabuk Hitam telah diterima. Silakan selesaikan pembayaran.",
      type: "SUCCESS",
      time: "2 jam yang lalu",
      read: false
    },
    {
      id: "2",
      title: "Pengumuman Gashuku",
      content: "Gashuku Wilayah Timur akan dilaksanakan pada tanggal 15 Juni 2026 di Surabaya.",
      type: "INFO",
      time: "1 hari yang lalu",
      read: true
    },
    {
      id: "3",
      title: "Tagihan Iuran",
      content: "Iuran bulanan bulan Mei belum dibayar. Mohon segera melakukan pembayaran.",
      type: "WARNING",
      time: "3 hari yang lalu",
      read: true
    }
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case "SUCCESS": return <CheckCircle2 className={styles.iconSuccess} />;
      case "WARNING": return <AlertTriangle className={styles.iconWarning} />;
      default: return <Info className={styles.iconInfo} />;
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.backBtn}>
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.title}>Notifikasi</h1>
      </header>

      <div className={styles.list}>
        {notifications.map((notif, i) => (
          <motion.div 
            key={notif.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`${styles.item} ${!notif.read ? styles.unread : ''}`}
          >
            <div className={styles.itemIcon}>{getIcon(notif.type)}</div>
            <div className={styles.itemContent}>
              <div className={styles.itemHeader}>
                <h3 className={styles.itemTitle}>{notif.title}</h3>
                <span className={styles.itemTime}>{notif.time}</span>
              </div>
              <p className={styles.itemText}>{notif.content}</p>
            </div>
            {!notif.read && <div className={styles.unreadDot} />}
          </motion.div>
        ))}
      </div>

      <div style={{ height: '100px' }} />
      <BottomNav />
    </div>
  );
}
