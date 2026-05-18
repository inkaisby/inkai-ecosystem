"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { ArrowLeft, Wallet, Loader2, Check, Clock, ShieldAlert, Trash2, ChevronRight, Landmark, QrCode, Banknote, Upload, Copy, X, Download, Search } from "lucide-react";
import styles from "./Billing.module.css";
import BottomNav from "@/components/BottomNav/BottomNav";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api, { billingApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import CustomToast from "@/components/CustomToast/CustomToast";
import ConfirmationModal from "@/components/ConfirmationModal/ConfirmationModal";
import { compressImage } from "@/lib/imageUtils";

export default function Billing() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [billings, setBillings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('VA');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ show: false, id: '', title: '', message: '' });

  // States untuk Filter & Riwayat
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState("ALL");
  const [selectedMonth, setSelectedMonth] = useState("ALL");
  const [activeTab, setActiveTab] = useState("ALL");

  // Logika Filter Iuran & Tagihan Real-Time
  const filteredBillings = useMemo(() => {
    return billings.filter((bill) => {
      // 1. Pencarian Kata Kunci
      const desc = (bill.description || "").toLowerCase();
      const typeLabel = bill.type === 'MONTHLY_IURAN' ? 'iuran bulanan' : 'biaya event';
      const query = searchQuery.toLowerCase();
      if (query && !desc.includes(query) && !typeLabel.includes(query)) return false;

      // 2. Filter Status Tab
      if (activeTab === "PAID" && bill.status !== "PAID") return false;
      if (activeTab === "PENDING" && bill.status !== "WAITING_VERIFICATION") return false;
      if (activeTab === "UNPAID" && bill.status !== "UNPAID" && bill.status !== "REJECTED") return false;

      // 3. Filter Tahun & Bulan berdasarkan dueDate
      if (bill.dueDate) {
        const billDate = new Date(bill.dueDate);
        if (selectedYear !== "ALL" && billDate.getFullYear().toString() !== selectedYear) return false;
        if (selectedMonth !== "ALL" && (billDate.getMonth() + 1).toString() !== selectedMonth) return false;
      }

      return true;
    });
  }, [billings, searchQuery, activeTab, selectedYear, selectedMonth]);

  useEffect(() => {
    setMounted(true);
    fetchBillings();
  }, []);

  const fetchBillings = async () => {
    try {
      const response = await billingApi.getMyBillings();
      if (response.data.status === 'success') {
        setBillings(response.data.data);
      }
    } catch (error) {
      console.error("Fetch billings error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    const pendingBillings = billings.filter(b => b.status === 'PENDING');
    if (pendingBillings.length === 0) return;

    if (selectedMethod === 'TRANSFER' && !proofFile) {
      setToast({ show: true, message: 'Unggah bukti transfer (screenshot atau PDF) terlebih dahulu.', type: 'error' });
      return;
    }

    setIsProcessing(true);
    try {
      let proofUrl: string | undefined;
      if (selectedMethod === 'TRANSFER' && proofFile) {
        let file = proofFile;
        if (file.type.startsWith('image/')) {
          try {
            file = await compressImage(file, 900);
          } catch {
            /* gunakan asal */
          }
        }
        const fd = new FormData();
        fd.append('file', file);
        const uploadRes = await api.auth.uploadFile(fd);
        const url =
          uploadRes &&
          typeof uploadRes === 'object' &&
          'fileUrl' in uploadRes &&
          typeof (uploadRes as { fileUrl: unknown }).fileUrl === 'string'
            ? (uploadRes as { fileUrl: string }).fileUrl
            : '';
        if (!url) throw new Error('Upload gagal: URL tidak diterima.');
        proofUrl = url;
      }

      for (const billing of pendingBillings) {
        await billingApi.processPayment({
          billingId: billing.id,
          paymentMethod: selectedMethod,
          ...(proofUrl ? { proofUrl } : {}),
        });
      }
      
      const message =
        selectedMethod === 'CASH'
          ? 'Permintaan terkirim. Silakan bayar ke Bendahara Dojo.'
          : selectedMethod === 'TRANSFER'
            ? 'Bukti pembayaran terkirim. Menunggu verifikasi bendahara.'
            : selectedMethod === 'QRIS'
              ? 'Pengajuan QRIS terkirim. Bayar tepat nominal di e-wallet, lalu tunggu verifikasi bendahara.'
              : 'Pembayaran Berhasil!';
      setToast({ show: true, message, type: 'success' });
      setShowPaymentModal(false);
      setProofFile(null);
      fetchBillings();
    } catch (error: unknown) {
      const ax = error as { response?: { data?: { message?: string } }; message?: string };
      setToast({ show: true, message: "Gagal memproses pembayaran: " + (ax.response?.data?.message || ax.message || 'Error'), type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (file: File | null) => {
    if (proofPreview) URL.revokeObjectURL(proofPreview);
    setProofFile(file);
    if (file && file.type.startsWith("image/")) {
      setProofPreview(URL.createObjectURL(file));
    } else {
      setProofPreview(null);
    }
  };

  const handleCopy = (text: string, key: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const confirmDelete = (id: string) => {
    setConfirmModal({
      show: true,
      id,
      title: "Batalkan Tagihan?",
      message: "Ini juga akan membatalkan pendaftaran event terkait. Lanjutkan?"
    });
  };

  const handleDelete = async () => {
    const id = confirmModal.id;
    setConfirmModal({ ...confirmModal, show: false });
    
    try {
      await billingApi.deleteBilling(id);
      setToast({ show: true, message: 'Tagihan berhasil dibatalkan', type: 'success' });
      fetchBillings();
    } catch (error: any) {
      setToast({ show: true, message: "Gagal menghapus tagihan: " + (error.response?.data?.message || error.message), type: 'error' });
    }
  };

  if (!mounted || isAuthLoading || isLoading || !user) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={40} />
      </div>
    );
  }

  const totalUnpaid = billings
    .filter(b => b.status === 'PENDING')
    .reduce((sum, b) => sum + Number(b.amount), 0);

  const pendingHasUniqueTail = billings.some(
    (b) => b.status === 'PENDING' && typeof b.uniqueTail === 'number',
  );

  const hasWaiting = billings.some(b => b.status === 'WAITING_VERIFICATION');

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.backBtn}>
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.title}>Pembayaran</h1>
      </header>

      <div className={styles.summaryCard}>
        <p className={styles.summaryLabel}>Total Belum Dibayar</p>
        <h2 className={styles.totalAmount}>
          Rp {new Intl.NumberFormat('id-ID').format(totalUnpaid)}
        </h2>
        <button 
          className={`${styles.payBtn} ${hasWaiting ? styles.waiting : ''}`}
          disabled={(totalUnpaid === 0 && !hasWaiting) || isProcessing}
          onClick={() => setShowPaymentModal(true)}
        >
          {hasWaiting ? "UPDATE BUKTI BAYAR" : "BAYAR SEKARANG"}
        </button>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Riwayat Tagihan</h2>

        {/* Filter & History Controls Premium */}
        <div className={styles.filterContainer}>
          <div className={styles.searchBox}>
            <Search className={styles.searchIcon} size={16} />
            <input
              type="text"
              placeholder="Cari bulan, deskripsi atau jenis tagihan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.dropdownsGroup}>
            <div className={styles.dropdownSelectWrapper}>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className={styles.dropdownSelect}
              >
                <option value="ALL">Semua Tahun</option>
                <option value="2026">Tahun 2026</option>
                <option value="2025">Tahun 2025</option>
                <option value="2024">Tahun 2024</option>
              </select>
            </div>

            <div className={styles.dropdownSelectWrapper}>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className={styles.dropdownSelect}
              >
                <option value="ALL">Semua Bulan</option>
                <option value="1">Januari</option>
                <option value="2">Februari</option>
                <option value="3">Maret</option>
                <option value="4">April</option>
                <option value="5">Mei</option>
                <option value="6">Juni</option>
                <option value="7">Juli</option>
                <option value="8">Agustus</option>
                <option value="9">September</option>
                <option value="10">Oktober</option>
                <option value="11">November</option>
                <option value="12">Desember</option>
              </select>
            </div>
          </div>

          <div className={styles.tabsScroll}>
            {[
              { id: "ALL", label: "Semua" },
              { id: "PAID", label: "Lunas" },
              { id: "PENDING", label: "Tinjau" },
              { id: "UNPAID", label: "Belum Bayar" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${styles.tabItem} ${activeTab === tab.id ? styles.tabActive : ""}`}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.list}>
          {filteredBillings.length > 0 ? (
            filteredBillings.map((bill) => {
              const isPaid = bill.status === 'PAID';
              const isWaiting = bill.status === 'WAITING_VERIFICATION';
              return (
                <div key={bill.id} className={styles.billItem}>
                  <div className={`${styles.statusIcon} ${isPaid ? styles.paid : isWaiting ? styles.waitingIcon : styles.pending}`}>
                    {isPaid ? <Check size={16} /> : isWaiting ? <ShieldAlert size={16} /> : <Clock size={16} />}
                  </div>
                  <div className={styles.billInfo}>
                    <h3 className={styles.billTitle}>{bill.description || (bill.type === 'MONTHLY_IURAN' ? 'Iuran Bulanan' : 'Biaya Event')}</h3>
                    <p className={`${styles.billMeta} ${isPaid ? styles.metaPaid : isWaiting ? styles.metaWaiting : ''}`}>
                      {isPaid ? `Lunas pada: ${new Date(bill.updatedAt).toLocaleDateString('id-ID')}` : 
                       isWaiting ? "Menunggu Verifikasi" : `Jatuh tempo: ${new Date(bill.dueDate).toLocaleDateString('id-ID')}`}
                    </p>
                    {!isPaid && !isWaiting && bill.type === 'EVENT_FEE' && typeof bill.uniqueTail === 'number' ? (
                      <p className={styles.billMeta}>
                        Kode unik +{bill.uniqueTail} · bayar tepat sesuai nominal
                      </p>
                    ) : null}
                  </div>
                  <div className={styles.billRight}>
                    <p className={`${styles.amount} ${isPaid ? styles.amountPaid : ''}`}>
                      Rp {new Intl.NumberFormat('id-ID').format(bill.amount)}
                    </p>
                    {!isPaid && !isWaiting && (
                      <button className={styles.deleteBtn} onClick={() => confirmDelete(bill.id)}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className={styles.emptyState}>Tidak ada tagihan yang cocok dengan filter.</div>
          )}
        </div>
      </section>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={styles.modalOverlay}
                onClick={() => {
                  setShowPaymentModal(false);
                  handleFileChange(null);
                }}
              />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={styles.modal}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className={styles.modalTitle}>Konfirmasi Pembayaran</h3>
              <div className={styles.modalSummary}>
                <span>Total Tagihan</span>
                <span className={styles.modalAmount}>Rp {new Intl.NumberFormat('id-ID').format(totalUnpaid)}</span>
              </div>
              {pendingHasUniqueTail ? (
                <p className={styles.uniqueFeeNote}>
                  Nominal di atas sudah termasuk kode unik per tagihan event — bayar <strong>tepat</strong> total tersebut (scan QR hanya membuka aplikasi; masukkan nominal manual bila diminta).
                </p>
              ) : null}
              
              <p className={styles.methodLabel}>Pilih Metode Pembayaran:</p>
              <div className={styles.methods}>
                {[
                  { id: 'VA', label: 'Virtual Account (Dojo)', icon: <Landmark size={20} /> },
                  { id: 'QRIS', label: 'QRIS / E-Wallet', icon: <QrCode size={20} /> },
                  { id: 'TRANSFER', label: 'Transfer bank / e-wallet (upload bukti)', icon: <Upload size={20} /> },
                  { id: 'CASH', label: 'Tunai ke Bendahara Dojo', icon: <Banknote size={20} /> },
                ].map(method => (
                  <div 
                    key={method.id} 
                    className={`${styles.methodItem} ${selectedMethod === method.id ? styles.methodSelected : ''}`}
                    onClick={() => {
                      setSelectedMethod(method.id);
                      if (method.id !== 'TRANSFER') handleFileChange(null);
                    }}
                  >
                    <div className={styles.methodIcon}>{method.icon}</div>
                    <span className={styles.methodText}>{method.label}</span>
                    {selectedMethod === method.id && <Check size={14} className={styles.checkIcon} />}
                  </div>
                ))}
              </div>

              {selectedMethod === 'VA' && (
                <div className={styles.vaPanel}>
                  <div className={styles.vaInfoBox}>
                    <div className={styles.vaIconWrapper}>
                      <Landmark size={32} />
                    </div>
                    <h4 className={styles.vaTitle}>Virtual Account Dojo</h4>
                    <p className={styles.vaDescription}>
                      Fitur Virtual Account otomatis akan tersedia setelah integrasi Payment Gateway selesai.
                    </p>
                    <div className={styles.vaNote}>
                      <p>Untuk saat ini, silakan gunakan metode <strong>Transfer</strong> atau <strong>QRIS</strong> untuk konfirmasi instan, atau pilih <strong>Tunai</strong> untuk lapor ke Bendahara Dojo.</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedMethod === 'QRIS' && (
                <div className={styles.qrisPanel}>
                  <p className={styles.qrisExactAmount}>
                    Bayar tepat: Rp {new Intl.NumberFormat('id-ID').format(totalUnpaid)}
                  </p>
                  <Image
                    src="/payments/qris-static.png"
                    alt="QRIS INKAI STORES — satukan pembayaran"
                    width={320}
                    height={320}
                    className={styles.qrisImage}
                    priority
                    sizes="(max-width: 500px) 90vw, 280px"
                  />
                  <div className={styles.qrisActions}>
                    <a 
                      href="/payments/qris-static.png" 
                      download="QRIS-INKAI.png" 
                      className={styles.downloadBtn}
                    >
                      <Download size={16} />
                      <span>Simpan QRIS</span>
                    </a>
                  </div>
                  <p className={styles.qrisSteps}>
                    Buka aplikasi e-wallet atau mobile banking berlogo QRIS, pindai kode ini, lalu masukkan nominal persis sama dengan yang tertera (QR statis tidak menyematkan jumlah otomatis).
                  </p>
                </div>
              )}

              {selectedMethod === 'TRANSFER' && (
                <div className={styles.transferPanel}>
                  <div className={styles.bankCard}>
                    <p className={styles.bankLabel}>Transfer ke Rekening Bendahara:</p>
                    <div className={styles.bankInfo}>
                      <div className={styles.bankMain}>
                        <div className={styles.bankHeader}>
                          <span className={styles.bankName}>Mandiri</span>
                        </div>
                        <div className={styles.accountNumberGroup}>
                          <span className={styles.accountNumber}>1400024546344</span>
                          <button 
                            className={styles.copyBtn} 
                            onClick={() => handleCopy("1400024546344", "account")}
                            type="button"
                          >
                            {copiedKey === "account" ? <Check size={14} className={styles.copyIconCheck} /> : <Copy size={14} />}
                          </button>
                        </div>
                        <span className={styles.accountName}>a/n Habibur Rahman</span>
                      </div>
                    </div>
                  </div>

                  <div 
                    className={`${styles.proofUpload} ${isDragging ? styles.proofUploadActive : ""}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const f = e.dataTransfer.files?.[0];
                      if (f) handleFileChange(f);
                    }}
                  >
                    <label className={styles.proofLabel}>Bukti pembayaran (wajib)</label>
                    
                    {!proofFile ? (
                      <div className={styles.dropZone} onClick={() => document.getElementById("billing-proof-file")?.click()}>
                        <Upload size={24} className={styles.dropIcon} />
                        <p className={styles.dropText}>Pilih file atau tarik ke sini</p>
                        <p className={styles.dropSubtext}>PNG, JPG atau PDF (Maks. 5MB)</p>
                      </div>
                    ) : (
                      <div className={styles.previewCard}>
                        {proofPreview ? (
                          <div className={styles.previewImageWrapper}>
                            <img src={proofPreview} alt="Preview" className={styles.previewImage} />
                          </div>
                        ) : (
                          <div className={styles.fileIconWrapper}>
                            <Upload size={24} />
                            <span className={styles.fileName}>{proofFile.name}</span>
                          </div>
                        )}
                        <button 
                          className={styles.removeProofBtn} 
                          onClick={() => handleFileChange(null)}
                          type="button"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}

                    <input
                      id="billing-proof-file"
                      type="file"
                      className={styles.proofInput}
                      accept="image/*,.pdf,application/pdf"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        handleFileChange(f ?? null);
                      }}
                    />
                  </div>
                </div>
              )}

              <button 
                className={styles.confirmBtn}
                disabled={isProcessing}
                onClick={() => void handlePayment()}
              >
                {isProcessing ? <Loader2 className={styles.spinner} size={20} /> : "LANJUTKAN PEMBAYARAN"}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div style={{ height: '100px' }} />
      <BottomNav />

      <CustomToast 
        isVisible={toast.show} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ ...toast, show: false })} 
      />

      <ConfirmationModal 
        isVisible={confirmModal.show}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={handleDelete}
        onCancel={() => setConfirmModal({ ...confirmModal, show: false })}
        isDangerous={true}
        confirmLabel="HAPUS"
      />
    </div>
  );
}
