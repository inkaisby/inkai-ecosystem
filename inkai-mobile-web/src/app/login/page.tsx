"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  UserPlus,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import CustomToast from "@/components/CustomToast/CustomToast";
import styles from "./Login.module.css";

export default function Login() {
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login(identifier, password);
    if (result.ok) {
      const params = new URLSearchParams(window.location.search);
      const nextPath = params.get("next");
      const safeNext =
        nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
          ? nextPath
          : "/dashboard";
      router.push(safeNext);
    } else {
      setToast({
        show: true,
        message: result.message,
        type: "error",
      });
    }
  };

  return (
    <div className={styles.shell}>
      <div className={styles.ambient} aria-hidden="true">
        <div className={styles.ambientOrbAmber} />
        <div className={styles.ambientOrbBlue} />
      </div>

      <header className={styles.headerBar}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => router.push("/")}
          aria-label="Kembali ke beranda"
        >
          <ArrowLeft size={18} />
        </button>
        <div className={styles.headerText}>
          <p className={styles.headerTitle}>Masuk Anggota</p>
          <p className={styles.headerSubtitle}>Portal INKAI Digital</p>
        </div>
      </header>

      <main className={styles.main}>
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={styles.brand}
        >
          <div className={styles.logoWrap}>
            <div className={styles.logoGlow} aria-hidden="true" />
            <div className={styles.logoCircle}>
              <Image
                src="/logo.png"
                alt="INKAI Logo"
                width={64}
                height={64}
                priority
                unoptimized
              />
            </div>
          </div>
          <h1 className={styles.brandName}>Institut Karate-Do Indonesia</h1>
          <p className={styles.brandTagline}>Sistem Informasi Anggota</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className={styles.formCard}
        >
          <div className={styles.formAccent} aria-hidden="true" />

          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="login-identifier" className={styles.label}>
                Identitas Anggota
              </label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon} aria-hidden="true">
                  <Mail size={18} />
                </span>
                <input
                  id="login-identifier"
                  type="text"
                  placeholder="Email atau NIA"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className={styles.input}
                  required
                  autoFocus
                  autoComplete="username"
                />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="login-password" className={styles.label}>
                Kata Sandi
              </label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon} aria-hidden="true">
                  <Lock size={18} />
                </span>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${styles.input} ${styles.inputPassword}`}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className={styles.forgotRow}>
              <button
                type="button"
                className={styles.forgotBtn}
                onClick={() => router.push("/forgot-password")}
              >
                Lupa Kata Sandi?
              </button>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className={styles.submitBtn}
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>Masuk Sekarang</span>
                </>
              )}
            </motion.button>

            <div className={styles.divider}>
              <div className={styles.dividerLine} />
              <span className={styles.dividerText}>Belum punya akun?</span>
              <div className={styles.dividerLine} />
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => router.push("/register")}
              className={styles.registerBtn}
            >
              <UserPlus size={14} />
              <span>Daftar Anggota Baru</span>
            </motion.button>
          </form>
        </motion.div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerAccent} aria-hidden="true" />
        <p className={styles.footerCopy}>© 2026 Institut Karate-Do Indonesia (INKAI)</p>
      </footer>

      <CustomToast
        isVisible={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  );
}
