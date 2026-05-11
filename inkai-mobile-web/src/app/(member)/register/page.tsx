"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Eye, EyeOff, User, Mail, Phone, Lock } from "lucide-react";
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
    <div className="relative min-h-screen w-full bg-[#050505] flex flex-col items-center justify-center overflow-hidden px-6 py-12">
      {/* Dynamic Ambient Background */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-20%] left-[-20%] w-[800px] h-[800px] bg-amber-500/10 blur-[150px] rounded-full" 
        />
      </div>

      <div className="w-full max-w-[440px] relative z-10">
        <button 
          onClick={() => router.back()} 
          className="group flex items-center gap-3 text-gray-500 hover:text-white transition-all mb-10 text-[10px] font-black uppercase tracking-[0.3em]"
          disabled={isLoading}
        >
          <div className="p-2 bg-white/5 rounded-xl group-hover:bg-amber-500/10 transition-colors">
            <ArrowLeft size={16} />
          </div>
          Kembali
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="premium-glass inner-glow p-10 rounded-[2.5rem] border-white/5 shadow-2xl"
        >
          <div className="mb-10">
            <h1 className="text-2xl font-black tracking-tight text-white mb-2 uppercase">PENDAFTARAN ANGGOTA</h1>
            <div className="h-[2px] w-12 bg-amber-500 mb-3" />
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">Bergabung dengan INKAI Ecosystem</p>
          </div>
          
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Nama Lengkap</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-amber-500 transition-colors" size={18} />
                <input 
                  type="text" 
                  className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-white focus:outline-none focus:border-amber-500/50 transition-all placeholder:text-gray-700 uppercase" 
                  placeholder="Masukkan nama lengkap" 
                  required 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  disabled={isLoading} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-amber-500 transition-colors" size={18} />
                <input 
                  type="email" 
                  className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-white focus:outline-none focus:border-amber-500/50 transition-all placeholder:text-gray-700" 
                  placeholder="email@contoh.com" 
                  required 
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  disabled={isLoading} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Nomor WhatsApp</label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-amber-500 transition-colors" size={18} />
                <input 
                  type="tel" 
                  className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-white focus:outline-none focus:border-amber-500/50 transition-all placeholder:text-gray-700" 
                  placeholder="08..." 
                  required 
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                  disabled={isLoading} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Kata Sandi</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-amber-500 transition-colors" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-12 py-4 text-sm font-bold text-white focus:outline-none focus:border-amber-500/50 transition-all placeholder:text-gray-700" 
                  placeholder="••••••••" 
                  required 
                  value={formData.password} 
                  onChange={(e) => setFormData({...formData, password: e.target.value})} 
                  disabled={isLoading} 
                />
                <button 
                  type="button" 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="button" 
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black uppercase tracking-[0.2em] py-5 rounded-2xl shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-all disabled:opacity-50 mt-4 text-xs" 
              onClick={handleRegister} 
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : "DAFTAR SEKARANG"}
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
