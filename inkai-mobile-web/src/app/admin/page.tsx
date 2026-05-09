'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  MapPin, 
  CreditCard, 
  Clock, 
  Search, 
  Filter,
  Download,
  MessageSquare,
  Loader2,
  AlertCircle,
  Plus,
  ChevronRight,
  ChevronLeft,
  LogOut,
  Home
} from 'lucide-react';
import StatCard from '@/components/admin/StatCard';
import { api } from '@/lib/api';

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [recentMembers, setRecentMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [user, setUser] = useState<any>(null);
  const [showStats, setShowStats] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    const fetchData = async () => {
      const token = (localStorage.getItem('inkai_token') || localStorage.getItem('token'));
      if (!token) {
        router.push('/admin/login');
        return;
      }

      try {
        setError(null);
        const [statsRes, membersRes] = await Promise.all([
          api.dashboard.getStats(),
          api.dashboard.getRecentActivities()
        ]);
        setStats(statsRes.data);
        setRecentMembers(membersRes.data);
      } catch (err: any) {
        console.error(err);
        if (err.message === 'Authentication required') {
          router.push('/admin/login');
        } else if (err.message.includes('Insufficient permissions')) {
          setError('Akses ditolak: Akun Anda tidak memiliki hak akses Administrator. Silakan login kembali menggunakan akun Admin Pusat.');
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-amber-500 mx-auto" size={40} />
          <p className="text-gray-500 text-sm animate-pulse">Sinkronisasi data organisasi...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="glass-card text-center space-y-6 border-red-500/20 bg-red-500/5">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white">Terjadi Kesalahan</h3>
            <p className="text-gray-400 text-xs leading-relaxed">{error}</p>
          </div>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => {
                localStorage.removeItem('inkai_token'); localStorage.removeItem('token');
                localStorage.removeItem('user');
                router.push('/admin/login');
              }}
              className="btn-secondary text-sm w-full"
            >
              Logout / Ganti Akun
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="btn-primary w-full text-sm"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('inkai_token');
    localStorage.removeItem('user');
    router.push('/admin/login');
  };

  const getStatScopeLabel = (type: 'members' | 'org') => {
    if (!user) return '...';
    const role = user.roles?.[0];
    
    if (type === 'members') {
      if (role === 'ADMIN_DOJO') return user.managedDojoName || 'Dojo';
      if (role === 'ADMIN_BRANCH') return user.managedBranchName || 'Cabang';
      if (role === 'ADMIN_PROVINCE') return user.managedProvinceName || 'Provinsi';
      return 'Nasional';
    } else {
      if (role === 'ADMIN_DOJO') return 'Status Aktif';
      if (role === 'ADMIN_BRANCH') return `${stats?.totalDojos || 0} Dojo`;
      if (role === 'ADMIN_PROVINCE') return `${stats?.totalBranches || 0} Cabang`;
      return `${stats?.totalProvinces || 0} Prov`;
    }
  };

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/')}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              title="Ke Portal Anggota"
            >
              <Home size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center border-2 border-white/10 shadow-lg shadow-amber-500/20">
              <span className="text-black font-black text-sm">
                {user?.fullName?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
            <div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 leading-none mb-1.5 truncate max-w-[150px]">
                {user?.roles?.[0] === 'ADMINISTRATOR' || user?.roles?.[0] === 'ADMIN_PUSAT' ? 'Pengurus Pusat' :
                 user?.roles?.[0] === 'ADMIN_PROVINCE' ? (user?.managedProvinceName || 'Provinsi') :
                 user?.roles?.[0] === 'ADMIN_BRANCH' ? (user?.managedBranchName || 'Cabang') :
                 user?.roles?.[0] === 'ADMIN_DOJO' ? (user?.managedDojoName || 'Dojo / Ranting') :
                 'Administrator'}
              </h2>
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></div>
                <p className="text-[9px] font-bold text-white/60 tracking-wider">
                  {user?.roles?.[0] === 'ADMINISTRATOR' ? 'Super Admin' :
                   user?.roles?.[0] === 'ADMIN_PUSAT' ? 'Admin Pusat' :
                   user?.roles?.[0] === 'ADMIN_PROVINCE' ? 'Admin Provinsi' :
                   user?.roles?.[0] === 'ADMIN_BRANCH' ? 'Admin Cabang' :
                   user?.roles?.[0] === 'ADMIN_DOJO' ? 'Admin Dojo' :
                   'Administrator'}
                </p>
              </div>
            </div>
          </div>
        </div>
          <div className="flex gap-2">
            <button 
              onClick={handleLogout}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all shadow-xl"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
        
        <button 
          onClick={() => router.push('/admin/members?showAdd=true')}
          className="btn-primary w-full text-sm"
        >
          <Plus size={18} />
          Tambah Anggota Baru
        </button>
      </div>

      {/* Stats Section with Collapse Toggle */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Key Performance Indicators</h3>
          <button 
            onClick={() => setShowStats(!showStats)}
            className="text-[10px] text-amber-500 font-bold bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/10"
          >
            {showStats ? 'Collapse' : 'Expand'}
          </button>
        </div>

        {showStats && (
          <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-2 duration-300">
            <StatCard 
              label="Total Anggota" 
              value={stats?.totalMembers?.toLocaleString() || '0'} 
              subValue={getStatScopeLabel('members')} 
              icon={Users} 
              trend="up" 
              onClick={() => router.push('/admin/members')}
            />
            <StatCard 
              label={user?.roles?.[0] === 'ADMIN_DOJO' ? 'Peringkat Dojo' : 'Total Dojo'} 
              value={user?.roles?.[0] === 'ADMIN_DOJO' ? '#' : stats?.totalDojos?.toLocaleString() || '0'} 
              subValue={getStatScopeLabel('org')} 
              icon={MapPin} 
              onClick={() => router.push('/admin/organization')}
            />
            <StatCard 
              label="Iuran Masuk" 
              value={`Rp ${(stats?.iuranTotal / 1000000 || 0).toFixed(1)}M`} 
              subValue="Terverifikasi" 
              icon={CreditCard} 
              trend="up"
              onClick={() => router.push('/admin/billing')} 
            />
            <StatCard 
              label="Pending" 
              value={stats?.pendingVerifications || '0'} 
              subValue="Menunggu" 
              icon={Clock} 
              onClick={() => router.push('/admin/verification')}
            />
          </div>
        )}
      </div>

      {/* Recent Members Area - List instead of Table for Mobile */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">Anggota Terbaru</h3>
          <button className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">
            Lihat Semua
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
          <input 
            type="text" 
            placeholder="Cari NIA atau Nama..." 
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:border-amber-500/50 text-white placeholder:text-gray-600"
          />
        </div>

        <div className="space-y-3">
          {recentMembers.length > 0 ? recentMembers.map((member, i) => (
            <div key={i} className="glass-card p-4 flex items-center justify-between border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-transparent flex items-center justify-center border border-amber-500/10">
                  <span className="text-amber-500 font-bold text-xs">
                    {member.fullName?.charAt(0)}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{member.fullName}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-gray-500 font-mono">{member.nia || 'N/A'}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-700" />
                    <span className="text-[10px] text-amber-500 font-bold">{member.currentRank}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-[10px] px-2 py-0.5 rounded-full inline-block ${
                  member.status === 'Active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                }`}>
                  {member.status}
                </div>
                <p className="text-[9px] text-gray-600 mt-1">{member.dojo?.name || 'Umum'}</p>
              </div>
            </div>
          )) : (
            <div className="glass-card p-8 text-center text-gray-500 text-xs italic">
              Belum ada aktivitas pendaftaran terbaru.
            </div>
          )}
        </div>
      </div>

      {/* Announcements Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">Pengumuman</h3>
        <div className="grid gap-3">
          {[
            { title: 'Instruksi Seragam Baru', date: '01 Mei 2026', target: 'Semua Anggota', color: 'amber' },
            { title: 'Update Iuran 2026', date: '28 Apr 2026', target: 'Ketua Cabang', color: 'green' },
          ].map((news, i) => (
            <div key={i} className="glass-card flex items-center gap-4 border-white/5 p-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400">
                <MessageSquare size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <span className="text-[9px] text-amber-500 uppercase font-bold tracking-widest">{news.target}</span>
                  <span className="text-[9px] text-gray-600">{news.date}</span>
                </div>
                <h4 className="text-xs font-medium text-white truncate mt-0.5">{news.title}</h4>
              </div>
              <ChevronRight size={14} className="text-gray-600" />
            </div>
          ))}
        </div>
      </div>

      {/* Support Card */}
      <div className="glass-card bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/10 p-5">
        <h3 className="text-base font-bold text-white mb-1">Pusat Bantuan</h3>
        <p className="text-[10px] text-gray-400 mb-4 leading-relaxed">Butuh panduan teknis pengelolaan organisasi? Tim support kami siap membantu.</p>
        <button className="btn-secondary w-full text-xs py-2">
          <MessageSquare size={14} />
          Hubungi Support INKAI
        </button>
      </div>
    </div>
  );
}

