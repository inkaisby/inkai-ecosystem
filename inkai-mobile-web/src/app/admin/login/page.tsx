'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Mail, Lock, Loader2, AlertCircle, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.auth.adminLogin(formData);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      toast.success('Selamat datang kembali, Admin!');
      router.push('/admin');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Login gagal. Periksa kredensial Anda.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient Background Elements */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[140px] animate-pulse-slow" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[140px] animate-pulse-slow stagger-3" />
      
      {/* Decorative Grid */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] opacity-20 pointer-events-none"></div>

      <div className="w-full max-w-[420px] relative z-10">
        {/* Header Section */}
        <div className="text-center mb-10 animate-in">
          <div className="inline-block relative mb-6 animate-float">
            <div className="absolute inset-0 bg-amber-500/30 rounded-full blur-3xl"></div>
            <div className="relative premium-glass p-1 rounded-full border-amber-500/20">
              <Image 
                src="/inkai-logo.png" 
                alt="INKAI Logo" 
                width={100} 
                height={100} 
                className="drop-shadow-[0_0_20px_rgba(245,158,11,0.3)] relative z-10"
                priority
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <h1 className="text-5xl font-black tracking-[-0.05em] text-white leading-none">INKAI</h1>
            <p className="text-amber-500 font-bold uppercase tracking-[0.4em] text-[10px] opacity-90">
              Institut Karate-do Indonesia
            </p>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="premium-glass inner-glow p-8 rounded-[40px] shadow-2xl animate-in stagger-1">
          <div className="text-center mb-8">
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-500 mb-1">Portal Login</h2>
            <div className="h-0.5 w-12 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mx-auto"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-xs font-medium animate-in">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-5">
              {/* Email/NIA Field */}
              <div className="space-y-2 animate-in stagger-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-widest opacity-70">
                  Email atau NIA
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-amber-500 transition-all duration-300">
                    <Mail size={18} strokeWidth={2.5} />
                  </div>
                  <input 
                    type="text" 
                    required
                    value={formData.identifier}
                    onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                    className="glass-input w-full pl-12 pr-4 py-4 text-sm font-semibold tracking-tight placeholder:text-gray-700/50"
                    placeholder="Masukkan Email atau NIA"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2 animate-in stagger-3">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-widest opacity-70">
                  Kata Sandi
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-amber-500 transition-all duration-300">
                    <Lock size={18} strokeWidth={2.5} />
                  </div>
                  <input 
                    type="password" 
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="glass-input w-full pl-12 pr-4 py-4 text-sm font-semibold tracking-tight placeholder:text-gray-700/50"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 mt-4 active:scale-[0.98] transition-transform duration-200"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <Shield size={18} strokeWidth={2.5} />
                  <span>Masuk Ke Portal</span>
                  <ChevronRight size={16} className="opacity-50" />
                </>
              )}
            </button>
          </form>

          {/* Footer Info */}
          <div className="mt-10 pt-8 border-t border-white/5 text-center animate-in stagger-4">
            <p className="text-gray-600 text-[10px] font-bold uppercase tracking-tight leading-relaxed px-4">
              Masalah login? Hubungi <span className="text-amber-500/60">IT Support INKAI Pusat</span>
            </p>
          </div>
        </div>
        
        {/* Version Info */}
        <div className="text-center mt-8 animate-in stagger-5">
          <p className="text-white/20 text-[9px] font-black uppercase tracking-[0.5em]">Admin Dashboard v2.0</p>
        </div>
      </div>
    </div>
  );
}
