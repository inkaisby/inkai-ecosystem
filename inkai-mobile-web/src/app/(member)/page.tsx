"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Loader2, Mail, Lock, UserPlus, Users, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import CustomToast from "@/components/CustomToast/CustomToast";

export default function Login() {
  const [mounted, setMounted] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'error' as const });
  const { login, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(identifier, password);
    if (success) {
      router.push("/dashboard");
    } else {
      setToast({ show: true, message: "Login Gagal. Cek kembali data Anda.", type: 'error' });
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0f1115] flex flex-col items-center px-8 py-12">
      {/* Logo Section */}
      <div className="mb-8">
        <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center p-4">
          <Image 
            src="/logo.png" 
            alt="INKAI Logo" 
            width={100} 
            height={100} 
            priority
          />
        </div>
      </div>

      {/* Title Section */}
      <div className="text-center mb-12">
        <h1 className="text-2xl font-black text-white tracking-wider mb-2">ECOSYSTEM DIGITAL INKAI</h1>
        <p className="text-gray-500 text-sm font-medium">Masuk ke akun anggota Anda</p>
      </div>

      <div className="w-full max-w-[400px]">
        <form className="space-y-8" onSubmit={handleLogin}>
          {/* Email/NIA Field */}
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">
              EMAIL ATAU NIA
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={20} />
              <input 
                type="text" 
                placeholder="email@contoh.com"
                className="w-full bg-[#1c1f26] border border-[#2d3139] rounded-2xl px-12 py-4 text-white text-sm focus:outline-none focus:border-orange-500 transition-all placeholder:text-gray-600"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">
              KATA SANDI
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={20} />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••"
                className="w-full bg-[#1c1f26] border border-[#2d3139] rounded-2xl px-12 py-4 text-white text-sm focus:outline-none focus:border-orange-500 transition-all placeholder:text-gray-600"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Forgot Password */}
          <div className="text-right !mt-3">
            <button type="button" className="text-orange-600 text-sm font-black hover:text-orange-500 transition-colors">
              Lupa Kata Sandi?
            </button>
          </div>

          {/* Login Button */}
          <button 
            type="submit" 
            className="w-full bg-[#ff6b1a] hover:bg-[#ff7b30] text-black font-black py-5 rounded-3xl text-sm uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : "MASUK SEKARANG"}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center my-12">
          <div className="flex-grow border-t border-[#1c1f26]"></div>
          <span className="flex-shrink mx-4 text-[10px] font-black text-gray-700 tracking-[0.3em] uppercase">PENDAFTARAN</span>
          <div className="flex-grow border-t border-[#1c1f26]"></div>
        </div>

        {/* Registration Cards */}
        <div className="space-y-4">
          <div 
            className="w-full bg-[#1c1f26] hover:bg-[#252a33] p-5 rounded-3xl flex items-center gap-4 cursor-pointer transition-all active:scale-[0.98] border border-transparent hover:border-white/5"
            onClick={() => router.push('/register')}
          >
            <div className="w-12 h-12 bg-orange-600/10 rounded-2xl flex items-center justify-center">
              <UserPlus className="text-orange-600" size={24} />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-white font-bold text-base leading-tight">Anggota Baru</h3>
              <p className="text-gray-500 text-xs">Daftar NIA dan akun baru</p>
            </div>
            <ChevronRight className="text-gray-700" size={20} />
          </div>

          <div 
            className="w-full bg-[#1c1f26] hover:bg-[#252a33] p-5 rounded-3xl flex items-center gap-4 cursor-pointer transition-all active:scale-[0.98] border border-transparent hover:border-white/5"
            onClick={() => router.push('/register-parent')}
          >
            <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center">
              <Users className="text-blue-500" size={24} />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-white font-bold text-base leading-tight">Orang Tua</h3>
              <p className="text-gray-500 text-xs">Daftarkan akun untuk anak</p>
            </div>
            <ChevronRight className="text-gray-700" size={20} />
          </div>
        </div>
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
