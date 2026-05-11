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
    <div className="min-h-screen bg-[#0f1115] flex flex-col items-center p-8">
      {/* Logo Section */}
      <div className="mt-12 mb-16">
        <Image 
          src="/logo.png" 
          alt="INKAI Logo" 
          width={120} 
          height={120} 
          priority
        />
      </div>

      <div className="w-full max-w-[400px]">
        <form className="space-y-6" onSubmit={handleLogin}>
          {/* Email/NIA Field */}
          <div className="space-y-2">
            <label className="text-[12px] font-bold text-gray-400">
              Email atau Nomor Anggota (NIA):
            </label>
            <input 
              type="text" 
              placeholder="email@contoh.com atau 123.456.789"
              className="w-full bg-[#1c1f26] border border-[#2d3139] rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-amber-500 transition-all"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className="text-[12px] font-bold text-gray-400">
              Kata Sandi:
            </label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••"
                className="w-full bg-[#1c1f26] border border-[#2d3139] rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-amber-500 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Forgot Password */}
          <div className="text-right">
            <button type="button" className="text-amber-500 text-sm font-semibold hover:underline">
              Lupa Kata Sandi?
            </button>
          </div>

          {/* Login Button */}
          <button 
            type="submit" 
            className="w-full bg-amber-500 hover:bg-amber-600 text-black font-black py-4 rounded-2xl text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : "MASUK (LOGIN)"}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center my-10">
          <div className="flex-grow border-t border-[#2d3139]"></div>
          <span className="flex-shrink mx-4 text-xs font-bold text-gray-600">ATAU</span>
          <div className="flex-grow border-t border-[#2d3139]"></div>
        </div>

        {/* Register Buttons */}
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-gray-500 text-sm mb-4">Belum punya akun / Anggota baru?</p>
            <button 
              type="button" 
              className="w-full border border-gray-700 hover:bg-gray-800 text-white font-bold py-4 rounded-2xl text-sm transition-all active:scale-[0.98]"
              onClick={() => router.push('/register')}
            >
              DAFTAR SEKARANG
            </button>
          </div>

          <div className="text-center">
            <p className="text-gray-500 text-sm mb-4">Pendaftaran Orang Tua (Untuk Anak):</p>
            <button 
              type="button" 
              className="w-full border border-gray-700 hover:bg-gray-800 text-white font-bold py-4 rounded-2xl text-sm transition-all active:scale-[0.98]"
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
