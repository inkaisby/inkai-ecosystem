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
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import StatCard from '@/components/StatCard';
import { api } from '@/lib/api';

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [recentMembers, setRecentMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
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
          router.push('/login');
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
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-amber-500 mx-auto" size={48} />
          <p className="text-gray-500 animate-pulse">Memuat data organisasi...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="glass-card max-w-md w-full text-center space-y-6 border-red-500/20 bg-red-500/5">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
            <AlertCircle size={40} className="text-red-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">Terjadi Kesalahan</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{error}</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                router.push('/login');
              }}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm font-medium text-gray-300 flex-1"
            >
              Logout / Ganti Akun
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="btn-primary flex-1"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Dashboard Overview</h2>
          <p className="text-gray-500">
            Selamat datang kembali, {
              user?.roles?.[0] === 'ADMINISTRATOR' ? 'Super Admin' :
              user?.roles?.[0] === 'ADMIN_PUSAT' ? 'Administrator Pusat' :
              user?.roles?.[0] === 'ADMIN_PROVINCE' ? 'Administrator Provinsi' :
              user?.roles?.[0] === 'ADMIN_BRANCH' ? 'Administrator Cabang' :
              'Administrator'
            }.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm font-medium text-gray-300">
            <Download size={18} />
            Export Report
          </button>
          <button className="btn-primary text-sm">
            + Tambah Anggota
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Anggota" 
          value={stats?.totalMembers?.toLocaleString() || '0'} 
          subValue="Aktif Nasional" 
          icon={Users} 
          trend="up" 
        />
        <StatCard 
          label="Total Dojo" 
          value={stats?.totalDojos?.toLocaleString() || '0'} 
          subValue={`Di ${stats?.totalProvinces || 0} Provinsi`} 
          icon={MapPin} 
        />
        <StatCard 
          label="Iuran Masuk" 
          value={`Rp ${(stats?.iuranTotal / 1000000).toFixed(1)}M`} 
          subValue="Akumulasi Terverifikasi" 
          icon={CreditCard} 
          trend="up"
        />
        <StatCard 
          label="Pending Approval" 
          value={stats?.pendingVerifications || '0'} 
          subValue="Verifikasi dokumen" 
          icon={Clock} 
        />
      </div>

      {/* Heatmap Preview - New Analytics Feature */}
      <div className="glass-card">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              Aktivitas Latihan Nasional
              <TrendingUp size={18} className="text-green-500" />
            </h3>
            <p className="text-xs text-gray-500">Intensitas kehadiran dojo dalam 30 hari terakhir.</p>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-1.5 mr-4">
              <span className="text-[10px] text-gray-500 uppercase font-bold">Low</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded bg-white/5" />
                <div className="w-3 h-3 rounded bg-amber-500/20" />
                <div className="w-3 h-3 rounded bg-amber-500/40" />
                <div className="w-3 h-3 rounded bg-amber-500/60" />
                <div className="w-3 h-3 rounded bg-amber-500" />
              </div>
              <span className="text-[10px] text-gray-500 uppercase font-bold ml-1">High</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-12 sm:grid-cols-24 md:grid-cols-32 gap-1">
          {Array.from({ length: 150 }).map((_, i) => (
            <div 
              key={i} 
              className={`aspect-square rounded-sm transition-all hover:scale-150 cursor-pointer ${
                i % 7 === 0 ? 'bg-amber-500' : 
                i % 5 === 0 ? 'bg-amber-500/60' : 
                i % 3 === 0 ? 'bg-amber-500/20' : 'bg-white/5'
              }`}
              title={`Aktivitas: ${Math.floor(Math.random() * 100)}%`}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Table Area */}
        <div className="lg:col-span-2 glass-card space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Anggota Terbaru</h3>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input 
                  type="text" 
                  placeholder="Cari NIA/Nama..." 
                  className="bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-amber-500/50 w-64 text-white"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-gray-500 border-b border-white/5 uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="pb-4 font-medium">Nama Anggota</th>
                  <th className="pb-4 font-medium">NIA</th>
                  <th className="pb-4 font-medium">Sabuk</th>
                  <th className="pb-4 font-medium">Dojo</th>
                  <th className="pb-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentMembers.map((member, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-all group">
                    <td className="py-4 font-medium text-white">{member.fullName}</td>
                    <td className="py-4 text-gray-400 font-mono">{member.nia}</td>
                    <td className="py-4">
                      <span className="px-2 py-1 bg-amber-500/10 text-amber-500 rounded text-[10px] font-bold uppercase">
                        {member.currentRank}
                      </span>
                    </td>
                    <td className="py-4 text-gray-400">{member.dojo?.name || 'Umum'}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${member.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-xs">{member.status}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Sidebar Area */}
        <div className="space-y-8">
          <div className="glass-card">
            <h3 className="text-xl font-bold mb-4">Pengumuman Terakhir</h3>
            <div className="space-y-4">
              {[
                { title: 'Instruksi Seragam Baru', date: '01 Mei 2026', target: 'Semua Anggota' },
                { title: 'Update Iuran 2026', date: '28 Apr 2026', target: 'Ketua Cabang' },
                { title: 'Jadwal Kejurnas JKT', date: '25 Apr 2026', target: 'Semua Anggota' },
              ].map((news, i) => (
                <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all cursor-pointer">
                  <p className="text-[10px] text-amber-500 uppercase font-bold tracking-widest">{news.target}</p>
                  <h4 className="font-medium mt-1">{news.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">{news.date}</p>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-2 text-sm text-gray-500 hover:text-white transition-all">
              Lihat Semua Pengumuman
            </button>
          </div>

          <div className="glass-card bg-gradient-to-br from-amber-500/20 to-transparent">
            <h3 className="text-xl font-bold mb-2">Pusat Bantuan</h3>
            <p className="text-sm text-gray-400 mb-6">Butuh panduan teknis pengelolaan organisasi?</p>
            <button className="w-full btn-primary text-sm flex items-center justify-center gap-2">
              <MessageSquare size={18} />
              Hubungi Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
