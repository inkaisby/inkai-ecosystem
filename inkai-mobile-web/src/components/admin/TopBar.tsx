'use client';

import React, { useEffect, useState } from 'react';
import { User, LogOut, Bell, Check, Shield, Trash2, X, Settings, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function TopBar() {
  const { logout, isAuthenticated, user } = useAuth();
  const router = useRouter();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Tutup sheet hanya selama salah satu terbuka (hindari listener mengganggu tap di header)
  useEffect(() => {
    if (!showNotifications && !showUserMenu) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (showNotifications && !target.closest('.notifications-container')) {
        setShowNotifications(false);
      }
      if (showUserMenu && !target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [showNotifications, showUserMenu]);

  // Kunci scroll di mobile saat sheet terbuka
  useEffect(() => {
    const mobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches;
    if ((showNotifications || showUserMenu) && mobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showNotifications, showUserMenu]);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.notifications.getMy();
      setNotifications(res.data || []);
      setUnreadCount((res.data || []).filter((n: any) => !n.isRead).length);
    } catch (err: any) {
      if (err.response?.status !== 401) {
        console.error('Failed to fetch notifications', err);
      }
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      // Refresh notifications every 1 minute
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.notifications.markAsRead(id);
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.isRead);
      await Promise.all(unread.map(n => api.notifications.markAsRead(n.id)));
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleClearRead = async () => {
    try {
      await api.notifications.clearRead();
      fetchNotifications();
    } catch (err) {
      console.error('Failed to clear read notifications', err);
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diff = now.getTime() - then.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  return (
    <header className="admin-topbar-fixed flex items-center overflow-visible touch-manipulation">
      {/* Blur hanya di lapisan ini agar backdrop sheet (fixed) tidak terikat ke kotak header. */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 border-b border-white/5 adm-chrome-soft backdrop-blur-xl"
        aria-hidden
      />
      <div className="relative z-10 flex w-full min-w-0 items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
          <Shield size={16} className="text-black" strokeWidth={3} />
        </div>
        <h1 className="text-xs font-black tracking-tighter text-white uppercase truncate">INKAI <span className="text-amber-500">ADMIN</span></h1>
      </div>

      <div className="flex items-center gap-2 ml-auto shrink-0 pointer-events-auto">
        {user && (
          <div className="flex flex-col items-end min-w-0 text-right mr-1.5" style={{ maxWidth: '90px' }}>
            <span className="text-[9px] font-black uppercase text-amber-500 truncate w-full leading-tight">
              {user.fullName || user.email?.split('@')[0]}
            </span>
            <span className="text-[8px] font-bold text-white/50 truncate w-full leading-none">
              {user.roles?.[0] === 'ADMINISTRATOR' ? 'Super Admin' :
               user.roles?.[0] === 'ADMIN_PUSAT' ? 'Admin Pusat' :
               user.roles?.[0] === 'ADMIN_PROVINCE' ? 'Admin Provinsi' :
               user.roles?.[0] === 'ADMIN_BRANCH' ? 'Admin Cabang' :
               user.roles?.[0] === 'ADMIN_DOJO' ? 'Admin Ranting' :
               'Admin'}
            </span>
          </div>
        )}

        {/* Separator */}
        <div className="h-5 w-px bg-white/10 mx-0.5" />

        {/* Notifications */}
        <div className="relative notifications-container">
          <button 
            type="button"
            aria-expanded={showNotifications}
            aria-label="Notifikasi"
            onClick={() => {
              setShowUserMenu(false);
              const next = !showNotifications;
              setShowNotifications(next);
              if (next) fetchNotifications();
            }}
            className={`p-2 rounded-full text-gray-400 hover:text-white transition-all relative ${showNotifications ? 'bg-white/10 text-white' : ''}`}
          >
            <Bell size={20} strokeWidth={2} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full admin-topbar-bell-badge-ring"></span>
            )}
          </button>

          {showNotifications && (
            <>
              {/* Backdrop for mobile */}
              <div
                className="admin-topbar-dropdown-backdrop"
                onClick={() => setShowNotifications(false)}
                aria-hidden
              />

              <div className="fixed inset-x-0 bottom-0 admin-notif-sheet admin-topbar-dropdown-popover sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 bg-dark-panel backdrop-blur-xl border-t border-white/10 sm:border sm:rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom sm:slide-none duration-300 overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-white/5 bg-white/[0.02]">
                  <h4 className="text-sm font-black uppercase tracking-widest text-white">Notifikasi</h4>
                  <div className="flex items-center gap-3">
                    {unreadCount > 0 && (
                      <span className="text-[10px] bg-amber-500 text-black px-2 py-0.5 rounded-full font-black">
                        {unreadCount} BARU
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowNotifications(false)}
                      className="p-1 text-gray-500 hover:text-white transition-colors sm:hidden"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div 
                        key={n.id} 
                        onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                        className={`p-4 rounded-2xl border transition-all relative group ${
                          n.isRead 
                            ? 'bg-transparent border-white/5 opacity-50' 
                            : 'bg-white/5 border-white/10 hover:border-white/20 cursor-pointer shadow-lg'
                        }`}
                      >
                        {!n.isRead && (
                          <div className="absolute top-4 right-4 w-2 h-2 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                        )}
                        <p className={`text-[13px] font-black leading-tight ${n.isRead ? 'text-gray-400' : 'text-white'}`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1.5 leading-relaxed line-clamp-2 font-medium">
                          {n.content}
                        </p>
                        <p className="text-[9px] text-gray-600 mt-2 uppercase font-black tracking-widest">
                          {getTimeAgo(n.createdAt)} AGO
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center">
                      <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Bell size={20} className="text-gray-600" />
                      </div>
                      <p className="text-gray-600 text-xs italic font-medium">Belum ada notifikasi baru.</p>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-white/5 bg-white/[0.02] grid grid-cols-2 gap-2">
                  {unreadCount > 0 ? (
                    <button
                      type="button"
                      onClick={handleMarkAllAsRead}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-wider text-gray-400 hover:text-white transition-all"
                    >
                      <Check size={14} />
                      Baca Semua
                    </button>
                  ) : (
                    <div className="flex items-center justify-center py-2.5 text-[10px] font-black uppercase tracking-wider text-gray-600">
                      Semua Terbaca
                    </div>
                  )}
                  
                  {notifications.some(n => n.isRead) ? (
                    <button
                      type="button"
                      onClick={handleClearRead}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/5 hover:bg-red-500/10 text-[10px] font-black uppercase tracking-wider text-red-500/60 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={14} />
                      Hapus
                    </button>
                  ) : (
                    <div className="flex items-center justify-center py-2.5 text-[10px] font-black uppercase tracking-wider text-gray-600">
                      Kosong
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile — klik/sentuh (bukan hover saja) */}
        <div className="flex items-center gap-2 pl-2 border-l border-white/10 user-menu-container">
          <div className="relative">
            <button
              type="button"
              aria-expanded={showUserMenu}
              aria-haspopup="true"
              aria-label="Menu akun"
              onClick={() => {
                setShowNotifications(false);
                setShowUserMenu((v) => !v);
              }}
              className={`flex items-center justify-center w-9 h-9 rounded-full transition-all overflow-hidden border border-white/10 ${
                showUserMenu ? 'bg-white/15 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <User size={18} strokeWidth={2} />
            </button>

            {showUserMenu && (
              <>
                <div
                  className="admin-topbar-dropdown-backdrop"
                  onClick={() => setShowUserMenu(false)}
                  aria-hidden
                />
                <div className="fixed inset-x-0 bottom-0 admin-account-sheet admin-topbar-dropdown-popover sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-48 flex flex-col sm:rounded-2xl overflow-hidden border-t sm:border border-white/10 bg-dark-panel shadow-2xl animate-in slide-in-from-bottom sm:slide-none duration-200">
                  <div className="flex justify-between items-center p-4 border-b border-white/5 sm:hidden">
                    <span className="text-sm font-black uppercase tracking-widest text-white">Akun</span>
                    <button
                      type="button"
                      onClick={() => setShowUserMenu(false)}
                      className="p-1 text-gray-500 hover:text-white transition-colors"
                      aria-label="Tutup"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  {user && (
                    <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                      <p className="text-xs font-black uppercase text-amber-500 truncate">
                        {user.fullName || user.email?.split('@')[0]}
                      </p>
                      <p className="text-[9px] font-bold text-white/50 truncate">
                        {user.roles?.[0] === 'ADMINISTRATOR' ? 'Super Admin' :
                         user.roles?.[0] === 'ADMIN_PUSAT' ? 'Admin Pusat' :
                         user.roles?.[0] === 'ADMIN_PROVINCE' ? `Admin Provinsi - ${user.managedProvinceName || ''}` :
                         user.roles?.[0] === 'ADMIN_BRANCH' ? `Admin Cabang - ${user.managedBranchName || ''}` :
                         user.roles?.[0] === 'ADMIN_DOJO' ? `Admin Dojo - ${user.managedDojoName || ''}` :
                         'Administrator'}
                      </p>
                    </div>
                  )}
                  <div className="p-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        router.push('/admin/settings');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    >
                      <Settings size={18} />
                      Pengaturan Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        router.push('/dashboard');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    >
                      <Home size={18} />
                      Home portal
                    </button>
                    <div className="h-px bg-white/5 my-1 mx-2" />
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                    >
                      <LogOut size={18} />
                      Keluar
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      </div>
    </header>
  );
}
