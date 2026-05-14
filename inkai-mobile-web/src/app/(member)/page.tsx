"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  UserPlus,
  Users,
  ChevronRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import CustomToast from "@/components/CustomToast/CustomToast";

export default function Login() {
  const [mounted, setMounted] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "error" as const,
  });
  const { login, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login(identifier, password);
    if (result.ok) {
      router.push("/dashboard");
    } else {
      setToast({
        show: true,
        message: result.message,
        type: "error",
      });
    }
  };

  if (!mounted) return null;

  return (
    <div
      className="flex flex-col"
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--background-dark)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background Blurs */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          overflow: "hidden",
          zIndex: 0,
        }}
      >
        <motion.div
          animate={{ opacity: [0.1, 0.15, 0.1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            top: "-10%",
            left: "-10%",
            width: "70%",
            height: "70%",
            backgroundColor: "var(--ambient-orb-amber)",
            filter: "blur(100px)",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-10%",
            right: "-10%",
            width: "50%",
            height: "50%",
            backgroundColor: "var(--ambient-orb-blue)",
            filter: "blur(100px)",
            borderRadius: "50%",
          }}
        />
      </div>

      <div
        className="flex flex-col py-8"
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "480px",
          margin: "0 auto",
          flex: 1,
        }}
      >
        {/* Logo Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center mb-8"
        >
          <div style={{ position: "relative" }}>
            <div
              style={{
                position: "absolute",
                inset: "-4px",
                background: "var(--gradient-gold)",
                borderRadius: "50%",
                opacity: 0.2,
                filter: "blur(8px)",
              }}
            />
            <div
              className="flex items-center justify-center bg-white rounded-full shadow-2xl"
              style={{
                width: "100px",
                height: "100px",
                position: "relative",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <Image
                src="/logo.png"
                alt="INKAI Logo"
                width={70}
                height={70}
                priority
                unoptimized
                style={{ position: "relative", zIndex: 2 }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to bottom, transparent, rgba(0,0,0,0.05))",
                  zIndex: 1,
                }}
              />
            </div>
          </div>
          <h1
            className="mt-6 font-black tracking-widest text-center uppercase"
            style={{
              fontSize: "1.25rem",
              color: "var(--text-light)",
              letterSpacing: "0.2em",
            }}
          >
            Institut Karate-Do Indonesia
          </h1>
          <p className="text-gray-500 text-10 font-bold tracking-widest uppercase mt-2">
            Sistem Informasi Anggota
          </p>
        </motion.div>

        {/* Login Form Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-card p-6 shadow-2xl"
          style={{ borderRadius: "2rem" }}
        >
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Identity Field */}
            <div className="space-y-2">
              <label className="text-10 font-black text-gray-500 uppercase tracking-widest ml-1">
                Identitas Anggota
              </label>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    left: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                    zIndex: 2,
                  }}
                >
                  <Mail size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Email atau NIA"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="glass-input w-full py-4 pl-12 pr-4 text-sm"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-10 font-black text-gray-500 uppercase tracking-widest ml-1">
                Kata Sandi
              </label>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    left: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                    zIndex: 2,
                  }}
                >
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input w-full py-4 pl-12 pr-12 text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                    zIndex: 2,
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="text-right" style={{ marginTop: "0.5rem" }}>
              <button
                type="button"
                className="text-10 font-bold uppercase tracking-widest"
                style={{ color: "var(--primary-gold)", opacity: 0.8 }}
              >
                Lupa Kata Sandi?
              </button>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-4 rounded-xl font-black uppercase tracking-widest"
              style={{
                fontSize: "0.7rem",
                padding: "1.2rem",
                boxShadow: "0 8px 20px -6px rgba(245, 158, 11, 0.3)",
              }}
            >
              <div className="flex items-center justify-center gap-2">
                {isLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>MASUK SEKARANG</span>
                  </>
                )}
              </div>
            </motion.button>
          </form>
        </motion.div>

        {/* Quick Access/Registration */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 space-y-4 mb-8"
        >
          <div
            className="flex items-center px-4"
            style={{ position: "relative" }}
          >
            <div
              style={{ flex: 1, height: "1px", background: "var(--hairline)" }}
            />
            <span className="px-4 text-10 font-black text-gray-500 tracking-widest uppercase">
              Registrasi
            </span>
            <div
              style={{ flex: 1, height: "1px", background: "var(--hairline)" }}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/register")}
              className="flex items-center justify-between p-4 rounded-2xl"
              style={{
                backgroundColor: "var(--surface-row-bg)",
                border: "1px solid var(--surface-row-border)",
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="flex items-center justify-center rounded-xl"
                  style={{
                    width: "44px",
                    height: "44px",
                    backgroundColor: "rgba(245, 158, 11, 0.1)",
                    color: "var(--primary-gold)",
                  }}
                >
                  <UserPlus size={20} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white">Anggota Baru</p>
                  <p className="text-10 text-gray-500">
                    Daftar nomor induk (NIA)
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-500" />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/register-parent")}
              className="flex items-center justify-between p-4 rounded-2xl"
              style={{
                backgroundColor: "var(--surface-row-bg)",
                border: "1px solid var(--surface-row-border)",
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="flex items-center justify-center rounded-xl"
                  style={{
                    width: "44px",
                    height: "44px",
                    backgroundColor: "rgba(59, 130, 246, 0.1)",
                    color: "#3b82f6",
                  }}
                >
                  <Users size={20} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white">Orang Tua</p>
                  <p className="text-10 text-gray-500">
                    Akses akun untuk wali murid
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-500" />
            </motion.button>
          </div>
        </motion.div>

        <footer className="mt-auto pt-4 pb-2 text-center">
          <p className="text-10 text-gray-500 font-bold tracking-widest uppercase flex items-center justify-center gap-2">
            <Zap size={10} style={{ color: "var(--primary-gold)" }} />
            <span></span>
          </p>
        </footer>
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
