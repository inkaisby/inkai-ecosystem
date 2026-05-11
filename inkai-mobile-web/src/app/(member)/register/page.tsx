"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import CustomToast from "@/components/CustomToast/CustomToast";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function Register() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' as 'success' | 'error' | 'info' });
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRegister = async () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      setToast({ show: true, message: 'Harap lengkapi semua kolom pendaftaran.', type: 'error' });
      return;
    }
    
    setIsLoading(true);
    try {
      await api.auth.register({
        fullName: formData.name,
        email: formData.email,
        phoneNumber: formData.phone,
        password: formData.password
      });
      
      const loginSuccess = await login(formData.email, formData.password);
      
      if (loginSuccess) {
        setToast({ show: true, message: 'Pendaftaran berhasil! Mengarahkan ke profil...', type: 'success' });
        setTimeout(() => {
          router.push('/profile/edit?new_user=true');
        }, 1500);
      } else {
        setToast({ show: true, message: 'Pendaftaran berhasil! Silakan login.', type: 'success' });
        setTimeout(() => {
          router.push('/');
        }, 1500);
      }
    } catch (error: any) {
      setToast({ show: true, message: error.response?.data?.message || 'Terjadi kesalahan saat mendaftar.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] animate-pulse-slow stagger-2" />

      <div className="w-full max-w-[420px] relative z-10">
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 text-sm font-bold uppercase tracking-widest"
          disabled={isLoading}
        >
          <ArrowLeft size={18} /> Kembali
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-glass inner-glow p-8 rounded-[40px] shadow-2xl border border-white/5"
        >
          <div className="mb-8">
            <h1 className="text-2xl font-black tracking-tight text-white mb-2">Pendaftaran Anggota</h1>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em]">Bergabung dengan INKAI Ecosystem</p>
          </div>
          
          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-widest opacity-70">Nama Lengkap:</label>
              <input type="text" className="glass-input w-full px-5 py-4 text-sm font-semibold" placeholder="Masukkan nama lengkap" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} disabled={isLoading} />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-widest opacity-70">Email:</label>
              <input type="email" className="glass-input w-full px-5 py-4 text-sm font-semibold" placeholder="email@contoh.com" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} disabled={isLoading} />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-widest opacity-70">Nomor WA:</label>
              <input type="tel" className="glass-input w-full px-5 py-4 text-sm font-semibold" placeholder="08..." required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} disabled={isLoading} />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-widest opacity-70">Kata Sandi:</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="glass-input w-full px-5 py-4 text-sm font-semibold" 
                  placeholder="••••••••" 
                  required 
                  value={formData.password} 
                  onChange={(e) => setFormData({...formData, password: e.target.value})} 
                  disabled={isLoading} 
                />
                <button 
                  type="button" 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-amber-500 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="button" className="btn-primary w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] mt-6 flex items-center justify-center gap-3" onClick={handleRegister} disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : "DAFTAR SEKARANG"}
            </button>
          </form>
        </motion.div>
      </div>

      <CustomToast 
        isVisible={toast.show} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ ...toast, show: false })} 
      />
    </div>
  );
}

