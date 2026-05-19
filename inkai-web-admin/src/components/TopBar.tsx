'use client';

import React, { useEffect, useState } from 'react';
import { User, LogOut, Bell, ChevronDown, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function TopBar() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUserProfile = async () => {
    try {
      const res = await api.members.getProfile();
      if (res.data) {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      }
    } catch (err) {
      console.error('Failed to fetch user profile', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.notifications.getNotifications();
      setNotifications(res.data);
      setUnreadCount(res.data.filter((n: any) => !n.isRead).length);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    // Fetch fresh data immediately
    fetchUserProfile();
    fetchNotifications();
    
    // Refresh notifications every 30 seconds for better real-time feel
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
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

  const getRoleBadge = (user: any) => {
    const role = user?.roles?.[0];
    const branchName = user?.managedBranchName;
    const provinceName = user?.managedProvinceName;
    const dojoName = user?.managedDojoName;

    switch (role) {
      case 'ADMINISTRATOR': return 'Super Admin';
      case 'ADMIN_PUSAT': return 'PP INKAI';
      case 'ADMIN_PROVINCE': return provinceName ? `PENGPROV ${provinceName}` : 'Admin Provinsi';
      case 'ADMIN_BRANCH': return branchName ? `PENGCAB ${branchName}` : 'Admin Cabang';
      case 'ADMIN_DOJO': return dojoName ? `DOJO ${dojoName}` : 'Admin Dojo';
      default: return role || 'Admin';
    }
  };

  return (
    <header className="h-20 border-b border-black/5 dark:border-white/5 bg-white/80 dark:bg-[#0a0a0c]/50 backdrop-blur-xl sticky top-0 z-40 flex items-center justify-between px-8 text-slate-800 dark:text-white transition-all">
      <div>
        {/* Placeholder for dynamic breadcrumbs or search if needed */}
      </div>

      <div className="flex items-center gap-6">
        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications) fetchNotifications();
            }}
            className={`p-2.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-all relative ${showNotifications ? 'bg-black/10 dark:bg-white/10 text-slate-900 dark:text-white' : ''}`}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full border-2 border-white dark:border-[#0a0a0c]"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#16161a] border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl z-50 p-4 animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-slate-950 dark:text-white">Notifikasi</h4>
                {unreadCount > 0 && (
                  <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full font-bold uppercase">
                    {unreadCount} BARU
                  </span>
                )}
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                      className={`p-3 rounded-xl border transition-all relative group ${
                        n.isRead 
                          ? 'bg-transparent border-black/5 dark:border-white/5 opacity-60' 
                          : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 cursor-pointer'
                      }`}
                    >
                      {!n.isRead && (
                        <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                      )}
                      <p className={`text-sm font-bold ${n.isRead ? 'text-slate-400 dark:text-gray-500' : 'text-slate-800 dark:text-white'}`}>{n.title}</p>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.content}</p>
                      <p className="text-[10px] text-slate-400 dark:text-gray-600 mt-1 uppercase font-bold">{getTimeAgo(n.createdAt)} ago</p>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-slate-400 dark:text-gray-600 text-xs italic">Belum ada notifikasi.</p>
                  </div>
                )}
              </div>
              {unreadCount > 0 && (
                <button 
                  onClick={handleMarkAllAsRead}
                  className="w-full mt-4 py-2 text-xs text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center gap-2 border-t border-black/5 dark:border-white/5 pt-4"
                >
                  <Check size={14} />
                  Tandai Semua Sudah Dibaca
                </button>
              )}
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-4 pl-6 border-l border-black/10 dark:border-white/10">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{user?.fullName || user?.email?.split('@')[0]}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mt-0.5">
              {getRoleBadge(user)}
            </p>
          </div>
          
          <div className="group relative">
            <button className="flex items-center gap-2 p-1 pr-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl hover:bg-black/10 dark:hover:bg-white/10 transition-all">
              <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/20">
                {user?.photoUrl ? (
                  <img 
                    src={user.photoUrl.startsWith('http') ? user.photoUrl : `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/v1').replace('/v1', '').replace(/\/$/, '')}${user.photoUrl}`} 
                    alt={user.fullName} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-black">
                    <User size={20} strokeWidth={2.5} />
                  </div>
                )}
              </div>
              <ChevronDown size={16} className="text-slate-500 dark:text-gray-500 group-hover:text-slate-900 group-hover:dark:text-white transition-all" />
            </button>

            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#16161a] border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl opacity-0 translate-y-2 invisible group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible transition-all duration-200 p-2 overflow-hidden">
              <button 
                onClick={() => router.push('/settings')}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-600 dark:text-gray-400 hover:text-slate-900 hover:dark:text-white hover:bg-black/5 hover:dark:bg-white/5 rounded-xl transition-all"
              >
                <User size={18} />
                Profil Saya
              </button>
              <div className="h-px bg-black/5 dark:bg-white/5 my-1 mx-2" />
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
              >
                <LogOut size={18} />
                Keluar
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
