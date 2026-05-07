"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, User, Phone, MapPin, Calendar, Loader2 } from "lucide-react";
import styles from "./EditProfile.module.css";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import CustomToast from "@/components/CustomToast/CustomToast";

export default function EditProfile() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as const });
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    gender: 'MALE',
    birthDate: ''
  });

  useEffect(() => {
    setMounted(true);
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        phoneNumber: user.phoneNumber || '',
        gender: user.gender || 'MALE',
        birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : ''
      });
    }
  }, [user]);

  if (!mounted || isAuthLoading || !user) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={40} />
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSaving(false);
    setToast({ show: true, message: 'Profil berhasil diperbarui!', type: 'success' });
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
        <h1 className={styles.title}>EDIT PROFIL</h1>
      </header>

      <form className={styles.form} onSubmit={handleSave}>
        <div className={styles.field}>
          <label className={styles.label}>Nama Lengkap</label>
          <div className={styles.inputWrapper}>
            <User size={20} className={styles.inputIcon} />
            <input 
              type="text" 
              className={styles.input}
              value={formData.fullName}
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Nomor WhatsApp</label>
          <div className={styles.inputWrapper}>
            <Phone size={20} className={styles.inputIcon} />
            <input 
              type="text" 
              className={styles.input}
              value={formData.phoneNumber}
              onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Jenis Kelamin</label>
          <div className={styles.radioGroup}>
            <button 
              type="button" 
              className={`${styles.radioBtn} ${formData.gender === 'MALE' ? styles.radioActive : ''}`}
              onClick={() => setFormData({...formData, gender: 'MALE'})}
            >
              Laki-laki
            </button>
            <button 
              type="button" 
              className={`${styles.radioBtn} ${formData.gender === 'FEMALE' ? styles.radioActive : ''}`}
              onClick={() => setFormData({...formData, gender: 'FEMALE'})}
            >
              Perempuan
            </button>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Tanggal Lahir</label>
          <div className={styles.inputWrapper}>
            <Calendar size={20} className={styles.inputIcon} />
            <input 
              type="date" 
              className={styles.input}
              value={formData.birthDate}
              onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
            />
          </div>
        </div>

        <button type="submit" className={styles.saveBtn} disabled={isSaving}>
          {isSaving ? <Loader2 className={styles.spinner} size={20} /> : "SIMPAN PERUBAHAN"}
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
