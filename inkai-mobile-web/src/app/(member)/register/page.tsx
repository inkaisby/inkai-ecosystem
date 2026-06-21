"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Eye,
  EyeOff,
  User,
  Mail,
  Smartphone,
  Lock,
  ShieldCheck,
  MapPin,
  LogIn,
} from "lucide-react";
import CustomToast from "@/components/CustomToast/CustomToast";
import ScrollButtons from "@/components/ScrollButtons/ScrollButtons";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import styles from "./Register.module.css";

export default function Register() {
  const router = useRouter();
  const { login } = useAuth();
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "info" as "success" | "error" | "info",
  });
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [provinces, setProvinces] = useState<{ id: string; name: string }[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [dojos, setDojos] = useState<{ id: string; name: string }[]>([]);
  const [provinceId, setProvinceId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [dojoId, setDojoId] = useState("");
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [isLoadingDojos, setIsLoadingDojos] = useState(false);

  useEffect(() => {
    router.prefetch("/login");
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoadingProvinces(true);
      try {
        const res = await api.org.getProvinces();
        if (!cancelled && res.status === "success" && Array.isArray(res.data)) {
          setProvinces(res.data);
        }
      } catch {
        if (!cancelled) {
          setToast({ show: true, message: "Gagal memuat daftar provinsi.", type: "error" });
        }
      } finally {
        if (!cancelled) setIsLoadingProvinces(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchBranches = async (pid: string) => {
    setIsLoadingBranches(true);
    try {
      const res = await api.org.getBranches(pid);
      if (res.status === "success" && Array.isArray(res.data)) setBranches(res.data);
      else setBranches([]);
    } catch {
      setBranches([]);
      setToast({ show: true, message: "Gagal memuat cabang.", type: "error" });
    } finally {
      setIsLoadingBranches(false);
    }
  };

  const fetchDojos = async (bid: string) => {
    setIsLoadingDojos(true);
    try {
      const res = await api.org.getDojos(bid);
      if (res.status === "success" && Array.isArray(res.data)) setDojos(res.data);
      else setDojos([]);
    } catch {
      setDojos([]);
      setToast({ show: true, message: "Gagal memuat dojo.", type: "error" });
    } finally {
      setIsLoadingDojos(false);
    }
  };

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setProvinceId(val);
    setBranchId("");
    setDojoId("");
    setBranches([]);
    setDojos([]);
    if (val) void fetchBranches(val);
  };

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setBranchId(val);
    setDojoId("");
    setDojos([]);
    if (val) void fetchDojos(val);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      setToast({ show: true, message: "Harap lengkapi semua kolom pendaftaran.", type: "error" });
      return;
    }
    if (!dojoId) {
      setToast({
        show: true,
        message: "Silakan pilih Provinsi, Cabang, dan Dojo/Ranting.",
        type: "error",
      });
      return;
    }

    setIsLoading(true);
    try {
      await api.auth.register({
        fullName: formData.name,
        email: formData.email,
        phoneNumber: formData.phone,
        password: formData.password,
        dojoId,
      });

      const loginResult = await login(formData.email, formData.password);

      if (loginResult.ok) {
        setToast({
          show: true,
          message: "Pendaftaran berhasil! Mengarahkan ke profil…",
          type: "success",
        });
        setTimeout(() => {
          router.push("/profile/edit?new_user=true");
        }, 1500);
      } else {
        setToast({ show: true, message: "Pendaftaran berhasil! Silakan login.", type: "success" });
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      }
    } catch (error: unknown) {
      const message =
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response &&
        error.response.data &&
        typeof error.response.data === "object" &&
        "message" in error.response.data &&
        typeof error.response.data.message === "string"
          ? error.response.data.message
          : "Gagal mendaftar. Silakan coba lagi.";
      setToast({ show: true, message, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.shell}>
      <div className={styles.ambient} aria-hidden="true">
        <div className={styles.ambientOrbAmber} />
        <div className={styles.ambientOrbBlue} />
      </div>

      <header className={styles.headerBar}>
        <Link href="/" className={styles.backBtn} aria-label="Kembali ke beranda">
          <ArrowLeft size={18} />
        </Link>
        <div className={styles.headerText}>
          <p className={styles.headerTitle}>Daftar Anggota</p>
          <p className={styles.headerSubtitle}>Registrasi Keanggotaan INKAI</p>
        </div>
      </header>

      <main className={styles.main}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className={styles.infoBanner}
        >
          <strong>NIA (Nomor Induk Anggota)</strong> akan diterbitkan setelah verifikasi pengurus,
          setelah Anda melengkapi profil dan dokumen pada langkah berikutnya.
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className={styles.formCard}
        >
          <div className={styles.formAccent} aria-hidden="true" />

          <form className={styles.form} onSubmit={handleRegister}>
            <section className={styles.sectionBlock} aria-labelledby="register-wilayah">
              <h2 id="register-wilayah" className={styles.sectionTitle}>
                <span className={styles.sectionTitleBar} />
                Wilayah Latihan
              </h2>

              <div className={styles.field}>
                <label htmlFor="register-province" className={styles.label}>
                  Provinsi
                </label>
                <div className={styles.inputWrap}>
                  <span className={styles.inputIcon} aria-hidden="true">
                    <MapPin size={18} />
                  </span>
                  <select
                    id="register-province"
                    className={`${styles.input} ${styles.select} ${styles.inputWithAction}`}
                    value={provinceId}
                    onChange={handleProvinceChange}
                    required
                    disabled={isLoading || isLoadingProvinces}
                  >
                    <option value="">Pilih provinsi</option>
                    {provinces.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  {isLoadingProvinces && (
                    <span className={styles.inputLoader} aria-hidden="true">
                      <Loader2 className="animate-spin" size={18} />
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="register-branch" className={styles.label}>
                  Cabang
                </label>
                <div className={styles.inputWrap}>
                  <span className={styles.inputIcon} aria-hidden="true">
                    <MapPin size={18} />
                  </span>
                  <select
                    id="register-branch"
                    className={`${styles.input} ${styles.select} ${styles.inputWithAction}`}
                    value={branchId}
                    onChange={handleBranchChange}
                    required
                    disabled={isLoading || !provinceId || isLoadingBranches}
                  >
                    <option value="">Pilih cabang</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  {isLoadingBranches && (
                    <span className={styles.inputLoader} aria-hidden="true">
                      <Loader2 className="animate-spin" size={18} />
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="register-dojo" className={styles.label}>
                  Dojo / Ranting
                </label>
                <div className={styles.inputWrap}>
                  <span className={styles.inputIcon} aria-hidden="true">
                    <MapPin size={18} />
                  </span>
                  <select
                    id="register-dojo"
                    className={`${styles.input} ${styles.select} ${styles.inputWithAction}`}
                    value={dojoId}
                    onChange={(e) => setDojoId(e.target.value)}
                    required
                    disabled={isLoading || !branchId || isLoadingDojos}
                  >
                    <option value="">Pilih dojo atau ranting</option>
                    {dojos.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  {isLoadingDojos && (
                    <span className={styles.inputLoader} aria-hidden="true">
                      <Loader2 className="animate-spin" size={18} />
                    </span>
                  )}
                </div>
              </div>

              <p className={styles.hint}>Pilihan dojo tidak dapat diubah sendiri setelah pendaftaran.</p>
            </section>

            <section className={styles.sectionBlock} aria-labelledby="register-data">
              <h2 id="register-data" className={styles.sectionTitle}>
                <span className={styles.sectionTitleBar} />
                Data Anggota
              </h2>

              <div className={styles.field}>
                <label htmlFor="register-name" className={styles.label}>
                  Nama Lengkap
                </label>
                <div className={styles.inputWrap}>
                  <span className={styles.inputIcon} aria-hidden="true">
                    <User size={18} />
                  </span>
                  <input
                    id="register-name"
                    type="text"
                    className={styles.input}
                    placeholder="Masukkan nama lengkap"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={isLoading}
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="register-email" className={styles.label}>
                  Email
                </label>
                <div className={styles.inputWrap}>
                  <span className={styles.inputIcon} aria-hidden="true">
                    <Mail size={18} />
                  </span>
                  <input
                    id="register-email"
                    type="email"
                    className={styles.input}
                    placeholder="email@contoh.com"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="register-phone" className={styles.label}>
                  Nomor WhatsApp
                </label>
                <div className={styles.inputWrap}>
                  <span className={styles.inputIcon} aria-hidden="true">
                    <Smartphone size={18} />
                  </span>
                  <input
                    id="register-phone"
                    type="tel"
                    className={styles.input}
                    placeholder="Contoh: 08123456789"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={isLoading}
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="register-password" className={styles.label}>
                  Kata Sandi
                </label>
                <div className={styles.inputWrap}>
                  <span className={styles.inputIcon} aria-hidden="true">
                    <Lock size={18} />
                  </span>
                  <input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    className={`${styles.input} ${styles.inputWithAction}`}
                    placeholder="••••••••"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className={styles.togglePassword}
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </section>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              className={styles.submitBtn}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>Daftar Sekarang</span>
                </>
              )}
            </motion.button>

            <div className={styles.divider}>
              <div className={styles.dividerLine} />
              <span className={styles.dividerText}>Sudah punya akun?</span>
              <div className={styles.dividerLine} />
            </div>

            <Link href="/login" prefetch className={styles.loginLink}>
              <LogIn size={14} />
              <span>Masuk ke Portal</span>
            </Link>
          </form>
        </motion.div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerAccent} aria-hidden="true" />
        <p className={styles.footerCopy}>© 2026 Institut Karate-Do Indonesia (INKAI)</p>
      </footer>

      <ScrollButtons compact />

      <CustomToast
        isVisible={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  );
}
