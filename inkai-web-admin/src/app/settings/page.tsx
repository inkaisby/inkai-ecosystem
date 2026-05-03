'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  User, 
  Shield, 
  Bell, 
  Database, 
  Globe,
  CreditCard,
  ChevronRight,
  Loader2,
  Save,
  LogOut
} from 'lucide-react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin text-amber-500" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <Settings size={20} />
            <span className="text-sm font-bold uppercase tracking-widest">Konfigurasi Portal</span>
          </div>
          <h2 className="text-3xl font-bold">Pengaturan Sistem</h2>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all text-sm font-bold"
        >
          <LogOut size={18} />
          Keluar dari Sistem
        </button>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="xl:col-span-2 space-y-6">
          <div className="glass-card">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <User size={20} className="text-amber-500" />
              Profil Administrator
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs text-gray-500 uppercase font-bold tracking-widest">Nama Lengkap</label>
                <input 
                  type="text" 
                  defaultValue={user?.email?.split('@')[0]}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-500 uppercase font-bold tracking-widest">Email Resmi</label>
                <input 
                  type="email" 
                  defaultValue={user?.email}
                  disabled
                  className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>
            <button 
              disabled={saving}
              onClick={() => { setSaving(true); setTimeout(() => setSaving(false), 1500); }}
              className="mt-8 px-6 py-3 bg-amber-500 text-black rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-amber-400 transition-all"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Simpan Perubahan
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card group hover:bg-white/[0.04] transition-all flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/5 text-gray-400 group-hover:text-amber-500 group-hover:bg-amber-500/10 rounded-xl transition-all">
                  <Shield size={24} />
                </div>
                <div>
                  <h4 className="font-bold">Keamanan</h4>
                  <p className="text-xs text-gray-500 mt-1">Ubah kata sandi & 2FA</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-600 group-hover:text-white transition-all" />
            </div>
            <div 
              onClick={() => router.push('/settings/roles')}
              className="glass-card group hover:bg-white/[0.04] transition-all flex items-center justify-between cursor-pointer border-amber-500/20 bg-amber-500/5"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl transition-all">
                  <Shield size={24} />
                </div>
                <div>
                  <h4 className="font-bold">Hak Akses & Role</h4>
                  <p className="text-xs text-gray-500 mt-1">Atur izin menu & RBAC sistem</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-600 group-hover:text-white transition-all" />
            </div>
            <div className="glass-card group hover:bg-white/[0.04] transition-all flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/5 text-gray-400 group-hover:text-amber-500 group-hover:bg-amber-500/10 rounded-xl transition-all">
                  <Bell size={24} />
                </div>
                <div>
                  <h4 className="font-bold">Notifikasi</h4>
                  <p className="text-xs text-gray-500 mt-1">Atur peringatan sistem</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-600 group-hover:text-white transition-all" />
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="space-y-6">
          <div className="glass-card">
            <h3 className="text-xl font-bold mb-4">Integrasi Luar</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <CreditCard size={18} className="text-blue-400" />
                  <span className="text-sm font-medium">Payment Gateway</span>
                </div>
                <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full font-bold">TERHUBUNG</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <Globe size={18} className="text-purple-400" />
                  <span className="text-sm font-medium">Landing Page</span>
                </div>
                <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full font-bold">TERHUBUNG</span>
              </div>
            </div>
          </div>

          <div className="glass-card bg-amber-500/5 border-amber-500/20">
            <h3 className="font-bold text-amber-500 flex items-center gap-2 mb-2">
              <Shield size={18} />
              Informasi Keamanan
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Seluruh aktivitas administratif di portal ini dicatat dalam **Audit Logs**. Pastikan Anda keluar (Logout) 
              setiap kali selesai bertugas untuk menjaga integritas data keanggotaan INKAI secara nasional.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
