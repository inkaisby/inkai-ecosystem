"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
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
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[120px] animate-pulse-slow stagger-3" />
      
      {/* Decorative Grid */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] opacity-20 pointer-events-none"></div>

      <div className="w-full max-w-[420px] relative z-10 flex flex-col items-center">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-block relative mb-6 animate-float">
            <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-3xl"></div>
            <div className="relative premium-glass p-2 rounded-full border-white/5">
              <Image 
                src="/logo.png" 
                alt="Inkai Logo" 
                width={100} 
                height={100} 
                className="drop-shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                priority 
              />
            </div>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white leading-tight">
            Institut Karate-Do Indonesia
          </h1>
          <p className="text-amber-500/60 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">
            Portal Digital Anggota
          </p>
        </motion.div>

        {/* Login Form Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="w-full premium-glass inner-glow p-8 rounded-[40px] shadow-2xl border border-white/5"
        >
          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-widest opacity-70">
                Email atau NIA:
              </label>
              <input 
                type="text" 
                placeholder="email@contoh.com atau 123.456.789"
                className="glass-input w-full px-5 py-4 text-sm font-semibold tracking-tight"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-widest opacity-70">
                Kata Sandi:
              </label>
              <div className="relative group">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  className="glass-input w-full px-5 py-4 text-sm font-semibold tracking-tight"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <button 
                  type="button" 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-amber-500 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button type="button" className="text-amber-500 text-xs font-bold float-right mt-[-8px] hover:text-amber-400 transition-colors">
              Lupa Kata Sandi?
            </button>

            <button 
              type="submit" 
              className="btn-primary w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 mt-8"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : "MASUK KE PORTAL"}
            </button>
          </form>

          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-[1px] bg-white/5" />
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">ATAU</span>
            <div className="flex-1 h-[1px] bg-white/5" />
          </div>

          <div className="space-y-3">
            <button 
              type="button" 
              className="w-full py-4 border border-white/10 rounded-2xl text-[11px] font-bold uppercase tracking-[0.1em] hover:bg-white/5 transition-all active:scale-[0.98]"
              onClick={() => router.push('/register')}
            >
              DAFTAR SEKARANG
            </button>
            <p className="text-center text-[10px] text-gray-500 font-medium pt-2">
              Pendaftaran Orang Tua (Untuk Anak):
            </p>
            <button 
              type="button" 
              className="w-full py-4 border border-amber-500/20 rounded-2xl text-[11px] font-bold uppercase tracking-[0.1em] text-amber-500/80 hover:bg-amber-500/5 transition-all active:scale-[0.98]"
              onClick={() => router.push('/register-parent')}
            >
              DAFTAR SEBAGAI ORANG TUA
            </button>
          </div>
        </motion.div>

        <p className="mt-8 text-white/20 text-[9px] font-black uppercase tracking-[0.5em]">
          INKAI Digital Ecosystem v2.0
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

