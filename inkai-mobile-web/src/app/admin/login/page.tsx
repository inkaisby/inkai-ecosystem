'use client';

import React, { useState } from 'react';
import { Shield, Mail, Lock, Loader2, AlertCircle, ChevronRight, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.identifier || !formData.password) {
      toast.error('Harap isi semua bidang');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const response = await api.auth.adminLogin(formData);
      if (response.status === 'success') {
        localStorage.setItem('inkai_token', response.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        toast.success('Selamat datang kembali, Admin!');
        window.location.href = '/admin'; // Force reload to refresh context
      } else {
        throw new Error(response.message || 'Login gagal');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Login gagal. Periksa kredensial Anda.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 adm-bg flex flex-col items-center justify-center py-12 px-0 relative overflow-hidden">
      {/* Ambient Background Elements - Very subtle */}
      <div 
        className="absolute bg-amber-500/[0.02] rounded-full blur-[100px] animate-pulse-slow" 
        style={{ width: '300px', height: '300px', top: '-50px', right: '-50px' }}
      />
      <div 
        className="absolute bg-red-600/[0.01] rounded-full blur-[100px] animate-pulse-slow stagger-3" 
        style={{ width: '300px', height: '300px', bottom: '-50px', left: '-50px' }}
      />
      
      <div className="w-full max-w-[400px] relative z-10 flex flex-col items-center">
        {/* Header Section */}
        <div className="text-center mb-10 animate-in flex flex-col items-center w-full">
          <div className="relative mb-6 animate-float flex items-center justify-center w-24 h-24">
            {/* Single clean glow effect using shadow instead of multiple layers */}
            <div className="relative bg-white/5 backdrop-blur-2xl p-4 rounded-full border border-white/10 shadow-[0_0_50px_rgba(245,158,11,0.2)] flex items-center justify-center w-full h-full">
              <Image 
                src="/inkai-logo.png" 
                alt="INKAI Logo" 
                width={60} 
                height={60} 
                className="drop-shadow-[0_0_10px_rgba(245,158,11,0.3)] relative z-10"
                priority
                unoptimized
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tighter text-white uppercase leading-none">INKAI <span className="text-amber-500">PORTAL</span></h1>
            <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[8px] opacity-80">
              Institut Karate-do Indonesia
            </p>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="glass-card-opaque p-6 sm:p-8 rounded-[2.5rem] shadow-2xl border border-white/5 relative overflow-hidden animate-in stagger-1">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
          
          <div className="text-center mb-8">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500/60 mb-1">Administrator Access</h2>
            <p className="text-lg font-bold text-white tracking-tight">Silakan Masuk</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-[11px] font-bold animate-in">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Email/NIA Field */}
              <div className="space-y-2 animate-in stagger-2">
                <label className="text-[9px] font-black text-gray-500 uppercase ml-1 tracking-[0.2em]">
                  Email atau NIA
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-amber-500 transition-colors">
                    <Mail size={16} strokeWidth={2.5} />
                  </div>
                  <input 
                    type="text" 
                    required
                    value={formData.identifier}
                    onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                    className="glass-input w-full pl-12 pr-4 py-4 text-sm font-bold tracking-tight placeholder:text-gray-800"
                    placeholder="Masukkan Email atau NIA"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2 animate-in stagger-3">
                <label className="text-[9px] font-black text-gray-500 uppercase ml-1 tracking-[0.2em]">
                  Kata Sandi
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-amber-500 transition-colors">
                    <Lock size={16} strokeWidth={2.5} />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="glass-input w-full pl-12 pr-12 py-4 text-sm font-bold tracking-tight placeholder:text-gray-800"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary w-full py-4.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 mt-6 shadow-xl shadow-amber-500/20 active:scale-95 transition-all"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <Shield size={18} strokeWidth={2.5} />
                  <span>Masuk Ke Portal</span>
                  <ChevronRight size={14} className="opacity-40" />
                </>
              )}
            </button>
          </form>

          {/* Footer Info */}
          <div className="mt-8 pt-6 border-t border-white/5 text-center animate-in stagger-4">
            <p className="text-gray-600 text-[9px] font-bold uppercase tracking-widest leading-relaxed">
              Masalah login? Hubungi <span className="text-amber-500/40">IT Support INKAI Pusat</span>
            </p>
          </div>
        </div>
        
        {/* Version Info */}
        <div className="text-center mt-8 animate-in stagger-5">
          <p className="text-white/10 text-[8px] font-black uppercase tracking-[0.6em]">Admin Dashboard v2.1</p>
        </div>
      </div>
    </div>
  );
}
