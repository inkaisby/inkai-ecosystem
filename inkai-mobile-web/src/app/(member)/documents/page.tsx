"use client";

import { useEffect, useState, useRef } from "react";
import { ArrowLeft, Loader2, Upload, ShieldCheck, FileText, Info, CheckCircle2, Eye, X, FileSearch } from "lucide-react";
import styles from "./Documents.module.css";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import CustomToast from "@/components/CustomToast/CustomToast";
import api, { getAssetUrl } from "@/lib/api";
import { compressImage } from "@/lib/imageUtils";
import { scanBpjsCardImage, type BpjsExtracted } from "@/lib/bpjsOcr";

type BpjsOcrPhase = "idle" | "scanning" | "done" | "failed" | "skipped";

export default function Documents() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading, fetchProfile } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  
  const [bcFile, setBcFile] = useState<File | null>(null);
  const [bpjsFile, setBpjsFile] = useState<File | null>(null);
  const [bpjsOcrPhase, setBpjsOcrPhase] = useState<BpjsOcrPhase>("idle");
  const [bpjsOcrExtract, setBpjsOcrExtract] = useState<BpjsExtracted | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  
  const [preview, setPreview] = useState<{ url: string, isPdf: boolean } | null>(null);
  
  const bcInputRef = useRef<HTMLInputElement>(null);
  const bpjsInputRef = useRef<HTMLInputElement>(null);
  const bcDragDepth = useRef(0);
  const bpjsDragDepth = useRef(0);

  const [dragOverBc, setDragOverBc] = useState(false);
  const [dragOverBpjs, setDragOverBpjs] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!bpjsFile) {
      setBpjsOcrPhase("idle");
      setBpjsOcrExtract(null);
      return;
    }
    if (bpjsFile.type === "application/pdf") {
      setBpjsOcrExtract(null);
      setBpjsOcrPhase("skipped");
      return;
    }
    if (!bpjsFile.type.startsWith("image/")) {
      setBpjsOcrExtract(null);
      setBpjsOcrPhase("skipped");
      return;
    }

    let cancelled = false;
    setBpjsOcrPhase("scanning");
    setBpjsOcrExtract(null);

    (async () => {
      try {
        const data = await scanBpjsCardImage(bpjsFile);
        if (!cancelled) {
          setBpjsOcrExtract(data);
          setBpjsOcrPhase("done");
        }
      } catch (err) {
        console.error("BPJS OCR failed:", err);
        if (!cancelled) {
          setBpjsOcrExtract(null);
          setBpjsOcrPhase("failed");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bpjsFile]);

  // Current document URLs from user object
  const currentBcUrl = user?.birthCertificateUrl || user?.member?.birthCertificateUrl || '';
  const currentBpjsUrl = user?.bpjsCardUrl || user?.member?.bpjsCardUrl || '';

  useEffect(() => {
    if (!mounted || isCompressing || !bcFile) return;

    const timer = setTimeout(async () => {
      setIsSaving(true);
      try {
        const bcData = new FormData();
        bcData.append('document', bcFile);
        bcData.append('fieldName', 'akte_lahir');
        await api.members.uploadDocument(bcData);
        setBcFile(null);
        await fetchProfile();
        setLastSaved(new Date());
      } catch (error) {
        console.error('Autosave failed:', error);
      } finally {
        setIsSaving(false);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [bcFile, mounted, isCompressing]);

  useEffect(() => {
    if (!mounted || isCompressing || !bpjsFile) return;
    if (bpjsFile.type.startsWith("image/") && bpjsOcrPhase === "scanning") return;

    const timer = setTimeout(async () => {
      setIsSaving(true);
      try {
        const bpjsData = new FormData();
        bpjsData.append('document', bpjsFile);
        bpjsData.append('fieldName', 'bpjs');
        if (bpjsOcrExtract?.cardNumber) {
          bpjsData.append('bpjsCardNumber', bpjsOcrExtract.cardNumber);
        }
        if (
          bpjsOcrPhase === "done" &&
          bpjsOcrExtract &&
          (bpjsOcrExtract.cardNumber ||
            bpjsOcrExtract.fullName ||
            bpjsOcrExtract.address ||
            bpjsOcrExtract.birthDateIso ||
            bpjsOcrExtract.nik)
        ) {
          bpjsData.append(
            'bpjsOcrExtracted',
            JSON.stringify({
              fullName: bpjsOcrExtract.fullName,
              address: bpjsOcrExtract.address,
              birthDateRaw: bpjsOcrExtract.birthDateRaw,
              birthDateIso: bpjsOcrExtract.birthDateIso,
              nik: bpjsOcrExtract.nik,
              extractedAt: new Date().toISOString(),
            }),
          );
        }
        await api.members.uploadDocument(bpjsData);
        setBpjsFile(null);
        await fetchProfile();
        setLastSaved(new Date());
      } catch (error) {
        console.error('Autosave failed:', error);
      } finally {
        setIsSaving(false);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [bpjsFile, bpjsOcrPhase, bpjsOcrExtract, mounted, isCompressing]);

  if (!mounted || isAuthLoading || !user) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={40} />
      </div>
    );
  }

  const isAcceptedDocFile = (file: File) =>
    file.type.startsWith('image/') ||
    file.type === 'application/pdf' ||
    /\.pdf$/i.test(file.name);

  const ingestDocumentFile = async (file: File | undefined | null, type: 'bc' | 'bpjs') => {
    if (!file) return;
    if (!isAcceptedDocFile(file)) {
      setToast({
        show: true,
        message: 'Format tidak didukung. Gunakan gambar (JPG, PNG, …) atau PDF.',
        type: 'error',
      });
      return;
    }
    setIsCompressing(true);
    try {
      const compressed = await compressImage(file, 250);
      if (type === 'bc') setBcFile(compressed);
      else setBpjsFile(compressed);
    } catch (err) {
      console.error('Compression failed', err);
      if (type === 'bc') setBcFile(file);
      else setBpjsFile(file);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'bc' | 'bpjs') => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = '';
    await ingestDocumentFile(file, type);
  };

  const handleDragPrevent = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const bcDropHandlers = {
    onDragEnter: (e: React.DragEvent) => {
      handleDragPrevent(e);
      bcDragDepth.current += 1;
      if (e.dataTransfer.types?.includes('Files')) setDragOverBc(true);
    },
    onDragLeave: (e: React.DragEvent) => {
      handleDragPrevent(e);
      bcDragDepth.current = Math.max(0, bcDragDepth.current - 1);
      if (bcDragDepth.current === 0) setDragOverBc(false);
    },
    onDragOver: (e: React.DragEvent) => {
      handleDragPrevent(e);
      e.dataTransfer.dropEffect = 'copy';
    },
    onDrop: async (e: React.DragEvent) => {
      handleDragPrevent(e);
      bcDragDepth.current = 0;
      setDragOverBc(false);
      await ingestDocumentFile(e.dataTransfer.files?.[0], 'bc');
    },
  };

  const bpjsDropHandlers = {
    onDragEnter: (e: React.DragEvent) => {
      handleDragPrevent(e);
      bpjsDragDepth.current += 1;
      if (e.dataTransfer.types?.includes('Files')) setDragOverBpjs(true);
    },
    onDragLeave: (e: React.DragEvent) => {
      handleDragPrevent(e);
      bpjsDragDepth.current = Math.max(0, bpjsDragDepth.current - 1);
      if (bpjsDragDepth.current === 0) setDragOverBpjs(false);
    },
    onDragOver: (e: React.DragEvent) => {
      handleDragPrevent(e);
      e.dataTransfer.dropEffect = 'copy';
    },
    onDrop: async (e: React.DragEvent) => {
      handleDragPrevent(e);
      bpjsDragDepth.current = 0;
      setDragOverBpjs(false);
      await ingestDocumentFile(e.dataTransfer.files?.[0], 'bpjs');
    },
  };

  const openPreview = (type: 'bc' | 'bpjs') => {
    let url = '';
    let isPdf = false;

    if (type === 'bc') {
      if (bcFile) {
        url = URL.createObjectURL(bcFile);
        isPdf = bcFile.type === 'application/pdf';
      } else if (currentBcUrl) {
        url = getAssetUrl(currentBcUrl);
        isPdf = currentBcUrl.toLowerCase().endsWith('.pdf');
      }
    } else {
      if (bpjsFile) {
        url = URL.createObjectURL(bpjsFile);
        isPdf = bpjsFile.type === 'application/pdf';
      } else if (currentBpjsUrl) {
        url = getAssetUrl(currentBpjsUrl);
        isPdf = currentBpjsUrl.toLowerCase().endsWith('.pdf');
      }
    }

    if (url) setPreview({ url, isPdf });
  };

  const isAnyChange = !!bcFile || !!bpjsFile;

  return (
    <div className={styles.container}>
      <CustomToast 
        isVisible={toast.show} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ ...toast, show: false })} 
      />

      <AnimatePresence>
        {preview && (
          <motion.div 
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreview(null)}
          >
            <motion.div 
              className={styles.previewContent}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className={styles.closeBtn} onClick={() => setPreview(null)}>
                <X size={24} />
              </button>
              <div className={styles.previewImageWrapper}>
                {preview.isPdf ? (
                   <div className={styles.pdfWrapper}>
                     <iframe 
                       src={`${preview.url}#toolbar=0&navpanes=0`} 
                       className={styles.previewIframe} 
                       title="PDF Preview"
                     />
                     <div className={styles.pdfFallback}>
                       <p>PDF tidak muncul? <a href={preview.url} target="_blank" rel="noreferrer">Buka di Tab Baru</a></p>
                     </div>
                   </div>
                ) : (
                  <img src={preview.url} alt="Preview" className={styles.previewImage} />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <header className={styles.header}>
        <button 
          onClick={() => {
            if (isSaving) {
              if (confirm('Data sedang disimpan, yakin ingin kembali?')) {
                router.push('/profile');
              }
            } else {
              router.push('/profile');
            }
          }} 
          className={styles.backBtn}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.title} style={{ marginRight: isSaving || lastSaved || isAnyChange ? '0' : '40px' }}>DOKUMEN</h1>
        
        <div style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: '500' }}>
          {isCompressing ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b' }}>
               <Loader2 size={12} className={styles.spinner} /> Kompresi...
            </div>
          ) : bpjsFile && bpjsFile.type.startsWith('image/') && bpjsOcrPhase === 'scanning' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#a78bfa' }}>
               <Loader2 size={12} className={styles.spinner} /> Memindai kartu BPJS…
            </div>
          ) : isSaving ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#3b82f6' }}>
               <Loader2 size={12} className={styles.spinner} /> Menyimpan...
            </div>
          ) : lastSaved ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981' }}>
               <CheckCircle2 size={12} /> Tersimpan
            </div>
          ) : isAnyChange ? (
            <div style={{ color: '#f59e0b' }}>Menunggu...</div>
          ) : null}
        </div>
      </header>

      <main className={styles.content}>
        <div className={styles.infoCard}>
          <Info className={styles.infoIcon} size={20} />
          <div className={styles.infoText}>
            <h3>Verifikasi Identitas</h3>
            <p>Dokumen dikompresi otomatis ke &lt; 250KB untuk menghemat kuota dan mempercepat proses.</p>
          </div>
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Dokumen Wajib</h2>
          
          {/* Akte Kelahiran / KK */}
          <div className={styles.docCard}>
            <div className={styles.docHeader}>
              <div className={styles.docIconWrapper}>
                <FileText size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h4>Akte Kelahiran / KK</h4>
                {(currentBcUrl || bcFile) ? (
                  <span className={`${styles.statusBadge} ${styles.statusComplete}`}>
                    {bcFile ? 'Menyimpan...' : 'Terunggah'}
                  </span>
                ) : (
                  <span className={`${styles.statusBadge} ${styles.statusPending}`}>
                    Belum Ada
                  </span>
                )}
              </div>
              {(currentBcUrl || bcFile) && (
                <button className={styles.viewBtn} onClick={() => openPreview('bc')}>
                  <Eye size={18} />
                </button>
              )}
            </div>

            <div 
              className={`${styles.uploadZone} ${(currentBcUrl || bcFile) ? styles.hasPreview : ''} ${dragOverBc ? styles.uploadZoneDrag : ''}`}
              onClick={() => bcInputRef.current?.click()}
              {...bcDropHandlers}
            >
              {(bcFile || currentBcUrl) ? (
                <div className={styles.inlinePreview}>
                  {((bcFile && bcFile.type === 'application/pdf') || (!bcFile && currentBcUrl.toLowerCase().endsWith('.pdf'))) ? (
                    <div className={styles.pdfThumbnailWrapper}>
                      <iframe 
                        src={`${bcFile ? URL.createObjectURL(bcFile) : getAssetUrl(currentBcUrl)}#toolbar=0&navpanes=0&scrollbar=0`} 
                        className={styles.thumbnailIframe}
                      />
                      <div className={styles.pdfOverlay}>
                        <FileSearch size={24} />
                        <p>Preview PDF</p>
                      </div>
                    </div>
                  ) : (
                    <img 
                      src={bcFile ? URL.createObjectURL(bcFile) : getAssetUrl(currentBcUrl)} 
                      alt="Preview" 
                      className={styles.thumbnail}
                    />
                  )}
                  <div className={styles.overlay}>
                    <Upload size={24} />
                    <p>Ganti Dokumen</p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload size={24} color="var(--primary-gold)" />
                  <p>Ketuk atau letakkan file di sini</p>
                  <span className={styles.dropHint}>Gambar atau PDF · maks. diproses seperti unggahan biasa</span>
                </>
              )}
              <input 
                type="file" 
                ref={bcInputRef}
                className={styles.fileInput}
                accept="image/*,.pdf" 
                onChange={(e) => handleFileChange(e, 'bc')}
              />
            </div>
          </div>

          {/* BPJS / Asuransi */}
          <div className={styles.docCard}>
            <div className={styles.docHeader}>
              <div className={styles.docIconWrapper}>
                <ShieldCheck size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h4>BPJS / Asuransi</h4>
                {bpjsFile && bpjsFile.type.startsWith('image/') && bpjsOcrPhase === 'scanning' ? (
                  <span className={`${styles.statusBadge} ${styles.statusScanning}`}>
                    Memindai kartu…
                  </span>
                ) : (currentBpjsUrl || bpjsFile) ? (
                  <span className={`${styles.statusBadge} ${styles.statusComplete}`}>
                    {bpjsFile ? 'Menyimpan...' : 'Terunggah'}
                  </span>
                ) : (
                  <span className={`${styles.statusBadge} ${styles.statusPending}`}>
                    Belum Ada
                  </span>
                )}
              </div>
              {(currentBpjsUrl || bpjsFile) && (
                <button className={styles.viewBtn} onClick={() => openPreview('bpjs')}>
                  <Eye size={18} />
                </button>
              )}
            </div>

            <div 
              className={`${styles.uploadZone} ${(currentBpjsUrl || bpjsFile) ? styles.hasPreview : ''} ${dragOverBpjs ? styles.uploadZoneDrag : ''}`}
              onClick={() => bpjsInputRef.current?.click()}
              {...bpjsDropHandlers}
            >
              {(bpjsFile || currentBpjsUrl) ? (
                <div className={styles.inlinePreview}>
                  {((bpjsFile && bpjsFile.type === 'application/pdf') || (!bpjsFile && currentBpjsUrl.toLowerCase().endsWith('.pdf'))) ? (
                    <div className={styles.pdfThumbnailWrapper}>
                      <iframe 
                        src={`${bpjsFile ? URL.createObjectURL(bpjsFile) : getAssetUrl(currentBpjsUrl)}#toolbar=0&navpanes=0&scrollbar=0`} 
                        className={styles.thumbnailIframe}
                      />
                      <div className={styles.pdfOverlay}>
                        <FileSearch size={24} />
                        <p>Preview PDF</p>
                      </div>
                    </div>
                  ) : (
                    <img 
                      src={bpjsFile ? URL.createObjectURL(bpjsFile) : getAssetUrl(currentBpjsUrl)} 
                      alt="Preview" 
                      className={styles.thumbnail}
                    />
                  )}
                  <div className={styles.overlay}>
                    <Upload size={24} />
                    <p>Ganti Dokumen</p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload size={24} color="var(--primary-gold)" />
                  <p>Ketuk atau letakkan file di sini</p>
                  <span className={styles.dropHint}>Gambar atau PDF · foto kartu direkomendasikan untuk pemindaian OCR</span>
                </>
              )}
              <input 
                type="file" 
                ref={bpjsInputRef}
                className={styles.fileInput}
                accept="image/*,.pdf" 
                onChange={(e) => handleFileChange(e, 'bpjs')}
              />
            </div>

            {bpjsFile && bpjsOcrPhase === 'done' && bpjsOcrExtract && (
              <div className={styles.bpjsReadout}>
                <strong>Data terbaca dari kartu</strong>
                <dl>
                  {bpjsOcrExtract.cardNumber && (
                    <>
                      <dt>Nomor Kartu</dt>
                      <dd>{bpjsOcrExtract.cardNumber}</dd>
                    </>
                  )}
                  {bpjsOcrExtract.fullName && (
                    <>
                      <dt>Nama</dt>
                      <dd>{bpjsOcrExtract.fullName}</dd>
                    </>
                  )}
                  {bpjsOcrExtract.address && (
                    <>
                      <dt>Alamat</dt>
                      <dd>{bpjsOcrExtract.address}</dd>
                    </>
                  )}
                  {(bpjsOcrExtract.birthDateRaw || bpjsOcrExtract.birthDateIso) && (
                    <>
                      <dt>Tanggal lahir</dt>
                      <dd>{bpjsOcrExtract.birthDateRaw || bpjsOcrExtract.birthDateIso}</dd>
                    </>
                  )}
                  {bpjsOcrExtract.nik && (
                    <>
                      <dt>NIK</dt>
                      <dd>{bpjsOcrExtract.nik}</dd>
                    </>
                  )}
                </dl>
                <p className={styles.bpjsOcrHint}>
                  Data ini disimpan bersama unggahan dan dibandingkan dengan profil Anda.
                </p>
              </div>
            )}
            {bpjsFile && bpjsFile.type.startsWith('image/') && bpjsOcrPhase === 'failed' && (
              <p className={styles.bpjsOcrHint}>
                Pemindaian tidak lengkap — dokumen tetap akan diunggah. Anda dapat memotret ulang dengan pencahayaan lebih terang.
              </p>
            )}
          </div>
        </section>

        <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '20px' }}>
          * Dokumen akan disimpan secara otomatis dalam latar belakang.
        </p>
      </main>
    </div>
  );
}
