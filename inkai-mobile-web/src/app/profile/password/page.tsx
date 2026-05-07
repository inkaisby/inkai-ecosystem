"use client";

import { useState } from "react";
import { ArrowLeft, KeyRound, Lock, Loader2 } from "lucide-react";
import styles from "./ChangePassword.module.css";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import CustomToast from "@/components/CustomToast/CustomToast";

export default function ChangePassword() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as const });
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setToast({ show: true, message: 'Konfirmasi kata sandi tidak cocok!', type: 'error' });
      return;
    }
    
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSaving(false);
    setToast({ show: true, message: 'Kata sandi berhasil diperbarui!', type: 'success' });
    setTimeout(() => {
      router.back();
    }, 2000);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.backBtn}>
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.title}>GANTI KATA SANDI</h1>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label}>Kata Sandi Lama</label>
          <div className={styles.inputWrapper}>
            <Lock size={20} className={styles.inputIcon} />
            <input 
              type="password" 
              className={styles.input}
              required
              value={formData.oldPassword}
              onChange={(e) => setFormData({...formData, oldPassword: e.target.value})}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Kata Sandi Baru</label>
          <div className={styles.inputWrapper}>
            <KeyRound size={20} className={styles.inputIcon} />
            <input 
              type="password" 
              className={styles.input}
              required
              value={formData.newPassword}
              onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Konfirmasi Kata Sandi Baru</label>
          <div className={styles.inputWrapper}>
            <KeyRound size={20} className={styles.inputIcon} />
            <input 
              type="password" 
              className={styles.input}
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
            />
          </div>
        </div>

        <button type="submit" className={styles.submitBtn} disabled={isSaving}>
          {isSaving ? <Loader2 className={styles.spinner} size={20} /> : "PERBARUI KATA SANDI"}
        </button>
      </form>

      <CustomToast 
        isVisible={toast.show} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ ...toast, show: false })} 
      />
    </div>
  );
}
