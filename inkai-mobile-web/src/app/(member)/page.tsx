"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import CustomToast from "@/components/CustomToast/CustomToast";

export default function MemberLogin() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { login, user, isLoading: isAuthLoading } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "info" as "success" | "error" | "info" });

  useEffect(() => {
    setMounted(true);
    if (user) router.replace("/dashboard");
  }, [user, router]);

  if (!mounted) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setToast({ show: true, message: "Harap isi email dan kata sandi.", type: "error" });
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(formData.email, formData.password);
      if (success) {
        setToast({ show: true, message: "Selamat Datang Kembali!", type: "success" });
        setTimeout(() => router.replace("/dashboard"), 1500);
      } else {
        setToast({ show: true, message: "Email atau kata sandi salah.", type: "error" });
      }
    } catch (err: any) {
      setToast({ show: true, message: err.response?.data?.message || "Gagal masuk.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#050505] flex flex-col items-center justify-center overflow-hidden px-6 py-12">
      {/* Dynamic Ambient Background */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.25, 0.15],
            x: [0, 50, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-500/20 blur-[120px] rounded-full" 
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.1, 0.2, 0.1],
            x: [0, -40, 0],
            y: [0, -50, 0]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-15%] left-[-15%] w-[600px] h-[600px] bg-amber-600/10 blur-[150px] rounded-full" 
        />
      </div>

      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center mb-12 z-10"
      >
        <div className="relative mb-6">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-15px] border border-amber-500/20 rounded-full border-dashed"
          />
          <div className="w-24 h-24 rounded-full bg-white p-1 shadow-2xl shadow-amber-500/10 flex items-center justify-center z-10 relative">
            <img src="/logo.png" alt="INKAI Logo" className="w-20 h-20 object-contain" />
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-black tracking-[0.2em] text-white uppercase mb-2">
            INSTITUT KARATE-DO INDONESIA
          </h1>
          <div className="h-[2px] w-12 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mb-3" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500/80">
            PORTAL DIGITAL ANGGOTA
          </p>
        </div>
      </motion.div>

      {/* Main Login Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="w-full max-w-sm premium-glass inner-glow rounded-[2.5rem] p-10 z-10"
      >
        <form onSubmit={handleLogin} className="space-y-8">
          <div className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                EMAIL ATAU NIA
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-amber-500 transition-colors" size={18} />
                <input 
                  type="text" 
                  className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-white focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.05] transition-all placeholder:text-gray-700"
                  placeholder="email@contoh.com atau 123.456.789"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                KATA SANDI
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-amber-500 transition-colors" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-12 py-4 text-sm font-bold text-white focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.05] transition-all placeholder:text-gray-700"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="flex justify-end">
                <button type="button" className="text-[10px] font-black uppercase tracking-widest text-amber-500/60 hover:text-amber-500 transition-colors">
                  Lupa Kata Sandi?
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black uppercase tracking-[0.2em] py-5 rounded-2xl shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none text-xs"
            >
              {isLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : "MASUK KE PORTAL"}
            </button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5"></div>
              </div>
              <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                <span className="bg-transparent px-4 text-gray-600">ATAU</span>
              </div>
            </div>

            <button 
              type="button"
              onClick={() => router.push("/register")}
              className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black uppercase tracking-[0.2em] py-5 rounded-2xl active:scale-[0.98] transition-all text-xs"
            >
              DAFTAR SEKARANG
            </button>
          </div>

          <div className="pt-6 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-4">
              Pendaftaran Orang Tua (Untuk Anak):
            </p>
            <button 
              type="button"
              onClick={() => router.push("/register-parent")}
              className="text-[11px] font-black uppercase tracking-[0.15em] text-white/40 hover:text-amber-500 transition-colors underline underline-offset-8 decoration-amber-500/30 hover:decoration-amber-500"
            >
              DAFTAR SEBAGAI ORANG TUA
            </button>
          </div>
        </form>
      </motion.div>

      {/* Footer Info */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.8 }}
        className="mt-12 text-center z-10"
      >
        <div className="flex items-center justify-center gap-2 mb-2 text-white/20">
          <ShieldCheck size={12} />
          <p className="text-[10px] font-black uppercase tracking-widest">
            Secured Connection
          </p>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/10">
          INKAI DIGITAL ECOSYSTEM V2.0
        </p>
      </motion.div>

      <CustomToast 
        isVisible={toast.show} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ ...toast, show: false })} 
      />
    </div>
  );
}
