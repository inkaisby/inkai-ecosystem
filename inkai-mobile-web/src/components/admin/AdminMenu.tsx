'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  Users, 
  Map, 
  ShieldCheck, 
  Calendar, 
  MessageSquare, 
  Settings, 
  LogOut,
  QrCode,
  Wallet,
  BookOpen,
  ShoppingBag,
  Award,
  FileText,
  Home
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import styles from './AdminMenu.module.css';

const adminItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: Users, label: 'Anggota', path: '/admin/members' },
  { icon: Map, label: 'Organisasi', path: '/admin/organization' },
  { icon: ShieldCheck, label: 'Verifikasi', path: '/admin/verification' },
  { icon: Calendar, label: 'Event', path: '/admin/events' },
  { icon: MessageSquare, label: 'Broadcast', path: '/admin/broadcast' },
  { icon: Wallet, label: 'Keuangan', path: '/admin/billing' },
  { icon: Settings, label: 'Settings', path: '/admin/settings' },
];

const memberItems = [
  { icon: Home, label: 'Portal Utama', path: '/dashboard' },
  { icon: QrCode, label: 'Absensi', path: '/absensi' },
  { icon: Wallet, label: 'Iuran', path: '/billing' },
  { icon: BookOpen, label: 'Materi', path: '/library' },
  { icon: ShoppingBag, label: 'Store', path: '/store' },
  { icon: Award, label: 'Achievement', path: '/achievement' },
  { icon: FileText, label: 'Dokumen', path: '/documents' },
];

export default function AdminMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    router.push(path);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('inkai_token');
    localStorage.removeItem('user');
    setIsOpen(false);
    router.push('/admin/login');
  };

  return (
    <>
      <motion.button 
        className={`${styles.floatingBtn} ${isOpen ? styles.active : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, scale: 0.5, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
      >
        <div className={styles.btnContent}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className={styles.header}>
              <h2 className={styles.title}>MENU NAVIGASI</h2>
              <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <div className={styles.menuContent}>
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Administrator</h3>
                <div className={styles.grid}>
                  {adminItems.map((item) => (
                    <button 
                      key={item.label} 
                      className={styles.menuItem}
                      onClick={() => handleNavigate(item.path)}
                    >
                      <div className={styles.iconWrapper}><item.icon size={20} /></div>
                      <span className={styles.label}>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Inkai Mobile (Member)</h3>
                <div className={styles.grid}>
                  {memberItems.map((item) => (
                    <button 
                      key={item.label} 
                      className={styles.menuItem}
                      onClick={() => handleNavigate(item.path)}
                    >
                      <div className={styles.iconWrapper}><item.icon size={20} /></div>
                      <span className={styles.label}>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.footer}>
              <button className={styles.logoutBtn} onClick={handleLogout}>
                <LogOut size={20} />
                <span>KELUAR DARI SISTEM</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
