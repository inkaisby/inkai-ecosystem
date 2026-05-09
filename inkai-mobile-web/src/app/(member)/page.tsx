"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import styles from "./Login.module.css";
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

  return (
    <div className={styles.container}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={styles.logoSection}
      >
        <Image src="/logo.png" alt="Inkai Logo" width={120} height={120} className={styles.logo} />
        <h1 className={styles.title}>Institut Karate-Do Indonesia</h1>
      </motion.div>

      <form className={styles.form} onSubmit={handleLogin}>
        <div className={styles.inputGroup}>
          <label className={styles.label}>Email atau Nomor Anggota (NIA):</label>
          <input 
            type="text" 
            placeholder="email@contoh.com atau 123.456.789"
            className={styles.input}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            disabled={!mounted || isLoading}
            suppressHydrationWarning
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>Kata Sandi:</label>
          <div className={styles.passwordWrapper}>
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="••••••••"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={!mounted || isLoading}
              suppressHydrationWarning
            />
            <button 
              type="button" 
              className={styles.togglePassword}
              onClick={() => setShowPassword(!showPassword)}
              suppressHydrationWarning
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <button type="button" className={styles.forgotPassword} suppressHydrationWarning>
          Lupa Kata Sandi?
        </button>

        <button type="submit" className={styles.loginBtn} disabled={!mounted || isLoading} suppressHydrationWarning>
          {(mounted && isLoading) ? <Loader2 className={styles.spinner} size={20} /> : "MASUK (LOGIN)"}
        </button>
      </form>

      <div className={styles.divider}>
        <div className={styles.line} />
        <span className={styles.dividerText}>ATAU</span>
        <div className={styles.line} />
      </div>

      <div className={styles.registerSection}>
        <p className={styles.registerPrompt}>Belum punya akun / Anggota baru?</p>
        <button type="button" className={styles.outlineBtn} suppressHydrationWarning>DAFTAR SEKARANG</button>
        
        <p className={styles.registerPrompt} style={{ marginTop: '24px' }}>
          Pendaftaran Orang Tua (Untuk Anak):
        </p>
        <button type="button" className={styles.outlineBtn} suppressHydrationWarning>DAFTAR SEBAGAI ORANG TUA</button>
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
