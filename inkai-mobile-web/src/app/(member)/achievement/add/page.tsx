"use client";

import { useMemo, useState, useRef, useEffect, Suspense } from "react";
import { ArrowLeft, Award, Calendar, MapPin, CloudUpload, Loader2, Lock, FileText } from "lucide-react";
import styles from "./AddAchievement.module.css";
import { useRouter, useSearchParams } from "next/navigation";
import CustomToast from "@/components/CustomToast/CustomToast";
import { isAxiosError } from "axios";
import api from "@/lib/api";
import { compressImage } from "@/lib/imageUtils";
import { useAuth } from "@/context/AuthContext";
import { parseRankPromotionPayload, parseAchievementPayload } from "@/lib/verificationDisplay";

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

function dateToInputValue(raw?: string): string {
  if (!raw?.trim()) return "";
  const s = raw.trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

function inferSabukGradeKind(title: string): "KYU" | "DAN" {
  const t = title.trim();
  if (SABUK_DAN_TITLES.includes(t)) return "DAN";
  return "KYU";
}

function AddAchievementForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resubmitId = searchParams.get("resubmit");

  const { user, isLoading: isAuthLoading, isAdmin, isDocumentComplete } = useAuth();
  const certInputRef = useRef<HTMLInputElement>(null);
  const appliedResubmitRef = useRef<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isCompressingCert, setIsCompressingCert] = useState(false);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });
  const [resubmitBanner, setResubmitBanner] = useState<string | null>(null);
  const typeParam = searchParams.get("type");
  const defaultType = (typeParam === "SABUK" || typeParam === "PIAGAM" || typeParam === "PELATIHAN") 
    ? typeParam 
    : "SABUK";

  const [formData, setFormData] = useState({
    type: defaultType,
    sabukGradeKind: "KYU" as "KYU" | "DAN",
    title: "",
    date: "",
    location: "",
  });

  const isSabuk = formData.type === "SABUK";
  const sabukTitleOptions = formData.sabukGradeKind === "KYU" ? SABUK_KYU_TITLES : SABUK_DAN_TITLES;

  const canSubmitPrestasi = useMemo(() => {
    if (isAdmin) return true;
    if (!user) return false;
    const nia = typeof user.nia === "string" ? user.nia.trim() : "";
    if (!nia) return false;
    return isDocumentComplete;
  }, [user, isAdmin, isDocumentComplete]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || isAuthLoading || !user || !resubmitId?.trim() || !canSubmitPrestasi) return;
    const id = resubmitId.trim();
    if (appliedResubmitRef.current === id) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await api.verifications.getMy();
        if (cancelled) return;
        const list = Array.isArray(res?.data) ? res.data : [];
        const c = list.find((x: { id?: string; status?: string }) => x.id === id && x.status === "REJECTED");
        if (cancelled) return;
        if (!c) {
          setToast({
            show: true,
            message: "Pengajuan tidak ditemukan atau sudah tidak perlu diperbaiki.",
            type: "error",
          });
          return;
        }

        appliedResubmitRef.current = id;

        if (c.type === "RANK_PROMOTION") {
          const p = parseRankPromotionPayload(c.data || "");
          const kind = inferSabukGradeKind(p.title);
          setFormData({
            type: "SABUK",
            sabukGradeKind: kind,
            title: p.title || "",
            date: dateToInputValue(p.date),
            location: typeof p.location === "string" ? p.location : "",
          });
        } else if (c.type === "ACHIEVEMENT") {
          const o = parseAchievementPayload(c.data || "");
          const cat = o.category === "PELATIHAN" ? "PELATIHAN" : "PIAGAM";
          setFormData({
            type: cat,
            sabukGradeKind: "KYU",
            title: o.title || "",
            date: dateToInputValue(o.date),
            location: o.location || "",
          });
        } else {
          appliedResubmitRef.current = null;
          return;
        }

        const note = c.adminNotes && String(c.adminNotes).trim();
        setResubmitBanner(
          note
            ? `Pengajuan sebelumnya ditolak. Catatan admin: ${note}. Perbaiki data lalu kirim ulang.`
            : "Pengajuan sebelumnya ditolak. Perbaiki data lalu kirim ulang."
        );

        router.replace("/achievement/add", { scroll: false });
      } catch {
        if (!cancelled) {
          setToast({ show: true, message: "Gagal memuat data pengajuan lama.", type: "error" });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mounted, isAuthLoading, user, resubmitId, canSubmitPrestasi, router]);

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

  if (!mounted || isAuthLoading || !user) {
    return (
      <div className={styles.loadingScreen}>
        <Loader2 className={styles.spinner} size={40} />
      </div>
    );
  }

  if (!canSubmitPrestasi) {
    const missingNia = !isAdmin && !(typeof user.nia === "string" && user.nia.trim());
    const missingDocs = !isAdmin && !isDocumentComplete;
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <button onClick={() => router.back()} className={styles.backBtn}>
            <ArrowLeft size={20} />
          </button>
          <h1 className={styles.title}>TAMBAH PRESTASI</h1>
        </header>

        <div className={styles.blockedWrap}>
          <Lock size={48} className={styles.blockedIcon} />
          <p className={styles.blockedTitle}>Belum dapat mengajukan prestasi</p>
          <p className={styles.blockedText}>
            {missingNia && (
              <>
                Pastikan <b>NIA</b> Anda sudah aktif (proses aktivasi oleh Ketua Ranting).
                <br />
              </>
            )}
            {missingDocs && (
              <>
                Unggah dokumen wajib: <b>Akte/KK</b> dan <b>BPJS</b> di halaman Dokumen.
              </>
            )}
          </p>

          <div className={styles.blockedActions}>
            <button type="button" className={styles.blockedPrimary} onClick={() => router.push("/documents")}>
              <FileText size={18} />
              Buka halaman Dokumen
            </button>
            <button type="button" className={styles.blockedSecondary} onClick={() => router.push("/profile")}>
              Kembali ke Profil
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.backBtn}>
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.title}>TAMBAH PRESTASI</h1>
      </header>

      {resubmitBanner ? (
        <div className={styles.resubmitBanner} role="status">
          {resubmitBanner} Unggah ulang sertifikat jika dokumen perlu diganti.
        </div>
      ) : null}

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label}>Tipe Riwayat</label>
          <div className={styles.selectWrapper}>
            <select
              className={styles.select}
              value={formData.type}
              onChange={(e) => {
                const nextType = e.target.value as "SABUK" | "PIAGAM" | "PELATIHAN";
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
                  const sabukGradeKind = e.target.value as "KYU" | "DAN";
                  updateForm({ sabukGradeKind, title: "" });
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
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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

        <p className={styles.hint}>*Data akan divalidasi oleh admin sebelum muncul di profil.</p>
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

export default function AddAchievement() {
  return (
    <Suspense
      fallback={
        <div className={styles.loadingScreen}>
          <Loader2 className={styles.spinner} size={40} />
        </div>
      }
    >
      <AddAchievementForm />
    </Suspense>
  );
}
