"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Loader2, Mail, Lock, ChevronRight, UserPlus, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import CustomToast from "@/components/CustomToast/CustomToast";
import { motion } from "framer-motion";

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
    <div className="min-h-screen bg-[#050505] flex flex-col items-center px-6 py-10 font-sans">
      <style jsx global>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px #1A1A1D inset !important;
          -webkit-text-fill-color: white !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>

      {/* Header & Logo */}
      <div className="mb-12 flex flex-col items-center">
        <Image 
          src="/logo.png" 
          alt="INKAI Logo" 
          width={80} 
          height={80} 
          className="mb-4"
          priority
        />
        <h2 className="text-white text-lg font-bold tracking-tight">Ecosystem Digital INKAI</h2>
        <p className="text-gray-500 text-xs font-medium">Masuk ke akun Anda</p>
      </div>

      <div className="w-full max-w-[360px] space-y-10">
        
        {/* Section 1: Login Form Group */}
        <section className="bg-[#0F0F12] p-6 rounded-[32px] border border-white/[0.03] shadow-xl">
          <form className="space-y-5" onSubmit={handleLogin}>
            {/* Identifier Field */}
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-gray-400 ml-1">
                Email atau Nomor Anggota (NIA)
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-amber-500 transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="email@contoh.com"
                  className="w-full bg-[#1A1A1D] border border-transparent rounded-2xl pl-12 pr-5 py-4 text-white text-[14px] focus:outline-none focus:border-amber-500/50 focus:bg-[#202024] transition-all placeholder:text-gray-700"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-gray-400 ml-1">
                Kata Sandi
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-amber-500 transition-colors" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  className="w-full bg-[#1A1A1D] border border-transparent rounded-2xl pl-12 pr-12 py-4 text-white text-[14px] focus:outline-none focus:border-amber-500/50 focus:bg-[#202024] transition-all placeholder:text-gray-700"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button" 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-amber-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end !mt-3">
              <button type="button" className="text-amber-500 text-xs font-bold hover:text-amber-400 transition-colors">
                Lupa Kata Sandi?
              </button>
            </div>

            <button 
              type="submit" 
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-extrabold h-[54px] rounded-2xl text-[14px] transition-all active:scale-[0.97] flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Masuk Sekarang"}
            </button>
          </form>
        </section>

        {/* Section 2: Registration Group */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="flex-grow border-t border-white/[0.05]"></div>
            <span className="text-[11px] font-black text-gray-700 tracking-widest uppercase">Pendaftaran</span>
            <div className="flex-grow border-t border-white/[0.05]"></div>
          </div>

          <div className="space-y-3">
            {/* Register Card 1 */}
            <button 
              onClick={() => router.push('/register')}
              className="w-full flex items-center gap-4 bg-[#0F0F12] p-4 rounded-2xl border border-white/[0.03] hover:bg-[#16161A] transition-all active:scale-[0.98] group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <UserPlus size={20} />
              </div>
              <div className="flex-grow text-left">
                <h4 className="text-white text-[13px] font-bold">Anggota Baru</h4>
                <p className="text-gray-600 text-[11px]">Daftar NIA dan akun baru</p>
              </div>
              <ChevronRight size={16} className="text-gray-700 group-hover:text-amber-500 transition-colors" />
            </button>

            {/* Register Card 2 */}
            <button 
              onClick={() => router.push('/register-parent')}
              className="w-full flex items-center gap-4 bg-[#0F0F12] p-4 rounded-2xl border border-white/[0.03] hover:bg-[#16161A] transition-all active:scale-[0.98] group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Users size={20} />
              </div>
              <div className="flex-grow text-left">
                <h4 className="text-white text-[13px] font-bold">Orang Tua</h4>
                <p className="text-gray-600 text-[11px]">Daftarkan akun untuk anak</p>
              </div>
              <ChevronRight size={16} className="text-gray-700 group-hover:text-amber-500 transition-colors" />
            </button>
          </div>
        </section>

        {/* Footer */}
        <p className="text-center text-[10px] text-gray-700 font-bold tracking-widest uppercase pb-6">
          v2.0 • Institut Karate-Do Indonesia
        </p>
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
