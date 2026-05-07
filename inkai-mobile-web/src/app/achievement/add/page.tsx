"use client";

import { useState } from "react";
import { ArrowLeft, Award, Calendar, MapPin, CloudUpload, Loader2 } from "lucide-react";
import styles from "./AddAchievement.module.css";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import CustomToast from "@/components/CustomToast/CustomToast";

export default function AddAchievement() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as const });
  const [formData, setFormData] = useState({
    type: 'SABUK',
    title: '',
    date: '',
    location: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSaving(false);
    setToast({ show: true, message: 'Data berhasil dikirim untuk validasi!', type: 'success' });
    
    // Wait for toast to show before going back
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
        <h1 className={styles.title}>TAMBAH PRESTASI</h1>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label}>Tipe Riwayat</label>
          <div className={styles.selectWrapper}>
            <select 
              className={styles.select}
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
            >
              <option value="SABUK">Kenaikan Sabuk</option>
              <option value="PIAGAM">Piagam / Pertandingan</option>
              <option value="PELATIHAN">Pelatihan / Sertifikasi</option>
            </select>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Judul Prestasi / Tingkatan</label>
          <div className={styles.inputWrapper}>
            <Award size={20} className={styles.inputIcon} />
            <input 
              type="text" 
              placeholder="Contoh: Juara 1 Kumite atau Sabuk Kuning Kyu 8" 
              className={styles.input}
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Tanggal</label>
          <div className={styles.inputWrapper}>
            <Calendar size={20} className={styles.inputIcon} />
            <input 
              type="date" 
              className={styles.input}
              required
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Lokasi</label>
          <div className={styles.inputWrapper}>
            <MapPin size={20} className={styles.inputIcon} />
            <input 
              type="text" 
              placeholder="Contoh: Dojo Pusat atau Jakarta" 
              className={styles.input}
              required
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Upload Sertifikat (Opsional)</label>
          <div className={styles.uploadBox}>
            <CloudUpload size={32} className={styles.uploadIcon} />
            <p className={styles.uploadText}>Klik untuk pilih file sertifikat</p>
          </div>
        </div>

        <button type="submit" className={styles.submitBtn} disabled={isSaving}>
          {isSaving ? <Loader2 className={styles.spinner} size={20} /> : "KIRIM UNTUK VALIDASI"}
        </button>

        <p className={styles.hint}>
          *Data akan divalidasi oleh admin sebelum muncul di profil.
        </p>
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
