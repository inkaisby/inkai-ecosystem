'use client';

import React, { useState, useEffect } from 'react';
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
  Home,
  ScrollText,
  UserCheck
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import styles from './AdminMenu.module.css';

const adminItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: Users, label: 'Anggota', path: '/admin/members' },
  { icon: Wallet, label: 'Iuran Anggota', path: '/admin/billing' },
  { icon: Map, label: 'Organisasi', path: '/admin/organization' },
  { icon: ShieldCheck, label: 'Antrean Kerja', path: '/admin/verification' },
  { icon: Calendar, label: 'Event', path: '/admin/events' },
  { icon: MessageSquare, label: 'Broadcast', path: '/admin/broadcast' },
  { icon: ScrollText, label: 'Panduan Anggota', path: '/admin/guide' },
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
  const [events, setEvents] = useState<any[]>([]);
  const [showEventSub, setShowEventSub] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, logout, isLoading } = useAuth();

  useEffect(() => {
    if (isOpen) {
      api.events.getAll()
        .then((res: any) => {
          let rawEvents: any[] = [];
          if (res && res.status === 'success' && Array.isArray(res.data)) {
            rawEvents = res.data;
          } else if (Array.isArray(res)) {
            rawEvents = res;
          }

          // Sort events by startDate (descending to show latest/upcoming first) and slice to top 5
          const sortedAndFiltered = [...rawEvents]
            .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
            .slice(0, 5);

          setEvents(sortedAndFiltered);
        })
        .catch(err => console.error('Failed to load events in AdminMenu', err));
    }
  }, [isOpen]);

  if (isLoading || !isAuthenticated) return null;

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    setShowEventSub(false);
    router.push(path);
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    setShowEventSub(false);
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
              <h2 className={styles.title}>{showEventSub ? 'PESERTA EVENT' : 'MENU NAVIGASI'}</h2>
              <button className={styles.closeBtn} onClick={() => { setIsOpen(false); setShowEventSub(false); }}>
                <X size={24} />
              </button>
            </div>

            <div className={styles.menuContent}>
              {showEventSub ? (
                <div className={styles.section}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={styles.sectionTitle}>Pilih Event untuk Kelola Peserta</h3>
                    <button 
                      onClick={() => setShowEventSub(false)}
                      className="text-xs text-amber-500 font-bold uppercase tracking-wider bg-white/5 px-3 py-1.5 rounded-lg"
                    >
                      ← Kembali
                    </button>
                  </div>
                  <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto pr-1">
                    <button 
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 text-left text-xs font-bold text-amber-500"
                      onClick={() => handleNavigate('/admin/events')}
                    >
                      <Calendar size={16} />
                      <span>Semua Event / Kelola Event</span>
                    </button>
                    {events.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-8">Tidak ada event aktif</p>
                    ) : (
                      events.map((evt) => (
                        <button 
                          key={evt.id} 
                          className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 text-left active:scale-[0.98] transition-all"
                          onClick={() => handleNavigate(`/admin/events/${evt.id}/participants`)}
                        >
                          <UserCheck size={16} className="text-amber-500 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-white truncate uppercase">{evt.title.replace('KEJURNAS: ', '').replace('UJIAN: ', '')}</p>
                            <p className="text-[10px] text-gray-500 truncate mt-0.5">{evt.location || 'Lokasi tidak ditentukan'}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Administrator</h3>
                    <div className={styles.grid}>
                      {adminItems.map((item) => (
                        <button 
                          key={item.label} 
                          className={styles.menuItem}
                          onClick={() => {
                            if (item.path === '/admin/events') {
                              setShowEventSub(true);
                            } else {
                              handleNavigate(item.path);
                            }
                          }}
                        >
                          <div className={styles.iconWrapper}><item.icon size={20} /></div>
                          <span className={styles.label}>{item.label === 'Event' ? 'Event & Peserta' : item.label}</span>
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
                </>
              )}
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

