"use client";

import { useEffect, useState, useRef } from "react";
import { ArrowLeft, Loader2, CheckCircle, Upload, ShieldCheck, FileText, AlertCircle, Info, CheckCircle2, Eye, X, FileSearch } from "lucide-react";
import styles from "./Documents.module.css";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import CustomToast from "@/components/CustomToast/CustomToast";
import api, { getAssetUrl } from "@/lib/api";
import { compressImage } from "@/lib/imageUtils";

export default function Documents() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading, fetchProfile } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  
  const [bcFile, setBcFile] = useState<File | null>(null);
  const [bpjsFile, setBpjsFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  
  const [preview, setPreview] = useState<{ url: string, isPdf: boolean } | null>(null);
  
  const bcInputRef = useRef<HTMLInputElement>(null);
  const bpjsInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Current document URLs from user object
  const currentBcUrl = user?.birthCertificateUrl || user?.member?.birthCertificateUrl || '';
  const currentBpjsUrl = user?.bpjsCardUrl || user?.member?.bpjsCardUrl || '';

  // Silent Autosave Logic
  useEffect(() => {
    if (!mounted || isSaving || isCompressing || (!bcFile && !bpjsFile)) return;

    const timer = setTimeout(async () => {
      setIsSaving(true);
      try {
        if (bcFile) {
          const bcData = new FormData();
          bcData.append('document', bcFile);
          bcData.append('fieldName', 'akte_lahir');
          await api.members.uploadDocument(bcData);
          setBcFile(null);
        }

        if (bpjsFile) {
          const bpjsData = new FormData();
          bpjsData.append('document', bpjsFile);
          bpjsData.append('fieldName', 'bpjs');
          await api.members.uploadDocument(bpjsData);
          setBpjsFile(null);
        }

        await fetchProfile();
        setLastSaved(new Date());
      } catch (error) {
        console.error('Autosave failed:', error);
      } finally {
        setIsSaving(false);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [bcFile, bpjsFile, mounted, isCompressing]);

  if (!mounted || isAuthLoading || !user) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={40} />
      </div>
    );
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'bc' | 'bpjs') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
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
    }
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
              className={`${styles.uploadZone} ${(currentBcUrl || bcFile) ? styles.hasPreview : ''}`}
              onClick={() => bcInputRef.current?.click()}
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
                  <p>Ketuk untuk memilih file</p>
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
                {(currentBpjsUrl || bpjsFile) ? (
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
              className={`${styles.uploadZone} ${(currentBpjsUrl || bpjsFile) ? styles.hasPreview : ''}`}
              onClick={() => bpjsInputRef.current?.click()}
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
                  <p>Ketuk untuk memilih file</p>
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
          </div>
        </section>

        <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '20px' }}>
          * Dokumen akan disimpan secara otomatis dalam latar belakang.
        </p>
      </main>
    </div>
  );
}
