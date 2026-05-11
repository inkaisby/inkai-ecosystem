"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
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
      setToast({ show: true, message: error.response?.data?.message || 'Gagal mendaftar. Silakan coba lagi.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0f1115] flex flex-col items-center p-8">
      <div className="w-full max-w-[400px]">
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-12 text-sm font-bold"
          disabled={isLoading}
        >
          <ArrowLeft size={18} /> Kembali
        </button>

        <div className="mb-10">
          <h1 className="text-2xl font-black text-white mb-2">Pendaftaran Anggota</h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Lengkapi data untuk bergabung</p>
        </div>
        
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-2">
            <label className="text-[12px] font-bold text-gray-400">Nama Lengkap:</label>
            <input 
              type="text" 
              className="w-full bg-[#1c1f26] border border-[#2d3139] rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-amber-500 transition-all" 
              placeholder="Masukkan nama lengkap" 
              required 
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
              disabled={isLoading} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[12px] font-bold text-gray-400">Email:</label>
            <input 
              type="email" 
              className="w-full bg-[#1c1f26] border border-[#2d3139] rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-amber-500 transition-all" 
              placeholder="email@contoh.com" 
              required 
              value={formData.email} 
              onChange={(e) => setFormData({...formData, email: e.target.value})} 
              disabled={isLoading} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[12px] font-bold text-gray-400">Nomor WhatsApp:</label>
            <input 
              type="tel" 
              className="w-full bg-[#1c1f26] border border-[#2d3139] rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-amber-500 transition-all" 
              placeholder="Contoh: 08123456789" 
              required 
              value={formData.phone} 
              onChange={(e) => setFormData({...formData, phone: e.target.value})} 
              disabled={isLoading} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[12px] font-bold text-gray-400">Kata Sandi:</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                className="w-full bg-[#1c1f26] border border-[#2d3139] rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-amber-500 transition-all" 
                placeholder="••••••••" 
                required 
                value={formData.password} 
                onChange={(e) => setFormData({...formData, password: e.target.value})} 
                disabled={isLoading} 
              />
              <button 
                type="button" 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button 
            type="button" 
            className="w-full bg-amber-500 hover:bg-amber-600 text-black font-black py-4 rounded-2xl text-sm transition-all active:scale-[0.98] mt-8 flex items-center justify-center gap-2" 
            onClick={handleRegister} 
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : "DAFTAR SEKARANG"}
          </button>
        </form>
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
