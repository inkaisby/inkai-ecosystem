"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import styles from "../Login.module.css";
import { motion } from "framer-motion";
import CustomToast from "@/components/CustomToast/CustomToast";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function RegisterParent() {
  const router = useRouter();
  const { login } = useAuth();
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' as const });
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      setToast({ show: true, message: 'Harap lengkapi semua kolom pendaftaran.', type: 'error' });
      return;
    }
    
    setIsLoading(true);
    try {
      await api.auth.register({
        fullName: formData.name,
        email: formData.email,
        phoneNumber: formData.phone,
        password: formData.password,
        isParent: true
      });
      
      const loginSuccess = await login(formData.email, formData.password);
      
      if (loginSuccess) {
        setToast({ show: true, message: 'Pendaftaran berhasil! Mengarahkan ke profil...', type: 'success' });
        setTimeout(() => {
          router.push('/profile/edit?new_user=true');
        }, 1500);
      } else {
        setToast({ show: true, message: 'Pendaftaran berhasil! Silakan login.', type: 'success' });
        setTimeout(() => {
          router.push('/');
        }, 1500);
      }
    } catch (error: any) {
      setToast({ show: true, message: error.response?.data?.message || 'Terjadi kesalahan saat mendaftar.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <button 
        onClick={() => router.back()} 
        className={styles.outlineBtn} 
        style={{ border: 'none', padding: 0, width: 'fit-content', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}
        disabled={isLoading}
      >
        <ArrowLeft size={20} /> Kembali
      </button>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className={styles.title} style={{ textAlign: 'left', marginBottom: '8px' }}>Pendaftaran Orang Tua</h1>
        <p style={{ color: '#999', fontSize: '14px', marginBottom: '24px' }}>Daftarkan diri Anda sebagai wali untuk mengelola keanggotaan anak.</p>
        
        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Nama Wali / Orang Tua:</label>
            <input type="text" className={styles.input} placeholder="Masukkan nama lengkap" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} disabled={isLoading} />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Email Utama:</label>
            <input type="email" className={styles.input} placeholder="email@contoh.com" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} disabled={isLoading} />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Nomor WA:</label>
            <input type="tel" className={styles.input} placeholder="08..." required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} disabled={isLoading} />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Kata Sandi:</label>
            <div className={styles.passwordWrapper}>
              <input 
                type={showPassword ? "text" : "password"} 
                className={styles.input} 
                placeholder="••••••••" 
                required 
                value={formData.password} 
                onChange={(e) => setFormData({...formData, password: e.target.value})} 
                disabled={isLoading} 
              />
              <button 
                type="button" 
                className={styles.togglePassword}
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button type="button" className={styles.loginBtn} onClick={handleRegister} style={{ marginTop: '24px' }} disabled={isLoading}>
            {isLoading ? <Loader2 className={styles.spinner} size={20} /> : "DAFTAR SEBAGAI ORANG TUA"}
          </button>
        </form>
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
