"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Loader2 } from "lucide-react";
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
    <div className="min-h-screen bg-[#0A0A0C] flex flex-col items-center px-10 py-12">
      <style jsx global>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px #161618 inset !important;
          -webkit-text-fill-color: white !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>
      {/* Logo Section - Ukuran lebih proporsional */}
      <div className="mb-12 mt-4">
        <Image 
          src="/logo.png" 
          alt="INKAI Logo" 
          width={100} 
          height={100} 
          className="mx-auto"
          priority
        />
      </div>

      <div className="w-full max-w-[340px]">
        <form className="space-y-8" onSubmit={handleLogin}>
          {/* Email/NIA Field */}
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">
              Email atau Nomor Anggota (NIA):
            </label>
            <input 
              type="text" 
              placeholder="email@contoh.com atau 123.456.789"
              className="w-full bg-[#161618] border border-[#262626] rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-amber-500 transition-all placeholder:text-gray-700"
              style={{ backgroundColor: '#161618', color: 'white' }}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>

          {/* Password Field */}
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">
              Kata Sandi:
            </label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••"
                className="w-full bg-[#161618] border border-[#262626] rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-amber-500 transition-all placeholder:text-gray-700"
                style={{ backgroundColor: '#161618', color: 'white' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-amber-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Forgot Password */}
          <div className="text-right !mt-2">
            <button type="button" className="text-amber-500 text-xs font-bold hover:text-amber-400">
              Lupa Kata Sandi?
            </button>
          </div>

          {/* Login Button */}
          <button 
            type="submit" 
            className="w-full bg-amber-500 hover:bg-amber-600 text-black font-black py-4 rounded-2xl text-[12px] uppercase tracking-widest transition-all active:scale-[0.97] shadow-lg shadow-amber-500/10"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : "MASUK (LOGIN)"}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center my-12">
          <div className="flex-grow border-t border-[#1f1f22]"></div>
          <span className="flex-shrink mx-4 text-[10px] font-black text-gray-700 tracking-widest uppercase">ATAU</span>
          <div className="flex-grow border-t border-[#1f1f22]"></div>
        </div>

        {/* Register Buttons - Jarak lebih lega */}
        <div className="space-y-10">
          <div className="text-center">
            <p className="text-gray-600 text-[11px] font-bold mb-4 uppercase tracking-wide">Belum punya akun / Anggota baru?</p>
            <button 
              type="button" 
              className="w-full border border-[#262626] hover:bg-white/5 text-white font-bold py-4 rounded-2xl text-[12px] uppercase tracking-wider transition-all active:scale-[0.97]"
              onClick={() => router.push('/register')}
            >
              DAFTAR SEKARANG
            </button>
          </div>

          <div className="text-center pb-10">
            <p className="text-gray-600 text-[11px] font-bold mb-4 uppercase tracking-wide">Pendaftaran Orang Tua (Untuk Anak):</p>
            <button 
              type="button" 
              className="w-full border border-[#262626] hover:bg-white/5 text-white font-bold py-4 rounded-2xl text-[12px] uppercase tracking-wider transition-all active:scale-[0.97]"
              onClick={() => router.push('/register-parent')}
            >
              DAFTAR SEBAGAI ORANG TUA
            </button>
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
