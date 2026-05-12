'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { api } from '@/lib/api';

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
      const response = await api.auth.login(formData);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Login gagal. Silakan periksa kembali kredensial Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[120px]" />

      <div className="w-full max-w-[450px] space-y-8 relative z-10">
        <div className="text-center space-y-2">
          <div className="mb-6 flex justify-center">
            <Image 
              src="/inkai-logo.png" 
              alt="INKAI Logo" 
              width={140} 
              height={140} 
              className="drop-shadow-[0_0_20px_rgba(245,158,11,0.2)] animate-pulse-slow rounded-full"
              priority
              unoptimized
            />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white">INKAI</h1>
          <p className="text-gray-500 font-medium uppercase tracking-[0.2em] text-xs">Institut Karate-do Indonesia</p>
        </div>

        <div className="glass-card p-8 border border-white/5 bg-white/[0.02] backdrop-blur-xl rounded-[32px] shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-sm animate-in fade-in zoom-in duration-300">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email atau NIA</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-amber-500 transition-colors" size={20} />
                  <input 
                    type="text" 
                    required
                    value={formData.identifier}
                    onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-[20px] pl-12 pr-4 py-4 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-all placeholder:text-gray-700"
                    placeholder="nama@email.com atau 123.456.789"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-amber-500 transition-colors" size={20} />
                  <input 
                    type="password" 
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-[20px] pl-12 pr-4 py-4 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-all placeholder:text-gray-700"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold py-4 rounded-[20px] transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_40px_rgba(245,158,11,0.2)]"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : 'Masuk ke Portal'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <p className="text-gray-600 text-xs">
              Masalah login? Hubungi <span className="text-amber-500/60 font-medium">IT Support INKAI Pusat</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
