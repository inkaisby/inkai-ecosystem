"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Bell, Loader2, Info, CheckCircle2, AlertTriangle } from "lucide-react";
import styles from "./Notifications.module.css";
import BottomNav from "@/components/BottomNav/BottomNav";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import api from "@/lib/api";

export default function Notifications() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await api.notifications.getMy();
      if (res.status === 'success') {
        setNotifications(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRead = async (id: string, isRead: boolean) => {
    if (isRead) return;
    try {
      await api.notifications.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  if (!mounted || isAuthLoading || isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={40} />
      </div>
    );
  }

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
        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666', fontSize: '14px' }}>
            Belum ada notifikasi
          </div>
        ) : notifications.map((notif, i) => (
          <motion.div 
            key={notif.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`${styles.item} ${!notif.isRead ? styles.unread : ''}`}
            onClick={() => handleRead(notif.id, notif.isRead)}
            style={{ cursor: 'pointer' }}
          >
            <div className={styles.itemIcon}>{getIcon(notif.type)}</div>
            <div className={styles.itemContent}>
              <div className={styles.itemHeader}>
                <h3 className={styles.itemTitle}>{notif.title}</h3>
                <span className={styles.itemTime}>
                  {new Date(notif.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className={styles.itemText}>{notif.content}</p>
            </div>
            {!notif.isRead && <div className={styles.unreadDot} />}
          </motion.div>
        ))}
      </div>

      <div style={{ height: '100px' }} />
      <BottomNav />
    </div>
  );
}
