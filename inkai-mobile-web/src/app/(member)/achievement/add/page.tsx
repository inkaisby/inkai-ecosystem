"use client";

import { useState, useRef } from "react";
import { ArrowLeft, Award, Calendar, MapPin, CloudUpload, Loader2 } from "lucide-react";
import styles from "./AddAchievement.module.css";
import { useRouter } from "next/navigation";
import CustomToast from "@/components/CustomToast/CustomToast";
import { isAxiosError } from "axios";
import api from "@/lib/api";
import { compressImage } from "@/lib/imageUtils";

const CERT_MAX_MB = 15;

const SABUK_KYU_TITLES = [
  "Putih Kyu-10",
  "Kuning Kyu-8",
  "Hijau Kyu-6",
  "Biru Kyu-5",
  "Biru Kyu-4",
  "Coklat Kyu-3",
  "Coklat Kyu-2",
  "Coklat Kyu-1",
] as const;

const SABUK_DAN_TITLES = Array.from({ length: 10 }, (_, i) => `Dan ${i + 1}`);

export default function AddAchievement() {
  const router = useRouter();
  const certInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompressingCert, setIsCompressingCert] = useState(false);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const [formData, setFormData] = useState({
    type: 'SABUK',
    sabukGradeKind: 'KYU' as 'KYU' | 'DAN',
    title: '',
    date: '',
    location: ''
  });

  const isSabuk = formData.type === 'SABUK';
  const sabukTitleOptions = formData.sabukGradeKind === 'KYU' ? SABUK_KYU_TITLES : SABUK_DAN_TITLES;

  function updateForm(partial: Partial<typeof formData>) {
    setFormData((prev) => ({ ...prev, ...partial }));
  }

  async function handleCertificateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const maxBytes = CERT_MAX_MB * 1024 * 1024;
    if (file.size > maxBytes) {
      setToast({
        show: true,
        message: `Ukuran file maksimal ${CERT_MAX_MB} MB`,
        type: "error",
      });
      return;
    }

    setIsCompressingCert(true);
    try {
      const prepared = await compressImage(file, 800);
      setCertificateFile(prepared);
    } catch {
      setCertificateFile(file);
    } finally {
      setIsCompressingCert(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      let proofUrl = "";
      if (certificateFile) {
        const fd = new FormData();
        fd.append("file", certificateFile);
        const uploadRes = await api.auth.uploadFile(fd);
        const url =
          uploadRes &&
          typeof uploadRes === "object" &&
          "fileUrl" in uploadRes &&
          typeof (uploadRes as { fileUrl: unknown }).fileUrl === "string"
            ? (uploadRes as { fileUrl: string }).fileUrl
            : "";
        if (!url) {
          throw new Error("Upload sertifikat gagal: URL tidak diterima dari server.");
        }
        proofUrl = url;
      }

      const verificationType = formData.type === "SABUK" ? "RANK_PROMOTION" : "ACHIEVEMENT";
      const verificationData =
        formData.type === "SABUK"
          ? JSON.stringify({
              title: formData.title,
              date: formData.date,
              location: formData.location,
            })
          : JSON.stringify({
              category: formData.type,
              title: formData.title,
              date: formData.date,
              location: formData.location,
            });

      await api.verifications.claim({
        type: verificationType,
        data: verificationData,
        proofUrl: proofUrl || "—",
      });

      setIsSaving(false);
      setToast({ show: true, message: "Data berhasil dikirim untuk validasi!", type: "success" });

      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (err: unknown) {
      setIsSaving(false);
      let msg = "Gagal mengirim data. Silakan coba lagi.";
      if (isAxiosError(err)) {
        const data = err.response?.data;
        if (data && typeof data === "object" && "message" in data && typeof data.message === "string") {
          msg = data.message;
        }
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setToast({ show: true, message: msg, type: "error" });
    }
  };

  const certBusy = isCompressingCert;

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
              onChange={(e) => {
                const nextType = e.target.value;
                setFormData((prev) => {
                  const wasSabuk = prev.type === "SABUK";
                  const nowSabuk = nextType === "SABUK";
                  return {
                    ...prev,
                    type: nextType,
                    title: wasSabuk !== nowSabuk ? "" : prev.title,
                  };
                });
              }}
            >
              <option value="SABUK">Kenaikan Sabuk</option>
              <option value="PIAGAM">Piagam / Pertandingan</option>
              <option value="PELATIHAN">Pelatihan / Sertifikasi</option>
            </select>
          </div>
        </div>

        {isSabuk && (
          <div className={styles.field}>
            <label className={styles.label}>Jenis Tingkatan</label>
            <div className={styles.selectWrapper}>
              <select
                className={styles.select}
                value={formData.sabukGradeKind}
                onChange={(e) => {
                  const sabukGradeKind = e.target.value as 'KYU' | 'DAN';
                  updateForm({ sabukGradeKind, title: '' });
                }}
              >
                <option value="KYU">Kyu</option>
                <option value="DAN">DAN</option>
              </select>
            </div>
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.label}>Judul Prestasi / Tingkatan</label>
          {isSabuk ? (
            <div className={styles.inputWrapper}>
              <Award size={20} className={styles.inputIcon} />
              <select
                className={styles.selectInWrapper}
                required
                value={formData.title}
                onChange={(e) => updateForm({ title: e.target.value })}
              >
                <option value="" disabled>
                  Pilih tingkatan
                </option>
                {sabukTitleOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className={styles.inputWrapper}>
              <Award size={20} className={styles.inputIcon} />
              <input
                type="text"
                placeholder="Contoh: Juara 1 Kumite atau sertifikat pelatihan"
                className={styles.input}
                required
                value={formData.title}
                onChange={(e) => updateForm({ title: e.target.value })}
              />
            </div>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Tanggal</label>
          <div className={styles.inputWrapper}>
            <Calendar size={20} className={styles.inputIcon} />
            <input 
              type="date" 
              className={`${styles.input} ${styles.dateInput}`}
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

        <div className={`${styles.field} ${styles.certFieldWrap}`}>
          <span className={styles.label}>Upload Sertifikat (Opsional)</span>
          <input
            id="achievement-cert-input"
            ref={certInputRef}
            type="file"
            className={styles.certInput}
            accept="application/pdf,image/jpeg,image/png,image/webp,image/heic"
            aria-label="Pilih file sertifikat"
            onChange={handleCertificateChange}
          />
          {!certificateFile ? (
            <label htmlFor="achievement-cert-input" className={styles.uploadBox}>
              {certBusy ? (
                <Loader2 className={`${styles.uploadIcon} ${styles.spinner}`} size={32} />
              ) : (
                <CloudUpload size={32} className={styles.uploadIcon} />
              )}
              <p className={styles.uploadText}>
                {certBusy ? "Memproses file…" : "Klik untuk pilih file sertifikat"}
              </p>
              <p className={styles.uploadHint}>PDF atau gambar · maks. {CERT_MAX_MB} MB</p>
            </label>
          ) : (
            <div className={`${styles.uploadBox} ${styles.uploadBoxHasFile}`}>
              <CloudUpload size={32} className={styles.uploadIcon} />
              <div className={styles.uploadFileRow}>
                <span className={styles.uploadFileName} title={certificateFile.name}>
                  {certificateFile.name}
                </span>
                <button
                  type="button"
                  className={styles.uploadRemoveBtn}
                  onClick={() => {
                    setCertificateFile(null);
                    if (certInputRef.current) {
                      certInputRef.current.value = "";
                    }
                  }}
                >
                  Hapus
                </button>
              </div>
              <button
                type="button"
                className={styles.uploadChangeBtn}
                onClick={() => certInputRef.current?.click()}
              >
                Pilih file lain
              </button>
            </div>
          )}
        </div>

        <button type="submit" className={styles.submitBtn} disabled={isSaving || certBusy}>
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
