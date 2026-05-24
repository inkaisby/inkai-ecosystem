"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Loader2,
  Mail,
  ChevronLeft,
  Send,
} from "lucide-react";
import { api } from "@/lib/api";
import CustomToast from "@/components/CustomToast/CustomToast";

export default function ForgotPassword() {
  const [mounted, setMounted] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "error" as const,
  });
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await api.auth.forgotPassword({ identifier });
      setToast({
        show: true,
        message: response.message || "Instruksi pemulihan telah dikirim",
        type: "success",
      });
      // Optionally redirect to login after a few seconds
      setTimeout(() => {
        router.push("/");
      }, 3000);
    } catch (error: any) {
      setToast({
        show: true,
        message: error.response?.data?.message || "Gagal mengirim instruksi",
        type: "error",
      });
    } finally {
      setIsLoading(false);
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
        className="flex flex-col"
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "480px",
          margin: "0 auto",
          paddingTop: "2.5rem",
          paddingBottom: "2rem",
          flex: 1,
        }}
      >
        <div className="px-6 mb-6">
          <button
            onClick={() => router.push("/")}
            className="flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} className="mr-1" />
            <span className="text-sm font-bold tracking-wider uppercase">Kembali</span>
          </button>
        </div>

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
                width: "80px",
                height: "80px",
                position: "relative",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <Image
                src="/logo.png"
                alt="INKAI Logo"
                width={56}
                height={56}
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
            className="mt-6 font-black tracking-widest text-center uppercase px-4"
            style={{
              fontSize: "1.25rem",
              color: "var(--text-light)",
              letterSpacing: "0.1em",
            }}
          >
            Lupa Kata Sandi
          </h1>
          <p className="text-gray-500 text-xs text-center mt-3 px-6 leading-relaxed">
            Masukkan Email atau NIA Anda untuk menerima instruksi pemulihan kata sandi.
          </p>
        </motion.div>

        {/* Form Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-card p-6 shadow-2xl mx-4"
          style={{ borderRadius: "2rem" }}
        >
          <form onSubmit={handleForgotPassword} className="space-y-6">
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
                  autoFocus
                />
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading || !identifier}
              className="btn-primary w-full py-4 rounded-xl font-black uppercase tracking-widest disabled:opacity-50"
              style={{
                fontSize: "0.75rem",
                padding: "1.2rem",
                boxShadow: "0 8px 20px -6px rgba(245, 158, 11, 0.3)",
              }}
            >
              <div className="flex items-center justify-center gap-2">
                {isLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <Send size={16} />
                    <span>KIRIM INSTRUKSI</span>
                  </>
                )}
              </div>
            </motion.button>
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
